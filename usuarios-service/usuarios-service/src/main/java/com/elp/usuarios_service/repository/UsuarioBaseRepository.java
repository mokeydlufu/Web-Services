package com.elp.usuarios_service.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.elp.usuarios_service.model.UsuarioBase;

@Repository
public interface UsuarioBaseRepository extends JpaRepository<UsuarioBase, UUID> {
    Optional<UsuarioBase> findByEmail(String email);
    boolean existsByEmail(String email);
}
