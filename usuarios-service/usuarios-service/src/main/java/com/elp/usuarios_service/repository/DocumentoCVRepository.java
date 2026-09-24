package com.elp.usuarios_service.repository;

import com.elp.usuarios_service.model.DocumentoCV;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface DocumentoCVRepository extends JpaRepository<DocumentoCV, UUID> {
    Optional<DocumentoCV> findByUsuarioIdAndActivoTrue(UUID usuarioId);
}
