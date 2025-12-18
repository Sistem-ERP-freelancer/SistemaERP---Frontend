import { apiClient } from './api';

export interface ItemPedido {
  produto_id: number;
  quantidade: number;
  preco_unitario: number;
  desconto?: number;
}

export interface Pedido {
  id: number;
  numero_pedido: string;
  tipo: 'VENDA' | 'COMPRA';
  status: 'PENDENTE' | 'APROVADO' | 'EM_PROCESSAMENTO' | 'CONCLUIDO' | 'CANCELADO';
  cliente_id?: number;
  fornecedor_id?: number;
  transportadora_id?: number;
  usuario_criacao_id?: string;
  usuario_atualizacao_id?: string;
  data_pedido: string;
  data_entrega_prevista?: string;
  data_entrega_realizada?: string;
  condicao_pagamento?: string;
  forma_pagamento?: 'DINHEIRO' | 'PIX' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO' | 'BOLETO' | 'TRANSFERENCIA';
  prazo_entrega_dias?: number;
  subtotal: number;
  desconto_valor: number;
  desconto_percentual: number;
  frete: number;
  outras_taxas: number;
  valor_total: number;
  observacoes_internas?: string;
  observacoes_cliente?: string;
  itens: ItemPedido[];
  created_at?: string;
  updated_at?: string;
}

export interface CreatePedidoDto {
  tipo: 'VENDA' | 'COMPRA';
  cliente_id?: number;
  fornecedor_id?: number;
  transportadora_id?: number;
  data_pedido: string;
  data_entrega_prevista?: string;
  condicao_pagamento?: string;
  forma_pagamento?: 'DINHEIRO' | 'PIX' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO' | 'BOLETO' | 'TRANSFERENCIA';
  prazo_entrega_dias?: number;
  subtotal?: number;
  desconto_valor?: number;
  desconto_percentual?: number;
  frete?: number;
  outras_taxas?: number;
  observacoes_internas?: string;
  observacoes_cliente?: string;
  itens: ItemPedido[];
}

export interface PedidosResponse {
  data: Pedido[];
  total: number;
  page: number;
  limit: number;
}

export interface FiltrosPedidos {
  id?: number;
  tipo?: 'VENDA' | 'COMPRA';
  status?: 'PENDENTE' | 'APROVADO' | 'EM_PROCESSAMENTO' | 'CONCLUIDO' | 'CANCELADO';
  cliente_id?: number;
  cliente_nome?: string;
  fornecedor_id?: number;
  fornecedor_nome?: string;
  page?: number;
  limit?: number;
}

class PedidosService {
  async listar(params?: FiltrosPedidos): Promise<PedidosResponse> {
    const queryParams = new URLSearchParams();
    if (params?.id) queryParams.append('id', params.id.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.tipo) queryParams.append('tipo', params.tipo);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.cliente_id) queryParams.append('cliente_id', params.cliente_id.toString());
    if (params?.cliente_nome) queryParams.append('cliente_nome', params.cliente_nome);
    if (params?.fornecedor_id) queryParams.append('fornecedor_id', params.fornecedor_id.toString());
    if (params?.fornecedor_nome) queryParams.append('fornecedor_nome', params.fornecedor_nome);

    const query = queryParams.toString();
    return apiClient.get<PedidosResponse>(`/pedidos${query ? `?${query}` : ''}`);
  }

  async buscarPorId(id: number): Promise<Pedido> {
    return apiClient.get<Pedido>(`/pedidos/${id}`);
  }

  async criar(data: CreatePedidoDto): Promise<Pedido> {
    return apiClient.post<Pedido>('/pedidos', data);
  }

  async atualizar(id: number, data: Partial<CreatePedidoDto>): Promise<Pedido> {
    return apiClient.patch<Pedido>(`/pedidos/${id}`, data);
  }

  async cancelar(id: number): Promise<Pedido> {
    return apiClient.patch<Pedido>(`/pedidos/${id}/cancelar`, {});
  }
}

export const pedidosService = new PedidosService();

