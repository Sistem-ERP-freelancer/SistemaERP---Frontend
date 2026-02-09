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
   * GET /duplicatas/contas-receber/clientes
   * Lista clientes com totais em aberto (Tela 1). API não aceita parâmetros de filtro.
   */
  async listarClientesComDuplicatas(): Promise<ClienteComDuplicatas[]> {
    try {
      const response = await apiClient.get<ClienteComDuplicatas[] | { data: ClienteComDuplicatas[] }>(
        '/duplicatas/contas-receber/clientes'
      );
      const data = Array.isArray(response) ? response : response?.data;
      return data || [];
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
