package com.elp.postulaciones_service.repository;

import com.elp.postulaciones_service.model.Entrevista;
import com.elp.postulaciones_service.model.Postulacion;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface EntrevistaRepository extends JpaRepository<Entrevista, UUID> {
    Optional<Entrevista> findByUuid(UUID uuid);
    Page<Entrevista> findByPostulacion(Postulacion postulacion, Pageable pageable);
    Page<Entrevista> findByPostulacionCandidatoId(UUID candidatoId, Pageable pageable);
    void deleteByPostulacion(Postulacion postulacion);
}