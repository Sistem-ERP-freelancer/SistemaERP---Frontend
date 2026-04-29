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
import type { ApiCentroCustoDespesa } from "@/services/centro-custo.service";
import { centroCustoService } from "@/services/centro-custo.service";
import { financeiroService } from "@/services/financeiro.service";
import { pedidosService } from "@/services/pedidos.service";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
    BarChart3,
    Calendar,
    ListFilter,
    Loader2,
    Scale,
    ShoppingCart,
    TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

type PainelMetricKind = "compras" | "vendas" | "saldo";

/** Recorte da 3ª faixa quando "Todos os meses" (histórico geral). */
type PainelTotaisGeraisModo = "emissao" | "pagos" | "a_receber";

function painelMetricKindFromLegenda(legenda: string): PainelMetricKind {
  const l = legenda.toLowerCase();
  if (l.includes("saldo")) return "saldo";
  if (l.includes("receber") && l.includes("aberto")) return "vendas";
  if (l.includes("recebido")) return "vendas";
  if (l.includes("venda")) return "vendas";
  if (l.includes("pagar") && l.includes("aberto")) return "compras";
  if (l.includes("compra")) return "compras";
  return "compras";
}

const painelMetricVisual: Record<
  PainelMetricKind,
  { border: string; iconWrap: string; Icon: LucideIcon }
