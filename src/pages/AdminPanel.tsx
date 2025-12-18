import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Plus,
  Search,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  Lock,
  Unlock,
  Power,
  PowerOff,
  Loader2,
  Mail,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AdminLayout from "@/components/layout/AdminLayout";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { tenantsService, Tenant, CreateTenantDto } from "@/services/tenants.service";
import { formatDate } from "@/lib/utils";
import { formatDocument } from "@/lib/validators";
import { DocumentPreview } from "@/components/ui/document-preview";

const AdminPanel = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [cnpjError, setCnpjError] = useState<string>("");
  const [formData, setFormData] = useState<CreateTenantDto>({
    nome: "",
    cnpj: "",
    email: "",
    senha: "",
  });
  const queryClient = useQueryClient();

  // Buscar tenants
  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ['tenants'],
    queryFn: async () => {
      const data = await tenantsService.listar();
      // Log temporário para debug (apenas em desenvolvimento)
      if (import.meta.env.DEV && data.length > 0) {
        console.log('📋 Dados do tenant recebidos:', {
          primeiro_tenant: data[0],
          campos_disponiveis: Object.keys(data[0]),
          created_at: data[0].created_at,
          createdAt: (data[0] as any).createdAt,
          dataCriacao: (data[0] as any).dataCriacao,
        });
      }
      return data;
    },
  });

  // Filtrar tenants
  const filteredTenants = tenants.filter((tenant) =>
    tenant.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.cnpj.includes(searchTerm) ||
    tenant.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreateTenantDto) => tenantsService.criar(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success("Tenant criado com sucesso!");
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      // Log detalhado do erro (apenas em desenvolvimento)
      if (import.meta.env.DEV) {
        console.error('❌ Erro completo:', error);
        console.error('❌ Status:', error?.response?.status);
        console.error('❌ Dados do erro:', error?.response?.data);
      }
      
      // Extrai mensagem de erro de diferentes formatos
      let errorMessage = 
        error?.response?.data?.message || 
        error?.message || 
        "Erro ao criar tenant";
      
      // Tratamento específico para erro 409 (Conflict)
      if (error?.response?.status === 409) {
        // Se a mensagem menciona CNPJ/CPF inválido ou dígitos verificadores
        if (errorMessage.toLowerCase().includes('dígitos verificadores') ||
            errorMessage.toLowerCase().includes('digitos verificadores') ||
            (errorMessage.toLowerCase().includes('inválido') && 
             (errorMessage.toLowerCase().includes('cnpj') || errorMessage.toLowerCase().includes('cpf')))) {
          errorMessage = "O CNPJ/CPF informado é inválido. Verifique se os dígitos estão corretos.";
        } 
        // Se menciona que já existe
        else if (errorMessage.toLowerCase().includes('já existe') || 
                 errorMessage.toLowerCase().includes('already exists') ||
                 errorMessage.toLowerCase().includes('duplicado')) {
          errorMessage = "Este CNPJ/CPF ou email já está cadastrado no sistema.";
        } 
        // Mensagem padrão para 409
        else {
          errorMessage = errorMessage || "Este CNPJ/CPF ou email já está cadastrado no sistema";
        }
      }
      
      toast.error(errorMessage);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateTenantDto> }) =>
      tenantsService.atualizar(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success("Tenant atualizado com sucesso!");
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar tenant");
    },
  });

  const bloquearMutation = useMutation({
    mutationFn: (id: string) => tenantsService.bloquear(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success("Tenant bloqueado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao bloquear tenant");
    },
  });

  const desbloquearMutation = useMutation({
    mutationFn: (id: string) => tenantsService.desbloquear(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success("Tenant desbloqueado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao desbloquear tenant");
    },
  });

  const ativarMutation = useMutation({
    mutationFn: (id: string) => tenantsService.ativar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success("Tenant ativado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao ativar tenant");
    },
  });

  const desativarMutation = useMutation({
    mutationFn: (id: string) => tenantsService.desativar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success("Tenant desativado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao desativar tenant");
    },
  });

  const resetForm = () => {
    setFormData({ nome: "", cnpj: "", email: "", senha: "" });
    setEditingTenant(null);
    setShowPassword(false);
    setCnpjError(""); // Limpa erro ao resetar formulário
  };

  const handleEdit = (tenant: Tenant) => {
    // Remove formatação do CNPJ ao editar (armazena apenas números)
    const cleanedCnpj = tenant.cnpj.replace(/[^\d]/g, '');
    
    // Configura os dados do formulário primeiro
    setFormData({
      nome: tenant.nome,
      cnpj: cleanedCnpj,
      email: tenant.email,
      senha: "",
    });
    
    // Define o tenant sendo editado
    setEditingTenant(tenant);
    
    // Limpa erros
    setCnpjError("");
    
    // Abre o dialog
    setDialogOpen(true);
  };

  const handleCnpjChange = (value: string) => {
    // Remove TODOS os caracteres não numéricos (garante apenas números)
    const cleaned = value.replace(/[^\d]/g, '');
    
    // Limita o tamanho (máximo 14 dígitos para CNPJ)
    const limited = cleaned.slice(0, 14);
    
    // Armazena APENAS números (sem formatação, sem caracteres especiais)
    setFormData({ ...formData, cnpj: limited });
    
    // Limpa erro se o campo estiver vazio
    if (limited.length === 0) {
      setCnpjError("");
      return;
    }
    
    // Validação simplificada: apenas tamanho (11 para CPF, 14 para CNPJ)
    if (limited.length === 11 || limited.length === 14) {
      setCnpjError("");
    } else if (limited.length < 11) {
      setCnpjError("CPF deve ter 11 dígitos");
    } else if (limited.length > 11 && limited.length < 14) {
      setCnpjError("CNPJ deve ter 14 dígitos");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Remove QUALQUER caractere não numérico do CNPJ/CPF (garante apenas números)
    const cleanedCnpj = formData.cnpj.replace(/[^\d]/g, '');
    
    // Validação básica: apenas verifica se tem 11 ou 14 dígitos (backend valida o resto)
    if (cleanedCnpj.length !== 11 && cleanedCnpj.length !== 14) {
      toast.error("CNPJ/CPF deve ter 11 dígitos (CPF) ou 14 dígitos (CNPJ)");
      return;
    }
    
    // Validação de campos obrigatórios
    if (!formData.nome.trim()) {
      toast.error("O nome da empresa é obrigatório");
      return;
    }
    
    if (!formData.email.trim()) {
      toast.error("O email é obrigatório");
      return;
    }
    
    // Prepara dados para envio - GARANTE que CNPJ é apenas números
    const dataToSend: CreateTenantDto = {
      nome: formData.nome.trim(),
      cnpj: cleanedCnpj, // SEMPRE apenas números, sem formatação
      email: formData.email.trim(),
    };
    
    if (editingTenant) {
      // Na edição, só envia senha se foi preenchida
      if (formData.senha && formData.senha.trim() !== '') {
        dataToSend.senha = formData.senha;
      }
      
      // Log para debug (apenas em desenvolvimento)
      if (import.meta.env.DEV) {
        console.log('📤 Dados sendo enviados (edição):', { 
          ...dataToSend, 
          senha: dataToSend.senha ? '***' : 'não enviada',
          cnpj_length: dataToSend.cnpj.length,
          cnpj_is_only_numbers: /^\d+$/.test(dataToSend.cnpj)
        });
      }
      
      updateMutation.mutate({ id: editingTenant.id, data: dataToSend });
    } else {
      // Na criação, senha é obrigatória
      if (!formData.senha || formData.senha.trim() === '') {
        toast.error("A senha é obrigatória para criar um tenant");
        return;
      }
      dataToSend.senha = formData.senha;
      
      // Log para debug (apenas em desenvolvimento)
      if (import.meta.env.DEV) {
        console.log('📤 Dados sendo enviados (criação):', { 
          nome: dataToSend.nome,
          cnpj: dataToSend.cnpj,
          cnpj_length: dataToSend.cnpj.length,
          cnpj_is_only_numbers: /^\d+$/.test(dataToSend.cnpj),
          email: dataToSend.email,
          senha: '***',
        });
      }
      
      createMutation.mutate(dataToSend);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ATIVO: { icon: CheckCircle2, color: "bg-cyan/10 text-cyan", label: "Ativo" },
      INATIVO: { icon: XCircle, color: "bg-muted text-muted-foreground", label: "Inativo" },
      SUSPENSO: { icon: AlertCircle, color: "bg-destructive/10 text-destructive", label: "Suspenso" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.INATIVO;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const stats = [
    {
      label: "Total de Tenants",
      value: tenants.length.toString(),
      icon: Building2,
      color: "text-cyan",
      bgColor: "bg-cyan/10",
    },
    {
      label: "Tenants Ativos",
      value: tenants.filter((t) => t.status === "ATIVO").length.toString(),
      icon: CheckCircle2,
      color: "text-cyan",
      bgColor: "bg-cyan/10",
    },
    {
      label: "Tenants Inativos",
      value: tenants.filter((t) => t.status === "INATIVO").length.toString(),
      icon: XCircle,
      color: "text-muted-foreground",
      bgColor: "bg-muted/10",
    },
    {
      label: "Tenants Suspensos",
      value: tenants.filter((t) => t.status === "SUSPENSO").length.toString(),
      icon: AlertCircle,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg primary-gradient flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Painel Administrativo</h1>
              <p className="text-muted-foreground">Gerencie todos os tenants do sistema</p>
            </div>
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
              </div>
              <p className="text-2xl font-bold text-foreground mb-1">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Search and Create */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, CNPJ ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button 
            variant="gradient" 
            className="gap-2"
            onClick={() => {
              resetForm();
              setDialogOpen(true);
            }}
          >
            <Plus className="w-4 h-4" />
            Criar Tenant
          </Button>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            if (!open) {
              // Fecha o dialog e reseta o formulário
              resetForm();
            }
            setDialogOpen(open);
          }}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingTenant ? "Editar Tenant" : "Novo Tenant"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome da Empresa</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnpj">
                    CNPJ ou CPF
                    {formData.cnpj.length === 11 && (
                      <span className="ml-2 text-xs text-muted-foreground font-normal">(CPF detectado)</span>
                    )}
                    {formData.cnpj.length === 14 && (
                      <span className="ml-2 text-xs text-muted-foreground font-normal">(CNPJ detectado)</span>
                    )}
                  </Label>
                  <div className="relative">
                    <Input
                      id="cnpj"
                      type="text"
                      inputMode="numeric"
                      value={formData.cnpj}
                      onChange={(e) => handleCnpjChange(e.target.value)}
                      placeholder="Digite apenas números (11 para CPF ou 14 para CNPJ)"
                      required
                      maxLength={14}
                      className={cnpjError ? "border-destructive pr-20" : formData.cnpj.length === 11 || formData.cnpj.length === 14 ? "border-green-500 pr-20" : "pr-20"}
                    />
                    {formData.cnpj.length > 0 && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        {formData.cnpj.length} {formData.cnpj.length === 1 ? 'dígito' : 'dígitos'}
                      </span>
                    )}
                  </div>
                  {cnpjError ? (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {cnpjError}
                    </p>
                  ) : formData.cnpj.length > 0 && (formData.cnpj.length === 11 || formData.cnpj.length === 14) ? (
                    <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {formData.cnpj.length === 11 ? "CPF válido ✓" : "CNPJ válido ✓"}
                    </p>
                  ) : null}
                  
                  {/* Preview visual do CPF/CNPJ */}
                  {formData.cnpj.length > 0 && (
                    <div className="mt-3">
                      <DocumentPreview value={formData.cnpj} />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="senha">
                    Senha {editingTenant ? "(opcional)" : "(obrigatória)"}
                  </Label>
                  <div className="relative">
                    <Input
                      id="senha"
                      type={showPassword ? "text" : "password"}
                      value={formData.senha || ""}
                      onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                      placeholder={editingTenant ? "Deixe em branco para manter a senha atual" : "Digite a senha"}
                      required={!editingTenant}
                      className="pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {editingTenant && (
                    <p className="text-xs text-muted-foreground">
                      Preencha apenas se desejar alterar a senha
                    </p>
                  )}
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant="gradient"
                    className="flex-1"
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {createMutation.isPending || updateMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : editingTenant ? (
                      "Atualizar"
                    ) : (
                      "Criar"
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tenants Table */}
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
                  <th className="text-left py-3 px-4 text-sm font-medium">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Criado em</th>
                  <th className="text-right py-3 px-4 text-sm font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                    </td>
                  </tr>
                ) : filteredTenants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      Nenhum tenant encontrado
                    </td>
                  </tr>
                ) : (
                  filteredTenants.map((tenant) => (
                    <tr
                      key={tenant.id}
                      className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors"
                    >
                      <td className="py-3 px-4 text-sm font-medium text-foreground">
                        {tenant.nome}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {formatDocument(tenant.cnpj)}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          {tenant.email}
                        </div>
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(tenant.status)}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {tenant.created_at ? formatDate(tenant.created_at) : "N/A"}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(tenant)}
                            className="h-8 w-8 p-0"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          {tenant.status === "SUSPENSO" ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => desbloquearMutation.mutate(tenant.id)}
                              disabled={desbloquearMutation.isPending}
                              className="h-8 w-8 p-0"
                              title="Desbloquear"
                            >
                              <Unlock className="w-4 h-4 text-cyan" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => bloquearMutation.mutate(tenant.id)}
                              disabled={bloquearMutation.isPending}
                              className="h-8 w-8 p-0"
                              title="Bloquear"
                            >
                              <Lock className="w-4 h-4 text-amber-500" />
                            </Button>
                          )}
                          {tenant.status === "ATIVO" ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => desativarMutation.mutate(tenant.id)}
                              disabled={desativarMutation.isPending}
                              className="h-8 w-8 p-0"
                              title="Desativar"
                            >
                              <PowerOff className="w-4 h-4 text-destructive" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => ativarMutation.mutate(tenant.id)}
                              disabled={ativarMutation.isPending}
                              className="h-8 w-8 p-0"
                              title="Ativar"
                            >
                              <Power className="w-4 h-4 text-cyan" />
                            </Button>
                          )}
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
    </AdminLayout>
  );
};

export default AdminPanel;

