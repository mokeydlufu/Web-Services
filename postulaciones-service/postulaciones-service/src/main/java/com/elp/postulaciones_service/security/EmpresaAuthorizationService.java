package com.elp.postulaciones_service.security;

import com.elp.postulaciones_service.util.SecurityUtils;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class EmpresaAuthorizationService {

    /**
     * Valida si un usuario tiene permiso para gestionar/reanalizar contenido de una empresa.
     * - ADMIN / ADMINISTRADOR: permitido siempre.
     * - EMPRESA: solo puede gestionar postulaciones de su propia empresa (usuarioId == empresaId).
     * - RECLUTADOR: solo puede gestionar postulaciones de la empresa a la que pertenece
     *   (usando el claim empresaId del JWT, o usuarioId == empresaId).
     * - Cualquier otro rol (ESTUDIANTE, PROFESIONAL, CANDIDATO, etc.): prohibido.
     *
     * @param usuarioAutenticadoId ID del usuario autenticado (claim 'sub')
     * @param empresaIdPropietaria ID de la empresa propietaria de la oferta/postulación
     * @param rolUsuario           Rol del usuario autenticado
     * @return true si tiene permiso autorizado contra IDOR, false de lo contrario
     */
    public boolean tienePermisoDePropiedad(UUID usuarioAutenticadoId, UUID empresaIdPropietaria, String rolUsuario) {
        if (empresaIdPropietaria == null) {
            return false;
        }

        String rol = rolUsuario != null ? rolUsuario : SecurityUtils.getRolUsuarioLogueado();

        if ("ADMINISTRADOR".equals(rol) || "ADMIN".equals(rol)) {
            return true;
        }

        if (usuarioAutenticadoId == null) {
            return false;
        }

        // Solo la propia EMPRESA dueña puede modificar o reanalizar sus postulaciones
        if ("EMPRESA".equals(rol)) {
            return usuarioAutenticadoId.equals(empresaIdPropietaria);
        }

        // RECLUTADOR solo puede gestionar postulaciones de la empresa a la que pertenece
        if ("RECLUTADOR".equals(rol)) {
            UUID empresaIdClaim = SecurityUtils.getEmpresaIdClaim();
            if (empresaIdClaim != null) {
                return empresaIdClaim.equals(empresaIdPropietaria);
            }
            return usuarioAutenticadoId.equals(empresaIdPropietaria);
        }

        return false;
    }

    public boolean tienePermisoDePropiedad(UUID usuarioAutenticadoId, UUID empresaIdPropietaria) {
        return tienePermisoDePropiedad(usuarioAutenticadoId, empresaIdPropietaria, SecurityUtils.getRolUsuarioLogueado());
    }
}
