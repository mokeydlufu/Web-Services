package com.elp.ofertas_service.exception;

public class InvalidStateTransitionException extends RuntimeException {
    public InvalidStateTransitionException(String message) { super(message); }
}