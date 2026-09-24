package com.elp.ofertas_service.exception;

import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {

    private Map<String, Object> buildErrorResponse(HttpStatus status, String error, String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", OffsetDateTime.now());
        response.put("status", status.value());
        response.put("error", error);
        response.put("message", message);
        response.put("traceId", MDC.get("traceId"));
        return response;
    }

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<Object> handleBusinessException(BusinessException ex) {
        return new ResponseEntity<>(buildErrorResponse(HttpStatus.BAD_REQUEST, "BAD_REQUEST", ex.getMessage()), HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<Object> handleForbiddenException(ForbiddenException ex) {
        return new ResponseEntity<>(buildErrorResponse(HttpStatus.FORBIDDEN, "FORBIDDEN", ex.getMessage()), HttpStatus.FORBIDDEN);
    }
    
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Object> handleAccessDeniedException(AccessDeniedException ex) {
        return new ResponseEntity<>(buildErrorResponse(HttpStatus.FORBIDDEN, "FORBIDDEN", "Acceso denegado"), HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Object> handleResourceNotFoundException(ResourceNotFoundException ex) {
        return new ResponseEntity<>(buildErrorResponse(HttpStatus.NOT_FOUND, "NOT_FOUND", ex.getMessage()), HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<Object> handleDuplicateResourceException(DuplicateResourceException ex) {
        return new ResponseEntity<>(buildErrorResponse(HttpStatus.CONFLICT, "CONFLICT", ex.getMessage()), HttpStatus.CONFLICT);
    }

    @ExceptionHandler(InvalidStateTransitionException.class)
    public ResponseEntity<Object> handleInvalidStateTransitionException(InvalidStateTransitionException ex) {
        return new ResponseEntity<>(buildErrorResponse(HttpStatus.BAD_REQUEST, "INVALID_STATE_TRANSITION", ex.getMessage()), HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Object> handleValidationExceptions(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .findFirst().orElse("Error de validacion");
        return new ResponseEntity<>(buildErrorResponse(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", message), HttpStatus.BAD_REQUEST);
    }
    
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Object> handleHttpMessageNotReadableException(HttpMessageNotReadableException ex) {
        return new ResponseEntity<>(buildErrorResponse(HttpStatus.BAD_REQUEST, "BAD_REQUEST", "Cuerpo de solicitud invalido"), HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Object> handleGeneralException(Exception ex) {
        ex.printStackTrace(); // Added to see the 500 error in logs
        return new ResponseEntity<>(buildErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_SERVER_ERROR", "Ha ocurrido un error interno"), HttpStatus.INTERNAL_SERVER_ERROR);
    }
}