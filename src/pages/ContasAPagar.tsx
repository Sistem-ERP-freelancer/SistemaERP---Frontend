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
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious
} from "@/components/ui/pagination";
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
    formatCurrency,
    formatDate,
    formatarFormaPagamento,
    formatarStatus,
    parseDateOnlyLocal,
} from "@/lib/utils";
import { CreateContaFinanceiraDto, financeiroService } from "@/services/financeiro.service";
import { Fornecedor, fornecedoresService } from "@/services/fornecedores.service";
import { pedidosService } from "@/services/pedidos.service";
import type { ContaPagar } from "@/types/contas-financeiras.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
    BarChart3,
    Calendar,
    CheckCircle,
    Circle,
    CreditCard,
    Download,
    DollarSign,
    Edit,
    Eye,
    FileText,
    Filter,
    Info,
    Loader2,
    MoreVertical,
    Printer,
    Search,
    ShoppingCart
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { relatoriosClienteService } from "@/services/relatorios-cliente.service";
import { toast } from "sonner";

/** Saldo em aberto: confia em valor_em_aberto quando > 0; senão deriva de total − pago (evita menu “Pagar” oculto). */
function valorEmAbertoContaPagar(p: ContaPagar): number {
  const total = Number(p.valor_total) || 0;
  const pago = Number(p.valor_pago ?? 0);
  const declarado = Number(p.valor_em_aberto);
  if (Number.isFinite(declarado) && declarado > 0.009) {
    return Math.max(0, declarado);
  }
  return Math.max(0, Number((total - pago).toFixed(2)));
}

function podeExibirPagarPedido(p: ContaPagar): boolean {
  const st = String(p.status ?? "").toUpperCase().trim();
  if (st === "QUITADO" || st === "CANCELADO") return false;
  return valorEmAbertoContaPagar(p) > 0.009;
}

