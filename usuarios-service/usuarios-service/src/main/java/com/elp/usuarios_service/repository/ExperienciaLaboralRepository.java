package com.elp.usuarios_service.repository;

import com.elp.usuarios_service.model.ExperienciaLaboral;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ExperienciaLaboralRepository extends JpaRepository<ExperienciaLaboral, UUID> {
    List<ExperienciaLaboral> findByUsuarioId(UUID usuarioId);
}
