import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Sparkles, Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { jobService } from '../services/job.service';
import type { OfertaResponse } from '../types/job.types';
import { alerts } from '@/shared/utils/alerts';

export type TipoRequisito = 'HABILIDAD' | 'EXPERIENCIA' | 'EDUCACION' | 'IDIOMA' | 'CONOCIMIENTO' | 'OTRO';

export interface RequisitoItem {
  descripcion: string;
  tipo: TipoRequisito;
  obligatorio: boolean;
  nivel?: string;
}

interface EditJobModalProps {
  job: OfertaResponse;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditJobModal: React.FC<EditJobModalProps> = ({ job, onClose, onSuccess }) => {
  const [error, setError] = useState('');
  const [categorias, setCategorias] = useState<Array<{ id: string; nombre: string }>>([]);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(true);

  // Requisitos dinámicos
  const [requisitosList, setRequisitosList] = useState<RequisitoItem[]>([]);
  const [newReqDesc, setNewReqDesc] = useState('');
  const [newReqTipo, setNewReqTipo] = useState<TipoRequisito>('HABILIDAD');
  const [newReqObligatorio, setNewReqObligatorio] = useState(true);
  const [newReqNivel, setNewReqNivel] = useState('');

  // Categorías locales de fallback
  const CATEGORIAS_LOCALES = [
    { id: '11111111-1111-1111-1111-111111111111', nombre: 'Tecnología y Sistemas' },
    { id: '22222222-2222-2222-2222-222222222222', nombre: 'Administración' },
    { id: '33333333-3333-3333-3333-333333333333', nombre: 'Ventas y Comercial' },
    { id: '44444444-4444-4444-4444-444444444444', nombre: 'Marketing' },
    { id: '55555555-5555-5555-5555-555555555555', nombre: 'Recursos Humanos' },
    { id: '66666666-6666-6666-6666-666666666666', nombre: 'Ingeniería' },
    { id: '77777777-7777-7777-7777-777777777777', nombre: 'Otros' }
  ];

  useEffect(() => {
    // 1. Cargar categorías
    jobService.getCategories()
      .then(cats => {
        if (cats && cats.length > 0) {
          setCategorias(cats);
        } else {
          setCategorias(CATEGORIAS_LOCALES);
        }
      })
      .catch(err => {
        console.error('Error al cargar categorias, usando estáticas:', err);
        setCategorias(CATEGORIAS_LOCALES);
      });

    // 2. Cargar oferta completa con sus requisitos reales desde el backend
    setLoadingDetails(true);
    jobService.getJobById(job.id)
      .then(fullJob => {
        const rawReqs = fullJob?.requisitos || job?.requisitos || [];
        const mapped: RequisitoItem[] = rawReqs.map(r => ({
          descripcion: r.descripcion || r.requisito || '',
          tipo: (r.tipo ? r.tipo.toUpperCase() : 'HABILIDAD') as TipoRequisito,
          obligatorio: r.obligatorio ?? r.esObligatorio ?? true,
          nivel: r.nivel || r.nivelRequerido || undefined
        })).filter(r => r.descripcion.trim().length > 0);

        setRequisitosList(mapped);
      })
      .catch(err => {
        console.warn('No se pudo cargar detalle completo de la oferta, usando datos recibidos:', err);
        if (job.requisitos && job.requisitos.length > 0) {
          const fallbackReqs: RequisitoItem[] = job.requisitos.map(r => ({
            descripcion: r.descripcion || r.requisito || '',
            tipo: (r.tipo ? r.tipo.toUpperCase() : 'HABILIDAD') as TipoRequisito,
            obligatorio: r.obligatorio ?? r.esObligatorio ?? true,
            nivel: r.nivel || r.nivelRequerido || undefined
          })).filter(r => r.descripcion.trim().length > 0);
          setRequisitosList(fallbackReqs);
        }
      })
      .finally(() => {
        setLoadingDetails(false);
      });
  }, [job.id]);

  const handleAddRequisito = () => {
    if (!newReqDesc.trim()) {
      alerts.warning('Requisito incompleto', 'Ingresa una descripción para el requisito.');
      return;
    }
    setRequisitosList(prev => [
      ...prev,
      {
        descripcion: newReqDesc.trim(),
        tipo: newReqTipo,
        obligatorio: newReqObligatorio,
        nivel: newReqNivel.trim() || undefined
      }
    ]);
    setNewReqDesc('');
    setNewReqNivel('');
  };

  const handleRemoveRequisito = (index: number) => {
    setRequisitosList(prev => prev.filter((_, i) => i !== index));
  };

  // Formato YYYY-MM-DD para input date
  const defaultDate = job.fechaVencimiento
    ? new Date(job.fechaVencimiento).toISOString().split('T')[0]
    : '';

  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: {
      titulo: job.titulo,
      descripcion: job.descripcion,
      categoriaId: job.categoriaId || '',
      areaProfesional: job.areaProfesional || '',
      ubicacion: job.ubicacion || '',
      fechaVencimiento: defaultDate,
      nivelExperiencia: job.nivelExperiencia,
      modalidad: job.modalidad,
      tipoContrato: job.tipoContrato,
      salarioMinimo: job.salarioMinimo ?? '',
      salarioMaximo: job.salarioMaximo ?? '',
    }
  });

  const onSubmit = async (data: any) => {
    setError('');

    if (loadingDetails) {
      alerts.warning('Cargando información', 'Por favor espera a que se carguen los requisitos antes de guardar.');
      return;
    }

    if (!data.fechaVencimiento) {
      setError('Debe indicar una fecha de vencimiento válida');
      return;
    }

    const payload = {
      oferta: {
        titulo: data.titulo,
        descripcion: data.descripcion,
        categoriaId: data.categoriaId || job.categoriaId,
        areaProfesional: data.areaProfesional,
        nivelExperiencia: data.nivelExperiencia,
        tipoContrato: data.tipoContrato,
        modalidad: data.modalidad,
        jornada: job.jornada || 'DIURNA',
        salarioMinimo: data.salarioMinimo ? Number(data.salarioMinimo) : null,
        salarioMaximo: data.salarioMaximo ? Number(data.salarioMaximo) : null,
        moneda: job.moneda || 'PEN',
        ubicacion: data.ubicacion,
        fechaVencimiento: new Date(`${data.fechaVencimiento}T23:59:59`).toISOString(),
      },
      requisitos: requisitosList.map(r => ({
        descripcion: r.descripcion,
        tipo: r.tipo,
        obligatorio: r.obligatorio,
        nivel: r.nivel || null
      }))
    };

    try {
      await jobService.updateJob(job.id, payload);
      await alerts.success('Oferta actualizada', 'Los cambios y requisitos se guardaron correctamente.');
      onSuccess();
    } catch (err: any) {
      console.error('Error al actualizar:', err);
      const msg = err.response?.data?.message || err.response?.data?.error || 'Error al actualizar la oferta';
      setError(msg);
      await alerts.error('Error al actualizar', msg);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative animate-slide-up">
        
        <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Editar Oferta de Empleo</h2>
            <p className="text-xs text-slate-500 mt-0.5">Modifica los detalles y requisitos de la vacante</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">{error}</div>}
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input label="Título del Puesto" placeholder="Ej: Desarrollador Backend Java" {...register('titulo', { required: true })} />
            
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">Descripción</label>
              <textarea 
                rows={4} 
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="Describe las responsabilidades y beneficios..."
                {...register('descripcion', { required: true })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">Categoría</label>
                <select 
                  className="w-full h-10 rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  {...register('categoriaId', { required: true })}
                >
                  <option value="" disabled>Selecciona una categoría...</option>
                  {categorias.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                  ))}
                </select>
              </div>
              <Input label="Área Profesional" placeholder="Ej: Tecnología" {...register('areaProfesional', { required: true })} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Ubicación" placeholder="Ej: Lima, Perú" {...register('ubicacion')} />
              <Input
                label="Fecha de vencimiento"
                type="date"
                min={new Date().toISOString().split('T')[0]}
                {...register('fechaVencimiento', { required: true })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">Nivel</label>
                <select className="w-full h-10 rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" {...register('nivelExperiencia')}>
                  <option value="SIN_EXPERIENCIA">Sin Experiencia</option>
                  <option value="PRACTICANTE">Practicante</option>
                  <option value="JUNIOR">Junior</option>
                  <option value="SEMI_SENIOR">Semi Senior</option>
                  <option value="SENIOR">Senior</option>
                  <option value="EXPERTO">Experto</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">Modalidad</label>
                <select className="w-full h-10 rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" {...register('modalidad')}>
                  <option value="PRESENCIAL">Presencial</option>
                  <option value="REMOTO">Remoto</option>
                  <option value="HIBRIDO">Híbrido</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">Contrato</label>
                <select className="w-full h-10 rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" {...register('tipoContrato')}>
                  <option value="TIEMPO_COMPLETO">Tiempo Completo</option>
                  <option value="MEDIO_TIEMPO">Medio Tiempo</option>
                  <option value="FREELANCE">Freelance</option>
                  <option value="TEMPORAL">Temporal</option>
                  <option value="POR_PROYECTO">Por Proyecto</option>
                  <option value="PRACTICAS">Prácticas</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Salario Mínimo (Opcional)" type="number" placeholder="2000" {...register('salarioMinimo')} />
              <Input label="Salario Máximo (Opcional)" type="number" placeholder="4000" {...register('salarioMaximo')} />
            </div>

            {/* Sección de Requisitos para el Screening IA */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-bold text-slate-800">Requisitos del Puesto (Screening IA)</span>
                  {loadingDetails && (
                    <span className="inline-flex items-center gap-1 text-xs text-indigo-600 animate-pulse">
                      <Loader2 className="w-3 h-3 animate-spin" /> Cargando...
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  {requisitosList.length} añadido{requisitosList.length === 1 ? '' : 's'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Estos requisitos son evaluados automáticamente por Gemini IA contra el CV de cada postulante.
              </p>

              {/* Lista de requisitos agregados */}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {loadingDetails ? (
                  <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                    Obteniendo requisitos de la vacante...
                  </div>
                ) : requisitosList.length === 0 ? (
                  <p className="text-xs text-slate-400 italic p-2 bg-white rounded border border-dashed border-slate-200 text-center">
                    No hay requisitos registrados. Añade al menos uno para optimizar el screening de candidatos.
                  </p>
                ) : (
                  requisitosList.map((req, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200 text-xs gap-2">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {req.tipo}
                        </span>
                        {req.obligatorio ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            Obligatorio
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                            Deseable
                          </span>
                        )}
                        <span className="font-medium text-slate-800 truncate" title={req.descripcion}>
                          {req.descripcion}
                        </span>
                        {req.nivel && (
                          <span className="text-slate-400 italic">({req.nivel})</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveRequisito(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        title="Eliminar requisito"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Formulario rápido para añadir requisito */}
              <div className="pt-2 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                <input
                  type="text"
                  placeholder="Ej: Experiencia con React y TypeScript"
                  value={newReqDesc}
                  onChange={(e) => setNewReqDesc(e.target.value)}
                  className="sm:col-span-6 h-9 rounded-md border border-slate-300 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddRequisito();
                    }
                  }}
                />
                <select
                  value={newReqTipo}
                  onChange={(e) => setNewReqTipo(e.target.value as TipoRequisito)}
                  className="sm:col-span-2 h-9 rounded-md border border-slate-300 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                >
                  <option value="HABILIDAD">Habilidad</option>
                  <option value="EXPERIENCIA">Experiencia</option>
                  <option value="EDUCACION">Educación</option>
                  <option value="IDIOMA">Idioma</option>
                  <option value="CONOCIMIENTO">Conocimiento</option>
                  <option value="OTRO">Otro</option>
                </select>
                <input
                  type="text"
                  placeholder="Nivel (Ej: 2 años)"
                  value={newReqNivel}
                  onChange={(e) => setNewReqNivel(e.target.value)}
                  className="sm:col-span-2 h-9 rounded-md border border-slate-300 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                />
                <Button
                  type="button"
                  onClick={handleAddRequisito}
                  className="sm:col-span-2 h-9 text-xs px-2 gap-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Añadir
                </Button>
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={newReqObligatorio}
                  onChange={(e) => setNewReqObligatorio(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                />
                Marcar siguiente requisito como obligatorio
              </label>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
              <Button type="submit" isLoading={isSubmitting || loadingDetails}>Guardar Cambios</Button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};
