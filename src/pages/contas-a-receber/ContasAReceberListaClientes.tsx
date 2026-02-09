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
import type { ClienteComDuplicatas } from '@/services/contas-receber.service';
import { contasReceberService } from '@/services/contas-receber.service';
import { duplicatasService } from '@/services/duplicatas.service';
import { financeiroService } from '@/services/financeiro.service';
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

  const { data: clientesApi, isLoading } = useQuery({
    queryKey: ['contas-receber', 'clientes'],
    queryFn: () => contasReceberService.listarClientesComDuplicatas(),
  });

  const { data: agrupadasData } = useQuery({
    queryKey: ['duplicatas', 'agrupadas-por-pedido', status],
    queryFn: () =>
      duplicatasService.listarAgrupadasPorPedido({
        status: status === 'todos' ? undefined : 'ABERTA',
      }),
  });

  // Fallback: quando duplicatas retornam vazio mas o dashboard mostra valores, usar contas financeiras (RECEBER)
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

  const grupos = agrupadasData?.grupos ?? [];
  const avulsas = agrupadasData?.avulsas ?? [];
  const contasReceber = contasReceberData ?? [];

  // Fallback extra: contas agrupadas (quando duplicatas e listar contas retornam vazio)
  const { data: agrupadoData, isLoading: isLoadingAgrupado } = useQuery({
    queryKey: ['contas-financeiras', 'agrupado', 'receber', status],
    queryFn: () =>
      financeiroService.listarAgrupado({
        tipo: 'RECEBER',
        limit: 500,
      }),
    enabled:
      (status === 'aberto' || status === 'todos') &&
      clientesApi?.length === 0 &&
      grupos.length === 0 &&
      avulsas.length === 0 &&
      contasReceber.length === 0,
    retry: 1,
  });

  const itensAgrupado = agrupadoData?.itens ?? [];

  const clientesComDuplicatas = useMemo((): ClienteComDuplicatas[] => {
    if (clientesApi && clientesApi.length > 0) return clientesApi;

    const map = new Map<number, ClienteComDuplicatas>();
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    grupos.forEach((g) => {
      const parcelasAberto = g.parcelas.filter(
        (p) => p.status !== 'BAIXADA' && p.status !== 'CANCELADA'
      ).length;
      const valorAberto = g.valor_aberto ?? 0;
      let maiorAtraso = 0;
      g.parcelas.forEach((p) => {
        if (p.status !== 'BAIXADA') {
          try {
            const venc = new Date(p.data_vencimento);
            venc.setHours(0, 0, 0, 0);
            const dias = Math.floor(
              (hoje.getTime() - venc.getTime()) / (1000 * 60 * 60 * 24)
            );
            if (dias > 0 && dias > maiorAtraso) maiorAtraso = dias;
          } catch {}
        }
      });

      const existing = map.get(g.cliente_id);
      if (existing) {
        existing.total_aberto += valorAberto;
        existing.parcelas_aberto += parcelasAberto;
        if (maiorAtraso > existing.maior_atraso_dias)
          existing.maior_atraso_dias = maiorAtraso;
      } else {
        map.set(g.cliente_id, {
          cliente_id: g.cliente_id,
          cliente_nome: g.cliente_nome || '—',
          total_aberto: valorAberto,
          parcelas_aberto: parcelasAberto,
          maior_atraso_dias: maiorAtraso,
        });
      }
    });

    avulsas.forEach((a) => {
      if (a.status === 'BAIXADA' || a.status === 'CANCELADA') return;
      const cliente = clientes.find((c) => c.id === a.cliente_id);
      const valorAberto = a.valor_aberto ?? 0;
      let maiorAtraso = 0;
      try {
        const venc = new Date(a.data_vencimento);
        venc.setHours(0, 0, 0, 0);
        const dias = Math.floor(
          (hoje.getTime() - venc.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (dias > 0) maiorAtraso = dias;
      } catch {}
      const existing = map.get(a.cliente_id);
      if (existing) {
        existing.total_aberto += valorAberto;
        existing.parcelas_aberto += 1;
        if (maiorAtraso > existing.maior_atraso_dias)
          existing.maior_atraso_dias = maiorAtraso;
      } else {
        map.set(a.cliente_id, {
          cliente_id: a.cliente_id,
          cliente_nome:
            cliente?.nome_fantasia ||
            cliente?.nome_razao ||
            cliente?.nome ||
            '—',
          total_aberto: valorAberto,
          parcelas_aberto: 1,
          maior_atraso_dias: maiorAtraso,
        });
      }
    });

    let result = Array.from(map.values()).filter((c) => c.total_aberto > 0);
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
        });
      }
    });
    result = Array.from(map.values()).filter((c) => c.total_aberto > 0);
    if (result.length > 0) return result;

    // Fallback final: contas agrupadas (GET /contas-financeiras/agrupado) – agrupar por cliente_nome
    const statusAberto = (s: string) =>
      s !== 'PAGO_TOTAL' && s !== 'CANCELADO' && s !== 'Pago total' && s !== 'Cancelado';
    const mapAgrupado = new Map<number | string, ClienteComDuplicatas>();
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
          parcelas_aberto: 1,
          maior_atraso_dias: 0,
        });
      }
    });
    result = Array.from(mapAgrupado.values()).filter(
      (c) => c.total_aberto > 0 && c.cliente_nome !== '—'
    );
    return result;
  }, [clientesApi, grupos, avulsas, clientes, contasReceber, itensAgrupado]);

  const totalAReceberLista = useMemo(
    () => clientesComDuplicatas.reduce((s, c) => s + (c.total_aberto ?? 0), 0),
    [clientesComDuplicatas]
  );

  useEffect(() => {
    onTotalAReceber?.(totalAReceberLista, clientesComDuplicatas.length);
  }, [onTotalAReceber, totalAReceberLista, clientesComDuplicatas.length]);

  const emptyDuplicatas =
    clientesApi?.length === 0 && grupos.length === 0 && avulsas.length === 0;
  const esperandoFallbackAgrupado =
    emptyDuplicatas && contasReceber.length === 0 && (status === 'aberto' || status === 'todos');
  const isLoadingList =
    isLoading ||
    (emptyDuplicatas && (status === 'aberto' || status === 'todos') && isLoadingContasReceber) ||
    (esperandoFallbackAgrupado && isLoadingAgrupado);

  const filtrados = useMemo(() => {
    let list = clientesComDuplicatas;
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
  }, [clientesComDuplicatas, filtroCliente, searchTerm]);

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
              <TableHead className="w-[140px] text-right">Total em Aberto</TableHead>
              <TableHead className="w-[140px] text-center">Parcelas em Aberto</TableHead>
              <TableHead className="w-[120px] text-center">Maior Atraso</TableHead>
              <TableHead className="w-[70px] text-center"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingList ? (
              <TableRow>
                <TableCell colSpan={5} className="py-16 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : filtrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-16 text-center">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground/50" />
                  <p className="mt-2 font-medium">
                    Nenhum cliente com duplicatas em aberto
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
                        <DropdownMenuItem
                          onClick={() =>
                            navigate(`/contas-a-receber/clientes/${row.cliente_id}`)
                          }
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Ver detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            navigate(`/contas-a-receber/clientes/${row.cliente_id}`)
                          }
                        >
                          <DollarSign className="w-4 h-4 mr-2" />
                          Pagar parcela
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
