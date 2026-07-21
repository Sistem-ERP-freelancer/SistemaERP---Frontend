import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatISODateLocal } from '@/lib/utils';
import { Calendar } from 'lucide-react';

export type PeriodoRapidoKey =
  | 'hoje'
  | 'ontem'
  | '7d'
  | 'mes_atual'
  | 'mes_anterior';

export type PeriodoRapidoAtivo = PeriodoRapidoKey | 'custom' | 'all';

const PERIODOS_RAPIDOS: ReadonlyArray<readonly [PeriodoRapidoKey, string]> = [
  ['hoje', 'Hoje'],
  ['ontem', 'Ontem'],
  ['7d', 'Últimos 7 dias'],
  ['mes_atual', 'Mês atual'],
  ['mes_anterior', 'Mês anterior'],
];

/** Calcula data inicial/final (YYYY-MM-DD) para atalhos de período. */
export function datasPeriodoRapido(tipo: PeriodoRapidoKey): {
  inicial: string;
  final: string;
} {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const hoje = formatISODateLocal(now);

  const dOntem = new Date(now);
  dOntem.setDate(dOntem.getDate() - 1);
  const ontem = formatISODateLocal(dOntem);

  const d7 = new Date(now);
  d7.setDate(d7.getDate() - 6);
  const ultimos7 = formatISODateLocal(d7);

  const mesAtualInicio = formatISODateLocal(
    new Date(now.getFullYear(), now.getMonth(), 1),
  );

  const mesAnteriorInicio = formatISODateLocal(
    new Date(now.getFullYear(), now.getMonth() - 1, 1),
  );
  const mesAnteriorFim = formatISODateLocal(
    new Date(now.getFullYear(), now.getMonth(), 0),
  );

  switch (tipo) {
    case 'hoje':
      return { inicial: hoje, final: hoje };
    case 'ontem':
      return { inicial: ontem, final: ontem };
    case '7d':
      return { inicial: ultimos7, final: hoje };
    case 'mes_atual':
      return { inicial: mesAtualInicio, final: hoje };
    case 'mes_anterior':
      return { inicial: mesAnteriorInicio, final: mesAnteriorFim };
  }
}

type Props = {
  dataInicial: string;
  dataFinal: string;
  onDataInicial: (value: string) => void;
  onDataFinal: (value: string) => void;
  periodoAtivo: PeriodoRapidoAtivo;
  onPeriodoRapido: (key: PeriodoRapidoKey) => void;
  /** Quando informado, exibe o chip "Qualquer período". */
  onQualquerPeriodo?: () => void;
};

/**
 * Bloco de período no estilo dos relatórios financeiros:
 * datas com ícone + atalhos (Hoje, Ontem, Últimos 7 dias…).
 */
export function RelatorioPeriodoFinanceiro({
  dataInicial,
  dataFinal,
  onDataInicial,
  onDataFinal,
  periodoAtivo,
  onPeriodoRapido,
  onQualquerPeriodo,
}: Props) {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-semibold text-[#1A3B70]">Período</Label>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Data Inicial</Label>
          <div className="relative">
            <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="date"
              className="rounded-lg border-border/80 bg-muted/50 pl-10"
              value={dataInicial}
              onChange={(e) => onDataInicial(e.target.value || '')}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Data Final</Label>
          <div className="relative">
            <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="date"
              className="rounded-lg border-border/80 bg-muted/50 pl-10"
              value={dataFinal}
              onChange={(e) => onDataFinal(e.target.value || '')}
            />
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 pt-1">
        {onQualquerPeriodo ? (
          <Button
            type="button"
            size="sm"
            variant={periodoAtivo === 'all' ? 'default' : 'outline'}
            className="h-8 rounded-full px-3.5 text-xs font-medium"
            onClick={onQualquerPeriodo}
          >
            Qualquer período
          </Button>
        ) : null}
        {PERIODOS_RAPIDOS.map(([key, label]) => (
          <Button
            key={key}
            type="button"
            size="sm"
            variant={periodoAtivo === key ? 'default' : 'outline'}
            className="h-8 rounded-full px-3.5 text-xs font-medium"
            onClick={() => onPeriodoRapido(key)}
          >
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}
