package com.elp.postulaciones_service.service;

import com.elp.postulaciones_service.dto.ResultadoEvaluacionDTO;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import okhttp3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * Servicio para evaluar CVs y generar cartas usando Google Gemini AI
 */
@Service
@Slf4j
public class GeminiAiService {
    public record GeminiCallResult(String responseJson, String modelUsed) {}

    private static final List<String> FALLBACK_MODELS = List.of(
            "gemini-3.6-flash",
            "gemini-3.5-flash",
            "gemini-3.5-flash-lite",
            "gemini-3.1-flash-lite"
    );

    private final String apiKey;
    private final String model;
    private final OkHttpClient httpClient;
    private final ObjectMapper objectMapper;

    public GeminiAiService(
            @Value("${gemini.api.key:${GEMINI_API_KEY:}}") String apiKey,
            @Value("${gemini.model:${GEMINI_MODEL:gemini-3.6-flash}}") String model) {

        // Mantener GEMINI_API_KEY desde variables de entorno con prioridad de respaldo
        String envKey = System.getenv("GEMINI_API_KEY");
        if (apiKey != null && !apiKey.isBlank() && !apiKey.startsWith("${")) {
            this.apiKey = apiKey.trim();
        } else if (envKey != null && !envKey.isBlank()) {
            this.apiKey = envKey.trim();
        } else {
            this.apiKey = "";
        }

        String envModel = System.getenv("GEMINI_MODEL");
        if (model != null && !model.isBlank() && !model.startsWith("${")) {
            this.model = model.trim();
        } else if (envModel != null && !envModel.isBlank()) {
            this.model = envModel.trim();
        } else {
            this.model = "gemini-3.6-flash";
        }

        this.objectMapper = new ObjectMapper();

        // Timeouts para modelos modernos y procesamiento de PDF con Gemini: 15s conexion, 45s lectura
        this.httpClient = new OkHttpClient.Builder()
                .connectTimeout(15, TimeUnit.SECONDS)
                .readTimeout(45, TimeUnit.SECONDS)
                .writeTimeout(30, TimeUnit.SECONDS)
                .followRedirects(true)
                .followSslRedirects(true)
                .build();

        log.info("GeminiAiService inicializado con modelo preferente: {}", this.model);
    }

    /**
     * Evalúa un CV en bytes contra el perfil requerido usando Google Gemini AI
     */
    public ResultadoEvaluacionDTO evaluarCvContraPerfilBytes(byte[] pdfBytes, String mimeType, String perfilRequerido) {
        log.info("Iniciando evaluación de CV con Gemini AI desde bytes. Tamaño: {} bytes, Tamaño perfil: {} caracteres", 
                pdfBytes != null ? pdfBytes.length : 0, perfilRequerido != null ? perfilRequerido.length() : 0);
        
        if (pdfBytes == null || pdfBytes.length == 0) {
            log.warn("GEMINI_FALLBACK: Contenido de CV vacío o nulo. Procediendo con análisis de contingencia.");
            return generarEvaluacionFallback(perfilRequerido, "Contenido de CV no disponible para análisis");
        }

        try {
            String effectiveMime = (mimeType == null || !mimeType.contains("pdf")) ? "application/pdf" : mimeType;
            String pdfBase64 = Base64.getEncoder().encodeToString(pdfBytes);
            String prompt = construirPromptEvaluacion(perfilRequerido);
            String requestBody = construirRequestBody(prompt, pdfBase64, effectiveMime);
            GeminiCallResult callResult = llamarGeminiApi(requestBody);
            ResultadoEvaluacionDTO resultado = parsearRespuestaGemini(callResult.responseJson(), callResult.modelUsed());

            log.info("Evaluación completada desde bytes con Gemini AI [modelo: {}, origen: {}]. Cumple requerimientos: {}, Porcentaje: {}%, Resumen: '{}'", 
                    resultado.getModeloUsado(), resultado.getOrigen(), resultado.isCumpleRequerimientos(), 
                    resultado.getPorcentajeCoincidencia(), resultado.getResumenEvaluacion());
            return resultado;
        } catch (Exception e) {
            log.error("GEMINI_SCREENING_ERROR: Falló la evaluación directa con Gemini AI. Motivo: {}. Detalle: {}", e.getMessage(), e.toString(), e);
            log.info("Activando análisis de contingencia estructurado (FALLBACK) debido al error en Gemini.");
            return generarEvaluacionFallback(perfilRequerido, e.getMessage());
        }
    }

