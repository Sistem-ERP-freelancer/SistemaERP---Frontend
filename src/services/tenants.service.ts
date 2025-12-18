import { apiClient } from './api';

export interface Tenant {
  id: string;
  codigo?: string;
  nome: string;
  cnpj: string;
  email: string;
  telefone?: string;
  subdominio?: string;
  schema_name?: string;
  status: 'ATIVO' | 'INATIVO' | 'SUSPENSO';
  data_expiracao?: string | null;
  configuracoes?: {
    tema?: string;
    moeda?: string;
    fuso_horario?: string;
    idioma?: string;
    [key: string]: any;
  };
  created_at?: string;
  updated_at?: string;
  // Campos alternativos que a API pode retornar
  createdAt?: string;
  dataCriacao?: string;
  updatedAt?: string;
}

export interface CreateTenantDto {
  nome: string;
  cnpj: string;
  email: string;
  senha?: string;
}

export interface UpdateTenantInfoDto {
  nome?: string;
  cnpj?: string;
  email?: string;
  telefone?: string;
}

class TenantsService {
  async listar(): Promise<Tenant[]> {
    const data = await apiClient.get<any[]>('/tenants');
    // Normaliza os dados, garantindo que created_at esteja presente
    return data.map((tenant) => ({
      ...tenant,
      created_at: tenant.created_at || tenant.createdAt || tenant.dataCriacao,
      updated_at: tenant.updated_at || tenant.updatedAt,
    })) as Tenant[];
  }

  async buscarPorId(id: string): Promise<Tenant> {
    return apiClient.get<Tenant>(`/tenants/${id}`);
  }

  // Novo endpoint para ADMIN/GERENTE obter informações do próprio tenant
  async obterMeuTenant(): Promise<Tenant> {
    const data = await apiClient.get<any>('/tenant/me');
    // Normaliza os dados
    return {
      ...data,
      created_at: data.created_at || data.dataCriacao,
      updated_at: data.updated_at || data.updatedAt,
    } as Tenant;
  }

  // Novo endpoint para ADMIN atualizar informações do próprio tenant
  async atualizarMeuTenant(data: UpdateTenantInfoDto): Promise<Tenant> {
    const response = await apiClient.put<any>('/tenant/me', data);
    // Normaliza os dados
    return {
      ...response,
      created_at: response.created_at || response.dataCriacao,
      updated_at: response.updated_at || response.updatedAt,
    } as Tenant;
  }

  async criar(data: CreateTenantDto): Promise<Tenant> {
    return apiClient.post<Tenant>('/tenants', data);
  }

  async atualizar(id: string, data: Partial<CreateTenantDto>): Promise<Tenant> {
    return apiClient.put<Tenant>(`/tenants/${id}`, data);
  }

  async bloquear(id: string): Promise<Tenant> {
    return apiClient.put<Tenant>(`/tenants/${id}/bloquear`, {});
  }

  async desbloquear(id: string): Promise<Tenant> {
    return apiClient.put<Tenant>(`/tenants/${id}/desbloquear`, {});
  }

  async ativar(id: string): Promise<Tenant> {
    return apiClient.put<Tenant>(`/tenants/${id}/ativar`, {});
  }

  async desativar(id: string): Promise<Tenant> {
    return apiClient.put<Tenant>(`/tenants/${id}/desativar`, {});
  }
}

export const tenantsService = new TenantsService();

