package com.elp.postulaciones_service.dto.ia;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GenerarCartaIaResponse {
    private boolean success;
    private String carta;
    private String message;
}
