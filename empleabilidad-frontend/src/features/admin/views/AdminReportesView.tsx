import { useState } from 'react';
import { BarChart3, Download, FileSpreadsheet } from 'lucide-react';
import { alerts } from '@/shared/utils/alerts';

export const AdminReportesView = () => {
  const [generando, setGenerando] = useState<string | null>(null);

  const reportes = [
    {
      id: 'ofertas',
      titulo: 'Reporte de Ofertas Laborales',
      descripcion: 'Listado completo de ofertas con estado de publicación, empresa solicitante, postulantes recibidos y fechas de vigencia.',
      formato: 'CSV / Excel',
      tipo: 'Ofertas'
    },
    {
      id: 'empresas',
      titulo: 'Reporte de Empresas Registradas',
      descripcion: 'Directorio corporativo con RUC, estado de verificación, ofertas creadas y datos de contacto de las organizaciones.',
      formato: 'CSV / Excel',
      tipo: 'Empresas'
    },
    {
      id: 'postulaciones',
      titulo: 'Reporte de Postulaciones y Selección',
      descripcion: 'Métricas de postulación por vacante, tiempos de revisión de candidatos y estados finales del proceso.',
      formato: 'CSV / Excel',
      tipo: 'Postulaciones'
    },
    {
      id: 'candidatos',
      titulo: 'Reporte de Candidatos y Perfiles',
      descripcion: 'Estadísticas de usuarios postulantes, perfiles completados y actividad en la bolsa de trabajo.',
      formato: 'CSV / Excel',
      tipo: 'Usuarios'
    },
  ];

  const handleDescargarReporte = async (reporte: typeof reportes[0]) => {
    setGenerando(reporte.id);
    setTimeout(async () => {
      setGenerando(null);
      await alerts.info('Generación de reporte', `El ${reporte.titulo} ha sido solicitado. En breve comenzará la descarga en formato ${reporte.formato}.`);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-violet-600" />
            Reportes del Sistema
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Genera y exporta informes consolidados de ofertas, empresas, postulaciones y candidatos.
          </p>
        </div>
      </div>

      {/* Grid de Reportes Disponibles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {reportes.map((rep) => (
          <div
            key={rep.id}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-violet-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-violet-50 text-violet-700">
                  {rep.tipo}
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  {rep.formato}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">{rep.titulo}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{rep.descripcion}</p>
            </div>

            <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">Actualizado en tiempo real</span>
              <button
                onClick={() => handleDescargarReporte(rep)}
                disabled={generando === rep.id}
                className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-all shadow-sm shadow-violet-600/20"
              >
                <Download className="w-3.5 h-3.5" />
                {generando === rep.id ? 'Generando...' : 'Exportar Informe'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
