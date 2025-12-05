import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Boxes, 
  Plus,
  Search,
  ArrowUpCircle,
  ArrowDownCircle,
  Eye,
  Edit
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

const initialEstoque = [
  { id: 1, produto: "Notebook Dell XPS 15", sku: "NB-DELL-001", quantidade: 15, minimo: 10, maximo: 50, localizacao: "A1-01", status: "Normal" },
  { id: 2, produto: "Monitor LG 27\" 4K", sku: "MN-LG-002", quantidade: 8, minimo: 15, maximo: 40, localizacao: "A1-02", status: "Baixo" },
  { id: 3, produto: "Teclado Mecânico RGB", sku: "TC-MEC-003", quantidade: 25, minimo: 20, maximo: 100, localizacao: "B2-01", status: "Normal" },
  { id: 4, produto: "Mouse Gamer Wireless", sku: "MS-GAM-004", quantidade: 3, minimo: 10, maximo: 80, localizacao: "B2-02", status: "Crítico" },
  { id: 5, produto: "Webcam Full HD", sku: "WB-FHD-005", quantidade: 0, minimo: 5, maximo: 30, localizacao: "C3-01", status: "Sem Estoque" },
];

const Estoque = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [estoque, setEstoque] = useState(initialEstoque);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [movimentacao, setMovimentacao] = useState({ produtoId: "", tipo: "Entrada", quantidade: "" });

  const filteredEstoque = estoque.filter(e => 
    e.produto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMovimentacao = () => {
    if (!movimentacao.produtoId || !movimentacao.quantidade) {
      toast.error("Selecione um produto e quantidade");
      return;
    }
    
    const qtd = parseInt(movimentacao.quantidade);
    setEstoque(estoque.map(item => {
      if (item.id === parseInt(movimentacao.produtoId)) {
        const novaQtd = movimentacao.tipo === "Entrada" ? item.quantidade + qtd : Math.max(0, item.quantidade - qtd);
        let status = "Normal";
        if (novaQtd === 0) status = "Sem Estoque";
        else if (novaQtd < item.minimo / 2) status = "Crítico";
        else if (novaQtd < item.minimo) status = "Baixo";
        return { ...item, quantidade: novaQtd, status };
      }
      return item;
    }));
    
    setMovimentacao({ produtoId: "", tipo: "Entrada", quantidade: "" });
    setDialogOpen(false);
    toast.success(`${movimentacao.tipo} registrada com sucesso!`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Normal": return "bg-cyan/10 text-cyan";
      case "Baixo": return "bg-amber-500/10 text-amber-500";
      case "Crítico": return "bg-destructive/10 text-destructive";
      case "Sem Estoque": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <AppLayout>
      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Estoque</h1>
            <p className="text-muted-foreground">Controle de estoque dos produtos</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gradient" className="gap-2">
                <Plus className="w-4 h-4" />
                Movimentar Estoque
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Movimentação de Estoque</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Produto</Label>
                  <select 
                    className="w-full h-11 rounded-lg border border-input bg-card px-4"
                    value={movimentacao.produtoId}
                    onChange={(e) => setMovimentacao({...movimentacao, produtoId: e.target.value})}
                  >
                    <option value="">Selecione um produto</option>
                    {estoque.map(item => (
                      <option key={item.id} value={item.id}>{item.produto} ({item.sku})</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <select 
                      className="w-full h-11 rounded-lg border border-input bg-card px-4"
                      value={movimentacao.tipo}
                      onChange={(e) => setMovimentacao({...movimentacao, tipo: e.target.value})}
                    >
                      <option value="Entrada">Entrada</option>
                      <option value="Saída">Saída</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Quantidade</Label>
                    <Input 
                      type="number"
                      placeholder="0"
                      value={movimentacao.quantidade}
                      onChange={(e) => setMovimentacao({...movimentacao, quantidade: e.target.value})}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => { setMovimentacao({...movimentacao, tipo: "Entrada"}); handleMovimentacao(); }} className="flex-1 gap-2" variant="default">
                    <ArrowUpCircle className="w-4 h-4" />
                    Entrada
                  </Button>
                  <Button onClick={() => { setMovimentacao({...movimentacao, tipo: "Saída"}); handleMovimentacao(); }} className="flex-1 gap-2" variant="outline">
                    <ArrowDownCircle className="w-4 h-4" />
                    Saída
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="bg-card rounded-xl border border-border p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por produto ou SKU..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
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
                  <th className="text-left py-3 px-4 text-sm font-medium">Produto</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">SKU</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Quantidade</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Mínimo</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Máximo</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Localização</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredEstoque.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-muted-foreground">
                      Nenhum item de estoque encontrado
                    </td>
                  </tr>
                ) : (
                  filteredEstoque.map((item) => (
                    <tr key={item.id} className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors">
                      <td className="py-3 px-4 text-sm font-medium text-foreground">{item.produto}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{item.sku}</td>
                      <td className="py-3 px-4">
                        <span className={`text-sm font-bold ${item.quantidade < item.minimo ? "text-destructive" : "text-foreground"}`}>
                          {item.quantidade}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{item.minimo}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{item.maximo}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{item.localizacao}</td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                            <Edit className="w-4 h-4 text-muted-foreground" />
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

export default Estoque;
