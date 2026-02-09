import type { ChequeDto } from '@/shared/types/cheque.types';
import { apiClient } from './api';

// Formas de recebimento aceitas pela API
export type FormaRecebimento =
  | 'DINHEIRO'
  | 'PIX'
  | 'CARTAO_CREDITO'
  | 'CARTAO_DEBITO'
  | 'BOLETO'
  | 'TRANSFERENCIA'
  | 'CHEQUE';

export type StatusDuplicata = 'ABERTA' | 'PARCIAL' | 'BAIXADA' | 'CANCELADA';

export interface Duplicata {
  id: number;
  numero: string;
  cliente_id: number;
  pedido_id?: number;
  parcela_pedido_id?: number;
  valor_original: number;
  valor_aberto: number;
  data_emissao: string;
  data_vencimento: string;
  forma_pagamento?: string;
  descricao?: string;
  observacoes?: string;
  status: StatusDuplicata;
  created_at?: string;
  updated_at?: string;
}

export interface ChequeBaixa {
  id?: number;
  baixa_duplicata_id?: number;
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

export interface Baixa {
  id: number;
  duplicata_id: number;
  valor_pago: number;
  valor_liquido: number;
  data_baixa: string;
  forma_recebimento: FormaRecebimento;
  juros?: number;
  multa?: number;
  desconto?: number;
  observacao?: string;
  estornado?: boolean;
  cheques?: ChequeBaixa[];
  created_at?: string;
  updated_at?: string;
}

export interface CreateDuplicataDto {
  numero: string;
  cliente_id: number;
  pedido_id?: number;
  parcela_pedido_id?: number;
  valor_original: number;
  data_emissao: string;
  data_vencimento: string;
  descricao?: string;
  observacoes?: string;
}

export interface DarBaixaDto {
  valor_pago: number;
  data_baixa: string;
  forma_recebimento: FormaRecebimento;
  juros?: number;
  multa?: number;
  desconto?: number;
  observacao?: string;
  cheques?: ChequeDto[];
}

export interface EstornarBaixaDto {
  data_estorno?: string;
  motivo_estorno?: string;
}

export interface CancelarDuplicataDto {
  motivo?: string;
}

export interface DarBaixaResponse {
  duplicata: Duplicata;
  baixa: Baixa;
}

// Parcela dentro de um grupo (resposta de agrupadas-por-pedido)
export interface ParcelaAgrupada {
  id: number;
  numero: string;
  valor_original: number;
  valor_aberto: number;
  data_vencimento: string;
  status: StatusDuplicata;
  /** ID da parcela do pedido (tb_parcela_pedido) - usar na URL confirmar-pagamento */
  parcela_pedido_id?: number;
}

// Grupo de parcelas por pedido (resposta de agrupadas-por-pedido)
export interface GrupoDuplicatasPorPedido {
  pedido_id: number;
  numero_pedido: string;
  cliente_id: number;
  cliente_nome: string;
  parcelas: ParcelaAgrupada[];
  total_parcelas: number;
  parcelas_pagas: number;
  valor_total: number;
  valor_aberto: number;
}

// Resposta do endpoint agrupadas-por-pedido
export interface DuplicatasAgrupadasResponse {
  grupos: GrupoDuplicatasPorPedido[];
  avulsas: Duplicata[];
}

export interface EstornarBaixaResponse {
  duplicata: Duplicata;
  baixa: Baixa;
}

class DuplicatasService {
  async listar(params?: {
    cliente_id?: number;
    parcela_pedido_id?: number;
    status?: StatusDuplicata;
  }): Promise<Duplicata[]> {
    const queryParams = new URLSearchParams();
    if (params?.cliente_id) queryParams.append('cliente_id', params.cliente_id.toString());
    if (params?.parcela_pedido_id)
      queryParams.append('parcela_pedido_id', params.parcela_pedido_id.toString());
    if (params?.status) queryParams.append('status', params.status);

    const query = queryParams.toString();
    const response = await apiClient.get<Duplicata[] | { data: Duplicata[] }>(
      `/duplicatas${query ? `?${query}` : ''}`
    );
    return Array.isArray(response) ? response : response?.data || [];
  }

  async listarAgrupadasPorPedido(params?: {
    cliente_id?: number;
    status?: StatusDuplicata;
  }): Promise<DuplicatasAgrupadasResponse> {
    const queryParams = new URLSearchParams();
    if (params?.cliente_id) queryParams.append('cliente_id', params.cliente_id.toString());
    if (params?.status) queryParams.append('status', params.status);

    const query = queryParams.toString();
    const response = await apiClient.get<DuplicatasAgrupadasResponse>(
      `/duplicatas/agrupadas-por-pedido${query ? `?${query}` : ''}`
    );
    return (
      response || {
        grupos: [],
        avulsas: [],
      }
    );
  }

  async buscarPorId(id: number): Promise<Duplicata> {
    return apiClient.get<Duplicata>(`/duplicatas/${id}`);
  }

  async criar(data: CreateDuplicataDto): Promise<Duplicata> {
    return apiClient.post<Duplicata>('/duplicatas', data);
  }

  async darBaixa(duplicataId: number, data: DarBaixaDto): Promise<DarBaixaResponse> {
    return apiClient.post<DarBaixaResponse>(`/duplicatas/${duplicataId}/baixa`, data);
  }

  async estornarBaixa(baixaId: number, data?: EstornarBaixaDto): Promise<EstornarBaixaResponse> {
    return apiClient.patch<EstornarBaixaResponse>(
      `/duplicatas/baixa/${baixaId}/estornar`,
      data || {}
    );
  }

  async cancelar(duplicataId: number, data?: CancelarDuplicataDto): Promise<Duplicata> {
    return apiClient.patch<Duplicata>(`/duplicatas/${duplicataId}/cancelar`, data || {});
  }

  async obterHistorico(duplicataId: number): Promise<Baixa[]> {
    const response = await apiClient.get<Baixa[] | { baixas: Baixa[] }>(
      `/duplicatas/${duplicataId}/historico`
    );
    if (Array.isArray(response)) return response;
    return (response as { baixas?: Baixa[] })?.baixas || [];
  }
}

export const duplicatasService = new DuplicatasService();
