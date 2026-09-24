import { api } from '@/core/api';
import type { PerfilResponseDTO } from '../types';

export const profileService = {
  async getMiPerfil(): Promise<PerfilResponseDTO> {
    const { data } = await api.get<PerfilResponseDTO>('/perfil/me');
    return data;
  },

  async uploadCv(file: File): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);
    
    await api.post('/perfil/cv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  async getMiPerfilEmpresa(): Promise<any> {
    const { data } = await api.get<any>('/perfil/empresa/me');
    return data;
  },

  async updatePerfilEmpresa(payload: any): Promise<any> {
    const { data } = await api.put<any>('/perfil/empresa/me', payload);
    return data;
  },

  async uploadLogoEmpresa(file: File): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);
    
    await api.post('/perfil/empresa/logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  async updatePasswordEmpresa(payload: { contrasenaActual: string, contrasenaNueva: string }): Promise<any> {
    const { data } = await api.put<any>('/perfil/empresa/password', payload);
    return data;
  }
};
