package com.elp.postulaciones_service.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

@Configuration
public class RestClientConfig {

    @Bean
    public RestClient restClient() {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(2000); // 2 segundos maximo para conectar segun contrato
        requestFactory.setReadTimeout(2000);    // 2 segundos maximo para leer

        return RestClient.builder()
                .requestFactory(requestFactory)
                .build();
    }
}