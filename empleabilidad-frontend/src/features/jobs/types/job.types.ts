export type NivelExperiencia = 'PRACTICANTE' | 'JUNIOR' | 'SEMI_SENIOR' | 'SENIOR' | 'EXPERTO';
export type TipoContrato = 'TIEMPO_COMPLETO' | 'MEDIO_TIEMPO' | 'POR_PROYECTO' | 'TEMPORAL' | 'PRACTICAS' | 'FREELANCE';
export type Modalidad = 'PRESENCIAL' | 'REMOTO' | 'HIBRIDO';
export type Jornada = 'DIURNA' | 'NOCTURNA' | 'MIXTA' | 'POR_TURNOS' | 'FLEXIBLE';
export type EstadoOferta = 'BORRADOR' | 'PENDIENTE_APROBACION' | 'RECHAZADA' | 'PUBLICADA' | 'PAUSADA' | 'CERRADA' | 'VENCIDA' | 'CANCELADA';

export interface RequisitoOfertaResponse {
  id?: string;
  descripcion: string;
  tipo?: string;
  obligatorio?: boolean;
  nivel?: string;
  // Alias de compatibilidad temporal
  requisito?: string;
  nivelRequerido?: string;
  esObligatorio?: boolean;
  ofertaId?: string;
}

export interface OfertaResponse {
  id: string;
  empresaId: string;
  reclutadorId: string;
  titulo: string;
  descripcion: string;
  categoriaId: string;
  areaProfesional: string;
  nivelExperiencia: NivelExperiencia;
  tipoContrato: TipoContrato;
  modalidad: Modalidad;
  jornada: Jornada;
  salarioMinimo?: number;
  salarioMaximo?: number;
  moneda?: string;
  ubicacion?: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  pais?: string;
  fechaPublicacion?: string;
  fechaVencimiento?: string;
  estado: EstadoOferta;
  aceptaPostulaciones: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
  fechaCierre?: string;
  numeroVistas: number;
  numeroPostulaciones: number;
  requisitos: RequisitoOfertaResponse[];
}

export type EstadoPostulacion = 
  | 'ENVIADA' 
  | 'RECIBIDA' 
  | 'EN_REVISION' 
  | 'PRESELECCIONADA' 
  | 'ENTREVISTA' 
  | 'EVALUACION' 
  | 'SELECCIONADA' 
  | 'RECHAZADA' 
  | 'RETIRADA' 
  | 'CANCELADA' 
  | 'CERRADA';

export interface PostulacionResponse {
  id: string;
  uuid: string;
  ofertaId: string;
  candidatoId: string;
  empresaId: string;
  cartaPresentacion?: string;
  generadaConIa?: boolean;
  cvUrl?: string;
  estado: EstadoPostulacion;
  fechaPostulacion: string;
  fechaActualizacion?: string;
  candidatoNombre?: string;
  candidatoEmail?: string;
  candidatoFoto?: string;
  ofertaTitulo?: string;
  empresaNombre?: string;

  // Campos de evaluación con IA
  cumpleRequerimientos?: boolean;
  porcentajeCoincidencia?: number;
  resumenIa?: string;
  habilidadesEncontradas?: string;
  origenAnalisis?: 'GEMINI' | 'FALLBACK';
}

// Tipos para Evaluaciones
export type RecomendacionEvaluacion = 'RECOMENDADO' | 'ACEPTABLE' | 'NO_RECOMENDADO' | 'PENDIENTE';

export interface EvaluacionRequest {
  puntaje: number;
  recomendacion: RecomendacionEvaluacion;
  comentario?: string;
  fortalezas?: string;
  debilidades?: string;
}

export interface EvaluacionResponse {
  id: string;
  uuid: string;
  postulacionId: string;
  evaluadorId: string;
  evaluadorNombre?: string;
  puntaje: number;
  recomendacion: RecomendacionEvaluacion;
  comentario?: string;
  fortalezas?: string;
  debilidades?: string;
  fechaEvaluacion: string;
  fechaActualizacion?: string;
}


export interface EmpleoPublicoResponse {
  id: string;
  titulo: string;
  empresa: string;
  ubicacion: string;
  descripcion: string;
  salario?: string;
  tipoEmpleo?: string;
  modalidad?: string;
  nivelExperiencia?: string;
  fechaPublicacion?: string;
  origen: 'EMPLEAPRO' | 'JOOBLE' | 'REMOTIVE';
  externa: boolean;
  urlExterna?: string;
  logoUrl?: string;
}
