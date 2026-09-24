package com.elp.ofertas_service.integration.jooble;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.Collections;
import java.util.Optional;

@Component
public class JoobleClient {

    private static final Logger log = LoggerFactory.getLogger(JoobleClient.class);
    @Value("${jooble.api.url:https://pe.jooble.org/api/}")
    private String joobleBaseUrl;

    private final RestTemplate restTemplate;

    @Value("${jooble.api.key:}")
    private String joobleApiKey;

    public JoobleClient(RestTemplateBuilder builder) {
        this.restTemplate = builder
                .setConnectTimeout(Duration.ofSeconds(6))
                .setReadTimeout(Duration.ofSeconds(10))
                .build();
    }

    @jakarta.annotation.PostConstruct
    public void init() {
        log.info("Jooble configurado correctamente: {}", isConfigured());
    }

    public boolean isConfigured() {
        return joobleApiKey != null && !joobleApiKey.trim().isEmpty();
    }

    public Optional<JoobleResponse> buscarEmpleos(String keywords, String location, int page) {
        if (!isConfigured()) {
            log.info("Integración con empleos externos no configurada. JOOBLE_API_KEY no definida.");
            return Optional.empty();
        }

        try {
            String url = joobleBaseUrl + joobleApiKey.trim();
            log.info("Diagnosticando Jooble API...");
            log.info("URL Base utilizada: {}", joobleBaseUrl);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
            headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

            JoobleRequest requestBody = JoobleRequest.builder()
                    .keywords(keywords != null && !keywords.trim().isEmpty() ? keywords.trim() : "")
                    .location(location != null && !location.trim().isEmpty() ? location.trim() : "Perú")
                    .page(Math.max(1, page))
                    .build();

            HttpEntity<JoobleRequest> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<JoobleResponse> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    entity,
                    JoobleResponse.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                log.info("Respuesta HTTP de Jooble: {} OK", response.getStatusCode());
                int cantidad = response.getBody().getJobs() != null ? response.getBody().getJobs().size() : 0;
                log.info("Cantidad de empleos devueltos por Jooble: {}", cantidad);
                if (cantidad > 0) {
                    for (int i = 0; i < Math.min(cantidad, 3); i++) {
                        log.info("Ejemplo de empleo devuelto: Locación = {}", response.getBody().getJobs().get(i).getLocation());
                    }
                }
                return Optional.of(response.getBody());
            } else {
                log.warn("Jooble API respondió con código de error: {}", response.getStatusCode());
                return Optional.empty();
            }

        } catch (Exception e) {
            log.error("Error al consultar Jooble API: {}", e.getMessage());
            return Optional.empty();
        }
    }
}
