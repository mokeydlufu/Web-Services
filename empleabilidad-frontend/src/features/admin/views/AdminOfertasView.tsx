import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Search,
  Filter,
  Plus,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  MapPin,
  Users,
  ChevronLeft,
  ChevronRight,
  Tag,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { jobService } from '../../jobs/services/job.service';
import type { OfertaResponse } from '../../jobs/types/job.types';
import type { PageResponse } from '@/shared/types';
import { ViewJobModal } from '../../jobs/components/ViewJobModal';
import { alerts } from '@/shared/utils/alerts';

// ─── Tipos ─────────────────────────────────────────────────────────────────────
type EstadoFiltro = 'Todos' | 'PENDIENTE_APROBACION' | 'PUBLICADA' | 'BORRADOR' | 'RECHAZADA' | 'PAUSADA' | 'CERRADA';

// ─── Sub-componentes ───────────────────────────────────────────────────────────
const EstadoBadge = ({ estado }: { estado: string }) => {
  const map: Record<string, string> = {
    PUBLICADA:            'bg-emerald-100 text-emerald-700',
    PENDIENTE_APROBACION: 'bg-amber-100 text-amber-700',
    RECHAZADA:            'bg-rose-100 text-rose-700',
    BORRADOR:             'bg-slate-100 text-slate-600',
    PAUSADA:              'bg-orange-100 text-orange-700',
    CERRADA:              'bg-slate-100 text-slate-500',
    VENCIDA:              'bg-red-100 text-red-600',
  };
  const iconMap: Record<string, React.ReactNode> = {
    PUBLICADA:            <CheckCircle className="w-3 h-3" />,
    PENDIENTE_APROBACION: <Clock className="w-3 h-3" />,
    RECHAZADA:            <XCircle className="w-3 h-3" />,
    BORRADOR:             <AlertCircle className="w-3 h-3" />,
    PAUSADA:              <Clock className="w-3 h-3" />,
    CERRADA:              <XCircle className="w-3 h-3" />,
  };
  const label: Record<string, string> = {
    PUBLICADA:            'Publicada',
    PENDIENTE_APROBACION: 'Pendiente',
    RECHAZADA:            'Rechazada',
    BORRADOR:             'Borrador',
    PAUSADA:              'Pausada',
    CERRADA:              'Cerrada',
    VENCIDA:              'Vencida',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${map[estado] ?? 'bg-slate-100 text-slate-600'}`}>
      {iconMap[estado]}
      {label[estado] ?? estado}
    </span>
  );
};

const ModalidadBadge = ({ modalidad }: { modalidad: string }) => {
  const map: Record<string, string> = {
    REMOTO:     'bg-blue-100 text-blue-700',
    HIBRIDO:    'bg-violet-100 text-violet-700',
    PRESENCIAL: 'bg-slate-100 text-slate-700',
  };
  const label: Record<string, string> = {
    REMOTO:     'Remoto',
    HIBRIDO:    'Híbrido',
    PRESENCIAL: 'Presencial',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${map[modalidad] ?? 'bg-slate-100 text-slate-600'}`}>
      {label[modalidad] ?? modalidad}
    </span>
  );
};

const CATEGORIAS_DATA = [
  { nombre: 'Tecnología',       color: 'from-blue-500 to-indigo-600',  icono: '💻' },
  { nombre: 'Diseño',           color: 'from-pink-500 to-rose-500',    icono: '🎨' },
  { nombre: 'Datos & Analytics',color: 'from-emerald-500 to-teal-600', icono: '📊' },
  { nombre: 'Gestión',          color: 'from-violet-500 to-purple-600',icono: '📋' },
  { nombre: 'Marketing',        color: 'from-orange-500 to-amber-500', icono: '📣' },
  { nombre: 'Finanzas',         color: 'from-cyan-500 to-sky-600',     icono: '💰' },
  { nombre: 'RRHH',             color: 'from-rose-400 to-pink-500',    icono: '🤝' },
];