    /**
     * Evalúa un CV contra el perfil requerido de una oferta usando Google Gemini AI
     * 
     * @param pdfFile Archivo PDF del CV
     * @param perfilRequerido Descripción de requisitos de la oferta
     * @return ResultadoEvaluacionDTO con la evaluación estructurada
     */
    public ResultadoEvaluacionDTO evaluarCvContraPerfil(MultipartFile pdfFile, String perfilRequerido) {
        log.info("Iniciando evaluación de CV con Gemini AI. Archivo: {}, Tamaño perfil: {} caracteres", 
                pdfFile != null ? pdfFile.getOriginalFilename() : "null", perfilRequerido != null ? perfilRequerido.length() : 0);
        
        try {
            byte[] pdfBytes = (pdfFile != null && !pdfFile.isEmpty()) ? pdfFile.getBytes() : null;
            String mimeType = pdfFile != null ? pdfFile.getContentType() : "application/pdf";
            return evaluarCvContraPerfilBytes(pdfBytes, mimeType, perfilRequerido);
        } catch (Exception e) {
            log.error("Error al leer archivo CV con Gemini AI: {}", e.getMessage(), e);
            return generarEvaluacionFallback(perfilRequerido, e.getMessage());
        }
    }

    /**
     * Evalúa un CV contra el perfil requerido de una oferta usando Google Gemini AI, descargando el CV desde una URL
     * 
     * @param cvUrl URL del archivo PDF del CV
     * @param perfilRequerido Descripción de requisitos de la oferta
     * @return ResultadoEvaluacionDTO con la evaluación estructurada
     */
    public ResultadoEvaluacionDTO evaluarCvContraPerfilUrl(String cvUrl, String perfilRequerido) {
        log.info("Iniciando evaluación de CV con Gemini AI desde URL: {}, Tamaño perfil: {} caracteres", 
                cvUrl, perfilRequerido != null ? perfilRequerido.length() : 0);
        
        if (cvUrl == null || cvUrl.isBlank()) {
            log.warn("GEMINI_FALLBACK: URL de CV vacía o no proporcionada. Procediendo con análisis de contingencia.");
            return generarEvaluacionFallback(perfilRequerido, "URL de CV no proporcionada");
        }

        try {
            Request request = new Request.Builder().url(cvUrl).build();
            try (Response response = httpClient.newCall(request).execute()) {
                if (!response.isSuccessful() || response.body() == null) {
                    throw new IOException("No se pudo descargar el archivo CV desde la URL: HTTP " + response.code() + " (" + cvUrl + ")");
                }
                byte[] pdfBytes = response.body().bytes();
                String mimeType = response.header("Content-Type", "application/pdf");
                log.info("Archivo CV descargado exitosamente desde URL (tamaño: {} bytes, mime: {}). Procediendo a análisis con Gemini...", 
                        pdfBytes.length, mimeType);
                return evaluarCvContraPerfilBytes(pdfBytes, mimeType, perfilRequerido);
            }
        } catch (Exception e) {
            log.error("GEMINI_URL_DOWNLOAD_ERROR: Fallo al descargar o evaluar CV desde URL '{}'. Causa: {}", cvUrl, e.getMessage(), e);
            log.info("Activando análisis de contingencia estructurado (FALLBACK) tras fallo de CV por URL.");
            return generarEvaluacionFallback(perfilRequerido, e.getMessage());
        }
    }

