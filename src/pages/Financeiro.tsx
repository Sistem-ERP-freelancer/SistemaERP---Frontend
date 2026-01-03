import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  DollarSign, 
  Plus,
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  Search,
  Eye,
  Edit,
  Trash2,
  FileText,
  Calendar,
  User,
  Building2,
  ShoppingCart,
  Loader2,
  Info,
  Receipt
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AppLayout from "@/components/layout/AppLayout";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { financeiroService, CreateContaFinanceiraDto } from "@/services/financeiro.service";
import { clientesService, Cliente } from "@/services/clientes.service";
import { fornecedoresService, Fornecedor } from "@/services/fornecedores.service";
import { pedidosService } from "@/services/pedidos.service";

// Stats serão calculados dinamicamente com dados da API

const initialTransacoes = [
  { id: "TRX-001", descricao: "Venda - Tech Solutions", tipo: "Receita", categoria: "Vendas", valor: "R$ 8.500,00", data: "05/12/2024", status: "Concluído" },
  { id: "TRX-002", descricao: "Compra de Estoque", tipo: "Despesa", categoria: "Estoque", valor: "R$ 3.200,00", data: "04/12/2024", status: "Pendente" },
  { id: "TRX-003", descricao: "Pagamento Fornecedor", tipo: "Despesa", categoria: "Fornecedores", valor: "R$ 1.800,00", data: "03/12/2024", status: "Concluído" },
  { id: "TRX-004", descricao: "Venda - Comércio ABC", tipo: "Receita", categoria: "Vendas", valor: "R$ 2.200,00", data: "03/12/2024", status: "Concluído" },
];

