package com.elp.postulaciones_service.repository;

import com.elp.postulaciones_service.model.HistorialPostulacion;
import com.elp.postulaciones_service.model.Postulacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface HistorialPostulacionRepository extends JpaRepository<HistorialPostulacion, UUID> {
    void deleteByPostulacion(Postulacion postulacion);
}
