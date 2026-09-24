import React, { useState } from 'react';
import { useForm, type FieldErrors } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate, Link } from 'react-router-dom';
import { UserCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { alerts } from '@/shared/utils/alerts';
import { handleAuthError } from '../utils/handleAuthError';

const loginSchema = z.object({
  email: z.string().min(1, 'El correo es requerido').email('Correo inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const ProfessionalLoginView: React.FC = () => {
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
      alerts.warning('Completa los datos', 'Ingresa tu correo y contraseña.');
      return;
    }

    if (formErrors.email) {
      alerts.warning('Correo inválido', 'Ingresa un correo electrónico válido.');
      return;
    }
  };

  const onSubmit = async (data: LoginFormValues) => {
    try {
      const response = await authService.login(data);
      localStorage.setItem('jwt_token', response.token);
      const user = await authService.getMe();

      // Validación estricta de rol para Profesional
      if (user.rol === 'ESTUDIANTE' || user.rol === 'PROFESIONAL') {
        login(response.token, user);
        navigate('/candidato/buscar');
      } else {
        localStorage.removeItem('jwt_token');
        await alerts.warning(
          'Acceso denegado',
          'Esta cuenta no corresponde a un perfil profesional.'
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
        <div className="h-12 w-12 bg-blue-600 rounded-2xl flex items-center justify-center mb-3 shadow-md shadow-blue-600/20">
          <UserCircle className="h-6 w-6 text-white" />
        </div>
        <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full mb-1.5">
          EmpleaPro
        </span>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Bienvenido</h2>
        <p className="text-slate-500 text-sm mt-1">
          Ingresa tus credenciales para acceder a tu perfil profesional
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-4" noValidate>
        <Input
          label="Correo electrónico"
          type="email"
          placeholder="tu@email.com"
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

        <Button type="submit" className="w-full mt-2" size="lg" isLoading={isSubmitting}>
          Iniciar sesión
        </Button>
      </form>

      <div className="space-y-3 pt-2 text-center border-t border-slate-100 text-sm">
        <p className="text-slate-500">
          ¿No tienes cuenta?{' '}
          <Link
            to="/registro/profesional"
            className="text-blue-600 hover:text-blue-700 hover:underline font-semibold"
          >
            Crear cuenta profesional
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
