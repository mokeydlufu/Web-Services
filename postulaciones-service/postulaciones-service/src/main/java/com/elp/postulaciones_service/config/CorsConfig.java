package com.elp.postulaciones_service.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;

@Configuration
public class CorsConfig {

    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();
        
        // Permitir credenciales
        config.setAllowCredentials(true);
        
        // Permitir orígenes específicos - FRONTEND
        config.setAllowedOrigins(Arrays.asList(
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:3000",
            "http://localhost:4200"
        ));
        
        // Permitir todos los headers (incluyendo Content-Type para multipart/form-data)
        config.addAllowedHeader("*");
        
        // Permitir todos los métodos HTTP
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        
        // Exponer headers de autorización y content-type
        config.setExposedHeaders(Arrays.asList("Authorization", "Content-Type", "Content-Disposition"));
        
        // Aumentar el tiempo de caché para preflight requests (10 minutos)
        config.setMaxAge(600L);
        
        // Aplicar configuración a todas las rutas
        source.registerCorsConfiguration("/**", config);
        
        return new CorsFilter(source);
    }
}
