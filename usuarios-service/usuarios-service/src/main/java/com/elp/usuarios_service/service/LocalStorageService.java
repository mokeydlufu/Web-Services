package com.elp.usuarios_service.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class LocalStorageService implements StorageService {

    private final Path fileStorageLocation;
    private final long maxSizeInBytes;

    public LocalStorageService(
            @Value("${storage.local.base-path}") String basePath,
            @Value("${storage.cv.max-size-mb:5}") long maxSizeMb) {
        this.fileStorageLocation = Paths.get(basePath).toAbsolutePath().normalize();
        this.maxSizeInBytes = maxSizeMb * 1024 * 1024;

        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            throw new RuntimeException("Could not create the directory where the uploaded files will be stored.", ex);
        }
    }

    @Override
    public String storeFile(MultipartFile file, UUID usuarioId) {
        String originalFileName = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "");
        
        if (originalFileName.contains("..")) {
            throw new IllegalArgumentException("El nombre del archivo contiene una secuencia de ruta invǭlida (path traversal).");
        }
        
        if (file.getSize() > maxSizeInBytes) {
            throw new IllegalArgumentException("El archivo excede el tamao mǭximo permitido.");
        }
        
        String contentType = file.getContentType();
        if (contentType == null || !contentType.equals("application/pdf")) {
            throw new IllegalArgumentException("Solo se permiten archivos PDF.");
        }

        String extension = ".pdf";
        String storageKey = UUID.randomUUID().toString() + extension;

        try {
            Path targetLocation = this.fileStorageLocation.resolve(storageKey);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            return storageKey;
        } catch (IOException ex) {
            throw new RuntimeException("No se pudo almacenar el archivo. Intntelo nuevamente.", ex);
        }
    }

    @Override
    public String storeImage(MultipartFile file, UUID usuarioId) {
        String originalFileName = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "");
        
        if (originalFileName.contains("..")) {
            throw new IllegalArgumentException("Ruta inválida.");
        }
        if (file.getSize() > maxSizeInBytes) {
            throw new IllegalArgumentException("El archivo excede el tamaño máximo.");
        }
        
        String contentType = file.getContentType();
        if (contentType == null || (!contentType.equals("image/jpeg") && !contentType.equals("image/png") && !contentType.equals("image/webp"))) {
            throw new IllegalArgumentException("Solo se permiten imágenes (JPG, PNG, WEBP).");
        }

        String extension = "";
        int i = originalFileName.lastIndexOf('.');
        if (i > 0) {
            extension = originalFileName.substring(i);
        } else {
            if (contentType.equals("image/jpeg")) extension = ".jpg";
            else if (contentType.equals("image/png")) extension = ".png";
            else if (contentType.equals("image/webp")) extension = ".webp";
        }

        String storageKey = UUID.randomUUID().toString() + extension;

        try {
            Path targetLocation = this.fileStorageLocation.resolve(storageKey);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            return storageKey;
        } catch (IOException ex) {
            throw new RuntimeException("No se pudo almacenar la imagen.", ex);
        }
    }
}
