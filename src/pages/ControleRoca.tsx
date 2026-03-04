import { CampoCnpjComConsulta } from '@/components/CampoCnpjComConsulta';
import AppLayout from '@/components/layout/AppLayout';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency, formatDate } from '@/lib/utils';
import { cleanDocument, formatCPF, formatTelefone } from '@/lib/validators';
import { ConsultaCnpjResponse } from '@/services/cnpj.service';
import { controleRocaService } from '@/services/controle-roca.service';
import type {
    CreateLancamentoProducaoRocaDto,
    CreateMeeiroRocaDto,
    CreateProdutoRocaDto,
    CreateProdutorRocaDto,
    CreateRocaDto,
    MeeiroRoca,
    ProdutoRoca,
    ProdutorRoca,
    RelatorioMeeiroResponse,
    RocaDetalhes,
    UpdateMeeiroRocaDto,
    UpdateProdutorRocaDto,
    UpdateRocaDto,
} from '@/types/roca';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Building2,
    Calendar,
    Check,
    ClipboardList,
    Eye,
    FileText,
    Hash,
    Loader2,
    MapPin,
    MoreHorizontal,
    Package,
    Pencil,
    Phone,
    Plus,
    Sprout,
    Trash2,
    User,
    UserX,
    Users,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const UNIDADES = ['KG', 'SC', 'ARROBA', 'UN', 'LT', 'CX'] as const;

