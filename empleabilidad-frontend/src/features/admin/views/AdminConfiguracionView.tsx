import { useState } from 'react';
import { Settings, Shield, Database, Save } from 'lucide-react';
import { alerts } from '@/shared/utils/alerts';

export const AdminConfiguracionView = () => {
  const [guardando, setGuardando] = useState(false);
  const [config, setConfig] = useState({
    nombrePlataforma: 'EmpleaPro',
    emailContacto: 'soporte@empleapro.pe',
    diasVigenciaOfertas: '30',
    validacionReniecSunat: true,
    moderacionOfertasManual: true,
    notificacionesEmail: true,
  });

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setTimeout(async () => {
      setGuardando(false);
      await alerts.success('Configuración guardada', 'Los parámetros del sistema se han actualizado correctamente.');
    }, 400);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-violet-600" />
            Configuración del Sistema
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Ajustes globales de la plataforma, validaciones de identidad y parámetros de ofertas.
          </p>
        </div>
      </div>

      <form onSubmit={handleGuardar} className="space-y-6">
        {/* Parámetros Generales */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-4 h-4 text-violet-600" />
            Parámetros de la Plataforma
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase">
                Nombre de la Plataforma
              </label>
              <input
                type="text"
                value={config.nombrePlataforma}
                onChange={(e) => setConfig({ ...config, nombrePlataforma: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase">
                Correo Electrónico de Contacto
              </label>
              <input
                type="email"
                value={config.emailContacto}
                onChange={(e) => setConfig({ ...config, emailContacto: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase">
                Días de Vigencia por Defecto (Ofertas)
              </label>
              <input
                type="number"
                value={config.diasVigenciaOfertas}
                onChange={(e) => setConfig({ ...config, diasVigenciaOfertas: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>
        </div>

        {/* Políticas de Validación y Seguridad */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-4 h-4 text-violet-600" />
            Validación de Identidad y Moderación
          </h2>

          <div className="space-y-3">
            <label className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
              <input
                type="checkbox"
                checked={config.validacionReniecSunat}
                onChange={(e) => setConfig({ ...config, validacionReniecSunat: e.target.checked })}
                className="mt-0.5 w-4 h-4 rounded text-violet-600 focus:ring-violet-500"
              />
              <div>
                <span className="text-sm font-semibold text-slate-800">Validación RENIEC / SUNAT automática</span>
                <p className="text-xs text-slate-500 mt-0.5">
                  Consulta de autenticidad en tiempo real para números de DNI y RUC al momento del registro.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
              <input
                type="checkbox"
                checked={config.moderacionOfertasManual}
                onChange={(e) => setConfig({ ...config, moderacionOfertasManual: e.target.checked })}
                className="mt-0.5 w-4 h-4 rounded text-violet-600 focus:ring-violet-500"
              />
              <div>
                <span className="text-sm font-semibold text-slate-800">Flujo de moderación previa de ofertas</span>
                <p className="text-xs text-slate-500 mt-0.5">
                  Las ofertas creadas por empresas ingresan como "Pendiente de Aprobación" antes de publicarse en la bolsa.
                </p>
              </div>
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={guardando}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all shadow-sm shadow-violet-600/20"
          >
            <Save className="w-4 h-4" />
            {guardando ? 'Guardando ajustes...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  );
};
