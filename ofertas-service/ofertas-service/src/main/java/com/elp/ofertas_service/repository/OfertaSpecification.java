package com.elp.ofertas_service.repository;

import com.elp.ofertas_service.entity.Oferta;
import com.elp.ofertas_service.enums.*;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class OfertaSpecification {

    public static Specification<Oferta> conFiltros(String q, UUID categoriaId, String areaProfesional,
                                                   NivelExperiencia nivelExperiencia, TipoContrato tipoContrato,
                                                   Modalidad modalidad, Jornada jornada, String departamento,
                                                   String provincia, String distrito, BigDecimal salarioMin,
                                                   BigDecimal salarioMax, OffsetDateTime fechaPubDesde,
                                                   OffsetDateTime fechaPubHasta, UUID empresaId, EstadoOferta estado,
                                                   Boolean soloActivas) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (q != null && !q.trim().isEmpty()) {
                String pattern = "%" + q.toLowerCase() + "%";
                Predicate tituloPred = cb.like(cb.lower(root.get("titulo")), pattern);
                Predicate descPred = cb.like(cb.lower(root.get("descripcion")), pattern);
                Predicate areaPred = cb.like(cb.lower(root.get("areaProfesional")), pattern);
                Predicate ubPred = cb.like(cb.lower(root.get("ubicacion")), pattern);
                predicates.add(cb.or(tituloPred, descPred, areaPred, ubPred));
            }

            if (categoriaId != null) {
                predicates.add(cb.equal(root.get("categoriaId"), categoriaId));
            }
            if (areaProfesional != null) {
                predicates.add(cb.equal(root.get("areaProfesional"), areaProfesional));
            }
            if (nivelExperiencia != null) {
                predicates.add(cb.equal(root.get("nivelExperiencia"), nivelExperiencia));
            }
            if (tipoContrato != null) {
                predicates.add(cb.equal(root.get("tipoContrato"), tipoContrato));
            }
            if (modalidad != null) {
                predicates.add(cb.equal(root.get("modalidad"), modalidad));
            }
            if (jornada != null) {
                predicates.add(cb.equal(root.get("jornada"), jornada));
            }
            if (departamento != null && !departamento.trim().isEmpty()) {
                String depPattern = "%" + departamento.toLowerCase().trim() + "%";
                Predicate depMatch = cb.like(cb.lower(root.get("departamento")), depPattern);
                Predicate ubMatch = cb.like(cb.lower(root.get("ubicacion")), depPattern);
                Predicate provMatch = cb.like(cb.lower(root.get("provincia")), depPattern);
                Predicate distMatch = cb.like(cb.lower(root.get("distrito")), depPattern);
                Predicate remotoMatch = cb.equal(root.get("modalidad"), Modalidad.REMOTO);
                predicates.add(cb.or(depMatch, ubMatch, provMatch, distMatch, remotoMatch));
            }
            if (provincia != null) {
                predicates.add(cb.equal(root.get("provincia"), provincia));
            }
            if (distrito != null) {
                predicates.add(cb.equal(root.get("distrito"), distrito));
            }
            if (empresaId != null) {
                predicates.add(cb.equal(root.get("empresaId"), empresaId));
            }
            if (estado != null) {
                predicates.add(cb.equal(root.get("estado"), estado));
            }
            if (soloActivas != null && soloActivas) {
                predicates.add(cb.equal(root.get("aceptaPostulaciones"), true));
            }

            if (salarioMin != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("salarioMinimo"), salarioMin));
            }
            if (salarioMax != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("salarioMaximo"), salarioMax));
            }

            if (fechaPubDesde != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("fechaPublicacion"), fechaPubDesde));
            }
            if (fechaPubHasta != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("fechaPublicacion"), fechaPubHasta));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}