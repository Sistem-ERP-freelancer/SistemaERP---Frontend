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
import { formatCurrency, formatarDataBR, formatarFormaPagamento, formatarStatus } from '@/lib/utils';
import { pedidosService } from '@/services/pedidos.service';
import type { ItemHistoricoPagamento } from '@/types/pedido-financeiro.types';
import { useQueries } from '@tanstack/react-query';
import { ArrowLeft, DollarSign, FileText, Loader2, User } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

const FORMA_ESTRUTURAL_LABELS: Record<string, string> = {
  AVISTA: 'À Vista',
  PARCELADO: 'Parcelado',
  BOLETO_DESCONTADO: 'Boleto Descontado',
};

const ContasAReceberPedidoDetalhes = () => {
  const { pedidoId } = useParams<{ pedidoId: string }>();
  const navigate = useNavigate();
  const id = pedidoId ? Number(pedidoId) : 0;

  const [pedidoQuery, resumoQuery, pagamentosQuery] = useQueries({
    queries: [
      {
        queryKey: ['pedidos', pedidoId],
        queryFn: () => pedidosService.buscarPorId(id),
        enabled: !!id,
      },
      {
        queryKey: ['pedidos', pedidoId, 'resumo-financeiro'],
        queryFn: () => pedidosService.getResumoFinanceiro(id),
        enabled: !!id,
        retry: false,
      },
      {
        queryKey: ['pedidos', pedidoId, 'pagamentos'],
        queryFn: () => pedidosService.listarPagamentosPedido(id),
        enabled: !!id,
        retry: false,
      },
    ],
  });

  const pedido = pedidoQuery.data;
  const resumoRaw = resumoQuery.data;
  const pagamentosNovo = pagamentosQuery.data;

  const isLoading = pedidoQuery.isLoading || resumoQuery.isLoading;
  const error = pedidoQuery.error || resumoQuery.error;
  const resumo = resumoRaw ?? null;
  const pagamentos: ItemHistoricoPagamento[] = Array.isArray(pagamentosNovo) ? pagamentosNovo : [];

  const fallbackFinanceiro = resumoQuery.isError && !resumo;

  const [legadoQuery] = useQueries({
    queries: [
      {
        queryKey: ['pedidos', pedidoId, 'financeiro-legado'],
        queryFn: () => pedidosService.buscarPorIdComFinanceiro(id),
        enabled: !!id && !!fallbackFinanceiro,
      },
    ],
  });

  const legado = legadoQuery.data as any;
  const resumoFinal = resumo ?? (legado?.resumo_financeiro ? {
    valor_total: legado.resumo_financeiro.valor_total ?? 0,
    valor_pago: legado.resumo_financeiro.valor_pago ?? 0,
    valor_em_aberto: legado.resumo_financeiro.valor_em_aberto ?? 0,
    status: (legado.resumo_financeiro as any).status ?? 'ABERTO',
    data_vencimento: (legado.resumo_financeiro as any).data_vencimento ?? null,
  } : null);

  const historicoPagamentos: ItemHistoricoPagamento[] = pagamentos.length > 0
    ? pagamentos
    : (legado?.parcelas
      ? (legado.parcelas as any[]).flatMap((p: any) => (p.pagamentos || []).map((pg: any) => ({
          id: pg.id,
          valor: pg.valor_pago ?? 0,
          forma_pagamento: pg.forma_pagamento ?? '',
          data_pagamento: pg.data_lancamento ?? pg.data_pagamento ?? '',
        })))
      : []);

  const loadingLegado = fallbackFinanceiro && legadoQuery.isLoading;
  const isLoadingAny = isLoading || (fallbackFinanceiro && loadingLegado);
  const errorAny = error && !fallbackFinanceiro ? error : (fallbackFinanceiro && !legadoQuery.isLoading && legadoQuery.isError ? legadoQuery.error : null);
  const semDados = !pedido || !resumoFinal;

  if (isLoadingAny) {
    return (
      <AppLayout>
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (errorAny || semDados) {
    return (
      <AppLayout>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/contas-a-receber')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Detalhes do Pedido</h1>
            </div>
          </div>
          <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
            <p className="font-medium">Erro ao carregar detalhes do pedido</p>
            <p className="text-sm mt-1">
              {errorAny instanceof Error ? errorAny.message : 'Tente novamente mais tarde.'}
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const formaEstrutural = (pedido as any)?.forma_pagamento_estrutural || 'AVISTA';

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/contas-a-receber')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Detalhes do Pedido</h1>
              <p className="text-muted-foreground">{pedido!.numero_pedido}</p>
            </div>
          </div>
          {resumoFinal!.valor_em_aberto > 0 && (
            <Button onClick={() => navigate(`/financeiro/contas-receber/${pedidoId}/pagamentos`)}>
              <DollarSign className="w-4 h-4 mr-2" />
              Pagamentos
            </Button>
          )}
        </div>

        <div className="bg-card border rounded-lg p-6 space-y-6">
          <h2 className="text-lg font-semibold border-b pb-2">Informações do Pedido</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <User className="w-4 h-4" />
                Cliente
              </div>
              <div className="font-medium">{pedido!.cliente?.nome || pedido!.cliente_id || '—'}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Nº Pedido
              </div>
              <div className="font-medium">{pedido!.numero_pedido}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Forma</div>
              <div className="font-medium">{FORMA_ESTRUTURAL_LABELS[formaEstrutural] || formaEstrutural}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Status financeiro</div>
              <div className="font-medium">{resumoFinal!.status}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Valor Total</div>
              <div className="text-xl font-bold text-primary">{formatCurrency(resumoFinal!.valor_total)}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Total Pago</div>
              <div className="text-xl font-bold text-green-600">{formatCurrency(resumoFinal!.valor_pago)}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Valor em Aberto</div>
              <div className="text-xl font-bold text-amber-600">{formatCurrency(resumoFinal!.valor_em_aberto)}</div>
            </div>
            {resumoFinal!.data_vencimento && (
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Vencimento</div>
                <div className="font-medium">{formatarDataBR(resumoFinal!.data_vencimento)}</div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-card border rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">Histórico de Pagamentos</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Forma</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historicoPagamentos.length > 0 ? (
                [...historicoPagamentos]
                  .sort((a, b) => new Date(b.data_pagamento).getTime() - new Date(a.data_pagamento).getTime())
                  .map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{formatarDataBR(item.data_pagamento)}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(item.valor)}</TableCell>
                      <TableCell>{formatarFormaPagamento(item.forma_pagamento)}</TableCell>
                    </TableRow>
                  ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                    Nenhum pagamento registrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppLayout>
  );
};

export default ContasAReceberPedidoDetalhes;
