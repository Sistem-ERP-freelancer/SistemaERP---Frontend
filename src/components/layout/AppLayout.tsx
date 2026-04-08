import { Notifications } from "@/components/Notifications";
import { TopERPLogo } from "@/components/TopERPLogo";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import {
    Boxes,
    ChevronDown,
    DollarSign,
    FileText,
    Landmark,
    LayoutDashboard,
    LogOut,
    Menu,
    Package,
    Settings,
    Shield,
    ShoppingCart,
    Sprout,
    Truck,
    TruckIcon,
    User,
    Users,
    Wallet,
    X
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const getMenuItems = (isSuperAdmin: boolean) => {
  const baseItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: DollarSign, label: "Financeiro", href: "/financeiro" },
    { icon: Landmark, label: "Centro de custos", href: "/centro-custos" },
    { icon: FileText, label: "Contas a Pagar", href: "/contas-a-pagar" },
    { icon: Wallet, label: "Contas a Receber", href: "/contas-a-receber" },
    { icon: ShoppingCart, label: "Pedidos", href: "/pedidos" },
    { icon: Truck, label: "Fornecedores", href: "/fornecedores" },
    { icon: Users, label: "Clientes", href: "/clientes" },
    { icon: Package, label: "Produtos", href: "/produtos" },
    { icon: Boxes, label: "Movimentações", href: "/estoque" },
    { icon: TruckIcon, label: "Transportadoras", href: "/transportadoras" },
    { icon: Sprout, label: "Controle de Roça", href: "/controle-roca" },
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

const LARGURA_MENU_COMPLETO_PX = 1024; // a partir de 1024px (notebook 15", etc.) o menu pode mostrar ícones + nomes; abaixo disso é overlay no mobile

const AppLayout = ({ children }: AppLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const updateSidebar = () => {
      const w = window.innerWidth;
      if (w >= LARGURA_MENU_COMPLETO_PX) {
        setSidebarOpen((prev) => prev);
      } else {
        setSidebarOpen(false);
      }
    };
    const mqMenuCompleto = window.matchMedia(`(min-width: ${LARGURA_MENU_COMPLETO_PX}px)`);
    if (mqMenuCompleto.matches) setSidebarOpen(true);
    else setSidebarOpen(false);
    window.addEventListener("resize", updateSidebar);
    return () => window.removeEventListener("resize", updateSidebar);
  }, []);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isSuperAdmin } = useAuth();
  const menuItems = getMenuItems(isSuperAdmin);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const toggleSidebar = () => {
    if (typeof window === "undefined") return;
    const w = window.innerWidth;
    if (w < 1024) {
      setSidebarOpen((prev) => !prev);
    } else if (w >= LARGURA_MENU_COMPLETO_PX) {
      setSidebarOpen((prev) => !prev);
    } else {
      setSidebarOpen(false);
    }
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
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar: no mobile é overlay (fixed); no desktop faz parte do layout (não fixa) */}
      <aside 
        className={`
          flex flex-col bg-sidebar transition-all duration-300 ease-out flex-shrink-0
          fixed inset-y-0 left-0 z-50 lg:relative lg:inset-auto lg:z-auto
          ${sidebarOpen 
            ? "w-[200px] sm:w-[220px] min-[1920px]:w-[240px] translate-x-0 shadow-xl lg:shadow-none" 
            : "w-0 -translate-x-full lg:w-16 xl:w-20 lg:translate-x-0"
          }
        `}
      >
        {/* Logo - Fixo no topo */}
        <div className="h-14 sm:h-16 flex-shrink-0 flex items-center justify-between px-3 sm:px-4 border-b border-sidebar-border gap-2">
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
            onClick={toggleSidebar}
            className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-sidebar-accent text-sidebar-foreground transition-colors shrink-0"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation - Área rolável */}
        <nav className="flex-1 py-3 sm:py-4 px-2 sm:px-3 space-y-0.5 overflow-y-auto overflow-x-hidden min-h-0">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.label}
                to={item.href}
                className={`flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 py-3 min-h-[44px] rounded-lg transition-all duration-200 ${
                  isActive 
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-glow" 
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {sidebarOpen && (
                  <span
                    className="font-medium min-w-0 max-w-full whitespace-nowrap min-[1920px]:whitespace-normal min-[1920px]:overflow-visible min-[1920px]:text-clip"
                    title={item.label}
                  >
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout - Fixo no final */}
        <div className="flex-shrink-0 px-2 sm:px-3 pt-2 pb-3 border-t border-sidebar-border">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 py-2.5 min-h-[44px] rounded-lg w-full text-sidebar-foreground hover:bg-destructive/20 hover:text-destructive transition-colors"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {sidebarOpen && <span className="font-medium whitespace-nowrap">Sair</span>}
          </button>
        </div>
      </aside>

      {/* Main Content - ocupa o espaço restante; sem margem fixa pois a sidebar está no fluxo no desktop */}
      <main className="flex-1 min-w-0 flex flex-col min-h-0 transition-all duration-300">
        {/* Header */}
        <header className="h-14 sm:h-16 bg-card border-b border-border flex items-center justify-between px-3 sm:px-6 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button 
              onClick={toggleSidebar}
              className="lg:hidden touch-target min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-secondary text-foreground transition-colors shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Notifications />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 p-1.5 sm:p-1 min-h-[44px] min-w-[44px] sm:min-w-0 rounded-full hover:bg-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full primary-gradient flex items-center justify-center text-primary-foreground font-semibold text-sm">
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
        <div className="min-w-0 overflow-x-hidden flex-1 flex flex-col">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
