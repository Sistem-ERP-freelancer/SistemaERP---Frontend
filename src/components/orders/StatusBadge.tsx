import { StatusPedido } from '@/types/pedido';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: StatusPedido;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const statusConfig: Record<StatusPedido, { label: string; className: string }> = {
    PENDENTE: {
      label: 'Pendente',
      className: 'bg-yellow-100 text-yellow-800 border border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400',
    },
    APROVADO: {
      label: 'Aprovado',
      className: 'bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400',
    },
    EM_PROCESSAMENTO: {
      label: 'Em Processamento',
      className: 'bg-purple-100 text-purple-800 border border-purple-200 dark:bg-purple-900/20 dark:text-purple-400',
    },
    CONCLUIDO: {
      label: 'Concluído',
      className: 'bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/20 dark:text-green-400',
    },
    CANCELADO: {
      label: 'Cancelado',
      className: 'bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/20 dark:text-red-400',
    },
  };

  const config = statusConfig[status];

  return (
    <span
      className={cn(
        'text-xs px-2 py-1 rounded-full font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}

