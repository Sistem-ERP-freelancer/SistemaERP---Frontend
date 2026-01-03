export type TipoPedido = 'VENDA' | 'COMPRA';

export type StatusPedido = 
  | 'PENDENTE'
  | 'CONFIRMADO'
  | 'EM_SEPARACAO'
  | 'ENVIADO'
  | 'ENTREGUE'
  | 'CANCELADO';

export type FormaPagamento = 
  | 'DINHEIRO'
  | 'PIX'
  | 'CARTAO_CREDITO'
  | 'CARTAO_DEBITO'
  | 'BOLETO'
  | 'TRANSFERENCIA';

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
  condicao_pagamento?: string;
  forma_pagamento?: FormaPagamento;
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
  cliente_id?: number;
  fornecedor_id?: number;
  transportadora_id?: number;
  data_pedido: string;
  data_entrega_prevista?: string;
  condicao_pagamento?: string;
  forma_pagamento?: FormaPagamento;
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

export interface FiltrosPedidos {
  id?: number;
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

