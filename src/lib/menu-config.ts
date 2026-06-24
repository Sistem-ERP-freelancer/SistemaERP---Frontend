import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Boxes,
  DollarSign,
  FileText,
  FolderOpen,
  Landmark,
  LayoutDashboard,
  LogOut,
  Package,
  Receipt,
  Settings,
  Shield,
  ShoppingCart,
  Sprout,
  Truck,
  TruckIcon,
  Users,
  Wallet,
} from "lucide-react";

export type MenuLink = {
  kind: "link";
  icon: LucideIcon;
  label: string;
  href: string;
};

export type MenuAction = {
  kind: "action";
  id: string;
  icon: LucideIcon;
  label: string;
  action: "logout";
};

export type MenuGroup = {
  kind: "group";
  id: string;
  icon: LucideIcon;
  label: string;
  children: (MenuLink | MenuAction)[];
};

export type MenuEntry = MenuLink | MenuGroup;

export function getAppMenu(isSuperAdmin: boolean): MenuEntry[] {
  const entries: MenuEntry[] = [
    { kind: "link", icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    {
      kind: "group",
      id: "financeiro",
      icon: DollarSign,
      label: "Financeiro",
      children: [
        { kind: "link", icon: BarChart3, label: "Visão Geral", href: "/financeiro" },
        { kind: "link", icon: Landmark, label: "Centro de Despesa", href: "/centro-custos" },
        { kind: "link", icon: FileText, label: "Contas a Pagar", href: "/contas-a-pagar" },
        { kind: "link", icon: Wallet, label: "Contas a Receber", href: "/contas-a-receber" },
      ],
    },
    {
      kind: "group",
      id: "comercial",
      icon: ShoppingCart,
      label: "Comercial",
      children: [
        { kind: "link", icon: ShoppingCart, label: "Pedidos", href: "/pedidos" },
        { kind: "link", icon: Receipt, label: "Notas Fiscais", href: "/notas-fiscais" },
      ],
    },
    {
      kind: "group",
      id: "cadastros",
      icon: FolderOpen,
      label: "Cadastros",
      children: [
        { kind: "link", icon: Users, label: "Clientes", href: "/clientes" },
        { kind: "link", icon: Truck, label: "Fornecedores", href: "/fornecedores" },
        { kind: "link", icon: Package, label: "Produtos", href: "/produtos" },
        { kind: "link", icon: TruckIcon, label: "Transportadoras", href: "/transportadoras" },
      ],
    },
    { kind: "link", icon: Boxes, label: "Movimentações", href: "/estoque" },
    { kind: "link", icon: Sprout, label: "Controle de Roça", href: "/controle-roca" },
    {
      kind: "group",
      id: "sistema",
      icon: Settings,
      label: "Sistema",
      children: [
        { kind: "link", icon: Settings, label: "Configurações", href: "/settings" },
        {
          kind: "action",
          id: "logout",
          icon: LogOut,
          label: "Sair",
          action: "logout",
        },
      ],
    },
  ];

  if (isSuperAdmin) {
    return [
      { kind: "link", icon: Shield, label: "Painel Admin", href: "/admin" },
      ...entries,
    ];
  }

  return entries;
}

export function isActiveRoute(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (href === "/dashboard") return false;
  return pathname.startsWith(`${href}/`);
}

export function groupHasActiveRoute(
  pathname: string,
  group: MenuGroup,
): boolean {
  return group.children.some(
    (child) => child.kind === "link" && isActiveRoute(pathname, child.href),
  );
}
