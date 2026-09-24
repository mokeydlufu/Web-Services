import { alerts } from '@/shared/utils/alerts';

/**
 * Manejador centralizado de errores de autenticación para reutilizar
 * en ProfessionalLoginView, CompanyLoginView y AdminLoginView.
 */
export const handleAuthError = async (error: any) => {
  localStorage.removeItem('jwt_token');

  // Error de servidor (5xx o sin conexión)
  if (!error.response || error.response.status >= 500) {
    await alerts.error('No se pudo iniciar sesión', 'Inténtalo nuevamente en unos momentos.');
    return;
  }

  const status = error.response.status;
  const rawMsg = (error.response.data?.message || '').toLowerCase();

  // Cuenta bloqueada / inactiva / suspendida / pendiente
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

  // Correo no registrado / cuenta no encontrada
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

  // Contraseña incorrecta
  if (
    rawMsg.includes('contraseña incorrecta') ||
    rawMsg.includes('password incorrecto') ||
    (rawMsg.includes('password') && rawMsg.includes('bad'))
  ) {
    await alerts.error('Contraseña incorrecta', 'Verifica tu contraseña e inténtalo nuevamente.');
    return;
  }

  // Credenciales inválidas (401 estándar)
  if (status === 401 || rawMsg.includes('credenciales')) {
    await alerts.error('Datos incorrectos', 'Verifica tu correo y contraseña.');
    return;
  }

  // Fallback
  await alerts.error('No se pudo iniciar sesión', 'Inténtalo nuevamente en unos momentos.');
};
