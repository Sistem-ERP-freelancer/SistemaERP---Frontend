import { Button } from '@/components/ui/button';
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Download, Loader2, LucideIcon, Printer } from 'lucide-react';
import { ReactNode } from 'react';

export function RelatorioModalShell({
  icon: Icon,
  title,
  description,
  children,
  footer,
  maxWidth = 'lg',
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: 'md' | 'lg';
}) {
  return (
    <DialogContent
      className={cn(
        'flex flex-col gap-0 p-0 overflow-hidden border-border/80 shadow-xl',
        'w-[calc(100vw-1.5rem)] max-h-[min(92dvh,720px)]',
        maxWidth === 'md' ? 'sm:max-w-md' : 'sm:max-w-xl',
      )}
    >
      <DialogHeader className="shrink-0 space-y-0 border-b bg-gradient-to-br from-primary/5 via-background to-background px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex items-start gap-3 pr-8">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/15">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 space-y-1">
            <DialogTitle className="text-left text-lg font-semibold leading-tight">
              {title}
            </DialogTitle>
            <DialogDescription className="text-left text-sm leading-relaxed">
              {description}
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
        {children}
      </div>

      {footer ? (
        <div className="shrink-0 border-t bg-muted/30 px-4 py-3 sm:px-6 sm:py-4">{footer}</div>
      ) : null}
    </DialogContent>
  );
}

export function RelatorioHubCard({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group flex w-full items-start gap-4 rounded-xl border border-border/80 bg-card p-4 sm:p-5 text-left',
        'transition-all duration-200 hover:border-primary/40 hover:bg-primary/[0.03] hover:shadow-md',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
      )}
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/10 transition-colors group-hover:bg-primary/15">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="font-semibold text-foreground">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </button>
  );
}

const PERIODOS_RAPIDOS = [
  ['hoje', 'Hoje'],
  ['ontem', 'Ontem'],
  ['7d', 'Últimos 7 dias'],
  ['mes_atual', 'Mês atual'],
  ['mes_anterior', 'Mês anterior'],
] as const;

export function RelatorioPeriodoSection({
  dataInicial,
  dataFinal,
  onDataInicial,
  onDataFinal,
  periodoAtivo,
  onPeriodoRapido,
}: {
  dataInicial: string;
  dataFinal: string;
  onDataInicial: (v: string) => void;
  onDataFinal: (v: string) => void;
  periodoAtivo: string;
  onPeriodoRapido: (key: (typeof PERIODOS_RAPIDOS)[number][0]) => void;
}) {
  return (
    <section className="space-y-3">
      <Label className="text-sm font-semibold text-foreground">Período</Label>
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-2 sm:gap-3 items-end">
        <div className="space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">Data inicial</span>
          <Input
            type="date"
            className="w-full bg-background"
            value={dataInicial}
            onChange={(e) => onDataInicial(e.target.value)}
          />
        </div>
        <span className="hidden sm:block pb-2.5 text-sm text-muted-foreground">até</span>
        <div className="space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">Data final</span>
          <Input
            type="date"
            className="w-full bg-background"
            value={dataFinal}
            onChange={(e) => onDataFinal(e.target.value)}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {PERIODOS_RAPIDOS.map(([key, label]) => (
          <Button
            key={key}
            type="button"
            size="sm"
            variant={periodoAtivo === key ? 'default' : 'outline'}
            className="rounded-full text-xs sm:text-sm"
            onClick={() => onPeriodoRapido(key)}
          >
            {label}
          </Button>
        ))}
      </div>
    </section>
  );
}

export function RelatorioFiltrosGrid({ children }: { children: ReactNode }) {
  return (
    <section className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Filtros opcionais
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">{children}</div>
    </section>
  );
}

export function RelatorioCampoFiltro({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label className="text-sm font-medium">{label}</Label>
      {children}
    </div>
  );
}

export function RelatorioAcoesFooter({
  onDownload,
  onPrint,
  downloadLabel = 'Baixar PDF',
  printLabel = 'Imprimir',
  downloading = false,
  printing = false,
  disabled = false,
}: {
  onDownload: () => void | Promise<void>;
  onPrint: () => void | Promise<void>;
  downloadLabel?: string;
  printLabel?: string;
  downloading?: boolean;
  printing?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end">
      <Button
        type="button"
        variant="outline"
        className="w-full sm:w-auto gap-2"
        disabled={disabled || downloading || printing}
        onClick={onPrint}
      >
        {printing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Printer className="h-4 w-4" />
        )}
        {printing ? 'Abrindo...' : printLabel}
      </Button>
      <Button
        type="button"
        className="w-full sm:w-auto gap-2"
        disabled={disabled || downloading || printing}
        onClick={onDownload}
      >
        {downloading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        {downloading ? 'Baixando...' : downloadLabel}
      </Button>
    </div>
  );
}
