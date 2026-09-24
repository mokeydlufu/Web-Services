import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Briefcase, LogOut, Search, User, FileText, Calendar } from 'lucide-react';
import { Button } from '@/shared/components/Button';
import { useAuthStore } from '@/features/auth/store/useAuthStore';

/**
 * SharedLayout: Header inteligente que detecta si hay usuario autenticado
 * y muestra el navbar correspondiente (público o autenticado)
 */
export const SharedLayout: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuthStore();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans selection:bg-blue-200">
      {/* Navbar Inteligente */}
      {isAuthenticated && user ? (
        // Header Autenticado (similar a CandidateLayout)
        <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2 text-blue-600">
                <Briefcase className="h-6 w-6" />
                <span className="text-xl font-bold text-slate-900 hidden sm:block">EmpleaPro</span>
              </Link>
              
              <nav className="hidden md:flex gap-1">
                <Link
                  to="/candidato/buscar"
                  className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                  <Search className="h-4 w-4" />
                  Buscar
                </Link>
                <Link
                  to="/candidato/perfil"
                  className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                  <User className="h-4 w-4" />
                  Mi Perfil
                </Link>
                <Link
                  to="/candidato/postulaciones"
                  className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  Postulaciones
                </Link>
                <Link
                  to="/candidato/entrevistas"
                  className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                  <Calendar className="h-4 w-4" />
                  Entrevistas
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-slate-900">{user.nombres || user.email}</p>
                  <p className="text-xs text-slate-500">Candidato</p>
                </div>
                <div className="h-9 w-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold overflow-hidden">
                  {user.fotoPerfil ? (
                    <img src={user.fotoPerfil} alt="Perfil" className="h-full w-full object-cover" />
                  ) : (
                    user.email?.charAt(0).toUpperCase()
                  )}
                </div>
              </div>
              <button 
                onClick={logout}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>
      ) : (
        // Header Público (cuando NO está autenticado)
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200/60 shadow-sm transition-all">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="bg-blue-600 p-2 rounded-xl group-hover:bg-blue-700 transition-colors shadow-md shadow-blue-600/20">
                <Briefcase className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-black tracking-tight text-slate-900">Emplea<span className="text-blue-600">Pro</span></span>
            </Link>
            
            <nav className="hidden md:flex gap-8">
              <Link to="/empleos" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Empleos</Link>
              <Link to="/empresas" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Empresas</Link>
            </nav>

            <div className="flex items-center gap-4">
              <Link to="/acceso">
                <Button variant="ghost">Iniciar Sesión</Button>
              </Link>
              <Link to="/acceso">
                <Button variant="primary">Regístrate</Button>
              </Link>
            </div>
          </div>
        </header>
      )}

      {/* Contenido Principal */}
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 text-center text-sm mt-auto">
        <p>© 2026 EmpleaPro. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};
