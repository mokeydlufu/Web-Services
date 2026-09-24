package com.elp.ofertas_service.repository;

import com.elp.ofertas_service.entity.Oferta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

@Repository
public interface OfertaRepository extends JpaRepository<Oferta, UUID>, JpaSpecificationExecutor<Oferta> {
    boolean existsByCategoriaId(UUID categoriaId);

    @Query("SELECT o.empresaId, COUNT(o) FROM Oferta o WHERE o.estado = 'PUBLICADA' AND o.empresaId IN :empresaIds GROUP BY o.empresaId")
    List<Object[]> countPublicadasByEmpresaIds(@Param("empresaIds") List<UUID> empresaIds);

    long countByEstado(com.elp.ofertas_service.enums.EstadoOferta estado);
}