import { useState } from "react";
import { motion } from "framer-motion";
import { 
  ShoppingCart, 
  Plus,
  Filter,
  Search,
  ChevronDown,
  Eye,
  Edit,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AppLayout from "@/components/layout/AppLayout";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const statusTabs = ["Todos", "Vendas", "Compras", "PENDENTE", "APROVADO", "EM PROCESSAMENTO", "CONCLUÍDO", "CANCELADO"];

const initialPedidos = [
  { id: "PED-001", tipo: "Venda", cliente: "Tech Solutions Ltda", valor: "R$ 8.500,00", vencimento: "10/12/2024", status: "Pendente" },
  { id: "PED-002", tipo: "Compra", cliente: "Fornecedor ABC", valor: "R$ 3.200,00", vencimento: "15/12/2024", status: "Aprovado" },
  { id: "PED-003", tipo: "Venda", cliente: "Comércio XYZ", valor: "R$ 1.450,00", vencimento: "08/12/2024", status: "Concluído" },
  { id: "PED-004", tipo: "Venda", cliente: "Indústria Beta", valor: "R$ 5.800,00", vencimento: "20/12/2024", status: "Em Processamento" },
];

const Pedidos = () => {
  const [activeTab, setActiveTab] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [pedidos, setPedidos] = useState(initialPedidos);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newPedido, setNewPedido] = useState({ tipo: "Venda", cliente: "", valor: "", vencimento: "" });

  const filteredPedidos = pedidos.filter(p => {
    const matchesSearch = p.cliente.toLowerCase().includes(searchTerm.toLowerCase()) || p.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === "Todos" || 
      activeTab === "Vendas" && p.tipo === "Venda" ||
      activeTab === "Compras" && p.tipo === "Compra" ||
      p.status.toUpperCase() === activeTab;
    return matchesSearch && matchesTab;
  });

  const handleCreate = () => {
    if (!newPedido.cliente || !newPedido.valor) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    const id = `PED-${String(pedidos.length + 1).padStart(3, "0")}`;
    setPedidos([...pedidos, { ...newPedido, id, status: "Pendente" }]);
    setNewPedido({ tipo: "Venda", cliente: "", valor: "", vencimento: "" });
    setDialogOpen(false);
    toast.success("Pedido criado com sucesso!");
  };

  const handleDelete = (id: string) => {
    setPedidos(pedidos.filter(p => p.id !== id));
    toast.success("Pedido excluído!");
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "concluído": return "bg-cyan/10 text-cyan";
      case "pendente": return "bg-amber-500/10 text-amber-500";
      case "aprovado": return "bg-green-500/10 text-green-500";
      case "em processamento": return "bg-azure/10 text-azure";
      case "cancelado": return "bg-destructive/10 text-destructive";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <AppLayout>
      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pedidos</h1>
            <p className="text-muted-foreground">Gerencie seus pedidos de compra e venda</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="gradient" className="gap-2">
                  <ShoppingCart className="w-4 h-4" />
                  Pedido de Compra
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Novo Pedido</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <select 
                      className="w-full h-11 rounded-lg border border-input bg-card px-4"
                      value={newPedido.tipo}
                      onChange={(e) => setNewPedido({...newPedido, tipo: e.target.value})}
                    >
                      <option value="Venda">Venda</option>
                      <option value="Compra">Compra</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Cliente/Fornecedor</Label>
                    <Input 
                      placeholder="Nome do cliente ou fornecedor"
                      value={newPedido.cliente}
                      onChange={(e) => setNewPedido({...newPedido, cliente: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Valor</Label>
                    <Input 
                      placeholder="R$ 0,00"
                      value={newPedido.valor}
                      onChange={(e) => setNewPedido({...newPedido, valor: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Vencimento</Label>
                    <Input 
                      type="date"
                      value={newPedido.vencimento}
                      onChange={(e) => setNewPedido({...newPedido, vencimento: e.target.value})}
                    />
                  </div>
                  <Button onClick={handleCreate} className="w-full" variant="gradient">
                    Criar Pedido
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" className="gap-2" onClick={() => { setNewPedido({...newPedido, tipo: "Venda"}); setDialogOpen(true); }}>
              <Plus className="w-4 h-4" />
              Pedido de Venda
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-4">
          {statusTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-card text-muted-foreground hover:bg-secondary"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Filters */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl border border-border p-4 mb-6"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              Filtros Avançados
              <ChevronDown className="w-4 h-4" />
            </Button>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por cliente ou fornecedor..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl border border-border overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-sidebar text-sidebar-foreground">
                  <th className="text-left py-3 px-4 text-sm font-medium">ID</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Tipo</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Cliente/Fornecedor</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Valor</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Vencimento</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredPedidos.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      Nenhum pedido encontrado
                    </td>
                  </tr>
                ) : (
                  filteredPedidos.map((pedido) => (
                    <tr key={pedido.id} className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors">
                      <td className="py-3 px-4 text-sm font-medium text-foreground">{pedido.id}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{pedido.tipo}</td>
                      <td className="py-3 px-4 text-sm text-foreground">{pedido.cliente}</td>
                      <td className="py-3 px-4 text-sm font-medium text-foreground">{pedido.valor}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{pedido.vencimento}</td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(pedido.status)}`}>
                          {pedido.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          <button className="p-2 hover:bg-secondary rounded-lg transition-colors" title="Visualizar">
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <button className="p-2 hover:bg-secondary rounded-lg transition-colors" title="Editar">
                            <Edit className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <button 
                            className="p-2 hover:bg-destructive/10 rounded-lg transition-colors" 
                            title="Excluir"
                            onClick={() => handleDelete(pedido.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default Pedidos;
