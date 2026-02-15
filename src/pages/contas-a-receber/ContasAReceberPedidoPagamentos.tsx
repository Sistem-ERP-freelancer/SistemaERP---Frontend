import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '@/lib/utils';
import { pagamentosService } from '@/services/pagamentos.service';
import { pedidosService } from '@/services/pedidos.service';
import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, DollarSign, Loader2, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

const FORMAS_PAGAMENTO = [
  { value: 'DINHEIRO', label: 'Dinheiro' },
  { value: 'PIX', label: 'PIX' },
  { value: 'CARTAO_CREDITO', label: 'Cartão de Crédito' },
  { value: 'CARTAO_DEBITO', label: 'Cartão de Débito' },
  { value: 'BOLETO', label: 'Boleto' },
  { value: 'TRANSFERENCIA', label: 'Transferência' },
  { value: 'CHEQUE', label: 'Cheque' },
] as const;

const ContasAReceberPedidoPagamentos = () => {
  const { pedidoId } = useParams<{ pedidoId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const id = pedidoId ? Number(pedidoId) : 0;

  const [valorPago, setValorPago] = useState<number | ''>('');
  const [dataPagamento, setDataPagamento] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formaPagamento, setFormaPagamento] = useState<string>('');
  const [observacoes, setObservacoes] = useState<string>('');

  const [pedidoQuery, resumoQuery] = useQueries({
    queries: [
      { queryKey: ['pedidos', pedidoId], queryFn: () => pedidosService.buscarPorId(id), enabled: !!id },
      { queryKey: ['pedidos', pedidoId, 'resumo-financeiro'], queryFn: () => pedidosService.getResumoFinanceiro(id), enabled: !!id, retry: false },
    ],
  });

  const pedido = pedidoQuery.data;
  const resumo = resumoQuery.data;
  const resumoErro = resumoQuery.isError;

  const legadoQuery = useQueries({
    queries: [
      {
        queryKey: ['pedidos', pedidoId, 'financeiro-legado'],
        queryFn: () => pedidosService.buscarPorIdComFinanceiro(id),
        enabled: !!id && !!resumoErro,
      },
    ],
  });
  const legado = legadoQuery[0]?.data as any;

  const valorEmAberto = resumo?.valor_em_aberto ?? legado?.resumo_financeiro?.valor_em_aberto ?? 0;
  const valorTotal = resumo?.valor_total ?? legado?.resumo_financeiro?.valor_total ?? 0;
  const valorPagoAtual = resumo?.valor_pago ?? legado?.resumo_financeiro?.valor_pago ?? 0;
  const status = resumo?.status ?? legado?.resumo_financeiro?.status;
  const estaQuitado = status === 'QUITADO' || valorEmAberto <= 0;
  const numeroPedido = pedido?.numero_pedido ?? legado?.pedido?.numero_pedido ?? `#${id}`;
  const clienteNome = pedido?.cliente?.nome ?? legado?.pedido?.cliente?.nome ?? legado?.pedido?.cliente_id ?? '—';

  const ehPagamentoAdiantamento = !!(resumo as any)?.eh_pagamento_adiantamento;
  const valorAdiantadoResumo = (resumo as any)?.valor_adiantado ?? null;
  const mensagemAdiantamento = (resumo as any)?.mensagem_adiantamento ?? null;

  const autoFilledRef = useRef(false);
  useEffect(() => {
    if (autoFilledRef.current) return;
    if (valorEmAberto > 0 && valorPago === '') {
      if (ehPagamentoAdiantamento && valorAdiantadoResumo != null && Number(valorAdiantadoResumo) > 0) {
        setValorPago(Number(valorAdiantadoResumo));
      } else {
        setValorPago(valorEmAberto);
      }
      autoFilledRef.current = true;
    }
  }, [valorEmAberto, valorPago, ehPagamentoAdiantamento, valorAdiantadoResumo]);

  const registrarMutation = useMutation({
    mutationFn: async () => {
      if (!pedidoId || !id) throw new Error('ID do pedido não encontrado');
      const valor = Number(valorPago);
      if (!valor || valor <= 0) throw new Error('Informe o valor pago');
      if (!formaPagamento) throw new Error('Selecione a forma de pagamento');
      if (valor > valorEmAberto) throw new Error('Valor não pode ser maior que o valor em aberto');
      return pedidosService.registrarPagamentoPedido(id, {
        valor,
        forma_pagamento: formaPagamento,
        data_pagamento: dataPagamento,
        ...(observacoes?.trim() ? { observacoes: observacoes.trim() } : {}),
        ...(ehPagamentoAdiantamento ? { tipo_lancamento: 'ADIANTAMENTO' } : {}),
      });
    },
    onSuccess: () => {
      toast.success('Pagamento registrado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['pedidos', pedidoId] });
      queryClient.invalidateQueries({ queryKey: ['pedidos', 'contas-receber'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-receber'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'unificado'] });
      setTimeout(() => navigate(`/financeiro/contas-receber/${pedidoId}`), 1000);
    },
    onError: (error: any) => {
      if (error?.response?.status === 404 || error?.response?.status === 501) {
        registrarFallback.mutate();
        return;
      }
      toast.error(error?.response?.data?.message || 'Erro ao registrar pagamento');
    },
  });

  const registrarFallback = useMutation({
    mutationFn: async () => {
      if (!pedidoId) throw new Error('ID do pedido não encontrado');
      return pagamentosService.criar({
        pedido_id: id,
        conta_financeira_id: legado?.conta_financeira?.id,
        valor_pago: Number(valorPago),
        forma_pagamento: formaPagamento as any,
        data_lancamento: dataPagamento,
        data_pagamento: dataPagamento,
        observacoes: observacoes || undefined,
      });
    },
    onSuccess: () => {
      toast.success('Pagamento registrado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['pedidos', pedidoId] });
      queryClient.invalidateQueries({ queryKey: ['pedidos', 'contas-receber'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-receber'] });
      setTimeout(() => navigate(`/financeiro/contas-receber/${pedidoId}`), 1000);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erro ao registrar pagamento');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registrarMutation.mutate();
  };

  const isLoading = pedidoQuery.isLoading || (resumoQuery.isLoading && !resumoErro) || (resumoErro && legadoQuery[0]?.isLoading);
  const isPending = registrarMutation.isPending || registrarFallback.isPending;
  const semDados = !resumo && !legado;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (semDados) {
    return (
      <AppLayout>
        <div className="p-6">
          <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
            Erro ao carregar dados do pedido.
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/financeiro/contas-receber/${pedidoId}`)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Registrar Pagamento</h1>
            <p className="text-muted-foreground">Pedido {numeroPedido}</p>
          </div>
        </div>

        <div className="bg-card border rounded-lg p-6 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <User className="w-4 h-4" />
                Cliente
              </div>
              <div className="font-medium">{clienteNome}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Pedido</div>
              <div className="font-medium">{numeroPedido}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Valor Total</div>
              <div className="font-medium text-primary">{formatCurrency(valorTotal)}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Total Pago</div>
              <div className="font-medium text-green-600">{formatCurrency(valorPagoAtual)}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Valor em Aberto</div>
              <div className="font-medium text-amber-600">{formatCurrency(valorEmAberto)}</div>
            </div>
          </div>
        </div>

        {estaQuitado ? (
          <div className="bg-muted/50 border rounded-lg p-6 text-center text-muted-foreground">
            Este pedido já está quitado. Não é possível registrar novo pagamento.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-card border rounded-lg p-6 space-y-6">
            {ehPagamentoAdiantamento && mensagemAdiantamento && (
              <div className="bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 rounded-lg p-4 text-sm">
                {mensagemAdiantamento}
              </div>
            )}
            <h2 className="text-lg font-semibold border-b pb-2">Dados do Pagamento</h2>
            <div className="space-y-2">
              <Label>Valor *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max={valorEmAberto}
                value={valorPago === '' ? '' : valorPago}
                onChange={(e) => setValorPago(e.target.value ? Number(e.target.value) : '')}
                required
              />
              <p className="text-xs text-muted-foreground">
                Valor em aberto: {formatCurrency(valorEmAberto)}. Permite pagamento parcial.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data de Pagamento</Label>
                <Input type="date" value={dataPagamento} onChange={(e) => setDataPagamento(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Forma de Pagamento *</Label>
                <Select value={formaPagamento} onValueChange={setFormaPagamento} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a forma" />
                  </SelectTrigger>
                  <SelectContent>
                    {FORMAS_PAGAMENTO.map((f) => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={3} placeholder="Opcional" />
            </div>
            <div className="flex justify-end gap-4 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => navigate(`/financeiro/contas-receber/${pedidoId}`)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending || !formaPagamento || !valorPago || Number(valorPago) <= 0}>
                {isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Registrando...</> : <><DollarSign className="w-4 h-4 mr-2" />Registrar Pagamento</>}
              </Button>
            </div>
          </form>
        )}
      </div>
    </AppLayout>
  );
};

export default ContasAReceberPedidoPagamentos;
