import { ofertasApi, postulacionesApi } from '@/core/api';
import type { PageResponse } from '@/shared/types';
import type { OfertaResponse, EmpleoPublicoResponse, EstadoPostulacion, PostulacionResponse, RecomendacionEvaluacion } from '../types/job.types';

export const jobService = {
  // Obtener ofertas públicas internas de EmpleaPro (para CandidateSearchView y vistas internas)
  async getInternalPublicJobs(params?: Record<string, any>): Promise<PageResponse<OfertaResponse>> {
    const { data } = await ofertasApi.get<PageResponse<OfertaResponse>>('/ofertas', {
      params: { soloActivas: true, estado: 'PUBLICADA', ...params },
    });
    return data;
  },
    async getPublicJobs(params?: Record<string, any>): Promise<PageResponse<EmpleoPublicoResponse>> {
    const { data } = await ofertasApi.get<PageResponse<EmpleoPublicoResponse>>('/ofertas/publicas', {
      params,
    });
    return data;
  },

  // Admin: obtiene TODAS las ofertas (sin filtro de estado forzado)
  async getAllJobsAdmin(params?: Record<string, any>): Promise<PageResponse<OfertaResponse>> {
    const { data } = await ofertasApi.get<PageResponse<OfertaResponse>>('/ofertas', {
      params: { ...params },
    });
    return data;
  },

  async getJobById(id: string): Promise<OfertaResponse> {
    const { data } = await ofertasApi.get<OfertaResponse>(`/ofertas/${id}`);
    return data;
  },

  async getCompanyJobs(empresaId: string, params?: Record<string, any>): Promise<PageResponse<OfertaResponse>> {
    const { data } = await ofertasApi.get<PageResponse<OfertaResponse>>('/ofertas', {
      params: { empresaId, ...params },
    });
    return data;
  },

  async createJob(empresaId: string, payload: Record<string, any>): Promise<OfertaResponse> {
    const { data } = await ofertasApi.post<OfertaResponse>(`/ofertas?empresaId=${empresaId}`, payload);
    return data;
  },

  // Empresa: envia la oferta a revision del admin
  async submitForReview(id: string): Promise<OfertaResponse> {
    const { data } = await ofertasApi.patch<OfertaResponse>(`/ofertas/${id}/enviar-revision`);
    return data;
  },

  // Empresa: publica directamente la oferta
  async publishJob(id: string): Promise<OfertaResponse> {
    const { data } = await ofertasApi.patch<OfertaResponse>(`/ofertas/${id}/publicar`);
    return data;
  },

  // Admin: aprueba la oferta Ã¢â€ â€™ pasa a PUBLICADA
  async approveJob(id: string): Promise<OfertaResponse> {
    const { data } = await ofertasApi.patch<OfertaResponse>(`/ofertas/${id}/aprobar`);
    return data;
  },

  // Empresa: actualiza una oferta existente
  async updateJob(id: string, payload: Record<string, any>): Promise<OfertaResponse> {
    const { data } = await ofertasApi.put<OfertaResponse>(`/ofertas/${id}`, payload);
    return data;
  },

  // Empresa/Admin: cierra definitivamente la oferta
  async closeJob(id: string): Promise<OfertaResponse> {
    const { data } = await ofertasApi.patch<OfertaResponse>(`/ofertas/${id}/cerrar`);
    return data;
  },

  // Empresa/Admin: cancela la oferta
  async cancelJob(id: string): Promise<OfertaResponse> {
    const { data } = await ofertasApi.patch<OfertaResponse>(`/ofertas/${id}/cancelar`);
    return data;
  },

  // Admin: rechaza la oferta Ã¢â€ â€™ pasa a RECHAZADA
  async rejectJob(id: string, motivo?: string): Promise<OfertaResponse> {
    const { data } = await ofertasApi.patch<OfertaResponse>(`/ofertas/${id}/rechazar`, null, {
      params: motivo ? { motivo } : {},
    });
    return data;
  },

  async getCategories(): Promise<Array<{ id: string; nombre: string; descripcion?: string }>> {
    const { data } = await ofertasApi.get<any>('/categorias', { params: { size: 100 } });
    return data.content || data || [];
  },


  async generateCoverLetterWithAi(
    ofertaId: string, 
    estudianteId?: string
  ): Promise<{ success: boolean; carta?: string; message?: string }> {
    const { data } = await postulacionesApi.post<{ success: boolean; carta?: string; message?: string }>(
      '/postulaciones/ia/carta-presentacion',
      {
        ofertaId,
        estudianteId,
      }
    );
    return data;
  },

  async applyToJob(
    ofertaId: string, 
    empresaId: string, 
    payload: { 
      cartaPresentacion?: string; 
      cvUrl?: string;
      cvFile?: File;
      estudianteId?: string;
      generadaConIa?: boolean;
    } = {}
  ) {
    // Usar siempre FormData para compatibilidad total con multipart/form-data
    const formData = new FormData();
    formData.append('ofertaId', ofertaId);
    formData.append('empresaId', empresaId);
    if (payload.estudianteId) {
      formData.append('estudianteId', payload.estudianteId);
    }
    if (payload.cartaPresentacion) {
      formData.append('cartaPresentacion', payload.cartaPresentacion);
    }
    if (payload.generadaConIa !== undefined) {
      formData.append('generadaConIa', String(payload.generadaConIa));
    }
    if (payload.cvUrl) {
      formData.append('cvUrl', payload.cvUrl);
    }
    if (payload.cvFile) {
      formData.append('cvFile', payload.cvFile);
      formData.append('archivo', payload.cvFile);
    }
    
    // No especificamos Content-Type manual para que Axios genere el boundary correcto
    const { data } = await postulacionesApi.post('/postulaciones', formData);
    return data;
  },

  // Candidato: Obtiene mis postulaciones
  async getMyApplications(params?: {
    estado?: EstadoPostulacion;
    page?: number;
    size?: number;
  }): Promise<PageResponse<PostulacionResponse>> {
    const { data } = await postulacionesApi.get<PageResponse<PostulacionResponse>>('/postulaciones/mis-postulaciones', {
      params,
    });
    return data;
  },

  // Descargar CV de forma segura pasando el JWT y recibiendo un Blob
  async downloadCvBlob(uuid: string): Promise<Blob> {
    const { data } = await postulacionesApi.get(`/postulaciones/${uuid}/cv`, {
      responseType: 'blob',
    });
    return data;
  },

  // Empresa: Obtiene todas las postulaciones recibidas
  async getCompanyApplications(params?: {
    empresaId?: string;
    ofertaId?: string;
    estado?: EstadoPostulacion;
    page?: number;
    size?: number;
  }): Promise<PageResponse<PostulacionResponse>> {
    const { data } = await postulacionesApi.get<PageResponse<PostulacionResponse>>('/postulaciones/empresa', {
      params,
    });
    return data;
  },

  // Empresa/Admin: Actualiza el estado de la postulaciÃƒÂ³n
  async updateApplicationStatus(
    uuid: string,
    nuevoEstado: EstadoPostulacion,
    comentario?: string
  ): Promise<PostulacionResponse> {
    const { data } = await postulacionesApi.put<PostulacionResponse>(
      `/postulaciones/${uuid}/estado`,
      null,
      {
        params: {
          nuevoEstado,
          ...(comentario ? { comentario } : {}),
        },
      }
    );
    return data;
  },

  // Empresa: Elimina permanentemente una postulaciÃƒÂ³n
  async deleteApplication(uuid: string): Promise<void> {
    await postulacionesApi.delete(`/postulaciones/${uuid}`);
  },

  // === EVALUACIONES ===
  
  // Crear evaluacion para una postulacion
  async createEvaluation(
    postulacionId: string,
    payload: {
      puntaje: number;
      recomendacion: RecomendacionEvaluacion;
      comentario?: string;
      fortalezas?: string;
      debilidades?: string;
      tipo?: string;
      tituloPrueba?: string;
      estado?: string;
    }
  ): Promise<any> {
    const { data } = await postulacionesApi.post(
      `/postulaciones/${postulacionId}/evaluaciones`,
      payload
    );
    return data;
  },

  // Listar evaluaciones de una postulacion
  async getEvaluationsByApplication(
    postulacionId: string,
    params?: {
      page?: number;
      size?: number;
    }
  ): Promise<PageResponse<any>> {
    const { data } = await postulacionesApi.get(
      `/postulaciones/${postulacionId}/evaluaciones`,
      { params }
    );
    return data;
  },

  // Listar todas las evaluaciones de la empresa
  async getCompanyEvaluations(params?: {
    empresaId?: string;
    page?: number;
    size?: number;
  }): Promise<PageResponse<any>> {
    const { data } = await postulacionesApi.get('/evaluaciones/empresa', {
      params,
    });
    return data;
  },

  // Obtener una evaluacion especifica
  async getEvaluationById(evaluacionId: string): Promise<any> {
    const { data } = await postulacionesApi.get(`/evaluaciones/${evaluacionId}`);
    return data;
  },

  // Actualizar una evaluacion
  async updateEvaluation(
    evaluacionId: string,
    payload: {
      puntaje: number;
      recomendacion: RecomendacionEvaluacion;
      comentario?: string;
      fortalezas?: string;
      debilidades?: string;
      tipo?: string;
      tituloPrueba?: string;
      estado?: string;
    }
  ): Promise<any> {
    const { data } = await postulacionesApi.put(
      `/evaluaciones/${evaluacionId}`,
      payload
    );
    return data;
  },

  // Eliminar o cancelar evaluacion
  async deleteOrCancelEvaluation(evaluacionId: string): Promise<{ accion: string; mensaje: string; estado: string }> {
    const { data } = await postulacionesApi.delete(`/evaluaciones/${evaluacionId}`);
    return data;
  },

  // Candidato: obtener sus entrevistas programadas
  async getMyInterviews(params?: { page?: number; size?: number }): Promise<PageResponse<any>> {
    const { data } = await postulacionesApi.get('/entrevistas/mis-entrevistas', { params });
    return data;
  },

  // Empresa: Reanalizar CV con IA (Gemini o Contingencia)
  async reanalizarPostulacionIa(postulacionId: string): Promise<PostulacionResponse> {
    const { data } = await postulacionesApi.post<PostulacionResponse>(`/postulaciones/${postulacionId}/reanalizar-ia`);
    return data;
  },
};

