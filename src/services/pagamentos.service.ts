import type { ChequeDto } from '@/shared/types/cheque.types';
import { apiClient } from './api';

export type FormaPagamento =
  | 'DINHEIRO'
  | 'PIX'
  | 'CARTAO_CREDITO'
  | 'CARTAO_DEBITO'
  | 'BOLETO'
  | 'TRANSFERENCIA'
  | 'CHEQUE';

export type { ChequeDto } from '@/shared/types/cheque.types';

export interface CreatePagamentoDto {
  parcela_id: number;
  forma_pagamento: FormaPagamento;
  valor_pago: number;
  data_lancamento: string;
  observacoes?: string;
  cheques?: ChequeDto[];
}

export interface EstornarPagamentoDto {
  data_estorno?: string;
  motivo_estorno?: string;
}

export interface ChequePagamento {
  id?: number;
  pagamento_id?: number;
  titular: string;
  cpf_cnpj_titular?: string;
  banco: string;
  agencia?: string;
  conta?: string;
  numero_cheque: string;
  valor: number;
  data_vencimento: string;
  status?: string;
  observacao?: string;
}

export interface Pagamento {
  id: number;
  parcela_id: number;
  forma_pagamento: FormaPagamento;
  valor_pago: number;
  data_lancamento: string;
  observacoes?: string;
  estornado?: boolean;
  cheques?: ChequePagamento[];
  created_at?: string;
  updated_at?: string;
}

class PagamentosService {
  async criar(data: CreatePagamentoDto): Promise<Pagamento> {
    return apiClient.post<Pagamento>('/pagamentos', data);
  }

  async listarPorParcela(parcelaId: number): Promise<Pagamento[]> {
    const response = await apiClient.get<Pagamento[] | { pagamentos: Pagamento[] }>(
      `/pagamentos/parcela/${parcelaId}`
    );
    return Array.isArray(response) ? response : response?.pagamentos || [];
  }

  async buscarPorId(id: number): Promise<Pagamento> {
    return apiClient.get<Pagamento>(`/pagamentos/${id}`);
  }

  async estornar(pagamentoId: number, data?: EstornarPagamentoDto): Promise<Pagamento> {
    return apiClient.patch<Pagamento>(`/pagamentos/${pagamentoId}/estornar`, data || {});
  }

  async listarPorPeriodo(dataInicio: string, dataFim: string): Promise<Pagamento[]> {
    const query = new URLSearchParams({
      data_inicio: dataInicio,
      data_fim: dataFim,
    });
    const response = await apiClient.get<Pagamento[] | { pagamentos: Pagamento[] }>(
      `/pagamentos/periodo?${query}`
    );
    return Array.isArray(response) ? response : response?.pagamentos || [];
  }

  async recalcularParcela(parcelaId: number): Promise<void> {
    return apiClient.patch(`/pagamentos/parcela/${parcelaId}/recalcular`, {});
  }
}

export const pagamentosService = new PagamentosService();
