package com.elp.postulaciones_service.repository;

import com.elp.postulaciones_service.model.EvaluacionPostulacion;
import com.elp.postulaciones_service.model.Postulacion;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EvaluacionPostulacionRepository extends JpaRepository<EvaluacionPostulacion, UUID> {
    Optional<EvaluacionPostulacion> findByUuid(UUID uuid);
    Page<EvaluacionPostulacion> findByPostulacion(Postulacion postulacion, Pageable pageable);
    void deleteByPostulacion(Postulacion postulacion);

    @Query("SELECT e FROM EvaluacionPostulacion e WHERE e.postulacion.candidatoId = :candidatoId AND e.postulacion.ofertaId = :ofertaId AND UPPER(COALESCE(e.tipo, 'PRUEBA_TECNICA')) = UPPER(:tipo) AND (e.estado IS NULL OR UPPER(e.estado) NOT IN ('CANCELADA', 'INACTIVA'))")
    List<EvaluacionPostulacion> findActiveByCandidatoOfertaAndTipo(
        @Param("candidatoId") UUID candidatoId,
        @Param("ofertaId") UUID ofertaId,
        @Param("tipo") String tipo
    );

    @Query("SELECT e FROM EvaluacionPostulacion e WHERE e.postulacion.empresaId = :empresaId ORDER BY e.fechaEvaluacion DESC")
    Page<EvaluacionPostulacion> findByEmpresaId(@Param("empresaId") UUID empresaId, Pageable pageable);
}