package com.elp.usuarios_service.repository;

import com.elp.usuarios_service.model.Empresa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

@Repository
public interface EmpresaRepository extends JpaRepository<Empresa, UUID>, JpaSpecificationExecutor<Empresa> {
    Optional<Empresa> findByRuc(String ruc);
    Optional<Empresa> findByEmail(String email);
    java.util.List<Empresa> findByEstadoVerificacion(String estadoVerificacion);
    long countByEstadoVerificacion(String estadoVerificacion);
}
