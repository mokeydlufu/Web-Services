import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FileText, MessageSquare, Calendar, Search, CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';

type PostulacionTab = 'listado' | 'estados' | 'entrevistas';

export const AdminPostulacionesView = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const getTabFromPath = (path: string): PostulacionTab => {
    if (path.includes('estados')) return 'estados';
    if (path.includes('entrevistas')) return 'entrevistas';
    return 'listado';
  };

  const [activeTab, setActiveTab] = useState<PostulacionTab>(getTabFromPath(location.pathname));
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setActiveTab(getTabFromPath(location.pathname));
  }, [location.pathname]);

  const handleTabChange = (tab: PostulacionTab) => {
    setActiveTab(tab);
    if (tab === 'listado') navigate('/admin/postulaciones/listado');
    else if (tab === 'estados') navigate('/admin/postulaciones/estados');
    else if (tab === 'entrevistas') navigate('/admin/postulaciones/entrevistas');
  };

  const estadosDefinidos = [
    {
      codigo: 'ENVIADA',
      nombre: 'Enviada',
      descripcion: 'La postulación ha sido registrada por el candidato y recibida en el sistema.',
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      icono: <Clock className="w-5 h-5 text-blue-600" />
    },
    {
      codigo: 'EN_REVISION',
      nombre: 'En Revisión',
      descripcion: 'El equipo de selección de la empresa está revisando el currículum vitae y perfil.',
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      icono: <AlertCircle className="w-5 h-5 text-amber-600" />
    },
    {
      codigo: 'ENTREVISTA',
      nombre: 'Entrevista',
      descripcion: 'Cita de entrevista técnica o por competencias coordinada entre empresa y candidato.',
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      icono: <Calendar className="w-5 h-5 text-indigo-600" />
    },
    {
      codigo: 'FINALISTA',
      nombre: 'Finalista',
      descripcion: 'Candidato clasificado en la terna final de toma de decisión.',
      color: 'bg-purple-50 text-purple-700 border-purple-200',
      icono: <CheckCircle2 className="w-5 h-5 text-purple-600" />
    },
    {
      codigo: 'ACEPTADA',
      nombre: 'Aceptada / Seleccionado',
      descripcion: 'El candidato ha sido contratado o seleccionado favorablemente para la posición.',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icono: <CheckCircle2 className="w-5 h-5 text-emerald-600" />
    },
    {
      codigo: 'RECHAZADA',
      nombre: 'Desestimada / Rechazada',
      descripcion: 'La postulación no avanzó en la etapa de evaluación de la vacante.',
      color: 'bg-rose-50 text-rose-700 border-rose-200',
      icono: <XCircle className="w-5 h-5 text-rose-600" />
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-violet-600" />
            Gestión de Postulaciones
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Supervisión global de aplicaciones laborales, embudo de selección y entrevistas en EmpleaPro.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => handleTabChange('listado')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 transition-colors relative ${
            activeTab === 'listado'
              ? 'text-violet-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          Listado de Postulaciones
          {activeTab === 'listado' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-violet-600 rounded-full" />
          )}
        </button>

        <button
          onClick={() => handleTabChange('estados')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 transition-colors relative ${
            activeTab === 'estados'
              ? 'text-violet-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Estado de Postulaciones
          {activeTab === 'estados' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-violet-600 rounded-full" />
          )}
        </button>

        <button
          onClick={() => handleTabChange('entrevistas')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 transition-colors relative ${
            activeTab === 'entrevistas'
              ? 'text-violet-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Entrevistas
          {activeTab === 'entrevistas' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-violet-600 rounded-full" />
          )}
        </button>
      </div>

      {/* Tab: Listado */}
      {activeTab === 'listado' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por candidato, vacante o empresa..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-violet-600">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              No hay postulaciones registradas en el sistema aún
            </h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto">
              Cuando los candidatos postulen a las ofertas de empleo publicadas por las empresas, se registrarán aquí con su estado y trazabilidad completa.
            </p>
          </div>
        </div>
      )}

      {/* Tab: Estados */}
      {activeTab === 'estados' && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Flujo de Estados de Postulación</h2>
            <p className="text-slate-500 text-sm mb-6">
              Estados estándar definidos en el ciclo de vida de selección de la plataforma:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {estadosDefinidos.map((estado) => (
                <div
                  key={estado.codigo}
                  className={`p-5 rounded-xl border ${estado.color} transition-all`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    {estado.icono}
                    <h3 className="font-bold text-slate-900">{estado.nombre}</h3>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{estado.descripcion}</p>
                  <div className="mt-3 text-[10px] font-mono font-semibold uppercase opacity-70">
                    Código: {estado.codigo}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Entrevistas */}
      {activeTab === 'entrevistas' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-violet-600">
              <Calendar className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              No hay entrevistas programadas en la plataforma
            </h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto">
              Las reuniones y entrevistas coordinadas entre las empresas y los postulantes quedarán registradas en este módulo centralizado.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
