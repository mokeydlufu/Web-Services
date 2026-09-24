package com.elp.ofertas_service.dto.request;

import com.elp.ofertas_service.enums.Jornada;
import com.elp.ofertas_service.enums.Modalidad;
import com.elp.ofertas_service.enums.NivelExperiencia;
import com.elp.ofertas_service.enums.TipoContrato;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
public class OfertaRequest {
    @NotBlank(message = "El titulo es obligatorio")
    @Size(max = 200, message = "El titulo no puede tener mas de 200 caracteres")
    private String titulo;

    @NotBlank(message = "La descripcion es obligatoria")
    private String descripcion;

    @NotNull(message = "La categoria es obligatoria")
    private UUID categoriaId;

    private String areaProfesional;

    @NotNull(message = "El nivel de experiencia es obligatorio")
    private NivelExperiencia nivelExperiencia;

    @NotNull(message = "El tipo de contrato es obligatorio")
    private TipoContrato tipoContrato;

    @NotNull(message = "La modalidad es obligatoria")
    private Modalidad modalidad;

    @NotNull(message = "La jornada es obligatoria")
    private Jornada jornada;

    @Min(value = 0, message = "El salario minimo no puede ser negativo")
    private BigDecimal salarioMinimo;

    @Min(value = 0, message = "El salario maximo no puede ser negativo")
    private BigDecimal salarioMaximo;

    private String moneda;
    private String ubicacion;
    private String departamento;
    private String provincia;
    private String distrito;
    private String pais;

    @FutureOrPresent(message = "La fecha de vencimiento no puede ser pasada")
    private OffsetDateTime fechaVencimiento;
}