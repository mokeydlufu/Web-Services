package com.elp.postulaciones_service.repository;

import com.elp.postulaciones_service.model.AuditoriaPostulacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface AuditoriaPostulacionRepository extends JpaRepository<AuditoriaPostulacion, UUID> {
}
