import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Users, Shield, Store, Search, CheckCircle2, XCircle, AlertTriangle, Building2, UserCheck, Loader2 } from 'lucide-react';
import { adminService, type AdminEmpresa, type AdminCandidato, type UsuariosStats } from '../services/admin.service';

type UsuarioTab = 'todos' | 'candidatos' | 'empresas' | 'roles';

export const AdminUsuariosView = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const getTabFromPath = (path: string): UsuarioTab => {
    if (path.includes('candidatos')) return 'candidatos';
    if (path.includes('empresas')) return 'empresas';
    if (path.includes('roles')) return 'roles';
    return 'todos';
  };

  const [activeTab, setActiveTab] = useState<UsuarioTab>(getTabFromPath(location.pathname));
  const [searchTerm, setSearchTerm] = useState('');
  
  // Empresas state
  const [empresas, setEmpresas] = useState<AdminEmpresa[]>([]);
  const [loadingEmpresas, setLoadingEmpresas] = useState(false);
  const [filtroEstadoEmpresa, setFiltroEstadoEmpresa] = useState<string>('TODAS');

  // Candidatos state
  const [candidatos, setCandidatos] = useState<AdminCandidato[]>([]);
  const [loadingCandidatos, setLoadingCandidatos] = useState(false);

  // Global stats state
  const [stats, setStats] = useState<UsuariosStats | null>(null);

  useEffect(() => {
    setActiveTab(getTabFromPath(location.pathname));
  }, [location.pathname]);

  // Cargar estadísticas generales
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await adminService.getUsuariosStats();
        setStats(data);
      } catch (err) {
        console.error('Error al cargar estadísticas de usuarios:', err);
      }
    };
    fetchStats();
  }, []);

  // Cargar Empresas desde /api/admin/empresas
  const loadEmpresas = async (estado?: string) => {
    try {
      setLoadingEmpresas(true);
      const data = await adminService.getEmpresas(estado);
      setEmpresas(data || []);
    } catch (err) {
      console.error('Error al cargar empresas administrativas:', err);
    } finally {
      setLoadingEmpresas(false);
    }
  };

  // Cargar Candidatos desde /api/admin/candidatos
  const loadCandidatos = async () => {
    try {
      setLoadingCandidatos(true);
      const data = await adminService.getCandidatos();
      setCandidatos(data || []);
    } catch (err) {
      console.error('Error al cargar candidatos administrativos:', err);
    } finally {
      setLoadingCandidatos(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'empresas' || activeTab === 'todos') {
      loadEmpresas(filtroEstadoEmpresa);
    }
    if (activeTab === 'candidatos' || activeTab === 'todos') {
      loadCandidatos();
    }
  }, [activeTab, filtroEstadoEmpresa]);

  const handleTabChange = (tab: UsuarioTab) => {
    setActiveTab(tab);
    if (tab === 'todos') navigate('/admin/usuarios/listado');
    else if (tab === 'candidatos') navigate('/admin/usuarios/candidatos');
    else if (tab === 'empresas') navigate('/admin/usuarios/empresas');
    else if (tab === 'roles') navigate('/admin/usuarios/roles');
  };

  const handleAprobarEmpresa = async (id: string) => {
    try {
      await adminService.aprobarEmpresa(id);
      await loadEmpresas(filtroEstadoEmpresa);
    } catch (err) {
      console.error('Error al aprobar empresa:', err);
    }
  };

  const handleRechazarEmpresa = async (id: string) => {
    const motivo = window.prompt('Ingresa el motivo del rechazo:');
    if (!motivo) return;
    try {
      await adminService.rechazarEmpresa(id, motivo);
      await loadEmpresas(filtroEstadoEmpresa);
    } catch (err) {
      console.error('Error al rechazar empresa:', err);
    }
  };

  const handleSuspenderEmpresa = async (id: string) => {
    if (!window.confirm('¿Estás seguro de suspender esta empresa?')) return;
    try {
      await adminService.suspenderEmpresa(id);
      await loadEmpresas(filtroEstadoEmpresa);
    } catch (err) {
      console.error('Error al suspender empresa:', err);
    }
  };

  // Filtrado local por término de búsqueda
  const empresasFiltradas = empresas.filter(emp => {
    const term = searchTerm.toLowerCase();
    return (
      emp.razonSocial?.toLowerCase().includes(term) ||
      emp.nombreComercial?.toLowerCase().includes(term) ||
      emp.ruc?.includes(term) ||
      emp.email?.toLowerCase().includes(term)
    );
  });

  const candidatosFiltrados = candidatos.filter(cand => {
    const term = searchTerm.toLowerCase();
    const nombreCompleto = `${cand.nombres || ''} ${cand.apellidos || ''}`.toLowerCase();
    return (
      nombreCompleto.includes(term) ||
      cand.dni?.includes(term) ||
      cand.email?.toLowerCase().includes(term) ||
      cand.ubicacion?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Users className="w-6 h-6 text-violet-600" />
            Gestión de Usuarios
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Administra los accesos, empresas registradas, candidatos y roles del sistema.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => handleTabChange('todos')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 transition-colors relative ${activeTab === 'todos'
              ? 'text-violet-600'
              : 'text-slate-500 hover:text-slate-800'
            }`}
        >
          <Users className="w-4 h-4" />
          Todos los Usuarios
          {activeTab === 'todos' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-violet-600 rounded-full" />
          )}
        </button>

        <button
          onClick={() => handleTabChange('candidatos')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 transition-colors relative ${activeTab === 'candidatos'
              ? 'text-violet-600'
              : 'text-slate-500 hover:text-slate-800'
            }`}
        >
          <UserCheck className="w-4 h-4" />
          Candidatos
          {candidatos.length > 0 && (
            <span className="px-2 py-0.5 text-xs bg-violet-100 text-violet-700 rounded-full font-bold">
              {candidatos.length}
            </span>
          )}
          {activeTab === 'candidatos' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-violet-600 rounded-full" />
          )}
        </button>

        <button
          onClick={() => handleTabChange('empresas')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 transition-colors relative ${activeTab === 'empresas'
              ? 'text-violet-600'
              : 'text-slate-500 hover:text-slate-800'
            }`}
        >
          <Store className="w-4 h-4" />
          Empresas
          {empresas.length > 0 && (
            <span className="px-2 py-0.5 text-xs bg-violet-100 text-violet-700 rounded-full font-bold">
              {empresas.length}
            </span>
          )}
          {activeTab === 'empresas' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-violet-600 rounded-full" />
          )}
        </button>

        <button
          onClick={() => handleTabChange('roles')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 transition-colors relative ${activeTab === 'roles'
              ? 'text-violet-600'
              : 'text-slate-500 hover:text-slate-800'
            }`}
        >
          <Shield className="w-4 h-4" />
          Roles y Permisos
          {activeTab === 'roles' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-violet-600 rounded-full" />
          )}
        </button>
      </div>

      {/* Tab: Candidatos */}
      {activeTab === 'candidatos' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar candidato por nombre, DNI o correo..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>

          {loadingCandidatos ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm flex items-center justify-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-violet-600" />
              <span className="text-slate-600 text-sm">Cargando candidatos...</span>
            </div>
          ) : candidatosFiltrados.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
              <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-violet-600">
                <UserCheck className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                No se encontraron candidatos
              </h3>
              <p className="text-slate-500 text-sm max-w-md mx-auto">
                No hay candidatos registrados que coincidan con la búsqueda.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3">Candidato</th>
                    <th className="px-6 py-3">DNI</th>
                    <th className="px-6 py-3">Correo</th>
                    <th className="px-6 py-3">Título / Ubicación</th>
                    <th className="px-6 py-3">Estado Cuenta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {candidatosFiltrados.map((cand) => (
                    <tr key={cand.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">
                          {cand.nombres} {cand.apellidos}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-600">
                        {cand.dni || '-'}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {cand.email}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-slate-800 font-medium">{cand.tituloProfesional || 'Profesional'}</div>
                        <div className="text-xs text-slate-400">{cand.ubicacion || 'Perú'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          cand.estadoCuenta === 'ACTIVA'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          <CheckCircle2 className="w-3 h-3" />
                          {cand.estadoCuenta || 'ACTIVA'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Empresas */}
      {activeTab === 'empresas' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar empresa por razón social, nombre comercial o RUC..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            {/* Filtro por estado para el Administrador */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-medium text-slate-500 whitespace-nowrap">Estado:</span>
              <select
                value={filtroEstadoEmpresa}
                onChange={(e) => setFiltroEstadoEmpresa(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="TODAS">TODAS</option>
                <option value="PENDIENTE">PENDIENTE</option>
                <option value="VERIFICADA">VERIFICADA</option>
                <option value="RECHAZADA">RECHAZADA</option>
                <option value="SUSPENDIDA">SUSPENDIDA</option>
              </select>
            </div>
          </div>

          {loadingEmpresas ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm flex items-center justify-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-violet-600" />
              <span className="text-slate-600 text-sm">Cargando empresas registradas...</span>
            </div>
          ) : empresasFiltradas.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
              <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-violet-600">
                <Building2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                No se encontraron empresas
              </h3>
              <p className="text-slate-500 text-sm max-w-md mx-auto">
                No hay empresas con estado "{filtroEstadoEmpresa}" o que coincidan con la búsqueda.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3">Empresa</th>
                    <th className="px-6 py-3">RUC</th>
                    <th className="px-6 py-3">Industria / Ubicación</th>
                    <th className="px-6 py-3">Estado</th>
                    <th className="px-6 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {empresasFiltradas.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{emp.razonSocial}</div>
                        {emp.nombreComercial && (
                          <div className="text-xs text-slate-400">{emp.nombreComercial}</div>
                        )}
                        <div className="text-xs text-slate-500">{emp.email}</div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-600">
                        {emp.ruc || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-slate-800 font-medium">{emp.industria || 'General'}</div>
                        <div className="text-xs text-slate-400">{emp.ubicacion || 'Perú'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          emp.estadoVerificacion === 'VERIFICADA'
                            ? 'bg-emerald-100 text-emerald-700'
                            : emp.estadoVerificacion === 'PENDIENTE'
                              ? 'bg-amber-100 text-amber-700'
                              : emp.estadoVerificacion === 'RECHAZADA'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-slate-100 text-slate-700'
                        }`}>
                          {emp.estadoVerificacion === 'VERIFICADA' && <CheckCircle2 className="w-3 h-3" />}
                          {emp.estadoVerificacion === 'PENDIENTE' && <AlertTriangle className="w-3 h-3" />}
                          {emp.estadoVerificacion === 'RECHAZADA' && <XCircle className="w-3 h-3" />}
                          {emp.estadoVerificacion || 'PENDIENTE'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-1.5 whitespace-nowrap">
                        {emp.estadoVerificacion === 'PENDIENTE' && (
                          <>
                            <button
                              onClick={() => handleAprobarEmpresa(emp.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors"
                            >
                              Aprobar
                            </button>
                            <button
                              onClick={() => handleRechazarEmpresa(emp.id)}
                              className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors"
                            >
                              Rechazar
                            </button>
                          </>
                        )}
                        {emp.estadoVerificacion === 'VERIFICADA' && (
                          <button
                            onClick={() => handleSuspenderEmpresa(emp.id)}
                            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors"
                          >
                            Suspender
                          </button>
                        )}
                        {emp.estadoVerificacion === 'SUSPENDIDA' && (
                          <button
                            onClick={() => handleAprobarEmpresa(emp.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors"
                          >
                            Reactivar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Roles y Permisos */}
      {activeTab === 'roles' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold uppercase tracking-wider">
                  ADMINISTRADOR
                </span>
                <Shield className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Administrador del Sistema</h3>
              <p className="text-sm text-slate-500">
                Acceso total a la configuración de la plataforma, aprobación de ofertas, moderación de empresas, usuarios y métricas globales.
              </p>
              <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">Gestión global</span>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">Aprobación ofertas</span>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">Auditoría</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider">
                  EMPRESA
                </span>
                <Store className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Perfil Empresa</h3>
              <p className="text-sm text-slate-500">
                Publicación y edición de ofertas laborales, recepción y evaluación de postulantes, gestión de candidatos y perfil corporativo.
              </p>
              <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">Publicar ofertas</span>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">Evaluar candidatos</span>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">Perfil empresa</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-wider">
                  RECLUTADOR
                </span>
                <Users className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Reclutador Corporativo</h3>
              <p className="text-sm text-slate-500">
                Gestión operativa de procesos de selección y coordinación de entrevistas para las empresas asociadas.
              </p>
              <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">Entrevistas</span>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">Feedback candidatos</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wider">
                  CANDIDATO / ESTUDIANTE
                </span>
                <UserCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Candidato / Profesional</h3>
              <p className="text-sm text-slate-500">
                Búsqueda activa de empleos, postulación a vacantes, gestión de CV en PDF y seguimiento de citas de entrevista.
              </p>
              <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">Buscar vacantes</span>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">Postulaciones</span>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">Subida de CV</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Todos los Usuarios */}
      {activeTab === 'todos' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-xs font-semibold text-slate-400 uppercase">Empresas Registradas</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {stats ? stats.totalEmpresas : empresas.length}
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-xs font-semibold text-slate-400 uppercase">Candidatos Registrados</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {stats ? stats.totalCandidatos : candidatos.length}
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-xs font-semibold text-slate-400 uppercase">Total Usuarios en BD</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {stats ? stats.totalUsuarios : '-'}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-sm">
            <h3 className="text-base font-bold text-slate-800 mb-1">
              Directorio General de Cuentas
            </h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto mb-4">
              Utiliza las pestañas superiores para navegar entre los listados de Candidatos, Empresas o la configuración de Roles y Permisos.
            </p>
            <div className="inline-flex gap-3">
              <button
                onClick={() => handleTabChange('empresas')}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Ver Empresas ({stats ? stats.totalEmpresas : empresas.length})
              </button>
              <button
                onClick={() => handleTabChange('candidatos')}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
              >
                Ver Candidatos ({stats ? stats.totalCandidatos : candidatos.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
