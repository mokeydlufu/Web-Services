package com.elp.usuarios_service.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.elp.usuarios_service.model.SesionUsuario;

@Repository
public interface SesionUsuarioRepository extends JpaRepository<SesionUsuario, UUID> {
}
