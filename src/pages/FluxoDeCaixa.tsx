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
  Calendar,
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

const RESUMO_CARDS: ModuleStatCardItem[] = [
  {
    key: 'saldo-inicial',
    label: 'Saldo inicial',
    value: formatCurrency(12450),
    Icon: Wallet,
    ...statTheme.blue,
  },
  {
    key: 'total-receber',
    label: 'Total a receber',
    value: formatCurrency(450000),
    Icon: ArrowUpRight,
    ...statTheme.emerald,
  },
  {
    key: 'total-pagar',
    label: 'Total a pagar',
    value: formatCurrency(132000),
    Icon: ArrowDownRight,
    ...statTheme.rose,
  },
  {
    key: 'saldo-projetado',
    label: 'Saldo projetado',
    value: formatCurrency(318000),
    Icon: Calculator,
    iconWrap: 'bg-sky-50',
    iconClass: 'text-[#003366]',
    valueClass: 'text-[#003366]',
  },
];

const GRADE_BORDA = 'border border-slate-200';

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

  const celulaGrade = cn(GRADE_BORDA, 'px-3 py-2.5');

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

        <Card className="mb-6 border-slate-200 bg-white shadow-sm">
          <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
              <div className="space-y-1.5">
                <Label htmlFor="fluxo-periodo-inicio">Período</Label>
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2">
                  <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
                  <Input
                    id="fluxo-periodo-inicio"
                    type="date"
                    defaultValue="2026-06-01"
                    className="h-8 min-w-[130px] border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                  />
                  <span className="shrink-0 text-slate-400">—</span>
                  <Input
                    id="fluxo-periodo-fim"
                    type="date"
                    defaultValue="2026-06-30"
                    className="h-8 min-w-[130px] border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                  />
                </div>
              </div>

              <div className="min-w-[160px] space-y-1.5">
                <Label>Roça</Label>
                <Select defaultValue="todas">
                  <SelectTrigger className="border-slate-200 bg-white">
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

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                className="gap-2 bg-[#003366] hover:bg-[#002244]"
              >
                <Filter className="h-4 w-4" />
                Filtrar
              </Button>
              <Button
                type="button"
                variant="outline"
                className="gap-2 border-slate-200 bg-white hover:bg-slate-50"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                Exportar Excel
              </Button>
            </div>
          </CardContent>
        </Card>

        <ModuleStatCards columns={4} items={RESUMO_CARDS} />

        <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
          <CardContent className="p-0">
            <div className="flex items-center justify-end border-b border-slate-200 bg-slate-50/60 px-4 py-2">
              <p className="text-xs text-slate-500">← Role para ver mais datas</p>
            </div>

            <FluxoDeCaixaTabela
              linhas={LINHAS_MOCK}
              dias={DIAS_MOCK}
              entradasAberto={entradasAberto}
              saidasAberto={saidasAberto}
              onToggleEntradas={() => setEntradasAberto((v) => !v)}
              onToggleSaidas={() => setSaidasAberto((v) => !v)}
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
