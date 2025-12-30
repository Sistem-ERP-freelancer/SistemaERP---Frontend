import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Calendar,
  Plus,
  Search,
  Filter,
  Package,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import AppLayout from "@/components/layout/AppLayout";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { produtosService, Produto } from "@/services/produtos.service";
import {
  estoqueService,
  TipoMovimentacao,
  MovimentacaoEstoqueDto,
  MovimentacaoEstoque,
} from "@/services/estoque.service";

const Estoque = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<string>("Todos");
  const [dialogMovimentacaoOpen, setDialogMovimentacaoOpen] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);
  const [movimentacao, setMovimentacao] = useState<MovimentacaoEstoqueDto>({
    tipo: "ENTRADA",
    quantidade: 0,
    observacao: "",
    motivo: "",
    documento_referencia: "",
  });

  // Buscar produtos para seleção
  const { data: produtosData } = useQuery({
    queryKey: ["produtos-movimentacao"],
    queryFn: async () => {
      const response = await produtosService.listar({ page: 1, limit: 100 });
      return response.data || [];
    },
  });

  const produtos: Produto[] = produtosData || [];

  // Buscar todas as movimentações
  const { data: movimentacoesData, isLoading: isLoadingMovimentacoes } = useQuery({
    queryKey: ["movimentacoes", filtroTipo, produtos.length],
    queryFn: async () => {
      try {
        // Tenta primeiro usar o endpoint de listar todas as movimentações
        try {
          const params: any = { page: 1, limit: 100 };
          if (filtroTipo !== "Todos") {
            params.tipo = filtroTipo;
          }
          const response = await estoqueService.listarMovimentacoes(params);
          if (response?.movimentacoes) {
            return response;
          }
        } catch (endpointError: any) {
          // Se o endpoint não existir (404), usa abordagem alternativa
          if (endpointError?.response?.status !== 404) {
            throw endpointError;
          }
        }

        // Abordagem alternativa: busca histórico de cada produto e agrega
        const todasMovimentacoes: MovimentacaoEstoque[] = [];
        
        // Limita a 30 produtos para não sobrecarregar
        const produtosLimitados = produtos.slice(0, 30);
        
        await Promise.all(
          produtosLimitados.map(async (produto) => {
            try {
              const historico = await estoqueService.obterHistorico(produto.id, {
                page: 1,
                limit: 50,
              });
              
              if (historico?.movimentacoes) {
                historico.movimentacoes.forEach((mov) => {
                  // Adiciona informações do produto se não vierem
                  if (!mov.produto) {
                    mov.produto = {
                      id: produto.id,
                      nome: produto.nome,
                      sku: produto.sku,
                    };
                  }
                  todasMovimentacoes.push(mov);
                });
              }
            } catch (error) {
              // Ignora erros de produtos individuais
            }
          })
        );

        // Ordena por data (mais recentes primeiro)
        todasMovimentacoes.sort((a, b) => {
          return new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime();
        });

        // Filtra por tipo se necessário
        let movimentacoesFiltradas = todasMovimentacoes;
        if (filtroTipo !== "Todos") {
          movimentacoesFiltradas = todasMovimentacoes.filter(
            (mov) => mov.tipo === filtroTipo
          );
        }

        return {
          movimentacoes: movimentacoesFiltradas,
          total: movimentacoesFiltradas.length,
        };
      } catch (error: any) {
        console.error("Erro ao buscar movimentações:", error);
        return { movimentacoes: [], total: 0 };
      }
    },
    enabled: produtos.length > 0,
    retry: 1,
  });

  const movimentacoes: MovimentacaoEstoque[] = movimentacoesData?.movimentacoes || [];

  // Filtrar movimentações por busca
  const movimentacoesFiltradas = useMemo(() => {
    if (!searchTerm.trim()) return movimentacoes;
    
    const termo = searchTerm.toLowerCase();
    return movimentacoes.filter((mov) => {
      const produtoNome = mov.produto?.nome?.toLowerCase() || "";
      const produtoSku = mov.produto?.sku?.toLowerCase() || "";
      return produtoNome.includes(termo) || produtoSku.includes(termo);
    });
  }, [movimentacoes, searchTerm]);

  // Calcular totais
  const { totalEntradas, totalSaidas, balanco } = useMemo(() => {
    let entradas = 0;
    let saidas = 0;

    movimentacoesFiltradas.forEach((mov) => {
      if (mov.tipo === "ENTRADA" || mov.tipo === "DEVOLUCAO") {
        entradas += mov.quantidade;
      } else if (mov.tipo === "SAIDA" || mov.tipo === "PERDA" || mov.tipo === "TRANSFERENCIA") {
        saidas += mov.quantidade;
      }
    });

    return {
      totalEntradas: entradas,
      totalSaidas: saidas,
      balanco: entradas - saidas,
    };
  }, [movimentacoesFiltradas]);

  // Mutation para criar movimentação
  const movimentarEstoqueMutation = useMutation({
    mutationFn: ({ produtoId, data }: { produtoId: number; data: MovimentacaoEstoqueDto }) =>
      estoqueService.movimentar(produtoId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["movimentacoes"] });
      queryClient.invalidateQueries({ queryKey: ["produtos"] });
      setDialogMovimentacaoOpen(false);
      setProdutoSelecionado(null);
      setMovimentacao({
        tipo: "ENTRADA",
        quantidade: 0,
        observacao: "",
        motivo: "",
        documento_referencia: "",
      });
      toast.success("Movimentação realizada com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Erro ao realizar movimentação");
    },
  });

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

  const formatarDataHora = (data: string) => {
    return new Date(data).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isEntrada = (tipo: TipoMovimentacao) => {
    return tipo === "ENTRADA" || tipo === "DEVOLUCAO";
  };

  const isSaida = (tipo: TipoMovimentacao) => {
    return tipo === "SAIDA" || tipo === "PERDA" || tipo === "TRANSFERENCIA";
  };

  return (
    <AppLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Movimentações</h1>
            <p className="text-muted-foreground">
              Registro de entradas e saídas de estoque
            </p>
          </div>
        </div>

        {/* Cards de Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-500/10 border border-green-500/20 rounded-xl p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Entradas</p>
                <p className="text-2xl font-bold text-green-600">
                  +{totalEntradas} un
                </p>
              </div>
              <div className="p-3 bg-green-500/20 rounded-lg">
                <ArrowDownCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-red-500/10 border border-red-500/20 rounded-xl p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Saídas</p>
                <p className="text-2xl font-bold text-red-600">
                  -{totalSaidas} un
                </p>
              </div>
              <div className="p-3 bg-red-500/20 rounded-lg">
                <ArrowUpCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Balanço</p>
                <p className={`text-2xl font-bold ${balanco >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {balanco >= 0 ? "+" : ""}{balanco} un
                </p>
              </div>
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Barra de Busca e Filtros */}
        <div className="bg-card rounded-xl border border-border p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por produto ou SKU..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos</SelectItem>
                <SelectItem value="ENTRADA">Entrada</SelectItem>
                <SelectItem value="SAIDA">Saída</SelectItem>
                <SelectItem value="AJUSTE">Ajuste</SelectItem>
                <SelectItem value="DEVOLUCAO">Devolução</SelectItem>
                <SelectItem value="PERDA">Perda</SelectItem>
                <SelectItem value="TRANSFERENCIA">Transferência</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => setDialogMovimentacaoOpen(true)}
              variant="gradient"
              className="gap-2 w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              Nova Movimentação
            </Button>
          </div>
        </div>

        {/* Tabela de Movimentações */}
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
                    Tipo
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium align-middle">
                    SKU
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium align-middle">
                    Produto
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium align-middle">
                    Qtd
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium align-middle">
                    Data/Hora
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium align-middle">
                    Responsável
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium align-middle">
                    Motivo
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoadingMovimentacoes ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Carregando movimentações...
                      </div>
                    </td>
                  </tr>
                ) : movimentacoesFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      Nenhuma movimentação encontrada
                    </td>
                  </tr>
                ) : (
                  movimentacoesFiltradas.map((mov) => {
                    const entrada = isEntrada(mov.tipo);
                    const saida = isSaida(mov.tipo);

                    return (
                      <tr
                        key={mov.id}
                        className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors"
                      >
                        <td className="py-3 px-4 align-middle">
                          <div className="flex items-center gap-2">
                            {entrada && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-600 border border-green-500/20">
                                <ArrowDownCircle className="w-3 h-3" />
                                Entrada
                              </span>
                            )}
                            {saida && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-600 border border-red-500/20">
                                <ArrowUpCircle className="w-3 h-3" />
                                Saída
                              </span>
                            )}
                            {mov.tipo === "AJUSTE" && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 border border-blue-500/20">
                                <Package className="w-3 h-3" />
                                Ajuste
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground align-middle">
                          {mov.produto?.sku || "-"}
                        </td>
                        <td className="py-3 px-4 text-sm font-medium text-foreground align-middle">
                          {mov.produto?.nome || "-"}
                        </td>
                        <td className="py-3 px-4 align-middle">
                          <span
                            className={`text-sm font-medium ${
                              entrada ? "text-green-600" : saida ? "text-red-600" : "text-blue-600"
                            }`}
                          >
                            {entrada ? "+" : saida ? "-" : ""}{mov.quantidade}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground align-middle">
                          {formatarDataHora(mov.criado_em)}
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground align-middle">
                          {mov.usuario?.nome || "-"}
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground align-middle">
                          {mov.motivo || "-"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Dialog de Nova Movimentação */}
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
          <DialogContent className="max-w-lg">
              <DialogHeader>
              <DialogTitle>Nova Movimentação</DialogTitle>
                <DialogDescription>
                Registre uma entrada ou saída de estoque.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                <Label>Tipo de Movimentação *</Label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setMovimentacao({ ...movimentacao, tipo: "ENTRADA" })}
                            className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${
                              movimentacao.tipo === "ENTRADA" || movimentacao.tipo === "DEVOLUCAO"
                                ? "border-green-500 bg-green-500/10"
                                : "border-green-500/30 bg-green-500/5 hover:bg-green-500/10"
                            }`}
                          >
                            <ArrowDownCircle className={`w-6 h-6 mb-2 ${movimentacao.tipo === "ENTRADA" || movimentacao.tipo === "DEVOLUCAO" ? "text-green-600" : "text-green-500"}`} />
                            <span className={`font-semibold ${movimentacao.tipo === "ENTRADA" || movimentacao.tipo === "DEVOLUCAO" ? "text-green-600" : "text-green-600"}`}>
                              Entrada
                            </span>
                            <span className="text-xs text-muted-foreground mt-1">
                              Adicionar ao estoque
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setMovimentacao({ ...movimentacao, tipo: "SAIDA" })}
                            className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${
                              movimentacao.tipo === "SAIDA" || movimentacao.tipo === "PERDA" || movimentacao.tipo === "TRANSFERENCIA"
                                ? "border-red-500 bg-red-500/10"
                                : "border-red-500/30 bg-red-500/5 hover:bg-red-500/10"
                            }`}
                          >
                            <ArrowUpCircle className={`w-6 h-6 mb-2 ${movimentacao.tipo === "SAIDA" || movimentacao.tipo === "PERDA" || movimentacao.tipo === "TRANSFERENCIA" ? "text-red-600" : "text-red-500"}`} />
                            <span className={`font-semibold ${movimentacao.tipo === "SAIDA" || movimentacao.tipo === "PERDA" || movimentacao.tipo === "TRANSFERENCIA" ? "text-red-600" : "text-red-600"}`}>
                              Saída
                            </span>
                            <span className="text-xs text-muted-foreground mt-1">
                              Remover do estoque
                            </span>
                          </button>
                        </div>
                        
                        {/* Opções adicionais para tipos específicos */}
                        {(movimentacao.tipo === "ENTRADA" || movimentacao.tipo === "SAIDA") && (
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {movimentacao.tipo === "ENTRADA" && (
                              <button
                                type="button"
                                onClick={() => setMovimentacao({ ...movimentacao, tipo: "DEVOLUCAO" })}
                                className={`px-3 py-2 text-xs rounded-lg border transition-all ${
                                  movimentacao.tipo === "DEVOLUCAO"
                                    ? "border-green-500 bg-green-500/10 text-green-600"
                                    : "border-border hover:bg-secondary"
                                }`}
                              >
                                Devolução
                              </button>
                            )}
                            {movimentacao.tipo === "SAIDA" && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setMovimentacao({ ...movimentacao, tipo: "PERDA" })}
                                  className={`px-3 py-2 text-xs rounded-lg border transition-all ${
                                    movimentacao.tipo === "PERDA"
                                      ? "border-red-500 bg-red-500/10 text-red-600"
                                      : "border-border hover:bg-secondary"
                                  }`}
                                >
                                  Perda
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setMovimentacao({ ...movimentacao, tipo: "TRANSFERENCIA" })}
                                  className={`px-3 py-2 text-xs rounded-lg border transition-all ${
                                    movimentacao.tipo === "TRANSFERENCIA"
                                      ? "border-red-500 bg-red-500/10 text-red-600"
                                      : "border-border hover:bg-secondary"
                                  }`}
                                >
                                  Transferência
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() => setMovimentacao({ ...movimentacao, tipo: "AJUSTE" })}
                              className={`px-3 py-2 text-xs rounded-lg border transition-all ${
                                movimentacao.tipo === "AJUSTE"
                                  ? "border-blue-500 bg-blue-500/10 text-blue-600"
                                  : "border-border hover:bg-secondary"
                              }`}
                            >
                              Ajuste
                            </button>
                          </div>
                        )}
                      </div>

                  <div className="space-y-2">
                <Label>Produto *</Label>
                    <Select
                  value={produtoSelecionado?.id.toString() || ""}
                      onValueChange={(value) => {
                        const produto = produtos.find((p) => p.id === Number(value));
                    setProdutoSelecionado(produto || null);
                      }}
                    >
                      <SelectTrigger>
                    <SelectValue placeholder="Selecione um produto" />
                      </SelectTrigger>
                      <SelectContent>
                    {produtos.map((produto) => (
                          <SelectItem key={produto.id} value={produto.id.toString()}>
                        {produto.nome} - {produto.sku}
                          </SelectItem>
                    ))}
                      </SelectContent>
                    </Select>
                    </div>

                      <div className="space-y-2">
                        <Label>Quantidade *</Label>
                        <Input
                          type="number"
                  min="1"
                  step="1"
                          placeholder="0"
                          value={movimentacao.quantidade || ""}
                          onChange={(e) =>
                            setMovimentacao({
                              ...movimentacao,
                      quantidade: Number(e.target.value) || 0,
                            })
                          }
                        />
                    </div>

                    <div className="space-y-2">
                      <Label>Motivo / Observação</Label>
                      <Textarea
                        placeholder="Ex: Compra de fornecedor, Venda - Pedido #1234, Devolução..."
                        value={movimentacao.motivo || movimentacao.observacao || ""}
                        onChange={(e) => {
                          const valor = e.target.value;
                          setMovimentacao({ 
                            ...movimentacao, 
                            motivo: valor,
                            observacao: valor 
                          });
                        }}
                        rows={3}
                      />
                    </div>

                      <div className="flex gap-3 pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setDialogMovimentacaoOpen(false)}
                          className="flex-1"
                        >
                          Cancelar
                        </Button>
                        <Button
                          onClick={handleMovimentar}
                          className={`flex-1 ${
                            movimentacao.tipo === "ENTRADA" || movimentacao.tipo === "DEVOLUCAO"
                              ? "bg-green-600 hover:bg-green-700"
                              : "bg-red-600 hover:bg-red-700"
                          }`}
                          disabled={movimentarEstoqueMutation.isPending}
                        >
                          {movimentarEstoqueMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Processando...
                            </>
                          ) : movimentacao.tipo === "ENTRADA" || movimentacao.tipo === "DEVOLUCAO" ? (
                            "Registrar Entrada"
                          ) : (
                            "Registrar Saída"
                          )}
                        </Button>
                      </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Estoque;
