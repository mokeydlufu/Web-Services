import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Briefcase, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { jobService } from '../../jobs/services/job.service';
import type { OfertaResponse } from '../../jobs/types/job.types';

export const AdminEstadisticasView = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOfertas: 0,
    publicadas: 0,
    pendientes: 0,
    borradores: 0,
    remoto: 0,
    presencial: 0,
    hibrido: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const resp = await jobService.getAllJobsAdmin({ page: 0, size: 200 });
        const items: OfertaResponse[] = resp.content || [];

        const publicadas = items.filter(o => o.estado === 'PUBLICADA').length;
        const pendientes = items.filter(o => o.estado === 'PENDIENTE_APROBACION').length;
        const borradores = items.filter(o => o.estado === 'BORRADOR').length;

        const remoto = items.filter(o => o.modalidad === 'REMOTO').length;
        const presencial = items.filter(o => o.modalidad === 'PRESENCIAL').length;
        const hibrido = items.filter(o => o.modalidad === 'HIBRIDO').length;

        setStats({
          totalOfertas: items.length,
          publicadas,
          pendientes,
          borradores,
          remoto,
          presencial,
          hibrido,
        });
      } catch (err) {
        console.error('Error al cargar métricas de estadísticas:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
          <BarChart3 className="w-6 h-6 text-violet-600" />
          Estadísticas y Analíticas
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Métricas consolidadas de actividad, rendimiento y distribución de ofertas en EmpleaPro.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Total Ofertas</span>
            <Briefcase className="w-5 h-5 text-violet-600" />
          </div>
          <div className="text-3xl font-bold text-slate-900">
            {loading ? <Loader2 className="w-6 h-6 animate-spin text-violet-600" /> : stats.totalOfertas}
          </div>
          <p className="text-xs text-slate-500 mt-1">Registradas en la plataforma</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Ofertas Publicadas</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-3xl font-bold text-emerald-600">
            {loading ? <Loader2 className="w-6 h-6 animate-spin text-emerald-600" /> : stats.publicadas}
          </div>
          <p className="text-xs text-slate-500 mt-1">Visibles para candidatos</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Pendientes Revisión</span>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-3xl font-bold text-amber-600">
            {loading ? <Loader2 className="w-6 h-6 animate-spin text-amber-600" /> : stats.pendientes}
          </div>
          <p className="text-xs text-slate-500 mt-1">Esperando aprobación</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Borradores</span>
            <TrendingUp className="w-5 h-5 text-slate-500" />
          </div>
          <div className="text-3xl font-bold text-slate-700">
            {loading ? <Loader2 className="w-6 h-6 animate-spin text-slate-600" /> : stats.borradores}
          </div>
          <p className="text-xs text-slate-500 mt-1">En edición por empresas</p>
        </div>
      </div>

      {/* Distribución por Modalidad */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Distribución de Empleos por Modalidad</h2>
        <p className="text-slate-500 text-sm">
          Proporción de modalidades de trabajo registradas en las ofertas activas:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase text-blue-600">Remoto</span>
              <div className="text-2xl font-bold text-blue-900 mt-1">{stats.remoto}</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
              💻
            </div>
          </div>

          <div className="p-4 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase text-violet-600">Híbrido</span>
              <div className="text-2xl font-bold text-violet-900 mt-1">{stats.hibrido}</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center text-violet-600 font-bold">
              🏢
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase text-slate-600">Presencial</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">{stats.presencial}</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center text-slate-600 font-bold">
              📍
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
