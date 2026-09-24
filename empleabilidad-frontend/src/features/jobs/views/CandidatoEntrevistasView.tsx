import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Video, FileText, ArrowRight, RefreshCw, ExternalLink, MapPin, Building2 } from 'lucide-react';
import { jobService } from '../services/job.service';

type TabEntrevista = 'PROXIMAS' | 'PASADAS' | 'TODAS';

interface EntrevistaCandidatoItem {
  id: string;
  uuid: string;
  postulacionId?: string;
  ofertaId?: string;
  ofertaTitulo: string;
  empresaNombre?: string;
  fechaHora: string;
  duracion?: number;
  tipo: 'VIRTUAL' | 'PRESENCIAL' | 'TELEFONICA' | string;
  enlace?: string;
  ubicacion?: string;
  estado: 'PROGRAMADA' | 'CONFIRMADA' | 'REALIZADA' | 'CANCELADA' | 'REPROGRAMADA' | 'NO_ASISTIO' | string;
  observaciones?: string;
}

export const CandidatoEntrevistasView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabEntrevista>('PROXIMAS');
  const [loading, setLoading] = useState(true);
  const [entrevistas, setEntrevistas] = useState<EntrevistaCandidatoItem[]>([]);

  useEffect(() => {
    const fetchCandidateInterviews = async () => {
      setLoading(true);
      try {
        // 1. Obtener entrevistas directas del backend
        const interviewsRes = await jobService.getMyInterviews({ size: 50 });
        const interviewData = interviewsRes.content || [];

        // 2. Obtener postulaciones para enriquecer nombres de ofertas y empresas
        const appsRes = await jobService.getMyApplications({ size: 100 });
        const apps = appsRes.content || [];

        const items: EntrevistaCandidatoItem[] = [];

        for (const raw of interviewData) {
          const app = apps.find(a => (a.uuid || a.id) === raw.postulacionId || a.ofertaId === raw.ofertaId);
          items.push({
            id: raw.uuid || String(raw.id),
            uuid: raw.uuid || String(raw.id),
            postulacionId: raw.postulacionId,
            ofertaId: raw.ofertaId || app?.ofertaId,
            ofertaTitulo: raw.ofertaTitulo || app?.ofertaTitulo || 'Entrevista para Posición Laboral',
            empresaNombre: raw.empresaNombre || app?.empresaNombre || 'Empresa Empleadora',
            fechaHora: raw.fechaHora || raw.fechaCreacion || new Date().toISOString(),
            duracion: raw.duracion || 45,
            tipo: raw.tipo || 'VIRTUAL',
            enlace: raw.enlace,
            ubicacion: raw.ubicacion,
            estado: raw.estado || 'PROGRAMADA',
            observaciones: raw.observaciones
          });
        }

        // 3. Si hay postulaciones en estado ENTREVISTA que aún no tengan ficha específica en entrevistas, integrarlas
        for (const app of apps) {
          if (app.estado === 'ENTREVISTA') {
            const yaRegistrada = items.some(i => i.postulacionId === (app.uuid || app.id));
            if (!yaRegistrada) {
              items.push({
                id: `app-entrevista-${app.uuid || app.id}`,
                uuid: app.uuid || app.id,
                postulacionId: app.uuid || app.id,
                ofertaId: app.ofertaId,
                ofertaTitulo: app.ofertaTitulo || 'Entrevista en Coordinación',
                empresaNombre: app.empresaNombre || 'Equipo de Selección',
                fechaHora: app.fechaPostulacion || new Date().toISOString(),
                duracion: 30,
                tipo: 'VIRTUAL',
                estado: 'PROGRAMADA',
                observaciones: 'Tu postulación se encuentra en la etapa de Entrevista. El equipo de selección se comunicará para confirmar horario exacto.'
              });
            }
          }
        }

        setEntrevistas(items);
      } catch (error) {
        console.error('Error al cargar entrevistas del candidato:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCandidateInterviews();
  }, []);

  const filteredEntrevistas = useMemo(() => {
    const now = new Date().getTime();
    return entrevistas.filter(item => {
      const itemTime = new Date(item.fechaHora).getTime();
      const isPast = itemTime < now || item.estado === 'REALIZADA' || item.estado === 'CANCELADA' || item.estado === 'NO_ASISTIO';

      if (activeTab === 'PROXIMAS') {
        return !isPast;
      }
      if (activeTab === 'PASADAS') {
        return isPast;
      }
      return true;
    });
  }, [entrevistas, activeTab]);

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'PROGRAMADA':
      case 'CONFIRMADA':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'REPROGRAMADA':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'REALIZADA':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'CANCELADA':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Calendar className="w-6 h-6 text-indigo-600" />
            Mis Entrevistas
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Organiza, revisa y prepárate para tus citas con los equipos de selección.
          </p>
        </div>
        <Link
          to="/candidato/postulaciones"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-all"
        >
          <FileText className="w-4 h-4" />
          Ver mis postulaciones
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('PROXIMAS')}
          className={`pb-3 text-sm font-semibold transition-colors relative ${
            activeTab === 'PROXIMAS'
              ? 'text-indigo-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Próximas entrevistas
          {activeTab === 'PROXIMAS' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('PASADAS')}
          className={`pb-3 text-sm font-semibold transition-colors relative ${
            activeTab === 'PASADAS'
              ? 'text-indigo-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Historial / Pasadas
          {activeTab === 'PASADAS' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('TODAS')}
          className={`pb-3 text-sm font-semibold transition-colors relative ${
            activeTab === 'TODAS'
              ? 'text-indigo-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Todas ({entrevistas.length})
          {activeTab === 'TODAS' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-full" />
          )}
        </button>
      </div>

      {/* Contenido / Estado Vacío o Listado Real */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-3" />
          <p className="text-sm text-slate-500 font-medium">Cargando tus entrevistas...</p>
        </div>
      ) : filteredEntrevistas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-600">
            <Calendar className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            {activeTab === 'PROXIMAS' 
              ? 'No tienes próximas entrevistas programadas'
              : (activeTab === 'PASADAS' ? 'No tienes entrevistas pasadas en el historial' : 'Aún no tienes entrevistas registradas')}
          </h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
            Cuando las empresas revisen tu perfil y coordinen una fecha de entrevista contigo, aparecerá aquí con los enlaces de conexión y detalles.
          </p>
          <Link
            to="/candidato/buscar"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-indigo-600/20"
          >
            Explorar oportunidades
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEntrevistas.map((entrevista) => (
            <div
              key={entrevista.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getEstadoBadge(entrevista.estado)}`}>
                    {entrevista.estado}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {entrevista.tipo === 'VIRTUAL' ? 'Videollamada' : (entrevista.tipo === 'TELEFONICA' ? 'Telefónica' : 'Presencial')}
                  </span>
                </div>

                <h4 className="text-base font-bold text-slate-900 leading-snug">
                  {entrevista.ofertaTitulo}
                </h4>

                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500">
                  {entrevista.empresaNombre && (
                    <span className="flex items-center gap-1 font-medium text-slate-700">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      {entrevista.empresaNombre}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {new Date(entrevista.fechaHora).toLocaleString('es-PE', {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })}
                  </span>
                  {entrevista.duracion && (
                    <span>• {entrevista.duracion} min</span>
                  )}
                  {entrevista.ubicacion && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {entrevista.ubicacion}
                    </span>
                  )}
                </div>

                {entrevista.observaciones && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 max-w-2xl">
                    {entrevista.observaciones}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 self-start md:self-center">
                {entrevista.enlace ? (
                  <a
                    href={entrevista.enlace.startsWith('http') ? entrevista.enlace : `https://${entrevista.enlace}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
                  >
                    <Video className="w-3.5 h-3.5" />
                    Unirse a la sesión
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-xs text-slate-400 italic">
                    {entrevista.tipo === 'PRESENCIAL' ? 'Asistencia en sede' : 'Enlace pendiente de envío'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
