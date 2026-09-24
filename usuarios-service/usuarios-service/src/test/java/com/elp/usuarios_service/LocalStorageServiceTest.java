package com.elp.usuarios_service;

import com.elp.usuarios_service.service.LocalStorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.file.Path;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class LocalStorageServiceTest {

    private LocalStorageService storageService;

    @TempDir
    Path tempDir;

    @BeforeEach
    void setUp() {
        storageService = new LocalStorageService(tempDir.toString(), 5);
    }

    @Test
    void storeFile_PdfValido_GuardaExitosamente() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "mi_cv.pdf",
                "application/pdf",
                "dummy content".getBytes()
        );

        String storageKey = storageService.storeFile(file, UUID.randomUUID());

        assertNotNull(storageKey);
        assertTrue(storageKey.endsWith(".pdf"));
        assertTrue(tempDir.resolve(storageKey).toFile().exists());
    }

    @Test
    void storeFile_TipoInvalido_LanzaException() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "imagen.png",
                "image/png",
                "dummy content".getBytes()
        );

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                storageService.storeFile(file, UUID.randomUUID())
        );
        assertEquals("Solo se permiten archivos PDF.", ex.getMessage());
    }

    @Test
    void storeFile_TamanoExcedido_LanzaException() {
        // Mock a file larger than 5MB
        byte[] largeContent = new byte[6 * 1024 * 1024]; // 6MB
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "grande.pdf",
                "application/pdf",
                largeContent
        );

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                storageService.storeFile(file, UUID.randomUUID())
        );
        assertEquals("El archivo excede el tamao mǭximo permitido.", ex.getMessage());
    }

    @Test
    void storeFile_PathTraversal_LanzaException() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "../mi_cv.pdf",
                "application/pdf",
                "dummy content".getBytes()
        );

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                storageService.storeFile(file, UUID.randomUUID())
        );
        assertTrue(ex.getMessage().contains("path traversal"));
    }
}
