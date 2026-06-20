export type StatusNotaFiscal =
  | 'created'
  | 'enqueued'
  | 'received'
  | 'authorized'
  | 'inContingent'
  | 'rejected'
  | 'canceled'
  | 'denied'
  | 'removed'
  | 'disabled';

export interface NotaFiscal {
  id: number;
  pedido_id?: number;
  pedidoId?: number;
  spedy_order_id?: string | null;
  spedyOrderId?: string | null;
  spedy_invoice_id?: string | null;
  spedyInvoiceId?: string | null;
  transaction_id?: string | null;
  transactionId?: string | null;
  integration_id?: string | null;
  integrationId?: string | null;
  status: StatusNotaFiscal;
  numero_nf?: number | null;
  numeroNf?: number | null;
  serie?: string | null;
  chave_acesso?: string | null;
  chaveAcesso?: string | null;
  protocolo?: string | null;
  mensagem_processamento?: string | null;
  mensagemProcessamento?: string | null;
  codigo_processamento?: string | null;
  codigoProcessamento?: string | null;
  ambiente?: string | null;
  modelo?: string | null;
  valor_total?: number | null;
  valorTotal?: number | null;
  emitida_em?: string | null;
  emitidaEm?: string | null;
}

export const STATUS_NOTA_FISCAL_LABELS: Record<StatusNotaFiscal, string> = {
  created: 'Criada',
  enqueued: 'Enfileirada',
  received: 'Recebida',
  authorized: 'Autorizada',
  inContingent: 'Contingência',
  rejected: 'Rejeitada',
  canceled: 'Cancelada',
  denied: 'Denegada',
  removed: 'Removida',
  disabled: 'Inutilizada',
};

export const STATUS_NOTA_BLOQUEIA_REEMISSAO: StatusNotaFiscal[] = [
  'authorized',
  'enqueued',
  'received',
  'inContingent',
];

export type SecaoNotaFiscal =
  | 'empresa'
  | 'integracao'
  | 'pedido'
  | 'cliente'
  | 'endereco'
  | 'produto';

export interface CampoFaltanteNotaFiscal {
  campo: string;
  label: string;
  secao: SecaoNotaFiscal;
  produto_id?: number;
}

export interface NotaFiscalPreEmissaoEndereco {
  id?: number | null;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string | null;
  bairro: string;
  cidade: string;
  estado: string;
  codigo_ibge?: string | null;
}

export interface NotaFiscalPreEmissaoCliente {
  id: number;
  nome: string;
  nome_fantasia?: string | null;
  nome_razao?: string | null;
  cpf_cnpj: string;
  inscricao_estadual?: string | null;
  email?: string | null;
  telefone?: string | null;
  endereco: NotaFiscalPreEmissaoEndereco | null;
}

export interface NotaFiscalPreEmissaoItem {
  produto_id: number;
  nome: string;
  sku?: string | null;
  ncm: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
}

export interface NotaFiscalPreEmissao {
  pedido: {
    id: number;
    numero_pedido: string;
    tipo: string;
    status: string;
    valor_total: number;
    data_pedido: string;
    forma_pagamento?: string | null;
  };
  empresa: {
    cnpj: string;
    nome?: string | null;
  };
  spedy_configurado: boolean;
  nota_existente?: {
    status: StatusNotaFiscal;
    numero_nf?: number | null;
    bloqueia_reemissao: boolean;
  } | null;
  cliente: NotaFiscalPreEmissaoCliente | null;
  itens: NotaFiscalPreEmissaoItem[];
  campos_faltantes: CampoFaltanteNotaFiscal[];
  pode_emitir: boolean;
}

export interface EmitirNotaFiscalPayload {
  cliente?: {
    nome?: string;
    nome_fantasia?: string;
    nome_razao?: string;
    cpf_cnpj?: string;
    inscricao_estadual?: string;
    email?: string;
    telefone?: string;
  };
  endereco?: NotaFiscalPreEmissaoEndereco;
  produtos?: Array<{ produto_id: number; ncm?: string; sku?: string }>;
}
