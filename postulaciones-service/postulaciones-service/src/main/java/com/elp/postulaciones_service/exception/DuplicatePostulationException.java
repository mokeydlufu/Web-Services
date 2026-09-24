package com.elp.postulaciones_service.exception;

public class DuplicatePostulationException extends RuntimeException {
    public DuplicatePostulationException(String message) {
        super(message);
    }
}
