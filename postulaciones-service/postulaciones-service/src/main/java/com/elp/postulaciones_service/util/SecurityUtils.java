package com.elp.postulaciones_service.util;

import com.elp.postulaciones_service.exception.UnauthorizedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.UUID;

public class SecurityUtils {

    public static UUID getUsuarioLogueadoId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof Jwt) {
            Jwt jwt = (Jwt) authentication.getPrincipal();
            String sub = jwt.getSubject();
            if (sub != null) {
                return UUID.fromString(sub);
            }
        }
        throw new UnauthorizedException("No se encontro un usuario autenticado");
    }

    public static String getRolUsuarioLogueado() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof Jwt) {
            Jwt jwt = (Jwt) authentication.getPrincipal();
            return jwt.getClaimAsString("rol");
        }
        return null;
    }

    public static String getJwtToken() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof Jwt) {
            Jwt jwt = (Jwt) authentication.getPrincipal();
            return jwt.getTokenValue();
        }
        throw new UnauthorizedException("No se encontro un token JWT en el contexto");
    }

    public static UUID getEmpresaIdClaim() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.getPrincipal() instanceof Jwt jwt) {
                String empresaClaim = jwt.getClaimAsString("empresaId");
                if (empresaClaim == null) {
                    empresaClaim = jwt.getClaimAsString("empresa_id");
                }
                if (empresaClaim == null) {
                    empresaClaim = jwt.getClaimAsString("empresaID");
                }
                if (empresaClaim != null && !empresaClaim.isBlank()) {
                    return UUID.fromString(empresaClaim.trim());
                }
            }
        } catch (Exception ignored) {
        }
        return null;
    }
}