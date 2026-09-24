import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Briefcase, Building2, ShieldCheck } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  const location = useLocation();
  const path = location.pathname;

  const isAdmin = path.includes('/admin');
  const isEmpresa = path.includes('/empresa');

  // Configuración de marca dinámica por perfil
  const branding = isAdmin
    ? {
        name: 'EmpleoAdmin',
        badge: 'Panel Administrativo',
        title: 'Control, supervisión y métricas globales.',
        subtitle: 'Acceso exclusivo y seguro para la gestión integral de la plataforma de empleabilidad.',
        icon: <ShieldCheck className="h-6 w-6 text-white" />,
        iconBg: 'bg-slate-800 shadow-slate-900/50',
        stats: 'Acceso reservado a administradores',
      }
    : isEmpresa
    ? {
        name: 'EmpleaPro Empresas',
        badge: 'Portal Corporativo',
        title: 'Encuentra el talento que tu organización necesita.',
        subtitle: 'Publica vacantes, revisa postulantes con IA y construye equipos de alto rendimiento.',
        icon: <Building2 className="h-6 w-6 text-white" />,
        iconBg: 'bg-emerald-600 shadow-emerald-900/50',
        stats: '+500 empresas activas confían en nosotros',
      }
    : {
        name: 'EmpleaPro',
        badge: 'Portal Profesional',
        title: 'Descubre tu verdadero potencial laboral.',
        subtitle: 'Únete a la red donde las mejores empresas y los talentos más destacados se encuentran.',
        icon: <Briefcase className="h-6 w-6 text-white" />,
        iconBg: 'bg-blue-600 shadow-blue-900/50',
        stats: '+10,000 profesionales ya se unieron',
      };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left panel - Branding Diferenciado */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between bg-slate-900 text-white p-12 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_30%,_#1e3a8a_0%,_transparent_60%)] opacity-40 mix-blend-screen pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_80%,_#3b82f6_0%,_transparent_50%)] opacity-20 mix-blend-screen pointer-events-none"></div>

        {/* Decorative Grid */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-50 pointer-events-none"></div>

        <div className="relative z-10 flex items-center gap-3">
          <div className={`p-2.5 rounded-xl shadow-lg ${branding.iconBg}`}>
            {branding.icon}
          </div>
          <span className="text-2xl font-black tracking-tight text-white">
            {branding.name}
          </span>
        </div>

        <div className="relative z-10 max-w-lg mt-16 mb-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-semibold uppercase tracking-wider mb-6 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            {branding.badge}
          </div>
          <h1 className="text-4xl xl:text-5xl font-extrabold mb-5 leading-[1.15] tracking-tight">
            {branding.title}
          </h1>
          <p className="text-slate-300 text-base xl:text-lg leading-relaxed mb-8">
            {branding.subtitle}
          </p>

          {/* Trust badge */}
          <div className="flex items-center gap-3 text-sm font-medium text-slate-400">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-700"></div>
              <div className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-600"></div>
              <div className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-500"></div>
            </div>
            <span>{branding.stats}</span>
          </div>
        </div>

        <div className="relative z-10 text-xs text-slate-500 font-medium">
          © 2026 EmpleaPro. Todos los derechos reservados.
        </div>
      </div>

      {/* Right panel - Form Area */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 xl:p-16 relative">
        <div className="absolute inset-0 bg-slate-50 pointer-events-none"></div>
        <div className="w-full max-w-[540px] bg-white p-6 sm:p-9 rounded-2xl shadow-[0_4px_24px_rgb(0,0,0,0.06)] border border-slate-200/70 relative z-10 animate-fade-in my-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
