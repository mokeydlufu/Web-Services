package com.elp.usuarios_service.repository;

import com.elp.usuarios_service.model.Estudiante;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface EstudianteRepository extends JpaRepository<Estudiante, UUID> {
    Optional<Estudiante> findByDni(String dni);
    Optional<Estudiante> findByEmail(String email);
    boolean existsByDni(String dni);
}
