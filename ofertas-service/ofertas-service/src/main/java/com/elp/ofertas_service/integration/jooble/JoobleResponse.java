package com.elp.ofertas_service.integration.jooble;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class JoobleResponse {
    private Integer totalCount;
    @Builder.Default
    private List<JoobleJobDto> jobs = new ArrayList<>();
}
