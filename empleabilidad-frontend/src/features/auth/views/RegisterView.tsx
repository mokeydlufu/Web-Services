import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { authService } from '../services/auth.service';
import { consultasService } from '../services/consultas.service';
import type { DniResponse, RucResponse } from '../services/consultas.service';
import { useAuthStore } from '../store/useAuthStore';
import { useLocation, useNavigate } from 'react-router-dom';
import { UserCircle, Building2, ShieldCheck, Eye, EyeOff, Search, Loader2, CheckCircle2, MapPin } from 'lucide-react';
import { alerts } from '@/shared/utils/alerts';
import Swal from 'sweetalert2';

const candidatoSchema = z.object({
  dni: z.string().min(8, 'El DNI debe tener 8 dígitos').max(8, 'El DNI debe tener 8 dígitos'),
  nombres: z.string().min(2, 'Nombres requeridos'),
  apellidos: z.string().min(2, 'Apellidos requeridos'),
  email: z.string().email('Correo inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

const empresaSchema = z.object({
  ruc: z.string().min(11, 'El RUC debe tener 11 dígitos').max(11, 'El RUC debe tener 11 dígitos'),
  razonSocial: z.string().min(2, 'Razón social requerida'),
  email: z.string().email('Correo inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

type CandidatoFormValues = z.infer<typeof candidatoSchema>;
type EmpresaFormValues = z.infer<typeof empresaSchema>;

export const RegisterView: React.FC = () => {
  const [role, setRole] = useState<'ESTUDIANTE' | 'EMPRESA'>('ESTUDIANTE');
  const [showPassword, setShowPassword] = useState(false);
  const location = useLocation();
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const isApplyFlow = location.state?.from === 'apply';

  // Estados de consulta y validación RENIEC / SUNAT
  const [isValidatingDni, setIsValidatingDni] = useState(false);
  const [dniVerifiedData, setDniVerifiedData] = useState<DniResponse | null>(null);
  const [dniValidado, setDniValidado] = useState(false);
  const [dniTouched, setDniTouched] = useState(false);
  const [isManualNames, setIsManualNames] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const [isValidatingRuc, setIsValidatingRuc] = useState(false);
  const [rucVerifiedData, setRucVerifiedData] = useState<RucResponse | null>(null);
  const [rucTouched, setRucTouched] = useState(false);

  const candidatoForm = useForm<CandidatoFormValues>({
    resolver: zodResolver(candidatoSchema),
    defaultValues: {
      dni: '',
      nombres: '',
      apellidos: '',
      email: '',
      password: '',
    },
    mode: 'onTouched', // Solo valida al salir del campo, no al cargar
  });

  const empresaForm = useForm<EmpresaFormValues>({
    resolver: zodResolver(empresaSchema),
    defaultValues: {
      ruc: '',
      razonSocial: '',
      email: '',
      password: '',
    },
    mode: 'onTouched',
  });

  // Activar ingreso manual de nombres si RENIEC no tiene los datos o falla
  const activarIngresoManualDni = async (motivo: string) => {
    setDniVerifiedData(null);
    setDniValidado(true);
    setIsManualNames(true);
    candidatoForm.clearErrors(['dni']);

    await Swal.fire({
      icon: 'info',
      title: 'Validación de DNI',
      text: `${motivo} Por favor, ingresa tus nombres y apellidos manualmente para continuar con tu registro.`,
      confirmButtonText: 'Completar mis datos',
      confirmButtonColor: '#2563eb',
    });
  };

  // Validar DNI con API RENIEC y verificar disponibilidad en PostgreSQL
  const handleValidarDni = async (dniValue?: string) => {
    if (isValidatingDni) return;

    const rawDni = dniValue !== undefined ? dniValue : candidatoForm.getValues('dni');
    const dni = (rawDni || '').trim();

    if (!dni || dni.length !== 8 || !/^\d{8}$/.test(dni)) {
      setDniValidado(false);
      setIsManualNames(false);
      setDniVerifiedData(null);
      candidatoForm.setValue('nombres', '');
      candidatoForm.setValue('apellidos', '');
      await Swal.fire({
        icon: 'warning',
        title: 'DNI inválido',
        text: 'Ingrese un número de DNI válido de 8 dígitos numéricos.',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#2563eb',
      });
      return;
    }

    setIsValidatingDni(true);
    setDniValidado(false);
    setIsManualNames(false);

    try {
      // 1. Comprobar si ese DNI ya existe en PostgreSQL
      try {
        const dniCheck = await authService.checkDni(dni);
        if (dniCheck.exists) {
          setDniVerifiedData(null);
          setDniValidado(false);
          setIsManualNames(false);
          candidatoForm.setValue('nombres', '');
          candidatoForm.setValue('apellidos', '');

          await Swal.fire({
            icon: 'warning',
            title: 'DNI ya registrado',
            text: 'Este DNI ya tiene una cuenta. Puedes iniciar sesión desde el enlace inferior.',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#2563eb',
          });
          return;
        }
      } catch (checkErr: any) {
        if (checkErr.response?.status === 409) {
          await Swal.fire({
            icon: 'warning',
            title: 'DNI ya registrado',
            text: 'Este DNI ya tiene una cuenta. Puedes iniciar sesión desde el enlace inferior.',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#2563eb',
          });
          return;
        }
      }

      // 2. Intentar validar identidad con RENIEC
      try {
        const data = await consultasService.consultarDni(dni);
        if (data && (data.nombres || data.nombreCompleto)) {
          const nombres = (data.nombres || '').trim();
          const apellidos = `${data.apellidoPaterno || ''} ${data.apellidoMaterno || ''}`.trim() || data.apellidoPaterno || '';
          candidatoForm.setValue('nombres', nombres, { shouldValidate: true });
          candidatoForm.setValue('apellidos', apellidos, { shouldValidate: true });
          candidatoForm.clearErrors(['nombres', 'apellidos', 'dni']);
          setDniVerifiedData(data);
          setDniValidado(true);
          setIsManualNames(false);

          await Swal.fire({
            icon: 'success',
            title: 'DNI validado con RENIEC',
            text: data.nombreCompleto || `${nombres} ${apellidos}`,
            timer: 2000,
            showConfirmButton: false,
          });
          return;
        } else {
          await activarIngresoManualDni('No se encontraron nombres automáticos en RENIEC.');
          return;
        }
      } catch (apiError: any) {
        const status = apiError.response?.status;
        let motivo = 'El DNI no figura en el padrón electoral de RENIEC.';
        if (status === 429) {
          motivo = 'Límite de consultas del servicio alcanzado temporalmente.';
        } else if (status === 502 || status === 503 || status >= 500) {
          motivo = 'El servicio externo de RENIEC no respondió en este momento.';
        }
        await activarIngresoManualDni(motivo);
        return;
      }
    } catch (error: any) {
      await activarIngresoManualDni('No se pudo validar el DNI de forma automática.');
    } finally {
      setIsValidatingDni(false);
    }
  };

  // Validar correo antes de registrar (en onBlur)
  const handleCheckEmail = async () => {
    const email = (candidatoForm.getValues('email') || '').trim();
    if (!email || candidatoForm.formState.errors.email) return;
    try {
      const emailCheck = await authService.checkEmail(email);
      if (emailCheck.exists) {
        await Swal.fire({
          icon: 'warning',
          title: 'Correo ya registrado',
          text: 'Ya existe una cuenta asociada a este correo electrónico.',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#2563eb',
        });
      }
    } catch {
      // Ignorar errores de red temporales durante onBlur
    }
  };

  // Validar RUC con API SUNAT (APIsPERU / PeruAPI)
  const handleValidarRuc = async (rucValue?: string) => {
    const ruc = (rucValue || empresaForm.getValues('ruc') || '').trim();
    if (!ruc || ruc.length !== 11 || !/^\d{11}$/.test(ruc)) {
      await Swal.fire({
        icon: 'warning',
        title: 'RUC inválido',
        text: 'Ingrese un número de RUC válido de 11 dígitos numéricos.',
        confirmButtonColor: '#2563eb',
        confirmButtonText: 'Aceptar',
      });
      return;
    }

    setIsValidatingRuc(true);
    try {
      const data = await consultasService.consultarRuc(ruc);
      if (data && data.razonSocial) {
        const razonSocial = data.razonSocial || '';
        empresaForm.setValue('razonSocial', razonSocial, { shouldValidate: true });
        empresaForm.clearErrors(['razonSocial', 'ruc']);
        setRucVerifiedData({ ...data, razonSocial });
        await Swal.fire({
          icon: 'success',
          title: 'RUC verificado con SUNAT',
          text: razonSocial,
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        setRucVerifiedData(null);
        await Swal.fire({
          icon: 'info',
          title: 'Validación de RUC',
          text: 'No se encontraron datos automáticos en SUNAT para este RUC. Puedes ingresar la razón social manualmente.',
          confirmButtonColor: '#2563eb',
          confirmButtonText: 'Entendido',
        });
      }
    } catch (error: any) {
      setRucVerifiedData(null);
      const status = error.response?.status;
      let msg = 'No se encontró el RUC en el padrón de SUNAT. Puedes completar la razón social manualmente.';
      if (status === 429) {
        msg = 'Límite de consultas del servicio alcanzado temporalmente. Puedes ingresar la razón social manualmente.';
      } else if (status === 502 || status === 503 || status >= 500) {
        msg = 'El servicio de SUNAT no está disponible en este momento. Puedes ingresar la razón social manualmente.';
      }
      await Swal.fire({
        icon: 'info',
        title: 'Ingreso manual habilitado',
        text: msg,
        confirmButtonColor: '#2563eb',
        confirmButtonText: 'Entendido',
      });
    } finally {
      setIsValidatingRuc(false);
    }
  };

  const onSubmitCandidato = async (data: CandidatoFormValues) => {
    if (!dniValidado) {
      await Swal.fire({
        icon: 'warning',
        title: 'DNI no validado',
        text: 'Por favor, pulse el botón "Validar" para consultar su DNI en RENIEC antes de continuar.',
        confirmButtonColor: '#2563eb',
        confirmButtonText: 'Entendido',
      });
      return;
    }
    setIsRegistering(true);
    try {
      await authService.registerEstudiante(data);
      setIsRegistering(false);
      await Swal.fire({
        icon: 'success',
        title: 'Cuenta creada correctamente',
        text: 'Tu cuenta ha sido creada con éxito. Inicia sesión para continuar.',
        confirmButtonColor: '#2563eb',
        confirmButtonText: 'Iniciar sesión',
      });
      navigate('/login');
    } catch (error: any) {
      // Desactivar inmediatamente el estado de carga para restaurar el texto del botón
      setIsRegistering(false);
      const status = error.response?.status;
      const backendMsg = error.response?.data?.message || '';

      if (status === 409) {
        if (backendMsg.toLowerCase().includes('dni')) {
          await Swal.fire({
            icon: 'warning',
            title: 'DNI ya registrado',
            text: 'Este DNI ya tiene una cuenta. Puedes iniciar sesión desde el enlace inferior.',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#2563eb',
          });
          return;
        }

        if (backendMsg.toLowerCase().includes('email') || backendMsg.toLowerCase().includes('correo')) {
          await Swal.fire({
            icon: 'warning',
            title: 'Correo ya registrado',
            text: 'Ya existe una cuenta asociada a este correo electrónico.',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#2563eb',
          });
          return;
        }

        await Swal.fire({
          icon: 'warning',
          title: 'Datos ya registrados',
          text: backendMsg || 'Ya existe una cuenta asociada a estos datos.',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#2563eb',
        });
        return;
      }

      await alerts.error('Error al crear cuenta', backendMsg || 'Error al registrar candidato.');
    } finally {
      setIsRegistering(false);
    }
  };

  const onSubmitEmpresa = async (data: EmpresaFormValues) => {
    try {
      const response = await authService.registerEmpresa(data);
      localStorage.setItem('jwt_token', response.token);
      const user = await authService.getMe();
      login(response.token, user);
      await alerts.success('Empresa registrada', 'Tu empresa quedó pendiente de verificación. El equipo de EmpleaPro la revisará pronto.');
      navigate('/auth/login');
    } catch (error: any) {
      const status = error.response?.status;
      const backendMsg = error.response?.data?.message;
      let msg = backendMsg || 'Error al registrar empresa.';
      if (status === 409) {
        msg = backendMsg ? `${backendMsg}. Si tu empresa ya está registrada, por favor inicia sesión.` : 'Ya existe una cuenta asociada a este correo o RUC.';
      }
      await alerts.error('Error al registrar empresa', msg);
    }
  };

  // Determinar errores DNI solo si el campo fue tocado
  const dniError = dniTouched ? candidatoForm.formState.errors.dni?.message : undefined;
  const dniValue = candidatoForm.watch('dni');
  const dniSuccess = dniValidado && dniValue?.length === 8 ? (isManualNames ? 'DNI validado (Ingreso manual)' : 'DNI validado con RENIEC') : undefined;

  // Determinar errores RUC solo si el campo fue tocado
  const rucError = rucTouched ? empresaForm.formState.errors.ruc?.message : undefined;
  const rucValue = empresaForm.watch('ruc');
  const rucSuccess = rucVerifiedData && rucValue?.length === 11 ? 'RUC validado correctamente.' : undefined;

  return (
    <div className="flex flex-col space-y-5">
      {/* Header */}
      <div className="text-center">
        {isApplyFlow && (
          <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 px-3 py-2.5 text-sm flex items-start gap-2 text-left">
            <ShieldCheck className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>Para postular a esta oferta debes registrarte primero. Completa tu cuenta y continúa con la aplicación.</span>
          </div>
        )}
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Crea tu cuenta</h2>
        <p className="text-slate-500 text-sm mt-1.5 leading-snug">
          {role === 'ESTUDIANTE'
            ? 'Únete a EmpleaPro y comienza a construir tu futuro profesional.'
            : 'Registra tu empresa y encuentra nuevos talentos.'}
        </p>
      </div>

      {/* Role Toggle */}
      <div className="flex p-1 bg-slate-100 rounded-xl gap-1">
        <button
          type="button"
          onClick={() => {
            setRole('ESTUDIANTE');
            setDniVerifiedData(null);
            setDniValidado(false);
            setDniTouched(false);
            setIsManualNames(false);
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
            role === 'ESTUDIANTE'
              ? 'bg-white text-blue-600 shadow-sm border border-slate-200/60'
              : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
          }`}
        >
          <UserCircle className="w-4 h-4" />
          Profesional
        </button>
        <button
          type="button"
          onClick={() => {
            setRole('EMPRESA');
            setRucVerifiedData(null);
            setRucTouched(false);
            setDniValidado(false);
            setIsManualNames(false);
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
            role === 'EMPRESA'
              ? 'bg-white text-blue-600 shadow-sm border border-slate-200/60'
              : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Empresa
        </button>
      </div>

      {/* Forms */}
      {role === 'ESTUDIANTE' ? (
        <form
          onSubmit={candidatoForm.handleSubmit(onSubmitCandidato)}
          className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300"
          noValidate
        >
          {/* Campo DNI + Validar */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-slate-700">DNI (RENIEC)</label>
              <span className="text-xs text-blue-600 font-medium">Validación automática</span>
            </div>
            {/* Desktop: inline | Móvil: stacked */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <Input
                  id="dni-input"
                  placeholder="Ej: 72458931"
                  maxLength={8}
                  inputMode="numeric"
                  error={dniError}
                  success={dniSuccess}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleValidarDni();
                    }
                  }}
                  {...candidatoForm.register('dni', {
                    onBlur: () => setDniTouched(true),
                    onChange: (e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      e.target.value = val;
                      candidatoForm.setValue('dni', val);
                      setDniVerifiedData(null);
                      setDniValidado(false);
                      setIsManualNames(false);
                      candidatoForm.setValue('nombres', '');
                      candidatoForm.setValue('apellidos', '');
                      if (val.length === 8 && !isValidatingDni) {
                        handleValidarDni(val);
                      }
                    },
                  })}
                />
              </div>
              <button
                type="button"
                onClick={() => handleValidarDni()}
                disabled={isValidatingDni}
                className="h-10 px-4 bg-blue-50 text-blue-700 hover:bg-blue-100 active:bg-blue-200 border border-blue-200 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 flex-shrink-0 sm:w-auto w-full"
                title="Consultar DNI en RENIEC"
              >
                {isValidatingDni ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                <span>Validar{window.innerWidth < 640 ? ' DNI' : ''}</span>
              </button>
            </div>

            {/* Tarjeta de Identidad Verificada RENIEC */}
            {dniVerifiedData && (
              <div className="mt-2.5 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">{dniVerifiedData.nombreCompleto || dniVerifiedData.nombres}</p>
                    <p className="text-[11px] text-emerald-600 font-medium">DNI validado con RENIEC</p>
                  </div>
                </div>
                {dniVerifiedData.codVerifica && (
                  <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-mono">
                    Dígito: {dniVerifiedData.codVerifica}
                  </span>
                )}
              </div>
            )}

            {/* Aviso de Validación Manual cuando no figura en RENIEC */}
            {dniValidado && isManualNames && (
              <div className="mt-2.5 p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Validación manual activada</p>
                  <p className="text-[11px] text-blue-600">Por favor, escribe tus nombres y apellidos para completar el registro.</p>
                </div>
              </div>
            )}
          </div>

          {/* Nombres y Apellidos: 2 columnas desktop, 1 móvil */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nombres"
              placeholder="Ej: Carlos Alexander"
              readOnly={!isManualNames}
              disabled={!dniValidado}
              success={dniValidado && !isManualNames ? 'DNI validado con RENIEC' : undefined}
              error={candidatoForm.formState.errors.nombres?.message}
              {...candidatoForm.register('nombres')}
            />
            <Input
              label="Apellidos"
              placeholder="Ej: Quispe Espino"
              readOnly={!isManualNames}
              disabled={!dniValidado}
              success={dniValidado && !isManualNames ? 'DNI validado con RENIEC' : undefined}
              error={candidatoForm.formState.errors.apellidos?.message}
              {...candidatoForm.register('apellidos')}
            />
          </div>

          <Input
            label="Correo electrónico"
            type="email"
            placeholder="juan@email.com"
            disabled={!dniValidado}
            {...candidatoForm.register('email', {
              onBlur: () => handleCheckEmail(),
            })}
            error={candidatoForm.formState.errors.email?.message}
          />

          <div className="relative">
            <Input
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              hint="Mínimo 6 caracteres"
              disabled={!dniValidado}
              {...candidatoForm.register('password')}
              error={candidatoForm.formState.errors.password?.message}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={!dniValidado}
              className="absolute right-3 top-9 text-slate-400 hover:text-slate-600 disabled:opacity-50 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full mt-1"
            isLoading={isRegistering}
            disabled={!dniValidado || isRegistering}
          >
            {isRegistering ? 'Creando cuenta...' : 'Crear cuenta profesional'}
          </Button>
        </form>
      ) : (
        <form
          onSubmit={empresaForm.handleSubmit(onSubmitEmpresa)}
          className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300"
          noValidate
        >
          {/* Campo RUC + Validar */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-slate-700">RUC (SUNAT)</label>
              <span className="text-xs text-blue-600 font-medium">Validación automática</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Ej: 20131312955"
                  maxLength={11}
                  inputMode="numeric"
                  error={rucError}
                  success={rucSuccess}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleValidarRuc();
                    }
                  }}
                  {...empresaForm.register('ruc', {
                    onBlur: () => setRucTouched(true),
                    onChange: (e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      empresaForm.setValue('ruc', val);
                      if (val.length === 11) {
                        handleValidarRuc(val);
                      } else {
                        setRucVerifiedData(null);
                      }
                    },
                  })}
                />
              </div>
              <button
                type="button"
                onClick={() => handleValidarRuc()}
                disabled={isValidatingRuc}
                className="h-10 px-4 bg-blue-50 text-blue-700 hover:bg-blue-100 active:bg-blue-200 border border-blue-200 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 flex-shrink-0 sm:w-auto w-full"
                title="Consultar RUC en SUNAT"
              >
                {isValidatingRuc ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                <span>Validar{window.innerWidth < 640 ? ' RUC' : ''}</span>
              </button>
            </div>

            {/* Tarjeta de RUC Verificado SUNAT */}
            {rucVerifiedData && (
              <div className="mt-2.5 p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-xs space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span className="font-semibold text-slate-900">{rucVerifiedData.razonSocial}</span>
                  </div>
                  {rucVerifiedData.estado && (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      rucVerifiedData.estado === 'ACTIVO'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {rucVerifiedData.estado} {rucVerifiedData.condicion ? `• ${rucVerifiedData.condicion}` : ''}
                    </span>
                  )}
                </div>
                {rucVerifiedData.direccion && (
                  <div className="flex items-start gap-1 text-[11px] text-slate-600">
                    <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-slate-400" />
                    <span>{rucVerifiedData.direccion}</span>
                  </div>
                )}
                {rucVerifiedData.distrito && (
                  <p className="text-[10px] text-slate-500 pl-4 font-medium">
                    {rucVerifiedData.distrito}, {rucVerifiedData.provincia}, {rucVerifiedData.departamento}
                  </p>
                )}
              </div>
            )}
          </div>

          <Input
            label="Razón Social"
            placeholder="Mi Empresa S.A.C"
            readOnly={!!rucVerifiedData}
            success={rucVerifiedData ? 'Obtenido de SUNAT' : undefined}
            error={empresaForm.formState.errors.razonSocial?.message}
            {...empresaForm.register('razonSocial')}
          />

          <Input
            label="Correo Corporativo"
            type="email"
            placeholder="contacto@empresa.com"
            {...empresaForm.register('email')}
            error={empresaForm.formState.errors.email?.message}
          />

          <div className="relative">
            <Input
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              hint="Mínimo 6 caracteres"
              {...empresaForm.register('password')}
              error={empresaForm.formState.errors.password?.message}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-slate-400 hover:text-slate-600 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full mt-1"
            isLoading={empresaForm.formState.isSubmitting}
            disabled={empresaForm.formState.isSubmitting}
          >
            {empresaForm.formState.isSubmitting ? 'Registrando empresa...' : 'Registrar empresa'}
          </Button>
        </form>
      )}

      <div className="text-center text-sm text-slate-500 pt-4 border-t border-slate-100">
        ¿Ya tienes cuenta?{' '}
        <a href="/auth/login" className="text-blue-600 hover:text-blue-700 hover:underline font-semibold transition-colors">
          Inicia sesión
        </a>
      </div>
    </div>
  );
};