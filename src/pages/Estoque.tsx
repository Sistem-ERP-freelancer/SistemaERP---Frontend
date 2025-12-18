import { useState } from "react";
import { motion } from "framer-motion";
import {
  Boxes,
  Plus,
  Search,
  Eye,
  Edit,
  ArrowUpCircle,
  ArrowDownCircle,
  AlertTriangle,
  Package,
  Loader2,
  History,
  Filter,
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { produtosService, Produto, FiltrosProdutos } from "@/services/produtos.service";
import {
  estoqueService,
  TipoMovimentacao,
  MovimentacaoEstoqueDto,
} from "@/services/estoque.service";
import { categoriasService, Categoria } from "@/services/categorias.service";
import { fornecedoresService, Fornecedor } from "@/services/fornecedores.service";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const Estoque = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogMovimentacaoOpen, setDialogMovimentacaoOpen] = useState(false);
  const [filtrosDialogOpen, setFiltrosDialogOpen] = useState(false);
  const [sheetHistoricoOpen, setSheetHistoricoOpen] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(
    null
  );
  const [movimentacao, setMovimentacao] = useState<MovimentacaoEstoqueDto>({
    tipo: "ENTRADA",
    quantidade: 0,
    observacao: "",
    motivo: "",
    documento_referencia: "",
  });
  const [filtrosAvancados, setFiltrosAvancados] = useState<FiltrosProdutos>({
    categoriaId: undefined,
    fornecedorId: undefined,
    statusProduto: undefined,
    unidade_medida: undefined,
    estoqueMin: undefined,
    estoqueMax: undefined,
  });

  const queryClient = useQueryClient();

  // Buscar categorias
  const { data: categoriasData, isLoading: isLoadingCategorias } = useQuery({
    queryKey: ["categorias-estoque"],
    queryFn: async () => {
      try {
        const response = await categoriasService.listar({
          limit: 100,
          statusCategoria: "ATIVO",
        });
        return Array.isArray(response) ? response : response.data || [];
      } catch (error: any) {
        // Se for erro 404, não há categorias cadastradas
        if (error?.response?.status === 404) {
          return [];
        }
        // Outros erros, retorna array vazio
        return [];
      }
    },
    retry: false,
  });

  const categorias: Categoria[] = Array.isArray(categoriasData)
    ? categoriasData
    : categoriasData?.data || [];

  // Buscar fornecedores
  const { data: fornecedoresData, isLoading: isLoadingFornecedores } = useQuery({
    queryKey: ["fornecedores-estoque"],
    queryFn: async () => {
      try {
        const response = await fornecedoresService.listar({
          limit: 100,
          statusFornecedor: "ATIVO",
        });
        return Array.isArray(response) ? response : response.data || response.fornecedores || [];
      } catch (error: any) {
        // Se for erro 404, não há fornecedores cadastrados
        if (error?.response?.status === 404) {
          return [];
        }
        // Outros erros, retorna array vazio
        return [];
      }
    },
    retry: false,
  });

  const fornecedores: Fornecedor[] = Array.isArray(fornecedoresData)
    ? fornecedoresData
    : fornecedoresData?.data || fornecedoresData?.fornecedores || [];

  // Verificar se há filtros ativos
  const temFiltrosAtivos = Object.values(filtrosAvancados).some(
    (val) => val !== "" && val !== undefined && val !== null
  );

  // Query para listar produtos
  const {
    data: produtosData,
    isLoading: isLoadingProdutos,
    error: errorProdutos,
  } = useQuery({
    queryKey: ["produtos-estoque", filtrosAvancados, searchTerm],
    queryFn: async () => {
      try {
        // Se houver filtros avançados, usa busca avançada
        if (temFiltrosAtivos) {
          const response = await produtosService.buscarAvancado({
            termo: searchTerm.trim() || undefined,
            ...filtrosAvancados,
            page: 1,
            limit: 100,
          });
          return response || { data: [], produtos: [], total: 0 };
        }

        // Lista todos os produtos
        const response = await produtosService.listar({ page: 1, limit: 100 });
        return response || { data: [], produtos: [], total: 0 };
      } catch (error: any) {
        // Se for erro 404 ou resposta vazia, não é um erro real
        // Apenas retorna estrutura vazia (sem produtos cadastrados)
        if (error?.response?.status === 404) {
          return { data: [], produtos: [], total: 0 };
        }
        // Se for erro de conexão ou outro erro real, propaga o erro
        throw error;
      }
    },
    retry: 1, // Tenta apenas 1 vez em caso de erro
  });

  // Query para histórico de movimentações
  const {
    data: historicoData,
    isLoading: isLoadingHistorico,
  } = useQuery({
    queryKey: ["historico-estoque", produtoSelecionado?.id],
    queryFn: async () => {
      if (!produtoSelecionado?.id) return null;
      return await estoqueService.obterHistorico(produtoSelecionado.id, {
        page: 1,
        limit: 50,
      });
    },
    enabled: !!produtoSelecionado?.id && sheetHistoricoOpen,
  });

  // Mutation para movimentar estoque
  const movimentarEstoqueMutation = useMutation({
    mutationFn: async ({
      produtoId,
      data,
    }: {
      produtoId: number;
      data: MovimentacaoEstoqueDto;
    }) => {
      return await estoqueService.movimentar(produtoId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["produtos-estoque"] });
      queryClient.invalidateQueries({ queryKey: ["produtos"] });
      toast.success("Estoque movimentado com sucesso!");
      setDialogMovimentacaoOpen(false);
      setMovimentacao({
        tipo: "ENTRADA",
        quantidade: 0,
        observacao: "",
        motivo: "",
        documento_referencia: "",
      });
      setProdutoSelecionado(null);
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message || "Erro ao movimentar estoque";
      toast.error(errorMessage);
    },
  });

  // Obter lista de produtos - busca avançada retorna em 'produtos', listar retorna em 'data'
  const produtos: Produto[] = produtosData
    ? produtosData.produtos || produtosData.data || []
    : [];

  // Verificar se há produtos cadastrados (não é erro, apenas vazio)
  const temProdutos = produtos.length > 0;
  const isRealError = errorProdutos && !produtosData;

  // Filtrar produtos por termo de busca (apenas se não usar busca avançada)
  const filteredProdutos = temFiltrosAtivos
    ? produtos // Já filtrado pela API quando há filtros avançados
    : produtos.filter((produto) => {
        if (!searchTerm.trim()) return true;
        const termo = searchTerm.toLowerCase();
        return (
          produto.nome.toLowerCase().includes(termo) ||
          produto.sku.toLowerCase().includes(termo)
        );
      });

  // Limpar filtros
  const handleLimparFiltros = () => {
    setFiltrosAvancados({
      categoriaId: undefined,
      fornecedorId: undefined,
      statusProduto: undefined,
      unidade_medida: undefined,
      estoqueMin: undefined,
      estoqueMax: undefined,
    });
    setFiltrosDialogOpen(false);
  };

  // Aplicar filtros
  const handleAplicarFiltros = () => {
    setFiltrosDialogOpen(false);
    // A query será atualizada automaticamente pelo React Query
  };

  // Calcular status do estoque
  const calcularStatus = (produto: Produto): {
    status: "Normal" | "Baixo" | "Crítico" | "Sem Estoque";
    cor: string;
  } => {
    const { estoque_atual, estoque_minimo } = produto;

    if (estoque_atual === 0) {
      return { status: "Sem Estoque", cor: "bg-muted text-muted-foreground" };
    }

    if (estoque_atual < estoque_minimo * 0.5) {
      return { status: "Crítico", cor: "bg-destructive/10 text-destructive" };
    }

    if (estoque_atual <= estoque_minimo) {
      return { status: "Baixo", cor: "bg-amber-500/10 text-amber-500" };
    }

    return { status: "Normal", cor: "bg-cyan/10 text-cyan" };
  };

  // Abrir modal de movimentação
  const handleAbrirMovimentacao = (produto: Produto) => {
    setProdutoSelecionado(produto);
    setMovimentacao({
      tipo: "ENTRADA",
      quantidade: 0,
      observacao: "",
      motivo: "",
      documento_referencia: "",
    });
    setDialogMovimentacaoOpen(true);
  };

  // Abrir histórico
  const handleAbrirHistorico = (produto: Produto) => {
    setProdutoSelecionado(produto);
    setSheetHistoricoOpen(true);
  };

  // Submeter movimentação
  const handleMovimentar = () => {
    if (!produtoSelecionado) {
      toast.error("Selecione um produto");
      return;
    }

    if (!movimentacao.quantidade || movimentacao.quantidade <= 0) {
      toast.error("Informe uma quantidade válida");
      return;
    }

    movimentarEstoqueMutation.mutate({
      produtoId: produtoSelecionado.id,
      data: movimentacao,
    });
  };

  return (
    <AppLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Estoque</h1>
            <p className="text-muted-foreground">
              Controle de estoque dos produtos
            </p>
          </div>
          <Dialog
            open={dialogMovimentacaoOpen}
            onOpenChange={(open) => {
              setDialogMovimentacaoOpen(open);
              if (!open) {
                setProdutoSelecionado(null);
                setMovimentacao({
                  tipo: "ENTRADA",
                  quantidade: 0,
                  observacao: "",
                  motivo: "",
                  documento_referencia: "",
                });
              }
            }}
          >
            <DialogTrigger asChild>
              <Button variant="gradient" className="gap-2">
                <Plus className="w-4 h-4" />
                Movimentar Estoque
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Movimentação de Estoque</DialogTitle>
                <DialogDescription>
                  {produtoSelecionado
                    ? `Movimentar estoque de ${produtoSelecionado.nome}`
                    : "Selecione um produto para movimentar"}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 pt-4">
                {!produtoSelecionado ? (
                  <div className="space-y-2">
                    <Label>Selecione o Produto</Label>
                    <Select
                      onValueChange={(value) => {
                        const produto = produtos.find((p) => p.id === Number(value));
                        if (produto) setProdutoSelecionado(produto);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Buscar produto..." />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingProdutos ? (
                          <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                            Carregando produtos...
                          </div>
                        ) : produtos.length === 0 ? (
                          <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                            {searchTerm || temFiltrosAtivos
                              ? "Nenhum produto encontrado"
                              : "Não há produtos cadastrados"}
                          </div>
                        ) : (
                          produtos.map((produto) => (
                          <SelectItem key={produto.id} value={produto.id.toString()}>
                            {produto.nome} ({produto.sku}) - Estoque: {produto.estoque_atual}
                          </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <>
                    <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Produto:</span>
                        <span className="text-sm">{produtoSelecionado.nome}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">SKU:</span>
                        <span className="text-sm">{produtoSelecionado.sku}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Estoque Atual:</span>
                        <span className="text-sm font-bold">{produtoSelecionado.estoque_atual}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Tipo de Movimentação</Label>
                        <Select
                          value={movimentacao.tipo}
                          onValueChange={(value) =>
                            setMovimentacao({
                              ...movimentacao,
                              tipo: value as TipoMovimentacao,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ENTRADA">Entrada</SelectItem>
                            <SelectItem value="SAIDA">Saída</SelectItem>
                            <SelectItem value="AJUSTE">Ajuste</SelectItem>
                            <SelectItem value="DEVOLUCAO">Devolução</SelectItem>
                            <SelectItem value="PERDA">Perda</SelectItem>
                            <SelectItem value="TRANSFERENCIA">Transferência</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Quantidade *</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0"
                          value={movimentacao.quantidade || ""}
                          onChange={(e) =>
                            setMovimentacao({
                              ...movimentacao,
                              quantidade: Number(e.target.value),
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Motivo</Label>
                      <Input
                        placeholder="Ex: Compra de fornecedor, Venda, etc."
                        value={movimentacao.motivo || ""}
                        onChange={(e) =>
                          setMovimentacao({
                            ...movimentacao,
                            motivo: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Documento de Referência</Label>
                      <Input
                        placeholder="Ex: NF-12345, Pedido #123"
                        value={movimentacao.documento_referencia || ""}
                        onChange={(e) =>
                          setMovimentacao({
                            ...movimentacao,
                            documento_referencia: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Observações</Label>
                      <Textarea
                        placeholder="Observações adicionais..."
                        value={movimentacao.observacao || ""}
                        onChange={(e) =>
                          setMovimentacao({
                            ...movimentacao,
                            observacao: e.target.value,
                          })
                        }
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={handleMovimentar}
                        disabled={movimentarEstoqueMutation.isPending}
                        className="flex-1 gap-2"
                      >
                        {movimentarEstoqueMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Processando...
                          </>
                        ) : (
                          <>
                            {movimentacao.tipo === "ENTRADA" ||
                            movimentacao.tipo === "DEVOLUCAO" ? (
                              <ArrowUpCircle className="w-4 h-4" />
                            ) : (
                              <ArrowDownCircle className="w-4 h-4" />
                            )}
                            Confirmar Movimentação
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filters */}
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
                  {
                    Object.values(filtrosAvancados).filter(
                      (v) => v !== undefined && v !== null && v !== ""
                    ).length
                  }
                </span>
              )}
            </Button>

            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por produto ou SKU..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Sheet de Filtros */}
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
              {/* Categoria */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Categoria</Label>
                  {filtrosAvancados.categoriaId && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() =>
                        setFiltrosAvancados({
                          ...filtrosAvancados,
                          categoriaId: undefined,
                        })
                      }
                    >
                      <X className="w-3 h-3 mr-1" />
                      Limpar
                    </Button>
                  )}
                </div>
                <Select
                  value={filtrosAvancados.categoriaId?.toString() || undefined}
                  onValueChange={(value) =>
                    setFiltrosAvancados({
                      ...filtrosAvancados,
                      categoriaId: value ? Number(value) : undefined,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingCategorias ? (
                      <SelectItem value="loading" disabled>
                        Carregando categorias...
                      </SelectItem>
                    ) : categorias.length > 0 ? (
                      categorias.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.nome}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-categories" disabled>
                        Não há categorias cadastradas
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

            {/* Fornecedor */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Fornecedor</Label>
                {filtrosAvancados.fornecedorId && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() =>
                      setFiltrosAvancados({
                        ...filtrosAvancados,
                        fornecedorId: undefined,
                      })
                    }
                  >
                    <X className="w-3 h-3 mr-1" />
                    Limpar
                  </Button>
                )}
              </div>
              <Select
                value={filtrosAvancados.fornecedorId?.toString() || undefined}
                onValueChange={(value) =>
                  setFiltrosAvancados({
                    ...filtrosAvancados,
                    fornecedorId: value ? Number(value) : undefined,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os fornecedores" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingFornecedores ? (
                    <SelectItem value="loading" disabled>
                      Carregando fornecedores...
                    </SelectItem>
                  ) : fornecedores.length > 0 ? (
                    fornecedores.map((forn) => (
                      <SelectItem key={forn.id} value={forn.id.toString()}>
                        {forn.nome_fantasia}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-suppliers" disabled>
                      Não há fornecedores cadastrados
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Status */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Status do Produto</Label>
                {filtrosAvancados.statusProduto && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() =>
                      setFiltrosAvancados({
                        ...filtrosAvancados,
                        statusProduto: undefined,
                      })
                    }
                  >
                    <X className="w-3 h-3 mr-1" />
                    Limpar
                  </Button>
                )}
              </div>
              <Select
                value={filtrosAvancados.statusProduto || undefined}
                onValueChange={(value) =>
                  setFiltrosAvancados({
                    ...filtrosAvancados,
                    statusProduto: value || undefined,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ATIVO">Ativo</SelectItem>
                  <SelectItem value="INATIVO">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Unidade de Medida */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Unidade de Medida</Label>
                {filtrosAvancados.unidade_medida && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() =>
                      setFiltrosAvancados({
                        ...filtrosAvancados,
                        unidade_medida: undefined,
                      })
                    }
                  >
                    <X className="w-3 h-3 mr-1" />
                    Limpar
                  </Button>
                )}
              </div>
              <Select
                value={filtrosAvancados.unidade_medida || undefined}
                onValueChange={(value) =>
                  setFiltrosAvancados({
                    ...filtrosAvancados,
                    unidade_medida: value || undefined,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as unidades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UN">Unidade (UN)</SelectItem>
                  <SelectItem value="KG">Quilograma (KG)</SelectItem>
                  <SelectItem value="LT">Litro (LT)</SelectItem>
                  <SelectItem value="CX">Caixa (CX)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Faixa de Estoque */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Estoque Mínimo</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={filtrosAvancados.estoqueMin || ""}
                  onChange={(e) =>
                    setFiltrosAvancados({
                      ...filtrosAvancados,
                      estoqueMin: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Estoque Máximo</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="Sem limite"
                  value={filtrosAvancados.estoqueMax || ""}
                  onChange={(e) =>
                    setFiltrosAvancados({
                      ...filtrosAvancados,
                      estoqueMax: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                />
              </div>
            </div>

              {/* Botões */}
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleLimparFiltros}
                  variant="outline"
                  className="flex-1"
                >
                  <X className="w-4 h-4 mr-2" />
                  Limpar Filtros
                </Button>
                <Button onClick={handleAplicarFiltros} className="flex-1">
                  Aplicar Filtros
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Tabela */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl border border-border overflow-hidden"
        >
          {isLoadingProdutos ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : isRealError ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
              <p className="text-destructive font-medium">
                Erro ao carregar produtos
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Tente novamente mais tarde
              </p>
            </div>
          ) : !temProdutos ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-foreground font-medium text-lg">
                Nenhum produto cadastrado
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {temFiltrosAtivos
                  ? "Nenhum produto encontrado com os filtros aplicados"
                  : "Cadastre produtos para começar a gerenciar o estoque"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-sidebar text-sidebar-foreground">
                    <th className="text-left py-3 px-4 text-sm font-medium">
                      Produto
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium">
                      SKU
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium">
                      Quantidade
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium">
                      Mínimo
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium">
                      Máximo
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium">
                      Localização
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
                        colSpan={8}
                        className="py-8 text-center text-muted-foreground"
                      >
                        {searchTerm
                          ? "Nenhum produto encontrado com o termo buscado"
                          : "Nenhum produto encontrado"}
                      </td>
                    </tr>
                  ) : (
                    filteredProdutos.map((produto) => {
                      const { status, cor } = calcularStatus(produto);
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
                          <td className="py-3 px-4">
                            <span
                              className={`text-sm font-bold ${
                                produto.estoque_atual < produto.estoque_minimo
                                  ? "text-destructive"
                                  : "text-foreground"
                              }`}
                            >
                              {produto.estoque_atual}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">
                            {produto.estoque_minimo}
                          </td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">
                            {produto.estoque_maximo || "-"}
                          </td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">
                            {produto.localizacao || "-"}
                          </td>
                          <td className="py-3 px-4">
                            <Badge className={cor}>{status}</Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleAbrirHistorico(produto)}
                                className="h-8 w-8"
                              >
                                <History className="w-4 h-4 text-muted-foreground" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleAbrirMovimentacao(produto)}
                                className="h-8 w-8"
                              >
                                <Edit className="w-4 h-4 text-muted-foreground" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Sheet de Histórico */}
        <Sheet open={sheetHistoricoOpen} onOpenChange={setSheetHistoricoOpen}>
          <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Histórico de Movimentações
              </SheetTitle>
              <SheetDescription>
                {produtoSelecionado &&
                  `Histórico de movimentações de ${produtoSelecionado.nome} (${produtoSelecionado.sku})`}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-4">
              {isLoadingHistorico ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : historicoData?.movimentacoes &&
                historicoData.movimentacoes.length > 0 ? (
                <div className="space-y-3">
                  {historicoData.movimentacoes.map((mov) => (
                    <div
                      key={mov.id}
                      className="bg-secondary/50 rounded-lg p-4 space-y-2 border border-border"
                    >
                      <div className="flex items-center justify-between">
                        <Badge
                          variant={
                            mov.tipo === "ENTRADA" || mov.tipo === "DEVOLUCAO"
                              ? "default"
                              : "destructive"
                          }
                        >
                          {mov.tipo}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(mov.criado_em).toLocaleString("pt-BR")}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">
                            Quantidade:
                          </span>{" "}
                          <span className="font-medium">{mov.quantidade}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Estoque:
                          </span>{" "}
                          <span className="font-medium">
                            {mov.estoque_anterior} → {mov.estoque_atual}
                          </span>
                        </div>
                      </div>
                      {mov.motivo && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Motivo:</span>{" "}
                          <span className="font-medium">{mov.motivo}</span>
                        </div>
                      )}
                      {mov.documento_referencia && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">
                            Documento:
                          </span>{" "}
                          <span className="font-medium">
                            {mov.documento_referencia}
                          </span>
                        </div>
                      )}
                      {mov.observacao && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">
                            Observação:
                          </span>{" "}
                          <span className="font-medium">{mov.observacao}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Nenhuma movimentação registrada
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </AppLayout>
  );
};

export default Estoque;
