package com.elp.ofertas_service.integration.jooble;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class JoobleJobDto {
    private String id;
    private String title;
    private String location;
    private String snippet;
    private String salary;
    private String source;
    private String type;
    private String link;
    private String company;
    private String updated;
}
