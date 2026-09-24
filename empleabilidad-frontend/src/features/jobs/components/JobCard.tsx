import React from 'react';
import type { EmpleoPublicoResponse } from '../types/job.types';
import { MapPin, Banknote, Clock, Briefcase, ExternalLink } from 'lucide-react';
import { Button } from '@/shared/components/Button';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';

interface JobCardProps {
  job: EmpleoPublicoResponse;
}

export const JobCard: React.FC<JobCardProps> = ({ job }) => {
  const [imageError, setImageError] = React.useState(false);

  const isExternal = job.externa;

  const getInitials = (name?: string) => {
    if (!name) return 'NA';
    const cleanName = name.replace(/[-.,()]/g, ' ').trim();
    if (cleanName.toLowerCase() === 'empresa confidencial') return 'EC';
    const words = cleanName.split(/\s+/).filter(w => w.length > 0 && !w.toLowerCase().match(/^(sa|sac|srl|eirl|cia|inc|llc|ltd)$/));
    if (words.length === 0) return name.substring(0, 2).toUpperCase();
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  };

  const handleExternalClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!job.urlExterna) return;

    const result = await Swal.fire({
      icon: 'info',
      title: 'Oferta externa',
      text: 'Esta vacante se gestiona en un sitio externo. La postulación se realizará fuera de EmpleoPro.',
      showCancelButton: true,
      confirmButtonText: 'Continuar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#64748b',
    });

    if (result.isConfirmed) {
      window.open(job.urlExterna, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-lg transition-all duration-300 hover:border-blue-100 flex flex-col h-full animate-fade-in group hover:-translate-y-1 relative overflow-hidden">
      {/* Decorative gradient blur */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -z-10 group-hover:bg-blue-100 transition-colors"></div>
      
      <div className="flex items-start justify-between mb-4">
        <div className="flex gap-4 items-center">
          <div className="h-14 w-14 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm shrink-0 overflow-hidden">
            {job.logoUrl && !imageError ? (
              <img
                src={job.logoUrl}
                alt={`Logo de ${job.empresa || 'la empresa'}`}
                className="w-full h-full object-contain p-1"
                onError={() => setImageError(true)}
              />
            ) : (
              <span className="text-slate-500 font-bold tracking-wider text-lg">
                {getInitials(job.empresa || 'Empresa Confidencial')}
              </span>
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
              {job.titulo}
            </h3>
            <p className="text-sm font-medium text-slate-500 flex items-center gap-1.5 mt-0.5">
              {job.empresa || 'Empresa Confidencial'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">

        {job.modalidad && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold">
            <Briefcase className="w-3.5 h-3.5" />
            {job.modalidad.replace('_', ' ')}
          </span>
        )}

        {job.tipoEmpleo && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-semibold">
            <Clock className="w-3.5 h-3.5" />
            {job.tipoEmpleo.replace('_', ' ')}
          </span>
        )}
      </div>

      <p className="text-slate-600 text-sm line-clamp-2 mb-6 flex-1">
        {job.descripcion || 'Sin descripcion detallada.'}
      </p>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-auto pt-4 border-t border-slate-100">
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-sm text-slate-500 font-medium">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="line-clamp-1">{job.ubicacion || 'Peru'}</span>
          </div>
          {job.salario && (
            <div className="flex items-center gap-1.5 text-sm text-slate-600 font-medium">
              <Banknote className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{job.salario}</span>
            </div>
          )}
        </div>
        
        {isExternal ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleExternalClick}
            className="w-full sm:w-auto shadow-none border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-1.5"
          >
            Ver oferta y postular
            <ExternalLink className="w-3.5 h-3.5" />
          </Button>
        ) : (
          <Link to={`/empleos/${job.id}`} className="w-full sm:w-auto">
            <Button
              variant="secondary"
              size="sm"
              className="w-full sm:w-auto shadow-none group-hover:bg-blue-600 group-hover:text-white transition-all"
            >
              Ver oferta
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
};