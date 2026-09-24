import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Briefcase } from 'lucide-react';
import { Button } from '@/shared/components/Button';

export const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans selection:bg-blue-200">
      {/* Navbar Pública Premium */}
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
