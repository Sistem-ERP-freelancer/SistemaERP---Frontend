import { formatCurrency, normalizeCurrency } from '@/lib/utils';
import { pedidosService } from '@/services/pedidos.service';
import { TipoPedido } from '@/types/pedido';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  DollarSign,
  FileText,
  Loader2,
  Package,
  ShoppingCart,
  XCircle,
} from 'lucide-react';

interface OrderStatsProps {
  tipoFiltro?: TipoPedido | 'all' | undefined;
  /** hero = 4 cards no topo (layout mockup); full = seções detalhadas */
  variant?: 'hero' | 'full';
}

export function OrderStats({ tipoFiltro, variant = 'full' }: OrderStatsProps = {}) {
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['pedidos', 'dashboard'],
    queryFn: () => pedidosService.obterDashboard(),
    refetchInterval: 30000,
    staleTime: 30000,
  });

  const formatCurrencyValue = (value: number | undefined) =>
    formatCurrency(normalizeCurrency(value, false));

  if (variant === 'hero') {
    const heroCards = [
      {
        label: 'Faturamento (Vendas)',
        value: formatCurrencyValue(dashboard?.faturamento_confirmado_venda?.valor),
        subtitle: `${dashboard?.faturamento_confirmado_venda?.quantidade || 0} pedidos`,
        icon: ShoppingCart,
        iconColor: 'text-emerald-600',
        iconBg: 'bg-emerald-50',
      },
      {
        label: 'Valor em Aberto',
        value: formatCurrencyValue(dashboard?.valor_em_aberto_venda?.valor),
        subtitle: `${dashboard?.valor_em_aberto_venda?.quantidade || 0} pedidos`,
        icon: FileText,
        iconColor: 'text-blue-600',
        iconBg: 'bg-blue-50',
      },
      {
        label: 'Pedidos em Andamento',
        value: String(dashboard?.pedidos_em_andamento?.quantidade || 0),
        subtitle: 'pedidos',
        icon: Package,
        iconColor: 'text-violet-600',
        iconBg: 'bg-violet-50',
      },
      {
        label: 'Pedidos Cancelados',
        value: String(dashboard?.pedidos_cancelados?.quantidade || 0),
        subtitle: 'pedidos',
        icon: XCircle,
        iconColor: 'text-red-600',
        iconBg: 'bg-red-50',
      },
    ];

    return (
      <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {heroCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.25 }}
            className="bg-card rounded-xl border border-border/80 p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                {isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mb-2" />
                ) : (
                  <p className="text-2xl font-bold text-foreground tracking-tight truncate">
                    {stat.value}
                  </p>
                )}
                <p className="text-sm font-medium text-foreground mt-1">{stat.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.subtitle}</p>
              </div>
              <div className={`p-2.5 rounded-xl shrink-0 ${stat.iconBg}`}>
                <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  const vendasCards = [
    {
      label: 'Faturamento Confirmado (Vendas)',
      value: formatCurrencyValue(dashboard?.faturamento_confirmado_venda?.valor),
      subtitle: `${dashboard?.faturamento_confirmado_venda?.quantidade || 0} pedidos`,
      description: 'Pedidos de venda pagos e faturados',
      icon: DollarSign,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
    },
    {
      label: 'Valor em Aberto (Vendas)',
      value: formatCurrencyValue(dashboard?.valor_em_aberto_venda?.valor),
      subtitle: `${dashboard?.valor_em_aberto_venda?.quantidade || 0} pedidos`,
      description: 'Pedidos de venda aguardando pagamento ou faturamento',
      icon: FileText,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    },
  ];

  const comprasCards = [
    {
      label: 'Compras Confirmadas',
      value: formatCurrencyValue(dashboard?.compras_confirmadas?.valor),
      subtitle: `${dashboard?.compras_confirmadas?.quantidade || 0} pedidos`,
      description: 'Pedidos de compra finalizados e pagos',
      icon: ShoppingCart,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
    },
    {
      label: 'Compras em Aberto',
      value: formatCurrencyValue(dashboard?.compras_em_aberto?.valor),
      subtitle: `${dashboard?.compras_em_aberto?.quantidade || 0} pedidos`,
      description: 'Pedidos de compra aguardando pagamento ou finalização',
      icon: FileText,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-100 dark:bg-amber-900/20',
    },
  ];

  const operacionalCards = [
    {
      label: 'Pedidos em Andamento',
      value: (dashboard?.pedidos_em_andamento?.quantidade || 0).toString(),
      subtitle: `${dashboard?.pedidos_em_andamento?.quantidade || 0} pedidos`,
      description: 'Pedidos criados, mas não finalizados',
      icon: Package,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    },
    {
      label: 'Pedidos Concluídos',
      value: (dashboard?.pedidos_concluidos?.quantidade || 0).toString(),
      subtitle: `${dashboard?.pedidos_concluidos?.quantidade || 0} pedidos`,
      description: 'Pedidos finalizados com sucesso',
      icon: CheckCircle,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/20',
    },
    {
      label: 'Pedidos Cancelados',
      value: (dashboard?.pedidos_cancelados?.quantidade || 0).toString(),
      subtitle: `${dashboard?.pedidos_cancelados?.quantidade || 0} pedidos`,
      description: 'Pedidos cancelados antes da conclusão',
      icon: XCircle,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900/20',
    },
  ];

  const temFiltroEspecifico = tipoFiltro && tipoFiltro !== 'all';
  const mostrarVendas = !tipoFiltro || tipoFiltro === 'all' || tipoFiltro === 'VENDA';
  const mostrarCompras = !tipoFiltro || tipoFiltro === 'all' || tipoFiltro === 'COMPRA';
  const mostrarOperacional = !temFiltroEspecifico;

  const getGlobalIndex = (section: 'vendas' | 'compras' | 'operacional', index: number) => {
    if (mostrarVendas && mostrarCompras) {
      if (section === 'vendas') return index;
      if (section === 'compras') return index;
      return vendasCards.length + comprasCards.length + index;
    }
    if (mostrarVendas && !mostrarCompras) {
      if (section === 'vendas') return index;
      if (section === 'operacional') return vendasCards.length + index;
      return 0;
    }
    if (!mostrarVendas && mostrarCompras) {
      if (section === 'compras') return index;
      if (section === 'operacional') return comprasCards.length + index;
      return 0;
    }
    return index;
  };

  const renderCard = (
    stat: (typeof vendasCards)[0],
    globalIndex: number,
  ) => (
    <motion.div
      key={stat.label}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: globalIndex * 0.05, duration: 0.3 }}
      className="bg-card border rounded-xl p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <p className="text-xl font-bold text-foreground mb-1">
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            ) : (
              stat.value
            )}
          </p>
          <p className="text-sm font-medium text-foreground mb-1">{stat.label}</p>
          <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
          <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
        </div>
        <div className={`p-2 rounded-lg ${stat.bgColor}`}>
          <stat.icon className={`w-5 h-5 ${stat.color}`} />
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-4 mb-6">
      {mostrarVendas && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">Vendas</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {vendasCards.map((stat, index) =>
              renderCard(stat, getGlobalIndex('vendas', index)),
            )}
          </div>
        </div>
      )}
      {mostrarCompras && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">Compras</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {comprasCards.map((stat, index) =>
              renderCard(stat, getGlobalIndex('compras', index)),
            )}
          </div>
        </div>
      )}
      {mostrarOperacional && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">
            Operacional (quantidade)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {operacionalCards.map((stat, index) =>
              renderCard(stat, getGlobalIndex('operacional', index)),
            )}
          </div>
        </div>
      )}
    </div>
  );
}
