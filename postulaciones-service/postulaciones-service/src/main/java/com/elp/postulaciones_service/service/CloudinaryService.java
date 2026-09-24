package com.elp.postulaciones_service.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

/**
 * Servicio para gestionar la carga de archivos CV a Cloudinary
 */
@Service
@Slf4j
public class CloudinaryService {

    private final Cloudinary cloudinary;

    public CloudinaryService(
            @Value("${cloudinary.cloud-name}") String cloudName,
            @Value("${cloudinary.api-key}") String apiKey,
            @Value("${cloudinary.api-secret}") String apiSecret) {
        
        log.info("Inicializando Cloudinary con cloud-name: {}", cloudName);
        
        this.cloudinary = new Cloudinary(ObjectUtils.asMap(
                "cloud_name", cloudName,
                "api_key", apiKey,
                "api_secret", apiSecret,
                "secure", true
        ));
    }

    /**
     * Sube un archivo CV a Cloudinary y retorna la URL pública segura
     * 
     * @param file Archivo CV a subir (PDF, DOC, DOCX)
     * @return URL pública segura del archivo subido
     * @throws IOException Si hay error en la subida del archivo
     */
    public String subirCv(MultipartFile file) throws IOException {
        log.info("Iniciando subida de CV a Cloudinary. Archivo: {}, Tamaño: {} bytes", 
                file.getOriginalFilename(), file.getSize());
        
        try {
            // Validar tipo de archivo
            String contentType = file.getContentType();
            if (contentType == null || !isValidCvFile(contentType)) {
                throw new IllegalArgumentException(
                    "Tipo de archivo no válido. Solo se permiten PDF, DOC y DOCX. Recibido: " + contentType
                );
            }
            
            // Preparar nombre identificador limpio
            String originalFilename = file.getOriginalFilename();
            String baseName = "cv";
            if (originalFilename != null && !originalFilename.isBlank()) {
                int lastDot = originalFilename.lastIndexOf(".");
                baseName = (lastDot > 0) ? originalFilename.substring(0, lastDot) : originalFilename;
            }
            String cleanBaseName = baseName.replaceAll("[^a-zA-Z0-9_-]", "_");
            String publicId = cleanBaseName + "_" + java.util.UUID.randomUUID().toString().substring(0, 8);

            // Subir archivo a Cloudinary en la carpeta 'cvs_postulaciones'
            Map<?, ?> uploadResult = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "resource_type", "raw",
                            "folder", "cvs_postulaciones",
                            "public_id", publicId
                    )
            );
            
            String secureUrl = uploadResult.get("secure_url").toString();
            log.info("CV subido exitosamente a Cloudinary. URL: {}", secureUrl);
            
            return secureUrl;
            
        } catch (IOException e) {
            log.error("Error al subir CV a Cloudinary: {}", e.getMessage(), e);
            throw new IOException("Error al subir el CV a la nube: " + e.getMessage(), e);
        }
    }

    /**
     * Valida si el tipo de archivo es válido para un CV
     * 
     * @param contentType Tipo MIME del archivo
     * @return true si es un tipo válido (PDF, DOC, DOCX)
     */
    private boolean isValidCvFile(String contentType) {
        return contentType.equals("application/pdf") ||
               contentType.equals("application/msword") ||
               contentType.equals("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    }

    /**
     * Elimina un archivo de Cloudinary usando su public_id
     * 
     * @param publicId ID público del archivo en Cloudinary
     * @throws IOException Si hay error al eliminar
     */
    public void eliminarCv(String publicId) throws IOException {
        try {
            log.info("Eliminando CV de Cloudinary con public_id: {}", publicId);
            cloudinary.uploader().destroy(publicId, ObjectUtils.asMap("resource_type", "raw"));
            log.info("CV eliminado exitosamente de Cloudinary");
        } catch (IOException e) {
            log.error("Error al eliminar CV de Cloudinary: {}", e.getMessage(), e);
            throw new IOException("Error al eliminar el CV de la nube: " + e.getMessage(), e);
        }
    }
}
