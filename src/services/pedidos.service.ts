import { apiClient } from './api';
import {
  Pedido,
  CreatePedidoDto,
  PedidosResponse,
  FiltrosPedidos,
} from '@/types/pedido';

// Re-exportar tipos para compatibilidade
export type { Pedido, CreatePedidoDto, PedidosResponse, FiltrosPedidos };
export type { PedidoItem as ItemPedido } from '@/types/pedido';

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
    if (params?.data_inicial) queryParams.append('data_inicial', params.data_inicial);
    if (params?.data_final) queryParams.append('data_final', params.data_final);

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

