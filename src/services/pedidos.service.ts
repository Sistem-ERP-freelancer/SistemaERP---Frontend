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
    // Log detalhado dos dados sendo enviados
    if (import.meta.env.DEV) {
      console.log('📤 [PedidosService] Criando pedido:', {
        tipo: data.tipo,
        cliente_id: data.cliente_id,
        fornecedor_id: data.fornecedor_id,
        totalItens: data.itens?.length || 0,
        itens: data.itens,
        dadosCompletos: data,
      });
    }
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

  /**
   * Baixa o relatório de pedidos em PDF
   * @returns Promise que resolve quando o download é concluído
   */
  async downloadRelatorioPDF(): Promise<void> {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('Token de autenticação não encontrado');
    }

    // Obter a URL base da API
    const getApiBaseUrl = () => {
      if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
      }
      return 'https://sistemaerp-3.onrender.com/api/v1';
    };

    const apiBaseUrl = getApiBaseUrl();
    const url = `${apiBaseUrl}/pedidos/relatorio/pdf`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    // Verificar se a resposta é um PDF
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/pdf')) {
      // Tentar parsear como JSON (erro da API)
      try {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao gerar relatório');
      } catch {
        throw new Error(`Erro HTTP: ${response.status} ${response.statusText}`);
      }
    }

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();

    // Verificar se o blob não está vazio
    if (blob.size === 0) {
      throw new Error('O PDF gerado está vazio');
    }

    // Extrair nome do arquivo do header Content-Disposition
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = `relatorio-pedidos-${new Date().toISOString().split('T')[0]}.pdf`;
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    // Criar URL temporária e fazer download
    const urlBlob = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = urlBlob;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    // Limpar
    document.body.removeChild(link);
    window.URL.revokeObjectURL(urlBlob);
  }
}

export const pedidosService = new PedidosService();

