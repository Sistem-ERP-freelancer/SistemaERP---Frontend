import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Pedido,
  CreatePedidoDto,
  FiltrosPedidos,
  TipoPedido,
  StatusPedido,
} from '@/types/pedido';
import { pedidosService } from '@/services/pedidos.service';
import { clientesService, Cliente } from '@/services/clientes.service';
import { fornecedoresService, Fornecedor } from '@/services/fornecedores.service';
import { produtosService, Produto } from '@/services/produtos.service';
import { transportadorasService } from '@/services/transportadoras.service';

const ITEMS_PER_PAGE = 15;

export function useOrders() {
  const queryClient = useQueryClient();

  // Estados de UI
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FiltrosPedidos>({});
  const [selectedOrder, setSelectedOrder] = useState<Pedido | null>(null);
  const [orderToCancel, setOrderToCancel] = useState<Pedido | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);

  // Query para listar pedidos
  const {
    data: ordersResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['pedidos', currentPage, filters],
    queryFn: async () => {
      return await pedidosService.listar({
        ...filters,
        page: currentPage,
        limit: ITEMS_PER_PAGE,
      });
    },
  });

  const orders = ordersResponse?.data || [];
  const totalOrders = ordersResponse?.total || 0;
  const totalPages = Math.ceil(totalOrders / ITEMS_PER_PAGE);

  // Query para buscar todos os pedidos (para estatísticas)
  const { data: allOrdersResponse } = useQuery({
    queryKey: ['pedidos', 'all'],
    queryFn: async () => {
      return await pedidosService.listar({ limit: 1000 });
    },
  });

  const allOrders = allOrdersResponse?.data || [];

  // Queries para dados relacionados
  const { data: clientesData } = useQuery({
    queryKey: ['clientes', 'ativos'],
    queryFn: async () => {
      try {
        const response = await clientesService.listar({ limit: 100, status: 'ATIVO' });
        return Array.isArray(response) ? response : response.data || [];
      } catch {
        return [];
      }
    },
  });

  const { data: fornecedoresData } = useQuery({
    queryKey: ['fornecedores', 'ativos'],
    queryFn: async () => {
      try {
        const response = await fornecedoresService.listar({ limit: 100, statusFornecedor: 'ATIVO' });
        return Array.isArray(response) ? response : response.data || [];
      } catch {
        return [];
      }
    },
  });

  const { data: produtosData } = useQuery({
    queryKey: ['produtos', 'ativos'],
    queryFn: async () => {
      try {
        const response = await produtosService.listar({ limit: 100, statusProduto: 'ATIVO' });
        return Array.isArray(response) ? response : response.data || [];
      } catch {
        return [];
      }
    },
  });

  const { data: transportadorasData } = useQuery({
    queryKey: ['transportadoras', 'ativas'],
    queryFn: async () => {
      try {
        const response = await transportadorasService.listar({ limit: 100, apenasAtivos: true });
        return Array.isArray(response) ? response.transportadoras || [] : [];
      } catch {
        return [];
      }
    },
  });

  const clientes: Cliente[] = Array.isArray(clientesData) ? clientesData : [];
  const fornecedores: Fornecedor[] = Array.isArray(fornecedoresData) ? fornecedoresData : [];
  const produtos: Produto[] = Array.isArray(produtosData) ? produtosData : [];
  const transportadoras = transportadorasData || [];

  // Estatísticas calculadas
  const stats = useMemo(() => {
    const vendas = allOrders.filter((o) => o.tipo === 'VENDA');
    const compras = allOrders.filter((o) => o.tipo === 'COMPRA');
    const cancelados = allOrders.filter((o) => o.status === 'CANCELADO');

    const totalVendas = vendas.reduce((acc, o) => acc + (o.valor_total || 0), 0);
    const totalCompras = compras.reduce((acc, o) => acc + (o.valor_total || 0), 0);

    return {
      totalPedidos: allOrders.length,
      totalVendas: vendas.length,
      totalCompras: compras.length,
      totalCancelados: cancelados.length,
      valorTotalVendas: totalVendas,
      valorTotalCompras: totalCompras,
    };
  }, [allOrders]);

  // Mutation para criar pedido
  const createMutation = useMutation({
    mutationFn: async (data: CreatePedidoDto) => {
      return await pedidosService.criar(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      toast.success('Pedido criado com sucesso!');
      setIsFormOpen(false);
      setSelectedOrder(null);
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Erro ao criar pedido';
      toast.error(message);
    },
  });

  // Mutation para atualizar pedido
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<CreatePedidoDto>;
    }) => {
      return await pedidosService.atualizar(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      toast.success('Pedido atualizado com sucesso!');
      setIsFormOpen(false);
      setSelectedOrder(null);
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Erro ao atualizar pedido';
      toast.error(message);
    },
  });

  // Mutation para cancelar pedido
  const cancelMutation = useMutation({
    mutationFn: async (id: number) => {
      return await pedidosService.cancelar(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      toast.success('Pedido cancelado com sucesso!');
      setIsCancelDialogOpen(false);
      setOrderToCancel(null);
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Erro ao cancelar pedido';
      toast.error(message);
    },
  });

  // Ações CRUD
  const createOrder = (data: CreatePedidoDto) => {
    createMutation.mutate(data);
  };

  const updateOrder = (id: number, data: Partial<CreatePedidoDto>) => {
    updateMutation.mutate({ id, data });
  };

  const cancelOrder = (order: Pedido) => {
    cancelMutation.mutate(order.id);
  };

  const getOrderById = async (id: number): Promise<Pedido | null> => {
    try {
      return await pedidosService.buscarPorId(id);
    } catch {
      return null;
    }
  };

  const searchOrderByNumber = (numero: string): Pedido | undefined => {
    return allOrders.find((o) => o.numero_pedido === numero);
  };

  // Ações de filtros
  const updateFilters = (newFilters: Partial<FiltrosPedidos>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({});
    setCurrentPage(1);
  };

  // Ações de modais
  const openCreateForm = () => {
    setSelectedOrder(null);
    setIsFormOpen(true);
  };

  const openEditForm = (order: Pedido) => {
    setSelectedOrder(order);
    setIsFormOpen(true);
  };

  const openViewDialog = (order: Pedido) => {
    setSelectedOrder(order);
    setIsViewDialogOpen(true);
  };

  const openCancelDialog = (order: Pedido) => {
    setOrderToCancel(order);
    setIsCancelDialogOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setSelectedOrder(null);
  };

  const closeViewDialog = () => {
    setIsViewDialogOpen(false);
    setSelectedOrder(null);
  };

  const closeCancelDialog = () => {
    setIsCancelDialogOpen(false);
    setOrderToCancel(null);
  };

  return {
    // Dados
    orders,
    allOrders,
    totalOrders,
    currentPage,
    totalPages,
    filters,
    stats,
    selectedOrder,
    orderToCancel,
    clientes,
    fornecedores,
    produtos,
    transportadoras,

    // Estados
    isLoading,
    error,
    isFormOpen,
    isViewDialogOpen,
    isCancelDialogOpen,

    // Ações de navegação
    setCurrentPage,
    updateFilters,
    clearFilters,

    // Ações CRUD
    createOrder,
    updateOrder,
    cancelOrder,
    getOrderById,
    searchOrderByNumber,

    // Ações de modais
    openCreateForm,
    openEditForm,
    openViewDialog,
    openCancelDialog,
    closeForm,
    closeViewDialog,
    closeCancelDialog,

    // Estados de mutations
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isCanceling: cancelMutation.isPending,
  };
}

