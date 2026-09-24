import { useState, useEffect } from 'react';
import { TrendingUp, MoreVertical, Loader2 } from 'lucide-react';
import { adminService } from '../services/admin.service';

export const AdminDashboardView = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    // Ofertas
    totalOfertas: 0,
    ofertasActivas: 0,
    ofertasPendientes: 0,
    ofertasBorrador: 0,
    // Usuarios
    totalUsuarios: 0,
    totalCandidatos: 0,
    totalEmpresas: 0,
    empresasPendientes: 0,
    empresasVerificadas: 0,
    candidatosPct: 0,
    empresasPct: 0,
    // Postulaciones
    totalPostulaciones: 0,
    postulacionesMes: 0,
    // Salud y Latencias de Microservicios
    usuariosStatus: 'Activo',
    usuariosLatency: 0,
    ofertasStatus: 'Activo',
    ofertasLatency: 0,
    postulacionesStatus: 'Activo',
    postulacionesLatency: 0,
    activeServicesCount: 3,
    operativosPct: 100,
    disponibilidadPct: 100,
    averageLatency: 0,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // 1. Fetch usuarios-service stats & latency
        let uStats = {
          totalUsuarios: 0,
          totalCandidatos: 0,
          totalEmpresas: 0,
          empresasPendientes: 0,
          empresasVerificadas: 0,
          empresasRechazadas: 0,
          empresasSuspendidas: 0,
        };
        let uStatus = 'Inactivo';
        let uLatency = 0;
        try {
          const t0 = performance.now();
          uStats = await adminService.getUsuariosStats();
          uLatency = Math.max(1, Math.round(performance.now() - t0));
          uStatus = 'Activo';
        } catch (e) {
          console.error('Error conectando a usuarios-service:', e);
        }

        // 2. Fetch ofertas-service stats & latency
        let oStats = {
          totalOfertas: 0,
          publicadas: 0,
          pendientes: 0,
          borradores: 0,
        };
        let oStatus = 'Inactivo';
        let oLatency = 0;
        try {
          const t0 = performance.now();
          oStats = await adminService.getOfertasStats();
          oLatency = Math.max(1, Math.round(performance.now() - t0));
          oStatus = 'Activo';
        } catch (e) {
          console.error('Error conectando a ofertas-service:', e);
        }

        // 3. Fetch postulaciones-service stats & latency
        let pStats = {
          totalPostulaciones: 0,
          postulacionesMes: 0,
        };
        let pStatus = 'Inactivo';
        let pLatency = 0;
        try {
          const t0 = performance.now();
          pStats = await adminService.getPostulacionesStats();
          pLatency = Math.max(1, Math.round(performance.now() - t0));
          pStatus = 'Activo';
        } catch (e) {
          console.error('Error conectando a postulaciones-service:', e);
        }

        // Cálculos de porcentajes y promedios reales
        const totalU = uStats.totalUsuarios || 0;
        const totalC = uStats.totalCandidatos || 0;
        const totalE = uStats.totalEmpresas || 0;
        const candPct = totalU > 0 ? Math.round((totalC / totalU) * 100) : 0;
        const empPct = totalU > 0 ? Math.round((totalE / totalU) * 100) : 0;

        const activeCount = (uStatus === 'Activo' ? 1 : 0) + (oStatus === 'Activo' ? 1 : 0) + (pStatus === 'Activo' ? 1 : 0);
        const opPct = Math.round((activeCount / 3) * 100);
        const dispPct = opPct;

        const latencies = [uLatency, oLatency, pLatency].filter(l => l > 0);
        const avgLat = latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0;

        setStats({
          totalOfertas: oStats.totalOfertas || 0,
          ofertasActivas: oStats.publicadas || 0,
          ofertasPendientes: oStats.pendientes || 0,
          ofertasBorrador: oStats.borradores || 0,
          totalUsuarios: totalU,
          totalCandidatos: totalC,
          totalEmpresas: totalE,
          empresasPendientes: uStats.empresasPendientes || 0,
          empresasVerificadas: uStats.empresasVerificadas || 0,
          candidatosPct: candPct,
          empresasPct: empPct,
          totalPostulaciones: pStats.totalPostulaciones || 0,
          postulacionesMes: pStats.postulacionesMes || 0,
          usuariosStatus: uStatus,
          usuariosLatency: uLatency,
          ofertasStatus: oStatus,
          ofertasLatency: oLatency,
          postulacionesStatus: pStatus,
          postulacionesLatency: pLatency,
          activeServicesCount: activeCount,
          operativosPct: opPct,
          disponibilidadPct: dispPct,
          averageLatency: avgLat,
        });
      } catch (err) {
        console.error('Error general cargando estadísticas del dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Row - Analytics Card + Sales Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Website Analytics - Large Card */}
        <div className="lg:col-span-2 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl p-8 text-white relative overflow-hidden">
          {/* Decorative dots */}
          <div className="absolute top-4 right-4 flex gap-1">
            <div className="w-2 h-2 bg-white/30 rounded-full"></div>
            <div className="w-2 h-2 bg-white/50 rounded-full"></div>
            <div className="w-2 h-2 bg-white/70 rounded-full"></div>
          </div>

          <div className="relative z-10">
            <h3 className="text-lg font-semibold mb-1">Estadísticas Generales</h3>
            <p className="text-white/80 text-sm mb-6">Métricas en tiempo real de la plataforma</p>

            <div className="flex items-center gap-8 mb-6">
              <div>
                <div className="text-3xl font-bold mb-1">
                  {loading ? <Loader2 className="w-7 h-7 animate-spin" /> : stats.totalOfertas}
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <span className="font-semibold">{loading ? '-' : stats.totalOfertas}</span>
                    <div className="text-white/70">Ofertas Totales</div>
                  </div>
                  <div>
                    <span className="font-semibold">{loading ? '-' : stats.ofertasActivas}</span>
                    <div className="text-white/70">Publicadas</div>
                  </div>
                </div>
              </div>
              
              <div>
                <div className="flex items-center gap-4 text-sm mt-8">
                  <div>
                    <span className="font-semibold">{loading ? '-' : stats.ofertasPendientes}</span>
                    <div className="text-white/70">Pendientes de Aprobación</div>
                  </div>
                  <div>
                    <span className="font-semibold">{loading ? '-' : stats.ofertasBorrador}</span>
                    <div className="text-white/70">Borradores</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3D Sphere Illustration */}
            <div className="absolute right-8 top-1/2 -translate-y-1/2">
              <div className="relative w-48 h-48">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-400 to-blue-300 rounded-full opacity-90 blur-2xl"></div>
                <div className="absolute inset-4 bg-gradient-to-br from-indigo-300 to-violet-400 rounded-full opacity-80 blur-xl"></div>
                <div className="absolute inset-8 bg-gradient-to-br from-white/40 to-violet-200/40 rounded-full backdrop-blur-sm"></div>
                {/* Layered rings effect */}
                <div className="absolute inset-6 border-2 border-white/20 rounded-full"></div>
                <div className="absolute inset-10 border-2 border-white/30 rounded-full"></div>
                <div className="absolute inset-14 border-2 border-white/40 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Sales Overview Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-emerald-600 text-sm font-medium mb-1 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                {stats.empresasPendientes > 0
                  ? `${stats.empresasPendientes} por verificar`
                  : stats.totalEmpresas > 0
                    ? `${stats.empresasVerificadas}/${stats.totalEmpresas} Verificadas`
                    : 'Sistema al día'}
              </div>
              <div className="text-3xl font-bold text-slate-800">
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : stats.totalUsuarios}
              </div>
              <div className="text-xs text-slate-400">Total Usuarios Registrados</div>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-700">Candidatos</div>
                  <div className="text-xs text-slate-500">{stats.totalCandidatos} registrados</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-slate-800">{stats.candidatosPct}%</div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-violet-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-700">Empresas</div>
                  <div className="text-xs text-slate-500">
                    {stats.totalEmpresas} reg. ({stats.empresasPendientes} pend.)
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-slate-800">{stats.empresasPct}%</div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-blue-500 transition-all duration-500"
              style={{ width: `${stats.candidatosPct}%` }}
            ></div>
            <div
              className="h-full bg-violet-500 transition-all duration-500"
              style={{ width: `${stats.empresasPct}%` }}
            ></div>
          </div>

          {/* Postulaciones Mes */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-sm text-slate-600">Postulaciones del Mes</div>
                <div className="text-xs text-slate-400">Total histórico: {stats.totalPostulaciones}</div>
              </div>
              <div className="text-2xl font-bold text-slate-800">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : stats.postulacionesMes}
              </div>
            </div>
            
            {/* Mini Area Chart */}
            <svg className="w-full h-16" viewBox="0 0 300 80" preserveAspectRatio="none">
              <defs>
                <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0,60 L30,45 L60,50 L90,30 L120,35 L150,25 L180,40 L210,20 L240,30 L270,15 L300,25 L300,80 L0,80 Z"
                fill="url(#areaGradient)"
              />
              <path
                d="M0,60 L30,45 L60,50 L90,30 L120,35 L150,25 L180,40 L210,20 L240,30 L270,15 L300,25"
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Second Row - Earning Reports + Support Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Earning Reports / Servicios Backend */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">Servicios Backend</h3>
              <p className="text-sm text-slate-500">Estado y Actividad de los Microservicios</p>
            </div>
            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors" title="Opciones">
              <MoreVertical className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Amount Display */}
          <div className="mb-6">
            <div className="text-4xl font-bold text-slate-800 mb-2">
              {stats.activeServicesCount} Activo{stats.activeServicesCount === 1 ? '' : 's'}
            </div>
            <div className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-600 rounded text-sm font-medium">
              <TrendingUp className="w-3 h-3" />
              {stats.operativosPct}% Operativos
            </div>
          </div>

          <p className="text-sm text-slate-500 mb-6">
            {stats.activeServicesCount === 3
              ? 'Todos los microservicios están en línea y respondiendo en tiempo real'
              : `${stats.activeServicesCount} de 3 servicios responden actualmente`}
          </p>

          {/* Bar Chart representing services health */}
          <div className="flex items-end justify-between h-32 gap-2 mb-6">
            {[
              { name: 'Usuarios', height: stats.usuariosStatus === 'Activo' ? 90 : 20, active: stats.usuariosStatus === 'Activo' },
              { name: 'Ofertas', height: stats.ofertasStatus === 'Activo' ? 95 : 20, active: stats.ofertasStatus === 'Activo' },
              { name: 'Postulaciones', height: stats.postulacionesStatus === 'Activo' ? 85 : 20, active: stats.postulacionesStatus === 'Activo' },
            ].map((srv, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className={`w-full rounded-t-lg transition-all ${srv.active ? 'bg-violet-600' : 'bg-red-400'}`}
                  style={{ height: `${srv.height}%` }}
                ></div>
              </div>
            ))}
          </div>

          {/* Services Icons & Response Times */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-6">
            <div className="flex items-center gap-2">
              {/* Usuarios Service */}
              <div className="flex flex-col items-center gap-2">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stats.usuariosStatus === 'Activo' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                </div>
                <span className="text-xs text-slate-600 font-medium">Usuarios</span>
              </div>
              
              {/* Ofertas Service */}
              <div className="flex flex-col items-center gap-2 ml-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stats.ofertasStatus === 'Activo' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                    <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
                  </svg>
                </div>
                <span className="text-xs text-slate-600 font-medium">Ofertas</span>
              </div>
              
              {/* Postulaciones Service */}
              <div className="flex flex-col items-center gap-2 ml-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stats.postulacionesStatus === 'Activo' ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-400'}`}>
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-xs text-slate-600 font-medium">Postulaciones</span>
              </div>
            </div>

            {/* Response Times */}
            <div className="flex items-center gap-6 text-sm">
              <div className="text-center">
                <div className="font-bold text-slate-800">{stats.usuariosLatency > 0 ? `${stats.usuariosLatency}ms` : '-'}</div>
                <div className="text-xs text-slate-500">Usuarios</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-slate-800">{stats.ofertasLatency > 0 ? `${stats.ofertasLatency}ms` : '-'}</div>
                <div className="text-xs text-slate-500">Ofertas</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-slate-800">{stats.postulacionesLatency > 0 ? `${stats.postulacionesLatency}ms` : '-'}</div>
                <div className="text-xs text-slate-500">Postulaciones</div>
              </div>
            </div>
          </div>
        </div>

        {/* Support Tracker / Estado del Sistema */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">Estado del Sistema</h3>
              <p className="text-sm text-slate-500">Monitoreo en Vivo</p>
            </div>
            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors" title="Opciones">
              <MoreVertical className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Circular Progress */}
          <div className="flex items-center justify-center mb-6">
            <div className="relative w-48 h-48">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 40 * (stats.disponibilidadPct / 100)} ${2 * Math.PI * 40}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-xs text-slate-500 mb-1">Disponibilidad</div>
                <div className="text-4xl font-bold text-slate-800">{stats.disponibilidadPct}%</div>
              </div>
            </div>
          </div>

          {/* Total Usuarios */}
          <div className="text-center mb-6">
            <div className="text-3xl font-bold text-slate-800 mb-1">
              {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : stats.totalUsuarios}
            </div>
            <div className="text-sm text-slate-500">Total Usuarios en PostgreSQL</div>
          </div>

          {/* Services Status */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-slate-700">Servicio Usuarios</div>
                <div className="text-xs text-slate-400">Puerto 8081</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${stats.usuariosStatus === 'Activo' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className={`text-xs font-semibold ${stats.usuariosStatus === 'Activo' ? 'text-emerald-600' : 'text-red-600'}`}>
                {stats.usuariosStatus}
              </span>
            </div>
          </div>

          {/* Response Time */}
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                <path strokeWidth="2" strokeLinecap="round" d="M12 6v6l4 2"/>
              </svg>
            </div>
            <div>
              <div className="text-sm font-medium text-slate-700">Tiempo Promedio</div>
              <div className="text-xs text-slate-500">
                {stats.averageLatency > 0 ? `${stats.averageLatency}ms respuesta` : 'Sin respuesta'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