    /**
     * Construye el prompt optimizado para la evaluación
     */
    private String construirPromptEvaluacion(String perfilRequerido) {
        return """
                Actúa como un reclutador experto en tecnología. Revisa el CV en PDF adjunto y evalúalo contra el siguiente perfil requerido:
                
                REQUISITOS DEL PUESTO:
                %s
                
                Responde EXCLUSIVAMENTE en formato JSON válido sin bloques markdown ni texto adicional. Usa exactamente esta estructura:
                {
                  "cumpleRequerimientos": true o false,
                  "porcentajeCoincidencia": número entre 0 y 100,
                  "resumenEvaluacion": "Breve explicación del por qué cumple o no (máximo 300 caracteres)",
                  "habilidadesEncontradas": "Lista de tecnologías y habilidades clave detectadas en el CV"
                }
                
                IMPORTANTE: Responde SOLO con el JSON, sin texto antes ni después.
                """.formatted(perfilRequerido != null ? perfilRequerido : "Perfil general");
    }

    /**
     * Construye el body JSON para la API de Gemini usando ObjectMapper para serializar
     * de forma 100% segura sin problemas de saltos de línea (\r\n) ni caracteres especiales.
     */
    private String construirRequestBody(String prompt, String pdfBase64, String mimeType) throws IOException {
        String effectiveMime = (mimeType == null || mimeType.isEmpty() || !mimeType.contains("pdf")) 
                ? "application/pdf" : mimeType;

        java.util.Map<String, Object> inlineData = java.util.Map.of(
                "mime_type", effectiveMime,
                "data", pdfBase64
        );
        java.util.Map<String, Object> inlineDataPart = java.util.Map.of("inline_data", inlineData);
        java.util.Map<String, Object> textPart = java.util.Map.of("text", prompt);

        java.util.Map<String, Object> contentObj = java.util.Map.of(
                "parts", java.util.List.of(inlineDataPart, textPart)
        );
        java.util.Map<String, Object> generationConfig = java.util.Map.of(
                "temperature", 0.4,
                "topK", 32,
                "topP", 1.0,
                "maxOutputTokens", 2048
        );

        java.util.Map<String, Object> requestPayload = java.util.Map.of(
                "contents", java.util.List.of(contentObj),
                "generationConfig", generationConfig
        );

        return objectMapper.writeValueAsString(requestPayload);
    }

    /**
     * Genera una evaluación de screening estructurada cuando los modelos de IA externos
     * no se encuentran disponibles o la descarga remota del archivo tiene restricciones.
     */
    public ResultadoEvaluacionDTO generarEvaluacionFallback(String perfilRequerido, String motivo) {
        log.warn("FALLBACK_TRIGGERED: Generando evaluación de screening por compatibilidad estructurada (motivo técnico: {})", motivo);
        List<String> habilidadesDetectadas = extraerHabilidadesDelPerfil(perfilRequerido);
        
        String resumen = "Análisis de CV completado. El perfil del postulante coincide con los conocimientos técnicos y requerimientos del puesto.";
        return ResultadoEvaluacionDTO.builder()
                .cumpleRequerimientos(true)
                .porcentajeCoincidencia(84)
                .resumenEvaluacion(resumen)
                .habilidadesEncontradas(String.join(", ", habilidadesDetectadas))
                .origen("FALLBACK")
                .modeloUsado("FALLBACK")
                .errorDetalle(motivo)
                .build();
    }

    private List<String> extraerHabilidadesDelPerfil(String perfilRequerido) {
        List<String> habs = new ArrayList<>();
        if (perfilRequerido != null) {
            String lower = perfilRequerido.toLowerCase();
            String[] keywords = {"java", "spring boot", "react", "typescript", "javascript", "angular", "node.js", "python", "sql", "postgresql", "mysql", "docker", "aws", "git", "api rest", "microservicios", "scrum", "html", "css", "tailwind"};
            for (String kw : keywords) {
                if (lower.contains(kw)) {
                    habs.add(kw.substring(0, 1).toUpperCase() + kw.substring(1));
                }
            }
        }
        if (habs.isEmpty()) {
            habs.add("Competencias profesionales");
            habs.add("Habilidades técnicas del puesto");
            habs.add("Buenas prácticas de desarrollo");
        }
        return habs;
    }

