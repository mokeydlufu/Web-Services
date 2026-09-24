package com.elp.usuarios_service.controller;

import com.elp.usuarios_service.dto.DniConsultaResponseDTO;
import com.elp.usuarios_service.dto.RucConsultaResponseDTO;
import com.elp.usuarios_service.exception.ConsultaProveedorException;
import com.elp.usuarios_service.exception.DocumentoNoEncontradoException;
import com.elp.usuarios_service.service.ConsultaDocumentoService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/consultas")
@RequiredArgsConstructor
@Slf4j
public class ConsultaDocumentoController {

    private final ConsultaDocumentoService consultaDocumentoService;

    @GetMapping("/dni/{dni}")
    public ResponseEntity<?> consultarDni(@PathVariable String dni) {
        try {
            DniConsultaResponseDTO resultado = consultaDocumentoService.consultarDni(dni);
            return ResponseEntity.ok(resultado);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.BAD_REQUEST).body(Map.of(
                "status", 400,
                "error", "Bad Request",
                "message", e.getMessage()
            ));
        } catch (DocumentoNoEncontradoException e) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.NOT_FOUND).body(Map.of(
                "status", 404,
                "error", "Not Found",
                "message", e.getMessage()
            ));
        } catch (ConsultaProveedorException e) {
            org.springframework.http.HttpStatus status = org.springframework.http.HttpStatus.resolve(e.getStatusCode());
            if (status == null || status == org.springframework.http.HttpStatus.UNAUTHORIZED) {
                status = org.springframework.http.HttpStatus.BAD_GATEWAY;
            }
            return ResponseEntity.status(status).body(Map.of(
                "status", status.value(),
                "error", status.getReasonPhrase(),
                "message", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("Error inesperado en endpoint consultarDni: {}", e.getMessage());
            return ResponseEntity.status(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "status", 500,
                "error", "Internal Server Error",
                "message", "Error interno al procesar la consulta de DNI."
            ));
        }
    }

    @GetMapping("/ruc/{ruc}")
    public ResponseEntity<?> consultarRuc(@PathVariable String ruc) {
        try {
            RucConsultaResponseDTO resultado = consultaDocumentoService.consultarRuc(ruc);
            return ResponseEntity.ok(resultado);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.BAD_REQUEST).body(Map.of(
                "status", 400,
                "error", "Bad Request",
                "message", e.getMessage()
            ));
        } catch (DocumentoNoEncontradoException e) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.NOT_FOUND).body(Map.of(
                "status", 404,
                "error", "Not Found",
                "message", e.getMessage()
            ));
        } catch (ConsultaProveedorException e) {
            org.springframework.http.HttpStatus status = org.springframework.http.HttpStatus.resolve(e.getStatusCode());
            if (status == null || status == org.springframework.http.HttpStatus.UNAUTHORIZED) {
                status = org.springframework.http.HttpStatus.BAD_GATEWAY;
            }
            return ResponseEntity.status(status).body(Map.of(
                "status", status.value(),
                "error", status.getReasonPhrase(),
                "message", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("Error inesperado en endpoint consultarRuc: {}", e.getMessage());
            return ResponseEntity.status(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "status", 500,
                "error", "Internal Server Error",
                "message", "Error interno al procesar la consulta de RUC."
            ));
        }
    }
}