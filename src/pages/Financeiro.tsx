import { useState } from "react";
import { motion } from "framer-motion";
import { 
  DollarSign, 
  Plus,
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  Filter,
  Search,
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

const stats = [
  { label: "Receita do Mês", value: "R$ 45.820,00", icon: TrendingUp, trend: "+12.5%", trendUp: true, color: "text-cyan", bgColor: "bg-cyan/10" },
  { label: "Despesas do Mês", value: "R$ 18.340,00", icon: TrendingDown, trend: "+3.2%", trendUp: false, color: "text-destructive", bgColor: "bg-destructive/10" },
  { label: "Saldo Atual", value: "R$ 27.480,00", icon: Wallet, trend: null, color: "text-azure", bgColor: "bg-azure/10" },
  { label: "Contas a Receber", value: "R$ 12.500,00", icon: CreditCard, trend: "5 pendentes", color: "text-royal", bgColor: "bg-royal/10" },
];

const initialTransacoes = [
  { id: "TRX-001", descricao: "Venda - Tech Solutions", tipo: "Receita", categoria: "Vendas", valor: "R$ 8.500,00", data: "05/12/2024", status: "Concluído" },
  { id: "TRX-002", descricao: "Compra de Estoque", tipo: "Despesa", categoria: "Estoque", valor: "R$ 3.200,00", data: "04/12/2024", status: "Pendente" },
  { id: "TRX-003", descricao: "Pagamento Fornecedor", tipo: "Despesa", categoria: "Fornecedores", valor: "R$ 1.800,00", data: "03/12/2024", status: "Concluído" },
  { id: "TRX-004", descricao: "Venda - Comércio ABC", tipo: "Receita", categoria: "Vendas", valor: "R$ 2.200,00", data: "03/12/2024", status: "Concluído" },
];

const Financeiro = () => {
  const [activeTab, setActiveTab] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [transacoes, setTransacoes] = useState(initialTransacoes);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTransacao, setNewTransacao] = useState({ descricao: "", tipo: "Receita", categoria: "", valor: "", data: "" });

  const filteredTransacoes = transacoes.filter(t => {
    const matchesSearch = t.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === "Todos" || t.tipo === activeTab;
    return matchesSearch && matchesTab;
  });

  const handleCreate = () => {
    if (!newTransacao.descricao || !newTransacao.valor) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    const id = `TRX-${String(transacoes.length + 1).padStart(3, "0")}`;
    setTransacoes([...transacoes, { ...newTransacao, id, status: "Pendente" }]);
    setNewTransacao({ descricao: "", tipo: "Receita", categoria: "", valor: "", data: "" });
    setDialogOpen(false);
    toast.success("Transação registrada com sucesso!");
  };

  const handleDelete = (id: string) => {
    setTransacoes(transacoes.filter(t => t.id !== id));
    toast.success("Transação excluída!");
  };

  return (
    <AppLayout>
      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Financeiro</h1>
            <p className="text-muted-foreground">Controle suas receitas e despesas</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gradient" className="gap-2">
                <Plus className="w-4 h-4" />
                Nova Transação
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Transação</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input 
                    placeholder="Descrição da transação"
                    value={newTransacao.descricao}
                    onChange={(e) => setNewTransacao({...newTransacao, descricao: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <select 
                      className="w-full h-11 rounded-lg border border-input bg-card px-4"
                      value={newTransacao.tipo}
                      onChange={(e) => setNewTransacao({...newTransacao, tipo: e.target.value})}
                    >
                      <option value="Receita">Receita</option>
                      <option value="Despesa">Despesa</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Input 
                      placeholder="Ex: Vendas"
                      value={newTransacao.categoria}
                      onChange={(e) => setNewTransacao({...newTransacao, categoria: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Valor</Label>
                    <Input 
                      placeholder="R$ 0,00"
                      value={newTransacao.valor}
                      onChange={(e) => setNewTransacao({...newTransacao, valor: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Data</Label>
                    <Input 
                      type="date"
                      value={newTransacao.data}
                      onChange={(e) => setNewTransacao({...newTransacao, data: e.target.value})}
                    />
                  </div>
                </div>
                <Button onClick={handleCreate} className="w-full" variant="gradient">
                  Registrar Transação
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {["Todos", "Receita", "Despesa"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-card text-muted-foreground hover:bg-secondary"
              }`}
            >
              {tab === "Receita" ? "Receitas" : tab === "Despesa" ? "Despesas" : tab}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-card rounded-xl border border-border p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              Filtros
            </Button>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar transação..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

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
                  <th className="text-left py-3 px-4 text-sm font-medium">Descrição</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Tipo</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Categoria</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Valor</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Data</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransacoes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      Nenhuma transação encontrada
                    </td>
                  </tr>
                ) : (
                  filteredTransacoes.map((transacao) => (
                    <tr key={transacao.id} className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors">
                      <td className="py-3 px-4 text-sm font-medium text-foreground">{transacao.id}</td>
                      <td className="py-3 px-4 text-sm text-foreground">{transacao.descricao}</td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          transacao.tipo === "Receita" ? "bg-cyan/10 text-cyan" : "bg-destructive/10 text-destructive"
                        }`}>
                          {transacao.tipo}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{transacao.categoria}</td>
                      <td className="py-3 px-4 text-sm font-medium text-foreground">{transacao.valor}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{transacao.data}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                            <Edit className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <button 
                            className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                            onClick={() => handleDelete(transacao.id)}
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

export default Financeiro;
