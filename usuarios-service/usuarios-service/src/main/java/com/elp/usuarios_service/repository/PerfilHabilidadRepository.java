package com.elp.usuarios_service.repository;

import com.elp.usuarios_service.model.PerfilHabilidad;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PerfilHabilidadRepository extends JpaRepository<PerfilHabilidad, UUID> {
    List<PerfilHabilidad> findByUsuarioId(UUID usuarioId);
}
