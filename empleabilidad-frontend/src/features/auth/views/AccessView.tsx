import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCircle, Building2, ShieldCheck, ArrowRight, ArrowLeft } from 'lucide-react';

export const AccessView: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 mb-3 shadow-inner">
          <UserCircle className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Portal de Acceso</h2>
        <p className="text-slate-500 text-sm mt-1.5 leading-snug">
          Selecciona tu tipo de perfil para ingresar a la plataforma
        </p>
      </div>

      {/* Tarjetas de Selección de Perfil */}
      <div className="space-y-3 pt-2">
        {/* Opción 1: Profesional */}
        <button
          type="button"
          onClick={() => navigate('/login/profesional')}
          className="w-full text-left p-4 rounded-xl border-2 border-slate-200/80 hover:border-blue-500 bg-white hover:bg-blue-50/40 transition-all duration-200 flex items-center justify-between group shadow-sm hover:shadow-md"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-100/70 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200 flex-shrink-0">
              <UserCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors text-base">
                Soy Profesional
              </h3>
              <p className="text-xs text-slate-500 line-clamp-1">
                Postula a empleos, gestiona tu CV y haz seguimiento a tus postulaciones.
              </p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all flex-shrink-0 ml-2" />
        </button>

        {/* Opción 2: Empresa */}
        <button
          type="button"
          onClick={() => navigate('/login/empresa')}
          className="w-full text-left p-4 rounded-xl border-2 border-slate-200/80 hover:border-emerald-500 bg-white hover:bg-emerald-50/40 transition-all duration-200 flex items-center justify-between group shadow-sm hover:shadow-md"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-100/70 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-200 flex-shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors text-base">
                Soy Empresa
              </h3>
              <p className="text-xs text-slate-500 line-clamp-1">
                Publica ofertas de trabajo, evalúa candidatos y contrata talento.
              </p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all flex-shrink-0 ml-2" />
        </button>

        {/* Opción 3: Administrador */}
        <button
          type="button"
          onClick={() => navigate('/admin/login')}
          className="w-full text-left p-4 rounded-xl border-2 border-slate-200/80 hover:border-slate-800 bg-white hover:bg-slate-50 transition-all duration-200 flex items-center justify-between group shadow-sm hover:shadow-md"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:bg-slate-800 group-hover:text-white transition-colors duration-200 flex-shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 group-hover:text-slate-800 transition-colors text-base">
                Administrador
              </h3>
              <p className="text-xs text-slate-500 line-clamp-1">
                Acceso exclusivo para el panel de supervisión y gestión del sistema.
              </p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-slate-800 group-hover:translate-x-1 transition-all flex-shrink-0 ml-2" />
        </button>
      </div>

      {/* Enlace de regreso al Home */}
      <div className="pt-2 text-center border-t border-slate-100">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Volver a la página principal
        </button>
      </div>
    </div>
  );
};
