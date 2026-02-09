import AppLayout from "@/components/layout/AppLayout";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
    estoqueService,
    MovimentacaoEstoque,
    MovimentacaoEstoqueDto,
    TipoMovimentacao,
} from "@/services/estoque.service";
import { Produto, produtosService } from "@/services/produtos.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
    AlertTriangle,
    ArrowDownCircle,
    ArrowUpCircle,
    Calendar,
    Filter,
    Info,
    Loader2,
    Package,
    RotateCcw,
    Search,
    Settings,
    Truck
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const Estoque = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<string>("Todos");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
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
      try {
        const response = await produtosService.listar({ page: 1, limit: 100 });
        // Priorizar o novo formato: { data: Produto[], total, page, limit }
        if (response?.data && Array.isArray(response.data)) {
          return response.data;
        }
        if (Array.isArray(response)) {
          return response;
        }
        if (response?.produtos && Array.isArray(response.produtos)) {
          return response.produtos;
        }
        return [];
      } catch (error) {
        console.error("Erro ao buscar produtos:", error);
        return [];
      }
    },
  });

  const produtos: Produto[] = produtosData || [];

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

  // Buscar todas as movimentações com paginação
  const { data: movimentacoesData, isLoading: isLoadingMovimentacoes } = useQuery({
    queryKey: ["movimentacoes", filtroTipo, currentPage, itemsPerPage, produtos.length],
    queryFn: async () => {
      // Validar parâmetros antes de fazer a requisição
      if (!validarParametrosPaginação(currentPage, itemsPerPage)) {
        throw new Error('Parâmetros de paginação inválidos');
      }
      // Como o endpoint /estoque/movimentacoes não existe no backend,
      // usamos a abordagem de buscar histórico de cada produto e agregar
      const todasMovimentacoes: MovimentacaoEstoque[] = [];
      
      // Busca histórico de cada produto em paralelo com paginação
      const resultados = await Promise.allSettled(
        produtos.map(async (produto) => {
          try {
            // Busca todas as páginas do histórico de cada produto
            let todasMovimentacoesProduto: MovimentacaoEstoque[] = [];
            let page = 1;
            let hasMore = true;
            
            while (hasMore) {
              const historico = await estoqueService.obterHistorico(produto.id, {
                page,
                limit: 50,
              });
              
              if (historico?.movimentacoes && historico.movimentacoes.length > 0) {
                const movimentacoesComProduto = historico.movimentacoes.map((mov) => {
                  // Adiciona informações do produto se não vierem
                  if (!mov.produto) {
                    mov.produto = {
                      id: produto.id,
                      nome: produto.nome,
                      sku: produto.sku,
                    };
                  }
                  return mov;
                });
                todasMovimentacoesProduto.push(...movimentacoesComProduto);
                
                // Se retornou menos que o limite, não há mais páginas
                if (historico.movimentacoes.length < 50) {
                  hasMore = false;
                } else {
                  page++;
                }
              } else {
                hasMore = false;
              }
            }
            
            return todasMovimentacoesProduto;
          } catch (error) {
            // Ignora erros de produtos individuais silenciosamente
            return [];
          }
        })
      );

      // Agrega todas as movimentações
      resultados.forEach((resultado) => {
        if (resultado.status === "fulfilled" && Array.isArray(resultado.value)) {
          todasMovimentacoes.push(...resultado.value);
        }
      });

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

      // Aplica paginação
      const total = movimentacoesFiltradas.length;
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const movimentacoesPaginadas = movimentacoesFiltradas.slice(startIndex, endIndex);

      return {
        movimentacoes: movimentacoesPaginadas,
        total,
      };
    },
    enabled: produtos.length > 0,
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
    retryDelay: 1000, // Esperar 1 segundo entre tentativas
  });

  const movimentacoes: MovimentacaoEstoque[] = movimentacoesData?.movimentacoes || [];
  const totalMovimentacoes = movimentacoesData?.total || 0;
  const totalPages = Math.ceil(totalMovimentacoes / itemsPerPage);

  // Filtrar movimentações por busca (já vem paginado do backend, mas aplicamos busca local)
  const movimentacoesFiltradas = useMemo(() => {
    if (!searchTerm.trim()) return movimentacoes;
    
    const termo = searchTerm.toLowerCase();
    return movimentacoes.filter((mov) => {
      const produtoNome = mov.produto?.nome?.toLowerCase() || "";
      const produtoSku = mov.produto?.sku?.toLowerCase() || "";
      return produtoNome.includes(termo) || produtoSku.includes(termo);
    });
  }, [movimentacoes, searchTerm]);

  // Resetar página quando filtro ou busca mudar
  useEffect(() => {
    setCurrentPage(1);
  }, [filtroTipo, searchTerm]);

  // Calcular totais gerais e por tipo
  const { totalEntradas, totalSaidas, balanco, totaisPorTipo } = useMemo(() => {
    let entradas = 0;
    let saidas = 0;
    const porTipo: Record<string, number> = {
      ENTRADA: 0,
      SAIDA: 0,
      AJUSTE: 0,
      DEVOLUCAO: 0,
      PERDA: 0,
      TRANSFERENCIA: 0,
    };

    movimentacoesFiltradas.forEach((mov) => {
      if (mov.tipo === "ENTRADA") {
        entradas += mov.quantidade;
      } else if (mov.tipo === "SAIDA") {
        saidas += mov.quantidade;
      }
      if (porTipo[mov.tipo] !== undefined) {
        porTipo[mov.tipo] += mov.quantidade;
      }
    });

    const balanco =
      (porTipo.ENTRADA ?? 0) +
      (porTipo.DEVOLUCAO ?? 0) +
      (porTipo.AJUSTE ?? 0) -
      (porTipo.SAIDA ?? 0) -
      (porTipo.PERDA ?? 0) -
      (porTipo.TRANSFERENCIA ?? 0);
    return {
      totalEntradas: entradas,
      totalSaidas: saidas,
      balanco,
      totaisPorTipo: porTipo,
    };
  }, [movimentacoesFiltradas]);

  // Mutation para criar movimentação
  const movimentarEstoqueMutation = useMutation({
    mutationFn: ({ produtoId, data }: { produtoId: number; data: MovimentacaoEstoqueDto }) =>
      estoqueService.movimentar(produtoId, data),
    onSuccess: async (_, variables) => {
      // Invalida todas as queries relacionadas para atualizar os dados
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["movimentacoes"], exact: false }),
        queryClient.invalidateQueries({ queryKey: ["produtos"], exact: false }),
        queryClient.invalidateQueries({ queryKey: ["produtos-movimentacao"], exact: false }),
        // Invalida o histórico de estoque para TODOS os produtos (incluindo o específico)
        queryClient.invalidateQueries({ queryKey: ["historico-estoque"], exact: false }),
      ]);
      
      // Refetch do histórico específico do produto movimentado para atualizar imediatamente
      await queryClient.refetchQueries({ 
        queryKey: ["historico-estoque", variables.produtoId],
        exact: true 
      });
      
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
      // Tratamento de erros conforme TROUBLESHOOTING_MOVIMENTACAO_ESTOQUE.md
      if (error?.response) {
        const status = error.response.status;
        const errorData = error.response.data;

        switch (status) {
          case 400:
            // Erro de validação
            let mensagemErro = 'Erro de validação';
            if (errorData?.message) {
              if (Array.isArray(errorData.message)) {
                mensagemErro = errorData.message.join(', ');
              } else {
                mensagemErro = errorData.message;
              }
            }
            toast.error(mensagemErro);
            break;

          case 401:
            // Token inválido ou expirado
            toast.error('Sessão expirada. Faça login novamente.');
            // Opcional: redirecionar para login
            break;

          case 403:
            // Sem permissão
            toast.error('Sem permissão para realizar esta operação');
            break;

          case 404:
            // Produto não encontrado
            toast.error('Produto não encontrado');
            break;

          case 409:
            // Conflito (ex: estoque insuficiente)
            const mensagemConflito = errorData?.message || 'Não foi possível realizar a movimentação';
            toast.error(mensagemConflito);
            break;

          case 500:
            // Erro interno do servidor
            toast.error('Erro interno do servidor. Tente novamente mais tarde.');
            break;

          default:
            const mensagemPadrao = errorData?.message || error?.message || 'Erro ao realizar movimentação';
            toast.error(mensagemPadrao);
        }
      } else if (error?.request) {
        // Erro de rede
        toast.error('Erro de conexão. Verifique sua internet.');
      } else {
        // Outro erro
        toast.error(error?.message || 'Erro inesperado ao realizar movimentação');
      }
    },
  });

  // Função de validação conforme TROUBLESHOOTING_MOVIMENTACAO_ESTOQUE.md
  const validarMovimentacao = (dados: MovimentacaoEstoqueDto): { valido: boolean; erros: string[] } => {
    const erros: string[] = [];

    // Validar tipo
    const tiposValidos: TipoMovimentacao[] = ['ENTRADA', 'SAIDA', 'AJUSTE', 'DEVOLUCAO', 'PERDA', 'TRANSFERENCIA'];
    if (!dados.tipo || !tiposValidos.includes(dados.tipo)) {
      erros.push('Tipo de movimentação inválido ou ausente. Valores aceitos: ENTRADA, SAIDA, AJUSTE, DEVOLUCAO, PERDA, TRANSFERENCIA');
    }

    // Validar quantidade
    if (!dados.quantidade || typeof dados.quantidade !== 'number') {
      erros.push('A quantidade é obrigatória e deve ser um número');
    } else {
      if (!Number.isInteger(dados.quantidade)) {
        erros.push('A quantidade deve ser um número inteiro');
      } else if (dados.quantidade < 1) {
        erros.push('A quantidade deve ser maior ou igual a 1');
      }
    }

    // Validar campos opcionais (devem ser strings se enviados)
    if (dados.observacao !== undefined && typeof dados.observacao !== 'string') {
      erros.push('Observação deve ser uma string');
    }
    if (dados.motivo !== undefined && typeof dados.motivo !== 'string') {
      erros.push('Motivo deve ser uma string');
    }
    if (dados.documento_referencia !== undefined && typeof dados.documento_referencia !== 'string') {
      erros.push('Documento de referência deve ser uma string');
    }

    return {
      valido: erros.length === 0,
      erros,
    };
  };

  const handleMovimentar = () => {
    if (!produtoSelecionado) {
      toast.error("Selecione um produto");
      return;
    }

    if (!movimentacao.tipo) {
      toast.error("Selecione um tipo de movimentação");
      return;
    }

    // Prepara os dados conforme a documentação da API
    const dadosMovimentacao: MovimentacaoEstoqueDto = {
      tipo: movimentacao.tipo,
      quantidade: movimentacao.quantidade,
      observacao: movimentacao.observacao?.trim() || undefined,
      motivo: movimentacao.motivo?.trim() || undefined,
      documento_referencia: movimentacao.documento_referencia?.trim() || undefined,
    };

    // Validar dados antes de enviar
    const validacao = validarMovimentacao(dadosMovimentacao);
    if (!validacao.valido) {
      validacao.erros.forEach((erro) => toast.error(erro));
      return;
    }

    movimentarEstoqueMutation.mutate({
      produtoId: produtoSelecionado.id,
      data: dadosMovimentacao,
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

        {/* Cards de Dashboard - mesmo design do dashboard de pedidos */}
        <div className="space-y-4 mb-6">
          {/* Por tipo - clicáveis para filtrar */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">
              Movimentações por tipo
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-3">
              {/* Card Balanço - não clicável */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0, duration: 0.3 }}
                className="bg-card border rounded-xl p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className={`text-xl font-bold mb-1 ${balanco >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                      {balanco >= 0 ? "+" : ""}{balanco} un
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      Balanço
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Saldo líquido
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                    <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </motion.div>
              {[
                { tipo: "ENTRADA", label: "Entrada", Icon: ArrowDownCircle, color: "text-green-600 dark:text-green-400", bgColor: "bg-green-100 dark:bg-green-900/20" },
                { tipo: "SAIDA", label: "Saída", Icon: ArrowUpCircle, color: "text-red-600 dark:text-red-400", bgColor: "bg-red-100 dark:bg-red-900/20" },
                { tipo: "AJUSTE", label: "Ajuste", Icon: Settings, color: "text-blue-600 dark:text-blue-400", bgColor: "bg-blue-100 dark:bg-blue-900/20" },
                { tipo: "DEVOLUCAO", label: "Devolução", Icon: RotateCcw, color: "text-blue-600 dark:text-blue-400", bgColor: "bg-blue-100 dark:bg-blue-900/20" },
                { tipo: "PERDA", label: "Perda", Icon: AlertTriangle, color: "text-amber-600 dark:text-amber-400", bgColor: "bg-amber-100 dark:bg-amber-900/20" },
                { tipo: "TRANSFERENCIA", label: "Transferência", Icon: Truck, color: "text-purple-600 dark:text-purple-400", bgColor: "bg-purple-100 dark:bg-purple-900/20" },
              ].map(({ tipo, label, Icon, color, bgColor }, index) => {
                const total = totaisPorTipo[tipo] ?? 0;
                const isEntradaOuDevolucao = tipo === "ENTRADA" || tipo === "DEVOLUCAO";
                const isSaidaPerdaTransf = tipo === "SAIDA" || tipo === "PERDA" || tipo === "TRANSFERENCIA";
                const valorFormatado = isEntradaOuDevolucao
                  ? `+${Math.abs(total)}`
                  : isSaidaPerdaTransf
                    ? `-${Math.abs(total)}`
                    : total >= 0 ? `+${total}` : `${total}`;
                const ativo = filtroTipo === tipo;
                return (
                  <motion.button
                    key={tipo}
                    type="button"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + index * 0.03, duration: 0.3 }}
                    onClick={() => {
                      setFiltroTipo(ativo ? "Todos" : tipo);
                      setCurrentPage(1);
                    }}
                    className={`flex items-start justify-between gap-2 rounded-xl border p-4 text-left transition-shadow cursor-pointer bg-card hover:shadow-md ${ativo ? "ring-2 ring-primary ring-offset-2" : ""}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={`text-xl font-bold mb-1 ${color}`}>
                        {valorFormatado} un
                      </p>
                      <p className="text-sm font-medium text-foreground">
                        {label}
                      </p>
                    </div>
                    <div className={`p-2 rounded-lg shrink-0 ${bgColor}`}>
                      <Icon className={`w-5 h-5 ${color}`} />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
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
            <Select 
              value={filtroTipo} 
              onValueChange={(value) => {
                setFiltroTipo(value);
                setCurrentPage(1);
              }}
            >
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
          </div>
          <div className="mt-4">
            <Alert variant="default" className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-sm text-blue-800 dark:text-blue-300">
                As movimentações são geradas automaticamente ao criar pedidos de compra ou venda e ao cadastrar produto com estoque inicial.
              </AlertDescription>
            </Alert>
          </div>
        </div>

        {/* Tabela de Movimentações */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-md border overflow-hidden"
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Qtd</TableHead>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Motivo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingMovimentacoes ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Carregando movimentações...
                    </div>
                  </TableCell>
                </TableRow>
              ) : movimentacoesFiltradas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="w-12 h-12 text-muted-foreground/50" />
                      <p>Nenhuma movimentação encontrada</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                  movimentacoesFiltradas.map((mov) => {
                    const entrada = isEntrada(mov.tipo);
                    const saida = isSaida(mov.tipo);

                    return (
                      <TableRow key={mov.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {mov.tipo === "ENTRADA" && (
                              <span 
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border"
                                style={{
                                  backgroundColor: "#d1fae5",
                                  color: "#059669",
                                  borderColor: "#10b981",
                                }}
                              >
                                <ArrowDownCircle className="w-3 h-3" />
                                Entrada
                              </span>
                            )}
                            {mov.tipo === "DEVOLUCAO" && (
                              <span 
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border"
                                style={{
                                  backgroundColor: "#dbeafe",
                                  color: "#2563eb",
                                  borderColor: "#3b82f6",
                                }}
                              >
                                <RotateCcw className="w-3 h-3" />
                                Devolução
                              </span>
                            )}
                            {mov.tipo === "SAIDA" && (
                              <span 
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border"
                                style={{
                                  backgroundColor: "#fee2e2",
                                  color: "#dc2626",
                                  borderColor: "#ef4444",
                                }}
                              >
                                <ArrowUpCircle className="w-3 h-3" />
                                Saída
                              </span>
                            )}
                            {mov.tipo === "PERDA" && (
                              <span 
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border"
                                style={{
                                  backgroundColor: "#fef3c7",
                                  color: "#d97706",
                                  borderColor: "#f59e0b",
                                }}
                              >
                                <AlertTriangle className="w-3 h-3" />
                                Perda
                              </span>
                            )}
                            {mov.tipo === "TRANSFERENCIA" && (
                              <span 
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border"
                                style={{
                                  backgroundColor: "#ede9fe",
                                  color: "#7c3aed",
                                  borderColor: "#8b5cf6",
                                }}
                              >
                                <Truck className="w-3 h-3" />
                                Transferência
                              </span>
                            )}
                            {mov.tipo === "AJUSTE" && (
                              <span 
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border"
                                style={{
                                  backgroundColor: "#dbeafe",
                                  color: "#2563eb",
                                  borderColor: "#3b82f6",
                                }}
                              >
                                <Settings className="w-3 h-3" />
                                Ajuste
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm text-muted-foreground">
                            {mov.produto?.sku || "-"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{mov.produto?.nome || "-"}</span>
                        </TableCell>
                        <TableCell>
                          <span
                            className="text-sm font-semibold"
                            style={{
                              color: mov.tipo === "ENTRADA" || mov.tipo === "DEVOLUCAO" 
                                ? "#059669" 
                                : mov.tipo === "SAIDA" || mov.tipo === "PERDA" || mov.tipo === "TRANSFERENCIA"
                                ? mov.tipo === "PERDA" ? "#d97706" : mov.tipo === "TRANSFERENCIA" ? "#7c3aed" : "#dc2626"
                                : "#2563eb"
                            }}
                          >
                            {(mov.tipo === "ENTRADA" || mov.tipo === "DEVOLUCAO") 
                              ? `+${Math.abs(mov.quantidade)}` 
                              : (mov.tipo === "SAIDA" || mov.tipo === "PERDA" || mov.tipo === "TRANSFERENCIA") 
                                ? mov.quantidade < 0 ? mov.quantidade : `-${mov.quantidade}`
                                : mov.tipo === "AJUSTE"
                                  ? (mov.quantidade >= 0 ? `+${mov.quantidade}` : String(mov.quantidade))
                                  : mov.quantidade}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {formatarDataHora(mov.criado_em)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {(() => {
                              const m = mov.motivo?.toUpperCase().replace(/\s+/g, "_") || "";
                              if (m === "ESTOQUE_INICIAL") return "Estoque Inicial";
                              if (m === "AJUSTE_ESTOQUE" || m === "AJUSTE_DE_ESTOQUE") return "Ajuste de Estoque";
                              return mov.motivo || "-";
                            })()}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
            </TableBody>
          </Table>
          
          {/* Paginação */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-border">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  
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
                  
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                  
                  {totalPages > 5 && (
                    <PaginationItem>
                      <PaginationLink
                        onClick={() => setCurrentPage(totalPages)}
                        isActive={currentPage === totalPages}
                        className="cursor-pointer"
                      >
                        {totalPages}
                      </PaginationLink>
                    </PaginationItem>
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
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, totalMovimentacoes)} de {totalMovimentacoes} movimentações
              </div>
            </div>
          )}
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
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              <DialogHeader>
              <DialogTitle>Nova Movimentação</DialogTitle>
                <DialogDescription>
                Registre uma entrada ou saída de estoque.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 pt-4 overflow-y-auto flex-1 pr-2">
                {/* Seleção de Tipo de Movimentação */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Tipo de Movimentação *</Label>
                  
                  {/* Tipos de Entrada */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Entradas</p>
                    <div className="grid grid-cols-2 gap-3 overflow-visible">
                      {/* ENTRADA */}
                      <button
                        type="button"
                        onClick={() => setMovimentacao({ ...movimentacao, tipo: "ENTRADA" })}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all hover:scale-[1.02] box-border ${
                          movimentacao.tipo === "ENTRADA" ? "shadow-md border-[3px]" : "border-2"
                        }`}
                        style={{
                          borderColor: movimentacao.tipo === "ENTRADA" ? "#2ECC71" : "rgba(46, 204, 113, 0.3)",
                          backgroundColor: movimentacao.tipo === "ENTRADA" ? "#EAF7F0" : "rgba(234, 247, 240, 0.3)",
                        }}
                      >
                        <div 
                          className="p-2 rounded-full mb-2"
                          style={{
                            backgroundColor: movimentacao.tipo === "ENTRADA" ? "#EAF7F0" : "rgba(234, 247, 240, 0.5)",
                          }}
                        >
                          <ArrowDownCircle 
                            className="w-6 h-6"
                            style={{ color: "#1E8449" }}
                          />
                        </div>
                        <span 
                          className="font-semibold text-sm"
                          style={{ color: "#1E8449" }}
                        >
                          Entrada
                        </span>
                        <span className="text-xs text-muted-foreground mt-1 text-center">
                          Adicionar ao estoque
                        </span>
                      </button>

                      {/* DEVOLUCAO */}
                      <button
                        type="button"
                        onClick={() => setMovimentacao({ ...movimentacao, tipo: "DEVOLUCAO" })}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all hover:scale-[1.02] box-border ${
                          movimentacao.tipo === "DEVOLUCAO" ? "shadow-md border-[3px]" : "border-2"
                        }`}
                        style={{
                          borderColor: movimentacao.tipo === "DEVOLUCAO" ? "#3498DB" : "rgba(52, 152, 219, 0.3)",
                          backgroundColor: movimentacao.tipo === "DEVOLUCAO" ? "#EBF3FB" : "rgba(235, 243, 251, 0.3)",
                        }}
                      >
                        <div 
                          className="p-2 rounded-full mb-2"
                          style={{
                            backgroundColor: movimentacao.tipo === "DEVOLUCAO" ? "#EBF3FB" : "rgba(235, 243, 251, 0.5)",
                          }}
                        >
                          <RotateCcw 
                            className="w-6 h-6"
                            style={{ color: "#21618C" }}
                          />
                        </div>
                        <span 
                          className="font-semibold text-sm"
                          style={{ color: "#21618C" }}
                        >
                          Devolução
                        </span>
                        <span className="text-xs text-muted-foreground mt-1 text-center">
                          Retorno de produtos
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Tipos de Saída */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Saídas</p>
                    <div className="grid grid-cols-3 gap-3 overflow-visible">
                      {/* SAIDA */}
                      <button
                        type="button"
                        onClick={() => setMovimentacao({ ...movimentacao, tipo: "SAIDA" })}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all hover:scale-[1.02] box-border ${
                          movimentacao.tipo === "SAIDA" ? "shadow-md border-[3px]" : "border-2"
                        }`}
                        style={{
                          borderColor: movimentacao.tipo === "SAIDA" ? "#E74C3C" : "rgba(231, 76, 60, 0.3)",
                          backgroundColor: movimentacao.tipo === "SAIDA" ? "#FDEDEC" : "rgba(253, 237, 236, 0.3)",
                        }}
                      >
                        <div 
                          className="p-2 rounded-full mb-2"
                          style={{
                            backgroundColor: movimentacao.tipo === "SAIDA" ? "#FDEDEC" : "rgba(253, 237, 236, 0.5)",
                          }}
                        >
                          <ArrowUpCircle 
                            className="w-5 h-5"
                            style={{ color: "#922B21" }}
                          />
                        </div>
                        <span 
                          className="font-semibold text-xs"
                          style={{ color: "#922B21" }}
                        >
                          Saída
                        </span>
                        <span className="text-xs text-muted-foreground mt-1 text-center">
                          Remover estoque
                        </span>
                      </button>

                      {/* PERDA */}
                      <button
                        type="button"
                        onClick={() => setMovimentacao({ ...movimentacao, tipo: "PERDA" })}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all hover:scale-[1.02] box-border ${
                          movimentacao.tipo === "PERDA" ? "shadow-md border-[3px]" : "border-2"
                        }`}
                        style={{
                          borderColor: movimentacao.tipo === "PERDA" ? "#F39C12" : "rgba(243, 156, 18, 0.3)",
                          backgroundColor: movimentacao.tipo === "PERDA" ? "#FEF5E7" : "rgba(254, 245, 231, 0.3)",
                        }}
                      >
                        <div 
                          className="p-2 rounded-full mb-2"
                          style={{
                            backgroundColor: movimentacao.tipo === "PERDA" ? "#FEF5E7" : "rgba(254, 245, 231, 0.5)",
                          }}
                        >
                          <AlertTriangle 
                            className="w-5 h-5"
                            style={{ color: "#9C640C" }}
                          />
                        </div>
                        <span 
                          className="font-semibold text-xs"
                          style={{ color: "#9C640C" }}
                        >
                          Perda
                        </span>
                        <span className="text-xs text-muted-foreground mt-1 text-center">
                          Produto perdido
                        </span>
                      </button>

                      {/* TRANSFERENCIA */}
                      <button
                        type="button"
                        onClick={() => setMovimentacao({ ...movimentacao, tipo: "TRANSFERENCIA" })}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all hover:scale-[1.02] box-border ${
                          movimentacao.tipo === "TRANSFERENCIA" ? "shadow-md border-[3px]" : "border-2"
                        }`}
                        style={{
                          borderColor: movimentacao.tipo === "TRANSFERENCIA" ? "#9B59B6" : "rgba(155, 89, 182, 0.3)",
                          backgroundColor: movimentacao.tipo === "TRANSFERENCIA" ? "#F4ECF7" : "rgba(244, 236, 247, 0.3)",
                        }}
                      >
                        <div 
                          className="p-2 rounded-full mb-2"
                          style={{
                            backgroundColor: movimentacao.tipo === "TRANSFERENCIA" ? "#F4ECF7" : "rgba(244, 236, 247, 0.5)",
                          }}
                        >
                          <Truck 
                            className="w-5 h-5"
                            style={{ color: "#5B2C6F" }}
                          />
                        </div>
                        <span 
                          className="font-semibold text-xs"
                          style={{ color: "#5B2C6F" }}
                        >
                          Transferência
                        </span>
                        <span className="text-xs text-muted-foreground mt-1 text-center">
                          Entre estoques
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Ajuste */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Ajustes</p>
                    <button
                      type="button"
                      onClick={() => setMovimentacao({ ...movimentacao, tipo: "AJUSTE" })}
                      className={`w-full flex flex-col items-center justify-center p-4 rounded-xl transition-all hover:scale-[1.02] box-border ${
                        movimentacao.tipo === "AJUSTE" ? "shadow-md border-[3px]" : "border-2"
                      }`}
                      style={{
                        borderColor: movimentacao.tipo === "AJUSTE" ? "#3498DB" : "rgba(52, 152, 219, 0.3)",
                        backgroundColor: movimentacao.tipo === "AJUSTE" ? "#EBF3FB" : "rgba(235, 243, 251, 0.3)",
                      }}
                    >
                      <div 
                        className="p-2 rounded-full mb-2"
                        style={{
                          backgroundColor: movimentacao.tipo === "AJUSTE" ? "#EBF3FB" : "rgba(235, 243, 251, 0.5)",
                        }}
                      >
                        <Settings 
                          className="w-6 h-6"
                          style={{ color: "#21618C" }}
                        />
                      </div>
                      <span 
                        className="font-semibold text-sm"
                        style={{ color: "#21618C" }}
                      >
                        Ajuste
                      </span>
                      <span className="text-xs text-muted-foreground mt-1 text-center">
                        Definir estoque atual
                      </span>
                    </button>
                  </div>
                </div>

                  <div className="space-y-2">
                <Label>Produto *</Label>
                    {produtos.length === 0 ? (
                      <div className="text-sm text-muted-foreground py-2">
                        Carregando produtos...
                      </div>
                    ) : (
                      <Select
                        value={produtoSelecionado?.id?.toString() || ""}
                        onValueChange={(value) => {
                          const produto = produtos.find((p) => {
                            const produtoId = p.id?.toString();
                            const valueId = value?.toString();
                            return produtoId === valueId || Number(produtoId) === Number(valueId);
                          });
                          if (produto) {
                            setProdutoSelecionado(produto);
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um produto">
                            {produtoSelecionado ? `${produtoSelecionado.nome} - ${produtoSelecionado.sku}` : ""}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="z-[100]">
                          {produtos.map((produto) => (
                            <SelectItem 
                              key={produto.id} 
                              value={produto.id?.toString() || ""}
                            >
                              {produto.nome} - {produto.sku}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
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
                      <Label>Documento de Referência</Label>
                      <Input
                        placeholder="Ex: NF-12345, Pedido #1234..."
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
                      <Label>Motivo</Label>
                      <Input
                        placeholder="Ex: Compra de fornecedor, Venda para cliente..."
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
                      <Label>Observação</Label>
                      <Textarea
                        placeholder="Observações adicionais sobre a movimentação..."
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
                          className="flex-1 text-white hover:opacity-90 transition-opacity"
                          style={{
                            backgroundColor: 
                              movimentacao.tipo === "ENTRADA" ? "#2ECC71" :
                              movimentacao.tipo === "DEVOLUCAO" ? "#3498DB" :
                              movimentacao.tipo === "SAIDA" ? "#E74C3C" :
                              movimentacao.tipo === "PERDA" ? "#F39C12" :
                              movimentacao.tipo === "TRANSFERENCIA" ? "#9B59B6" :
                              "#3498DB", // AJUSTE
                          }}
                          disabled={movimentarEstoqueMutation.isPending}
                        >
                          {movimentarEstoqueMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Processando...
                            </>
                          ) : movimentacao.tipo === "ENTRADA" ? (
                            "Registrar Entrada"
                          ) : movimentacao.tipo === "DEVOLUCAO" ? (
                            "Registrar Devolução"
                          ) : movimentacao.tipo === "SAIDA" ? (
                            "Registrar Saída"
                          ) : movimentacao.tipo === "PERDA" ? (
                            "Registrar Perda"
                          ) : movimentacao.tipo === "TRANSFERENCIA" ? (
                            "Registrar Transferência"
                          ) : (
                            "Registrar Ajuste"
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