export default function ControleRoca() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('produtores');

  // Produtores
  const { data: produtores = [], isLoading: loadingProdutores } = useQuery({
    queryKey: ['controle-roca', 'produtores'],
    queryFn: () => controleRocaService.listarProdutores(),
  });
  const [openProdutor, setOpenProdutor] = useState(false);
  const [tipoPessoaProdutor, setTipoPessoaProdutor] = useState<
    'PESSOA_FISICA' | 'PESSOA_JURIDICA'
  >('PESSOA_FISICA');
  const [formProdutor, setFormProdutor] = useState<CreateProdutorRocaDto>({
    codigo: '',
    nome_razao: '',
    cpf_cnpj: '',
    telefone: '',
    whatsapp: '',
    endereco: '',
  });
  const createProdutor = useMutation({
    mutationFn: (data: CreateProdutorRocaDto) =>
      controleRocaService.criarProdutor(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['controle-roca'] });
      toast.success('Produtor cadastrado com sucesso');
      setOpenProdutor(false);
      setTipoPessoaProdutor('PESSOA_FISICA');
      setFormProdutor({
        codigo: '',
        nome_razao: '',
        cpf_cnpj: '',
        telefone: '',
        whatsapp: '',
        endereco: '',
      });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || 'Erro ao cadastrar produtor');
    },
  });

  const [detailProdutor, setDetailProdutor] = useState<ProdutorRoca | null>(null);
  const [openDetailProdutor, setOpenDetailProdutor] = useState(false);
  const [editProdutor, setEditProdutor] = useState<ProdutorRoca | null>(null);
  const [openEditProdutor, setOpenEditProdutor] = useState(false);
  const [tipoPessoaEdit, setTipoPessoaEdit] = useState<
    'PESSOA_FISICA' | 'PESSOA_JURIDICA'
  >('PESSOA_FISICA');
  const [formEditProdutor, setFormEditProdutor] = useState<
    UpdateProdutorRocaDto & { nome_razao: string }
  >({
    codigo: '',
    nome_razao: '',
    cpf_cnpj: '',
    telefone: '',
    whatsapp: '',
    endereco: '',
  });

  const updateProdutor = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateProdutorRocaDto }) =>
      controleRocaService.atualizarProdutor(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['controle-roca'] });
      toast.success('Produtor atualizado com sucesso');
      setOpenEditProdutor(false);
      setEditProdutor(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || 'Erro ao atualizar produtor');
    },
  });

  // Roças
  const [produtorIdRocas, setProdutorIdRocas] = useState<number | ''>('');
  const { data: rocas = [], isLoading: loadingRocas } = useQuery({
    queryKey: ['controle-roca', 'rocas', produtorIdRocas],
    queryFn: () =>
      controleRocaService.listarRocas(
        produtorIdRocas === '' ? undefined : Number(produtorIdRocas)
      ),
  });
  const [openRoca, setOpenRoca] = useState(false);
  const [formRoca, setFormRoca] = useState<CreateRocaDto>({
    codigo: '',
    nome: '',
    localizacao: '',
    produtorId: 0,
  });
  const createRoca = useMutation({
    mutationFn: (data: CreateRocaDto) => controleRocaService.criarRoca(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['controle-roca'] });
      toast.success('Roça cadastrada com sucesso');
      setOpenRoca(false);
      setFormRoca({ codigo: '', nome: '', localizacao: '', produtorId: 0 });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || 'Erro ao cadastrar roça');
    },
  });

  const [detailRocaId, setDetailRocaId] = useState<number | null>(null);
  const [openDetailRoca, setOpenDetailRoca] = useState(false);
  const { data: detailRoca, isLoading: loadingDetailRoca } = useQuery({
    queryKey: ['controle-roca', 'roca', detailRocaId],
    queryFn: () => controleRocaService.obterRoca(detailRocaId!),
    enabled: openDetailRoca && detailRocaId != null,
  });

  const [editRoca, setEditRoca] = useState<RocaDetalhes | null>(null);
  const [openEditRoca, setOpenEditRoca] = useState(false);
  const [formEditRoca, setFormEditRoca] = useState<
    UpdateRocaDto & { nome: string }
  >({
    codigo: '',
    nome: '',
    localizacao: '',
    produtorId: 0,
  });

  const updateRoca = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateRocaDto }) =>
      controleRocaService.atualizarRoca(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['controle-roca'] });
      toast.success('Roça atualizada com sucesso');
      setOpenEditRoca(false);
      setEditRoca(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || 'Erro ao atualizar roça');
    },
  });

  const deleteRoca = useMutation({
    mutationFn: (id: number) => controleRocaService.excluirRoca(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['controle-roca'] });
      toast.success('Roça excluída com sucesso');
      setOpenDetailRoca(false);
      setDetailRocaId(null);
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Não foi possível excluir a roça. Verifique se não há lançamentos vinculados.';
      toast.error(msg);
    },
  });

  // Meeiros
  const [produtorIdMeeiros, setProdutorIdMeeiros] = useState<number | ''>('');
  const { data: meeiros = [], isLoading: loadingMeeiros } = useQuery({
    queryKey: ['controle-roca', 'meeiros', produtorIdMeeiros],
    queryFn: () =>
      controleRocaService.listarMeeiros(
        produtorIdMeeiros === '' ? undefined : Number(produtorIdMeeiros)
      ),
  });
  const [openMeeiro, setOpenMeeiro] = useState(false);
  const [formMeeiro, setFormMeeiro] = useState<CreateMeeiroRocaDto>({
    codigo: '',
    nome: '',
    cpf: '',
    telefone: '',
    endereco: '',
    porcentagem_padrao: 40,
    produtorId: 0,
  });
  const createMeeiro = useMutation({
    mutationFn: (data: CreateMeeiroRocaDto) =>
      controleRocaService.criarMeeiro(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['controle-roca'] });
      toast.success('Meeiro cadastrado com sucesso');
      setOpenMeeiro(false);
      setFormMeeiro({
        codigo: '',
        nome: '',
        cpf: '',
        telefone: '',
        endereco: '',
        porcentagem_padrao: 40,
        produtorId: 0,
      });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || 'Erro ao cadastrar meeiro');
    },
  });
  const [detailMeeiro, setDetailMeeiro] = useState<MeeiroRoca | null>(null);
  const [openDetailMeeiro, setOpenDetailMeeiro] = useState(false);
  const [editMeeiro, setEditMeeiro] = useState<MeeiroRoca | null>(null);
  const [openEditMeeiro, setOpenEditMeeiro] = useState(false);
  const [formEditMeeiro, setFormEditMeeiro] = useState<
    UpdateMeeiroRocaDto & { nome: string; produtorId: number; porcentagem_padrao: number }
  >({
    codigo: '',
    nome: '',
    cpf: '',
    telefone: '',
    endereco: '',
    porcentagem_padrao: 40,
    produtorId: 0,
  });
  const updateMeeiro = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateMeeiroRocaDto }) =>
      controleRocaService.atualizarMeeiro(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['controle-roca'] });
      toast.success('Meeiro atualizado com sucesso');
      setOpenEditMeeiro(false);
      setEditMeeiro(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || 'Erro ao atualizar meeiro');
    },
  });
  const deleteMeeiro = useMutation({
    mutationFn: (id: number) => controleRocaService.excluirMeeiro(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['controle-roca'] });
      toast.success('Meeiro excluído com sucesso');
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          'Erro ao excluir meeiro. Verifique se não há lançamentos vinculados.',
      );
    },
  });

  // Produtos da roça
  const [produtorIdProdutos, setProdutorIdProdutos] = useState<number | ''>('');
  const { data: produtosRoca = [], isLoading: loadingProdutos } = useQuery({
    queryKey: ['controle-roca', 'produtos', produtorIdProdutos],
    queryFn: () =>
      controleRocaService.listarProdutosRoca(
        produtorIdProdutos === '' ? undefined : Number(produtorIdProdutos)
      ),
  });
  const [openProduto, setOpenProduto] = useState(false);
  const [formProduto, setFormProduto] = useState<CreateProdutoRocaDto>({
    codigo: '',
    nome: '',
    unidade_medida: 'KG',
    produtorId: 0,
  });
  const createProduto = useMutation({
    mutationFn: (data: CreateProdutoRocaDto) =>
      controleRocaService.criarProdutoRoca(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['controle-roca'] });
      toast.success('Produto cadastrado com sucesso');
      setOpenProduto(false);
      setFormProduto({
        codigo: '',
        nome: '',
        unidade_medida: 'KG',
        produtorId: 0,
      });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || 'Erro ao cadastrar produto');
    },
  });

  // Lançamentos
  const [produtorIdLanc, setProdutorIdLanc] = useState<number | ''>('');
  const { data: rocasParaLancamento = [] } = useQuery({
    queryKey: ['controle-roca', 'rocas', produtorIdLanc],
    queryFn: () =>
      controleRocaService.listarRocas(
        produtorIdLanc === '' ? undefined : Number(produtorIdLanc)
      ),
  });
  const { data: lancamentos = [], isLoading: loadingLancamentos } = useQuery({
    queryKey: ['controle-roca', 'lancamentos', produtorIdLanc],
    queryFn: () =>
      controleRocaService.listarLancamentos(
        produtorIdLanc === '' ? undefined : { produtorId: Number(produtorIdLanc) }
      ),
  });
  const [openLancamento, setOpenLancamento] = useState(false);
  const [lancData, setLancData] = useState('');
  const [lancRocaId, setLancRocaId] = useState<number | ''>('');
  const [lancMeeiros, setLancMeeiros] = useState<
    { meeiroId: number; porcentagem?: number; nome?: string }[]
  >([]);
  const [lancMeeiroCodigo, setLancMeeiroCodigo] = useState('');
  const [lancProdutos, setLancProdutos] = useState<
    { produtoId: number; quantidade: number; preco_unitario: number; nome?: string }[]
  >([]);
  const { data: produtosParaLancamento = [] } = useQuery({
    queryKey: ['controle-roca', 'produtos', produtorIdLanc],
    queryFn: () =>
      controleRocaService.listarProdutosRoca(
        produtorIdLanc === '' ? undefined : Number(produtorIdLanc)
      ),
  });
  const { data: meeirosParaLancamento = [] } = useQuery({
    queryKey: ['controle-roca', 'meeiros', produtorIdLanc],
    queryFn: () =>
      controleRocaService.listarMeeiros(
        produtorIdLanc === '' ? undefined : Number(produtorIdLanc)
      ),
  });
  const createLancamento = useMutation({
    mutationFn: (data: CreateLancamentoProducaoRocaDto) =>
      controleRocaService.criarLancamento(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['controle-roca'] });
      toast.success('Lançamento registrado com sucesso');
      setOpenLancamento(false);
      setLancData('');
      setLancRocaId('');
      setLancMeeiros([]);
      setLancProdutos([]);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || 'Erro ao registrar lançamento');
    },
  });

  const handleAddMeeiroByCodigo = () => {
    if (!lancMeeiroCodigo.trim()) return;
    controleRocaService
      .buscarMeeiroPorCodigo(lancMeeiroCodigo.trim())
      .then((m) => {
        if (lancMeeiros.some((x) => x.meeiroId === m.id)) {
          toast.error('Meeiro já adicionado');
          return;
        }
        setLancMeeiros((prev) => [
          ...prev,
          {
            meeiroId: m.id,
            porcentagem: m.porcentagem_padrao,
            nome: m.nome,
          },
        ]);
        setLancMeeiroCodigo('');
      })
      .catch(() => toast.error('Meeiro não encontrado'));
  };

  const handleAddProdutoLanc = (produtoId: number, qtd: number, preco: number) => {
    const p = produtosParaLancamento.find((x) => x.id === produtoId);
    if (!p) return;
    setLancProdutos((prev) => [
      ...prev,
      {
        produtoId,
        quantidade: qtd,
        preco_unitario: preco,
        nome: p.nome,
      },
    ]);
  };

  const totalGeralLanc =
    lancProdutos.reduce(
      (s, i) => s + i.quantidade * i.preco_unitario,
      0
    );
  const handleSubmitLancamento = () => {
    if (!lancData || !lancRocaId || lancMeeiros.length === 0 || lancProdutos.length === 0) {
      toast.error('Preencha data, roça, ao menos um meeiro e ao menos um produto');
      return;
    }
    const somaPct = lancMeeiros.reduce((s, m) => s + (m.porcentagem ?? 0), 0);
    if (somaPct > 100) {
      toast.error('Soma das porcentagens dos meeiros não pode ser maior que 100%');
      return;
    }
    createLancamento.mutate({
      data: lancData,
      rocaId: Number(lancRocaId),
      meeiros: lancMeeiros.map((m) => ({
        meeiroId: m.meeiroId,
        porcentagem: m.porcentagem,
      })),
      produtos: lancProdutos.map((p) => ({
        produtoId: p.produtoId,
        quantidade: p.quantidade,
        preco_unitario: p.preco_unitario,
      })),
    });
  };

  // Relatório por meeiro
  const [relMeeiroId, setRelMeeiroId] = useState<number | ''>('');
  const [relDataInicial, setRelDataInicial] = useState('');
  const [relDataFinal, setRelDataFinal] = useState('');
  const [relResult, setRelResult] = useState<RelatorioMeeiroResponse | null>(null);
  const [relLoading, setRelLoading] = useState(false);
  const { data: meeirosParaRelatorio = [] } = useQuery({
    queryKey: ['controle-roca', 'meeiros'],
    queryFn: () => controleRocaService.listarMeeiros(),
  });
  const runRelatorio = () => {
    if (relMeeiroId === '') {
      toast.error('Selecione um meeiro');
      return;
    }
    setRelLoading(true);
    controleRocaService
      .relatorioPorMeeiro({
        meeiroId: Number(relMeeiroId),
        dataInicial: relDataInicial || undefined,
        dataFinal: relDataFinal || undefined,
      })
      .then(setRelResult)
      .catch((err) => {
        toast.error(err?.response?.data?.message || err?.message || 'Erro ao gerar relatório');
      })
      .finally(() => setRelLoading(false));
  };

  return (
    <AppLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Sprout className="w-7 h-7" />
            Controle de Roça
          </h1>
          <p className="text-muted-foreground">
            Cadastros de produtor, roça, meeiro, produtos e lançamento da produção
          </p>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="space-y-4">
          <TabsList className="flex flex-wrap h-auto gap-1">
            <TabsTrigger value="produtores" className="gap-1">
              <User className="w-4 h-4" />
              Produtores
            </TabsTrigger>
            <TabsTrigger value="rocas" className="gap-1">
              <MapPin className="w-4 h-4" />
              Roças
            </TabsTrigger>
            <TabsTrigger value="meeiros" className="gap-1">
              <Users className="w-4 h-4" />
              Meeiros
            </TabsTrigger>
            <TabsTrigger value="produtos" className="gap-1">
              <Package className="w-4 h-4" />
              Produtos
            </TabsTrigger>
            <TabsTrigger value="lancamentos" className="gap-1">
              <ClipboardList className="w-4 h-4" />
              Lançamentos
            </TabsTrigger>
            <TabsTrigger value="relatorio" className="gap-1">
              <FileText className="w-4 h-4" />
              Relatório por Meeiro
            </TabsTrigger>
          </TabsList>

          {/* Tab Produtores */}
          <TabsContent value="produtores" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setOpenProdutor(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Produtor
              </Button>
            </div>
            <div className="bg-card border rounded-xl overflow-hidden">
              {loadingProdutores ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Nome / Razão social</TableHead>
                      <TableHead>CPF/CNPJ</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Endereço</TableHead>
                      <TableHead className="w-[70px] text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {produtores.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          Nenhum produtor cadastrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      produtores.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.codigo}</TableCell>
                          <TableCell>{p.nome_razao}</TableCell>
                          <TableCell>{p.cpf_cnpj || '—'}</TableCell>
                          <TableCell>{p.telefone || p.whatsapp || '—'}</TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {p.endereco || '—'}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setDetailProdutor(p);
                                    setOpenDetailProdutor(true);
                                  }}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  Ver detalhes
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setEditProdutor(p);
                                    setFormEditProdutor({
                                      codigo: p.codigo,
                                      nome_razao: p.nome_razao,
                                      cpf_cnpj: p.cpf_cnpj ?? '',
                                      telefone: p.telefone ?? '',
                                      whatsapp: p.whatsapp ?? '',
                                      endereco: p.endereco ?? '',
                                    });
                                    setTipoPessoaEdit(
                                      p.cpf_cnpj && cleanDocument(p.cpf_cnpj).length === 14
                                        ? 'PESSOA_JURIDICA'
                                        : 'PESSOA_FISICA'
                                    );
                                    setOpenEditProdutor(true);
                                  }}
                                >
                                  <Pencil className="w-4 h-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => {
                                    if (window.confirm('Deixar este produtor inativo? Ele não aparecerá mais na listagem.')) {
                                      updateProdutor.mutate({
                                        id: p.id,
                                        data: { ativo: false },
                                      });
                                    }
                                  }}
                                >
                                  <UserX className="w-4 h-4 mr-2" />
                                  Deixar inativo
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>

          {/* Tab Roças */}
          <TabsContent value="rocas" className="space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Label>Produtor</Label>
                <Select
                  value={produtorIdRocas === '' ? 'todos' : String(produtorIdRocas)}
                  onValueChange={(v) =>
                    setProdutorIdRocas(v === 'todos' ? '' : Number(v))
                  }
                >
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os produtores</SelectItem>
                    {produtores.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.codigo} – {p.nome_razao}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => setOpenRoca(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Roça
              </Button>
            </div>
            <div className="bg-card border rounded-xl overflow-hidden">
              {loadingRocas ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Localização</TableHead>
                      <TableHead>Produtor</TableHead>
                      <TableHead className="w-[70px] text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rocas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          Nenhuma roça cadastrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      rocas.map((r) => {
                        const prod = produtores.find((p) => p.id === r.produtorId);
                        return (
                          <TableRow key={r.id}>
                            <TableCell className="font-medium">{r.codigo}</TableCell>
                            <TableCell>{r.nome}</TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              {r.localizacao || '—'}
                            </TableCell>
                            <TableCell>{prod ? `${prod.codigo} – ${prod.nome_razao}` : r.produtorId}</TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setDetailRocaId(r.id);
                                      setOpenDetailRoca(true);
                                    }}
                                  >
                                    <Eye className="w-4 h-4 mr-2" />
                                    Ver detalhes
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setEditRoca(r);
                                      setFormEditRoca({
                                        codigo: r.codigo,
                                        nome: r.nome,
                                        localizacao: r.localizacao ?? '',
                                        produtorId: r.produtorId,
                                      });
                                      setOpenEditRoca(true);
                                    }}
                                  >
                                    <Pencil className="w-4 h-4 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => {
                                      if (
                                        window.confirm(
                                          'Tem certeza que deseja excluir esta roça? Não será possível excluir se houver lançamentos vinculados.',
                                        )
                                      ) {
                                        deleteRoca.mutate(r.id);
                                      }
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>

          {/* Tab Meeiros */}
          <TabsContent value="meeiros" className="space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Label>Produtor</Label>
                <Select
                  value={produtorIdMeeiros === '' ? 'todos' : String(produtorIdMeeiros)}
                  onValueChange={(v) =>
                    setProdutorIdMeeiros(v === 'todos' ? '' : Number(v))
                  }
                >
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os produtores</SelectItem>
                    {produtores.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.codigo} – {p.nome_razao}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => setOpenMeeiro(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Meeiro
              </Button>
            </div>
            <div className="bg-card border rounded-xl overflow-hidden">
              {loadingMeeiros ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>% padrão</TableHead>
                      <TableHead className="w-[70px] text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {meeiros.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          Nenhum meeiro cadastrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      meeiros.map((m) => (
                        <TableRow key={m.id}>
                          <TableCell className="font-medium">{m.codigo}</TableCell>
                          <TableCell>{m.nome}</TableCell>
                          <TableCell>{m.cpf || '—'}</TableCell>
                          <TableCell>{m.telefone || '—'}</TableCell>
                          <TableCell>{m.porcentagem_padrao}%</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setDetailMeeiro(m);
                                    setOpenDetailMeeiro(true);
                                  }}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  Ver detalhes
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setEditMeeiro(m);
                                    setFormEditMeeiro({
                                      codigo: m.codigo,
                                      nome: m.nome,
                                      cpf: m.cpf ?? '',
                                      telefone: m.telefone ?? '',
                                      endereco: m.endereco ?? '',
                                      porcentagem_padrao: m.porcentagem_padrao,
                                      produtorId: m.produtorId,
                                    });
                                    setOpenEditMeeiro(true);
                                  }}
                                >
                                  <Pencil className="w-4 h-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => {
                                    if (
                                      window.confirm(
                                        'Tem certeza que deseja excluir este meeiro? Essa ação não pode ser desfeita.',
                                      )
                                    ) {
                                      deleteMeeiro.mutate(m.id);
                                    }
                                  }}
                                >
                                  <UserX className="w-4 h-4 mr-2" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>

          {/* Tab Produtos */}
          <TabsContent value="produtos" className="space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Label>Produtor</Label>
                <Select
                  value={produtorIdProdutos === '' ? 'todos' : String(produtorIdProdutos)}
                  onValueChange={(v) =>
                    setProdutorIdProdutos(v === 'todos' ? '' : Number(v))
                  }
                >
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os produtores</SelectItem>
                    {produtores.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.codigo} – {p.nome_razao}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => setOpenProduto(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Produto
              </Button>
            </div>
            <div className="bg-card border rounded-xl overflow-hidden">
              {loadingProdutos ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Unidade</TableHead>
                      <TableHead>Produtor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {produtosRoca.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          Nenhum produto cadastrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      produtosRoca.map((p) => {
                        const prod = produtores.find((x) => x.id === p.produtorId);
                        return (
                          <TableRow key={p.id}>
                            <TableCell className="font-medium">{p.codigo}</TableCell>
                            <TableCell>{p.nome}</TableCell>
                            <TableCell>{p.unidade_medida || '—'}</TableCell>
                            <TableCell>{prod ? prod.nome_razao : p.produtorId}</TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>

          {/* Tab Lançamentos */}
          <TabsContent value="lancamentos" className="space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Label>Produtor</Label>
                <Select
                  value={produtorIdLanc === '' ? '' : String(produtorIdLanc)}
                  onValueChange={(v) => setProdutorIdLanc(v === '' ? '' : Number(v))}
                >
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="Selecione o produtor" />
                  </SelectTrigger>
                  <SelectContent>
                    {produtores.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.codigo} – {p.nome_razao}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => setOpenLancamento(true)}
                disabled={produtores.length === 0}
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Lançamento
              </Button>
            </div>
            <div className="bg-card border rounded-xl overflow-hidden">
              {loadingLancamentos ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Roça</TableHead>
                      <TableHead>Total geral</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lancamentos.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                          Nenhum lançamento no período
                        </TableCell>
                      </TableRow>
                    ) : (
                      lancamentos.map((l) => {
                        const roca = rocasParaLancamento.find((r) => r.id === l.rocaId);
                        return (
                          <TableRow key={l.id}>
                            <TableCell>{formatDate(l.data)}</TableCell>
                            <TableCell>{roca ? roca.nome : l.rocaId}</TableCell>
                            <TableCell>{formatCurrency(Number(l.total_geral))}</TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>

          {/* Tab Relatório */}
          <TabsContent value="relatorio" className="space-y-4">
            <div className="bg-card border rounded-xl p-4 flex flex-wrap items-end gap-4">
              <div className="space-y-2">
                <Label>Meeiro</Label>
                <Select
                  value={relMeeiroId === '' ? '' : String(relMeeiroId)}
                  onValueChange={(v) => setRelMeeiroId(v === '' ? '' : Number(v))}
                >
                  <SelectTrigger className="w-[260px]">
                    <SelectValue placeholder="Selecione o meeiro" />
                  </SelectTrigger>
                  <SelectContent>
                    {meeirosParaRelatorio.map((m) => (
                      <SelectItem key={m.id} value={String(m.id)}>
                        {m.codigo} – {m.nome} ({m.porcentagem_padrao}%)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Data inicial</Label>
                <Input
                  type="date"
                  value={relDataInicial}
                  onChange={(e) => setRelDataInicial(e.target.value)}
                  className="w-[160px]"
                />
              </div>
              <div className="space-y-2">
                <Label>Data final</Label>
                <Input
                  type="date"
                  value={relDataFinal}
                  onChange={(e) => setRelDataFinal(e.target.value)}
                  className="w-[160px]"
                />
              </div>
              <Button onClick={runRelatorio} disabled={relLoading}>
                {relLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <FileText className="w-4 h-4 mr-2" />
                )}
                Gerar relatório
              </Button>
            </div>
            {relResult && (
              <div className="bg-card border rounded-xl overflow-hidden space-y-4">
                <div className="p-4 border-b grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Valor bruto</p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(relResult.resumo.valorBruto)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">% do meeiro</p>
                    <p className="text-lg font-semibold">
                      {relResult.resumo.percentualMedio.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Valor total a receber</p>
                    <p className="text-lg font-semibold text-primary">
                      {formatCurrency(relResult.resumo.valorTotalReceber)}
                    </p>
                  </div>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Preço unit.</TableHead>
                      <TableHead>Valor total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {relResult.linhas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                          Nenhum lançamento no período
                        </TableCell>
                      </TableRow>
                    ) : (
                      relResult.linhas.map((linha, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{formatDate(linha.data)}</TableCell>
                          <TableCell>{linha.produto}</TableCell>
                          <TableCell>{linha.quantidade}</TableCell>
                          <TableCell>{formatCurrency(linha.preco_unitario)}</TableCell>
                          <TableCell>{formatCurrency(linha.valor_total)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Dialog Novo Produtor - mesmo design do Novo Cliente: tipo PF/PJ, CPF/CNPJ separados, consulta CNPJ */}
        <Dialog open={openProdutor} onOpenChange={setOpenProdutor}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-xl">Novo Produtor</DialogTitle>
                  <DialogDescription className="mt-1">
                    Cadastre o responsável pela roça.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="space-y-6 pt-4">
              {/* Código - opcional: deixar em branco para gerar automaticamente (ex: P001, P002) */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-muted-foreground" />
                  Código do produtor
                  <span className="text-xs text-muted-foreground font-normal">
                    (opcional – deixe em branco para gerar automaticamente)
                  </span>
                </Label>
                <Input
                  value={formProdutor.codigo}
                  onChange={(e) =>
                    setFormProdutor((p) => ({ ...p, codigo: e.target.value }))
                  }
                  placeholder="Ex: P001 – ou em branco para o sistema gerar"
                />
              </div>

              {/* Tipo de Produtor: Pessoa Jurídica (CNPJ) / Pessoa Física (CPF) */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Tipo de Produtor</Label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setTipoPessoaProdutor('PESSOA_JURIDICA');
                      setFormProdutor((p) => ({ ...p, cpf_cnpj: '' }));
                    }}
                    className={`relative p-6 rounded-lg border-2 transition-all ${
                      tipoPessoaProdutor === 'PESSOA_JURIDICA'
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-card hover:border-primary/50'
                    }`}
                  >
                    {tipoPessoaProdutor === 'PESSOA_JURIDICA' && (
                      <div className="absolute top-3 right-3">
                        <Check className="w-5 h-5 text-primary" />
                      </div>
                    )}
                    <div className="flex flex-col items-center gap-3">
                      <Building2
                        className={`w-8 h-8 ${
                          tipoPessoaProdutor === 'PESSOA_JURIDICA'
                            ? 'text-primary'
                            : 'text-muted-foreground'
                        }`}
                      />
                      <div className="text-center">
                        <p
                          className={`font-semibold ${
                            tipoPessoaProdutor === 'PESSOA_JURIDICA'
                              ? 'text-primary'
                              : 'text-foreground'
                          }`}
                        >
                          Pessoa Jurídica
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">CNPJ</p>
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTipoPessoaProdutor('PESSOA_FISICA');
                      setFormProdutor((p) => ({ ...p, cpf_cnpj: '' }));
                    }}
                    className={`relative p-6 rounded-lg border-2 transition-all ${
                      tipoPessoaProdutor === 'PESSOA_FISICA'
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-card hover:border-primary/50'
                    }`}
                  >
                    {tipoPessoaProdutor === 'PESSOA_FISICA' && (
                      <div className="absolute top-3 right-3">
                        <Check className="w-5 h-5 text-primary" />
                      </div>
                    )}
                    <div className="flex flex-col items-center gap-3">
                      <User
                        className={`w-8 h-8 ${
                          tipoPessoaProdutor === 'PESSOA_FISICA'
                            ? 'text-primary'
                            : 'text-muted-foreground'
                        }`}
                      />
                      <div className="text-center">
                        <p
                          className={`font-semibold ${
                            tipoPessoaProdutor === 'PESSOA_FISICA'
                              ? 'text-primary'
                              : 'text-foreground'
                          }`}
                        >
                          Pessoa Física
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">CPF</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Nome / Razão social */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  {tipoPessoaProdutor === 'PESSOA_JURIDICA' ? (
                    <>Razão Social / Nome Fantasia <span className="text-destructive">*</span></>
                  ) : (
                    <>Nome <span className="text-destructive">*</span></>
                  )}
                </Label>
                <Input
                  placeholder={
                    tipoPessoaProdutor === 'PESSOA_JURIDICA'
                      ? 'Razão Social ou Nome Fantasia da empresa'
                      : 'Nome completo do produtor'
                  }
                  value={formProdutor.nome_razao}
                  onChange={(e) =>
                    setFormProdutor((p) => ({ ...p, nome_razao: e.target.value }))
                  }
                />
              </div>

              {/* CPF ou CNPJ - separado: PJ com consulta, PF com máscara */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-muted-foreground" />
                  {tipoPessoaProdutor === 'PESSOA_JURIDICA' ? 'CNPJ' : 'CPF'}
                  <span className="text-xs text-muted-foreground">(opcional)</span>
                </Label>
                {tipoPessoaProdutor === 'PESSOA_JURIDICA' ? (
                  <CampoCnpjComConsulta
                    value={formProdutor.cpf_cnpj || ''}
                    onChange={(value) =>
                      setFormProdutor((p) => ({ ...p, cpf_cnpj: value }))
                    }
                    tipoConsulta="geral"
                    placeholder="00.000.000/0000-00"
                    onPreencherCampos={(dados: ConsultaCnpjResponse) => {
                      if (dados.razaoSocial) {
                        setFormProdutor((p) => ({ ...p, nome_razao: dados.razaoSocial }));
                      }
                      if (dados.nomeFantasia && !formProdutor.nome_razao) {
                        setFormProdutor((p) => ({ ...p, nome_razao: dados.nomeFantasia }));
                      }
                      if (dados.logradouro || dados.cep || dados.cidade) {
                        const partes = [
                          dados.logradouro,
                          dados.numero && `nº ${dados.numero}`,
                          dados.bairro,
                          dados.cep,
                          dados.cidade && dados.uf && `${dados.cidade}/${dados.uf}`,
                        ].filter(Boolean);
                        setFormProdutor((p) => ({
                          ...p,
                          endereco: partes.join(', '),
                        }));
                      }
                      if (dados.telefones && dados.telefones.length > 0) {
                        const tel = formatTelefone(dados.telefones[0]);
                        setFormProdutor((p) => ({ ...p, telefone: tel, whatsapp: tel }));
                      }
                    }}
                  />
                ) : (
                  <Input
                    placeholder="000.000.000-00"
                    value={formProdutor.cpf_cnpj || ''}
                    onChange={(e) => {
                      const v = e.target.value;
                      const cleaned = cleanDocument(v);
                      const limited = cleaned.slice(0, 11);
                      const formatted =
                        limited.length === 11
                          ? formatCPF(limited)
                          : limited
                            .replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4')
                            .replace(/^(\d{3})(\d{3})(\d{3})$/, '$1.$2.$3')
                            .replace(/^(\d{3})(\d{3})$/, '$1.$2')
                            .replace(/^(\d{3})$/, '$1');
                      setFormProdutor((p) => ({ ...p, cpf_cnpj: formatted }));
                    }}
                  />
                )}
                {tipoPessoaProdutor === 'PESSOA_JURIDICA' &&
                  formProdutor.cpf_cnpj &&
                  cleanDocument(formProdutor.cpf_cnpj).length > 0 &&
                  cleanDocument(formProdutor.cpf_cnpj).length !== 14 && (
                    <p className="text-xs text-destructive mt-1">CNPJ deve ter 14 dígitos.</p>
                  )}
                {tipoPessoaProdutor === 'PESSOA_FISICA' &&
                  formProdutor.cpf_cnpj &&
                  cleanDocument(formProdutor.cpf_cnpj).length > 0 &&
                  cleanDocument(formProdutor.cpf_cnpj).length !== 11 && (
                    <p className="text-xs text-destructive mt-1">CPF deve ter 11 dígitos.</p>
                  )}
              </div>

              {/* Telefone / WhatsApp */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  Telefone / WhatsApp
                  <span className="text-xs text-muted-foreground">(opcional)</span>
                </Label>
                <Input
                  value={formProdutor.telefone || ''}
                  onChange={(e) =>
                    setFormProdutor((p) => ({ ...p, telefone: e.target.value }))
                  }
                  placeholder="(00) 00000-0000"
                />
              </div>

              {/* Endereço */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  Endereço
                  <span className="text-xs text-muted-foreground">(opcional)</span>
                </Label>
                <Textarea
                  value={formProdutor.endereco || ''}
                  onChange={(e) =>
                    setFormProdutor((p) => ({ ...p, endereco: e.target.value }))
                  }
                  placeholder="Endereço completo"
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenProdutor(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  if (!formProdutor.nome_razao.trim()) {
                    toast.error('Nome é obrigatório');
                    return;
                  }
                  createProdutor.mutate({
                    ...formProdutor,
                    codigo: formProdutor.codigo?.trim() || undefined,
                  });
                }}
                disabled={createProdutor.isPending}
              >
                {createProdutor.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Cadastrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Detalhes do Produtor - mesmo design de Visualizar Cliente */}
        <Dialog
          open={openDetailProdutor}
          onOpenChange={(open) => {
            setOpenDetailProdutor(open);
            if (!open) setDetailProdutor(null);
          }}
        >
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                Visualizar Produtor
              </DialogTitle>
              <DialogDescription>
                Informações completas do produtor
              </DialogDescription>
            </DialogHeader>
            {detailProdutor && (
              <div className="space-y-8 mt-6">
                {/* Informações Básicas */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    Informações Básicas
                  </h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label className="text-sm text-muted-foreground">Código</Label>
                      <p className="font-medium text-base font-mono">{detailProdutor.codigo}</p>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-sm text-muted-foreground">Nome / Razão social</Label>
                      <p className="font-medium text-base">{detailProdutor.nome_razao}</p>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-sm text-muted-foreground">CPF/CNPJ</Label>
                      <p className="font-medium text-base font-mono">{detailProdutor.cpf_cnpj || '—'}</p>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-sm text-muted-foreground">Tipo</Label>
                      <p className="font-medium text-base">
                        {detailProdutor.cpf_cnpj && cleanDocument(detailProdutor.cpf_cnpj).length === 14
                          ? 'Pessoa Jurídica'
                          : detailProdutor.cpf_cnpj && cleanDocument(detailProdutor.cpf_cnpj).length === 11
                            ? 'Pessoa Física'
                            : '—'}
                      </p>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-sm text-muted-foreground">Telefone / WhatsApp</Label>
                      <p className="font-medium text-base">{detailProdutor.telefone || detailProdutor.whatsapp || '—'}</p>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm text-muted-foreground">Status</Label>
                        <span
                          className={`inline-block px-3 py-1.5 rounded-full text-sm font-medium ${
                            detailProdutor.ativo !== false
                              ? 'bg-green-500/10 text-green-500'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {detailProdutor.ativo !== false ? 'ATIVO' : 'INATIVO'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Endereço */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    Endereço
                  </h3>
                  <div className="p-4 border rounded-lg">
                    <p className="font-medium text-base whitespace-pre-wrap">
                      {detailProdutor.endereco || '—'}
                    </p>
                  </div>
                </div>

                {/* Roças vinculadas */}
                {rocas.filter((r) => r.produtorId === detailProdutor.id).length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Sprout className="w-5 h-5 text-primary" />
                      Roças do produtor
                    </h3>
                    <div className="space-y-2">
                      {rocas
                        .filter((r) => r.produtorId === detailProdutor.id)
                        .map((r) => (
                          <div
                            key={r.id}
                            className="p-3 border rounded-lg flex flex-wrap items-center justify-between gap-4 text-sm"
                          >
                            <div>
                              <p className="text-xs text-muted-foreground">Código</p>
                              <p className="font-medium">{r.codigo}</p>
                            </div>
                            <div className="flex-1 min-w-[180px]">
                              <p className="text-xs text-muted-foreground">Nome</p>
                              <p className="font-medium truncate">{r.nome}</p>
                            </div>
                            <div className="flex-1 min-w-[200px]">
                              <p className="text-xs text-muted-foreground">Localização</p>
                              <p className="font-medium truncate">
                                {r.localizacao || '—'}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Informações do Sistema */}
                {(detailProdutor.criadoEm || detailProdutor.atualizadoEm) && (
                  <div className="space-y-2 pt-4 border-t">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary" />
                      Informações do Sistema
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {detailProdutor.criadoEm && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Criado em</Label>
                          <p>{new Date(detailProdutor.criadoEm).toLocaleString('pt-BR')}</p>
                        </div>
                      )}
                      {detailProdutor.atualizadoEm && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Atualizado em</Label>
                          <p>{new Date(detailProdutor.atualizadoEm).toLocaleString('pt-BR')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            {detailProdutor && (
              <div className="flex justify-end gap-2 mt-6 pt-6 border-t">
                <Button
                  variant="default"
                  onClick={() => {
                    setOpenDetailProdutor(false);
                    setEditProdutor(detailProdutor);
                    setFormEditProdutor({
                      codigo: detailProdutor.codigo,
                      nome_razao: detailProdutor.nome_razao,
                      cpf_cnpj: detailProdutor.cpf_cnpj ?? '',
                      telefone: detailProdutor.telefone ?? '',
                      whatsapp: detailProdutor.whatsapp ?? '',
                      endereco: detailProdutor.endereco ?? '',
                    });
                    setTipoPessoaEdit(
                      detailProdutor.cpf_cnpj && cleanDocument(detailProdutor.cpf_cnpj).length === 14
                        ? 'PESSOA_JURIDICA'
                        : 'PESSOA_FISICA'
                    );
                    setOpenEditProdutor(true);
                  }}
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Editar
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog Editar Produtor */}
        <Dialog
          open={openEditProdutor}
          onOpenChange={(open) => {
            setOpenEditProdutor(open);
            if (!open) setEditProdutor(null);
          }}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Pencil className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <DialogTitle>Editar produtor</DialogTitle>
                  <DialogDescription className="mt-1">
                    Altere os dados do produtor.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            {editProdutor && (
              <div className="space-y-6 pt-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-muted-foreground" />
                    Código do produtor
                  </Label>
                  <Input
                    value={formEditProdutor.codigo ?? ''}
                    onChange={(e) =>
                      setFormEditProdutor((p) => ({ ...p, codigo: e.target.value }))
                    }
                    placeholder="Ex: P001"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Tipo de Produtor</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setTipoPessoaEdit('PESSOA_JURIDICA');
                        setFormEditProdutor((p) => ({ ...p, cpf_cnpj: '' }));
                      }}
                      className={`relative p-6 rounded-lg border-2 transition-all ${
                        tipoPessoaEdit === 'PESSOA_JURIDICA'
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-card hover:border-primary/50'
                      }`}
                    >
                      {tipoPessoaEdit === 'PESSOA_JURIDICA' && (
                        <div className="absolute top-3 right-3">
                          <Check className="w-5 h-5 text-primary" />
                        </div>
                      )}
                      <div className="flex flex-col items-center gap-3">
                        <Building2 className={`w-8 h-8 ${tipoPessoaEdit === 'PESSOA_JURIDICA' ? 'text-primary' : 'text-muted-foreground'}`} />
                        <div className="text-center">
                          <p className={`font-semibold ${tipoPessoaEdit === 'PESSOA_JURIDICA' ? 'text-primary' : 'text-foreground'}`}>Pessoa Jurídica</p>
                          <p className="text-xs text-muted-foreground mt-1">CNPJ</p>
                        </div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTipoPessoaEdit('PESSOA_FISICA');
                        setFormEditProdutor((p) => ({ ...p, cpf_cnpj: '' }));
                      }}
                      className={`relative p-6 rounded-lg border-2 transition-all ${
                        tipoPessoaEdit === 'PESSOA_FISICA'
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-card hover:border-primary/50'
                      }`}
                    >
                      {tipoPessoaEdit === 'PESSOA_FISICA' && (
                        <div className="absolute top-3 right-3">
                          <Check className="w-5 h-5 text-primary" />
                        </div>
                      )}
                      <div className="flex flex-col items-center gap-3">
                        <User className={`w-8 h-8 ${tipoPessoaEdit === 'PESSOA_FISICA' ? 'text-primary' : 'text-muted-foreground'}`} />
                        <div className="text-center">
                          <p className={`font-semibold ${tipoPessoaEdit === 'PESSOA_FISICA' ? 'text-primary' : 'text-foreground'}`}>Pessoa Física</p>
                          <p className="text-xs text-muted-foreground mt-1">CPF</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    {tipoPessoaEdit === 'PESSOA_JURIDICA' ? 'Razão Social / Nome Fantasia' : 'Nome'} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    placeholder={tipoPessoaEdit === 'PESSOA_JURIDICA' ? 'Razão Social ou Nome Fantasia' : 'Nome completo'}
                    value={formEditProdutor.nome_razao ?? ''}
                    onChange={(e) =>
                      setFormEditProdutor((p) => ({ ...p, nome_razao: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-muted-foreground" />
                    {tipoPessoaEdit === 'PESSOA_JURIDICA' ? 'CNPJ' : 'CPF'} <span className="text-xs text-muted-foreground">(opcional)</span>
                  </Label>
                  {tipoPessoaEdit === 'PESSOA_JURIDICA' ? (
                    <CampoCnpjComConsulta
                      value={formEditProdutor.cpf_cnpj ?? ''}
                      onChange={(value) =>
                        setFormEditProdutor((p) => ({ ...p, cpf_cnpj: value }))
                      }
                      tipoConsulta="geral"
                      placeholder="00.000.000/0000-00"
                      onPreencherCampos={(dados: ConsultaCnpjResponse) => {
                        if (dados.razaoSocial) setFormEditProdutor((p) => ({ ...p, nome_razao: dados.razaoSocial ?? '' }));
                        if (dados.logradouro || dados.cep || dados.cidade) {
                          const partes = [dados.logradouro, dados.numero && `nº ${dados.numero}`, dados.bairro, dados.cep, dados.cidade && dados.uf && `${dados.cidade}/${dados.uf}`].filter(Boolean);
                          setFormEditProdutor((p) => ({ ...p, endereco: partes.join(', ') }));
                        }
                        if (dados.telefones?.length) {
                          const tel = formatTelefone(dados.telefones[0]);
                          setFormEditProdutor((p) => ({ ...p, telefone: tel, whatsapp: tel }));
                        }
                      }}
                    />
                  ) : (
                    <Input
                      placeholder="000.000.000-00"
                      value={formEditProdutor.cpf_cnpj ?? ''}
                      onChange={(e) => {
                        const v = e.target.value;
                        const cleaned = cleanDocument(v);
                        const limited = cleaned.slice(0, 11);
                        const formatted = limited.length === 11 ? formatCPF(limited) : limited.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4').replace(/^(\d{3})(\d{3})(\d{3})$/, '$1.$2.$3').replace(/^(\d{3})(\d{3})$/, '$1.$2').replace(/^(\d{3})$/, '$1');
                        setFormEditProdutor((p) => ({ ...p, cpf_cnpj: formatted }));
                      }}
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    Telefone / WhatsApp <span className="text-xs text-muted-foreground">(opcional)</span>
                  </Label>
                  <Input
                    value={formEditProdutor.telefone ?? ''}
                    onChange={(e) =>
                      setFormEditProdutor((p) => ({ ...p, telefone: e.target.value }))
                    }
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    Endereço <span className="text-xs text-muted-foreground">(opcional)</span>
                  </Label>
                  <Textarea
                    value={formEditProdutor.endereco ?? ''}
                    onChange={(e) =>
                      setFormEditProdutor((p) => ({ ...p, endereco: e.target.value }))
                    }
                    placeholder="Endereço completo"
                    rows={2}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenEditProdutor(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  if (!formEditProdutor.nome_razao?.trim()) {
                    toast.error('Nome é obrigatório');
                    return;
                  }
                  if (!editProdutor) return;
                  updateProdutor.mutate({
                    id: editProdutor.id,
                    data: {
                      codigo: formEditProdutor.codigo?.trim() || undefined,
                      nome_razao: formEditProdutor.nome_razao,
                      cpf_cnpj: formEditProdutor.cpf_cnpj || undefined,
                      telefone: formEditProdutor.telefone || undefined,
                      whatsapp: formEditProdutor.whatsapp || undefined,
                      // Permite enviar endereço vazio para limpar o campo
                      endereco: formEditProdutor.endereco?.trim() ?? '',
                    },
                  });
                }}
                disabled={updateProdutor.isPending}
              >
                {updateProdutor.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Nova Roça */}
        <Dialog open={openRoca} onOpenChange={setOpenRoca}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Sprout className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-xl">Nova Roça</DialogTitle>
                  <DialogDescription className="mt-1">
                    Cadastre a roça vinculada ao produtor.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="space-y-8 pt-6">
              {/* Informações da roça */}
              <div className="bg-card border rounded-xl p-6 space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Sprout className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">Informações da roça</h3>
                    <p className="text-xs text-muted-foreground">
                      Defina um código e um nome para identificar esta roça.
                    </p>
                  </div>
                </div>
                {/* Produtor vinculado */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    Produtor <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formRoca.produtorId ? String(formRoca.produtorId) : ''}
                    onValueChange={(v) =>
                      setFormRoca((p) => ({ ...p, produtorId: Number(v) }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o produtor responsável" />
                    </SelectTrigger>
                    <SelectContent>
                      {produtores.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.codigo} – {p.nome_razao}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-muted-foreground" />
                      Código da roça
                    </Label>
                    <Input
                      value={formRoca.codigo}
                      onChange={(e) =>
                        setFormRoca((p) => ({ ...p, codigo: e.target.value }))
                      }
                      placeholder="Ex: R001 – ou em branco para o sistema gerar"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      Nome ou identificação <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      value={formRoca.nome}
                      onChange={(e) =>
                        setFormRoca((p) => ({ ...p, nome: e.target.value }))
                      }
                      placeholder="Ex: Roça do Fundão"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    Localização
                    <span className="text-xs text-muted-foreground">(opcional)</span>
                  </Label>
                  <Textarea
                    value={formRoca.localizacao || ''}
                    onChange={(e) =>
                      setFormRoca((p) => ({ ...p, localizacao: e.target.value }))
                    }
                    placeholder="Onde fica a roça (ponto de referência, comunidade, cidade, etc.)"
                    rows={2}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenRoca(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  if (!formRoca.nome.trim() || !formRoca.produtorId) {
                    toast.error('Produtor e nome da roça são obrigatórios');
                    return;
                  }
                  createRoca.mutate({
                    ...formRoca,
                    codigo: formRoca.codigo.trim() || undefined,
                  });
                }}
                disabled={createRoca.isPending}
              >
                {createRoca.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Cadastrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Ver detalhes da Roça */}
        <Dialog
          open={openDetailRoca}
          onOpenChange={(open) => {
            setOpenDetailRoca(open);
            if (!open) setDetailRocaId(null);
          }}
        >
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                Visualizar Roça
              </DialogTitle>
              <DialogDescription>
                Informações completas da roça.
              </DialogDescription>
            </DialogHeader>
            {loadingDetailRoca ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              detailRoca && (
                <>
                  <div className="space-y-8 mt-6">
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Sprout className="w-5 h-5 text-primary" />
                        Informações Básicas
                      </h3>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <Label className="text-sm text-muted-foreground">Código</Label>
                          <p className="font-medium text-base font-mono">{detailRoca.codigo}</p>
                        </div>
                        <div className="space-y-3">
                          <Label className="text-sm text-muted-foreground">Nome</Label>
                          <p className="font-medium text-base">{detailRoca.nome}</p>
                        </div>
                        <div className="space-y-3">
                          <Label className="text-sm text-muted-foreground">Produtor</Label>
                          <p className="font-medium text-base">
                            {detailRoca.produtorCodigo && detailRoca.produtorNome
                              ? `${detailRoca.produtorCodigo} – ${detailRoca.produtorNome}`
                              : produtores.find((p) => p.id === detailRoca.produtorId)
                                ? `${produtores.find((p) => p.id === detailRoca.produtorId)!.codigo} – ${produtores.find((p) => p.id === detailRoca.produtorId)!.nome_razao}`
                                : detailRoca.produtorId}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-primary" />
                        Localização
                      </h3>
                      <div className="p-4 border rounded-lg">
                        <p className="font-medium text-base whitespace-pre-wrap">
                          {detailRoca.localizacao || '—'}
                        </p>
                      </div>
                    </div>

                    {(detailRoca.criadoEm || detailRoca.atualizadoEm) && (
                      <div className="space-y-2 pt-4 border-t">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-primary" />
                          Informações do Sistema
                        </h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          {detailRoca.criadoEm && (
                            <div>
                              <Label className="text-xs text-muted-foreground">Criado em</Label>
                              <p>
                                {new Date(detailRoca.criadoEm).toLocaleString('pt-BR')}
                              </p>
                            </div>
                          )}
                          {detailRoca.atualizadoEm && (
                            <div>
                              <Label className="text-xs text-muted-foreground">Atualizado em</Label>
                              <p>
                                {new Date(detailRoca.atualizadoEm).toLocaleString('pt-BR')}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end gap-2 mt-6 pt-6 border-t">
                    <Button
                      variant="default"
                      onClick={() => {
                        setOpenDetailRoca(false);
                        setEditRoca(detailRoca);
                        setFormEditRoca({
                          codigo: detailRoca.codigo,
                          nome: detailRoca.nome,
                          localizacao: detailRoca.localizacao ?? '',
                          produtorId: detailRoca.produtorId,
                        });
                        setOpenEditRoca(true);
                      }}
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                  </div>
                </>
              )
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog Editar Roça */}
        <Dialog
          open={openEditRoca}
          onOpenChange={(open) => {
            setOpenEditRoca(open);
            if (!open) setEditRoca(null);
          }}
        >
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Pencil className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-xl">Editar Roça</DialogTitle>
                  <DialogDescription className="mt-1">
                    Altere os dados da roça.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            {editRoca && (
              <div className="space-y-8 pt-6">
                <div className="bg-card border rounded-xl p-6 space-y-6">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      Produtor <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={
                        formEditRoca.produtorId ? String(formEditRoca.produtorId) : ''
                      }
                      onValueChange={(v) =>
                        setFormEditRoca((p) => ({ ...p, produtorId: Number(v) }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o produtor responsável" />
                      </SelectTrigger>
                      <SelectContent>
                        {produtores.map((p) => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {p.codigo} – {p.nome_razao}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Hash className="w-4 h-4 text-muted-foreground" />
                        Código da roça
                      </Label>
                      <Input
                        value={formEditRoca.codigo ?? ''}
                        onChange={(e) =>
                          setFormEditRoca((p) => ({ ...p, codigo: e.target.value }))
                        }
                        placeholder="Ex: R001"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        Nome <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        value={formEditRoca.nome ?? ''}
                        onChange={(e) =>
                          setFormEditRoca((p) => ({ ...p, nome: e.target.value }))
                        }
                        placeholder="Ex: Roça do Fundão"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      Localização
                      <span className="text-xs text-muted-foreground">(opcional)</span>
                    </Label>
                    <Textarea
                      value={formEditRoca.localizacao ?? ''}
                      onChange={(e) =>
                        setFormEditRoca((p) => ({ ...p, localizacao: e.target.value }))
                      }
                      placeholder="Onde fica a roça"
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenEditRoca(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  if (!editRoca) return;
                  if (!formEditRoca.nome?.trim() || !formEditRoca.produtorId) {
                    toast.error('Nome e produtor são obrigatórios');
                    return;
                  }
                  const codigoVal = formEditRoca.codigo?.trim();
                  const localizacaoVal = formEditRoca.localizacao?.trim();
                  updateRoca.mutate({
                    id: editRoca.id,
                    data: {
                      codigo: codigoVal || undefined,
                      nome: formEditRoca.nome,
                      // Envia null quando o usuário limpou o campo para o backend gravar vazio
                      localizacao:
                        localizacaoVal === '' || formEditRoca.localizacao === ''
                          ? null
                          : localizacaoVal || undefined,
                      produtorId: formEditRoca.produtorId || undefined,
                    },
                  });
                }}
                disabled={updateRoca.isPending}
              >
                {updateRoca.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Novo Meeiro - mesmo design de criar cliente */}
        <Dialog open={openMeeiro} onOpenChange={setOpenMeeiro}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-xl">Novo Meeiro</DialogTitle>
                  <DialogDescription className="mt-1">
                    Cadastre o meeiro (mantenedor) vinculado ao produtor.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="space-y-10 pt-6">
              <div className="bg-card border rounded-xl p-7 space-y-7">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Users className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">Informações do meeiro</h3>
                    <p className="text-xs text-muted-foreground">
                      Defina o produtor responsável, código, nome e dados básicos do meeiro.
                    </p>
                  </div>
                </div>

                {/* Produtor */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    Produtor <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formMeeiro.produtorId ? String(formMeeiro.produtorId) : ''}
                    onValueChange={(v) =>
                      setFormMeeiro((p) => ({ ...p, produtorId: Number(v) }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o produtor responsável" />
                    </SelectTrigger>
                    <SelectContent>
                      {produtores.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.codigo} – {p.nome_razao}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Código e nome */}
                <div className="grid grid-cols-2 gap-7">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-muted-foreground" />
                      Código do meeiro
                    </Label>
                    <Input
                      value={formMeeiro.codigo}
                      onChange={(e) =>
                        setFormMeeiro((p) => ({ ...p, codigo: e.target.value }))
                      }
                      placeholder="Ex: M001 – ou em branco para o sistema gerar"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      Nome <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      value={formMeeiro.nome}
                      onChange={(e) =>
                        setFormMeeiro((p) => ({ ...p, nome: e.target.value }))
                      }
                      placeholder="Nome completo"
                    />
                  </div>
                </div>

                {/* CPF e porcentagem */}
                <div className="grid grid-cols-2 gap-7">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-muted-foreground" />
                      CPF
                      <span className="text-xs text-muted-foreground">(opcional)</span>
                    </Label>
                    <Input
                      placeholder="000.000.000-00"
                      value={formMeeiro.cpf || ''}
                      onChange={(e) => {
                        const v = e.target.value;
                        const cleaned = cleanDocument(v);
                        const limited = cleaned.slice(0, 11);
                        const formatted =
                          limited.length === 11
                            ? formatCPF(limited)
                            : limited
                                .replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4')
                                .replace(/^(\d{3})(\d{3})(\d{3})$/, '$1.$2.$3')
                                .replace(/^(\d{3})(\d{3})$/, '$1.$2')
                                .replace(/^(\d{3})$/, '$1');
                        setFormMeeiro((p) => ({ ...p, cpf: formatted }));
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-muted-foreground" />
                      Porcentagem padrão (%)
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      placeholder="40"
                      value={
                        formMeeiro.porcentagem_padrao === 0
                          ? ''
                          : formMeeiro.porcentagem_padrao
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormMeeiro((p) => ({
                          ...p,
                          porcentagem_padrao: val === '' ? 0 : Number(val),
                        }));
                      }}
                    />
                  </div>
                </div>

                {/* Telefone */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    Telefone
                    <span className="text-xs text-muted-foreground">(opcional)</span>
                  </Label>
                  <Input
                    placeholder="(00) 00000-0000"
                    value={formMeeiro.telefone || ''}
                    onChange={(e) => {
                      const v = e.target.value;
                      const digits = v.replace(/\D/g, '').slice(0, 11);
                      const formatted = digits ? formatTelefone(digits) : '';
                      setFormMeeiro((p) => ({ ...p, telefone: formatted }));
                    }}
                  />
                </div>

                {/* Endereço */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    Endereço
                    <span className="text-xs text-muted-foreground">(opcional)</span>
                  </Label>
                  <Textarea
                    value={formMeeiro.endereco || ''}
                    onChange={(e) =>
                      setFormMeeiro((p) => ({ ...p, endereco: e.target.value }))
                    }
                    placeholder="Endereço completo"
                    rows={2}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenMeeiro(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  if (!formMeeiro.nome.trim() || !formMeeiro.produtorId) {
                    toast.error('Nome e produtor são obrigatórios');
                    return;
                  }
                  createMeeiro.mutate({
                    ...formMeeiro,
                    codigo: formMeeiro.codigo.trim() || undefined,
                  });
                }}
                disabled={createMeeiro.isPending}
              >
                {createMeeiro.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Cadastrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Detalhes do Meeiro */}
        <Dialog
          open={openDetailMeeiro}
          onOpenChange={(open) => {
            setOpenDetailMeeiro(open);
            if (!open) setDetailMeeiro(null);
          }}
        >
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                Visualizar Meeiro
              </DialogTitle>
              <DialogDescription>
                Informações completas do meeiro.
              </DialogDescription>
            </DialogHeader>
            {detailMeeiro && (
              <div className="space-y-8 mt-6">
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Informações Básicas
                  </h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label className="text-sm text-muted-foreground">Código</Label>
                      <p className="font-medium text-base font-mono">
                        {detailMeeiro.codigo}
                      </p>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-sm text-muted-foreground">Nome</Label>
                      <p className="font-medium text-base">{detailMeeiro.nome}</p>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-sm text-muted-foreground">CPF</Label>
                      <p className="font-medium text-base font-mono">
                        {detailMeeiro.cpf || '—'}
                      </p>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-sm text-muted-foreground">
                        Porcentagem padrão (%)
                      </Label>
                      <p className="font-medium text-base">
                        {detailMeeiro.porcentagem_padrao ?? 0}%
                      </p>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-sm text-muted-foreground">Telefone</Label>
                      <p className="font-medium text-base">
                        {detailMeeiro.telefone || '—'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    Endereço
                  </h3>
                  <div className="p-4 border rounded-lg">
                    <p className="font-medium text-base whitespace-pre-wrap">
                      {detailMeeiro.endereco || '—'}
                    </p>
                  </div>
                </div>

                {(detailMeeiro.criadoEm || detailMeeiro.atualizadoEm) && (
                  <div className="space-y-2 pt-4 border-t">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary" />
                      Informações do Sistema
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {detailMeeiro.criadoEm && (
                        <div>
                          <Label className="text-xs text-muted-foreground">
                            Criado em
                          </Label>
                          <p>
                            {new Date(detailMeeiro.criadoEm).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      )}
                      {detailMeeiro.atualizadoEm && (
                        <div>
                          <Label className="text-xs text-muted-foreground">
                            Atualizado em
                          </Label>
                          <p>
                            {new Date(detailMeeiro.atualizadoEm).toLocaleString(
                              'pt-BR',
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            {detailMeeiro && (
              <div className="flex justify-end gap-2 mt-6 pt-6 border-t">
                <Button
                  variant="default"
                  onClick={() => {
                    setOpenDetailMeeiro(false);
                    setEditMeeiro(detailMeeiro);
                    setFormEditMeeiro({
                      codigo: detailMeeiro.codigo,
                      nome: detailMeeiro.nome,
                      cpf: detailMeeiro.cpf ?? '',
                      telefone: detailMeeiro.telefone ?? '',
                      endereco: detailMeeiro.endereco ?? '',
                      porcentagem_padrao: detailMeeiro.porcentagem_padrao,
                      produtorId: detailMeeiro.produtorId,
                    });
                    setOpenEditMeeiro(true);
                  }}
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Editar
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog Editar Meeiro */}
        <Dialog
          open={openEditMeeiro}
          onOpenChange={(open) => {
            setOpenEditMeeiro(open);
            if (!open) setEditMeeiro(null);
          }}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Pencil className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-xl">Editar Meeiro</DialogTitle>
                  <DialogDescription className="mt-1">
                    Altere os dados do meeiro.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            {editMeeiro && (
              <div className="space-y-10 pt-6">
                <div className="bg-card border rounded-xl p-7 space-y-7">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Users className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">Informações do meeiro</h3>
                      <p className="text-xs text-muted-foreground">
                        Atualize o produtor responsável, código, nome e dados básicos.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      Produtor <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={
                        formEditMeeiro.produtorId
                          ? String(formEditMeeiro.produtorId)
                          : ''
                      }
                      onValueChange={(v) =>
                        setFormEditMeeiro((p) => ({ ...p, produtorId: Number(v) }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o produtor responsável" />
                      </SelectTrigger>
                      <SelectContent>
                        {produtores.map((p) => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {p.codigo} – {p.nome_razao}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-7">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Hash className="w-4 h-4 text-muted-foreground" />
                        Código do meeiro
                      </Label>
                      <Input
                        value={formEditMeeiro.codigo ?? ''}
                        onChange={(e) =>
                          setFormEditMeeiro((p) => ({ ...p, codigo: e.target.value }))
                        }
                        placeholder="Ex: M001 – ou em branco para o sistema gerar"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        Nome <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        value={formEditMeeiro.nome ?? ''}
                        onChange={(e) =>
                          setFormEditMeeiro((p) => ({ ...p, nome: e.target.value }))
                        }
                        placeholder="Nome completo"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-7">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Hash className="w-4 h-4 text-muted-foreground" />
                        CPF
                        <span className="text-xs text-muted-foreground">
                          (opcional)
                        </span>
                      </Label>
                      <Input
                        placeholder="000.000.000-00"
                        value={formEditMeeiro.cpf ?? ''}
                        onChange={(e) => {
                          const v = e.target.value;
                          const cleaned = cleanDocument(v);
                          const limited = cleaned.slice(0, 11);
                          const formatted =
                            limited.length === 11
                              ? formatCPF(limited)
                              : limited
                                  .replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4')
                                  .replace(/^(\d{3})(\d{3})(\d{3})$/, '$1.$2.$3')
                                  .replace(/^(\d{3})(\d{3})$/, '$1.$2')
                                  .replace(/^(\d{3})$/, '$1');
                          setFormEditMeeiro((p) => ({ ...p, cpf: formatted }));
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <ClipboardList className="w-4 h-4 text-muted-foreground" />
                        Porcentagem padrão (%)
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        placeholder="40"
                        value={
                          formEditMeeiro.porcentagem_padrao === 0
                            ? ''
                            : formEditMeeiro.porcentagem_padrao ?? ''
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormEditMeeiro((p) => ({
                            ...p,
                            porcentagem_padrao: val === '' ? 0 : Number(val),
                          }));
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      Telefone
                      <span className="text-xs text-muted-foreground">(opcional)</span>
                    </Label>
                    <Input
                      placeholder="(00) 00000-0000"
                      value={formEditMeeiro.telefone ?? ''}
                      onChange={(e) => {
                        const v = e.target.value;
                        const digits = v.replace(/\D/g, '').slice(0, 11);
                        const formatted = digits ? formatTelefone(digits) : '';
                        setFormEditMeeiro((p) => ({ ...p, telefone: formatted }));
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      Endereço
                      <span className="text-xs text-muted-foreground">(opcional)</span>
                    </Label>
                    <Textarea
                      value={formEditMeeiro.endereco ?? ''}
                      onChange={(e) =>
                        setFormEditMeeiro((p) => ({ ...p, endereco: e.target.value }))
                      }
                      placeholder="Endereço completo"
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenEditMeeiro(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  if (!editMeeiro) return;
                  if (!formEditMeeiro.nome?.trim() || !formEditMeeiro.produtorId) {
                    toast.error('Nome e produtor são obrigatórios');
                    return;
                  }
                  updateMeeiro.mutate({
                    id: editMeeiro.id,
                    data: {
                      codigo: formEditMeeiro.codigo?.trim() || undefined,
                      nome: formEditMeeiro.nome,
                      cpf: formEditMeeiro.cpf || undefined,
                      telefone: formEditMeeiro.telefone || undefined,
                      endereco: formEditMeeiro.endereco || undefined,
                      porcentagem_padrao:
                        formEditMeeiro.porcentagem_padrao ?? editMeeiro.porcentagem_padrao,
                      produtorId: formEditMeeiro.produtorId || editMeeiro.produtorId,
                    },
                  });
                }}
                disabled={updateMeeiro.isPending}
              >
                {updateMeeiro.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Novo Produto */}
        <Dialog open={openProduto} onOpenChange={setOpenProduto}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Produto da Roça</DialogTitle>
              <DialogDescription>Produtos produzidos na roça (milho, feijão, mandioca, etc.).</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Produtor</Label>
                <Select
                  value={formProduto.produtorId ? String(formProduto.produtorId) : ''}
                  onValueChange={(v) =>
                    setFormProduto((p) => ({ ...p, produtorId: Number(v) }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o produtor" />
                  </SelectTrigger>
                  <SelectContent>
                    {produtores.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.codigo} – {p.nome_razao}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Código do produto</Label>
                  <Input
                    value={formProduto.codigo}
                    onChange={(e) =>
                      setFormProduto((p) => ({ ...p, codigo: e.target.value }))
                    }
                    placeholder="Ex: MILHO"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nome do produto</Label>
                  <Input
                    value={formProduto.nome}
                    onChange={(e) =>
                      setFormProduto((p) => ({ ...p, nome: e.target.value }))
                    }
                    placeholder="Ex: Milho"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Unidade de medida</Label>
                <Select
                  value={formProduto.unidade_medida || 'KG'}
                  onValueChange={(v) =>
                    setFormProduto((p) => ({ ...p, unidade_medida: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIDADES.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenProduto(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  if (
                    !formProduto.codigo.trim() ||
                    !formProduto.nome.trim() ||
                    !formProduto.produtorId
                  ) {
                    toast.error('Código, nome e produtor são obrigatórios');
                    return;
                  }
                  createProduto.mutate(formProduto);
                }}
                disabled={createProduto.isPending}
              >
                {createProduto.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Cadastrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Novo Lançamento - simplified: need produtor selected first, then roça, date, meeiros by code, products with qty/price */}
        <Dialog open={openLancamento} onOpenChange={setOpenLancamento}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Novo Lançamento de Produção</DialogTitle>
              <DialogDescription>
                Registre a produção: selecione roça, data, meeiros e produtos com quantidade e preço.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex flex-wrap gap-4">
                <div className="space-y-2">
                  <Label>Produtor</Label>
                  <Select
                    value={produtorIdLanc === '' ? '' : String(produtorIdLanc)}
                    onValueChange={(v) => {
                      setProdutorIdLanc(v === '' ? '' : Number(v));
                      setLancRocaId('');
                      setLancMeeiros([]);
                      setLancProdutos([]);
                    }}
                  >
                    <SelectTrigger className="w-[220px]">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {produtores.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.codigo} – {p.nome_razao}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={lancData}
                    onChange={(e) => setLancData(e.target.value)}
                    className="w-[160px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Roça</Label>
                  <Select
                    value={lancRocaId === '' ? '' : String(lancRocaId)}
                    onValueChange={(v) => setLancRocaId(v === '' ? '' : Number(v))}
                    disabled={!produtorIdLanc}
                  >
                    <SelectTrigger className="w-[220px]">
                      <SelectValue placeholder="Selecione a roça" />
                    </SelectTrigger>
                    <SelectContent>
                      {rocasParaLancamento.map((r) => (
                        <SelectItem key={r.id} value={String(r.id)}>
                          {r.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Meeiros (informe o código para adicionar)</Label>
                <div className="flex gap-2">
                  <Input
                    value={lancMeeiroCodigo}
                    onChange={(e) => setLancMeeiroCodigo(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddMeeiroByCodigo())}
                    placeholder="Código do meeiro"
                    className="max-w-[180px]"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleAddMeeiroByCodigo}
                    disabled={!produtorIdLanc}
                  >
                    Adicionar
                  </Button>
                </div>
                {lancMeeiros.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {lancMeeiros.map((m) => (
                      <div
                        key={m.meeiroId}
                        className="flex items-center justify-between rounded border px-3 py-2 text-sm"
                      >
                        <span>{m.nome ?? m.meeiroId}</span>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            className="w-16 h-8 text-right"
                            value={m.porcentagem ?? ''}
                            onChange={(e) => {
                              const v = e.target.value === '' ? undefined : Number(e.target.value);
                              setLancMeeiros((prev) =>
                                prev.map((x) =>
                                  x.meeiroId === m.meeiroId
                                    ? { ...x, porcentagem: v }
                                    : x
                                )
                              );
                            }}
                          />
                          <span>%</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setLancMeeiros((prev) =>
                                prev.filter((x) => x.meeiroId !== m.meeiroId)
                              )
                            }
                          >
                            Remover
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Produtos (quantidade e preço unitário)</Label>
                <div className="rounded border p-3 space-y-2 max-h-48 overflow-y-auto">
                  {lancProdutos.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 text-sm border-b pb-2 last:border-0"
                    >
                      <span className="font-medium">{item.nome ?? item.produtoId}</span>
                      <span>Qtd: {item.quantidade}</span>
                      <span>{formatCurrency(item.preco_unitario)}/un</span>
                      <span>{formatCurrency(item.quantidade * item.preco_unitario)}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setLancProdutos((prev) => prev.filter((_, i) => i !== idx))
                        }
                      >
                        Remover
                      </Button>
                    </div>
                  ))}
                  <AddProdutoLanc
                    produtos={produtosParaLancamento}
                    onAdd={handleAddProdutoLanc}
                    disabled={!produtorIdLanc}
                  />
                </div>
                <p className="text-sm font-semibold text-foreground">
                  Total geral: {formatCurrency(totalGeralLanc)}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenLancamento(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSubmitLancamento}
                disabled={
                  createLancamento.isPending ||
                  !lancData ||
                  !lancRocaId ||
                  lancMeeiros.length === 0 ||
                  lancProdutos.length === 0
                }
              >
                {createLancamento.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Registrar lançamento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}

function AddProdutoLanc({
  produtos,
  onAdd,
  disabled,
}: {
  produtos: ProdutoRoca[];
  onAdd: (produtoId: number, quantidade: number, preco_unitario: number) => void;
  disabled: boolean;
}) {
  const [produtoId, setProdutoId] = useState<number | ''>('');
  const [qtd, setQtd] = useState('');
  const [preco, setPreco] = useState('');
  if (produtos.length === 0) return null;
  return (
    <div className="flex flex-wrap items-end gap-2 pt-2">
      <Select
        value={produtoId === '' ? '' : String(produtoId)}
        onValueChange={(v) => setProdutoId(v === '' ? '' : Number(v))}
        disabled={disabled}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Produto" />
        </SelectTrigger>
        <SelectContent>
          {produtos.map((p) => (
            <SelectItem key={p.id} value={String(p.id)}>
              {p.nome} ({p.unidade_medida})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="number"
        min={0.001}
        step="any"
        placeholder="Qtd"
        value={qtd}
        onChange={(e) => setQtd(e.target.value)}
        className="w-20"
        disabled={disabled}
      />
      <Input
        type="number"
        min={0}
        step="0.01"
        placeholder="Preço un."
        value={preco}
        onChange={(e) => setPreco(e.target.value)}
        className="w-24"
        disabled={disabled}
      />
      <Button
        type="button"
        size="sm"
        onClick={() => {
          if (!produtoId || !qtd || !preco) return;
          const q = parseFloat(qtd);
          const p = parseFloat(preco);
          if (q <= 0 || p < 0) return;
          onAdd(produtoId, q, p);
          setProdutoId('');
          setQtd('');
          setPreco('');
        }}
        disabled={disabled}
      >
        Adicionar
      </Button>
    </div>
  );
}
