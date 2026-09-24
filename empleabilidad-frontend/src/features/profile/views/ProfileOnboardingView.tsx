import { useEffect, useRef } from 'react';
import { useProfileStore } from '../store/useProfileStore';
import { ShieldCheck, FileText, AlertCircle, Upload } from 'lucide-react';

export const ProfileOnboardingView = () => {
  const { profile, isLoading, fetchProfile, uploadCv } = useProfileStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        alert('Solo se admiten archivos PDF.');
        return;
      }
      await uploadCv(file);
    }
  };

  if (isLoading && !profile) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-gray-500 animate-pulse">Cargando perfil...</div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-indigo-500 rounded-full blur-3xl opacity-20"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">¡Hola, {profile.nombreParaMostrar}!</h1>
              <p className="text-slate-300 mt-1">Completa tu perfil para acceder a todas las funcionalidades.</p>
            </div>
            <div className="flex flex-col items-end">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-2 ${
                profile.estadoPerfil === 'COMPLETO' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
              }`}>
                {profile.estadoPerfil}
              </span>
              <div className="text-3xl font-bold text-white">{profile.porcentajeCompletitud}%</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-6 bg-slate-800 rounded-full h-2 w-full overflow-hidden">
            <div 
              className="h-full bg-indigo-500 rounded-full transition-all duration-1000 ease-out relative"
              style={{ width: `${profile.porcentajeCompletitud}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8">
          {profile.puedeAccionar ? (
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-5 flex items-start gap-4">
              <div className="bg-emerald-100 p-2 rounded-full text-emerald-600">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-emerald-800">¡Tu perfil está listo!</h3>
                <p className="text-emerald-600 mt-1">
                  Ya cumples con los requisitos mínimos para {profile.rol === 'EMPRESA' ? 'publicar ofertas' : 'postular a empleos'}. 
                  Aún puedes seguir mejorando tu perfil añadiendo más información opcional.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-amber-800 flex items-center gap-2">
                  <AlertCircle className="w-6 h-6" />
                  Acción Requerida
                </h3>
                <p className="text-amber-700 mt-2">
                  Para poder {profile.rol === 'EMPRESA' ? 'publicar ofertas' : 'postular a empleos'}, necesitas completar los siguientes requisitos:
                </p>
                <ul className="mt-4 space-y-2">
                  {profile.motivosPendientes.map((motivo, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-amber-800">
                      <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                      <span className="font-medium">{motivo}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Quick Actions (e.g. CV Upload) */}
          {profile.rol === 'ESTUDIANTE' && (
            <div className="mt-8 border-t border-gray-100 pt-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Gestión de CV</h3>
              
              <div className="flex flex-col md:flex-row items-center gap-6 bg-slate-50 border border-slate-200 rounded-xl p-6">
                <div className="bg-indigo-100 text-indigo-600 p-4 rounded-full">
                  <FileText className="w-8 h-8" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h4 className="font-semibold text-gray-900">Sube tu Currículum</h4>
                  <p className="text-sm text-gray-500 mt-1">
                    Formato PDF. Tamaño máximo 5MB.
                  </p>
                </div>
                <div>
                  <input 
                    type="file" 
                    accept="application/pdf"
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Upload className="w-5 h-5" />
                    {isLoading ? 'Subiendo...' : 'Subir PDF'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
