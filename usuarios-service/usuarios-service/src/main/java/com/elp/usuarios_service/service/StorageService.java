package com.elp.usuarios_service.service;

import org.springframework.web.multipart.MultipartFile;
import java.util.UUID;

public interface StorageService {
    String storeFile(MultipartFile file, UUID usuarioId);
    String storeImage(MultipartFile file, UUID usuarioId);
}
