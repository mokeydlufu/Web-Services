import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { EmpresaPublica } from '../services/empresa.service';

interface EmpresaCardProps {
  empresa: EmpresaPublica;
  ofertasCount: number;
}

const getInitials = (name?: string) => {
  if (!name) return 'NA';
  const cleanName = name.replace(/[-.,()]/g, ' ').trim();
  if (cleanName.toLowerCase() === 'empresa confidencial') return 'EC';
  const words = cleanName.split(/\s+/).filter(w => w.length > 0 && !w.toLowerCase().match(/^(sa|sac|srl|eirl|cia|inc|llc|ltd)$/));
  if (words.length === 0) return name.substring(0, 2).toUpperCase();
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
};

export const EmpresaCard: React.FC<EmpresaCardProps> = ({ empresa, ofertasCount }) => {
  const navigate = useNavigate();
  const hasLogo = Boolean(empresa.logo);

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all flex flex-col h-full group">
      <div className="p-6 flex-1 flex flex-col items-center text-center">
        {/* Logo or Initials */}
        <div className="w-20 h-20 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center mb-4 overflow-hidden shadow-sm group-hover:scale-105 transition-transform">
          {hasLogo ? (
            <img 
              src={empresa.logo} 
              alt={`Logo de ${empresa.nombreComercial}`} 
              className="w-full h-full object-contain p-2 bg-white"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                if (e.currentTarget.nextElementSibling) {
                  (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                }
              }}
            />
          ) : null}
          <div 
            className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500 font-bold text-2xl tracking-wider"
            style={{ display: hasLogo ? 'none' : 'flex' }}
          >
            {getInitials(empresa.nombreComercial || empresa.razonSocial)}
          </div>
        </div>

        {/* Company Name & Verification */}
        <h3 className="text-lg font-bold text-slate-800 mb-1 flex items-center justify-center gap-1.5 flex-wrap">
          {empresa.nombreComercial || empresa.razonSocial}
          {empresa.estadoVerificacion === 'VERIFICADA' && (
            <span className="text-emerald-500 bg-emerald-50 p-0.5 rounded-full" title="Empresa Verificada">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
            </span>
          )}
        </h3>

        {/* Location, Industry & Size */}
        <div className="text-sm text-slate-500 mb-4 flex flex-wrap justify-center gap-x-4 gap-y-1">
          {empresa.ubicacion && (
            <div className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              <span>{empresa.ubicacion}</span>
            </div>
          )}
          {empresa.industria && (
            <div className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>
              <span>{empresa.industria}</span>
            </div>
          )}
          {empresa.tamano && (
            <div className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              <span>{empresa.tamano}</span>
            </div>
          )}
        </div>

        {/* Description Snippet */}
        {empresa.descripcion && (
          <p className="text-sm text-slate-600 line-clamp-3 mb-6">
            {empresa.descripcion}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-600 flex items-center gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
          {ofertasCount} {ofertasCount === 1 ? 'oferta' : 'ofertas'}
        </span>
        <button 
          onClick={() => navigate(`/empresas/${empresa.id}`)}
          className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group-hover:translate-x-1 transition-transform"
        >
          Ver empresa
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </button>
      </div>
    </div>
  );
};
