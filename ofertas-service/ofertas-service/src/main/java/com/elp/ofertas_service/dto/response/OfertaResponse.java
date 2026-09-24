package com.elp.ofertas_service.dto.response;

import com.elp.ofertas_service.enums.*;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;
import java.util.List;

@Data
@Builder
public class OfertaResponse {
    private UUID id;
    private UUID empresaId;
    private UUID reclutadorId;
    private String titulo;
    private String descripcion;
    private UUID categoriaId;
    private String areaProfesional;
    private NivelExperiencia nivelExperiencia;
    private TipoContrato tipoContrato;
    private Modalidad modalidad;
    private Jornada jornada;
    private BigDecimal salarioMinimo;
    private BigDecimal salarioMaximo;
    private String moneda;
    private String ubicacion;
    private String departamento;
    private String provincia;
    private String distrito;
    private String pais;
    private OffsetDateTime fechaPublicacion;
    private OffsetDateTime fechaVencimiento;
    private EstadoOferta estado;
    private Boolean aceptaPostulaciones;
    private OffsetDateTime fechaCreacion;
    private OffsetDateTime fechaActualizacion;
    private OffsetDateTime fechaCierre;
    private Integer numeroVistas;
    private Integer numeroPostulaciones;
    private List<RequisitoOfertaResponse> requisitos;
}