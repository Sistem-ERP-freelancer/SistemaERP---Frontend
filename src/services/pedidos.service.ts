import {
    AtualizarCondicaoPagamentoPayload,
    CreatePedidoDto,
    DashboardPedidos,
    FiltrosPedidos,
    Pedido,
    PedidosResponse,
} from '@/types/pedido';
import type { ContaReceber, ContaPagar, FiltrosContasReceber, FiltrosContasPagar } from '@/types/contas-financeiras.types';
import { normalizeString } from '@/lib/contas-financeiras.utils';
import { apiClient } from './api';
import type { ConfirmarPagamentoPayload } from './contas-receber.service';

// Re-exportar tipos para compatibilidade
export type { PedidoItem as ItemPedido } from '@/types/pedido';
export type { CreatePedidoDto, DashboardPedidos, FiltrosPedidos, Pedido, PedidosResponse };

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

  /**
   * Confirma pagamento da parcela com múltiplas duplicatas
   * POST /pedidos/:pedidoId/parcelas/:parcelaId/confirmar-pagamento
   * @param parcelaId - ID da parcela (tb_parcela_pedido), nunca numero_parcela
   */
  async confirmarPagamentoParcela(
    pedidoId: number,
    parcelaId: number,
    payload: ConfirmarPagamentoPayload
  ): Promise<unknown> {
    const url = `/pedidos/${pedidoId}/parcelas/${parcelaId}/confirmar-pagamento`;
    if (import.meta.env.DEV) {
      console.log('📤 [confirmarPagamentoParcela] Requisição:', {
        url,
        pedidoId,
        parcelaId,
        payload,
        payloadJSON: JSON.stringify(payload),
      });
    }
    return apiClient.post(url, payload);
  }

  /**
   * Lista parcelas do pedido (GET /pedidos/:pedidoId/parcelas)
   * Usado ao criar duplicata para vincular a uma parcela
   */
  async listarParcelas(pedidoId: number): Promise<{ parcelas: Array<{
    id: number;
    pedido_id: number;
    numero_parcela: number;
    total_parcelas: number;
    valor: number;
    valor_pago?: number;
    status: string;
    data_vencimento: string;
  }>; resumo?: unknown }> {
    return apiClient.get(`/pedidos/${pedidoId}/parcelas`);
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

  /**
   * Altera condição de pagamento do pedido (ex.: à vista → parcelado).
   * PATCH /pedidos/:id – backend remove parcelas em aberto e cria as novas.
   */
  async alterarCondicaoPagamento(
    pedidoId: number,
    payload: AtualizarCondicaoPagamentoPayload
  ): Promise<Pedido> {
    return apiClient.patch<Pedido>(`/pedidos/${pedidoId}`, payload);
  }

  async cancelar(id: number): Promise<Pedido> {
    return apiClient.patch<Pedido>(`/pedidos/${id}/cancelar`, {});
  }

  /**
   * Atualiza apenas a data de vencimento base do pedido
   * O backend recalcula automaticamente todas as parcelas pendentes
   */
  async atualizarDataVencimento(
    pedidoId: number,
    dataVencimento: string
  ): Promise<Pedido> {
    return apiClient.patch<Pedido>(
      `/pedidos/${pedidoId}/data-vencimento`,
      {
        data_vencimento_base: dataVencimento,
      }
    );
  }

  async obterDashboard(): Promise<DashboardPedidos> {
    return apiClient.get<DashboardPedidos>('/pedidos/dashboard/resumo');
  }

  /**
   * Busca dados do cliente para preenchimento de pedido
   * Endpoint alternativo: GET /api/v1/pedidos/cliente/:clienteId/dados
   * @param clienteId - ID do cliente
   * @returns Dados do cliente para pedido
   */
  async buscarDadosClienteParaPedido(clienteId: number): Promise<any> {
    return apiClient.get<any>(`/pedidos/cliente/${clienteId}/dados`);
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

  /**
   * Lista contas a receber (pedidos de venda com valor em aberto)
   * GET /pedidos/contas-receber
   * Cada linha = 1 pedido (não agrupado por cliente)
   */
  async listarContasReceber(params?: FiltrosContasReceber): Promise<ContaReceber[]> {
    const queryParams = new URLSearchParams();
    
    // Normalizar e validar parâmetros antes de adicionar à query string
    // Conforme GUIA_CORRECAO_CONTAS_PAGAR.md - Normalização robusta
    
    // Normalizar strings primeiro
    const codigoNormalizado = normalizeString(params?.codigo);
    const clienteNomeNormalizado = normalizeString(params?.cliente_nome);
    const formaPagamentoNormalizado = normalizeString(params?.forma_pagamento);
    const situacaoNormalizado = normalizeString(params?.situacao);
    const dataInicialNormalizada = normalizeString(params?.data_inicial);
    const dataFinalNormalizada = normalizeString(params?.data_final);
    
    // Adicionar strings normalizadas
    if (codigoNormalizado) {
      queryParams.append('codigo', codigoNormalizado);
    }
    if (clienteNomeNormalizado) {
      queryParams.append('cliente_nome', clienteNomeNormalizado);
    }
    if (formaPagamentoNormalizado) {
      queryParams.append('forma_pagamento', formaPagamentoNormalizado);
    }
    if (situacaoNormalizado) {
      queryParams.append('situacao', situacaoNormalizado);
    }
    
    // Normalizar e validar números
    // IDs devem ser números válidos e > 0
    if (params?.cliente_id !== undefined && params.cliente_id !== null) {
      const clienteIdNum = Number(params.cliente_id);
      if (!isNaN(clienteIdNum) && clienteIdNum > 0) {
        queryParams.append('cliente_id', clienteIdNum.toString());
      }
    }
    
    // Valores monetários devem ser números válidos e >= 0
    if (params?.valor_inicial !== undefined && params.valor_inicial !== null) {
      const valorInicialNum = Number(params.valor_inicial);
      if (!isNaN(valorInicialNum) && valorInicialNum >= 0) {
        queryParams.append('valor_inicial', valorInicialNum.toString());
      }
    }
    if (params?.valor_final !== undefined && params.valor_final !== null) {
      const valorFinalNum = Number(params.valor_final);
      if (!isNaN(valorFinalNum) && valorFinalNum >= 0) {
        queryParams.append('valor_final', valorFinalNum.toString());
      }
    }
    
    // Validar datas: devem estar no formato YYYY-MM-DD
    if (dataInicialNormalizada && /^\d{4}-\d{2}-\d{2}$/.test(dataInicialNormalizada)) {
      queryParams.append('data_inicial', dataInicialNormalizada);
    }
    if (dataFinalNormalizada && /^\d{4}-\d{2}-\d{2}$/.test(dataFinalNormalizada)) {
      queryParams.append('data_final', dataFinalNormalizada);
    }

    const query = queryParams.toString();
    const url = `/pedidos/contas-receber${query ? `?${query}` : ''}`;
    
    if (import.meta.env.DEV) {
      console.log('🔍 [PedidosService] listarContasReceber:', {
        params,
        url,
        queryString: query,
      });
    }
    
    return apiClient.get<ContaReceber[]>(url);
  }

  /**
   * Lista contas a pagar (pedidos de compra com valor em aberto)
   * GET /pedidos/contas-pagar
   * Cada linha = 1 pedido (não agrupado por fornecedor)
   */
  async listarContasPagar(params?: FiltrosContasPagar): Promise<ContaPagar[]> {
    const queryParams = new URLSearchParams();
    
    // Normalizar e validar parâmetros antes de adicionar à query string
    // Conforme GUIA_CORRECAO_CONTAS_PAGAR.md - Normalização robusta
    
    // Normalizar strings primeiro
    const codigoNormalizado = normalizeString(params?.codigo);
    const fornecedorNomeNormalizado = normalizeString(params?.fornecedor_nome);
    const formaPagamentoNormalizado = normalizeString(params?.forma_pagamento);
    const situacaoNormalizado = normalizeString(params?.situacao);
    const dataInicialNormalizada = normalizeString(params?.data_inicial);
    const dataFinalNormalizada = normalizeString(params?.data_final);
    
    // Adicionar strings normalizadas
    if (codigoNormalizado) {
      queryParams.append('codigo', codigoNormalizado);
    }
    if (fornecedorNomeNormalizado) {
      queryParams.append('fornecedor_nome', fornecedorNomeNormalizado);
    }
    if (formaPagamentoNormalizado) {
      queryParams.append('forma_pagamento', formaPagamentoNormalizado);
    }
    if (situacaoNormalizado) {
      queryParams.append('situacao', situacaoNormalizado);
    }
    
    // Normalizar e validar números
    // IDs devem ser números válidos e > 0
    if (params?.fornecedor_id !== undefined && params.fornecedor_id !== null) {
      const fornecedorIdNum = Number(params.fornecedor_id);
      if (!isNaN(fornecedorIdNum) && fornecedorIdNum > 0) {
        queryParams.append('fornecedor_id', fornecedorIdNum.toString());
      }
    }
    
    // Valores monetários devem ser números válidos e >= 0
    if (params?.valor_inicial !== undefined && params.valor_inicial !== null) {
      const valorInicialNum = Number(params.valor_inicial);
      if (!isNaN(valorInicialNum) && valorInicialNum >= 0) {
        queryParams.append('valor_inicial', valorInicialNum.toString());
      }
    }
    if (params?.valor_final !== undefined && params.valor_final !== null) {
      const valorFinalNum = Number(params.valor_final);
      if (!isNaN(valorFinalNum) && valorFinalNum >= 0) {
        queryParams.append('valor_final', valorFinalNum.toString());
      }
    }
    
    // Validar datas: devem estar no formato YYYY-MM-DD
    if (dataInicialNormalizada && /^\d{4}-\d{2}-\d{2}$/.test(dataInicialNormalizada)) {
      queryParams.append('data_inicial', dataInicialNormalizada);
    }
    if (dataFinalNormalizada && /^\d{4}-\d{2}-\d{2}$/.test(dataFinalNormalizada)) {
      queryParams.append('data_final', dataFinalNormalizada);
    }

    const query = queryParams.toString();
    const url = `/pedidos/contas-pagar${query ? `?${query}` : ''}`;
    
    if (import.meta.env.DEV) {
      console.log('🔍 [PedidosService] listarContasPagar:', {
        params,
        url,
        queryString: query,
      });
    }
    
    return apiClient.get<ContaPagar[]>(url);
  }
}

export const pedidosService = new PedidosService();

