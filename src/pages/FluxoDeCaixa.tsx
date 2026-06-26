import AppLayout from '@/components/layout/AppLayout';
import { ModulePageHeader } from '@/components/layout/ModulePageHeader';
import {
  ModuleStatCards,
  type ModuleStatCardItem,
} from '@/components/layout/ModuleStatCards';
import { statTheme } from '@/components/layout/module-stat-themes';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  MapPin,
  RotateCcw,
  Wallet,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
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

type PeriodoPreset = 'mes-atual' | 'mes-anterior' | 'proximos-30' | 'personalizado';

const PERIODO_PRESETS: { id: PeriodoPreset; label: string }[] = [
  { id: 'mes-atual', label: 'Este mês' },
  { id: 'mes-anterior', label: 'Mês anterior' },
  { id: 'proximos-30', label: 'Próximos 30 dias' },
];

function calcularPeriodoPreset(preset: PeriodoPreset): {
  dataInicial: string;
  dataFinal: string;
} {
  const hoje = new Date();
  if (preset === 'mes-anterior') {
    const ref = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
    return {
      dataInicial: inicioDoMesYMD(ref),
      dataFinal: fimDoMesYMD(ref),
    };
  }
  if (preset === 'proximos-30') {
    const fim = new Date(hoje);
    fim.setDate(fim.getDate() + 29);
    return { dataInicial: toYMD(hoje), dataFinal: toYMD(fim) };
  }
  return {
    dataInicial: inicioDoMesYMD(hoje),
    dataFinal: fimDoMesYMD(hoje),
  };
}

