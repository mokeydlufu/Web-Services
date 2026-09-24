package com.elp.usuarios_service.exception;

public class ConsultaProveedorException extends RuntimeException {
    private final int statusCode;

    public ConsultaProveedorException(String message) {
        super(message);
        this.statusCode = 502;
    }

    public ConsultaProveedorException(int statusCode, String message) {
        super(message);
        this.statusCode = statusCode;
    }

    public int getStatusCode() {
        return statusCode;
    }
}

