export type ModuleStatTheme = {
  border: string;
  iconWrap: string;
};

/** Temas visuais dos cards de resumo (borda esquerda + ícone), alinhados ao Centro de Despesa. */
export const statTheme = {
  amber: {
    border: 'border-l-4 border-l-amber-500',
    iconWrap:
      'bg-amber-500/[0.12] text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  },
  emerald: {
    border: 'border-l-4 border-l-emerald-500',
    iconWrap:
      'bg-emerald-500/[0.12] text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  },
  rose: {
    border: 'border-l-4 border-l-rose-500',
    iconWrap:
      'bg-rose-500/[0.12] text-rose-700 dark:bg-rose-500/15 dark:text-rose-400',
  },
  sky: {
    border: 'border-l-4 border-l-sky-600 dark:border-l-sky-400',
    iconWrap:
      'bg-sky-500/[0.12] text-sky-800 dark:bg-sky-500/15 dark:text-sky-300',
  },
  orange: {
    border: 'border-l-4 border-l-orange-500',
    iconWrap:
      'bg-orange-500/[0.12] text-orange-700 dark:bg-orange-500/15 dark:text-orange-400',
  },
  red: {
    border: 'border-l-4 border-l-red-500',
    iconWrap:
      'bg-red-500/[0.12] text-red-700 dark:bg-red-500/15 dark:text-red-400',
  },
  blue: {
    border: 'border-l-4 border-l-blue-500',
    iconWrap:
      'bg-blue-500/[0.12] text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  },
  violet: {
    border: 'border-l-4 border-l-violet-500',
    iconWrap:
      'bg-violet-500/[0.12] text-violet-700 dark:bg-violet-500/15 dark:text-violet-400',
  },
  cyan: {
    border: 'border-l-4 border-l-cyan-500',
    iconWrap:
      'bg-cyan-500/[0.12] text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-400',
  },
  slate: {
    border: 'border-l-4 border-l-slate-500',
    iconWrap:
      'bg-slate-500/[0.12] text-slate-700 dark:bg-slate-500/15 dark:text-slate-400',
  },
  purple: {
    border: 'border-l-4 border-l-purple-500',
    iconWrap:
      'bg-purple-500/[0.12] text-purple-700 dark:bg-purple-500/15 dark:text-purple-400',
  },
  primary: {
    border: 'border-l-4 border-l-primary',
    iconWrap: 'bg-primary/10 text-primary',
  },
  green: {
    border: 'border-l-4 border-l-green-500',
    iconWrap:
      'bg-green-500/[0.12] text-green-700 dark:bg-green-500/15 dark:text-green-400',
  },
} as const satisfies Record<string, ModuleStatTheme>;
