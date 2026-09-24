package com.elp.usuarios_service.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Entity
@Table(name = "preferencias_laborales")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PreferenciaLaboral {

    @Id
    @Column(name = "usuario_id")
    private UUID usuarioId;

    @Column(name = "puesto_deseado")
    private String puestoDeseado;

    @Column(name = "salario_minimo")
    private Double salarioMinimo;

    @Column(name = "salario_maximo")
    private Double salarioMaximo;

    private String modalidad; // REMOTO, HIBRIDO, PRESENCIAL
    
    @Column(name = "tipo_contrato")
    private String tipoContrato; // TIEMPO_COMPLETO, MEDIO_TIEMPO, PRACTICAS, TEMPORAL, FREELANCE

    private String ubicaciones;
    private String disponibilidad;
}
