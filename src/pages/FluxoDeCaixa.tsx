import AppLayout from '@/components/layout/AppLayout';
import { ModulePageHeader } from '@/components/layout/ModulePageHeader';
import {
  ModuleStatCards,
  type ModuleStatCardItem,
} from '@/components/layout/ModuleStatCards';
import { statTheme } from '@/components/layout/module-stat-themes';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { exportarFluxoCaixaExcel } from '@/lib/fluxo-caixa-export';
import { fimDoMesYMD, toYMD } from '@/lib/contas-financeiras-listagem';
import { extractApiErrorMessage } from '@/lib/api-error-message';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { controleRocaService } from '@/services/controle-roca.service';
import {
  financeiroService,
  type FluxoCaixaLinha,
} from '@/services/financeiro.service';
import type { Roca } from '@/types/roca';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowDownRight,
  ArrowUpRight,
  Calculator,
  Calendar,
  ChevronDown,
  ChevronRight,
  FileSpreadsheet,
  Filter,
  LineChart,
  Loader2,
  Wallet,
} from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

type DiaColuna = {
  key: string;
  label: string;
  weekday: string;
};

type LinhaTabela = FluxoCaixaLinha;

const GRADE_BORDA = 'border border-slate-200';

function inicioDoMesYMD(ref = new Date()): string {
  return toYMD(new Date(ref.getFullYear(), ref.getMonth(), 1));
}

function periodoPadrao() {
  const hoje = new Date();
  return {
    dataInicial: inicioDoMesYMD(hoje),
    dataFinal: fimDoMesYMD(hoje),
  };
}

function abrirSeletorDataNativo(input: HTMLInputElement | null) {
  if (!input) return;
  input.focus();
  const el = input as HTMLInputElement & { showPicker?: () => void };
  try {
    if (typeof el.showPicker === 'function') {
      el.showPicker();
      return;
    }
  } catch {
    // falha de permissão em alguns contextos
  }
  input.click();
}

function FiltroPeriodoDateInput({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="relative">
      <Input
        ref={inputRef}
        id={id}
        type="date"
        className="h-10 w-full rounded-xl border-2 bg-muted/40 pl-3 pr-10 [color-scheme:light] dark:[color-scheme:dark] [&::-moz-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:hidden"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        type="button"
        onClick={() => abrirSeletorDataNativo(inputRef.current)}
        className="absolute right-0.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground focus-visible:outline focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Abrir calendário"
      >
        <Calendar className="h-4 w-4 shrink-0" />
      </button>
    </div>
  );
}

function formatValorCelula(value: number | null): string {
  if (value === null) return '-';
  const abs = Math.abs(value).toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return value < 0 ? `-${abs}` : abs;
}

function corValorCelula(
  value: number | null,
  tipo: LinhaTabela['tipo'],
): string {
  if (value === null) return 'text-slate-400';
  if (tipo === 'saldo-acumulado') {
    return 'font-bold text-[#003366]';
  }
  if (tipo === 'subtotal') {
    return 'font-bold text-rose-600';
  }
  if (tipo === 'saldo-dia') {
    if (value < 0) return 'font-bold text-rose-600';
    if (value > 0) return 'font-bold text-emerald-600';
    return 'font-bold text-slate-500';
  }
  return 'text-slate-800';
}