const Financeiro = () => {
  const [activeTab, setActiveTab] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(15); // Padrão do backend para contas financeiras
  const [transacoes, setTransacoes] = useState(initialTransacoes);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedContaId, setSelectedContaId] = useState<number | null>(null);
  const [newTransacao, setNewTransacao] = useState<CreateContaFinanceiraDto & { 
    data_emissao: string;
  }>({
    tipo: "RECEBER",
    descricao: "",
    valor_original: 0,
    data_emissao: new Date().toISOString().split('T')[0],
    data_vencimento: "",
  });

  const queryClient = useQueryClient();

  // Buscar clientes
  const { data: clientesData } = useQuery({
    queryKey: ["clientes"],
    queryFn: async () => {
      try {
        const response = await clientesService.listar({
          limit: 100,
          status: "ATIVO",
        });
        return Array.isArray(response) ? response : response.data || [];
      } catch (error) {
        console.warn("API de clientes não disponível:", error);
        return [];
      }
    },
    retry: false,
  });

  const clientes: Cliente[] = Array.isArray(clientesData) 
    ? clientesData 
    : clientesData?.data || [];

  // Buscar fornecedores
  const { data: fornecedoresData } = useQuery({
    queryKey: ["fornecedores"],
    queryFn: async () => {
      try {
        const response = await fornecedoresService.listar({
          limit: 100,
          statusFornecedor: "ATIVO",
        });
        return Array.isArray(response) ? response : response.data || [];
      } catch (error) {
        console.warn("API de fornecedores não disponível:", error);
        return [];
      }
    },
    retry: false,
  });

  const fornecedores: Fornecedor[] = Array.isArray(fornecedoresData) 
    ? fornecedoresData 
    : fornecedoresData?.data || [];

  // Buscar pedidos
  const { data: pedidosData } = useQuery({
    queryKey: ["pedidos"],
    queryFn: async () => {
      try {
        const response = await pedidosService.listar({
          page: 1,
          limit: 100,
        });
        return response.data || [];
      } catch (error) {
        console.warn("API de pedidos não disponível:", error);
        return [];
      }
    },
    retry: false,
  });

  const pedidos = pedidosData || [];

  // Buscar dados do dashboard
  const { data: dashboardReceber, isLoading: isLoadingReceber } = useQuery({
    queryKey: ["dashboard-receber"],
    queryFn: () => financeiroService.getDashboardReceber(),
    refetchInterval: 30000, // Atualiza a cada 30 segundos
    retry: false,
  });

  const { data: dashboardPagar, isLoading: isLoadingPagar } = useQuery({
    queryKey: ["dashboard-pagar"],
    queryFn: () => financeiroService.getDashboardPagar(),
    refetchInterval: 30000,
    retry: false,
  });

  // Buscar todas as contas financeiras para calcular estatísticas do dashboard (sem filtros)
  const { data: contasDashboardData } = useQuery({
    queryKey: ["contas-financeiras", "dashboard"],
    queryFn: async () => {
      try {
        const response = await financeiroService.listar({
          page: 1,
          limit: 1000,
        });
        return response.data || [];
      } catch (error) {
        console.warn("API de contas financeiras não disponível:", error);
        return [];
      }
    },
    retry: false,
  });

  // Validar parâmetros de paginação conforme GUIA_PAGINACAO_FRONTEND.md
  const validarParametrosPaginação = (page: number, limit: number): boolean => {
    if (page < 1) {
      console.error('Page deve ser maior ou igual a 1');
      return false;
    }
    if (limit < 1 || limit > 100) {
      console.error('Limit deve estar entre 1 e 100');
      return false;
    }
    return true;
  };

  // Buscar contas financeiras filtradas para exibir na tabela com paginação
  const { data: contasResponse, isLoading: isLoadingContas } = useQuery({
    queryKey: ["contas-financeiras", "tabela", activeTab, currentPage],
    queryFn: async () => {
      // Validar parâmetros antes de fazer a requisição
      if (!validarParametrosPaginação(currentPage, pageSize)) {
        throw new Error('Parâmetros de paginação inválidos');
      }

      try {
        let tipo: string | undefined;
        let status: string | undefined;

        // Determinar filtros baseados na tab ativa
        const statusTabs = ["PENDENTE", "PAGO_PARCIAL", "PAGO_TOTAL", "VENCIDO", "CANCELADO"];
        
        if (activeTab === "Receita") {
          tipo = "RECEBER";
        } else if (activeTab === "Despesa") {
          tipo = "PAGAR";
        } else if (statusTabs.includes(activeTab)) {
          // Se for um status, filtrar apenas por status (sem tipo)
          status = activeTab;
        }

        const response = await financeiroService.listar({
          page: currentPage,
          limit: pageSize,
          tipo,
          status,
        });
        return {
          data: response.data || [],
          total: response.total || 0,
        };
      } catch (error) {
        console.warn("API de contas financeiras não disponível:", error);
        return { data: [], total: 0 };
      }
    },
    retry: (failureCount, error: any) => {
      // Não tentar novamente para erros 400, 401, 403, 404
      if (error?.response) {
        const status = error.response.status;
        if ([400, 401, 403, 404].includes(status)) {
          return false;
        }
      }
      // Tentar até 2 vezes para outros erros
      return failureCount < 2;
    },
    retryDelay: 1000,
  });

  const contas = contasResponse?.data || [];
  const totalContas = contasResponse?.total || 0;
  const totalPages = Math.ceil(totalContas / pageSize);
  const contasDashboard = contasDashboardData || [];

  // Resetar página quando tab ou busca mudar
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm]);

  // Calcular estatísticas
  const stats = useMemo(() => {
    // Receita do mês (contas a receber pagas no mês atual)
    const mesAtual = new Date().getMonth();
    const anoAtual = new Date().getFullYear();
    
    const receitaMes = contasDashboard
      .filter(c => {
        if (c.tipo !== "RECEBER" || !c.data_pagamento) return false;
        const dataPagamento = new Date(c.data_pagamento);
        return dataPagamento.getMonth() === mesAtual && dataPagamento.getFullYear() === anoAtual;
      })
      .reduce((sum, c) => sum + (c.valor_pago || 0), 0);

    // Despesas do mês (contas a pagar pagas no mês atual)
    const despesaMes = contasDashboard
      .filter(c => {
        if (c.tipo !== "PAGAR" || !c.data_pagamento) return false;
        const dataPagamento = new Date(c.data_pagamento);
        return dataPagamento.getMonth() === mesAtual && dataPagamento.getFullYear() === anoAtual;
      })
      .reduce((sum, c) => sum + (c.valor_pago || 0), 0);

    // Saldo atual (receita - despesa)
    const saldoAtual = receitaMes - despesaMes;

    // Contas a receber (total pendente)
    const contasReceberPendentes = contasDashboard.filter(
      c => c.tipo === "RECEBER" && (c.status === "PENDENTE" || c.status === "VENCIDO" || c.status === "PAGO_PARCIAL")
    );
    const totalReceber = dashboardReceber?.total || contasReceberPendentes.reduce((sum, c) => sum + c.valor_restante, 0);
    const countPendentes = contasReceberPendentes.length;

    return [
      { 
        label: "Receita do Mês", 
        value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(receitaMes), 
        icon: TrendingUp, 
        trend: null, 
        trendUp: true, 
        color: "text-cyan", 
        bgColor: "bg-cyan/10" 
      },
      { 
        label: "Despesas do Mês", 
        value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(despesaMes), 
        icon: TrendingDown, 
        trend: null, 
        trendUp: false, 
        color: "text-destructive", 
        bgColor: "bg-destructive/10" 
      },
      { 
        label: "Saldo Atual", 
        value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(saldoAtual), 
        icon: Wallet, 
        trend: null, 
        color: "text-azure", 
        bgColor: "bg-azure/10" 
      },
      { 
        label: "Contas a Receber", 
        value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalReceber), 
        icon: CreditCard, 
        trend: countPendentes > 0 ? `${countPendentes} pendentes` : null, 
        color: "text-royal", 
        bgColor: "bg-royal/10" 
      },
    ];
  }, [contasDashboard, dashboardReceber]);

  // Query para buscar conta financeira por ID
  const { data: contaSelecionada, isLoading: isLoadingConta } = useQuery({
    queryKey: ["conta-financeira", selectedContaId],
    queryFn: async () => {
      if (!selectedContaId) return null;
      return await financeiroService.buscarPorId(selectedContaId);
    },
    enabled: !!selectedContaId && (viewDialogOpen || editDialogOpen),
    retry: false,
  });

  // Mutation para criar conta financeira
  const createContaMutation = useMutation({
    mutationFn: async (data: CreateContaFinanceiraDto) => {
      return await financeiroService.criar(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contas-financeiras"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-receber"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-pagar"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-resumo"] });
      toast.success("Transação registrada com sucesso!");
      setDialogOpen(false);
      setNewTransacao({
        tipo: "RECEBER",
        descricao: "",
        valor_original: 0,
        data_emissao: new Date().toISOString().split('T')[0],
        data_vencimento: "",
      });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Erro ao registrar transação");
    },
  });

  // Mutation para atualizar conta financeira
  const updateContaMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CreateContaFinanceiraDto> }) => {
      return await financeiroService.atualizar(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contas-financeiras"] });
      queryClient.invalidateQueries({ queryKey: ["conta-financeira", selectedContaId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-receber"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-pagar"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-resumo"] });
      toast.success("Conta atualizada com sucesso!");
      setEditDialogOpen(false);
      setSelectedContaId(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Erro ao atualizar conta");
    },
  });

  // Estado para edição
  const [editConta, setEditConta] = useState<CreateContaFinanceiraDto & { data_emissao: string } | null>(null);

  // Quando a conta for carregada, preencher o formulário de edição
  useEffect(() => {
    if (contaSelecionada && editDialogOpen) {
      setEditConta({
        tipo: contaSelecionada.tipo,
        descricao: contaSelecionada.descricao,
        valor_original: contaSelecionada.valor_original,
        data_emissao: contaSelecionada.data_emissao,
        data_vencimento: contaSelecionada.data_vencimento,
        cliente_id: contaSelecionada.cliente_id,
        fornecedor_id: contaSelecionada.fornecedor_id,
        pedido_id: contaSelecionada.pedido_id,
        forma_pagamento: contaSelecionada.forma_pagamento,
        data_pagamento: contaSelecionada.data_pagamento,
        numero_parcela: contaSelecionada.numero_parcela,
        total_parcelas: contaSelecionada.total_parcelas,
        parcela_texto: contaSelecionada.parcela_texto,
        observacoes: contaSelecionada.observacoes,
      });
    }
  }, [contaSelecionada, editDialogOpen]);

  const handleUpdate = () => {
    if (!selectedContaId || !editConta) return;
    
    if (!editConta.descricao || !editConta.valor_original || !editConta.data_vencimento) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    updateContaMutation.mutate({
      id: selectedContaId,
      data: editConta,
    });
  };

  // Função para obter cor do status ativo
  const getActiveTabColor = (tab: string) => {
    switch (tab.toUpperCase()) {
      case "PENDENTE": return "bg-amber-500 text-white";
      case "PAGO_PARCIAL": return "bg-blue-500 text-white";
      case "PAGO_TOTAL": return "bg-green-500 text-white";
      case "VENCIDO": return "bg-red-500 text-white";
      case "CANCELADO": return "bg-slate-600 text-white";
      case "RECEITA": return "bg-primary text-primary-foreground";
      case "DESPESA": return "bg-primary text-primary-foreground";
      default: return "bg-primary text-primary-foreground";
    }
  };

  // Função para obter cor do status inativo
  const getInactiveTabColor = (tab: string) => {
    switch (tab.toUpperCase()) {
      case "PENDENTE": return "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20";
      case "PAGO_PARCIAL": return "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20";
      case "PAGO_TOTAL": return "bg-green-500/10 text-green-500 hover:bg-green-500/20";
      case "VENCIDO": return "bg-red-500/10 text-red-500 hover:bg-red-500/20";
      case "CANCELADO": return "bg-slate-600/10 text-slate-600 hover:bg-slate-600/20";
      case "RECEITA": return "bg-card text-muted-foreground hover:bg-secondary";
      case "DESPESA": return "bg-card text-muted-foreground hover:bg-secondary";
      default: return "bg-card text-muted-foreground hover:bg-secondary";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pendente": return "bg-amber-500/10 text-amber-500";
      case "pago parcial": return "bg-blue-500/10 text-blue-500";
      case "pago total": return "bg-green-500/10 text-green-500";
      case "vencido": return "bg-red-500/10 text-red-500";
      case "cancelado": return "bg-slate-600/10 text-slate-600";
      default: return "bg-muted text-muted-foreground";
    }
  };

  // Mapear contas financeiras para o formato de exibição
  const transacoesDisplay = useMemo(() => {
    return contas.map((conta) => {
      // Buscar nome do cliente ou fornecedor
      let nomeClienteFornecedor = "N/A";
      let categoria = "N/A";
      
      if (conta.tipo === "RECEBER" && conta.cliente_id) {
        const cliente = clientes.find(c => c.id === conta.cliente_id);
        nomeClienteFornecedor = cliente?.nome || "Cliente não encontrado";
        categoria = "Vendas";
      } else if (conta.tipo === "PAGAR" && conta.fornecedor_id) {
        const fornecedor = fornecedores.find(f => f.id === conta.fornecedor_id);
        nomeClienteFornecedor = fornecedor?.nome_fantasia || "Fornecedor não encontrado";
        categoria = "Fornecedores";
      }

      // Formatar valor
      const valorFormatado = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(conta.valor_original || 0);

      // Formatar data
      const dataFormatada = conta.data_vencimento
        ? new Date(conta.data_vencimento).toLocaleDateString('pt-BR')
        : "N/A";

      // Mapear status
      const statusMap: Record<string, string> = {
        "PENDENTE": "Pendente",
        "PAGO_PARCIAL": "Pago Parcial",
        "PAGO_TOTAL": "Pago Total",
        "VENCIDO": "Vencido",
        "CANCELADO": "Cancelado",
      };
      const statusFormatado = statusMap[conta.status] || conta.status;

      // Mapear tipo
      const tipoFormatado = conta.tipo === "RECEBER" ? "Receita" : "Despesa";

      return {
        id: conta.numero_conta || `CONTA-${conta.id}`,
        descricao: conta.descricao,
        tipo: tipoFormatado,
        categoria: categoria,
        valor: valorFormatado,
        data: dataFormatada,
        status: statusFormatado,
        contaId: conta.id, // ID real para usar nos botões
      };
    });
  }, [contas, clientes, fornecedores]);

  // Query para buscar conta por ID quando o termo de busca for numérico
  const isNumericSearch = !isNaN(Number(searchTerm)) && searchTerm.trim() !== "";
  const searchId = isNumericSearch ? Number(searchTerm) : null;

  const { data: contaPorId } = useQuery({
    queryKey: ["conta-financeira", "busca", searchId],
    queryFn: async () => {
      if (!searchId) return null;
      try {
        return await financeiroService.buscarPorId(searchId);
      } catch (error) {
        return null;
      }
    },
    enabled: !!searchId && isNumericSearch,
    retry: false,
  });

  // Filtrar por busca
  const filteredTransacoes = useMemo(() => {
    // Se houver busca numérica e conta encontrada, mostrar apenas essa conta
    if (isNumericSearch && contaPorId) {
      const contaEncontrada = contas.find(c => c.id === contaPorId.id);
      if (contaEncontrada) {
        const conta = contaEncontrada;
        let nomeClienteFornecedor = "N/A";
        let categoria = "N/A";
        
        if (conta.tipo === "RECEBER" && conta.cliente_id) {
          const cliente = clientes.find(c => c.id === conta.cliente_id);
          nomeClienteFornecedor = cliente?.nome || "Cliente não encontrado";
          categoria = "Vendas";
        } else if (conta.tipo === "PAGAR" && conta.fornecedor_id) {
          const fornecedor = fornecedores.find(f => f.id === conta.fornecedor_id);
          nomeClienteFornecedor = fornecedor?.nome_fantasia || "Fornecedor não encontrado";
          categoria = "Fornecedores";
        }

        const valorFormatado = new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(conta.valor_original || 0);

        const dataFormatada = conta.data_vencimento
          ? new Date(conta.data_vencimento).toLocaleDateString('pt-BR')
          : "N/A";

        const statusMap: Record<string, string> = {
          "PENDENTE": "Pendente",
          "PAGO_PARCIAL": "Pago Parcial",
          "PAGO_TOTAL": "Pago Total",
          "VENCIDO": "Vencido",
          "CANCELADO": "Cancelado",
        };
        const statusFormatado = statusMap[conta.status] || conta.status;
        const tipoFormatado = conta.tipo === "RECEBER" ? "Receita" : "Despesa";

        return [{
          id: conta.numero_conta || `CONTA-${conta.id}`,
          descricao: conta.descricao,
          tipo: tipoFormatado,
          categoria: categoria,
          valor: valorFormatado,
          data: dataFormatada,
          status: statusFormatado,
          contaId: conta.id,
        }];
      }
    }

    // Busca normal por texto
    return transacoesDisplay.filter(t => {
      const matchesSearch = 
        t.descricao.toLowerCase().includes(searchTerm.toLowerCase()) || 
        t.id.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [transacoesDisplay, searchTerm, isNumericSearch, contaPorId, contas, clientes, fornecedores]);

  const handleCreate = () => {
    if (!newTransacao.descricao || !newTransacao.valor_original || !newTransacao.data_vencimento) {
      toast.error("Preencha os campos obrigatórios (Descrição, Valor e Data de Vencimento)");
      return;
    }

    const contaData: CreateContaFinanceiraDto = {
      tipo: newTransacao.tipo,
      descricao: newTransacao.descricao,
      valor_original: Number(newTransacao.valor_original),
      data_emissao: newTransacao.data_emissao,
      data_vencimento: newTransacao.data_vencimento,
      cliente_id: newTransacao.cliente_id || undefined,
      fornecedor_id: newTransacao.fornecedor_id || undefined,
      pedido_id: newTransacao.pedido_id || undefined,
      forma_pagamento: newTransacao.forma_pagamento || undefined,
      data_pagamento: newTransacao.data_pagamento || undefined,
      numero_parcela: newTransacao.numero_parcela || undefined,
      total_parcelas: newTransacao.total_parcelas || undefined,
      parcela_texto: newTransacao.parcela_texto || undefined,
      observacoes: newTransacao.observacoes || undefined,
    };

    createContaMutation.mutate(contaData);
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
          <Button 
            variant="gradient" 
            className="gap-2"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="w-4 h-4" />
            Nova Transação
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nova Transação</DialogTitle>
                <DialogDescription>
                  Preencha os campos abaixo para registrar uma nova transação financeira.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 pt-4">
                {/* Informações Básicas */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b pb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-500" />
                    Informações Básicas
                  </h3>
                  <div className="space-y-2">
                    <Label>Descrição *</Label>
                    <Input 
                      placeholder="Ex: Pagamento de venda"
                      value={newTransacao.descricao}
                      onChange={(e) => setNewTransacao({...newTransacao, descricao: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tipo *</Label>
                      <Select
                        value={newTransacao.tipo}
                        onValueChange={(value: "RECEBER" | "PAGAR") => 
                          setNewTransacao({...newTransacao, tipo: value})
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="RECEBER">Receber</SelectItem>
                          <SelectItem value="PAGAR">Pagar</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Valor Original *</Label>
                      <Input 
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={newTransacao.valor_original || ""}
                        onChange={(e) => setNewTransacao({...newTransacao, valor_original: e.target.value ? Number(e.target.value) : 0})}
                      />
                    </div>
                  </div>
                </div>

                {/* Relacionamentos */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b pb-2 flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-blue-500" />
                    Relacionamentos
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Cliente</Label>
                      <Select
                        value={newTransacao.cliente_id?.toString() || undefined}
                        onValueChange={(value) => 
                          setNewTransacao({
                            ...newTransacao, 
                            cliente_id: value && value !== "none" ? Number(value) : undefined
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhum</SelectItem>
                          {clientes.map((cliente) => (
                            <SelectItem key={cliente.id} value={cliente.id.toString()}>
                              {cliente.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Fornecedor</Label>
                      <Select
                        value={newTransacao.fornecedor_id?.toString() || undefined}
                        onValueChange={(value) => 
                          setNewTransacao({
                            ...newTransacao, 
                            fornecedor_id: value && value !== "none" ? Number(value) : undefined
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um fornecedor" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhum</SelectItem>
                          {fornecedores.map((fornecedor) => (
                            <SelectItem key={fornecedor.id} value={fornecedor.id.toString()}>
                              {fornecedor.nome_fantasia}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Pedido</Label>
                      <Select
                        value={newTransacao.pedido_id?.toString() || undefined}
                        onValueChange={(value) => 
                          setNewTransacao({
                            ...newTransacao, 
                            pedido_id: value && value !== "none" ? Number(value) : undefined
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um pedido" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhum</SelectItem>
                          {pedidos.map((pedido) => (
                            <SelectItem key={pedido.id} value={pedido.id.toString()}>
                              {pedido.numero_pedido || `PED-${pedido.id}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Datas */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b pb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    Datas
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Data de Emissão *</Label>
                      <Input 
                        type="date"
                        value={newTransacao.data_emissao}
                        onChange={(e) => setNewTransacao({...newTransacao, data_emissao: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Data de Vencimento *</Label>
                      <Input 
                        type="date"
                        value={newTransacao.data_vencimento}
                        onChange={(e) => setNewTransacao({...newTransacao, data_vencimento: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Data de Pagamento</Label>
                      <Input 
                        type="date"
                        value={newTransacao.data_pagamento || ""}
                        onChange={(e) => setNewTransacao({...newTransacao, data_pagamento: e.target.value || undefined})}
                      />
                    </div>
                  </div>
                </div>

                {/* Pagamento */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b pb-2 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-blue-500" />
                    Pagamento
                  </h3>
                  <div className="space-y-2">
                    <Label>Forma de Pagamento</Label>
                    <Select
                      value={newTransacao.forma_pagamento || undefined}
                      onValueChange={(value) => 
                        setNewTransacao({
                          ...newTransacao, 
                          forma_pagamento: value ? (value as any) : undefined
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a forma de pagamento" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DINHEIRO">Dinheiro</SelectItem>
                        <SelectItem value="PIX">PIX</SelectItem>
                        <SelectItem value="CARTAO_CREDITO">Cartão de Crédito</SelectItem>
                        <SelectItem value="CARTAO_DEBITO">Cartão de Débito</SelectItem>
                        <SelectItem value="BOLETO">Boleto</SelectItem>
                        <SelectItem value="TRANSFERENCIA">Transferência</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Parcelas */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b pb-2 flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-blue-500" />
                    Parcelas
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Número da Parcela</Label>
                      <Input 
                        type="number"
                        placeholder="Ex: 1"
                        value={newTransacao.numero_parcela || ""}
                        onChange={(e) => setNewTransacao({...newTransacao, numero_parcela: e.target.value ? Number(e.target.value) : undefined})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Total de Parcelas</Label>
                      <Input 
                        type="number"
                        placeholder="Ex: 3"
                        value={newTransacao.total_parcelas || ""}
                        onChange={(e) => setNewTransacao({...newTransacao, total_parcelas: e.target.value ? Number(e.target.value) : undefined})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Texto da Parcela</Label>
                      <Input 
                        placeholder="Ex: 1/3"
                        maxLength={20}
                        value={newTransacao.parcela_texto || ""}
                        onChange={(e) => setNewTransacao({...newTransacao, parcela_texto: e.target.value || undefined})}
                      />
                    </div>
                  </div>
                </div>

                {/* Observações */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b pb-2 flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-500" />
                    Observações
                  </h3>
                  <div className="space-y-2">
                    <Label>Observações</Label>
                    <Textarea
                      placeholder="Observações adicionais sobre a transação"
                      value={newTransacao.observacoes || ""}
                      onChange={(e) => setNewTransacao({...newTransacao, observacoes: e.target.value || undefined})}
                      rows={4}
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleCreate} 
                  className="w-full" 
                  variant="gradient"
                  disabled={createContaMutation.isPending}
                >
                  {createContaMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    "Registrar Transação"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {isLoadingReceber || isLoadingPagar ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card rounded-xl p-5 border border-border"
                >
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                </motion.div>
              ))}
            </>
          ) : (
            stats.map((stat, index) => (
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
                    <span className={`text-sm font-medium ${stat.trend.includes("pendentes") ? "text-destructive" : stat.trendUp ? "text-cyan" : "text-destructive"}`}>
                      {stat.trend}
                    </span>
                  )}
                </div>
                <p className="text-2xl font-bold text-foreground mb-1">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))
          )}
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-4">
          {["Todos", "Receita", "Despesa", "PENDENTE", "PAGO_PARCIAL", "PAGO_TOTAL", "VENCIDO", "CANCELADO"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab 
                  ? getActiveTabColor(tab)
                  : getInactiveTabColor(tab)
              }`}
            >
              {tab === "Receita" ? "Receitas" : tab === "Despesa" ? "Despesas" : tab === "PENDENTE" ? "Pendente" : tab === "PAGO_PARCIAL" ? "Pago Parcial" : tab === "PAGO_TOTAL" ? "Pago Total" : tab === "VENCIDO" ? "Vencido" : tab === "CANCELADO" ? "Cancelado" : tab}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-card rounded-xl border border-border p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
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
                  <th className="text-left py-3 px-4 text-sm font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingContas ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Carregando contas...
                      </div>
                    </td>
                  </tr>
                ) : filteredTransacoes.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-muted-foreground">
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
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(transacao.status)}`}>
                          {transacao.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          <button 
                            className="p-2 hover:bg-secondary rounded-lg transition-colors"
                            onClick={() => {
                              setSelectedContaId(transacao.contaId);
                              setViewDialogOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <button 
                            className="p-2 hover:bg-secondary rounded-lg transition-colors"
                            onClick={() => {
                              setSelectedContaId(transacao.contaId);
                              setEditDialogOpen(true);
                            }}
                          >
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
          
          {/* Paginação */}
          {totalPages > 1 && (
            <div className="border-t border-border p-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  
                  {/* Primeira página */}
                  {currentPage > 3 && (
                    <>
                      <PaginationItem>
                        <PaginationLink
                          onClick={() => setCurrentPage(1)}
                          className="cursor-pointer"
                        >
                          1
                        </PaginationLink>
                      </PaginationItem>
                      {currentPage > 4 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}
                    </>
                  )}
                  
                  {/* Páginas ao redor da atual */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          onClick={() => setCurrentPage(pageNum)}
                          isActive={currentPage === pageNum}
                          className="cursor-pointer"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
                  {/* Última página */}
                  {currentPage < totalPages - 2 && (
                    <>
                      {currentPage < totalPages - 3 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}
                      <PaginationItem>
                        <PaginationLink
                          onClick={() => setCurrentPage(totalPages)}
                          className="cursor-pointer"
                        >
                          {totalPages}
                        </PaginationLink>
                      </PaginationItem>
                    </>
                  )}
                  
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
              
              <div className="text-center text-sm text-muted-foreground mt-2">
                Mostrando {contas.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} a {Math.min(currentPage * pageSize, totalContas)} de {totalContas} contas
              </div>
            </div>
          )}
        </motion.div>

        {/* Dialog de Visualização */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                Detalhes da Conta Financeira
              </DialogTitle>
              <DialogDescription>
                Visualize todos os dados da conta financeira
              </DialogDescription>
            </DialogHeader>

            {isLoadingConta ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : contaSelecionada ? (
              <div className="space-y-6 pt-4">
                {/* Informações Básicas */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b pb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-500" />
                    Informações Básicas
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Número da Conta</Label>
                      <p className="text-sm font-medium">{contaSelecionada.numero_conta || `CONTA-${contaSelecionada.id}`}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Tipo</Label>
                      <p className="text-sm font-medium">{contaSelecionada.tipo === "RECEBER" ? "Receber" : "Pagar"}</p>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-muted-foreground">Descrição</Label>
                      <p className="text-sm font-medium">{contaSelecionada.descricao}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Valor Original</Label>
                      <p className="text-sm font-medium">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(contaSelecionada.valor_original)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Valor Pago</Label>
                      <p className="text-sm font-medium">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(contaSelecionada.valor_pago || 0)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Valor Restante</Label>
                      <p className="text-sm font-medium">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(contaSelecionada.valor_restante || 0)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Status</Label>
                      <p className="text-sm font-medium">{contaSelecionada.status}</p>
                    </div>
                  </div>
                </div>

                {/* Relacionamentos */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b pb-2 flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-blue-500" />
                    Relacionamentos
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Cliente</Label>
                      <p className="text-sm font-medium">
                        {contaSelecionada.cliente_id 
                          ? clientes.find(c => c.id === contaSelecionada.cliente_id)?.nome || `ID: ${contaSelecionada.cliente_id}`
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Fornecedor</Label>
                      <p className="text-sm font-medium">
                        {contaSelecionada.fornecedor_id 
                          ? fornecedores.find(f => f.id === contaSelecionada.fornecedor_id)?.nome_fantasia || `ID: ${contaSelecionada.fornecedor_id}`
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Pedido</Label>
                      <p className="text-sm font-medium">
                        {contaSelecionada.pedido_id 
                          ? pedidos.find(p => p.id === contaSelecionada.pedido_id)?.numero_pedido || `ID: ${contaSelecionada.pedido_id}`
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Datas */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b pb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    Datas
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Data de Emissão</Label>
                      <p className="text-sm font-medium">
                        {contaSelecionada.data_emissao 
                          ? new Date(contaSelecionada.data_emissao).toLocaleDateString('pt-BR')
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Data de Vencimento</Label>
                      <p className="text-sm font-medium">
                        {contaSelecionada.data_vencimento 
                          ? new Date(contaSelecionada.data_vencimento).toLocaleDateString('pt-BR')
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Data de Pagamento</Label>
                      <p className="text-sm font-medium">
                        {contaSelecionada.data_pagamento 
                          ? new Date(contaSelecionada.data_pagamento).toLocaleDateString('pt-BR')
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Pagamento */}
                {contaSelecionada.forma_pagamento && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-foreground border-b pb-2 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-blue-500" />
                      Pagamento
                    </h3>
                    <div>
                      <Label className="text-muted-foreground">Forma de Pagamento</Label>
                      <p className="text-sm font-medium">{contaSelecionada.forma_pagamento}</p>
                    </div>
                  </div>
                )}

                {/* Parcelas */}
                {(contaSelecionada.numero_parcela || contaSelecionada.total_parcelas) && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-foreground border-b pb-2 flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-blue-500" />
                      Parcelas
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      {contaSelecionada.numero_parcela && (
                        <div>
                          <Label className="text-muted-foreground">Número da Parcela</Label>
                          <p className="text-sm font-medium">{contaSelecionada.numero_parcela}</p>
                        </div>
                      )}
                      {contaSelecionada.total_parcelas && (
                        <div>
                          <Label className="text-muted-foreground">Total de Parcelas</Label>
                          <p className="text-sm font-medium">{contaSelecionada.total_parcelas}</p>
                        </div>
                      )}
                      {contaSelecionada.parcela_texto && (
                        <div>
                          <Label className="text-muted-foreground">Texto da Parcela</Label>
                          <p className="text-sm font-medium">{contaSelecionada.parcela_texto}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Observações */}
                {contaSelecionada.observacoes && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-foreground border-b pb-2 flex items-center gap-2">
                      <Info className="w-4 h-4 text-blue-500" />
                      Observações
                    </h3>
                    <p className="text-sm text-foreground">{contaSelecionada.observacoes}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                Conta não encontrada
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog de Edição */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-primary" />
                Editar Conta Financeira
              </DialogTitle>
              <DialogDescription>
                Edite os campos desejados da conta financeira
              </DialogDescription>
            </DialogHeader>

            {isLoadingConta ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : editConta ? (
              <div className="space-y-6 pt-4">
                {/* Informações Básicas */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b pb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-500" />
                    Informações Básicas
                  </h3>
                  <div className="space-y-2">
                    <Label>Descrição *</Label>
                    <Input 
                      placeholder="Ex: Pagamento de venda"
                      value={editConta.descricao}
                      onChange={(e) => setEditConta({...editConta, descricao: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tipo *</Label>
                      <Select
                        value={editConta.tipo}
                        onValueChange={(value: "RECEBER" | "PAGAR") => 
                          setEditConta({...editConta, tipo: value})
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="RECEBER">Receber</SelectItem>
                          <SelectItem value="PAGAR">Pagar</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Valor Original *</Label>
                      <Input 
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={editConta.valor_original || ""}
                        onChange={(e) => setEditConta({...editConta, valor_original: e.target.value ? Number(e.target.value) : 0})}
                      />
                    </div>
                  </div>
                </div>

                {/* Relacionamentos */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b pb-2 flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-blue-500" />
                    Relacionamentos
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Cliente</Label>
                      <Select
                        value={editConta.cliente_id?.toString() || undefined}
                        onValueChange={(value) => 
                          setEditConta({
                            ...editConta, 
                            cliente_id: value && value !== "none" ? Number(value) : undefined
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhum</SelectItem>
                          {clientes.map((cliente) => (
                            <SelectItem key={cliente.id} value={cliente.id.toString()}>
                              {cliente.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Fornecedor</Label>
                      <Select
                        value={editConta.fornecedor_id?.toString() || undefined}
                        onValueChange={(value) => 
                          setEditConta({
                            ...editConta, 
                            fornecedor_id: value && value !== "none" ? Number(value) : undefined
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um fornecedor" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhum</SelectItem>
                          {fornecedores.map((fornecedor) => (
                            <SelectItem key={fornecedor.id} value={fornecedor.id.toString()}>
                              {fornecedor.nome_fantasia}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Pedido</Label>
                      <Select
                        value={editConta.pedido_id?.toString() || undefined}
                        onValueChange={(value) => 
                          setEditConta({
                            ...editConta, 
                            pedido_id: value && value !== "none" ? Number(value) : undefined
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um pedido" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhum</SelectItem>
                          {pedidos.map((pedido) => (
                            <SelectItem key={pedido.id} value={pedido.id.toString()}>
                              {pedido.numero_pedido || `PED-${pedido.id}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Datas */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b pb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    Datas
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Data de Emissão *</Label>
                      <Input 
                        type="date"
                        value={editConta.data_emissao}
                        onChange={(e) => setEditConta({...editConta, data_emissao: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Data de Vencimento *</Label>
                      <Input 
                        type="date"
                        value={editConta.data_vencimento}
                        onChange={(e) => setEditConta({...editConta, data_vencimento: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Data de Pagamento</Label>
                      <Input 
                        type="date"
                        value={editConta.data_pagamento || ""}
                        onChange={(e) => setEditConta({...editConta, data_pagamento: e.target.value || undefined})}
                      />
                    </div>
                  </div>
                </div>

                {/* Pagamento */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b pb-2 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-blue-500" />
                    Pagamento
                  </h3>
                  <div className="space-y-2">
                    <Label>Forma de Pagamento</Label>
                    <Select
                      value={editConta.forma_pagamento || undefined}
                      onValueChange={(value) => 
                        setEditConta({
                          ...editConta, 
                          forma_pagamento: value ? (value as any) : undefined
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a forma de pagamento" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DINHEIRO">Dinheiro</SelectItem>
                        <SelectItem value="PIX">PIX</SelectItem>
                        <SelectItem value="CARTAO_CREDITO">Cartão de Crédito</SelectItem>
                        <SelectItem value="CARTAO_DEBITO">Cartão de Débito</SelectItem>
                        <SelectItem value="BOLETO">Boleto</SelectItem>
                        <SelectItem value="TRANSFERENCIA">Transferência</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Parcelas */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b pb-2 flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-blue-500" />
                    Parcelas
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Número da Parcela</Label>
                      <Input 
                        type="number"
                        placeholder="Ex: 1"
                        value={editConta.numero_parcela || ""}
                        onChange={(e) => setEditConta({...editConta, numero_parcela: e.target.value ? Number(e.target.value) : undefined})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Total de Parcelas</Label>
                      <Input 
                        type="number"
                        placeholder="Ex: 3"
                        value={editConta.total_parcelas || ""}
                        onChange={(e) => setEditConta({...editConta, total_parcelas: e.target.value ? Number(e.target.value) : undefined})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Texto da Parcela</Label>
                      <Input 
                        placeholder="Ex: 1/3"
                        maxLength={20}
                        value={editConta.parcela_texto || ""}
                        onChange={(e) => setEditConta({...editConta, parcela_texto: e.target.value || undefined})}
                      />
                    </div>
                  </div>
                </div>

                {/* Observações */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b pb-2 flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-500" />
                    Observações
                  </h3>
                  <div className="space-y-2">
                    <Label>Observações</Label>
                    <Textarea
                      placeholder="Observações adicionais sobre a transação"
                      value={editConta.observacoes || ""}
                      onChange={(e) => setEditConta({...editConta, observacoes: e.target.value || undefined})}
                      rows={4}
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleUpdate} 
                  className="w-full" 
                  variant="gradient"
                  disabled={updateContaMutation.isPending}
                >
                  {updateContaMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Atualizando...
                    </>
                  ) : (
                    "Atualizar Conta"
                  )}
                </Button>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                Carregando dados da conta...
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Financeiro;
















