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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { FiltrosProdutos } from "@/services/produtos.service";
import {
  Categoria,
  CreateCategoriaDto,
  categoriasService,
} from "@/services/categorias.service";
import {
  fornecedoresService,
  Fornecedor,
} from "@/services/fornecedores.service";
import {
  produtosService,
  CreateProdutoDto,
  Produto,
} from "@/services/produtos.service";
import {
  estoqueService,
  MovimentacaoEstoque,
} from "@/services/estoque.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Box,
  Building2,
  Calendar,
  Check,
  Circle,
  DollarSign,
  Edit,
  Eye,
  FileCheck,
  FileText,
  Filter,
  Folder,
  Hash,
  Info,
  LayoutGrid,
  Loader2,
  MapPin,
  Package,
  Plus,
  Ruler,
  Search,
  Tag,
  Truck,
  Trash2,
  X,
  ArrowUpCircle,
  ArrowDownCircle,
  History,
  RotateCcw,
  AlertTriangle,
  Settings,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";


const Produtos = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(15); // Padrão do backend para produtos
  const [filtrosDialogOpen, setFiltrosDialogOpen] = useState(false);
  const [filtrosAvancados, setFiltrosAvancados] = useState<FiltrosProdutos>({
    statusProduto: "",
    unidade_medida: "",
    categoriaId: undefined,
    fornecedorId: undefined,
    nomeFornecedor: "",
    precoMin: undefined,
    precoMax: undefined,
    estoqueMin: undefined,
    estoqueMax: undefined,
    validadeInicial: "",
    validadeFinal: "",
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [categoriasDialogOpen, setCategoriasDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [historicoSheetOpen, setHistoricoSheetOpen] = useState(false);
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null);
  const [editingProduto, setEditingProduto] = useState<Partial<CreateProdutoDto> & { estoque_maximo?: number; localizacao?: string }>({
    nome: "",
    descricao: "",
    sku: "",
    preco_custo: 0,
    preco_venda: 0,
    preco_promocional: undefined,
    estoque_atual: 0,
    estoque_minimo: 0,
    estoque_maximo: undefined,
    unidade_medida: "UN",
    statusProduto: "ATIVO",
    categoriaId: undefined,
    fornecedorId: undefined,
    data_validade: undefined,
    ncm: "",
    cest: "",
    cfop: "",
    observacoes: "",
    peso: undefined,
    altura: undefined,
    largura: undefined,
    localizacao: undefined,
  });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [produtoToDelete, setProdutoToDelete] = useState<number | null>(null);
  const [newProduto, setNewProduto] = useState<Partial<CreateProdutoDto>>({
    nome: "",
    descricao: "",
    sku: "",
    preco_custo: 0,
    preco_venda: 0,
    preco_promocional: undefined,
    estoque_atual: 0,
    estoque_minimo: 0,
    unidade_medida: "UN",
    statusProduto: "ATIVO",
    categoriaId: undefined,
    fornecedorId: undefined,
    data_validade: undefined,
    ncm: "",
    cest: "",
    cfop: "",
    observacoes: "",
    peso: undefined,
    altura: undefined,
    largura: undefined,
  });
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(
    null
  );
  const [newCategoriaNome, setNewCategoriaNome] = useState("");
  const [newCategoriaDescricao, setNewCategoriaDescricao] = useState("");

  // Buscar categorias (busca todas, não apenas ativas, para garantir que encontre as categorias dos produtos)
  const { data: categorias = [], isLoading: isLoadingCategorias } = useQuery({
    queryKey: ["categorias"],
    queryFn: async () => {
      try {
        const response = await categoriasService.listar({
          limit: 100,
          // Não filtra por status para garantir que encontre todas as categorias vinculadas aos produtos
        });
        const categoriasList = Array.isArray(response) ? response : response.data || [];
        
        if (import.meta.env.DEV) {
          console.log("Categorias carregadas:", categoriasList.length, categoriasList);
        }
        
        return categoriasList;
      } catch (error) {
        console.error("Erro ao buscar categorias:", error);
        return [];
      }
    },
  });

  // Buscar fornecedores
  const { data: fornecedoresData, isLoading: isLoadingFornecedores } = useQuery({
    queryKey: ["fornecedores"],
    queryFn: async () => {
      try {
        const response = await fornecedoresService.listar({
          limit: 100,
          statusFornecedor: "ATIVO",
        });
        return Array.isArray(response) ? response : response.data || [];
      } catch (error) {
        // Se a API não existir ainda, retorna array vazio
        console.warn("API de fornecedores não disponível:", error);
        return [];
      }
    },
    retry: false,
  });

  const fornecedores: Fornecedor[] = Array.isArray(fornecedoresData) 
    ? fornecedoresData 
    : fornecedoresData?.data || [];

  // Verificar se há filtros ativos
  const temFiltrosAtivos = Object.values(filtrosAvancados).some(
    (val) => val !== "" && val !== undefined
  );

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

  // Buscar produtos com paginação - usa busca avançada se houver filtros, busca simples se houver termo, senão lista todos
  const { data: produtosResponse, isLoading: isLoadingProdutos, error: errorProdutos } = useQuery({
    queryKey: ["produtos", searchTerm, filtrosAvancados, currentPage],
    queryFn: async () => {
      // Validar parâmetros antes de fazer a requisição
      if (!validarParametrosPaginação(currentPage, pageSize)) {
        throw new Error('Parâmetros de paginação inválidos');
      }

      try {
        let response;
        
        if (temFiltrosAtivos) {
          // Usa busca avançada quando há filtros
          response = await produtosService.buscarAvancado({
            termo: searchTerm.trim() || undefined,
            ...filtrosAvancados,
            page: currentPage,
            limit: pageSize,
          });
        } else if (searchTerm.trim()) {
          // Busca local por termo (já que não há endpoint de busca simples)
          // Busca todos e filtra localmente, mas com paginação
          response = await produtosService.listar({
            page: currentPage,
            limit: pageSize,
          });
        } else {
          // Lista todos quando não há termo nem filtros
          response = await produtosService.listar({
            page: currentPage,
            limit: pageSize,
          });
        }

        // Extrair produtos e total da resposta
        let produtos: Produto[] = [];
        let total = 0;
        
        if (Array.isArray(response)) {
          produtos = response;
          total = response.length;
        } else if (response?.produtos && Array.isArray(response.produtos)) {
          produtos = response.produtos;
          total = response.total || response.produtos.length;
        } else if (response?.data && Array.isArray(response.data)) {
          produtos = response.data;
          total = response.total || response.data.length;
        }

        // Se houver termo de busca e não houver filtros, filtrar localmente
        // Nota: Isso pode não funcionar bem com paginação, idealmente o backend deveria fazer a busca
        if (searchTerm.trim() && !temFiltrosAtivos) {
          const produtosFiltrados = produtos.filter((p) =>
            p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.sku.toLowerCase().includes(searchTerm.toLowerCase())
          );
          // Se filtrou localmente, o total pode estar incorreto
          return { produtos: produtosFiltrados, total: produtosFiltrados.length };
        }

        if (import.meta.env.DEV) {
          console.log("Produtos carregados:", produtos.length, "Total:", total);
        }
        return { produtos, total };
      } catch (error: any) {
        // Se for erro 404 ou resposta vazia, não é um erro real
        if (error?.response?.status === 404 || error?.status === 404) {
          if (import.meta.env.DEV) {
            console.log("Nenhum produto encontrado (404)");
          }
          return { produtos: [], total: 0 };
        }
        
        // Se for erro de autenticação, não retornar array vazio silenciosamente
        if (error?.response?.status === 401 || error?.status === 401) {
          if (import.meta.env.DEV) {
            console.error("Erro de autenticação ao buscar produtos");
          }
          return { produtos: [], total: 0 };
        }
        
        if (import.meta.env.DEV) {
          console.error("Erro ao buscar produtos:", error);
        }
        return { produtos: [], total: 0 };
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
      // Tentar até 1 vez para outros erros
      return failureCount < 1;
    },
    retryDelay: 1000,
  });

  const produtos = produtosResponse?.produtos || [];
  const totalProdutos = produtosResponse?.total || 0;
  const totalPages = Math.ceil(totalProdutos / pageSize);
  const filteredProdutos = produtos;

  // Resetar página quando filtro ou busca mudar
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filtrosAvancados]);

  // Calcular contagem de produtos por categoria
  const getProdutosCountByCategoria = (categoriaId: number) => {
    return produtos.filter((p) => p.categoriaId === categoriaId).length;
  };

  // Função para determinar a cor do estoque baseada nas regras
  const getEstoqueColor = (estoqueAtual: number, estoqueMinimo: number): string => {
    // Vermelho (crítico): estoque_atual < estoque_minimo
    if (estoqueAtual < estoqueMinimo) {
      return "#dc2626";
    }
    
    // Laranja forte (alerta máximo): estoque_atual == estoque_minimo
    if (Math.abs(estoqueAtual - estoqueMinimo) < 0.01) {
      return "#ea580c";
    }
    
    // Amarelo (atenção): estoque_atual > estoque_minimo e estoque_atual <= estoque_minimo * 1.3
    if (estoqueAtual > estoqueMinimo && estoqueAtual <= estoqueMinimo * 1.3) {
      return "#facc15";
    }
    
    // Verde (seguro): estoque_atual > estoque_minimo * 1.3
    return "#16a34a";
  };

  // Mutation para criar produto
  const createProdutoMutation = useMutation({
    mutationFn: (data: CreateProdutoDto) => produtosService.criar(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["produtos"] });
      setNewProduto({
        nome: "",
        descricao: "",
        sku: "",
        preco_custo: 0,
        preco_venda: 0,
        preco_promocional: undefined,
        estoque_atual: 0,
        estoque_minimo: 0,
        unidade_medida: "UN",
        statusProduto: "ATIVO",
        categoriaId: undefined,
        fornecedorId: undefined,
        data_validade: undefined,
        ncm: "",
        cest: "",
        cfop: "",
        observacoes: "",
        peso: undefined,
        altura: undefined,
        largura: undefined,
      });
      setDialogOpen(false);
      toast.success("Produto cadastrado com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Erro ao criar produto");
    },
  });

  const handleCreate = () => {
    if (!newProduto.nome || !newProduto.sku || !newProduto.preco_custo || !newProduto.preco_venda) {
      toast.error("Preencha os campos obrigatórios (Nome, SKU, Preço de Custo e Preço de Venda)");
      return;
    }

    if (!newProduto.categoriaId) {
      toast.error("Selecione uma categoria");
      return;
    }

    if (!newProduto.fornecedorId) {
      toast.error("Selecione um fornecedor");
      return;
    }

    const produtoData: CreateProdutoDto = {
      nome: newProduto.nome!,
      sku: newProduto.sku!,
      preco_custo: Number(newProduto.preco_custo),
      preco_venda: Number(newProduto.preco_venda),
      estoque_atual: Number(newProduto.estoque_atual) || 0,
      estoque_minimo: Number(newProduto.estoque_minimo) || 0,
      unidade_medida: newProduto.unidade_medida || "UN",
      statusProduto: newProduto.statusProduto || "ATIVO",
      descricao: newProduto.descricao || undefined,
      preco_promocional: newProduto.preco_promocional ? Number(newProduto.preco_promocional) : undefined,
      categoriaId: newProduto.categoriaId,
      fornecedorId: newProduto.fornecedorId,
      data_validade: newProduto.data_validade || undefined,
      ncm: newProduto.ncm || undefined,
      cest: newProduto.cest || undefined,
      cfop: newProduto.cfop || undefined,
      observacoes: newProduto.observacoes || undefined,
      peso: newProduto.peso ? Number(newProduto.peso) : undefined,
      altura: newProduto.altura ? Number(newProduto.altura) : undefined,
      largura: newProduto.largura ? Number(newProduto.largura) : undefined,
    };

    createProdutoMutation.mutate(produtoData);
  };

  // Mutation para atualizar produto
  const updateProdutoMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateProdutoDto> }) =>
      produtosService.atualizar(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["produtos"] });
      setEditDialogOpen(false);
      setEditingProduto({
        nome: "",
        descricao: "",
        sku: "",
        preco_custo: 0,
        preco_venda: 0,
        preco_promocional: undefined,
        estoque_atual: 0,
        estoque_minimo: 0,
        estoque_maximo: undefined,
        unidade_medida: "UN",
        statusProduto: "ATIVO",
        categoriaId: undefined,
        fornecedorId: undefined,
        data_validade: undefined,
        ncm: "",
        cest: "",
        cfop: "",
        observacoes: "",
        peso: undefined,
        altura: undefined,
        largura: undefined,
        localizacao: undefined,
      });
      setSelectedProduto(null);
      toast.success("Produto atualizado com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Erro ao atualizar produto");
    },
  });

  // Mutation para deletar produto
  const deleteProdutoMutation = useMutation({
    mutationFn: (id: number) => produtosService.deletar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["produtos"] });
      setDeleteConfirmOpen(false);
      setProdutoToDelete(null);
      toast.success("Produto excluído com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Erro ao excluir produto");
    },
  });

  const handleEdit = (produto: Produto) => {
    setSelectedProduto(produto);
    
    // Converter data_validade para formato YYYY-MM-DD se existir
    let dataValidadeFormatada = "";
    if (produto.data_validade) {
      try {
        const data = new Date(produto.data_validade);
        if (!isNaN(data.getTime())) {
          // Formato YYYY-MM-DD para input type="date"
          const year = data.getFullYear();
          const month = String(data.getMonth() + 1).padStart(2, "0");
          const day = String(data.getDate()).padStart(2, "0");
          dataValidadeFormatada = `${year}-${month}-${day}`;
        }
      } catch (error) {
        console.error("Erro ao formatar data de validade:", error);
      }
    }
    
    setEditingProduto({
      nome: produto.nome || "",
      descricao: produto.descricao || "",
      sku: produto.sku || "",
      preco_custo: produto.preco_custo || 0,
      preco_venda: produto.preco_venda || 0,
      preco_promocional: produto.preco_promocional,
      estoque_atual: produto.estoque_atual || 0,
      estoque_minimo: produto.estoque_minimo || 0,
      estoque_maximo: produto.estoque_maximo,
      unidade_medida: produto.unidade_medida || "UN",
      statusProduto: produto.statusProduto || "ATIVO",
      categoriaId: produto.categoriaId,
      fornecedorId: produto.fornecedorId,
      data_validade: dataValidadeFormatada || undefined,
      ncm: produto.ncm || "",
      cest: produto.cest || "",
      cfop: produto.cfop || "",
      observacoes: produto.observacoes || "",
      peso: produto.peso,
      altura: produto.altura,
      largura: produto.largura,
      localizacao: produto.localizacao,
    });
    setEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!selectedProduto) {
      toast.error("Selecione um produto");
      return;
    }

    if (!editingProduto.nome || !editingProduto.sku || !editingProduto.preco_custo || !editingProduto.preco_venda) {
      toast.error("Preencha os campos obrigatórios (Nome, SKU, Preço de Custo e Preço de Venda)");
      return;
    }

    if (!editingProduto.categoriaId) {
      toast.error("Selecione uma categoria");
      return;
    }

    if (!editingProduto.fornecedorId) {
      toast.error("Selecione um fornecedor");
      return;
    }

    const produtoData: Partial<CreateProdutoDto> & { estoque_maximo?: number; localizacao?: string } = {
      nome: editingProduto.nome!,
      sku: editingProduto.sku!,
      preco_custo: Number(editingProduto.preco_custo),
      preco_venda: Number(editingProduto.preco_venda),
      estoque_atual: Number(editingProduto.estoque_atual) || 0,
      estoque_minimo: Number(editingProduto.estoque_minimo) || 0,
      unidade_medida: editingProduto.unidade_medida || "UN",
      statusProduto: editingProduto.statusProduto || "ATIVO",
      descricao: editingProduto.descricao || undefined,
      preco_promocional: editingProduto.preco_promocional ? Number(editingProduto.preco_promocional) : undefined,
      categoriaId: editingProduto.categoriaId,
      fornecedorId: editingProduto.fornecedorId,
      data_validade: editingProduto.data_validade || undefined,
      ncm: editingProduto.ncm || undefined,
      cest: editingProduto.cest || undefined,
      cfop: editingProduto.cfop || undefined,
      observacoes: editingProduto.observacoes || undefined,
      peso: editingProduto.peso ? Number(editingProduto.peso) : undefined,
      altura: editingProduto.altura ? Number(editingProduto.altura) : undefined,
      largura: editingProduto.largura ? Number(editingProduto.largura) : undefined,
      estoque_maximo: editingProduto.estoque_maximo ? Number(editingProduto.estoque_maximo) : undefined,
      localizacao: editingProduto.localizacao || undefined,
    };

    updateProdutoMutation.mutate({
      id: selectedProduto.id,
      data: produtoData,
    });
  };

  const handleDelete = (id: number) => {
    setProdutoToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (produtoToDelete) {
      deleteProdutoMutation.mutate(produtoToDelete);
    }
  };


  // Query para buscar histórico de movimentações
  const { data: historicoData, isLoading: isLoadingHistorico } = useQuery({
    queryKey: ["historico-estoque", selectedProduto?.id],
    queryFn: async () => {
      if (!selectedProduto?.id) return null;
      return await estoqueService.obterHistorico(selectedProduto.id, {
        page: 1,
        limit: 50,
      });
    },
    enabled: !!selectedProduto?.id && historicoSheetOpen,
  });

  // Mutations para categorias
  const createCategoriaMutation = useMutation({
    mutationFn: (data: CreateCategoriaDto) => categoriasService.criar(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categorias"] });
      setNewCategoriaNome("");
      setNewCategoriaDescricao("");
      toast.success("Categoria criada com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Erro ao criar categoria");
    },
  });

  const updateCategoriaMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Partial<CreateCategoriaDto>;
    }) => categoriasService.atualizar(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categorias"] });
      setEditingCategoria(null);
      setNewCategoriaNome("");
      setNewCategoriaDescricao("");
      toast.success("Categoria atualizada com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Erro ao atualizar categoria");
    },
  });

  const deleteCategoriaMutation = useMutation({
    mutationFn: (id: number) => categoriasService.deletar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categorias"] });
      toast.success("Categoria excluída com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Erro ao excluir categoria");
    },
  });

  const handleCreateOrUpdateCategoria = () => {
    if (!newCategoriaNome.trim()) {
      toast.error("Nome da categoria é obrigatório");
      return;
    }
    
    if (editingCategoria) {
      updateCategoriaMutation.mutate({
        id: editingCategoria.id,
        data: {
          nome: newCategoriaNome,
          descricao: newCategoriaDescricao.trim() || undefined,
        },
      });
    } else {
      createCategoriaMutation.mutate({
        nome: newCategoriaNome,
        descricao: newCategoriaDescricao.trim() || undefined,
        status: "ATIVO",
      });
    }
  };

  const handleEditCategoria = (categoria: Categoria) => {
    setEditingCategoria(categoria);
    setNewCategoriaNome(categoria.nome);
    setNewCategoriaDescricao(categoria.descricao || "");
  };

  const handleDeleteCategoria = (id: number) => {
    if (window.confirm("Tem certeza que deseja excluir esta categoria?")) {
      deleteCategoriaMutation.mutate(id);
    }
  };

  const handleCloseCategoriasDialog = () => {
    setCategoriasDialogOpen(false);
    setEditingCategoria(null);
    setNewCategoriaNome("");
    setNewCategoriaDescricao("");
  };

  const handleAplicarFiltros = () => {
    setFiltrosDialogOpen(false);
    // A query será atualizada automaticamente pelo React Query
  };

  const handleLimparFiltros = () => {
    setFiltrosAvancados({
      statusProduto: "",
      unidade_medida: "",
      categoriaId: undefined,
      fornecedorId: undefined,
      nomeFornecedor: "",
      precoMin: undefined,
      precoMax: undefined,
      estoqueMin: undefined,
      estoqueMax: undefined,
      validadeInicial: "",
      validadeFinal: "",
    });
    setFiltrosDialogOpen(false);
  };

  return (
    <AppLayout>
      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Produtos</h1>
            <p className="text-muted-foreground">
              Gerencie seu catálogo de produtos
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => setCategoriasDialogOpen(true)}
            >
              <LayoutGrid className="w-4 h-4" />
              Gerenciar Categorias
            </Button>
            <Dialog open={categoriasDialogOpen} onOpenChange={setCategoriasDialogOpen}>
              <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden bg-gradient-to-br from-card to-secondary/30">
                <div className="p-6">
                  <DialogHeader>
                    <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                      <div className="bg-primary p-2 rounded-lg">
                        <LayoutGrid className="w-5 h-5 text-primary-foreground" />
                      </div>
                      Gerenciar Categorias
                    </DialogTitle>
                  </DialogHeader>
                  <p className="text-muted-foreground text-sm mt-2">
                    Organize seus produtos em categorias para melhor controle
                  </p>
                </div>
                
                <div className="p-6 space-y-6">
                  {/* Create new category */}
                  <div className="bg-secondary/50 rounded-xl p-4 border border-border/50">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-3 block">
                      Adicionar Nova Categoria
                    </Label>
                    <div className="space-y-3">
                      {editingCategoria ? (
                        <>
                          <Input 
                            placeholder="Nome da categoria..."
                            value={newCategoriaNome}
                            onChange={(e) => setNewCategoriaNome(e.target.value)}
                            className="bg-card border-border/50 focus:border-primary"
                          />
                          <Input 
                            placeholder="Descrição (opcional)..."
                            value={newCategoriaDescricao}
                            onChange={(e) => setNewCategoriaDescricao(e.target.value)}
                            className="bg-card border-border/50 focus:border-primary"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleCreateOrUpdateCategoria();
                              if (e.key === "Escape") {
                                setEditingCategoria(null);
                                setNewCategoriaNome("");
                                setNewCategoriaDescricao("");
                              }
                            }}
                          />
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="gradient" 
                              onClick={handleCreateOrUpdateCategoria} 
                              className="h-8 flex-1"
                              disabled={updateCategoriaMutation.isPending || !newCategoriaNome.trim()}
                            >
                              {updateCategoriaMutation.isPending ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Salvando...
                                </>
                              ) : (
                                "Salvar"
                              )}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => {
                                setEditingCategoria(null);
                                setNewCategoriaNome("");
                                setNewCategoriaDescricao("");
                              }} 
                              className="h-8"
                            >
                              Cancelar
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <Input 
                            placeholder="Nome da categoria..."
                            value={newCategoriaNome}
                            onChange={(e) => setNewCategoriaNome(e.target.value)}
                            className="bg-card border-border/50 focus:border-primary"
                          />
                          <Input 
                            placeholder="Descrição (opcional)..."
                            value={newCategoriaDescricao}
                            onChange={(e) => setNewCategoriaDescricao(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleCreateOrUpdateCategoria()}
                            className="bg-card border-border/50 focus:border-primary"
                          />
                          <Button 
                            onClick={handleCreateOrUpdateCategoria} 
                            variant="gradient" 
                            className="w-full"
                            disabled={createCategoriaMutation.isPending || !newCategoriaNome.trim()}
                          >
                            {createCategoriaMutation.isPending ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Adicionando...
                              </>
                            ) : (
                              <>
                                <Plus className="w-4 h-4 mr-1" />
                                Adicionar Categoria
                              </>
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  {/* Categories list */}
                  <div>
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-3 block">
                      Categorias Existentes ({categorias.length})
                    </Label>
                    {isLoadingCategorias ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                        {categorias.length === 0 ? (
                          <div className="bg-secondary/30 rounded-xl p-8 text-center">
                            <Package className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                            <p className="text-muted-foreground text-sm">
                              Nenhuma categoria cadastrada
                            </p>
                          </div>
                        ) : (
                          categorias.map((cat, index) => (
                            <motion.div 
                              key={cat.id} 
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="group bg-card rounded-xl border border-border/50 p-3 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200"
                            >
                              {editingCategoria?.id === cat.id ? (
                                <div className="space-y-2">
                                  <Input 
                                    value={newCategoriaNome}
                                    onChange={(e) => setNewCategoriaNome(e.target.value)}
                                    className="h-9 bg-secondary border-primary/30"
                                    autoFocus
                                    placeholder="Nome da categoria"
                                  />
                                  <Input 
                                    value={newCategoriaDescricao}
                                    onChange={(e) => setNewCategoriaDescricao(e.target.value)}
                                    className="h-9 bg-secondary border-primary/30"
                                    placeholder="Descrição (opcional)"
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") handleCreateOrUpdateCategoria();
                                      if (e.key === "Escape") {
                                        setEditingCategoria(null);
                                        setNewCategoriaNome("");
                                        setNewCategoriaDescricao("");
                                      }
                                    }}
                                  />
                                  <div className="flex gap-2">
                                    <Button size="sm" variant="gradient" onClick={handleCreateOrUpdateCategoria} className="h-8 flex-1">
                                      Salvar
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => {
                                      setEditingCategoria(null);
                                      setNewCategoriaNome("");
                                      setNewCategoriaDescricao("");
                                    }} className="h-8">
                                      Cancelar
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                                    <Package className="w-5 h-5 text-primary" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">{cat.nome}</p>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {cat.descricao || `${produtos.filter(p => p.categoriaId === cat.id).length} produtos vinculados`}
                                    </p>
                                  </div>
                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                                      onClick={() => handleEditCategoria(cat)}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                                      onClick={() => handleDeleteCategoria(cat.id)}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </motion.div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
          </div>
              </DialogContent>
            </Dialog>
            <Button 
              variant="gradient" 
              className="gap-2"
              onClick={() => setDialogOpen(true)}
            >
                <Plus className="w-4 h-4" />
                Criar Produto
              </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Novo Produto</DialogTitle>
                  <DialogDescription>
                    Preencha os campos abaixo para cadastrar um novo produto no sistema.
                  </DialogDescription>
              </DialogHeader>
                <div className="space-y-6 pt-4">
                  {/* Informações Básicas */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-foreground border-b pb-2 flex items-center gap-2">
                      <Package className="w-4 h-4 text-blue-500" />
                      Informações Básicas
                    </h3>
                <div className="space-y-2">
                  <Label>Nome do Produto *</Label>
                  <Input 
                        placeholder="Ex: Notebook Dell Inspiron"
                        value={newProduto.nome || ""}
                        onChange={(e) =>
                          setNewProduto({ ...newProduto, nome: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Descrição</Label>
                      <Textarea
                        placeholder="Descrição detalhada do produto"
                        value={newProduto.descricao || ""}
                        onChange={(e) =>
                          setNewProduto({ ...newProduto, descricao: e.target.value })
                        }
                  />
                </div>
                  <div className="space-y-2">
                    <Label>SKU *</Label>
                    <Input 
                        placeholder="Ex: NB-DELL-001"
                        value={newProduto.sku || ""}
                        onChange={(e) =>
                          setNewProduto({ ...newProduto, sku: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  {/* Categorização */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-foreground border-b pb-2 flex items-center gap-2">
                      <LayoutGrid className="w-4 h-4 text-blue-500" />
                      Categorização
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Categoria *</Label>
                        <Select
                          value={newProduto.categoriaId?.toString() || undefined}
                          onValueChange={(value) =>
                            setNewProduto({
                              ...newProduto,
                              categoriaId: Number(value),
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                          <SelectContent>
                            {categorias.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id.toString()}>
                                {cat.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Fornecedor *</Label>
                        <Select
                          value={newProduto.fornecedorId?.toString() || undefined}
                          onValueChange={(value) =>
                            setNewProduto({
                              ...newProduto,
                              fornecedorId: Number(value),
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um fornecedor" />
                          </SelectTrigger>
                          <SelectContent>
                            {fornecedores.map((forn) => (
                              <SelectItem key={forn.id} value={forn.id.toString()}>
                                {forn.nome_fantasia}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Preços */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-foreground border-b pb-2 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-blue-500" />
                      Preços
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Preço de Custo *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={newProduto.preco_custo || ""}
                          onChange={(e) =>
                            setNewProduto({
                              ...newProduto,
                              preco_custo: e.target.value ? Number(e.target.value) : 0,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Preço de Venda *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={newProduto.preco_venda || ""}
                          onChange={(e) =>
                            setNewProduto({
                              ...newProduto,
                              preco_venda: e.target.value ? Number(e.target.value) : 0,
                            })
                          }
                    />
                  </div>
                  <div className="space-y-2">
                        <Label>Preço Promocional</Label>
                    <Input 
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={newProduto.preco_promocional || ""}
                          onChange={(e) =>
                            setNewProduto({
                              ...newProduto,
                              preco_promocional: e.target.value ? Number(e.target.value) : undefined,
                            })
                          }
                    />
                  </div>
                </div>
                  </div>

                  {/* Estoque */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-foreground border-b pb-2 flex items-center gap-2">
                      <Package className="w-4 h-4 text-blue-500" />
                      Estoque
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                        <Label>Estoque Atual *</Label>
                    <Input 
                          type="number"
                          placeholder="0"
                          value={newProduto.estoque_atual || ""}
                          onChange={(e) =>
                            setNewProduto({
                              ...newProduto,
                              estoque_atual: e.target.value ? Number(e.target.value) : 0,
                            })
                          }
                    />
                  </div>
                  <div className="space-y-2">
                        <Label>Estoque Mínimo *</Label>
                    <Input 
                      type="number"
                      placeholder="0"
                          value={newProduto.estoque_minimo || ""}
                          onChange={(e) =>
                            setNewProduto({
                              ...newProduto,
                              estoque_minimo: e.target.value ? Number(e.target.value) : 0,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Unidade de Medida *</Label>
                        <Select
                          value={newProduto.unidade_medida || "UN"}
                          onValueChange={(value: "UN" | "KG" | "LT" | "CX") =>
                            setNewProduto({
                              ...newProduto,
                              unidade_medida: value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="UN">Unidade (UN)</SelectItem>
                            <SelectItem value="KG">Quilograma (KG)</SelectItem>
                            <SelectItem value="LT">Litro (LT)</SelectItem>
                            <SelectItem value="CX">Caixa (CX)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Informações Fiscais */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-foreground border-b pb-2 flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-blue-500" />
                      Informações Fiscais
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>NCM</Label>
                        <Input
                          placeholder="Ex: 8517.12.00"
                          maxLength={20}
                          value={newProduto.ncm || ""}
                          onChange={(e) =>
                            setNewProduto({ ...newProduto, ncm: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>CEST</Label>
                        <Input
                          placeholder="Ex: 0100100"
                          maxLength={20}
                          value={newProduto.cest || ""}
                          onChange={(e) =>
                            setNewProduto({ ...newProduto, cest: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>CFOP</Label>
                        <Input
                          placeholder="Ex: 5102"
                          maxLength={20}
                          value={newProduto.cfop || ""}
                          onChange={(e) =>
                            setNewProduto({ ...newProduto, cfop: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dimensões e Peso */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-foreground border-b pb-2 flex items-center gap-2">
                      <Ruler className="w-4 h-4 text-blue-500" />
                      Dimensões e Peso
                    </h3>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>Peso (kg)</Label>
                        <Input
                          type="number"
                          step="0.001"
                          placeholder="0.000"
                          value={newProduto.peso || ""}
                          onChange={(e) =>
                            setNewProduto({
                              ...newProduto,
                              peso: e.target.value ? Number(e.target.value) : undefined,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Altura (cm)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={newProduto.altura || ""}
                          onChange={(e) =>
                            setNewProduto({
                              ...newProduto,
                              altura: e.target.value ? Number(e.target.value) : undefined,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Largura (cm)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={newProduto.largura || ""}
                          onChange={(e) =>
                            setNewProduto({
                              ...newProduto,
                              largura: e.target.value ? Number(e.target.value) : undefined,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Data de Validade</Label>
                        <Input
                          type="date"
                          value={newProduto.data_validade || ""}
                          onChange={(e) =>
                            setNewProduto({ ...newProduto, data_validade: e.target.value || undefined })
                          }
                    />
                  </div>
                </div>
                  </div>

                  {/* Outros */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-foreground border-b pb-2 flex items-center gap-2">
                      <Info className="w-4 h-4 text-blue-500" />
                      Outros
                    </h3>
                    <div className="space-y-2">
                      <Label>Observações</Label>
                      <Textarea
                        placeholder="Observações adicionais sobre o produto"
                        value={newProduto.observacoes || ""}
                        onChange={(e) =>
                          setNewProduto({ ...newProduto, observacoes: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={newProduto.statusProduto || "ATIVO"}
                        onValueChange={(value: "ATIVO" | "INATIVO") =>
                          setNewProduto({
                            ...newProduto,
                            statusProduto: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ATIVO">Ativo</SelectItem>
                          <SelectItem value="INATIVO">Inativo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button
                    onClick={handleCreate}
                    className="w-full"
                    variant="gradient"
                    disabled={createProdutoMutation.isPending}
                  >
                    {createProdutoMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Cadastrando...
                      </>
                    ) : (
                      "Cadastrar Produto"
                    )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-card rounded-xl border border-border p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
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
                  {
                    Object.values(filtrosAvancados).filter((v) => v !== "" && v !== undefined)
                      .length
                  }
                </span>
              )}
            </Button>
            <Sheet
              open={filtrosDialogOpen}
              onOpenChange={setFiltrosDialogOpen}
            >
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
                  {/* Status */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">Status</Label>
                    <RadioGroup
                      value={filtrosAvancados.statusProduto || "none"}
                      onValueChange={(value) =>
                        setFiltrosAvancados({
                          ...filtrosAvancados,
                          statusProduto: value === "none" ? "" : value,
                        })
                      }
                      className="space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="none" id="status-all" />
                        <Label
                          htmlFor="status-all"
                          className="flex items-center gap-2 cursor-pointer flex-1"
                        >
                          <Circle className="w-3 h-3 text-primary" />
                          <span>Todos</span>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="ATIVO" id="status-ativo" />
                        <Label
                          htmlFor="status-ativo"
                          className="flex items-center gap-2 cursor-pointer flex-1"
                        >
                          <Circle className="w-3 h-3 text-green-500" />
                          <span>Ativo</span>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="INATIVO" id="status-inativo" />
                        <Label
                          htmlFor="status-inativo"
                          className="flex items-center gap-2 cursor-pointer flex-1"
                        >
                          <Circle className="w-3 h-3 text-muted-foreground" />
                          <span>Inativo</span>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <Separator />

                  {/* Categoria */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">Categoria</Label>
                    <Select
                      value={filtrosAvancados.categoriaId?.toString() || "none"}
                      onValueChange={(value) =>
                        setFiltrosAvancados({
                          ...filtrosAvancados,
                          categoriaId: value === "none" ? undefined : parseInt(value),
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todas as categorias" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Todas as categorias</SelectItem>
                        {categorias.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id.toString()}>
                            {cat.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  {/* Fornecedor */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">Fornecedor</Label>
                    <Select
                      value={filtrosAvancados.fornecedorId?.toString() || "none"}
                      onValueChange={(value) =>
                        setFiltrosAvancados({
                          ...filtrosAvancados,
                          fornecedorId: value === "none" ? undefined : parseInt(value),
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os fornecedores" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Todos os fornecedores</SelectItem>
                        {fornecedores.map((forn) => (
                          <SelectItem key={forn.id} value={forn.id.toString()}>
                            {forn.nome_fantasia}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  {/* Unidade de Medida */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">Unidade de Medida</Label>
                    <Select
                      value={filtrosAvancados.unidade_medida || "none"}
                      onValueChange={(value) =>
                        setFiltrosAvancados({
                          ...filtrosAvancados,
                          unidade_medida: value === "none" ? "" : value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todas as unidades" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Todas as unidades</SelectItem>
                        <SelectItem value="UN">Unidade (UN)</SelectItem>
                        <SelectItem value="KG">Quilograma (KG)</SelectItem>
                        <SelectItem value="LT">Litro (LT)</SelectItem>
                        <SelectItem value="CX">Caixa (CX)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  {/* Preço */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                      PREÇO
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Preço Mínimo</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={filtrosAvancados.precoMin || ""}
                          onChange={(e) =>
                            setFiltrosAvancados({
                              ...filtrosAvancados,
                              precoMin: e.target.value ? parseFloat(e.target.value) : undefined,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Preço Máximo</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={filtrosAvancados.precoMax || ""}
                          onChange={(e) =>
                            setFiltrosAvancados({
                              ...filtrosAvancados,
                              precoMax: e.target.value ? parseFloat(e.target.value) : undefined,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Estoque */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                      ESTOQUE
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Estoque Mínimo</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={filtrosAvancados.estoqueMin || ""}
                          onChange={(e) =>
                            setFiltrosAvancados({
                              ...filtrosAvancados,
                              estoqueMin: e.target.value ? parseInt(e.target.value) : undefined,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Estoque Máximo</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={filtrosAvancados.estoqueMax || ""}
                          onChange={(e) =>
                            setFiltrosAvancados({
                              ...filtrosAvancados,
                              estoqueMax: e.target.value ? parseInt(e.target.value) : undefined,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Validade */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                      VALIDADE
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Data Inicial</Label>
                        <Input
                          type="date"
                          value={filtrosAvancados.validadeInicial || ""}
                          onChange={(e) =>
                            setFiltrosAvancados({
                              ...filtrosAvancados,
                              validadeInicial: e.target.value || "",
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Data Final</Label>
                        <Input
                          type="date"
                          value={filtrosAvancados.validadeFinal || ""}
                          onChange={(e) =>
                            setFiltrosAvancados({
                              ...filtrosAvancados,
                              validadeFinal: e.target.value || "",
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Botões de ação */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={handleAplicarFiltros}
                      className="flex-1"
                      variant="gradient"
                    >
                      Aplicar Filtros
                    </Button>
                    <Button
                      onClick={handleLimparFiltros}
                      variant="outline"
                      className="flex-1"
                    >
                      Limpar Filtros
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por nome ou SKU..." 
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
          className="bg-card rounded-xl border border-border overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-sidebar text-sidebar-foreground">
                  <th className="text-left py-3 px-4 text-sm font-medium align-middle">
                    Nome
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium align-middle">
                    SKU
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium align-middle">
                    Preço
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium align-middle">
                    Estoque
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium align-middle">
                    Categoria
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium align-middle">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium align-middle">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoadingProdutos ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-8 text-center text-muted-foreground"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Carregando produtos...
                      </div>
                    </td>
                  </tr>
                ) : errorProdutos ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-8 text-center text-destructive"
                    >
                      Erro ao carregar produtos. Tente novamente.
                    </td>
                  </tr>
                ) : filteredProdutos.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-8 text-center text-muted-foreground"
                    >
                      Nenhum produto encontrado
                    </td>
                  </tr>
                ) : (
                  filteredProdutos.map((produto) => {
                    // Primeiro tenta usar a categoria que vem no produto (se populada pela API)
                    let categoriaNome = produto.categoria?.nome;
                    
                    // Se não tiver categoria populada, busca no array de categorias
                    if (!categoriaNome && produto.categoriaId) {
                      const categoriaEncontrada = categorias.find(c => {
                        // Compara tanto como número quanto como string para garantir compatibilidade
                        return Number(c.id) === Number(produto.categoriaId) || 
                               String(c.id) === String(produto.categoriaId);
                      });
                      categoriaNome = categoriaEncontrada?.nome;
                    }
                    
                    // Se ainda não encontrou, usa "-"
                    if (!categoriaNome) {
                      categoriaNome = "-";
                      
                      // Log de debug em desenvolvimento
                      if (import.meta.env.DEV && produto.categoriaId) {
                        console.log("Categoria não encontrada para produto:", {
                          produtoId: produto.id,
                          produtoNome: produto.nome,
                          categoriaId: produto.categoriaId,
                          categoriasDisponiveis: categorias.map(c => ({ id: c.id, nome: c.nome })),
                        });
                      }
                    }
                    
                    return (
                      <tr
                        key={produto.id}
                        className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors"
                      >
                        <td className="py-3 px-4 text-sm font-medium text-foreground align-middle">
                          {produto.nome}
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground align-middle">
                          {produto.sku}
                        </td>
                        <td className="py-3 px-4 text-sm font-medium text-foreground align-middle">
                          R$ {produto.preco_venda.toFixed(2).replace(".", ",")}
                        </td>
                        <td className="py-3 px-4 align-middle">
                          <span
                            className="text-sm font-medium"
                            style={{
                              color: getEstoqueColor(produto.estoque_atual, produto.estoque_minimo)
                            }}
                          >
                            {produto.estoque_atual}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground align-middle">
                          {categoriaNome}
                        </td>
                        <td className="py-3 px-4 align-middle">
                          <span
                            className={`text-xs px-2 py-1 rounded-full font-medium ${
                              produto.statusProduto === "ATIVO"
                                ? "bg-cyan/10 text-cyan"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {produto.statusProduto === "ATIVO" ? "Ativo" : "Inativo"}
                          </span>
                        </td>
                        <td className="py-3 px-4 align-middle">
                          <div className="flex gap-1">
                            <button 
                              className="p-2 hover:bg-secondary rounded-lg transition-colors"
                              onClick={() => {
                                setSelectedProduto(produto);
                                setViewDialogOpen(true);
                              }}
                              title="Visualizar produto"
                            >
                              <Eye className="w-4 h-4 text-muted-foreground" />
                            </button>
                            <button 
                              className="p-2 hover:bg-purple-500/10 rounded-lg transition-colors"
                              onClick={() => {
                                setSelectedProduto(produto);
                                setHistoricoSheetOpen(true);
                              }}
                              title="Ver histórico de movimentações"
                            >
                              <History className="w-4 h-4 text-purple-600" />
                            </button>
                            <button 
                              className="p-2 hover:bg-secondary rounded-lg transition-colors"
                              onClick={() => handleEdit(produto)}
                              title="Editar produto"
                            >
                              <Edit className="w-4 h-4 text-muted-foreground" />
                            </button>
                            <button 
                              className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                              onClick={() => handleDelete(produto.id)}
                              title="Excluir produto"
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </button>
                          </div>
                        </td>
                    </tr>
                    );
                  })
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
                Mostrando {produtos.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} a {Math.min(currentPage * pageSize, totalProdutos)} de {totalProdutos} produtos
              </div>
            </div>
          )}
        </motion.div>

        {/* Dialog de Visualização de Produto */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes do Produto</DialogTitle>
            </DialogHeader>
            {selectedProduto && (
              <div className="space-y-6 pt-4">
                {/* Informações Básicas */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground border-b pb-2">Informações Básicas</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Nome</Label>
                      <p className="font-medium">{selectedProduto.nome || "--"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">SKU</Label>
                      <p className="font-medium">{selectedProduto.sku || "--"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Descrição</Label>
                      <p className="font-medium">{selectedProduto.descricao || "--"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Status</Label>
                      <p className="font-medium">{selectedProduto.statusProduto || "--"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Unidade de Medida</Label>
                      <p className="font-medium">{selectedProduto.unidade_medida || "--"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Categoria</Label>
                      <p className="font-medium">
                        {selectedProduto.categoria?.nome || categorias.find(c => c.id === selectedProduto.categoriaId)?.nome || "--"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Fornecedor</Label>
                      <p className="font-medium">
                        {selectedProduto.fornecedor?.nome_fantasia || fornecedores.find(f => f.id === selectedProduto.fornecedorId)?.nome_fantasia || "--"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Preços */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground border-b pb-2">Preços</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Preço de Custo</Label>
                      <p className="font-medium">
                        {selectedProduto.preco_custo !== undefined && selectedProduto.preco_custo !== null
                          ? `R$ ${selectedProduto.preco_custo.toFixed(2).replace(".", ",")}`
                          : "--"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Preço de Venda</Label>
                      <p className="font-medium">
                        {selectedProduto.preco_venda !== undefined && selectedProduto.preco_venda !== null
                          ? `R$ ${selectedProduto.preco_venda.toFixed(2).replace(".", ",")}`
                          : "--"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Preço Promocional</Label>
                      <p className="font-medium">
                        {selectedProduto.preco_promocional !== undefined && selectedProduto.preco_promocional !== null
                          ? `R$ ${selectedProduto.preco_promocional.toFixed(2).replace(".", ",")}`
                          : "--"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Estoque */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground border-b pb-2">Estoque</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Estoque Atual</Label>
                      <p className="font-medium" style={{ color: getEstoqueColor(selectedProduto.estoque_atual, selectedProduto.estoque_minimo) }}>
                        {selectedProduto.estoque_atual !== undefined && selectedProduto.estoque_atual !== null
                          ? selectedProduto.estoque_atual
                          : "--"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Estoque Mínimo</Label>
                      <p className="font-medium">
                        {selectedProduto.estoque_minimo !== undefined && selectedProduto.estoque_minimo !== null
                          ? selectedProduto.estoque_minimo
                          : "--"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Estoque Máximo</Label>
                      <p className="font-medium">
                        {selectedProduto.estoque_maximo !== undefined && selectedProduto.estoque_maximo !== null
                          ? selectedProduto.estoque_maximo
                          : "--"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Localização</Label>
                      <p className="font-medium">{selectedProduto.localizacao || "--"}</p>
                    </div>
                  </div>
                </div>

                {/* Dimensões e Peso */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground border-b pb-2">Dimensões e Peso</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Peso (kg)</Label>
                      <p className="font-medium">
                        {selectedProduto.peso !== undefined && selectedProduto.peso !== null
                          ? `${selectedProduto.peso} kg`
                          : "--"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Altura (cm)</Label>
                      <p className="font-medium">
                        {selectedProduto.altura !== undefined && selectedProduto.altura !== null
                          ? `${selectedProduto.altura} cm`
                          : "--"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Largura (cm)</Label>
                      <p className="font-medium">
                        {selectedProduto.largura !== undefined && selectedProduto.largura !== null
                          ? `${selectedProduto.largura} cm`
                          : "--"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Informações Fiscais */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground border-b pb-2">Informações Fiscais</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">NCM</Label>
                      <p className="font-medium">{selectedProduto.ncm || "--"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">CEST</Label>
                      <p className="font-medium">{selectedProduto.cest || "--"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">CFOP</Label>
                      <p className="font-medium">{selectedProduto.cfop || "--"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Data de Validade</Label>
                      <p className="font-medium">
                        {selectedProduto.data_validade
                          ? new Date(selectedProduto.data_validade).toLocaleDateString("pt-BR")
                          : "--"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Observações */}
                {selectedProduto.observacoes && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground border-b pb-2">Observações</h3>
                    <p className="text-sm text-muted-foreground">{selectedProduto.observacoes}</p>
                  </div>
                )}

                {/* Datas */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground border-b pb-2">Datas</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Criado em</Label>
                      <p className="font-medium">
                        {selectedProduto.criadoEm
                          ? new Date(selectedProduto.criadoEm).toLocaleString("pt-BR")
                          : "--"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Atualizado em</Label>
                      <p className="font-medium">
                        {selectedProduto.atualizadoEm
                          ? new Date(selectedProduto.atualizadoEm).toLocaleString("pt-BR")
                          : "--"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog de Edição de Produto */}
        <Dialog 
          open={editDialogOpen} 
          onOpenChange={(open) => {
            setEditDialogOpen(open);
            if (!open) {
              setSelectedProduto(null);
              setEditingProduto({
                nome: "",
                descricao: "",
                sku: "",
                preco_custo: 0,
                preco_venda: 0,
                preco_promocional: undefined,
                estoque_atual: 0,
                estoque_minimo: 0,
                unidade_medida: "UN",
                statusProduto: "ATIVO",
                categoriaId: undefined,
                fornecedorId: undefined,
                data_validade: undefined,
                ncm: "",
                cest: "",
                cfop: "",
                observacoes: "",
                peso: undefined,
                altura: undefined,
                largura: undefined,
              });
            }
          }}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                Editar Produto
              </DialogTitle>
              <DialogDescription className="mt-1">
                Atualize as informações do produto no sistema
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-8 pt-6">
              {/* Seção: Informações Básicas */}
              <div className="bg-card border rounded-lg p-6 space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-orange-500/10">
                    <Package className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">
                      Informações Básicas
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Dados principais do produto
                    </p>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      Nome do Produto *
                    </Label>
                    <Input 
                      placeholder="Ex: Notebook Dell Inspiron"
                      value={editingProduto.nome || ""}
                      onChange={(e) =>
                        setEditingProduto({ ...editingProduto, nome: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      Descrição
                    </Label>
                    <Textarea
                      placeholder="Descrição detalhada do produto"
                      value={editingProduto.descricao || ""}
                      onChange={(e) =>
                        setEditingProduto({ ...editingProduto, descricao: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-muted-foreground" />
                      SKU *
                    </Label>
                    <Input 
                      placeholder="Ex: NB-DELL-001"
                      value={editingProduto.sku || ""}
                      onChange={(e) =>
                        setEditingProduto({ ...editingProduto, sku: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Seção: Categorização */}
              <div className="bg-card border rounded-lg p-6 space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <LayoutGrid className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">
                      Categorização
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Categoria e fornecedor do produto
                    </p>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <LayoutGrid className="w-4 h-4 text-muted-foreground" />
                        Categoria *
                      </Label>
                      <Select
                        value={editingProduto.categoriaId?.toString() || undefined}
                        onValueChange={(value) =>
                          setEditingProduto({
                            ...editingProduto,
                            categoriaId: Number(value),
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {categorias.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id.toString()}>
                              {cat.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-muted-foreground" />
                        Fornecedor *
                      </Label>
                      <Select
                        value={editingProduto.fornecedorId?.toString() || undefined}
                        onValueChange={(value) =>
                          setEditingProduto({
                            ...editingProduto,
                            fornecedorId: Number(value),
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um fornecedor" />
                        </SelectTrigger>
                        <SelectContent>
                          {fornecedores.map((forn) => (
                            <SelectItem key={forn.id} value={forn.id.toString()}>
                              {forn.nome_fantasia}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seção: Preços */}
              <div className="bg-card border rounded-lg p-6 space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <DollarSign className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">
                      Preços
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Valores de custo e venda
                    </p>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        Preço de Custo *
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={editingProduto.preco_custo || ""}
                        onChange={(e) =>
                          setEditingProduto({
                            ...editingProduto,
                            preco_custo: e.target.value ? Number(e.target.value) : 0,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        Preço de Venda *
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={editingProduto.preco_venda || ""}
                        onChange={(e) =>
                          setEditingProduto({
                            ...editingProduto,
                            preco_venda: e.target.value ? Number(e.target.value) : 0,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        Preço Promocional
                      </Label>
                      <Input 
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={editingProduto.preco_promocional || ""}
                        onChange={(e) =>
                          setEditingProduto({
                            ...editingProduto,
                            preco_promocional: e.target.value ? Number(e.target.value) : undefined,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Seção: Estoque */}
              <div className="bg-card border rounded-lg p-6 space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Package className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">
                      Estoque
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Controle de estoque e localização
                    </p>
                  </div>
                </div>
                <div className="space-y-6">
                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Estoque Atual *</Label>
                    <Input 
                      type="number"
                      placeholder="0"
                      value={editingProduto.estoque_atual || ""}
                      onChange={(e) =>
                        setEditingProduto({
                          ...editingProduto,
                          estoque_atual: e.target.value ? Number(e.target.value) : 0,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Estoque Mínimo *</Label>
                    <Input 
                      type="number"
                      placeholder="0"
                      value={editingProduto.estoque_minimo || ""}
                      onChange={(e) =>
                        setEditingProduto({
                          ...editingProduto,
                          estoque_minimo: e.target.value ? Number(e.target.value) : 0,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Estoque Máximo</Label>
                    <Input 
                      type="number"
                      placeholder="0"
                      value={editingProduto.estoque_maximo || ""}
                      onChange={(e) =>
                        setEditingProduto({
                          ...editingProduto,
                          estoque_maximo: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Unidade de Medida *</Label>
                    <Select
                      value={editingProduto.unidade_medida || "UN"}
                      onValueChange={(value: "UN" | "KG" | "LT" | "CX") =>
                        setEditingProduto({
                          ...editingProduto,
                          unidade_medida: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UN">Unidade (UN)</SelectItem>
                        <SelectItem value="KG">Quilograma (KG)</SelectItem>
                        <SelectItem value="LT">Litro (LT)</SelectItem>
                        <SelectItem value="CX">Caixa (CX)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      Localização
                    </Label>
                    <Input
                      placeholder="Ex: Prateleira A-01"
                      value={editingProduto.localizacao || ""}
                      onChange={(e) =>
                        setEditingProduto({ ...editingProduto, localizacao: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Seção: Informações Fiscais */}
              <div className="bg-card border rounded-lg p-6 space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-indigo-500/10">
                    <FileCheck className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">
                      Informações Fiscais
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Códigos fiscais e tributários
                    </p>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Hash className="w-4 h-4 text-muted-foreground" />
                        NCM
                      </Label>
                      <Input
                        placeholder="Ex: 8517.12.00"
                        maxLength={20}
                        value={editingProduto.ncm || ""}
                        onChange={(e) =>
                          setEditingProduto({ ...editingProduto, ncm: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Hash className="w-4 h-4 text-muted-foreground" />
                        CEST
                      </Label>
                      <Input
                        placeholder="Ex: 0100100"
                        maxLength={20}
                        value={editingProduto.cest || ""}
                        onChange={(e) =>
                          setEditingProduto({ ...editingProduto, cest: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Hash className="w-4 h-4 text-muted-foreground" />
                        CFOP
                      </Label>
                      <Input
                        placeholder="Ex: 5102"
                        maxLength={20}
                        value={editingProduto.cfop || ""}
                        onChange={(e) =>
                          setEditingProduto({ ...editingProduto, cfop: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Seção: Dimensões e Peso */}
              <div className="bg-card border rounded-lg p-6 space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-teal-500/10">
                    <Ruler className="w-5 h-5 text-teal-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">
                      Dimensões e Peso
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Medidas físicas do produto
                    </p>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Ruler className="w-4 h-4 text-muted-foreground" />
                        Peso (kg)
                      </Label>
                      <Input
                        type="number"
                        step="0.001"
                        placeholder="0.000"
                        value={editingProduto.peso || ""}
                        onChange={(e) =>
                          setEditingProduto({
                            ...editingProduto,
                            peso: e.target.value ? Number(e.target.value) : undefined,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Ruler className="w-4 h-4 text-muted-foreground" />
                        Altura (cm)
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={editingProduto.altura || ""}
                        onChange={(e) =>
                          setEditingProduto({
                            ...editingProduto,
                            altura: e.target.value ? Number(e.target.value) : undefined,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Ruler className="w-4 h-4 text-muted-foreground" />
                        Largura (cm)
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={editingProduto.largura || ""}
                        onChange={(e) =>
                          setEditingProduto({
                            ...editingProduto,
                            largura: e.target.value ? Number(e.target.value) : undefined,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        Data de Validade
                      </Label>
                      <Input
                        type="date"
                        value={editingProduto.data_validade || ""}
                        onChange={(e) =>
                          setEditingProduto({ ...editingProduto, data_validade: e.target.value || undefined })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Seção: Outros */}
              <div className="bg-card border rounded-lg p-6 space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-gray-500/10">
                    <Info className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">
                      Outros
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Observações e status do produto
                    </p>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      Observações
                    </Label>
                    <Textarea
                      placeholder="Observações adicionais sobre o produto"
                      value={editingProduto.observacoes || ""}
                      onChange={(e) =>
                        setEditingProduto({ ...editingProduto, observacoes: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">Status</Label>
                    <div className="grid grid-cols-2 gap-4">
                      {(["ATIVO", "INATIVO"] as const).map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() =>
                            setEditingProduto({
                              ...editingProduto,
                              statusProduto: status,
                            })
                          }
                          className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                            editingProduto.statusProduto === status
                              ? "border-primary bg-primary/5"
                              : "border-border bg-card hover:border-primary/50"
                          }`}
                        >
                          <Circle
                            className={`w-4 h-4 ${
                              editingProduto.statusProduto === status
                                ? status === "ATIVO"
                                  ? "text-green-500 fill-green-500"
                                  : "text-muted-foreground fill-muted-foreground"
                                : "text-muted-foreground"
                            }`}
                          />
                          <span className="font-medium">{status}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleUpdate}
                className="w-full"
                variant="gradient"
                disabled={updateProdutoMutation.isPending}
              >
                {updateProdutoMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Atualizando...
                  </>
                ) : (
                  "Atualizar Produto"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog de Confirmação de Exclusão */}
        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.
                {produtoToDelete && (
                  <span className="block mt-2 font-medium text-foreground">
                    Produto ID: {produtoToDelete}
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setProdutoToDelete(null)}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deleteProdutoMutation.isPending}
              >
                {deleteProdutoMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Sheet de Histórico de Movimentações */}
        <Sheet open={historicoSheetOpen} onOpenChange={setHistoricoSheetOpen}>
          <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
            <SheetHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <History className="w-5 h-5 text-purple-600" />
                </div>
                <SheetTitle className="text-xl">Histórico de Movimentações</SheetTitle>
              </div>
              {selectedProduto && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">{selectedProduto.nome}</p>
                  <p className="text-sm text-muted-foreground">SKU: {selectedProduto.sku}</p>
                </div>
              )}
            </SheetHeader>

            <div className="mt-6">
              {isLoadingHistorico ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Carregando histórico...</span>
                </div>
              ) : historicoData?.movimentacoes && historicoData.movimentacoes.length > 0 ? (
                <div className="space-y-3">
                  {historicoData.movimentacoes.map((mov) => {
                    return (
                      <div
                        key={mov.id}
                        className="border border-border rounded-lg p-4 hover:bg-secondary/50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {mov.tipo === "ENTRADA" && (
                              <ArrowDownCircle className="w-5 h-5" style={{ color: "#1E8449" }} />
                            )}
                            {mov.tipo === "DEVOLUCAO" && (
                              <RotateCcw className="w-5 h-5" style={{ color: "#21618C" }} />
                            )}
                            {mov.tipo === "SAIDA" && (
                              <ArrowUpCircle className="w-5 h-5" style={{ color: "#922B21" }} />
                            )}
                            {mov.tipo === "PERDA" && (
                              <AlertTriangle className="w-5 h-5" style={{ color: "#9C640C" }} />
                            )}
                            {mov.tipo === "TRANSFERENCIA" && (
                              <Truck className="w-5 h-5" style={{ color: "#5B2C6F" }} />
                            )}
                            {mov.tipo === "AJUSTE" && (
                              <Settings className="w-5 h-5" style={{ color: "#21618C" }} />
                            )}
                            <span 
                              className="font-semibold"
                              style={{
                                color: mov.tipo === "ENTRADA" ? "#1E8449" :
                                       mov.tipo === "DEVOLUCAO" ? "#21618C" :
                                       mov.tipo === "SAIDA" ? "#922B21" :
                                       mov.tipo === "PERDA" ? "#9C640C" :
                                       mov.tipo === "TRANSFERENCIA" ? "#5B2C6F" :
                                       "#21618C"
                              }}
                            >
                              {mov.tipo}
                            </span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {new Date(mov.criado_em).toLocaleString("pt-BR")}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mt-3">
                          <div>
                            <Label className="text-xs text-muted-foreground">Quantidade</Label>
                            <p 
                              className="font-medium"
                              style={{
                                color: mov.tipo === "ENTRADA" || mov.tipo === "DEVOLUCAO" ? "#1E8449" :
                                       mov.tipo === "PERDA" ? "#9C640C" :
                                       mov.tipo === "TRANSFERENCIA" ? "#5B2C6F" :
                                       mov.tipo === "SAIDA" ? "#922B21" :
                                       "#21618C"
                              }}
                            >
                              {(mov.tipo === "ENTRADA" || mov.tipo === "DEVOLUCAO") ? "+" : (mov.tipo === "SAIDA" || mov.tipo === "PERDA" || mov.tipo === "TRANSFERENCIA") ? "-" : ""}{mov.quantidade}
                            </p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Estoque Anterior</Label>
                            <p className="font-medium">{mov.estoque_anterior}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Estoque Atual</Label>
                            <p className="font-medium" style={{ color: getEstoqueColor(mov.estoque_atual, selectedProduto?.estoque_minimo || 0) }}>
                              {mov.estoque_atual}
                            </p>
                          </div>
                          {mov.documento_referencia && (
                            <div>
                              <Label className="text-xs text-muted-foreground">Documento</Label>
                              <p className="font-medium text-sm">{mov.documento_referencia}</p>
                            </div>
                          )}
                        </div>

                        {mov.motivo && (
                          <div className="mt-3">
                            <Label className="text-xs text-muted-foreground">Motivo</Label>
                            <p className="text-sm">{mov.motivo}</p>
                          </div>
                        )}

                        {mov.observacao && (
                          <div className="mt-2">
                            <Label className="text-xs text-muted-foreground">Observação</Label>
                            <p className="text-sm text-muted-foreground">{mov.observacao}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhuma movimentação registrada para este produto</p>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </AppLayout>
  );
};

export default Produtos;

