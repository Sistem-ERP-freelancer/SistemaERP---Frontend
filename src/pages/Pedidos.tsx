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
import { CreatePedidoDto, StatusPedido, TipoPedido } from '@/types/pedido';
import { Calendar, Circle, Download, Filter, Loader2, Plus, Search, XCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

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
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUpdatingFromFiltersRef = useRef(false);

  const temFiltrosAtivos = !!(filters.data_inicial || filters.data_final || filters.tipo || filters.status);
  const handleAplicarFiltros = () => setFiltrosDialogOpen(false);
  const handleLimparFiltros = () => {
    updateFilters({
      data_inicial: undefined,
      data_final: undefined,
      tipo: undefined,
      status: undefined,
    });
    setFiltrosDialogOpen(false);
  };

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

  const handleOrderSubmit = (data: CreatePedidoDto) => {
    if (selectedOrder) {
      updateOrder(selectedOrder.id, data);
    } else {
      createOrder(data);
    }
  };

  return (
    <AppLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pedidos</h1>
            <p className="text-muted-foreground">
              Gestão completa de vendas e compras
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={downloadRelatorio} 
              variant="outline"
              disabled={loadingRelatorio}
            >
              {loadingRelatorio ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Gerando PDF...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Baixar Relatório PDF
                </>
              )}
            </Button>
            <Button onClick={openCreateForm} variant="gradient">
              <Plus className="w-4 h-4 mr-2" />
              Novo Pedido
            </Button>
          </div>
        </div>

        {/* Estatísticas */}
        <OrderStats tipoFiltro={filters.tipo} />

        {/* Search and Filters (mesmo design da página Fornecedores) */}
        <div className="bg-card rounded-xl border border-border p-4 mb-6">
          <div className="flex gap-4">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setFiltrosDialogOpen(true)}
              style={
                temFiltrosAtivos
                  ? { borderColor: 'var(--primary)', borderWidth: '2px' }
                  : {}
              }
            >
              <Filter className="w-4 h-4" />
              Filtros
              {temFiltrosAtivos && (
                <span className="ml-1 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                  {[filters.data_inicial, filters.data_final, filters.tipo, filters.status].filter(Boolean).length}
                </span>
              )}
            </Button>
            <Sheet open={filtrosDialogOpen} onOpenChange={setFiltrosDialogOpen}>
              <SheetContent side="right" className="w-[400px] sm:w-[540px] overflow-y-auto">
                <SheetHeader className="mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Filter className="w-5 h-5 text-primary" />
                    </div>
                    <SheetTitle className="text-xl">Filtros Avançados</SheetTitle>
                  </div>
                  <SheetDescription>Refine sua busca</SheetDescription>
                </SheetHeader>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">Data Inicial</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="date"
                        className="pl-10"
                        value={filters.data_inicial || ''}
                        onChange={(e) =>
                          updateFilters({ data_inicial: e.target.value || undefined })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">Data Final</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="date"
                        className="pl-10"
                        value={filters.data_final || ''}
                        onChange={(e) =>
                          updateFilters({ data_final: e.target.value || undefined })
                        }
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">Tipo</Label>
                    <Select
                      value={filters.tipo || 'all'}
                      onValueChange={(value) =>
                        updateFilters({
                          tipo: value === 'all' ? undefined : (value as TipoPedido),
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os tipos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os tipos</SelectItem>
                        <SelectItem value="VENDA">Venda</SelectItem>
                        <SelectItem value="COMPRA">Compra</SelectItem>
                      </SelectContent>
                    </Select>
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
                        <Label htmlFor="status-all" className="flex items-center gap-2 cursor-pointer flex-1">
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
                        <RadioGroupItem value="CANCELADO" id="status-cancelado" />
                        <Label htmlFor="status-cancelado" className="flex items-center gap-2 cursor-pointer flex-1">
                          <Circle className="w-3 h-3 text-red-500" />
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

            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número, cliente ou fornecedor..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-card border rounded-xl p-4">
          <OrderList
            orders={orders}
            isLoading={isLoading}
            onView={openViewDialog}
            onEdit={openEditForm}
            onCancel={handleOpenDeleteDialog}
            onStatusChange={handleStatusChange}
            updatingStatusId={updatingStatusId}
          />

          {/* Paginação */}
          {/* Não mostrar paginação quando há busca (todos os resultados vêm na primeira página) */}
          {totalPages > 1 && !filters.busca && !filters.numero_pedido && (
            <div className="border-t border-border p-4 mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let page;
                    if (totalPages <= 5) {
                      page = i + 1;
                    } else if (currentPage <= 3) {
                      page = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      page = totalPages - 4 + i;
                    } else {
                      page = currentPage - 2 + i;
                    }

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
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>

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