function FluxoDeCaixaTabela({
  linhas,
  dias,
  entradasAberto,
  saidasAberto,
  onToggleEntradas,
  onToggleSaidas,
  isLoading,
}: {
  linhas: LinhaTabela[];
  dias: DiaColuna[];
  entradasAberto: boolean;
  saidasAberto: boolean;
  onToggleEntradas: () => void;
  onToggleSaidas: () => void;
  isLoading?: boolean;
}) {
  const linhasVisiveis = useMemo(() => {
    return linhas.filter((linha) => {
      if (linha.tipo === 'secao') return true;
      if (linha.secao === 'entradas' && !entradasAberto) return false;
      if (linha.secao === 'saidas' && !saidasAberto) return false;
      return true;
    });
  }, [linhas, entradasAberto, saidasAberto]);

  const celulaGrade = cn(GRADE_BORDA, 'px-3 py-2.5');

  if (isLoading) {
    return (
      <div className="flex min-h-[280px] items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-[#003366]" />
      </div>
    );
  }

  if (dias.length === 0) {
    return (
      <div className="flex min-h-[200px] items-center justify-center py-12 text-sm text-slate-500">
        Nenhum dado para o período selecionado.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-1">
      <table className="w-full min-w-[780px] border-collapse bg-white text-sm">
        <thead>
          <tr>
            <th
              className={cn(
                celulaGrade,
                'sticky left-0 z-20 min-w-[220px] bg-sky-50/90 text-left text-sm font-bold text-[#003366]',
              )}
            >
              Centro de custo / Categoria
            </th>
            {dias.map((dia, idx) => (
              <th
                key={dia.key}
                className={cn(
                  celulaGrade,
                  'min-w-[96px] bg-sky-50/90 text-center font-bold text-[#003366]',
                  idx === dias.length - 1 && 'min-w-[100px]',
                )}
              >
                <div>{dia.label}</div>
                <div className="text-xs font-normal text-slate-500">
                  ({dia.weekday})
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhasVisiveis.map((linha) => {
            if (linha.tipo === 'secao') {
              const isEntradas = linha.secao === 'entradas';
              const aberto = isEntradas ? entradasAberto : saidasAberto;
              const onToggle = isEntradas ? onToggleEntradas : onToggleSaidas;
              const secaoBg = isEntradas ? 'bg-emerald-50/80' : 'bg-rose-50/80';

              return (
                <tr key={linha.id}>
                  <td
                    className={cn(
                      celulaGrade,
                      'sticky left-0 z-10',
                      secaoBg,
                    )}
                  >
                    <button
                      type="button"
                      onClick={onToggle}
                      className={cn(
                        'flex items-center gap-1.5 text-xs font-bold tracking-wide',
                        isEntradas ? 'text-emerald-700' : 'text-rose-700',
                      )}
                    >
                      {aberto ? (
                        <ChevronDown className="h-4 w-4 shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0" />
                      )}
                      {linha.label}
                    </button>
                  </td>
                  {dias.map((dia) => (
                    <td
                      key={`${linha.id}-${dia.key}`}
                      className={cn(celulaGrade, secaoBg)}
                    />
                  ))}
                </tr>
              );
            }

            const labelBg =
              linha.tipo === 'subtotal'
                ? 'bg-rose-50/50'
                : linha.tipo === 'saldo-dia'
                  ? 'bg-slate-50/70'
                  : linha.tipo === 'saldo-acumulado'
                    ? 'bg-sky-50/60'
                    : 'bg-white';

            const labelClass = cn(
              celulaGrade,
              'sticky left-0 z-10 text-left text-slate-800',
              labelBg,
              linha.indent && 'pl-8',
              linha.tipo === 'subtotal' && 'font-semibold text-rose-700',
              linha.tipo === 'saldo-dia' && 'font-semibold text-slate-800',
              linha.tipo === 'saldo-acumulado' &&
                'font-bold text-[#003366]',
            );

            return (
              <tr key={linha.id}>
                <td className={labelClass}>{linha.label}</td>
                {linha.valores.map((valor, idx) => (
                  <td
                    key={`${linha.id}-${dias[idx]?.key ?? idx}`}
                    className={cn(
                      celulaGrade,
                      'bg-white text-center tabular-nums',
                      corValorCelula(valor, linha.tipo),
                      linha.tipo === 'subtotal' && 'bg-rose-50/30',
                      linha.tipo === 'saldo-dia' && 'bg-slate-50/50',
                      linha.tipo === 'saldo-acumulado' && 'bg-sky-50/40',
                    )}
                  >
                    {formatValorCelula(valor)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function FluxoDeCaixa() {
  const padrao = useMemo(() => periodoPadrao(), []);
  const [entradasAberto, setEntradasAberto] = useState(true);
  const [saidasAberto, setSaidasAberto] = useState(true);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [formDataInicial, setFormDataInicial] = useState(padrao.dataInicial);
  const [formDataFinal, setFormDataFinal] = useState(padrao.dataFinal);
  const [formRocaId, setFormRocaId] = useState<string>('todas');

  const [filtros, setFiltros] = useState({
    dataInicial: padrao.dataInicial,
    dataFinal: padrao.dataFinal,
    rocaId: undefined as number | undefined,
  });

  const { data: rocasApi = [] } = useQuery({
    queryKey: ['fluxo-caixa', 'rocas-ativas'],
    queryFn: () => controleRocaService.listarRocas(undefined, false),
  });

  const rocasAtivas = useMemo(
    () => (rocasApi as Roca[]).filter((r) => r.ativo !== false),
    [rocasApi],
  );

  const {
    data: fluxoData,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      'fluxo-caixa',
      filtros.dataInicial,
      filtros.dataFinal,
      filtros.rocaId ?? 'todas',
    ],
    queryFn: () =>
      financeiroService.obterFluxoCaixa({
        data_inicial: filtros.dataInicial,
        data_final: filtros.dataFinal,
        roca_id: filtros.rocaId,
      }),
    staleTime: 30_000,
  });

  const dias: DiaColuna[] = useMemo(
    () =>
      (fluxoData?.colunas ?? []).map((c) => ({
        key: c.data,
        label: c.label,
        weekday: c.weekday,
      })),
    [fluxoData?.colunas],
  );

  const linhas = fluxoData?.linhas ?? [];

  const resumoCards: ModuleStatCardItem[] = useMemo(() => {
    const cards = fluxoData?.cards;
    return [
      {
        key: 'saldo-inicial',
        label: 'Saldo inicial',
        value: formatCurrency(cards?.saldo_inicial ?? 0),
        Icon: Wallet,
        ...statTheme.blue,
      },
      {
        key: 'total-receber',
        label: 'Total a receber',
        value: formatCurrency(cards?.total_a_receber ?? 0),
        Icon: ArrowUpRight,
        ...statTheme.emerald,
      },
      {
        key: 'total-pagar',
        label: 'Total a pagar',
        value: formatCurrency(cards?.total_a_pagar ?? 0),
        Icon: ArrowDownRight,
        ...statTheme.rose,
      },
      {
        key: 'saldo-projetado',
        label: 'Saldo projetado',
        value: formatCurrency(cards?.saldo_projetado ?? 0),
        Icon: Calculator,
        iconWrap: 'bg-sky-50',
        iconClass: 'text-[#003366]',
        valueClass: 'text-[#003366]',
      },
    ];
  }, [fluxoData?.cards]);

  const aplicarFiltros = useCallback((): boolean => {
    if (!formDataInicial || !formDataFinal) {
      toast.error('Informe o período completo.');
      return false;
    }
    if (formDataInicial > formDataFinal) {
      toast.error('A data inicial não pode ser maior que a data final.');
      return false;
    }
    const rocaId =
      formRocaId !== 'todas' ? Number.parseInt(formRocaId, 10) : undefined;
    if (formRocaId !== 'todas' && (!rocaId || Number.isNaN(rocaId))) {
      toast.error('Selecione uma roça válida.');
      return false;
    }
    setFiltros({
      dataInicial: formDataInicial,
      dataFinal: formDataFinal,
      rocaId: rocaId && rocaId > 0 ? rocaId : undefined,
    });
    return true;
  }, [formDataInicial, formDataFinal, formRocaId]);

  const abrirSheetFiltros = useCallback(() => {
    setFormDataInicial(filtros.dataInicial);
    setFormDataFinal(filtros.dataFinal);
    setFormRocaId(
      filtros.rocaId != null && filtros.rocaId > 0
        ? String(filtros.rocaId)
        : 'todas',
    );
    setSheetOpen(true);
  }, [filtros]);

  const handleAplicarFiltrosSheet = useCallback(() => {
    if (aplicarFiltros()) setSheetOpen(false);
  }, [aplicarFiltros]);

  const handleLimparFiltrosSheet = useCallback(() => {
    setFormDataInicial(padrao.dataInicial);
    setFormDataFinal(padrao.dataFinal);
    setFormRocaId('todas');
    setFiltros({
      dataInicial: padrao.dataInicial,
      dataFinal: padrao.dataFinal,
      rocaId: undefined,
    });
    setSheetOpen(false);
  }, [padrao.dataInicial, padrao.dataFinal]);

  const temFiltrosAtivos =
    filtros.dataInicial !== padrao.dataInicial ||
    filtros.dataFinal !== padrao.dataFinal ||
    filtros.rocaId != null;

  const contagemFiltrosAvancado =
    (filtros.dataInicial !== padrao.dataInicial ? 1 : 0) +
    (filtros.dataFinal !== padrao.dataFinal ? 1 : 0) +
    (filtros.rocaId != null ? 1 : 0);

  const rocaAplicadaNome = useMemo(() => {
    if (filtros.rocaId == null) return 'Todas as roças';
    return (
      rocasAtivas.find((r) => r.id === filtros.rocaId)?.nome ??
      `Roça #${filtros.rocaId}`
    );
  }, [filtros.rocaId, rocasAtivas]);

  const exportarExcel = useCallback(() => {
    if (!fluxoData) {
      toast.error('Carregue os dados antes de exportar.');
      return;
    }
    const rocaNome =
      filtros.rocaId != null
        ? rocasAtivas.find((r) => r.id === filtros.rocaId)?.nome
        : undefined;
    try {
      exportarFluxoCaixaExcel(fluxoData, { rocaNome });
      toast.success('Planilha exportada com sucesso.');
    } catch (e) {
      toast.error(extractApiErrorMessage(e) || 'Não foi possível exportar.');
    }
  }, [fluxoData, filtros.rocaId, rocasAtivas]);

  const erroMsg = error ? extractApiErrorMessage(error) : null;

  return (
    <AppLayout>
      <div className="p-3 sm:p-4 md:p-6">
        <ModulePageHeader
          icon={LineChart}
          title="Fluxo de Caixa"
          subtitle="Projeção diária — centros de custo x datas"
        />

        <div className="mb-6 rounded-xl border border-border bg-card p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-nowrap sm:items-stretch sm:gap-4">
            <div className="order-1 flex w-full min-w-0 sm:w-auto sm:shrink-0">
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2 sm:w-auto"
                onClick={abrirSheetFiltros}
                style={
                  temFiltrosAtivos
                    ? { borderColor: 'var(--primary)', borderWidth: '2px' }
                    : undefined
                }
              >
                <Filter className="h-4 w-4" />
                Filtros
                {contagemFiltrosAvancado > 0 ? (
                  <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                    {contagemFiltrosAvancado}
                  </span>
                ) : null}
              </Button>
            </div>

            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetContent
                side="right"
                className="w-[400px] max-w-full overflow-y-auto sm:w-[540px]"
              >
                <SheetHeader className="mb-6">
                  <div className="mb-2 flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Filter className="h-5 w-5 text-primary" />
                    </div>
                    <SheetTitle className="text-xl">Filtros Avançados</SheetTitle>
                  </div>
                  <SheetDescription>Refine sua busca</SheetDescription>
                </SheetHeader>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">Período</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label
                          className="text-xs text-muted-foreground"
                          htmlFor="fluxo-filtro-data-ini"
                        >
                          Data Inicial
                        </Label>
                        <FiltroPeriodoDateInput
                          id="fluxo-filtro-data-ini"
                          value={formDataInicial}
                          onChange={setFormDataInicial}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          className="text-xs text-muted-foreground"
                          htmlFor="fluxo-filtro-data-fim"
                        >
                          Data Final
                        </Label>
                        <FiltroPeriodoDateInput
                          id="fluxo-filtro-data-fim"
                          value={formDataFinal}
                          onChange={setFormDataFinal}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">Roça</Label>
                    <Select value={formRocaId} onValueChange={setFormRocaId}>
                      <SelectTrigger className="w-full rounded-xl border-2">
                        <SelectValue placeholder="Todas as roças" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todas">Todas as roças</SelectItem>
                        {rocasAtivas.map((r) => (
                          <SelectItem key={r.id} value={String(r.id)}>
                            {r.nome}
                            {r.codigo ? ` (${r.codigo})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="flex gap-2 pt-2">
                    <Button
                      type="button"
                      onClick={handleAplicarFiltrosSheet}
                      className="flex-1 rounded-full"
                      disabled={isFetching}
                    >
                      {isFetching ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Aplicar Filtros
                    </Button>
                    <Button
                      type="button"
                      onClick={handleLimparFiltrosSheet}
                      variant="outline"
                      className="flex-1 rounded-full"
                    >
                      Limpar Filtros
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <div className="order-2 flex min-w-0 flex-1 items-center px-1">
              <p className="truncate text-sm text-muted-foreground">
                {formatDate(filtros.dataInicial)} — {formatDate(filtros.dataFinal)}
                <span className="mx-2 text-border">·</span>
                {rocaAplicadaNome}
              </p>
            </div>

            <div className="order-3 flex w-full min-w-0 sm:w-auto sm:shrink-0">
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2 sm:w-auto"
                onClick={exportarExcel}
                disabled={!fluxoData || isLoading}
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                Exportar Excel
              </Button>
            </div>
          </div>
        </div>

        {erroMsg && (
          <Card className="mb-4 border-rose-200 bg-rose-50/50">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm text-rose-700">
              <span>{erroMsg}</span>
              <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
                Tentar novamente
              </Button>
            </CardContent>
          </Card>
        )}

        <ModuleStatCards columns={4} items={resumoCards} isLoading={isLoading} />

        <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
          <CardContent className="p-0">
            <div className="flex items-center justify-end border-b border-slate-200 bg-slate-50/60 px-4 py-2">
              <p className="text-xs text-slate-500">← Role para ver mais datas</p>
            </div>

            <FluxoDeCaixaTabela
              linhas={linhas}
              dias={dias}
              entradasAberto={entradasAberto}
              saidasAberto={saidasAberto}
              onToggleEntradas={() => setEntradasAberto((v) => !v)}
              onToggleSaidas={() => setSaidasAberto((v) => !v)}
              isLoading={isLoading}
            />

            <div className="flex flex-col items-center gap-1 border-t border-slate-200 bg-slate-50/40 px-4 py-2.5">
              <p className="text-xs text-slate-500">Role para ver mais centros ↓</p>
              <div className="h-1.5 w-24 rounded-full bg-slate-200" />
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
