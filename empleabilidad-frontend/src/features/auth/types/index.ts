export interface AuthResponse {
  token: string;
}

export interface UsuarioResponseDTO {
  id: string;
  uuid: string;
  email: string;
  telefono?: string;
  fotoPerfil?: string;
  rol: 'ESTUDIANTE' | 'PROFESIONAL' | 'EMPRESA' | 'RECLUTADOR' | 'MODERADOR' | 'ADMINISTRADOR';
  estadoCuenta: string;
  nombres?: string; // para estudiantes
  apellidos?: string; // para estudiantes
  razonSocial?: string; // para empresas
  nombreComercial?: string; // para empresas
}
