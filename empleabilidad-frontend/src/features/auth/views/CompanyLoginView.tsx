import React, { useState } from 'react';
import { useForm, type FieldErrors } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { alerts } from '@/shared/utils/alerts';
import { handleAuthError } from '../utils/handleAuthError';

const loginSchema = z.object({
  email: z.string().min(1, 'El correo corporativo es requerido').email('Correo inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const CompanyLoginView: React.FC = () => {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
  });

  const onInvalid = (formErrors: FieldErrors<LoginFormValues>) => {
    const emailVal = (getValues('email') || '').trim();
    const passVal = (getValues('password') || '').trim();

    if (!emailVal || !passVal) {
      alerts.warning('Completa los datos', 'Ingresa tu correo corporativo y contraseña.');
      return;
    }

    if (formErrors.email) {
      alerts.warning('Correo inválido', 'Ingresa un correo corporativo válido.');
      return;
    }
  };

  const onSubmit = async (data: LoginFormValues) => {
    try {
      const response = await authService.login(data);
      localStorage.setItem('jwt_token', response.token);
      const user = await authService.getMe();

      // Validación estricta de rol para Empresa
      if (user.rol === 'EMPRESA' || user.rol === 'RECLUTADOR') {
        login(response.token, user);
        navigate('/empresa/ofertas');
      } else {
        localStorage.removeItem('jwt_token');
        await alerts.warning(
          'Acceso denegado',
          'Esta cuenta no corresponde a un perfil de empresa.'
        );
      }
    } catch (error: any) {
      await handleAuthError(error);
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      {/* Header */}
      <div className="flex flex-col items-center text-center">
        <div className="h-12 w-12 bg-emerald-600 rounded-2xl flex items-center justify-center mb-3 shadow-md shadow-emerald-600/20">
          <Building2 className="h-6 w-6 text-white" />
        </div>
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full mb-1.5">
          EmpleaPro Empresas
        </span>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Acceso Empresarial</h2>
        <p className="text-slate-500 text-sm mt-1">
          Ingresa con tu cuenta corporativa para gestionar tus vacantes y candidatos
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-4" noValidate>
        <Input
          label="Correo corporativo"
          type="email"
          placeholder="contacto@empresa.com"
          {...register('email')}
          error={errors.email?.message}
        />

        <div className="relative">
          <Input
            label="Contraseña"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            {...register('password')}
            error={errors.password?.message}
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
          className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white"
          size="lg"
          isLoading={isSubmitting}
        >
          Iniciar sesión
        </Button>
      </form>

      <div className="space-y-3 pt-2 text-center border-t border-slate-100 text-sm">
        <p className="text-slate-500">
          ¿No tienes una cuenta empresarial?{' '}
          <Link
            to="/registro/empresa"
            className="text-emerald-600 hover:text-emerald-700 hover:underline font-semibold"
          >
            Registrar empresa
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
