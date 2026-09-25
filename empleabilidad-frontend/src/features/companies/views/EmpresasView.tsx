import React, { useEffect, useState, useCallback } from 'react';
import { getEmpresasPublicas, getConteoOfertas, type EmpresaPublica } from '../services/empresa.service';
import { EmpresaCard } from '../components/EmpresaCard';
import { alerts } from '@/shared/utils/alerts';

const INDUSTRIAS = [
  'TODAS', 'Tecnología', 'Banca y Finanzas', 'Salud', 'Educación', 
  'Construcción', 'Comercio', 'Servicios', 'Manufactura'
];

const UBICACIONES = [
  'TODAS', 'Peru', 'Lima', 'Arequipa', 'Trujillo', 'Chiclayo', 
  'Piura', 'Cusco', 'Ica', 'Huancayo'
];

export const EmpresasView: React.FC = () => {
  const [empresas, setEmpresas] = useState<EmpresaPublica[]>([]);
  const [conteos, setConteos] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [q, setQ] = useState('');
  const [industria, setIndustria] = useState('TODAS');
  const [ubicacion, setUbicacion] = useState('TODAS');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchEmpresas = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getEmpresasPublicas(page, 12, q, ubicacion, industria);
      setEmpresas(data.content);
      setTotalPages(data.totalPages);

      // Cargar conteos de ofertas de forma segura
      if (data && data.content && data.content.length > 0) {
        try {
          const ids = data.content.map(e => e.id);
          const conteosData = await getConteoOfertas(ids);
          setConteos(conteosData || {});
        } catch (conteoErr) {
          console.warn('No se pudo cargar el conteo de ofertas por empresa:', conteoErr);
        }
      }
    } catch (error) {
      console.error('Error fetching empresas:', error);
      alerts.error('Error', 'No se pudieron cargar las empresas.');
    } finally {
      setLoading(false);
    }
  }, [page, q, industria, ubicacion]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchEmpresas();
  }, [fetchEmpresas]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0); // Volver a la página 1
    fetchEmpresas();
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* Header & Search */}
      <div className="bg-slate-900 pt-20 pb-24 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/20 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">
            Explorar Empresas
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-10">
            Conoce empresas verificadas y descubre sus oportunidades laborales.
          </p>

          <form onSubmit={handleSearch} className="max-w-4xl mx-auto bg-white p-2 rounded-2xl shadow-xl flex flex-col md:flex-row gap-2">
            <div className="flex-1 flex items-center px-4 bg-slate-50 rounded-xl border border-transparent focus-within:border-blue-500 focus-within:bg-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              <input 
                type="text" 
                placeholder="Buscar empresa o sector..." 
                className="w-full bg-transparent border-none py-3 px-3 text-slate-700 outline-none placeholder:text-slate-400"
                value={q}
                onChange={e => setQ(e.target.value)}
              />
            </div>
            
            <div className="w-full md:w-48 flex items-center bg-slate-50 rounded-xl px-4 border border-transparent focus-within:border-blue-500 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              <select className="w-full bg-transparent border-none py-3 px-2 text-slate-700 outline-none appearance-none"
                value={ubicacion} onChange={e => setUbicacion(e.target.value)}>
                {UBICACIONES.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>

            <div className="w-full md:w-56 flex items-center bg-slate-50 rounded-xl px-4 border border-transparent focus-within:border-blue-500 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>
              <select className="w-full bg-transparent border-none py-3 px-2 text-slate-700 outline-none appearance-none"
                value={industria} onChange={e => setIndustria(e.target.value)}>
                {INDUSTRIAS.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>

            <button type="submit" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors whitespace-nowrap">
              Buscar
            </button>
          </form>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-10 relative z-20">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm animate-pulse">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-slate-200 rounded-2xl"></div>
                  <div className="flex-1">
                    <div className="h-5 bg-slate-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="space-y-3 mb-6">
                  <div className="h-4 bg-slate-200 rounded w-full"></div>
                  <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                </div>
                <div className="h-10 bg-slate-200 rounded-xl w-full"></div>
              </div>
            ))}
          </div>
        ) : empresas.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Aún no hay empresas verificadas disponibles</h3>
            <p className="text-slate-500">Intenta ajustar los filtros de búsqueda.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {empresas.map(empresa => (
                <div key={empresa.id} className="hover:-translate-y-1 transition-transform duration-300">
                  <EmpresaCard empresa={empresa} ofertasCount={conteos[empresa.id] || 0} />
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-12 flex justify-center gap-2">
                <button 
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-4 py-2 border border-slate-200 rounded-lg bg-white disabled:opacity-50 hover:bg-slate-50 font-medium"
                >
                  Anterior
                </button>
                <div className="flex items-center px-4 font-medium text-slate-600">
                  Página {page + 1} de {totalPages}
                </div>
                <button 
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page === totalPages - 1}
                  className="px-4 py-2 border border-slate-200 rounded-lg bg-white disabled:opacity-50 hover:bg-slate-50 font-medium"
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
