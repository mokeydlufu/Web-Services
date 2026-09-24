import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthLayout } from './features/auth/layouts/AuthLayout';
import { AccessView } from './features/auth/views/AccessView';
import { ProfessionalLoginView } from './features/auth/views/ProfessionalLoginView';
import { CompanyLoginView } from './features/auth/views/CompanyLoginView';
import { AdminLoginView } from './features/auth/views/AdminLoginView';
import { ProfessionalRegisterView } from './features/auth/views/ProfessionalRegisterView';
import { CompanyRegisterView } from './features/auth/views/CompanyRegisterView';
import { ProtectedRoute } from './core/ProtectedRoute';

// Layouts
import { PublicLayout } from './app/layouts/PublicLayout';
import { SharedLayout } from './app/layouts/SharedLayout';
import { CandidateLayout } from './app/layouts/CandidateLayout';
import { CompanyLayout } from './app/layouts/CompanyLayout';
import { AdminLayout } from './app/layouts/AdminLayout';

// Vistas Públicas y Compartidas
import { EmpleosView } from './features/jobs/views/EmpleosView';
import { JobDetailView } from './features/jobs/views/JobDetailView';
import { EmpresasView } from './features/companies/views/EmpresasView';
import { CompanyDetailView } from './features/companies/views/CompanyDetailView';

// Vistas Empresa
import { CompanyOfertasView } from './features/jobs/views/CompanyOfertasView';
import { CompanyCandidatosView } from './features/jobs/views/CompanyCandidatosView';
import { CompanyEvaluacionesView } from './features/jobs/views/CompanyEvaluacionesView';
import { CompanyProfileView } from './features/profile/views/CompanyProfileView';

// Vistas Candidato
import { CandidateSearchView } from './features/jobs/views/CandidateSearchView';
import { ProfileOnboardingView } from './features/profile/views/ProfileOnboardingView';
import { CandidatoPostulacionesView } from './features/jobs/views/CandidatoPostulacionesView';
import { CandidatoEntrevistasView } from './features/jobs/views/CandidatoEntrevistasView';

// Vistas Administrador
import { AdminDashboardView } from './features/admin/views/AdminDashboardView';
import { AdminUsuariosView } from './features/admin/views/AdminUsuariosView';
import { AdminOfertasView } from './features/admin/views/AdminOfertasView';
import { AdminPostulacionesView } from './features/admin/views/AdminPostulacionesView';
import { AdminEstadisticasView } from './features/admin/views/AdminEstadisticasView';
import { AdminNotificacionesView } from './features/admin/views/AdminNotificacionesView';
import { AdminReportesView } from './features/admin/views/AdminReportesView';
import { AdminConfiguracionView } from './features/admin/views/AdminConfiguracionView';

