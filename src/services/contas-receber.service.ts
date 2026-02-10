import { apiClient } from './api';

export interface ClienteComDuplicatas {
  cliente_id: number;
  cliente_nome: string;
  total_aberto: number;
  parcelas_aberto: number;
  maior_atraso_dias: number;
}

export interface ParcelaDetalhe {
  id: number;
  /** ID da parcela do pedido (tb_parcela_pedido) - usar na URL confirmar-pagamento. Vem do endpoint detalhe. */
  parcela_id?: number;
  pedido_id: number;
  numero_pedido: string;
  numero_parcela: number;
  total_parcelas: number;
  valor: number;
  valor_pago: number;
  valor_aberto: number;
  status: 'ABERTA' | 'PARCIALMENTE_PAGA' | 'PAGA' | 'EM_COMPENSACAO';
  data_vencimento: string;
}

export interface ClienteDetalheResponse {
  cliente: {
    id: number;
    nome: string;
    documento?: string;
    cpf_cnpj?: string;
    limite_credito?: number;
  };
  parcelas: ParcelaDetalhe[];
}

export type FormaPagamentoBlueprint =
  | 'DINHEIRO'
  | 'PIX'
  | 'CARTAO_CREDITO'
  | 'CARTAO_DEBITO'
  | 'BOLETO'
  | 'TRANSFERENCIA'
  | 'CHEQUE';

export interface DuplicataConfirmarItem {
  valor: number;
  forma_pagamento: FormaPagamentoBlueprint;
  data_vencimento: string;
}

export interface ConfirmarPagamentoPayload {
  duplicatas: DuplicataConfirmarItem[];
}

export interface CriarDuplicatasResponse {
  parcela: {
    id: number;
    pedido_id: number;
    numero_parcela: number;
    valor: number;
    valor_pago: number;
    status: string;
    data_vencimento: string;
  };
  duplicatas: Array<{
    id: number;
    numero: string;
    cliente_id: number;
    pedido_id?: number;
    parcela_pedido_id?: number;
    valor_original: number;
    valor_aberto: number;
    data_emissao: string;
    data_vencimento: string;
    status: string;
    forma_pagamento?: string;
  }>;
}

class ContasReceberService {
  /**
   * GET /pedidos/contas-receber
   * Lista pedidos com valor em aberto (cada linha = 1 pedido)
   * Substitui o endpoint antigo /duplicatas/contas-receber/clientes
   */
  async listarContasReceber(params?: {
    codigo?: string;
    cliente_id?: number;
    cliente_nome?: string;
    valor_inicial?: number;
    valor_final?: number;
    forma_pagamento?: string;
    situacao?: 'em_aberto' | 'em_atraso' | 'concluido';
    data_inicial?: string;
    data_final?: string;
  }): Promise<Array<{
    pedido_id: number;
    numero_pedido: string;
    cliente_id: number;
    cliente_nome: string;
    valor_total: number;
    valor_em_aberto: number;
    forma_pagamento: string;
    status: string;
    data_pedido: string;
  }>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.codigo) queryParams.append('codigo', params.codigo);
      if (params?.cliente_id) queryParams.append('cliente_id', params.cliente_id.toString());
      if (params?.cliente_nome) queryParams.append('cliente_nome', params.cliente_nome);
      if (params?.valor_inicial) queryParams.append('valor_inicial', params.valor_inicial.toString());
      if (params?.valor_final) queryParams.append('valor_final', params.valor_final.toString());
      if (params?.forma_pagamento) queryParams.append('forma_pagamento', params.forma_pagamento);
      if (params?.situacao) queryParams.append('situacao', params.situacao);
      if (params?.data_inicial) queryParams.append('data_inicial', params.data_inicial);
      if (params?.data_final) queryParams.append('data_final', params.data_final);

      const query = queryParams.toString();
      const response = await apiClient.get<Array<{
        pedido_id: number;
        numero_pedido: string;
        cliente_id: number;
        cliente_nome: string;
        valor_total: number;
        valor_em_aberto: number;
        forma_pagamento: string;
        status: string;
        data_pedido: string;
      }>>(`/pedidos/contas-receber${query ? `?${query}` : ''}`);
      
      return Array.isArray(response) ? response : [];
    } catch {
      return [];
    }
  }

  /**
   * @deprecated Use listarContasReceber() ao invés deste método
   * Mantido apenas para compatibilidade temporária
   */
  async listarClientesComDuplicatas(): Promise<ClienteComDuplicatas[]> {
    try {
      // Usar o novo endpoint e transformar para o formato antigo (compatibilidade)
      const pedidos = await this.listarContasReceber({ situacao: 'em_aberto' });
      
      // Agrupar por cliente para manter compatibilidade
      const clientesMap = new Map<number, ClienteComDuplicatas>();
      
      pedidos.forEach(pedido => {
        if (!clientesMap.has(pedido.cliente_id)) {
          clientesMap.set(pedido.cliente_id, {
            cliente_id: pedido.cliente_id,
            cliente_nome: pedido.cliente_nome,
            total_aberto: 0,
            parcelas_aberto: 0,
            maior_atraso_dias: 0,
          });
        }
        
        const cliente = clientesMap.get(pedido.cliente_id)!;
        cliente.total_aberto += pedido.valor_em_aberto;
        cliente.parcelas_aberto += 1;
      });
      
      return Array.from(clientesMap.values());
    } catch {
      return [];
    }
  }

  /**
   * GET /duplicatas/contas-receber/clientes/:clienteId/detalhe
   * Detalhes do cliente com parcelas (Tela 2)
   */
  async obterDetalheCliente(clienteId: number): Promise<ClienteDetalheResponse | null> {
    try {
      return await apiClient.get<ClienteDetalheResponse>(
        `/duplicatas/contas-receber/clientes/${clienteId}/detalhe`
      );
    } catch {
      return null;
    }
  }

  /**
   * POST /pedidos/:pedidoId/parcelas/:parcelaId/confirmar-pagamento
   * Confirma pagamento da parcela com múltiplas duplicatas (cria e quita em uma chamada)
   */
  async confirmarPagamentoParcela(
    pedidoId: number,
    parcelaId: number,
    payload: ConfirmarPagamentoPayload
  ): Promise<unknown> {
    return apiClient.post(
      `/pedidos/${pedidoId}/parcelas/${parcelaId}/confirmar-pagamento`,
      payload
    );
  }

  /**
   * POST /pedidos/:pedidoId/parcelas/:parcelaId/criar-duplicatas
   * Cria duplicatas sem quitar (status ABERTA)
   */
  async criarDuplicatasParcela(
    pedidoId: number,
    parcelaId: number,
    payload: ConfirmarPagamentoPayload
  ): Promise<CriarDuplicatasResponse> {
    return apiClient.post<CriarDuplicatasResponse>(
      `/pedidos/${pedidoId}/parcelas/${parcelaId}/criar-duplicatas`,
      payload
    );
  }
}

export const contasReceberService = new ContasReceberService();
