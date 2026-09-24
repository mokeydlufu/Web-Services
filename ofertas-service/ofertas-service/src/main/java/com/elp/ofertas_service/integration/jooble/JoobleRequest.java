package com.elp.ofertas_service.integration.jooble;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JoobleRequest {
    private String keywords;
    private String location;
    private Integer page;
}
