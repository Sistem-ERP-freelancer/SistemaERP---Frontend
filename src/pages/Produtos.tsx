import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
} from "@/services/produtos.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Box,
  Building2,
  Calendar,
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
  Package,
  Plus,
  Ruler,
  Search,
  Tag,
  Truck,
  Trash2,
  Warehouse,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";


const Produtos = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
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

  // Buscar categorias
  const { data: categorias = [], isLoading: isLoadingCategorias } = useQuery({
    queryKey: ["categorias"],
    queryFn: async () => {
      const response = await categoriasService.listar({
        limit: 100,
        statusCategoria: "ATIVO",
      });
      return Array.isArray(response) ? response : response.data || [];
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

  // Buscar produtos - usa busca avançada se houver filtros, busca simples se houver termo, senão lista todos
  const { data: produtosData, isLoading: isLoadingProdutos } = useQuery({
    queryKey: ["produtos", searchTerm, filtrosAvancados],
    queryFn: async () => {
      try {
        if (temFiltrosAtivos) {
          // Usa busca avançada quando há filtros
          const response = await produtosService.buscarAvancado({
            termo: searchTerm.trim() || undefined,
            ...filtrosAvancados,
            page: 1,
            limit: 100,
          });
          return response.produtos || response.data || [];
        } else if (searchTerm.trim()) {
          // Busca local por termo (já que não há endpoint de busca simples)
          const response = await produtosService.listar({
            page: 1,
            limit: 100,
          });
          const produtos = response.data || [];
          return produtos.filter((p) =>
            p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.sku.toLowerCase().includes(searchTerm.toLowerCase())
          );
        } else {
          // Lista todos quando não há termo nem filtros
          const response = await produtosService.listar({
            page: 1,
            limit: 100,
          });
          return response.data || [];
        }
      } catch (error) {
        console.warn("API de produtos não disponível:", error);
        return [];
      }
    },
    retry: false,
  });

  const produtos = produtosData || [];
  const filteredProdutos = produtos;

  // Calcular contagem de produtos por categoria
  const getProdutosCountByCategoria = (categoriaId: number) => {
    return produtos.filter((p) => p.categoriaId === categoriaId).length;
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
      categoriaId: newProduto.categoriaId || undefined,
      fornecedorId: newProduto.fornecedorId || undefined,
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

  const handleDelete = (id: number) => {
    // TODO: Implementar exclusão via API
    queryClient.invalidateQueries({ queryKey: ["produtos"] });
    toast.success("Produto excluído!");
  };

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
                <div className="bg-gradient-to-r from-primary to-primary/80 p-6 text-primary-foreground">
                  <DialogHeader>
                    <DialogTitle className="text-base font-bold text-primary-foreground flex items-center gap-2">
                      <div className="bg-primary-foreground/20 p-2 rounded-lg">
                        <LayoutGrid className="w-5 h-5" />
                      </div>
                      Gerenciar Categorias
                    </DialogTitle>
                  </DialogHeader>
                  <p className="text-primary-foreground/70 text-sm mt-2">
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
                        <Label>Categoria</Label>
                        <Select
                          value={newProduto.categoriaId?.toString() || undefined}
                          onValueChange={(value) =>
                            setNewProduto({
                              ...newProduto,
                              categoriaId: value && value !== "none" ? Number(value) : undefined,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Nenhuma</SelectItem>
                            {categorias.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id.toString()}>
                                {cat.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Fornecedor</Label>
                        <Select
                          value={newProduto.fornecedorId?.toString() || undefined}
                          onValueChange={(value) =>
                            setNewProduto({
                              ...newProduto,
                              fornecedorId: value && value !== "none" ? Number(value) : undefined,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um fornecedor" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Nenhum</SelectItem>
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
                      <Warehouse className="w-4 h-4 text-blue-500" />
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
                  <th className="text-left py-3 px-4 text-sm font-medium">
                    Nome
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium">
                    SKU
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium">
                    Preço
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium">
                    Estoque
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium">
                    Categoria
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredProdutos.length === 0 ? (
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
                    const categoriaNome = categorias.find(c => c.id === produto.categoriaId)?.nome || "-";
                    return (
                      <tr
                        key={produto.id}
                        className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors"
                      >
                        <td className="py-3 px-4 text-sm font-medium text-foreground">
                          {produto.nome}
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {produto.sku}
                        </td>
                        <td className="py-3 px-4 text-sm font-medium text-foreground">
                          R$ {produto.preco_venda.toFixed(2).replace(".", ",")}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-sm font-medium ${
                              produto.estoque_atual < 10
                                ? "text-destructive"
                                : "text-foreground"
                            }`}
                          >
                            {produto.estoque_atual}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {categoriaNome}
                        </td>
                        <td className="py-3 px-4">
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
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                            <Edit className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <button 
                            className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                            onClick={() => handleDelete(produto.id)}
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
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default Produtos;
