import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { 
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ShoppingCart,
  Loader2
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { financeiroService } from "@/services/financeiro.service";
import { pedidosService } from "@/services/pedidos.service";
import { estoqueService } from "@/services/estoque.service";
import { formatCurrency, formatDate } from "@/lib/utils";

const Dashboard = () => {
  // Buscar dados financeiros
  const { data: dashboardReceber, isLoading: loadingReceber } = useQuery({
    queryKey: ['dashboard', 'receber'],
    queryFn: () => financeiroService.getDashboardReceber(),
    refetchInterval: 30000, // Atualiza a cada 30 segundos
  });

  const { data: dashboardPagar, isLoading: loadingPagar } = useQuery({
    queryKey: ['dashboard', 'pagar'],
    queryFn: () => financeiroService.getDashboardPagar(),
    refetchInterval: 30000,
  });

  // Buscar pedidos recentes (vendas)
  const { data: pedidosData, isLoading: loadingPedidos } = useQuery({
    queryKey: ['pedidos', 'recentes'],
    queryFn: () => pedidosService.listar({ page: 1, limit: 5, tipo: 'VENDA' }),
    refetchInterval: 30000,
  });

  // Buscar pedidos pendentes (todos os tipos, exceto concluídos e cancelados)
  const { data: pedidosPendentesData } = useQuery({
    queryKey: ['pedidos', 'pendentes'],
    queryFn: () => pedidosService.listar({ 
      page: 1, 
      limit: 100,
      status: 'PENDENTE' // Busca apenas pendentes
    }),
    refetchInterval: 30000,
  });

  // Buscar produtos com estoque baixo usando endpoint dedicado
  const { data: estoqueBaixoData, isLoading: loadingProdutos } = useQuery({
    queryKey: ['estoque', 'baixo'],
    queryFn: () => estoqueService.obterEstoqueBaixo({ page: 1, limit: 10 }),
    refetchInterval: 30000,
  });

  const isLoading = loadingReceber || loadingPagar || loadingPedidos || loadingProdutos;

  // Produtos com estoque baixo do endpoint dedicado
  const produtosEstoqueBaixo = estoqueBaixoData?.produtos || [];
  const countEstoqueBaixo = estoqueBaixoData?.total || 0;

  // Preparar estatísticas
  const stats = [
    { 
      label: "Produtos com Estoque Baixo", 
      value: countEstoqueBaixo.toString(), 
      icon: AlertTriangle,
      trend: null,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
      isLoading: loadingProdutos
    },
    { 
      label: "Total a Receber", 
      value: dashboardReceber ? formatCurrency(dashboardReceber.total) : "R$ 0,00", 
      icon: TrendingUp,
      trend: null,
      trendUp: true,
      color: "text-cyan",
      bgColor: "bg-cyan/10",
      isLoading: loadingReceber
    },
    { 
      label: "Total a Pagar", 
      value: dashboardPagar ? formatCurrency(dashboardPagar.total) : "R$ 0,00", 
      icon: TrendingDown,
      trend: null,
      trendUp: false,
      color: "text-azure",
      bgColor: "bg-azure/10",
      isLoading: loadingPagar
    },
    { 
      label: "Pedidos Pendentes", 
      value: (pedidosPendentesData?.total || 0).toString(), 
      icon: ShoppingCart,
      trend: null,
      trendUp: true,
      color: "text-royal",
      bgColor: "bg-royal/10",
      isLoading: loadingPedidos
    },
  ];

  const recentSales = pedidosData?.data?.slice(0, 4).map(pedido => ({
    cliente: `Cliente #${pedido.cliente_id || 'N/A'}`,
    produto: `${pedido.itens?.length || 0} item(ns)`,
    valor: formatCurrency(pedido.valor_total || 0),
    data: pedido.created_at ? formatDate(pedido.created_at) : 'N/A',
    status: pedido.status || 'Pendente',
  })) || [];

  const lowStockProducts = produtosEstoqueBaixo.slice(0, 5).map(produto => ({
    produto: produto.nome,
    categoria: produto.categoria_nome || 'N/A',
    estoque: produto.estoque_atual,
    minimo: produto.estoque_minimo,
  }));

  return (
    <AppLayout>
      <div className="p-6">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do seu negócio</p>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-card rounded-xl p-5 border border-border hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  {stat.isLoading ? (
                    <Loader2 className={`w-5 h-5 ${stat.color} animate-spin`} />
                  ) : (
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  )}
                </div>
                {stat.trend && (
                  <span className={`text-sm font-medium ${stat.trendUp ? "text-cyan" : "text-destructive"}`}>
                    {stat.trend}
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-foreground mb-1">
                {stat.isLoading ? '...' : stat.value}
              </p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Tables Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Sales */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card rounded-xl border border-border overflow-hidden"
          >
            <div className="p-5 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">Vendas Recentes</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-sidebar text-sidebar-foreground">
                    <th className="text-left py-3 px-4 text-sm font-medium">Cliente</th>
                    <th className="text-left py-3 px-4 text-sm font-medium">Produto</th>
                    <th className="text-left py-3 px-4 text-sm font-medium">Valor</th>
                    <th className="text-left py-3 px-4 text-sm font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading && recentSales.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-muted-foreground">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                        Carregando vendas...
                      </td>
                    </tr>
                  ) : recentSales.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-muted-foreground">
                        Nenhuma venda recente
                      </td>
                    </tr>
                  ) : (
                    recentSales.map((sale, index) => (
                      <tr key={index} className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors">
                        <td className="py-3 px-4 text-sm text-foreground">{sale.cliente}</td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">{sale.produto}</td>
                        <td className="py-3 px-4 text-sm font-medium text-foreground">{sale.valor}</td>
                        <td className="py-3 px-4">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            sale.status === "CONCLUIDO" || sale.status === "Concluído"
                              ? "bg-cyan/10 text-cyan" 
                              : sale.status === "PENDENTE" || sale.status === "Pendente"
                                ? "bg-amber-500/10 text-amber-500"
                                : "bg-azure/10 text-azure"
                          }`}>
                            {sale.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Low Stock */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-card rounded-xl border border-border overflow-hidden"
          >
            <div className="p-5 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">Produtos com Estoque Baixo</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-sidebar text-sidebar-foreground">
                    <th className="text-left py-3 px-4 text-sm font-medium">Produto</th>
                    <th className="text-left py-3 px-4 text-sm font-medium">Categoria</th>
                    <th className="text-left py-3 px-4 text-sm font-medium">Em Estoque</th>
                    <th className="text-left py-3 px-4 text-sm font-medium">Mínimo</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading && lowStockProducts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-muted-foreground">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                        Carregando produtos...
                      </td>
                    </tr>
                  ) : lowStockProducts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-muted-foreground">
                        Nenhum produto com estoque baixo
                      </td>
                    </tr>
                  ) : (
                    lowStockProducts.map((product, index) => (
                      <tr key={index} className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors">
                        <td className="py-3 px-4 text-sm text-foreground">{product.produto}</td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">{product.categoria}</td>
                        <td className="py-3 px-4">
                          <span className="text-sm font-medium text-destructive">{product.estoque}</span>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">{product.minimo}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
