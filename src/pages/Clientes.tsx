import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Users, 
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

const initialClientes = [
  { id: 1, nome: "Tech Solutions Ltda", cpfCnpj: "12.345.678/0001-90", email: "contato@techsol.com", telefone: "(11) 98765-4321", tipo: "PJ", status: "Ativo" },
  { id: 2, nome: "João Silva", cpfCnpj: "123.456.789-00", email: "joao@email.com", telefone: "(21) 99876-5432", tipo: "PF", status: "Ativo" },
  { id: 3, nome: "Comércio ABC", cpfCnpj: "98.765.432/0001-10", email: "vendas@comercioabc.com", telefone: "(31) 97654-3210", tipo: "PJ", status: "Ativo" },
  { id: 4, nome: "Maria Souza", cpfCnpj: "987.654.321-00", email: "maria@email.com", telefone: "(41) 96543-2100", tipo: "PF", status: "Inativo" },
];

const Clientes = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [clientes, setClientes] = useState(initialClientes);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newCliente, setNewCliente] = useState({ nome: "", cpfCnpj: "", email: "", telefone: "", tipo: "PF" });

  const filteredClientes = clientes.filter(c => 
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.cpfCnpj.includes(searchTerm)
  );

  const handleCreate = () => {
    if (!newCliente.nome || !newCliente.cpfCnpj) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }
    setClientes([...clientes, { ...newCliente, id: clientes.length + 1, status: "Ativo" }]);
    setNewCliente({ nome: "", cpfCnpj: "", email: "", telefone: "", tipo: "PF" });
    setDialogOpen(false);
    toast.success("Cliente cadastrado com sucesso!");
  };

  const handleDelete = (id: number) => {
    setClientes(clientes.filter(c => c.id !== id));
    toast.success("Cliente excluído!");
  };

  return (
    <AppLayout>
      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
            <p className="text-muted-foreground">Gerencie seus clientes</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gradient" className="gap-2">
                <Plus className="w-4 h-4" />
                Criar Cliente
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Cliente</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Nome *</Label>
                  <Input 
                    placeholder="Nome do cliente"
                    value={newCliente.nome}
                    onChange={(e) => setNewCliente({...newCliente, nome: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <select 
                      className="w-full h-11 rounded-lg border border-input bg-card px-4"
                      value={newCliente.tipo}
                      onChange={(e) => setNewCliente({...newCliente, tipo: e.target.value})}
                    >
                      <option value="PF">Pessoa Física</option>
                      <option value="PJ">Pessoa Jurídica</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>{newCliente.tipo === "PF" ? "CPF" : "CNPJ"} *</Label>
                    <Input 
                      placeholder={newCliente.tipo === "PF" ? "000.000.000-00" : "00.000.000/0000-00"}
                      value={newCliente.cpfCnpj}
                      onChange={(e) => setNewCliente({...newCliente, cpfCnpj: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input 
                    type="email"
                    placeholder="email@cliente.com"
                    value={newCliente.email}
                    onChange={(e) => setNewCliente({...newCliente, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input 
                    placeholder="(00) 00000-0000"
                    value={newCliente.telefone}
                    onChange={(e) => setNewCliente({...newCliente, telefone: e.target.value})}
                  />
                </div>
                <Button onClick={handleCreate} className="w-full" variant="gradient">
                  Cadastrar Cliente
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
              placeholder="Buscar por nome ou CPF/CNPJ..." 
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
                  <th className="text-left py-3 px-4 text-sm font-medium">CPF/CNPJ</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">E-mail</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Telefone</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Tipo</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredClientes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      Nenhum cliente encontrado
                    </td>
                  </tr>
                ) : (
                  filteredClientes.map((cliente) => (
                    <tr key={cliente.id} className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors">
                      <td className="py-3 px-4 text-sm font-medium text-foreground">{cliente.nome}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{cliente.cpfCnpj}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {cliente.email}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {cliente.telefone}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs px-2 py-1 rounded-full font-medium bg-royal/10 text-royal">
                          {cliente.tipo}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          cliente.status === "Ativo" ? "bg-cyan/10 text-cyan" : "bg-muted text-muted-foreground"
                        }`}>
                          {cliente.status}
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
                            onClick={() => handleDelete(cliente.id)}
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

export default Clientes;
