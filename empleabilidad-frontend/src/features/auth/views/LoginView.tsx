import React, { useState } from 'react';
import { useForm, type FieldErrors } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate, Link } from 'react-router-dom';
import { Briefcase, Eye, EyeOff } from 'lucide-react';
import { alerts } from '@/shared/utils/alerts';

const loginSchema = z.object({
  email: z.string().min(1, 'El correo es requerido').email('Correo inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginView: React.FC = () => {
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

  // Validaciones locales al pulsar "Iniciar sesión"
  const onInvalid = (formErrors: FieldErrors<LoginFormValues>) => {
    const emailVal = (getValues('email') || '').trim();
    const passVal = (getValues('password') || '').trim();

    // 9. CAMPOS VACÍOS: Si correo o contraseña están vacíos
    if (!emailVal || !passVal) {
      alerts.warning('Completa los datos', 'Ingresa tu correo y contraseña.');
      return;
    }

    // 1. CORREO INVÁLIDO: Si el formato del correo es incorrecto
    if (formErrors.email) {
      alerts.warning('Correo inválido', 'Ingresa un correo electrónico válido.');
      return;
    }
  };

  const onSubmit = async (data: LoginFormValues) => {
    try {
      const response = await authService.login(data);
      // Tras el login exitoso, guardamos token y obtenemos datos del usuario
      localStorage.setItem('jwt_token', response.token);
      const user = await authService.getMe();
      login(response.token, user);

      // 7. LOGIN EXITOSO: Redirige directamente al dashboard correspondiente
      if (user.rol === 'ADMINISTRADOR') {
        navigate('/admin/dashboard');
      } else if (user.rol === 'EMPRESA' || user.rol === 'RECLUTADOR') {
        navigate('/empresa/ofertas');
      } else {
        navigate('/candidato/buscar');
      }
    } catch (error: any) {
      localStorage.removeItem('jwt_token');

      // 6. ERROR DE SERVIDOR: Sin conexión o error 5xx
      if (!error.response || error.response.status >= 500) {
        await alerts.error('No se pudo iniciar sesión', 'Inténtalo nuevamente en unos momentos.');
        return;
      }

      const status = error.response.status;
      const rawMsg = (error.response.data?.message || '').toLowerCase();

      // 5. CUENTA BLOQUEADA / INACTIVA: status 403, 423 o mensaje alusivo
      if (
        status === 403 ||
        status === 423 ||
        rawMsg.includes('bloquead') ||
        rawMsg.includes('inactiv') ||
        rawMsg.includes('deshabilitad') ||
        rawMsg.includes('suspendid') ||
        rawMsg.includes('no habilitada') ||
        rawMsg.includes('pendiente')
      ) {
        await alerts.error('Acceso no disponible', 'Tu cuenta no está habilitada para iniciar sesión.');
        return;
      }

      // 2. CORREO NO REGISTRADO: si backend indica que el usuario o correo no existe
      if (
        status === 404 ||
        rawMsg.includes('usuario no encontrado') ||
        rawMsg.includes('cuenta no encontrada') ||
        rawMsg.includes('no existe') ||
        rawMsg.includes('no registrada')
      ) {
        await alerts.error('Cuenta no encontrada', 'No existe una cuenta registrada con este correo.');
        return;
      }

      // 3. CONTRASEÑA INCORRECTA: si backend diferencia específicamente la contraseña
      if (
        rawMsg.includes('contraseña incorrecta') ||
        rawMsg.includes('password incorrecto') ||
        (rawMsg.includes('password') && rawMsg.includes('bad'))
      ) {
        await alerts.error('Contraseña incorrecta', 'Verifica tu contraseña e inténtalo nuevamente.');
        return;
      }

      // 4. CREDENCIALES INVÁLIDAS: status 401 o credenciales incorrectas por seguridad
      if (status === 401 || rawMsg.includes('credenciales')) {
        await alerts.error('Datos incorrectos', 'Verifica tu correo y contraseña.');
        return;
      }

      // Fallback seguro ante cualquier otro fallo de cliente
      await alerts.error('No se pudo iniciar sesión', 'Inténtalo nuevamente en unos momentos.');
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col items-center mb-4">
        <div className="h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center mb-4">
          <Briefcase className="h-6 w-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Bienvenido de nuevo</h2>
        <p className="text-slate-500 text-sm mt-1">Ingresa a tu cuenta para continuar</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-4">
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
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          Iniciar sesión
        </Button>
      </form>

      <div className="text-center text-sm text-slate-500 pt-4 border-t border-slate-100 mt-6">
        ¿No tienes cuenta? <Link to="/auth/register" className="text-blue-600 hover:underline font-medium">Regístrate aquí</Link>
      </div>
    </div>
  );
};