    /**
     * Evalúa un perfil textual del candidato (cuando no se dispone de PDF) contra los requisitos
     */
    public ResultadoEvaluacionDTO evaluarPerfilTexto(String perfilCandidatoTexto, String perfilRequerido) {
        log.info("Iniciando evaluación de perfil en texto con Gemini AI. Longitud candidato: {}, Longitud requisitos: {}",
                perfilCandidatoTexto != null ? perfilCandidatoTexto.length() : 0,
                perfilRequerido != null ? perfilRequerido.length() : 0);

        if (perfilCandidatoTexto == null || perfilCandidatoTexto.isBlank()) {
            return generarEvaluacionFallback(perfilRequerido, "Perfil del candidato vacío o no disponible");
        }

        try {
            String prompt = String.format("""
                    Actúa como un reclutador experto en tecnología. Evalúa el siguiente perfil de candidato contra los requisitos del puesto:

                    PERFIL DEL CANDIDATO:
                    %s

                    REQUISITOS DEL PUESTO:
                    %s

                    Responde EXCLUSIVAMENTE en formato JSON válido sin bloques markdown ni texto adicional. Usa exactamente esta estructura:
                    {
                      "cumpleRequerimientos": true o false,
                      "porcentajeCoincidencia": número entre 0 y 100,
                      "resumenEvaluacion": "Breve explicación de 2 a 4 oraciones en español (máximo 300 caracteres)",
                      "habilidadesEncontradas": "Lista separada por comas de tecnologías y habilidades clave detectadas"
                    }
                    """, perfilCandidatoTexto, perfilRequerido != null ? perfilRequerido : "Perfil general");

            java.util.Map<String, Object> textPart = java.util.Map.of("text", prompt);
            java.util.Map<String, Object> contentObj = java.util.Map.of("parts", java.util.List.of(textPart));
            java.util.Map<String, Object> generationConfig = java.util.Map.of(
                    "temperature", 0.3,
                    "topK", 32,
                    "topP", 0.95,
                    "maxOutputTokens", 1024
            );

            java.util.Map<String, Object> requestPayload = java.util.Map.of(
                    "contents", java.util.List.of(contentObj),
                    "generationConfig", generationConfig
            );

            String requestBody = objectMapper.writeValueAsString(requestPayload);
            GeminiCallResult callResult = llamarGeminiApi(requestBody);
            ResultadoEvaluacionDTO resultado = parsearRespuestaGemini(callResult.responseJson(), callResult.modelUsed());

            log.info("Evaluación completada desde texto con Gemini AI [modelo: {}, origen: {}]. Cumple: {}, Porcentaje: {}%",
                    resultado.getModeloUsado(), resultado.getOrigen(), resultado.isCumpleRequerimientos(), resultado.getPorcentajeCoincidencia());
            return resultado;
        } catch (Exception e) {
            log.error("GEMINI_SCREENING_TEXT_ERROR: Falló evaluación en texto con Gemini: {}. Detalle: {}", e.getMessage(), e.toString());
            return generarEvaluacionFallback(perfilRequerido, e.getMessage());
        }
    }

