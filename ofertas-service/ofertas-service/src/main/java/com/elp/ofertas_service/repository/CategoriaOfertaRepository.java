package com.elp.ofertas_service.repository;

import com.elp.ofertas_service.entity.CategoriaOferta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface CategoriaOfertaRepository extends JpaRepository<CategoriaOferta, UUID> {
    boolean existsByNombreIgnoreCase(String nombre);
}