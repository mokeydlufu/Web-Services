package com.elp.usuarios_service.repository;

import com.elp.usuarios_service.model.Proyecto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProyectoRepository extends JpaRepository<Proyecto, UUID> {
    List<Proyecto> findByUsuarioId(UUID usuarioId);
}
