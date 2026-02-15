import { cn } from '@/lib/utils';
import { StatusPedido } from '@/types/pedido';

/** Rótulos exibidos para o usuário (apenas 4 statuses). */
export const STATUS_PEDIDO_LABELS: Record<StatusPedido, string> = {
  ABERTO: 'Pendente',
  PARCIAL: 'Aberto',
  QUITADO: 'Quitado',
  CANCELADO: 'Cancelado',
};

interface StatusBadgeProps {
  status: StatusPedido;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const statusConfig: Record<StatusPedido, { label: string; className: string }> = {
    ABERTO: {
      label: 'Pendente',
      className: 'bg-yellow-100 text-yellow-800 border border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400',
    },
    PARCIAL: {
      label: 'Aberto',
      className: 'bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400',
    },
    QUITADO: {
      label: 'Quitado',
      className: 'bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/20 dark:text-green-400',
    },
    CANCELADO: {
      label: 'Cancelado',
      className: 'bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/20 dark:text-red-400',
    },
  };

  const config = statusConfig[status] ?? {
    label: status,
    className: 'bg-muted text-muted-foreground',
  };

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

