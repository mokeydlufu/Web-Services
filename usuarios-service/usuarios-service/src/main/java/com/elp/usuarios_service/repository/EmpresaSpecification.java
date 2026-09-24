package com.elp.usuarios_service.repository;

import com.elp.usuarios_service.model.Empresa;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public class EmpresaSpecification {

    public static Specification<Empresa> conFiltros(String q, String ubicacion, String industria, String estadoVerificacion) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (estadoVerificacion != null && !estadoVerificacion.trim().isEmpty()) {
                predicates.add(cb.equal(root.get("estadoVerificacion"), estadoVerificacion));
            }

            if (q != null && !q.trim().isEmpty()) {
                String searchPattern = "%" + q.toLowerCase() + "%";
                Predicate rzPredicate = cb.like(cb.lower(root.get("razonSocial")), searchPattern);
                Predicate ncPredicate = cb.like(cb.lower(root.get("nombreComercial")), searchPattern);
                Predicate indPredicate = cb.like(cb.lower(root.get("industria")), searchPattern);
                predicates.add(cb.or(rzPredicate, ncPredicate, indPredicate));
            }

            if (ubicacion != null && !ubicacion.trim().isEmpty() && !ubicacion.equalsIgnoreCase("Peru")) {
                predicates.add(cb.like(cb.lower(root.get("ubicacion")), "%" + ubicacion.toLowerCase() + "%"));
            }

            if (industria != null && !industria.trim().isEmpty() && !industria.equalsIgnoreCase("TODAS")) {
                predicates.add(cb.like(cb.lower(root.get("industria")), "%" + industria.toLowerCase() + "%"));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
