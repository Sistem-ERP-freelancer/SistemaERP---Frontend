import AppLayout from '@/components/layout/AppLayout';
import { ModulePageHeader } from '@/components/layout/ModulePageHeader';
import {
  ModuleStatCards,
  type ModuleStatCardItem,
} from '@/components/layout/ModuleStatCards';
import { statTheme } from '@/components/layout/module-stat-themes';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

function corValor(value: number | null, tipo: LinhaTabela['tipo']): string {
  if (value === null) return 'text-muted-foreground';
  if (tipo === 'saldo-acumulado') {
    return 'font-bold text-sky-700 dark:text-sky-400';
  }
  if (tipo === 'saldo-dia' || tipo === 'subtotal') {
    if (value < 0) return 'font-semibold text-rose-600 dark:text-rose-400';
    if (value > 0) return 'font-semibold text-emerald-600 dark:text-emerald-400';
    return 'font-semibold text-muted-foreground';
  }
  if (tipo === 'item') return 'text-foreground';
  return 'text-foreground';
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
}: {
  linhas: LinhaTabela[];
  dias: DiaColuna[];
  entradasAberto: boolean;
  saidasAberto: boolean;
}) {
  const linhasVisiveis = useMemo(() => {
    return linhas.filter((linha) => {
      if (linha.tipo === 'secao') return true;
      if (linha.secao === 'entradas' && !entradasAberto) return false;
      if (linha.secao === 'saidas' && linha.tipo !== 'subtotal' && !saidasAberto) {
        return false;
      }
      if (linha.secao === 'saidas' && linha.tipo === 'subtotal' && !saidasAberto) {
        return false;
      }
      return true;
    });
  }, [linhas, entradasAberto, saidasAberto]);

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="sticky left-0 z-20 min-w-[200px] bg-muted/95 backdrop-blur-sm sm:min-w-[240px]">
              Centro de custo / Categoria
            </TableHead>
            {dias.map((dia) => (
              <TableHead
                key={dia.key}
                className="min-w-[88px] text-center text-xs font-semibold sm:min-w-[96px]"
              >
                <div>{dia.label}</div>
                <div className="font-normal text-muted-foreground">({dia.weekday})</div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {linhasVisiveis.map((linha) => {
            if (linha.tipo === 'secao') {
              const isEntradas = linha.secao === 'entradas';
              return (
                <TableRow
                  key={linha.id}
                  className={cn(
                    'hover:opacity-95',
                    isEntradas
                      ? 'bg-emerald-600 text-white hover:bg-emerald-600'
                      : 'bg-rose-600 text-white hover:bg-rose-600',
                  )}
                >
                  <TableCell
                    colSpan={dias.length + 1}
                    className="sticky left-0 z-10 py-2.5 font-bold tracking-wide"
                  >
                    {linha.label}
                  </TableCell>
                </TableRow>
              );
            }

            const isDestaque =
              linha.tipo === 'subtotal' ||
              linha.tipo === 'saldo-dia' ||
              linha.tipo === 'saldo-acumulado';

            return (
              <TableRow
                key={linha.id}
                className={cn(
                  isDestaque && 'bg-muted/30 font-medium',
                  linha.tipo === 'saldo-acumulado' && 'bg-sky-50/80 dark:bg-sky-950/20',
                )}
              >
                <TableCell
                  className={cn(
                    'sticky left-0 z-10 bg-background',
                    linha.indent && 'pl-8',
                    isDestaque && 'bg-muted/30',
                    linha.tipo === 'saldo-acumulado' &&
                      'bg-sky-50/95 font-bold dark:bg-sky-950/30',
                  )}
                >
                  {linha.label}
                </TableCell>
                {linha.valores.map((valor, idx) => (
                  <TableCell
                    key={`${linha.id}-${dias[idx]?.key ?? idx}`}
                    className={cn(
                      'text-center tabular-nums text-sm',
                      corValor(valor, linha.tipo),
                    )}
                  >
                    {formatValorCelula(valor)}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
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
              <Button type="button" variant="outline" className="gap-2">
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                Exportar Excel
              </Button>
            </div>
          </CardContent>
        </Card>

        <ModuleStatCards items={RESUMO_CARDS} columns={4} />

        <Card className="overflow-hidden border-border/60 shadow-sm">
          <CardContent className="p-0">
            <div className="flex flex-wrap items-center gap-3 border-b bg-muted/20 px-4 py-3">
              <Collapsible open={entradasAberto} onOpenChange={setEntradasAberto}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1.5 text-emerald-700">
                    {entradasAberto ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    Entradas
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent />
              </Collapsible>

              <Collapsible open={saidasAberto} onOpenChange={setSaidasAberto}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1.5 text-rose-700">
                    {saidasAberto ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    Saídas
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent />
              </Collapsible>

              <p className="ml-auto text-xs text-muted-foreground">
                ← Role para ver mais datas
              </p>
            </div>

            <FluxoDeCaixaTabela
              linhas={LINHAS_MOCK}
              dias={DIAS_MOCK}
              entradasAberto={entradasAberto}
              saidasAberto={saidasAberto}
            />

            <p className="border-t px-4 py-2 text-center text-xs text-muted-foreground">
              Role para ver mais centros ↓
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
