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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn, formatCurrency } from '@/lib/utils';
import {
  ArrowDownRight,
  ArrowUpRight,
  Calculator,
  ChevronDown,
  ChevronRight,
  FileSpreadsheet,
  Filter,
  LineChart,
  Wallet,
} from 'lucide-react';
import { useMemo, useState } from 'react';

type DiaColuna = {
  key: string;
  label: string;
  weekday: string;
};

type LinhaTabela = {
  id: string;
  label: string;
  tipo:
    | 'secao'
    | 'item'
    | 'subtotal'
    | 'saldo-dia'
    | 'saldo-acumulado';
  secao?: 'entradas' | 'saidas';
  valores: (number | null)[];
  indent?: boolean;
};

const DIAS_MOCK: DiaColuna[] = [
  { key: '23', label: '23/06', weekday: 'Ter' },
  { key: '24', label: '24/06', weekday: 'Qua' },
  { key: '25', label: '25/06', weekday: 'Qui' },
  { key: '26', label: '26/06', weekday: 'Sex' },
  { key: '27', label: '27/06', weekday: 'Sáb' },
  { key: '28', label: '28/06', weekday: 'Dom' },
];

const LINHAS_MOCK: LinhaTabela[] = [
  {
    id: 'entradas-secao',
    label: 'ENTRADAS',
    tipo: 'secao',
    secao: 'entradas',
    valores: [],
  },
  {
    id: 'a-receber',
    label: 'A receber',
    tipo: 'item',
    secao: 'entradas',
    indent: true,
    valores: [15000, 8500, null, null, null, null],
  },
  {
    id: 'saidas-secao',
    label: 'SAÍDAS',
    tipo: 'secao',
    secao: 'saidas',
    valores: [],
  },
  {
    id: 'freelancer',
    label: 'Freelancer',
    tipo: 'item',
    secao: 'saidas',
    indent: true,
    valores: [5000, 3200, 2500, 3000, null, null],
  },
  {
    id: 'rh',
    label: 'RH',
    tipo: 'item',
    secao: 'saidas',
    indent: true,
    valores: [8000, 4000, 3200, 3500, null, null],
  },
  {
    id: 'insumos',
    label: 'Insumos',
    tipo: 'item',
    secao: 'saidas',
    indent: true,
    valores: [2500, 1200, null, null, null, null],
  },
  {
    id: 'combustivel',
    label: 'Combustível',
    tipo: 'item',
    secao: 'saidas',
    indent: true,
    valores: [1200, 500, 2000, 1500, null, 750],
  },
  {
    id: 'manutencao',
    label: 'Manutenção',
    tipo: 'item',
    secao: 'saidas',
    indent: true,
    valores: [800, 300, null, 1000, null, null],
  },
  {
    id: 'compras',
    label: 'Compras',
    tipo: 'item',
    secao: 'saidas',
    indent: true,
    valores: [null, null, null, null, null, null],
  },
  {
    id: 'total-saidas',
    label: 'Total saídas',
    tipo: 'subtotal',
    secao: 'saidas',
    valores: [17500, 9200, 7700, 9000, null, 750],
  },
  {
    id: 'saldo-dia',
    label: 'Saldo do dia',
    tipo: 'saldo-dia',
    valores: [-2500, -700, -7700, -9000, null, -750],
  },
  {
    id: 'saldo-acumulado',
    label: 'Saldo acumulado',
    tipo: 'saldo-acumulado',
    valores: [28500, 27800, 20100, 11100, 11100, 10350],
  },
];

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
    return 'font-bold text-[#003366] dark:text-sky-300';
  }
  if (tipo === 'subtotal') {
    return 'font-bold text-rose-600 dark:text-rose-400';
  }
  if (tipo === 'saldo-dia') {
    if (value < 0) return 'font-bold text-rose-600 dark:text-rose-400';
    if (value > 0) return 'font-bold text-emerald-600 dark:text-emerald-400';
    return 'font-bold text-slate-500';
  }
  return 'text-slate-700 dark:text-slate-200';
}

const RESUMO_CARDS: ModuleStatCardItem[] = [
  {
    key: 'saldo-inicial',
    label: 'Saldo inicial',
    value: formatCurrency(12450),
    ...statTheme.blue,
    Icon: Wallet,
  },
  {
    key: 'total-receber',
    label: 'Total a receber',
    value: formatCurrency(450000),
    ...statTheme.emerald,
    Icon: ArrowUpRight,
  },
  {
    key: 'total-pagar',
    label: 'Total a pagar',
    value: formatCurrency(132000),
    ...statTheme.rose,
    Icon: ArrowDownRight,
  },
  {
    key: 'saldo-projetado',
    label: 'Saldo projetado',
    value: formatCurrency(318000),
    ...statTheme.sky,
    Icon: Calculator,
  },
];

