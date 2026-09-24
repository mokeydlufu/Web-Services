import React from 'react';
import { Link } from 'react-router-dom';
import { X, MapPin, Users, Calendar, Briefcase, ExternalLink } from 'lucide-react';
import type { OfertaResponse } from '../types/job.types';

interface ViewJobModalProps {
  job: OfertaResponse;
  onClose: () => void;
  onEdit?: () => void;
}

export const ViewJobModal: React.FC<ViewJobModalProps> = ({ job, onClose, onEdit }) => {
  const getBadgeStyle = (estado: string) => {
    switch (estado) {
      case 'PUBLICADA':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'PENDIENTE_APROBACION':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'RECHAZADA':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'PAUSADA':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'CERRADA':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'No especificado';
    return `S/. ${amount.toLocaleString()}`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'No definida';
    try {
      return new Date(dateStr).toLocaleDateString('es-PE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto relative animate-slide-up flex flex-col">
        
        {/* Header */}
        <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{job.titulo}</h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {job.ubicacion || job.pais || 'Remoto / Por definir'}
                </span>
                <span>•</span>
                <span>Creada el {formatDate(job.fechaCreacion)}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 flex-1">

          {/* Quick Info Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-xs text-slate-500 font-medium">Estado</p>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border mt-1 ${getBadgeStyle(job.estado)}`}>
                {job.estado.replace('_', ' ')}
              </span>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-xs text-slate-500 font-medium">Postulantes</p>
              <Link 
                to={`/empresa/candidatos?ofertaId=${job.id}`}
                onClick={onClose}
                className="text-base font-bold text-slate-900 mt-0.5 flex items-center gap-1.5 hover:text-blue-600 transition-colors group cursor-pointer"
                title="Ver postulantes de esta oferta"
              >
                <Users className="h-4 w-4 text-blue-600 group-hover:scale-110 transition-transform" />
                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs font-bold">
                  {job.numeroPostulaciones ?? 0}
                </span>
                {(job.numeroPostulaciones ?? 0) > 0 && (
                  <span className="text-xs font-medium text-blue-600 underline ml-1">Ver lista</span>
                )}
              </Link>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-xs text-slate-500 font-medium">Modalidad</p>
              <p className="text-sm font-semibold text-slate-800 mt-1">
                {job.modalidad?.replace('_', ' ')}
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-xs text-slate-500 font-medium">Vencimiento</p>
              <p className="text-sm font-semibold text-slate-800 mt-1 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                {formatDate(job.fechaVencimiento)}
              </p>
            </div>
          </div>

          {/* Key Attributes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-blue-50/50 border border-blue-100 rounded-xl p-4">
            <div>
              <span className="text-xs text-blue-700 font-medium block">Nivel de Experiencia</span>
              <span className="text-sm font-bold text-slate-800">{job.nivelExperiencia?.replace('_', ' ')}</span>
            </div>
            <div>
              <span className="text-xs text-blue-700 font-medium block">Tipo de Contrato</span>
              <span className="text-sm font-bold text-slate-800">{job.tipoContrato?.replace('_', ' ')}</span>
            </div>
            <div>
              <span className="text-xs text-blue-700 font-medium block">Rango Salarial</span>
              <span className="text-sm font-bold text-slate-800">
                {job.salarioMinimo || job.salarioMaximo 
                  ? `${formatCurrency(job.salarioMinimo)} - ${formatCurrency(job.salarioMaximo)}`
                  : 'A tratar'}
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-blue-600" />
              Descripción de la Posición
            </h3>
            <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-4 text-slate-700 text-sm whitespace-pre-wrap leading-relaxed">
              {job.descripcion || 'Sin descripción detallada.'}
            </div>
          </div>

          {/* Requirements (if any) */}
          {job.requisitos && job.requisitos.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">
                Requisitos Exigidos
              </h3>
              <ul className="space-y-2">
                {job.requisitos.map((req, idx) => {
                  const texto = req.descripcion || req.requisito || 'Requisito sin descripción';
                  const nivel = req.nivel || req.nivelRequerido;
                  const esObligatorio = req.obligatorio ?? req.esObligatorio ?? false;
                  return (
                    <li key={req.id || idx} className="flex items-start gap-2 text-sm text-slate-700 bg-white border border-slate-200 rounded-lg p-3">
                      <span className="h-5 w-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-slate-900">{texto}</p>
                          {req.tipo && (
                            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                              {req.tipo}
                            </span>
                          )}
                        </div>
                        {nivel && (
                          <p className="text-xs text-slate-500 mt-0.5">Nivel: {nivel}</p>
                        )}
                      </div>
                      {esObligatorio && (
                        <span className="text-[10px] uppercase font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded shrink-0">
                          Obligatorio
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

        </div>

        {/* Footer actions */}
        <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 flex items-center justify-between">
          <div>
            {job.estado === 'PUBLICADA' && (
              <a
                href={`/empleos/${job.id}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                Ver como candidato <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cerrar
            </button>
            {onEdit && job.estado !== 'CERRADA' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit();
                }}
                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-lg shadow transition-colors"
              >
                Editar Oferta
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
