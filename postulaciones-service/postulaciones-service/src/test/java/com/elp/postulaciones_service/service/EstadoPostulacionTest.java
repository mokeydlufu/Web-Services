package com.elp.postulaciones_service.service;

import com.elp.postulaciones_service.exception.InvalidStateTransitionException;
import com.elp.postulaciones_service.model.enums.EstadoPostulacion;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class EstadoPostulacionTest {

    private final EstadoPostulacionService service = new EstadoPostulacionService();

    @Test
    void transicionesValidas() {
        assertDoesNotThrow(() -> service.validarTransicion(EstadoPostulacion.ENVIADA, EstadoPostulacion.RECIBIDA));
        assertDoesNotThrow(() -> service.validarTransicion(EstadoPostulacion.EN_REVISION, EstadoPostulacion.RECHAZADA));
        assertDoesNotThrow(() -> service.validarTransicion(EstadoPostulacion.ENTREVISTA, EstadoPostulacion.EVALUACION));
    }

    @Test
    void transicionesInvalidas() {
        assertThrows(InvalidStateTransitionException.class, () -> service.validarTransicion(EstadoPostulacion.ENVIADA, EstadoPostulacion.EVALUACION));
        assertThrows(InvalidStateTransitionException.class, () -> service.validarTransicion(EstadoPostulacion.RECHAZADA, EstadoPostulacion.EN_REVISION));
    }

    @Test
    void estadoFinalNoPuedeModificarse() {
        assertThrows(InvalidStateTransitionException.class, () -> service.validarTransicion(EstadoPostulacion.SELECCIONADA, EstadoPostulacion.ENTREVISTA));
        assertThrows(InvalidStateTransitionException.class, () -> service.validarTransicion(EstadoPostulacion.RETIRADA, EstadoPostulacion.ENVIADA));
    }
}