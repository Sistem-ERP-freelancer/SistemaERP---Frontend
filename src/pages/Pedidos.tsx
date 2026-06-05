import AppLayout from '@/components/layout/AppLayout';
import OrderForm from '@/components/orders/OrderForm';
import { OrderList } from '@/components/orders/OrderList';
import { OrderStats } from '@/components/orders/OrderStats';
import { OrderViewDialog } from '@/components/orders/OrderViewDialog';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { useOrders } from '@/hooks/useOrders';
import { useRelatorioPedidos } from '@/hooks/useRelatorioPedidos';
import { formatCurrency, normalizeCurrency } from '@/lib/utils';
import { controleRocaService } from '@/services/controle-roca.service';
import { pedidosService } from '@/services/pedidos.service';
import { CreatePedidoDto, StatusPedido, TipoPedido } from '@/types/pedido';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar,
  Circle,
  Download,
  FileText,
  Filter,
  Loader2,
  Plus,
  Printer,
  Search,
  XCircle,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

export default function Pedidos() {
  const {
    orders,
    totalOrders,
    currentPage,
    totalPages,
    filters,
    isLoading,
    isFormOpen,
    isViewDialogOpen,
    isCancelDialogOpen,
    selectedOrder,
    selectedOrderForEdit,
    orderToCancel,
    clientes,
    fornecedores,
    produtos,
    transportadoras,
    isCreating,
    isUpdating,
    isCanceling,
    updatingStatusId,
    handleStatusChange,
    setCurrentPage,
    updateFilters,
    clearFilters,
    openCreateForm,
    openEditForm,
    openViewDialog,
    openCancelDialog,
    createOrder,
    updateOrder,
    cancelOrder,
    closeForm,
    closeViewDialog,
    closeCancelDialog,
  } = useOrders();

  const { downloadRelatorio, loading: loadingRelatorio } = useRelatorioPedidos();

  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [filtrosDialogOpen, setFiltrosDialogOpen] = useState(false);
  const [dataInicialMargem, setDataInicialMargem] = useState('');
  const [dataFinalMargem, setDataFinalMargem] = useState('');
  const [periodoRapidoAtivo, setPeriodoRapidoAtivo] = useState<
    'custom' | 'hoje' | 'ontem' | '7d' | 'mes_atual' | 'mes_anterior'
  >('custom');
  const [loadingMargemPdf, setLoadingMargemPdf] = useState(false);
  const [margemDialogOpen, setMargemDialogOpen] = useState(false);
  const [margemLoadingAction, setMargemLoadingAction] = useState<'download' | 'print' | null>(null);
  const [reportingOrderId, setReportingOrderId] = useState<number | null>(null);
  const [relatorioPedidosDialogOpen, setRelatorioPedidosDialogOpen] = useState(false);
  const [dataInicialRelPed, setDataInicialRelPed] = useState('');
  const [dataFinalRelPed, setDataFinalRelPed] = useState('');
  const [periodoRapidoRelPed, setPeriodoRapidoRelPed] = useState<
    'custom' | 'hoje' | 'ontem' | '7d' | 'mes_atual' | 'mes_anterior'
  >('mes_atual');
  const [clienteRelPed, setClienteRelPed] = useState<string>('all');
  const [fornecedorRelPed, setFornecedorRelPed] = useState<string>('all');
  const [rocaRelPed, setRocaRelPed] = useState<string>('all');
  const [relPedLoadingAction, setRelPedLoadingAction] = useState<'download' | 'print' | null>(null);
  const [relatoriosDialogOpen, setRelatoriosDialogOpen] = useState(false);
  const [filtroParceiro, setFiltroParceiro] = useState<string>('all');
  const [periodoRapidoLista, setPeriodoRapidoLista] = useState<
    'all' | 'hoje' | '7d' | 'mes_atual' | 'custom'
  >('all');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUpdatingFromFiltersRef = useRef(false);

  const toYMD = (d: Date) => d.toISOString().slice(0, 10);
  const hoje = toYMD(new Date());
  const ontem = toYMD((() => { const d = new Date(); d.setDate(d.getDate() - 1); return d; })());
  const ultimos7 = (() => { const d = new Date(); d.setDate(d.getDate() - 6); return toYMD(d); })();
  const mesAtualInicio = (() => { const d = new Date(); d.setDate(1); return toYMD(d); })();
  const mesAnteriorInicio = (() => { const d = new Date(); d.setMonth(d.getMonth() - 1); d.setDate(1); return toYMD(d); })();
  const mesAnteriorFim = (() => { const d = new Date(); d.setDate(0); return toYMD(d); })();

  const aplicarPeriodoRapidoRelPed = (
    tipo: 'hoje' | 'ontem' | '7d' | 'mes_atual' | 'mes_anterior',
  ) => {
    let inicial: string;
    let final: string;
    switch (tipo) {
      case 'hoje':
        inicial = hoje;
        final = hoje;
        break;
      case 'ontem':
        inicial = ontem;
        final = ontem;
        break;
      case '7d':
        inicial = ultimos7;
        final = hoje;
        break;
      case 'mes_atual':
        inicial = mesAtualInicio;
        final = hoje;
        break;
      case 'mes_anterior':
        inicial = mesAnteriorInicio;
        final = mesAnteriorFim;
        break;
    }
    setDataInicialRelPed(inicial);
    setDataFinalRelPed(final);
    setPeriodoRapidoRelPed(tipo);
  };

  const montarFiltrosRelatorioPedidos = () => ({
    data_inicial: dataInicialRelPed?.trim() || undefined,
    data_final: dataFinalRelPed?.trim() || undefined,
    cliente_id:
      clienteRelPed !== 'all' ? Number(clienteRelPed) : undefined,
    fornecedor_id:
      fornecedorRelPed !== 'all' ? Number(fornecedorRelPed) : undefined,
    roca_id: rocaRelPed !== 'all' ? Number(rocaRelPed) : undefined,
  });

  const abrirDialogRelatorioPedidos = () => {
    if (!dataInicialRelPed && !dataFinalRelPed) {
      aplicarPeriodoRapidoRelPed('mes_atual');
    }
    setRelatorioPedidosDialogOpen(true);
  };

  const aplicarPeriodoRapido = (tipo: 'hoje' | 'ontem' | '7d' | 'mes_atual' | 'mes_anterior') => {
    let inicial: string;
    let final: string;
    switch (tipo) {
      case 'hoje':
        inicial = hoje;
        final = hoje;
        break;
      case 'ontem':
        inicial = ontem;
        final = ontem;
        break;
      case '7d':
        inicial = ultimos7;
        final = hoje;
        break;
      case 'mes_atual':
        inicial = mesAtualInicio;
        final = hoje;
        break;
      case 'mes_anterior':
        inicial = mesAnteriorInicio;
        final = mesAnteriorFim;
        break;
    }
    setDataInicialMargem(inicial);
    setDataFinalMargem(final);
    setPeriodoRapidoAtivo(tipo);
    // Período usado apenas para o relatório de margem (PDF); não altera os filtros da lista de pedidos.
  };

  const handleDownloadMargemPdf = async () => {
    setLoadingMargemPdf(true);
    try {
      // Período do relatório vem apenas do bloco (datas + botões); não usa filtros da lista de pedidos.
      const dataInicial = dataInicialMargem?.trim() || undefined;
      const dataFinal = dataFinalMargem?.trim() || undefined;
      await pedidosService.downloadRelatorioMargemContribuicaoPdf(
        dataInicial,
        dataFinal
      );
      toast.success('Relatório de Margem de Contribuição baixado.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao gerar relatório.');
    } finally {
      setLoadingMargemPdf(false);
    }
  };

  const { data: rocasFiltro = [] } = useQuery({
    queryKey: ['pedidos', 'rocas-filtro'],
    queryFn: () => controleRocaService.listarRocas(undefined, false, { limit: 500 }),
  });

  const temFiltrosAtivos = !!(
    filters.data_inicial ||
    filters.data_final ||
    filters.tipo ||
    filters.status ||
    filters.roca_id ||
    filters.somente_com_roca
  );
  const handleAplicarFiltros = () => setFiltrosDialogOpen(false);
  const handleLimparFiltros = () => {
    updateFilters({
      data_inicial: undefined,
      data_final: undefined,
      tipo: undefined,
      status: undefined,
      roca_id: undefined,
      somente_com_roca: undefined,
      cliente_id: undefined,
      fornecedor_id: undefined,
      busca: undefined,
      numero_pedido: undefined,
      cliente_nome: undefined,
    });
    setSearchTerm('');
    setFiltroParceiro('all');
    setPeriodoRapidoLista('all');
    setFiltrosDialogOpen(false);
  };

  const aplicarPeriodoLista = (
    tipo: 'all' | 'hoje' | '7d' | 'mes_atual' | 'custom',
  ) => {
    setPeriodoRapidoLista(tipo);
    if (tipo === 'all') {
      updateFilters({ data_inicial: undefined, data_final: undefined });
      return;
    }
    if (tipo === 'hoje') {
      updateFilters({ data_inicial: hoje, data_final: hoje });
      return;
    }
    if (tipo === '7d') {
      updateFilters({ data_inicial: ultimos7, data_final: hoje });
      return;
    }
    if (tipo === 'mes_atual') {
      updateFilters({ data_inicial: mesAtualInicio, data_final: hoje });
    }
  };

  const handleFiltroParceiro = (value: string) => {
    setFiltroParceiro(value);
    if (value === 'all') {
      updateFilters({ cliente_id: undefined, fornecedor_id: undefined });
    } else if (value.startsWith('c-')) {
      updateFilters({
        cliente_id: Number(value.slice(2)),
        fornecedor_id: undefined,
      });
    } else if (value.startsWith('f-')) {
      updateFilters({
        fornecedor_id: Number(value.slice(2)),
        cliente_id: undefined,
      });
    }
  };

  const tabTipo =
    filters.tipo === 'VENDA'
      ? 'venda'
      : filters.tipo === 'COMPRA'
        ? 'compra'
        : 'todos';

  const handleTabTipo = (tab: string) => {
    if (tab === 'todos') updateFilters({ tipo: undefined });
    else if (tab === 'venda') updateFilters({ tipo: 'VENDA' as TipoPedido });
    else updateFilters({ tipo: 'COMPRA' as TipoPedido });
  };

  const inicioItem = totalOrders === 0 ? 0 : (currentPage - 1) * 15 + 1;
  const fimItem = Math.min(currentPage * 15, totalOrders);

  // Sincronizar searchTerm com os filtros quando os filtros mudarem externamente
  useEffect(() => {
    if (isUpdatingFromFiltersRef.current) return;
    const valor = filters.busca ?? filters.numero_pedido ?? filters.cliente_nome ?? '';
    if (valor && searchTerm !== valor) setSearchTerm(valor);
    else if (!valor && searchTerm) setSearchTerm('');
  }, [filters.busca, filters.numero_pedido, filters.cliente_nome]);

  // Fechar o diálogo de exclusão quando o cancelamento for bem-sucedido
  useEffect(() => {
    if (!isCancelDialogOpen && !isCanceling) {
      setIsDeleteDialogOpen(false);
    }
  }, [isCancelDialogOpen, isCanceling]);

  // Limpar timeout quando o componente desmontar
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(() => {
      isUpdatingFromFiltersRef.current = true;
      if (value.trim()) {
        updateFilters({
          busca: value.trim(),
          numero_pedido: undefined,
          cliente_nome: undefined,
        });
      } else {
        updateFilters({ busca: undefined, numero_pedido: undefined, cliente_nome: undefined });
      }
      setTimeout(() => { isUpdatingFromFiltersRef.current = false; }, 100);
    }, 300);
  };

  const handleCancelConfirm = () => {
    if (orderToCancel) {
      cancelOrder(orderToCancel);
    }
  };

  const handleDeleteConfirm = () => {
    if (orderToCancel) {
      cancelOrder(orderToCancel);
      // O diálogo será fechado automaticamente pelo hook quando a exclusão for bem-sucedida
    }
  };

  const handleOpenDeleteDialog = (order: any) => {
    openCancelDialog(order);
    setIsDeleteDialogOpen(true);
  };

  const handleDownloadRelatorioPedido = async (order: (typeof orders)[number]) => {
    setReportingOrderId(order.id);
    try {
      await pedidosService.downloadRelatorioPedidoPdf(
        order.id,
        order.numero_pedido,
      );
      toast.success(`Relatório do pedido ${order.numero_pedido} baixado.`);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Erro ao gerar relatório do pedido';
      toast.error(message);
    } finally {
      setReportingOrderId(null);
    }
  };

  const handleOrderSubmit = (data: CreatePedidoDto) => {
    if (selectedOrder) {
      updateOrder(selectedOrder.id, data);
    } else {
      createOrder(data);
    }
  };

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 min-w-0 max-w-[1600px] mx-auto">
        {/* Cabeçalho */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
          <div className="space-y-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                Pedidos
              </h1>
              <p className="text-muted-foreground mt-1">
                Gestão completa de vendas e compras
              </p>
            </div>
            <Tabs value={tabTipo} onValueChange={handleTabTipo}>
              <TabsList className="bg-muted/60 h-9">
                <TabsTrigger value="todos" className="text-xs sm:text-sm px-4">
                  Todos
                </TabsTrigger>
                <TabsTrigger value="venda" className="text-xs sm:text-sm px-4">
                  Vendas
                </TabsTrigger>
                <TabsTrigger value="compra" className="text-xs sm:text-sm px-4">
                  Compras
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button
              variant="outline"
              className="gap-2 bg-background shadow-sm"
              onClick={() => setRelatoriosDialogOpen(true)}
            >
              <FileText className="w-4 h-4" />
              Relatórios
            </Button>
            <Button onClick={openCreateForm} variant="gradient" className="gap-2 shadow-sm">
              <Plus className="w-4 h-4" />
              Novo Pedido
            </Button>
          </div>
        </div>

        <OrderStats variant="hero" />

        {/* Barra de busca e filtros */}
        <div className="bg-card rounded-xl border border-border/80 shadow-sm p-4 mb-4">
          <div className="flex flex-col gap-3">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número, cliente, fornecedor ou roça..."
                className="pl-10 h-10 bg-background"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-col lg:flex-row lg:items-center gap-2 flex-wrap">
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) =>
                  updateFilters({
                    status: value === 'all' ? undefined : (value as StatusPedido),
                  })
                }
              >
                <SelectTrigger className="w-full sm:w-[140px] h-9 bg-background">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Status</SelectItem>
                  <SelectItem value="ABERTO">Pendente</SelectItem>
                  <SelectItem value="PARCIAL">Aberto</SelectItem>
                  <SelectItem value="QUITADO">Quitado</SelectItem>
                  <SelectItem value="CANCELADO">Cancelado</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filtroParceiro} onValueChange={handleFiltroParceiro}>
                <SelectTrigger className="w-full sm:w-[200px] h-9 bg-background">
                  <SelectValue placeholder="Cliente / Fornecedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Cliente / Fornecedor</SelectItem>
                  {clientes.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                        Clientes
                      </div>
                      {clientes.map((c) => (
                        <SelectItem key={`c-${c.id}`} value={`c-${c.id}`}>
                          {c.nome}
                        </SelectItem>
                      ))}
                    </>
                  )}
                  {fornecedores.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                        Fornecedores
                      </div>
                      {fornecedores.map((f) => (
                        <SelectItem key={`f-${f.id}`} value={`f-${f.id}`}>
                          {f.nome_fantasia || f.nome_razao}
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>

              <Select
                value={periodoRapidoLista}
                onValueChange={(v) =>
                  aplicarPeriodoLista(v as typeof periodoRapidoLista)
                }
              >
                <SelectTrigger className="w-full sm:w-[150px] h-9 bg-background">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Período</SelectItem>
                  <SelectItem value="hoje">Hoje</SelectItem>
                  <SelectItem value="7d">Últimos 7 dias</SelectItem>
                  <SelectItem value="mes_atual">Mês atual</SelectItem>
                  <SelectItem value="custom">Personalizado…</SelectItem>
                </SelectContent>
              </Select>

              {periodoRapidoLista === 'custom' && (
                <>
                  <Input
                    type="date"
                    className="w-full sm:w-[140px] h-9"
                    value={filters.data_inicial || ''}
                    onChange={(e) =>
                      updateFilters({ data_inicial: e.target.value || undefined })
                    }
                  />
                  <span className="text-muted-foreground text-sm hidden sm:inline">até</span>
                  <Input
                    type="date"
                    className="w-full sm:w-[140px] h-9"
                    value={filters.data_final || ''}
                    onChange={(e) =>
                      updateFilters({ data_final: e.target.value || undefined })
                    }
                  />
                </>
              )}

              <div className="flex items-center gap-2 ml-auto w-full sm:w-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={handleLimparFiltros}
                  disabled={!temFiltrosAtivos && !searchTerm && filtroParceiro === 'all'}
                >
                  Limpar filtros
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setFiltrosDialogOpen(true)}
                >
                  <Filter className="w-4 h-4" />
                  Filtros
                  {temFiltrosAtivos && (
                    <span className="bg-primary text-primary-foreground rounded-full px-1.5 text-[10px] min-w-[18px]">
                      {[
                        filters.data_inicial,
                        filters.data_final,
                        filters.tipo,
                        filters.status,
                        filters.roca_id,
                        filters.somente_com_roca,
                        filters.cliente_id,
                        filters.fornecedor_id,
                      ].filter(Boolean).length}
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Sheet filtros avançados (roça, etc.) */}
        <Sheet open={filtrosDialogOpen} onOpenChange={setFiltrosDialogOpen}>
          <SheetContent side="right" className="w-[400px] sm:w-[540px] overflow-y-auto">
            <SheetHeader className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Filter className="w-5 h-5 text-primary" />
                </div>
                <SheetTitle className="text-xl">Filtros avançados</SheetTitle>
              </div>
              <SheetDescription>Roça, tipo e status detalhado</SheetDescription>
            </SheetHeader>

            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Data inicial</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="date"
                    className="pl-10"
                    value={filters.data_inicial || ''}
                    onChange={(e) => {
                      updateFilters({ data_inicial: e.target.value || undefined });
                      setPeriodoRapidoLista('custom');
                    }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold">Data final</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="date"
                    className="pl-10"
                    value={filters.data_final || ''}
                    onChange={(e) => {
                      updateFilters({ data_final: e.target.value || undefined });
                      setPeriodoRapidoLista('custom');
                    }}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label className="text-sm font-semibold">Roça</Label>
                <Select
                  value={
                    filters.roca_id != null && filters.roca_id > 0
                      ? String(filters.roca_id)
                      : 'all'
                  }
                  onValueChange={(value) =>
                    updateFilters({
                      roca_id: value === 'all' ? undefined : Number(value),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as roças" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as roças</SelectItem>
                    {rocasFiltro.map((roca) => (
                      <SelectItem key={roca.id} value={String(roca.id)}>
                        {roca.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded border-input"
                    checked={!!filters.somente_com_roca}
                    onChange={(e) =>
                      updateFilters({
                        somente_com_roca: e.target.checked || undefined,
                      })
                    }
                  />
                  Somente pedidos com roça vinculada
                </label>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label className="text-sm font-semibold">Status</Label>
                <RadioGroup
                  value={filters.status || 'all'}
                  onValueChange={(value) =>
                    updateFilters({
                      status: value === 'all' ? undefined : (value as StatusPedido),
                    })
                  }
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="status-all" />
                    <Label htmlFor="status-all" className="cursor-pointer flex-1">
                      Todos
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ABERTO" id="status-aberto" />
                    <Label htmlFor="status-aberto" className="cursor-pointer flex-1">
                      Pendente
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="PARCIAL" id="status-parcial" />
                    <Label htmlFor="status-parcial" className="cursor-pointer flex-1">
                      Aberto
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="QUITADO" id="status-quitado" />
                    <Label htmlFor="status-quitado" className="cursor-pointer flex-1">
                      Quitado
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="CANCELADO" id="status-cancelado" />
                    <Label htmlFor="status-cancelado" className="cursor-pointer flex-1">
                      Cancelado
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={handleAplicarFiltros} className="flex-1">
                  Aplicar
                </Button>
                <Button onClick={handleLimparFiltros} variant="outline" className="flex-1">
                  Limpar
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Tabela */}
        <div className="bg-card rounded-xl border border-border/80 shadow-sm overflow-hidden">
          <OrderList
            orders={orders}
            isLoading={isLoading}
            onView={openViewDialog}
            onEdit={openEditForm}
            onCancel={handleOpenDeleteDialog}
            onReport={handleDownloadRelatorioPedido}
            reportingOrderId={reportingOrderId}
            onStatusChange={handleStatusChange}
            updatingStatusId={updatingStatusId}
          />

          <div className="border-t border-border px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-muted/20">
            <p className="text-sm text-muted-foreground">
              {totalOrders === 0
                ? 'Nenhum pedido encontrado'
                : `Mostrando ${inicioItem} a ${fimItem} de ${totalOrders} pedidos`}
            </p>
            {!filters.busca && !filters.numero_pedido && totalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      className={
                        currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                      }
                    />
                  </PaginationItem>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let page: number;
                    if (totalPages <= 5) page = i + 1;
                    else if (currentPage <= 3) page = i + 1;
                    else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
                    else page = currentPage - 2 + i;
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      className={
                        currentPage === totalPages
                          ? 'pointer-events-none opacity-50'
                          : 'cursor-pointer'
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        </div>

        {/* Dialog central de relatórios */}
        <Dialog open={relatoriosDialogOpen} onOpenChange={setRelatoriosDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Relatórios</DialogTitle>
              <DialogDescription>
                Escolha o tipo de relatório que deseja gerar.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 py-2">
              <button
                type="button"
                className="flex items-start gap-3 rounded-xl border p-4 text-left hover:bg-muted/50 transition-colors"
                onClick={() => {
                  setRelatoriosDialogOpen(false);
                  abrirDialogRelatorioPedidos();
                }}
              >
                <div className="p-2 rounded-lg bg-primary/10">
                  <Filter className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Relatório de pedidos</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    PDF com itens — filtre por cliente, fornecedor, roça e período.
                  </p>
                </div>
              </button>
              <button
                type="button"
                className="flex items-start gap-3 rounded-xl border p-4 text-left hover:bg-muted/50 transition-colors"
                onClick={() => {
                  setRelatoriosDialogOpen(false);
                  setMargemDialogOpen(true);
                }}
              >
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Margem de contribuição</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Receita, custo e margem por produto no período.
                  </p>
                </div>
              </button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={margemDialogOpen} onOpenChange={setMargemDialogOpen}>
            <DialogContent className="max-w-lg p-0 overflow-hidden">
              <DialogHeader className="flex flex-row items-start gap-3 space-y-0 px-6 pt-5 pb-4 border-b bg-card">
                <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 space-y-1.5">
                  <DialogTitle className="text-base font-semibold text-foreground">
                    Relatório de Margem de Contribuição
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Defina o período e escolha baixar PDF ou abrir para impressão.
                  </DialogDescription>
                </div>
              </DialogHeader>

              <div className="px-6 py-5 space-y-5">
                {/* Filtros de período */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-foreground">Período</Label>
                  <div className="flex flex-wrap items-end gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">Data inicial</span>
                      <Input
                        type="date"
                        className="w-[140px]"
                        value={dataInicialMargem}
                        onChange={(e) => {
                          setDataInicialMargem(e.target.value);
                          setPeriodoRapidoAtivo('custom');
                        }}
                      />
                    </div>
                    <span className="text-muted-foreground pb-2">até</span>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">Data final</span>
                      <Input
                        type="date"
                        className="w-[140px]"
                        value={dataFinalMargem}
                        onChange={(e) => {
                          setDataFinalMargem(e.target.value);
                          setPeriodoRapidoAtivo('custom');
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Button
                      type="button"
                      variant={periodoRapidoAtivo === 'hoje' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => aplicarPeriodoRapido('hoje')}
                    >
                      Hoje
                    </Button>
                    <Button
                      type="button"
                      variant={periodoRapidoAtivo === 'ontem' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => aplicarPeriodoRapido('ontem')}
                    >
                      Ontem
                    </Button>
                    <Button
                      type="button"
                      variant={periodoRapidoAtivo === '7d' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => aplicarPeriodoRapido('7d')}
                    >
                      Últimos 7 dias
                    </Button>
                    <Button
                      type="button"
                      variant={periodoRapidoAtivo === 'mes_atual' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => aplicarPeriodoRapido('mes_atual')}
                    >
                      Mês atual
                    </Button>
                    <Button
                      type="button"
                      variant={periodoRapidoAtivo === 'mes_anterior' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => aplicarPeriodoRapido('mes_anterior')}
                    >
                      Mês anterior
                    </Button>
                  </div>
                </div>

                {/* Ações: Baixar PDF e Imprimir */}
                <div className="rounded-xl border bg-muted/40 p-4 space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">Ações do relatório</p>
                  <div className="flex flex-col gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="justify-start gap-2 bg-background hover:bg-accent"
                      disabled={margemLoadingAction !== null}
                      onClick={async () => {
                        try {
                          setMargemLoadingAction('download');
                          await handleDownloadMargemPdf();
                          setMargemDialogOpen(false);
                        } finally {
                          setMargemLoadingAction(null);
                        }
                      }}
                    >
                      <Download className="w-4 h-4" />
                      <span className="text-sm">
                        {margemLoadingAction === 'download' ? 'Baixando...' : 'Baixar PDF'}
                      </span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="justify-start gap-2 bg-background hover:bg-accent"
                      disabled={margemLoadingAction !== null}
                      onClick={async () => {
                        try {
                          setMargemLoadingAction('print');
                          const dataInicial = dataInicialMargem?.trim() || undefined;
                          const dataFinal = dataFinalMargem?.trim() || undefined;
                          await pedidosService.printRelatorioMargemContribuicaoPdf(
                            dataInicial,
                            dataFinal,
                          );
                          setMargemDialogOpen(false);
                        } catch (e) {
                          toast.error(e instanceof Error ? e.message : 'Erro ao abrir relatório.');
                        } finally {
                          setMargemLoadingAction(null);
                        }
                      }}
                    >
                      <Printer className="w-4 h-4" />
                      <span className="text-sm">
                        {margemLoadingAction === 'print' ? 'Abrindo...' : 'Imprimir'}
                      </span>
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
        </Dialog>

        <Dialog open={relatorioPedidosDialogOpen} onOpenChange={setRelatorioPedidosDialogOpen}>
          <DialogContent className="max-w-lg p-0 overflow-hidden">
            <DialogHeader className="flex flex-row items-start gap-3 space-y-0 px-6 pt-5 pb-4 border-b bg-card">
              <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                <Filter className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 space-y-1.5">
                <DialogTitle className="text-base font-semibold text-foreground">
                  Relatório de Pedidos
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Filtre por cliente, fornecedor, roça e período. Pedidos cancelados não entram no PDF.
                </DialogDescription>
              </div>
            </DialogHeader>

            <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Período</Label>
                <div className="flex flex-wrap items-end gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Data inicial</span>
                    <Input
                      type="date"
                      className="w-[140px]"
                      value={dataInicialRelPed}
                      onChange={(e) => {
                        setDataInicialRelPed(e.target.value);
                        setPeriodoRapidoRelPed('custom');
                      }}
                    />
                  </div>
                  <span className="text-muted-foreground pb-2">até</span>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Data final</span>
                    <Input
                      type="date"
                      className="w-[140px]"
                      value={dataFinalRelPed}
                      onChange={(e) => {
                        setDataFinalRelPed(e.target.value);
                        setPeriodoRapidoRelPed('custom');
                      }}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      ['hoje', 'Hoje'],
                      ['ontem', 'Ontem'],
                      ['7d', 'Últimos 7 dias'],
                      ['mes_atual', 'Mês atual'],
                      ['mes_anterior', 'Mês anterior'],
                    ] as const
                  ).map(([key, label]) => (
                    <Button
                      key={key}
                      type="button"
                      variant={periodoRapidoRelPed === key ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => aplicarPeriodoRapidoRelPed(key)}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-sm font-medium">Cliente</Label>
                <Select value={clienteRelPed} onValueChange={setClienteRelPed}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os clientes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os clientes</SelectItem>
                    {clientes.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Fornecedor</Label>
                <Select value={fornecedorRelPed} onValueChange={setFornecedorRelPed}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os fornecedores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os fornecedores</SelectItem>
                    {fornecedores.map((f) => (
                      <SelectItem key={f.id} value={String(f.id)}>
                        {f.nome_fantasia || f.nome_razao || `Fornecedor #${f.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Roça</Label>
                <Select value={rocaRelPed} onValueChange={setRocaRelPed}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as roças" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as roças</SelectItem>
                    {rocasFiltro.map((roca) => (
                      <SelectItem key={roca.id} value={String(roca.id)}>
                        {roca.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-xl border bg-muted/40 p-4 space-y-3">
                <p className="text-sm font-medium text-muted-foreground">Ações do relatório</p>
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="justify-start gap-2 bg-background"
                    disabled={relPedLoadingAction !== null || loadingRelatorio}
                    onClick={async () => {
                      try {
                        setRelPedLoadingAction('download');
                        await downloadRelatorio(montarFiltrosRelatorioPedidos());
                        setRelatorioPedidosDialogOpen(false);
                      } finally {
                        setRelPedLoadingAction(null);
                      }
                    }}
                  >
                    <Download className="w-4 h-4" />
                    {relPedLoadingAction === 'download' || loadingRelatorio
                      ? 'Baixando...'
                      : 'Baixar PDF'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="justify-start gap-2 bg-background"
                    disabled={relPedLoadingAction !== null}
                    onClick={async () => {
                      try {
                        setRelPedLoadingAction('print');
                        await pedidosService.printRelatorioPDF(
                          montarFiltrosRelatorioPedidos(),
                        );
                        setRelatorioPedidosDialogOpen(false);
                      } catch (e) {
                        toast.error(
                          e instanceof Error ? e.message : 'Erro ao abrir relatório.',
                        );
                      } finally {
                        setRelPedLoadingAction(null);
                      }
                    }}
                  >
                    <Printer className="w-4 h-4" />
                    {relPedLoadingAction === 'print' ? 'Abrindo...' : 'Imprimir'}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Formulário */}
        <OrderForm
          isOpen={isFormOpen}
          onClose={closeForm}
          onSubmit={handleOrderSubmit}
          order={selectedOrderForEdit}
          isPending={isCreating || isUpdating}
          clientes={clientes}
          fornecedores={fornecedores}
          produtos={produtos}
          transportadoras={transportadoras}
        />

        {/* Modal de Visualização */}
        <OrderViewDialog
          isOpen={isViewDialogOpen}
          onClose={closeViewDialog}
          order={selectedOrder}
          onRequestCancel={(order) => {
            closeViewDialog();
            openCancelDialog(order);
          }}
        />

        {/* Modal de Confirmação de Cancelamento */}
        <Dialog
          open={isDeleteDialogOpen}
          onOpenChange={(open) => {
            setIsDeleteDialogOpen(open);
            if (!open) {
              closeCancelDialog();
            }
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-destructive" />
                Confirmar Cancelamento
              </DialogTitle>
              <DialogDescription>
                Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <p className="text-sm text-muted-foreground">
                Deseja realmente cancelar este pedido? Ele sairá das Contas a Receber e Contas a Pagar.
              </p>
              {orderToCancel && (
                <div className="mt-2 space-y-1">
                  <p className="font-medium">Pedido #{orderToCancel.numero_pedido}</p>
                  <p className="text-xs text-muted-foreground">
                    {orderToCancel.tipo === 'VENDA'
                      ? `Cliente: ${orderToCancel.cliente?.nome || 'N/A'}`
                      : `Fornecedor: ${orderToCancel.fornecedor?.nome_fantasia || orderToCancel.fornecedor?.nome_razao || 'N/A'}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Valor: {formatCurrency(normalizeCurrency(orderToCancel.valor_total, true))}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  closeCancelDialog();
                }}
                className="flex-1"
                disabled={isCanceling}
              >
                Voltar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={isCanceling}
                className="flex-1"
              >
                {isCanceling ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Cancelando...
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancelar
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