function ContasAPagar() {
  const [activeTab, setActiveTab] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(15);
  const [fornecedorFilterId, setFornecedorFilterId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [dataInicialFilter, setDataInicialFilter] = useState<string>("");
  const [dataFinalFilter, setDataFinalFilter] = useState<string>("");
  /** Filtro por card clicável (como Contas a Receber): ao clicar no card, filtra a tabela */
  const [activeCardFilter, setActiveCardFilter] = useState<"todos" | "valor_pago" | "vencidas" | "vencendo_hoje" | "vencendo_este_mes">("todos");
  const [filtrosDialogOpen, setFiltrosDialogOpen] = useState(false);
  const [relatorioFornecedorPdfOpen, setRelatorioFornecedorPdfOpen] = useState(false);
  const [relatorioFornecedorIdSelect, setRelatorioFornecedorIdSelect] = useState<string>("");
  const [relatorioFornecedorPdfLoading, setRelatorioFornecedorPdfLoading] = useState(false);
  const [relatorioFornecedorDataInicial, setRelatorioFornecedorDataInicial] = useState("");
  const [relatorioFornecedorDataFinal, setRelatorioFornecedorDataFinal] = useState("");
  const [relatorioFornecedorStatusFiltro, setRelatorioFornecedorStatusFiltro] =
    useState<string>("Todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedContaId, setSelectedContaId] = useState<number | null>(null);
  const [editingStatusId, setEditingStatusId] = useState<number | null>(null);
  const [newTransacao, setNewTransacao] = useState<CreateContaFinanceiraDto & { 
    data_emissao: string;
  }>({
    tipo: "PAGAR",
    descricao: "",
    valor_original: 0,
    data_emissao: new Date().toISOString().split('T')[0],
    data_vencimento: "",
  });

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Buscar fornecedores
  const { data: fornecedoresData } = useQuery({
    queryKey: ["fornecedores"],
    queryFn: async () => {
      try {
        const response = await fornecedoresService.listar({
          limit: 100,
          statusFornecedor: "ATIVO",
        });
        if (Array.isArray(response)) return response;
        if (Array.isArray((response as any)?.data)) return (response as any).data;
        if (Array.isArray((response as any)?.fornecedores)) return (response as any).fornecedores;
        if (Array.isArray((response as any)?.items)) return (response as any).items;
        return [];
      } catch (error) {
        console.warn("API de fornecedores não disponível:", error);
        return [];
      }
    },
    retry: false,
  });

  const fornecedores: Fornecedor[] = Array.isArray(fornecedoresData)
    ? fornecedoresData
    : (fornecedoresData as any)?.data ||
      (fornecedoresData as any)?.fornecedores ||
      (fornecedoresData as any)?.items ||
      [];

  // Buscar pedidos de compra
  const { data: pedidosData } = useQuery({
    queryKey: ["pedidos", "contas-pagar"],
    queryFn: async () => {
      try {
        const response = await pedidosService.listar({
          tipo: "COMPRA",
          page: 1,
          limit: 500,
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

  const relatorioFornecedorIdParsed = useMemo(() => {
    if (!relatorioFornecedorIdSelect) return null;
    const n = parseInt(relatorioFornecedorIdSelect, 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [relatorioFornecedorIdSelect]);

  const relatorioFornecedorPreviewParams = useMemo(
    () => ({
      page: 1,
      limit: 1,
      fornecedor_id: relatorioFornecedorIdParsed ?? undefined,
      data_inicial: relatorioFornecedorDataInicial || undefined,
      data_final: relatorioFornecedorDataFinal || undefined,
      status:
        relatorioFornecedorStatusFiltro !== "Todos"
          ? relatorioFornecedorStatusFiltro
          : undefined,
    }),
    [
      relatorioFornecedorIdParsed,
      relatorioFornecedorDataInicial,
      relatorioFornecedorDataFinal,
      relatorioFornecedorStatusFiltro,
    ],
  );

  const {
    data: relatorioFornecedorPreviewData,
    isFetching: relatorioFornecedorPreviewFetching,
    isError: relatorioFornecedorPreviewError,
  } = useQuery({
    queryKey: [
      "contas-pagar-relatorio-fornecedor-preview",
      relatorioFornecedorPreviewParams,
    ],
    queryFn: () =>
      financeiroService.listarAgrupado(relatorioFornecedorPreviewParams),
    enabled: relatorioFornecedorPdfOpen && relatorioFornecedorIdParsed != null,
  });

  const relatorioFornecedorTemDados =
    !relatorioFornecedorPreviewError &&
    relatorioFornecedorPreviewData != null &&
    relatorioFornecedorPreviewData.total > 0;

  const relatorioFornecedorMensagemSemDados = useMemo(() => {
    if (relatorioFornecedorStatusFiltro !== "Todos") {
      return "O fornecedor não possui dívida naquele status selecionado.";
    }
    return "O fornecedor não possui dívida naquele período.";
  }, [relatorioFornecedorStatusFiltro]);

  const relatorioFornecedorFiltrosForPdf = useMemo(
    () => ({
      dataInicial: relatorioFornecedorDataInicial || undefined,
      dataFinal: relatorioFornecedorDataFinal || undefined,
      status:
        relatorioFornecedorStatusFiltro !== "Todos"
          ? relatorioFornecedorStatusFiltro
          : undefined,
    }),
    [
      relatorioFornecedorDataInicial,
      relatorioFornecedorDataFinal,
      relatorioFornecedorStatusFiltro,
    ],
  );

  // Buscar dados do dashboard de contas a pagar (sem filtros)
  const { data: dashboardPagar, isLoading: isLoadingPagar } = useQuery({
    queryKey: ["dashboard-pagar"],
    queryFn: () => financeiroService.getDashboardPagar(),
    refetchInterval: 30000,
    retry: false,
  });

  // Parâmetros de filtro para resumo (mesmos da listagem) — cards filtráveis
  const resumoFilterParams = useMemo((): import('@/types/contas-financeiras.types').FiltrosContasPagar | undefined => {
    const params: import('@/types/contas-financeiras.types').FiltrosContasPagar = {};
    if (fornecedorFilterId != null && fornecedorFilterId > 0) params.fornecedor_id = fornecedorFilterId;
    if (dataInicialFilter && /^\d{4}-\d{2}-\d{2}$/.test(dataInicialFilter)) params.data_inicial = dataInicialFilter;
    if (dataFinalFilter && /^\d{4}-\d{2}-\d{2}$/.test(dataFinalFilter)) params.data_final = dataFinalFilter;
    let situacao: 'em_aberto' | 'em_atraso' | 'concluido' | undefined = undefined;
    if (statusFilter) {
      if (statusFilter === 'ABERTO' || statusFilter === 'PARCIAL') situacao = 'em_aberto';
      else if (statusFilter === 'QUITADO') situacao = 'concluido';
      else if (statusFilter === 'VENCIDO') situacao = 'em_atraso';
    } else if (activeTab !== "Todos") {
      if (activeTab === "PENDENTE" || activeTab === "VENCE_HOJE" || activeTab === "PAGO_PARCIAL") situacao = 'em_aberto';
      else if (activeTab === "VENCIDO") situacao = 'em_atraso';
      else if (activeTab === "PAGO_TOTAL") situacao = 'concluido';
    }
    if (situacao) params.situacao = situacao;
    const hasAny = (params.fornecedor_id != null && params.fornecedor_id > 0) || !!params.data_inicial || !!params.data_final || !!params.situacao;
    return hasAny ? params : undefined;
  }, [fornecedorFilterId, statusFilter, dataInicialFilter, dataFinalFilter, activeTab]);

  // Resumo filtrado para os cards (quando há filtros ativos)
  const { data: resumoContasPagar } = useQuery({
    queryKey: ["resumo-contas-pagar", resumoFilterParams],
    queryFn: () => pedidosService.getResumoContasPagar(resumoFilterParams!),
    enabled: !!resumoFilterParams,
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

  // Buscar contas a pagar usando novo endpoint /pedidos/contas-pagar (cada linha = 1 pedido)
  const { data: pedidosContasPagarResponse, isLoading: isLoadingPedidosContasPagar } = useQuery({
    queryKey: ["pedidos", "contas-pagar", activeTab, currentPage, fornecedorFilterId, statusFilter, dataInicialFilter, dataFinalFilter],
    queryFn: async () => {
      if (!validarParametrosPaginação(currentPage, pageSize)) {
        throw new Error('Parâmetros de paginação inválidos');
      }

      try {
        const params: import('@/types/contas-financeiras.types').FiltrosContasPagar = {};
        if (fornecedorFilterId != null && fornecedorFilterId > 0) {
          params.fornecedor_id = fornecedorFilterId;
        }
        if (dataInicialFilter && /^\d{4}-\d{2}-\d{2}$/.test(dataInicialFilter)) {
          params.data_inicial = dataInicialFilter;
        }
        if (dataFinalFilter && /^\d{4}-\d{2}-\d{2}$/.test(dataFinalFilter)) {
          params.data_final = dataFinalFilter;
        }
        // Situação: prioridade do filtro avançado (statusFilter), senão tab (activeTab)
        let situacao: 'em_aberto' | 'em_atraso' | 'concluido' | undefined = undefined;
        if (statusFilter) {
          if (statusFilter === 'ABERTO' || statusFilter === 'PARCIAL') situacao = 'em_aberto';
          else if (statusFilter === 'QUITADO') situacao = 'concluido';
          else if (statusFilter === 'VENCIDO') situacao = 'em_atraso';
        } else {
          if (activeTab === "PENDENTE" || activeTab === "VENCE_HOJE" || activeTab === "PAGO_PARCIAL") situacao = 'em_aberto';
          else if (activeTab === "VENCIDO") situacao = 'em_atraso';
          else if (activeTab === "PAGO_TOTAL") situacao = 'concluido';
          else if (activeTab === "CANCELADO") situacao = undefined; // backend pode não ter; filtro client-side
        }
        if (situacao) params.situacao = situacao;

        const hasFilters =
          (params.fornecedor_id != null && params.fornecedor_id > 0) ||
          !!params.data_inicial ||
          !!params.data_final ||
          !!params.situacao;
        let pedidos = await pedidosService.listarContasPagar(hasFilters ? params : undefined);

        // Refinar por status: quando há status ativo, mostrar SOMENTE pedidos daquele status (nunca "todos")
        const statusAtivo = statusFilter || (activeTab !== "Todos" ? activeTab : null);
        const norm = (s: string) => (s || "").toUpperCase().trim();
        if (statusAtivo) {
          if (statusAtivo === 'ABERTO' || statusAtivo === 'PENDENTE') {
            // Apenas pendente (nada pago): status ABERTO ou valor_pago === 0
            pedidos = pedidos.filter((p: ContaPagar) => {
              const st = norm(p.status);
              const vp = Number(p.valor_pago ?? 0);
              return st === 'ABERTO' || (vp <= 0 && st !== 'QUITADO' && st !== 'CANCELADO');
            });
          } else if (statusAtivo === 'PARCIAL' || statusAtivo === 'PAGO_PARCIAL') {
            // Apenas parcialmente pagos: 0 < valor_pago < valor_total
            const total = (p: ContaPagar) => Number(p.valor_total) || 0;
            const pago = (p: ContaPagar) => Number(p.valor_pago ?? 0);
            pedidos = pedidos.filter((p: ContaPagar) => {
              const st = norm(p.status);
              if (st === 'QUITADO' || st === 'CANCELADO') return false;
              const vp = pago(p);
              const vt = total(p);
              return st === 'PARCIAL' || (vp > 0 && vp < vt - 0.01);
            });
          } else if (statusAtivo === 'QUITADO' || statusAtivo === 'PAGO_TOTAL') {
            pedidos = pedidos.filter((p: ContaPagar) => norm(p.status) === 'QUITADO');
          } else if (statusAtivo === 'VENCIDO') {
            pedidos = pedidos.filter((p: ContaPagar) => norm(p.status) === 'VENCIDO');
          } else if (statusAtivo === 'CANCELADO') {
            pedidos = pedidos.filter((p: ContaPagar) => norm(p.status) === 'CANCELADO');
          }
        }
        
        // Aplicar paginação manualmente (o endpoint não tem paginação ainda)
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedPedidos = pedidos.slice(startIndex, endIndex);
        
        return {
          data: paginatedPedidos,
          total: pedidos.length,
        };
      } catch (error: any) {
        // Se o erro for 400 (Bad Request), pode ser que o banco esteja vazio
        // Tratar como array vazio ao invés de erro para exibir 0 nos dashboards
        if (error?.response?.status === 400) {
          console.warn("Backend retornou 400 - tratando como banco vazio:", error);
          return { data: [], total: 0 };
        }
        console.warn("API de contas a pagar não disponível:", error);
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

  // Buscar contas a pagar filtradas para exibir na tabela com paginação (fallback)
  const { data: contasResponse, isLoading: isLoadingContas } = useQuery({
    queryKey: ["contas-financeiras", "pagar", "tabela", activeTab, currentPage],
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
          tipo: "PAGAR",
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
        
        console.log('📊 [ContasAPagar] Resposta da API:', { response, contasData, totalData });
        
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

  const pedidosContasPagarList = pedidosContasPagarResponse?.data || [];
  const totalPedidos = pedidosContasPagarResponse?.total || 0;
  const totalPages = Math.ceil(totalPedidos / pageSize);
  
  // Fallback: manter contas financeiras para compatibilidade temporária (se não houver pedidos)
  const { data: contasResponseFallback, isLoading: isLoadingContasFallback } = useQuery({
    queryKey: ["contas-financeiras", "pagar", "tabela-fallback", activeTab, currentPage],
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
          if (activeTab === "VENCIDO") {
            proximidadeVencimento = "VENCIDA";
          } else {
            status = activeTab;
          }
        } else if (proximidadeTabs.includes(activeTab)) {
          proximidadeVencimento = activeTab;
        }

        const response = await financeiroService.listar({
          tipo: "PAGAR",
          page: currentPage,
          limit: pageSize,
          status,
          proximidade_vencimento: proximidadeVencimento,
        });
        
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
        
        return {
          data: contasData,
          total: totalData,
        };
      } catch (error) {
        return { data: [], total: 0 };
      }
    },
    enabled: pedidosContasPagarList.length === 0, // Usar fallback apenas se não houver pedidos
    retry: false,
  });
  
  const contasFallback = contasResponseFallback?.data || [];

  const temFiltrosAtivos =
    (fornecedorFilterId != null && fornecedorFilterId > 0) ||
    !!statusFilter ||
    !!dataInicialFilter ||
    !!dataFinalFilter;
  const handleAplicarFiltros = () => setFiltrosDialogOpen(false);
  const handleLimparFiltros = () => {
    setFornecedorFilterId(null);
    setStatusFilter("");
    setDataInicialFilter("");
    setDataFinalFilter("");
    setFiltrosDialogOpen(false);
  };

  // Resetar página quando tab, busca ou filtros mudarem
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, fornecedorFilterId, statusFilter, dataInicialFilter, dataFinalFilter, activeCardFilter]);

  // Função auxiliar para verificar se uma conta está vencida
  const isContaVencida = (conta: any): boolean => {
    if (!conta || conta.tipo !== "PAGAR") return false;
    
    // Se já está paga ou cancelada, não está vencida
    const st = String(conta.status ?? "").toUpperCase();
    if (st === "PAGO_TOTAL" || st === "QUITADO" || st === "CANCELADO") return false;

    if (st === "VENCIDO") return true;
    
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
      const vencimento = parseDateOnlyLocal(conta.data_vencimento);
      if (!vencimento) return false;
      vencimento.setHours(0, 0, 0, 0);
      return vencimento < hoje;
    } catch {
      return false;
    }
  };

  // Função auxiliar para verificar se uma conta vence hoje
  const isContaVencendoHoje = (conta: any): boolean => {
    if (!conta || conta.tipo !== "PAGAR") return false;
    const stVh = String(conta.status ?? "").toUpperCase();
    if (stVh === "PAGO_TOTAL" || stVh === "QUITADO" || stVh === "CANCELADO") return false;
    if (!conta.data_vencimento) return false;
    
    try {
      // Usar dias_ate_vencimento do backend se disponível
      if (conta.dias_ate_vencimento !== undefined && conta.dias_ate_vencimento !== null) {
        return conta.dias_ate_vencimento === 0;
      }
      
      // Calcular manualmente
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const vencimento = parseDateOnlyLocal(conta.data_vencimento);
      if (!vencimento) return false;
      vencimento.setHours(0, 0, 0, 0);
      return vencimento.getTime() === hoje.getTime();
    } catch {
      return false;
    }
  };

  // Função auxiliar para verificar se uma conta vence este mês
  const isContaVencendoEsteMes = (conta: any): boolean => {
    if (!conta || conta.tipo !== "PAGAR") return false;
    const stM = String(conta.status ?? "").toUpperCase();
    if (stM === "PAGO_TOTAL" || stM === "QUITADO" || stM === "CANCELADO") return false;
    if (!conta.data_vencimento) return false;
    
    try {
      const hoje = new Date();
      const mesAtual = hoje.getMonth();
      const anoAtual = hoje.getFullYear();
      
      const vencimento = parseDateOnlyLocal(conta.data_vencimento);
      if (!vencimento) return false;
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
    const parseValor = (valor: any): number => {
      if (valor === null || valor === undefined || valor === '') return 0;
      const num = typeof valor === 'string' ? parseFloat(valor) : Number(valor);
      return isNaN(num) ? 0 : num;
    };

    // Cards filtráveis: quando há filtros ativos, usar resumo do mesmo filtro; senão dashboard global
    const source = resumoContasPagar ?? dashboardPagar;
    const totalPagar = resumoContasPagar
      ? Number(resumoContasPagar.valor_total_pendente ?? 0)
      : (parseValor(dashboardPagar?.valor_total_pendente) ?? 0);
    const totalPago = resumoContasPagar
      ? Number(resumoContasPagar.valor_total_pago_contabilizado ?? 0)
      : (parseValor(dashboardPagar?.valor_total_pago_contabilizado ?? dashboardPagar?.valor_total_pago) ?? 0);
    const totalVencidas = Number(source?.vencidas ?? 0);
    const totalVencendoHoje = Number(source?.vencendo_hoje ?? 0);
    const totalVencendoEsteMes = Number(source?.vencendo_este_mes ?? 0);
    const formatarMoedaCard = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

    return [
      { label: "Total a Pagar", value: formatarMoedaCard(totalPagar), icon: DollarSign, trend: null, trendUp: false, color: "text-orange-600", bgColor: "bg-orange-100", filterKey: "todos" as const },
      { label: "Total Pago", value: formatarMoedaCard(totalPago), icon: CheckCircle, trend: null, trendUp: false, color: "text-green-600", bgColor: "bg-green-100", filterKey: "valor_pago" as const },
      { label: "Vencidas", value: totalVencidas.toString(), icon: Calendar, trend: null, trendUp: false, color: "text-red-600", bgColor: "bg-red-100", filterKey: "vencidas" as const },
      { label: "Vencendo Hoje", value: totalVencendoHoje.toString(), icon: Calendar, trend: null, color: "text-amber-600", bgColor: "bg-amber-100", filterKey: "vencendo_hoje" as const },
      { label: "Vencendo Este Mês", value: totalVencendoEsteMes.toString(), icon: Calendar, trend: null, color: "text-blue-600", bgColor: "bg-blue-100", filterKey: "vencendo_este_mes" as const },
    ];
  }, [dashboardPagar, resumoContasPagar]);

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
      queryClient.invalidateQueries({ queryKey: ["dashboard-pagar"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-resumo-financeiro"] });
      toast.success("Conta a pagar registrada com sucesso!");
      setDialogOpen(false);
      setNewTransacao({
        tipo: "PAGAR",
        descricao: "",
        valor_original: 0,
        data_emissao: new Date().toISOString().split('T')[0],
        data_vencimento: "",
      });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Erro ao registrar conta a pagar");
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
      queryClient.invalidateQueries({ queryKey: ["dashboard-pagar"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-resumo-financeiro"] });
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
      
      console.error('❌ [ContasAPagar] Erro ao atualizar conta:', {
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
      queryClient.invalidateQueries({ queryKey: ["dashboard-pagar"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-resumo-financeiro"] });
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
      
      console.error('❌ [ContasAPagar] Erro ao atualizar status:', {
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
    if (editConta.fornecedor_id !== undefined && editConta.fornecedor_id !== null) {
      dadosAtualizacao.fornecedor_id = editConta.fornecedor_id;
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

    console.log('📝 [ContasAPagar] Atualizando conta:', { id: selectedContaId, data: dadosAtualizacao });

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

  // Mesmas cores de status de Contas a Receber
  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s === "pendente") return "bg-amber-500/10 text-amber-500";
    if (s === "em aberto" || s === "aberto") return "bg-blue-500/10 text-blue-500";
    if (s === "pago parcial" || s.includes("parcial")) return "bg-blue-500/10 text-blue-500";
    if (s === "quitado" || s === "concluído" || s === "concluido" || s === "pago total") return "bg-green-500/10 text-green-500";
    if (s === "vencido") return "bg-red-500/10 text-red-500";
    if (s === "cancelado") return "bg-slate-600/10 text-slate-600";
    return "bg-muted text-muted-foreground";
  };

  // Função para calcular dias até vencimento
  const calcularDiasAteVencimento = (dataVencimento: string): number | null => {
    if (!dataVencimento) return null;
    try {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const vencimento = parseDateOnlyLocal(dataVencimento);
      if (!vencimento) return null;
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
    const su = String(status ?? "").toUpperCase();
    if (su === "PAGO_TOTAL" || su === "QUITADO" || su === "CANCELADO") {
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

  // Mapear pedidos para o formato de exibição (novo formato - cada linha = 1 pedido)
  const transacoesDisplay = useMemo(() => {
    // Usar pedidos do novo endpoint se disponíveis
    if (pedidosContasPagarList.length > 0) {
      return pedidosContasPagarList.map((pedido: ContaPagar) => {
        const fornecedor = fornecedores.find(f => f.id === pedido.fornecedor_id);
        const nomeFornecedor = fornecedor?.nome_fantasia || fornecedor?.nome_razao || pedido.fornecedor_nome || "N/A";

        const valorTotal = Number(pedido.valor_total) || 0;
        const valorEmAbertoPedido = valorEmAbertoContaPagar(pedido);
        const valorPagoPedido = (pedido as any).valor_pago ?? (valorTotal - valorEmAbertoPedido);
        const valorFormatado = formatCurrency(valorTotal);
        const valorPagoFormatado = formatCurrency(valorPagoPedido);

        const dataFormatada = pedido.data_pedido
          ? formatDate(pedido.data_pedido)
          : "N/A";

        const statusFormatado = formatarStatus(pedido.status);
        const formaPagamentoFormatada = formatarFormaPagamento(pedido.forma_pagamento);

        // Calcular dias até vencimento: preferir data_vencimento quando existir
        const dataParaVencimento = pedido.data_vencimento || pedido.data_pedido;
        const diasAteVencimento = calcularDiasAteVencimento(dataParaVencimento);
        const vencimentoStatus = getVencimentoStatus(diasAteVencimento, pedido.status);

        return {
          id: pedido.numero_pedido || `PED-${pedido.pedido_id}`,
          descricao: `Pedido ${pedido.numero_pedido}`,
          categoria: "Compras",
          valor: valorFormatado,
          valorPago: valorPagoFormatado,
          data: dataFormatada,
          status: statusFormatado,
          statusOriginal: pedido.status,
          contaId: undefined as number | undefined,
          fornecedor: nomeFornecedor,
          formaPagamento: formaPagamentoFormatada,
          diasAteVencimento,
          vencimentoStatus,
          pedidoId: pedido.pedido_id,
          valorEmAberto: valorEmAbertoPedido,
          podePagar: podeExibirPagarPedido(pedido),
        };
      });
    }
    
    // Fallback: usar contas financeiras se não houver pedidos
    return contasFallback.map((conta) => {
      let nomeFornecedor = "N/A";
      let categoria = "N/A";
      
      if (conta.tipo === "PAGAR" && conta.fornecedor_id) {
        const fornecedor = fornecedores.find(f => f.id === conta.fornecedor_id);
        nomeFornecedor = fornecedor?.nome_fantasia || fornecedor?.nome_razao || "Fornecedor não encontrado";
        categoria = "Fornecedores";
      }

      const valorTotalConta = Number(conta.valor_original) || 0;
      const valorRestante = Number((conta as any).valor_restante) ?? Number((conta as any).valor_em_aberto) ?? 0;
      const valorPagoConta = (conta as any).valor_pago != null ? Number((conta as any).valor_pago) : Math.max(0, valorTotalConta - valorRestante);
      const valorFormatado = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(valorTotalConta);
      const valorPagoFormatado = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(valorPagoConta);

      const dataFormatada = conta.data_vencimento
        ? formatDate(conta.data_vencimento)
        : "N/A";

      const statusMap: Record<string, string> = {
        PENDENTE: "Pendente",
        ABERTO: "Pendente",
        PAGO_PARCIAL: "Pago Parcial",
        PARCIAL: "Pago Parcial",
        PAGO_TOTAL: "Pago Total",
        QUITADO: "Quitado",
        VENCIDO: "Vencido",
        CANCELADO: "Cancelado",
      };
      const statusFormatado = statusMap[conta.status] || conta.status;

      const diasAteVencimento = conta.dias_ate_vencimento !== undefined 
        ? conta.dias_ate_vencimento 
        : calcularDiasAteVencimento(conta.data_vencimento);
      
      let vencimentoStatus: { texto: string; cor: string; bgColor: string };
      
      if (conta.status === "PAGO_TOTAL" || conta.status === "CANCELADO") {
        vencimentoStatus = { texto: "", cor: "", bgColor: "" };
      } else if (conta.status_vencimento && conta.proximidade_vencimento) {
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
        vencimentoStatus = getVencimentoStatus(diasAteVencimento, conta.status);
      }

      const vrRaw = (conta as any).valor_restante;
      const veRaw = (conta as any).valor_em_aberto;
      const abertoFallback =
        vrRaw != null && vrRaw !== ""
          ? Math.max(0, Number(vrRaw))
          : veRaw != null && veRaw !== ""
            ? Math.max(0, Number(veRaw))
            : Math.max(0, valorTotalConta - valorPagoConta);
      const stO = String(conta.status ?? "").toUpperCase();
      const podePagarConta =
        abertoFallback > 0.009 &&
        stO !== "QUITADO" &&
        stO !== "PAGO_TOTAL" &&
        stO !== "CANCELADO";

      return {
        id: conta.numero_conta || `CONTA-${conta.id}`,
        descricao: conta.descricao,
        categoria: categoria,
        valor: valorFormatado,
        valorPago: valorPagoFormatado,
        data: dataFormatada,
        status: statusFormatado,
        statusOriginal: conta.status,
        contaId: conta.id,
        fornecedor: nomeFornecedor,
        diasAteVencimento,
        vencimentoStatus,
        valorEmAberto: abertoFallback,
        podePagar: podePagarConta,
      };
    });
  }, [pedidosContasPagarList, contasFallback, fornecedores]);

  // Busca: em Contas a Pagar a lista vem de PEDIDOS (COMP-2026-00001, etc.), não de contas.
  // Só buscar conta por ID quando estivermos no fallback (lista de contas); senão filtrar por texto no número do pedido.
  const isNumericSearch = !isNaN(Number(searchTerm)) && searchTerm.trim() !== "";
  const searchId = isNumericSearch ? Number(searchTerm) : null;
  const usaListaPedidos = pedidosContasPagarList.length > 0;

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
    enabled: !!searchId && isNumericSearch && !usaListaPedidos,
    retry: false,
  });

  // Filtrar por busca, tab ativa e card clicável (como Contas a Receber)
  const filteredTransacoes = useMemo(() => {
    let filtered = transacoesDisplay;

    // Filtro por card clicável
    if (activeCardFilter !== "todos") {
      filtered = filtered.filter((t: any) => {
        const dias = t.diasAteVencimento;
        const status = (t.statusOriginal || "").toUpperCase();
        if (activeCardFilter === "vencidas") return dias != null && dias < 0;
        if (activeCardFilter === "vencendo_hoje") return dias === 0;
        if (activeCardFilter === "vencendo_este_mes") return dias != null && dias >= 1 && dias <= 30;
        if (activeCardFilter === "valor_pago") return status === "PARCIAL" || status === "QUITADO";
        return true;
      });
    }

    // Filtrar por tab ativa (especialmente para Vencidas e Vencendo Hoje)
    if (activeTab === "VENCIDO") {
      filtered = filtered.filter(t => {
        const conta = contasFallback.find((c) => c.id === t.contaId);
        if (!conta) return false;
        return isContaVencida(conta);
      });
    } else if (activeTab === "VENCE_HOJE") {
      filtered = filtered.filter(t => {
        const conta = contasFallback.find((c) => c.id === t.contaId);
        if (!conta) return false;
        return isContaVencendoHoje(conta);
      });
    }

    // Busca numérica por ID
    if (isNumericSearch && contaPorId && contaPorId.tipo === "PAGAR") {
      const contaEncontrada = contasFallback.find((c) => c.id === contaPorId.id);
      if (contaEncontrada) {
        const conta = contaEncontrada;
        let nomeFornecedor = "N/A";
        let categoria = "N/A";
        
        if (conta.fornecedor_id) {
          const fornecedor = fornecedores.find(f => f.id === conta.fornecedor_id);
          nomeFornecedor = fornecedor?.nome_fantasia || fornecedor?.nome_razao || "Fornecedor não encontrado";
          categoria = "Fornecedores";
        }

        const valorTotalConta = Number(conta.valor_original) || 0;
        const valorRestante = Number((conta as any).valor_restante) ?? Number((conta as any).valor_em_aberto) ?? 0;
        const valorPagoConta = (conta as any).valor_pago != null ? Number((conta as any).valor_pago) : Math.max(0, valorTotalConta - valorRestante);
        const valorFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorTotalConta);
        const valorPagoFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorPagoConta);

        const dataFormatada = conta.data_vencimento
          ? formatDate(conta.data_vencimento)
          : "N/A";

        const statusMap: Record<string, string> = {
          PENDENTE: "Pendente",
          ABERTO: "Pendente",
          PAGO_PARCIAL: "Pago Parcial",
          PARCIAL: "Pago Parcial",
          PAGO_TOTAL: "Pago Total",
          QUITADO: "Quitado",
          VENCIDO: "Vencido",
          CANCELADO: "Cancelado",
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
          valorPago: valorPagoFormatado,
          data: dataFormatada,
          status: statusFormatado,
          statusOriginal: conta.status,
          contaId: conta.id,
          fornecedor: nomeFornecedor,
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
        t.fornecedor.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
    }

    return filtered;
  }, [transacoesDisplay, searchTerm, isNumericSearch, contaPorId, contasFallback, fornecedores, activeTab, activeCardFilter]);

  const handleCreate = () => {
    if (!newTransacao.descricao || !newTransacao.valor_original || !newTransacao.data_vencimento) {
      toast.error("Preencha os campos obrigatórios (Descrição, Valor e Data de Vencimento)");
      return;
    }

    const contaData: CreateContaFinanceiraDto = {
      tipo: "PAGAR",
      descricao: newTransacao.descricao,
      valor_original: Number(newTransacao.valor_original),
      data_emissao: newTransacao.data_emissao,
      data_vencimento: newTransacao.data_vencimento,
      fornecedor_id: newTransacao.fornecedor_id || undefined,
      pedido_id: newTransacao.pedido_id || undefined,
      forma_pagamento: newTransacao.forma_pagamento || undefined,
      data_pagamento: newTransacao.data_pagamento || undefined,
      observacoes: newTransacao.observacoes || undefined,
    };

    createContaMutation.mutate(contaData);
  };

  return (
    <AppLayout>
      <div className="p-3 sm:p-4 md:p-6 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Contas a Pagar</h1>
            <p className="text-muted-foreground">Gerencie suas contas a pagar</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nova Conta a Pagar</DialogTitle>
                <DialogDescription>
                  Preencha os campos abaixo para registrar uma nova conta a pagar.
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
                      placeholder="Ex: Pagamento de fornecedor"
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
                              {fornecedor.nome_fantasia || fornecedor.nome_razao}
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
                          {pedidos
                            .filter((pedido) => pedido.pedido_id != null)
                            .map((pedido) => (
                              <SelectItem key={pedido.pedido_id} value={String(pedido.pedido_id)}>
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
                      placeholder="Observações adicionais sobre a conta a pagar"
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
                    "Registrar Conta a Pagar"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {isLoadingPagar ? (
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
                className={`bg-card rounded-xl p-5 border transition-shadow min-w-0 cursor-pointer hover:shadow-md ${
                  activeCardFilter === stat.filterKey
                    ? "border-primary border-2 shadow-md ring-2 ring-primary/20"
                    : "border-border"
                }`}
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

        {/* Search and Filters (mesmo design de Contas a Receber) */}
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
                  {(fornecedorFilterId != null && fornecedorFilterId > 0 ? 1 : 0) +
                    (statusFilter ? 1 : 0) +
                    (dataInicialFilter ? 1 : 0) +
                    (dataFinalFilter ? 1 : 0)}
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
                  {/* Fornecedor */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">Fornecedor</Label>
                    <Select
                      value={fornecedorFilterId == null ? "todos" : String(fornecedorFilterId)}
                      onValueChange={(v) => setFornecedorFilterId(v === "todos" ? null : parseInt(v, 10))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os fornecedores" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os fornecedores</SelectItem>
                        {fornecedores.map((f) => (
                          <SelectItem key={f.id} value={String(f.id)}>
                            {f.nome_fantasia || f.nome_razao}
                          </SelectItem>
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
                            onChange={(e) => setDataInicialFilter(e.target.value || "")}
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
                            onChange={(e) => setDataFinalFilter(e.target.value || "")}
                          />
                        </div>
                      </div>
                    </div>
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
                        <RadioGroupItem value="todos" id="status-todos-pagar" />
                        <Label htmlFor="status-todos-pagar" className="flex items-center gap-2 cursor-pointer flex-1">
                          <Circle className="w-3 h-3 text-primary" />
                          <span>Todos</span>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="ABERTO" id="status-aberto-pagar" />
                        <Label htmlFor="status-aberto-pagar" className="flex items-center gap-2 cursor-pointer flex-1">
                          <Circle className="w-3 h-3 text-amber-500" />
                          <span>Pendente</span>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="PARCIAL" id="status-parcial-pagar" />
                        <Label htmlFor="status-parcial-pagar" className="flex items-center gap-2 cursor-pointer flex-1">
                          <Circle className="w-3 h-3 text-blue-500" />
                          <span>Aberto</span>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="QUITADO" id="status-quitado-pagar" />
                        <Label htmlFor="status-quitado-pagar" className="flex items-center gap-2 cursor-pointer flex-1">
                          <Circle className="w-3 h-3 text-green-500" />
                          <span>Quitado</span>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="VENCIDO" id="status-vencido-pagar" />
                        <Label htmlFor="status-vencido-pagar" className="flex items-center gap-2 cursor-pointer flex-1">
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
                placeholder="Buscar por número do pedido, fornecedor..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" className="gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Relatórios
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Relatórios</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setRelatorioFornecedorPdfOpen(true)}>
                  Relatório financeiro por fornecedor
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
                <TableHead>Fornecedor</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Valor Pago</TableHead>
                <TableHead>Data Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(isLoadingPedidosContasPagar || isLoadingContasFallback) ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Carregando contas...
                    </div>
                  </TableCell>
                </TableRow>
              ) : (dataInicialFilter || dataFinalFilter) && !isLoadingPedidosContasPagar && pedidosContasPagarList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <DollarSign className="w-12 h-12 text-muted-foreground/50" />
                      <p className="text-muted-foreground">Não há contas no período selecionado.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredTransacoes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <DollarSign className="w-12 h-12 text-muted-foreground/50" />
                      <p className="text-muted-foreground">
                        {(statusFilter || (activeTab && activeTab !== "Todos"))
                          ? (() => {
                              const labelPorStatus: Record<string, string> = {
                                ABERTO: "Pendente",
                                PARCIAL: "Aberto",
                                QUITADO: "Quitado",
                                VENCIDO: "Vencido",
                                PENDENTE: "Pendente",
                                PAGO_PARCIAL: "Pago Parcial",
                                PAGO_TOTAL: "Pago Total",
                                VENCE_HOJE: "Vencendo Hoje",
                                CANCELADO: "Cancelado",
                              };
                              const statusAtivo = statusFilter || activeTab;
                              const label = labelPorStatus[statusAtivo] || statusAtivo;
                              return `Não há pedidos com o status "${label}".`;
                            })()
                          : fornecedorFilterId != null && fornecedorFilterId > 0
                          ? "Não há pedidos ou contas desse fornecedor."
                          : transacoesDisplay.length === 0 && !isLoadingPedidosContasPagar
                          ? "Não há contas a pagar no momento"
                          : dashboardPagar?.total === 0
                          ? "Nenhuma conta a pagar em aberto"
                          : "Nenhuma conta a pagar encontrada"}
                      </p>
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
                      <span className="text-sm text-muted-foreground">{transacao.fornecedor}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{transacao.valor}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{(transacao as any).valorPago ?? '—'}</span>
                    </TableCell>
                    <TableCell>
                      {transacao.status === "Concluído" || transacao.status === "Cancelado" ? (
                        <span className="text-sm text-muted-foreground">--</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">{transacao.data}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {/* Status do pedido - não editável diretamente, apenas visualização */}
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
                            if ((transacao as any).pedidoId) {
                              navigate(`/financeiro/contas-pagar/${(transacao as any).pedidoId}`);
                            } else {
                              setSelectedContaId(transacao.contaId);
                              setViewDialogOpen(true);
                            }
                          }}>
                            <Eye className="w-4 h-4 mr-2" />
                            Ver detalhes
                          </DropdownMenuItem>
                          {(transacao as any).podePagar &&
                            ((transacao as any).pedidoId ? (
                              <DropdownMenuItem
                                onClick={() =>
                                  navigate(
                                    `/financeiro/contas-pagar/${(transacao as any).pedidoId}/pagamentos`,
                                  )
                                }
                              >
                                <DollarSign className="w-4 h-4 mr-2" />
                                Pagamentos
                              </DropdownMenuItem>
                            ) : transacao.contaId ? (
                              <DropdownMenuItem
                                onClick={() =>
                                  navigate(
                                    `/financeiro/contas-pagar/conta/${transacao.contaId}/pagamentos`,
                                  )
                                }
                              >
                                <DollarSign className="w-4 h-4 mr-2" />
                                Pagamentos
                              </DropdownMenuItem>
                            ) : null)}
                          <DropdownMenuItem
                            onClick={async () => {
                              try {
                                // Lista por pedidos: sempre obter conta pelo pedidoId (contaId na linha é pedido_id, não conta financeira)
                                let contaId: number | null = null;
                                if ((transacao as any).pedidoId != null) {
                                  contaId = await financeiroService.getContaIdPorPedidoId((transacao as any).pedidoId, 'PAGAR');
                                } else {
                                  contaId = transacao.contaId ?? null;
                                }
                                if (contaId == null) {
                                  toast.error('Conta financeira não encontrada para este item.');
                                  return;
                                }
                                await financeiroService.downloadReciboPagamento(contaId);
                                toast.success('Recibo de pagamento baixado.');
                              } catch (e) {
                                toast.error(e instanceof Error ? e.message : 'Erro ao gerar recibo.');
                              }
                            }}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Recibo de pagamento
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
                Mostrando {pedidosContasPagarList.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} a {Math.min(currentPage * pageSize, totalPedidos)} de {totalPedidos} pedidos
              </div>
            </div>
          )}
        </motion.div>

        {/* Dialog de Visualização - Similar ao Financeiro.tsx mas simplificado */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                Detalhes da Conta a Pagar
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
                    <Label className="text-muted-foreground">Fornecedor</Label>
                    <p className="text-sm font-medium">
                      {contaSelecionada.fornecedor_id 
                        ? fornecedores.find(f => f.id === contaSelecionada.fornecedor_id)?.nome_fantasia || `ID: ${contaSelecionada.fornecedor_id}`
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

        {/* Dialog de Edição - Similar ao Financeiro.tsx mas simplificado */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-primary" />
                Editar Conta a Pagar
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
                      placeholder="Ex: Pagamento de fornecedor"
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
        <Dialog
          open={relatorioFornecedorPdfOpen}
          onOpenChange={(open) => {
            setRelatorioFornecedorPdfOpen(open);
            if (open) {
              setRelatorioFornecedorDataInicial("");
              setRelatorioFornecedorDataFinal("");
              setRelatorioFornecedorStatusFiltro("Todos");
              setRelatorioFornecedorIdSelect(
                fornecedorFilterId != null ? String(fornecedorFilterId) : "",
              );
            }
          }}
        >
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Relatório financeiro por fornecedor</DialogTitle>
              <DialogDescription>
                Inclui dados da empresa, cadastro do fornecedor e lançamentos das contas financeiras
                vinculadas a ele (campos já existentes no sistema).
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="relatorio-fornecedor-select">Fornecedor</Label>
                <Select
                  value={relatorioFornecedorIdSelect}
                  onValueChange={setRelatorioFornecedorIdSelect}
                >
                  <SelectTrigger id="relatorio-fornecedor-select">
                    <SelectValue placeholder="Selecione o fornecedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {fornecedores.map((f) => (
                      <SelectItem key={f.id} value={String(f.id)}>
                        {f.nome_fantasia || f.nome_razao}
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
                      <Input
                        type="date"
                        className="rounded-lg border-border/80 bg-muted/50"
                        value={relatorioFornecedorDataInicial}
                        onChange={(e) => setRelatorioFornecedorDataInicial(e.target.value || "")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Data Final</Label>
                      <Input
                        type="date"
                        className="rounded-lg border-border/80 bg-muted/50"
                        value={relatorioFornecedorDataFinal}
                        onChange={(e) => setRelatorioFornecedorDataFinal(e.target.value || "")}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-[#1A3B70]">Status</Label>
                  <RadioGroup
                    value={relatorioFornecedorStatusFiltro}
                    onValueChange={setRelatorioFornecedorStatusFiltro}
                    className="space-y-2"
                  >
                    <div className="flex items-center space-x-2"><RadioGroupItem value="Todos" id="relatorio-fornecedor-status-todos" /><Label htmlFor="relatorio-fornecedor-status-todos" className="cursor-pointer">Todos</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="PENDENTE" id="relatorio-fornecedor-status-pendente" /><Label htmlFor="relatorio-fornecedor-status-pendente" className="cursor-pointer">Pendente</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="PAGO_PARCIAL" id="relatorio-fornecedor-status-parcial" /><Label htmlFor="relatorio-fornecedor-status-parcial" className="cursor-pointer">Pago Parcial</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="PAGO_TOTAL" id="relatorio-fornecedor-status-quitado" /><Label htmlFor="relatorio-fornecedor-status-quitado" className="cursor-pointer">Quitada</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="VENCIDO" id="relatorio-fornecedor-status-vencido" /><Label htmlFor="relatorio-fornecedor-status-vencido" className="cursor-pointer">Vencido</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="CANCELADO" id="relatorio-fornecedor-status-cancelado" /><Label htmlFor="relatorio-fornecedor-status-cancelado" className="cursor-pointer">Cancelado</Label></div>
                  </RadioGroup>
                </div>
              </div>

              {relatorioFornecedorPreviewFetching &&
                relatorioFornecedorIdParsed != null && (
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verificando filtros…
                  </p>
                )}

              {relatorioFornecedorPreviewError &&
                relatorioFornecedorIdParsed != null && (
                  <p className="text-sm text-destructive">
                    Não foi possível verificar os filtros. Tente novamente.
                  </p>
                )}

              {!relatorioFornecedorPreviewFetching &&
                !relatorioFornecedorPreviewError &&
                relatorioFornecedorIdParsed != null &&
                relatorioFornecedorPreviewData?.total === 0 && (
                  <p className="rounded-lg border border-border/80 bg-muted/20 px-3 py-2 text-sm text-[#1A3B70]">
                    {relatorioFornecedorMensagemSemDados}
                  </p>
                )}

              <div className="space-y-2">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                  <Button
                    type="button"
                    variant="relatorioPrimary"
                    className="flex-1 gap-2"
                    disabled={
                      relatorioFornecedorIdParsed == null ||
                      relatorioFornecedorPreviewFetching ||
                      !relatorioFornecedorTemDados ||
                      relatorioFornecedorPdfLoading
                    }
                    onClick={async () => {
                      const id = relatorioFornecedorIdParsed;
                      if (id == null) {
                        toast.error("Selecione um fornecedor.");
                        return;
                      }
                      setRelatorioFornecedorPdfLoading(true);
                      try {
                        await relatoriosClienteService.downloadRelatorioFinanceiroFornecedor(
                          id,
                          relatorioFornecedorFiltrosForPdf,
                        );
                        toast.success("PDF baixado.");
                      } catch (e: unknown) {
                        const msg =
                          e instanceof Error ? e.message : "Erro ao gerar PDF.";
                        toast.error(msg);
                      } finally {
                        setRelatorioFornecedorPdfLoading(false);
                      }
                    }}
                  >
                    {relatorioFornecedorPdfLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    Baixar PDF
                  </Button>
                  <Button
                    type="button"
                    variant="relatorioSecondary"
                    className="flex-1 gap-2"
                    disabled={
                      relatorioFornecedorIdParsed == null ||
                      relatorioFornecedorPreviewFetching ||
                      !relatorioFornecedorTemDados ||
                      relatorioFornecedorPdfLoading
                    }
                    onClick={async () => {
                      const id = relatorioFornecedorIdParsed;
                      if (id == null) {
                        toast.error("Selecione um fornecedor.");
                        return;
                      }
                      setRelatorioFornecedorPdfLoading(true);
                      try {
                        await relatoriosClienteService.imprimirRelatorioFinanceiroFornecedor(
                          id,
                          relatorioFornecedorFiltrosForPdf,
                        );
                      } catch (e: unknown) {
                        const msg =
                          e instanceof Error ? e.message : "Erro ao abrir PDF.";
                        toast.error(msg);
                      } finally {
                        setRelatorioFornecedorPdfLoading(false);
                      }
                    }}
                  >
                    <Printer className="h-4 w-4" />
                    Abrir para imprimir
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}

export default ContasAPagar;
