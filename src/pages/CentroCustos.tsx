import AppLayout from '@/components/layout/AppLayout';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  CENTRO_CUSTO_PAGE_SIZE,
  useCentroCustos,
  statusDespesa,
  totalPagoNaDespesa,
  type CentroCustoDespesa,
  type CentroCustoTipo,
} from '@/contexts/CentroCustosContext';
import { formatValorMonetarioBr, parseValorMonetarioEntrada } from '@/lib/parse-valor-monetario';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { centroCustoService } from '@/services/centro-custo.service';
import { controleRocaService } from '@/services/controle-roca.service';
import type { Roca } from '@/types/roca';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Banknote,
  Check,
  ChevronsUpDown,
  Eye,
  Landmark,
  Pencil,
  PiggyBank,
  Plus,
  Receipt,
  Scale,
  Trash2,
  Wallet,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const CARD_STATS = [
  {
    key: 'abertas',
    label: 'Total de despesas em aberto',
    kind: 'count' as const,
    border: 'border-l-4 border-l-amber-500',
    iconWrap:
      'bg-amber-500/[0.12] text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
    Icon: Receipt,
  },
  {
    key: 'quitadas',
    label: 'Total de despesas quitadas',
    kind: 'count' as const,
    border: 'border-l-4 border-l-emerald-500',
    iconWrap:
      'bg-emerald-500/[0.12] text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
    Icon: PiggyBank,
  },
  {
    key: 'valorAberto',
    label: 'Valor total em aberto',
    kind: 'money' as const,
    border: 'border-l-4 border-l-rose-500',
    iconWrap:
      'bg-rose-500/[0.12] text-rose-700 dark:bg-rose-500/15 dark:text-rose-400',
    Icon: Wallet,
  },
  {
    key: 'valorPago',
    label: 'Valor pago',
    kind: 'money' as const,
    border: 'border-l-4 border-l-sky-600 dark:border-l-sky-400',
    iconWrap:
      'bg-sky-500/[0.12] text-sky-800 dark:bg-sky-500/15 dark:text-sky-300',
    Icon: Scale,
  },
];

function badgeStatus(st: 'ABERTO' | 'PARCIAL' | 'QUITADO') {
  const map = {
    ABERTO: 'bg-amber-500/15 text-amber-800 dark:text-amber-300',
    PARCIAL: 'bg-sky-500/15 text-sky-800 dark:text-sky-300',
    QUITADO: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300',
  };
  const label = st === 'PARCIAL' ? 'Parcial' : st === 'QUITADO' ? 'Quitado' : 'Aberto';
  return (
    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', map[st])}>{label}</span>
  );
}

function DespesasTable({
  despesas,
  nomeTipo,
  onDetalhe,
  onPagar,
  onEditar,
  onExcluir,
}: {
  despesas: CentroCustoDespesa[];
  nomeTipo: (d: CentroCustoDespesa) => string;
  onDetalhe: (d: CentroCustoDespesa) => void;
  onPagar: (d: CentroCustoDespesa) => void;
  onEditar: (d: CentroCustoDespesa) => void;
  onExcluir: (d: CentroCustoDespesa) => void;
}) {
  const ordenadas = useMemo(
    () =>
      [...despesas].sort((a, b) => {
        const qa = statusDespesa(a) === 'QUITADO' ? 1 : 0;
        const qb = statusDespesa(b) === 'QUITADO' ? 1 : 0;
        if (qa !== qb) return qa - qb;
        return b.data.localeCompare(a.data);
      }),
    [despesas],
  );

  return (
    <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Descrição</TableHead>
            <TableHead>Roça</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Pago</TableHead>
            <TableHead className="min-w-[220px] text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ordenadas.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground py-10">
                Nenhuma despesa lançada.
              </TableCell>
            </TableRow>
          ) : (
            ordenadas.map((d) => {
              const st = statusDespesa(d);
              const pago = totalPagoNaDespesa(d);
              return (
                <TableRow key={d.id}>
                  <TableCell className="font-medium max-w-[180px] truncate">{d.descricao}</TableCell>
                  <TableCell>{d.rocaNome}</TableCell>
                  <TableCell>{nomeTipo(d)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(Number(d.valor))}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{formatDate(d.data)}</TableCell>
                  <TableCell>{badgeStatus(st)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(pago)}</TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex flex-wrap items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          void onDetalhe(d);
                        }}
                        title="Detalhes"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1 px-2 shrink-0"
                        onClick={() => onPagar(d)}
                        disabled={st === 'QUITADO'}
                        title={st === 'QUITADO' ? 'Despesa quitada' : 'Registrar pagamento'}
                      >
                        <Banknote className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Pagar</span>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => onEditar(d)} title="Editar">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      {pago <= 0.009 ? (
                        <Button variant="ghost" size="icon" onClick={() => onExcluir(d)} title="Excluir">
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
    </Table>
  );
}

function CentroCustoTablePagination({
  page,
  setPage,
  total,
  totalPages,
}: {
  page: number;
  setPage: (p: number | ((prev: number) => number)) => void;
  total: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;
  const from = total > 0 ? (page - 1) * CENTRO_CUSTO_PAGE_SIZE + 1 : 0;
  const to = Math.min(page * CENTRO_CUSTO_PAGE_SIZE, total);
  return (
    <div className="border-t border-border px-4 py-3 space-y-2">
      <Pagination className="justify-end">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setPage((prev) => Math.max(1, prev - 1));
              }}
              className={
                page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'
              }
            />
          </PaginationItem>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum: number;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (page <= 3) {
              pageNum = i + 1;
            } else if (page >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = page - 2 + i;
            }
            return (
              <PaginationItem key={pageNum}>
                <PaginationLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setPage(pageNum);
                  }}
                  isActive={page === pageNum}
                  className="cursor-pointer"
                >
                  {pageNum}
                </PaginationLink>
              </PaginationItem>
            );
          })}
          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setPage((prev) => Math.min(totalPages, prev + 1));
              }}
              className={
                page === totalPages
                  ? 'pointer-events-none opacity-50'
                  : 'cursor-pointer'
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
      <p className="text-center text-sm text-muted-foreground">
        Mostrando {from} a {to} de {total}
      </p>
    </div>
  );
}

