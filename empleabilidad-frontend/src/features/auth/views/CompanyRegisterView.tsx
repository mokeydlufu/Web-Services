import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { authService } from '../services/auth.service';
import { consultasService } from '../services/consultas.service';
import type { RucResponse } from '../services/consultas.service';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, Eye, EyeOff, Search, Loader2, CheckCircle2, MapPin, ArrowLeft } from 'lucide-react';
import { alerts } from '@/shared/utils/alerts';
import Swal from 'sweetalert2';

const empresaSchema = z.object({
  ruc: z.string().min(11, 'El RUC debe tener 11 dígitos').max(11, 'El RUC debe tener 11 dígitos'),
  razonSocial: z.string().min(2, 'Razón social requerida'),
  email: z.string().email('Correo inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

type EmpresaFormValues = z.infer<typeof empresaSchema>;

export const CompanyRegisterView: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // Estados de consulta y validación SUNAT
  const [isValidatingRuc, setIsValidatingRuc] = useState(false);
  const [rucVerifiedData, setRucVerifiedData] = useState<RucResponse | null>(null);
  const [rucTouched, setRucTouched] = useState(false);

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

  const onSubmitEmpresa = async (data: EmpresaFormValues) => {
    try {
      await authService.registerEmpresa(data);
      await alerts.success(
        'Empresa registrada',
        'Tu empresa quedó registrada con éxito. Inicia sesión para continuar.'
      );
      navigate('/login/empresa');
    } catch (error: any) {
      const status = error.response?.status;
      const backendMsg = error.response?.data?.message;
      let msg = backendMsg || 'Error al registrar empresa.';
      if (status === 409) {
        msg = backendMsg
          ? `${backendMsg}. Si tu empresa ya está registrada, por favor inicia sesión.`
          : 'Ya existe una cuenta asociada a este correo o RUC.';
      }
      await alerts.error('Error al registrar empresa', msg);
    }
  };

  const rucError = rucTouched ? empresaForm.formState.errors.ruc?.message : undefined;
  const rucValue = empresaForm.watch('ruc');
  const rucSuccess = rucVerifiedData && rucValue?.length === 11 ? 'RUC validado correctamente.' : undefined;

  return (
    <div className="flex flex-col space-y-5">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 mb-2 shadow-inner">
          <Building2 className="w-6 h-6" />
        </div>
        <span className="block text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1">
          EmpleaPro Empresas
        </span>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Registra tu empresa</h2>
        <p className="text-slate-500 text-sm mt-1 leading-snug">
          Encuentra nuevos talentos y publica ofertas laborales
        </p>
      </div>

      {/* Formulario */}
      <form
        onSubmit={empresaForm.handleSubmit(onSubmitEmpresa)}
        className="space-y-4"
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
              className="h-10 px-4 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 active:bg-emerald-200 border border-emerald-200 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 flex-shrink-0 sm:w-auto w-full"
              title="Consultar RUC en SUNAT"
            >
              {isValidatingRuc ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              <span>Validar</span>
            </button>
          </div>

          {/* Tarjeta de RUC Verificado SUNAT */}
          {rucVerifiedData && (
            <div className="mt-2.5 p-3 rounded-lg bg-emerald-50/70 border border-emerald-200 text-emerald-900 text-xs space-y-1.5">
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
          className="w-full mt-1 bg-emerald-600 hover:bg-emerald-700 text-white"
          isLoading={empresaForm.formState.isSubmitting}
          disabled={empresaForm.formState.isSubmitting}
        >
          {empresaForm.formState.isSubmitting ? 'Registrando empresa...' : 'Registrar empresa'}
        </Button>
      </form>

      {/* Footer */}
      <div className="space-y-3 pt-3 text-center border-t border-slate-100 text-sm">
        <p className="text-slate-500">
          ¿Ya tienes cuenta?{' '}
          <Link
            to="/login/empresa"
            className="text-emerald-600 hover:text-emerald-700 hover:underline font-semibold transition-colors"
          >
            Inicia sesión
          </Link>
        </p>

        <div>
          <Link
            to="/acceso"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Elegir otro tipo de acceso
          </Link>
        </div>
      </div>
    </div>
  );
};
