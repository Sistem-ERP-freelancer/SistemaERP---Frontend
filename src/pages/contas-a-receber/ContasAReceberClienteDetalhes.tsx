import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatCurrency, normalizarStatusParcela, parseNumeroParcela } from '@/lib/utils';
import { clientesService } from '@/services/clientes.service';
import {
    contasReceberService,
    type ParcelaDetalhe,
} from '@/services/contas-receber.service';
import { duplicatasService } from '@/services/duplicatas.service';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, DollarSign, FileText, Loader2, MoreVertical } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const STATUS_LABELS: Record<string, string> = {
  ABERTA: 'Aberta',
  PARCIALMENTE_PAGA: 'Parcial',
  PAGA: 'Quitada',
  EM_COMPENSACAO: 'Em Compensação',
};

const STATUS_COLORS: Record<string, string> = {
  ABERTA: 'bg-slate-500/10 text-slate-600',
  PARCIALMENTE_PAGA: 'bg-amber-500/10 text-amber-600',
  PAGA: 'bg-green-500/10 text-green-600',
  EM_COMPENSACAO: 'bg-blue-500/10 text-blue-600',
};

function formatarDocumento(doc?: string): string {
  if (!doc) return '—';
  const n = doc.replace(/\D/g, '');
  if (n.length === 11)
    return n.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  if (n.length === 14)
    return n.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  return doc;
}

