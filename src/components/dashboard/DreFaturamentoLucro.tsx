import { cn, formatCurrency } from '@/lib/utils';
import {
  DollarSign,
  Equal,
  FileText,
  Loader2,
  Minus,
  PiggyBank,
  ShoppingCart,
  TrendingUp,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type DreFaturamentoLucroProps = {
  faturamento: number;
  custoProduto: number;
  lucroBruto: number;
  despesasGerais: number;
  lucroLiquido: number;
  loading?: boolean;
  className?: string;
};

type CardTone = 'neutral' | 'cost' | 'gross' | 'expense' | 'net';

type FunnelCard = {
  key: string;
  label: string;
  value: number;
  Icon: LucideIcon;
  tone: CardTone;
};

const toneStyles: Record<
  CardTone,
  { wrap: string; iconWrap: string; icon: string; value: string }
> = {
  neutral: {
    wrap: 'border-border/70 bg-background/80',
    iconWrap: 'bg-slate-100',
    icon: 'text-slate-600',
    value: 'text-slate-900 dark:text-foreground',
  },
  cost: {
    wrap: 'border-red-200/80 bg-background/80',
    iconWrap: 'bg-red-50',
    icon: 'text-red-600',
    value: 'text-red-600',
  },
  gross: {
    wrap: 'border-blue-200/80 bg-background/80',
    iconWrap: 'bg-blue-50',
    icon: 'text-blue-600',
    value: 'text-blue-600',
  },
  expense: {
    wrap: 'border-amber-200/80 bg-background/80',
    iconWrap: 'bg-amber-50',
    icon: 'text-amber-600',
    value: 'text-amber-600',
  },
  net: {
    wrap: 'border-emerald-300/80 bg-emerald-50/80 shadow-sm dark:bg-emerald-950/30',
    iconWrap: 'bg-emerald-100 dark:bg-emerald-900/40',
    icon: 'text-emerald-700 dark:text-emerald-400',
    value: 'text-emerald-700 dark:text-emerald-400',
  },
};

function Operator({ kind }: { kind: 'minus' | 'equals' }) {
  const Icon = kind === 'minus' ? Minus : Equal;
  return (
    <div
      className="flex h-8 w-8 shrink-0 items-center justify-center self-center rounded-full bg-muted text-muted-foreground"
      aria-hidden
    >
      <Icon className="h-4 w-4" strokeWidth={2.5} />
    </div>
  );
}

export function DreFaturamentoLucro({
  faturamento,
  custoProduto,
  lucroBruto,
  despesasGerais,
  lucroLiquido,
  loading = false,
  className,
}: DreFaturamentoLucroProps) {
  const cards: FunnelCard[] = [
    {
      key: 'faturamento',
      label: 'Faturamento do mês',
      value: faturamento,
      Icon: TrendingUp,
      tone: 'neutral',
    },
    {
      key: 'custo',
      label: 'Custo de produto',
      value: custoProduto,
      Icon: ShoppingCart,
      tone: 'cost',
    },
    {
      key: 'bruto',
      label: 'Lucro bruto',
      value: lucroBruto,
      Icon: DollarSign,
      tone: 'gross',
    },
    {
      key: 'despesas',
      label: 'Despesas gerais',
      value: despesasGerais,
      Icon: FileText,
      tone: 'expense',
    },
    {
      key: 'liquido',
      label: 'Lucro líquido',
      value: lucroLiquido,
      Icon: PiggyBank,
      tone: 'net',
    },
  ];

  return (
    <div
      className={cn(
        'rounded-xl border border-border/70 bg-card/80 p-4 shadow-sm backdrop-blur-[2px] sm:p-5 dark:bg-card/60',
        className,
      )}
    >
      <div className="mb-4 flex flex-col gap-3 border-b border-border/70 pb-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            DRE simplificado
          </p>
          <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-900 dark:text-foreground sm:text-2xl">
            Do faturamento ao lucro líquido
          </h3>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Faturamento − Custo do produto = Lucro bruto. Lucro bruto − Despesas
            gerais = Lucro líquido. Compras com fornecedor entram em custo de
            produto.
          </p>
        </div>
        <div
          className={cn(
            'inline-flex items-center gap-2 self-start rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-semibold tabular-nums text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400',
            lucroLiquido < 0 &&
              'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400',
          )}
        >
          <PiggyBank className="h-4 w-4 shrink-0" />
          {loading ? '…' : formatCurrency(lucroLiquido)}
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[7rem] items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Carregando visão de lucro…</span>
        </div>
      ) : (
        <div className="flex flex-wrap items-stretch justify-center gap-2 sm:gap-3 lg:flex-nowrap lg:justify-between">
          {cards.map((card, index) => {
            const styles = toneStyles[card.tone];
            const showMinus = index === 1 || index === 3;
            const showEquals = index === 2 || index === 4;
            return (
              <div key={card.key} className="flex min-w-[9.5rem] flex-1 items-stretch gap-2 sm:gap-3">
                {showMinus ? <Operator kind="minus" /> : null}
                {showEquals ? <Operator kind="equals" /> : null}
                <div
                  className={cn(
                    'flex min-w-0 flex-1 flex-col gap-3 rounded-xl border p-3 sm:p-4',
                    styles.wrap,
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[11px] font-semibold uppercase leading-snug tracking-wide text-muted-foreground">
                      {card.label}
                    </p>
                    <div
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                        styles.iconWrap,
                      )}
                    >
                      <card.Icon className={cn('h-4 w-4', styles.icon)} />
                    </div>
                  </div>
                  <p
                    className={cn(
                      'text-lg font-bold tabular-nums leading-tight sm:text-xl',
                      styles.value,
                      card.value < 0 && card.tone !== 'cost' && card.tone !== 'expense'
                        ? 'text-destructive'
                        : null,
                    )}
                  >
                    {formatCurrency(card.value)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default DreFaturamentoLucro;
