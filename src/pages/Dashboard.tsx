import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { estoqueService } from "@/services/estoque.service";
import { financeiroService } from "@/services/financeiro.service";
import { pedidosService } from "@/services/pedidos.service";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
    AlertTriangle,
    Calendar,
    DollarSign,
    Loader2,
    ShoppingCart,
    TrendingDown
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  const hoje = useMemo(() => new Date(), []);
  const [mesAno, setMesAno] = useState<string>(`${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`);
  const periodoDashboard = useMemo(() => {
    const [ano, mes] = mesAno.split('-').map(Number);
    return { mes, ano, mes_ano: mesAno };
  }, [mesAno]);

  const periodoTotalRecebido = useMemo(() => {
    const [ano, mes] = mesAno.split('-').map(Number);
    const primeiro = new Date(ano, mes - 1, 1).toISOString().slice(0, 10);
    const ultimo = new Date(ano, mes, 0).toISOString().slice(0, 10);
    return { data_inicial: primeiro, data_final: ultimo };
  }, [mesAno]);

  // GET /financeiro/dashboard (contrato unificado — GUIA_IMPLEMENTACAO_FRONTEND_FINANCEIRO)
  const { data: dashboardUnificado, isLoading: loadingUnificado } = useQuery({
    queryKey: ['dashboard', 'unificado'],
    queryFn: () => financeiroService.getDashboardUnificado(),
    refetchInterval: 30000,
    retry: false,
  });

  // Fallback: dados financeiros por endpoint antigo (quando /financeiro/dashboard não existir)
  const { data: dashboardReceber, isLoading: loadingReceber } = useQuery({
    queryKey: ['dashboard', 'receber', periodoDashboard],
    queryFn: () => financeiroService.getDashboardReceber(periodoDashboard),
    refetchInterval: 30000,
    enabled: !dashboardUnificado,
  });

  const { data: dashboardPagar, isLoading: loadingPagar } = useQuery({
    queryKey: ['dashboard', 'pagar', periodoDashboard],
    queryFn: () => financeiroService.getDashboardPagar(periodoDashboard),
    refetchInterval: 30000,
    enabled: !dashboardUnificado,
  });

  // ✅ Buscar dashboard de pedidos para obter valor_em_aberto_venda (Total a Receber correto) — fallback
  // Conforme CORRECAO_DASHBOARD_PRINCIPAL_TOTAL_RECEBER.md:
  // - Usar valor_em_aberto_venda.valor do endpoint /pedidos/dashboard/resumo
  // - Este campo considera todos os pedidos pendentes e calcula valor_total - valor_pago corretamente
  const { data: dashboardPedidos, isLoading: loadingDashboardPedidos } = useQuery({
    queryKey: ['dashboard', 'pedidos'],
    queryFn: () => pedidosService.obterDashboard(),
    refetchInterval: 30000,
    enabled: !dashboardUnificado,
  });

  // ✅ Buscar total recebido (valores efetivamente pagos/baixados)
  // Conforme GUIA_FRONTEND_TOTAL_RECEBIDO.md:
  // - Endpoint: /contas-financeiras/dashboard/total-recebido
  // - Retorna apenas valores realmente pagos (pagamentos registrados)
  // - Parcelas quitadas e pagamentos parciais (à vista)
  // - Estornos são subtraídos automaticamente
  const { data: totalRecebidoData, isLoading: loadingTotalRecebido, isError: isErrorTotalRecebido, refetch: refetchTotalRecebido } = useQuery({
    queryKey: ['dashboard', 'total-recebido', periodoTotalRecebido],
    queryFn: () => financeiroService.getTotalRecebido(periodoTotalRecebido),
    refetchInterval: 30000,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 500) return false;
      return failureCount < 2;
    },
  });

  // Removido: não precisamos mais buscar todos os pedidos para calcular estatísticas
  // O backend já retorna os valores corretos considerando pagamentos parciais

  // Buscar pedidos recentes (vendas)
  const { data: pedidosData, isLoading: loadingPedidos } = useQuery({
    queryKey: ['pedidos', 'recentes'],
    queryFn: () => pedidosService.listar({ page: 1, limit: 5, tipo: 'VENDA' }),
    refetchInterval: 30000,
  });

  // Buscar pedidos pendentes (todos os tipos, exceto concluídos e cancelados)
  const { data: pedidosPendentesData } = useQuery({
    queryKey: ['pedidos', 'pendentes'],
    queryFn: () => pedidosService.listar({ 
      page: 1, 
      limit: 100,
      status: 'ABERTO' // Busca apenas pendentes (acabou de criar)
    }),
    refetchInterval: 30000,
  });

  // Buscar produtos com estoque baixo usando endpoint dedicado
  const { data: estoqueBaixoData, isLoading: loadingProdutos } = useQuery({
    queryKey: ['estoque', 'baixo'],
    queryFn: () => estoqueService.obterEstoqueBaixo({ page: 1, limit: 10 }),
    refetchInterval: 30000,
  });

  // Buscar contas vencidas
  const { data: contasVencidasData, isLoading: loadingContasVencidas } = useQuery({
    queryKey: ['contas-financeiras', 'vencidas'],
    queryFn: async () => {
      try {
        // Buscar contas vencidas usando proximidade_vencimento
        const response = await financeiroService.listar({
          page: 1,
          limit: 10,
          proximidade_vencimento: 'VENCIDA'
        });
        
        // Tratar diferentes formatos de resposta
        if (Array.isArray(response)) {
          return response;
        }
        if (response?.data && Array.isArray(response.data)) {
          return response.data;
        }
        if ((response as any)?.contas && Array.isArray((response as any).contas)) {
          return (response as any).contas;
        }
        return [];
      } catch (error) {
        console.warn("Erro ao buscar contas vencidas:", error);
        return [];
      }
    },
    refetchInterval: 30000,
  });

  const isLoading = loadingReceber || loadingPagar || loadingPedidos || loadingProdutos || loadingContasVencidas;

  // Função auxiliar para converter valor para número seguro
  const parseValor = (valor: any): number => {
    if (valor === null || valor === undefined || valor === '') return 0;
    const num = typeof valor === 'string' ? parseFloat(valor) : Number(valor);
    return isNaN(num) ? 0 : num;
  };

  // Produtos com estoque baixo do endpoint dedicado
  const produtosEstoqueBaixo = estoqueBaixoData?.produtos || [];
  const countEstoqueBaixo = estoqueBaixoData?.total || 0;

  // Contas vencidas
  const contasVencidas = contasVencidasData || [];
  // Preferir GET /financeiro/dashboard quando disponível (não calcular no front)
  const totalVencidas = dashboardUnificado
    ? (dashboardUnificado.contas_receber?.vencidas ?? 0) + (dashboardUnificado.contas_pagar?.vencidas ?? 0)
    : (parseValor(dashboardReceber?.vencidas) || 0) + (parseValor(dashboardPagar?.vencidas) || 0);
  const valorTotalVencidas = (parseValor(dashboardReceber?.valor_total_vencidas) || 0) + (parseValor(dashboardPagar?.valor_total_vencidas) || 0);

  const totalReceber = dashboardUnificado
    ? parseValor(dashboardUnificado.contas_receber?.valor_total_pendente) || 0
    : (parseValor(dashboardPedidos?.valor_em_aberto_venda?.valor) || 0);

  const totalPagar = dashboardUnificado
    ? parseValor(dashboardUnificado.contas_pagar?.valor_total_pendente) || 0
    : (parseValor(dashboardPagar?.valor_total_pendente) || parseValor(dashboardPagar?.total) || 0);

  const totalRecebido = dashboardUnificado
    ? parseValor(dashboardUnificado.contas_receber?.valor_total_recebido) ?? 0
    : (isErrorTotalRecebido ? 0 : (parseValor(totalRecebidoData?.totalRecebido) ?? 0));

  // Preparar estatísticas (cards clicáveis conforme guia)
  const stats = [
    { 
      label: "Total a Receber", 
      value: formatCurrency(totalReceber), 
      icon: DollarSign,
      trend: null,
      trendUp: true,
      color: "text-royal",
      bgColor: "bg-royal/10",
      isLoading: dashboardUnificado ? loadingUnificado : loadingDashboardPedidos,
      onClick: () => navigate('/contas-a-receber'),
      hint: "Ver contas a receber"
    },
    { 
      label: "Contas Vencidas", 
      value: totalVencidas.toString(), 
      icon: Calendar,
      trend: valorTotalVencidas > 0 ? formatCurrency(valorTotalVencidas) : null,
      trendUp: false,
      color: "text-red-600",
      bgColor: "bg-red-100",
      isLoading: loadingContasVencidas,
      onClick: () => navigate('/contas-a-receber?tab=VENCIDO'),
      hint: "Ver contas vencidas"
    },
    { 
      label: "Produtos com Estoque Baixo", 
      value: countEstoqueBaixo.toString(), 
      icon: AlertTriangle,
      trend: null,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
      isLoading: loadingProdutos,
      onClick: () => navigate('/estoque'),
      hint: "Ver estoque"
    },
      {
        label: "Total Pago",
        value: formatCurrency(totalRecebido),
        icon: DollarSign,
        trend: isErrorTotalRecebido ? "Não foi possível carregar. Tente novamente." : null,
        trendUp: !isErrorTotalRecebido,
        color: "text-green-600",
        bgColor: "bg-green-100",
        isLoading: loadingTotalRecebido,
        onClick: () => navigate('/financeiro'),
        hint: "Ver financeiro"
      },
    { 
      label: "Total a Pagar", 
      value: formatCurrency(totalPagar), 
      icon: TrendingDown,
      trend: null,
      trendUp: false,
      color: "text-azure",
      bgColor: "bg-azure/10",
      isLoading: dashboardUnificado ? loadingUnificado : loadingPagar,
      onClick: () => navigate('/contas-a-pagar'),
      hint: "Ver contas a pagar"
    },
    { 
      label: "Pedidos Pendentes", 
      value: (pedidosPendentesData?.total || 0).toString(), 
      icon: ShoppingCart,
      trend: null,
      trendUp: true,
      color: "text-royal",
      bgColor: "bg-royal/10",
      isLoading: loadingPedidos,
      onClick: () => navigate('/pedidos'),
      hint: "Ver pedidos"
    },
  ];

  // Tratar diferentes formatos de resposta de pedidos
  let pedidosRecentes: any[] = [];
  if (pedidosData) {
    if (Array.isArray(pedidosData)) {
      pedidosRecentes = pedidosData;
    } else if (pedidosData?.data && Array.isArray(pedidosData.data)) {
      pedidosRecentes = pedidosData.data;
    } else if ((pedidosData as any)?.pedidos && Array.isArray((pedidosData as any).pedidos)) {
      pedidosRecentes = (pedidosData as any).pedidos;
    }
  }

  const recentSales = pedidosRecentes.slice(0, 4).map(pedido => ({
    cliente: pedido.cliente?.nome || `Cliente #${pedido.cliente_id || 'N/A'}`,
    produto: `${pedido.itens?.length || 0} item(ns)`,
    valor: formatCurrency(parseValor(pedido.valor_total)),
    data: pedido.created_at ? formatDate(pedido.created_at) : pedido.data_pedido ? formatDate(pedido.data_pedido) : 'N/A',
    status: pedido.status || 'Pendente',
  }));

  const lowStockProducts = produtosEstoqueBaixo.slice(0, 5).map(produto => ({
    produto: produto.nome,
    categoria: produto.categoria_nome || 'N/A',
    estoque: produto.estoque_atual,
    minimo: produto.estoque_minimo,
  }));

  // Debug: verificar dados carregados
  useEffect(() => {
    console.log('📊 [Dashboard] Dados carregados:', {
      contasVencidas: contasVencidas.length,
      pedidosRecentes: pedidosRecentes.length,
      produtosEstoqueBaixo: produtosEstoqueBaixo.length,
      recentSales: recentSales.length,
      lowStockProducts: lowStockProducts.length,
      totalReceber,
      totalPagar,
      dashboardReceber,
      dashboardPagar,
      pedidosData,
      estoqueBaixoData,
      contasVencidasData,
    });
  }, [contasVencidas, pedidosRecentes, produtosEstoqueBaixo, recentSales, lowStockProducts, totalReceber, totalRecebido, totalPagar, dashboardReceber, dashboardPagar, dashboardPedidos, totalRecebidoData, pedidosData, estoqueBaixoData, contasVencidasData]);

  return (
    <AppLayout>
      <div className="p-6">
        {/* Page Title e Filtros de Período */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Visão geral do seu negócio</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground whitespace-nowrap">Período:</Label>
              <Input
                type="month"
                value={mesAno}
                onChange={(e) => setMesAno(e.target.value)}
                className="w-[140px]"
              />
            </div>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const d = new Date();
                  setMesAno(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
                }}
              >
                Este Mês
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const d = new Date();
                  d.setMonth(d.getMonth() - 3);
                  setMesAno(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
                }}
              >
                Últimos 3 Meses
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-card rounded-xl p-5 border border-border hover:shadow-md transition-shadow ${stat.onClick ? 'cursor-pointer hover:border-primary/50' : ''}`}
              onClick={stat.onClick}
              role={stat.onClick ? 'button' : undefined}
              title={stat.hint}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  {stat.isLoading ? (
                    <Loader2 className={`w-5 h-5 ${stat.color} animate-spin`} />
                  ) : (
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  )}
                </div>
                {stat.trend && (
                  <span className={`text-sm font-medium ${stat.trendUp ? "text-cyan" : "text-destructive"}`}>
                    {stat.trend}
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-foreground mb-1">
                {stat.isLoading ? '...' : stat.value}
              </p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Contas Vencidas - Full Width */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Calendar className="w-5 h-5 text-red-600" />
              Contas Vencidas
            </h2>
          </div>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingContasVencidas ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Carregando contas vencidas...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : contasVencidas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      Nenhuma conta vencida
                    </TableCell>
                  </TableRow>
                ) : (
                  contasVencidas.slice(0, 5).map((conta) => {
                    const diasVencida = conta.dias_ate_vencimento || 0;
                    const diasTexto = diasVencida < 0 
                      ? `Vencida há ${Math.abs(diasVencida)} ${Math.abs(diasVencida) === 1 ? 'dia' : 'dias'}`
                      : conta.status_vencimento || 'Vencida';
                    
                    // Modelo sem parcelas: exibir apenas descrição (GUIA_MIGRACAO_SEM_PARCELAS)
                    const formatarDescricao = () => conta.descricao || '';
                    
                    return (
                      <TableRow key={conta.id}>
                        <TableCell>
                          <span className="font-medium">{conta.numero_conta || `CONTA-${conta.id}`}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">{formatarDescricao()}</span>
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap inline-block ${
                            conta.tipo === "RECEBER"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" 
                              : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                          }`}>
                            {conta.tipo === "RECEBER" ? "Receber" : "Pagar"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium whitespace-nowrap">
                            {formatCurrency(parseValor(conta.valor_restante || conta.valor_original))}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs px-2 py-1 rounded-full font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 whitespace-nowrap inline-block">
                            {diasTexto}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            {contasVencidas.length > 5 && (
              <div className="p-4 text-center text-sm text-muted-foreground border-t border-border">
                Mostrando 5 de {contasVencidas.length} contas vencidas
              </div>
            )}
          </div>
        </motion.div>

        {/* Tables Grid - Vendas Recentes e Produtos com Estoque Baixo */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Sales */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-foreground">Vendas Recentes</h2>
            </div>
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingPedidos ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                        Carregando vendas...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : recentSales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                        Nenhuma venda recente
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentSales.map((sale, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <span className="font-medium">{sale.cliente}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">{sale.produto}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium whitespace-nowrap">{sale.valor}</span>
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap inline-block ${
                            sale.status === "QUITADO" || sale.status === "Quitado"
                              ? "bg-cyan/10 text-cyan"
                              : sale.status === "ABERTO" || sale.status === "Pendente"
                                ? "bg-amber-500/10 text-amber-500"
                                : "bg-azure/10 text-azure"
                          }`}>
                            {sale.status === "ABERTO" ? "Pendente" : sale.status === "PARCIAL" ? "Aberto" : sale.status === "QUITADO" ? "Quitado" : sale.status === "CANCELADO" ? "Cancelado" : sale.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </motion.div>

          {/* Low Stock */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-foreground">Produtos com Estoque Baixo</h2>
            </div>
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Em Estoque</TableHead>
                    <TableHead>Mínimo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingProdutos ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                        Carregando produtos...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : lowStockProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                        Nenhum produto com estoque baixo
                      </TableCell>
                    </TableRow>
                  ) : (
                    lowStockProducts.map((product, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <span className="font-medium">{product.produto}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">{product.categoria}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-medium text-destructive whitespace-nowrap">{product.estoque}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground whitespace-nowrap">{product.minimo}</span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
