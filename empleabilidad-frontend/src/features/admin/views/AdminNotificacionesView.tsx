import { useState } from 'react';
import { Bell } from 'lucide-react';

type NotifFilter = 'TODAS' | 'NO_LEIDAS' | 'SISTEMA' | 'OFERTAS';

export const AdminNotificacionesView = () => {
  const [filter, setFilter] = useState<NotifFilter>('TODAS');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-violet-600" />
            Centro de Notificaciones
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Avisos de moderación, alertas del sistema y eventos de usuarios y ofertas.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setFilter('TODAS')}
          className={`pb-3 text-sm font-semibold transition-colors relative ${
            filter === 'TODAS'
              ? 'text-violet-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Todas
          {filter === 'TODAS' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-violet-600 rounded-full" />
          )}
        </button>
        <button
          onClick={() => setFilter('NO_LEIDAS')}
          className={`pb-3 text-sm font-semibold transition-colors relative ${
            filter === 'NO_LEIDAS'
              ? 'text-violet-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          No leídas
          {filter === 'NO_LEIDAS' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-violet-600 rounded-full" />
          )}
        </button>
        <button
          onClick={() => setFilter('SISTEMA')}
          className={`pb-3 text-sm font-semibold transition-colors relative ${
            filter === 'SISTEMA'
              ? 'text-violet-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Sistema
          {filter === 'SISTEMA' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-violet-600 rounded-full" />
          )}
        </button>
        <button
          onClick={() => setFilter('OFERTAS')}
          className={`pb-3 text-sm font-semibold transition-colors relative ${
            filter === 'OFERTAS'
              ? 'text-violet-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Ofertas y Moderación
          {filter === 'OFERTAS' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-violet-600 rounded-full" />
          )}
        </button>
      </div>

      {/* Estado vacío real */}
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
        <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-violet-600">
          <Bell className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">
          Bandeja de notificaciones al día
        </h3>
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          No tienes notificaciones pendientes de revisión en este momento. Las alertas automáticas de nuevas empresas, ofertas enviadas a moderación y postulaciones aparecerán aquí.
        </p>
      </div>
    </div>
  );
};
