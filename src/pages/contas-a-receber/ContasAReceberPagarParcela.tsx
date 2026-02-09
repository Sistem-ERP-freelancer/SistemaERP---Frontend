import AppLayout from '@/components/layout/AppLayout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import { contasReceberService } from '@/services/contas-receber.service';
import { pedidosService } from '@/services/pedidos.service';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, ArrowLeft, Loader2, Plus, Trash2 } from 'lucide-react';
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

const ContasAReceberPagarParcela = () => {
  const { clienteId, pedidoId, parcelaId } = useParams<{
    clienteId: string;
    pedidoId: string;
    parcelaId: string;
  }>();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const state = location.state as {
    parcela?: {
      valor: number;
      valor_aberto?: number;
      valor_pago?: number;
      numero_parcela?: number;
      total_parcelas?: number;
      parcela_id?: number;
      id?: number;
    };
    parcela_pedido_id?: number;
    cliente?: string;
    numeroPedido?: string;
  };
  const parcela = state?.parcela;
  const parcelaPedidoIdFromState = state?.parcela_pedido_id ?? parcela?.parcela_id;
  const clienteNome = state?.cliente;
  const numeroPedido = state?.numeroPedido || pedidoId;

  const { data: parcelasData, isLoading: loadingParcelas } = useQuery({
    queryKey: ['pedidos', pedidoId, 'parcelas'],
    queryFn: () => pedidosService.listarParcelas(Number(pedidoId!)),
    enabled: !!pedidoId && !parcelaPedidoIdFromState,
  });
  const parcelasPedido = parcelasData?.parcelas ?? [];

  const parcelaPedidoId = useMemo(() => {
    if (parcelaPedidoIdFromState) return parcelaPedidoIdFromState;
    if (parcela?.numero_parcela == null || !parcela?.total_parcelas) return null;
    // Match exato: numero_parcela + total_parcelas
    let match = parcelasPedido.find(
      (p) =>
        p.numero_parcela === parcela.numero_parcela &&
        p.total_parcelas === parcela.total_parcelas
    );
    // Fallback: match apenas por numero_parcela (quando total_parcelas pode diferir)
    if (!match) {
      match = parcelasPedido.find((p) => p.numero_parcela === parcela.numero_parcela);
    }
    return match?.id ?? null;
  }, [
    parcelaPedidoIdFromState,
    parcela?.numero_parcela,
    parcela?.total_parcelas,
    parcelasPedido,
  ]);

  /** Valor em aberto: sempre da API (valor_aberto ou valor - valor_pago). Nunca usar valor total para validar. */
  const valorEmAberto =
    parcela?.valor_aberto ??
    (parcela?.valor != null && parcela?.valor_pago != null
      ? parcela.valor - parcela.valor_pago
      : 0);
  const valorParcela = parcela?.valor ?? 0;
  const parcelaLabel =
    parcela?.numero_parcela && parcela?.total_parcelas
      ? `${parcela.numero_parcela}/${parcela.total_parcelas}`
      : parcelaId;

  const [linhas, setLinhas] = useState<LinhaDuplicata[]>([]);
  const [criarSemQuitar, setCriarSemQuitar] = useState(true); // Por padrão, criar sem quitar

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

  const atualizarLinha = useCallback(
    (id: string, field: keyof LinhaDuplicata, value: unknown) => {
      setLinhas((prev) =>
        prev.map((l) => (l.id === id ? { ...l, [field]: value } : l))
      );
    },
    []
  );

  const TOLERANCIA_CENTAVOS = 0.01;

  const soma = useMemo(
    () => linhas.reduce((s, l) => s + (Number(l.valor) || 0), 0),
    [linhas]
  );

  const diferenca = valorEmAberto - soma;
  const isValid =
    Math.abs(diferenca) <= TOLERANCIA_CENTAVOS && linhas.length > 0;
  const erroValidacaoSoma =
    linhas.length > 0 &&
    Math.abs(diferenca) > TOLERANCIA_CENTAVOS &&
    `A soma das duplicatas (${soma.toFixed(2)}) deve ser igual ao valor em aberto (${valorEmAberto.toFixed(2)}).`;
  const allValid = linhas.every(
    (l) => (Number(l.valor) || 0) > 0 && l.data_vencimento
  );

  const parcelaIdParaApi = parcelaPedidoId ?? (parcelaId ? Number(parcelaId) : null);
  const podeConfirmar = parcelaIdParaApi !== null;

  const confirmarMutation = useMutation({
    mutationFn: () => {
      if (Math.abs(soma - valorEmAberto) > TOLERANCIA_CENTAVOS) {
        throw new Error(
          `A soma das duplicatas (${soma.toFixed(2)}) deve ser igual ao valor em aberto (${valorEmAberto.toFixed(2)}).`
        );
      }
      const duplicatas = linhas
        .filter((l) => (Number(l.valor) || 0) > 0 && l.data_vencimento)
        .map((l) => ({
          valor: Number(l.valor) || 0,
          forma_pagamento: (l.forma_pagamento || 'PIX')
            .toUpperCase()
            .replace(/\s/g, '_') as string,
          data_vencimento: l.data_vencimento.includes('T')
            ? l.data_vencimento.split('T')[0]
            : l.data_vencimento,
        }));
      const payload = { duplicatas };
      if (import.meta.env.DEV) {
        console.log('📋 [ContasAReceberPagarParcela] Contexto antes de enviar:', {
          pedidoId,
          parcelaId,
          parcelaIdParaApi,
          parcelaPedidoId,
          parcelaPedidoIdFromState: parcelaPedidoIdFromState,
          parcela: state?.parcela,
          soma,
          valorEmAberto,
          criarSemQuitar,
          payload,
        });
      }
      
      // Usar novo endpoint se criarSemQuitar for true
      if (criarSemQuitar) {
        return contasReceberService.criarDuplicatasParcela(
          Number(pedidoId!),
          parcelaIdParaApi!,
          payload
        );
      } else {
        // Usar endpoint antigo (criar e quitar)
        return pedidosService.confirmarPagamentoParcela(
          Number(pedidoId!),
          parcelaIdParaApi!,
          payload
        );
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['duplicatas'] });
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      queryClient.invalidateQueries({ queryKey: ['contas-financeiras'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-receber'] });
      queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
      
      if (criarSemQuitar) {
        toast.success(`${(data as any)?.duplicatas?.length || linhas.length} duplicata(s) criada(s) com sucesso. Status: ABERTA.`);
        // Não navegar, apenas voltar para a tela de detalhes do cliente
        navigate(`/contas-a-receber/clientes/${clienteId}`);
      } else {
        toast.success('Pagamento confirmado com sucesso. Parcela quitada.');
        navigate(`/contas-a-receber/clientes/${clienteId}`);
      }
    },
    onError: (err: unknown) => {
      const axiosErr = err as {
        response?: { status?: number; data?: { message?: string } };
        message?: string;
      };
      const msg =
        axiosErr?.response?.data?.message ?? axiosErr?.message ?? '';
      const status = axiosErr?.response?.status;

      let mensagemExibir = msg || 'Erro ao confirmar pagamento. Verifique se o endpoint está disponível.';

      if (status === 400 && msg) {
        const match = msg.match(/valor em aberto da parcela\s*\(([\d.,]+)\)/i);
        const valorCitadoBackend = match
          ? parseFloat(match[1].replace(',', '.'))
          : null;
        if (
          valorCitadoBackend != null &&
          Math.abs(valorCitadoBackend - valorParcela) < 0.02 &&
          Math.abs(valorEmAberto - valorParcela) > 0.02
        ) {
          mensagemExibir = `${msg} O backend pode estar com versão antiga que compara com o valor total. Pode ser necessário redeploy do backend com a correção do valor em aberto.`;
        }
      }

      toast.error(mensagemExibir);
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
            onClick={() =>
              navigate(`/contas-a-receber/clientes/${clienteId}`)
            }
            className="mb-2 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold mb-4">
              {criarSemQuitar ? 'Criar duplicatas da parcela' : 'Pagar parcela'}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Parcela = prestação do pedido. Uma parcela pode ser paga com uma ou mais duplicatas;
              a soma dos valores das duplicatas deve ser igual ao valor em aberto.
            </p>
            
            <div className="mb-4 p-3 bg-muted/50 rounded-lg">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={criarSemQuitar}
                  onChange={(e) => setCriarSemQuitar(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm">
                  <strong>Criar duplicatas sem quitar</strong> (recomendado)
                </span>
              </label>
              <p className="text-xs text-muted-foreground mt-1 ml-6">
                {criarSemQuitar
                  ? 'As duplicatas serão criadas com status ABERTA. Você poderá pagá-las depois.'
                  : 'As duplicatas serão criadas e quitadas automaticamente (status BAIXADA).'}
              </p>
            </div>
            <div className="grid gap-2 text-sm">
              <p>
                <span className="text-muted-foreground">Cliente:</span>{' '}
                {clienteNome || '—'}
              </p>
              <p>
                <span className="text-muted-foreground">Pedido:</span>{' '}
                {numeroPedido}
              </p>
              <p>
                <span className="text-muted-foreground">Parcela (prestação):</span>{' '}
                {parcelaLabel}
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

          {!podeConfirmar && !loadingParcelas && parcela?.numero_parcela != null && parcela?.total_parcelas != null && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Parcela não encontrada</AlertTitle>
              <AlertDescription>
                Não foi possível vincular à parcela do pedido. A parcela {parcelaLabel} não corresponde
                às parcelas retornadas pelo pedido. Verifique se o pedido possui parcelas cadastradas e tente novamente.
              </AlertDescription>
            </Alert>
          )}

          {erroValidacaoSoma && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Soma inválida</AlertTitle>
              <AlertDescription>{erroValidacaoSoma}</AlertDescription>
            </Alert>
          )}

          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-base font-semibold mb-4">
              Criação manual de duplicatas desta parcela
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Adicione uma ou mais duplicatas (títulos de cobrança). A soma deve ser igual ao valor em aberto.
            </p>

            {linhas.length === 0 ? (
              <div className="py-8 text-center border rounded-lg border-dashed">
                <p className="text-muted-foreground mb-4">
                  Nenhuma duplicata criada.
                </p>
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
                              atualizarLinha(
                                l.id,
                                'valor',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            placeholder="0,00"
                            className="w-[120px]"
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={l.forma_pagamento}
                            onValueChange={(v) =>
                              atualizarLinha(l.id, 'forma_pagamento', v)
                            }
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
                            onChange={(e) =>
                              atualizarLinha(
                                l.id,
                                'data_vencimento',
                                e.target.value
                              )
                            }
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
                  Valor em aberto da parcela:{' '}
                  <strong>{formatCurrency(valorEmAberto)}</strong>
                </p>
                <p>
                  Soma das duplicatas:{' '}
                  <strong>
                    {formatCurrency(soma)} {isValid ? '✅' : '❌'}
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
                      disabled={
                        !isValid ||
                        !allValid ||
                        !podeConfirmar ||
                        confirmarMutation.isPending ||
                        (loadingParcelas && !parcelaPedidoIdFromState)
                      }
                    >
                      {confirmarMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : isValid ? (
                        '✅ '
                      ) : null}
                      {criarSemQuitar ? 'Criar duplicatas da parcela' : 'Criar e quitar duplicatas'}
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {!podeConfirmar && !loadingParcelas && parcela?.numero_parcela && parcela?.total_parcelas && (
                    <p>Não foi possível identificar a parcela do pedido. Recarregue a página.</p>
                  )}
                  {!isValid && linhas.length > 0 && podeConfirmar && (
                    <p>
                      A soma das duplicatas ({formatCurrency(soma)}) deve ser igual ao valor em
                      aberto da parcela ({formatCurrency(valorEmAberto)})
                    </p>
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

export default ContasAReceberPagarParcela;
