package com.elp.ofertas_service.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.UUID;

public class SecurityUtils {

    public static UUID getUsuarioLogueadoId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof Jwt jwt) {
            String sub = jwt.getSubject();
            return UUID.fromString(sub);
        }
        throw new IllegalStateException("Usuario no autenticado");
    }

    public static String getRolUsuarioLogueado() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof Jwt jwt) {
            return jwt.getClaimAsString("rol");
        }
        return null;
    }

    public static UUID getEmpresaIdClaim() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof Jwt jwt) {
            String empresaClaim = jwt.getClaimAsString("empresaId");
            if (empresaClaim == null) {
                empresaClaim = jwt.getClaimAsString("empresa_id");
            }
            if (empresaClaim != null && !empresaClaim.isBlank()) {
                try {
                    return UUID.fromString(empresaClaim);
                } catch (IllegalArgumentException ignored) {
                }
            }
        }
        return null;
    }
}