package com.elp.ofertas_service.security;

import org.springframework.stereotype.Service;
import java.util.UUID;

@Service
public class EmpresaAuthorizationService {

    /**
     * Valida si un usuario tiene permiso para modificar contenido de una empresa.
     * - ADMINISTRADOR puede gestionar según su rol.
     * - EMPRESA solo puede gestionar su propia empresa.
     * - RECLUTADOR solo puede gestionar ofertas de la empresa a la que pertenece.
     * - ESTUDIANTE nunca tiene permiso de propiedad.
     */
    public boolean tienePermisoDePropiedad(UUID usuarioAutenticadoId, UUID empresaIdPropietaria) {
        if (usuarioAutenticadoId == null || empresaIdPropietaria == null) {
            return false;
        }

        String rol = SecurityUtils.getRolUsuarioLogueado();

        if ("ADMINISTRADOR".equals(rol)) {
            return true;
        }

        if ("ESTUDIANTE".equals(rol)) {
            return false;
        }

        // Solo la propia EMPRESA dueña puede modificar sus ofertas
        if ("EMPRESA".equals(rol)) {
            return usuarioAutenticadoId.equals(empresaIdPropietaria);
        }

        // RECLUTADOR solo puede gestionar ofertas de la empresa a la que pertenece
        if ("RECLUTADOR".equals(rol)) {
            UUID empresaIdClaim = SecurityUtils.getEmpresaIdClaim();
            if (empresaIdClaim != null) {
                return empresaIdClaim.equals(empresaIdPropietaria);
            }
            return usuarioAutenticadoId.equals(empresaIdPropietaria);
        }

        return false;
    }

    /**
     * Valida si un usuario tiene permiso para acciones de moderación.
     * ADMINISTRADOR y MODERADOR tienen permiso general.
     * La EMPRESA dueña o su RECLUTADOR pueden gestionar su propia oferta.
     * ESTUDIANTE nunca tiene permiso de moderación.
     */
    public boolean tienePermisoDeModeracion(UUID usuarioAutenticadoId, UUID empresaIdPropietaria) {
        String rol = SecurityUtils.getRolUsuarioLogueado();

        if ("ADMINISTRADOR".equals(rol) || "MODERADOR".equals(rol)) {
            return true;
        }

        if ("ESTUDIANTE".equals(rol)) {
            return false;
        }

        if (usuarioAutenticadoId != null && empresaIdPropietaria != null) {
            if ("EMPRESA".equals(rol)) {
                return usuarioAutenticadoId.equals(empresaIdPropietaria);
            }
            if ("RECLUTADOR".equals(rol)) {
                UUID empresaIdClaim = SecurityUtils.getEmpresaIdClaim();
                if (empresaIdClaim != null) {
                    return empresaIdClaim.equals(empresaIdPropietaria);
                }
                return usuarioAutenticadoId.equals(empresaIdPropietaria);
            }
        }

        return false;
    }
}