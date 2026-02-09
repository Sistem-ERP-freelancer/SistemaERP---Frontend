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
  forma_pagamento?: 'DINHEIRO' | 'PIX' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO' | 'BOLETO' | 'TRANSFERENCIA' | 'CHEQUE';
  numero_parcela?: number;
  total_parcelas?: number;
  parcela_texto?: string;
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
  // Campos calculados pelo backend (conforme GUIA_PRAZO_VALIDADE_PAGAMENTOS.md)
  dias_ate_vencimento?: number;        // Ex: -5 (vencida há 5 dias), 0 (vence hoje), 5 (vence em 5 dias)
  status_vencimento?: string;           // Ex: "Vencida há 5 dias", "Vence hoje", "Vence em 5 dias"
  proximidade_vencimento?: 'VENCIDA' | 'VENCE_HOJE' | 'CRITICO' | 'ATENCAO' | 'NORMAL' | 'LONGO_PRAZO';
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
  forma_pagamento?: 'DINHEIRO' | 'PIX' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO' | 'BOLETO' | 'TRANSFERENCIA' | 'CHEQUE';
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

/** Resposta do endpoint GET /contas-financeiras/:id/detalhe (modal Visualizar) */
export interface ContaFinanceiraDetalhe {
  id: number;
  numero_conta: string;
  tipo: string;
  descricao: string;
  descricao_parcelas_quitadas: string;
  valor_total_pedido: number;
  valor_pago: number;
  valor_em_aberto: number;
  status: string;
  status_original: string;
  relacionamentos: {
    cliente_nome: string | null;
    fornecedor_nome: string | null;
    pedido_numero: string | null;
    nome_produto: string | null;
  };
  datas: {
    data_criacao: string | null;
    data_vencimento: string | null;
    data_pagamento: string | null;
  };
  pagamento: {
    forma_pagamento: string | null;
  };
  parcelas: {
    numero_parcela_atual: number | null;
    total_parcelas: number | null;
    texto_parcelas_quitadas: string | null;
  };
  dias_ate_vencimento?: number;
  status_vencimento?: string;
  proximidade_vencimento?: string;
}

export interface ContaFinanceiraAgrupada {
  id: number;
  pedido_id: number | null;
  cliente_nome: string;
  descricao: string;
  tipo: 'RECEBER' | 'PAGAR';
  categoria: string;
  valor_total: number;
  status: string;
}

export interface ContasAgrupadasResponse {
  itens: ContaFinanceiraAgrupada[];
  total: number;
}

export interface DashboardFinanceiro {
  total: number;
  vencidas: number;
  vencendo_hoje: number;
  vencendo_esta_semana: number;
  vencendo_este_mes: number;
  // Campos adicionais conforme guia do backend
  valor_total_vencidas?: number;
  valor_total_vencendo_hoje?: number;
  valor_total_vencendo_esta_semana?: number;
  valor_total_vencendo_este_mes?: number;
  valor_total_pendente?: number;
  valor_total_receber?: number;
  valor_total_recebido?: number;
  valor_total_pagar?: number;
  valor_total_pago?: number;
}

export interface ResumoFinanceiro {
  contas_receber: {
    total: number;
    pendentes: number;
    pagas: number;
    vencidas: number;
    valor_total_receber: number;   // Valor original total (todas as contas)
    valor_total_recebido: number;   // ✅ Valor realmente recebido (via baixas) - total geral
    valor_total_pendente: number;  // ✅ Valor realmente em aberto
    receita_mes: number;           // ⭐ NOVO: Receita do mês atual (valor total a receber do mês)
    valor_pago_mes: number;        // ⭐ NOVO: Valor pago no mês atual (via baixas de duplicatas e parcelas)
  };
  contas_pagar: {
    total: number;
    pendentes: number;
    pagas: number;
    vencidas: number;
    valor_total_pagar: number;     // Valor original total
    valor_total_pago: number;      // ✅ Valor realmente pago - total geral
    valor_total_pendente: number;  // ✅ Valor realmente em aberto
    despesa_mes: number;            // ⭐ NOVO: Despesa do mês atual (valor total a pagar do mês)
    valor_pago_mes: number;        // ⭐ NOVO: Valor pago no mês atual
  };
}

