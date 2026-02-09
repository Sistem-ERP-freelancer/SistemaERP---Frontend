import {
    PagarDuplicataModal,
    type DuplicataParaBaixa,
} from '@/components/duplicatas/PagarDuplicataModal';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import { duplicatasService } from '@/services/duplicatas.service';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, DollarSign, FileText, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

const STATUS_LABELS: Record<string, string> = {
  ABERTA: 'Aberta',
  PARCIAL: 'Parcial',
  BAIXADA: 'Quitada',
  CANCELADA: 'Cancelada',
};

const STATUS_COLORS: Record<string, string> = {
  ABERTA: 'bg-slate-500/10 text-slate-600',
  PARCIAL: 'bg-amber-500/10 text-amber-600',
  BAIXADA: 'bg-green-500/10 text-green-600',
  CANCELADA: 'bg-red-500/10 text-red-600',
};

const FORMAS_PAGAMENTO_LABELS: Record<string, string> = {
  DINHEIRO: 'Dinheiro',
  PIX: 'PIX',
  CARTAO_CREDITO: 'Cartão de Crédito',
  CARTAO_DEBITO: 'Cartão de Débito',
  BOLETO: 'Boleto',
  TRANSFERENCIA: 'Transferência',
  CHEQUE: 'Cheque',
};

function formatarDataBR(data?: string): string {
  if (!data) return '—';
  try {
    return new Date(data).toLocaleDateString('pt-BR');
  } catch {
    return data;
  }
}

function formatarFormaPagamento(forma?: string): string {
  if (!forma) return '—';
  return FORMAS_PAGAMENTO_LABELS[forma] || forma;
}

const ContasAReceberDuplicatasParcela = () => {
  const { clienteId } = useParams<{ clienteId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [darBaixaOpen, setDarBaixaOpen] = useState(false);
  const [duplicataParaBaixa, setDuplicataParaBaixa] =
    useState<DuplicataParaBaixa | null>(null);

  const state = location.state as {
    parcela?: {
      numero_parcela?: number;
      total_parcelas?: number;
      valor?: number;
      valor_aberto?: number;
    };
    pedido_id?: number;
    parcela_pedido_id?: number;
    numeroPedido?: string;
    cliente?: string;
  };

  const parcelaPedidoId = state?.parcela_pedido_id;
  const parcelaLabel =
    state?.parcela?.numero_parcela != null && state?.parcela?.total_parcelas != null
      ? `${state.parcela.numero_parcela}/${state.parcela.total_parcelas}`
      : '';
  const valorParcela = state?.parcela?.valor ?? 0;
  const valorAberto = state?.parcela?.valor_aberto ?? 0;

  const { data: duplicatas, isLoading } = useQuery({
    queryKey: ['duplicatas', 'parcela', parcelaPedidoId],
    queryFn: () =>
      duplicatasService.listar({
        parcela_pedido_id: parcelaPedidoId!,
      }),
    enabled: !!parcelaPedidoId,
  });

  const handleDarBaixa = (dup: {
    id: number;
    numero?: string;
    valor_original: number;
    valor_aberto?: number;
  }) => {
    if ((dup.valor_aberto ?? 0) <= 0) return;
    setDuplicataParaBaixa({
      id: dup.id,
      numero: dup.numero,
      valor_original: dup.valor_original,
      valor_aberto: dup.valor_aberto ?? 0,
    });
    setDarBaixaOpen(true);
  };

  const handlePagarParcela = () => {
    if (!state?.pedido_id || !parcelaPedidoId) return;
    navigate(
      `/contas-a-receber/clientes/${clienteId}/pagar/${state.pedido_id}/${parcelaPedidoId}`,
      {
        state: {
          parcela: state.parcela,
          parcela_pedido_id: parcelaPedidoId,
          cliente: state.cliente,
          numeroPedido: state.numeroPedido,
        },
      }
    );
  };

  const cabecalhoTexto =
    parcelaLabel && state?.numeroPedido
      ? `Duplicatas da parcela ${parcelaLabel} do pedido ${state.numeroPedido} — Valor da parcela: ${formatCurrency(valorParcela)} — Em aberto: ${formatCurrency(valorAberto)}`
      : 'Duplicatas da parcela';

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/contas-a-receber/clientes/${clienteId}`)}
          className="mb-2 -ml-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-2">{cabecalhoTexto}</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Duplicatas = títulos de cobrança vinculados a esta parcela. Uma parcela pode ter várias duplicatas.
          </p>

          <div className="flex flex-wrap gap-2 mt-4 mb-6">
            <Button variant="outline" size="sm" onClick={() => navigate(`/contas-a-receber/clientes/${clienteId}`)}>
              Fechar
            </Button>
            {(valorAberto > 0) && (
              <Button size="sm" onClick={handlePagarParcela}>
                <DollarSign className="w-4 h-4 mr-2" />
                Pagar parcela (criar duplicatas)
              </Button>
            )}
          </div>

          {!parcelaPedidoId ? (
            <div className="py-12 text-center border rounded-lg border-dashed">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground/50" />
              <p className="mt-2 text-muted-foreground">
                Parcela não identificada. Volte e selecione uma parcela.
              </p>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : !duplicatas?.length ? (
            <div className="py-12 text-center border rounded-lg border-dashed">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground/50" />
              <p className="mt-2 text-muted-foreground">
                Nenhuma duplicata encontrada para esta parcela.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Crie duplicatas em &quot;Criar duplicatas (para esta parcela)&quot; no menu de ações.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Número</TableHead>
                  <TableHead className="w-[120px] text-right">Valor</TableHead>
                  <TableHead className="w-[140px]">Forma pagamento</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="w-[100px] text-center">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {duplicatas.map((dup) => {
                  const podePagar =
                    (dup.valor_aberto ?? 0) > 0 && dup.status !== 'CANCELADA';
                  return (
                    <TableRow key={dup.id}>
                      <TableCell className="font-medium">
                        {dup.numero ?? `#${dup.id}`}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(dup.valor_original)}
                      </TableCell>
                      <TableCell>
                        {formatarFormaPagamento(dup.forma_pagamento)}
                      </TableCell>
                      <TableCell>
                        {formatarDataBR(dup.data_vencimento)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${
                            STATUS_COLORS[dup.status ?? 'ABERTA'] ?? 'bg-slate-500/10'
                          }`}
                        >
                          {STATUS_LABELS[dup.status ?? 'ABERTA'] ?? dup.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {podePagar ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDarBaixa(dup)}
                          >
                            Pagar
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>

        <PagarDuplicataModal
          open={darBaixaOpen}
          onOpenChange={setDarBaixaOpen}
          duplicata={duplicataParaBaixa}
          onSuccess={() => {
            queryClient.invalidateQueries({
              queryKey: ['duplicatas', 'parcela', parcelaPedidoId],
            });
            queryClient.invalidateQueries({
              queryKey: ['duplicatas', 'agrupadas-por-pedido', clienteId],
            });
            queryClient.invalidateQueries({
              queryKey: ['contas-receber', 'detalhe', clienteId],
            });
            queryClient.invalidateQueries({
              queryKey: ['dashboard-receber'],
            });
            toast.success('Pagamento registrado com sucesso.');
          }}
        />
      </div>
    </AppLayout>
  );
};

export default ContasAReceberDuplicatasParcela;
