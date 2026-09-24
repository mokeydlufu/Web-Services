package com.elp.ofertas_service.repository;

import com.elp.ofertas_service.entity.Habilidad;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface HabilidadRepository extends JpaRepository<Habilidad, UUID> {
    boolean existsByNombreIgnoreCase(String nombre);
}