function FluxoDeCaixaTabela({
  linhas,
  dias,
  entradasAberto,
  saidasAberto,
  onToggleEntradas,
  onToggleSaidas,
}: {
  linhas: LinhaTabela[];
  dias: DiaColuna[];
  entradasAberto: boolean;
  saidasAberto: boolean;
  onToggleEntradas: () => void;
  onToggleSaidas: () => void;
}) {
  const linhasVisiveis = useMemo(() => {
    return linhas.filter((linha) => {
      if (linha.tipo === 'secao') return true;
      if (linha.secao === 'entradas' && !entradasAberto) return false;
      if (linha.secao === 'saidas' && !saidasAberto) return false;
      return true;
    });
  }, [linhas, entradasAberto, saidasAberto]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="sticky left-0 z-20 min-w-[220px] border-b border-slate-200 bg-sky-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#003366] dark:bg-sky-950/40 dark:text-sky-200">
              Centro de custo / Categoria
            </th>
            {dias.map((dia) => (
              <th
                key={dia.key}
                className="min-w-[92px] border-b border-slate-200 bg-sky-50 px-2 py-3 text-center font-semibold text-[#003366] dark:bg-sky-950/40 dark:text-sky-200"
              >
                <div className="text-sm">{dia.label}</div>
                <div className="text-xs font-normal text-slate-500 dark:text-slate-400">
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

              return (
                <tr
                  key={linha.id}
                  className={cn(
                    'border-b border-slate-100',
                    isEntradas
                      ? 'bg-emerald-50/90 dark:bg-emerald-950/20'
                      : 'bg-rose-50/90 dark:bg-rose-950/20',
                  )}
                >
                  <td
                    colSpan={dias.length + 1}
                    className={cn(
                      'sticky left-0 z-10 px-4 py-2.5',
                      isEntradas
                        ? 'bg-emerald-50/95 dark:bg-emerald-950/30'
                        : 'bg-rose-50/95 dark:bg-rose-950/30',
                    )}
                  >
                    <button
                      type="button"
                      onClick={onToggle}
                      className={cn(
                        'flex items-center gap-1.5 text-xs font-bold tracking-wide',
                        isEntradas
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-rose-700 dark:text-rose-400',
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
                </tr>
              );
            }

            const labelClass = cn(
              'sticky left-0 z-10 border-b border-slate-100 bg-white px-4 py-2.5 text-left text-slate-700 dark:bg-background dark:text-slate-200',
              linha.indent && 'pl-10',
              linha.tipo === 'subtotal' &&
                'bg-rose-50/40 font-semibold text-rose-700 dark:bg-rose-950/10 dark:text-rose-400',
              linha.tipo === 'saldo-dia' &&
                'bg-slate-50/80 font-semibold dark:bg-slate-900/40',
              linha.tipo === 'saldo-acumulado' &&
                'bg-sky-50/80 font-bold text-[#003366] dark:bg-sky-950/20 dark:text-sky-300',
            );

            const rowClass = cn(
              'border-b border-slate-100',
              linha.tipo === 'subtotal' && 'bg-rose-50/30 dark:bg-rose-950/10',
              linha.tipo === 'saldo-dia' && 'bg-slate-50/50 dark:bg-slate-900/20',
              linha.tipo === 'saldo-acumulado' &&
                'bg-sky-50/60 dark:bg-sky-950/15',
            );

            return (
              <tr key={linha.id} className={rowClass}>
                <td className={labelClass}>{linha.label}</td>
                {linha.valores.map((valor, idx) => (
                  <td
                    key={`${linha.id}-${dias[idx]?.key ?? idx}`}
                    className={cn(
                      'border-b border-slate-100 px-2 py-2.5 text-center tabular-nums',
                      corValorCelula(valor, linha.tipo),
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
  const [entradasAberto, setEntradasAberto] = useState(true);
  const [saidasAberto, setSaidasAberto] = useState(true);

  return (
    <AppLayout>
      <div className="p-3 sm:p-4 md:p-6">
        <ModulePageHeader
          icon={LineChart}
          title="Fluxo de Caixa"
          subtitle="Projeção diária — centros de custo x datas"
        />

        <Card className="mb-6 border-border/60 shadow-sm">
          <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="grid w-full gap-4 sm:w-auto sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="fluxo-periodo-inicio">Período</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="fluxo-periodo-inicio"
                    type="date"
                    defaultValue="2026-06-01"
                    className="min-w-0"
                  />
                  <span className="shrink-0 text-muted-foreground">—</span>
                  <Input
                    id="fluxo-periodo-fim"
                    type="date"
                    defaultValue="2026-06-30"
                    className="min-w-0"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Roça</Label>
                <Select defaultValue="todas">
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a roça" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    <SelectItem value="roca-1">Roça Norte</SelectItem>
                    <SelectItem value="roca-2">Roça Sul</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 sm:ml-auto">
              <Button type="button" className="gap-2">
                <Filter className="h-4 w-4" />
                Filtrar
              </Button>
              <Button
                type="button"
                variant="outline"
                className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Exportar Excel
              </Button>
            </div>
          </CardContent>
        </Card>

        <ModuleStatCards items={RESUMO_CARDS} columns={4} />

        <Card className="overflow-hidden border-border/60 shadow-sm">
          <CardContent className="p-0">
            <div className="flex items-center justify-end border-b border-slate-100 bg-slate-50/50 px-4 py-2">
              <p className="text-xs text-muted-foreground">
                ← Role para ver mais datas
              </p>
            </div>

            <FluxoDeCaixaTabela
              linhas={LINHAS_MOCK}
              dias={DIAS_MOCK}
              entradasAberto={entradasAberto}
              saidasAberto={saidasAberto}
              onToggleEntradas={() => setEntradasAberto((v) => !v)}
              onToggleSaidas={() => setSaidasAberto((v) => !v)}
            />

            <p className="border-t border-slate-100 px-4 py-2.5 text-center text-xs text-muted-foreground">
              Role para ver mais centros ↓
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
