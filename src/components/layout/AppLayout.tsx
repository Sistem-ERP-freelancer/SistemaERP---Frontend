import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
  TruckIcon,
  Shield,
  Settings,
  User,
  ChevronDown
} from "lucide-react";
import { Notifications } from "@/components/Notifications";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TopERPLogo } from "@/components/TopERPLogo";

const getMenuItems = (isSuperAdmin: boolean) => {
  const baseItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: ShoppingCart, label: "Pedidos", href: "/pedidos" },
    { icon: DollarSign, label: "Financeiro", href: "/financeiro" },
    { icon: Truck, label: "Fornecedores", href: "/fornecedores" },
    { icon: Users, label: "Clientes", href: "/clientes" },
    { icon: Package, label: "Produtos", href: "/produtos" },
    { icon: Boxes, label: "Estoque", href: "/estoque" },
    { icon: TruckIcon, label: "Transportadoras", href: "/transportadoras" },
    { icon: Settings, label: "Configurações", href: "/settings" },
  ];

  if (isSuperAdmin) {
    return [
      { icon: Shield, label: "Painel Admin", href: "/admin" },
      ...baseItems,
    ];
  }

  return baseItems;
};

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isSuperAdmin } = useAuth();
  const menuItems = getMenuItems(isSuperAdmin);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const getUserInitials = () => {
    if (user?.nome) {
      return user.nome
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-sidebar transition-all duration-300 ${
          sidebarOpen ? "w-64 translate-x-0" : "w-0 -translate-x-full lg:w-20 lg:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
          {sidebarOpen && (
            <TopERPLogo 
              variant="sidebar"
              showText={false}
            />
          )}
          {!sidebarOpen && (
            <div className="mx-auto">
              <TopERPLogo 
                variant="sidebar"
                showText={false}
              />
            </div>
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
          {menuItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.label}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                  isActive 
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-glow" 
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
              </Link>
            );
          })}
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
          </div>
          <div className="flex items-center gap-3">
            <Notifications />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 p-1 rounded-full hover:bg-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
            <div className="w-10 h-10 rounded-full primary-gradient flex items-center justify-center text-primary-foreground font-semibold">
              {getUserInitials()}
            </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.nome || "Usuário"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                    {user?.role && (
                      <p className="text-xs leading-none text-muted-foreground mt-1">
                        {user.role === "ADMIN" && "Administrador"}
                        {user.role === "GERENTE" && "Gerente"}
                        {user.role === "VENDEDOR" && "Vendedor"}
                        {user.role === "FINANCEIRO" && "Financeiro"}
                        {user.role === "SUPER_ADMIN" && "Super Administrador"}
                      </p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {/* Opções apenas para ADMIN e GERENTE */}
                {(user?.role === "ADMIN" || user?.role === "GERENTE") && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link to="/settings" className="flex items-center cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        Configurações
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/settings" className="flex items-center cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        Gerenciar Usuários
                      </Link>
                    </DropdownMenuItem>
                    {isSuperAdmin && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex items-center cursor-pointer">
                          <Shield className="mr-2 h-4 w-4" />
                          Painel Admin
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                  </>
                )}
                {/* Logout sempre disponível para todos */}
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-destructive focus:text-destructive cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Content */}
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
