import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckSquare, Sparkles, Award, Clock, Search,
  Plus, Eye, Edit3, CheckCircle2, X, Briefcase,
  BarChart3, Download, RefreshCw, AlertCircle, Trash2
} from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { jobService } from '../services/job.service';
import type { PostulacionResponse, OfertaResponse, RecomendacionEvaluacion } from '../types/job.types';
import { Button } from '@/shared/components/Button';
import { alerts } from '@/shared/utils/alerts';

export type TipoEvaluacion = 'IA_SCREENING' | 'PRUEBA_TECNICA' | 'PSICOMETRICO' | 'ENTREVISTA_TECNICA';
export type EstadoEvaluacion = 'COMPLETADA' | 'EN_REVISION' | 'EN_PROGRESO' | 'PENDIENTE' | 'APROBADO' | 'DESCALIFICADO' | 'CANCELADA';

export interface EvaluacionItem {
  id: string;
  candidatoId: string;
  candidatoNombre: string;
  candidatoEmail: string;
  candidatoFoto?: string;
  ofertaId: string;
  ofertaTitulo: string;
  postulacionId?: string;
  tipo: TipoEvaluacion;
  tituloPrueba: string;
  puntaje: number;
  estado: EstadoEvaluacion;
  fechaRealizacion: string;
  duracionMinutos?: number;
  habilidadesEvaluadas: string[];
  resumenIa?: string;
  cumpleRequerimientos?: boolean;
  comentariosEvaluador?: string;
  nivelDificultad?: 'JUNIOR' | 'MID' | 'SENIOR' | 'LEAD';
  recomendacion?: RecomendacionEvaluacion;
  evaluacionBackendId?: string; // ID de la evaluación en el backend
  origenIa?: 'GEMINI' | 'FALLBACK' | 'SIN_CLASIFICAR';
}

