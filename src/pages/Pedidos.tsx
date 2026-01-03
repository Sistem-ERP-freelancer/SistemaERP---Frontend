import { useState } from 'react';
import { Plus, Search, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/components/layout/AppLayout';
import { useOrders } from '@/hooks/useOrders';
import { OrderStats } from '@/components/orders/OrderStats';
import { OrderList } from '@/components/orders/OrderList';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
    setCurrentPage,
    updateFilters,
    clearFilters,
    openCreateForm,
    openEditForm,
    openViewDialog,
    openCancelDialog,
    cancelOrder,
    closeForm,
    closeViewDialog,
    closeCancelDialog,
  } = useOrders();

  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (value.trim()) {
      updateFilters({ cliente_nome: value });
    } else {
      updateFilters({ cliente_nome: undefined });
    }
  };

  const handleCancelConfirm = () => {
    if (orderToCancel) {
      cancelOrder(orderToCancel);
    }
  };

  return (
    <AppLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Módulo de Pedidos</h1>
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
        <OrderStats />

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
                onChange={(e) => updateFilters({ data_inicial: e.target.value || undefined })}
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="date"
                placeholder="Data final"
                className="pl-10"
                value={filters.data_final || ''}
                onChange={(e) => updateFilters({ data_final: e.target.value || undefined })}
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
                <SelectItem value="CONFIRMADO">Confirmado</SelectItem>
                <SelectItem value="EM_SEPARACAO">Em Separação</SelectItem>
                <SelectItem value="ENVIADO">Enviado</SelectItem>
                <SelectItem value="ENTREGUE">Entregue</SelectItem>
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
            onCancel={openCancelDialog}
          />

          {/* Paginação */}
          {totalPages > 1 && (
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

        {/* TODO: Adicionar modais de criação/edição/visualização/cancelamento */}
        {/* OrderForm, OrderDetails, CancelOrderDialog */}
      </div>
    </AppLayout>
  );
}
