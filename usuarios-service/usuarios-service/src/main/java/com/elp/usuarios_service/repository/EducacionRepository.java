package com.elp.usuarios_service.repository;

import com.elp.usuarios_service.model.Educacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface EducacionRepository extends JpaRepository<Educacion, UUID> {
    java.util.List<Educacion> findByUsuarioId(UUID usuarioId);
}
