import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Truck, 
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail
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

const initialTransportadoras = [
  { id: 1, nome: "Transportes Rápidos Ltda", cnpj: "12.345.678/0001-90", email: "contato@transrapidos.com", telefone: "(11) 98765-4321", status: "Ativo" },
  { id: 2, nome: "LogExpress", cnpj: "98.765.432/0001-10", email: "logistica@logexpress.com", telefone: "(21) 99876-5432", status: "Ativo" },
  { id: 3, nome: "Cargas Brasil", cnpj: "45.678.901/0001-23", email: "comercial@cargasbr.com", telefone: "(31) 97654-3210", status: "Inativo" },
];

const Transportadoras = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [transportadoras, setTransportadoras] = useState(initialTransportadoras);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTransportadora, setNewTransportadora] = useState({ nome: "", cnpj: "", email: "", telefone: "" });

  const filteredTransportadoras = transportadoras.filter(t => 
    t.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.cnpj.includes(searchTerm)
  );

  const handleCreate = () => {
    if (!newTransportadora.nome || !newTransportadora.cnpj) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }
    setTransportadoras([...transportadoras, { ...newTransportadora, id: transportadoras.length + 1, status: "Ativo" }]);
    setNewTransportadora({ nome: "", cnpj: "", email: "", telefone: "" });
    setDialogOpen(false);
    toast.success("Transportadora cadastrada com sucesso!");
  };

  const handleDelete = (id: number) => {
    setTransportadoras(transportadoras.filter(t => t.id !== id));
    toast.success("Transportadora excluída!");
  };

  return (
    <AppLayout>
      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Transportadoras</h1>
            <p className="text-muted-foreground">Gerencie suas transportadoras</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gradient" className="gap-2">
                <Plus className="w-4 h-4" />
                Criar Transportadora
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Transportadora</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Nome da Empresa *</Label>
                  <Input 
                    placeholder="Nome da transportadora"
                    value={newTransportadora.nome}
                    onChange={(e) => setNewTransportadora({...newTransportadora, nome: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>CNPJ *</Label>
                  <Input 
                    placeholder="00.000.000/0000-00"
                    value={newTransportadora.cnpj}
                    onChange={(e) => setNewTransportadora({...newTransportadora, cnpj: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input 
                    type="email"
                    placeholder="email@empresa.com"
                    value={newTransportadora.email}
                    onChange={(e) => setNewTransportadora({...newTransportadora, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input 
                    placeholder="(00) 00000-0000"
                    value={newTransportadora.telefone}
                    onChange={(e) => setNewTransportadora({...newTransportadora, telefone: e.target.value})}
                  />
                </div>
                <Button onClick={handleCreate} className="w-full" variant="gradient">
                  Cadastrar Transportadora
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
              placeholder="Buscar por nome ou CNPJ..." 
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
                  <th className="text-left py-3 px-4 text-sm font-medium">CNPJ</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">E-mail</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Telefone</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransportadoras.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      Nenhuma transportadora encontrada
                    </td>
                  </tr>
                ) : (
                  filteredTransportadoras.map((transportadora) => (
                    <tr key={transportadora.id} className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors">
                      <td className="py-3 px-4 text-sm font-medium text-foreground">{transportadora.nome}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{transportadora.cnpj}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {transportadora.email}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {transportadora.telefone}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          transportadora.status === "Ativo" ? "bg-cyan/10 text-cyan" : "bg-muted text-muted-foreground"
                        }`}>
                          {transportadora.status}
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
                            onClick={() => handleDelete(transportadora.id)}
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

export default Transportadoras;
