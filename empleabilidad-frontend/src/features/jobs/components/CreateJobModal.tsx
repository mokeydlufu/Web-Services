import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Plus, Trash2, Sparkles } from 'lucide-react';
import { alerts } from '@/shared/utils/alerts';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { jobService } from '../services/job.service';
import { useAuthStore } from '@/features/auth/store/useAuthStore';

interface CreateJobModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export type TipoRequisito = 'HABILIDAD' | 'EXPERIENCIA' | 'EDUCACION' | 'IDIOMA' | 'CONOCIMIENTO' | 'OTRO';

export interface RequisitoItem {
  descripcion: string;
  tipo: TipoRequisito;
  obligatorio: boolean;
  nivel?: string;
}

export const CreateJobModal: React.FC<CreateJobModalProps> = ({ onClose, onSuccess }) => {
  const { user } = useAuthStore();
  const [error, setError] = useState('');
  const [categorias, setCategorias] = useState<Array<{ id: string; nombre: string }>>([]);
  const { register, handleSubmit, formState: { isSubmitting } } = useForm();

  // Requisitos dinámicos para la oferta y Screening IA
  const [requisitosList, setRequisitosList] = useState<RequisitoItem[]>([
    { descripcion: 'Experiencia previa comprobable en el área del puesto', tipo: 'EXPERIENCIA', obligatorio: true, nivel: 'Intermedio' }
  ]);
  const [newReqDesc, setNewReqDesc] = useState('');
  const [newReqTipo, setNewReqTipo] = useState<TipoRequisito>('HABILIDAD');
  const [newReqObligatorio, setNewReqObligatorio] = useState(true);
  const [newReqNivel, setNewReqNivel] = useState('');

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
  }, []);

  const onSubmit = async (data: any) => {
    if (!user?.id) return;
    setError('');

    if (!data.fechaVencimiento) {
      setError('Debe indicar una fecha de vencimiento válida');
      return;
    }

    if (!data.categoriaId) {
      setError('Debe seleccionar una categoría');
      return;
    }

    const payload = {
      oferta: {
        titulo: data.titulo,
        descripcion: data.descripcion,
        categoriaId: data.categoriaId,
        areaProfesional: data.areaProfesional,
        nivelExperiencia: data.nivelExperiencia,
        tipoContrato: data.tipoContrato,
        modalidad: data.modalidad,
        jornada: 'DIURNA',
        salarioMinimo: data.salarioMinimo ? Number(data.salarioMinimo) : null,
        salarioMaximo: data.salarioMaximo ? Number(data.salarioMaximo) : null,
        moneda: 'PEN',
        ubicacion: data.ubicacion,
        fechaVencimiento: new Date(`${data.fechaVencimiento}T23:59:59`).toISOString(),
        estado: 'PUBLICADA',
        aceptaPostulaciones: true
      },
      requisitos: requisitosList.map(r => ({
        descripcion: r.descripcion.trim(),
        tipo: r.tipo,
        obligatorio: r.obligatorio,
        nivel: r.nivel ? r.nivel.trim() : null
      }))
    };

    try {
      console.log('Enviando payload:', payload);
      console.log('ID de usuario (empresaId):', user.id);
      const createdJob = await jobService.createJob(user.id, payload);
      console.log('Oferta creada:', createdJob);
      // Backend automatically sets state to BORRADOR. We submit it for admin review!
      await jobService.submitForReview(createdJob.id);
      await alerts.success('Oferta enviada', 'La oferta fue enviada a revisión para aprobación del administrador.');
      onSuccess();
    } catch (err: any) {
      console.error('Error completo:', err);
      console.error('Response data:', err.response?.data);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Error al crear la oferta';
      await alerts.error('Error', errorMessage);
      setError(errorMessage);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative animate-slide-up">
        
        <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-slate-900">Crear Nueva Oferta</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">{error}</div>}
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input label="Título del Puesto" placeholder="Ej: Desarrollador Frontend Senior" {...register('titulo', { required: true })} />
            
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
                  defaultValue=""
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
                <select className="w-full h-10 rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" {...register('nivelExperiencia')} defaultValue="EXPERTO">
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
                <select className="w-full h-10 rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" {...register('modalidad')} defaultValue="REMOTO">
                  <option value="PRESENCIAL">Presencial</option>
                  <option value="REMOTO">Remoto</option>
                  <option value="HIBRIDO">Híbrido</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">Contrato</label>
                <select className="w-full h-10 rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" {...register('tipoContrato')} defaultValue="MEDIO_TIEMPO">
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
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  {requisitosList.length} añadido{requisitosList.length === 1 ? '' : 's'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Estos requisitos son evaluados automáticamente por Gemini IA contra el CV de cada postulante.
              </p>

              {/* Lista de requisitos agregados */}
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {requisitosList.map((req, idx) => (
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
                ))}
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
              <Button type="submit" isLoading={isSubmitting}>Publicar Oferta</Button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};
