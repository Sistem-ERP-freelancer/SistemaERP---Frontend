import { cn, formatCurrency } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import {
  Calendar,
  Loader2,
  Package,
  Wallet,
} from 'lucide-react';

export type DreEstoqueMetricasProps = {
  atualQuantidade: number;
  atualValor: number;
  fimMesAnteriorData?: string;
  fimMesAnteriorQuantidade: number;
  fimMesAnteriorValor: number;
  loading?: boolean;
  className?: string;
  /** YYYY-MM; vazio = mês calendário atual para o “mês anterior”. */
  mesAno?: string;
  onMesAnoChange?: (value: string) => void;
  periodoLabel?: string;
};

function fmtQtd(n: number): string {
  return new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 3,
  }).format(Number(n) || 0);
}

function fmtDataBr(iso?: string): string {
  if (!iso?.trim()) return '—';
  const m = iso.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return iso;
  return `${m[3]}/${m[2]}/${m[1]}`;
}

export function DreEstoqueMetricas({
  atualQuantidade,
  atualValor,
  fimMesAnteriorData,
  fimMesAnteriorQuantidade,
  fimMesAnteriorValor,
  loading = false,
  className,
  mesAno = '',
  onMesAnoChange,
  periodoLabel,
}: DreEstoqueMetricasProps) {
  const cards = [
    {
      key: 'qtd-atual',
      label: 'Qtd. estoque atual',
      value: loading ? '…' : fmtQtd(atualQuantidade),
      hint: 'Soma do estoque dos produtos ativos',
      Icon: Package,
      tone: 'sky' as const,
    },
    {
      key: 'valor-atual',
      label: 'Valor estoque atual',
      value: loading ? '…' : formatCurrency(atualValor),
      hint: 'Quantidade × preço de custo',
      Icon: Wallet,
      tone: 'emerald' as const,
    },
    {
      key: 'qtd-anterior',
      label: 'Qtd. fim mês anterior',
      value: loading ? '…' : fmtQtd(fimMesAnteriorQuantidade),
      hint: fimMesAnteriorData
        ? `Posição em ${fmtDataBr(fimMesAnteriorData)}`
        : 'Último dia do mês anterior',
      Icon: Package,
      tone: 'slate' as const,
    },
    {
      key: 'valor-anterior',
      label: 'Valor fim mês anterior',
      value: loading ? '…' : formatCurrency(fimMesAnteriorValor),
      hint: fimMesAnteriorData
        ? `Em ${fmtDataBr(fimMesAnteriorData)} × custo atual`
        : 'Quantidade × preço de custo',
      Icon: Wallet,
      tone: 'amber' as const,
    },
  ];

  const toneClass = {
    sky: {
      wrap: 'border-sky-100 bg-sky-50/90 dark:border-sky-900/40 dark:bg-sky-950/25',
      icon: 'bg-sky-100 text-sky-600 dark:bg-sky-900/50 dark:text-sky-400',
      value: 'text-sky-800 dark:text-sky-300',
    },
    emerald: {
      wrap: 'border-emerald-100 bg-emerald-50/90 dark:border-emerald-900/40 dark:bg-emerald-950/25',
      icon: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400',
      value: 'text-emerald-800 dark:text-emerald-300',
    },
    slate: {
      wrap: 'border-slate-200 bg-white dark:border-border dark:bg-card',
      icon: 'bg-slate-100 text-slate-600 dark:bg-muted dark:text-muted-foreground',
      value: 'text-[#003366] dark:text-foreground',
    },
    amber: {
      wrap: 'border-amber-100 bg-amber-50/90 dark:border-amber-900/40 dark:bg-amber-950/25',
      icon: 'bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400',
      value: 'text-amber-800 dark:text-amber-300',
    },
  };

  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-6 dark:border-border dark:bg-card',
        className,
      )}
    >
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600 dark:border-border dark:bg-muted dark:text-muted-foreground">
            <Package className="h-3.5 w-3.5" />
            Estoque
          </span>
          <h3 className="text-xl font-bold tracking-tight text-[#003366] dark:text-foreground sm:text-2xl">
            DRE — Estoque
          </h3>
          <p className="max-w-3xl text-sm leading-relaxed text-slate-500 dark:text-muted-foreground">
            Quantidade e valor do estoque atual, e a posição no último dia do
            mês anterior ao período selecionado.
            {periodoLabel ? (
              <>
                {' '}
                Período DRE:{' '}
                <span className="font-medium text-slate-600 dark:text-foreground">
                  {periodoLabel}
                </span>
                .
              </>
            ) : null}
          </p>
        </div>
        {onMesAnoChange ? (
          <div className="flex min-w-[12rem] flex-col gap-1">
            <Label
              htmlFor="dre-estoque-mes-ano"
              className="text-xs font-medium text-slate-500"
            >
              Mês
            </Label>
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="dre-estoque-mes-ano"
                type="month"
                value={mesAno}
                onChange={(e) => onMesAnoChange(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-[#003366] shadow-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100 dark:border-border dark:bg-background dark:text-foreground"
              />
            </div>
          </div>
        ) : null}
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando estoque…
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => {
            const t = toneClass[card.tone];
            return (
              <div
                key={card.key}
                className={cn(
                  'rounded-xl border p-4 shadow-sm',
                  t.wrap,
                )}
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-muted-foreground">
                    {card.label}
                  </p>
                  <span
                    className={cn(
                      'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                      t.icon,
                    )}
                  >
                    <card.Icon className="h-4 w-4" />
                  </span>
                </div>
                <p
                  className={cn(
                    'text-xl font-bold tabular-nums tracking-tight sm:text-2xl',
                    t.value,
                  )}
                >
                  {card.value}
                </p>
                <p className="mt-1.5 text-xs text-slate-500 dark:text-muted-foreground">
                  {card.hint}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default DreEstoqueMetricas;
