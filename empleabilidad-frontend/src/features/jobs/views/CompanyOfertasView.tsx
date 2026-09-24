import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Briefcase, MapPin, Users, Edit, Trash2, Eye, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { jobService } from '../services/job.service';
import type { OfertaResponse } from '../types/job.types';
import type { PageResponse } from '@/shared/types';
import { Button } from '@/shared/components/Button';
import { CreateJobModal } from '../components/CreateJobModal';
import { EditJobModal } from '../components/EditJobModal';
import { ViewJobModal } from '../components/ViewJobModal';
import { alerts } from '@/shared/utils/alerts';

export const CompanyOfertasView: React.FC = () => {
  const { user } = useAuthStore();
  const [jobsData, setJobsData] = useState<PageResponse<OfertaResponse> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingJob, setViewingJob] = useState<OfertaResponse | null>(null);
  const [editingJob, setEditingJob] = useState<OfertaResponse | null>(null);
  const [closingJob, setClosingJob] = useState<OfertaResponse | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  const fetchMyJobs = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      // 1. Obtener ofertas y postulaciones en paralelo
      const [jobsRes, appsRes] = await Promise.allSettled([
        jobService.getCompanyJobs(user.id, { size: 50 }),
        jobService.getCompanyApplications({ empresaId: user.id, size: 100 }),
      ]);

      const jobsDataResult = jobsRes.status === 'fulfilled' ? jobsRes.value : null;
      let allApps = appsRes.status === 'fulfilled' ? (appsRes.value.content || []) : [];

      // Si hay más de 1 página de postulaciones, recuperar páginas adicionales
      if (appsRes.status === 'fulfilled' && appsRes.value.totalPages > 1) {
        const remainingPages = [];
        for (let p = 1; p < appsRes.value.totalPages; p++) {
          remainingPages.push(
            jobService.getCompanyApplications({ empresaId: user.id, page: p, size: 100 })
              .then(res => res.content || [])
              .catch(() => [])
          );
        }
        const extraApps = await Promise.all(remainingPages);
        allApps = allApps.concat(extraApps.flat());
      }

      if (jobsDataResult) {
        // Conteo de postulantes reales por id de oferta
        const countsByJob: Record<string, number> = {};
        allApps.forEach((app) => {
          if (app.ofertaId) {
            countsByJob[app.ofertaId] = (countsByJob[app.ofertaId] || 0) + 1;
          }
        });

        // Asignar el número real de postulantes a cada oferta
        const updatedContent = jobsDataResult.content.map((job) => ({
          ...job,
          numeroPostulaciones: countsByJob[job.id] ?? 0,
        }));

        setJobsData({
          ...jobsDataResult,
          content: updatedContent,
        });
      }
    } catch (error) {
      console.error('Error fetching company jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyJobs();
  }, [user?.id]);

  const handleCloseJob = async () => {
    if (!closingJob) return;
    
    const res = await alerts.confirm('¿Cerrar oferta?', 'Esta acción es irreversible y los candidatos ya no podrán postular.');
    if (!res.isConfirmed) {
      setClosingJob(null);
      return;
    }
    
    setIsClosing(true);
    try {
      await jobService.closeJob(closingJob.id);
      alerts.success('Oferta cerrada', `La oferta "${closingJob.titulo}" ha sido cerrada definitivamente.`);
      setClosingJob(null);
      fetchMyJobs();
    } catch (err: any) {
      console.error('Error al cerrar oferta:', err);
      alerts.error('Error', err.response?.data?.message || 'Error al cerrar la oferta');
    } finally {
      setIsClosing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Panel de Ofertas</h1>
          <p className="text-slate-500 text-sm mt-1">Gestiona tus vacantes y revisa las postulaciones.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2 shadow-md shadow-blue-600/20">
          <Plus className="h-4 w-4" />
          Nueva Oferta
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="h-8 w-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
        </div>
      ) : jobsData?.content.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 border-dashed p-12 text-center">
          <div className="h-16 w-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Briefcase className="h-8 w-8 text-blue-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Aún no tienes ofertas publicadas</h3>
          <p className="text-slate-500 max-w-md mx-auto mb-6">Crea tu primera oferta de trabajo para empezar a recibir postulantes de la red de EmpleaPro.</p>
          <Button onClick={() => setIsModalOpen(true)}>Crear mi primera oferta</Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                <tr>
                  <th className="px-6 py-4">Cargo / Posición</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">Modalidad</th>
                  <th className="px-6 py-4">Postulantes</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jobsData?.content.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{job.titulo}</p>
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                        <MapPin className="h-3 w-3" />
                        {job.ubicacion || job.pais || 'Por definir'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        job.estado === 'PUBLICADA'             ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                        job.estado === 'PENDIENTE_APROBACION'  ? 'bg-amber-100 text-amber-800 border border-amber-200'   :
                        job.estado === 'RECHAZADA'             ? 'bg-red-100 text-red-800 border border-red-200'        :
                        job.estado === 'CERRADA'               ? 'bg-slate-100 text-slate-600 border border-slate-200'    :
                        'bg-slate-100 text-slate-800 border border-slate-200'
                      }`}>
                        {job.estado.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium">{job.modalidad?.replace('_', ' ')}</td>
                    <td className="px-6 py-4">
                      <Link
                        to={`/empresa/candidatos?ofertaId=${job.id}`}
                        className="inline-flex items-center gap-1.5 font-medium group transition-colors"
                        title={
                          (job.numeroPostulaciones ?? 0) > 0
                            ? `Ver ${job.numeroPostulaciones} postulante(s) de esta oferta`
                            : 'Ver candidatos de esta oferta'
                        }
                      >
                        <Users className={`h-4 w-4 transition-colors ${
                          (job.numeroPostulaciones ?? 0) > 0 
                            ? 'text-blue-600 group-hover:text-blue-700' 
                            : 'text-slate-400 group-hover:text-slate-600'
                        }`} />
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold transition-all ${
                          (job.numeroPostulaciones ?? 0) > 0 
                            ? 'bg-blue-100 text-blue-800 group-hover:bg-blue-200 group-hover:scale-105' 
                            : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                        }`}>
                          {job.numeroPostulaciones ?? 0}
                        </span>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-right space-x-1.5 whitespace-nowrap">
                      {/* Botón de reenvío si fue rechazada o borrador */}
                      {(job.estado === 'BORRADOR' || job.estado === 'RECHAZADA') && (
                        <button 
                          onClick={async () => {
                            const res = await alerts.confirm(
                              '¿Enviar a revisión?', 
                              'Una vez enviada, el equipo de EmpleaPro la revisará antes de publicarse.'
                            );
                            if (!res.isConfirmed) return;

                            try {
                              await jobService.submitForReview(job.id);
                              alerts.success('Enviada', 'Oferta enviada a revisión. El administrador la revisará pronto.');
                              fetchMyJobs();
                            } catch (e: any) {
                              const msg = e.response?.data?.message || e.response?.data?.error || 'Error al enviar la oferta a revisión';
                              alerts.error('Error', msg);
                            }
                          }}
                          className="px-2.5 py-1 text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors font-medium text-xs border border-amber-200 rounded-lg inline-flex items-center" 
                          title="Enviar a revisión"
                        >
                          {job.estado === 'RECHAZADA' ? 'Reenviar' : 'Enviar a revisión'}
                        </button>
                      )}

                      {/* 1. Ver detalle (Ojito) */}
                      <button 
                        onClick={() => setViewingJob(job)}
                        className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-flex items-center" 
                        title="Ver detalle completo"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      {/* 2. Editar (Lápiz) */}
                      {job.estado !== 'CERRADA' && (
                        <button 
                          onClick={() => setEditingJob(job)}
                          className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors inline-flex items-center" 
                          title="Editar oferta"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      )}

                      {/* 3. Eliminar / Cerrar (Tacho) */}
                      {job.estado !== 'CERRADA' && (
                        <button 
                          onClick={() => setClosingJob(job)}
                          className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-flex items-center" 
                          title="Cerrar oferta"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal 1: Ver Detalle */}
      {viewingJob && (
        <ViewJobModal 
          job={viewingJob} 
          onClose={() => setViewingJob(null)} 
          onEdit={() => {
            const j = viewingJob;
            setViewingJob(null);
            setEditingJob(j);
          }}
        />
      )}

      {/* Modal 2: Editar Oferta */}
      {editingJob && (
        <EditJobModal 
          job={editingJob} 
          onClose={() => setEditingJob(null)} 
          onSuccess={() => {
            setEditingJob(null);
            fetchMyJobs();
          }} 
        />
      )}

      {/* Modal 3: Confirmación Cerrar Oferta */}
      {closingJob && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-slide-up">
            <div className="h-12 w-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 text-center mb-2">
              ¿Cerrar esta oferta?
            </h3>
            <p className="text-sm text-slate-600 text-center mb-6">
              Estás a punto de cerrar definitivamente la vacante <br />
              <strong className="text-slate-800">"{closingJob.titulo}"</strong>.<br />
              Los candidatos ya no podrán postular ni será visible en la bolsa de trabajo.
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setClosingJob(null)}
                disabled={isClosing}
              >
                Cancelar
              </Button>
              <button
                type="button"
                onClick={handleCloseJob}
                disabled={isClosing}
                className="px-4 py-2 bg-red-600 text-white font-medium text-sm rounded-lg hover:bg-red-700 transition-colors shadow disabled:opacity-50"
              >
                {isClosing ? 'Cerrando...' : 'Sí, cerrar oferta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Crear Nueva Oferta */}
      {isModalOpen && (
        <CreateJobModal 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => {
            setIsModalOpen(false);
            fetchMyJobs();
          }} 
        />
      )}
    </div>
  );
};
