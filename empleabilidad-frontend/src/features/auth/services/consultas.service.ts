import { api } from '@/core/api';

export interface DniResponse {
  success?: boolean;
  message?: string;
  dni: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  codVerifica?: string;
  nombreCompleto?: string;
}

export interface RucResponse {
  success?: boolean;
  message?: string;
  ruc: string;
  razonSocial: string;
  nombreComercial?: string;
  telefonos?: string[];
  estado?: string;
  condicion?: string;
  direccion?: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  ubigeo?: string;
  capital?: string;
}

export const consultasService = {
  async consultarDni(dni: string): Promise<DniResponse> {
    const { data } = await api.get<DniResponse>(`/consultas/dni/${dni}`);
    return data;
  },

  async consultarRuc(ruc: string): Promise<RucResponse> {
    const { data } = await api.get<RucResponse>(`/consultas/ruc/${ruc}`);
    return data;
  },
};
