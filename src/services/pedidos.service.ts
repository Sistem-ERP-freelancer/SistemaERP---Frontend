import { apiClient } from './api';
import {
  Pedido,
  CreatePedidoDto,
  PedidosResponse,
  FiltrosPedidos,
  DashboardPedidos,
} from '@/types/pedido';

// Re-exportar tipos para compatibilidade
export type { Pedido, CreatePedidoDto, PedidosResponse, FiltrosPedidos, DashboardPedidos };
export type { PedidoItem as ItemPedido } from '@/types/pedido';

class PedidosService {
  async listar(params?: FiltrosPedidos): Promise<PedidosResponse> {
    const queryParams = new URLSearchParams();
    if (params?.id) queryParams.append('id', params.id.toString());
    if (params?.numero_pedido) queryParams.append('numero_pedido', params.numero_pedido);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.tipo) queryParams.append('tipo', params.tipo);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.cliente_id) queryParams.append('cliente_id', params.cliente_id.toString());
    if (params?.cliente_nome) queryParams.append('cliente_nome', params.cliente_nome);
    if (params?.fornecedor_id) queryParams.append('fornecedor_id', params.fornecedor_id.toString());
    if (params?.fornecedor_nome) queryParams.append('fornecedor_nome', params.fornecedor_nome);
    if (params?.data_inicial) {
      // Enviar em snake_case (padrão da API)
      queryParams.append('data_inicial', params.data_inicial);
    }
    if (params?.data_final) {
      // Enviar em snake_case (padrão da API)
      queryParams.append('data_final', params.data_final);
    }

    const query = queryParams.toString();
    const url = `/pedidos${query ? `?${query}` : ''}`;
    
    // Debug: log dos parâmetros de data
    if (params?.data_inicial || params?.data_final) {
      console.log('📅 [Pedidos] Filtros de data sendo enviados:', {
        data_inicial: params.data_inicial,
        data_final: params.data_final,
        formato_data: 'YYYY-MM-DD',
        url_completa: url,
        query_string: query,
        comportamento_esperado: 'Filtrar pedidos onde data_pedido está entre data_inicial e data_final',
      });
    }
    
    return apiClient.get<PedidosResponse>(url);
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

  async obterDashboard(): Promise<DashboardPedidos> {
    return apiClient.get<DashboardPedidos>('/pedidos/dashboard/resumo');
  }
}

export const pedidosService = new PedidosService();

