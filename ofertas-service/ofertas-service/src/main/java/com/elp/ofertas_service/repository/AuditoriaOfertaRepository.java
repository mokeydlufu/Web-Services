package com.elp.ofertas_service.repository;

import com.elp.ofertas_service.entity.AuditoriaOferta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface AuditoriaOfertaRepository extends JpaRepository<AuditoriaOferta, UUID> {
}