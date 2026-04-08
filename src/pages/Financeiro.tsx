import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
    DropdownMenuLabel,
    DropdownMenuSeparator,
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
import { cn, formatDate } from "@/lib/utils";
import { Cliente, clientesService } from "@/services/clientes.service";
import { CreateContaFinanceiraDto, financeiroService, ResumoFinanceiro } from "@/services/financeiro.service";
import { relatoriosClienteService } from "@/services/relatorios-cliente.service";
import { Fornecedor, fornecedoresService } from "@/services/fornecedores.service";
import { pedidosService } from "@/services/pedidos.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
    BarChart3,
    Calendar,
    Download,
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
    Plus,
    Printer,
    RotateCcw,
    Search,
    ShoppingCart,
    Trash2,
    TrendingDown,
    TrendingUp,
    Wallet
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const Financeiro = () => {
  const [activeTab, setActiveTab] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");
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

  const [page, setPage] = useState(1);
  const limit = 15;
  const [clienteFilterId, setClienteFilterId] = useState<number | undefined>();
  const [fornecedorFilterId, setFornecedorFilterId] = useState<number | undefined>();
  const [dataInicialFilter, setDataInicialFilter] = useState<string>("");
  const [dataFinalFilter, setDataFinalFilter] = useState<string>("");
  const [filtrosDialogOpen, setFiltrosDialogOpen] = useState(false);
  const [relatorioClientePdfOpen, setRelatorioClientePdfOpen] = useState(false);
  const [relatorioClienteIdSelect, setRelatorioClienteIdSelect] = useState<string>("");
  const [relatorioClientePdfLoading, setRelatorioClientePdfLoading] = useState(false);
  const [relatorioDataInicial, setRelatorioDataInicial] = useState("");
  const [relatorioDataFinal, setRelatorioDataFinal] = useState("");
  const [relatorioStatusFiltro, setRelatorioStatusFiltro] = useState<string>("Todos");
  /** Filtro por card clicável: Receita do Mês / Despesas do Mês (como em Contas a Receber) */
  const [cardTipoFilter, setCardTipoFilter] = useState<"todos" | "RECEBER" | "PAGAR">("todos");

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

  // Parâmetros de filtro para dashboard (tipo vem dos cards clicáveis; demais do painel)
  const dashboardFiltros = useMemo(() => {
    const f: { data_inicial?: string; data_final?: string; tipo?: string; cliente_id?: number; fornecedor_id?: number } = {};
    if (dataInicialFilter) f.data_inicial = dataInicialFilter;
    if (dataFinalFilter) f.data_final = dataFinalFilter;
    if (cardTipoFilter !== "todos") f.tipo = cardTipoFilter;
    if (clienteFilterId != null) f.cliente_id = clienteFilterId;
    if (fornecedorFilterId != null) f.fornecedor_id = fornecedorFilterId;
    return Object.keys(f).length ? f : undefined;
  }, [dataInicialFilter, dataFinalFilter, cardTipoFilter, clienteFilterId, fornecedorFilterId]);

  const relatorioClienteIdParsed = useMemo(() => {
    if (!relatorioClienteIdSelect) return null;
    const n = parseInt(relatorioClienteIdSelect, 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [relatorioClienteIdSelect]);

  const relatorioPreviewParams = useMemo(
    () => ({
      page: 1,
      limit: 1,
      cliente_id: relatorioClienteIdParsed ?? undefined,
      data_inicial: relatorioDataInicial || undefined,
      data_final: relatorioDataFinal || undefined,
      status:
        relatorioStatusFiltro !== "Todos"
          ? relatorioStatusFiltro
          : undefined,
    }),
    [
      relatorioClienteIdParsed,
      relatorioDataInicial,
      relatorioDataFinal,
      relatorioStatusFiltro,
    ],
  );

  const {
    data: relatorioPreviewData,
    isFetching: relatorioPreviewFetching,
    isError: relatorioPreviewError,
  } = useQuery({
    queryKey: ["relatorio-financeiro-preview", relatorioPreviewParams],
    queryFn: () => financeiroService.listarAgrupado(relatorioPreviewParams),
    enabled:
      relatorioClientePdfOpen && relatorioClienteIdParsed != null,
  });

  const relatorioTemDados =
    !relatorioPreviewError &&
    relatorioPreviewData != null &&
    relatorioPreviewData.total > 0;

  /** Mensagem quando o preview não encontra contas (PDF/impressão desabilitados). */
  const relatorioMensagemSemDados = useMemo(() => {
    if (relatorioStatusFiltro !== "Todos") {
      return "O cliente não possui dívida naquele status selecionado.";
    }
    return "O cliente não possui dívida naquele período.";
  }, [relatorioStatusFiltro]);

  const relatorioFiltrosForPdf = useMemo(
    () => ({
      dataInicial: relatorioDataInicial || undefined,
      dataFinal: relatorioDataFinal || undefined,
      status:
        relatorioStatusFiltro !== "Todos"
          ? relatorioStatusFiltro
          : undefined,
    }),
    [relatorioDataInicial, relatorioDataFinal, relatorioStatusFiltro],
  );

  // GET /financeiro/dashboard (unificado) com fallback para GET /contas-financeiras/dashboard/resumo
  const { data: dashboardUnificado } = useQuery({
    queryKey: ["dashboard-unificado-financeiro", dashboardFiltros],
    queryFn: () => financeiroService.getDashboardUnificado(dashboardFiltros),
    refetchInterval: 30000,
    retry: false,
  });

  const { data: resumoFinanceiro, isLoading: isLoadingResumo } = useQuery<ResumoFinanceiro>({
    queryKey: ["dashboard-resumo-financeiro", dashboardFiltros],
    queryFn: () => financeiroService.getDashboardResumo(dashboardFiltros),
    refetchInterval: 30000,
    staleTime: 0,
    retry: false,
    enabled: !dashboardUnificado,
  });

  const resumoParaStats = dashboardUnificado ?? resumoFinanceiro;
  const contasReceberStats = dashboardUnificado?.contas_receber ?? resumoFinanceiro?.contas_receber;
  const contasPagarStats = dashboardUnificado?.contas_pagar ?? resumoFinanceiro?.contas_pagar;

  // Buscar pedidos apenas para uso na UI (seleção de pedidos em formulários)
  // NÃO usado para cálculos financeiros - os valores vêm do resumoFinanceiro
  const { data: pedidosData } = useQuery({
    queryKey: ["pedidos", "financeiro"],
    queryFn: async () => {
      try {
        const response = await pedidosService.listar({
          page: 1,
          limit: 1000,
        });
        // Tratar diferentes formatos de resposta
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

  const temFiltrosAtivos =
    cardTipoFilter !== "todos" ||
    clienteFilterId != null ||
    fornecedorFilterId != null ||
    !!dataInicialFilter ||
    !!dataFinalFilter ||
    (activeTab !== "Todos");
  const handleAplicarFiltros = () => setFiltrosDialogOpen(false);
  const handleLimparFiltros = () => {
    setCardTipoFilter("todos");
    setClienteFilterId(undefined);
    setFornecedorFilterId(undefined);
    setDataInicialFilter("");
    setDataFinalFilter("");
    setActiveTab("Todos");
    setPage(1);
    setFiltrosDialogOpen(false);
  };

  // Buscar contas agrupadas (uma linha por cliente/pedido) - visão resumida
  const { data: contasAgrupadasResponse, isLoading: isLoadingContas } = useQuery({
    queryKey: ["contas-financeiras", "agrupado", activeTab, cardTipoFilter, page, limit, clienteFilterId, fornecedorFilterId, dataInicialFilter, dataFinalFilter],
    queryFn: async () => {
      try {
        const tipo = cardTipoFilter !== "todos" ? cardTipoFilter : undefined;
        const statusTabs = ["PENDENTE", "PAGO_PARCIAL", "PAGO_TOTAL", "VENCIDO", "CANCELADO"];
        const status = statusTabs.includes(activeTab) ? activeTab : undefined;

        const response = await financeiroService.listarAgrupado({
          page,
          limit,
          tipo,
          status,
          cliente_id: clienteFilterId,
          fornecedor_id: fornecedorFilterId,
          data_inicial: dataInicialFilter || undefined,
          data_final: dataFinalFilter || undefined,
        });
        
        return {
          itens: response?.itens ?? [],
          total: response?.total ?? 0,
        };
      } catch (error) {
        console.warn("API de contas financeiras agrupadas não disponível:", error);
        return { itens: [], total: 0 };
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

  const itensAgrupados = contasAgrupadasResponse?.itens || [];
  const totalAgrupado = contasAgrupadasResponse?.total || 0;
  const totalPages = Math.ceil(totalAgrupado / limit) || 1;

  // Calcular estatísticas usando valores do backend (já consideram pagamentos parciais)
  // Conforme GUIA_FRONTEND_DASHBOARD_FINANCEIRO_VALOR_PAGO.md:
  // - Receita do Mês = receita_mes (valor total a receber do mês atual)
  // - Valor Pago do Mês = valor_pago_mes (valor pago no mês atual via pagamentos)
  // - Despesas do Mês = despesa_mes (valor total a pagar do mês atual)
  // - Saldo Atual = Receita Total Recebida - Despesa Total Paga
  const stats = useMemo(() => {
    // Função auxiliar para converter valor para número seguro
    const parseValor = (valor: any): number => {
      if (valor === null || valor === undefined || valor === '') return 0;
      const num = typeof valor === 'string' ? parseFloat(valor) : Number(valor);
      return isNaN(num) ? 0 : num;
    };

    const receitaMes = parseValor(contasReceberStats?.receita_mes) || 0;
    const valorPagoMes = parseValor(contasReceberStats?.valor_pago_mes) || 0;
    const despesaMes = parseValor(contasPagarStats?.despesa_mes) || 0;
    const valorTotalRecebido = parseValor(contasReceberStats?.valor_total_recebido) ?? 0;
    const valorTotalPago = parseValor(contasPagarStats?.valor_total_pago) ?? 0;
    const saldoAtual = dashboardUnificado?.saldo_atual ?? (valorTotalRecebido - valorTotalPago);

    /** Mesmo padrão visual dos cards em Centro de custos (borda lateral + ícone + valor). */
    return [
      {
        label: "Receita do Mês",
        value: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(receitaMes),
        Icon: TrendingUp,
        border: "border-l-4 border-l-sky-600 dark:border-l-sky-400",
        iconWrap:
          "bg-sky-500/[0.12] text-sky-800 dark:bg-sky-500/15 dark:text-sky-300",
        cardFilter: "RECEBER" as const,
      },
      {
        label: "Valor Pago do Mês",
        value: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valorPagoMes),
        Icon: DollarSign,
        border: "border-l-4 border-l-emerald-500",
        iconWrap:
          "bg-emerald-500/[0.12] text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
        cardFilter: "todos" as const,
      },
      {
        label: "Despesas do Mês",
        value: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(despesaMes),
        Icon: TrendingDown,
        border: "border-l-4 border-l-rose-500",
        iconWrap:
          "bg-rose-500/[0.12] text-rose-700 dark:bg-rose-500/15 dark:text-rose-400",
        cardFilter: "PAGAR" as const,
      },
      {
        label: "Saldo Atual",
        value: new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(saldoAtual),
        Icon: Wallet,
        border: "border-l-4 border-l-blue-600 dark:border-l-blue-400",
        iconWrap:
          "bg-blue-500/[0.12] text-blue-800 dark:bg-blue-500/15 dark:text-blue-300",
        cardFilter: "todos" as const,
      },
    ];
  }, [resumoParaStats, dashboardUnificado, contasReceberStats, contasPagarStats]);

  // Query para buscar conta por ID (usado apenas no formulário de Edição - GET :id)
  const { data: contaSelecionada, isLoading: isLoadingConta } = useQuery({
    queryKey: ["conta-financeira", selectedContaId],
    queryFn: async () => {
      if (!selectedContaId) return null;
      return await financeiroService.buscarPorId(selectedContaId);
    },
    enabled: !!selectedContaId && editDialogOpen,
    retry: false,
  });

  // Query para detalhe enriquecido (usado apenas no modal Visualizar - GET :id/detalhe)
  const { data: contaDetalhe, isLoading: isLoadingDetalhe } = useQuery({
    queryKey: ["conta-financeira-detalhe", selectedContaId],
    queryFn: async () => {
      if (!selectedContaId) return null;
      return await financeiroService.buscarDetalhePorId(selectedContaId);
    },
    enabled: !!selectedContaId && viewDialogOpen,
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

  // Mapear itens agrupados para exibição (já vêm no formato correto da API)
  const transacoesDisplay = useMemo(() => {
    const statusMap: Record<string, string> = {
      "PENDENTE": "Pendente",
      "PAGO_PARCIAL": "Pago Parcial",
      "PAGO_TOTAL": "Pago Total",
      "VENCIDO": "Vencido",
      "CANCELADO": "Cancelado",
    };
    return itensAgrupados.map((item) => ({
      id: item.id,
      cliente_nome: item.cliente_nome,
      descricao: item.descricao,
      tipo: item.tipo === "RECEBER" ? "Receita" : "Despesa",
      categoria: item.categoria,
      valor: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor_total ?? 0),
      status: statusMap[item.status] || item.status,
      contaId: item.id,
      pedido_id: item.pedido_id,
    }));
  }, [itensAgrupados]);

  // Filtrar por busca local (por nome, descrição)
  const filteredTransacoes = useMemo(() => {
    if (!searchTerm.trim()) return transacoesDisplay;
    const term = searchTerm.toLowerCase();
    return transacoesDisplay.filter(t => 
      (t.cliente_nome?.toLowerCase() || "").includes(term) ||
      (t.descricao?.toLowerCase() || "").includes(term) ||
      String(t.contaId).includes(term)
    );
  }, [transacoesDisplay, searchTerm]);

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
      observacoes: newTransacao.observacoes || undefined,
    };

    createContaMutation.mutate(contaData);
  };

  const handleDelete = async (id: string) => {
    const contaId = Number(id);
    if (isNaN(contaId)) return;
    try {
      await financeiroService.deletar(contaId);
      queryClient.invalidateQueries({ queryKey: ["contas-financeiras"] });
      toast.success("Transação excluída!");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Erro ao excluir transação");
    }
  };

  return (
    <AppLayout>
      <div className="p-3 sm:p-4 md:p-6 min-w-0">
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
                          {(pedidos || [])
                            .filter((pedido) => {
                              const pedidoId = (pedido as any).pedido_id ?? pedido.id;
                              return pedidoId != null;
                            })
                            .map((pedido) => {
                              const pedidoId = (pedido as any).pedido_id ?? pedido.id;
                              return (
                                <SelectItem key={pedidoId} value={pedidoId.toString()}>
                                  {pedido.numero_pedido || `PED-${pedidoId}`}
                                </SelectItem>
                              );
                            })}
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

        {/* Stats — mesmo designer dos cards da página Centro de custos (clicável para filtrar) */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4 mb-6">
          {stats.map((stat, index) => {
            const Icon = stat.Icon;
            const cardFilter = stat.cardFilter ?? "todos";
            const filtroTipoAtivo =
              cardFilter !== "todos" && cardTipoFilter === cardFilter;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setCardTipoFilter(cardFilter);
                    setPage(1);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setCardTipoFilter(cardFilter);
                      setPage(1);
                    }
                  }}
                  className={cn(
                    "h-full overflow-hidden border border-border/60 shadow-sm cursor-pointer transition-all hover:shadow-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    stat.border,
                    "bg-gradient-to-b from-background to-muted/30 dark:to-muted/20",
                    filtroTipoAtivo ? "ring-2 ring-primary/45" : "",
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-3 text-xs font-medium leading-snug text-muted-foreground">
                        {stat.label}
                      </p>
                      <div
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                          stat.iconWrap,
                        )}
                      >
                        <Icon className="h-4 w-4" aria-hidden />
                      </div>
                    </div>
                    <p className="mt-3 text-xl font-bold tabular-nums tracking-tight sm:text-2xl text-slate-900 dark:text-foreground">
                      {stat.value}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Filtros e busca — barra tipo Centro de Custos */}
        <div className="mb-6 rounded-2xl border border-border/60 bg-muted/40 p-3 sm:p-4 dark:bg-muted/25">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              variant="secondary"
              className="h-10 w-full shrink-0 gap-2 rounded-xl shadow-sm sm:w-auto"
              onClick={() => setFiltrosDialogOpen(true)}
              style={
                temFiltrosAtivos
                  ? { borderColor: "var(--primary)", borderWidth: "2px" }
                  : {}
              }
            >
              <Filter className="h-4 w-4 text-muted-foreground" />
              Filtros
              {temFiltrosAtivos && (
                <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                  {(cardTipoFilter !== "todos" ? 1 : 0) +
                    (clienteFilterId != null ? 1 : 0) +
                    (fornecedorFilterId != null ? 1 : 0) +
                    (dataInicialFilter ? 1 : 0) +
                    (dataFinalFilter ? 1 : 0) +
                    (activeTab !== "Todos" ? 1 : 0)}
                </span>
              )}
            </Button>
            <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por cliente ou descrição..."
                  className="h-10 rounded-xl border-border/80 bg-background pl-10 shadow-sm placeholder:text-muted-foreground/70"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-10 w-full shrink-0 gap-2 rounded-xl shadow-sm sm:w-auto"
                  >
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    Relatórios
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Relatórios</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setRelatorioClientePdfOpen(true)}
                  >
                    Relatório financeiro por cliente
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

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
                      onValueChange={(v) => {
                        setClienteFilterId(v === "todos" ? undefined : parseInt(v, 10));
                        setPage(1);
                      }}
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

                  {/* Fornecedor */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">Fornecedor</Label>
                    <Select
                      value={fornecedorFilterId == null ? "todos" : String(fornecedorFilterId)}
                      onValueChange={(v) => {
                        setFornecedorFilterId(v === "todos" ? undefined : parseInt(v, 10));
                        setPage(1);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os fornecedores" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os fornecedores</SelectItem>
                        {fornecedores.map((f) => (
                          <SelectItem key={f.id} value={String(f.id)}>{f.nome_fantasia}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  {/* Período */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">Período</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Data Inicial</Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                          <Input
                            type="date"
                            className="pl-10"
                            value={dataInicialFilter}
                            onChange={(e) => {
                              setDataInicialFilter(e.target.value || "");
                              setPage(1);
                            }}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Data Final</Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                          <Input
                            type="date"
                            className="pl-10"
                            value={dataFinalFilter}
                            onChange={(e) => {
                              setDataFinalFilter(e.target.value || "");
                              setPage(1);
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Status — apenas: Todos, Pendente, Pago Parcial, Quitada, Vencido, Cancelado */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">Status</Label>
                    <RadioGroup
                      value={["Todos", "PENDENTE", "PAGO_PARCIAL", "PAGO_TOTAL", "VENCIDO", "CANCELADO"].includes(activeTab) ? activeTab : "Todos"}
                      onValueChange={(v) => {
                        setActiveTab(v);
                        setPage(1);
                      }}
                      className="space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Todos" id="status-todos" />
                        <Label htmlFor="status-todos" className="flex items-center gap-2 cursor-pointer flex-1">
                          <Circle className="w-3 h-3 text-primary" />
                          <span>Todos</span>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="PENDENTE" id="status-pendente" />
                        <Label htmlFor="status-pendente" className="flex items-center gap-2 cursor-pointer flex-1">
                          <Circle className="w-3 h-3 text-amber-500" />
                          <span>Pendente</span>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="PAGO_PARCIAL" id="status-parcial" />
                        <Label htmlFor="status-parcial" className="flex items-center gap-2 cursor-pointer flex-1">
                          <Circle className="w-3 h-3 text-blue-500" />
                          <span>Pago Parcial</span>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="PAGO_TOTAL" id="status-quitado" />
                        <Label htmlFor="status-quitado" className="flex items-center gap-2 cursor-pointer flex-1">
                          <Circle className="w-3 h-3 text-green-500" />
                          <span>Quitada</span>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="VENCIDO" id="status-vencido" />
                        <Label htmlFor="status-vencido" className="flex items-center gap-2 cursor-pointer flex-1">
                          <Circle className="w-3 h-3 text-red-500" />
                          <span>Vencido</span>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="CANCELADO" id="status-cancelado" />
                        <Label htmlFor="status-cancelado" className="flex items-center gap-2 cursor-pointer flex-1">
                          <Circle className="w-3 h-3 text-slate-500" />
                          <span>Cancelado</span>
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

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-md border overflow-hidden"
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Valor (total)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingContas ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Carregando contas...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredTransacoes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <DollarSign className="w-12 h-12 text-muted-foreground/50" />
                      <p>Nenhuma transação encontrada</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransacoes.map((transacao) => (
                  <TableRow key={transacao.contaId}>
                    <TableCell>
                      <span className="font-medium">{transacao.cliente_nome || "—"}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{transacao.descricao}</span>
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        transacao.tipo === "Receita" 
                          ? "bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800" 
                          : "bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
                      }`}>
                        {transacao.tipo}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{transacao.categoria}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{transacao.valor}</span>
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
                          <DropdownMenuItem
                            onClick={async () => {
                              try {
                                await financeiroService.downloadReciboPagamento(transacao.contaId);
                                toast.success('Recibo de pagamento baixado.');
                              } catch (e) {
                                toast.error(e instanceof Error ? e.message : 'Erro ao gerar recibo.');
                              }
                            }}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Recibo de pagamento
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(String(transacao.contaId))}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          {/* Paginação e total */}
          {totalAgrupado > 0 && (
            <div className="border-t border-border p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                Mostrando {filteredTransacoes.length} de {totalAgrupado} {totalAgrupado === 1 ? 'grupo' : 'grupos'}
              </div>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Página {page} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    Próxima
                  </Button>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Dialog de Visualização - GET :id/detalhe; campos conforme GUIA_FRONTEND_DETALHE_CONTA_FINANCEIRA */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                {contaDetalhe ? `Conta ${contaDetalhe.numero_conta || `#${contaDetalhe.id}`}` : 'Detalhes da Conta Financeira'}
              </DialogTitle>
              <DialogDescription>
                Visualização detalhada da conta financeira
              </DialogDescription>
            </DialogHeader>

            {isLoadingDetalhe ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : contaDetalhe ? (
              <div className="space-y-6">
                {/* Informações Básicas: valor_total_pedido, valor_pago, valor_em_aberto, status, descricao_parcelas_quitadas */}
                <div className="bg-card border rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                      <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Informações Básicas</h3>
                      <p className="text-sm text-muted-foreground">
                        Dados principais da conta
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Número da Conta</Label>
                      <div className="text-sm font-medium">{contaDetalhe.numero_conta || `CONTA-${contaDetalhe.id}`}</div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Tipo</Label>
                      <div className="text-sm font-medium">{contaDetalhe.tipo}</div>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-muted-foreground">Descrição (parcelas quitadas)</Label>
                      <div className="text-sm font-medium">{contaDetalhe.descricao_parcelas_quitadas || contaDetalhe.descricao}</div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Valor total do pedido</Label>
                      <div className="text-sm font-medium">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(contaDetalhe.valor_total_pedido ?? 0)}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Valor pago</Label>
                      <div className="text-sm font-medium">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(contaDetalhe.valor_pago ?? 0)}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Valor em aberto</Label>
                      <div className="text-sm font-medium">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(contaDetalhe.valor_em_aberto ?? 0)}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Status</Label>
                      <div className="text-sm font-medium">{contaDetalhe.status}</div>
                    </div>
                  </div>
                </div>

                {/* Relacionamentos: cliente_nome, fornecedor_nome, pedido_numero, nome_produto */}
                <div className="bg-card border rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-lg ${contaDetalhe.tipo === 'Receber' ? 'bg-green-100 dark:bg-green-900/20' : 'bg-blue-100 dark:bg-blue-900/20'}`}>
                      <ShoppingCart className={`w-5 h-5 ${contaDetalhe.tipo === 'Receber' ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Relacionamentos</h3>
                      <p className="text-sm text-muted-foreground">
                        Cliente, fornecedor e pedido vinculados
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Cliente</Label>
                      <div className="text-sm font-medium">{contaDetalhe.relacionamentos?.cliente_nome ?? 'N/A'}</div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Fornecedor</Label>
                      <div className="text-sm font-medium">{contaDetalhe.relacionamentos?.fornecedor_nome ?? 'N/A'}</div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Pedido</Label>
                      <div className="text-sm font-medium">{contaDetalhe.relacionamentos?.pedido_numero ?? 'N/A'}</div>
                    </div>
                    {(contaDetalhe.relacionamentos?.nome_produto != null && contaDetalhe.relacionamentos.nome_produto !== '') && (
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-muted-foreground">Produtos</Label>
                        <div className="text-sm font-medium">{contaDetalhe.relacionamentos.nome_produto}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Datas: data_criacao, data_vencimento, data_pagamento */}
                <div className="bg-card border rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/20 rounded-lg">
                      <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Datas</h3>
                      <p className="text-sm text-muted-foreground">
                        Criação, vencimento e pagamento
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Data de criação</Label>
                      <div className="text-sm font-medium">
                        {contaDetalhe.datas?.data_criacao ? formatDate(contaDetalhe.datas.data_criacao) : 'N/A'}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Data de vencimento</Label>
                      <div className="text-sm font-medium">
                        {contaDetalhe.datas?.data_vencimento ? formatDate(contaDetalhe.datas.data_vencimento) : 'N/A'}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Data de pagamento</Label>
                      <div className="text-sm font-medium">
                        {contaDetalhe.datas?.data_pagamento ? formatDate(contaDetalhe.datas.data_pagamento) : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pagamento: pagamento.forma_pagamento */}
                <div className="bg-card border rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                      <CreditCard className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Pagamento</h3>
                      <p className="text-sm text-muted-foreground">
                        Forma de pagamento
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Forma de Pagamento</Label>
                      <div className="text-sm font-medium">
                        {(() => {
                          const fp = contaDetalhe.pagamento?.forma_pagamento;
                          const map: Record<string, string> = { DINHEIRO: 'Dinheiro', PIX: 'PIX', CARTAO_CREDITO: 'Cartão de Crédito', CARTAO_DEBITO: 'Cartão de Débito', BOLETO: 'Boleto', TRANSFERENCIA: 'Transferência', CHEQUE: 'Cheque' };
                          return fp ? (map[fp] ?? fp) : 'N/A';
                        })()}
                      </div>
                    </div>
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

        {/* Dialog de Edição - mesmo design do Editar Cliente */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-2xl font-bold">
                    Editar Conta Financeira
                  </DialogTitle>
                  <DialogDescription className="mt-1">
                    Edite os campos desejados da conta financeira
                  </DialogDescription>
                </div>
                {contaSelecionada && editConta && (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
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
                          observacoes: contaSelecionada.observacoes,
                        });
                      }}
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Limpar
                    </Button>
                  </div>
                )}
              </div>
            </DialogHeader>

            {isLoadingConta ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : editConta ? (
              <div className="space-y-8 pt-6">
                {/* Seção: Informações Básicas */}
                <div className="bg-card border rounded-lg p-6 space-y-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <FileText className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">
                        Informações Básicas
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Dados principais da conta
                      </p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        Descrição *
                      </Label>
                      <Input
                        placeholder="Ex: Pedido VEND-2026-00001 - Parcela 1/4"
                        value={editConta.descricao}
                        onChange={(e) => setEditConta({ ...editConta, descricao: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">Tipo *</Label>
                        <Select
                          value={editConta.tipo}
                          onValueChange={(value: "RECEBER" | "PAGAR") =>
                            setEditConta({ ...editConta, tipo: value })
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
                        <Label className="text-sm font-semibold">Valor Original *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={editConta.valor_original || ""}
                          onChange={(e) => setEditConta({ ...editConta, valor_original: e.target.value ? Number(e.target.value) : 0 })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Seção: Relacionamentos */}
                <div className="bg-card border rounded-lg p-6 space-y-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <ShoppingCart className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">
                        Relacionamentos
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Cliente, fornecedor e pedido vinculados
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Cliente</Label>
                      <Select
                        value={editConta.cliente_id?.toString() || undefined}
                        onValueChange={(value) =>
                          setEditConta({
                            ...editConta,
                            cliente_id: value && value !== "none" ? Number(value) : undefined,
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
                      <Label className="text-sm font-semibold">Fornecedor</Label>
                      <Select
                        value={editConta.fornecedor_id?.toString() || undefined}
                        onValueChange={(value) =>
                          setEditConta({
                            ...editConta,
                            fornecedor_id: value && value !== "none" ? Number(value) : undefined,
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
                      <Label className="text-sm font-semibold">Pedido</Label>
                      <Select
                        value={editConta.pedido_id?.toString() || undefined}
                        onValueChange={(value) =>
                          setEditConta({
                            ...editConta,
                            pedido_id: value && value !== "none" ? Number(value) : undefined,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um pedido" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhum</SelectItem>
                          {(pedidos || [])
                            .filter((pedido) => {
                              const pedidoId = (pedido as any).pedido_id ?? pedido.id;
                              return pedidoId != null;
                            })
                            .map((pedido) => {
                              const pedidoId = (pedido as any).pedido_id ?? pedido.id;
                              return (
                                <SelectItem key={pedidoId} value={pedidoId.toString()}>
                                  {pedido.numero_pedido || `PED-${pedidoId}`}
                                </SelectItem>
                              );
                            })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Seção: Datas */}
                <div className="bg-card border rounded-lg p-6 space-y-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-amber-500/10">
                      <Calendar className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">
                        Datas
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Emissão, vencimento e pagamento
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Data de Emissão *</Label>
                      <Input
                        type="date"
                        value={editConta.data_emissao}
                        onChange={(e) => setEditConta({ ...editConta, data_emissao: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Data de Vencimento *</Label>
                      <Input
                        type="date"
                        value={editConta.data_vencimento}
                        onChange={(e) => setEditConta({ ...editConta, data_vencimento: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Data de Pagamento</Label>
                      <Input
                        type="date"
                        value={editConta.data_pagamento || ""}
                        onChange={(e) => setEditConta({ ...editConta, data_pagamento: e.target.value || undefined })}
                      />
                    </div>
                  </div>
                </div>

                {/* Seção: Pagamento */}
                <div className="bg-card border rounded-lg p-6 space-y-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-yellow-500/10">
                      <CreditCard className="w-5 h-5 text-yellow-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">
                        Pagamento
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Forma de pagamento
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Forma de Pagamento</Label>
                    <Select
                      value={editConta.forma_pagamento || undefined}
                      onValueChange={(value) =>
                        setEditConta({
                          ...editConta,
                          forma_pagamento: value ? (value as any) : undefined,
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

                {/* Seção: Observações */}
                <div className="bg-card border rounded-lg p-6 space-y-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-gray-500/10">
                      <Info className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">
                        Observações
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Informações adicionais sobre a transação
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Observações</Label>
                    <Textarea
                      placeholder="Observações adicionais sobre a transação"
                      value={editConta.observacoes || ""}
                      onChange={(e) => setEditConta({ ...editConta, observacoes: e.target.value || undefined })}
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

        <Dialog
          open={relatorioClientePdfOpen}
          onOpenChange={(open) => {
            setRelatorioClientePdfOpen(open);
            if (open) {
              setRelatorioDataInicial("");
              setRelatorioDataFinal("");
              setRelatorioStatusFiltro("Todos");
              setRelatorioClienteIdSelect(
                clienteFilterId != null ? String(clienteFilterId) : "",
              );
            }
          }}
        >
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Relatório financeiro por cliente</DialogTitle>
              <DialogDescription>
                Inclui dados da empresa, cadastro do cliente e lançamentos das contas financeiras
                vinculadas a ele (campos já existentes no sistema).
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="relatorio-cliente-select">Cliente</Label>
                <Select
                  value={relatorioClienteIdSelect || undefined}
                  onValueChange={setRelatorioClienteIdSelect}
                >
                  <SelectTrigger id="relatorio-cliente-select">
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-xl border border-border/80 bg-muted/30 p-4 space-y-4">
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-[#1A3B70]">Período</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Data Inicial</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        <Input
                          type="date"
                          className="pl-10 rounded-lg border-border/80 bg-muted/50"
                          value={relatorioDataInicial}
                          onChange={(e) => setRelatorioDataInicial(e.target.value || "")}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Data Final</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        <Input
                          type="date"
                          className="pl-10 rounded-lg border-border/80 bg-muted/50"
                          value={relatorioDataFinal}
                          onChange={(e) => setRelatorioDataFinal(e.target.value || "")}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-[#1A3B70]">Status</Label>
                  <RadioGroup
                    value={relatorioStatusFiltro}
                    onValueChange={setRelatorioStatusFiltro}
                    className="space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Todos" id="relatorio-status-todos" />
                      <Label htmlFor="relatorio-status-todos" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Circle className="w-3 h-3 text-primary" />
                        <span className="text-[#1A3B70]">Todos</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="PENDENTE" id="relatorio-status-pendente" />
                      <Label htmlFor="relatorio-status-pendente" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Circle className="w-3 h-3 text-amber-500" />
                        <span className="text-[#1A3B70]">Pendente</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="PAGO_PARCIAL" id="relatorio-status-parcial" />
                      <Label htmlFor="relatorio-status-parcial" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Circle className="w-3 h-3 text-blue-500" />
                        <span className="text-[#1A3B70]">Pago Parcial</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="PAGO_TOTAL" id="relatorio-status-quitado" />
                      <Label htmlFor="relatorio-status-quitado" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Circle className="w-3 h-3 text-green-500" />
                        <span className="text-[#1A3B70]">Quitada</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="VENCIDO" id="relatorio-status-vencido" />
                      <Label htmlFor="relatorio-status-vencido" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Circle className="w-3 h-3 text-red-500" />
                        <span className="text-[#1A3B70]">Vencido</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="CANCELADO" id="relatorio-status-cancelado" />
                      <Label htmlFor="relatorio-status-cancelado" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Circle className="w-3 h-3 text-slate-500" />
                        <span className="text-[#1A3B70]">Cancelado</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              {relatorioPreviewFetching && relatorioClienteIdParsed != null && (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verificando filtros…
                </p>
              )}

              {relatorioPreviewError && relatorioClienteIdParsed != null && (
                <p className="text-sm text-destructive">
                  Não foi possível verificar os filtros. Tente novamente.
                </p>
              )}

              {!relatorioPreviewFetching &&
                !relatorioPreviewError &&
                relatorioClienteIdParsed != null &&
                relatorioPreviewData?.total === 0 && (
                  <p className="rounded-lg border border-border/80 bg-muted/20 px-3 py-2 text-sm text-[#1A3B70]">
                    {relatorioMensagemSemDados}
                  </p>
                )}

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  className="gap-2"
                  disabled={
                    relatorioClienteIdParsed == null ||
                    relatorioPreviewFetching ||
                    !relatorioTemDados ||
                    relatorioClientePdfLoading
                  }
                  onClick={async () => {
                    const id = relatorioClienteIdParsed;
                    if (id == null) {
                      toast.error("Selecione um cliente.");
                      return;
                    }
                    setRelatorioClientePdfLoading(true);
                    try {
                      await relatoriosClienteService.downloadRelatorioFinanceiro(
                        id,
                        relatorioFiltrosForPdf,
                      );
                      toast.success("PDF baixado.");
                    } catch (e: unknown) {
                      const msg =
                        e instanceof Error ? e.message : "Erro ao gerar PDF.";
                      toast.error(msg);
                    } finally {
                      setRelatorioClientePdfLoading(false);
                    }
                  }}
                >
                  {relatorioClientePdfLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Baixar PDF
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  disabled={
                    relatorioClienteIdParsed == null ||
                    relatorioPreviewFetching ||
                    !relatorioTemDados ||
                    relatorioClientePdfLoading
                  }
                  onClick={async () => {
                    const id = relatorioClienteIdParsed;
                    if (id == null) {
                      toast.error("Selecione um cliente.");
                      return;
                    }
                    setRelatorioClientePdfLoading(true);
                    try {
                      await relatoriosClienteService.imprimirRelatorioFinanceiro(
                        id,
                        relatorioFiltrosForPdf,
                      );
                    } catch (e: unknown) {
                      const msg =
                        e instanceof Error ? e.message : "Erro ao abrir PDF.";
                      toast.error(msg);
                    } finally {
                      setRelatorioClientePdfLoading(false);
                    }
                  }}
                >
                  <Printer className="h-4 w-4" />
                  Abrir para imprimir
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Financeiro;


