class FinanceiroService {
  async listarAgrupado(params?: {
    page?: number;
    limit?: number;
    tipo?: string;
    status?: string;
    cliente_id?: number;
    fornecedor_id?: number;
  }): Promise<ContasAgrupadasResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.tipo) queryParams.append('tipo', params.tipo);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.cliente_id) queryParams.append('cliente_id', params.cliente_id.toString());
    if (params?.fornecedor_id) queryParams.append('fornecedor_id', params.fornecedor_id.toString());

    const query = queryParams.toString();
    return apiClient.get<ContasAgrupadasResponse>(`/contas-financeiras/agrupado${query ? `?${query}` : ''}`);
  }

  async listar(params?: {
    page?: number;
    limit?: number;
    tipo?: string;
    status?: string;
    cliente_id?: number;
    fornecedor_id?: number;
    pedido_id?: number;
    proximidade_vencimento?: 'VENCIDA' | 'VENCE_HOJE' | 'CRITICO' | 'ATENCAO' | 'NORMAL' | 'LONGO_PRAZO';
    dias_maximos?: number;
  }): Promise<ContasFinanceirasResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.tipo) queryParams.append('tipo', params.tipo);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.cliente_id) queryParams.append('cliente_id', params.cliente_id.toString());
    if (params?.fornecedor_id) queryParams.append('fornecedor_id', params.fornecedor_id.toString());
    if (params?.pedido_id) queryParams.append('pedido_id', params.pedido_id.toString());
    if (params?.proximidade_vencimento) queryParams.append('proximidade_vencimento', params.proximidade_vencimento);
    if (params?.dias_maximos !== undefined) queryParams.append('dias_maximos', params.dias_maximos.toString());

    const query = queryParams.toString();
    return apiClient.get<ContasFinanceirasResponse>(`/contas-financeiras${query ? `?${query}` : ''}`);
  }

  async buscarPorPedido(pedidoId: number): Promise<ContaFinanceira[]> {
    const response = await this.listar({ pedido_id: pedidoId, limit: 100 });
    // A API pode retornar em diferentes formatos
    if (Array.isArray(response)) {
      return response;
    }
    if (response.data && Array.isArray(response.data)) {
      return response.data;
    }
    if ((response as any).contas && Array.isArray((response as any).contas)) {
      return (response as any).contas;
    }
    return [];
  }

  async buscarPorId(id: number): Promise<ContaFinanceira> {
    return apiClient.get<ContaFinanceira>(`/contas-financeiras/${id}`);
  }

  /** Detalhe enriquecido para o modal Visualizar (não usar para edição) */
  async buscarDetalhePorId(id: number): Promise<ContaFinanceiraDetalhe> {
    return apiClient.get<ContaFinanceiraDetalhe>(`/contas-financeiras/${id}/detalhe`);
  }

  async criar(data: CreateContaFinanceiraDto): Promise<ContaFinanceira> {
    return apiClient.post<ContaFinanceira>('/contas-financeiras', data);
  }

  async atualizar(id: number | string, data: Partial<CreateContaFinanceiraDto & { status?: ContaFinanceira['status'] }>): Promise<ContaFinanceira> {
    // Garantir que o ID seja um número
    const contaId = typeof id === 'string' ? parseInt(id, 10) : id;
    
    if (isNaN(contaId) || contaId <= 0) {
      const error = new Error(`ID inválido: ${id}`);
      console.error('❌ [FinanceiroService]', error.message);
      throw error;
    }
    
    // Remover campos undefined/null do payload para evitar erros no backend
    const payload: Record<string, any> = {};
    
    // Função auxiliar para verificar se um valor deve ser incluído
    const shouldInclude = (value: any): boolean => {
      return value !== undefined && value !== null && value !== '';
    };
    
    // Adicionar apenas campos definidos e válidos
    if (shouldInclude(data.tipo)) payload.tipo = data.tipo;
    if (shouldInclude(data.descricao)) payload.descricao = typeof data.descricao === 'string' ? data.descricao.trim() : data.descricao;
    if (shouldInclude(data.valor_original)) payload.valor_original = Number(data.valor_original);
    if (shouldInclude(data.data_emissao)) payload.data_emissao = data.data_emissao;
    if (shouldInclude(data.data_vencimento)) payload.data_vencimento = data.data_vencimento;
    if (shouldInclude(data.data_pagamento)) payload.data_pagamento = data.data_pagamento;
    
    // Status - garantir que seja uma string válida
    if (data.status !== undefined && data.status !== null) {
      const statusValue = typeof data.status === 'string' ? data.status.toUpperCase() : data.status;
      // Validar que o status é um dos valores permitidos
      const validStatuses = ['PENDENTE', 'PAGO_PARCIAL', 'PAGO_TOTAL', 'VENCIDO', 'CANCELADO'];
      if (validStatuses.includes(statusValue as string)) {
        payload.status = statusValue;
      } else {
        console.warn(`⚠️ [FinanceiroService] Status inválido: ${statusValue}. Valores permitidos: ${validStatuses.join(', ')}`);
      }
    }
    
    if (shouldInclude(data.forma_pagamento)) payload.forma_pagamento = data.forma_pagamento;
    if (shouldInclude(data.cliente_id)) payload.cliente_id = Number(data.cliente_id);
    if (shouldInclude(data.fornecedor_id)) payload.fornecedor_id = Number(data.fornecedor_id);
    if (shouldInclude(data.pedido_id)) payload.pedido_id = Number(data.pedido_id);
    if (shouldInclude(data.numero_parcela)) payload.numero_parcela = Number(data.numero_parcela);
    if (shouldInclude(data.total_parcelas)) payload.total_parcelas = Number(data.total_parcelas);
    if (shouldInclude(data.parcela_texto)) payload.parcela_texto = typeof data.parcela_texto === 'string' ? data.parcela_texto.trim() : data.parcela_texto;
    if (shouldInclude(data.observacoes)) payload.observacoes = typeof data.observacoes === 'string' ? data.observacoes.trim() : data.observacoes;

    // Log detalhado em desenvolvimento
    if (import.meta.env.DEV) {
      console.log('📤 [FinanceiroService] Atualizando conta financeira:', {
        idOriginal: id,
        idConvertido: contaId,
        dadosRecebidos: data,
        payload,
        payloadJSON: JSON.stringify(payload, null, 2),
        endpoint: `/contas-financeiras/${contaId}`,
        metodo: 'PATCH',
        camposIncluidos: Object.keys(payload),
      });
    }

    // Validar que pelo menos um campo foi incluído
    if (Object.keys(payload).length === 0) {
      const error = new Error('Nenhum campo válido para atualização');
      console.error('❌ [FinanceiroService]', error.message, { id: contaId, data });
      throw error;
    }

    try {
      const response = await apiClient.patch<ContaFinanceira>(`/contas-financeiras/${contaId}`, payload);
      
      // Log da resposta em desenvolvimento
      if (import.meta.env.DEV) {
        console.log('✅ [FinanceiroService] Conta atualizada com sucesso:', {
          id: contaId,
          response,
        });
      }
      
      return response;
    } catch (error: any) {
      // Log detalhado do erro em desenvolvimento
      if (import.meta.env.DEV) {
        console.error('❌ [FinanceiroService] Erro ao atualizar conta:', {
          idOriginal: id,
          idConvertido: contaId,
          error,
          status: error?.response?.status,
          statusText: error?.response?.statusText,
          data: error?.response?.data,
          message: error?.message,
          payloadEnviado: payload,
          payloadJSON: JSON.stringify(payload, null, 2),
          stack: error?.stack,
        });
        
        // Tentar extrair mais informações do erro
        if (error?.response?.data) {
          console.error('📋 [FinanceiroService] Detalhes do erro do backend:', {
            errorData: error.response.data,
            errorDataJSON: JSON.stringify(error.response.data, null, 2),
            errorMessage: error.response.data?.message,
            errorError: error.response.data?.error,
            errorErrors: error.response.data?.errors,
          });
        }
      }
      throw error;
    }
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

  async getDashboardResumo(): Promise<ResumoFinanceiro> {
    return apiClient.get<ResumoFinanceiro>('/contas-financeiras/dashboard/resumo');
  }

  async getTotalRecebido(): Promise<{ totalRecebido: number }> {
    const response = await apiClient.get<{ totalRecebido: number }>('/contas-financeiras/dashboard/total-recebido');
    
    // Debug: log para verificar resposta do backend
    if (import.meta.env.DEV) {
      console.log('[FinanceiroService] getTotalRecebido resposta:', {
        response,
        totalRecebido: response?.totalRecebido,
        tipo: typeof response?.totalRecebido,
        aviso: response?.totalRecebido === 0 
          ? '⚠️ Backend retornou 0. Verificar se há baixas de duplicatas registradas.' 
          : response?.totalRecebido === undefined
          ? '⚠️ Campo totalRecebido não encontrado na resposta'
          : '✅ Valor recebido corretamente',
      });
    }
    
    return response;
  }
}

export const financeiroService = new FinanceiroService();

