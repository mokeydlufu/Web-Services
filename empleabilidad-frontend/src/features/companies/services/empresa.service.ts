import { api, ofertasApi } from '../../../core/api';

export interface EmpresaPublica {
  id: string;
  razonSocial: string;
  nombreComercial: string;
  logo: string;
  descripcion: string;
  sitioWeb: string;
  industria: string;
  tamano: string;
  ubicacion: string;
  estadoVerificacion: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const getEmpresasPublicas = async (
  page: number = 0,
  size: number = 12,
  q?: string,
  ubicacion?: string,
  industria?: string
) => {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString()
  });

  if (q) params.append('q', q);
  if (ubicacion && ubicacion !== 'TODAS' && ubicacion !== 'Peru') params.append('ubicacion', ubicacion);
  if (industria && industria !== 'TODAS') params.append('industria', industria);

  const response = await api.get<PaginatedResponse<EmpresaPublica>>(`/empresas/publicas?${params.toString()}`);
  return response.data;
};

export const getEmpresaById = async (id: string) => {
  const response = await api.get<EmpresaPublica>(`/empresas/publicas/${id}`);
  return response.data;
};

export const getConteoOfertas = async (empresaIds: string[]) => {
  const response = await ofertasApi.post<Record<string, number>>(`/ofertas/publicas/conteo-por-empresa`, empresaIds);
  return response.data;
};
