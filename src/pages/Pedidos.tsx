import { useState, useEffect, useRef } from 'react';
import { Plus, Search, Calendar, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/components/layout/AppLayout';
import { useOrders } from '@/hooks/useOrders';
import { OrderStats } from '@/components/orders/OrderStats';
import { OrderList } from '@/components/orders/OrderList';
import { OrderForm } from '@/components/orders/OrderForm';
import { OrderViewDialog } from '@/components/orders/OrderViewDialog';
import { CreatePedidoDto } from '@/types/pedido';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { StatusPedido, TipoPedido } from '@/types/pedido';

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

  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUpdatingFromFiltersRef = useRef(false);

  // Sincronizar searchTerm com os filtros quando os filtros mudarem externamente
  useEffect(() => {
    // Evitar atualização se estamos atualizando os filtros a partir do searchTerm
    if (isUpdatingFromFiltersRef.current) {
      return;
    }

    const numeroPedido = filters.numero_pedido;
    const clienteNome = filters.cliente_nome;
    
    // Só atualizar se o valor for diferente do atual para evitar loops
    if (numeroPedido && searchTerm !== numeroPedido) {
      setSearchTerm(numeroPedido);
    } else if (clienteNome && searchTerm !== clienteNome) {
      setSearchTerm(clienteNome);
    } else if (!numeroPedido && !clienteNome && searchTerm) {
      // Se os filtros foram limpos externamente, limpar o searchTerm também
      setSearchTerm('');
    }
  }, [filters.numero_pedido, filters.cliente_nome]);

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
    
    // Limpar timeout anterior
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce: aguardar 300ms antes de atualizar os filtros
    searchTimeoutRef.current = setTimeout(() => {
      isUpdatingFromFiltersRef.current = true;
      
      if (value.trim()) {
        // Tenta buscar por número de pedido primeiro, depois por nome do cliente
        // Se o valor parece ser um número, busca por numero_pedido
        const isNumber = /^\d+$/.test(value.trim());
        if (isNumber) {
          updateFilters({ numero_pedido: value.trim(), cliente_nome: undefined });
        } else {
          updateFilters({ cliente_nome: value.trim(), numero_pedido: undefined });
        }
      } else {
        // Quando o campo é limpo, remover apenas os filtros de pesquisa
        // Mantém outros filtros como tipo, status, datas, etc.
        updateFilters({ numero_pedido: undefined, cliente_nome: undefined });
      }
      
      // Resetar flag após um pequeno delay
      setTimeout(() => {
        isUpdatingFromFiltersRef.current = false;
      }, 100);
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
          <Button onClick={openCreateForm} variant="gradient">
            <Plus className="w-4 h-4 mr-2" />
            Novo Pedido
          </Button>
        </div>

        {/* Estatísticas */}
        <OrderStats tipoFiltro={filters.tipo} />

        {/* Filtros */}
        <div className="bg-card border rounded-xl p-4 mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Filtros</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número ou cliente..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="date"
                placeholder="Data inicial"
                className="pl-10"
                value={filters.data_inicial || ''}
                onChange={(e) => {
                  const value = e.target.value || undefined;
                  updateFilters({ data_inicial: value });
                }}
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="date"
                placeholder="Data final"
                className="pl-10"
                value={filters.data_final || ''}
                onChange={(e) => {
                  const value = e.target.value || undefined;
                  updateFilters({ data_final: value });
                }}
              />
            </div>
            <Select
              value={filters.tipo || 'all'}
              onValueChange={(value) => {
                if (value === 'all') {
                  updateFilters({ tipo: undefined });
                } else {
                  updateFilters({ tipo: value as TipoPedido });
                }
              }}
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
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) => {
                if (value === 'all') {
                  updateFilters({ status: undefined });
                } else {
                  updateFilters({ status: value as StatusPedido });
                }
              }}
            >
              <SelectTrigger className="border-2 border-primary">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="PENDENTE">Pendente</SelectItem>
                <SelectItem value="APROVADO">Aprovado</SelectItem>
                <SelectItem value="EM_PROCESSAMENTO">Em Processamento</SelectItem>
                <SelectItem value="CONCLUIDO">Concluído</SelectItem>
                <SelectItem value="CANCELADO">Cancelado</SelectItem>
              </SelectContent>
            </Select>
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
          {/* Não mostrar paginação quando há busca por numero_pedido (busca busca todos os resultados) */}
          {totalPages > 1 && !filters.numero_pedido && (
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
          order={selectedOrder}
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
                Deseja realmente cancelar este pedido?
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
                    Valor: {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(orderToCancel.valor_total || 0)}
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