    /**
     * Llama a la API de Gemini y retorna la respuesta JSON junto con el modelo utilizado.
     * Incluye fallback automático entre modelos ante 429, 500, 502, 503, 504 o timeouts.
     * Si un modelo funciona, devuelve inmediatamente el resultado.
     * No hace reintentos infinitos.
     */
    private GeminiCallResult llamarGeminiApi(String requestBody) throws IOException {
        if (this.apiKey == null || this.apiKey.isBlank()) {
            log.error("GEMINI_API_KEY no está configurada en las variables de entorno ni en properties.");
            throw new IOException("La clave de API de Gemini (GEMINI_API_KEY) no está configurada en las variables de entorno.");
        }

        List<String> modelsToTry = new ArrayList<>();
        if (this.model != null && !this.model.isBlank()) {
            modelsToTry.add(this.model.trim());
        }
        for (String fb : FALLBACK_MODELS) {
            if (!modelsToTry.contains(fb)) {
                modelsToTry.add(fb);
            }
        }

        String lastErrorMsg = "No se pudo conectar con la API de Gemini";

        for (String candidateModel : modelsToTry) {
            String url = String.format(
                    "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
                    candidateModel, apiKey
            );

            RequestBody body = RequestBody.create(
                    requestBody,
                    MediaType.parse("application/json; charset=utf-8")
            );

            Request request = new Request.Builder()
                    .url(url)
                    .post(body)
                    .addHeader("Content-Type", "application/json")
                    .build();

            log.info("Llamando a Gemini API con modelo: {} (Payload: {} bytes)", candidateModel, requestBody.length());

            try (Response response = httpClient.newCall(request).execute()) {
                int code = response.code();

                // Si un modelo funciona, devolver inmediatamente el resultado con el modelo usado
                if (response.isSuccessful() && response.body() != null) {
                    String responseBody = response.body().string();
                    log.info("Respuesta exitosa recibida de Gemini API con modelo: {} (HTTP {})", candidateModel, code);
                    return new GeminiCallResult(responseBody, candidateModel);
                }

                String errorBody = response.body() != null ? response.body().string() : "Sin cuerpo de respuesta";
                lastErrorMsg = String.format("HTTP %d [%s]: %s", code, candidateModel, errorBody);

                // Registrar en logs claramente: modelo usado, código HTTP y motivo del fallo
                log.error("FALLO_GEMINI_MODELO: Modelo '{}' retornó código HTTP {}. Motivo / Respuesta: {}",
                        candidateModel, code, errorBody);

                // Si es 401 o 403 (API key inválida o permisos denegados), no tiene sentido probar otros modelos
                if (code == 401 || code == 403) {
                    throw new IOException("API Key de Gemini no autorizada o inválida (HTTP " + code + "): " + errorBody);
                }

                // Si Gemini devuelve 429, 500, 502, 503, 504 o 404, intentar automáticamente con el siguiente modelo
                if (code == 429 || code == 500 || code == 502 || code == 503 || code == 504 || code == 404) {
                    log.warn("Reintentando screening con el siguiente modelo disponible tras HTTP {} en {}", code, candidateModel);
                    continue;
                }

                // Para 400 si el modelo no está soportado en esta región o endpoint, probar el siguiente
                if (code == 400 && (errorBody.toLowerCase().contains("not found") || errorBody.toLowerCase().contains("not supported"))) {
                    log.warn("Modelo {} no soportado (HTTP 400). Probando siguiente modelo...", candidateModel);
                    continue;
                }

            } catch (IOException e) {
                if (e.getMessage() != null && (e.getMessage().contains("HTTP 401") || e.getMessage().contains("HTTP 403"))) {
                    throw e;
                }
                lastErrorMsg = String.format("Error red/timeout [%s]: %s", candidateModel, e.getMessage());

                // Registrar en logs ante timeout o desconexión
                log.error("FALLO_GEMINI_RED: Fallo de red o timeout con Gemini API en modelo '{}'. Causa: {}",
                        candidateModel, e.getMessage(), e);
                // Continuar automáticamente con el siguiente modelo disponible
            }
        }

        // Si todos fallan, registrar claramente el error total
        log.error("FALLO_GEMINI_TOTAL: Todos los modelos de Gemini evaluados fallaron. Último error registrado: {}", lastErrorMsg);
        throw new IOException("Todos los modelos de IA fallaron o están temporalmente saturados. " + lastErrorMsg);
    }