function detectarPreset(
  dataInicial: string,
  dataFinal: string,
): PeriodoPreset {
  for (const { id } of PERIODO_PRESETS) {
    const p = calcularPeriodoPreset(id);
    if (p.dataInicial === dataInicial && p.dataFinal === dataFinal) return id;
  }
  return 'personalizado';
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

  const [formDataInicial, setFormDataInicial] = useState(padrao.dataInicial);
  const [formDataFinal, setFormDataFinal] = useState(padrao.dataFinal);
  const [formRocaId, setFormRocaId] = useState<string>('todas');
  const [presetAtivo, setPresetAtivo] = useState<PeriodoPreset>('mes-atual');

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

  const aplicarFiltros = useCallback(() => {
    if (!formDataInicial || !formDataFinal) {
      toast.error('Informe o período completo.');
      return;
    }
    if (formDataInicial > formDataFinal) {
      toast.error('A data inicial não pode ser maior que a data final.');
      return;
    }
    const rocaId =
      formRocaId !== 'todas' ? Number.parseInt(formRocaId, 10) : undefined;
    if (formRocaId !== 'todas' && (!rocaId || Number.isNaN(rocaId))) {
      toast.error('Selecione uma roça válida.');
      return;
    }
    setPresetAtivo(detectarPreset(formDataInicial, formDataFinal));
    setFiltros({
      dataInicial: formDataInicial,
      dataFinal: formDataFinal,
      rocaId: rocaId && rocaId > 0 ? rocaId : undefined,
    });
  }, [formDataInicial, formDataFinal, formRocaId]);

  const aplicarPreset = useCallback(
    (preset: PeriodoPreset) => {
      const { dataInicial, dataFinal } = calcularPeriodoPreset(preset);
      setPresetAtivo(preset);
      setFormDataInicial(dataInicial);
      setFormDataFinal(dataFinal);
      const rocaId =
        formRocaId !== 'todas' ? Number.parseInt(formRocaId, 10) : undefined;
      setFiltros({
        dataInicial,
        dataFinal,
        rocaId: rocaId && rocaId > 0 ? rocaId : undefined,
      });
    },
    [formRocaId],
  );

  const restaurarPadrao = useCallback(() => {
    const { dataInicial, dataFinal } = calcularPeriodoPreset('mes-atual');
    setFormRocaId('todas');
    setPresetAtivo('mes-atual');
    setFormDataInicial(dataInicial);
    setFormDataFinal(dataFinal);
    setFiltros({
      dataInicial,
      dataFinal,
      rocaId: undefined,
    });
  }, []);

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

        <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 bg-gradient-to-r from-[#003366]/[0.07] via-sky-50/40 to-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#003366] text-white shadow-sm">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#003366]">
                  Parâmetros da projeção
                </p>
                <p className="text-xs text-slate-500">
                  Escolha um atalho ou defina datas e roça manualmente
                </p>
              </div>
            </div>
            {!isLoading && fluxoData && (
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <Badge
                  variant="outline"
                  className="border-sky-200 bg-white/80 font-normal text-slate-700"
                >
                  {formatDate(filtros.dataInicial)} — {formatDate(filtros.dataFinal)}
                </Badge>
                <Badge
                  variant="outline"
                  className="border-emerald-200 bg-white/80 font-normal text-slate-700"
                >
                  <MapPin className="mr-1 h-3 w-3 text-emerald-600" />
                  {rocaAplicadaNome}
                </Badge>
              </div>
            )}
          </div>

          <div className="space-y-5 p-4 sm:p-5">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Atalhos de período
              </p>
              <div className="flex flex-wrap gap-2">
                {PERIODO_PRESETS.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => aplicarPreset(id)}
                    className={cn(
                      'rounded-full px-3.5 py-1.5 text-xs font-medium transition-all',
                      presetAtivo === id
                        ? 'bg-[#003366] text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                    )}
                  >
                    {label}
                  </button>
                ))}
                {presetAtivo === 'personalizado' && (
                  <span className="inline-flex items-center rounded-full border border-dashed border-slate-300 px-3 py-1.5 text-xs text-slate-500">
                    Período personalizado
                  </span>
                )}
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_auto] xl:items-end">
              <div className="space-y-1.5">
                <Label htmlFor="fluxo-data-inicio" className="text-slate-600">
                  Data inicial
                </Label>
                <div className="relative">
                  <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="fluxo-data-inicio"
                    type="date"
                    value={formDataInicial}
                    onChange={(e) => {
                      setFormDataInicial(e.target.value);
                      setPresetAtivo('personalizado');
                    }}
                    className="border-slate-200 bg-slate-50/40 pl-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fluxo-data-fim" className="text-slate-600">
                  Data final
                </Label>
                <div className="relative">
                  <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="fluxo-data-fim"
                    type="date"
                    value={formDataFinal}
                    onChange={(e) => {
                      setFormDataFinal(e.target.value);
                      setPresetAtivo('personalizado');
                    }}
                    className="border-slate-200 bg-slate-50/40 pl-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-slate-600">Roça</Label>
                <Select value={formRocaId} onValueChange={setFormRocaId}>
                  <SelectTrigger className="border-slate-200 bg-slate-50/40">
                    <span className="flex items-center gap-2 truncate">
                      <MapPin className="h-4 w-4 shrink-0 text-emerald-600" />
                      <SelectValue placeholder="Selecione a roça" />
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas as roças</SelectItem>
                    {rocasAtivas.map((r) => (
                      <SelectItem key={r.id} value={String(r.id)}>
                        {r.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-wrap gap-2 md:col-span-2 xl:col-span-1 xl:flex-col xl:justify-end">
                <Button
                  type="button"
                  className="min-w-[120px] flex-1 gap-2 bg-[#003366] hover:bg-[#002244] xl:flex-none"
                  onClick={aplicarFiltros}
                  disabled={isFetching}
                >
                  {isFetching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Filter className="h-4 w-4" />
                  )}
                  Atualizar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="min-w-[120px] flex-1 gap-2 border-slate-200 bg-white hover:bg-slate-50 xl:flex-none"
                  onClick={exportarExcel}
                  disabled={!fluxoData || isLoading}
                >
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                  Excel
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-slate-500 hover:text-[#003366] xl:self-end"
                  onClick={restaurarPadrao}
                  title="Restaurar padrão (mês atual, todas as roças)"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
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
