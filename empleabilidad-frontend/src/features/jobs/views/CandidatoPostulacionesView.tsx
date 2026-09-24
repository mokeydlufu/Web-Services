import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Search, Filter, ArrowRight, Briefcase, FileText as FileTextIcon } from 'lucide-react';
import { jobService } from '../services/job.service';
import type { PostulacionResponse } from '../types/job.types';

type EstadoPostulacion = 'TODAS' | 'ENVIADA' | 'EN_REVISION' | 'ENTREVISTA' | 'FINALISTA' | 'ACEPTADA' | 'RECHAZADA';

export const CandidatoPostulacionesView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<EstadoPostulacion>('TODAS');
  const [postulaciones, setPostulaciones] = useState<PostulacionResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPostulaciones = async () => {
      try {
        setIsLoading(true);
        const data = await jobService.getMyApplications({ size: 100 });
        setPostulaciones(data.content || []);
      } catch (error) {
        console.error('Error al cargar postulaciones', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPostulaciones();
  }, []);

  const postulacionesFiltradas = postulaciones.filter((p) => {
    const matchQuery = !searchTerm.trim() || 
      p.ofertaTitulo?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchEstado = filtroEstado === 'TODAS' || (p.estado as string) === filtroEstado;
    return matchQuery && matchEstado;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-blue-600" />
            Mis Postulaciones
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Haz seguimiento al estado de tus procesos de selección en tiempo real.
          </p>
        </div>
        <Link
          to="/candidato/buscar"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm shadow-blue-600/20"
        >
          <Briefcase className="w-4 h-4" />
          Explorar nuevas ofertas
        </Link>
      </div>

      {/* Buscador y Filtros */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por cargo o empresa..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value as EstadoPostulacion)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="TODAS">Todos los estados</option>
            <option value="ENVIADA">Enviada</option>
            <option value="EN_REVISION">En revisión</option>
            <option value="ENTREVISTA">Entrevista</option>
            <option value="FINALISTA">Finalista</option>
            <option value="ACEPTADA">Aceptada</option>
            <option value="RECHAZADA">Rechazada</option>
          </select>
        </div>
      </div>

      {/* Contenido / Estado Vacío Real */}
      {postulacionesFiltradas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            {searchTerm || filtroEstado !== 'TODAS'
              ? 'No se encontraron postulaciones con los filtros seleccionados'
              : 'Aún no te has postulado a ninguna oferta'}
          </h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
            {searchTerm || filtroEstado !== 'TODAS'
              ? 'Intenta ajustar los términos de búsqueda o cambiar el filtro de estado.'
              : 'Explora las vacantes disponibles de las mejores empresas y postula hoy mismo para iniciar tu próximo reto profesional.'}
          </p>
          <Link
            to="/candidato/buscar"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-blue-600/20"
          >
            Buscar empleos disponibles
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {postulacionesFiltradas.map((postulacion) => (
            <div
              key={postulacion.id}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4 hover:border-slate-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-slate-900">{postulacion.ofertaTitulo || 'Oferta sin título'}</h4>
                  <p className="text-sm text-slate-500">Postulado el: {new Date(postulacion.fechaPostulacion).toLocaleDateString()}</p>
                </div>
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700">
                  {postulacion.estado}
                </span>
              </div>

              {(postulacion.cartaPresentacion || postulacion.cvUrl) && (
                <div className="pt-3 border-t border-slate-100 flex flex-col gap-3">
                  {postulacion.cartaPresentacion && (
                    <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                      <div className="font-medium text-slate-700 mb-1 flex items-center gap-2">
                        <span>Carta de presentación</span>
                        {postulacion.generadaConIa && (
                          <span className="text-[10px] font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                            ✨ Generada con IA
                          </span>
                        )}
                      </div>
                      <p className="whitespace-pre-wrap">{postulacion.cartaPresentacion}</p>
                    </div>
                  )}

                  {postulacion.cvUrl && (
                    <div>
                      <a 
                        href={postulacion.cvUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        <FileTextIcon className="w-4 h-4" />
                        Ver CV Adjunto
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
