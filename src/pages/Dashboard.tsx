import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate, formatISODateLocal } from "@/lib/utils";
import { estoqueService } from "@/services/estoque.service";
import { financeiroService } from "@/services/financeiro.service";
import { pedidosService } from "@/services/pedidos.service";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
    AlertTriangle,
    BarChart3,
    Calendar,
    Info,
    Loader2,
    Receipt,
    Scale,
    ShoppingCart,
    TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { Label } from "@/components/ui/label";

type PainelMetricKind = "compras" | "despesas" | "vendas" | "saldo";

function painelMetricKindFromLegenda(legenda: string): PainelMetricKind {
  const l = legenda.toLowerCase();
  if (l.includes("saldo")) return "saldo";
  if (l.includes("venda")) return "vendas";
  if (l.includes("compra")) return "compras";
  if (l.includes("despesa")) return "despesas";
  return "compras";
}

const painelMetricVisual: Record<
  PainelMetricKind,
  { border: string; iconWrap: string; Icon: LucideIcon }
> = {
  compras: {
    border: "border-l-4 border-l-amber-500",
    iconWrap:
      "bg-amber-500/[0.12] text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
    Icon: ShoppingCart,
  },
  despesas: {
    border: "border-l-4 border-l-rose-500",
    iconWrap:
      "bg-rose-500/[0.12] text-rose-700 dark:bg-rose-500/15 dark:text-rose-400",
    Icon: Receipt,
  },
  vendas: {
    border: "border-l-4 border-l-emerald-500",
    iconWrap:
      "bg-emerald-500/[0.12] text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
    Icon: TrendingUp,
  },
  saldo: {
    border: "border-l-4 border-l-sky-600 dark:border-l-sky-400",
    iconWrap:
      "bg-sky-500/[0.12] text-sky-800 dark:bg-sky-500/15 dark:text-sky-300",
    Icon: Scale,
  },
};

function painelValorClass(kind: PainelMetricKind, valor: number): string {
  if (kind === "saldo") {
    if (valor < 0) return "text-destructive";
    if (valor > 0) return "text-emerald-600 dark:text-emerald-400";
  }
  if (kind === "vendas" && valor > 0) {
    return "text-emerald-700 dark:text-emerald-400";
  }
  return "text-slate-900 dark:text-foreground";
}

