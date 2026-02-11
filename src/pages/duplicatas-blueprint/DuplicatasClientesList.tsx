import AppLayout from '@/components/layout/AppLayout';
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
import { pedidosService } from '@/services/pedidos.service';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, FileText, Loader2, MoreVertical, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const DuplicatasClientesList = () => {
  const navigate = useNavigate();
  const [filtroCliente, setFiltroCliente] = useState<string>('todos');
  const [filtroStatus, setFiltroStatus] = useState<string>('aberto');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: clientesData } = useQuery({
    queryKey: ['clientes'],
    queryFn: async () => {
      const r = await clientesService.listar({ limit: 500, statusCliente: 'ATIVO' });
      return Array.isArray(r) ? r : r?.data || [];
    },
  });

  const clientes: Cliente[] = Array.isArray(clientesData) ? clientesData : clientesData?.data || [];

  const { data: clientesApi, isLoading } = useQuery({
    queryKey: ['contas-receber', 'clientes', filtroStatus],
    queryFn: () => contasReceberService.listarClientesComDuplicatas({ status: filtroStatus }),
  });

  // Usar novo endpoint /pedidos/contas-receber
  const { data: pedidosContasReceber } = useQuery({
    queryKey: ['pedidos', 'contas-receber', filtroStatus],
    queryFn: () =>
      pedidosService.listarContasReceber(
        filtroStatus === 'todos' ? undefined : { situacao: 'em_aberto' }
      ),
  });

  const pedidos = pedidosContasReceber ?? [];

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
            const dias = Math.floor((hoje.getTime() - venc.getTime()) / (1000 * 60 * 60 * 24));
            if (dias > 0 && dias > maiorAtraso) maiorAtraso = dias;
          } catch {}
        }
      });

      const existing = map.get(g.cliente_id);
      if (existing) {
        existing.total_aberto += valorAberto;
        existing.parcelas_aberto += parcelasAberto;
        if (maiorAtraso > existing.maior_atraso_dias) existing.maior_atraso_dias = maiorAtraso;
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
        const dias = Math.floor((hoje.getTime() - venc.getTime()) / (1000 * 60 * 60 * 24));
        if (dias > 0) maiorAtraso = dias;
      } catch {}
      const existing = map.get(a.cliente_id);
      if (existing) {
        existing.total_aberto += valorAberto;
        existing.parcelas_aberto += 1;
        if (maiorAtraso > existing.maior_atraso_dias) existing.maior_atraso_dias = maiorAtraso;
      } else {
        map.set(a.cliente_id, {
          cliente_id: a.cliente_id,
          cliente_nome: cliente?.nome_fantasia || cliente?.nome_razao || cliente?.nome || '—',
          total_aberto: valorAberto,
          parcelas_aberto: 1,
          maior_atraso_dias: maiorAtraso,
        });
      }
    });

    return Array.from(map.values()).filter((c) => c.total_aberto > 0);
  }, [clientesApi, pedidos, clientes]);

  const filtrados = useMemo(() => {
    let list = clientesComDuplicatas;
    if (filtroCliente !== 'todos') {
      list = list.filter((c) => c.cliente_id.toString() === filtroCliente);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(
        (c) =>
          c.cliente_nome?.toLowerCase().includes(term)
      );
    }
    return list;
  }, [clientesComDuplicatas, filtroCliente, searchTerm]);

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Duplicatas (Contas a Receber)</h1>
            <p className="text-muted-foreground">Gerencie recebimentos por cliente e parcela</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/duplicatas/lista')}>
            Lista de duplicatas
          </Button>
        </div>

        <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
            <div className="sm:w-[180px]">
              <Label className="text-xs text-muted-foreground block mb-1.5">Cliente</Label>
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
              <Label className="text-xs text-muted-foreground block mb-1.5">Status</Label>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
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
              <Label className="text-xs text-muted-foreground block mb-1.5">Buscar</Label>
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
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-16 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : filtrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-16 text-center">
                    <FileText className="w-12 h-12 mx-auto text-muted-foreground/50" />
                    <p className="mt-2 font-medium">Nenhum cliente com duplicatas em aberto</p>
                  </TableCell>
                </TableRow>
              ) : (
                filtrados.map((row) => (
                  <TableRow key={row.cliente_id}>
                    <TableCell className="font-medium">{row.cliente_nome}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(row.total_aberto)}
                    </TableCell>
                    <TableCell className="text-center">{row.parcelas_aberto}</TableCell>
                    <TableCell className="text-center">
                      {row.maior_atraso_dias > 0 ? `${row.maior_atraso_dias} dias` : '—'}
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
                            onClick={() => navigate(`/duplicatas/clientes/${row.cliente_id}`)}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Ver detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => navigate(`/duplicatas/clientes/${row.cliente_id}`)}
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
    </AppLayout>
  );
};

export default DuplicatasClientesList;
