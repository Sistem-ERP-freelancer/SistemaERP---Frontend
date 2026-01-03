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
      className: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    },
    CONFIRMADO: {
      label: 'Confirmado',
      className: 'bg-blue-100 text-blue-800 border border-blue-200',
    },
    EM_SEPARACAO: {
      label: 'Em Separação',
      className: 'bg-purple-100 text-purple-800 border border-purple-200',
    },
    ENVIADO: {
      label: 'Enviado',
      className: 'bg-pink-100 text-pink-800 border border-pink-200',
    },
    ENTREGUE: {
      label: 'Entregue',
      className: 'bg-green-100 text-green-800 border border-green-200',
    },
    CANCELADO: {
      label: 'Cancelado',
      className: 'bg-red-100 text-red-800 border border-red-200',
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

