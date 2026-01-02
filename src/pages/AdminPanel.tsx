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
  AlertCircle,
  Phone,
  Hash
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
import { tenantsService, Tenant, CreateTenantDto, UpdateTenantInfoDto } from "@/services/tenants.service";
import { formatDate } from "@/lib/utils";
import { formatDocument, cleanDocument, formatCNPJ, formatCPF, formatTelefone, cleanTelefone } from "@/lib/validators";

const AdminPanel = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [cnpjError, setCnpjError] = useState<string>("");
  const [formData, setFormData] = useState<CreateTenantDto & { telefone?: string }>({
    nome: "",
    cnpj: "",
    email: "",
    senha: "",
    telefone: "",
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
          data_criacao: (data[0] as any).data_criacao,
        });
      }
      return data;
    },
  });

  // Buscar tenant selecionado para visualização
  const { data: selectedTenant, isLoading: isLoadingTenant } = useQuery({
    queryKey: ['tenant', selectedTenantId],
    queryFn: async () => {
      if (!selectedTenantId) return null;
      return await tenantsService.buscarPorId(selectedTenantId);
    },
    enabled: !!selectedTenantId && viewDialogOpen,
    retry: false,
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
      toast.success("Empresa criada com sucesso!");
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
        "Erro ao criar empresa";
      
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
    mutationFn: ({ id, data }: { id: string; data: UpdateTenantInfoDto }) =>
      tenantsService.atualizar(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success("Empresa atualizada com sucesso!");
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar empresa");
    },
  });

  const bloquearMutation = useMutation({
    mutationFn: (id: string) => tenantsService.bloquear(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success("Empresa bloqueada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao bloquear empresa");
    },
  });

  const desbloquearMutation = useMutation({
    mutationFn: (id: string) => tenantsService.desbloquear(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success("Empresa desbloqueada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao desbloquear empresa");
    },
  });

  const ativarMutation = useMutation({
    mutationFn: (id: string) => tenantsService.ativar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success("Empresa ativada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao ativar empresa");
    },
  });

  const desativarMutation = useMutation({
    mutationFn: (id: string) => tenantsService.desativar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success("Empresa desativada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao desativar empresa");
    },
  });

  const resetForm = () => {
    setFormData({ nome: "", cnpj: "", email: "", senha: "", telefone: "" });
    setEditingTenant(null);
    setShowPassword(false);
    setCnpjError(""); // Limpa erro ao resetar formulário
  };

  const handleView = (tenant: Tenant) => {
    setSelectedTenantId(tenant.id);
    setViewDialogOpen(true);
  };

  const handleEdit = (tenant: Tenant) => {
    // Remove formatação do CNPJ ao editar (armazena apenas números)
    const cleanedCnpj = cleanDocument(tenant.cnpj);
    
    // Formata o CNPJ/CPF para exibição no campo
    let formattedCnpj = cleanedCnpj;
    if (cleanedCnpj.length === 11) {
      formattedCnpj = formatCPF(cleanedCnpj);
    } else if (cleanedCnpj.length === 14) {
      formattedCnpj = formatCNPJ(cleanedCnpj);
    }
    
    // Formata o telefone se existir
    let formattedTelefone = "";
    if (tenant.telefone) {
      formattedTelefone = formatTelefone(tenant.telefone);
    }
    
    // Configura os dados do formulário primeiro
    setFormData({
      nome: tenant.nome,
      cnpj: formattedCnpj,
      email: tenant.email,
      senha: "",
      telefone: formattedTelefone,
    });
    
    // Define o tenant sendo editado
    setEditingTenant(tenant);
    
    // Limpa erros
    setCnpjError("");
    
    // Abre o dialog
    setDialogOpen(true);
  };

  const handleCnpjChange = (value: string) => {
    // Remove TODOS os caracteres não numéricos
    const cleaned = cleanDocument(value);
    
    // Limita o tamanho (máximo 14 dígitos para CNPJ)
    const limited = cleaned.slice(0, 14);
    
    // Formata conforme o tamanho (formatação progressiva enquanto digita)
    let formatted = limited;
    if (limited.length === 11) {
      formatted = formatCPF(limited);
    } else if (limited.length === 14) {
      formatted = formatCNPJ(limited);
    } else if (limited.length > 0) {
      // Formatação progressiva para CPF
      if (limited.length <= 11) {
        formatted = limited
          .replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4")
          .replace(/^(\d{3})(\d{3})(\d{3})$/, "$1.$2.$3")
          .replace(/^(\d{3})(\d{3})$/, "$1.$2")
          .replace(/^(\d{3})$/, "$1");
      } else {
        // Formatação progressiva para CNPJ
        formatted = limited
          .replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")
          .replace(/^(\d{2})(\d{3})(\d{3})(\d{4})$/, "$1.$2.$3/$4")
          .replace(/^(\d{2})(\d{3})(\d{3})$/, "$1.$2.$3")
          .replace(/^(\d{2})(\d{3})$/, "$1.$2")
          .replace(/^(\d{2})$/, "$1");
      }
    }
    
    // Armazena o valor formatado no estado (para exibição)
    setFormData({ ...formData, cnpj: formatted });
    
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
    const dataToSend: CreateTenantDto & { telefone?: string } = {
      nome: formData.nome.trim(),
      cnpj: cleanedCnpj, // SEMPRE apenas números, sem formatação
      email: formData.email.trim(),
    };
    
    // Adiciona telefone se foi preenchido (remove formatação antes de enviar)
    if (formData.telefone && formData.telefone.trim() !== '') {
      dataToSend.telefone = cleanTelefone(formData.telefone);
    }
    
    if (editingTenant) {
      // Na edição, prepara dados com telefone (se preenchido)
      const updateData: UpdateTenantInfoDto = {
        nome: dataToSend.nome,
        cnpj: dataToSend.cnpj,
        email: dataToSend.email,
      };
      
      // Adiciona telefone se foi preenchido
      if (dataToSend.telefone) {
        updateData.telefone = dataToSend.telefone;
      }
      
      // Na edição, só envia senha se foi preenchida (usando Partial<CreateTenantDto> para senha)
      if (formData.senha && formData.senha.trim() !== '') {
        (updateData as any).senha = formData.senha;
      }
      
      // Log para debug (apenas em desenvolvimento)
      if (import.meta.env.DEV) {
        console.log('📤 Dados sendo enviados (edição):', { 
          ...updateData, 
          senha: (updateData as any).senha ? '***' : 'não enviada',
          telefone: updateData.telefone || 'não enviado',
          cnpj_length: updateData.cnpj.length,
          cnpj_is_only_numbers: /^\d+$/.test(updateData.cnpj)
        });
      }
      
      updateMutation.mutate({ id: editingTenant.id, data: updateData });
    } else {
      // Na criação, senha é obrigatória
      if (!formData.senha || formData.senha.trim() === '') {
        toast.error("A senha é obrigatória para criar uma empresa");
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
          telefone: dataToSend.telefone || 'não enviado',
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
      label: "Total de Empresas",
      value: tenants.length.toString(),
      icon: Building2,
      color: "text-cyan",
      bgColor: "bg-cyan/10",
    },
    {
      label: "Empresas Ativas",
      value: tenants.filter((t) => t.status === "ATIVO").length.toString(),
      icon: CheckCircle2,
      color: "text-cyan",
      bgColor: "bg-cyan/10",
    },
    {
      label: "Empresas Inativas",
      value: tenants.filter((t) => t.status === "INATIVO").length.toString(),
      icon: XCircle,
      color: "text-muted-foreground",
      bgColor: "bg-muted/10",
    },
    {
      label: "Empresas Suspensas",
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
              <p className="text-muted-foreground">Gerencie todas as empresas do sistema</p>
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
            Criar Empresa
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
                  {editingTenant ? "Editar Empresa" : "Nova Empresa"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome da Empresa</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Digite o nome da empresa"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnpj">
                    CNPJ ou CPF
                    {cleanDocument(formData.cnpj).length === 11 && (
                      <span className="ml-2 text-xs text-muted-foreground font-normal">(CPF detectado)</span>
                    )}
                    {cleanDocument(formData.cnpj).length === 14 && (
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
                      placeholder="Digite o CNPJ ou CPF"
                      required
                      maxLength={18}
                      className={cnpjError ? "border-destructive pr-20" : cleanDocument(formData.cnpj).length === 11 || cleanDocument(formData.cnpj).length === 14 ? "border-green-500 pr-20" : "pr-20"}
                    />
                    {formData.cnpj.length > 0 && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        {cleanDocument(formData.cnpj).length} {cleanDocument(formData.cnpj).length === 1 ? 'dígito' : 'dígitos'}
                      </span>
                    )}
                  </div>
                  {cnpjError ? (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {cnpjError}
                    </p>
                  ) : formData.cnpj.length > 0 && (cleanDocument(formData.cnpj).length === 11 || cleanDocument(formData.cnpj).length === 14) ? (
                    <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {cleanDocument(formData.cnpj).length === 11 ? "CPF válido ✓" : "CNPJ válido ✓"}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="empresa@exemplo.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone" className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    Telefone
                  </Label>
                  <Input
                    id="telefone"
                    type="text"
                    inputMode="tel"
                    value={formData.telefone || ""}
                    onChange={(e) => {
                      const formatted = formatTelefone(e.target.value);
                      setFormData({ ...formData, telefone: formatted });
                    }}
                    placeholder="(00) 00000-0000"
                    maxLength={15}
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

        {/* Tabela de Empresas */}
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
                      Nenhuma empresa encontrada
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
                        {(() => {
                          const dataCriacao = tenant.created_at || 
                                             (tenant as any).createdAt || 
                                             (tenant as any).dataCriacao || 
                                             (tenant as any).data_criacao;
                          return dataCriacao ? formatDate(dataCriacao) : "N/A";
                        })()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(tenant)}
                            className="h-8 w-8 p-0"
                            title="Visualizar"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
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

        {/* Dialog de Visualização */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes da Empresa</DialogTitle>
            </DialogHeader>
            {isLoadingTenant ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : selectedTenant ? (
              <div className="space-y-6 pt-4">
                {/* Informações Básicas */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Informações Básicas
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Nome da Empresa</Label>
                      <p className="text-sm font-medium">{selectedTenant.nome}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground flex items-center gap-2">
                        <Hash className="w-3 h-3" />
                        CNPJ/CPF
                      </Label>
                      <p className="text-sm font-medium">{formatDocument(selectedTenant.cnpj)}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground flex items-center gap-2">
                        <Mail className="w-3 h-3" />
                        Email
                      </Label>
                      <p className="text-sm font-medium">{selectedTenant.email}</p>
                    </div>
                    {selectedTenant.telefone && (
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground flex items-center gap-2">
                          <Phone className="w-3 h-3" />
                          Telefone
                        </Label>
                        <p className="text-sm font-medium">{selectedTenant.telefone}</p>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Status</Label>
                      <div>{getStatusBadge(selectedTenant.status)}</div>
                    </div>
                    {selectedTenant.codigo && (
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Código</Label>
                        <p className="text-sm font-medium">{selectedTenant.codigo}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Informações Adicionais */}
                {(selectedTenant.subdominio || selectedTenant.schema_name || selectedTenant.data_expiracao) && (
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-primary" />
                      Informações Adicionais
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedTenant.subdominio && (
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Subdomínio</Label>
                          <p className="text-sm font-medium">{selectedTenant.subdominio}</p>
                        </div>
                      )}
                      {selectedTenant.schema_name && (
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Schema</Label>
                          <p className="text-sm font-medium">{selectedTenant.schema_name}</p>
                        </div>
                      )}
                      {selectedTenant.data_expiracao && (
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Data de Expiração</Label>
                          <p className="text-sm font-medium">{formatDate(selectedTenant.data_expiracao)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Datas do Sistema */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Informações do Sistema
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(() => {
                      const dataCriacao = selectedTenant.created_at || 
                                         (selectedTenant as any).createdAt || 
                                         (selectedTenant as any).dataCriacao || 
                                         (selectedTenant as any).data_criacao;
                      return dataCriacao ? (
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Criado em</Label>
                          <p className="text-sm font-medium">{formatDate(dataCriacao)}</p>
                        </div>
                      ) : null;
                    })()}
                    {(() => {
                      const dataAtualizacao = selectedTenant.updated_at || 
                                             (selectedTenant as any).updatedAt || 
                                             (selectedTenant as any).data_atualizacao;
                      return dataAtualizacao ? (
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Atualizado em</Label>
                          <p className="text-sm font-medium">{formatDate(dataAtualizacao)}</p>
                        </div>
                      ) : null;
                    })()}
                  </div>
                </div>

                {/* Configurações */}
                {selectedTenant.configuracoes && Object.keys(selectedTenant.configuracoes).length > 0 && (
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      Configurações
                    </h3>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <pre className="text-xs overflow-x-auto">
                        {JSON.stringify(selectedTenant.configuracoes, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Botão de Fechar */}
                <div className="flex justify-end pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setViewDialogOpen(false);
                      setSelectedTenantId(null);
                    }}
                  >
                    Fechar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                Empresa não encontrada
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminPanel;

