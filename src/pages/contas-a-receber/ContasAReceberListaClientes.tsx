import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import { Cliente, clientesService } from '@/services/clientes.service';
import type { ClienteComPedidos } from '@/services/contas-receber.service';
import { financeiroService } from '@/services/financeiro.service';
import { pedidosService } from '@/services/pedidos.service';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, FileText, Loader2, MoreVertical, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface ContasAReceberListaClientesProps {
  filtroStatus?: string;
  /** Guia: card Total a Receber preferir soma da lista para bater com a tabela. */
  onTotalAReceber?: (total: number, count: number) => void;
}

const ContasAReceberListaClientes = ({
  filtroStatus = 'aberto',
  onTotalAReceber,
}: ContasAReceberListaClientesProps) => {
  const navigate = useNavigate();
  const [filtroCliente, setFiltroCliente] = useState<string>('todos');
  const [status, setStatus] = useState<string>(filtroStatus);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: clientesData } = useQuery({
    queryKey: ['clientes'],
    queryFn: async () => {
      const r = await clientesService.listar({
        limit: 500,
        statusCliente: 'ATIVO',
      });
      return Array.isArray(r) ? r : r?.data || [];
    },
  });

  const clientes: Cliente[] = Array.isArray(clientesData)
    ? clientesData
    : clientesData?.data || [];

  // Usar endpoint /pedidos/contas-receber (sem duplicatas)
  // Conforme GUIA_CORRECAO_CONTAS_PAGAR.md - não passar undefined como propriedade
  const { data: pedidosEmAberto } = useQuery({
    queryKey: ['pedidos', 'contas-receber', 'em_aberto'],
    queryFn: () => pedidosService.listarContasReceber({ situacao: 'em_aberto' }),
    enabled: status === 'aberto' || status === 'todos',
  });
  const { data: pedidosConcluidos } = useQuery({
    queryKey: ['pedidos', 'contas-receber', 'concluido'],
    queryFn: () => pedidosService.listarContasReceber({ situacao: 'concluido' }),
    enabled: status === 'aberto' || status === 'todos',
  });

  // Fallback: usar contas financeiras (RECEBER) quando pedidos retornam vazio
  const { data: contasReceberData, isLoading: isLoadingContasReceber } = useQuery({
    queryKey: ['contas-financeiras', 'receber', 'lista-clientes', status],
    queryFn: async () => {
      const res = await financeiroService.listar({
        tipo: 'RECEBER',
        limit: 500,
        page: 1,
      });
      // Normalizar: API pode retornar { data }, { contas }, { itens } ou array direto
      const data = Array.isArray(res)
        ? res
        : (res as any)?.data ?? (res as any)?.contas ?? (res as any)?.itens ?? [];
      return Array.isArray(data) ? data : [];
    },
    enabled: status === 'aberto' || status === 'todos',
    retry: 1,
  });

  const pedidos = pedidosEmAberto ?? [];
  const concluidos = pedidosConcluidos ?? [];
  const contasReceber = contasReceberData ?? [];

  // Fallback extra: contas agrupadas (quando pedidos e listar contas retornam vazio)
  const { data: agrupadoData, isLoading: isLoadingAgrupado } = useQuery({
    queryKey: ['contas-financeiras', 'agrupado', 'receber', status],
    queryFn: () =>
      financeiroService.listarAgrupado({
        tipo: 'RECEBER',
        limit: 500,
      }),
    enabled:
      (status === 'aberto' || status === 'todos') &&
      pedidos.length === 0 &&
      contasReceber.length === 0,
    retry: 1,
  });

  const itensAgrupado = agrupadoData?.itens ?? [];

  const clientesComPedidos = useMemo((): ClienteComPedidos[] => {
    const map = new Map<number, ClienteComPedidos & { total_pago_cliente?: number }>();
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    // 1) Pedidos em aberto: ignorar quitados (backend deve excluir; defesa contra cache)
    pedidos.forEach((pedido) => {
      if (pedido.status === 'CANCELADO' || pedido.status === 'QUITADO') return;
      const valorAberto = pedido.valor_em_aberto ?? 0;
      if (valorAberto <= 0) return;
      const valorPago = Number((pedido as any).valor_pago ?? 0);

      let maiorAtraso = 0;
      try {
        const dataPedido = new Date(pedido.data_pedido);
        dataPedido.setHours(0, 0, 0, 0);
        const dias = Math.floor(
          (hoje.getTime() - dataPedido.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (dias > 0) maiorAtraso = dias;
      } catch {}

      const existing = map.get(pedido.cliente_id);
      if (existing) {
        existing.total_aberto += valorAberto;
        existing.parcelas_aberto += 1;
        existing.total_pago_cliente = (existing.total_pago_cliente ?? 0) + valorPago;
        if (maiorAtraso > existing.maior_atraso_dias)
          existing.maior_atraso_dias = maiorAtraso;
      } else {
        map.set(pedido.cliente_id, {
          cliente_id: pedido.cliente_id,
          cliente_nome: pedido.cliente_nome || '—',
          total_aberto: valorAberto,
          parcelas_aberto: 1,
          maior_atraso_dias: maiorAtraso,
          total_pago_cliente: valorPago,
          primeiro_pedido_id: (pedido as any).pedido_id,
          status_parcela: valorAberto <= 0 ? 'quitado' : valorPago > 0 ? 'parcial' : 'pendente',
        });
      }
    });

    // 2) Pedidos quitados: Total em Aberto 0 e Status Quitado (sobrescreve se já estava no mapa por cache)
    concluidos.forEach((pedido) => {
      if (pedido.status !== 'QUITADO' || pedido.cliente_id == null) return;
      const valorPago = Number((pedido as any).valor_pago ?? 0);
      const existing = map.get(pedido.cliente_id);
      const totalPagoCliente = existing ? (existing.total_pago_cliente ?? 0) + valorPago : valorPago;
      map.set(pedido.cliente_id, {
        cliente_id: pedido.cliente_id,
        cliente_nome: pedido.cliente_nome || '—',
        total_aberto: 0,
        parcelas_aberto: existing ? existing.parcelas_aberto : 0,
        maior_atraso_dias: existing?.maior_atraso_dias ?? 0,
        total_pago_cliente: totalPagoCliente,
        primeiro_pedido_id: (pedido as any).pedido_id ?? existing?.primeiro_pedido_id,
        status_parcela: 'quitado',
      });
    });

    const withStatus = (c: typeof map extends Map<number, infer V> ? V : never): ClienteComPedidos => {
      const totalPago = c.total_pago_cliente ?? 0;
      let status: ClienteComPedidos['status_parcela'] =
        c.total_aberto <= 0 ? 'quitado' : (totalPago > 0 ? 'parcial' : 'pendente');
      if (status !== 'quitado' && c.maior_atraso_dias > 0) status = 'vencida';
      return {
        ...c,
        total_pago: totalPago,
        status_parcela: status,
      };
    };

    let result = Array.from(map.values()).map(withStatus);
    if (result.length > 0) return result;

    // Fallback: listar por contas financeiras (RECEBER) quando duplicatas/API de clientes retornam vazio
    const emAberto = (c: { status?: string; valor_restante?: number; valor_em_aberto?: number }) =>
      c.status !== 'PAGO_TOTAL' && c.status !== 'CANCELADO' &&
      ((c.valor_restante ?? (c as any).valor_em_aberto ?? 0) > 0);
    const cid = (c: { cliente_id?: number; clienteId?: number }) => c.cliente_id ?? (c as any).clienteId;
    contasReceber.filter((c) => cid(c) && emAberto(c)).forEach((conta) => {
      const cidNum = cid(conta)!;
      const cliente = clientes.find((c) => c.id === cidNum);
      const valorAberto = conta.valor_restante ?? (conta as any).valor_em_aberto ?? 0;
      const valorPagoConta = Number((conta as any).valor_pago ?? 0);
      let maiorAtraso = 0;
      try {
        const venc = new Date(conta.data_vencimento);
        venc.setHours(0, 0, 0, 0);
        const dias = Math.floor(
          (hoje.getTime() - venc.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (dias > 0 && dias > maiorAtraso) maiorAtraso = dias;
      } catch {}
      const existing = map.get(cidNum);
      if (existing) {
        existing.total_aberto += valorAberto;
        existing.parcelas_aberto += 1;
        existing.total_pago_cliente = (existing.total_pago_cliente ?? 0) + valorPagoConta;
        if (maiorAtraso > existing.maior_atraso_dias)
          existing.maior_atraso_dias = maiorAtraso;
      } else {
        map.set(cidNum, {
          cliente_id: cidNum,
          cliente_nome:
            cliente?.nome_fantasia ||
            cliente?.nome_razao ||
            (cliente as any)?.nome ||
            '—',
          total_aberto: valorAberto,
          parcelas_aberto: 1,
          maior_atraso_dias: maiorAtraso,
          total_pago_cliente: valorPagoConta,
          primeiro_pedido_id: (conta as any).pedido_id,
          status_parcela: valorAberto <= 0 ? 'quitado' : valorPagoConta > 0 ? 'parcial' : 'pendente',
        });
      }
    });
    result = Array.from(map.values()).map(withStatus).filter((c) => c.total_aberto > 0);
    if (result.length > 0) return result;

    // Fallback final: contas agrupadas (GET /contas-financeiras/agrupado) – agrupar por cliente_nome
    const statusAberto = (s: string) =>
      s !== 'PAGO_TOTAL' && s !== 'CANCELADO' && s !== 'Pago total' && s !== 'Cancelado';
    const mapAgrupado = new Map<number | string, ClienteComPedidos>();
    itensAgrupado.forEach((item) => {
      if (!statusAberto(item.status || '')) return;
      const valor = item.valor_total ?? 0;
      if (valor <= 0) return;
      const nome = item.cliente_nome || '—';
      const cliente = clientes.find(
        (c) =>
          (c.nome_fantasia || c.nome_razao || (c as any).nome || '')
            .toLowerCase()
            .trim() === nome.toLowerCase().trim()
      );
      const key = cliente?.id ?? nome;
      const existing = mapAgrupado.get(key);
      if (existing) {
        existing.total_aberto += valor;
        existing.parcelas_aberto += 1;
      } else {
        mapAgrupado.set(key, {
          cliente_id: cliente?.id ?? 0,
          cliente_nome: nome,
          total_aberto: valor,
          total_pago: 0,
          parcelas_aberto: 1,
          maior_atraso_dias: 0,
          primeiro_pedido_id: (item as any).pedido_id ?? undefined,
          status_parcela: 'pendente',
        });
      }
    });
    result = Array.from(mapAgrupado.values()).filter(
      (c) => c.total_aberto > 0 && c.cliente_nome !== '—'
    );
    return result;
  }, [pedidos, concluidos, clientes, contasReceber, itensAgrupado]);

  const totalAReceberLista = useMemo(
    () => clientesComPedidos.reduce((s, c) => s + (c.total_aberto ?? 0), 0),
    [clientesComPedidos]
  );

  useEffect(() => {
    onTotalAReceber?.(totalAReceberLista, clientesComPedidos.length);
  }, [onTotalAReceber, totalAReceberLista, clientesComPedidos.length]);

  const emptyPedidos =
    pedidos.length === 0;
  const esperandoFallbackAgrupado =
    emptyPedidos && contasReceber.length === 0 && (status === 'aberto' || status === 'todos');
  const isLoadingList =
    (emptyPedidos && (status === 'aberto' || status === 'todos') && isLoadingContasReceber) ||
    (esperandoFallbackAgrupado && isLoadingAgrupado);

  const filtrados = useMemo(() => {
    let list = clientesComPedidos;
    if (status === 'aberto') {
      list = list.filter((c) => (c.total_aberto ?? 0) > 0);
    }
    if (filtroCliente !== 'todos') {
      list = list.filter((c) => c.cliente_id.toString() === filtroCliente);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter((c) =>
        c.cliente_nome?.toLowerCase().includes(term)
      );
    }
    return list;
  }, [clientesComPedidos, status, filtroCliente, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
          <div className="sm:w-[180px]">
            <Label className="text-xs text-muted-foreground block mb-1.5">
              Cliente
            </Label>
            <Select value={filtroCliente} onValueChange={setFiltroCliente}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {clientes.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    {c.nome_fantasia || c.nome_razao || c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:w-[180px]">
            <Label className="text-xs text-muted-foreground block mb-1.5">
              Status
            </Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Em aberto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aberto">Em aberto</SelectItem>
                <SelectItem value="todos">Todos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="relative flex-1 min-w-0">
            <Label className="text-xs text-muted-foreground block mb-1.5">
              Buscar
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou documento"
                className="pl-10 h-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <Button variant="outline" size="icon" className="shrink-0" title="Buscar Cliente">
            <Search className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border overflow-hidden bg-card shadow-sm">
        <p className="text-xs text-muted-foreground px-4 py-2 border-b bg-muted/30">
          Totais por cliente (todos os pedidos em aberto).
        </p>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Cliente</TableHead>
              <TableHead className="w-[120px] text-right">Total em Aberto</TableHead>
              <TableHead className="w-[120px] text-right">Total Pago</TableHead>
              <TableHead className="w-[100px] text-center">Status</TableHead>
              <TableHead className="w-[100px] text-center">Cobranças em aberto</TableHead>
              <TableHead className="w-[100px] text-center">Maior Atraso</TableHead>
              <TableHead className="w-[70px] text-center"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingList ? (
              <TableRow>
                <TableCell colSpan={7} className="py-16 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : filtrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-16 text-center">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground/50" />
                  <p className="mt-2 font-medium">
                    Nenhum cliente com pedidos em aberto
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filtrados.map((row) => (
                <TableRow key={row.cliente_id}>
                  <TableCell className="font-medium">{row.cliente_nome}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(row.total_aberto)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(row.total_pago ?? 0)}
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={[
                        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
                        row.status_parcela === 'quitado' && 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
                        row.status_parcela === 'parcial' && 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
                        row.status_parcela === 'pendente' && 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
                        row.status_parcela === 'vencida' && 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
                      ].filter(Boolean).join(' ')}
                    >
                      {row.status_parcela === 'pendente' ? 'Pendente' : row.status_parcela === 'parcial' ? 'Parcial' : row.status_parcela === 'vencida' ? 'Vencida' : 'Quitado'}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {row.parcelas_aberto}
                  </TableCell>
                  <TableCell className="text-center">
                    {row.maior_atraso_dias > 0
                      ? `${row.maior_atraso_dias} dias`
                      : '—'}
                  </TableCell>
                  <TableCell className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {row.primeiro_pedido_id && row.total_aberto > 0 && (
                          <DropdownMenuItem
                            onClick={() =>
                              navigate(`/financeiro/contas-receber/${row.primeiro_pedido_id}/pagamentos`)
                            }
                          >
                            <DollarSign className="w-4 h-4 mr-2" />
                            Registrar Pagamento
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() =>
                            row.primeiro_pedido_id
                              ? navigate(`/financeiro/contas-receber/${row.primeiro_pedido_id}`)
                              : navigate(`/contas-a-receber/clientes/${row.cliente_id}`)
                          }
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Ver detalhes
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ContasAReceberListaClientes;