const CategoriasView = () => (
  <div className="space-y-5">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Tag className="w-5 h-5 text-violet-600" />
        <span className="text-base font-semibold text-slate-700">{CATEGORIAS_DATA.length} categorías registradas</span>
      </div>
      <button className="flex items-center gap-2 border border-violet-300 text-violet-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-violet-50 transition-colors">
        <Plus className="w-4 h-4" /> Nueva Categoría
      </button>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {CATEGORIAS_DATA.map((cat) => (
        <div key={cat.nombre} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer group">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-2xl mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
            {cat.icono}
          </div>
          <h3 className="font-semibold text-slate-800 mb-1">{cat.nombre}</h3>
          <div className="flex items-center gap-1 text-xs text-emerald-600 mt-2">
            <TrendingUp className="w-3 h-3" /> Activa
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ─── Modal de Rechazo ──────────────────────────────────────────────────────────
const RechazarModal = ({
  titulo,
  onConfirm,
  onCancel,
}: {
  titulo: string;
  onConfirm: (motivo: string) => void;
  onCancel: () => void;
}) => {
  const [motivo, setMotivo] = useState('');
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-1">Rechazar oferta</h2>
        <p className="text-sm text-slate-500 mb-4">
          Estás rechazando: <span className="font-medium text-slate-700">"{titulo}"</span>
        </p>
        <label className="block text-sm font-medium text-slate-700 mb-2">Motivo (opcional)</label>
        <textarea
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Indica el motivo del rechazo para que la empresa pueda corregirlo..."
          className="w-full h-24 px-4 py-3 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-rose-400"
        />
        <div className="flex gap-3 mt-5">
          <button onClick={onCancel} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(motivo)}
            className="flex-1 px-4 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-medium hover:bg-rose-700 transition-colors"
          >
            Confirmar rechazo
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Vista Principal ────────────────────────────────────────────────────────────
export const AdminOfertasView = () => {
  const location  = useLocation();
  const navigate  = useNavigate();

  const getTabFromPath = (path: string): 'lista' | 'categorias' =>
    path.includes('categorias') ? 'categorias' : 'lista';

  const [activeTab, setActiveTab]       = useState<'lista' | 'categorias'>(getTabFromPath(location.pathname));
  const [search, setSearch]             = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoFiltro>('Todos');
  const [page, setPage]                 = useState(0);

  const [jobsData, setJobsData]         = useState<PageResponse<OfertaResponse> | null>(null);
  const [isLoading, setIsLoading]       = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rechazarTarget, setRechazarTarget] = useState<{ id: string; titulo: string } | null>(null);
  const [viewingJob, setViewingJob]     = useState<OfertaResponse | null>(null);

  // Stats derivadas de los datos del backend
  const totalOfertas    = jobsData?.totalElements ?? 0;
  const pendientes      = jobsData?.content.filter((j) => j.estado === 'PENDIENTE_APROBACION').length ?? 0;
  const publicadas      = jobsData?.content.filter((j) => j.estado === 'PUBLICADA').length ?? 0;
  const rechazadas      = jobsData?.content.filter((j) => j.estado === 'RECHAZADA').length ?? 0;

  // Sync tab con URL
  useEffect(() => {
    setActiveTab(getTabFromPath(location.pathname));
  }, [location.pathname]);

  const fetchOfertas = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, any> = { size: 15, page };
      if (estadoFiltro !== 'Todos') params.estado = estadoFiltro;
      if (search.trim()) params.q = search.trim();
      const data = await jobService.getAllJobsAdmin(params);
      setJobsData(data);
    } catch (err) {
      alerts.error('Error', 'Error al cargar las ofertas. Recarga la página.');
    } finally {
      setIsLoading(false);
    }
  }, [estadoFiltro, search, page]);

  useEffect(() => {
    if (activeTab === 'lista') fetchOfertas();
  }, [activeTab, fetchOfertas]);

  const handleAprobar = async (id: string) => {
    const res = await alerts.confirm('¿Aprobar oferta?', 'La oferta será publicada y visible para los estudiantes.');
    if (!res.isConfirmed) return;

    setActionLoading(id + '_aprobar');
    try {
      await jobService.approveJob(id);
      alerts.success('Oferta aprobada', 'La oferta ha sido publicada correctamente.');
      fetchOfertas();
    } catch {
      alerts.error('Error', 'Error al aprobar la oferta');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRechazar = async (id: string, motivo: string) => {
    setActionLoading(id + '_rechazar');
    try {
      await jobService.rejectJob(id, motivo);
      alerts.success('Oferta rechazada', 'La empresa será notificada del motivo.');
      fetchOfertas();
    } catch {
      alerts.error('Error', 'Error al rechazar la oferta');
    } finally {
      setActionLoading(null);
    }
  };

  const STATS = [
    { label: 'Total Ofertas',        value: String(totalOfertas), icon: Briefcase,    bg: 'bg-violet-50',  text: 'text-violet-600' },
    { label: 'Pendientes de Revisión',value: String(pendientes),  icon: Clock,        bg: 'bg-amber-50',   text: 'text-amber-600'  },
    { label: 'Publicadas',            value: String(publicadas),  icon: CheckCircle,  bg: 'bg-emerald-50', text: 'text-emerald-600'},
    { label: 'Rechazadas',            value: String(rechazadas),  icon: XCircle,      bg: 'bg-rose-50',    text: 'text-rose-600'   },
  ];

  const ESTADOS: EstadoFiltro[] = ['Todos', 'PENDIENTE_APROBACION', 'PUBLICADA', 'BORRADOR', 'RECHAZADA', 'PAUSADA', 'CERRADA'];
  const ESTADO_LABEL: Record<EstadoFiltro, string> = {
    Todos:                'Todos',
    PENDIENTE_APROBACION: 'Pendientes',
    PUBLICADA:            'Publicadas',
    BORRADOR:             'Borradores',
    RECHAZADA:            'Rechazadas',
    PAUSADA:              'Pausadas',
    CERRADA:              'Cerradas',
  };

  const ofertas = jobsData?.content ?? [];
  const totalPages = jobsData?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      {/* Modal rechazo */}
      {rechazarTarget && (
        <RechazarModal
          titulo={rechazarTarget.titulo}
          onConfirm={(motivo) => handleRechazar(rechazarTarget.id, motivo)}
          onCancel={() => setRechazarTarget(null)}
        />
      )}

      {/* Modal ver detalle */}
      {viewingJob && (
        <ViewJobModal
          job={viewingJob}
          onClose={() => setViewingJob(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gestión de Ofertas</h1>
          <p className="text-sm text-slate-500 mt-1">Revisa y aprueba las ofertas enviadas por las empresas</p>
        </div>
        {pendientes > 0 && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2 rounded-xl text-sm font-medium">
            <Clock className="w-4 h-4" />
            {pendientes} pendiente{pendientes > 1 ? 's' : ''} de revisión
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-5 border border-slate-200 hover:shadow-md transition-shadow">
            <div className={`w-11 h-11 ${s.bg} rounded-xl flex items-center justify-center mb-4`}>
              <s.icon className={`w-5 h-5 ${s.text}`} />
            </div>
            <div className="text-2xl font-bold text-slate-800">{s.value}</div>
            <div className="text-sm text-slate-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {(['lista', 'categorias'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              navigate(tab === 'lista' ? '/admin/ofertas/listado' : '/admin/ofertas/categorias');
            }}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab === 'lista' ? 'Listado de Ofertas' : 'Categorías'}
          </button>
        ))}
      </div>

      {activeTab === 'lista' ? (
        <>
          {/* Filtros rápidos por estado */}
          <div className="flex flex-wrap gap-2">
            {ESTADOS.map((e) => (
              <button
                key={e}
                onClick={() => { setEstadoFiltro(e); setPage(0); }}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all border ${
                  estadoFiltro === e
                    ? 'bg-violet-600 text-white border-violet-600 shadow-md'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300 hover:text-violet-700'
                }`}
              >
                {ESTADO_LABEL[e]}
                {e === 'PENDIENTE_APROBACION' && pendientes > 0 && (
                  <span className="ml-1.5 bg-amber-400 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {pendientes}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Buscador */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por título..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>
              <button onClick={fetchOfertas} className="px-4 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 transition-colors flex items-center gap-2">
                <Filter className="w-4 h-4" /> Filtrar
              </button>
            </div>
          </div>

          {/* Tabla */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Oferta</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Modalidad</th>
                    <th className="text-center px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Postulantes</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                    <th className="text-right px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="py-16 text-center">
                        <Loader2 className="w-8 h-8 text-violet-500 animate-spin mx-auto mb-2" />
                        <p className="text-sm text-slate-500">Cargando ofertas...</p>
                      </td>
                    </tr>
                  ) : ofertas.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-16 text-center">
                        <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 font-medium">No se encontraron ofertas</p>
                        <p className="text-sm text-slate-400 mt-1">Intenta cambiar los filtros</p>
                      </td>
                    </tr>
                  ) : (
                    ofertas.map((oferta) => {
                      const isPending    = oferta.estado === 'PENDIENTE_APROBACION';
                      const loadAprobar  = actionLoading === oferta.id + '_aprobar';
                      const loadRechazar = actionLoading === oferta.id + '_rechazar';

                      return (
                        <tr
                          key={oferta.id}
                          className={`hover:bg-slate-50/60 transition-colors group ${isPending ? 'bg-amber-50/30' : ''}`}
                        >
                          {/* Oferta */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                {oferta.titulo.substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-slate-800 group-hover:text-violet-700 transition-colors">
                                  {oferta.titulo}
                                </div>
                                <div className="flex items-center gap-1 mt-0.5">
                                  {oferta.ubicacion && (
                                    <>
                                      <MapPin className="w-3 h-3 text-slate-400" />
                                      <span className="text-xs text-slate-400">{oferta.ubicacion}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Modalidad */}
                          <td className="px-4 py-4 hidden md:table-cell">
                            <ModalidadBadge modalidad={oferta.modalidad ?? ''} />
                          </td>

                          {/* Postulantes */}
                          <td className="px-4 py-4 text-center hidden lg:table-cell">
                            <div className="flex items-center justify-center gap-1">
                              <Users className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-sm font-semibold text-slate-700">{oferta.numeroPostulaciones}</span>
                            </div>
                          </td>

                          {/* Estado */}
                          <td className="px-4 py-4">
                            <EstadoBadge estado={oferta.estado} />
                          </td>

                          {/* Acciones */}
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              {/* Ver */}
                              <button 
                                onClick={() => setViewingJob(oferta)}
                                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-violet-600" 
                                title="Ver oferta"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {/* Aprobar — solo si está PENDIENTE */}
                              {isPending && (
                                <>
                                  <button
                                    onClick={() => handleAprobar(oferta.id)}
                                    disabled={!!actionLoading}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                                    title="Aprobar oferta"
                                  >
                                    {loadAprobar ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                                    Aprobar
                                  </button>
                                  <button
                                    onClick={async () => {
                                      const res = await alerts.promptReason('Rechazar oferta');
                                      if (res.isConfirmed && res.value) {
                                        handleRechazar(oferta.id, res.value);
                                      }
                                    }}
                                    disabled={!!actionLoading}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 transition-colors disabled:opacity-50"
                                    title="Rechazar oferta"
                                  >
                                    {loadRechazar ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                                    Rechazar
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {!isLoading && ofertas.length > 0 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
                <p className="text-sm text-slate-500">
                  Página <span className="font-semibold text-slate-700">{page + 1}</span> de{' '}
                  <span className="font-semibold text-slate-700">{totalPages}</span>
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="w-8 h-8 rounded-lg bg-violet-600 text-white text-sm font-medium flex items-center justify-center">
                    {page + 1}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-600 disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <CategoriasView />
      )}
    </div>
  );
};
