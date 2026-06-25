export type ModuleStatTheme = {
  iconWrap: string;
  iconClass: string;
  valueClass: string;
};

/** Temas visuais dos cards de resumo (ícone + valor colorido), padrão Fluxo de Caixa. */
export const statTheme = {
  amber: {
    iconWrap: 'bg-amber-50',
    iconClass: 'text-amber-600',
    valueClass: 'text-amber-600',
  },
  emerald: {
    iconWrap: 'bg-emerald-50',
    iconClass: 'text-emerald-600',
    valueClass: 'text-emerald-600',
  },
  rose: {
    iconWrap: 'bg-rose-50',
    iconClass: 'text-rose-600',
    valueClass: 'text-rose-600',
  },
  sky: {
    iconWrap: 'bg-sky-50',
    iconClass: 'text-sky-700',
    valueClass: 'text-sky-700',
  },
  orange: {
    iconWrap: 'bg-orange-50',
    iconClass: 'text-orange-600',
    valueClass: 'text-orange-600',
  },
  red: {
    iconWrap: 'bg-red-50',
    iconClass: 'text-red-600',
    valueClass: 'text-red-600',
  },
  blue: {
    iconWrap: 'bg-blue-50',
    iconClass: 'text-blue-600',
    valueClass: 'text-blue-600',
  },
  violet: {
    iconWrap: 'bg-violet-50',
    iconClass: 'text-violet-600',
    valueClass: 'text-violet-600',
  },
  cyan: {
    iconWrap: 'bg-cyan-50',
    iconClass: 'text-cyan-600',
    valueClass: 'text-cyan-600',
  },
  slate: {
    iconWrap: 'bg-slate-100',
    iconClass: 'text-slate-600',
    valueClass: 'text-[#003366]',
  },
  purple: {
    iconWrap: 'bg-purple-50',
    iconClass: 'text-purple-600',
    valueClass: 'text-purple-600',
  },
  primary: {
    iconWrap: 'bg-primary/10',
    iconClass: 'text-primary',
    valueClass: 'text-[#003366]',
  },
  green: {
    iconWrap: 'bg-green-50',
    iconClass: 'text-green-600',
    valueClass: 'text-green-600',
  },
} as const satisfies Record<string, ModuleStatTheme>;
