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
