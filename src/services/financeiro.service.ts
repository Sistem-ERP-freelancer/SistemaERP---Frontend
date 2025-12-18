import { apiClient } from './api';

export interface ContaFinanceira {
  id: number;
  numero_conta: string;
  tipo: 'RECEBER' | 'PAGAR';
  pedido_id?: number;
  cliente_id?: number;
  fornecedor_id?: number;
  descricao: string;
  valor_original: number;
  valor_pago: number;
  valor_restante: number;
  data_emissao: string;
  data_vencimento: string;
  data_pagamento?: string;
  status: 'PENDENTE' | 'PAGO_PARCIAL' | 'PAGO_TOTAL' | 'VENCIDO' | 'CANCELADO';
  forma_pagamento?: 'DINHEIRO' | 'PIX' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO' | 'BOLETO' | 'TRANSFERENCIA';
  numero_parcela?: number;
  total_parcelas?: number;
  parcela_texto?: string;
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateContaFinanceiraDto {
  tipo: 'RECEBER' | 'PAGAR';
  pedido_id?: number;
  cliente_id?: number;
  fornecedor_id?: number;
  descricao: string;
  valor_original: number;
  data_emissao: string;
  data_vencimento: string;
  data_pagamento?: string;
  forma_pagamento?: 'DINHEIRO' | 'PIX' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO' | 'BOLETO' | 'TRANSFERENCIA';
  numero_parcela?: number;
  total_parcelas?: number;
  parcela_texto?: string;
  observacoes?: string;
}

export interface ContasFinanceirasResponse {
  data: ContaFinanceira[];
  total: number;
  page: number;
  limit: number;
}

export interface DashboardFinanceiro {
  total: number;
  vencidas: number;
  vencendo_hoje: number;
  vencendo_esta_semana: number;
  vencendo_este_mes: number;
}

class FinanceiroService {
  async listar(params?: {
    page?: number;
    limit?: number;
    tipo?: string;
    status?: string;
    cliente_id?: number;
    fornecedor_id?: number;
  }): Promise<ContasFinanceirasResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.tipo) queryParams.append('tipo', params.tipo);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.cliente_id) queryParams.append('cliente_id', params.cliente_id.toString());
    if (params?.fornecedor_id) queryParams.append('fornecedor_id', params.fornecedor_id.toString());

    const query = queryParams.toString();
    return apiClient.get<ContasFinanceirasResponse>(`/contas-financeiras${query ? `?${query}` : ''}`);
  }

  async buscarPorId(id: number): Promise<ContaFinanceira> {
    return apiClient.get<ContaFinanceira>(`/contas-financeiras/${id}`);
  }

  async criar(data: CreateContaFinanceiraDto): Promise<ContaFinanceira> {
    return apiClient.post<ContaFinanceira>('/contas-financeiras', data);
  }

  async atualizar(id: number, data: Partial<CreateContaFinanceiraDto>): Promise<ContaFinanceira> {
    return apiClient.patch<ContaFinanceira>(`/contas-financeiras/${id}`, data);
  }

  async deletar(id: number): Promise<void> {
    return apiClient.delete<void>(`/contas-financeiras/${id}`);
  }

  async cancelar(id: number): Promise<ContaFinanceira> {
    return apiClient.patch<ContaFinanceira>(`/contas-financeiras/${id}/cancelar`, {});
  }

  async getDashboardReceber(): Promise<DashboardFinanceiro> {
    return apiClient.get<DashboardFinanceiro>('/contas-financeiras/dashboard/receber');
  }

  async getDashboardPagar(): Promise<DashboardFinanceiro> {
    return apiClient.get<DashboardFinanceiro>('/contas-financeiras/dashboard/pagar');
  }

  async getDashboardResumo(): Promise<any> {
    return apiClient.get<any>('/contas-financeiras/dashboard/resumo');
  }
}

export const financeiroService = new FinanceiroService();

