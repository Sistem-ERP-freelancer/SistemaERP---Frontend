import { motion } from 'framer-motion';
import { ShoppingCart, Package, TrendingUp, XCircle } from 'lucide-react';
import { useOrders } from '@/hooks/useOrders';

export function OrderStats() {
  const { stats } = useOrders();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const statCards = [
    {
      label: 'Vendas',
      value: formatCurrency(stats.valorTotalVendas),
      subtitle: `${stats.totalVendas} pedidos`,
      icon: ShoppingCart,
      color: 'text-green-500',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
    },
    {
      label: 'Compras',
      value: formatCurrency(stats.valorTotalCompras),
      subtitle: `${stats.totalCompras} pedidos`,
      icon: Package,
      color: 'text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    },
    {
      label: 'Total Geral',
      value: formatCurrency(stats.valorTotalVendas + stats.valorTotalCompras),
      subtitle: `${stats.totalPedidos} pedidos`,
      icon: TrendingUp,
      color: 'text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    },
    {
      label: 'Cancelados',
      value: stats.totalCancelados.toString(),
      subtitle: 'pedidos cancelados',
      icon: XCircle,
      color: 'text-red-500',
      bgColor: 'bg-red-100 dark:bg-red-900/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {statCards.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-card border rounded-xl p-5 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-2xl font-bold text-foreground mb-1">{stat.value}</p>
              <p className="text-sm text-muted-foreground">
                {stat.subtitle}
              </p>
            </div>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

