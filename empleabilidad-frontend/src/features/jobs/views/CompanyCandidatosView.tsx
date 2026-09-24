import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Users, Search, RefreshCw, FileText, ExternalLink, 
  CheckCircle2, XCircle, Clock, Eye, Briefcase, Mail, 
  MessageSquare, AlertCircle, ArrowUpRight, Download, X, Trash2
} from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { jobService } from '../services/job.service';
import type { PostulacionResponse, EstadoPostulacion, OfertaResponse } from '../types/job.types';
import { Button } from '@/shared/components/Button';
import { alerts } from '@/shared/utils/alerts';

const ESTADO_BADGES: Record<EstadoPostulacion, { label: string; bg: string; text: string; border: string }> = {
  ENVIADA: { label: 'Enviada', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  RECIBIDA: { label: 'Recibida', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  EN_REVISION: { label: 'En Revisión', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  PRESELECCIONADA: { label: 'Preseleccionada', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  ENTREVISTA: { label: 'Entrevista', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  EVALUACION: { label: 'Evaluación', bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  SELECCIONADA: { label: 'Seleccionada', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  RECHAZADA: { label: 'Rechazada', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  RETIRADA: { label: 'Retirada', bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-300' },
  CANCELADA: { label: 'Cancelada', bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-300' },
  CERRADA: { label: 'Cerrada', bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-300' },
};

const NEXT_STATUSES: Record<EstadoPostulacion, EstadoPostulacion[]> = {
  ENVIADA: ['RECIBIDA', 'EN_REVISION', 'PRESELECCIONADA', 'ENTREVISTA', 'RECHAZADA'],
  RECIBIDA: ['EN_REVISION', 'PRESELECCIONADA', 'ENTREVISTA', 'RECHAZADA'],
  EN_REVISION: ['PRESELECCIONADA', 'ENTREVISTA', 'EVALUACION', 'RECHAZADA'],
  PRESELECCIONADA: ['ENTREVISTA', 'EVALUACION', 'SELECCIONADA', 'RECHAZADA'],
  ENTREVISTA: ['EVALUACION', 'SELECCIONADA', 'RECHAZADA'],
  EVALUACION: ['SELECCIONADA', 'RECHAZADA'],
  SELECCIONADA: ['CERRADA'],
  RECHAZADA: ['CERRADA'],
  RETIRADA: ['CERRADA'],
  CANCELADA: ['CERRADA'],
  CERRADA: [],
};

export const CompanyCandidatosView: React.FC = () => {
  const { user } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlOfertaId = searchParams.get('ofertaId');

  const [postulaciones, setPostulaciones] = useState<PostulacionResponse[]>([]);
  const [companyJobs, setCompanyJobs] = useState<OfertaResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEstado, setSelectedEstado] = useState<string>('TODOS');
  const [selectedOfertaId, setSelectedOfertaId] = useState<string>(urlOfertaId || 'TODAS');

  useEffect(() => {
    if (urlOfertaId) {
      setSelectedOfertaId(urlOfertaId);
    }
  }, [urlOfertaId]);

  // Modal Detail & Status Change
  const [selectedPostulacion, setSelectedPostulacion] = useState<PostulacionResponse | null>(null);
  const [statusChangeTarget, setStatusChangeTarget] = useState<{
    postulacion: PostulacionResponse;
    newEstado: EstadoPostulacion;
  } | null>(null);
  const [comentarioCambio, setComentarioCambio] = useState('');
  const [viewingCvPostulacion, setViewingCvPostulacion] = useState<PostulacionResponse | null>(null);
  const [cvBlobUrl, setCvBlobUrl] = useState<string | null>(null);

  const getCvErrorMessage = (err: any) => {
    const status = err?.response?.status;
    if (status === 401) return 'No has iniciado sesión.';
    if (status === 403) return 'No tienes permiso para visualizar este CV.';
    if (status === 404) return 'El CV no fue encontrado.';
    return 'No se pudo cargar el CV.';
  };

  useEffect(() => {
    if (!viewingCvPostulacion) {
      if (cvBlobUrl) {
        window.URL.revokeObjectURL(cvBlobUrl);
        setCvBlobUrl(null);
      }
      return;
    }

    let isMounted = true;
    jobService.downloadCvBlob(viewingCvPostulacion.uuid)
      .then(blob => {
        if (isMounted) {
          const url = window.URL.createObjectURL(blob);
          setCvBlobUrl(url);
        }
      })
      .catch(err => {
        console.error('Error al cargar vista previa del CV:', err);
        alerts.error('Error al cargar CV', getCvErrorMessage(err));
      });

    return () => {
      isMounted = false;
    };
  }, [viewingCvPostulacion]);

  const handleDownloadCv = async (uuid: string, candidatoNombre?: string) => {
    try {
      const blob = await jobService.downloadCvBlob(uuid);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CV_${(candidatoNombre || 'Candidato').replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error al descargar CV:', err);
      alerts.error('Error al descargar CV', getCvErrorMessage(err));
    }
  };

  const handleOpenCvTab = async (uuid: string) => {
    try {
      const blob = await jobService.downloadCvBlob(uuid);
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      console.error('Error al abrir CV:', err);
      alerts.error('Error al abrir CV', getCvErrorMessage(err));
    }
  };

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<PostulacionResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch company jobs to populate filter
      if (user?.id) {
        try {
          const jobsRes = await jobService.getCompanyJobs(user.id, { size: 100 });
          setCompanyJobs(jobsRes.content || []);
        } catch (e) {
          console.warn('Could not load company jobs for filter', e);
        }
      }

      // 2. Fetch applications
      const appsRes = await jobService.getCompanyApplications({
        empresaId: user?.id,
        size: 100,
      });

      setPostulaciones(appsRes.content || []);
    } catch (error: any) {
      console.error('Error fetching applications:', error);
      await alerts.error('Error de carga', 'No se pudieron cargar los candidatos. Recarga la página.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  // Status Change Handler
  const handleConfirmStatusChange = async () => {
    if (!statusChangeTarget) return;
    setIsUpdating(true);
    try {
      const updated = await jobService.updateApplicationStatus(
        statusChangeTarget.postulacion.uuid,
        statusChangeTarget.newEstado,
        comentarioCambio.trim() || undefined
      );

      await alerts.success('Estado actualizado', `Candidato movido a: ${ESTADO_BADGES[statusChangeTarget.newEstado]?.label || statusChangeTarget.newEstado}`);
      
      // Update local state
      setPostulaciones(prev =>
        prev.map(p => (p.uuid === updated.uuid ? { ...p, estado: updated.estado } : p))
      );

      if (selectedPostulacion && selectedPostulacion.uuid === updated.uuid) {
        setSelectedPostulacion(prev => prev ? { ...prev, estado: updated.estado } : null);
      }

      setStatusChangeTarget(null);
      setComentarioCambio('');
    } catch (error: any) {
      console.error('Error updating status:', error);
      const msg = error.response?.data?.message || 'Error al actualizar el estado del candidato.';
      await alerts.error('Error', msg);
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete Handler
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await jobService.deleteApplication(deleteTarget.uuid);
      await alerts.success('Postulación eliminada', `La postulación de ${deleteTarget.candidatoNombre || 'candidato'} fue eliminada correctamente.`);
      
      // Remove from local state
      setPostulaciones(prev => prev.filter(p => p.uuid !== deleteTarget.uuid));

      // Close detail modal if viewing the deleted one
      if (selectedPostulacion?.uuid === deleteTarget.uuid) {
        setSelectedPostulacion(null);
      }

      setDeleteTarget(null);
    } catch (error: any) {
      console.error('Error deleting application:', error);
      const msg = error.response?.data?.message || 'Error al eliminar la postulación.';
      await alerts.error('Error', msg);
    } finally {
      setIsDeleting(false);
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const total = postulaciones.length;
    const enRevision = postulaciones.filter(p => ['ENVIADA', 'RECIBIDA', 'EN_REVISION'].includes(p.estado)).length;
    const enProceso = postulaciones.filter(p => ['PRESELECCIONADA', 'ENTREVISTA', 'EVALUACION'].includes(p.estado)).length;
    const seleccionadas = postulaciones.filter(p => p.estado === 'SELECCIONADA').length;
    const rechazadas = postulaciones.filter(p => p.estado === 'RECHAZADA').length;
    return { total, enRevision, enProceso, seleccionadas, rechazadas };
  }, [postulaciones]);

  // Filtered List
  const filteredPostulaciones = useMemo(() => {
    return postulaciones.filter(p => {
      // Estado Filter
      if (selectedEstado !== 'TODOS' && p.estado !== selectedEstado) {
        return false;
      }
      // Oferta Filter
      if (selectedOfertaId !== 'TODAS' && p.ofertaId !== selectedOfertaId) {
        return false;
      }
      // Search Term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const name = (p.candidatoNombre || '').toLowerCase();
        const email = (p.candidatoEmail || '').toLowerCase();
        const jobTitle = (p.ofertaTitulo || '').toLowerCase();
        const candId = (p.candidatoId || '').toLowerCase();
        return name.includes(query) || email.includes(query) || jobTitle.includes(query) || candId.includes(query);
      }
      return true;
    });
  }, [postulaciones, selectedEstado, selectedOfertaId, searchTerm]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <Users className="h-7 w-7 text-blue-600" />
            Gestión de Candidatos
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Revisa, califica y gestiona a los postulantes que aplican a tus ofertas de empleo.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadData} 
            isLoading={isLoading}
            className="flex items-center gap-2 border-slate-200 hover:bg-slate-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3.5">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">{metrics.total}</div>
            <div className="text-xs font-medium text-slate-500">Total Postulantes</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3.5">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">{metrics.enRevision}</div>
            <div className="text-xs font-medium text-slate-500">En Revisión</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3.5">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">{metrics.enProceso}</div>
            <div className="text-xs font-medium text-slate-500">Entrevistas / Test</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3.5">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">{metrics.seleccionadas}</div>
            <div className="text-xs font-medium text-slate-500">Seleccionados</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3.5 col-span-2 md:col-span-1">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <XCircle className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">{metrics.rechazadas}</div>
            <div className="text-xs font-medium text-slate-500">Descartados</div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, email o título de oferta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Oferta Filter */}
          {companyJobs.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500 whitespace-nowrap">Oferta:</span>
              <select
                value={selectedOfertaId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedOfertaId(val);
                  if (val !== 'TODAS') {
                    setSearchParams({ ofertaId: val });
                  } else {
                    setSearchParams({});
                  }
                }}
                className="text-xs font-medium py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-700"
              >
                <option value="TODAS">Todas las ofertas ({companyJobs.length})</option>
                {companyJobs.map(j => (
                  <option key={j.id} value={j.id}>{j.titulo}</option>
                ))}
              </select>
            </div>
          )}

          {/* Estado Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500 whitespace-nowrap">Estado:</span>
            <select
              value={selectedEstado}
              onChange={(e) => setSelectedEstado(e.target.value)}
              className="text-xs font-medium py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-700"
            >
              <option value="TODOS">Todos los estados</option>
              <option value="ENVIADA">Enviada</option>
              <option value="RECIBIDA">Recibida</option>
              <option value="EN_REVISION">En Revisión</option>
              <option value="PRESELECCIONADA">Preseleccionada</option>
              <option value="ENTREVISTA">Entrevista</option>
              <option value="EVALUACION">Evaluación</option>
              <option value="SELECCIONADA">Seleccionada</option>
              <option value="RECHAZADA">Rechazada</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500 font-medium">Cargando candidatos...</p>
          </div>
        ) : filteredPostulaciones.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">
              {searchTerm || selectedEstado !== 'TODOS' || selectedOfertaId !== 'TODAS'
                ? 'No se encontraron postulantes con los filtros actuales'
                : 'Aún no hay postulaciones registradas'}
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mb-5">
              {searchTerm || selectedEstado !== 'TODOS' || selectedOfertaId !== 'TODAS'
                ? 'Prueba modificando o limpiando la búsqueda y los filtros seleccionados.'
                : 'Cuando los candidatos vean tus ofertas laborales publicadas y postulen, aparecerán listados aquí para que puedas evaluar sus perfiles y CVs.'}
            </p>
            {(searchTerm || selectedEstado !== 'TODOS' || selectedOfertaId !== 'TODAS') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedEstado('TODOS');
                  setSelectedOfertaId('TODAS');
                }}
              >
                Limpiar filtros
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Candidato</th>
                  <th className="py-3.5 px-4">Oferta de Empleo</th>
                  <th className="py-3.5 px-4">Fecha Postulación</th>
                  <th className="py-3.5 px-4">CV / Documentos</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredPostulaciones.map((postulacion) => {
                  const badge = ESTADO_BADGES[postulacion.estado] || {
                    label: postulacion.estado,
                    bg: 'bg-slate-100',
                    text: 'text-slate-700',
                    border: 'border-slate-200',
                  };
                  const nextOpts = NEXT_STATUSES[postulacion.estado] || [];
                  const initials = (postulacion.candidatoNombre || 'Candidato')
                    .split(' ')
                    .map(w => w[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase();

                  return (
                    <tr key={postulacion.uuid} className="hover:bg-slate-50/60 transition-colors">
                      {/* Candidato Info */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-sm">
                            {postulacion.candidatoFoto ? (
                              <img 
                                src={postulacion.candidatoFoto} 
                                alt={postulacion.candidatoNombre || 'Avatar'} 
                                className="w-full h-full rounded-full object-cover" 
                              />
                            ) : (
                              initials
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 truncate">
                              {postulacion.candidatoNombre || `Candidato #${postulacion.candidatoId.substring(0, 8)}`}
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-1.5 truncate">
                              <Mail className="h-3 w-3 text-slate-400" />
                              {postulacion.candidatoEmail || 'Email no disponible'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Oferta Title */}
                      <td className="py-4 px-4">
                        <div className="font-medium text-slate-800 line-clamp-1">
                          {postulacion.ofertaTitulo || `Oferta #${postulacion.ofertaId.substring(0, 8)}`}
                        </div>
                        <div className="text-xs text-slate-400">
                          ID: {postulacion.ofertaId.substring(0, 8)}...
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-4 px-4 whitespace-nowrap text-slate-500 text-xs">
                        {new Date(postulacion.fechaPostulacion).toLocaleDateString('es-PE', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      {/* CV / Documentos */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {postulacion.cvUrl ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setViewingCvPostulacion(postulacion)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors border border-blue-200/60"
                              title="Visualizar CV en visor interactivo"
                            >
                              <FileText className="h-3.5 w-3.5 text-blue-600" />
                              Ver CV
                              <Eye className="h-3 w-3 opacity-70" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenCvTab(postulacion.uuid)}
                              className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                              title="Abrir PDF seguro en pestaña nueva"
                            >
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No adjuntado</span>
                        )}
                      </td>

                      {/* Estado Badge */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                          {badge.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedPostulacion(postulacion)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Ver detalles y carta de presentación"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {/* Quick Change Dropdown if has next transitions */}
                          {nextOpts.length > 0 && (
                            <div className="relative inline-block text-left group">
                              <select
                                onChange={(e) => {
                                  const val = e.target.value as EstadoPostulacion;
                                  if (val) {
                                    setStatusChangeTarget({ postulacion, newEstado: val });
                                    e.target.value = '';
                                  }
                                }}
                                defaultValue=""
                                className="text-xs font-semibold py-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-600"
                              >
                                <option value="" disabled>Mover a...</option>
                                {nextOpts.map(opt => (
                                  <option key={opt} value={opt}>
                                    {ESTADO_BADGES[opt]?.label || opt}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(postulacion)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Eliminar postulación"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal 1: Candidate Details & Cover Letter */}
      {selectedPostulacion && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center">
                  {(selectedPostulacion.candidatoNombre || 'C').substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {selectedPostulacion.candidatoNombre || 'Candidato'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Postulado a: <span className="font-semibold text-slate-700">{selectedPostulacion.ofertaTitulo || 'Oferta'}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPostulacion(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Correo Electrónico:</span>
                  <span className="font-semibold text-slate-800 break-all">{selectedPostulacion.candidatoEmail || 'No disponible'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Fecha de Envío:</span>
                  <span className="font-semibold text-slate-800">
                    {new Date(selectedPostulacion.fechaPostulacion).toLocaleDateString('es-PE', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Estado Actual:</span>
                  <span className={`inline-flex px-2 py-0.5 rounded-full font-bold border ${ESTADO_BADGES[selectedPostulacion.estado]?.bg} ${ESTADO_BADGES[selectedPostulacion.estado]?.text} ${ESTADO_BADGES[selectedPostulacion.estado]?.border}`}>
                    {ESTADO_BADGES[selectedPostulacion.estado]?.label || selectedPostulacion.estado}
                  </span>
                </div>
              </div>

              {/* Cover Letter */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-blue-600" />
                  Carta de Presentación
                </h4>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-700 leading-relaxed max-h-56 overflow-y-auto whitespace-pre-wrap">
                  {selectedPostulacion.cartaPresentacion ? (
                    selectedPostulacion.cartaPresentacion
                  ) : (
                    <span className="italic text-slate-400">El candidato no adjuntó una carta de presentación.</span>
                  )}
                </div>
              </div>

              {/* CV Download / Link */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-blue-600" />
                  Currículum Vitae (CV)
                </h4>
                {selectedPostulacion.cvUrl ? (
                  <div className="flex items-center justify-between p-3.5 bg-blue-50/50 border border-blue-100 rounded-xl">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-800">Currículum Vitae (PDF)</div>
                        <div className="text-xs text-slate-500 truncate max-w-xs">{selectedPostulacion.candidatoNombre || 'Documento adjunto'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setViewingCvPostulacion(selectedPostulacion)}
                        className="px-3 py-1.5 bg-white border border-blue-200 hover:bg-blue-50 text-blue-700 font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Vista Previa
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadCv(selectedPostulacion.uuid, selectedPostulacion.candidatoNombre)}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Descargar PDF
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-400 italic">
                    No se proporcionó enlace al currículum vitae.
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-100 flex items-center justify-between">
              {/* Quick status button */}
              {(NEXT_STATUSES[selectedPostulacion.estado] || []).length > 0 ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Avanzar candidato:</span>
                  {(NEXT_STATUSES[selectedPostulacion.estado] || []).slice(0, 3).map(opt => (
                    <button
                      key={opt}
                      onClick={() => {
                        setStatusChangeTarget({ postulacion: selectedPostulacion, newEstado: opt });
                      }}
                      className="text-xs font-semibold px-2.5 py-1.5 bg-white border border-slate-200 hover:border-blue-300 hover:text-blue-700 rounded-lg transition-colors shadow-sm"
                    >
                      {ESTADO_BADGES[opt]?.label}
                    </button>
                  ))}
                </div>
              ) : <div />}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedPostulacion(null)}
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Change Status Confirmation */}
      {statusChangeTarget && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Cambiar estado del candidato</h3>
                <p className="text-xs text-slate-500">
                  {statusChangeTarget.postulacion.candidatoNombre || 'Candidato'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block text-[11px]">Estado actual:</span>
                  <span className="font-bold text-slate-800">
                    {ESTADO_BADGES[statusChangeTarget.postulacion.estado]?.label}
                  </span>
                </div>
                <div className="text-slate-400">→</div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Nuevo estado:</span>
                  <span className="font-bold text-blue-600">
                    {ESTADO_BADGES[statusChangeTarget.newEstado]?.label}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Comentario o nota interna (opcional)
                </label>
                <textarea
                  value={comentarioCambio}
                  onChange={(e) => setComentarioCambio(e.target.value)}
                  rows={3}
                  placeholder="Escribe una observación sobre la decisión..."
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStatusChangeTarget(null);
                    setComentarioCambio('');
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  isLoading={isUpdating}
                  onClick={handleConfirmStatusChange}
                >
                  Confirmar Cambio
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Visor Interactivo de CV (PDF) */}
      {viewingCvPostulacion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-3.5 border-b border-slate-100 flex items-center justify-between bg-white flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    {viewingCvPostulacion.candidatoNombre || 'Currículum del Candidato'}
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      PDF
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 truncate max-w-md">
                    Oferta: <span className="font-medium text-slate-700">{viewingCvPostulacion.ofertaTitulo}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadCv(viewingCvPostulacion.uuid, viewingCvPostulacion.candidatoNombre)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-blue-700 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Download className="h-3.5 w-3.5" />
                  Descargar PDF
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenCvTab(viewingCvPostulacion.uuid)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/60 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Pestaña Nueva
                </button>
                <button
                  type="button"
                  onClick={() => setViewingCvPostulacion(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors ml-1"
                  title="Cerrar visor"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Body - PDF Iframe Viewer */}
            <div className="flex-1 bg-slate-100 p-2 overflow-hidden flex items-center justify-center">
              {cvBlobUrl ? (
                <iframe
                  src={cvBlobUrl}
                  className="w-full h-full rounded-xl border border-slate-200/80 bg-white shadow-inner"
                  title={`CV de ${viewingCvPostulacion.candidatoNombre}`}
                />
              ) : (
                <div className="text-slate-500 text-sm flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  Cargando documento seguro...
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Eliminar postulación</h3>
                <p className="text-xs text-slate-500">
                  Esta acción no se puede deshacer
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-3.5 bg-rose-50/50 rounded-xl border border-rose-200 text-sm text-slate-700">
                <p className="mb-2">
                  ¿Estás seguro de que deseas eliminar la postulación de{' '}
                  <span className="font-bold text-slate-900">{deleteTarget.candidatoNombre || 'este candidato'}</span>?
                </p>
                <p className="text-xs text-slate-500">
                  Se eliminará permanentemente la postulación, su historial de estados, evaluaciones y entrevistas asociadas.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteTarget(null)}
                >
                  Cancelar
                </Button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors shadow-sm"
                >
                  {isDeleting ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
