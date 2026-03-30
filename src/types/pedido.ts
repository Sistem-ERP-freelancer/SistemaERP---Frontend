export type TipoPedido = 'VENDA' | 'COMPRA';

/** Status do pedido (valores da API). Exibição: Pendente, Aberto, Quitado, Cancelado. */
export type StatusPedido =
  | 'ABERTO'     // exibe "Pendente" — acabou de criar, nada pago
  | 'PARCIAL'    // exibe "Aberto" — pedido em aberto (parte paga)
  | 'QUITADO'    // exibe "Quitado" — concluído
  | 'CANCELADO'; // exibe "Cancelado"

export type FormaPagamento = 
  | 'DINHEIRO'
  | 'PIX'
  | 'CARTAO_CREDITO'
  | 'CARTAO_DEBITO'
  | 'BOLETO'
  | 'TRANSFERENCIA'
  | 'CHEQUE';

export type FormaPagamentoEstrutural = 
  | 'AVISTA'
  | 'PARCELADO'
  | 'BOLETO_DESCONTADO';

export interface PedidoItem {
  id?: number;
  produto_id: number;
  produto?: {
    id: number;
    nome: string;
    sku: string;
    preco_venda?: number;
  };
  quantidade: number;
  preco_unitario: number;
  desconto?: number;
  subtotal?: number;
}

export interface Pedido {
  id: number;
  numero_pedido: string;
  tipo: TipoPedido;
  status: StatusPedido;
  cliente_id?: number;
  cliente?: {
    id: number;
    nome: string;
    cpf_cnpj?: string;
    email?: string;
    telefone?: string;
  };
  fornecedor_id?: number;
  fornecedor?: {
    id: number;
    nome_fantasia?: string;
    nome_razao?: string;
    cpf_cnpj?: string;
    email?: string;
    telefone?: string;
  };
  transportadora_id?: number;
  transportadora?: {
    id: number;
    nome: string;
    cnpj?: string;
  };
  usuario_criacao_id?: string;
  usuario_atualizacao_id?: string;
  data_pedido: string;
  data_entrega_prevista?: string;
  data_entrega_realizada?: string;
  data_vencimento_base?: string | null; // Data de vencimento base para cálculo de parcelas
  condicao_pagamento?: string;
  forma_pagamento?: FormaPagamento;
  forma_pagamento_estrutural?: FormaPagamentoEstrutural;
  quantidade_parcelas?: number;
  valor_adiantado?: number | null;
  prazo_entrega_dias?: number;
  subtotal: number;
  desconto_valor: number;
  desconto_percentual: number;
  frete: number;
  outras_taxas: number;
  valor_total: number;
  observacoes_internas?: string;
  observacoes_cliente?: string;
  itens: PedidoItem[];
  created_at?: string;
  updated_at?: string;
}

export interface CreatePedidoDto {
  tipo: TipoPedido;
  status?: StatusPedido;
  cliente_id?: number;
  fornecedor_id?: number;
  transportadora_id?: number;
  data_pedido: string;
  data_entrega_prevista?: string;
  condicao_pagamento?: string;
  data_vencimento?: string; // Data de vencimento para as contas financeiras do pedido
  data_vencimento_base?: string; // Data base para primeiro vencimento (parcelas mensais)
  forma_pagamento?: FormaPagamento; // Opcional - forma real será informada no pagamento
  forma_pagamento_estrutural?: FormaPagamentoEstrutural; // AVISTA, PARCELADO, BOLETO_DESCONTADO
  quantidade_parcelas?: number; // 1 a 12 para PARCELADO; BOLETO_DESCONTADO não usa parcelas
  valor_adiantado?: number; // Obrigatório se BOLETO_DESCONTADO (0 < valor < valor_total)
  taxa_desconto?: number; // Opcional (antecipação bancária)
  taxa_desconto_percentual?: boolean; // true = %, false = valor fixo. Default true
  data_antecipacao?: string; // Opcional (YYYY-MM-DD)
  instituicao_financeira?: string; // Opcional, até 200 caracteres
  prazo_entrega_dias?: number;
  subtotal?: number;
  desconto_valor?: number;
  desconto_percentual?: number;
  frete?: number;
  outras_taxas?: number;
  observacoes_internas?: string;
  observacoes_cliente?: string;
  itens: Array<{
    produto_id: number;
    quantidade: number;
    preco_unitario: number;
    desconto?: number;
  }>;
}

/** Payload para PATCH alterar condição (à vista → parcelado). Backend recalcula e cria parcelas. */
export interface AtualizarCondicaoPagamentoPayload {
  condicao_pagamento: string; // "À vista" | "2x" … "12x" | "30/60/90"
  data_vencimento_base?: string; // "YYYY-MM-DD" – opcional; se não enviar usa data_pedido
  forma_pagamento?: FormaPagamento;
}

export interface FiltrosPedidos {
  id?: number;
  numero_pedido?: string;
  /** Busca por número do pedido, cliente ou fornecedor (enviado como param único no backend) */
  busca?: string;
  tipo?: TipoPedido;
  status?: StatusPedido;
  cliente_id?: number;
  cliente_nome?: string;
  fornecedor_id?: number;
  fornecedor_nome?: string;
  data_inicial?: string;
  data_final?: string;
  page?: number;
  limit?: number;
}

export interface PedidosResponse {
  data: Pedido[];
  total: number;
  page: number;
  limit: number;
}

export interface DashboardPedidos {
  // 🔹 BLOCO 1 — Financeiro VENDA (valores)
  faturamento_confirmado_venda: {
    valor: number;        // R$ total faturado em vendas
    quantidade: number;   // Quantidade de pedidos de venda concluídos
  };
  valor_em_aberto_venda: {
    valor: number;        // R$ total em aberto de vendas
    quantidade: number;   // Quantidade de pedidos de venda em aberto
  };
  
  // 🔹 BLOCO 1 — Financeiro COMPRA (valores)
  compras_confirmadas: {
    valor: number;        // R$ total de compras confirmadas
    quantidade: number;   // Quantidade de pedidos de compra concluídos
  };
  compras_em_aberto: {
    valor: number;        // R$ total de compras em aberto
    quantidade: number;   // Quantidade de pedidos de compra em aberto
  };
  
  // 🔹 BLOCO 2 — Operacional (quantidade)
  pedidos_em_andamento: {
    quantidade: number;  // Total de pedidos em andamento (ABERTO + PARCIAL)
    detalhes: {
      pendente: number;   // Status: ABERTO
      parcial: number;    // Status: PARCIAL
    };
  };
  pedidos_concluidos: {
    quantidade: number;  // Total de pedidos concluídos (VENDA + COMPRA)
  };
  pedidos_cancelados: {
    quantidade: number;  // Total de pedidos cancelados (VENDA + COMPRA)
  };
}

