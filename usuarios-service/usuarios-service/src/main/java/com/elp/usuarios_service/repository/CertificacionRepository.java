package com.elp.usuarios_service.repository;

import com.elp.usuarios_service.model.Certificacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface CertificacionRepository extends JpaRepository<Certificacion, UUID> {
}
