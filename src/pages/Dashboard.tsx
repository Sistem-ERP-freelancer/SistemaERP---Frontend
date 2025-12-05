import { useState } from "react";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  ShoppingCart, 
  DollarSign, 
  Truck, 
  Users, 
  Package, 
  Boxes,
  LogOut,
  Menu,
  X,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Search,
  Bell,
  Filter,
  Calendar,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", active: true },
  { icon: ShoppingCart, label: "Pedidos", href: "/pedidos" },
  { icon: DollarSign, label: "Financeiro", href: "/financeiro" },
  { icon: Truck, label: "Fornecedores", href: "/fornecedores" },
  { icon: Users, label: "Clientes", href: "/clientes" },
  { icon: Package, label: "Produtos", href: "/produtos" },
  { icon: Boxes, label: "Estoque", href: "/estoque" },
];

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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    toast.success("Logout realizado com sucesso!");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-sidebar transition-all duration-300 ${
          sidebarOpen ? "w-64" : "w-0 lg:w-20"
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
          {sidebarOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 rounded-lg accent-gradient flex items-center justify-center">
                <Package className="w-5 h-5 text-accent-foreground" />
              </div>
              <span className="font-bold text-sidebar-foreground">GestãoPro</span>
            </motion.div>
          )}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.label}
              to={item.href}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                item.active 
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-glow" 
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {sidebarOpen && <span className="font-medium">{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-sidebar-border">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-3 rounded-lg w-full text-sidebar-foreground hover:bg-destructive/20 hover:text-destructive transition-colors"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {sidebarOpen && <span className="font-medium">Sair</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Header */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-secondary text-foreground transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar..." 
                className="pl-10 w-64 bg-background"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-cyan rounded-full" />
            </button>
            <div className="w-10 h-10 rounded-full primary-gradient flex items-center justify-center text-primary-foreground font-semibold">
              U
            </div>
          </div>
        </header>

        {/* Content */}
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
      </main>
    </div>
  );
};

export default Dashboard;
