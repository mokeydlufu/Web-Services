import React, { useEffect, useState } from 'react';
import { ArrowLeft, Banknote, Briefcase, Building2, Clock, MapPin, X, Upload, Sparkles, AlertTriangle, RefreshCw } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { jobService } from '../services/job.service';
import type { OfertaResponse } from '../types/job.types';
import { Button } from '@/shared/components/Button';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { alerts } from '@/shared/utils/alerts';

const formatSalary = (min?: number, max?: number, currency: string = 'USD') => {
  if (!min && !max) return 'Salario no especificado';
  const format = (val: number) => new Intl.NumberFormat('es-PE', { style: 'currency', currency }).format(val);
  if (min && !max) return `Desde ${format(min)}`;
  if (!min && max) return `Hasta ${format(max)}`;
  if (min === max && min) return format(min);
  return `${format(min!)} - ${format(max!)}`;
};

const formatDate = (value?: string) => {
  if (!value) return 'Sin fecha de cierre';
  return new Date(value).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

export const JobDetailView: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [job, setJob] = useState<OfertaResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyError, setApplyError] = useState('');
  const [hasApplied, setHasApplied] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cartaPresentacion, setCartaPresentacion] = useState('');
  const [generadaConIa, setGeneradaConIa] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [showReplaceModal, setShowReplaceModal] = useState(false);


  const handleGenerateAiCoverLetter = () => {
    if (cartaPresentacion.trim().length > 0) {
      setShowReplaceModal(true);
    } else {
      executeGenerateAiCoverLetter();
    }
  };

  const executeGenerateAiCoverLetter = async () => {
    if (!job?.id) return;
    setIsGeneratingAi(true);
    try {
      const res = await jobService.generateCoverLetterWithAi(job.id, user?.id);
      if (res.success && res.carta) {
        setCartaPresentacion(res.carta.slice(0, 3000));
        setGeneradaConIa(true);
        await alerts.success('Borrador generado', 'Puedes revisarlo y editarlo antes de enviar tu postulación.');
      } else {
        const errorMsg = res.message || 'No se pudo generar el borrador con IA. Puedes escribir tu carta manualmente.';
        console.warn('Fallo al generar carta con IA:', errorMsg);
        await alerts.warning('Aviso de IA', errorMsg);
      }
    } catch (err: any) {
      console.error('Error al generar carta con IA:', err);
      const serverMsg = err.response?.data?.message || err.message || 'No se pudo conectar con el servicio de IA.';
      await alerts.warning('Error de IA', serverMsg);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleApply = async () => {

    if (!isAuthenticated) {
      await alerts.info('Inicia sesión', 'Para postular a esta oferta debes iniciar sesión o registrarte.');
      navigate('/login', {
        state: {
          from: 'apply',
          returnTo: `/empleos/${id}`,
          jobId: job?.id,
          jobTitle: job?.titulo,
        },
      });
      return;
    }

    if (user?.rol === 'EMPRESA' || user?.rol === 'RECLUTADOR') {
      await alerts.error('Sin permiso', 'Las cuentas de empresa no pueden postular a vacantes.');
      return;
    }

    if (job?.estado !== 'PUBLICADA') {
      await alerts.warning('Oferta no disponible', 'Esta oferta ya no acepta nuevas postulaciones.');
      return;
    }

    if (hasApplied) {
      await alerts.warning('Ya postulaste', 'Tu postulación ya fue enviada a esta oferta.');
      return;
    }

    setApplyError('');
    setIsApplyOpen(true);
  };

  const handleSubmitApplication = async () => {
    if (!job) return;

    setApplyLoading(true);
    setApplyError('');

    try {
      await jobService.applyToJob(job.id, job.empresaId, {
        cartaPresentacion: cartaPresentacion.trim(),
        cvFile: cvFile || undefined,
        estudianteId: user?.id,
      });

      await alerts.success('Postulación enviada', 'Tu aplicación fue enviada correctamente. ¡Mucho éxito! 🎉');
      setNotice({
        type: 'success',
        message: 'Postulación enviada correctamente.',
      });
      setHasApplied(true);
      setIsApplyOpen(false);
      setCvFile(null);
      setCartaPresentacion('');
    } catch (error: any) {
      const status = error.response?.status;
      let userMessage = 'No se pudo enviar la postulación. Inténtalo nuevamente.';

      if (status === 401) {
        userMessage = 'Tu sesión ha expirado. Inicia sesión nuevamente.';
      } else if (status === 403) {
        userMessage = 'No tienes permiso para realizar esta acción.';
      } else if (status === 409) {
        userMessage = 'Ya postulaste a esta oferta.';
        setHasApplied(true);
      } else if (status === 400) {
        userMessage = error.response?.data?.message || 'No se pudo enviar la postulación. Inténtalo nuevamente.';
      } else if (status === 500) {
        userMessage = 'No se pudo enviar la postulación. Inténtalo nuevamente.';
      }

      setApplyError(userMessage);
      await alerts.error('Error al postular', userMessage);
      setNotice({ type: 'error', message: userMessage });
    } finally {
      setApplyLoading(false);
    }
  };

  useEffect(() => {
    if (!notice) return;

    const timeout = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  useEffect(() => {
    const fetchJobAndStatus = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const data = await jobService.getJobById(id);
        setJob(data);

        // Si el estudiante tiene sesión iniciada, verificar si ya postuló a esta oferta
        if (isAuthenticated) {
          try {
            const myApps = await jobService.getMyApplications({ size: 100 });
            const alreadyApplied = myApps.content?.some((app) => app.ofertaId === id);
            if (alreadyApplied) {
              setHasApplied(true);
            }
          } catch (appErr) {
            // Ignorar error de chequeo previo
          }
        }
      } catch (error) {
        console.error('Error fetching job details:', error);
        setJob(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobAndStatus();
  }, [id, isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 animate-pulse">
            <div className="h-5 w-32 bg-slate-200 rounded mb-4" />
            <div className="h-10 w-2/3 bg-slate-200 rounded mb-5" />
            <div className="h-4 w-full bg-slate-200 rounded mb-2" />
            <div className="h-4 w-5/6 bg-slate-200 rounded mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="h-24 bg-slate-200 rounded-xl" />
              <div className="h-24 bg-slate-200 rounded-xl" />
              <div className="h-24 bg-slate-200 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-slate-50 py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Oferta no encontrada</h1>
            <p className="text-slate-500 mb-6">La vacante que buscas no existe o ya no está disponible.</p>
            <div className="flex items-center justify-center gap-3">
              <Button onClick={() => navigate('/empleos')}>
                Volver a empleos
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        {notice && (
          <div
            className={`mb-5 rounded-xl border px-4 py-3 text-sm font-medium shadow-sm ${
              notice.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {notice.message}
          </div>
        )}

        <div className="mb-6">
          <Link 
            to={isAuthenticated ? "/candidato/buscar" : "/empleos"} 
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a empleos
          </Link>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 md:p-8 border-b border-slate-200">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Vacante</p>
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-2">{job.titulo}</h1>
                <div className="flex items-center gap-2 mt-3 text-slate-500">
                  <Building2 className="h-4 w-4" />
                  <span>Empresa Confidencial</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                  <Briefcase className="h-3.5 w-3.5" />
                  {job.modalidad.replace('_', ' ')}
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                  <Clock className="h-3.5 w-3.5" />
                  {job.tipoContrato.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">
                <MapPin className="h-4 w-4" />
                Ubicación
              </div>
              <p className="font-semibold text-slate-900">{job.ubicacion || 'Remoto'}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">
                <Banknote className="h-4 w-4" />
                Salario
              </div>
              <p className="font-semibold text-slate-900">{formatSalary(job.salarioMinimo, job.salarioMaximo, job.moneda || 'USD')}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">
                <Clock className="h-4 w-4" />
                Fecha de cierre
              </div>
              <p className="font-semibold text-slate-900">{formatDate(job.fechaVencimiento || job.fechaPublicacion)}</p>
            </div>
          </div>

          <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-[1.5fr,0.7fr] gap-8">
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">Descripción del puesto</h2>
              <p className="text-slate-600 leading-7 whitespace-pre-line">{job.descripcion}</p>
            </div>

            <aside className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <h3 className="text-base font-bold text-slate-900 mb-3">Resumen</h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li><span className="font-semibold text-slate-800">Área:</span> {job.areaProfesional || 'General'}</li>
                  <li><span className="font-semibold text-slate-800">Nivel:</span> {job.nivelExperiencia.replace('_', ' ')}</li>
                  <li><span className="font-semibold text-slate-800">Contrato:</span> {job.tipoContrato.replace('_', ' ')}</li>
                  <li><span className="font-semibold text-slate-800">Modalidad:</span> {job.modalidad.replace('_', ' ')}</li>
                </ul>
              </div>

              <Button 
                className="w-full justify-center font-semibold" 
                onClick={handleApply}
                disabled={hasApplied || (job.estado !== 'PUBLICADA')}
                variant={hasApplied ? 'outline' : 'primary'}
              >
                {hasApplied 
                  ? 'Ya postulaste' 
                  : !isAuthenticated 
                    ? 'Iniciar sesión para postular' 
                    : job.estado !== 'PUBLICADA'
                      ? 'Oferta no disponible'
                      : 'Postular'}
              </Button>
            </aside>
          </div>
        </div>
      </div>

      {isApplyOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold text-slate-900">Postular a {job?.titulo}</h3>
              <button
                type="button"
                onClick={() => setIsApplyOpen(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Cargar CV <span className="text-slate-400 font-normal">(Opcional)</span>
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setCvFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="cv-upload"
                  />
                  <label
                    htmlFor="cv-upload"
                    className="flex items-center justify-center gap-2 w-full rounded-md border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                  >
                    <Upload className="h-5 w-5 text-slate-400" />
                    <span className="text-slate-600">
                      {cvFile ? (
                        <span className="font-medium text-blue-600">{cvFile.name}</span>
                      ) : (
                        'Haz clic para seleccionar tu CV (PDF, DOC, DOCX)'
                      )}
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-semibold text-slate-800">
                    Carta de presentación
                  </label>
                  <span className={`text-xs font-medium ${cartaPresentacion.length >= 3000 ? 'text-rose-600' : 'text-slate-400'}`}>
                    {cartaPresentacion.length} / 3000 caracteres
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-2">
                  Cuéntale a la empresa por qué te interesa esta oportunidad.
                </p>
                <textarea
                  value={cartaPresentacion}
                  onChange={(e) => setCartaPresentacion(e.target.value.slice(0, 3000))}
                  maxLength={3000}
                  rows={5}
                  placeholder="Cuéntanos por qué te interesa esta oportunidad..."
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all leading-relaxed"
                />

                <div className="mt-2.5 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleGenerateAiCoverLetter}
                    disabled={isGeneratingAi}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
                  >
                    {isGeneratingAi ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin text-purple-600" />
                        <span>Generando borrador...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                        <span>✨ Ayudarme con IA</span>
                      </>
                    )}
                  </button>

                  {generadaConIa && (
                    <span className="text-[11px] text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-100 font-medium">
                      Borrador con apoyo de IA
                    </span>
                  )}
                </div>
              </div>

              {applyError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {applyError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => setIsApplyOpen(false)}>
                  Cancelar
                </Button>
                <Button type="button" isLoading={applyLoading} onClick={handleSubmitApplication}>
                  Enviar postulación
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal: Confirm Replacement of existing cover letter */}
      {showReplaceModal && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Reemplazar carta existente</h4>
            </div>
            <p className="text-sm text-slate-600 mb-5 leading-relaxed">
              Ya tienes una carta escrita. ¿Deseas reemplazarla con una nueva sugerencia?
            </p>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowReplaceModal(false)}>
                Cancelar
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="bg-purple-600 hover:bg-purple-700"
                onClick={() => {
                  setShowReplaceModal(false);
                  executeGenerateAiCoverLetter();
                }}
              >
                Generar nueva
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};