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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  useCentroCustos,
  statusDespesa,
  totalPagoNaDespesa,
  type CentroCustoDespesa,
  type CentroCustoTipo,
} from '@/contexts/CentroCustosContext';
import { cn, formatCurrency } from '@/lib/utils';
import { controleRocaService } from '@/services/controle-roca.service';
import type { Roca } from '@/types/roca';
import { useQuery } from '@tanstack/react-query';
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
import { useMemo, useState } from 'react';
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
  nomeTipo: (tipoId: string) => string;
  onDetalhe: (d: CentroCustoDespesa) => void;
  onPagar: (d: CentroCustoDespesa) => void;
  onEditar: (d: CentroCustoDespesa) => void;
  onExcluir: (d: CentroCustoDespesa) => void;
}) {
  const ordenadas = useMemo(
    () => [...despesas].sort((a, b) => b.data.localeCompare(a.data)),
    [despesas],
  );

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
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
                  <TableCell>{nomeTipo(d.tipoId)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(Number(d.valor))}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{d.data}</TableCell>
                  <TableCell>{badgeStatus(st)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(pago)}</TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex flex-wrap items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => onDetalhe(d)} title="Detalhes">
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
                      <Button variant="ghost" size="icon" onClick={() => onExcluir(d)} title="Excluir">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export default function CentroCustos() {
  const {
    tipos,
    despesas,
    adicionarTipo,
    atualizarTipo,
    excluirTipo,
    adicionarDespesa,
    atualizarDespesa,
    excluirDespesa,
    registrarPagamento,
    resumoModulo,
  } = useCentroCustos();

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

  const resumo = resumoModulo();

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
  const [detailDesp, setDetailDesp] = useState<CentroCustoDespesa | null>(null);
  const [editDesp, setEditDesp] = useState<CentroCustoDespesa | null>(null);
  const [deleteDesp, setDeleteDesp] = useState<CentroCustoDespesa | null>(null);
  const [pagarRapidoDesp, setPagarRapidoDesp] = useState<CentroCustoDespesa | null>(null);
  const [pagarRapidoValor, setPagarRapidoValor] = useState('');
  const [pagarRapidoData, setPagarRapidoData] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [pagValor, setPagValor] = useState('');
  const [pagData, setPagData] = useState(() => new Date().toISOString().slice(0, 10));

  const openNovoTipo = () => {
    setTipoEdit(null);
    setTipoNome('');
    setTipoDialogOpen(true);
  };

  const salvarTipo = () => {
    const n = tipoNome.trim();
    if (!n) {
      toast.error('Informe o nome do tipo.');
      return;
    }
    if (tipoEdit) atualizarTipo(tipoEdit.id, n);
    else adicionarTipo(n);
    setTipoDialogOpen(false);
    toast.success(tipoEdit ? 'Tipo atualizado.' : 'Tipo cadastrado.');
  };

  const salvarQuickTipo = () => {
    const n = quickTipoNome.trim();
    if (!n) {
      toast.error('Informe o nome.');
      return;
    }
    const t = adicionarTipo(n);
    setTipoIdSel(t.id);
    setQuickTipoNome('');
    setQuickTipoOpen(false);
    setTipoPopOpen(false);
    toast.success('Tipo cadastrado.');
  };

  const parseValor = (s: string): number => {
    const x = s.replace(/\s/g, '').replace(',', '.');
    const n = parseFloat(x);
    return Number.isFinite(n) ? n : NaN;
  };

  const salvarDespesa = () => {
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
    adicionarDespesa({
      descricao: descricao.trim(),
      tipoId: tipoIdSel,
      rocaId: rocaSel.id,
      rocaNome: rocaSel.nome,
      valor: v,
      data: dataDesp,
      observacoes: observacoes.trim() || undefined,
    });
    setDescricao('');
    setValorStr('');
    setObservacoes('');
    toast.success('Despesa cadastrada (demonstração).');
  };

  const despesaNomeTipo = (tipoId: string) => tipos.find((t) => t.id === tipoId)?.nome ?? '—';

  const salvarEdicaoDespesa = () => {
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
    atualizarDespesa(editDesp.id, {
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
  };

  const abrirEditar = (d: CentroCustoDespesa) => {
    setEditDesp(d);
    setDescricao(d.descricao);
    setValorStr(String(d.valor));
    setDataDesp(d.data.slice(0, 10));
    setObservacoes(d.observacoes ?? '');
    setTipoIdSel(d.tipoId);
    const r = rocasAtivas.find((x) => x.id === d.rocaId);
    setRocaSel(r ?? ({ id: d.rocaId, nome: d.rocaNome, codigo: '', produtorId: 0 } as Roca));
  };

  const abrirDetalhe = (d: CentroCustoDespesa) => {
    setDetailDesp(d);
    setPagValor('');
    setPagData(new Date().toISOString().slice(0, 10));
  };

  const abrirPagarRapido = (d: CentroCustoDespesa) => {
    if (statusDespesa(d) === 'QUITADO') {
      toast.info('Esta despesa já está quitada.');
      return;
    }
    const restante = Math.max(0, Number(d.valor) - totalPagoNaDespesa(d));
    setPagarRapidoDesp(d);
    setPagarRapidoValor(restante > 0 ? String(restante).replace('.', ',') : '');
    setPagarRapidoData(new Date().toISOString().slice(0, 10));
  };

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
              <h1 className="text-2xl font-bold text-foreground">Centro de custos</h1>
              <p className="text-muted-foreground text-sm sm:text-base mt-1">
                Cadastro de tipos de custo e despesas por roça — demonstração apenas no navegador (sem API).
              </p>
            </div>
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-lg h-auto p-1">
            <TabsTrigger value="visao">Visão geral</TabsTrigger>
            <TabsTrigger value="tipos">Tipos de custo</TabsTrigger>
            <TabsTrigger value="despesas">Despesas</TabsTrigger>
          </TabsList>

          <TabsContent value="visao" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Acompanhamento das despesas cadastradas neste módulo (dados salvos no seu navegador).
            </p>
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

            <div className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
                <div>
                  <h2 className="text-base font-semibold text-foreground">Despesas</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Lançamentos recentes — use a aba Despesas para incluir novos ou gerenciar com o formulário completo.
                  </p>
                </div>
                <Button variant="outline" size="sm" className="shrink-0" onClick={() => setTab('despesas')}>
                  Ir para nova despesa
                </Button>
              </div>
              <DespesasTable
                despesas={despesas}
                nomeTipo={despesaNomeTipo}
                onDetalhe={abrirDetalhe}
                onPagar={abrirPagarRapido}
                onEditar={abrirEditar}
                onExcluir={setDeleteDesp}
              />
            </div>
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
                            ? tipos.find((t) => t.id === tipoIdSel)?.nome ?? 'Selecione…'
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
                            {tipos.map((t) => (
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
              <DespesasTable
                despesas={despesas}
                nomeTipo={despesaNomeTipo}
                onDetalhe={abrirDetalhe}
                onPagar={abrirPagarRapido}
                onEditar={abrirEditar}
                onExcluir={setDeleteDesp}
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Tipo create/edit */}
        <Dialog open={tipoDialogOpen} onOpenChange={setTipoDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{tipoEdit ? 'Editar tipo' : 'Novo tipo de custo'}</DialogTitle>
              <DialogDescription>Nome exibido nos lançamentos e relatórios de demonstração.</DialogDescription>
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

        <Dialog
          open={!!pagarRapidoDesp}
          onOpenChange={(o) => {
            if (!o) setPagarRapidoDesp(null);
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Pagar despesa</DialogTitle>
              <DialogDescription>
                Registro parcial ou total. O valor não pode ultrapassar o saldo em aberto.
              </DialogDescription>
            </DialogHeader>
            {pagarRapidoDesp ? (
              <div className="space-y-3 text-sm">
                <div className="rounded-lg border bg-muted/30 px-3 py-2 space-y-1">
                  <p>
                    <span className="text-muted-foreground">Descrição: </span>
                    <span className="font-medium">{pagarRapidoDesp.descricao}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Valor da despesa: </span>
                    <span className="font-medium tabular-nums">
                      {formatCurrency(Number(pagarRapidoDesp.valor))}
                    </span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Em aberto: </span>
                    <span className="font-semibold tabular-nums">
                      {formatCurrency(
                        Math.max(
                          0,
                          Number(pagarRapidoDesp.valor) - totalPagoNaDespesa(pagarRapidoDesp),
                        ),
                      )}
                    </span>
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Valor do pagamento</Label>
                    <Input
                      value={pagarRapidoValor}
                      onChange={(e) => setPagarRapidoValor(e.target.value)}
                      placeholder="0,00"
                      inputMode="decimal"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Data do pagamento</Label>
                    <Input
                      type="date"
                      value={pagarRapidoData}
                      onChange={(e) => setPagarRapidoData(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ) : null}
            <DialogFooter>
              <Button variant="outline" onClick={() => setPagarRapidoDesp(null)}>
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  if (!pagarRapidoDesp) return;
                  const v = parseValor(pagarRapidoValor);
                  if (!Number.isFinite(v) || v <= 0) {
                    toast.error('Informe o valor do pagamento.');
                    return;
                  }
                  const atualizado = registrarPagamento(pagarRapidoDesp.id, v, pagarRapidoData);
                  if (!atualizado) {
                    toast.error('Não foi possível registrar (valor inválido ou já quitada).');
                    return;
                  }
                  if (detailDesp?.id === pagarRapidoDesp.id) setDetailDesp(atualizado);
                  setPagarRapidoDesp(null);
                  toast.success('Pagamento registrado.');
                }}
              >
                Confirmar pagamento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Detalhe + pagamentos */}
        <Dialog
          open={!!detailDesp}
          onOpenChange={(o) => {
            if (!o) setDetailDesp(null);
          }}
        >
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes da despesa</DialogTitle>
              <DialogDescription>Lançamento e pagamentos parciais (demonstração).</DialogDescription>
            </DialogHeader>
            {detailDesp ? (
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-muted-foreground text-xs">Descrição</p>
                    <p className="font-medium">{detailDesp.descricao}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Tipo</p>
                    <p className="font-medium">{despesaNomeTipo(detailDesp.tipoId)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Roça</p>
                    <p className="font-medium">{detailDesp.rocaNome}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Data</p>
                    <p className="font-medium">{detailDesp.data}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Valor</p>
                    <p className="font-semibold">{formatCurrency(Number(detailDesp.valor))}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Status</p>
                    <div className="pt-0.5">{badgeStatus(statusDespesa(detailDesp))}</div>
                  </div>
                </div>
                {detailDesp.observacoes ? (
                  <div>
                    <p className="text-muted-foreground text-xs">Observações</p>
                    <p>{detailDesp.observacoes}</p>
                  </div>
                ) : null}

                <div className="border-t pt-3 space-y-2">
                  <p className="font-medium">Pagamentos</p>
                  {detailDesp.pagamentos.length === 0 ? (
                    <p className="text-muted-foreground text-xs">Nenhum pagamento registrado.</p>
                  ) : (
                    <ul className="space-y-1">
                      {detailDesp.pagamentos.map((p) => (
                        <li
                          key={p.id}
                          className="flex justify-between text-xs border rounded-md px-2 py-1.5 bg-muted/30"
                        >
                          <span>{p.data}</span>
                          <span className="font-medium tabular-nums">{formatCurrency(p.valor)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="flex flex-wrap gap-2 items-end pt-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Valor</Label>
                      <Input
                        className="h-9 w-28"
                        value={pagValor}
                        onChange={(e) => setPagValor(e.target.value)}
                        placeholder="0,00"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Data pagamento</Label>
                      <Input
                        type="date"
                        className="h-9"
                        value={pagData}
                        onChange={(e) => setPagData(e.target.value)}
                      />
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        const v = parseValor(pagValor);
                        if (!detailDesp) return;
                        if (!Number.isFinite(v) || v <= 0) {
                          toast.error('Informe o valor do pagamento.');
                          return;
                        }
                        const atualizado = registrarPagamento(detailDesp.id, v, pagData);
                        if (!atualizado) {
                          toast.error('Não foi possível registrar (valor inválido ou despesa já quitada).');
                          return;
                        }
                        setDetailDesp(atualizado);
                        setPagValor('');
                        toast.success('Pagamento registrado.');
                      }}
                    >
                      Registrar pagamento
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Em aberto:{' '}
                    <span className="font-medium text-foreground">
                      {formatCurrency(
                        Math.max(0, Number(detailDesp.valor) - totalPagoNaDespesa(detailDesp)),
                      )}
                    </span>
                  </p>
                </div>
              </div>
            ) : null}
            <DialogFooter>
              <Button variant="outline" onClick={() => setDetailDesp(null)}>
                Fechar
              </Button>
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
                      {tipoIdSel ? tipos.find((t) => t.id === tipoIdSel)?.nome : 'Selecione'}
                      <ChevronsUpDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]">
                    <Command>
                      <CommandInput placeholder="Pesquisar…" />
                      <CommandList>
                        <CommandEmpty>Nenhum.</CommandEmpty>
                        <CommandGroup>
                          {tipos.map((t) => (
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
                Despesas vinculadas a este tipo serão removidas da demonstração.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (tipoDelete) excluirTipo(tipoDelete.id);
                  setTipoDelete(null);
                  toast.success('Tipo excluído.');
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
              <AlertDialogDescription>Esta ação remove o lançamento da demonstração.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (deleteDesp) excluirDespesa(deleteDesp.id);
                  setDeleteDesp(null);
                  toast.success('Despesa excluída.');
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
