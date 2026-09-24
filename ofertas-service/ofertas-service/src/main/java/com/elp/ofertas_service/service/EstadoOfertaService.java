package com.elp.ofertas_service.service;

import com.elp.ofertas_service.enums.EstadoOferta;
import com.elp.ofertas_service.exception.InvalidStateTransitionException;
import org.springframework.stereotype.Service;

@Service
public class EstadoOfertaService {

    public void validarTransicion(EstadoOferta actual, EstadoOferta nuevo) {
        if (actual == nuevo) {
            return;
        }

        boolean valid = switch (actual) {
            case BORRADOR -> nuevo == EstadoOferta.PENDIENTE_APROBACION || nuevo == EstadoOferta.CANCELADA || nuevo == EstadoOferta.CERRADA;
            case PENDIENTE_APROBACION -> nuevo == EstadoOferta.PUBLICADA || nuevo == EstadoOferta.RECHAZADA || nuevo == EstadoOferta.BORRADOR || nuevo == EstadoOferta.CANCELADA || nuevo == EstadoOferta.CERRADA;
            case RECHAZADA -> nuevo == EstadoOferta.BORRADOR || nuevo == EstadoOferta.PENDIENTE_APROBACION || nuevo == EstadoOferta.CANCELADA || nuevo == EstadoOferta.CERRADA;
            case PUBLICADA -> nuevo == EstadoOferta.PAUSADA || nuevo == EstadoOferta.CERRADA || nuevo == EstadoOferta.VENCIDA || nuevo == EstadoOferta.CANCELADA;
            case PAUSADA -> nuevo == EstadoOferta.PUBLICADA || nuevo == EstadoOferta.CERRADA || nuevo == EstadoOferta.VENCIDA || nuevo == EstadoOferta.CANCELADA;
            case CERRADA, VENCIDA, CANCELADA -> false; // Estados finales
        };

        if (!valid) {
            throw new InvalidStateTransitionException("No se puede pasar del estado " + actual + " a " + nuevo);
        }
    }
}