package com.elp.postulaciones_service.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    private static final String TRACE_ID_KEY = "traceId";

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<Map<String, Object>> handleBusinessException(BusinessException ex, HttpServletRequest request) {
        logger.warn("Business rule violation: {}", ex.getMessage());
        return buildErrorResponse(HttpStatus.BAD_REQUEST, "BAD_REQUEST", ex.getMessage(), request);
    }

    @ExceptionHandler(InvalidStateTransitionException.class)
    public ResponseEntity<Map<String, Object>> handleInvalidStateTransition(InvalidStateTransitionException ex, HttpServletRequest request) {
        logger.warn("Invalid state transition: {}", ex.getMessage());
        return buildErrorResponse(HttpStatus.CONFLICT, "CONFLICT", ex.getMessage(), request);
    }

    @ExceptionHandler(DuplicatePostulationException.class)
    public ResponseEntity<Map<String, Object>> handleDuplicatePostulation(DuplicatePostulationException ex, HttpServletRequest request) {
        logger.warn("Duplicate postulation attempt: {}", ex.getMessage());
        return buildErrorResponse(HttpStatus.CONFLICT, "CONFLICT", ex.getMessage(), request);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleResourceNotFound(ResourceNotFoundException ex, HttpServletRequest request) {
        logger.warn("Resource not found: {}", ex.getMessage());
        return buildErrorResponse(HttpStatus.NOT_FOUND, "NOT_FOUND", ex.getMessage(), request);
    }

    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<Map<String, Object>> handleForbidden(ForbiddenException ex, HttpServletRequest request) {
        logger.warn("Forbidden access: {}", ex.getMessage());
        return buildErrorResponse(HttpStatus.FORBIDDEN, "FORBIDDEN", ex.getMessage(), request);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(AccessDeniedException ex, HttpServletRequest request) {
        logger.warn("Access denied (Spring Security): {}", ex.getMessage());
        return buildErrorResponse(HttpStatus.FORBIDDEN, "FORBIDDEN", "No tienes permisos para realizar esta accion", request);
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<Map<String, Object>> handleUnauthorized(UnauthorizedException ex, HttpServletRequest request) {
        logger.warn("Unauthorized access: {}", ex.getMessage());
        return buildErrorResponse(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", ex.getMessage(), request);
    }
    
    @ExceptionHandler(ExternalServiceException.class)
    public ResponseEntity<Map<String, Object>> handleExternalService(ExternalServiceException ex, HttpServletRequest request) {
        logger.error("External service error: {}", ex.getMessage());
        return buildErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "EXTERNAL_SERVICE_ERROR", ex.getMessage(), request);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationExceptions(MethodArgumentNotValidException ex, HttpServletRequest request) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error -> 
            errors.put(error.getField(), error.getDefaultMessage()));
        
        logger.warn("Validation error on path {}: {}", request.getRequestURI(), errors);
        
        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", Instant.now().toString());
        response.put("status", HttpStatus.BAD_REQUEST.value());
        response.put("error", "BAD_REQUEST");
        response.put("message", "Error de validacion en los datos enviados");
        response.put("details", errors);
        response.put("path", request.getRequestURI());
        response.put("traceId", getTraceId());
        
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(org.springframework.http.converter.HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleHttpMessageNotReadable(org.springframework.http.converter.HttpMessageNotReadableException ex, HttpServletRequest request) {
        logger.warn("Malformed JSON request on path {}: {}", request.getRequestURI(), ex.getMessage());
        return buildErrorResponse(HttpStatus.BAD_REQUEST, "BAD_REQUEST", "Formato de solicitud inválido o valor no permitido", request);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGlobalException(Exception ex, HttpServletRequest request) {
        logger.error("Unexpected error on path {}: ", request.getRequestURI(), ex);
        return buildErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_SERVER_ERROR", "Error interno del servidor", request);
    }

    private ResponseEntity<Map<String, Object>> buildErrorResponse(HttpStatus status, String errorStr, String message, HttpServletRequest request) {
        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", Instant.now().toString());
        response.put("status", status.value());
        response.put("error", errorStr);
        response.put("message", message);
        response.put("path", request.getRequestURI());
        response.put("traceId", getTraceId());
        return new ResponseEntity<>(response, status);
    }

    private String getTraceId() {
        String traceId = MDC.get(TRACE_ID_KEY);
        return traceId != null ? traceId : "N/A";
    }
}