// --- VISTAS PÚBLICAS (VISITANTE) ---
const Inicio = () => (
  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 relative overflow-hidden bg-slate-50">
    <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-400/20 blur-[120px] rounded-full pointer-events-none"></div>
    <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-400/20 blur-[120px] rounded-full pointer-events-none"></div>

    <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-medium text-sm mb-8 shadow-sm animate-fade-in">
        <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
        Nueva plataforma 2026
      </div>
      <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-8 animate-slide-up">
        El trabajo de tus sueños <br className="hidden md:block" />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-500">
          está a un clic de distancia.
        </span>
      </h1>
      <p className="text-xl text-slate-600 max-w-2xl mb-12 leading-relaxed animate-slide-up" style={{animationDelay: '100ms'}}>
        Únete a la red de profesionales más exclusiva y conecta con las empresas que están transformando la industria en toda la región.
      </p>
      <div className="flex flex-col sm:flex-row items-center gap-4 animate-slide-up" style={{animationDelay: '200ms'}}>
        <a href="/acceso" className="w-full sm:w-auto bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 text-lg flex items-center justify-center gap-2">
          Comenzar ahora
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
        </a>
        <a href="/empleos" className="w-full sm:w-auto bg-white text-slate-700 border border-slate-200 px-8 py-4 rounded-xl font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all text-lg">
          Explorar empleos
        </a>
      </div>
    </div>
  </div>
);

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          {/* --- RAMA PÚBLICA (Solo home y empresas) --- */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Inicio />} />
            <Route path="/empresas" element={<EmpresasView />} />
            <Route path="/empresas/:id" element={<CompanyDetailView />} />
          </Route>

          {/* --- RAMA COMPARTIDA (Empleos - detecta si hay sesión) --- */}
          <Route element={<SharedLayout />}>
            <Route path="/empleos" element={<EmpleosView />} />
            <Route path="/empleos/:id" element={<JobDetailView />} />
          </Route>

          {/* --- RUTAS SEPARADAS DE AUTENTICACIÓN --- */}
          <Route element={<AuthLayout />}>
            <Route path="/acceso" element={<AccessView />} />
            <Route path="/login/profesional" element={<ProfessionalLoginView />} />
            <Route path="/login/empresa" element={<CompanyLoginView />} />
            <Route path="/admin/login" element={<AdminLoginView />} />
            <Route path="/registro/profesional" element={<ProfessionalRegisterView />} />
            <Route path="/registro/empresa" element={<CompanyRegisterView />} />
          </Route>

          {/* --- COMPATIBILIDAD RUTAS ANTIGUAS (Redirección a /acceso) --- */}
          <Route path="/login" element={<Navigate to="/acceso" replace />} />
          <Route path="/register" element={<Navigate to="/acceso" replace />} />
          <Route path="/auth" element={<Navigate to="/acceso" replace />} />
          <Route path="/auth/login" element={<Navigate to="/acceso" replace />} />
          <Route path="/auth/register" element={<Navigate to="/acceso" replace />} />

          {/* --- ADMIN PROTEGIDO (Exclusivo rol ADMINISTRADOR) --- */}
          <Route element={<ProtectedRoute allowedRoles={['ADMINISTRADOR']} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboardView />} />

              {/* Gestión de Usuarios */}
              <Route path="usuarios" element={<AdminUsuariosView />} />
              <Route path="usuarios/listado" element={<AdminUsuariosView />} />
              <Route path="usuarios/candidatos" element={<AdminUsuariosView />} />
              <Route path="usuarios/empresas" element={<AdminUsuariosView />} />
              <Route path="usuarios/roles" element={<AdminUsuariosView />} />

              {/* Gestión de Ofertas */}
              <Route path="ofertas" element={<AdminOfertasView />} />
              <Route path="ofertas/listado" element={<AdminOfertasView />} />
              <Route path="ofertas/categorias" element={<AdminOfertasView />} />

              {/* Gestión de Postulaciones */}
              <Route path="postulaciones" element={<AdminPostulacionesView />} />
              <Route path="postulaciones/listado" element={<AdminPostulacionesView />} />
              <Route path="postulaciones/estados" element={<AdminPostulacionesView />} />
              <Route path="postulaciones/entrevistas" element={<AdminPostulacionesView />} />

              {/* Soporte y Analíticas */}
              <Route path="estadisticas" element={<AdminEstadisticasView />} />
              <Route path="notificaciones" element={<AdminNotificacionesView />} />
              <Route path="reportes" element={<AdminReportesView />} />
              <Route path="configuracion" element={<AdminConfiguracionView />} />
            </Route>
          </Route>

          {/* --- CANDIDATO PROTEGIDO --- */}
          <Route element={<ProtectedRoute allowedRoles={['ESTUDIANTE', 'PROFESIONAL']} />}>
            <Route path="/candidato" element={<CandidateLayout />}>
              <Route index element={<Navigate to="buscar" replace />} />
              <Route path="buscar" element={<CandidateSearchView />} />
              <Route path="perfil" element={<ProfileOnboardingView />} />
              <Route path="postulaciones" element={<CandidatoPostulacionesView />} />
              <Route path="entrevistas" element={<CandidatoEntrevistasView />} />
            </Route>
          </Route>

          {/* --- EMPRESA PROTEGIDA --- */}
          <Route element={<ProtectedRoute allowedRoles={['EMPRESA', 'RECLUTADOR']} />}>
            <Route path="/empresa" element={<CompanyLayout />}>
              <Route index element={<Navigate to="ofertas" replace />} />
              <Route path="ofertas" element={<CompanyOfertasView />} />
              <Route path="candidatos" element={<CompanyCandidatosView />} />
              <Route path="evaluaciones" element={<CompanyEvaluacionesView />} />
              <Route path="perfil" element={<CompanyProfileView />} />
            </Route>
          </Route>

          {/* Fallback general */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
