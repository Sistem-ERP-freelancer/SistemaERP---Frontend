import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  DollarSign, 
  TrendingUp,
  Wallet,
  CreditCard,
  Search,
  Eye,
  Edit,
  FileText,
  Calendar,
  Building2,
  ShoppingCart,
  Loader2,
  Info,
  Receipt,
  MoreVertical,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { financeiroService, CreateContaFinanceiraDto } from "@/services/financeiro.service";
import { clientesService, Cliente } from "@/services/clientes.service";
import { pedidosService } from "@/services/pedidos.service";

const ContasAReceber = () => {
  const [activeTab, setActiveTab] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(15);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedContaId, setSelectedContaId] = useState<number | null>(null);
  const [editingStatusId, setEditingStatusId] = useState<number | null>(null);
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

  // Buscar pedidos de venda
  const { data: pedidosData } = useQuery({
    queryKey: ["pedidos", "contas-receber"],
    queryFn: async () => {
      try {
        const response = await pedidosService.listar({
          tipo: "VENDA",
          page: 1,
          limit: 1000,
        });
        if (Array.isArray(response)) {
          return response;
        }
        if (response?.data && Array.isArray(response.data)) {
          return response.data;
        }
        if ((response as any)?.pedidos && Array.isArray((response as any).pedidos)) {
          return (response as any).pedidos;
        }
        return [];
      } catch (error) {
        console.warn("API de pedidos não disponível:", error);
        return [];
      }
    },
    retry: false,
  });

  const pedidos = Array.isArray(pedidosData) ? pedidosData : [];

  // Buscar dados do dashboard de contas a receber
  const { data: dashboardReceber, isLoading: isLoadingReceber } = useQuery({
    queryKey: ["dashboard-receber"],
    queryFn: () => financeiroService.getDashboardReceber(),
    refetchInterval: 30000,
    retry: false,
  });

  // Buscar todas as contas a receber para calcular estatísticas
  const { data: contasDashboardData } = useQuery({
    queryKey: ["contas-financeiras", "receber", "dashboard"],
    queryFn: async () => {
      try {
        const response = await financeiroService.listar({
          tipo: "RECEBER",
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

  const contasDashboard = contasDashboardData || [];

  // Validar parâmetros de paginação
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

  // Buscar contas a receber filtradas para exibir na tabela com paginação
  const { data: contasResponse, isLoading: isLoadingContas } = useQuery({
    queryKey: ["contas-financeiras", "receber", "tabela", activeTab, currentPage],
    queryFn: async () => {
      if (!validarParametrosPaginação(currentPage, pageSize)) {
        throw new Error('Parâmetros de paginação inválidos');
      }

      try {
        let status: string | undefined;
        let proximidadeVencimento: string | undefined;

        const statusTabs = ["PENDENTE", "PAGO_PARCIAL", "PAGO_TOTAL", "VENCIDO", "CANCELADO"];
        const proximidadeTabs = ["VENCE_HOJE"];
        
        if (statusTabs.includes(activeTab)) {
          // Se for filtro de vencidas, usar proximidade_vencimento ao invés de status
          // pois contas vencidas podem ter status PENDENTE ou PAGO_PARCIAL
          if (activeTab === "VENCIDO") {
            proximidadeVencimento = "VENCIDA";
          } else {
          status = activeTab;
          }
        } else if (proximidadeTabs.includes(activeTab)) {
          // Filtro por proximidade de vencimento
          proximidadeVencimento = activeTab;
        }

        const response = await financeiroService.listar({
          tipo: "RECEBER",
          page: currentPage,
          limit: pageSize,
          status,
          proximidade_vencimento: proximidadeVencimento,
        });
        
        // Tratar diferentes formatos de resposta
        let contasData = [];
        let totalData = 0;
        
        if (Array.isArray(response)) {
          contasData = response;
          totalData = response.length;
        } else if (response?.data && Array.isArray(response.data)) {
          contasData = response.data;
          totalData = response.total || response.data.length;
        } else if ((response as any)?.contas && Array.isArray((response as any).contas)) {
          contasData = (response as any).contas;
          totalData = (response as any).total || (response as any).contas.length;
        }
        
        console.log('📊 [ContasAReceber] Resposta da API:', { response, contasData, totalData });
        
        return {
          data: contasData,
          total: totalData,
        };
      } catch (error) {
        console.warn("API de contas financeiras não disponível:", error);
        return { data: [], total: 0 };
      }
    },
    retry: (failureCount, error: any) => {
      if (error?.response) {
        const status = error.response.status;
        if ([400, 401, 403, 404].includes(status)) {
          return false;
        }
      }
      return failureCount < 2;
    },
    retryDelay: 1000,
  });

  const contas = contasResponse?.data || [];
  const totalContas = contasResponse?.total || 0;
  const totalPages = Math.ceil(totalContas / pageSize);

  // Resetar página quando tab ou busca mudar
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm]);

  // Função auxiliar para verificar se uma conta está vencida
  const isContaVencida = (conta: any): boolean => {
    if (!conta || conta.tipo !== "RECEBER") return false;
    
    // Se já está paga ou cancelada, não está vencida
    if (conta.status === "PAGO_TOTAL" || conta.status === "CANCELADO") return false;
    
    // Se tem status VENCIDO, está vencida
    if (conta.status === "VENCIDO") return true;
    
    // Verificar pela data de vencimento
    if (!conta.data_vencimento) return false;
    
    try {
      // Usar dias_ate_vencimento do backend se disponível
      if (conta.dias_ate_vencimento !== undefined && conta.dias_ate_vencimento !== null) {
        return conta.dias_ate_vencimento < 0;
      }
      
      // Calcular manualmente se não tiver o campo do backend
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const vencimento = new Date(conta.data_vencimento);
      vencimento.setHours(0, 0, 0, 0);
      return vencimento < hoje;
    } catch {
      return false;
    }
  };

  // Função auxiliar para verificar se uma conta vence hoje
  const isContaVencendoHoje = (conta: any): boolean => {
    if (!conta || conta.tipo !== "RECEBER") return false;
    if (conta.status === "PAGO_TOTAL" || conta.status === "CANCELADO") return false;
    if (!conta.data_vencimento) return false;
    
    try {
      // Usar dias_ate_vencimento do backend se disponível
      if (conta.dias_ate_vencimento !== undefined && conta.dias_ate_vencimento !== null) {
        return conta.dias_ate_vencimento === 0;
      }
      
      // Calcular manualmente
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const vencimento = new Date(conta.data_vencimento);
      vencimento.setHours(0, 0, 0, 0);
      return vencimento.getTime() === hoje.getTime();
    } catch {
      return false;
    }
  };

  // Função auxiliar para verificar se uma conta vence este mês
  const isContaVencendoEsteMes = (conta: any): boolean => {
    if (!conta || conta.tipo !== "RECEBER") return false;
    if (conta.status === "PAGO_TOTAL" || conta.status === "CANCELADO") return false;
    if (!conta.data_vencimento) return false;
    
    try {
      const hoje = new Date();
      const mesAtual = hoje.getMonth();
      const anoAtual = hoje.getFullYear();
      
      const vencimento = new Date(conta.data_vencimento);
      const mesVencimento = vencimento.getMonth();
      const anoVencimento = vencimento.getFullYear();
      
      // Verificar se vence neste mês e ainda não venceu
      if (mesVencimento === mesAtual && anoVencimento === anoAtual) {
        // Usar dias_ate_vencimento do backend se disponível
        if (conta.dias_ate_vencimento !== undefined && conta.dias_ate_vencimento !== null) {
          return conta.dias_ate_vencimento >= 0;
        }
        
        // Calcular manualmente
        hoje.setHours(0, 0, 0, 0);
        vencimento.setHours(0, 0, 0, 0);
        return vencimento >= hoje;
      }
      
      return false;
    } catch {
      return false;
    }
  };

  // Calcular estatísticas
  const stats = useMemo(() => {
    // Função auxiliar para converter valor para número seguro
    const parseValor = (valor: any): number => {
      if (valor === null || valor === undefined || valor === '') return 0;
      const num = typeof valor === 'string' ? parseFloat(valor) : Number(valor);
      return isNaN(num) ? 0 : num;
    };

    // Total de contas a receber (valor restante)
    const contasReceberPendentes = contasDashboard.filter(
      c => c && c.tipo === "RECEBER" && (c.status === "PENDENTE" || c.status === "VENCIDO" || c.status === "PAGO_PARCIAL")
    );
    const totalReceberDashboard = parseValor(dashboardReceber?.total);
    const totalReceberContas = contasReceberPendentes.reduce((sum, c) => {
      const valor = parseValor(c.valor_restante);
      return sum + valor;
    }, 0);
    const totalReceber = totalReceberDashboard > 0 ? totalReceberDashboard : totalReceberContas;

    // Contar contas vencidas (por status ou por data)
    const contasVencidas = contasDashboard.filter(c => isContaVencida(c));
    const totalVencidas = dashboardReceber?.vencidas !== undefined 
      ? dashboardReceber.vencidas 
      : contasVencidas.length;

    // Contar contas vencendo hoje
    const contasVencendoHoje = contasDashboard.filter(c => isContaVencendoHoje(c));
    const totalVencendoHoje = dashboardReceber?.vencendo_hoje !== undefined
      ? dashboardReceber.vencendo_hoje
      : contasVencendoHoje.length;

    // Contar contas vencendo este mês
    const contasVencendoEsteMes = contasDashboard.filter(c => isContaVencendoEsteMes(c));
    const totalVencendoEsteMes = dashboardReceber?.vencendo_este_mes !== undefined
      ? dashboardReceber.vencendo_este_mes
      : contasVencendoEsteMes.length;

    return [
      { 
        label: "Total a Receber", 
        value: Math.round(totalReceber).toLocaleString('pt-BR'), 
        icon: CreditCard, 
        trend: null, 
        trendUp: true, 
        color: "text-royal", 
        bgColor: "bg-royal/10" 
      },
      { 
        label: "Vencidas", 
        value: totalVencidas.toString(), 
        icon: Calendar, 
        trend: null, 
        trendUp: false, 
        color: "text-red-600", 
        bgColor: "bg-red-100" 
      },
      { 
        label: "Vencendo Hoje", 
        value: totalVencendoHoje.toString(), 
        icon: Calendar, 
        trend: null, 
        color: "text-amber-600", 
        bgColor: "bg-amber-100" 
      },
      { 
        label: "Vencendo Este Mês", 
        value: totalVencendoEsteMes.toString(), 
        icon: Calendar, 
        trend: null, 
        color: "text-blue-600", 
        bgColor: "bg-blue-100" 
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
      toast.success("Conta a receber registrada com sucesso!");
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
      toast.error(error?.response?.data?.message || "Erro ao registrar conta a receber");
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
      toast.success("Conta atualizada com sucesso!");
      setEditDialogOpen(false);
      setSelectedContaId(null);
    },
    onError: (error: any) => {
      const errorMessage = 
        error?.response?.data?.message ||
        error?.response?.data?.error?.message ||
        error?.response?.data?.error ||
        (Array.isArray(error?.response?.data?.message) 
          ? error.response.data.message.join(', ') 
          : null) ||
        (error?.response?.status === 500 
          ? "Erro interno do servidor. Verifique os dados e tente novamente." 
          : "Erro ao atualizar conta");
      
      console.error('❌ [ContasAReceber] Erro ao atualizar conta:', {
        error,
        status: error?.response?.status,
        data: error?.response?.data,
        message: errorMessage,
      });
      
      toast.error(errorMessage);
    },
  });

  // Mutation para atualizar apenas o status (edição inline)
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return await financeiroService.atualizar(id, { status: status as any });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contas-financeiras"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-receber"] });
      toast.success("Status atualizado com sucesso!");
      setEditingStatusId(null);
    },
    onError: (error: any) => {
      const errorMessage = 
        error?.response?.data?.message ||
        error?.response?.data?.error?.message ||
        error?.response?.data?.error ||
        (Array.isArray(error?.response?.data?.message) 
          ? error.response.data.message.join(', ') 
          : null) ||
        (error?.response?.status === 500 
          ? "Erro interno do servidor ao atualizar status. Tente novamente." 
          : "Erro ao atualizar status");
      
      console.error('❌ [ContasAReceber] Erro ao atualizar status:', {
        error,
        status: error?.response?.status,
        data: error?.response?.data,
        message: errorMessage,
      });
      
      toast.error(errorMessage);
      setEditingStatusId(null);
    },
  });

  const handleStatusChange = (contaId: number, newStatus: string) => {
    setEditingStatusId(contaId);
    updateStatusMutation.mutate({ id: contaId, status: newStatus });
  };

  // Estado para edição
  const [editConta, setEditConta] = useState<CreateContaFinanceiraDto & { data_emissao: string } | null>(null);

  // Função auxiliar para converter data para formato ISO (YYYY-MM-DD)
  const converterDataParaISO = (data: string | undefined): string => {
    if (!data) return '';
    
    try {
      // Se já está no formato ISO (YYYY-MM-DD), retornar como está
      if (/^\d{4}-\d{2}-\d{2}/.test(data)) {
        return data.split('T')[0].split(' ')[0];
      }
      
      // Se está no formato brasileiro (DD/MM/YYYY), converter
      if (/^\d{2}\/\d{2}\/\d{4}/.test(data)) {
        const [dia, mes, ano] = data.split('/');
        return `${ano}-${mes}-${dia}`;
      }
      
      // Tentar parsear como Date e converter
      const dateObj = new Date(data);
      if (!isNaN(dateObj.getTime())) {
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      
      return '';
    } catch (error) {
      console.error('Erro ao converter data:', error);
      return '';
    }
  };

  // Quando a conta for carregada, preencher o formulário de edição
  useEffect(() => {
    if (contaSelecionada && editDialogOpen) {
      setEditConta({
        tipo: contaSelecionada.tipo,
        descricao: contaSelecionada.descricao,
        valor_original: contaSelecionada.valor_original,
        data_emissao: converterDataParaISO(contaSelecionada.data_emissao),
        data_vencimento: converterDataParaISO(contaSelecionada.data_vencimento),
        cliente_id: contaSelecionada.cliente_id,
        fornecedor_id: contaSelecionada.fornecedor_id,
        pedido_id: contaSelecionada.pedido_id,
        forma_pagamento: contaSelecionada.forma_pagamento,
        data_pagamento: contaSelecionada.data_pagamento ? converterDataParaISO(contaSelecionada.data_pagamento) : undefined,
        numero_parcela: contaSelecionada.numero_parcela,
        total_parcelas: contaSelecionada.total_parcelas,
        parcela_texto: contaSelecionada.parcela_texto,
        observacoes: contaSelecionada.observacoes,
      });
    }
  }, [contaSelecionada, editDialogOpen]);

  const handleUpdate = () => {
    if (!selectedContaId || !editConta) {
      toast.error("Erro: Conta não selecionada");
      return;
    }
    
    // Validar campos obrigatórios
    if (!editConta.descricao || !editConta.descricao.trim()) {
      toast.error("Preencha a descrição");
      return;
    }
    
    if (!editConta.valor_original || editConta.valor_original <= 0) {
      toast.error("Preencha um valor original válido");
      return;
    }
    
    if (!editConta.data_emissao || !editConta.data_emissao.trim()) {
      toast.error("Preencha a data de emissão");
      return;
    }
    
    if (!editConta.data_vencimento || !editConta.data_vencimento.trim()) {
      toast.error("Preencha a data de vencimento");
      return;
    }

    // Validar formato das datas (deve estar em formato ISO YYYY-MM-DD)
    const dataEmissaoRegex = /^\d{4}-\d{2}-\d{2}$/;
    const dataVencimentoRegex = /^\d{4}-\d{2}-\d{2}$/;
    
    if (!dataEmissaoRegex.test(editConta.data_emissao)) {
      toast.error("A data de emissão deve estar no formato ISO (YYYY-MM-DD), por exemplo: 2025-12-01");
      return;
    }
    
    if (!dataVencimentoRegex.test(editConta.data_vencimento)) {
      toast.error("A data de vencimento deve estar no formato ISO (YYYY-MM-DD), por exemplo: 2025-12-01");
      return;
    }

    // Preparar dados para envio - apenas campos definidos
    const dadosAtualizacao: Partial<CreateContaFinanceiraDto> = {};
    
    // Campos obrigatórios sempre enviados
    dadosAtualizacao.descricao = editConta.descricao.trim();
    dadosAtualizacao.valor_original = editConta.valor_original;
    dadosAtualizacao.data_emissao = editConta.data_emissao;
    dadosAtualizacao.data_vencimento = editConta.data_vencimento;
    
    // Campos opcionais - apenas se definidos
    if (editConta.cliente_id !== undefined && editConta.cliente_id !== null) {
      dadosAtualizacao.cliente_id = editConta.cliente_id;
    }
    if (editConta.pedido_id !== undefined && editConta.pedido_id !== null) {
      dadosAtualizacao.pedido_id = editConta.pedido_id;
    }
    if (editConta.forma_pagamento) {
      dadosAtualizacao.forma_pagamento = editConta.forma_pagamento;
    }
    if (editConta.data_pagamento && editConta.data_pagamento.trim()) {
      dadosAtualizacao.data_pagamento = editConta.data_pagamento;
    }
    if (editConta.numero_parcela !== undefined && editConta.numero_parcela !== null) {
      dadosAtualizacao.numero_parcela = editConta.numero_parcela;
    }
    if (editConta.total_parcelas !== undefined && editConta.total_parcelas !== null) {
      dadosAtualizacao.total_parcelas = editConta.total_parcelas;
    }
    if (editConta.parcela_texto && editConta.parcela_texto.trim()) {
      dadosAtualizacao.parcela_texto = editConta.parcela_texto.trim();
    }
    if (editConta.observacoes && editConta.observacoes.trim()) {
      dadosAtualizacao.observacoes = editConta.observacoes.trim();
    }

    console.log('📝 [ContasAReceber] Atualizando conta:', { id: selectedContaId, data: dadosAtualizacao });

    updateContaMutation.mutate({
      id: selectedContaId,
      data: dadosAtualizacao,
    });
  };

  // Função para obter cor do status ativo
  const getActiveTabColor = (tab: string) => {
    switch (tab.toUpperCase()) {
      case "PENDENTE": return "bg-amber-500 text-white";
      case "PAGO_PARCIAL": return "bg-blue-500 text-white";
      case "PAGO_TOTAL": return "bg-green-500 text-white";
      case "VENCIDO": return "bg-red-500 text-white";
      case "VENCE_HOJE": return "bg-orange-500 text-white";
      case "CANCELADO": return "bg-slate-600 text-white";
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
      case "VENCE_HOJE": return "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20";
      case "CANCELADO": return "bg-slate-600/10 text-slate-600 hover:bg-slate-600/20";
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

  // Função para calcular dias até vencimento
  const calcularDiasAteVencimento = (dataVencimento: string): number | null => {
    if (!dataVencimento) return null;
    try {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const vencimento = new Date(dataVencimento);
      vencimento.setHours(0, 0, 0, 0);
      const diffTime = vencimento.getTime() - hoje.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch {
      return null;
    }
  };

  // Função para obter status de vencimento
  const getVencimentoStatus = (dias: number | null, status: string): { texto: string; cor: string; bgColor: string } => {
    if (status === "PAGO_TOTAL" || status === "CANCELADO") {
      return { texto: "", cor: "", bgColor: "" };
    }
    
    if (dias === null) {
      return { texto: "Data inválida", cor: "text-gray-500", bgColor: "bg-gray-100" };
    }
    
    if (dias < 0) {
      return { texto: "Vencida", cor: "text-red-600", bgColor: "bg-red-100" };
    }
    
    if (dias === 0) {
      return { texto: "Vence hoje", cor: "text-red-600", bgColor: "bg-red-100" };
    }
    
    if (dias <= 3) {
      return { texto: `Vence em ${dias} ${dias === 1 ? 'dia' : 'dias'}`, cor: "text-orange-600", bgColor: "bg-orange-100" };
    }
    
    if (dias <= 7) {
      return { texto: `Vence em ${dias} dias`, cor: "text-amber-600", bgColor: "bg-amber-100" };
    }
    
    if (dias <= 30) {
      return { texto: `Vence em ${dias} dias`, cor: "text-blue-600", bgColor: "bg-blue-100" };
    }
    
    return { texto: `Vence em ${dias} dias`, cor: "text-gray-600", bgColor: "bg-gray-100" };
  };

  // Mapear contas financeiras para o formato de exibição
  const transacoesDisplay = useMemo(() => {
    return contas.map((conta) => {
      let nomeCliente = "N/A";
      let categoria = "N/A";
      
      if (conta.tipo === "RECEBER" && conta.cliente_id) {
        const cliente = clientes.find(c => c.id === conta.cliente_id);
        nomeCliente = cliente?.nome || "Cliente não encontrado";
        categoria = "Vendas";
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

      // Usar campos calculados do backend se disponíveis, caso contrário calcular no frontend
      const diasAteVencimento = conta.dias_ate_vencimento !== undefined 
        ? conta.dias_ate_vencimento 
        : calcularDiasAteVencimento(conta.data_vencimento);
      
      // Se o backend forneceu status_vencimento e proximidade_vencimento, usar eles
      let vencimentoStatus: { texto: string; cor: string; bgColor: string };
      
      // Não exibir vencimento se a conta estiver paga ou cancelada
      if (conta.status === "PAGO_TOTAL" || conta.status === "CANCELADO") {
        vencimentoStatus = { texto: "", cor: "", bgColor: "" };
      } else if (conta.status_vencimento && conta.proximidade_vencimento) {
        // Mapear proximidade_vencimento do backend para cores
        const proximidade = conta.proximidade_vencimento;
        let cor = "text-gray-600";
        let bgColor = "bg-gray-100";
        
        if (proximidade === 'VENCIDA' || proximidade === 'VENCE_HOJE') {
          cor = "text-red-600";
          bgColor = "bg-red-100";
        } else if (proximidade === 'CRITICO') {
          cor = "text-orange-600";
          bgColor = "bg-orange-100";
        } else if (proximidade === 'ATENCAO') {
          cor = "text-amber-600";
          bgColor = "bg-amber-100";
        } else if (proximidade === 'NORMAL') {
          cor = "text-blue-600";
          bgColor = "bg-blue-100";
        } else if (proximidade === 'LONGO_PRAZO') {
          cor = "text-gray-600";
          bgColor = "bg-gray-100";
        }
        
        vencimentoStatus = {
          texto: conta.status_vencimento,
          cor,
          bgColor,
        };
      } else {
        // Fallback: calcular no frontend
        vencimentoStatus = getVencimentoStatus(diasAteVencimento, conta.status);
      }

      return {
        id: conta.numero_conta || `CONTA-${conta.id}`,
        descricao: conta.descricao,
        categoria: categoria,
        valor: valorFormatado,
        data: dataFormatada,
        status: statusFormatado,
        contaId: conta.id,
        cliente: nomeCliente,
        diasAteVencimento,
        vencimentoStatus,
      };
    });
  }, [contas, clientes]);

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

  // Filtrar por busca e por tab ativa
  const filteredTransacoes = useMemo(() => {
    let filtered = transacoesDisplay;

    // Filtrar por tab ativa (especialmente para Vencidas e Vencendo Hoje)
    if (activeTab === "VENCIDO") {
      // Filtrar apenas contas vencidas (por status ou por data)
      filtered = filtered.filter(t => {
        const conta = contas.find(c => c.id === t.contaId);
        if (!conta) return false;
        return isContaVencida(conta);
      });
    } else if (activeTab === "VENCE_HOJE") {
      // Filtrar apenas contas vencendo hoje
      filtered = filtered.filter(t => {
        const conta = contas.find(c => c.id === t.contaId);
        if (!conta) return false;
        return isContaVencendoHoje(conta);
      });
    }

    // Busca numérica por ID
    if (isNumericSearch && contaPorId && contaPorId.tipo === "RECEBER") {
      const contaEncontrada = contas.find(c => c.id === contaPorId.id);
      if (contaEncontrada) {
        const conta = contaEncontrada;
        let nomeCliente = "N/A";
        let categoria = "N/A";
        
        if (conta.cliente_id) {
          const cliente = clientes.find(c => c.id === conta.cliente_id);
          nomeCliente = cliente?.nome || "Cliente não encontrado";
          categoria = "Vendas";
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

        const diasAteVencimento = conta.dias_ate_vencimento !== undefined 
          ? conta.dias_ate_vencimento 
          : calcularDiasAteVencimento(conta.data_vencimento);
        
        const vencimentoStatus = getVencimentoStatus(diasAteVencimento, conta.status);

        return [{
          id: conta.numero_conta || `CONTA-${conta.id}`,
          descricao: conta.descricao,
          categoria: categoria,
          valor: valorFormatado,
          data: dataFormatada,
          status: statusFormatado,
          statusOriginal: conta.status,
          contaId: conta.id,
          cliente: nomeCliente,
          diasAteVencimento,
          vencimentoStatus,
        }];
      }
    }

    // Filtrar por termo de busca
    if (searchTerm.trim()) {
      filtered = filtered.filter(t => {
      const matchesSearch = 
        t.descricao.toLowerCase().includes(searchTerm.toLowerCase()) || 
        t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.cliente.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
    }

    return filtered;
  }, [transacoesDisplay, searchTerm, isNumericSearch, contaPorId, contas, clientes, activeTab]);

  // Debug: verificar se as contas estão sendo carregadas (após transacoesDisplay ser definido)
  useEffect(() => {
    console.log('🔍 [ContasAReceber] Contas carregadas:', contas.length, contas);
    console.log('🔍 [ContasAReceber] Total:', totalContas);
    console.log('🔍 [ContasAReceber] Transações display:', transacoesDisplay.length);
  }, [contas, totalContas, transacoesDisplay]);

  const handleCreate = () => {
    if (!newTransacao.descricao || !newTransacao.valor_original || !newTransacao.data_vencimento) {
      toast.error("Preencha os campos obrigatórios (Descrição, Valor e Data de Vencimento)");
      return;
    }

    const contaData: CreateContaFinanceiraDto = {
      tipo: "RECEBER",
      descricao: newTransacao.descricao,
      valor_original: Number(newTransacao.valor_original),
      data_emissao: newTransacao.data_emissao,
      data_vencimento: newTransacao.data_vencimento,
      cliente_id: newTransacao.cliente_id || undefined,
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

  return (
    <AppLayout>
      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Contas a Receber</h1>
            <p className="text-muted-foreground">Gerencie suas contas a receber</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nova Conta a Receber</DialogTitle>
                <DialogDescription>
                  Preencha os campos abaixo para registrar uma nova conta a receber.
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
                      placeholder="Ex: Recebimento de venda"
                      value={newTransacao.descricao}
                      onChange={(e) => setNewTransacao({...newTransacao, descricao: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
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
                  <div className="grid grid-cols-2 gap-4">
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
                      placeholder="Observações adicionais sobre a conta a receber"
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
                    "Registrar Conta a Receber"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {isLoadingReceber ? (
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

        {/* Filters */}
        <div className="bg-card rounded-xl border border-border p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="sm:w-[200px]">
              <Select value={activeTab} onValueChange={setActiveTab}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos os status</SelectItem>
                  <SelectItem value="PENDENTE">Pendente</SelectItem>
                  <SelectItem value="PAGO_PARCIAL">Pago Parcial</SelectItem>
                  <SelectItem value="PAGO_TOTAL">Pago Total</SelectItem>
                  <SelectItem value="VENCE_HOJE">Vencendo Hoje</SelectItem>
                  <SelectItem value="VENCIDO">Vencido</SelectItem>
                  <SelectItem value="CANCELADO">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar conta a receber..." 
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
          className="rounded-md border overflow-hidden"
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Data Vencimento</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingContas ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Carregando contas...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredTransacoes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <DollarSign className="w-12 h-12 text-muted-foreground/50" />
                      <p>Nenhuma conta a receber encontrada</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransacoes.map((transacao) => (
                  <TableRow key={transacao.id}>
                    <TableCell>
                      <span className="font-medium">{transacao.id}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{transacao.descricao}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{transacao.cliente}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{transacao.categoria}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{transacao.valor}</span>
                    </TableCell>
                    <TableCell>
                      {transacao.status === "Pago Total" || transacao.status === "Cancelado" ? (
                        <span className="text-sm text-muted-foreground">--</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">{transacao.data}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {transacao.vencimentoStatus?.texto && (
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${transacao.vencimentoStatus.cor} ${transacao.vencimentoStatus.bgColor}`}>
                          {transacao.vencimentoStatus.texto}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingStatusId === transacao.contaId && updateStatusMutation.isPending ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Atualizando...</span>
                        </div>
                      ) : (
                        <Select
                          value={transacao.statusOriginal || transacao.status}
                          onValueChange={(value) => handleStatusChange(transacao.contaId, value)}
                          disabled={updateStatusMutation.isPending}
                        >
                          <SelectTrigger className="h-7 w-[140px] text-xs border-0 bg-transparent hover:bg-transparent">
                            <SelectValue>
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(transacao.status)}`}>
                                {transacao.status}
                              </span>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PENDENTE">Pendente</SelectItem>
                            <SelectItem value="PAGO_PARCIAL">Pago Parcial</SelectItem>
                            <SelectItem value="PAGO_TOTAL">Pago Total</SelectItem>
                            <SelectItem value="VENCIDO">Vencido</SelectItem>
                            <SelectItem value="CANCELADO">Cancelado</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setSelectedContaId(transacao.contaId);
                            setViewDialogOpen(true);
                          }}>
                            <Eye className="w-4 h-4 mr-2" />
                            Visualizar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedContaId(transacao.contaId);
                            setEditDialogOpen(true);
                          }}>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
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
                Detalhes da Conta a Receber
              </DialogTitle>
            </DialogHeader>

            {isLoadingConta ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : contaSelecionada ? (
              <div className="space-y-6 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Número da Conta</Label>
                    <p className="text-sm font-medium">{contaSelecionada.numero_conta || `CONTA-${contaSelecionada.id}`}</p>
                  </div>
                  <div>
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
                    <Label className="text-muted-foreground">Valor Restante</Label>
                    <p className="text-sm font-medium">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(contaSelecionada.valor_restante || 0)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <p className="text-sm font-medium">{contaSelecionada.status}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Cliente</Label>
                    <p className="text-sm font-medium">
                      {contaSelecionada.cliente_id 
                        ? clientes.find(c => c.id === contaSelecionada.cliente_id)?.nome || `ID: ${contaSelecionada.cliente_id}`
                        : "N/A"}
                    </p>
                  </div>
                </div>
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
                Editar Conta a Receber
              </DialogTitle>
            </DialogHeader>

            {isLoadingConta ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : editConta ? (
              <div className="space-y-6 pt-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Descrição *</Label>
                    <Input 
                      placeholder="Ex: Recebimento de venda"
                      value={editConta.descricao}
                      onChange={(e) => setEditConta({...editConta, descricao: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
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

export default ContasAReceber;

