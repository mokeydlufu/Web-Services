package com.elp.usuarios_service.service;

import com.elp.usuarios_service.dto.DniConsultaResponseDTO;
import com.elp.usuarios_service.dto.RucConsultaResponseDTO;
import com.elp.usuarios_service.exception.ConsultaProveedorException;
import com.elp.usuarios_service.exception.DocumentoNoEncontradoException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.net.CookieManager;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@Slf4j
public class ConsultaDocumentoService {

    private final RestTemplate restTemplate;

    @Value("${apisperu.token:${apiperu.token:}}")
    private String apiToken;

    @Value("${apisperu.dni-url:https://api.apis.net.pe/v1/dni}")
    private String dniUrl;

    @Value("${apisperu.ruc-url:https://api.apis.net.pe/v1/ruc}")
    private String rucUrl;

    public ConsultaDocumentoService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    private String obtenerToken() {
        if (apiToken == null || apiToken.trim().isEmpty()) {
            throw new ConsultaProveedorException(503, "Servicio de validación de DNI no disponible.");
        }
        return apiToken.trim();
    }

    private String buildUrl(String baseUrl, String paramName, String documentNumber) {
        String cleanUrl = baseUrl.trim();
        if (cleanUrl.contains("apis.net.pe")) {
            return cleanUrl + (cleanUrl.contains("?") ? "&" : "?") + paramName + "=" + documentNumber;
        } else {
            return cleanUrl.replaceAll("/+$", "") + "/" + documentNumber;
        }
    }

    public DniConsultaResponseDTO consultarDni(String dni) {
        if (dni != null) {
            dni = dni.trim();
        }
        if (dni == null || !dni.matches("^[0-9]{8}$")) {
            throw new IllegalArgumentException("El DNI debe tener exactamente 8 dígitos numéricos");
        }
        String token = obtenerToken();
        
        String primaryBase = (dniUrl != null && !dniUrl.trim().isEmpty()) 
                ? dniUrl.trim() 
                : "https://api.apis.net.pe/v1/dni";
        
        String fallbackBase = primaryBase.contains("apis.net.pe")
                ? "https://peruapi.com/api/dni"
                : "https://api.apis.net.pe/v1/dni";

        log.info("Consultando DNI {} en servicio de identidad...", dni);

        try {
            return ejecutarConsultaDni(primaryBase, dni, token);
        } catch (Exception e) {
            log.info("Consulta principal para DNI {} no obtuvo resultado ({}). Intentando respaldo...", 
                    dni, e.getMessage());
            
            // 1. Intento con URL de respaldo directo
            try {
                return ejecutarConsultaDni(fallbackBase, dni, token);
            } catch (Exception ignored) {
            }

            // 2. Intento con padrón alternativo (eldni.com)
            DniConsultaResponseDTO fallbackDto = consultarDniEnPadronAlternativo(dni);
            if (fallbackDto != null) {
                return fallbackDto;
            }

            if (e instanceof DocumentoNoEncontradoException) {
                throw (DocumentoNoEncontradoException) e;
            }
            if (e instanceof ConsultaProveedorException) {
                throw (ConsultaProveedorException) e;
            }
            throw new ConsultaProveedorException(502, "No se pudo validar el DNI.");
        }
    }

