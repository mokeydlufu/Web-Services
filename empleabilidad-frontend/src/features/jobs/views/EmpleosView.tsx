import React, { useEffect, useState } from 'react';
import { Search, Filter, Loader2, MapPin, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { jobService } from '../services/job.service';
import { JobCard } from '../components/JobCard';
import type { EmpleoPublicoResponse } from '../types/job.types';
import type { PageResponse } from '@/shared/types';
import { Button } from '@/shared/components/Button';

const CIUDADES_PERU = [
  'Peru',
  'Ayacucho',
  'Lima',
  'Cusco',
  'Arequipa',
  'Huancayo',
  'Trujillo',
  'Ica',
];

export const EmpleosView: React.FC = () => {
  const [jobsData, setJobsData] = useState<PageResponse<EmpleoPublicoResponse> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [ubicacion, setUbicacion] = useState('Peru');
  const [origen, setOrigen] = useState<'TODOS' | 'EMPLEAPRO' | 'JOOBLE'>('TODOS');
  const [tipoEmpleo, setTipoEmpleo] = useState<string>('TODOS');
  const [incluirRemotos, setIncluirRemotos] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchJobs = async (
    q: string = searchTerm,
    ub: string = ubicacion,
    orig: string = origen,
    tipo: string = tipoEmpleo,
    remotos: boolean = incluirRemotos,
    page: number = currentPage
  ) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const params: Record<string, any> = {
        q: q.trim(),
        ubicacion: ub,
        origen: orig,
        incluirRemotos: remotos,
        page,
        size: 12,
      };
      if (tipo && tipo !== 'TODOS') {
        params.tipoEmpleo = tipo;
      }
      const data = await jobService.getPublicJobs(params);
      setJobsData(data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setErrorMsg('No se pudieron cargar algunas ofertas.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs(searchTerm, ubicacion, origen, tipoEmpleo, incluirRemotos, currentPage);
  }, [ubicacion, origen, tipoEmpleo, incluirRemotos, currentPage]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(0);
    fetchJobs(searchTerm, ubicacion, origen, tipoEmpleo, incluirRemotos, 0);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setUbicacion('Peru');
    setOrigen('TODOS');
    setTipoEmpleo('TODOS');
    setIncluirRemotos(false);
    setCurrentPage(0);
    fetchJobs('', 'Peru', 'TODOS', 'TODOS', false, 0);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        
        {/* Header & Search */}
        <div className="mb-10 text-center max-w-3xl mx-auto">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
            Descubre tu proximo <span className="text-blue-600">gran reto</span>
          </h1>
          <p className="text-lg text-slate-500 mb-8">
            Explora ofertas de trabajo de EmpleaPro y oportunidades laborales reales de internet.
          </p>
          
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
            {/* Input Palabra Clave */}
            <div className="flex-1 relative flex items-center w-full">
              <Search className="absolute left-4 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Cargo, palabra clave o empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-12 pl-12 pr-4 bg-transparent focus:outline-none text-slate-700 placeholder:text-slate-400"
              />
            </div>

            <div className="hidden sm:block w-px h-8 bg-slate-200"></div>

            {/* Selector de Ubicacion */}
            <div className="relative flex items-center w-full sm:w-48">
              <MapPin className="absolute left-3 h-4 w-4 text-slate-400 pointer-events-none" />
              <select
                value={ubicacion}
                onChange={(e) => {
                  setUbicacion(e.target.value);
                  setCurrentPage(0);
                }}
                className="w-full h-12 pl-9 pr-8 bg-transparent focus:outline-none text-slate-700 text-sm font-medium cursor-pointer"
              >
                {CIUDADES_PERU.map((c) => (
                  <option key={c} value={c}>
                    {c === 'Peru' ? 'Perú' : c}
                  </option>
                ))}
              </select>
            </div>

            <div className="hidden sm:block w-px h-8 bg-slate-200"></div>

            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowFilters(!showFilters)}
              className={`text-slate-600 hover:text-slate-900 ${showFilters ? 'bg-slate-100' : ''}`}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>

            <Button type="submit" size="lg" className="w-full sm:w-auto rounded-xl px-8 shadow-md shadow-blue-600/20">
              Buscar
            </Button>
          </form>

          {/* Panel de Filtros expandible */}
          {showFilters && (
            <div className="mt-4 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm text-left animate-fade-in">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                <span className="font-bold text-slate-800 text-sm">Filtros Avanzados</span>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium"
                >
                  <X className="w-3.5 h-3.5" /> Limpiar filtros
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Filtro Origen */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Origen de la oferta
                  </label>
                  <select
                    value={origen}
                    onChange={(e) => {
                      setOrigen(e.target.value as any);
                      setCurrentPage(0);
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="TODOS">Todos (EmpleaPro + Jooble / Externas)</option>
                    <option value="EMPLEAPRO">Solo EmpleaPro (Internas)</option>
                    <option value="JOOBLE">Solo Ofertas Externas (Jooble)</option>
                  </select>
                </div>

                {/* Filtro Tipo Empleo */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Tipo de empleo
                  </label>
                  <select
                    value={tipoEmpleo}
                    onChange={(e) => {
                      setTipoEmpleo(e.target.value);
                      setCurrentPage(0);
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="TODOS">Todos los tipos</option>
                    <option value="TIEMPO_COMPLETO">Tiempo Completo</option>
                    <option value="MEDIO_TIEMPO">Medio Tiempo</option>
                    <option value="PRACTICAS">Practicas</option>
                    <option value="POR_PROYECTO">Por Proyecto</option>
                    <option value="FREELANCE">Freelance</option>
                  </select>
                </div>

                {/* Filtro Remotos */}
                <div className="sm:col-span-2 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={incluirRemotos}
                      onChange={(e) => {
                        setIncluirRemotos(e.target.checked);
                        setCurrentPage(0);
                      }}
                      className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-semibold text-slate-700">Incluir remotos internacionales</span>
                  </label>
                  <p className="text-xs text-slate-500 mt-1 pl-6">
                    Activa esto para ver ofertas internacionales (Worldwide, LATAM, etc.) de la red Remotive, independientemente de tu búsqueda de ciudad.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Info Bar */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">
            {isLoading ? 'Buscando empleos...' : `${jobsData?.totalElements || 0} Empleos Encontrados`}
          </h2>
          <div className="text-sm font-medium text-slate-500">
            Pagina {jobsData && jobsData.totalPages > 0 ? jobsData.number + 1 : 1} de {jobsData?.totalPages || 1}
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
            {errorMsg}
          </div>
        )}

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <div className="relative">
              <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4 relative z-10" />
              <div className="absolute inset-0 bg-blue-400 blur-xl opacity-30 animate-pulse"></div>
            </div>
            <p className="text-slate-500 font-medium">Buscando empleos...</p>
          </div>
        ) : !jobsData || jobsData.content.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-2xl border border-slate-200 border-dashed max-w-2xl mx-auto">
            <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              No se encontraron ofertas disponibles en {ubicacion === 'Peru' ? 'Perú' : ubicacion}.
            </h3>
            <p className="text-slate-500 mb-6">
              Puedes ampliar tu búsqueda a todo Perú o consultar empleos remotos internacionales.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setUbicacion('Peru');
                  setCurrentPage(0);
                }}
              >
                Buscar en todo Perú
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setIncluirRemotos(true);
                  setCurrentPage(0);
                }}
              >
                Ver remotos
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobsData.content.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>

            {/* Pagination Controls */}
            {jobsData.totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={jobsData.number === 0}
                  onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Anterior
                </Button>

                <span className="text-sm font-medium text-slate-600 px-3">
                  Pagina {jobsData.number + 1} de {jobsData.totalPages}
                </span>

                <Button
                  variant="secondary"
                  size="sm"
                  disabled={jobsData.last}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  className="flex items-center gap-1"
                >
                  Siguiente <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
};