package com.elp.postulaciones_service.repository;

import com.elp.postulaciones_service.model.Postulacion;
import com.elp.postulaciones_service.model.enums.EstadoPostulacion;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PostulacionRepository extends JpaRepository<Postulacion, UUID> {
    
    Optional<Postulacion> findByUuid(UUID uuid);
    
    boolean existsByCandidatoIdAndOfertaId(UUID candidatoId, UUID ofertaId);

    Optional<Postulacion> findByCandidatoIdAndOfertaId(UUID candidatoId, UUID ofertaId);
    
    Page<Postulacion> findByCandidatoId(UUID candidatoId, Pageable pageable);
    
    Optional<Postulacion> findFirstByCandidatoIdAndCvUrlIsNotNullOrderByFechaPostulacionDesc(UUID candidatoId);
    
    Page<Postulacion> findByCandidatoIdAndEstado(UUID candidatoId, EstadoPostulacion estado, Pageable pageable);
    
    Page<Postulacion> findByOfertaIdAndEmpresaId(UUID ofertaId, UUID empresaId, Pageable pageable);
    
    Page<Postulacion> findByOfertaId(UUID ofertaId, Pageable pageable);
    
    Page<Postulacion> findByOfertaIdAndEstado(UUID ofertaId, EstadoPostulacion estado, Pageable pageable);

    
    Page<Postulacion> findByOfertaIdAndEmpresaIdAndEstado(UUID ofertaId, UUID empresaId, EstadoPostulacion estado, Pageable pageable);

    Page<Postulacion> findByEmpresaId(UUID empresaId, Pageable pageable);
    
    Page<Postulacion> findByEmpresaIdAndEstado(UUID empresaId, EstadoPostulacion estado, Pageable pageable);

    Page<Postulacion> findByEstado(EstadoPostulacion estado, Pageable pageable);

    long countByFechaPostulacionGreaterThanEqual(java.sql.Timestamp fecha);
}