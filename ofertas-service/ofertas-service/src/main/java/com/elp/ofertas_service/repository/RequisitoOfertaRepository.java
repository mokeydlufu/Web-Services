package com.elp.ofertas_service.repository;

import com.elp.ofertas_service.entity.RequisitoOferta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RequisitoOfertaRepository extends JpaRepository<RequisitoOferta, UUID> {
    List<RequisitoOferta> findByOfertaId(UUID ofertaId);
}