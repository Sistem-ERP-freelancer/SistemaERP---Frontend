import { formatCurrency, normalizeCurrency } from '@/lib/utils';
import { pedidosService } from '@/services/pedidos.service';
import { TipoPedido } from '@/types/pedido';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CheckCircle, DollarSign, FileText, Loader2, Package, ShoppingCart, XCircle } from 'lucide-react';

interface OrderStatsProps {
  tipoFiltro?: TipoPedido | 'all' | undefined;
}

export function OrderStats({ tipoFiltro }: OrderStatsProps = {}) {
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['pedidos', 'dashboard'],
    queryFn: () => pedidosService.obterDashboard(),
    refetchInterval: 30000, // Atualiza a cada 30 segundos
    staleTime: 30000, // Cache por 30 segundos para melhor performance
  });

  const formatCurrencyValue = (value: number | undefined) => {
    return formatCurrency(normalizeCurrency(value, false));
  };

  // BLOCO 1 — Financeiro VENDA (valores)
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

  // BLOCO 1 — Financeiro COMPRA (valores)
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

  // BLOCO 2 — Operacional (quantidade)
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

  // Determinar quais seções mostrar baseado no filtro
  // Se não há filtro ou é 'all', mostra tudo (vendas, compras e operacional)
  // Se há filtro específico (VENDA ou COMPRA), mostra apenas o tipo filtrado (sem operacional)
  const temFiltroEspecifico = tipoFiltro && tipoFiltro !== 'all';
  const mostrarVendas = !tipoFiltro || tipoFiltro === 'all' || tipoFiltro === 'VENDA';
  const mostrarCompras = !tipoFiltro || tipoFiltro === 'all' || tipoFiltro === 'COMPRA';
  const mostrarOperacional = !temFiltroEspecifico; // Só mostra operacional se não houver filtro específico

  // Calcular delay global para garantir que vendas e compras apareçam na mesma velocidade
  // Quando ambos estão visíveis, eles aparecem simultaneamente (mesmo delay base)
  // Quando apenas um está visível, ele começa do índice 0
  const getGlobalIndex = (section: 'vendas' | 'compras' | 'operacional', index: number) => {
    // Se ambos estão visíveis, vendas e compras começam juntos (mesmo delay)
    if (mostrarVendas && mostrarCompras) {
      if (section === 'vendas') return index;
      if (section === 'compras') return index; // Mesmo delay que vendas
      return vendasCards.length + comprasCards.length + index;
    }
    // Se apenas vendas está visível
    if (mostrarVendas && !mostrarCompras) {
      if (section === 'vendas') return index;
      if (section === 'operacional') return vendasCards.length + index;
      return 0;
    }
    // Se apenas compras está visível
    if (!mostrarVendas && mostrarCompras) {
      if (section === 'compras') return index;
      if (section === 'operacional') return comprasCards.length + index;
      return 0;
    }
    // Fallback
    return index;
  };

  return (
    <div className="space-y-4 mb-6">
      {/* Cards de Vendas */}
      {mostrarVendas && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">
            Vendas
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {vendasCards.map((stat, index) => {
              const globalIndex = getGlobalIndex('vendas', index);
              return (
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
                      <p className="text-sm font-medium text-foreground mb-1">
                        {stat.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {stat.subtitle}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {stat.description}
                      </p>
                    </div>
                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                      <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cards de Compras */}
      {mostrarCompras && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">
            Compras
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {comprasCards.map((stat, index) => {
              const globalIndex = getGlobalIndex('compras', index);
              return (
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
                      <p className="text-sm font-medium text-foreground mb-1">
                        {stat.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {stat.subtitle}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {stat.description}
                      </p>
                    </div>
                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                      <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* BLOCO 2 — Operacional (quantidade) */}
      {mostrarOperacional && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">
            🔹 Operacional (quantidade)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {operacionalCards.map((stat, index) => {
              const globalIndex = getGlobalIndex('operacional', index);
              return (
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
                      <p className="text-sm font-medium text-foreground mb-1">
                        {stat.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {stat.subtitle}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {stat.description}
                      </p>
                    </div>
                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                      <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}