const ContasAReceberClienteDetalhes = () => {
  const { clienteId } = useParams<{ clienteId: string }>();
  const navigate = useNavigate();

  const { data: cliente, isLoading: loadingCliente } = useQuery({
    queryKey: ['clientes', clienteId],
    queryFn: () => clientesService.buscarPorId(Number(clienteId!)),
    enabled: !!clienteId,
  });

  const { data: detalheApi, isLoading: loadingDetalhe, error: errorDetalhe } = useQuery({
    queryKey: ['contas-receber', 'detalhe', clienteId],
    queryFn: async () => {
      const result = await contasReceberService.obterDetalheCliente(Number(clienteId!));
      // Debug: log para verificar o que está sendo retornado
      if (import.meta.env.DEV) {
        console.log('[ContasAReceberClienteDetalhes] Resposta do endpoint detalhe:', result);
        console.log('[ContasAReceberClienteDetalhes] Parcelas retornadas:', result?.parcelas?.length || 0);
      }
      return result;
    },
    enabled: !!clienteId,
    retry: 1,
  });

  const { data: agrupadasData, isLoading: loadingAgrupadas, error: errorAgrupadas } = useQuery({
    queryKey: ['duplicatas', 'agrupadas-por-pedido', clienteId],
    queryFn: () =>
      duplicatasService.listarAgrupadasPorPedido({
        cliente_id: Number(clienteId!),
        // Não filtrar por status aqui, vamos filtrar no frontend para incluir parcialmente pagas
      }),
    // Só buscar agrupadasData se detalheApi não tiver retornado parcelas (após carregar)
    enabled: !!clienteId && !loadingDetalhe && (!detalheApi?.parcelas || detalheApi.parcelas.length === 0),
    retry: 1,
  });

  // Fallback: buscar todas as duplicatas agrupadas se a busca filtrada falhar ou não retornar dados
  const { data: agrupadasDataFallback } = useQuery({
    queryKey: ['duplicatas', 'agrupadas-por-pedido', 'all'],
    queryFn: () =>
      duplicatasService.listarAgrupadasPorPedido({
        // Sem filtro de cliente
      }),
    enabled: !!clienteId && !loadingAgrupadas && (!agrupadasData?.grupos?.length && !errorAgrupadas),
    retry: 1,
  });

  const isLoadingParcelas = loadingDetalhe || loadingAgrupadas;

  const parcelas: ParcelaDetalhe[] = useMemo(() => {
    // Conforme o guia de troubleshooting: o endpoint retorna TODAS as parcelas
    // Não devemos filtrar por status ou valor_aberto no frontend
    // Se o endpoint de detalhe retornou parcelas, usar elas diretamente
    if (detalheApi?.parcelas && Array.isArray(detalheApi.parcelas) && detalheApi.parcelas.length > 0) {
      // Debug: log para verificar as parcelas retornadas
      if (import.meta.env.DEV) {
        console.log('[ContasAReceberClienteDetalhes] Usando parcelas do endpoint detalhe:', detalheApi.parcelas.length);
      }
      
      // Remover duplicatas baseado em uma chave única: pedido_id + numero_parcela + total_parcelas
      const seen = new Set<string>();
      const parcelasUnicas = detalheApi.parcelas.filter((p) => {
        const key = `${p.pedido_id}-${p.numero_parcela}-${p.total_parcelas}`;
        if (seen.has(key)) {
          if (import.meta.env.DEV) {
            console.warn('[ContasAReceberClienteDetalhes] Parcela duplicada removida:', key, p);
          }
          return false;
        }
        seen.add(key);
        return true;
      });
      
      if (import.meta.env.DEV && parcelasUnicas.length !== detalheApi.parcelas.length) {
        console.log(`[ContasAReceberClienteDetalhes] Removidas ${detalheApi.parcelas.length - parcelasUnicas.length} duplicatas`);
      }
      
      return parcelasUnicas;
    }
    
    // Debug: log quando não há parcelas do endpoint detalhe
    if (import.meta.env.DEV) {
      console.log('[ContasAReceberClienteDetalhes] Endpoint detalhe não retornou parcelas, usando fallback');
      console.log('[ContasAReceberClienteDetalhes] detalheApi:', detalheApi);
      console.log('[ContasAReceberClienteDetalhes] agrupadasData:', agrupadasData);
    }

    // Fallback: construir a partir de agrupadasData se o endpoint de detalhe não retornou dados
    const result: ParcelaDetalhe[] = [];
    const gruposFiltrados = agrupadasData?.grupos ?? [];
    const gruposFallback = agrupadasDataFallback?.grupos ?? [];
    
    // Usar grupos filtrados se disponíveis, senão usar fallback e filtrar por cliente_id no frontend
    const grupos = gruposFiltrados.length > 0 
      ? gruposFiltrados 
      : gruposFallback.filter((g) => g.cliente_id === Number(clienteId));
    
    grupos.forEach((g) => {
      g.parcelas.forEach((p, idx) => {
        const valorOriginal = p.valor_original ?? 0;
        const valorAberto = p.valor_aberto ?? 0;
        
        // Filtrar apenas parcelas canceladas (não mostrar canceladas)
        // Mas mostrar todas as outras, mesmo que pagas ou com valor_aberto = 0
        if (p.status === 'CANCELADA') {
          return;
        }
        
        const valorPago = valorOriginal - valorAberto;
        let status: ParcelaDetalhe['status'] = 'ABERTA';
        if (p.status === 'BAIXADA') status = 'PAGA';
        else if (valorPago > 0 && valorAberto > 0) status = 'PARCIALMENTE_PAGA';
        else if (valorAberto <= 0 && valorPago > 0) status = 'PAGA';
        
        // Normalizar status para garantir que seja válido (remover PENDENTE se existir)
        status = normalizarStatusParcela(status);

        const numeroParcela = parseNumeroParcela(p.numero ?? '', g.total_parcelas, idx + 1);
        result.push({
          id: p.id,
          parcela_id: p.parcela_pedido_id,
          pedido_id: g.pedido_id,
          numero_pedido: g.numero_pedido || `PED-${g.pedido_id}`,
          numero_parcela: numeroParcela,
          total_parcelas: g.total_parcelas,
          valor: valorOriginal,
          valor_pago: valorPago,
          valor_aberto: valorAberto,
          status,
          data_vencimento: p.data_vencimento,
        });
      });
    });

    // Remover duplicatas do resultado do fallback também
    const seen = new Set<string>();
    const resultUnicos = result.filter((p) => {
      const key = `${p.pedido_id}-${p.numero_parcela}-${p.total_parcelas}`;
      if (seen.has(key)) {
        if (import.meta.env.DEV) {
          console.warn('[ContasAReceberClienteDetalhes] Parcela duplicada removida (fallback):', key, p);
        }
        return false;
      }
      seen.add(key);
      return true;
    });
    
    // Debug: log do resultado final
    if (import.meta.env.DEV) {
      console.log('[ContasAReceberClienteDetalhes] Parcelas finais (fallback):', resultUnicos.length);
      if (resultUnicos.length !== result.length) {
        console.log(`[ContasAReceberClienteDetalhes] Removidas ${result.length - resultUnicos.length} duplicatas do fallback`);
      }
    }
    
    return resultUnicos;
  }, [detalheApi, agrupadasData, agrupadasDataFallback, clienteId]);

  // Calcular total em aberto apenas das parcelas que realmente têm valor em aberto
  const totalAberto = useMemo(
    () => parcelas
      .filter((p) => (p.valor_aberto ?? 0) > 0)
      .reduce((s, p) => s + (p.valor_aberto ?? 0), 0),
    [parcelas]
  );

  const documento =
    cliente?.cpf_cnpj ||
    detalheApi?.cliente?.documento ||
    detalheApi?.cliente?.cpf_cnpj;
  const nomeCliente =
    cliente?.nome_fantasia ||
    cliente?.nome_razao ||
    cliente?.nome ||
    detalheApi?.cliente?.nome ||
    '—';

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/contas-a-receber')}
          className="mb-2 -ml-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        {loadingCliente ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-semibold mb-4">Cliente</h2>
              <div className="grid gap-2 text-sm">
                <p>
                  <span className="text-muted-foreground">Cliente:</span>{' '}
                  <strong>{nomeCliente}</strong>
                </p>
                <p>
                  <span className="text-muted-foreground">Documento:</span>{' '}
                  {formatarDocumento(documento)}
                </p>
                <p>
                  <span className="text-muted-foreground">
                    Total em aberto:
                  </span>{' '}
                  <strong className="text-lg">
                    {formatCurrency(totalAberto)}
                  </strong>
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border overflow-hidden bg-card shadow-sm">
              <p className="text-sm text-muted-foreground px-6 pt-4 pb-2">
                Parcelas = prestações do pedido. Cada parcela pode ser paga com uma ou mais duplicatas.
              </p>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Pedido</TableHead>
                    <TableHead className="w-[80px]">Parcela (X/Y)</TableHead>
                    <TableHead className="w-[120px] text-right">
                      Valor Parcela
                    </TableHead>
                    <TableHead className="w-[100px] text-right">Pago</TableHead>
                    <TableHead className="w-[100px] text-right">Aberto</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead className="w-[180px] text-center">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingParcelas ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-16 text-center">
                        <Loader2 className="w-8 h-8 mx-auto animate-spin text-muted-foreground" />
                        <p className="mt-2 text-muted-foreground">Carregando parcelas...</p>
                      </TableCell>
                    </TableRow>
                  ) : (errorDetalhe || errorAgrupadas) ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-16 text-center">
                        <FileText className="w-12 h-12 mx-auto text-muted-foreground/50" />
                        <p className="mt-2 text-destructive">Erro ao carregar parcelas</p>
                        {import.meta.env.DEV && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {errorDetalhe ? 'Erro no endpoint detalhe' : 'Erro no endpoint agrupadas'}
                          </p>
                        )}
                      </TableCell>
                    </TableRow>
                  ) : parcelas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-16 text-center">
                        <FileText className="w-12 h-12 mx-auto text-muted-foreground/50" />
                        <p className="mt-2">Nenhuma parcela encontrada</p>
                        {import.meta.env.DEV && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Cliente ID: {clienteId} | 
                            Detalhe API: {detalheApi ? 'OK' : 'null'} | 
                            Parcelas no detalhe: {detalheApi?.parcelas?.length || 0} | 
                            Grupos agrupadas: {agrupadasData?.grupos?.length || 0}
                          </p>
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    parcelas.map((p, index) => {
                      // Gerar chave única: usar parcela_id se disponível, senão id, senão combinação de pedido+parcela+índice
                      const uniqueKey = p.parcela_id 
                        ? `parcela-${p.parcela_id}`
                        : p.id 
                        ? `parcela-${p.pedido_id}-${p.id}`
                        : `parcela-${p.pedido_id}-${p.numero_parcela}-${p.total_parcelas}-${index}`;
                      
                      return (
                      <TableRow key={uniqueKey}>
                        <TableCell className="font-medium">
                          {p.numero_pedido}
                        </TableCell>
                        <TableCell>
                          {p.numero_parcela}/{p.total_parcelas}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(p.valor)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(p.valor_pago ?? 0)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(p.valor_aberto ?? 0)}
                        </TableCell>
                        <TableCell>
                          {(() => {
                            // Normalizar status para garantir que seja válido
                            const statusNormalizado = normalizarStatusParcela(p.status);
                            return (
                              <span
                                className={`text-xs px-2 py-1 rounded-full font-medium ${
                                  STATUS_COLORS[statusNormalizado] || 'bg-slate-500/10'
                                }`}
                              >
                                {STATUS_LABELS[statusNormalizado] || statusNormalizado}
                              </span>
                            );
                          })()}
                        </TableCell>
                        <TableCell className="text-center">
                          <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="outline">
                                  <MoreVertical className="w-4 h-4 mr-1" />
                                  Ações
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  disabled={(p.valor_aberto ?? 0) <= 0}
                                  onClick={() => {
                                    const parcelaIdParaUrl = p.parcela_id ?? p.id;
                                    navigate(
                                      `/contas-a-receber/clientes/${clienteId}/pagar/${p.pedido_id}/${parcelaIdParaUrl}`,
                                      {
                                        state: {
                                          parcela: p,
                                          parcela_pedido_id: p.parcela_id ?? p.id,
                                          cliente: nomeCliente,
                                          numeroPedido: p.numero_pedido,
                                        },
                                      }
                                    );
                                  }}
                                >
                                  <DollarSign className="w-4 h-4 mr-2" />
                                  Criar duplicatas (para esta parcela)
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={async () => {
                                    let parcelaPedidoId = p.parcela_id;
                                    if (parcelaPedidoId == null && !!agrupadasData?.grupos?.length) {
                                      try {
                                        const { pedidosService } = await import('@/services/pedidos.service');
                                        const res = await pedidosService.listarParcelas(p.pedido_id);
                                        const pp = (res?.parcelas ?? []).find(
                                          (x) =>
                                            x.numero_parcela === p.numero_parcela &&
                                            x.total_parcelas === p.total_parcelas
                                        );
                                        parcelaPedidoId = pp?.id;
                                      } catch {
                                        parcelaPedidoId = undefined;
                                      }
                                    }
                                    const parcelaIdParaUrl = parcelaPedidoId ?? p.id;
                                    navigate(
                                      `/contas-a-receber/clientes/${clienteId}/duplicatas/${p.pedido_id}/${parcelaIdParaUrl}`,
                                      {
                                        state: {
                                          parcela: {
                                            numero_parcela: p.numero_parcela,
                                            total_parcelas: p.total_parcelas,
                                            valor: p.valor,
                                            valor_aberto: p.valor_aberto ?? 0,
                                          },
                                          pedido_id: p.pedido_id,
                                          parcela_pedido_id: parcelaPedidoId,
                                          numeroPedido: p.numero_pedido,
                                          cliente: nomeCliente,
                                        },
                                      }
                                    );
                                  }}
                                >
                                  <FileText className="w-4 h-4 mr-2" />
                                  Ver duplicatas desta parcela
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                      </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default ContasAReceberClienteDetalhes;
