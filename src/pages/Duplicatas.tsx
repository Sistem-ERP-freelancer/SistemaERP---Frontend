import AppLayout from '@/components/layout/AppLayout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '@/lib/utils';
import { Cliente, clientesService } from '@/services/clientes.service';
import {
    Baixa,
    CreateDuplicataDto,
    DarBaixaDto,
    Duplicata,
    duplicatasService,
    FormaRecebimento,
} from '@/services/duplicatas.service';
import { pedidosService } from '@/services/pedidos.service';
import type { ChequeDto } from '@/shared/types/cheque.types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
    AlertCircle,
    DollarSign,
    Eye,
    FileText,
    History,
    Loader2,
    MoreVertical,
    Plus,
    RefreshCw,
    RotateCcw,
    Search,
    Trash2,
    XCircle
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const FORMAS_RECEBIMENTO: { value: FormaRecebimento; label: string }[] = [
  { value: 'DINHEIRO', label: 'Dinheiro' },
  { value: 'PIX', label: 'PIX' },
  { value: 'CARTAO_CREDITO', label: 'Cartão de Crédito' },
  { value: 'CARTAO_DEBITO', label: 'Cartão de Débito' },
  { value: 'BOLETO', label: 'Boleto' },
  { value: 'TRANSFERENCIA', label: 'Transferência' },
  { value: 'CHEQUE', label: 'Cheque' },
];

const STATUS_LABELS: Record<string, string> = {
  ABERTA: 'Aberta',
  PARCIAL: 'Parcial',
  BAIXADA: 'Baixada',
  CANCELADA: 'Cancelada',
};

const STATUS_COLORS: Record<string, string> = {
  ABERTA: 'bg-amber-500/10 text-amber-600',
  PARCIAL: 'bg-blue-500/10 text-blue-600',
  BAIXADA: 'bg-green-500/10 text-green-600',
  CANCELADA: 'bg-slate-500/10 text-slate-600',
};