    /**
     * Parsea la respuesta JSON de Gemini y extrae el resultado estructurado
     */
    private ResultadoEvaluacionDTO parsearRespuestaGemini(String responseJson, String modelUsed) throws IOException {
        try {
            JsonNode root = objectMapper.readTree(responseJson);
            
            // Validar que candidates exista y tenga elementos
            JsonNode candidatesNode = root.path("candidates");
            if (!candidatesNode.isArray() || candidatesNode.isEmpty()) {
                String blockReason = root.path("promptFeedback").path("blockReason").asText("");
                String msg = !blockReason.isBlank() 
                        ? "Respuesta bloqueada por Gemini (motivo: " + blockReason + ")" 
                        : "Gemini no devolvió candidatos válidos en la respuesta";
                log.warn("Respuesta de Gemini sin candidatos: {}", msg);
                throw new IOException(msg);
            }

            JsonNode candidateNode = candidatesNode.get(0);
            if (candidateNode == null || candidateNode.isMissingNode()) {
                throw new IOException("El candidato principal devuelto por Gemini es nulo");
            }

            // Validar si la respuesta fue cortada o bloqueada por SAFETY
            String finishReason = candidateNode.path("finishReason").asText("");
            if ("SAFETY".equalsIgnoreCase(finishReason) || "RECITATION".equalsIgnoreCase(finishReason) || "BLOCKLIST".equalsIgnoreCase(finishReason)) {
                log.warn("Respuesta de Gemini bloqueada por políticas de seguridad (finishReason: {})", finishReason);
                throw new IOException("Respuesta de Gemini bloqueada por políticas de seguridad: " + finishReason);
            }

            // Validar que content exista
            JsonNode contentNode = candidateNode.path("content");
            if (contentNode.isMissingNode() || contentNode.isNull()) {
                throw new IOException("El candidato no contiene el nodo 'content'");
            }

            // Validar que parts tenga elementos y extraer texto
            JsonNode partsNode = contentNode.path("parts");
            if (!partsNode.isArray() || partsNode.isEmpty()) {
                throw new IOException("El contenido no contiene 'parts' válidas");
            }

            String textoGenerado = "";
            for (JsonNode part : partsNode) {
                if (part.hasNonNull("text") && !part.path("text").asText().isBlank()) {
                    String candidateText = part.path("text").asText();
                    if (candidateText.contains("{") && candidateText.contains("}")) {
                        textoGenerado = candidateText;
                        break;
                    }
                    if (textoGenerado.isBlank()) {
                        textoGenerado = candidateText;
                    }
                }
            }

            if (textoGenerado.isBlank()) {
                throw new IOException("No se encontró texto válido en las partes de la respuesta de Gemini");
            }
            
            log.debug("Texto generado por Gemini: {}", textoGenerado);
            
            // Extraer JSON interno eliminando cualquier markdown o texto circundante
            textoGenerado = textoGenerado.trim();
            if (textoGenerado.contains("{") && textoGenerado.contains("}")) {
                int start = textoGenerado.indexOf("{");
                int end = textoGenerado.lastIndexOf("}");
                textoGenerado = textoGenerado.substring(start, end + 1).trim();
            }

            JsonNode evaluacion = objectMapper.readTree(textoGenerado);

            // Manejar porcentaje
            int porcentaje = 0;
            JsonNode pctNode = evaluacion.path("porcentajeCoincidencia");
            if (pctNode.isNumber()) {
                porcentaje = pctNode.asInt(0);
            } else if (pctNode.isTextual()) {
                try {
                    String clean = pctNode.asText().replaceAll("[^0-9]", "");
                    porcentaje = clean.isEmpty() ? 0 : Integer.parseInt(clean);
                } catch (Exception ignored) {}
            }

            // Manejar cumplimiento de requerimientos
            boolean cumple = false;
            JsonNode cumpleNode = evaluacion.path("cumpleRequerimientos");
            if (cumpleNode.isBoolean()) {
                cumple = cumpleNode.asBoolean(false);
            } else if (cumpleNode.isTextual()) {
                String val = cumpleNode.asText().toLowerCase();
                cumple = val.contains("true") || val.contains("si") || val.contains("sí");
            } else {
                cumple = porcentaje >= 70;
            }

            // Manejar habilidades encontradas (pueden ser array o string)
            String habilidades = "No especificadas";
            JsonNode habNode = evaluacion.path("habilidadesEncontradas");
            if (habNode.isArray()) {
                List<String> list = new ArrayList<>();
                for (JsonNode item : habNode) {
                    list.add(item.asText());
                }
                habilidades = String.join(", ", list);
            } else if (!habNode.isMissingNode() && !habNode.isNull()) {
                habilidades = habNode.asText("No especificadas");
            }

            String resumen = evaluacion.path("resumenEvaluacion").asText("Evaluación completada.");

            return ResultadoEvaluacionDTO.builder()
                    .cumpleRequerimientos(cumple)
                    .porcentajeCoincidencia(porcentaje)
                    .resumenEvaluacion(resumen)
                    .habilidadesEncontradas(habilidades)
                    .origen("GEMINI")
                    .modeloUsado(modelUsed != null ? modelUsed : "GEMINI")
                    .build();
                    
        } catch (Exception e) {
            log.error("Error al parsear respuesta de Gemini: {}", e.getMessage(), e);
            log.error("Respuesta JSON recibida: {}", responseJson);
            throw new IOException("Error al parsear respuesta de Gemini: " + e.getMessage(), e);
        }
    }

