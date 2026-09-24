import { api } from '@/core/api';
import type { AuthResponse, UsuarioResponseDTO } from '../types';

export const authService = {
  async login(credentials: Record<string, any>): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/login', credentials);
    return data;
  },

  async registerEstudiante(payload: Record<string, any>): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/registro/estudiante', payload);
    return data;
  },

  async registerEmpresa(payload: Record<string, any>): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/registro/empresa', payload);
    return data;
  },

  async getMe(): Promise<UsuarioResponseDTO> {
    const { data } = await api.get<UsuarioResponseDTO>('/auth/me');
    return data;
  },

  async checkDni(dni: string): Promise<{ exists: boolean; disponible: boolean; message?: string }> {
    try {
      const { data } = await api.get<{ exists: boolean; disponible: boolean; message?: string }>(`/auth/check-dni/${dni}`);
      return data;
    } catch (error: any) {
      if (error.response?.status === 409) {
        return {
          exists: true,
          disponible: false,
          message: error.response.data?.message || 'El DNI ya está registrado',
        };
      }
      throw error;
    }
  },

  async checkEmail(email: string): Promise<{ exists: boolean; disponible: boolean; message?: string }> {
    try {
      const { data } = await api.get<{ exists: boolean; disponible: boolean; message?: string }>('/auth/check-email', {
        params: { email },
      });
      return data;
    } catch (error: any) {
      if (error.response?.status === 409) {
        return {
          exists: true,
          disponible: false,
          message: error.response.data?.message || 'El email ya está registrado',
        };
      }
      throw error;
    }
  },
};