export const CompanyEvaluacionesView: React.FC = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [companyJobs, setCompanyJobs] = useState<OfertaResponse[]>([]);
  const [evaluaciones, setEvaluaciones] = useState<EvaluacionItem[]>([]);
  const [postulaciones, setPostulaciones] = useState<PostulacionResponse[]>([]);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTipo, setSelectedTipo] = useState<string>('TODOS');
  const [selectedEstado, setSelectedEstado] = useState<string>('TODOS');
  const [selectedOfertaId, setSelectedOfertaId] = useState<string>('TODAS');
  const [activeTab, setActiveTab] = useState<'TODAS' | 'IA_SCREENING' | 'PRUEBA_TECNICA' | 'PSICOMETRICO'>('TODAS');

  // Modales
  const [selectedEvaluacion, setSelectedEvaluacion] = useState<EvaluacionItem | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [gradingTarget, setGradingTarget] = useState<EvaluacionItem | null>(null);
  const [gradeInput, setGradeInput] = useState<number>(85);
  const [gradeStatus, setGradeStatus] = useState<'RECOMENDADO' | 'ACEPTABLE' | 'NO_RECOMENDADO'>('RECOMENDADO');
  const [feedbackInput, setFeedbackInput] = useState('');
  const [reanalyzingId, setReanalyzingId] = useState<string | null>(null);

  // Formulario de nueva evaluación
  const [newEvalPostulacionId, setNewEvalPostulacionId] = useState('');
  const [newEvalTipo, setNewEvalTipo] = useState<TipoEvaluacion>('PRUEBA_TECNICA');

  // Cargar datos reales del backend
  useEffect(() => {
    const loadCompanyData = async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        // 1. Cargar ofertas de la empresa
        const jobsRes = await jobService.getCompanyJobs(user.id, { size: 50 });
        const jobs = jobsRes.content || [];
        setCompanyJobs(jobs);

        // 2. Cargar postulaciones de la empresa
        const appsRes = await jobService.getCompanyApplications({ size: 100 });
        const apps = appsRes.content || [];
        setPostulaciones(apps);

        // 3. Convertir postulaciones en evaluaciones (Screening IA)
        const allEvaluations: EvaluacionItem[] = [];

        for (const app of apps) {
          const matchingJob = jobs.find(j => j.id === app.ofertaId);
          const jobTitle = app.ofertaTitulo || matchingJob?.titulo || 'Vacante Laboral';

          // Evaluación IA proveniente del screening del CV o análisis con Gemini
          const hasAiData = app.porcentajeCoincidencia !== undefined && app.porcentajeCoincidencia !== null;
          const aiScore = hasAiData ? app.porcentajeCoincidencia! : 0;
          const habilidades = app.habilidadesEncontradas
            ? app.habilidadesEncontradas.split(/[,;\n•-]+/).map(s => s.trim()).filter(Boolean)
            : (hasAiData ? ['Competencias profesionales', 'Habilidades técnicas del puesto'] : ['Pendiente de detección']);

          const cumple = app.cumpleRequerimientos !== undefined && app.cumpleRequerimientos !== null
            ? app.cumpleRequerimientos
            : (hasAiData ? (aiScore >= 70) : undefined);

          // Si origenAnalisis es null, NO asumir GEMINI. Usar: GEMINI, FALLBACK, SIN_CLASIFICAR
          let origenIa: 'GEMINI' | 'FALLBACK' | 'SIN_CLASIFICAR' = 'SIN_CLASIFICAR';
          if (app.origenAnalisis === 'GEMINI') {
            origenIa = 'GEMINI';
          } else if (app.origenAnalisis === 'FALLBACK') {
            origenIa = 'FALLBACK';
          } else {
            origenIa = 'SIN_CLASIFICAR';
          }

          let tituloPrueba = 'Pendiente de análisis';
          let defaultResumen = 'Esta postulación aún no cuenta con un análisis de screening IA.';

          if (hasAiData) {
            if (origenIa === 'GEMINI') {
              tituloPrueba = 'Screening con Gemini IA';
              defaultResumen = 'Screening y análisis de compatibilidad de CV realizado con Gemini IA.';
            } else if (origenIa === 'FALLBACK') {
              tituloPrueba = 'Análisis de contingencia';
              defaultResumen = 'Análisis de compatibilidad estructurado por contingencia técnica.';
            } else {
              tituloPrueba = 'Screening sin clasificar';
              defaultResumen = 'Análisis de compatibilidad registrado sin clasificación de motor IA.';
            }
          }

          const estadoIa: EstadoEvaluacion = !hasAiData
            ? 'PENDIENTE'
            : (cumple ? 'APROBADO' : (aiScore >= 50 ? 'EN_REVISION' : 'DESCALIFICADO'));

          allEvaluations.push({
            id: `eval-ia-${app.uuid || app.id}`,
            candidatoId: app.candidatoId,
            candidatoNombre: app.candidatoNombre || 'Candidato Postulante',
            candidatoEmail: app.candidatoEmail || 'candidato@correo.com',
            candidatoFoto: app.candidatoFoto,
            ofertaId: app.ofertaId,
            ofertaTitulo: jobTitle,
            postulacionId: app.uuid || app.id,
            tipo: 'IA_SCREENING',
            origenIa,
            tituloPrueba,
            puntaje: aiScore,
            estado: estadoIa,
            fechaRealizacion: app.fechaPostulacion || new Date().toISOString(),
            duracionMinutos: 2,
            habilidadesEvaluadas: habilidades.length > 0 ? habilidades : (hasAiData ? ['Tecnologías del puesto'] : ['Pendiente']),
            resumenIa: app.resumenIa || defaultResumen,
            cumpleRequerimientos: cumple,
            nivelDificultad: 'MID'
          });
        }

        // 4. Cargar evaluaciones manuales de la empresa en una sola consulta consolidada (Eliminación de N+1)
        try {
          const evalRes = await jobService.getCompanyEvaluations({ size: 100 });
          const backendEvals = evalRes.content || [];

          for (const backendEval of backendEvals) {
            const evalTipo = (backendEval.tipo || 'PRUEBA_TECNICA') as TipoEvaluacion;
            const evalTitulo = backendEval.tituloPrueba || (
              evalTipo === 'PSICOMETRICO' ? 'Test Psicométrico / Soft Skills' :
                evalTipo === 'ENTREVISTA_TECNICA' ? 'Entrevista Técnica' : 'Prueba Técnica'
            );

            let estadoEval: EstadoEvaluacion = 'PENDIENTE';
            if (backendEval.estado) {
              estadoEval = backendEval.estado.toUpperCase() as EstadoEvaluacion;
            } else if (backendEval.recomendacion === 'RECOMENDADO') {
              estadoEval = 'APROBADO';
            } else if (backendEval.recomendacion === 'NO_RECOMENDADO') {
              estadoEval = 'DESCALIFICADO';
            } else if (backendEval.recomendacion === 'ACEPTABLE') {
              estadoEval = 'COMPLETADA';
            } else if (backendEval.puntaje > 0) {
              estadoEval = 'EN_REVISION';
            }

            const appRelacionada = apps.find(a => (a.uuid || a.id) === backendEval.postulacionId);
            const matchingJob = jobs.find(j => j.id === (backendEval.ofertaId || appRelacionada?.ofertaId));

            allEvaluations.push({
              id: `eval-backend-${backendEval.uuid || backendEval.id}`,
              evaluacionBackendId: backendEval.uuid || backendEval.id,
              candidatoId: backendEval.candidatoId || appRelacionada?.candidatoId || 'candidato-id',
              candidatoNombre: backendEval.candidatoNombre || appRelacionada?.candidatoNombre || 'Candidato',
              candidatoEmail: backendEval.candidatoEmail || appRelacionada?.candidatoEmail || 'candidato@correo.com',
              ofertaId: backendEval.ofertaId || appRelacionada?.ofertaId || '',
              ofertaTitulo: backendEval.ofertaTitulo || appRelacionada?.ofertaTitulo || matchingJob?.titulo || 'Vacante Laboral',
              postulacionId: backendEval.postulacionId || appRelacionada?.uuid || appRelacionada?.id,
              tipo: evalTipo,
              tituloPrueba: evalTitulo,
              puntaje: backendEval.puntaje || 0,
              estado: estadoEval,
              fechaRealizacion: backendEval.fechaEvaluacion || new Date().toISOString(),
              duracionMinutos: 45,
              habilidadesEvaluadas: ['Evaluación técnica', 'Competencias profesionales'],
              comentariosEvaluador: backendEval.comentario,
              recomendacion: backendEval.recomendacion,
              nivelDificultad: 'MID'
            });
          }
        } catch (evalError) {
          console.warn('No se pudieron cargar evaluaciones consolidadas de la empresa:', evalError);
        }

        setEvaluaciones(allEvaluations);
      } catch (error) {
        console.error('Error al cargar evaluaciones:', error);
        await alerts.error('Error', 'Error al cargar las evaluaciones.');
      } finally {
        setLoading(false);
      }
    };

    loadCompanyData();
  }, [user?.id]);

  // Métricas calculadas (excluyendo canceladas de los contadores activos)
  const metrics = useMemo(() => {
    const activas = evaluaciones.filter(e => e.estado !== 'CANCELADA');
    const total = activas.length;
    const aprobadas = activas.filter(e => e.estado === 'APROBADO' || (e.puntaje >= 75 && e.estado !== 'DESCALIFICADO')).length;
    const iaScreenings = activas.filter(e => e.tipo === 'IA_SCREENING').length;
    const promedioPuntaje = total > 0
      ? Math.round(activas.reduce((acc, curr) => acc + curr.puntaje, 0) / total)
      : 0;

    return { total, aprobadas, iaScreenings, promedioPuntaje };
  }, [evaluaciones]);

  // Filtros aplicados
  const filteredEvaluaciones = useMemo(() => {
    return evaluaciones.filter(item => {
      if (activeTab !== 'TODAS' && item.tipo !== activeTab) return false;
      if (selectedTipo !== 'TODOS' && item.tipo !== selectedTipo) return false;
      if (selectedEstado !== 'TODOS') {
        if (item.estado !== selectedEstado) return false;
      } else {
        // En TODOS, omitir las evaluaciones CANCELADAS a menos que se filtren explícitamente por estado CANCELADA
        if (item.estado === 'CANCELADA') return false;
      }
      if (selectedOfertaId !== 'TODAS' && item.ofertaId !== selectedOfertaId) return false;

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const cand = item.candidatoNombre.toLowerCase();
        const email = item.candidatoEmail.toLowerCase();
        const title = item.tituloPrueba.toLowerCase();
        const job = item.ofertaTitulo.toLowerCase();
        return cand.includes(query) || email.includes(query) || title.includes(query) || job.includes(query);
      }
      return true;
    });
  }, [evaluaciones, activeTab, selectedTipo, selectedEstado, selectedOfertaId, searchTerm]);

  // Manejador para Calificar / Actualizar Nota
  const handleSaveGrade = async () => {
    if (!gradingTarget) return;

    if (gradingTarget.tipo === 'IA_SCREENING') {
      await alerts.warning('Acción no permitida', 'No se permite modificar los resultados automáticos del Screening con IA.');
      return;
    }

    try {
      // Si tiene evaluacionBackendId, actualizar en el backend
      if (gradingTarget.evaluacionBackendId) {
        await jobService.updateEvaluation(gradingTarget.evaluacionBackendId, {
          puntaje: gradeInput,
          recomendacion: gradeStatus,
          comentario: feedbackInput.trim(),
          tipo: gradingTarget.tipo,
          tituloPrueba: gradingTarget.tituloPrueba,
          estado: 'COMPLETADA'
        });

        await alerts.success('Evaluación calificada', 'La calificación fue guardada en el servidor.');
      } else {
        await alerts.success('Calificación guardada', 'La calificación fue actualizada localmente.');
      }

      // Actualizar estado local
      setEvaluaciones(prev => prev.map(item => {
        if (item.id === gradingTarget.id) {
          let nuevoEstado: EstadoEvaluacion = 'COMPLETADA';
          if (gradeStatus === 'RECOMENDADO') nuevoEstado = 'APROBADO';
          else if (gradeStatus === 'NO_RECOMENDADO') nuevoEstado = 'DESCALIFICADO';
          else nuevoEstado = 'COMPLETADA';

          return {
            ...item,
            puntaje: gradeInput,
            estado: nuevoEstado,
            recomendacion: gradeStatus,
            comentariosEvaluador: feedbackInput.trim() || item.comentariosEvaluador
          };
        }
        return item;
      }));

      setGradingTarget(null);
    } catch (error: any) {
      console.error('Error al guardar evaluación:', error);
      const errorMsg = error?.response?.data?.message || error?.response?.data?.error || 'Error al guardar la evaluación.';
      await alerts.error('Error al guardar', errorMsg);
    }
  };

  // Manejador para Reanalizar CV con IA
  const handleReanalizarCv = async (item: EvaluacionItem) => {
    if (!item.postulacionId) {
      await alerts.error('Error', 'No se encontró el identificador de la postulación.');
      return;
    }

    setReanalyzingId(item.id);
    try {
      const res = await jobService.reanalizarPostulacionIa(item.postulacionId);
      const origenReal = res.origenAnalisis === 'GEMINI' ? 'GEMINI' : 'FALLBACK';

      if (origenReal === 'GEMINI') {
        await alerts.success(
          'Reanálisis con Gemini completado',
          `El CV de ${item.candidatoNombre} fue analizado exitosamente por Gemini contra los requisitos de la vacante.`
        );
      } else {
        await alerts.warning(
          'Gemini no estuvo disponible. Se utilizó análisis de contingencia.',
          `No fue posible obtener el análisis directo de Gemini. Se utilizó análisis de contingencia para ${item.candidatoNombre}.`
        );
      }

      const nuevoTitulo = origenReal === 'GEMINI' ? 'Screening con Gemini IA' : 'Análisis de contingencia';
      const aiScore = typeof res.porcentajeCoincidencia === 'number' ? res.porcentajeCoincidencia : (item.puntaje ?? 0);
      const cumple = typeof res.cumpleRequerimientos === 'boolean' ? res.cumpleRequerimientos : Boolean(item.cumpleRequerimientos);
      const estadoIa: EstadoEvaluacion = cumple ? 'APROBADO' : (aiScore >= 50 ? 'EN_REVISION' : 'DESCALIFICADO');
      const habs = res.habilidadesEncontradas
        ? res.habilidadesEncontradas.split(/[,;\n•-]+/).map(s => s.trim()).filter(Boolean)
        : [];

      const updatedItem: EvaluacionItem = {
        ...item,
        origenIa: origenReal,
        tituloPrueba: nuevoTitulo,
        puntaje: aiScore,
        cumpleRequerimientos: cumple,
        resumenIa: res.resumenIa || '',
        habilidadesEvaluadas: habs.length > 0 ? habs : item.habilidadesEvaluadas,
        estado: estadoIa,
      };

      setEvaluaciones(prev => prev.map(e => e.id === item.id ? updatedItem : e));
      setSelectedEvaluacion(updatedItem);
      setPostulaciones(prev => prev.map(p => {
        if ((p.uuid || p.id) === item.postulacionId) {
          return {
            ...p,
            origenAnalisis: origenReal,
            porcentajeCoincidencia: aiScore,
            cumpleRequerimientos: cumple,
            resumenIa: res.resumenIa,
            habilidadesEncontradas: res.habilidadesEncontradas
          };
        }
        return p;
      }));
    } catch (err: any) {
      console.error('Error al reanalizar CV con IA:', err);
      const msg = err?.response?.data?.message || err?.message || 'Error al ejecutar el reanálisis con IA.';
      await alerts.error('Error de Reanálisis', msg);
    } finally {
      setReanalyzingId(null);
    }
  };

  // Manejador para Crear / Asignar Evaluación
  const handleCreateEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newEvalPostulacionId) {
      await alerts.warning('Campo requerido', 'Por favor selecciona una postulación.');
      return;
    }

    if (newEvalTipo === 'IA_SCREENING') {
      await alerts.warning('Acción no permitida', 'No se permite crear evaluaciones de Screening IA manualmente.');
      return;
    }

    // Condición 3: Evitar duplicados (candidato + oferta + tipo)
    const app = postulaciones.find(p => p.uuid === newEvalPostulacionId || p.id === newEvalPostulacionId);
    if (!app) {
      await alerts.error('Error', 'No se encontró la postulación seleccionada.');
      return;
    }

    const yaExisteActiva = evaluaciones.some(evalItem =>
      evalItem.candidatoId === app.candidatoId &&
      evalItem.ofertaId === app.ofertaId &&
      evalItem.tipo === newEvalTipo &&
      evalItem.estado !== 'CANCELADA'
    );

    if (yaExisteActiva) {
      await alerts.warning(
        'Evaluación duplicada',
        `Ya existe una evaluación activa de tipo "${getTipoBadge(newEvalTipo).label}" para este candidato en esta oferta.`
      );
      return;
    }

    try {
      const tituloSugerido = newEvalTipo === 'PSICOMETRICO'
        ? 'Test Psicométrico / Soft Skills'
        : newEvalTipo === 'ENTREVISTA_TECNICA'
          ? 'Entrevista Técnica'
          : 'Prueba Técnica';

      // Crear evaluación en el backend
      const response = await jobService.createEvaluation(newEvalPostulacionId, {
        puntaje: 0,
        recomendacion: 'PENDIENTE',
        comentario: 'Evaluación pendiente de calificación',
        tipo: newEvalTipo,
        tituloPrueba: tituloSugerido,
        estado: 'PENDIENTE'
      });

      await alerts.success('Evaluación creada', 'La nueva evaluación fue asignada correctamente.');
      setIsCreateModalOpen(false);
      setNewEvalPostulacionId('');

      // Recargar evaluaciones en el estado local
      const matchingJob = companyJobs.find(j => j.id === app.ofertaId);
      const newEval: EvaluacionItem = {
        id: `eval-backend-${response.uuid || response.id}`,
        evaluacionBackendId: response.uuid || response.id,
        candidatoId: app.candidatoId,
        candidatoNombre: app.candidatoNombre || 'Candidato',
        candidatoEmail: app.candidatoEmail || 'candidato@correo.com',
        ofertaId: app.ofertaId,
        ofertaTitulo: app.ofertaTitulo || matchingJob?.titulo || 'Oferta',
        postulacionId: newEvalPostulacionId,
        tipo: newEvalTipo,
        tituloPrueba: tituloSugerido,
        puntaje: 0,
        estado: 'PENDIENTE',
        fechaRealizacion: new Date().toISOString(),
        duracionMinutos: 45,
        habilidadesEvaluadas: ['Evaluación técnica', 'Competencias requeridas'],
        comentariosEvaluador: 'Evaluación pendiente de calificación',
        recomendacion: 'PENDIENTE',
        nivelDificultad: 'MID'
      };

      setEvaluaciones(prev => [newEval, ...prev]);
    } catch (error: any) {
      console.error('Error al crear evaluación:', error);
      const errorMsg = error?.response?.data?.message || error?.response?.data?.error || 'Error al crear la evaluación';
      await alerts.error('Error al crear', errorMsg);
    }
  };

  // Manejador para Eliminar o Cancelar Evaluación (Condición 1 & 2)
  const handleDeleteOrCancelEvaluation = async (item: EvaluacionItem) => {
    if (item.tipo === 'IA_SCREENING' || !item.evaluacionBackendId) {
      await alerts.warning('Acción no permitida', 'No se permite eliminar los resultados del Screening con IA.');
      return;
    }

    const isCompleted = item.estado === 'COMPLETADA' || item.estado === 'APROBADO' || item.estado === 'DESCALIFICADO';

    const result = isCompleted
      ? await alerts.confirm(
        '¿Cancelar evaluación?',
        `La evaluación de ${item.candidatoNombre} ya fue completada. Se marcará como CANCELADA para conservar el historial.`,
        'Sí, cancelar evaluación'
      )
      : await alerts.confirmDanger(
        '¿Eliminar evaluación?',
        `Se eliminará la evaluación técnica de ${item.candidatoNombre}. Esta acción no se puede deshacer.`,
        'Sí, eliminar'
      );

    if (!result.isConfirmed) return;

    try {
      const res = await jobService.deleteOrCancelEvaluation(item.evaluacionBackendId);

      if (res?.accion === 'CANCELADA' || isCompleted) {
        await alerts.success('Evaluación cancelada', res?.mensaje || 'La evaluación fue marcada como CANCELADA para conservar el historial.');
        setEvaluaciones(prev => prev.map(e => {
          if (e.id === item.id || (item.evaluacionBackendId && e.evaluacionBackendId === item.evaluacionBackendId)) {
            return { ...e, estado: 'CANCELADA' };
          }
          return e;
        }));
      } else {
        await alerts.success('Evaluación eliminada', res?.mensaje || 'La evaluación fue eliminada correctamente.');
        setEvaluaciones(prev => prev.filter(e => e.id !== item.id && e.evaluacionBackendId !== item.evaluacionBackendId));
      }
    } catch (error: any) {
      console.error('Error al eliminar o cancelar evaluación:', error);
      const errorMsg = error?.response?.data?.message || error?.response?.data?.error || 'Error al procesar la solicitud.';
      await alerts.error('Error', errorMsg);
    }
  };

  const getTipoBadge = (tipo: TipoEvaluacion, origenIa?: 'GEMINI' | 'FALLBACK' | 'SIN_CLASIFICAR') => {
    switch (tipo) {
      case 'IA_SCREENING':
        if (origenIa === 'FALLBACK') {
          return {
            label: 'Análisis de contingencia',
            icon: Sparkles,
            bg: 'bg-amber-50',
            text: 'text-amber-700',
            border: 'border-amber-200'
          };
        }
        if (origenIa === 'SIN_CLASIFICAR') {
          return {
            label: 'Screening sin clasificar',
            icon: Sparkles,
            bg: 'bg-slate-100',
            text: 'text-slate-700',
            border: 'border-slate-200'
          };
        }
        return {
          label: 'Screening con Gemini IA',
          icon: Sparkles,
          bg: 'bg-purple-50',
          text: 'text-purple-700',
          border: 'border-purple-200'
        };
      case 'PRUEBA_TECNICA':
        return {
          label: 'Prueba Técnica',
          icon: CheckSquare,
          bg: 'bg-blue-50',
          text: 'text-blue-700',
          border: 'border-blue-200'
        };
      case 'PSICOMETRICO':
        return {
          label: 'Psicométrico / Soft Skills',
          icon: Award,
          bg: 'bg-amber-50',
          text: 'text-amber-700',
          border: 'border-amber-200'
        };
      case 'ENTREVISTA_TECNICA':
        return {
          label: 'Entrevista Técnica',
          icon: Clock,
          bg: 'bg-emerald-50',
          text: 'text-emerald-700',
          border: 'border-emerald-200'
        };
      default:
        return {
          label: tipo,
          icon: CheckSquare,
          bg: 'bg-slate-100',
          text: 'text-slate-700',
          border: 'border-slate-200'
        };
    }
  };

  const getPuntajeColor = (puntaje: number) => {
    if (puntaje >= 85) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (puntaje >= 70) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (puntaje >= 50) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-rose-600 bg-rose-50 border-rose-200';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Evaluaciones y Pruebas Técnicas</h1>
            <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-200">
              Módulo Empresa
            </span>
          </div>
          <p className="text-slate-500 text-sm">
            Monitorea el desempeño de tus candidatos, resultados de matching con IA y asigna pruebas a medida.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="gap-2 shadow-md shadow-blue-600/20 bg-blue-600 hover:bg-blue-700 text-white"
            disabled={postulaciones.length === 0}
          >
            <Plus className="h-4 w-4" />
            Asignar Nueva Evaluación
          </Button>
        </div>
      </div>

      {/* Tarjetas de Métricas Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <CheckSquare className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">{metrics.total}</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Evaluaciones Totales</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-purple-700">{metrics.iaScreenings}</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Screening con IA</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-700">{metrics.aprobadas}</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Calificación Aprobatoria</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">{metrics.promedioPuntaje}%</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Puntaje Promedio</div>
          </div>
        </div>
      </div>

      {/* Pestañas de Navegación Rápida */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2 text-sm font-medium">
        <button
          onClick={() => setActiveTab('TODAS')}
          className={`pb-3 px-4 border-b-2 transition-all whitespace-nowrap ${activeTab === 'TODAS'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
        >
          Todas ({evaluaciones.filter(e => e.estado !== 'CANCELADA').length})
        </button>
        <button
          onClick={() => setActiveTab('IA_SCREENING')}
          className={`pb-3 px-4 border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'IA_SCREENING'
              ? 'border-purple-600 text-purple-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
        >
          <Sparkles className="h-3.5 w-3.5 text-purple-600" />
          Evaluaciones de IA ({evaluaciones.filter(e => e.tipo === 'IA_SCREENING').length})
        </button>
        <button
          onClick={() => setActiveTab('PRUEBA_TECNICA')}
          className={`pb-3 px-4 border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'PRUEBA_TECNICA'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
        >
          <CheckSquare className="h-3.5 w-3.5 text-blue-600" />
          Pruebas Técnicas ({evaluaciones.filter(e => e.tipo === 'PRUEBA_TECNICA' && e.estado !== 'CANCELADA').length})
        </button>
        <button
          onClick={() => setActiveTab('PSICOMETRICO')}
          className={`pb-3 px-4 border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'PSICOMETRICO'
              ? 'border-amber-600 text-amber-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
        >
          <Award className="h-3.5 w-3.5 text-amber-600" />
          Psicométricos ({evaluaciones.filter(e => e.tipo === 'PSICOMETRICO' && e.estado !== 'CANCELADA').length})
        </button>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por candidato, email, título de prueba u oferta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500 whitespace-nowrap">Tipo:</span>
            <select
              value={selectedTipo}
              onChange={(e) => setSelectedTipo(e.target.value)}
              className="text-xs font-medium py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-700"
            >
              <option value="TODOS">Todos los tipos</option>
              <option value="IA_SCREENING">Screening IA</option>
              <option value="PRUEBA_TECNICA">Prueba Técnica</option>
              <option value="PSICOMETRICO">Psicométrico</option>
              <option value="ENTREVISTA_TECNICA">Entrevista</option>
            </select>
          </div>

          {companyJobs.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500 whitespace-nowrap">Oferta:</span>
              <select
                value={selectedOfertaId}
                onChange={(e) => setSelectedOfertaId(e.target.value)}
                className="text-xs font-medium py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-700"
              >
                <option value="TODAS">Todas las vacantes</option>
                {companyJobs.map(job => (
                  <option key={job.id} value={job.id}>{job.titulo}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500 whitespace-nowrap">Resultado:</span>
            <select
              value={selectedEstado}
              onChange={(e) => setSelectedEstado(e.target.value)}
              className="text-xs font-medium py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-700"
            >
              <option value="TODOS">Todos los estados</option>
              <option value="APROBADO">Aprobado</option>
              <option value="COMPLETADA">Completada</option>
              <option value="EN_REVISION">En Revisión</option>
              <option value="EN_PROGRESO">En Progreso</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="DESCALIFICADO">Descalificado</option>
              <option value="CANCELADA">Cancelada (Historial)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contenido Principal / Tabla de Evaluaciones */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500 font-medium">Cargando evaluaciones...</p>
          </div>
        ) : filteredEvaluaciones.length === 0 ? (
          <div className="p-16 text-center">
            <div className="h-16 w-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">No se encontraron evaluaciones</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
              {postulaciones.length === 0
                ? 'Aún no tienes candidatos postulados. Las evaluaciones aparecerán cuando recibas postulaciones.'
                : 'No hay evaluaciones que coincidan con los filtros aplicados.'}
            </p>
            {postulaciones.length > 0 && (
              <Button onClick={() => setIsCreateModalOpen(true)}>Asignar Nueva Evaluación</Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm text-slate-600">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Candidato / Posición</th>
                  <th className="px-6 py-4">Tipo & Prueba</th>
                  <th className="px-6 py-4 text-center">Puntaje / Match</th>
                  <th className="px-6 py-4">Habilidades Detectadas</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {filteredEvaluaciones.map((item) => {
                  const badge = getTipoBadge(item.tipo, item.origenIa);
                  const Icon = badge.icon;
                  const puntajeColor = getPuntajeColor(item.puntaje);

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center shadow-xs text-sm">
                            {item.candidatoNombre.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 leading-snug">{item.candidatoNombre}</p>
                            <p className="text-xs text-slate-500">{item.candidatoEmail}</p>
                            <div className="flex items-center gap-1 text-[11px] text-blue-600 font-medium mt-0.5">
                              <Briefcase className="h-3 w-3" />
                              <span className="truncate max-w-[200px]">{item.ofertaTitulo}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border mb-1.5 ${badge.bg} ${badge.text} ${badge.border}`}>
                          <Icon className="h-3 w-3" />
                          {badge.label}
                        </span>
                        <p className="font-semibold text-slate-800 text-sm leading-tight">{item.tituloPrueba}</p>
                        {item.resumenIa && item.tipo === 'IA_SCREENING' && (
                          <p className="text-xs text-slate-500 line-clamp-2 mt-1 italic">
                            "{item.resumenIa}"
                          </p>
                        )}
                        {item.duracionMinutos && (
                          <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3" /> {item.duracionMinutos} min
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          {item.tipo === 'IA_SCREENING' && item.estado === 'PENDIENTE' && item.puntaje === 0 ? (
                            <>
                              <span className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                Pendiente de análisis
                              </span>
                              <span className="text-[11px] text-slate-400 font-medium mt-1">
                                0%
                              </span>
                            </>
                          ) : (
                            <>
                              <span className={`px-3 py-1 rounded-xl text-base font-black border ${puntajeColor}`}>
                                {item.puntaje}%
                              </span>
                              <span className="text-[11px] text-slate-400 font-medium mt-1">
                                {item.puntaje >= 85 ? 'Sobresaliente' : item.puntaje >= 70 ? 'Competente' : item.puntaje >= 50 ? 'En desarrollo' : 'Bajo'}
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {item.habilidadesEvaluadas.slice(0, 3).map((h, i) => (
                            <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[11px] rounded-md font-medium border border-slate-200">
                              {h}
                            </span>
                          ))}
                          {item.habilidadesEvaluadas.length > 3 && (
                            <span className="px-1.5 py-0.5 bg-slate-50 text-slate-500 text-[11px] rounded-md font-medium">
                              +{item.habilidadesEvaluadas.length - 3}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${item.estado === 'APROBADO' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              item.estado === 'COMPLETADA' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                item.estado === 'EN_REVISION' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                  item.estado === 'EN_PROGRESO' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                    item.estado === 'PENDIENTE' ? 'bg-slate-100 text-slate-700 border-slate-300' :
                                      item.estado === 'CANCELADA' ? 'bg-slate-100 text-slate-400 border-slate-200 line-through' :
                                        'bg-rose-50 text-rose-700 border-rose-200'
                            }`}>
                            {item.estado.replace('_', ' ')}
                          </span>
                          {item.cumpleRequerimientos !== undefined && (
                            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${item.cumpleRequerimientos ? 'text-emerald-700' : 'text-rose-600'
                              }`}>
                              {item.cumpleRequerimientos ? '✓ Cumple requisitos' : '✗ No cumple requisitos'}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedEvaluacion(item)}
                          className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-flex items-center"
                          title="Ver informe completo"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {/* Solo evaluaciones manuales activas pueden ser calificadas o editadas */}
                        {item.evaluacionBackendId && item.tipo !== 'IA_SCREENING' && item.estado !== 'CANCELADA' && (
                          <button
                            onClick={() => {
                              setGradingTarget(item);
                              setGradeInput(item.puntaje);
                              setGradeStatus(item.recomendacion && item.recomendacion !== 'PENDIENTE' ? item.recomendacion : 'RECOMENDADO');
                              setFeedbackInput(item.comentariosEvaluador || '');
                            }}
                            className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors inline-flex items-center"
                            title="Calificar o retroalimentar"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                        )}

                        {/* Solo evaluaciones manuales pueden ser eliminadas o canceladas */}
                        {item.evaluacionBackendId && item.tipo !== 'IA_SCREENING' && (
                          <button
                            onClick={() => handleDeleteOrCancelEvaluation(item)}
                            className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors inline-flex items-center"
                            title={item.estado === 'COMPLETADA' || item.estado === 'APROBADO' || item.estado === 'DESCALIFICADO'
                              ? 'Cancelar evaluación (conservar historial)'
                              : 'Eliminar evaluación'}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal 1: Ver Informe Detallado */}
      {selectedEvaluacion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 animate-in slide-in-from-bottom-4">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getTipoBadge(selectedEvaluacion.tipo, selectedEvaluacion.origenIa).bg} ${getTipoBadge(selectedEvaluacion.tipo, selectedEvaluacion.origenIa).text} ${getTipoBadge(selectedEvaluacion.tipo, selectedEvaluacion.origenIa).border}`}>
                    {getTipoBadge(selectedEvaluacion.tipo, selectedEvaluacion.origenIa).label}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(selectedEvaluacion.fechaRealizacion).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900">{selectedEvaluacion.tituloPrueba}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Vacante: <strong className="text-slate-700">{selectedEvaluacion.ofertaTitulo}</strong></p>
              </div>
              <button
                onClick={() => setSelectedEvaluacion(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="py-5 space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-lg flex items-center justify-center shadow-sm">
                    {selectedEvaluacion.candidatoNombre.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">{selectedEvaluacion.candidatoNombre}</h4>
                    <p className="text-xs text-slate-500">{selectedEvaluacion.candidatoEmail}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <span className="text-xs font-medium text-emerald-600">
                        Estado: {selectedEvaluacion.estado}
                      </span>
                      {selectedEvaluacion.cumpleRequerimientos !== undefined && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold ${selectedEvaluacion.cumpleRequerimientos
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}>
                          {selectedEvaluacion.cumpleRequerimientos ? '✓ Cumple requisitos' : '✗ No cumple requisitos'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-center sm:text-right">
                  {selectedEvaluacion.tipo === 'IA_SCREENING' && selectedEvaluacion.estado === 'PENDIENTE' && selectedEvaluacion.puntaje === 0 ? (
                    <div className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 text-slate-700 text-sm font-bold">
                      Pendiente de análisis (0%)
                    </div>
                  ) : (
                    <>
                      <div className={`text-3xl font-black px-4 py-1.5 rounded-2xl border ${getPuntajeColor(selectedEvaluacion.puntaje)}`}>
                        {selectedEvaluacion.puntaje}%
                      </div>
                      <span className="text-xs font-medium text-slate-500 block mt-1">Match con el perfil</span>
                    </>
                  )}
                </div>
              </div>

              {selectedEvaluacion.resumenIa && (
                <div className={`p-4 rounded-xl border ${selectedEvaluacion.origenIa === 'FALLBACK'
                    ? 'bg-amber-50/70 border-amber-200'
                    : (selectedEvaluacion.origenIa === 'SIN_CLASIFICAR' ? 'bg-slate-50 border-slate-200' : 'bg-purple-50/70 border-purple-100')
                  }`}>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className={`flex items-center gap-2 font-bold text-sm ${selectedEvaluacion.origenIa === 'FALLBACK'
                        ? 'text-amber-800'
                        : (selectedEvaluacion.origenIa === 'SIN_CLASIFICAR' ? 'text-slate-800' : 'text-purple-800')
                      }`}>
                      <Sparkles className={`h-4 w-4 ${selectedEvaluacion.origenIa === 'FALLBACK'
                          ? 'text-amber-600'
                          : (selectedEvaluacion.origenIa === 'SIN_CLASIFICAR' ? 'text-slate-500' : 'text-purple-600')
                        }`} />
                      {selectedEvaluacion.origenIa === 'FALLBACK'
                        ? 'Diagnóstico de Contingencia (Análisis Estructurado)'
                        : (selectedEvaluacion.origenIa === 'SIN_CLASIFICAR'
                          ? 'Diagnóstico sin Clasificación de IA'
                          : 'Diagnóstico de Inteligencia Artificial (Gemini)')}
                    </div>
                    {selectedEvaluacion.cumpleRequerimientos !== undefined && (
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${selectedEvaluacion.cumpleRequerimientos
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                        }`}>
                        {selectedEvaluacion.cumpleRequerimientos ? 'Cumple requisitos' : 'Requisitos no cubiertos'}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {selectedEvaluacion.resumenIa}
                  </p>
                </div>
              )}

              <div>
                <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                  Competencias y Tecnologías Evaluadas
                </h5>
                <div className="flex flex-wrap gap-2">
                  {selectedEvaluacion.habilidadesEvaluadas.map((hab, i) => (
                    <span key={i} className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 shadow-xs flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                      {hab}
                    </span>
                  ))}
                </div>
              </div>

              {selectedEvaluacion.comentariosEvaluador && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Comentarios del Evaluador Técnico
                  </h5>
                  <p className="text-sm text-slate-600">
                    "{selectedEvaluacion.comentariosEvaluador}"
                  </p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div>
                {selectedEvaluacion.tipo === 'IA_SCREENING' ? (
                  <button
                    type="button"
                    disabled={reanalyzingId === selectedEvaluacion.id}
                    onClick={() => handleReanalizarCv(selectedEvaluacion)}
                    className={`px-3.5 py-2 ${reanalyzingId === selectedEvaluacion.id ? 'opacity-70 cursor-not-allowed' : ''} bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1.5`}
                  >
                    <Sparkles className={`h-4 w-4 text-purple-600 ${reanalyzingId === selectedEvaluacion.id ? 'animate-spin' : ''}`} />
                    {reanalyzingId === selectedEvaluacion.id ? 'Reanalizando con IA...' : 'Reanalizar CV con IA'}
                  </button>
                ) : (
                  selectedEvaluacion.evaluacionBackendId && selectedEvaluacion.estado !== 'CANCELADA' && (
                    <button
                      onClick={() => {
                        const target = selectedEvaluacion;
                        setSelectedEvaluacion(null);
                        setGradingTarget(target);
                        setGradeInput(target.puntaje);
                        setGradeStatus(target.recomendacion && target.recomendacion !== 'PENDIENTE' ? target.recomendacion : 'RECOMENDADO');
                        setFeedbackInput(target.comentariosEvaluador || '');
                      }}
                      className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
                    >
                      <Edit3 className="h-4 w-4" />
                      Calificar o Editar Evaluación
                    </button>
                  )
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => setSelectedEvaluacion(null)}>
                  Cerrar
                </Button>
                <button
                  onClick={() => alerts.info('Función en desarrollo', `Informe PDF para ${selectedEvaluacion.candidatoNombre} estará disponible próximamente.`)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Descargar Informe
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Calificar o Modificar Evaluación */}
      {gradingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Calificar Evaluación</h3>
                <p className="text-xs text-slate-500">{gradingTarget.candidatoNombre}</p>
              </div>
              <button
                onClick={() => setGradingTarget(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Puntaje Obtenido (0 - 100)
                  </label>
                  <span className="text-base font-black text-blue-600">{gradeInput}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={gradeInput}
                  onChange={(e) => setGradeInput(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Recomendación
                </label>
                <select
                  value={gradeStatus}
                  onChange={(e) => setGradeStatus(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="RECOMENDADO">Recomendado</option>
                  <option value="ACEPTABLE">Aceptable</option>
                  <option value="NO_RECOMENDADO">No Recomendado</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Retroalimentación / Notas
                </label>
                <textarea
                  rows={3}
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  placeholder="Detalla fortalezas, áreas de mejora o recomendaciones..."
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <Button variant="ghost" onClick={() => setGradingTarget(null)}>
                Cancelar
              </Button>
              <button
                onClick={handleSaveGrade}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow transition-colors"
              >
                Guardar Calificación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Asignar Nueva Evaluación */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Asignar Nueva Evaluación</h3>
                <p className="text-xs text-slate-500">Crea una evaluación técnica para un candidato</p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvaluation} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Candidato / Postulación *
                </label>
                <select
                  value={newEvalPostulacionId}
                  onChange={(e) => setNewEvalPostulacionId(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
                >
                  <option value="">Seleccionar candidato ({postulaciones.length})</option>
                  {postulaciones.map(app => (
                    <option key={app.uuid || app.id} value={app.uuid || app.id}>
                      {app.candidatoNombre || 'Candidato'} - {app.ofertaTitulo}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tipo de Evaluación
                </label>
                <select
                  value={newEvalTipo}
                  onChange={(e) => setNewEvalTipo(e.target.value as TipoEvaluacion)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
                >
                  <option value="PRUEBA_TECNICA">Prueba Técnica</option>
                  <option value="PSICOMETRICO">Test Psicométrico</option>
                  <option value="ENTREVISTA_TECNICA">Entrevista Técnica</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
                  Cancelar
                </Button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow transition-colors"
                >
                  Crear Evaluación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
