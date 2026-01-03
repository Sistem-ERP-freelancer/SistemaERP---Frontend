import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  ShoppingCart, 
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Loader2,
  Calendar,
  DollarSign,
  Truck,
  User,
  Building2,
  Package,
  FileText,
  Percent,
  Info,
  TruckIcon,
  X,
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
import { clientesService, Cliente } from "@/services/clientes.service";
import { fornecedoresService, Fornecedor } from "@/services/fornecedores.service";
import { produtosService, Produto } from "@/services/produtos.service";
import { pedidosService, CreatePedidoDto, ItemPedido, Pedido } from "@/services/pedidos.service";

const statusTabs = ["Todos", "Vendas", "Compras", "PENDENTE", "APROVADO", "EM PROCESSAMENTO", "CONCLUÍDO", "CANCELADO"];

interface PedidoDisplay {
  id: string;
  tipo: string;
  cliente: string;
  valor: string;
  vencimento: string;
  status: string;
}

const Pedidos = () => {
  const [activeTab, setActiveTab] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(15); // Padrão do backend para pedidos
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newPedido, setNewPedido] = useState<CreatePedidoDto & { itens: Array<ItemPedido & { produto_nome?: string }> }>({
    tipo: "VENDA",
    data_pedido: new Date().toISOString().split('T')[0],
    subtotal: 0,
    desconto_valor: 0,
    desconto_percentual: 0,
    frete: 0,
    outras_taxas: 0,
    itens: [],
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

  // Buscar produtos
  const { data: produtosData } = useQuery({
    queryKey: ["produtos"],
    queryFn: async () => {
      try {
        const response = await produtosService.listar({
          limit: 100,
          statusProduto: "ATIVO",
        });
        return Array.isArray(response) ? response : response.data || [];
      } catch (error) {
        console.warn("API de produtos não disponível:", error);
        return [];
      }
    },
    retry: false,
  });

  const produtos: Produto[] = Array.isArray(produtosData) 
    ? produtosData 
    : produtosData?.data || [];

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

  // Buscar pedidos com paginação
  const { data: pedidosData, isLoading: isLoadingPedidos } = useQuery({
    queryKey: ["pedidos", activeTab, currentPage],
    queryFn: async () => {
      // Validar parâmetros antes de fazer a requisição
      if (!validarParametrosPaginação(currentPage, pageSize)) {
        throw new Error('Parâmetros de paginação inválidos');
      }

      try {
        let tipo: string | undefined;
        let status: string | undefined;

        // Determinar filtros baseados na tab ativa
        if (activeTab === "Vendas") {
          tipo = "VENDA";
        } else if (activeTab === "Compras") {
          tipo = "COMPRA";
        } else if (activeTab !== "Todos") {
          // Mapear status para o formato da API
          const statusMap: Record<string, string> = {
            "PENDENTE": "PENDENTE",
            "APROVADO": "APROVADO",
            "EM PROCESSAMENTO": "EM_PROCESSAMENTO",
            "CONCLUÍDO": "CONCLUIDO",
            "CANCELADO": "CANCELADO",
          };
          status = statusMap[activeTab];
        }

        const response = await pedidosService.listar({
          page: currentPage,
          limit: pageSize,
          tipo,
          status,
        });
        return response;
      } catch (error) {
        console.warn("API de pedidos não disponível:", error);
        return { data: [], total: 0, page: 1, limit: pageSize };
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

  const pedidos: Pedido[] = pedidosData?.data || [];
  const totalPedidos = pedidosData?.total || 0;
  const totalPages = Math.ceil(totalPedidos / pageSize);

  // Resetar página quando tab ou busca mudar
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm]);

  // Mutation para criar pedido
  const createPedidoMutation = useMutation({
    mutationFn: async (data: CreatePedidoDto) => {
      return await pedidosService.criar(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pedidos"] });
      toast.success("Pedido criado com sucesso!");
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Erro ao criar pedido");
    },
  });

  const resetForm = () => {
    setNewPedido({
      tipo: "VENDA",
      data_pedido: new Date().toISOString().split('T')[0],
      subtotal: 0,
      desconto_valor: 0,
      desconto_percentual: 0,
      frete: 0,
      outras_taxas: 0,
      itens: [],
    });
  };

  const valoresCalculados = useMemo(() => {
    const subtotal = newPedido.itens.reduce((acc, item) => {
      const preco = item.preco_unitario || 0;
      const quantidade = item.quantidade || 0;
      const desconto = item.desconto || 0;
      return acc + (preco * quantidade - desconto);
    }, 0);
    
    const descontoValor = newPedido.desconto_valor || 0;
    const descontoPercentual = newPedido.desconto_percentual || 0;
    const descontoPercentualValor = subtotal * (descontoPercentual / 100);
    const frete = newPedido.frete || 0;
    const outrasTaxas = newPedido.outras_taxas || 0;
    
    const total = subtotal - descontoValor - descontoPercentualValor + frete + outrasTaxas;
    
    return { subtotal, total };
  }, [newPedido.itens, newPedido.desconto_valor, newPedido.desconto_percentual, newPedido.frete, newPedido.outras_taxas]);

  const adicionarItem = () => {
    setNewPedido({
      ...newPedido,
      itens: [
        ...newPedido.itens,
        {
          produto_id: 0,
          quantidade: 1,
          preco_unitario: 0,
          desconto: 0,
        },
      ],
    });
  };

  const removerItem = (index: number) => {
    const novosItens = newPedido.itens.filter((_, i) => i !== index);
    setNewPedido({ ...newPedido, itens: novosItens });
  };

  const atualizarItem = (index: number, campo: keyof ItemPedido, valor: any) => {
    const novosItens = [...newPedido.itens];
    novosItens[index] = { ...novosItens[index], [campo]: valor };
    
    // Se for produto_id, buscar o preço do produto
    if (campo === 'produto_id' && valor) {
      const produto = produtos.find(p => p.id === Number(valor));
      if (produto) {
        novosItens[index].preco_unitario = produto.preco_venda || 0;
        novosItens[index].produto_nome = produto.nome;
      }
    }
    
    setNewPedido({ ...newPedido, itens: novosItens });
    setTimeout(() => calcularTotal(), 100);
  };

  const handleCreate = () => {
    if (!newPedido.tipo || !newPedido.data_pedido) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    if (newPedido.tipo === "VENDA" && !newPedido.cliente_id) {
      toast.error("Selecione um cliente para pedido de venda");
      return;
    }

    if (newPedido.tipo === "COMPRA" && !newPedido.fornecedor_id) {
      toast.error("Selecione um fornecedor para pedido de compra");
      return;
    }

    if (newPedido.itens.length === 0) {
      toast.error("Adicione pelo menos um item ao pedido");
      return;
    }

    const dadosEnvio: CreatePedidoDto = {
      tipo: newPedido.tipo,
      cliente_id: newPedido.cliente_id,
      fornecedor_id: newPedido.fornecedor_id,
      transportadora_id: newPedido.transportadora_id,
      data_pedido: newPedido.data_pedido,
      data_entrega_prevista: newPedido.data_entrega_prevista,
      condicao_pagamento: newPedido.condicao_pagamento,
      forma_pagamento: newPedido.forma_pagamento,
      prazo_entrega_dias: newPedido.prazo_entrega_dias,
      subtotal: valoresCalculados.subtotal,
      desconto_valor: newPedido.desconto_valor,
      desconto_percentual: newPedido.desconto_percentual,
      frete: newPedido.frete,
      outras_taxas: newPedido.outras_taxas,
      observacoes_internas: newPedido.observacoes_internas,
      observacoes_cliente: newPedido.observacoes_cliente,
      itens: newPedido.itens.map(item => ({
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario,
        desconto: item.desconto || 0,
      })),
    };

    createPedidoMutation.mutate(dadosEnvio);
  };

  // Mapear pedidos da API para o formato de exibição
  const pedidosDisplay: PedidoDisplay[] = useMemo(() => {
    return pedidos.map((pedido) => {
      // Buscar nome do cliente ou fornecedor
      let nomeClienteFornecedor = "N/A";
      if (pedido.tipo === "VENDA" && pedido.cliente_id) {
        const cliente = clientes.find(c => c.id === pedido.cliente_id);
        nomeClienteFornecedor = cliente?.nome || "Cliente não encontrado";
      } else if (pedido.tipo === "COMPRA" && pedido.fornecedor_id) {
        const fornecedor = fornecedores.find(f => f.id === pedido.fornecedor_id);
        nomeClienteFornecedor = fornecedor?.nome_fantasia || "Fornecedor não encontrado";
      }

      // Formatar valor
      const valorFormatado = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(pedido.valor_total || 0);

      // Formatar data de vencimento
      const vencimentoFormatado = pedido.data_entrega_prevista
        ? new Date(pedido.data_entrega_prevista).toLocaleDateString('pt-BR')
        : "N/A";

      // Mapear status
      const statusMap: Record<string, string> = {
        "PENDENTE": "Pendente",
        "APROVADO": "Aprovado",
        "EM_PROCESSAMENTO": "Em Processamento",
        "CONCLUIDO": "Concluído",
        "CANCELADO": "Cancelado",
      };
      const statusFormatado = statusMap[pedido.status] || pedido.status;

      // Mapear tipo
      const tipoFormatado = pedido.tipo === "VENDA" ? "Venda" : "Compra";

      return {
        id: pedido.numero_pedido || `PED-${pedido.id}`,
        tipo: tipoFormatado,
        cliente: nomeClienteFornecedor,
        valor: valorFormatado,
        vencimento: vencimentoFormatado,
        status: statusFormatado,
      };
    });
  }, [pedidos, clientes, fornecedores]);

  // Filtrar por busca
  const filteredPedidos = pedidosDisplay.filter(p => {
    const matchesSearch = 
      p.cliente.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleDelete = (id: string) => {
    // TODO: Implementar delete via API quando disponível
    toast.success("Pedido excluído!");
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "concluído": return "bg-cyan/10 text-cyan";
      case "pendente": return "bg-amber-500/10 text-amber-500";
      case "aprovado": return "bg-green-500/10 text-green-500";
      case "em processamento": return "bg-azure/10 text-azure";
      case "cancelado": return "bg-destructive/10 text-destructive";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusButtonColor = (status: string, isActive: boolean) => {
    if (isActive) {
      switch (status.toUpperCase()) {
        case "PENDENTE": return "bg-amber-500 text-white";
        case "APROVADO": return "bg-green-500 text-white";
        case "EM PROCESSAMENTO": return "bg-azure text-white";
        case "CONCLUÍDO": return "bg-cyan text-white";
        case "CANCELADO": return "bg-destructive text-white";
        default: return "bg-primary text-primary-foreground";
      }
    } else {
      switch (status.toUpperCase()) {
        case "PENDENTE": return "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20";
        case "APROVADO": return "bg-green-500/10 text-green-500 hover:bg-green-500/20";
        case "EM PROCESSAMENTO": return "bg-azure/10 text-azure hover:bg-azure/20";
        case "CONCLUÍDO": return "bg-cyan/10 text-cyan hover:bg-cyan/20";
        case "CANCELADO": return "bg-destructive/10 text-destructive hover:bg-destructive/20";
        default: return "bg-card text-muted-foreground hover:bg-secondary";
      }
    }
  };

  return (
    <AppLayout>
      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pedidos</h1>
            <p className="text-muted-foreground">Gerencie seus pedidos de compra e venda</p>
          </div>
          <Button 
            variant="gradient" 
            className="gap-2"
            onClick={() => {
              setNewPedido({ ...newPedido, tipo: "VENDA" });
              setDialogOpen(true);
            }}
          >
            <Plus className="w-4 h-4" />
            Adicionar Pedido
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-4">
          {statusTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                getStatusButtonColor(tab, activeTab === tab)
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Filters */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl border border-border p-4 mb-6"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por cliente ou fornecedor..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </motion.div>

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
                  <th className="text-left py-3 px-4 text-sm font-medium">Tipo</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Cliente/Fornecedor</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Valor</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Vencimento</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingPedidos ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Carregando pedidos...
                      </div>
                    </td>
                  </tr>
                ) : filteredPedidos.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      Nenhum pedido encontrado
                    </td>
                  </tr>
                ) : (
                  filteredPedidos.map((pedido) => (
                    <tr key={pedido.id} className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors">
                      <td className="py-3 px-4 text-sm font-medium text-foreground">{pedido.id}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{pedido.tipo}</td>
                      <td className="py-3 px-4 text-sm text-foreground">{pedido.cliente}</td>
                      <td className="py-3 px-4 text-sm font-medium text-foreground">{pedido.valor}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{pedido.vencimento}</td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(pedido.status)}`}>
                          {pedido.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          <button className="p-2 hover:bg-secondary rounded-lg transition-colors" title="Visualizar">
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <button className="p-2 hover:bg-secondary rounded-lg transition-colors" title="Editar">
                            <Edit className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <button 
                            className="p-2 hover:bg-destructive/10 rounded-lg transition-colors" 
                            title="Excluir"
                            onClick={() => handleDelete(pedido.id)}
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
                Mostrando {pedidos.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} a {Math.min(currentPage * pageSize, totalPedidos)} de {totalPedidos} pedidos
              </div>
            </div>
          )}
        </motion.div>

        {/* Dialog de Criação */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Novo Pedido</DialogTitle>
              <DialogDescription>
                Preencha os campos abaixo para criar um novo pedido no sistema.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 pt-4">
              {/* Informações Básicas */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground border-b pb-2 flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-blue-500" />
                  Informações Básicas
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo *</Label>
                    <Select
                      value={newPedido.tipo}
                      onValueChange={(value: "VENDA" | "COMPRA") =>
                        setNewPedido({ ...newPedido, tipo: value, cliente_id: undefined, fornecedor_id: undefined })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="VENDA">Venda</SelectItem>
                        <SelectItem value="COMPRA">Compra</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Data do Pedido *</Label>
                    <Input
                      type="date"
                      value={newPedido.data_pedido}
                      onChange={(e) =>
                        setNewPedido({ ...newPedido, data_pedido: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Cliente/Fornecedor */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground border-b pb-2 flex items-center gap-2">
                  {newPedido.tipo === "VENDA" ? (
                    <User className="w-4 h-4 text-blue-500" />
                  ) : (
                    <Building2 className="w-4 h-4 text-blue-500" />
                  )}
                  {newPedido.tipo === "VENDA" ? "Cliente" : "Fornecedor"}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {newPedido.tipo === "VENDA" ? (
                    <div className="space-y-2">
                      <Label>Cliente *</Label>
                      <Select
                        value={newPedido.cliente_id?.toString() || undefined}
                        onValueChange={(value) =>
                          setNewPedido({ ...newPedido, cliente_id: Number(value) })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          {clientes.map((cliente) => (
                            <SelectItem key={cliente.id} value={cliente.id.toString()}>
                              {cliente.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label>Fornecedor</Label>
                      <Select
                        value={newPedido.fornecedor_id?.toString() || "none"}
                        onValueChange={(value) =>
                          setNewPedido({ ...newPedido, fornecedor_id: value && value !== "none" ? Number(value) : undefined })
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
                  )}
                  <div className="space-y-2">
                    <Label>Transportadora</Label>
                    <Select
                      value={newPedido.transportadora_id?.toString() || "none"}
                      onValueChange={(value) =>
                        setNewPedido({ ...newPedido, transportadora_id: value && value !== "none" ? Number(value) : undefined })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma transportadora" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhuma</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Entrega */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground border-b pb-2 flex items-center gap-2">
                  <TruckIcon className="w-4 h-4 text-blue-500" />
                  Entrega
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data Prevista de Entrega</Label>
                    <Input
                      type="date"
                      value={newPedido.data_entrega_prevista || ""}
                      onChange={(e) =>
                        setNewPedido({ ...newPedido, data_entrega_prevista: e.target.value || undefined })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Prazo de Entrega (dias)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={newPedido.prazo_entrega_dias || ""}
                      onChange={(e) =>
                        setNewPedido({ ...newPedido, prazo_entrega_dias: e.target.value ? Number(e.target.value) : undefined })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Pagamento */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground border-b pb-2 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-blue-500" />
                  Pagamento
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Forma de Pagamento</Label>
                    <Select
                      value={newPedido.forma_pagamento || undefined}
                      onValueChange={(value) =>
                        setNewPedido({ ...newPedido, forma_pagamento: value as any })
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
                        <SelectItem value="TRANSFERENCIA">Transferência Bancária</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Condição de Pagamento</Label>
                    <Input
                      placeholder="Ex: À vista, 30 dias, etc."
                      value={newPedido.condicao_pagamento || ""}
                      onChange={(e) =>
                        setNewPedido({ ...newPedido, condicao_pagamento: e.target.value || undefined })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Itens do Pedido */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground border-b pb-2 flex items-center gap-2 flex-1">
                    <Package className="w-4 h-4 text-blue-500" />
                    Itens do Pedido
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={adicionarItem}
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar Item
                  </Button>
                </div>
                <div className="space-y-3">
                  {newPedido.itens.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 border rounded-lg">
                      <div className="col-span-4 space-y-2">
                        <Label>Produto</Label>
                        <Select
                          value={item.produto_id?.toString() || undefined}
                          onValueChange={(value) => atualizarItem(index, 'produto_id', Number(value))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um produto" />
                          </SelectTrigger>
                          <SelectContent>
                            {produtos.map((produto) => (
                              <SelectItem key={produto.id} value={produto.id.toString()}>
                                {produto.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label>Quantidade</Label>
                        <Input
                          type="number"
                          step="0.001"
                          placeholder="0"
                          value={item.quantidade || ""}
                          onChange={(e) => atualizarItem(index, 'quantidade', Number(e.target.value))}
                        />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label>Preço Unitário</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={item.preco_unitario || ""}
                          onChange={(e) => atualizarItem(index, 'preco_unitario', Number(e.target.value))}
                        />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label>Desconto</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={item.desconto || ""}
                          onChange={(e) => atualizarItem(index, 'desconto', Number(e.target.value))}
                        />
                      </div>
                      <div className="col-span-1 space-y-2">
                        <Label>Subtotal</Label>
                        <div className="h-10 flex items-center px-3 bg-muted rounded-md text-sm">
                          R$ {((item.preco_unitario || 0) * (item.quantidade || 0) - (item.desconto || 0)).toFixed(2)}
                        </div>
                      </div>
                      <div className="col-span-1 space-y-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removerItem(index)}
                          className="h-10"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {newPedido.itens.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum item adicionado. Clique em "Adicionar Item" para começar.
                    </p>
                  )}
                </div>
              </div>

              {/* Valores */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground border-b pb-2 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-blue-500" />
                  Valores
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Desconto (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={newPedido.desconto_valor || ""}
                      onChange={(e) =>
                        setNewPedido({ ...newPedido, desconto_valor: Number(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Desconto (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={newPedido.desconto_percentual || ""}
                      onChange={(e) =>
                        setNewPedido({ ...newPedido, desconto_percentual: Number(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Frete</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={newPedido.frete || ""}
                      onChange={(e) =>
                        setNewPedido({ ...newPedido, frete: Number(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Outras Taxas</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={newPedido.outras_taxas || ""}
                      onChange={(e) =>
                        setNewPedido({ ...newPedido, outras_taxas: Number(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Subtotal</Label>
                    <div className="h-10 flex items-center px-3 bg-muted rounded-md text-sm font-medium">
                      R$ {valoresCalculados.subtotal.toFixed(2)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Total</Label>
                    <div className="h-10 flex items-center px-3 bg-primary/10 text-primary rounded-md text-sm font-bold">
                      R$ {valoresCalculados.total.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Observações */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground border-b pb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500" />
                  Observações
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Observações Internas</Label>
                    <Textarea
                      placeholder="Observações internas sobre o pedido"
                      value={newPedido.observacoes_internas || ""}
                      onChange={(e) =>
                        setNewPedido({ ...newPedido, observacoes_internas: e.target.value || undefined })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Observações do Cliente</Label>
                    <Textarea
                      placeholder="Observações do cliente sobre o pedido"
                      value={newPedido.observacoes_cliente || ""}
                      onChange={(e) =>
                        setNewPedido({ ...newPedido, observacoes_cliente: e.target.value || undefined })
                      }
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={handleCreate}
                className="w-full"
                variant="gradient"
                disabled={createPedidoMutation.isPending}
              >
                {createPedidoMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Criar Pedido"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </AppLayout>
  );
};

export default Pedidos;
