function msgErro(e: unknown, fallback: string): string {
  if (e instanceof Error && e.message) return e.message;
  return fallback;
}

export default function CentroCustos() {
  const {
    tipos,
    tiposOpcoes,
    tiposPage,
    setTiposPage,
    tiposTotal,
    despesas,
    despesasPage,
    setDespesasPage,
    despesasTotal,
    isLoading,
    adicionarTipo,
    atualizarTipo,
    excluirTipo,
    adicionarDespesa,
    atualizarDespesa,
    excluirDespesa,
    resumo,
  } = useCentroCustos();

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: rocasApi = [], isLoading: loadingRocas } = useQuery({
    queryKey: ['centro-custos', 'rocas-ativas'],
    queryFn: () => controleRocaService.listarRocas(undefined, false),
    retry: 1,
  });

  const rocasAtivas = useMemo(
    () =>
      (rocasApi as Roca[]).filter(
        (r) => r && (r.ativo === undefined || r.ativo === true),
      ),
    [rocasApi],
  );

  const totalTiposPages = Math.max(
    1,
    Math.ceil(tiposTotal / CENTRO_CUSTO_PAGE_SIZE),
  );
  const totalDespesasPages = Math.max(
    1,
    Math.ceil(despesasTotal / CENTRO_CUSTO_PAGE_SIZE),
  );

  const nomeTipoDespesa = (d: CentroCustoDespesa) =>
    d.tipoNome ?? tiposOpcoes.find((t) => t.id === d.tipoId)?.nome ?? '—';

  const [tab, setTab] = useState('visao');

  /** Tipos */
  const [tipoDialogOpen, setTipoDialogOpen] = useState(false);
  const [tipoEdit, setTipoEdit] = useState<CentroCustoTipo | null>(null);
  const [tipoNome, setTipoNome] = useState('');
  const [tipoDelete, setTipoDelete] = useState<CentroCustoTipo | null>(null);

  /** Despesa form */
  const [descricao, setDescricao] = useState('');
  const [valorStr, setValorStr] = useState('');
  const [dataDesp, setDataDesp] = useState(() => new Date().toISOString().slice(0, 10));
  const [observacoes, setObservacoes] = useState('');
  const [tipoIdSel, setTipoIdSel] = useState<string>('');
  const [rocaSel, setRocaSel] = useState<Roca | null>(null);
  const [tipoPopOpen, setTipoPopOpen] = useState(false);
  const [rocaPopOpen, setRocaPopOpen] = useState(false);
  const [quickTipoOpen, setQuickTipoOpen] = useState(false);
  const [quickTipoNome, setQuickTipoNome] = useState('');

  /** Despesa dialogs */
  const [editDesp, setEditDesp] = useState<CentroCustoDespesa | null>(null);
  const [deleteDesp, setDeleteDesp] = useState<CentroCustoDespesa | null>(null);

  const openNovoTipo = () => {
    setTipoEdit(null);
    setTipoNome('');
    setTipoDialogOpen(true);
  };

  const salvarTipo = async () => {
    const n = tipoNome.trim();
    if (!n) {
      toast.error('Informe o nome do tipo.');
      return;
    }
    try {
      if (tipoEdit) await atualizarTipo(tipoEdit.id, n);
      else await adicionarTipo(n);
      setTipoDialogOpen(false);
      toast.success(tipoEdit ? 'Tipo atualizado.' : 'Tipo cadastrado.');
    } catch (e) {
      toast.error(msgErro(e, 'Não foi possível salvar o tipo.'));
    }
  };

  const salvarQuickTipo = async () => {
    const n = quickTipoNome.trim();
    if (!n) {
      toast.error('Informe o nome.');
      return;
    }
    try {
      const t = await adicionarTipo(n);
      setTipoIdSel(t.id);
      setQuickTipoNome('');
      setQuickTipoOpen(false);
      setTipoPopOpen(false);
      toast.success('Tipo cadastrado.');
    } catch (e) {
      toast.error(msgErro(e, 'Não foi possível cadastrar o tipo.'));
    }
  };

  const parseValor = (s: string): number => {
    const n = parseValorMonetarioEntrada(s);
    return n === null || !Number.isFinite(n) ? NaN : n;
  };

  const salvarDespesa = async () => {
    const v = parseValor(valorStr);
    if (!descricao.trim()) {
      toast.error('Informe a descrição da despesa.');
      return;
    }
    if (!tipoIdSel) {
      toast.error('Selecione o tipo de custo.');
      return;
    }
    if (!rocaSel) {
      toast.error('Selecione a roça.');
      return;
    }
    if (!Number.isFinite(v) || v <= 0) {
      toast.error('Informe um valor válido.');
      return;
    }
    try {
      await adicionarDespesa({
        descricao: descricao.trim(),
        tipoId: tipoIdSel,
        rocaId: rocaSel.id,
        rocaNome: rocaSel.nome,
        tipoNome: tiposOpcoes.find((t) => t.id === tipoIdSel)?.nome,
        valor: v,
        data: dataDesp,
        observacoes: observacoes.trim() || undefined,
      });
      toast.success('Despesa cadastrada.');
      setDescricao('');
      setValorStr('');
      setObservacoes('');
    } catch (e) {
      toast.error(msgErro(e, 'Não foi possível cadastrar a despesa.'));
    }
  };

  const despesaNomeTipo = nomeTipoDespesa;

  const salvarEdicaoDespesa = async () => {
    if (!editDesp) return;
    const v = parseValor(valorStr);
    if (!descricao.trim()) {
      toast.error('Informe a descrição.');
      return;
    }
    if (!tipoIdSel) {
      toast.error('Selecione o tipo.');
      return;
    }
    if (!rocaSel) {
      toast.error('Selecione a roça.');
      return;
    }
    if (!Number.isFinite(v) || v < totalPagoNaDespesa(editDesp)) {
      toast.error('Valor não pode ser menor que o total já pago.');
      return;
    }
    try {
      await atualizarDespesa(editDesp.id, {
        descricao: descricao.trim(),
        tipoId: tipoIdSel,
        rocaId: rocaSel.id,
        rocaNome: rocaSel.nome,
        valor: v,
        data: dataDesp,
        observacoes: observacoes.trim() || undefined,
      });
      setEditDesp(null);
      toast.success('Despesa atualizada.');
    } catch (e) {
      toast.error(msgErro(e, 'Não foi possível atualizar a despesa.'));
    }
  };

  const abrirEditar = (d: CentroCustoDespesa) => {
    setEditDesp(d);
    setDescricao(d.descricao);
    setValorStr(formatValorMonetarioBr(Number(d.valor)));
    setDataDesp(d.data.slice(0, 10));
    setObservacoes(d.observacoes ?? '');
    setTipoIdSel(d.tipoId);
    const r = rocasAtivas.find((x) => x.id === d.rocaId);
    setRocaSel(r ?? ({ id: d.rocaId, nome: d.rocaNome, codigo: '', produtorId: 0 } as Roca));
  };

  /** Resolve o id da conta a pagar espelhada (sincroniza se necessário). */
  const resolverContaFinanceiraId = useCallback(
    async (d: CentroCustoDespesa): Promise<number | null> => {
      let contaId = d.contaFinanceiraId ?? null;
      if (contaId == null) {
        try {
          await centroCustoService.sincronizarContasFinanceiras();
          await queryClient.invalidateQueries({ queryKey: ['centro-custo'] });
          const fresh = await centroCustoService.buscarDespesaPorId(Number(d.id));
          contaId =
            fresh.contaFinanceiraId != null ? Number(fresh.contaFinanceiraId) : null;
        } catch (e) {
          toast.error(msgErro(e, 'Não foi possível vincular a conta a pagar.'));
          return null;
        }
      }
      if (contaId == null) {
        toast.error(
          'Esta despesa ainda não tem conta a pagar. Aguarde a sincronização ou contate o suporte.',
        );
        return null;
      }
      return contaId;
    },
    [queryClient],
  );

  /** Mesmo layout de detalhes que Contas a Pagar → despesa (cards + histórico). */
  const abrirDetalhe = useCallback(
    async (d: CentroCustoDespesa) => {
      const contaId = await resolverContaFinanceiraId(d);
      if (contaId == null) return;
      navigate(`/financeiro/contas-pagar/despesa/${contaId}`, {
        state: { voltarPara: '/centro-custos' },
      });
    },
    [navigate, resolverContaFinanceiraId],
  );

  /** Mesma tela de Registrar Pagamento de Contas a Pagar (parcial/total + forma + observações). */
  const abrirPagarRapido = useCallback(
    async (d: CentroCustoDespesa) => {
      if (statusDespesa(d) === 'QUITADO') {
        toast.info('Esta despesa já está quitada.');
        return;
      }
      const contaId = await resolverContaFinanceiraId(d);
      if (contaId == null) return;
      navigate(`/financeiro/contas-pagar/conta/${contaId}/pagamentos`, {
        state: { voltarPara: '/centro-custos' },
      });
    },
    [navigate, resolverContaFinanceiraId],
  );

  const fecharEdicao = () => {
    setEditDesp(null);
    setDescricao('');
    setValorStr('');
    setObservacoes('');
    setTipoIdSel('');
    setRocaSel(null);
  };

  return (
    <AppLayout>
      <div className="p-3 sm:p-4 md:p-6 min-w-0">
        <div className="mb-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Landmark className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Centro de Despesa</h1>
              <p className="text-muted-foreground text-sm sm:text-base mt-1">
                Cadastro de{' '}
                <span className="whitespace-nowrap">tipos de custo</span> e despesas por roça, sincronizado com o
                banco do seu tenant.
              </p>
              {isLoading ? (
                <p className="text-xs text-muted-foreground mt-2">Carregando tipos e despesas…</p>
              ) : null}
            </div>
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="space-y-6">
          {tab === 'visao' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
                {CARD_STATS.map((c, idx) => {
                  const Icon = c.Icon;
                  const valNum =
                    c.key === 'abertas'
                      ? resumo.qAbertas
                      : c.key === 'quitadas'
                        ? resumo.qQuitadas
                        : c.key === 'valorAberto'
                          ? resumo.valorAbertoTotal
                          : resumo.valorPagoTotal;
                  const display =
                    c.kind === 'count' ? String(valNum) : formatCurrency(valNum);
                  return (
                    <motion.div
                      key={c.key}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Card
                        className={`h-full overflow-hidden border border-border/60 shadow-sm ${c.border} bg-gradient-to-b from-background to-muted/30 dark:to-muted/20`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <p className="line-clamp-3 text-xs font-medium leading-snug text-muted-foreground">
                              {c.label}
                            </p>
                            <div
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${c.iconWrap}`}
                            >
                              <Icon className="h-4 w-4" aria-hidden />
                            </div>
                          </div>
                          <p className="mt-3 text-xl font-bold tabular-nums tracking-tight sm:text-2xl text-slate-900 dark:text-foreground">
                            {display}
                          </p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          <div
            className={cn(
              'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
              tab === 'visao' ? 'pt-2' : '',
            )}
          >
            <TabsList className="grid h-auto w-full max-w-lg shrink-0 grid-cols-3 p-1 sm:w-auto">
              <TabsTrigger value="visao">Visão geral</TabsTrigger>
              <TabsTrigger value="tipos">Tipos de custo</TabsTrigger>
              <TabsTrigger value="despesas">Despesas</TabsTrigger>
            </TabsList>
            {tab === 'visao' && (
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 self-end sm:self-auto"
                onClick={() => setTab('despesas')}
              >
                Ir para nova despesa
              </Button>
            )}
          </div>

          {tab === 'visao' && (
            <div className="rounded-xl border bg-card overflow-hidden">
              <DespesasTable
                despesas={despesas}
                nomeTipo={despesaNomeTipo}
                onDetalhe={abrirDetalhe}
                onPagar={abrirPagarRapido}
                onEditar={abrirEditar}
                onExcluir={setDeleteDesp}
              />
              <CentroCustoTablePagination
                page={despesasPage}
                setPage={setDespesasPage}
                total={despesasTotal}
                totalPages={totalDespesasPages}
              />
            </div>
          )}

          <TabsContent value="visao" className="mt-0">
            <span className="sr-only">Resumo e tabela de despesas estão acima das abas.</span>
          </TabsContent>

          <TabsContent value="tipos" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground max-w-xl">
                Tipos livres (gasolina, mudas…). Usados ao lançar despesas.
              </p>
              <Button onClick={openNovoTipo} className="shrink-0">
                <Plus className="w-4 h-4 mr-2" />
                Novo tipo
              </Button>
            </div>
            <div className="rounded-xl border bg-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead className="w-[140px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tipos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-muted-foreground py-10">
                        Nenhum tipo cadastrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    tipos.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.nome}</TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setTipoEdit(t);
                              setTipoNome(t.nome);
                              setTipoDialogOpen(true);
                            }}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setTipoDelete(t)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <CentroCustoTablePagination
                page={tiposPage}
                setPage={setTiposPage}
                total={tiposTotal}
                totalPages={totalTiposPages}
              />
            </div>
          </TabsContent>

          <TabsContent value="despesas" className="space-y-6">
            <div className="rounded-xl border border-border/70 bg-card/80 p-4 sm:p-5 space-y-4">
              <h2 className="text-base font-semibold">Nova despesa</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Ex.: Abastecimento trator"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de custo</Label>
                  <Popover open={tipoPopOpen} onOpenChange={setTipoPopOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between font-normal"
                      >
                        <span className="truncate">
                          {tipoIdSel
                            ? tiposOpcoes.find((t) => t.id === tipoIdSel)?.nome ?? 'Selecione…'
                            : 'Buscar ou selecionar tipo…'}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Pesquisar tipo…" />
                        <CommandList>
                          <CommandEmpty>Nenhum tipo encontrado.</CommandEmpty>
                          <CommandGroup>
                            {tiposOpcoes.map((t) => (
                              <CommandItem
                                key={t.id}
                                value={t.nome}
                                onSelect={() => {
                                  setTipoIdSel(t.id);
                                  setTipoPopOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    tipoIdSel === t.id ? 'opacity-100' : 'opacity-0',
                                  )}
                                />
                                {t.nome}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                          <CommandSeparator />
                          <CommandGroup>
                            <CommandItem
                              onSelect={() => {
                                setQuickTipoOpen(true);
                              }}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Cadastrar novo tipo…
                            </CommandItem>
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Roça (ativas)</Label>
                  <Popover open={rocaPopOpen} onOpenChange={setRocaPopOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        disabled={loadingRocas}
                        className="w-full justify-between font-normal"
                      >
                        <span className="truncate">
                          {rocaSel ? `${rocaSel.nome}` : loadingRocas ? 'Carregando…' : 'Buscar roça por nome…'}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Pesquisar roça…" />
                        <CommandList>
                          <CommandEmpty>
                            {loadingRocas ? 'Carregando roças…' : 'Nenhuma roça ativa encontrada.'}
                          </CommandEmpty>
                          <CommandGroup>
                            {rocasAtivas.map((r) => (
                              <CommandItem
                                key={r.id}
                                value={`${r.nome} ${r.codigo ?? ''}`}
                                onSelect={() => {
                                  setRocaSel(r);
                                  setRocaPopOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    rocaSel?.id === r.id ? 'opacity-100' : 'opacity-0',
                                  )}
                                />
                                <span className="truncate">{r.nome}</span>
                                {r.codigo ? (
                                  <span className="text-muted-foreground text-xs ml-1">({r.codigo})</span>
                                ) : null}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Valor (R$)</Label>
                  <Input
                    value={valorStr}
                    onChange={(e) => setValorStr(e.target.value)}
                    placeholder="0,00"
                    inputMode="decimal"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data (competência)</Label>
                  <Input type="date" value={dataDesp} onChange={(e) => setDataDesp(e.target.value)} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Observações</Label>
                  <Textarea
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Opcional"
                    rows={2}
                  />
                </div>
              </div>
              <Button onClick={salvarDespesa} className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Salvar despesa
              </Button>
            </div>

            <div className="space-y-2">
              <h2 className="text-base font-semibold">Lista de despesas</h2>
              <div className="rounded-xl border bg-card overflow-hidden">
                <DespesasTable
                  despesas={despesas}
                  nomeTipo={despesaNomeTipo}
                  onDetalhe={abrirDetalhe}
                  onPagar={abrirPagarRapido}
                  onEditar={abrirEditar}
                  onExcluir={setDeleteDesp}
                />
                <CentroCustoTablePagination
                  page={despesasPage}
                  setPage={setDespesasPage}
                  total={despesasTotal}
                  totalPages={totalDespesasPages}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Tipo create/edit */}
        <Dialog open={tipoDialogOpen} onOpenChange={setTipoDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{tipoEdit ? 'Editar tipo' : 'Novo tipo de custo'}</DialogTitle>
              <DialogDescription>Nome exibido nos lançamentos e relatórios.</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={tipoNome} onChange={(e) => setTipoNome(e.target.value)} placeholder="Ex.: Gasolina" />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setTipoDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={salvarTipo}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={quickTipoOpen} onOpenChange={setQuickTipoOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cadastro rápido de tipo</DialogTitle>
            </DialogHeader>
            <Input
              value={quickTipoNome}
              onChange={(e) => setQuickTipoNome(e.target.value)}
              placeholder="Nome do tipo"
              onKeyDown={(e) => e.key === 'Enter' && salvarQuickTipo()}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setQuickTipoOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={salvarQuickTipo}>Cadastrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Editar despesa */}
        <Dialog
          open={!!editDesp}
          onOpenChange={(o) => {
            if (!o) fecharEdicao();
          }}
        >
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Editar despesa</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1">
                <Label>Descrição</Label>
                <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Tipo</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between font-normal">
                      {tipoIdSel ? tiposOpcoes.find((t) => t.id === tipoIdSel)?.nome : 'Selecione'}
                      <ChevronsUpDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]">
                    <Command>
                      <CommandInput placeholder="Pesquisar…" />
                      <CommandList>
                        <CommandEmpty>Nenhum.</CommandEmpty>
                        <CommandGroup>
                          {tiposOpcoes.map((t) => (
                            <CommandItem key={t.id} value={t.nome} onSelect={() => setTipoIdSel(t.id)}>
                              {t.nome}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1">
                <Label>Roça</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between font-normal">
                      <span className="truncate">{rocaSel?.nome ?? 'Selecione'}</span>
                      <ChevronsUpDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]">
                    <Command shouldFilter={false}>
                      <CommandInput placeholder="Pesquisar roça…" />
                      <CommandList>
                        <CommandGroup>
                          {rocasAtivas.map((r) => (
                            <CommandItem
                              key={r.id}
                              value={`${r.nome} ${r.codigo}`}
                              onSelect={() => setRocaSel(r)}
                            >
                              {r.nome}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label>Valor</Label>
                  <Input value={valorStr} onChange={(e) => setValorStr(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Data</Label>
                  <Input type="date" value={dataDesp} onChange={(e) => setDataDesp(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Observações</Label>
                <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={2} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={fecharEdicao}>
                Cancelar
              </Button>
              <Button onClick={salvarEdicaoDespesa}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!tipoDelete} onOpenChange={(o) => !o && setTipoDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir tipo?</AlertDialogTitle>
              <AlertDialogDescription>
                Só é possível excluir um tipo que não tenha despesas vinculadas.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={async (ev) => {
                  ev.preventDefault();
                  if (!tipoDelete) return;
                  try {
                    await excluirTipo(tipoDelete.id);
                    setTipoDelete(null);
                    toast.success('Tipo excluído.');
                  } catch (e) {
                    toast.error(msgErro(e, 'Não foi possível excluir o tipo.'));
                  }
                }}
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={!!deleteDesp} onOpenChange={(o) => !o && setDeleteDesp(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir despesa?</AlertDialogTitle>
              <AlertDialogDescription>Esta ação remove o lançamento e os pagamentos associados.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={async (ev) => {
                  ev.preventDefault();
                  const alvo = deleteDesp;
                  if (!alvo) return;
                  try {
                    await excluirDespesa(alvo.id);
                    setDeleteDesp(null);
                    toast.success('Despesa excluída.');
                  } catch (e) {
                    toast.error(msgErro(e, 'Não foi possível excluir a despesa.'));
                  }
                }}
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
