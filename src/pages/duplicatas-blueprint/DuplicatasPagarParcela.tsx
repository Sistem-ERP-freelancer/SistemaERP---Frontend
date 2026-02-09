import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatCurrency } from '@/lib/utils';
import { pedidosService } from '@/services/pedidos.service';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Plus, Trash2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

const FORMAS_PAGAMENTO = [
  { value: 'DINHEIRO', label: 'Dinheiro' },
  { value: 'PIX', label: 'Pix' },
  { value: 'CARTAO_CREDITO', label: 'Cartão de Crédito' },
  { value: 'CARTAO_DEBITO', label: 'Cartão de Débito' },
  { value: 'BOLETO', label: 'Boleto' },
  { value: 'TRANSFERENCIA', label: 'Transferência' },
  { value: 'CHEQUE', label: 'Cheque' },
];

interface LinhaDuplicata {
  id: string;
  valor: number;
  forma_pagamento: string;
  data_vencimento: string;
}

const DuplicatasPagarParcela = () => {
  const { clienteId, pedidoId, parcelaId } = useParams<{
    clienteId: string;
    pedidoId: string;
    parcelaId: string;
  }>();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const state = location.state as {
    parcela?: { valor: number; valor_aberto: number; numero_parcela?: number; total_parcelas?: number };
    cliente?: string;
    numeroPedido?: string;
  };
  const parcela = state?.parcela;
  const clienteNome = state?.cliente;
  const numeroPedido = state?.numeroPedido || pedidoId;

  const valorEmAberto = parcela?.valor_aberto ?? 0;
  const valorParcela = parcela?.valor ?? 0;
  const parcelaLabel = parcela?.numero_parcela && parcela?.total_parcelas
    ? `${parcela.numero_parcela}/${parcela.total_parcelas}`
    : parcelaId;

  const [linhas, setLinhas] = useState<LinhaDuplicata[]>([]);

  const hoje = useMemo(() => new Date().toISOString().split('T')[0], []);

  const adicionarLinha = useCallback(() => {
    setLinhas((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        valor: 0,
        forma_pagamento: 'PIX',
        data_vencimento: hoje,
      },
    ]);
  }, [hoje]);

  const removerLinha = useCallback((id: string) => {
    setLinhas((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const atualizarLinha = useCallback((id: string, field: keyof LinhaDuplicata, value: unknown) => {
    setLinhas((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [field]: value } : l))
    );
  }, []);

  const soma = useMemo(
    () => linhas.reduce((s, l) => s + (Number(l.valor) || 0), 0),
    [linhas]
  );

  const diferenca = valorEmAberto - soma;
  const isValid = Math.abs(diferenca) < 0.01 && linhas.length > 0;
  const allValid = linhas.every(
    (l) => (Number(l.valor) || 0) > 0 && l.data_vencimento
  );

  const confirmarMutation = useMutation({
    mutationFn: () => {
      const duplicatas = linhas
        .filter((l) => (Number(l.valor) || 0) > 0 && l.data_vencimento)
        .map((l) => ({
          valor: Number(l.valor) || 0,
          forma_pagamento: l.forma_pagamento,
          data_vencimento: l.data_vencimento.includes('T')
            ? l.data_vencimento.split('T')[0]
            : l.data_vencimento,
        }));
      return pedidosService.confirmarPagamentoParcela(
        Number(pedidoId!),
        Number(parcelaId!),
        { duplicatas }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['duplicatas'] });
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
      toast.success('Pagamento confirmado com sucesso. Parcela quitada.');
      navigate(`/duplicatas/clientes/${clienteId}`);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Erro ao confirmar pagamento. Verifique se o endpoint está disponível.');
    },
  });

  const handleConfirmar = () => {
    if (!isValid || !allValid) return;
    confirmarMutation.mutate();
  };

  return (
    <AppLayout>
      <TooltipProvider>
        <div className="p-6 space-y-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/duplicatas/clientes/${clienteId}`)}
            className="mb-2 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold mb-4">Pagar parcela</h2>
            <div className="grid gap-2 text-sm">
              <p>
                <span className="text-muted-foreground">Cliente:</span> {clienteNome || '—'}
              </p>
              <p>
                <span className="text-muted-foreground">Pedido:</span> {numeroPedido}
              </p>
              <p>
                <span className="text-muted-foreground">Parcela:</span> {parcelaLabel}
              </p>
              <p>
                <span className="text-muted-foreground">Valor da parcela:</span>{' '}
                {formatCurrency(valorParcela)}
              </p>
              <p>
                <span className="text-muted-foreground">Valor em aberto:</span>{' '}
                <strong>{formatCurrency(valorEmAberto)}</strong>
              </p>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-base font-semibold mb-4">Criação manual de duplicatas</h3>

            {linhas.length === 0 ? (
              <div className="py-8 text-center border rounded-lg border-dashed">
                <p className="text-muted-foreground mb-4">Nenhuma duplicata criada.</p>
                <Button onClick={adicionarLinha}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar duplicata
                </Button>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">#</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Forma de Pagamento</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead className="w-[60px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {linhas.map((l, idx) => (
                      <TableRow key={l.id}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={l.valor || ''}
                            onChange={(e) =>
                              atualizarLinha(l.id, 'valor', parseFloat(e.target.value) || 0)
                            }
                            placeholder="0,00"
                            className="w-[120px]"
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={l.forma_pagamento}
                            onValueChange={(v) => atualizarLinha(l.id, 'forma_pagamento', v)}
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {FORMAS_PAGAMENTO.map((f) => (
                                <SelectItem key={f.value} value={f.value}>
                                  {f.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="date"
                            value={l.data_vencimento || ''}
                            onChange={(e) => atualizarLinha(l.id, 'data_vencimento', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removerLinha(l.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={adicionarLinha}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar duplicata
                </Button>
              </>
            )}

            {linhas.length > 0 && (
              <div className="mt-6 p-4 bg-muted/50 rounded-lg space-y-2">
                <p>
                  Valor em aberto da parcela: <strong>{formatCurrency(valorEmAberto)}</strong>
                </p>
                <p>
                  Soma das duplicatas:{' '}
                  <strong>
                    {formatCurrency(soma)}{' '}
                    {isValid ? '✅' : '❌'}
                  </strong>
                </p>
                <p>
                  Diferença: <strong>{formatCurrency(diferenca)}</strong>
                </p>
              </div>
            )}

            <div className="mt-6">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-block">
                    <Button
                      onClick={handleConfirmar}
                      disabled={!isValid || !allValid || confirmarMutation.isPending}
                    >
                      {confirmarMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : isValid ? (
                        '✅ '
                      ) : null}
                      Confirmar pagamento da parcela
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {!isValid && linhas.length > 0 && (
                    <p>A soma das duplicatas deve fechar o valor da parcela</p>
                  )}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </TooltipProvider>
    </AppLayout>
  );
};

export default DuplicatasPagarParcela;
