package com.elp.postulaciones_service.service;

import com.elp.postulaciones_service.dto.postulacion.PostulacionRequest;
import com.elp.postulaciones_service.dto.postulacion.PostulacionResponse;
import com.elp.postulaciones_service.model.enums.EstadoPostulacion;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import com.elp.postulaciones_service.dto.ia.GenerarCartaIaRequest;
import com.elp.postulaciones_service.dto.ia.GenerarCartaIaResponse;
import java.util.UUID;

public interface PostulacionService {
    PostulacionResponse crearPostulacion(UUID candidatoId, PostulacionRequest request, MultipartFile cvFile);
    PostulacionResponse obtenerPostulacion(UUID uuid, UUID usuarioLogueadoId, String rolUsuario);
    PostulacionResponse cambiarEstado(UUID uuid, EstadoPostulacion nuevoEstado, UUID usuarioLogueadoId, String comentario);
    PostulacionResponse retirarPostulacion(UUID uuid, UUID candidatoId, String motivo);
    Page<PostulacionResponse> listarMisPostulaciones(UUID candidatoId, EstadoPostulacion estado, Pageable pageable);
    Page<PostulacionResponse> listarPostulacionesPorOferta(UUID ofertaId, UUID empresaIdLogueada, EstadoPostulacion estado, Pageable pageable);
    Page<PostulacionResponse> listarPostulacionesPorEmpresa(UUID empresaIdLogueada, UUID ofertaId, EstadoPostulacion estado, Pageable pageable);
    byte[] descargarCv(UUID uuid);
    byte[] descargarCv(UUID uuid, UUID usuarioLogueadoId, String rolUsuario);
    void eliminarPostulacion(UUID uuid, UUID empresaId);
    GenerarCartaIaResponse generarBorradorCarta(GenerarCartaIaRequest request, UUID candidatoId);
    PostulacionResponse reanalizarPostulacionIa(UUID uuid, UUID usuarioLogueadoId, String rolUsuario);
}