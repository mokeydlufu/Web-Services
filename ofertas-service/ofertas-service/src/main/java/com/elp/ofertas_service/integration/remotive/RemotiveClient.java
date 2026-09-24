package com.elp.ofertas_service.integration.remotive;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.Duration;
import java.util.Collections;
import java.util.Optional;

@Component
public class RemotiveClient {

    private static final Logger log = LoggerFactory.getLogger(RemotiveClient.class);
    private static final String REMOTIVE_BASE_URL = "https://remotive.com/api/remote-jobs";

    private final RestTemplate restTemplate;

    public RemotiveClient(RestTemplateBuilder builder) {
        this.restTemplate = builder
                .setConnectTimeout(Duration.ofSeconds(6))
                .setReadTimeout(Duration.ofSeconds(10))
                .build();
    }

    public Optional<RemotiveResponse> buscarEmpleos(String search, int limit) {
        try {
            UriComponentsBuilder uriBuilder = UriComponentsBuilder.fromHttpUrl(REMOTIVE_BASE_URL);
            if (search != null && !search.trim().isEmpty()) {
                uriBuilder.queryParam("search", search.trim());
            }
            uriBuilder.queryParam("limit", Math.max(1, limit));

            HttpHeaders headers = new HttpHeaders();
            headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
            headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<RemotiveResponse> response = restTemplate.exchange(
                    uriBuilder.toUriString(),
                    HttpMethod.GET,
                    entity,
                    RemotiveResponse.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return Optional.of(response.getBody());
            } else {
                log.warn("Remotive API respondió con código: {}", response.getStatusCode());
                return Optional.empty();
            }
        } catch (Exception e) {
            log.error("Error al consultar Remotive API: {}", e.getMessage());
            return Optional.empty();
        }
    }
}
