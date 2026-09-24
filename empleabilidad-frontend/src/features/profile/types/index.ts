export interface PerfilResponseDTO {
  id: string;
  email: string;
  rol: 'ESTUDIANTE' | 'PROFESIONAL' | 'EMPRESA' | 'RECLUTADOR' | 'MODERADOR' | 'ADMINISTRADOR';
  nombreParaMostrar: string;
  porcentajeCompletitud: number;
  estadoPerfil: 'INCOMPLETO' | 'COMPLETO';
  motivosPendientes: string[];
  puedeAccionar: boolean;
}