function calcularDiasEmAtraso(dataVencimento: string, status: string): number | null {
  if (status === 'BAIXADA' || status === 'CANCELADA') return null;
  try {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const vencimento = new Date(dataVencimento);
    vencimento.setHours(0, 0, 0, 0);
    const diffTime = hoje.getTime() - vencimento.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
}

function formatarData(data: string): string {
  if (!data) return 'N/A';
  try {
    return new Date(data).toLocaleDateString('pt-BR');
  } catch {
    return data;
  }
}

const Duplicatas = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroCliente, setFiltroCliente] = useState<string>('todos');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [dialogCriar, setDialogCriar] = useState(false);
  const [dialogDetalhe, setDialogDetalhe] = useState(false);
  const [dialogBaixa, setDialogBaixa] = useState(false);
  const [dialogEstorno, setDialogEstorno] = useState(false);
  const [dialogCancelar, setDialogCancelar] = useState(false);
  const [duplicataSelecionada, setDuplicataSelecionada] = useState<Duplicata | null>(null);
  const [baixaParaEstornar, setBaixaParaEstornar] = useState<Baixa | null>(null);

  const [novaDuplicata, setNovaDuplicata] = useState<CreateDuplicataDto & { parcela_pedido_id?: number }>({
    numero: '',
    cliente_id: 0,
    pedido_id: undefined,
    parcela_pedido_id: undefined,
    valor_original: 0,
    data_emissao: new Date().toISOString().split('T')[0],
    data_vencimento: '',
    descricao: '',
    observacoes: '',
  });

  const chequesEmpty: ChequeDto = {
    titular: '',
    cpf_cnpj_titular: '',
    banco: '',
    agencia: '',
    conta: '',
    numero_cheque: '',
    valor: 0,
    data_vencimento: '',
  };

  const [baixaForm, setBaixaForm] = useState<DarBaixaDto & { cheques?: ChequeDto[] }>({
    valor_pago: 0,
    data_baixa: new Date().toISOString().split('T')[0],
    forma_recebimento: 'PIX',
    juros: 0,
    multa: 0,
    desconto: 0,
    observacao: '',
    cheques: [],
  });

  const [motivoEstorno, setMotivoEstorno] = useState('');
  const [motivoCancelar, setMotivoCancelar] = useState('');

  const { data: clientesData } = useQuery({
    queryKey: ['clientes'],
    queryFn: async () => {
      try {
        const response = await clientesService.listar({ limit: 200, statusCliente: 'ATIVO' });
        return Array.isArray(response) ? response : response.data || [];
      } catch {
        return [];
      }
    },
    retry: false,
  });

  const clientes: Cliente[] = Array.isArray(clientesData)
    ? clientesData
    : clientesData?.data || (clientesData as { clientes?: Cliente[] })?.clientes || [];

  const { data: pedidosData } = useQuery({
    queryKey: ['pedidos', 'cliente', novaDuplicata.cliente_id],
    queryFn: async () => {
      const response = await pedidosService.listar({
        cliente_id: novaDuplicata.cliente_id!,
        tipo: 'VENDA',
        page: 1,
        limit: 200,
      });
      return response.data || [];
    },
    enabled: !!novaDuplicata.cliente_id && dialogCriar,
    retry: false,
  });

  const pedidos = pedidosData || [];

  const { data: parcelasData } = useQuery({
    queryKey: ['pedidos', novaDuplicata.pedido_id, 'parcelas'],
    queryFn: () => pedidosService.listarParcelas(novaDuplicata.pedido_id!),
    enabled: !!novaDuplicata.pedido_id && dialogCriar,
    retry: false,
  });

  const parcelasPedido = parcelasData?.parcelas || [];

  const parcelaSelecionada = novaDuplicata.parcela_pedido_id
    ? parcelasPedido.find((p) => p.id === novaDuplicata.parcela_pedido_id)
    : null;

  const gerarNumeroDuplicata = () => {
    const ano = new Date().getFullYear();
    const sugestao = `DUP-${ano}-001`;
    setNovaDuplicata({ ...novaDuplicata, numero: sugestao });
  };

  const {
    data: duplicatas,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['duplicatas', filtroCliente, filtroStatus],
    queryFn: async () => {
      const params: { cliente_id?: number; status?: 'ABERTA' | 'PARCIAL' | 'BAIXADA' | 'CANCELADA' } = {};
      if (filtroCliente && filtroCliente !== 'todos') params.cliente_id = Number(filtroCliente);
      if (filtroStatus && filtroStatus !== 'todos') params.status = filtroStatus as any;
      return await duplicatasService.listar(params);
    },
    retry: false,
  });

  const { data: historico, isLoading: loadingHistorico } = useQuery({
    queryKey: ['duplicatas', 'historico', duplicataSelecionada?.id],
    queryFn: () => duplicatasService.obterHistorico(duplicataSelecionada!.id),
    enabled: !!duplicataSelecionada?.id && (dialogDetalhe || dialogBaixa),
  });

  const duplicatasList = duplicatas || [];

  const duplicatasFiltradas = useMemo(() => {
    let list = duplicatasList;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(
        (d) =>
          d.numero?.toLowerCase().includes(term) ||
          d.descricao?.toLowerCase().includes(term) ||
          d.id?.toString().includes(term)
      );
    }
    return list;
  }, [duplicatasList, searchTerm]);

  const valorLiquidoBaixa = useMemo(() => {
    const v = (baixaForm.valor_pago || 0) + (baixaForm.juros || 0) + (baixaForm.multa || 0) - (baixaForm.desconto || 0);
    return Math.round(v * 100) / 100;
  }, [baixaForm]);

  const somaChequesBaixa = useMemo(
    () => (baixaForm.cheques || []).reduce((s, c) => s + (c.valor || 0), 0),
    [baixaForm.cheques]
  );

  const createMutation = useMutation({
    mutationFn: (data: CreateDuplicataDto) => duplicatasService.criar(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['duplicatas'] });
      toast.success('Duplicata criada com sucesso!');
      const manterParaOutra = variables.parcela_pedido_id;
      if (!manterParaOutra) {
        setDialogCriar(false);
      }
      setNovaDuplicata((prev) =>
        manterParaOutra
          ? {
              ...prev,
              numero: '',
              valor_original: 0,
              data_emissao: new Date().toISOString().split('T')[0],
              data_vencimento: '',
              descricao: '',
            }
          : {
              numero: '',
              cliente_id: 0,
              pedido_id: undefined,
              parcela_pedido_id: undefined,
              valor_original: 0,
              data_emissao: new Date().toISOString().split('T')[0],
              data_vencimento: '',
              descricao: '',
              observacoes: '',
            }
      );
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error?.message || 'Erro ao criar duplicata');
    },
  });

  const baixaMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: DarBaixaDto }) =>
      duplicatasService.darBaixa(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['duplicatas'] });
      queryClient.invalidateQueries({ queryKey: ['duplicatas', 'historico'] });
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      toast.success('Baixa registrada com sucesso!');
      setDialogBaixa(false);
      setDuplicataSelecionada(null);
      setBaixaForm({
        valor_pago: 0,
        data_baixa: new Date().toISOString().split('T')[0],
        forma_recebimento: 'PIX',
        juros: 0,
        multa: 0,
        desconto: 0,
        observacao: '',
        cheques: [],
      });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error?.message || 'Erro ao registrar baixa');
    },
  });

  const estornoMutation = useMutation({
    mutationFn: ({ baixaId, data }: { baixaId: number; data?: { data_estorno?: string; motivo_estorno?: string } }) =>
      duplicatasService.estornarBaixa(baixaId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['duplicatas'] });
      queryClient.invalidateQueries({ queryKey: ['duplicatas', 'historico'] });
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      toast.success('Baixa estornada com sucesso!');
      setDialogEstorno(false);
      setBaixaParaEstornar(null);
      setMotivoEstorno('');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error?.message || 'Erro ao estornar baixa');
    },
  });

  const cancelarMutation = useMutation({
    mutationFn: ({ id, motivo }: { id: number; motivo?: string }) =>
      duplicatasService.cancelar(id, { motivo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['duplicatas'] });
      toast.success('Duplicata cancelada com sucesso!');
      setDialogCancelar(false);
      setDialogDetalhe(false);
      setDuplicataSelecionada(null);
      setMotivoCancelar('');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error?.message || 'Erro ao cancelar duplicata');
    },
  });

  const handleCriar = () => {
    if (!novaDuplicata.numero?.trim()) {
      toast.error('Informe o número da duplicata');
      return;
    }
    if (!novaDuplicata.cliente_id) {
      toast.error('Selecione o cliente');
      return;
    }
    if (!novaDuplicata.valor_original || novaDuplicata.valor_original <= 0) {
      toast.error('Informe um valor original válido');
      return;
    }
    if (!novaDuplicata.data_emissao || !novaDuplicata.data_vencimento) {
      toast.error('Informe as datas de emissão e vencimento');
      return;
    }
    if (new Date(novaDuplicata.data_vencimento) < new Date(novaDuplicata.data_emissao)) {
      toast.error('Data de vencimento deve ser maior ou igual à data de emissão');
      return;
    }
    const payload: CreateDuplicataDto = {
      numero: novaDuplicata.numero.trim(),
      cliente_id: novaDuplicata.cliente_id,
      valor_original: novaDuplicata.valor_original,
      data_emissao: novaDuplicata.data_emissao,
      data_vencimento: novaDuplicata.data_vencimento,
      descricao: novaDuplicata.descricao || undefined,
      observacoes: novaDuplicata.observacoes || undefined,
    };
    if (novaDuplicata.pedido_id) payload.pedido_id = novaDuplicata.pedido_id;
    if (novaDuplicata.parcela_pedido_id) payload.parcela_pedido_id = novaDuplicata.parcela_pedido_id;
    createMutation.mutate(payload);
  };

  const handleDarBaixa = () => {
    if (!duplicataSelecionada) return;
    if (!baixaForm.valor_pago || baixaForm.valor_pago <= 0) {
      toast.error('Informe o valor pago');
      return;
    }
    if (valorLiquidoBaixa > (duplicataSelecionada.valor_aberto || 0)) {
      toast.error('Valor líquido excede o valor aberto');
      return;
    }
    if (new Date(baixaForm.data_baixa) < new Date(duplicataSelecionada.data_emissao)) {
      toast.error('Data da baixa não pode ser anterior à data de emissão');
      return;
    }
    if (baixaForm.forma_recebimento === 'CHEQUE') {
      const cheques = baixaForm.cheques || [];
      if (cheques.length === 0) {
        toast.error('Adicione pelo menos um cheque');
        return;
      }
      if (Math.abs(somaChequesBaixa - baixaForm.valor_pago) > 0.01) {
        toast.error(
          `Soma dos cheques (${formatCurrency(somaChequesBaixa)}) deve ser igual ao valor pago (${formatCurrency(baixaForm.valor_pago)})`
        );
        return;
      }
      const incompletos = cheques.some(
        (c) =>
          !c.titular?.trim() ||
          !c.cpf_cnpj_titular?.trim() ||
          !c.banco?.trim() ||
          !c.agencia?.trim() ||
          !c.conta?.trim() ||
          !c.numero_cheque?.trim() ||
          !c.valor ||
          !c.data_vencimento
      );
      if (incompletos) {
        toast.error('Preencha todos os campos dos cheques');
        return;
      }
    }
    const payload: DarBaixaDto = {
      valor_pago: baixaForm.valor_pago,
      data_baixa: baixaForm.data_baixa,
      forma_recebimento: baixaForm.forma_recebimento,
      juros: baixaForm.juros,
      multa: baixaForm.multa,
      desconto: baixaForm.desconto,
      observacao: baixaForm.observacao,
      ...(baixaForm.forma_recebimento === 'CHEQUE' && baixaForm.cheques?.length
        ? { cheques: baixaForm.cheques }
        : {}),
    };
    baixaMutation.mutate({ id: duplicataSelecionada.id, data: payload });
  };

  const handleEstorno = () => {
    if (!baixaParaEstornar) return;
    estornoMutation.mutate({
      baixaId: baixaParaEstornar.id,
      data: { motivo_estorno: motivoEstorno || undefined },
    });
  };

  const handleCancelar = () => {
    if (!duplicataSelecionada) return;
    cancelarMutation.mutate({ id: duplicataSelecionada.id, motivo: motivoCancelar || undefined });
  };

  const abrirBaixa = (dup: Duplicata) => {
    setDuplicataSelecionada(dup);
    setBaixaForm({
      valor_pago: dup.valor_aberto || 0,
      data_baixa: new Date().toISOString().split('T')[0],
      forma_recebimento: 'PIX',
      juros: 0,
      multa: 0,
      desconto: 0,
      observacao: '',
      cheques: [],
    });
    setDialogBaixa(true);
  };

  const adicionarChequeBaixa = () => {
    setBaixaForm({
      ...baixaForm,
      cheques: [...(baixaForm.cheques || []), { ...chequesEmpty }],
    });
  };

  const removerChequeBaixa = (idx: number) => {
    setBaixaForm({
      ...baixaForm,
      cheques: (baixaForm.cheques || []).filter((_, i) => i !== idx),
    });
  };

  const atualizarChequeBaixa = (idx: number, campo: keyof ChequeDto, valor: string | number) => {
    const novos = [...(baixaForm.cheques || [])];
    novos[idx] = { ...novos[idx], [campo]: valor };
    setBaixaForm({ ...baixaForm, cheques: novos });
  };

  const abrirDetalhe = (dup: Duplicata) => {
    setDuplicataSelecionada(dup);
    setDialogDetalhe(true);
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Lista de Duplicatas</h1>
            <p className="text-muted-foreground">
              Gerencie duplicatas, baixas e pagamentos
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/duplicatas">Visão por cliente</Link>
            </Button>
            <Button onClick={() => setDialogCriar(true)} variant="gradient">
            <Plus className="w-4 h-4 mr-2" />
            Nova Duplicata
          </Button>
          </div>
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
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:w-[180px]">
              <Label className="text-xs text-muted-foreground block mb-1.5">Status</Label>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="ABERTA">Aberta</SelectItem>
                  <SelectItem value="PARCIAL">Parcial</SelectItem>
                  <SelectItem value="BAIXADA">Baixada</SelectItem>
                  <SelectItem value="CANCELADA">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="relative flex-1 min-w-0">
              <Label className="text-xs text-muted-foreground block mb-1.5">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground shrink-0" aria-hidden />
                <Input
                  placeholder="Buscar por número ou descrição..."
                  className="pl-10 h-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label="Buscar duplicatas"
                />
              </div>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-border overflow-hidden bg-card shadow-sm"
        >
          <Table className="table-fixed">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[140px]">Número</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="w-[110px]">Vencimento</TableHead>
                <TableHead className="w-[130px] text-right">Valor Original</TableHead>
                <TableHead className="w-[130px] text-right">Valor Aberto</TableHead>
                <TableHead className="w-[120px] text-center">Dias em Atraso</TableHead>
                <TableHead className="w-[100px] text-center">Status</TableHead>
                <TableHead className="w-[70px] text-center"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-16 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mt-2">Carregando duplicatas...</p>
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 px-6">
                    <Alert variant="destructive" className="border-destructive/50">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <span>Não foi possível carregar as duplicatas. Verifique sua conexão ou se a API está disponível.</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => refetch()}
                          className="border-destructive/50 text-destructive hover:bg-destructive/10 shrink-0"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Tentar novamente
                        </Button>
                      </AlertDescription>
                    </Alert>
                  </TableCell>
                </TableRow>
              ) : duplicatasFiltradas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="rounded-full bg-muted/50 p-4">
                        <FileText className="w-12 h-12 text-muted-foreground/70" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Nenhuma duplicata encontrada</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {searchTerm || filtroCliente !== 'todos' || filtroStatus !== 'todos'
                            ? 'Tente ajustar os filtros ou a busca.'
                            : 'Comece criando sua primeira duplicata.'}
                        </p>
                      </div>
                      {!searchTerm && filtroCliente === 'todos' && filtroStatus === 'todos' && (
                        <Button onClick={() => setDialogCriar(true)} variant="outline">
                          <Plus className="w-4 h-4 mr-2" />
                          Nova duplicata
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                duplicatasFiltradas.map((dup) => {
                  const cliente = clientes.find((c) => c.id === dup.cliente_id);
                  const diasAtraso = calcularDiasEmAtraso(dup.data_vencimento, dup.status);
                  return (
                    <TableRow key={dup.id}>
                      <TableCell className="font-medium">{dup.numero}</TableCell>
                      <TableCell>{cliente?.nome || dup.cliente_id}</TableCell>
                      <TableCell>{formatarData(dup.data_vencimento)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(dup.valor_original)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(dup.valor_aberto)}</TableCell>
                      <TableCell className="text-center">
                        {diasAtraso !== null && diasAtraso > 0 ? (
                          <Badge variant="destructive">{diasAtraso} dias</Badge>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={STATUS_COLORS[dup.status] || ''}>
                          {STATUS_LABELS[dup.status] || dup.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => abrirDetalhe(dup)}>
                              <Eye className="w-4 h-4 mr-2" />
                              Visualizar
                            </DropdownMenuItem>
                            {dup.status !== 'BAIXADA' && dup.status !== 'CANCELADA' && (
                              <DropdownMenuItem onClick={() => abrirBaixa(dup)}>
                                <DollarSign className="w-4 h-4 mr-2" />
                                Dar baixa
                              </DropdownMenuItem>
                            )}
                            {dup.status !== 'BAIXADA' && dup.status !== 'CANCELADA' && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setDuplicataSelecionada(dup);
                                  setDialogCancelar(true);
                                }}
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Cancelar
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </motion.div>

        {/* Dialog Criar Duplicata */}
        <Dialog
          open={dialogCriar}
          onOpenChange={(open) => {
            setDialogCriar(open);
            if (!open) {
              setNovaDuplicata({
                numero: '',
                cliente_id: 0,
                pedido_id: undefined,
                parcela_pedido_id: undefined,
                valor_original: 0,
                data_emissao: new Date().toISOString().split('T')[0],
                data_vencimento: '',
                descricao: '',
                observacoes: '',
              });
            }
          }}
        >
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nova Duplicata</DialogTitle>
              <DialogDescription>
                Preencha os campos obrigatórios para criar uma duplicata.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Cliente *</Label>
                <Select
                  value={novaDuplicata.cliente_id ? novaDuplicata.cliente_id.toString() : ''}
                  onValueChange={(v) =>
                    setNovaDuplicata({
                      ...novaDuplicata,
                      cliente_id: Number(v),
                      pedido_id: undefined,
                      parcela_pedido_id: undefined,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.nome_fantasia || c.nome_razao || c.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Pedido</Label>
                <Select
                  value={novaDuplicata.pedido_id ? novaDuplicata.pedido_id.toString() : 'none'}
                  onValueChange={(v) =>
                    setNovaDuplicata({
                      ...novaDuplicata,
                      pedido_id: v && v !== 'none' ? Number(v) : undefined,
                      parcela_pedido_id: undefined,
                    })
                  }
                  disabled={!novaDuplicata.cliente_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={novaDuplicata.cliente_id ? 'Selecione o pedido' : 'Selecione o cliente primeiro'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Avulsa</SelectItem>
                    {pedidos.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.numero_pedido || `PED-${p.id}`} – {formatCurrency(p.valor_total ?? 0)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {parcelasPedido.length > 0 && (
                <div>
                  <Label>Parcela (opcional)</Label>
                  <p className="text-xs text-muted-foreground mb-1">
                    Vincule a uma parcela do pedido para que as baixas nas duplicatas quitam a parcela automaticamente.
                  </p>
                  <Select
                    value={novaDuplicata.parcela_pedido_id ? novaDuplicata.parcela_pedido_id.toString() : 'none'}
                    onValueChange={(v) => {
                      const parcelaId = v && v !== 'none' ? Number(v) : undefined;
                      const parcela = parcelaId
                        ? parcelasPedido.find((p) => p.id === parcelaId)
                        : null;
                      setNovaDuplicata({
                        ...novaDuplicata,
                        parcela_pedido_id: parcelaId,
                        data_vencimento: parcela?.data_vencimento
                          ? parcela.data_vencimento.split('T')[0]
                          : novaDuplicata.data_vencimento,
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="— Avulsa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— Avulsa</SelectItem>
                      {parcelasPedido.map((p) => (
                        <SelectItem key={p.id} value={p.id.toString()}>
                          Parcela {p.numero_parcela}/{p.total_parcelas} – {formatCurrency(p.valor)} – Vence {p.data_vencimento ? new Date(p.data_vencimento).toLocaleDateString('pt-BR') : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {parcelaSelecionada && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Valor da parcela: <strong>{formatCurrency(parcelaSelecionada.valor)}</strong>
                    </p>
                  )}
                </div>
              )}
              <div>
                <div className="flex items-center justify-between gap-2">
                  <Label>Número *</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={gerarNumeroDuplicata}
                  >
                    Gerar sugestão (DUP-YYYY-NNN)
                  </Button>
                </div>
                <Input
                  placeholder="Ex: DUP-2026-001"
                  value={novaDuplicata.numero}
                  onChange={(e) => setNovaDuplicata({ ...novaDuplicata, numero: e.target.value })}
                />
              </div>
              <div>
                <Label>Valor Original *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={novaDuplicata.valor_original || ''}
                  onChange={(e) =>
                    setNovaDuplicata({ ...novaDuplicata, valor_original: Number(e.target.value) || 0 })
                  }
                />
                {parcelaSelecionada &&
                  novaDuplicata.valor_original > 0 &&
                  novaDuplicata.valor_original > parcelaSelecionada.valor && (
                    <p className="text-xs text-amber-600 mt-1">
                      Atenção: o valor excede o valor da parcela ({formatCurrency(parcelaSelecionada.valor)}).
                    </p>
                  )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Data Emissão *</Label>
                  <Input
                    type="date"
                    value={novaDuplicata.data_emissao}
                    onChange={(e) => setNovaDuplicata({ ...novaDuplicata, data_emissao: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Data Vencimento *</Label>
                  <Input
                    type="date"
                    value={novaDuplicata.data_vencimento}
                    onChange={(e) => setNovaDuplicata({ ...novaDuplicata, data_vencimento: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Descrição</Label>
                <Input
                  placeholder="Ex: Venda de produtos"
                  value={novaDuplicata.descricao || ''}
                  onChange={(e) => setNovaDuplicata({ ...novaDuplicata, descricao: e.target.value })}
                />
              </div>
              <div>
                <Label>Observações</Label>
                <Textarea
                  placeholder="Opcional"
                  value={novaDuplicata.observacoes || ''}
                  onChange={(e) => setNovaDuplicata({ ...novaDuplicata, observacoes: e.target.value })}
                />
              </div>
            </div>
            {novaDuplicata.parcela_pedido_id && (
              <p className="text-xs text-muted-foreground">
                Você pode criar várias duplicatas para a mesma parcela (ex.: 4 duplicatas de R$ 50 para parcela de R$ 200). Após criar uma, o formulário permanecerá aberto para adicionar outra.
              </p>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDialogCriar(false);
                  setNovaDuplicata({
                    numero: '',
                    cliente_id: 0,
                    pedido_id: undefined,
                    parcela_pedido_id: undefined,
                    valor_original: 0,
                    data_emissao: new Date().toISOString().split('T')[0],
                    data_vencimento: '',
                    descricao: '',
                    observacoes: '',
                  });
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleCriar} disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Detalhe */}
        <Dialog open={dialogDetalhe} onOpenChange={setDialogDetalhe}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes da Duplicata</DialogTitle>
            </DialogHeader>
            {duplicataSelecionada && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Número</Label>
                    <p className="font-medium">{duplicataSelecionada.numero}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Cliente</Label>
                    <p className="font-medium">
                      {clientes.find((c) => c.id === duplicataSelecionada.cliente_id)?.nome || duplicataSelecionada.cliente_id}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Valor Original</Label>
                    <p className="font-medium">{formatCurrency(duplicataSelecionada.valor_original)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Valor Aberto</Label>
                    <p className="font-medium">{formatCurrency(duplicataSelecionada.valor_aberto)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <Badge className={STATUS_COLORS[duplicataSelecionada.status]}>
                      {STATUS_LABELS[duplicataSelecionada.status]}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Vencimento</Label>
                    <p className="font-medium">{formatarData(duplicataSelecionada.data_vencimento)}</p>
                  </div>
                </div>
                {duplicataSelecionada.descricao && (
                  <div>
                    <Label className="text-muted-foreground">Descrição</Label>
                    <p className="text-sm">{duplicataSelecionada.descricao}</p>
                  </div>
                )}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-muted-foreground flex items-center gap-2">
                      <History className="w-4 h-4" />
                      Histórico de Baixas
                    </Label>
                    {duplicataSelecionada.status !== 'BAIXADA' && duplicataSelecionada.status !== 'CANCELADA' && (
                      <Button size="sm" onClick={() => abrirBaixa(duplicataSelecionada)}>
                        <DollarSign className="w-4 h-4 mr-1" />
                        Dar baixa
                      </Button>
                    )}
                  </div>
                  {loadingHistorico ? (
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  ) : (historico || []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma baixa registrada</p>
                  ) : (
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Valor Pago</TableHead>
                            <TableHead>Valor Líquido</TableHead>
                            <TableHead>Forma</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {historico?.map((b) => (
                            <React.Fragment key={b.id}>
                              <TableRow>
                                <TableCell>{formatarData(b.data_baixa)}</TableCell>
                                <TableCell>{formatCurrency(b.valor_pago)}</TableCell>
                                <TableCell>{formatCurrency(b.valor_liquido)}</TableCell>
                                <TableCell>{FORMAS_RECEBIMENTO.find((f) => f.value === b.forma_recebimento)?.label || b.forma_recebimento}</TableCell>
                                <TableCell>
                                  {b.estornado ? (
                                    <Badge variant="secondary">Estornado</Badge>
                                  ) : (
                                    <Badge className="bg-green-500/10 text-green-600">Pago</Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {!b.estornado && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setBaixaParaEstornar(b);
                                        setMotivoEstorno('');
                                        setDialogEstorno(true);
                                      }}
                                    >
                                      <RotateCcw className="w-4 h-4" />
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                              {b.forma_recebimento === 'CHEQUE' && b.cheques && b.cheques.length > 0 && (
                                <TableRow>
                                  <TableCell colSpan={6} className="bg-muted/30 py-2">
                                    <div className="text-sm">
                                      <p className="font-medium mb-2">Cheques:</p>
                                      <ul className="space-y-1">
                                        {b.cheques.map((ch) => (
                                          <li key={ch.id || ch.numero_cheque} className="flex gap-4 flex-wrap">
                                            <span><strong>{ch.numero_cheque}</strong> — {formatCurrency(ch.valor)}</span>
                                            <span>{ch.titular}</span>
                                            <span>{ch.banco}</span>
                                            <span>Venc: {formatarData(ch.data_vencimento)}</span>
                                            {ch.status && <Badge variant="outline">{ch.status}</Badge>}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                            </React.Fragment>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
                {duplicataSelecionada.status !== 'BAIXADA' && duplicataSelecionada.status !== 'CANCELADA' && (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setDialogCancelar(true);
                    }}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancelar duplicata
                  </Button>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog Dar Baixa */}
        <Dialog open={dialogBaixa} onOpenChange={setDialogBaixa}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Dar Baixa</DialogTitle>
              <DialogDescription>
                Registre o pagamento recebido. Valor aberto:{' '}
                {duplicataSelecionada && formatCurrency(duplicataSelecionada.valor_aberto)}
              </DialogDescription>
            </DialogHeader>
            {duplicataSelecionada && (
              <div className="space-y-4 py-4">
                <div>
                  <Label>Valor Pago *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={baixaForm.valor_pago || ''}
                    onChange={(e) =>
                      setBaixaForm({ ...baixaForm, valor_pago: Number(e.target.value) || 0 })
                    }
                  />
                </div>
                <div>
                  <Label>Data da Baixa *</Label>
                  <Input
                    type="date"
                    value={baixaForm.data_baixa}
                    onChange={(e) => setBaixaForm({ ...baixaForm, data_baixa: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Forma de Recebimento *</Label>
                  <Select
                    value={baixaForm.forma_recebimento}
                    onValueChange={(v) =>
                      setBaixaForm({
                        ...baixaForm,
                        forma_recebimento: v as FormaRecebimento,
                        cheques: v === 'CHEQUE' ? baixaForm.cheques : [],
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FORMAS_RECEBIMENTO.map((f) => (
                        <SelectItem key={f.value} value={f.value}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Juros</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={baixaForm.juros || ''}
                      onChange={(e) => setBaixaForm({ ...baixaForm, juros: Number(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label>Multa</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={baixaForm.multa || ''}
                      onChange={(e) => setBaixaForm({ ...baixaForm, multa: Number(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label>Desconto</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={baixaForm.desconto || ''}
                      onChange={(e) => setBaixaForm({ ...baixaForm, desconto: Number(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <Label className="text-muted-foreground">Valor Líquido</Label>
                  <p className="text-lg font-semibold">{formatCurrency(valorLiquidoBaixa)}</p>
                  <p className="text-xs text-muted-foreground">
                    valor_pago + juros + multa - desconto
                  </p>
                </div>
                {baixaForm.forma_recebimento === 'CHEQUE' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Cheques</Label>
                      <Button type="button" variant="outline" size="sm" onClick={adicionarChequeBaixa}>
                        <Plus className="w-4 h-4 mr-1" />
                        Adicionar
                      </Button>
                    </div>
                    {(baixaForm.cheques || []).length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Adicione pelo menos um cheque. A soma dos valores deve ser igual ao valor pago.
                      </p>
                    ) : (
                      <div className="space-y-4 border rounded-lg p-3 max-h-60 overflow-y-auto">
                        {(baixaForm.cheques || []).map((c, idx) => (
                          <div key={idx} className="space-y-2 border-b pb-3 last:border-0">
                            <div className="flex justify-between">
                              <span className="text-sm font-medium">Cheque {idx + 1}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removerChequeBaixa(idx)}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-xs">Titular</Label>
                                <Input
                                  value={c.titular}
                                  onChange={(e) => atualizarChequeBaixa(idx, 'titular', e.target.value)}
                                  placeholder="Nome do titular"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">CPF/CNPJ</Label>
                                <Input
                                  value={c.cpf_cnpj_titular}
                                  onChange={(e) =>
                                    atualizarChequeBaixa(idx, 'cpf_cnpj_titular', e.target.value)
                                  }
                                  placeholder="000.000.000-00"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Banco</Label>
                                <Input
                                  value={c.banco}
                                  onChange={(e) => atualizarChequeBaixa(idx, 'banco', e.target.value)}
                                  placeholder="Nome do banco"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Agência</Label>
                                <Input
                                  value={c.agencia}
                                  onChange={(e) => atualizarChequeBaixa(idx, 'agencia', e.target.value)}
                                  placeholder="1234-5"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Conta</Label>
                                <Input
                                  value={c.conta}
                                  onChange={(e) => atualizarChequeBaixa(idx, 'conta', e.target.value)}
                                  placeholder="12345-6"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Nº Cheque</Label>
                                <Input
                                  value={c.numero_cheque}
                                  onChange={(e) =>
                                    atualizarChequeBaixa(idx, 'numero_cheque', e.target.value)
                                  }
                                  placeholder="000123456"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Valor</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={c.valor || ''}
                                  onChange={(e) =>
                                    atualizarChequeBaixa(idx, 'valor', Number(e.target.value) || 0)
                                  }
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Vencimento</Label>
                                <Input
                                  type="date"
                                  value={c.data_vencimento}
                                  onChange={(e) =>
                                    atualizarChequeBaixa(idx, 'data_vencimento', e.target.value)
                                  }
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                        <p className="text-xs text-muted-foreground">
                          Soma: {formatCurrency(somaChequesBaixa)}
                          {baixaForm.valor_pago > 0 && (
                            <span
                              className={
                                Math.abs(somaChequesBaixa - baixaForm.valor_pago) < 0.01
                                  ? ' text-green-600'
                                  : ' text-destructive'
                              }
                            >
                              {' '}
                              ({Math.abs(somaChequesBaixa - baixaForm.valor_pago) < 0.01
                                ? 'OK'
                                : 'Deve ser ' + formatCurrency(baixaForm.valor_pago)})
                            </span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                )}
                <div>
                  <Label>Observação</Label>
                  <Textarea
                    value={baixaForm.observacao || ''}
                    onChange={(e) => setBaixaForm({ ...baixaForm, observacao: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogBaixa(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleDarBaixa}
                disabled={
                  baixaMutation.isPending ||
                  (baixaForm.forma_recebimento === 'CHEQUE' &&
                    ((baixaForm.cheques?.length || 0) === 0 ||
                      Math.abs(somaChequesBaixa - (baixaForm.valor_pago || 0)) > 0.01))
                }
              >
                {baixaMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Registrar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Estornar Baixa */}
        <Dialog open={dialogEstorno} onOpenChange={setDialogEstorno}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Estornar Baixa</DialogTitle>
              <DialogDescription>
                O valor da baixa será devolvido ao saldo da duplicata.
              </DialogDescription>
            </DialogHeader>
            {baixaParaEstornar && (
              <div className="space-y-4 py-4">
                <p className="text-sm">
                  Baixa de {formatCurrency(baixaParaEstornar.valor_pago)} em{' '}
                  {formatarData(baixaParaEstornar.data_baixa)}
                </p>
                <div>
                  <Label>Motivo (opcional)</Label>
                  <Textarea
                    value={motivoEstorno}
                    onChange={(e) => setMotivoEstorno(e.target.value)}
                    placeholder="Ex: Erro de lançamento"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogEstorno(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleEstorno} disabled={estornoMutation.isPending}>
                {estornoMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Estornar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Cancelar Duplicata */}
        <Dialog open={dialogCancelar} onOpenChange={setDialogCancelar}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancelar Duplicata</DialogTitle>
              <DialogDescription>
                A duplicata será cancelada. Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Motivo (opcional)</Label>
                <Textarea
                  value={motivoCancelar}
                  onChange={(e) => setMotivoCancelar(e.target.value)}
                  placeholder="Ex: Duplicata gerada incorretamente"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogCancelar(false)}>
                Voltar
              </Button>
              <Button variant="destructive" onClick={handleCancelar} disabled={cancelarMutation.isPending}>
                {cancelarMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cancelar duplicata'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Duplicatas;
