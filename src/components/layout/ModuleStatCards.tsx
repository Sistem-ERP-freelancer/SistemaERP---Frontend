import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';

export type ModuleStatCardItem = {
  key: string;
  label: string;
  value: string | number;
  border: string;
  iconWrap: string;
  Icon: LucideIcon;
  active?: boolean;
  onClick?: () => void;
  labelExtra?: ReactNode;
};

type ColumnPreset = 2 | 3 | 4 | 5 | 6 | 7;

const GRID_BY_COLUMNS: Record<ColumnPreset, string> = {
  2: 'grid grid-cols-2 gap-3 lg:gap-4',
  3: 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:gap-4',
  4: 'grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4',
  5: 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4',
  6: 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 lg:gap-4',
  7: 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 lg:gap-4',
};

interface ModuleStatCardsProps {
  items: ModuleStatCardItem[];
  isLoading?: boolean;
  loadingCount?: number;
  columns?: ColumnPreset;
  className?: string;
}

export function ModuleStatCards({
  items,
  isLoading = false,
  loadingCount,
  columns,
  className,
}: ModuleStatCardsProps) {
  const colCount = (columns ?? Math.min(Math.max(items.length, 2), 7)) as ColumnPreset;
  const skeletons = loadingCount ?? items.length || 4;

  if (isLoading) {
    return (
      <div className={cn(GRID_BY_COLUMNS[colCount], 'mb-6', className)}>
        {Array.from({ length: skeletons }, (_, i) => (
          <Card
            key={i}
            className="h-full overflow-hidden border border-border/60 bg-gradient-to-b from-background to-muted/30 shadow-sm dark:to-muted/20"
          >
            <CardContent className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={cn(GRID_BY_COLUMNS[colCount], 'mb-6', className)}>
      {items.map((item) => {
        const Icon = item.Icon;
        const interactive = Boolean(item.onClick);
        const Wrapper = interactive ? 'button' : 'div';

        return (
          <Wrapper
            key={item.key}
            type={interactive ? 'button' : undefined}
            onClick={item.onClick}
            className={cn(
              interactive && 'cursor-pointer text-left',
              item.active && 'rounded-xl ring-2 ring-primary/40 ring-offset-2 ring-offset-background',
            )}
          >
            <Card
              className={cn(
                'h-full overflow-hidden border border-border/60 bg-gradient-to-b from-background to-muted/30 shadow-sm dark:to-muted/20',
                item.border,
                interactive && 'transition-shadow hover:shadow-md',
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-start gap-1">
                    <p className="line-clamp-3 text-xs font-medium leading-snug text-muted-foreground">
                      {item.label}
                    </p>
                    {item.labelExtra}
                  </div>
                  <div
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                      item.iconWrap,
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                  </div>
                </div>
                <p className="mt-3 text-xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-foreground sm:text-2xl">
                  {item.value}
                </p>
              </CardContent>
            </Card>
          </Wrapper>
        );
      })}
    </div>
  );
}