> = {
  compras: {
    border: "border-l-4 border-l-red-600",
    iconWrap:
      "bg-red-500/[0.12] text-red-700 dark:bg-red-500/15 dark:text-red-400",
    Icon: ShoppingCart,
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
  if (kind === "compras") {
    return "text-red-700 dark:text-red-400";
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

function parseValorDashboard(valor: unknown): number {
  if (valor === null || valor === undefined || valor === "") return 0;
  const num =
    typeof valor === "string" ? parseFloat(valor) : Number(valor);
  return Number.isFinite(num) ? num : 0;
}

function labelStatusPedidoLike(status: string): string {
  const s = status.toUpperCase();
  if (s === "ABERTO") return "Pendente";
  if (s === "PARCIAL") return "Aberto";
  if (s === "QUITADO") return "Quitado";
  if (s === "CANCELADO") return "Cancelado";
  return status;
}

type VisualStatusLinha = "quitado" | "pendente" | "parcial" | "outro";

function visualStatusLinha(status: string): VisualStatusLinha {
  const s = status.toUpperCase();
  if (s === "QUITADO") return "quitado";
  if (s === "CANCELADO") return "outro";
  if (s === "PARCIAL") return "parcial";
  return "pendente";
}

function badgeClassesStatus(v: VisualStatusLinha): string {
  if (v === "quitado") return "bg-cyan/10 text-cyan";
  if (v === "pendente") return "bg-amber-500/10 text-amber-500";
  if (v === "parcial") return "bg-azure/10 text-azure";
  return "bg-muted text-muted-foreground";
}

const Dashboard = () => {
  /** Vazio = totais da 3ª faixa são histórico geral; linhas 1–2 usam o mês atual como referência. */
  const [mesAnoFiltro, setMesAnoFiltro] = useState<string>("");
  /** Só aplicado com "Todos os meses" (`painel_totais_gerais` no backend). */
  const [totaisGeraisModo, setTotaisGeraisModo] =
    useState<PainelTotaisGeraisModo>("pagos");

  const refMesYyyyMm = useMemo(() => {
    const mesEscolhido = mesAnoFiltro?.trim();
    return mesEscolhido || mesAnoAtualLocal();
  }, [mesAnoFiltro]);
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
      painel_totais_gerais: true,
      ...(totaisGeraisModo !== "emissao"
        ? { painel_totais_gerais_modo: totaisGeraisModo }
        : {}),
    };
  }, [mesAnoFiltro, totaisGeraisModo]);

  const { data: dashboardUnificado, isLoading: loadingUnificado } = useQuery({
    queryKey: [
      "dashboard",
      "unificado",
      parametrosDashboardFinanceiro,
      totaisGeraisModo,
    ],
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
    const regCompras = numPainel(linhaReg.compras);
    const regVendas = numPainel(linhaReg.vendas);
    const regDespesas = numPainel(linhaReg.despesas);
    const caixaCompras = numPainel(linhaCaixa.compras);
    const caixaVendas = numPainel(linhaCaixa.vendas);
    const caixaDespesas = numPainel(linhaCaixa.despesas);
    const totCompras = numPainel(linhaTot.compras);
    const totVendas = numPainel(linhaTot.vendas);
    const totDespesas = numPainel(linhaTot.despesas);
    /** Mantém o saldo visual coerente com os cards exibidos: vendas - compras. */
    const saldoRegCalculado = Number((regVendas - regCompras).toFixed(2));
    const saldoCaixaCalculado = Number((caixaVendas - caixaCompras).toFixed(2));
    const saldoTotCalculado = Number((totVendas - totCompras).toFixed(2));

    return {
      linha_registrado: {
        compras: regCompras,
        despesas: regDespesas,
        vendas: regVendas,
        saldo: saldoRegCalculado,
      },
      linha_caixa: {
        compras: caixaCompras,
        despesas: caixaDespesas,
        vendas: caixaVendas,
        saldo: saldoCaixaCalculado,
      },
      linha_totais_periodo: {
        compras: totCompras,
        despesas: totDespesas,
        vendas: totVendas,
        saldo: saldoTotCalculado,
      },
    };
  }, [dashboardUnificado]);

  const painelBlocos = useMemo(() => {
    if (!painelFinanceiro) return null;
    const f = painelFinanceiro;

    let totaisCelulas: { legenda: string; valor: number }[];
    let totaisSubtitulo: string;
    if (totaisGeraisModo === "pagos") {
      const pagoTotal =
        f.linha_totais_periodo.compras + f.linha_totais_periodo.despesas;
      const saldoCaixaAcumulado = Number(
        (f.linha_totais_periodo.vendas - pagoTotal).toFixed(2),
      );
      totaisCelulas = [
        { legenda: "Total pago", valor: pagoTotal },
        { legenda: "Total recebido", valor: f.linha_totais_periodo.vendas },
        {
          legenda: "Saldo (caixa acumulado)",
          valor: saldoCaixaAcumulado,
        },
      ];
      totaisSubtitulo =
        "Caixa acumulado: pagamentos em contas a pagar, recebimentos de vendas e despesas pagas (centro de custo).";
    } else if (totaisGeraisModo === "a_receber") {
      totaisCelulas = [
        {
          legenda: "A pagar (em aberto)",
          valor: f.linha_totais_periodo.compras,
        },
        {
          legenda: "A receber (em aberto)",
          valor: f.linha_totais_periodo.vendas,
        },
        { legenda: "Saldo em aberto", valor: f.linha_totais_periodo.saldo },
      ];
      totaisSubtitulo =
        "Soma do valor em aberto nas contas a pagar e a receber (pendente de quitação).";
    } else {
      totaisCelulas = [
        { legenda: "Total pago", valor: f.linha_totais_periodo.compras },
        { legenda: "Total recebido", valor: f.linha_totais_periodo.vendas },
        { legenda: "saldo do período", valor: f.linha_totais_periodo.saldo },
      ];
      totaisSubtitulo =
        "Acumulado de todas as competências no sistema (independente do mês das linhas acima).";
    }

    return [
      {
        etapa: 1 as const,
        pill: "Competência",
        titulo: "Lançamentos no mês",
        subtitulo:
          "Recorte por data de emissão da conta no período (competência contábil).",
        celulas: [
          { legenda: "compras do mês", valor: f.linha_registrado.compras },
          { legenda: "venda do mês", valor: f.linha_registrado.vendas },
          { legenda: "saldo do mês", valor: f.linha_registrado.saldo },
        ],
      },
      {
        etapa: 2 as const,
        pill: "Caixa",
        titulo: "Pago / recebido no período",
        subtitulo:
          "Efetivação financeira conforme datas de pagamento e recebimentos.",
        celulas: [
          { legenda: "compras paga", valor: f.linha_caixa.compras },
          { legenda: "vendas recebida", valor: f.linha_caixa.vendas },
          { legenda: "saldo", valor: f.linha_caixa.saldo },
        ],
      },
      {
        etapa: 3 as const,
        pill: "Totais",
        titulo: "Totais gerais",
        subtitulo: totaisSubtitulo,
        celulas: totaisCelulas,
        mostrarFiltroTotais: true,
      },
    ];
  }, [painelFinanceiro, mesAnoFiltro, totaisGeraisModo]);

  // Buscar pedidos recentes (vendas)
  const { data: pedidosData, isLoading: loadingPedidos } = useQuery({
    queryKey: ['pedidos', 'recentes'],
    queryFn: () => pedidosService.listar({ page: 1, limit: 5, tipo: 'VENDA' }),
    refetchInterval: 30000,
  });

  // Compras (pedidos) + despesas (centro de custo), mescladas por data
  const { data: comprasDespesasLinhas = [], isLoading: loadingComprasDespesas } =
    useQuery({
      queryKey: ["dashboard", "compras-despesas-recentes"],
      queryFn: async () => {
        type Linha = {
          key: string;
          sort: number;
          tipo: "COMPRA" | "DESPESA";
          ref: string;
          detalhe: string;
          valorFmt: string;
          statusLabel: string;
          statusVisual: VisualStatusLinha;
        };

        const [comprasRes, despesasRes] = await Promise.all([
          pedidosService.listar({ page: 1, limit: 12, tipo: "COMPRA" }),
          centroCustoService.listarDespesas(1, 12).catch(() => ({
            items: [] as ApiCentroCustoDespesa[],
            total: 0,
            page: 1,
            limit: 12,
          })),
        ]);

        let comprasList: unknown[] = [];
        if (Array.isArray(comprasRes)) comprasList = comprasRes;
        else if (
          comprasRes &&
          typeof comprasRes === "object" &&
          "data" in comprasRes &&
          Array.isArray((comprasRes as { data: unknown[] }).data)
        ) {
          comprasList = (comprasRes as { data: unknown[] }).data;
        } else if (
          comprasRes &&
          typeof comprasRes === "object" &&
          "pedidos" in comprasRes &&
          Array.isArray((comprasRes as { pedidos: unknown[] }).pedidos)
        ) {
          comprasList = (comprasRes as { pedidos: unknown[] }).pedidos;
        }

        const despesasItems = despesasRes?.items ?? [];

        const linhas: Linha[] = [];

        for (const raw of comprasList) {
          const pedido = raw as {
            id: number;
            fornecedor?: {
              nome_fantasia?: string;
              nome_razao?: string;
            };
            fornecedor_id?: number;
            numero_pedido?: string;
            itens?: unknown[];
            valor_total?: unknown;
            status?: string;
            created_at?: string;
            data_pedido?: string;
            updated_at?: string;
          };
          const forn = pedido.fornecedor;
          const ref =
            forn?.nome_fantasia ||
            forn?.nome_razao ||
            `Fornecedor #${pedido.fornecedor_id ?? "N/A"}`;
          const dt =
            pedido.created_at ||
            pedido.data_pedido ||
            pedido.updated_at ||
            "";
          const sort = dt ? new Date(dt).getTime() : 0;
          const st = String(pedido.status || "ABERTO").toUpperCase();
          const nItens = pedido.itens?.length ?? 0;
          linhas.push({
            key: `c-${pedido.id}`,
            sort: Number.isFinite(sort) ? sort : 0,
            tipo: "COMPRA",
            ref,
            detalhe: pedido.numero_pedido
              ? `Ped. ${pedido.numero_pedido} · ${nItens} item(ns)`
              : `${nItens} item(ns)`,
            valorFmt: formatCurrency(parseValorDashboard(pedido.valor_total)),
            statusLabel: labelStatusPedidoLike(st),
            statusVisual: visualStatusLinha(st),
          });
        }

        for (const d of despesasItems) {
          const totalPag = (d.pagamentos || []).reduce(
            (s, p) => s + parseValorDashboard(p.valor),
            0,
          );
          const v = parseValorDashboard(d.valor);
          let st: string;
          if (totalPag <= 0) st = "ABERTO";
          else if (totalPag >= v - 0.01) st = "QUITADO";
          else st = "PARCIAL";

          const dt = d.data || "";
          const sort = dt ? new Date(dt).getTime() : 0;
          const detalhe = [d.tipoNome, d.rocaNome].filter(Boolean).join(" · ");
          linhas.push({
            key: `d-${d.id}`,
            sort: Number.isFinite(sort) ? sort : 0,
            tipo: "DESPESA",
            ref: d.descricao?.trim() || "Despesa",
            detalhe: detalhe || "Centro de custo",
            valorFmt: formatCurrency(v),
            statusLabel: labelStatusPedidoLike(st),
            statusVisual: visualStatusLinha(st),
          });
        }

        linhas.sort((a, b) => b.sort - a.sort);
        return linhas.slice(0, 6);
      },
      refetchInterval: 30000,
      retry: false,
    });

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
    valor: formatCurrency(parseValorDashboard(pedido.valor_total)),
    data: pedido.created_at ? formatDate(pedido.created_at) : pedido.data_pedido ? formatDate(pedido.data_pedido) : 'N/A',
    status: pedido.status || 'Pendente',
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
            <div className="flex flex-col gap-4">
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
            ) : painelFinanceiro && painelBlocos ? (
              <div className="space-y-6 sm:space-y-8">
                {painelBlocos.map((bloco, blocoIdx) => (
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
                      {bloco.etapa === 1 ? (
                        <div className="flex w-full flex-col gap-1.5 rounded-xl border border-border/60 bg-background/80 px-3 py-2.5 shadow-sm sm:w-auto sm:min-w-[16rem] dark:bg-background/50">
                          <Label
                            htmlFor="dashboard-mes-ano"
                            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
                          >
                            <Calendar className="h-3.5 w-3.5 opacity-70" />
                            Mês de referência
                          </Label>
                          <div className="relative">
                            <input
                              id="dashboard-mes-ano"
                              type="month"
                              value={mesAnoFiltro}
                              onChange={(e) => setMesAnoFiltro(e.target.value)}
                              className={`h-10 w-full min-w-[12rem] rounded-lg border border-input bg-background px-3 text-sm font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                                mesAnoFiltro
                                  ? "text-foreground"
                                  : "text-transparent [&::-webkit-datetime-edit]:text-transparent [&::-webkit-datetime-edit-fields-wrapper]:text-transparent [&::-webkit-datetime-edit-text]:text-transparent [&::-webkit-datetime-edit-month-field]:text-transparent [&::-webkit-datetime-edit-year-field]:text-transparent"
                              }`}
                            />
                            {!mesAnoFiltro ? (
                              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm font-medium text-muted-foreground">
                                Todos os meses
                              </span>
                            ) : null}
                          </div>
                        </div>
                      ) : null}
                      {String(bloco.etapa) === "3" ? (
                        <div className="flex w-full flex-col gap-1.5 rounded-xl border border-border/60 bg-background/80 px-3 py-2.5 shadow-sm sm:w-auto sm:min-w-[18rem] dark:bg-background/50">
                          <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                            <ListFilter className="h-3.5 w-3.5 opacity-70" />
                            Visão dos totais gerais
                          </Label>
                          <Select
                            value={totaisGeraisModo}
                            onValueChange={(v) =>
                              setTotaisGeraisModo(v as PainelTotaisGeraisModo)
                            }
                          >
                            <SelectTrigger
                              id="dashboard-totais-gerais-modo"
                              className="h-10"
                              aria-label="Filtro da seção totais gerais"
                            >
                              <SelectValue placeholder="Escolher visão" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pagos">
                                Valores pagos e recebidos (caixa)
                              </SelectItem>
                              <SelectItem value="emissao">
                                Faturamento (competência acumulada)
                              </SelectItem>
                              <SelectItem value="a_receber">
                                Valores a receber e a pagar (em aberto)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      ) : null}
                    </div>
                    <p className="mb-4 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                      {bloco.subtitulo}
                    </p>
                    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
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
          </div>
        </motion.div>

        {/* Placeholder DRE (substitui a seção Contas Vencidas) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <div className="rounded-md border border-border bg-card px-6 py-16 sm:py-20 flex items-center justify-center min-h-[200px]">
            <p className="text-center text-muted-foreground text-sm sm:text-base">
              aqui está sendo implementado o DRE
            </p>
          </div>
        </motion.div>

        {/* Tables Grid - Vendas Recentes e Compras / despesas recentes */}
        <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recent Sales */}
          <motion.div
            className="min-w-0"
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
                    <TableHead className="text-center">Cliente</TableHead>
                    <TableHead className="text-center">Produto</TableHead>
                    <TableHead className="text-center">Valor</TableHead>
                    <TableHead className="text-center">Status</TableHead>
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
                        <TableCell className="text-center align-middle">
                          <span className="inline-block max-w-full font-medium">
                            {sale.cliente}
                          </span>
                        </TableCell>
                        <TableCell className="text-center align-middle">
                          <span className="inline-block max-w-full text-sm text-muted-foreground">
                            {sale.produto}
                          </span>
                        </TableCell>
                        <TableCell className="text-center align-middle">
                          <span className="inline-block font-medium whitespace-nowrap tabular-nums">
                            {sale.valor}
                          </span>
                        </TableCell>
                        <TableCell className="text-center align-middle">
                          <span
                            className={`inline-block whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium ${
                              sale.status === "QUITADO" || sale.status === "Quitado"
                                ? "bg-cyan/10 text-cyan"
                                : sale.status === "ABERTO" || sale.status === "Pendente"
                                  ? "bg-amber-500/10 text-amber-500"
                                  : "bg-azure/10 text-azure"
                            }`}
                          >
                            {sale.status === "ABERTO"
                              ? "Pendente"
                              : sale.status === "PARCIAL"
                                ? "Aberto"
                                : sale.status === "QUITADO"
                                  ? "Quitado"
                                  : sale.status === "CANCELADO"
                                    ? "Cancelado"
                                    : sale.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </motion.div>

          {/* Compras e despesas recentes (pedidos COMPRA + centro de custo) */}
          <motion.div
            className="min-w-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                Compras e despesas recentes
              </h2>
            </div>
            <div className="min-w-0 overflow-hidden rounded-md border">
              <Table
                noGutter
                contain
                className="table-fixed w-full text-xs sm:text-sm"
              >
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[14%] whitespace-normal px-1.5 py-2 text-center sm:px-2">
                      Tipo
                    </TableHead>
                    <TableHead className="w-[30%] whitespace-normal px-1.5 py-2 text-center sm:px-2">
                      Referência
                    </TableHead>
                    <TableHead className="w-[26%] whitespace-normal px-1.5 py-2 text-center sm:px-2">
                      Detalhe
                    </TableHead>
                    <TableHead className="w-[16%] whitespace-normal px-1.5 py-2 text-center sm:px-2">
                      Valor
                    </TableHead>
                    <TableHead className="w-[14%] whitespace-normal px-1.5 py-2 text-center sm:px-2">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingComprasDespesas ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="px-2 py-8 text-center text-muted-foreground"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Carregando compras e despesas...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : comprasDespesasLinhas.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="px-2 py-8 text-center text-muted-foreground"
                      >
                        Nenhuma compra ou despesa recente
                      </TableCell>
                    </TableRow>
                  ) : (
                    comprasDespesasLinhas.map((linha) => (
                      <TableRow key={linha.key}>
                        <TableCell className="w-[14%] p-1.5 text-center align-middle sm:p-2">
                          <span
                            className={`inline-block max-w-full rounded-full px-1.5 py-0.5 text-center text-[10px] font-medium leading-tight sm:px-2 sm:text-xs ${
                              linha.tipo === "COMPRA"
                                ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                                : "bg-amber-100 text-amber-900 dark:bg-amber-900/25 dark:text-amber-200"
                            }`}
                          >
                            {linha.tipo === "COMPRA" ? "Compra" : "Despesa"}
                          </span>
                        </TableCell>
                        <TableCell className="w-[30%] overflow-hidden p-1.5 text-center align-middle sm:p-2">
                          <span
                            className="inline-block max-w-full truncate text-center font-medium"
                            title={linha.ref}
                          >
                            {linha.ref}
                          </span>
                        </TableCell>
                        <TableCell className="w-[26%] overflow-hidden p-1.5 text-center align-middle sm:p-2">
                          <span
                            className="inline-block max-w-full truncate text-center text-muted-foreground"
                            title={linha.detalhe}
                          >
                            {linha.detalhe}
                          </span>
                        </TableCell>
                        <TableCell className="w-[16%] overflow-hidden p-1.5 text-center align-middle sm:p-2">
                          <span
                            className="inline-block max-w-full truncate text-center font-medium tabular-nums"
                            title={linha.valorFmt}
                          >
                            {linha.valorFmt}
                          </span>
                        </TableCell>
                        <TableCell className="w-[14%] overflow-hidden p-1.5 text-center align-middle sm:p-2">
                          <span
                            className={`inline-block max-w-full truncate rounded-full px-1.5 py-0.5 text-center text-[10px] font-medium leading-tight sm:px-2 sm:text-xs ${badgeClassesStatus(
                              linha.statusVisual,
                            )}`}
                            title={linha.statusLabel}
                          >
                            {linha.statusLabel}
                          </span>
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
