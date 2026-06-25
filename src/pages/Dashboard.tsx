import AppLayout from "@/components/layout/AppLayout";
import { ModuleStatCard } from "@/components/layout/ModuleStatCards";
import { statTheme } from "@/components/layout/module-stat-themes";
import { OrderStats } from "@/components/orders/OrderStats";
import { useAuth } from "@/contexts/AuthContext";
import { canAccessFinanceiro } from "@/lib/role-access";
import { Card, CardContent } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatISODateLocal } from "@/lib/utils";
import {
  centroCustoService,
  type ApiCentroCustoDespesa,
} from "@/services/centro-custo.service";
import { controleRocaService } from "@/services/controle-roca.service";
import { financeiroService } from "@/services/financeiro.service";
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
  { iconWrap: string; iconClass: string; valueClass: string; Icon: LucideIcon }
> = {
  compras: {
    ...statTheme.red,
    Icon: ShoppingCart,
  },
  vendas: {
    ...statTheme.emerald,
    Icon: TrendingUp,
  },
  saldo: {
    ...statTheme.blue,
    Icon: Scale,
  },
};

function painelValorClass(kind: PainelMetricKind, valor: number): string {
  if (kind === "saldo") {
    if (valor < 0) return statTheme.rose.valueClass;
    if (valor > 0) return statTheme.emerald.valueClass;
    return statTheme.blue.valueClass;
  }
  if (kind === "compras") {
    return statTheme.red.valueClass;
  }
  if (kind === "vendas" && valor > 0) {
    return statTheme.emerald.valueClass;
  }
  return statTheme.slate.valueClass;
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

/** Máximo por página na API de centro de custo (backend limita em 100). */
const CC_DRE_PAGE_LIMIT = 100;

async function agregarCentroCustoParaDre(filtros: {
  dataInicial?: string;
  dataFinal?: string;
  rocaId?: number;
}): Promise<{
  items: { tipoId: number; nome: string; valor: number }[];
  total: number;
}> {
  try {
    const res = await centroCustoService.agregarDespesasPorTipo(filtros);
    return {
      items: (res?.items ?? []).map((t) => ({
        tipoId: t.tipoId,
        nome: t.nome,
        valor: Number(t.valor.toFixed(2)),
      })),
      total: Number((res?.total ?? 0).toFixed(2)),
    };
  } catch {
    const despesas: ApiCentroCustoDespesa[] = [];
    let totalRegistros = Infinity;
    let page = 1;
    while ((page - 1) * CC_DRE_PAGE_LIMIT < totalRegistros) {
      const res = await centroCustoService.listarDespesas(
        page,
        CC_DRE_PAGE_LIMIT,
        filtros,
      );
      totalRegistros = res?.total ?? 0;
      despesas.push(...(res?.items ?? []));
      if (!res?.items?.length) break;
      page += 1;
    }
    const porTipo = new Map<number, { nome: string; valor: number }>();
    for (const d of despesas) {
      const tipoId = Number(d.tipoId) || 0;
      if (tipoId <= 0) continue;
      const valor = Number(d.valor) || 0;
      const nome = (d.tipoNome || `Tipo #${tipoId}`).trim();
      const cur = porTipo.get(tipoId);
      if (cur) cur.valor += valor;
      else porTipo.set(tipoId, { nome, valor });
    }
    const items = [...porTipo.entries()]
      .sort((a, b) =>
        a[1].nome.localeCompare(b[1].nome, "pt-BR", { sensitivity: "base" }),
      )
      .map(([tipoId, { nome, valor }]) => ({
        tipoId,
        nome,
        valor: Number(valor.toFixed(2)),
      }));
    return {
      items,
      total: Number(items.reduce((s, x) => s + x.valor, 0).toFixed(2)),
    };
  }
}

const Dashboard = () => {
  const { user } = useAuth();
  const acessoFinanceiro = canAccessFinanceiro(user?.role);

  /** Vazio = totais da 3ª faixa são histórico geral; linhas 1–2 usam o mês atual como referência. */
  const [mesAnoFiltro, setMesAnoFiltro] = useState<string>("");
  /** Só aplicado com "Todos os meses" (`painel_totais_gerais` no backend). */
  const [totaisGeraisModo, setTotaisGeraisModo] =
    useState<PainelTotaisGeraisModo>("pagos");
  const [dreMesAnoFiltro, setDreMesAnoFiltro] = useState<string>("");
  /** Filtro de roça compartilhado: painel financeiro (3 faixas) e DRE. */
  const [rocaFiltro, setRocaFiltro] = useState<string>("all");

  const refMesYyyyMm = useMemo(() => {
    const mesEscolhido = mesAnoFiltro?.trim();
    return mesEscolhido || mesAnoAtualLocal();
  }, [mesAnoFiltro]);
  const rocaIdFiltro = useMemo(() => {
    if (rocaFiltro === "all" || !Number.isFinite(Number(rocaFiltro))) return undefined;
    const id = Number(rocaFiltro);
    return id > 0 ? id : undefined;
  }, [rocaFiltro]);

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
      ...(rocaIdFiltro ? { roca_id: rocaIdFiltro } : {}),
    };
  }, [mesAnoFiltro, totaisGeraisModo, rocaIdFiltro]);

  const parametrosDre = useMemo(() => {
    const anoReferencia = Number(refMesYyyyMm.split("-")[0]) || new Date().getFullYear();
    const mesEscolhido = dreMesAnoFiltro?.trim();
    /** Vazio = mesmo recorte do Centro de Despesa sem filtro de data (todas as despesas). */
    if (!mesEscolhido) {
      return {
        semRecorteData: true as const,
        rotuloPeriodo: "Todo o período",
      };
    }
    const [ano, mes] = mesEscolhido.split("-").map(Number);
    const anoValido = Number.isFinite(ano) && ano > 0 ? ano : anoReferencia;
    const mesValido = Number.isFinite(mes) && mes > 0 ? mes : 1;
    const primeiro = new Date(anoValido, mesValido - 1, 1);
    const ultimo = new Date(anoValido, mesValido, 0);
    return {
      semRecorteData: false as const,
      data_inicial: formatISODateLocal(primeiro),
      data_final: formatISODateLocal(ultimo),
      rotuloPeriodo: `${String(mesValido).padStart(2, "0")}/${anoValido}`,
    };
  }, [dreMesAnoFiltro, refMesYyyyMm]);

  const { data: dashboardUnificado, isLoading: loadingUnificado } = useQuery({
    queryKey: [
      "dashboard",
      "unificado",
      parametrosDashboardFinanceiro,
      totaisGeraisModo,
      rocaFiltro,
    ],
    queryFn: () => financeiroService.getDashboardUnificado(parametrosDashboardFinanceiro),
    refetchInterval: 30000,
    retry: false,
    enabled: acessoFinanceiro,
  });

  const { data: rocasOpcoes = [] } = useQuery({
    queryKey: ["dashboard", "rocas-opcoes"],
    queryFn: () => controleRocaService.listarRocas(undefined, false),
    staleTime: 5 * 60 * 1000,
    retry: false,
    enabled: acessoFinanceiro,
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
    const regComprasRaw = numPainel(linhaReg.compras);
    const regVendas = numPainel(linhaReg.vendas);
    const regDespesas = numPainel(linhaReg.despesas);
    const caixaComprasRaw = numPainel(linhaCaixa.compras);
    const caixaVendas = numPainel(linhaCaixa.vendas);
    const caixaDespesas = numPainel(linhaCaixa.despesas);
    const totCompras = numPainel(linhaTot.compras);
    const totVendas = numPainel(linhaTot.vendas);
    const totDespesas = numPainel(linhaTot.despesas);
    /** Com roça: despesas do centro de custo entram em "compras" (mesma lógica do DRE). */
    const regCompras = rocaIdFiltro
      ? Number(Math.max(regComprasRaw, regDespesas).toFixed(2))
      : regComprasRaw;
    const caixaCompras = rocaIdFiltro
      ? Number(Math.max(caixaComprasRaw, caixaDespesas).toFixed(2))
      : caixaComprasRaw;
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
  }, [dashboardUnificado, rocaIdFiltro]);

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

  const { data: dreDadosReais, isLoading: loadingDre } = useQuery({
    queryKey: ["dashboard", "dre-real", parametrosDre, rocaFiltro],
    queryFn: async () => {
      const filtrosCentroCusto = parametrosDre.semRecorteData
        ? { ...(rocaIdFiltro ? { rocaId: rocaIdFiltro } : {}) }
        : {
            dataInicial: parametrosDre.data_inicial,
            dataFinal: parametrosDre.data_final,
            ...(rocaIdFiltro ? { rocaId: rocaIdFiltro } : {}),
          };

      const paramsDashboard = parametrosDre.semRecorteData
        ? {
            painel_totais_gerais: true as const,
            ...(rocaIdFiltro ? { roca_id: rocaIdFiltro } : {}),
          }
        : {
            data_inicial: parametrosDre.data_inicial,
            data_final: parametrosDre.data_final,
            painel_totais_gerais: true as const,
            ...(rocaIdFiltro ? { roca_id: rocaIdFiltro } : {}),
          };

      const [resumoFinanceiroMes, agregadoCentroCusto] = await Promise.all([
        financeiroService.getDashboardUnificado(paramsDashboard),
        agregarCentroCustoParaDre(filtrosCentroCusto),
      ]);

      const resumoRaw = resumoFinanceiroMes as Record<string, unknown>;
      const painelRaw =
        (resumoRaw.painel_acompanhamento as Record<string, unknown>) ??
        (resumoRaw.painelAcompanhamento as Record<string, unknown>) ??
        {};
      const linhaReg =
        (painelRaw.linha_registrado as Record<string, unknown>) ??
        (painelRaw.linhaRegistrado as Record<string, unknown>) ??
        {};
      const totalVendasEfetivas = numPainel(linhaReg.vendas);
      const totalFornecedores = numPainel(linhaReg.compras);

      const fornecedoresPorTipo = agregadoCentroCusto.items;
      const somaCentroDespesaNoPeriodo = agregadoCentroCusto.total;

      /** Com recorte mensal: diferença entre contas a pagar (competência) e centro de custo no mesmo período. */
      const fornecedoresDemaisCompras = parametrosDre.semRecorteData
        ? 0
        : Math.max(
            0,
            Number(
              (totalFornecedores - somaCentroDespesaNoPeriodo).toFixed(2),
            ),
          );

      const totalDespesasEfetivasDre = parametrosDre.semRecorteData
        ? somaCentroDespesaNoPeriodo
        : fornecedoresPorTipo.length === 0 && fornecedoresDemaisCompras <= 0.005
          ? totalFornecedores
          : Number(
              (somaCentroDespesaNoPeriodo + fornecedoresDemaisCompras).toFixed(
                2,
              ),
            );

      return {
        totalVendasEfetivas,
        totalFornecedores,
        totalDespesasEfetivasDre,
        fornecedoresPorTipo,
        fornecedoresDemaisCompras,
      };
    },
    refetchInterval: 30000,
    retry: false,
    enabled: acessoFinanceiro,
  });

  type DreLinha = {
    key: string;
    descricao: string;
    valor: number;
    percentual: number | null;
    indent?: boolean;
  };

  const dreLinhas = useMemo((): DreLinha[] => {
    const totalVendas = dreDadosReais?.totalVendasEfetivas ?? 0;
    const calcPct = (valor: number): number =>
      totalVendas > 0 ? Math.round((valor / totalVendas) * 100) : 0;

    const porTipo = dreDadosReais?.fornecedoresPorTipo ?? [];
    const demais = dreDadosReais?.fornecedoresDemaisCompras ?? 0;

    const linhasFornecedores: DreLinha[] = porTipo.map((t) => ({
      key: `forn-cc-${t.tipoId}`,
      descricao: t.nome,
      valor: t.valor,
      percentual: calcPct(t.valor),
      indent: true,
    }));

    if (demais > 0.005) {
      linhasFornecedores.push({
        key: "forn-demais",
        descricao: "Demais (fornecedores diretos / fora do centro de despesa)",
        valor: demais,
        percentual: calcPct(demais),
        indent: true,
      });
    }

    /** Nenhum lançamento de centro de despesa no período: mantém uma linha única como antes. */
    if (porTipo.length === 0 && demais <= 0.005) {
      const tf = dreDadosReais?.totalFornecedores ?? 0;
      linhasFornecedores.push({
        key: "forn-total",
        descricao: "Fornecedores",
        valor: tf,
        percentual: calcPct(tf),
      });
    }

    return [
      { key: "vendas", descricao: "Vendas", valor: totalVendas, percentual: 100 },
      ...linhasFornecedores,
    ];
  }, [dreDadosReais]);

  /** Mesma base do painel «Lançamentos no mês» (competência): resultado = vendas − despesas (despesas espelham a tabela do DRE). */
  const dreTotais = useMemo(() => {
    const totalVendasEfetivas = dreDadosReais?.totalVendasEfetivas ?? 0;
    const totalDespesasEfetivas =
      dreDadosReais?.totalDespesasEfetivasDre ??
      dreDadosReais?.totalFornecedores ??
      0;
    const resultadoEfetivoMes = Number(
      (totalVendasEfetivas - totalDespesasEfetivas).toFixed(2),
    );
    const margemResultado =
      totalVendasEfetivas > 0
        ? Number(((resultadoEfetivoMes / totalVendasEfetivas) * 100).toFixed(0))
        : 0;

    return {
      totalVendasEfetivas,
      totalDespesasEfetivas,
      resultadoEfetivoMes,
      margemResultado,
    };
  }, [dreDadosReais]);

  return (
    <AppLayout>
      <div className="p-3 sm:p-4 md:p-6 min-w-0">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            {acessoFinanceiro
              ? "Visão geral do seu negócio"
              : "Resumo de pedidos do seu perfil"}
          </p>
        </div>

        {!acessoFinanceiro ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-border/80 bg-card p-4 sm:p-6 shadow-sm"
          >
            <OrderStats variant="hero" />
            <p className="mt-4 text-sm text-muted-foreground text-center max-w-xl mx-auto">
              Seu perfil de vendedor tem acesso a pedidos, clientes e produtos.
              Relatórios financeiros ficam disponíveis para Administrador, Gerente ou Financeiro.
            </p>
          </motion.div>
        ) : null}

        {acessoFinanceiro ? (
        <>
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
                        <motion.div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-end" layout={false}>
                        <div className="flex w-full flex-col gap-1.5 rounded-xl border border-border/60 bg-background/80 px-3 py-2.5 shadow-sm sm:min-w-[16rem] dark:bg-background/50">
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
                          <motion.div className="flex w-full flex-col gap-1.5 rounded-xl border border-border/60 bg-background/80 px-3 py-2.5 shadow-sm sm:min-w-[16rem] dark:bg-background/50">
                            <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                              <ListFilter className="h-3.5 w-3.5 opacity-70" />
                              Roça
                            </Label>
                            <Select value={rocaFiltro} onValueChange={setRocaFiltro}>
                              <SelectTrigger
                                id="dashboard-painel-roca"
                                className="h-10"
                                aria-label="Filtrar painel por roça"
                              >
                                <SelectValue placeholder="Todas as roças" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">Todas as roças</SelectItem>
                                {rocasOpcoes.map((roca) => (
                                  <SelectItem key={roca.id} value={String(roca.id)}>
                                    {roca.nome}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </motion.div>
                        </motion.div>
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
                        return (
                          <motion.div
                            key={`${bloco.titulo}-${c.legenda}`}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.12 + blocoIdx * 0.05 + idx * 0.04 }}
                          >
                            <ModuleStatCard
                              item={{
                                key: `${bloco.titulo}-${c.legenda}`,
                                label: c.legenda,
                                value: formatCurrency(valorN),
                                iconWrap: visual.iconWrap,
                                iconClass: visual.iconClass,
                                valueClass: painelValorClass(kind, valorN),
                                Icon: visual.Icon,
                              }}
                            />
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

        {/* DRE - Demonstrativo de Resultados no Exercício */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <div className="rounded-xl border border-border/70 bg-card/80 p-4 shadow-sm backdrop-blur-[2px] sm:p-5 dark:bg-card/60">
            <div className="mb-4 border-b border-border/70 pb-3">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Financeiro
                  </p>
                  <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-900 dark:text-foreground sm:text-2xl">
                    DRE - Demonstrativo de Resultados no Exercício
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Valores por tipo espelham o{' '}
                    <strong className="font-medium text-foreground">Centro de Despesa</strong>
                    {parametrosDre.semRecorteData
                      ? " (todo o período, sem filtro de data)."
                      : ` (mês ${parametrosDre.rotuloPeriodo}).`}
                    {' '}Os totais à direita seguem a soma das linhas abaixo.
                  </p>
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-end sm:justify-end">
                  <div className="flex w-full flex-col gap-1.5 rounded-xl border border-border/60 bg-background/80 px-3 py-2.5 shadow-sm sm:w-auto sm:min-w-[16rem] dark:bg-background/50">
                  <Label
                    htmlFor="dashboard-dre-mes-ano"
                    className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
                  >
                    <Calendar className="h-3.5 w-3.5 opacity-70" />
                    Mês de referência
                  </Label>
                  <div className="relative">
                    <input
                      id="dashboard-dre-mes-ano"
                      type="month"
                      value={dreMesAnoFiltro}
                      onChange={(e) => setDreMesAnoFiltro(e.target.value)}
                      className={`h-10 w-full min-w-[12rem] rounded-lg border border-input bg-background px-3 text-sm font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        dreMesAnoFiltro
                          ? "text-foreground"
                          : "text-transparent [&::-webkit-datetime-edit]:text-transparent [&::-webkit-datetime-edit-fields-wrapper]:text-transparent [&::-webkit-datetime-edit-text]:text-transparent [&::-webkit-datetime-edit-month-field]:text-transparent [&::-webkit-datetime-edit-year-field]:text-transparent"
                      }`}
                    />
                    {!dreMesAnoFiltro ? (
                      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm font-medium text-muted-foreground">
                        Todo o período
                      </span>
                    ) : null}
                  </div>
                  </div>
                  <div className="flex w-full flex-col gap-1.5 rounded-xl border border-border/60 bg-background/80 px-3 py-2.5 shadow-sm sm:w-auto sm:min-w-[16rem] dark:bg-background/50">
                    <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <ListFilter className="h-3.5 w-3.5 opacity-70" />
                      Roça
                    </Label>
                    <Select value={rocaFiltro} onValueChange={setRocaFiltro}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Todas as roças" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as roças</SelectItem>
                        {rocasOpcoes.map((roca) => (
                          <SelectItem key={roca.id} value={String(roca.id)}>
                            {roca.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
              <div className="xl:col-span-8 overflow-x-auto rounded-xl border border-border/70 bg-background/70 dark:bg-background/40">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/60 hover:bg-muted/60">
                      <TableHead className="min-w-[260px] text-foreground">
                        Conta
                      </TableHead>
                      <TableHead className="text-right text-foreground">Valor</TableHead>
                      <TableHead className="text-right text-foreground">Percentual</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dreLinhas.map((linha) => (
                      <TableRow key={linha.key}>
                        <TableCell
                          className={
                            linha.indent
                              ? "pl-6 font-medium text-muted-foreground"
                              : "font-medium"
                          }
                        >
                          {linha.descricao}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap tabular-nums">
                          {loadingDre ? "..." : formatCurrency(linha.valor)}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap tabular-nums">
                          {linha.percentual === null ? "-" : `${linha.percentual}%`}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="xl:col-span-4 space-y-3">
                <div className="rounded-xl border border-border/70 overflow-hidden bg-background/70 dark:bg-background/40">
                  <div className="bg-muted px-4 py-2 text-sm font-semibold text-foreground">
                    Total de Vendas Efetivas
                  </div>
                  <div className="border-t border-border/60 px-4 py-2 text-right text-base font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                    {formatCurrency(dreTotais.totalVendasEfetivas)}
                  </div>
                </div>
                <div className="rounded-xl border border-border/70 overflow-hidden bg-background/70 dark:bg-background/40">
                  <div className="bg-muted px-4 py-2 text-sm font-semibold text-foreground">
                    Total de Despesas Efetivas
                  </div>
                  <div className="border-t border-border/60 px-4 py-2 text-right text-base font-bold text-red-700 dark:text-red-400 tabular-nums">
                    {formatCurrency(dreTotais.totalDespesasEfetivas)}
                  </div>
                </div>
                <div className="rounded-xl border border-border/70 overflow-hidden bg-background/70 dark:bg-background/40">
                  <div className="bg-muted px-4 py-2 text-sm font-semibold text-foreground">
                    RESULTADO EFETIVO MÊS
                  </div>
                  <div
                    className={`border-t border-border/60 px-4 py-2 text-right text-base font-bold tabular-nums ${
                      dreTotais.resultadoEfetivoMes < 0
                        ? "text-destructive"
                        : "text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {formatCurrency(dreTotais.resultadoEfetivoMes)}
                  </div>
                </div>
                <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-2 text-right text-sm font-semibold text-muted-foreground tabular-nums dark:bg-background/40">
                  {dreTotais.margemResultado}%
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        </>
        ) : null}
      </div>
    </AppLayout>
  );
};

export default Dashboard;
