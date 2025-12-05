import { useState } from "react";
import { motion } from "framer-motion";
import { 
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ShoppingCart,
  Filter,
  Calendar,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/layout/AppLayout";

const stats = [
  { 
    label: "Produtos com Estoque Baixo", 
    value: "12", 
    icon: AlertTriangle,
    trend: null,
    color: "text-destructive",
    bgColor: "bg-destructive/10"
  },
  { 
    label: "Receita Total do Mês", 
    value: "R$ 45.820,00", 
    icon: TrendingUp,
    trend: "+12.5%",
    trendUp: true,
    color: "text-cyan",
    bgColor: "bg-cyan/10"
  },
  { 
    label: "Total a Pagar no Mês", 
    value: "R$ 18.340,00", 
    icon: TrendingDown,
    trend: "-3.2%",
    trendUp: false,
    color: "text-azure",
    bgColor: "bg-azure/10"
  },
  { 
    label: "Pedidos Pendentes", 
    value: "28", 
    icon: ShoppingCart,
    trend: "+8",
    trendUp: true,
    color: "text-royal",
    bgColor: "bg-royal/10"
  },
];

const recentSales = [
  { cliente: "Tech Solutions Ltda", produto: "Notebook Dell XPS", valor: "R$ 8.500,00", data: "05/12/2024", status: "Concluído" },
  { cliente: "Comércio ABC", produto: "Monitor LG 27\"", valor: "R$ 2.200,00", data: "05/12/2024", status: "Pendente" },
  { cliente: "Indústria XYZ", produto: "Teclado Mecânico", valor: "R$ 450,00", data: "04/12/2024", status: "Concluído" },
  { cliente: "Loja Digital", produto: "Mouse Gamer", valor: "R$ 320,00", data: "04/12/2024", status: "Em Processamento" },
];

const lowStockProducts = [
  { produto: "Notebook Dell XPS", categoria: "Eletrônicos", estoque: 3, minimo: 10 },
  { produto: "Monitor LG 27\"", categoria: "Eletrônicos", estoque: 5, minimo: 15 },
  { produto: "Teclado Mecânico", categoria: "Periféricos", estoque: 8, minimo: 20 },
];

const Dashboard = () => {
  const [filterOpen, setFilterOpen] = useState(false);

  return (
    <AppLayout>
      <div className="p-6">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do seu negócio</p>
        </div>

        {/* Filters */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center gap-3 mb-6"
        >
          <Button 
            variant="outline" 
            onClick={() => setFilterOpen(!filterOpen)}
            className="gap-2"
          >
            <Filter className="w-4 h-4" />
            Filtros
            <ChevronDown className={`w-4 h-4 transition-transform ${filterOpen ? "rotate-180" : ""}`} />
          </Button>
          <Button variant="outline" className="gap-2">
            <Calendar className="w-4 h-4" />
            Dezembro 2024
          </Button>
          <div className="flex gap-2 ml-auto">
            <Button variant="secondary" size="sm">Hoje</Button>
            <Button variant="ghost" size="sm">7 dias</Button>
            <Button variant="ghost" size="sm">30 dias</Button>
          </div>
        </motion.div>

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
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                {stat.trend && (
                  <span className={`text-sm font-medium ${stat.trendUp ? "text-cyan" : "text-destructive"}`}>
                    {stat.trend}
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-foreground mb-1">{stat.value}</p>
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
                  {recentSales.map((sale, index) => (
                    <tr key={index} className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors">
                      <td className="py-3 px-4 text-sm text-foreground">{sale.cliente}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{sale.produto}</td>
                      <td className="py-3 px-4 text-sm font-medium text-foreground">{sale.valor}</td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          sale.status === "Concluído" 
                            ? "bg-cyan/10 text-cyan" 
                            : sale.status === "Pendente"
                              ? "bg-amber-500/10 text-amber-500"
                              : "bg-azure/10 text-azure"
                        }`}>
                          {sale.status}
                        </span>
                      </td>
                    </tr>
                  ))}
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
                  {lowStockProducts.map((product, index) => (
                    <tr key={index} className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors">
                      <td className="py-3 px-4 text-sm text-foreground">{product.produto}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{product.categoria}</td>
                      <td className="py-3 px-4">
                        <span className="text-sm font-medium text-destructive">{product.estoque}</span>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{product.minimo}</td>
                    </tr>
                  ))}
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