    private DniConsultaResponseDTO ejecutarConsultaDni(String baseUrl, String dni, String token) {
        String url = buildUrl(baseUrl, "numero", dni);

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");
            headers.set("X-API-KEY", token);
            headers.setBearerAuth(token);
            HttpEntity<Void> request = new HttpEntity<>(headers);

            ResponseEntity<DniConsultaResponseDTO> response = restTemplate.exchange(
                    url, HttpMethod.GET, request, DniConsultaResponseDTO.class);
            DniConsultaResponseDTO resultado = response.getBody();

            if (resultado == null) {
                throw new DocumentoNoEncontradoException("No se recibió respuesta para el DNI ingresado");
            }

            if ("404".equals(resultado.getCode()) || (resultado.getMensaje() != null && resultado.getMensaje().toLowerCase().contains("no encontrado"))) {
                throw new DocumentoNoEncontradoException("El DNI ingresado no figura en el padrón de RENIEC.");
            }

            if (Boolean.FALSE.equals(resultado.getSuccess())) {
                String errorMsg = resultado.getMessage() != null ? resultado.getMessage().trim() : "";
                log.warn("Servicio devolvió success=false para DNI {}: {}", dni, errorMsg);
                if (errorMsg.toLowerCase().contains("no se encontraron") || errorMsg.toLowerCase().contains("no encontrado")) {
                    throw new DocumentoNoEncontradoException("El DNI ingresado no figura en el padrón de RENIEC.");
                } else if (errorMsg.toLowerCase().contains("token") || errorMsg.toLowerCase().contains("autoriz")) {
                    throw new ConsultaProveedorException(502, "Servicio de validación no disponible temporalmente.");
                } else if (errorMsg.toLowerCase().contains("límite") || errorMsg.toLowerCase().contains("limite") || errorMsg.toLowerCase().contains("crédito") || errorMsg.toLowerCase().contains("credito")) {
                    throw new ConsultaProveedorException(429, "Se ha agotado el límite de consultas permitidas.");
                } else {
                    throw new ConsultaProveedorException(502, errorMsg.isEmpty() ? "No se pudo consultar el DNI en el servicio externo." : errorMsg);
                }
            }

            if (resultado.getData() != null) {
                Map<String, Object> d = resultado.getData();
                if (resultado.getNombres() == null && d.get("nombres") != null) {
                    resultado.setNombres(String.valueOf(d.get("nombres")));
                }
                if (resultado.getApellidoPaterno() == null && (d.get("apellido_paterno") != null || d.get("apellidoPaterno") != null)) {
                    Object ap = d.get("apellido_paterno") != null ? d.get("apellido_paterno") : d.get("apellidoPaterno");
                    resultado.setApellidoPaterno(String.valueOf(ap));
                }
                if (resultado.getApellidoMaterno() == null && (d.get("apellido_materno") != null || d.get("apellidoMaterno") != null)) {
                    Object am = d.get("apellido_materno") != null ? d.get("apellido_materno") : d.get("apellidoMaterno");
                    resultado.setApellidoMaterno(String.valueOf(am));
                }
                if (resultado.getNombreCompleto() == null && (d.get("nombre_completo") != null || d.get("nombreCompleto") != null)) {
                    Object nc = d.get("nombre_completo") != null ? d.get("nombre_completo") : d.get("nombreCompleto");
                    resultado.setNombreCompleto(String.valueOf(nc));
                }
            }

            if (resultado.getApellidoPaterno() == null && resultado.getApellidoPaternoSnake() != null) {
                resultado.setApellidoPaterno(resultado.getApellidoPaternoSnake());
            }
            if (resultado.getApellidoMaterno() == null && resultado.getApellidoMaternoSnake() != null) {
                resultado.setApellidoMaterno(resultado.getApellidoMaternoSnake());
            }
            if (resultado.getCodVerifica() == null && resultado.getDv() != null) {
                resultado.setCodVerifica(resultado.getDv());
            }
            if (resultado.getNombreCompleto() == null && resultado.getCliente() != null) {
                resultado.setNombreCompleto(resultado.getCliente());
            }

            String apePaterno = resultado.getApellidoPaterno() != null ? resultado.getApellidoPaterno().trim() : "";
            String apeMaterno = resultado.getApellidoMaterno() != null ? resultado.getApellidoMaterno().trim() : "";
            String nombres = resultado.getNombres() != null ? resultado.getNombres().trim() : "";

            if (nombres.isEmpty() && resultado.getNombre() != null && !resultado.getNombre().trim().isEmpty()) {
                nombres = resultado.getNombre().trim();
            }

            if (nombres.isEmpty() && apePaterno.isEmpty()) {
                throw new DocumentoNoEncontradoException("No se encontraron nombres asociados al DNI en RENIEC.");
            }

            String nombreCompleto = resultado.getNombreCompleto();
            if (nombreCompleto == null || nombreCompleto.trim().isEmpty()) {
                if (resultado.getNombre() != null && !resultado.getNombre().trim().isEmpty()) {
                    nombreCompleto = resultado.getNombre().trim();
                } else {
                    nombreCompleto = (nombres + " " + apePaterno + " " + apeMaterno).replaceAll("\\s+", " ").trim();
                }
            }

            resultado.setDni(dni);
            resultado.setNombres(nombres);
            resultado.setApellidoPaterno(apePaterno);
            resultado.setApellidoMaterno(apeMaterno);
            resultado.setNombreCompleto(nombreCompleto);
            resultado.setSuccess(true);
            return resultado;
        } catch (HttpStatusCodeException e) {
            int statusCode = e.getStatusCode().value();
            log.warn("Error HTTP {} al consultar DNI {}: {}", statusCode, dni, e.getResponseBodyAsString());
            if (statusCode == 401 || statusCode == 403) {
                throw new ConsultaProveedorException(502, "Servicio de validación no disponible temporalmente.");
            } else if (statusCode == 404) {
                throw new DocumentoNoEncontradoException("El DNI ingresado no fue encontrado en RENIEC.");
            } else if (statusCode == 429) {
                throw new ConsultaProveedorException(429, "Límite de consultas excedido (créditos agotados).");
            } else if (statusCode >= 500) {
                throw new ConsultaProveedorException(500, "El servicio de RENIEC respondió con un error de servidor (HTTP " + statusCode + ").");
            } else {
                throw new ConsultaProveedorException(statusCode, "Error al consultar DNI (HTTP " + statusCode + ").");
            }
        } catch (ResourceAccessException e) {
            log.error("Timeout al consultar DNI {}", dni);
            throw new ConsultaProveedorException(504, "Tiempo de espera agotado al conectar con el servicio de consultas.");
        } catch (DocumentoNoEncontradoException | ConsultaProveedorException | IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error inesperado al consultar DNI {}: {}", dni, e.getMessage());
            throw new ConsultaProveedorException(500, "Error interno al procesar la validación de DNI.");
        }
    }

    public RucConsultaResponseDTO consultarRuc(String ruc) {
        if (ruc != null) {
            ruc = ruc.trim();
        }
        if (ruc == null || !ruc.matches("^[0-9]{11}$")) {
            throw new IllegalArgumentException("El RUC debe tener exactamente 11 dígitos numéricos");
        }
        String token = obtenerToken();
        
        String primaryBase = (rucUrl != null && !rucUrl.trim().isEmpty()) 
                ? rucUrl.trim() 
                : "https://api.apis.net.pe/v1/ruc";

        String fallbackBase = primaryBase.contains("apis.net.pe")
                ? "https://peruapi.com/api/ruc"
                : "https://api.apis.net.pe/v1/ruc";

        log.info("Consultando RUC {} en servicio SUNAT...", ruc);

        try {
            return ejecutarConsultaRuc(primaryBase, ruc, token);
        } catch (ConsultaProveedorException e) {
            if (e.getStatusCode() == 502 || e.getStatusCode() == 401) {
                log.info("Intento primario de RUC con {} falló con status {}. Intentando fallback {}...", 
                        primaryBase, e.getStatusCode(), fallbackBase);
                try {
                    return ejecutarConsultaRuc(fallbackBase, ruc, token);
                } catch (Exception fallbackEx) {
                    log.warn("Fallback de RUC también falló: {}", fallbackEx.getMessage());
                    throw e;
                }
            }
            throw e;
        }
    }

    private RucConsultaResponseDTO ejecutarConsultaRuc(String baseUrl, String ruc, String token) {
        String url = buildUrl(baseUrl, "numero", ruc);

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");
            headers.set("X-API-KEY", token);
            headers.setBearerAuth(token);
            HttpEntity<Void> request = new HttpEntity<>(headers);

            ResponseEntity<RucConsultaResponseDTO> response = restTemplate.exchange(
                    url, HttpMethod.GET, request, RucConsultaResponseDTO.class);
            RucConsultaResponseDTO resultado = response.getBody();

            if (resultado == null) {
                throw new DocumentoNoEncontradoException("No se recibieron datos para el RUC ingresado");
            }

            if ("404".equals(resultado.getCode()) || (resultado.getMensaje() != null && resultado.getMensaje().toLowerCase().contains("no encontrado"))) {
                throw new DocumentoNoEncontradoException("El RUC ingresado no fue encontrado en SUNAT.");
            }

            if (Boolean.FALSE.equals(resultado.getSuccess())) {
                String errorMsg = resultado.getMessage() != null ? resultado.getMessage().trim() : "No se encontraron datos para el RUC ingresado";
                throw new DocumentoNoEncontradoException(errorMsg);
            }

            if (resultado.getData() != null) {
                Map<String, Object> d = resultado.getData();
                if (resultado.getRazonSocial() == null && (d.get("nombre_o_razon_social") != null || d.get("razonSocial") != null)) {
                    Object rz = d.get("nombre_o_razon_social") != null ? d.get("nombre_o_razon_social") : d.get("razonSocial");
                    resultado.setRazonSocial(String.valueOf(rz));
                }
                if (resultado.getEstado() == null && d.get("estado") != null) {
                    resultado.setEstado(String.valueOf(d.get("estado")));
                }
                if (resultado.getCondicion() == null && d.get("condicion") != null) {
                    resultado.setCondicion(String.valueOf(d.get("condicion")));
                }
                if (resultado.getDireccion() == null && d.get("direccion") != null) {
                    resultado.setDireccion(String.valueOf(d.get("direccion")));
                }
            }

            if (resultado.getRazonSocial() == null && resultado.getRazonSocialSnake() != null) {
                resultado.setRazonSocial(resultado.getRazonSocialSnake());
            }

            if (resultado.getRazonSocial() == null || resultado.getRazonSocial().trim().isEmpty()) {
                if (resultado.getNombre() != null && !resultado.getNombre().trim().isEmpty()) {
                    resultado.setRazonSocial(resultado.getNombre().trim());
                }
            }

            if (resultado.getRazonSocial() == null || resultado.getRazonSocial().trim().isEmpty()) {
                throw new DocumentoNoEncontradoException("No se encontraron datos para el RUC ingresado en SUNAT.");
            }

            if (resultado.getNombre() == null && resultado.getRazonSocial() != null) {
                resultado.setNombre(resultado.getRazonSocial());
            }
            if (resultado.getNumeroDocumento() == null && resultado.getRuc() != null) {
                resultado.setNumeroDocumento(resultado.getRuc());
            }

            resultado.setRuc(ruc);
            resultado.setSuccess(true);
            return resultado;
        } catch (HttpStatusCodeException e) {
            int statusCode = e.getStatusCode().value();
            log.warn("Error HTTP {} al consultar RUC {}: {}", statusCode, ruc, e.getResponseBodyAsString());
            if (statusCode == 401 || statusCode == 403) {
                throw new ConsultaProveedorException(502, "Servicio de validación no disponible temporalmente.");
            } else if (statusCode == 404) {
                throw new DocumentoNoEncontradoException("El RUC ingresado no fue encontrado en SUNAT.");
            } else if (statusCode == 429) {
                throw new ConsultaProveedorException(429, "Límite de consultas excedido en el proveedor de consultas.");
            } else if (statusCode >= 500) {
                throw new ConsultaProveedorException(500, "Error en el servidor de SUNAT.");
            } else {
                throw new ConsultaProveedorException(statusCode, "Error al consultar RUC (HTTP " + statusCode + ").");
            }
        } catch (ResourceAccessException e) {
            log.error("Timeout al consultar RUC {}", ruc);
            throw new ConsultaProveedorException(504, "Tiempo de espera agotado al conectar con SUNAT.");
        } catch (DocumentoNoEncontradoException | ConsultaProveedorException | IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error inesperado al consultar RUC {}: {}", ruc, e.getMessage());
            throw new ConsultaProveedorException(500, "Error interno al procesar la validación de RUC.");
        }
    }

    private DniConsultaResponseDTO consultarDniEnPadronAlternativo(String dni) {
        try {
            CookieManager cookieManager = new CookieManager();
            HttpClient client = HttpClient.newBuilder()
                    .cookieHandler(cookieManager)
                    .connectTimeout(Duration.ofSeconds(4))
                    .followRedirects(HttpClient.Redirect.NORMAL)
                    .build();

            HttpRequest getReq = HttpRequest.newBuilder()
                    .uri(URI.create("https://eldni.com/pe/buscar-datos-por-dni"))
                    .timeout(Duration.ofSeconds(4))
                    .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36")
                    .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
                    .GET()
                    .build();

            HttpResponse<String> getResp = client.send(getReq, HttpResponse.BodyHandlers.ofString());
            if (getResp.statusCode() != 200 || getResp.body() == null) {
                return null;
            }

            Matcher tokenMatcher = Pattern.compile("name=\"_token\"\\s+value=\"([^\"]+)\"").matcher(getResp.body());
            if (!tokenMatcher.find()) {
                return null;
            }
            String csrfToken = tokenMatcher.group(1);

            String formData = "_token=" + URLEncoder.encode(csrfToken, StandardCharsets.UTF_8)
                    + "&dni=" + URLEncoder.encode(dni, StandardCharsets.UTF_8);

            HttpRequest postReq = HttpRequest.newBuilder()
                    .uri(URI.create("https://eldni.com/pe/buscar-datos-por-dni"))
                    .timeout(Duration.ofSeconds(5))
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36")
                    .header("Referer", "https://eldni.com/pe/buscar-datos-por-dni")
                    .header("Origin", "https://eldni.com")
                    .POST(HttpRequest.BodyPublishers.ofString(formData))
                    .build();

            HttpResponse<String> postResp = client.send(postReq, HttpResponse.BodyHandlers.ofString());
            if (postResp.statusCode() != 200 || postResp.body() == null) {
                return null;
            }

            String body = postResp.body();
            Matcher nomMatcher = Pattern.compile("id=\"nombres\"\\s+value=\"([^\"]*)\"").matcher(body);
            Matcher patMatcher = Pattern.compile("id=\"apellidop\"\\s+value=\"([^\"]*)\"").matcher(body);
            Matcher matMatcher = Pattern.compile("id=\"apellidom\"\\s+value=\"([^\"]*)\"").matcher(body);
            Matcher compMatcher = Pattern.compile("id=\"completos\"\\s+value=\"([^\"]*)\"").matcher(body);

            String nombres = nomMatcher.find() ? nomMatcher.group(1).trim() : "";
            String apePaterno = patMatcher.find() ? patMatcher.group(1).trim() : "";
            String apeMaterno = matMatcher.find() ? matMatcher.group(1).trim() : "";
            String completos = compMatcher.find() ? compMatcher.group(1).trim() : "";

            if (nombres.isEmpty() && apePaterno.isEmpty()) {
                return null;
            }

            if (completos.isEmpty()) {
                completos = (nombres + " " + apePaterno + " " + apeMaterno).replaceAll("\\s+", " ").trim();
            }

            log.info("Padrón alternativo resolvió DNI {}: {}", dni, completos);

            return DniConsultaResponseDTO.builder()
                    .success(true)
                    .dni(dni)
                    .nombres(nombres)
                    .apellidoPaterno(apePaterno)
                    .apellidoMaterno(apeMaterno)
                    .nombreCompleto(completos)
                    .nombre(completos)
                    .numeroDocumento(dni)
                    .build();
        } catch (Exception e) {
            log.warn("Padrón alternativo no pudo resolver DNI {}: {}", dni, e.getMessage());
            return null;
        }
    }
}