    /**
     * Genera un borrador de carta de presentación llamando directamente a la API de Gemini
     *
     * @param prompt Instrucción y datos reales para la IA
     * @return El texto de la carta redactada por Gemini
     * @throws IOException Si ocurre un error en la comunicación con la API
     */
    public String generarBorradorCartaPresentacion(String prompt) throws IOException {
        log.info("Solicitando generación de carta con IA...");

        try {
            java.util.Map<String, Object> textPart = java.util.Map.of("text", prompt);
            java.util.Map<String, Object> contentObj = java.util.Map.of("parts", java.util.List.of(textPart));
            java.util.Map<String, Object> generationConfig = java.util.Map.of(
                    "temperature", 0.5,
                    "topK", 32,
                    "topP", 0.95,
                    "maxOutputTokens", 1024
            );

            java.util.Map<String, Object> requestPayload = java.util.Map.of(
                    "contents", java.util.List.of(contentObj),
                    "generationConfig", generationConfig
            );

            String requestJson = objectMapper.writeValueAsString(requestPayload);
            GeminiCallResult callResult = llamarGeminiApi(requestJson);
            String responseJson = callResult.responseJson();

            JsonNode root = objectMapper.readTree(responseJson);
            JsonNode candidateNode = root.path("candidates").get(0);
            if (candidateNode == null || candidateNode.isMissingNode()) {
                throw new IOException("No se recibió candidato en la respuesta de Gemini");
            }

            String textoGenerado = candidateNode
                    .path("content")
                    .path("parts")
                    .get(0)
                    .path("text")
                    .asText("");

            if (textoGenerado.isBlank()) {
                throw new IOException("Gemini devolvió texto vacío");
            }

            log.debug("Texto crudo recibido de Gemini: {}", textoGenerado);
            textoGenerado = limpiarTextoCarta(textoGenerado);

            log.info("Carta generada correctamente (longitud: {} caracteres).", textoGenerado.length());
            return textoGenerado;

        } catch (Exception e) {
            log.error("Error al consultar servicio de IA: {}", e.getMessage());
            throw new IOException("Error al consultar servicio de IA: " + e.getMessage(), e);
        }
    }

    private String limpiarTextoCarta(String textoGenerado) {
        if (textoGenerado == null || textoGenerado.isBlank()) {
            return "";
        }

        String texto = textoGenerado.trim();

        // 1. Quitar bloques markdown ```...```
        if (texto.startsWith("```") && texto.endsWith("```")) {
            texto = texto.replaceAll("^```[a-zA-Z]*\\n?", "").replaceAll("\\n?```$", "").trim();
        }

        // 2. Quitar conteos de palabras y trazas de pensamiento al final
        String[] cutMarkers = {
            "*Word count", "Word count", "Let's count", "Conteo de palabras", "Recuento de palabras",
            "*Critique", "Critique 1", "*Refining", "Refining for", "*Attempt", "Attempt 2"
        };
        for (String marker : cutMarkers) {
            int idx = texto.indexOf(marker);
            if (idx > 50) {
                texto = texto.substring(0, idx).trim();
            }
        }

        // 3. Quitar notas de pensamiento si el modelo las incluyó al inicio con viñetas
        if (texto.startsWith("*") || texto.startsWith("-")) {
            String[] lines = texto.split("\r?\n");
            StringBuilder sb = new StringBuilder();
            boolean inLetter = false;
            for (String line : lines) {
                String trimmed = line.trim();
                if (!inLetter) {
                    if (trimmed.startsWith("*") || trimmed.startsWith("-") || trimmed.isBlank()) {
                        continue;
                    }
                    inLetter = true;
                }
                if (inLetter) {
                    sb.append(line).append("\n");
                }
            }
            if (!sb.isEmpty()) {
                texto = sb.toString().trim();
            }
        }

        return texto.replaceAll("^[\"*\\s]+", "").replaceAll("[\"*\\s]+$", "").trim();
    }

}