/** API pode devolver número ou string decimal; JSON às vezes vem em camelCase. */
function numPainel(v: unknown): number {
  if (v == null || v === "") return 0;
  const n = typeof v === "string" ? parseFloat(v.replace(",", ".")) : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function mesAnoAtualLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const Dashboard = () => {
  /** Vazio = totais da 3ª faixa são histórico geral; linhas 1–2 usam o mês atual como referência. */
  const [mesAnoFiltro, setMesAnoFiltro] = useState<string>("");
  const parametrosDashboardFinanceiro = useMemo(() => {
    const mesEscolhido = mesAnoFiltro?.trim();
    const chave = mesEscolhido || mesAnoAtualLocal();
    const parts = chave.split("-").map(Number);
    const ref = parts[0] && parts[1] ? parts : mesAnoAtualLocal().split("-").map(Number);
    const [ano, mes] = ref;
    const primeiro = new Date(ano, mes - 1, 1);
    const ultimo = new Date(ano, mes, 0);
    return {
      data_inicial: formatISODateLocal(primeiro),
      data_final: formatISODateLocal(ultimo),
      painel_totais_gerais: !mesEscolhido,
    };
  }, [mesAnoFiltro]);

  const { data: dashboardUnificado, isLoading: loadingUnificado } = useQuery({
    queryKey: ['dashboard', 'unificado', parametrosDashboardFinanceiro],
    queryFn: () => financeiroService.getDashboardUnificado(parametrosDashboardFinanceiro),
    refetchInterval: 30000,
    retry: false,
  });

  const painelFinanceiro = useMemo(() => {
    if (!dashboardUnificado) return undefined;
    const u = dashboardUnificado as Record<string, unknown>;
    const raw =
      u.painel_acompanhamento ??
      u.painelAcompanhamento;
    if (!raw || typeof raw !== "object") return undefined;
    const p = raw as Record<string, unknown>;
    const linhaReg =
      (p.linha_registrado as Record<string, unknown>) ??
      (p.linhaRegistrado as Record<string, unknown>);
    const linhaCaixa =
      (p.linha_caixa as Record<string, unknown>) ??
      (p.linhaCaixa as Record<string, unknown>);
    const linhaTot =
      (p.linha_totais_periodo as Record<string, unknown>) ??
      (p.linhaTotaisPeriodo as Record<string, unknown>);
    if (!linhaReg || !linhaCaixa || !linhaTot) return undefined;
    return {
      linha_registrado: {
        compras: numPainel(linhaReg.compras),
        despesas: numPainel(linhaReg.despesas),
        vendas: numPainel(linhaReg.vendas),
        saldo: numPainel(linhaReg.saldo),
      },
      linha_caixa: {
        compras: numPainel(linhaCaixa.compras),
        despesas: numPainel(linhaCaixa.despesas),
        vendas: numPainel(linhaCaixa.vendas),
        saldo: numPainel(linhaCaixa.saldo),
      },
      linha_totais_periodo: {
        compras: numPainel(linhaTot.compras),
        despesas: numPainel(linhaTot.despesas),
        vendas: numPainel(linhaTot.vendas),
        saldo: numPainel(linhaTot.saldo),
      },
    };
  }, [dashboardUnificado]);

  // Buscar pedidos recentes (vendas)
  const { data: pedidosData, isLoading: loadingPedidos } = useQuery({
    queryKey: ['pedidos', 'recentes'],
    queryFn: () => pedidosService.listar({ page: 1, limit: 5, tipo: 'VENDA' }),
    refetchInterval: 30000,
  });

  // Buscar produtos com estoque baixo usando endpoint dedicado
  const { data: estoqueBaixoData, isLoading: loadingProdutos } = useQuery({
    queryKey: ['estoque', 'baixo'],
    queryFn: () => estoqueService.obterEstoqueBaixo({ page: 1, limit: 10 }),
    refetchInterval: 30000,
  });

  // Buscar contas vencidas
  const { data: contasVencidasData, isLoading: loadingContasVencidas } = useQuery({
    queryKey: ['contas-financeiras', 'vencidas'],
    queryFn: async () => {
      try {
        // Buscar contas vencidas usando proximidade_vencimento
        const response = await financeiroService.listar({
          page: 1,
          limit: 10,
          proximidade_vencimento: 'VENCIDA'
        });
        
        // Tratar diferentes formatos de resposta
        if (Array.isArray(response)) {
          return response;
        }
        if (response?.data && Array.isArray(response.data)) {
          return response.data;
        }
        if ((response as any)?.contas && Array.isArray((response as any).contas)) {
          return (response as any).contas;
        }
        return [];
      } catch (error) {
        console.warn("Erro ao buscar contas vencidas:", error);
        return [];
      }
    },
    refetchInterval: 30000,
  });

  // Função auxiliar para converter valor para número seguro
  const parseValor = (valor: any): number => {
    if (valor === null || valor === undefined || valor === '') return 0;
    const num = typeof valor === 'string' ? parseFloat(valor) : Number(valor);
    return isNaN(num) ? 0 : num;
  };

  // Produtos com estoque baixo do endpoint dedicado
  const produtosEstoqueBaixo = estoqueBaixoData?.produtos || [];
  const countEstoqueBaixo = estoqueBaixoData?.total || 0;

  // Contas vencidas
  const contasVencidas = contasVencidasData || [];

  // Tratar diferentes formatos de resposta de pedidos
  let pedidosRecentes: any[] = [];
  if (pedidosData) {
    if (Array.isArray(pedidosData)) {
      pedidosRecentes = pedidosData;
    } else if (pedidosData?.data && Array.isArray(pedidosData.data)) {
      pedidosRecentes = pedidosData.data;
    } else if ((pedidosData as any)?.pedidos && Array.isArray((pedidosData as any).pedidos)) {
      pedidosRecentes = (pedidosData as any).pedidos;
    }
  }

  const recentSales = pedidosRecentes.slice(0, 4).map(pedido => ({
    cliente: pedido.cliente?.nome || `Cliente #${pedido.cliente_id || 'N/A'}`,
    produto: `${pedido.itens?.length || 0} item(ns)`,
    valor: formatCurrency(parseValor(pedido.valor_total)),
    data: pedido.created_at ? formatDate(pedido.created_at) : pedido.data_pedido ? formatDate(pedido.data_pedido) : 'N/A',
    status: pedido.status || 'Pendente',
  }));

  const lowStockProducts = produtosEstoqueBaixo.slice(0, 5).map(produto => ({
    produto: produto.nome,
    categoria: produto.categoria_nome || 'N/A',
    estoque: produto.estoque_atual,
    minimo: produto.estoque_minimo,
  }));

  return (
    <AppLayout>
      <div className="p-3 sm:p-4 md:p-6 min-w-0">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do seu negócio</p>
        </div>

        {/* Acompanhamento financeiro — layout refinado (ícones, cores por tipo, seções numeradas) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-6 overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm ring-1 ring-black/[0.03] dark:ring-white/[0.06]"
        >
          <div className="relative border-b border-border/80 bg-gradient-to-br from-slate-50/90 via-card to-sky-50/40 px-4 py-5 sm:px-6 dark:from-muted/30 dark:via-card dark:to-sky-950/20">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex gap-3 min-w-0">
                <div className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Financeiro
                  </p>
                  <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900 dark:text-foreground sm:text-2xl">
                    Dashboard de acompanhamento financeiro
                  </h2>
                  <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                    Lançamentos no mês (competência), movimentação de caixa no período e totais — alinhado ao endpoint da página Financeiro.
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 shrink-0 rounded-xl border border-border/60 bg-background/80 px-3 py-2.5 shadow-sm backdrop-blur-sm dark:bg-background/50 max-w-full sm:max-w-[16rem]">
                <Label
                  htmlFor="dashboard-mes-ano"
                  className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
                >
                  <Calendar className="h-3.5 w-3.5 opacity-70" />
                  Mês de referência
                </Label>
                <input
                  id="dashboard-mes-ano"
                  type="month"
                  value={mesAnoFiltro}
                  onChange={(e) => setMesAnoFiltro(e.target.value)}
                  className="h-10 w-full min-w-[12rem] rounded-lg border border-input bg-background px-3 text-sm font-medium text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <p className="text-[11px] leading-snug text-muted-foreground">
                  Sem mês: linhas 1 e 2 usam o mês atual; &quot;Totais&quot; soma todo o histórico (competência).
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 sm:p-6 overflow-x-auto bg-muted/20 dark:bg-muted/10">
            {loadingUnificado && !dashboardUnificado ? (
              <div className="flex justify-center py-10 text-muted-foreground gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Carregando acompanhamento financeiro...
              </div>
            ) : !dashboardUnificado ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Não foi possível carregar o resumo unificado. Verifique o endpoint{' '}
                <code className="text-xs bg-muted px-1 rounded">GET /financeiro/dashboard</code>.
              </p>
            ) : painelFinanceiro ? (
              <div className="space-y-6 sm:space-y-8">
                {(
                  [
                    {
                      etapa: 1 as const,
                      pill: "Competência",
                      titulo: "Lançamentos no mês",
                      subtitulo:
                        "Recorte por data de emissão da conta no período (competência contábil).",
                      celulas: [
                        {
                          legenda: "compras do mês",
                          valor: painelFinanceiro.linha_registrado.compras,
                        },
                        {
                          legenda: "despesa do mês",
                          valor: painelFinanceiro.linha_registrado.despesas,
                        },
                        {
                          legenda: "venda do mês",
                          valor: painelFinanceiro.linha_registrado.vendas,
                        },
                        {
                          legenda: "saldo do mês",
                          valor: painelFinanceiro.linha_registrado.saldo,
                        },
                      ],
                    },
                    {
                      etapa: 2 as const,
                      pill: "Caixa",
                      titulo: "Pago / recebido no período",
                      subtitulo:
                        "Efetivação financeira conforme datas de pagamento e recebimentos.",
                      celulas: [
                        {
                          legenda: "compras paga",
                          valor: painelFinanceiro.linha_caixa.compras,
                        },
                        {
                          legenda: "despesa paga",
                          valor: painelFinanceiro.linha_caixa.despesas,
                        },
                        {
                          legenda: "vendas recebida",
                          valor: painelFinanceiro.linha_caixa.vendas,
                        },
                        {
                          legenda: "saldo",
                          valor: painelFinanceiro.linha_caixa.saldo,
                        },
                      ],
                    },
                    {
                      etapa: 3 as const,
                      pill: "Totais",
                      titulo: mesAnoFiltro.trim()
                        ? "Totais no período"
                        : "Totais gerais",
                      subtitulo: mesAnoFiltro.trim()
                        ? "Fechamento de referência no período selecionado (competência)."
                        : "Acumulado de todas as competências no sistema (independente do mês das linhas acima).",
                      celulas: [
                        {
                          legenda: "Total compras paga",
                          valor: painelFinanceiro.linha_totais_periodo.compras,
                        },
                        {
                          legenda: "despesa paga no período",
                          valor: painelFinanceiro.linha_totais_periodo.despesas,
                        },
                        {
                          legenda: "vendas recebida no período",
                          valor: painelFinanceiro.linha_totais_periodo.vendas,
                        },
                        {
                          legenda: "saldo do período",
                          valor: painelFinanceiro.linha_totais_periodo.saldo,
                        },
                      ],
                    },
                  ] as const
                ).map((bloco, blocoIdx) => (
                  <motion.section
                    key={bloco.titulo}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 + blocoIdx * 0.06 }}
                    className="rounded-xl border border-border/70 bg-card/80 p-4 shadow-sm backdrop-blur-[2px] sm:p-5 dark:bg-card/60"
                  >
                    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                          {bloco.etapa}
                        </span>
                        <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {bloco.pill}
                        </span>
                        <h3 className="text-base font-semibold text-slate-900 dark:text-foreground sm:text-lg">
                          {bloco.titulo}
                        </h3>
                      </div>
                    </div>
                    <p className="mb-4 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                      {bloco.subtitulo}
                    </p>
                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
                      {bloco.celulas.map((c, idx) => {
                        const valorN = numPainel(c.valor);
                        const kind = painelMetricKindFromLegenda(c.legenda);
                        const visual = painelMetricVisual[kind];
                        const Icon = visual.Icon;
                        return (
                          <motion.div
                            key={`${bloco.titulo}-${c.legenda}`}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.12 + blocoIdx * 0.05 + idx * 0.04 }}
                          >
                            <Card
                              className={`h-full overflow-hidden border border-border/60 shadow-none transition-shadow hover:shadow-md ${visual.border} bg-gradient-to-b from-background to-muted/30 dark:to-muted/20`}
                            >
                              <CardContent className="p-4 sm:p-4">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="line-clamp-3 text-xs font-medium leading-snug text-muted-foreground">
                                    {c.legenda}
                                  </p>
                                  <div
                                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${visual.iconWrap}`}
                                  >
                                    <Icon className="h-4 w-4" aria-hidden />
                                  </div>
                                </div>
                                <p
                                  className={`mt-3 text-xl font-bold tabular-nums tracking-tight sm:text-2xl ${painelValorClass(kind, valorN)}`}
                                >
                                  {formatCurrency(valorN)}
                                </p>
                              </CardContent>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.section>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-6 text-center">
                O backend ainda não envia{' '}
                <code className="text-xs bg-muted px-1 rounded">painel_acompanhamento</code>. Atualize a API e recarregue.
              </p>
            )}
            {painelFinanceiro ? (
              <div className="mt-6 flex gap-3 rounded-xl border border-sky-500/20 bg-sky-500/[0.06] px-4 py-3 dark:border-sky-500/25 dark:bg-sky-950/30">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" aria-hidden />
                <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  <span className="font-semibold text-foreground">Competência</span> usa a{' '}
                  <span className="font-semibold text-foreground">data de emissão</span> da conta no mês selecionado.{' '}
                  <span className="font-semibold text-foreground">Compras</span> somam contas a pagar de pedidos de compra;{' '}
                  <span className="font-semibold text-foreground">Despesas</span>, as demais contas a pagar.{' '}
                  <span className="font-semibold text-foreground">Caixa</span> segue pagamentos/recebimentos na data informada.
                </p>
              </div>
            ) : null}
          </div>
        </motion.div>

        {/* Contas Vencidas - Full Width */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Calendar className="w-5 h-5 text-red-600" />
              Contas Vencidas
            </h2>
          </div>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingContasVencidas ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Carregando contas vencidas...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : contasVencidas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      Nenhuma conta vencida
                    </TableCell>
                  </TableRow>
                ) : (
                  contasVencidas.slice(0, 5).map((conta) => {
                    const diasVencida = conta.dias_ate_vencimento || 0;
                    const diasTexto = diasVencida < 0 
                      ? `Vencida há ${Math.abs(diasVencida)} ${Math.abs(diasVencida) === 1 ? 'dia' : 'dias'}`
                      : conta.status_vencimento || 'Vencida';
                    
                    // Modelo sem parcelas: exibir apenas descrição (GUIA_MIGRACAO_SEM_PARCELAS)
                    const formatarDescricao = () => conta.descricao || '';
                    
                    return (
                      <TableRow key={conta.id}>
                        <TableCell>
                          <span className="font-medium">{conta.numero_conta || `CONTA-${conta.id}`}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">{formatarDescricao()}</span>
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap inline-block ${
                            conta.tipo === "RECEBER"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" 
                              : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                          }`}>
                            {conta.tipo === "RECEBER" ? "Receber" : "Pagar"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium whitespace-nowrap">
                            {formatCurrency(parseValor(conta.valor_restante || conta.valor_original))}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs px-2 py-1 rounded-full font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 whitespace-nowrap inline-block">
                            {diasTexto}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            {contasVencidas.length > 5 && (
              <div className="p-4 text-center text-sm text-muted-foreground border-t border-border">
                Mostrando 5 de {contasVencidas.length} contas vencidas
              </div>
            )}
          </div>
        </motion.div>

        {/* Tables Grid - Vendas Recentes e Produtos com Estoque Baixo */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Sales */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-foreground">Vendas Recentes</h2>
            </div>
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingPedidos ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                        Carregando vendas...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : recentSales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                        Nenhuma venda recente
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentSales.map((sale, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <span className="font-medium">{sale.cliente}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">{sale.produto}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium whitespace-nowrap">{sale.valor}</span>
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap inline-block ${
                            sale.status === "QUITADO" || sale.status === "Quitado"
                              ? "bg-cyan/10 text-cyan"
                              : sale.status === "ABERTO" || sale.status === "Pendente"
                                ? "bg-amber-500/10 text-amber-500"
                                : "bg-azure/10 text-azure"
                          }`}>
                            {sale.status === "ABERTO" ? "Pendente" : sale.status === "PARCIAL" ? "Aberto" : sale.status === "QUITADO" ? "Quitado" : sale.status === "CANCELADO" ? "Cancelado" : sale.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </motion.div>

          {/* Low Stock */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-foreground">Produtos com Estoque Baixo</h2>
            </div>
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Em Estoque</TableHead>
                    <TableHead>Mínimo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingProdutos ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                        Carregando produtos...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : lowStockProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                        Nenhum produto com estoque baixo
                      </TableCell>
                    </TableRow>
                  ) : (
                    lowStockProducts.map((product, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <span className="font-medium">{product.produto}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">{product.categoria}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-medium text-destructive whitespace-nowrap">{product.estoque}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground whitespace-nowrap">{product.minimo}</span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
