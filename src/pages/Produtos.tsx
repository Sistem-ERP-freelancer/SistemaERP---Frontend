import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Package, 
  Plus,
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

const initialProdutos = [
  { id: 1, nome: "Notebook Dell XPS 15", sku: "NB-DELL-001", preco: "R$ 8.500,00", estoque: 15, categoria: "Eletrônicos", status: "Ativo" },
  { id: 2, nome: "Monitor LG 27\" 4K", sku: "MN-LG-002", preco: "R$ 2.200,00", estoque: 8, categoria: "Eletrônicos", status: "Ativo" },
  { id: 3, nome: "Teclado Mecânico RGB", sku: "TC-MEC-003", preco: "R$ 450,00", estoque: 25, categoria: "Periféricos", status: "Ativo" },
  { id: 4, nome: "Mouse Gamer Wireless", sku: "MS-GAM-004", preco: "R$ 320,00", estoque: 30, categoria: "Periféricos", status: "Ativo" },
  { id: 5, nome: "Webcam Full HD", sku: "WB-FHD-005", preco: "R$ 280,00", estoque: 0, categoria: "Acessórios", status: "Inativo" },
];

const Produtos = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [produtos, setProdutos] = useState(initialProdutos);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newProduto, setNewProduto] = useState({ nome: "", sku: "", preco: "", estoque: "", categoria: "" });

  const filteredProdutos = produtos.filter(p => 
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = () => {
    if (!newProduto.nome || !newProduto.sku) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }
    setProdutos([...produtos, { 
      ...newProduto, 
      id: produtos.length + 1, 
      estoque: parseInt(newProduto.estoque) || 0,
      status: "Ativo" 
    }]);
    setNewProduto({ nome: "", sku: "", preco: "", estoque: "", categoria: "" });
    setDialogOpen(false);
    toast.success("Produto cadastrado com sucesso!");
  };

  const handleDelete = (id: number) => {
    setProdutos(produtos.filter(p => p.id !== id));
    toast.success("Produto excluído!");
  };

  return (
    <AppLayout>
      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Produtos</h1>
            <p className="text-muted-foreground">Gerencie seu catálogo de produtos</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gradient" className="gap-2">
                <Plus className="w-4 h-4" />
                Criar Produto
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Produto</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Nome do Produto *</Label>
                  <Input 
                    placeholder="Nome do produto"
                    value={newProduto.nome}
                    onChange={(e) => setNewProduto({...newProduto, nome: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>SKU *</Label>
                    <Input 
                      placeholder="EX: PROD-001"
                      value={newProduto.sku}
                      onChange={(e) => setNewProduto({...newProduto, sku: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Input 
                      placeholder="Ex: Eletrônicos"
                      value={newProduto.categoria}
                      onChange={(e) => setNewProduto({...newProduto, categoria: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Preço</Label>
                    <Input 
                      placeholder="R$ 0,00"
                      value={newProduto.preco}
                      onChange={(e) => setNewProduto({...newProduto, preco: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Estoque Inicial</Label>
                    <Input 
                      type="number"
                      placeholder="0"
                      value={newProduto.estoque}
                      onChange={(e) => setNewProduto({...newProduto, estoque: e.target.value})}
                    />
                  </div>
                </div>
                <Button onClick={handleCreate} className="w-full" variant="gradient">
                  Cadastrar Produto
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="bg-card rounded-xl border border-border p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nome ou SKU..." 
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
                  <th className="text-left py-3 px-4 text-sm font-medium">Nome</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">SKU</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Preço</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Estoque</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Categoria</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredProdutos.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      Nenhum produto encontrado
                    </td>
                  </tr>
                ) : (
                  filteredProdutos.map((produto) => (
                    <tr key={produto.id} className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors">
                      <td className="py-3 px-4 text-sm font-medium text-foreground">{produto.nome}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{produto.sku}</td>
                      <td className="py-3 px-4 text-sm font-medium text-foreground">{produto.preco}</td>
                      <td className="py-3 px-4">
                        <span className={`text-sm font-medium ${produto.estoque < 10 ? "text-destructive" : "text-foreground"}`}>
                          {produto.estoque}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{produto.categoria}</td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          produto.status === "Ativo" ? "bg-cyan/10 text-cyan" : "bg-muted text-muted-foreground"
                        }`}>
                          {produto.status}
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
                          <button 
                            className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                            onClick={() => handleDelete(produto.id)}
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

export default Produtos;
