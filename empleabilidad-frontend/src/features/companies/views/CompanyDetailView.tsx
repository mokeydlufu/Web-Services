import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEmpresaById, type EmpresaPublica } from '../services/empresa.service';
import { ofertasApi } from '../../../core/api';
import { JobCard } from '../../jobs/components/JobCard'; // Assuming JobCard exists

import type { EmpleoPublicoResponse } from '../../jobs/types/job.types';

export const CompanyDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [empresa, setEmpresa] = useState<EmpresaPublica | null>(null);
  const [ofertas, setOfertas] = useState<EmpleoPublicoResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDetails = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await getEmpresaById(id);
      setEmpresa(data);
      
      // Fetch ofertas públicas (necesitaremos usar el filtro de la API de ofertas)
      const ofertasData = await ofertasApi.get(`/ofertas/publicas?empresaId=${id}&size=20`);
      setOfertas(ofertasData.data.content);
      
    } catch (error) {
      console.error('Error fetching company details:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDetails();
  }, [fetchDetails]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!empresa) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Empresa no encontrada</h2>
        <button onClick={() => navigate('/empresas')} className="text-blue-600 hover:underline">Volver al listado</button>
      </div>
    );
  }

  const hasLogo = Boolean(empresa.logo);

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* Header Profile */}
      <div className="bg-white border-b border-slate-200 pt-16 pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="w-32 h-32 bg-slate-50 rounded-3xl border-2 border-slate-100 flex items-center justify-center overflow-hidden shadow-md flex-shrink-0">
              {hasLogo ? (
                <img src={empresa.logo} alt="Logo" className="w-full h-full object-contain p-2 bg-white" />
              ) : (
                <span className="text-4xl font-bold text-slate-400">
                  {(empresa.nombreComercial || empresa.razonSocial).substring(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 flex items-center justify-center md:justify-start gap-2 flex-wrap mb-2">
                {empresa.nombreComercial || empresa.razonSocial}
                <span className="text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full text-sm font-medium border border-emerald-200">
                  ✓ Empresa Verificada
                </span>
              </h1>
              <div className="text-slate-500 flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-2 mb-4">
                {empresa.ubicacion && <span className="flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>{empresa.ubicacion}</span>}
                {empresa.industria && <span className="flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>{empresa.industria}</span>}
                {empresa.tamano && <span className="flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>{empresa.tamano}</span>}
              </div>
              {empresa.sitioWeb && (
                <a href={empresa.sitioWeb.startsWith('http') ? empresa.sitioWeb : `https://${empresa.sitioWeb}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium inline-flex items-center gap-1">
                  Visitar sitio web
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/></svg>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Sobre {empresa.nombreComercial || empresa.razonSocial}</h2>
            <div className="prose prose-slate max-w-none whitespace-pre-wrap">
              {empresa.descripcion || 'Esta empresa aún no ha proporcionado una descripción detallada de su cultura y beneficios.'}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              Ofertas Disponibles
              <span className="bg-blue-100 text-blue-700 py-0.5 px-2.5 rounded-full text-sm">{ofertas.length}</span>
            </h2>
            {ofertas.length > 0 ? (
              <div className="grid gap-4">
                {ofertas.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            ) : (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
                <p className="text-slate-500">No hay ofertas de empleo activas en este momento.</p>
              </div>
            )}
          </div>
        </div>
        
        <div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 sticky top-24">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Información Legal</h3>
            <ul className="space-y-4">
              {empresa.razonSocial && (
                <li>
                  <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Razón Social</div>
                  <div className="text-slate-700">{empresa.razonSocial}</div>
                </li>
              )}
              {empresa.industria && (
                <li>
                  <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Industria</div>
                  <div className="text-slate-700">{empresa.industria}</div>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
