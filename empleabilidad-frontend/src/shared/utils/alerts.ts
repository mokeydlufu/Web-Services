import Swal from 'sweetalert2';

export const alerts = {
  // ── Exito ────────────────────────────────────────────────────────────────
  success: (title: string, text?: string) => {
    return Swal.fire({
      icon: 'success',
      title,
      text,
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#3085d6',
    });
  },

  // ── Error ────────────────────────────────────────────────────────────────
  error: (title: string, text?: string) => {
    return Swal.fire({
      icon: 'error',
      title,
      text,
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#3085d6',
    });
  },

  // ── Advertencia ──────────────────────────────────────────────────────────
  warning: (title: string, text?: string) => {
    return Swal.fire({
      icon: 'warning',
      title,
      text,
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#3085d6',
    });
  },

  // ── Informacion ──────────────────────────────────────────────────────────
  info: (title: string, text?: string) => {
    return Swal.fire({
      icon: 'info',
      title,
      text,
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#3085d6',
    });
  },

  // ── Confirmacion estandar ─────────────────────────────────────────────────
  confirm: (
    title: string,
    text?: string,
    confirmButtonText = 'Si, continuar',
    icon: 'warning' | 'question' = 'warning'
  ) => {
    return Swal.fire({
      title,
      text,
      icon,
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText,
      cancelButtonText: 'Cancelar',
    });
  },

  // ── Confirmacion peligrosa (accion destructiva) ────────────────────────────
  confirmDanger: (title: string, text?: string, confirmButtonText = 'Si, continuar') => {
    return Swal.fire({
      title,
      text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText,
      cancelButtonText: 'Cancelar',
    });
  },

  // ── Motivo de rechazo (textarea) ─────────────────────────────────────────
  promptReason: (title: string, placeholder = 'Escribe el motivo...') => {
    return Swal.fire({
      title,
      input: 'textarea',
      inputPlaceholder: placeholder,
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Confirmar rechazo',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return 'El motivo es obligatorio';
        }
        return null;
      },
    });
  },

  // ── Verificar empresa ────────────────────────────────────────────────────
  confirmAprobarEmpresa: (nombreEmpresa: string) => {
    return Swal.fire({
      title: 'Verificar esta empresa?',
      text: nombreEmpresa,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Si, verificar',
      cancelButtonText: 'Cancelar',
    });
  },

  // ── Suspender empresa ────────────────────────────────────────────────────
  confirmSuspenderEmpresa: () => {
    return Swal.fire({
      title: 'Suspender empresa?',
      text: 'Esta accion suspendera el acceso de la empresa a la plataforma.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Si, suspender',
      cancelButtonText: 'Cancelar',
    });
  },
};
