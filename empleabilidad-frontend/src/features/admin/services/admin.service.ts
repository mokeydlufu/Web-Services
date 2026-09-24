import { api, ofertasApi, postulacionesApi } from '@/core/api';

export interface UsuariosStats {
  totalUsuarios: number;
  totalCandidatos: number;
  totalEmpresas: number;
  empresasPendientes: number;
  empresasVerificadas: number;
  empresasRechazadas: number;
  empresasSuspendidas: number;
}

export interface OfertasStats {
  totalOfertas: number;
  publicadas: number;
  pendientes: number;
  borradores: number;
}

export interface PostulacionesStats {
  totalPostulaciones: number;
  postulacionesMes: number;
}

export interface AdminEmpresa {
  id: string;
  uuid?: string;
  email: string;
  ruc: string;
  razonSocial: string;
  nombreComercial?: string;
  telefono?: string;
  direccion?: string;
  sitioWeb?: string;
  industria?: string;
  tamano?: string;
  ubicacion?: string;
  estadoVerificacion: 'PENDIENTE' | 'VERIFICADA' | 'RECHAZADA' | 'SUSPENDIDA' | string;
  fechaRegistro?: string;
  motivoRechazo?: string;
}

export interface AdminCandidato {
  id: string;
  uuid?: string;
  email: string;
  dni: string;
  nombres: string;
  apellidos: string;
  telefono?: string;
  ubicacion?: string;
  tituloProfesional?: string;
  estadoCuenta?: string;
  activo?: boolean;
  fechaRegistro?: string;
}

export const adminService = {
  // Estadísticas
  async getUsuariosStats(): Promise<UsuariosStats> {
    const { data } = await api.get<UsuariosStats>('/admin/usuarios/stats');
    return data;
  },

  async getOfertasStats(): Promise<OfertasStats> {
    const { data } = await ofertasApi.get<OfertasStats>('/ofertas/admin/stats');
    return data;
  },

  async getPostulacionesStats(): Promise<PostulacionesStats> {
    const { data } = await postulacionesApi.get<PostulacionesStats>('/postulaciones/admin/stats');
    return data;
  },

  // Gestión de Empresas
  async getEmpresas(estado?: string): Promise<AdminEmpresa[]> {
    const params = estado && estado !== 'TODAS' ? { estado } : {};
    const { data } = await api.get<AdminEmpresa[]>('/admin/empresas', { params });
    return data;
  },

  async aprobarEmpresa(id: string): Promise<AdminEmpresa> {
    const { data } = await api.patch<AdminEmpresa>(`/admin/empresas/${id}/aprobar`);
    return data;
  },

  async rechazarEmpresa(id: string, motivo: string): Promise<AdminEmpresa> {
    const { data } = await api.patch<AdminEmpresa>(`/admin/empresas/${id}/rechazar`, { motivo });
    return data;
  },

  async suspenderEmpresa(id: string): Promise<AdminEmpresa> {
    const { data } = await api.patch<AdminEmpresa>(`/admin/empresas/${id}/suspender`);
    return data;
  },

  // Gestión de Candidatos
  async getCandidatos(): Promise<AdminCandidato[]> {
    const { data } = await api.get<AdminCandidato[]>('/admin/candidatos');
    return data;
  },
};
