import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatarStatus } from "@/lib/utils";
import ContasAReceberListaClientes from "@/pages/contas-a-receber/ContasAReceberListaClientes";
import { Cliente, clientesService } from "@/services/clientes.service";
import { ContaFinanceira, CreateContaFinanceiraDto, financeiroService } from "@/services/financeiro.service";
import { pedidosService } from "@/services/pedidos.service";
import type { ContaReceber } from "@/types/contas-financeiras.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
    Calendar,
    Circle,
    CreditCard,
    DollarSign,
    Edit,
    Eye,
    FileText,
    Filter,
    Info,
    Loader2,
    MoreVertical,
    Search,
    ShoppingCart
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const ContasAReceber = () => {
  const [viewMode, setViewMode] = useState<"clientes" | "pedidos">("pedidos");
  /** Guia: card Total a Receber preferir soma da lista de clientes (bate com a tabela). */
  const [totalAReceberFromLista, setTotalAReceberFromLista] = useState<number | null>(null);
  /** Filtro por card clicável: todos | valor_pago | vencidas | vencendo_hoje | vencendo_este_mes */
  const [activeCardFilter, setActiveCardFilter] = useState<"todos" | "valor_pago" | "vencidas" | "vencendo_hoje" | "vencendo_este_mes">("todos");
  const [searchTerm, setSearchTerm] = useState("");
  /** Filtro por cliente: null = todos; number = ID do cliente */
  const [clienteFilterId, setClienteFilterId] = useState<number | null>(null);
  /** Filtro por status do pedido: '' = todos; ABERTO | PARCIAL | QUITADO | VENCIDO */
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [filtrosDialogOpen, setFiltrosDialogOpen] = useState(false);
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
  const navigate = useNavigate();


  const handleTotalAReceberFromLista = useCallback((total: number) => {
    setTotalAReceberFromLista(total);
  }, []);

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

  // Removido: pedidos agora vem de pedidosContasReceber (linha 209)

  // Usar endpoint /pedidos/contas-receber (cada linha = 1 pedido) — filtro por cliente e card é enviado à API / client-side
  const { data: pedidosContasReceber, isLoading: isLoadingPedidosContasReceber } = useQuery({
    queryKey: ["pedidos", "contas-receber", clienteFilterId],
    queryFn: async () => {
      try {
        const params: import('@/types/contas-financeiras.types').FiltrosContasReceber = {};
        if (clienteFilterId != null && clienteFilterId > 0) {
          params.cliente_id = clienteFilterId;
        }
        const hasFilters = params.cliente_id != null && params.cliente_id > 0;
        return await pedidosService.listarContasReceber(hasFilters ? params : undefined);
      } catch (error: any) {
        if (error?.response?.status === 400) {
          console.warn("Backend retornou 400 - tratando como banco vazio:", error);
          return [];
        }
        console.warn("API contas a receber não disponível:", error);
        return [];
      }
    },
    retry: false,
  });

  const pedidos = pedidosContasReceber ?? [];
  
  // Fallback: usar contas-financeiras quando pedidos retornar vazio
  const usarFallbackContasFinanceiras = !isLoadingPedidosContasReceber && pedidos.length === 0;

  // Buscar dados do dashboard de contas a receber
  const { data: dashboardReceber, isLoading: isLoadingReceber } = useQuery({
    queryKey: ["dashboard-receber"],
    queryFn: () => financeiroService.getDashboardReceber(),
    refetchInterval: 30000,
    retry: false,
  });

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

  // Buscar contas a receber filtradas para exibir na tabela com paginação (fallback contas-financeiras)
  const { data: contasResponse, isLoading: isLoadingContas } = useQuery({
    queryKey: ["contas-financeiras", "receber", "tabela", activeCardFilter, currentPage],
    queryFn: async () => {
      if (!validarParametrosPaginação(currentPage, pageSize)) {
        throw new Error('Parâmetros de paginação inválidos');
      }

      try {
        let status: string | undefined;
        let proximidadeVencimento: string | undefined;

        if (activeCardFilter === "vencidas") proximidadeVencimento = "VENCIDA";
        else if (activeCardFilter === "vencendo_hoje") proximidadeVencimento = "VENCE_HOJE";
        else if (activeCardFilter === "valor_pago") status = "PAGO_PARCIAL";
        // todos e vencendo_este_mes: filtro client-side em filteredGruposContas

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

  // Resetar página quando filtro ou busca mudar
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCardFilter, searchTerm, clienteFilterId, statusFilter]);

  const temFiltrosAtivos = (clienteFilterId != null && clienteFilterId > 0) || !!statusFilter;
  const handleAplicarFiltros = () => setFiltrosDialogOpen(false);
  const handleLimparFiltros = () => {
    setClienteFilterId(null);
    setStatusFilter("");
    setFiltrosDialogOpen(false);
  };

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

  // Calcular estatísticas (guia: NUNCA valor_total_receber; SEMPRE valor_total_pendente ou soma clientes)
  const stats = useMemo(() => {
    const parseValor = (valor: any): number => {
      if (valor === null || valor === undefined || valor === '') return 0;
      const num = typeof valor === 'string' ? parseFloat(valor) : Number(valor);
      return isNaN(num) ? 0 : num;
    };

    // Card Total a Receber: preferir soma da lista de clientes (bate com a tabela); senão valor_total_pendente. NUNCA valor_total_receber.
    const totalReceber =
      viewMode === 'clientes' && totalAReceberFromLista !== null
        ? totalAReceberFromLista
        : parseValor(dashboardReceber?.valor_total_pendente) ?? 0;
    const totalVencidas = Number(dashboardReceber?.vencidas) ?? 0;
    const totalVencendoHoje = Number(dashboardReceber?.vencendo_hoje) ?? 0;
    const totalVencendoEsteMes = Number(dashboardReceber?.vencendo_este_mes) ?? 0;
    // Valor Pago: quando temos lista de pedidos (incl. quitados), somar valor_pago de cada um; senão usar dashboard
    const valorPagoFromPedidos =
      !usarFallbackContasFinanceiras && pedidos.length > 0
        ? pedidos.reduce((s, p) => s + (Number((p as ContaReceber).valor_pago) || 0), 0)
        : null;
    const valorPago = valorPagoFromPedidos !== null ? valorPagoFromPedidos : (parseValor(dashboardReceber?.valor_total_recebido) ?? 0);
    const formatarMoedaCard = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

    return [
      { label: "Total a Receber", value: formatarMoedaCard(totalReceber), icon: CreditCard, trend: null, trendUp: true, color: "text-royal", bgColor: "bg-royal/10", filterKey: "todos" as const },
      { label: "Valor Recebido", value: formatarMoedaCard(valorPago), icon: DollarSign, trend: null, trendUp: true, color: "text-green-600", bgColor: "bg-green-100", filterKey: "valor_pago" as const },
      { label: "Vencidas", value: totalVencidas.toString(), icon: Calendar, trend: null, trendUp: false, color: "text-red-600", bgColor: "bg-red-100", filterKey: "vencidas" as const },
      { label: "Vencendo Hoje", value: totalVencendoHoje.toString(), icon: Calendar, trend: null, color: "text-amber-600", bgColor: "bg-amber-100", filterKey: "vencendo_hoje" as const },
      { label: "Vencendo Este Mês", value: totalVencendoEsteMes.toString(), icon: Calendar, trend: null, color: "text-blue-600", bgColor: "bg-blue-100", filterKey: "vencendo_este_mes" as const },
    ];
  }, [dashboardReceber, viewMode, totalAReceberFromLista, usarFallbackContasFinanceiras, pedidos]);

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

  // Query para buscar todas as parcelas do pedido (para contar parcelas pagas)
  const { data: parcelasDoPedido } = useQuery({
    queryKey: ["parcelas-pedido", contaSelecionada?.pedido_id],
    queryFn: async () => {
      if (!contaSelecionada?.pedido_id) return [];
      try {
        const parcelas = await financeiroService.buscarPorPedido(contaSelecionada.pedido_id);
        return Array.isArray(parcelas) ? parcelas : [];
      } catch (error) {
        console.error('Erro ao buscar parcelas do pedido:', error);
        return [];
      }
    },
    enabled: !!contaSelecionada?.pedido_id && viewDialogOpen,
    retry: false,
  });

  // Calcular quantas parcelas foram pagas
  const parcelasPagas = useMemo(() => {
    if (!parcelasDoPedido || parcelasDoPedido.length === 0) return 0;
    return parcelasDoPedido.filter(
      (parcela: any) => parcela.status === 'PAGO_TOTAL' || parcela.status === 'PAGO_PARCIAL'
    ).length;
  }, [parcelasDoPedido]);

  // Função para formatar método de pagamento
  const formatarMetodoPagamento = (metodo?: string): string => {
    if (!metodo) return 'N/A';
    
    const metodos: Record<string, string> = {
      'DINHEIRO': 'Dinheiro',
      'PIX': 'PIX',
      'CARTAO_CREDITO': 'Cartão de Crédito',
      'CARTAO_DEBITO': 'Cartão de Débito',
      'BOLETO': 'Boleto',
      'TRANSFERENCIA': 'Transferência',
      'CHEQUE': 'Cheque',
    };
    
    return metodos[metodo] || metodo;
  };

  // Função para formatar data
  const formatarData = (data?: string): string => {
    if (!data) return 'N/A';
    try {
      return new Date(data).toLocaleDateString('pt-BR');
    } catch {
      return data;
    }
  };

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

  const formatarMoeda = (valor: number | undefined | null) => {
    const n = valor == null || Number.isNaN(Number(valor)) ? 0 : Number(valor);
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
  };

  const formatarDataBR = (data: string) =>
    data ? new Date(data).toLocaleDateString("pt-BR") : "N/A";

  const calcularDiasAteVencimento = (dataVencimento: string | undefined | null): number | null => {
    if (!dataVencimento) return null;
    try {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const vencimento = new Date(dataVencimento);
      vencimento.setHours(0, 0, 0, 0);
      const diffTime = vencimento.getTime() - hoje.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch {
      return null;
    }
  };

  const getVencimentoStatus = (dias: number | null, status: string): { texto: string; cor: string; bgColor: string } => {
    if (status === "QUITADO" || status === "PAGO_TOTAL" || status === "CANCELADO") return { texto: "", cor: "", bgColor: "" };
    if (dias === null) return { texto: "Data inválida", cor: "text-gray-500", bgColor: "bg-gray-100" };
    if (dias < 0) return { texto: "Vencida", cor: "text-red-600", bgColor: "bg-red-100" };
    if (dias === 0) return { texto: "Vence hoje", cor: "text-red-600", bgColor: "bg-red-100" };
    if (dias <= 3) return { texto: `Vence em ${dias} ${dias === 1 ? "dia" : "dias"}`, cor: "text-orange-600", bgColor: "bg-orange-100" };
    if (dias <= 7) return { texto: `Vence em ${dias} dias`, cor: "text-amber-600", bgColor: "bg-amber-100" };
    if (dias <= 30) return { texto: `Vence em ${dias} dias`, cor: "text-blue-600", bgColor: "bg-blue-100" };
    return { texto: `Vence em ${dias} dias`, cor: "text-gray-600", bgColor: "bg-gray-100" };
  };

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s === "pendente") return "bg-amber-500/10 text-amber-500";
    if (s === "em aberto" || s === "aberto") return "bg-blue-500/10 text-blue-500";
    if (s === "pago parcial" || s.includes("parcial")) return "bg-blue-500/10 text-blue-500";
    if (s === "quitado" || s === "concluído" || s === "pago total") return "bg-green-500/10 text-green-500";
    if (s === "vencido") return "bg-red-500/10 text-red-500";
    if (s === "cancelado") return "bg-slate-600/10 text-slate-600";
    return "bg-muted text-muted-foreground";
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

  // Modelo sem parcelas: descrição simples (GUIA_MIGRACAO_SEM_PARCELAS)
  const formatarDescricao = (conta: any): string => conta?.descricao || '';

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
        descricao: formatarDescricao(conta),
        categoria: categoria,
        valor: valorFormatado,
        data: dataFormatada,
        status: statusFormatado,
        statusOriginal: conta.status,
        contaId: conta.id,
        cliente: nomeCliente,
        diasAteVencimento,
        vencimentoStatus,
      };
    });
  }, [contas, clientes]);

  // Query para buscar conta por ID quando o termo de busca for numérico (apenas no fallback de contas financeiras)
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
    enabled: !!searchId && isNumericSearch && usarFallbackContasFinanceiras,
    retry: false,
  });

  // Linhas de pedidos: cada linha = 1 pedido (novo formato)
  const linhasPedidos = useMemo(() => {
    if (!pedidosContasReceber || pedidosContasReceber.length === 0) return [];
    
    let linhasFiltradas = pedidosContasReceber;
    
    // Filtrar por termo de busca
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      linhasFiltradas = pedidosContasReceber.filter((p: ContaReceber) => {
        return (
          p.numero_pedido?.toLowerCase().includes(term) ||
          p.cliente_nome?.toLowerCase().includes(term) ||
          p.pedido_id?.toString().includes(term)
        );
      });
    }
    
    return linhasFiltradas;
  }, [pedidosContasReceber, searchTerm]);

  // Grupos de contas por pedido (fallback)
  type GrupoContas = {
    key: string;
    pedido_id?: number;
    descricaoBase: string;
    parcelas: ContaFinanceira[];
    total_parcelas: number;
    parcelas_pagas: number;
    parcelas_restantes: number;
    valor_aberto: number;
    cliente_nome: string;
    categoria: string;
    primeira_vencimento?: string;
    statusConsolidado: string;
  };

  const gruposContas = useMemo(() => {
    const gruposMap = new Map<string, ContaFinanceira[]>();

    contas.forEach((conta) => {
      const key = conta.pedido_id != null ? `pedido-${conta.pedido_id}` : `avulso-${conta.id}`;
      const list = gruposMap.get(key) || [];
      list.push(conta);
      gruposMap.set(key, list);
    });

    const result: GrupoContas[] = [];
    gruposMap.forEach((parcelas, key) => {
      const primeira = parcelas[0];
      const cliente = clientes.find((c) => c.id === primeira?.cliente_id);
      const total = Math.max(...parcelas.map((p) => p.total_parcelas || 1), parcelas.length);
      const isPaga = (p: ContaFinanceira) =>
        p.status === "PAGO_TOTAL" ||
        (p.valor_restante != null && Number(p.valor_restante) <= 0);
      const pagas = parcelas.filter(isPaga).length;
      const restantes = parcelas.filter(
        (p) => p.status !== "CANCELADO" && !isPaga(p)
      ).length;
      const valorAberto = parcelas.reduce((s, p) => s + (p.valor_restante ?? p.valor_original ?? 0), 0);
      const descricaoBase = primeira?.descricao?.replace(/\s*-\s*\d+\/\d+\s*$/, "").trim() || primeira?.numero_conta || `Conta ${primeira?.id}`;
      const pendentes = parcelas.filter((p) => p.status !== "CANCELADO" && !isPaga(p));
      const primeiraVenc = pendentes
        .sort((a, b) => new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime())[0]
        ?.data_vencimento;

      let statusConsolidado = "Pendente";
      if (pagas === total) statusConsolidado = "Pago Total";
      else if (pagas > 0) statusConsolidado = "Pago Parcial";

      result.push({
        key,
        pedido_id: primeira?.pedido_id,
        descricaoBase,
        parcelas: [...parcelas].sort((a, b) => (a.numero_parcela ?? 1) - (b.numero_parcela ?? 1)),
        total_parcelas: total,
        parcelas_pagas: pagas,
        parcelas_restantes: restantes,
        valor_aberto: valorAberto,
        cliente_nome: cliente?.nome || "—",
        categoria: primeira?.pedido_id ? "Vendas" : "Avulso",
        primeira_vencimento: primeiraVenc,
        statusConsolidado,
      });
    });

    if (!searchTerm.trim()) return result;
    const term = searchTerm.toLowerCase();
    return result.filter(
      (g) =>
        g.descricaoBase.toLowerCase().includes(term) ||
        g.cliente_nome.toLowerCase().includes(term)
    );
  }, [contas, clientes, searchTerm]);

  // Filtrar linhas e grupos pelo card clicado
  const filteredLinhasPedidos = useMemo(() => {
    if (activeCardFilter === "todos") return linhasPedidos;
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const fimDoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    fimDoMes.setHours(23, 59, 59, 999);

    return linhasPedidos.filter((p: ContaReceber) => {
      const dataVenc = p.data_vencimento ? new Date(p.data_vencimento) : new Date(p.data_pedido);
      dataVenc.setHours(0, 0, 0, 0);

      if (activeCardFilter === "vencidas") return dataVenc.getTime() < hoje.getTime();
      if (activeCardFilter === "vencendo_hoje") return dataVenc.getTime() === hoje.getTime();
      if (activeCardFilter === "vencendo_este_mes") return dataVenc >= hoje && dataVenc <= fimDoMes;
      if (activeCardFilter === "valor_pago") return p.status === "PARCIAL" || p.status === "QUITADO";
      if (statusFilter) return p.status === statusFilter;
      return true;
    });
  }, [linhasPedidos, activeCardFilter, statusFilter]);

  const filteredGruposContas = useMemo(() => {
    if (activeCardFilter === "todos") return gruposContas;
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const fimDoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    fimDoMes.setHours(23, 59, 59, 999);

    return gruposContas.filter((g) => {
      if (activeCardFilter === "valor_pago") return g.statusConsolidado === "Pago Parcial" || g.statusConsolidado === "Pago Total";
      if (statusFilter) {
        const match =
          (statusFilter === "ABERTO" && g.statusConsolidado === "Pendente") ||
          (statusFilter === "PARCIAL" && g.statusConsolidado === "Pago Parcial") ||
          (statusFilter === "QUITADO" && g.statusConsolidado === "Pago Total");
        if (!match) return false;
      }
      if (!g.primeira_vencimento && activeCardFilter === "todos") return true;
      if (!g.primeira_vencimento) return false;

      const dataVenc = new Date(g.primeira_vencimento);
      dataVenc.setHours(0, 0, 0, 0);

      if (activeCardFilter === "vencidas") return dataVenc.getTime() < hoje.getTime();
      if (activeCardFilter === "vencendo_hoje") return dataVenc.getTime() === hoje.getTime();
      if (activeCardFilter === "vencendo_este_mes") return dataVenc >= hoje && dataVenc <= fimDoMes;
      return true;
    });
  }, [gruposContas, activeCardFilter, statusFilter]);

  // Transações para exibição: Valor = total da conta; Valor Pago = valor já recebido. Ignora linhas com numero_pedido inválido (ex: "Pedido").
  const transacoesDisplayReceber = useMemo(() => {
    return filteredLinhasPedidos
      .filter((p: ContaReceber) => {
        const num = (p.numero_pedido || "").trim();
        return num.length > 0 && num.toLowerCase() !== "pedido";
      })
      .map((p: ContaReceber) => {
        const diasAteVencimento = calcularDiasAteVencimento(p.data_vencimento ?? p.data_pedido);
        const vencimentoStatus = getVencimentoStatus(diasAteVencimento, p.status);
        const statusFormatado = formatarStatus(p.status);
        return {
          id: p.numero_pedido,
          descricao: `Pedido ${p.numero_pedido}`,
          cliente: p.cliente_nome || "—",
          categoria: "Vendas",
          valor: formatarMoeda(p.valor_total),
          valorPago: formatarMoeda(p.valor_pago ?? 0),
          data: p.data_vencimento ? formatarDataBR(p.data_vencimento) : formatarDataBR(p.data_pedido),
          vencimentoStatus,
          status: statusFormatado,
          pedidoId: p.pedido_id,
        };
      });
  }, [filteredLinhasPedidos]);

  const transacoesDisplayGrupos = useMemo(() => {
    return filteredGruposContas.map((g) => {
      const diasAteVencimento = calcularDiasAteVencimento(g.primeira_vencimento ?? undefined);
      const vencimentoStatus = getVencimentoStatus(diasAteVencimento, g.statusConsolidado === "Pago Total" ? "QUITADO" : "ABERTO");
      const totalGrupo = g.parcelas.reduce((s, p) => s + (p.valor_original ?? 0), 0);
      const valorPagoGrupo = Math.max(0, totalGrupo - g.valor_aberto);
      const primeiraParcela = g.parcelas[0];
      const idExibicao = primeiraParcela?.numero_conta || g.descricaoBase?.split(" ")[0] || g.key;
      return {
        id: idExibicao,
        descricao: g.descricaoBase,
        cliente: g.cliente_nome,
        categoria: g.categoria,
        valor: formatarMoeda(totalGrupo),
        valorPago: formatarMoeda(valorPagoGrupo),
        data: g.primeira_vencimento ? formatarDataBR(g.primeira_vencimento) : "—",
        vencimentoStatus,
        status: g.statusConsolidado,
        pedidoId: g.pedido_id,
        grupoKey: g.key,
      };
    });
  }, [filteredGruposContas]);

  // Filtrar por busca e por card ativo (mantido para fallback contas-financeiras)
  const filteredTransacoes = useMemo(() => {
    let filtered = transacoesDisplay;

    // Filtrar por card ativo (especialmente para Vencidas e Vencendo Hoje)
    if (activeCardFilter === "vencidas") {
      // Filtrar apenas contas vencidas (por status ou por data)
      filtered = filtered.filter(t => {
        const conta = contas.find(c => c.id === t.contaId);
        if (!conta) return false;
        return isContaVencida(conta);
      });
    } else if (activeCardFilter === "vencendo_hoje") {
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
          descricao: formatarDescricao(conta),
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
  }, [transacoesDisplay, searchTerm, isNumericSearch, contaPorId, contas, clientes, activeCardFilter]);

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
            <p className="text-muted-foreground">Gerencie recebimentos por cliente e parcela</p>
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
                            <SelectItem key={pedido.pedido_id} value={pedido.pedido_id.toString()}>
                              {pedido.numero_pedido || `PED-${pedido.pedido_id}`}
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
                        <SelectItem value="CHEQUE">Cheque</SelectItem>
                      </SelectContent>
                    </Select>
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

        {/* Stats Grid - 5 cards na mesma linha, adaptável ao tamanho da tela */}
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-2">
          <div className="grid grid-cols-5 gap-2 sm:gap-4 mb-4 min-w-[520px] sm:min-w-0">
          {isLoadingReceber ? (
            <>
              {[1, 2, 3, 4, 5].map((i) => (
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
                role="button"
                tabIndex={0}
                onClick={() => setActiveCardFilter(stat.filterKey)}
                onKeyDown={(e) => e.key === "Enter" && setActiveCardFilter(stat.filterKey)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-card rounded-xl p-3 sm:p-5 border border-border cursor-pointer hover:shadow-md transition-shadow min-w-0"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div className="flex items-center gap-1">
                    {stat.trend && (
                      <span className={`text-sm font-medium ${stat.trend.includes("pendentes") ? "text-destructive" : stat.trendUp ? "text-cyan" : "text-destructive"}`}>
                        {stat.trend}
                      </span>
                    )}
                    {stat.label === "Total a Receber" && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button type="button" className="rounded-full p-0.5 text-muted-foreground hover:text-foreground focus:outline-none">
                              <Info className="w-4 h-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-[300px]">
                            <p className="font-medium mb-1">Origem do valor</p>
                            <p className="text-xs">
                              {viewMode === 'clientes' && totalAReceberFromLista !== null
                                ? 'Soma da lista de clientes (Total em Aberto de cada linha). Sempre igual à tabela. Nunca usa valor_total_receber.'
                                : 'Fallback: valor_total_pendente de GET /contas-financeiras/dashboard/receber. Nunca valor_total_receber.'}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </div>
                <p className="text-base sm:text-xl lg:text-2xl font-bold text-foreground mb-1 truncate">{stat.value}</p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">{stat.label}</p>
              </motion.div>
            ))
          )}
          </div>
        </div>

        {viewMode === "clientes" ? (
          <ContasAReceberListaClientes onTotalAReceber={handleTotalAReceberFromLista} />
        ) : (
          <>
        {/* Search and Filters (mesmo design da página Fornecedores) */}
        <div className="bg-card rounded-xl border border-border p-4 mb-6">
          <div className="flex gap-4">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setFiltrosDialogOpen(true)}
              style={
                temFiltrosAtivos
                  ? { borderColor: "var(--primary)", borderWidth: "2px" }
                  : {}
              }
            >
              <Filter className="w-4 h-4" />
              Filtros
              {temFiltrosAtivos && (
                <span className="ml-1 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                  {(clienteFilterId != null && clienteFilterId > 0 ? 1 : 0) + (statusFilter ? 1 : 0)}
                </span>
              )}
            </Button>
            <Sheet open={filtrosDialogOpen} onOpenChange={setFiltrosDialogOpen}>
              <SheetContent
                side="right"
                className="w-[400px] sm:w-[540px] overflow-y-auto"
              >
                <SheetHeader className="mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Filter className="w-5 h-5 text-primary" />
                    </div>
                    <SheetTitle className="text-xl">
                      Filtros Avançados
                    </SheetTitle>
                  </div>
                  <SheetDescription>Refine sua busca</SheetDescription>
                </SheetHeader>

                <div className="space-y-6">
                  {/* Cliente */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">Cliente</Label>
                    <Select
                      value={clienteFilterId == null ? "todos" : String(clienteFilterId)}
                      onValueChange={(v) => setClienteFilterId(v === "todos" ? null : parseInt(v, 10))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os clientes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os clientes</SelectItem>
                        {clientes.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  {/* Status */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">Status</Label>
                    <RadioGroup
                      value={statusFilter || "todos"}
                      onValueChange={(v) => setStatusFilter(v === "todos" ? "" : v)}
                      className="space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="todos" id="status-todos" />
                        <Label htmlFor="status-todos" className="flex items-center gap-2 cursor-pointer flex-1">
                          <Circle className="w-3 h-3 text-primary" />
                          <span>Todos</span>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="ABERTO" id="status-aberto" />
                        <Label htmlFor="status-aberto" className="flex items-center gap-2 cursor-pointer flex-1">
                          <Circle className="w-3 h-3 text-amber-500" />
                          <span>Pendente</span>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="PARCIAL" id="status-parcial" />
                        <Label htmlFor="status-parcial" className="flex items-center gap-2 cursor-pointer flex-1">
                          <Circle className="w-3 h-3 text-blue-500" />
                          <span>Aberto</span>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="QUITADO" id="status-quitado" />
                        <Label htmlFor="status-quitado" className="flex items-center gap-2 cursor-pointer flex-1">
                          <Circle className="w-3 h-3 text-green-500" />
                          <span>Quitado</span>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="VENCIDO" id="status-vencido" />
                        <Label htmlFor="status-vencido" className="flex items-center gap-2 cursor-pointer flex-1">
                          <Circle className="w-3 h-3 text-red-500" />
                          <span>Vencido</span>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <Separator />

                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleAplicarFiltros} className="flex-1">
                      Aplicar Filtros
                    </Button>
                    <Button onClick={handleLimparFiltros} variant="outline" className="flex-1">
                      Limpar Filtros
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número do pedido, cliente..."
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
                <TableHead>Cliente</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Valor Pago</TableHead>
                <TableHead>Data Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(isLoadingPedidosContasReceber || (usarFallbackContasFinanceiras && isLoadingContas)) ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Carregando contas a receber...
                    </div>
                  </TableCell>
                </TableRow>
              ) : (clienteFilterId != null && clienteFilterId > 0 && !isLoadingPedidosContasReceber && pedidos.length === 0) ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <DollarSign className="w-12 h-12 text-muted-foreground/50" />
                      <p className="text-muted-foreground">Não há pedidos ou contas desse determinado cliente.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (usarFallbackContasFinanceiras ? transacoesDisplayGrupos : transacoesDisplayReceber).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <DollarSign className="w-12 h-12 text-muted-foreground/50" />
                      <p className="text-muted-foreground">
                        {pedidos.length === 0 && !isLoadingPedidosContasReceber
                          ? "Não há contas a receber no momento"
                          : dashboardReceber?.total === 0
                          ? "Nenhum pedido em aberto"
                          : "Nenhuma conta a receber encontrada"}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : usarFallbackContasFinanceiras ? (
                transacoesDisplayGrupos.map((transacao) => {
                  const grupo = gruposContas.find((g) => g.key === (transacao as any).grupoKey);
                  return (
                    <TableRow key={(transacao as any).grupoKey}>
                      <TableCell>
                        <span className="font-medium">{transacao.id}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">{transacao.cliente}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{transacao.valor}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">{transacao.valorPago}</span>
                      </TableCell>
                      <TableCell>
                        {transacao.status === "Pago Total" || transacao.status === "Cancelado" ? (
                          <span className="text-sm text-muted-foreground">—</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">{transacao.data}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(transacao.status)}`}>
                          {transacao.status}
                        </span>
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
                              setSelectedContaId(grupo?.parcelas[0]?.id ?? null);
                              setViewDialogOpen(true);
                            }}>
                              <Eye className="w-4 h-4 mr-2" />
                              Visualizar
                            </DropdownMenuItem>
                            {grupo?.pedido_id && (grupo?.valor_aberto ?? 0) > 0 && (
                              <DropdownMenuItem onClick={() => navigate(`/financeiro/contas-receber/${grupo.pedido_id}/pagamentos`)}>
                                <DollarSign className="w-4 h-4 mr-2" />
                                Pagamentos
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                transacoesDisplayReceber.map((transacao) => (
                  <TableRow key={String(transacao.pedidoId)}>
                    <TableCell>
                      <span className="font-medium">{transacao.id}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{transacao.cliente}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{transacao.valor}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{transacao.valorPago}</span>
                    </TableCell>
                    <TableCell>
                      {transacao.status === "Quitado" || transacao.status === "Cancelado" ? (
                        <span className="text-sm text-muted-foreground">—</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">{transacao.data}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(transacao.status)}`}>
                        {transacao.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/financeiro/contas-receber/${transacao.pedidoId}`)}>
                            <Eye className="w-4 h-4 mr-2" />
                            Ver detalhes
                          </DropdownMenuItem>
                          {(linhasPedidos.find((p: ContaReceber) => p.numero_pedido === transacao.id)?.valor_em_aberto ?? 0) > 0 && transacao.pedidoId ? (
                            <DropdownMenuItem onClick={() => navigate(`/financeiro/contas-receber/${transacao.pedidoId}/pagamentos`)}>
                              <DollarSign className="w-4 h-4 mr-2" />
                              Pagamentos
                            </DropdownMenuItem>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          {/* Contador */}
          {((!usarFallbackContasFinanceiras && transacoesDisplayReceber.length > 0) ||
            (usarFallbackContasFinanceiras && transacoesDisplayGrupos.length > 0)) && (
            <div className="border-t border-border p-4">
              <div className="text-center text-sm text-muted-foreground">
                {usarFallbackContasFinanceiras
                  ? `${transacoesDisplayGrupos.length} pedido(s)`
                  : `${transacoesDisplayReceber.length} pedido(s)`}
              </div>
            </div>
          )}
        </motion.div>
          </>
        )}

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
                    <p className="text-sm font-medium">{formatarDescricao(contaSelecionada)}</p>
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
                  <div>
                    <Label className="text-muted-foreground">Data de Pagamento</Label>
                    <p className="text-sm font-medium">{formatarData(contaSelecionada.data_pagamento)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Método de Pagamento</Label>
                    <p className="text-sm font-medium">{formatarMetodoPagamento(contaSelecionada.forma_pagamento)}</p>
                  </div>
                  {/* Modelo sem parcelas: não exibir bloco de parcelas */}
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

