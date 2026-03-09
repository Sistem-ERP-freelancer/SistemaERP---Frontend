import { CampoCnpjComConsulta } from '@/components/CampoCnpjComConsulta';
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
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
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
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
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
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { cleanDocument, formatCPF, formatTelefone } from '@/lib/validators';
import { ConsultaCnpjResponse } from '@/services/cnpj.service';
import { controleRocaService } from '@/services/controle-roca.service';
import { produtosService } from '@/services/produtos.service';
import type {
    CreateLancamentoProducaoRocaDto,
    CreateMeeiroRocaDto,
    CreateProdutorRocaDto,
    CreateRocaDto,
    MeeiroRoca,
    ProdutorRoca,
    RelatorioMeeiroResponse,
    Roca,
    RocaDetalhes,
    UpdateMeeiroRocaDto,
    UpdateProdutorRocaDto,
    UpdateRocaDto
} from '@/types/roca';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Archive,
    Building2,
    Calendar,
    Check,
    ChevronsUpDown,
    ClipboardList,
    Download,
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
    Printer,
    Sprout,
    Trash2,
    User,
    UserX,
    Users,
    X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
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
  const [incluirRocasInativas, setIncluirRocasInativas] = useState(false);
  const { data: rocas = [], isLoading: loadingRocas } = useQuery({
    queryKey: ['controle-roca', 'rocas', produtorIdRocas, incluirRocasInativas],
    queryFn: () =>
      controleRocaService.listarRocas(
        produtorIdRocas === '' ? undefined : Number(produtorIdRocas),
        incluirRocasInativas,
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
    ativo: true,
  });

  const updateRoca = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateRocaDto }) =>
      controleRocaService.atualizarRoca(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['controle-roca'] });
      toast.success('Roça atualizada com sucesso');
      setOpenEditRoca(false);
      setEditRoca(null);
      setOpenDeleteRoca(false);
      setRocaToDelete(null);
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
      setRocaToDelete(null);
      setOpenDeleteRoca(false);
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Não foi possível excluir a roça. Verifique se não há lançamentos vinculados.';
      toast.error(msg);
    },
  });

  const [rocaToDelete, setRocaToDelete] = useState<Roca | null>(null);
  const [openDeleteRoca, setOpenDeleteRoca] = useState(false);

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

  // Catálogo unificado de produtos (todos do sistema, incluindo os do Controle de Roça)
  const { data: produtosCatalogo = [], isLoading: loadingProdutosCatalogo } = useQuery({
    queryKey: ['controle-roca', 'produtos-catalogo'],
    queryFn: async () => {
      const resp = await produtosService.listar({ page: 1, limit: 1000, statusProduto: 'ATIVO' });
      return resp.data ?? resp.produtos ?? [];
    },
  });
  const [catalogPage, setCatalogPage] = useState(1);
  const CATALOG_PAGE_SIZE = 10;
  const totalCatalogPages =
    produtosCatalogo.length > 0 ? Math.ceil(produtosCatalogo.length / CATALOG_PAGE_SIZE) : 1;
  const produtosCatalogoPagina = produtosCatalogo.slice(
    (catalogPage - 1) * CATALOG_PAGE_SIZE,
    catalogPage * CATALOG_PAGE_SIZE,
  );
  const [openProduto, setOpenProduto] = useState(false);
  const [formProduto, setFormProduto] = useState<{
    codigo: string;
    nome: string;
    unidade_medida: string;
    produtorId: number | '';
  }>({
    codigo: '',
    nome: '',
    unidade_medida: 'KG',
    produtorId: '',
  });
  const createProduto = useMutation({
    mutationFn: async (data: { codigo?: string; nome: string; unidade_medida?: string; produtorId: number | '' }) => {
      const temProdutor = data.produtorId !== '' && data.produtorId !== undefined && Number(data.produtorId) > 0;
      if (temProdutor) {
        return controleRocaService.criarProdutoRoca({
          nome: data.nome,
          codigo: data.codigo?.trim() || undefined,
          unidade_medida: (data.unidade_medida as 'KG' | 'UN' | 'LT' | 'CX' | 'SC' | 'ARROBA') || 'KG',
          produtorId: Number(data.produtorId),
        });
      }
      const unidadeCatalogo = ['UN', 'KG', 'LT', 'CX'].includes(data.unidade_medida ?? '')
        ? (data.unidade_medida as 'UN' | 'KG' | 'LT' | 'CX')
        : 'UN';
      return produtosService.criar({
        nome: data.nome.trim(),
        unidade_medida: unidadeCatalogo,
        preco_custo: 0,
        preco_venda: 0,
        estoque_atual: 0,
        estoque_minimo: 0,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['controle-roca'] });
      queryClient.invalidateQueries({ queryKey: ['controle-roca', 'produtos-catalogo'] });
      toast.success(
        variables.produtorId !== '' && Number(variables.produtorId) > 0
          ? 'Produto cadastrado com sucesso'
          : 'Produto cadastrado no catálogo geral (disponível para qualquer produtor)'
      );
      setOpenProduto(false);
      setFormProduto({
        codigo: '',
        nome: '',
        unidade_medida: 'KG',
        produtorId: '',
      });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || 'Erro ao cadastrar produto');
    },
  });

  // Lançamentos
  const [produtorIdLanc, setProdutorIdLanc] = useState<number | ''>('');
  const [produtorLancPopoverOpen, setProdutorLancPopoverOpen] = useState(false);
  const [produtorLancSearchTerm, setProdutorLancSearchTerm] = useState('');
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
      controleRocaService.listarLancamentos({
        ...(produtorIdLanc === '' ? {} : { produtorId: Number(produtorIdLanc) }),
      }),
  });
  const [detalheLancamentoId, setDetalheLancamentoId] = useState<number | null>(null);
  const { data: detalheLancamento } = useQuery({
    queryKey: ['controle-roca', 'lancamento', detalheLancamentoId],
    queryFn: () =>
      detalheLancamentoId != null
        ? controleRocaService.obterLancamento(detalheLancamentoId)
        : Promise.resolve(null),
    enabled: detalheLancamentoId != null,
  });
  const updateLancamento = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: import('@/types/roca').UpdateLancamentoProducaoRocaDto;
    }) => controleRocaService.atualizarLancamento(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['controle-roca'] });
      toast.success('Lançamento atualizado');
      setEditLancamentoId(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || 'Erro ao atualizar');
    },
  });
  const deleteLancamento = useMutation({
    mutationFn: (id: number) => controleRocaService.excluirLancamento(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['controle-roca'] });
      toast.success('Lançamento excluído');
      setLancamentoParaExcluirId(null);
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || err?.message || 'Erro ao excluir lançamento.'
      );
    },
  });
  const [lancamentoParaExcluirId, setLancamentoParaExcluirId] = useState<number | null>(null);
  const [editLancamentoId, setEditLancamentoId] = useState<number | null>(null);
  const { data: editLancamento } = useQuery({
    queryKey: ['controle-roca', 'lancamento-edit', editLancamentoId],
    queryFn: () =>
      editLancamentoId != null
        ? controleRocaService.obterLancamento(editLancamentoId)
        : Promise.resolve(null),
    enabled: editLancamentoId != null,
  });
  const { data: rocasParaEdit = [] } = useQuery({
    queryKey: ['controle-roca', 'rocas', editLancamento?.produtorId],
    queryFn: () =>
      controleRocaService.listarRocas(
        editLancamento!.produtorId,
        true
      ),
    enabled: !!editLancamento?.produtorId,
  });
  const { data: meeirosParaEdit = [] } = useQuery({
    queryKey: ['controle-roca', 'meeiros-edit', editLancamento?.produtorId],
    queryFn: () =>
      controleRocaService.listarMeeiros(editLancamento!.produtorId),
    enabled: !!editLancamento?.produtorId,
  });
  const { data: produtosParaEdit = [] } = useQuery({
    queryKey: ['controle-roca', 'produtos-edit', editLancamento?.produtorId],
    queryFn: () =>
      controleRocaService.listarProdutosRoca(editLancamento!.produtorId),
    enabled: !!editLancamento?.produtorId,
  });
  const produtosDisponiveisEdit =
    produtosParaEdit.length > 0 ? produtosParaEdit : produtosCatalogo;
  const [editLancData, setEditLancData] = useState('');
  const [editLancRocaId, setEditLancRocaId] = useState<number | ''>('');
  const [editLancMeeiros, setEditLancMeeiros] = useState<
    { meeiroId: number; porcentagem?: number; nome?: string }[]
  >([]);
  const [editLancMeeiroSelecionado, setEditLancMeeiroSelecionado] = useState('');
  const [editLancProdutos, setEditLancProdutos] = useState<
    {
      produtoId: number;
      quantidade: number;
      preco_unitario: number;
      nome?: string;
      meeiros: { meeiroId: number; nome?: string; porcentagem: number }[];
    }[]
  >([]);
  useEffect(() => {
    if (!editLancamento || editLancamentoId == null) return;
    const dataStr =
      typeof editLancamento.data === 'string'
        ? editLancamento.data
        : (editLancamento.data as string).slice(0, 10);
    setEditLancData(dataStr);
    setEditLancRocaId(editLancamento.rocaId);
    const itens = editLancamento.itens ?? [];
    const meeirosUnicos = itens.flatMap((item) => item.meeiros ?? []);
    const seen = new Set<number>();
    const listaMeeiros = meeirosUnicos.filter((m) => {
      if (seen.has(m.meeiroId)) return false;
      seen.add(m.meeiroId);
      return true;
    });
    setEditLancMeeiros(
      listaMeeiros.map((m) => ({
        meeiroId: m.meeiroId,
        porcentagem: m.porcentagem,
        nome: m.meeiroNome,
      }))
    );
    setEditLancProdutos(
      itens.map((item) => ({
        produtoId: item.produtoId ?? 0,
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario ?? 0,
        nome: item.produto,
        meeiros: (item.meeiros ?? []).map((m) => ({
          meeiroId: m.meeiroId,
          nome: m.meeiroNome,
          porcentagem: m.porcentagem,
        })),
      }))
    );
  }, [editLancamento, editLancamentoId]);
  const [openLancamento, setOpenLancamento] = useState(false);
  const [produtoPreselecionadoLancamento, setProdutoPreselecionadoLancamento] = useState<{
    id: number;
    nome: string;
  } | null>(null);
  const [lancData, setLancData] = useState('');
  const [lancRocaId, setLancRocaId] = useState<number | ''>('');
  const [lancMeeiros, setLancMeeiros] = useState<
    { meeiroId: number; nome?: string; porcentagem_padrao: number }[]
  >([]);
  const [lancMeeiroSelecionado, setLancMeeiroSelecionado] = useState('');
  const [lancProdutos, setLancProdutos] = useState<
    {
      produtoId: number;
      quantidade: number;
      preco_unitario: number;
      nome?: string;
      meeiros: { meeiroId: number; nome?: string; porcentagem: number }[];
    }[]
  >([]);
  // Lista unificada: todos os produtos do sistema (roça + módulo Produtos) para usar no lançamento
  const produtosDisponiveisLancamento = produtosCatalogo;

  // Sempre que o modal de novo lançamento abrir, preencher a data com hoje (onOpenChange nem sempre é chamado ao abrir por código)
  useEffect(() => {
    if (openLancamento) {
      setLancData(new Date().toISOString().slice(0, 10));
    }
  }, [openLancamento]);

  // Produto pré-selecionado é passado ao AddProdutoLanc para preencher o Select; o pai limpa quando o filho avisa que consumiu
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
      setLancData(new Date().toISOString().slice(0, 10));
      setLancRocaId('');
      setLancMeeiros([]);
      setLancProdutos([]);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || 'Erro ao registrar lançamento');
    },
  });

  const handleAddMeeiro = (meeiroId: number | string) => {
    const idNum = Number(meeiroId);
    const m = meeirosParaLancamento.find((x) => Number(x.id) === idNum);
    if (!m) return;
    if (lancMeeiros.some((x) => Number(x.meeiroId) === idNum)) {
      toast.error('Meeiro já adicionado');
      return;
    }
    const novo = {
      meeiroId: Number(m.id),
      nome: m.nome,
      porcentagem_padrao: Number(m.porcentagem_padrao ?? 0),
    };
    setLancMeeiros((prev) => [...prev, novo]);
    setLancProdutos((prev) =>
      prev.map((p) => ({
        ...p,
        meeiros: [...p.meeiros, { meeiroId: novo.meeiroId, nome: novo.nome, porcentagem: novo.porcentagem_padrao }],
      }))
    );
    setLancMeeiroSelecionado('');
  };

  const handleRemoveMeeiroLanc = (meeiroId: number) => {
    setLancMeeiros((prev) => prev.filter((x) => x.meeiroId !== meeiroId));
    setLancProdutos((prev) =>
      prev.map((p) => ({
        ...p,
        meeiros: p.meeiros.filter((m) => m.meeiroId !== meeiroId),
      }))
    );
  };

  const handleAddProdutoLanc = (produtoId: number, qtd: number, preco: number) => {
    const p = produtosDisponiveisLancamento.find(
      (x) => Number(x.id) === Number(produtoId)
    ) as { id: number; nome?: string; unidade_medida?: string } | undefined;
    if (!p) {
      toast.error('Produto não encontrado na lista');
      return;
    }
    const meeirosDoProduto = lancMeeiros.map((m) => ({
      meeiroId: m.meeiroId,
      nome: m.nome,
      porcentagem: m.porcentagem_padrao,
    }));
    setLancProdutos((prev) => [
      ...prev,
      {
        produtoId: Number(p.id),
        quantidade: qtd,
        preco_unitario: preco,
        nome: p.nome ?? '—',
        meeiros: meeirosDoProduto,
      },
    ]);
    toast.success('Produto adicionado');
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
    const produtosComMeeiros = lancProdutos.filter((p) => p.meeiros.length > 0);
    if (produtosComMeeiros.length !== lancProdutos.length) {
      toast.error('Cada produto deve ter ao menos um meeiro (adicione meeiros antes dos produtos)');
      return;
    }
    createLancamento.mutate({
      data: lancData,
      rocaId: Number(lancRocaId),
      produtos: lancProdutos.map((p) => ({
        produtoId: p.produtoId,
        quantidade: p.quantidade,
        preco_unitario: p.preco_unitario,
        meeiros: p.meeiros.map((m) => ({
          meeiroId: m.meeiroId,
          porcentagem: Number(m.porcentagem ?? 0),
        })),
      })),
    });
  };

  // Relatório por meeiro
  const [relMeeiroId, setRelMeeiroId] = useState<number | ''>('');
  const [relDataInicial, setRelDataInicial] = useState('');
  const [relDataFinal, setRelDataFinal] = useState('');
  const [relResult, setRelResult] = useState<RelatorioMeeiroResponse | null>(null);
  const [relLoading, setRelLoading] = useState(false);
  const [relPdfDialogOpen, setRelPdfDialogOpen] = useState(false);
  const [relPdfLoadingAction, setRelPdfLoadingAction] = useState<'download' | 'print' | null>(null);
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
              <div className="flex items-center gap-2">
                <Switch
                  id="incluir-rocas-inativas"
                  checked={incluirRocasInativas}
                  onCheckedChange={setIncluirRocasInativas}
                />
                <Label htmlFor="incluir-rocas-inativas" className="cursor-pointer text-sm">
                  Exibir desativadas
                </Label>
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
                          <TableRow
                            key={r.id}
                            className={r.ativo === false ? 'opacity-60 bg-muted/30' : ''}
                          >
                            <TableCell className="font-medium">
                              {r.codigo}
                              {r.ativo === false && (
                                <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-normal text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                                  Desativada
                                </span>
                              )}
                            </TableCell>
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
                                        ativo: r.ativo ?? true,
                                      });
                                      setOpenEditRoca(true);
                                    }}
                                  >
                                    <Pencil className="w-4 h-4 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                  {r.ativo === false ? (
                                    <DropdownMenuItem
                                      onClick={() => {
                                        updateRoca.mutate({
                                          id: r.id,
                                          data: { ativo: true },
                                        });
                                      }}
                                      disabled={updateRoca.isPending}
                                    >
                                      <Check className="w-4 h-4 mr-2" />
                                      Ativar
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setRocaToDelete(r);
                                        setOpenDeleteRoca(true);
                                      }}
                                    >
                                      <UserX className="w-4 h-4 mr-2" />
                                      Desativar
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

          {/* Tab Produtos — lista unificada (todos os produtos do sistema) */}
          <TabsContent value="produtos" className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                Todos os produtos do sistema em uma única lista (incluindo os cadastrados no Controle de Roça).
              </p>
              <Button onClick={() => setOpenProduto(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Produto
              </Button>
            </div>

            <div className="bg-card border rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/40">
                <div>
                  <h3 className="text-sm font-semibold">Catálogo de produtos</h3>
                  <p className="text-xs text-muted-foreground">
                    Lista unificada — todos os produtos, independente de produtor.
                  </p>
                </div>
              </div>
              {loadingProdutosCatalogo ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Código / SKU</TableHead>
                        <TableHead>Unidade</TableHead>
                        <TableHead>Valor unit. prod</TableHead>
                        <TableHead>Estoque</TableHead>
                        <TableHead className="text-right w-[140px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {produtosCatalogo.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            Nenhum produto cadastrado. Use &quot;Novo Produto&quot; para cadastrar.
                          </TableCell>
                        </TableRow>
                      ) : (
                        produtosCatalogoPagina.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell className="font-medium">{p.nome}</TableCell>
                            <TableCell className="font-mono text-xs">{p.sku}</TableCell>
                            <TableCell>{p.unidade_medida || '—'}</TableCell>
                            <TableCell>{formatCurrency(p.preco_venda ?? 0)}</TableCell>
                            <TableCell>{p.estoque_atual ?? 0}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1.5"
                                onClick={() => {
                                  setProdutoPreselecionadoLancamento({
                                    id: p.id,
                                    nome: p.nome,
                                  });
                                  setTab('lancamentos');
                                  setOpenLancamento(true);
                                }}
                              >
                                <ClipboardList className="w-4 h-4" />
                                Fazer lançamento
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                  {produtosCatalogo.length > CATALOG_PAGE_SIZE && (
                    <div className="border-t px-4 py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-xs text-muted-foreground">
                        Mostrando{' '}
                        {produtosCatalogo.length > 0
                          ? (catalogPage - 1) * CATALOG_PAGE_SIZE + 1
                          : 0}{' '}
                        a{' '}
                        {Math.min(catalogPage * CATALOG_PAGE_SIZE, produtosCatalogo.length)} de{' '}
                        {produtosCatalogo.length}{' '}
                        produtos
                      </div>
                      <Pagination className="justify-end">
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                setCatalogPage((prev) => Math.max(1, prev - 1));
                              }}
                              className={catalogPage === 1 ? 'pointer-events-none opacity-50' : ''}
                            />
                          </PaginationItem>
                          <PaginationItem>
                            <PaginationNext
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                setCatalogPage((prev) =>
                                  Math.min(totalCatalogPages, prev + 1),
                                );
                              }}
                              className={
                                catalogPage === totalCatalogPages
                                  ? 'pointer-events-none opacity-50'
                                  : ''
                              }
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>

          {/* Tab Lançamentos */}
          <TabsContent value="lancamentos" className="space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Label>Produtor</Label>
                <Select
                  value={produtorIdLanc === '' ? 'todos' : String(produtorIdLanc)}
                  onValueChange={(v) =>
                    setProdutorIdLanc(v === 'todos' ? '' : Number(v))
                  }
                >
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="Todos os lançamentos" />
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
              <Button
                onClick={() => {
                  setLancData(new Date().toISOString().slice(0, 10));
                  setOpenLancamento(true);
                }}
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
                      <TableHead>Produtos</TableHead>
                      <TableHead>Qtde</TableHead>
                      <TableHead>Valor Unit.</TableHead>
                      <TableHead>Meeiro</TableHead>
                      <TableHead className="text-right">%</TableHead>
                      <TableHead className="text-right">Valor do meeiro</TableHead>
                      <TableHead className="text-right">Valor total do lançamento</TableHead>
                      <TableHead className="w-[70px] text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lancamentos.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                          Nenhum lançamento no período
                        </TableCell>
                      </TableRow>
                    ) : (
                      lancamentos.map((l) => {
                        const roca = rocasParaLancamento.find((r) => r.id === l.rocaId);
                        const itens = l.itens ?? [];
                        const meeirosList = itens.flatMap((i) => i.meeiros ?? []);
                        const seenM = new Set<number>();
                        const meeiros = meeirosList.filter((m) => {
                          if (seenM.has(m.meeiroId)) return false;
                          seenM.add(m.meeiroId);
                          return true;
                        });
                        return (
                          <TableRow key={l.id}>
                            <TableCell>{formatDate(l.data)}</TableCell>
                            <TableCell>{roca ? roca.nome : l.rocaId}</TableCell>
                            <TableCell className="max-w-[200px]">
                              {itens.length === 0
                                ? '—'
                                : (
                                    <>
                                      {itens.slice(0, 3).map((item, i) => (
                                        <div key={i} className="text-sm">
                                          {item.produto}
                                        </div>
                                      ))}
                                      {itens.length > 3 && (
                                        <div className="text-sm text-muted-foreground">…</div>
                                      )}
                                    </>
                                  )}
                            </TableCell>
                            <TableCell>
                              {itens.length === 0
                                ? '—'
                                : (
                                    <>
                                      {itens.slice(0, 3).map((item, i) => (
                                        <div key={i} className="text-sm">
                                          {item.quantidade}
                                        </div>
                                      ))}
                                      {itens.length > 3 && (
                                        <div className="text-sm text-muted-foreground">…</div>
                                      )}
                                    </>
                                  )}
                            </TableCell>
                            <TableCell>
                              {itens.length === 0
                                ? '—'
                                : (
                                    <>
                                      {itens.slice(0, 3).map((item, i) => (
                                        <div key={i} className="text-sm">
                                          {formatCurrency(item.preco_unitario ?? 0)}
                                        </div>
                                      ))}
                                      {itens.length > 3 && (
                                        <div className="text-sm text-muted-foreground">…</div>
                                      )}
                                    </>
                                  )}
                            </TableCell>
                            <TableCell className="max-w-[140px]">
                              {meeiros.length === 0
                                ? '—'
                                : (
                                    <>
                                      {meeiros.slice(0, 3).map((m, i) => (
                                        <div key={i} className="text-sm">
                                          {m.meeiroNome ?? `ID ${m.meeiroId}`}
                                        </div>
                                      ))}
                                      {meeiros.length > 3 && (
                                        <div className="text-sm text-muted-foreground">…</div>
                                      )}
                                    </>
                                  )}
                            </TableCell>
                            <TableCell className="text-right max-w-[100px]">
                              {meeiros.length === 0
                                ? '—'
                                : (
                                    <>
                                      {meeiros.slice(0, 3).map((m, i) => {
                                        const totalParte = meeirosList
                                          .filter((x) => x.meeiroId === m.meeiroId)
                                          .reduce((s, x) => s + (x.valor_parte ?? 0), 0);
                                        const totalGeralNum = Number(l.total_geral) || 1;
                                        const pct =
                                          totalGeralNum > 0
                                            ? Math.round((totalParte / totalGeralNum) * 100)
                                            : 0;
                                        return (
                                          <div key={i} className="text-sm">
                                            {pct}%
                                          </div>
                                        );
                                      })}
                                      {meeiros.length > 3 && (
                                        <div className="text-sm text-muted-foreground">…</div>
                                      )}
                                    </>
                                  )}
                            </TableCell>
                            <TableCell className="text-right max-w-[120px]">
                              {meeiros.length === 0
                                ? '—'
                                : (
                                    <>
                                      {meeiros.slice(0, 3).map((m, i) => {
                                        const totalParte = meeirosList
                                          .filter((x) => x.meeiroId === m.meeiroId)
                                          .reduce((s, x) => s + (x.valor_parte ?? 0), 0);
                                        return (
                                          <div key={i} className="text-sm">
                                            {formatCurrency(totalParte)}
                                          </div>
                                        );
                                      })}
                                      {meeiros.length > 3 && (
                                        <div className="text-sm text-muted-foreground">…</div>
                                      )}
                                    </>
                                  )}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(Number(l.total_geral))}
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
                                    onClick={() => setDetalheLancamentoId(l.id)}
                                  >
                                    <Eye className="w-4 h-4 mr-2" />
                                    Ver detalhes
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => setEditLancamentoId(l.id)}
                                  >
                                    <Pencil className="w-4 h-4 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => setLancamentoParaExcluirId(l.id)}
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

            {/* Dialog Ver detalhes do lançamento - mesmo design de Visualizar Produtor */}
            <Dialog
              open={detalheLancamentoId != null}
              onOpenChange={(open) => !open && setDetalheLancamentoId(null)}
            >
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-primary" />
                    Visualizar Lançamento
                  </DialogTitle>
                  <DialogDescription>
                    Informações completas do lançamento: data, roça, produtos e meeiros.
                  </DialogDescription>
                </DialogHeader>
                {detalheLancamentoId != null && (
                  <>
                    {!detalheLancamento ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <div className="space-y-8 mt-6">
                        {/* Informações do lançamento */}
                        <div className="space-y-6">
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-primary" />
                            Informações do Lançamento
                          </h3>
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3">
                              <Label className="text-sm text-muted-foreground">Data</Label>
                              <p className="font-medium text-base">
                                {formatDate(detalheLancamento.data)}
                              </p>
                            </div>
                            <div className="space-y-3">
                              <Label className="text-sm text-muted-foreground">Roça</Label>
                              <p className="font-medium text-base">
                                {rocasParaLancamento.find((r) => r.id === detalheLancamento.rocaId)?.nome ??
                                  detalheLancamento.rocaId}
                              </p>
                            </div>
                            <div className="space-y-3">
                              <Label className="text-sm text-muted-foreground">Total geral</Label>
                              <p className="font-medium text-base text-primary font-semibold">
                                {formatCurrency(Number(detalheLancamento.total_geral))}
                              </p>
                            </div>
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <Label className="text-sm text-muted-foreground">Status</Label>
                                <span
                                  className={`inline-block px-3 py-1.5 rounded-full text-sm font-medium ${
                                    detalheLancamento.ativo !== false
                                      ? 'bg-green-500/10 text-green-500'
                                      : 'bg-muted text-muted-foreground'
                                  }`}
                                >
                                  {detalheLancamento.ativo !== false ? 'ATIVO' : 'INATIVO'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Produtos e meeiros por item */}
                        {detalheLancamento.itens && detalheLancamento.itens.length > 0 && (
                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                              <Package className="w-5 h-5 text-primary" />
                              Produtos e participação dos meeiros
                            </h3>
                            <div className="border rounded-lg overflow-hidden">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Produto</TableHead>
                                    <TableHead>Qtd</TableHead>
                                    <TableHead className="text-right">Preço un.</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {detalheLancamento.itens.map((item, i) => (
                                    <React.Fragment key={i}>
                                      <TableRow>
                                        <TableCell className="font-medium">{item.produto}</TableCell>
                                        <TableCell>{item.quantidade}</TableCell>
                                        <TableCell className="text-right">
                                          {formatCurrency(item.preco_unitario ?? 0)}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                          {formatCurrency(item.valor_total ?? 0)}
                                        </TableCell>
                                      </TableRow>
                                      <TableRow>
                                        <TableCell colSpan={4} className="bg-muted/30 p-0">
                                          <div className="px-4 py-3 border-t border-border/50">
                                            <div className="grid grid-cols-[auto_1fr_1fr] gap-x-6 gap-y-1 text-sm text-muted-foreground items-baseline">
                                              <span className="font-medium text-foreground/80">Meeiro</span>
                                              <span className="font-medium text-foreground/80 text-right">Porcentagem</span>
                                              <span className="font-medium text-foreground/80 text-right">Valor</span>
                                              {(item.meeiros ?? []).length === 0 ? (
                                                <span className="col-span-3 text-muted-foreground">—</span>
                                              ) : (
                                                <>
                                                  {(item.meeiros ?? []).map((m, j) => (
                                                    <React.Fragment key={j}>
                                                      <span>{m.meeiroNome ?? m.meeiroId}</span>
                                                      <span className="text-right">{m.porcentagem}%</span>
                                                      <span className="text-right">{formatCurrency(m.valor_parte)}</span>
                                                    </React.Fragment>
                                                  ))}
                                                </>
                                              )}
                                            </div>
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                    </React.Fragment>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {detalheLancamento && detalheLancamentoId != null && (
                      <div className="flex justify-end gap-2 mt-6 pt-6 border-t">
                        <Button
                          variant="outline"
                          onClick={() => setDetalheLancamentoId(null)}
                        >
                          Fechar
                        </Button>
                        <Button
                          variant="default"
                          onClick={() => {
                            setDetalheLancamentoId(null);
                            setEditLancamentoId(detalheLancamentoId);
                          }}
                        >
                          <Pencil className="w-4 h-4 mr-2" />
                          Editar
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </DialogContent>
            </Dialog>

            {/* Dialog Editar lançamento */}
            <Dialog
              open={editLancamentoId != null}
              onOpenChange={(open) => !open && setEditLancamentoId(null)}
            >
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0">
                <DialogHeader className="px-6 pt-6 pb-4 space-y-1 border-b bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Pencil className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <DialogTitle className="text-xl">Editar lançamento</DialogTitle>
                      <DialogDescription className="mt-0.5">
                        Altere data, roça, meeiros e produtos. Salve para aplicar.
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>
                {editLancamentoId != null && (
                  <>
                    {!editLancamento ? (
                      <div className="flex justify-center py-16">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <div className="p-6 space-y-8">
                        {/* Seção: Informações do lançamento */}
                        <section className="space-y-4">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                              <Calendar className="h-4 w-4 text-primary" />
                            </div>
                            <h3 className="text-sm font-semibold text-foreground">
                              Informações do lançamento
                            </h3>
                          </div>
                          <div className="rounded-xl border bg-card p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Data</Label>
                              <Input
                                type="date"
                                value={editLancData}
                                onChange={(e) => setEditLancData(e.target.value)}
                                className="h-10"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Roça</Label>
                              <Select
                                value={editLancRocaId === '' ? '' : String(editLancRocaId)}
                                onValueChange={(v) =>
                                  setEditLancRocaId(v === '' ? '' : Number(v))
                                }
                              >
                                <SelectTrigger className="h-10">
                                  <SelectValue placeholder="Selecione a roça" />
                                </SelectTrigger>
                                <SelectContent>
                                  {rocasParaEdit.map((r) => (
                                    <SelectItem key={r.id} value={String(r.id)}>
                                      {r.nome}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </section>

                        {/* Seção: Meeiros participantes */}
                        <section className="space-y-4">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                              <Users className="h-4 w-4 text-primary" />
                            </div>
                            <h3 className="text-sm font-semibold text-foreground">
                              Meeiros participantes
                            </h3>
                          </div>
                          <p className="text-xs text-muted-foreground -mt-2">
                            A porcentagem de cada meeiro é definida ao lado de cada produto abaixo.
                          </p>
                          <div className="rounded-xl border bg-card p-4 space-y-4">
                            {editLancMeeiros.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {editLancMeeiros.map((m, idx) => (
                                  <div
                                    key={idx}
                                    className="inline-flex items-center gap-2 rounded-lg border bg-background pl-3 pr-1 py-1.5 text-sm"
                                  >
                                    <span className="font-medium">
                                      {m.nome ??
                                        meeirosParaEdit.find(
                                          (x) => Number(x.id) === Number(m.meeiroId)
                                        )?.nome ??
                                        m.meeiroId}
                                    </span>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 rounded-full hover:bg-destructive/10 hover:text-destructive"
                                      onClick={() => {
                                        setEditLancMeeiros((prev) =>
                                          prev.filter((_, i) => i !== idx)
                                        );
                                        setEditLancProdutos((prev) =>
                                          prev.map((p) => ({
                                            ...p,
                                            meeiros: (p.meeiros ?? []).filter(
                                              (mm) => mm.meeiroId !== m.meeiroId
                                            ),
                                          }))
                                        );
                                      }}
                                    >
                                      <UserX className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50">
                              <Select
                                value={editLancMeeiroSelecionado}
                                onValueChange={(v) => setEditLancMeeiroSelecionado(v)}
                              >
                                <SelectTrigger className="h-10 flex-1 min-w-[180px] max-w-[240px]">
                                  <SelectValue placeholder="Selecione um meeiro para adicionar" />
                                </SelectTrigger>
                                <SelectContent>
                                  {meeirosParaEdit
                                    .filter(
                                      (x) =>
                                        !editLancMeeiros.some(
                                          (m) => Number(m.meeiroId) === Number(x.id)
                                        )
                                    )
                                    .map((x) => (
                                      <SelectItem key={x.id} value={String(x.id)}>
                                        {x.nome} ({x.porcentagem_padrao}%)
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                className="h-10 shrink-0"
                                onClick={() => {
                                  const id = Number(editLancMeeiroSelecionado);
                                  const m = meeirosParaEdit.find((x) => Number(x.id) === id);
                                  if (!m) return;
                                  setEditLancMeeiros((prev) => [
                                    ...prev,
                                    {
                                      meeiroId: m.id,
                                      porcentagem: m.porcentagem_padrao,
                                      nome: m.nome,
                                    },
                                  ]);
                                  setEditLancProdutos((prev) =>
                                    prev.map((p) => ({
                                      ...p,
                                      meeiros: [
                                        ...(p.meeiros ?? []),
                                        {
                                          meeiroId: m.id,
                                          nome: m.nome,
                                          porcentagem: m.porcentagem_padrao,
                                        },
                                      ],
                                    }))
                                  );
                                  setEditLancMeeiroSelecionado('');
                                }}
                                disabled={!editLancMeeiroSelecionado}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Adicionar
                              </Button>
                            </div>
                          </div>
                        </section>

                        {/* Seção: Produtos */}
                        <section className="space-y-4">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                              <Package className="h-4 w-4 text-primary" />
                            </div>
                            <h3 className="text-sm font-semibold text-foreground">
                              Produtos (porcentagem por meeiro ao lado de cada um)
                            </h3>
                          </div>
                          <div className="rounded-xl border bg-card divide-y max-h-80 overflow-y-auto">
                            {editLancProdutos.map((item, idx) => {
                              const valorItem = item.quantidade * item.preco_unitario;
                              return (
                                <div
                                  key={idx}
                                  className="p-4 space-y-4 first:pt-4 last:pb-4 bg-background hover:bg-muted/20 transition-colors"
                                >
                                  <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div className="space-y-3 flex-1 min-w-0">
                                      <p className="font-semibold text-foreground truncate">
                                        {item.nome ?? item.produtoId}
                                      </p>
                                      <div className="flex flex-wrap items-center gap-4">
                                        <div className="flex items-center gap-2">
                                          <Label className="text-muted-foreground text-xs w-8">Qtd</Label>
                                          <Input
                                            type="number"
                                            min={0.001}
                                            step="any"
                                            className="w-20 h-9 text-right tabular-nums"
                                            value={item.quantidade}
                                            onChange={(e) => {
                                              const v = parseFloat(e.target.value.replace(',', '.')) || 0;
                                              setEditLancProdutos((prev) =>
                                                prev.map((p, i) =>
                                                  i !== idx ? p : { ...p, quantidade: v }
                                                )
                                              );
                                            }}
                                          />
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Label className="text-muted-foreground text-xs">Preço un.</Label>
                                          <Input
                                            type="number"
                                            min={0}
                                            step="0.01"
                                            className="w-24 h-9 text-right tabular-nums"
                                            value={item.preco_unitario}
                                            onChange={(e) => {
                                              const v = parseFloat(e.target.value.replace(',', '.')) || 0;
                                              setEditLancProdutos((prev) =>
                                                prev.map((p, i) =>
                                                  i !== idx ? p : { ...p, preco_unitario: v }
                                                )
                                              );
                                            }}
                                          />
                                        </div>
                                        <span className="text-sm font-medium text-muted-foreground">
                                          Total: {formatCurrency(valorItem)}
                                        </span>
                                      </div>
                                    </div>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                                      onClick={() =>
                                        setEditLancProdutos((prev) =>
                                          prev.filter((_, i) => i !== idx)
                                        )
                                      }
                                    >
                                      Remover
                                    </Button>
                                  </div>
                                  {(item.meeiros ?? []).length > 0 && (
                                    <div className="rounded-lg bg-muted/30 p-3 space-y-2">
                                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Porcentagem por meeiro</p>
                                      <div className="flex flex-wrap gap-4">
                                        {(item.meeiros ?? []).map((mm) => {
                                          const valorParte = (valorItem * (mm.porcentagem ?? 0)) / 100;
                                          return (
                                            <div
                                              key={mm.meeiroId}
                                              className="flex items-center gap-2 text-sm"
                                            >
                                              <span className="text-muted-foreground min-w-[70px]">
                                                {mm.nome ?? mm.meeiroId}:
                                              </span>
                                              <Input
                                                type="number"
                                                min={0}
                                                max={100}
                                                placeholder="0"
                                                className="w-20 h-9 text-center tabular-nums"
                                                value={mm.porcentagem !== undefined && mm.porcentagem !== null && mm.porcentagem !== 0 ? String(mm.porcentagem) : ''}
                                                onChange={(e) => {
                                                  const v =
                                                    e.target.value === '' ? 0 : Number(e.target.value);
                                                  setEditLancProdutos((prev) =>
                                                    prev.map((p, i) =>
                                                      i !== idx
                                                        ? p
                                                        : {
                                                            ...p,
                                                            meeiros: (p.meeiros ?? []).map((mmm) =>
                                                              mmm.meeiroId === mm.meeiroId
                                                                ? { ...mmm, porcentagem: v }
                                                                : mmm
                                                            ),
                                                          }
                                                    )
                                                  );
                                                }}
                                              />
                                              <span className="text-muted-foreground">% = {formatCurrency(valorParte)}</span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-4">
                            <AddProdutoLanc
                              produtos={produtosDisponiveisEdit}
                              onAdd={(produtoId, qtd, preco) => {
                                const p = produtosDisponiveisEdit.find(
                                  (x) => Number(x.id) === Number(produtoId)
                                ) as { id: number; nome?: string } | undefined;
                                const meeirosDoProduto = editLancMeeiros.map((m) => ({
                                  meeiroId: m.meeiroId,
                                  nome: m.nome,
                                  porcentagem: Number(m.porcentagem ?? 0),
                                }));
                                setEditLancProdutos((prev) => [
                                  ...prev,
                                  {
                                    produtoId: Number(produtoId),
                                    quantidade: qtd,
                                    preco_unitario: preco,
                                    nome: p?.nome ?? '—',
                                    meeiros: meeirosDoProduto,
                                  },
                                ]);
                              }}
                              disabled={editLancMeeiros.length === 0}
                            />
                          </div>
                          <div className="flex justify-end rounded-xl border bg-primary/5 px-4 py-3">
                            <p className="text-sm font-semibold">
                              Total geral:{' '}
                              <span className="text-primary">
                                {formatCurrency(
                                  editLancProdutos.reduce(
                                    (s, i) => s + i.quantidade * i.preco_unitario,
                                    0
                                  )
                                )}
                              </span>
                            </p>
                          </div>
                        </section>
                        <DialogFooter className="gap-3 pt-4 sm:pt-6 border-t px-6 pb-6 -mx-0">
                          <Button
                            variant="outline"
                            onClick={() => setEditLancamentoId(null)}
                          >
                            Cancelar
                          </Button>
                          <Button
                            onClick={() => {
                              if (!editLancData || !editLancRocaId) {
                                toast.error('Preencha data e roça');
                                return;
                              }
                              if (editLancMeeiros.length === 0) {
                                toast.error('Adicione ao menos um meeiro');
                                return;
                              }
                              if (editLancProdutos.length === 0) {
                                toast.error('Adicione ao menos um produto');
                                return;
                              }
                              const produtosComMeeiros = editLancProdutos.filter(
                                (p) => p.meeiros?.length > 0
                              );
                              if (produtosComMeeiros.length !== editLancProdutos.length) {
                                toast.error('Cada produto deve ter ao menos um meeiro');
                                return;
                              }
                              const produtosValidos = editLancProdutos.filter(
                                (p) => p.produtoId > 0 && (p.meeiros?.length ?? 0) > 0
                              );
                              if (produtosValidos.length === 0) {
                                toast.error('Adicione ao menos um produto válido com meeiros');
                                return;
                              }
                              updateLancamento.mutate({
                                id: editLancamentoId,
                                data: {
                                  data: editLancData,
                                  rocaId: Number(editLancRocaId),
                                  produtos: produtosValidos.map((p) => ({
                                    produtoId: p.produtoId,
                                    quantidade: p.quantidade,
                                    preco_unitario: p.preco_unitario,
                                    meeiros: (p.meeiros ?? []).map((m) => ({
                                      meeiroId: m.meeiroId,
                                      porcentagem: Number(m.porcentagem ?? 0),
                                    })),
                                  })),
                                },
                              });
                            }}
                            disabled={updateLancamento.isPending}
                          >
                            {updateLancamento.isPending && (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            )}
                            Salvar
                          </Button>
                        </DialogFooter>
                      </div>
                    )}
                  </>
                )}
              </DialogContent>
            </Dialog>
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
                Pré visualização
              </Button>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (relMeeiroId === '') {
                      toast.error('Selecione um meeiro');
                      return;
                    }
                    setRelPdfDialogOpen(true);
                  }}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Gerar relatório em PDF
                </Button>
              </div>
            </div>
            {relMeeiroId !== '' && (() => {
              const meeiroSel = meeirosParaRelatorio.find((m) => Number(m.id) === Number(relMeeiroId));
              if (!meeiroSel) return null;
              return (
                <p className="text-sm text-muted-foreground px-1">
                  Meeiro selecionado: <span className="font-medium text-foreground">{meeiroSel.nome}</span>
                </p>
              );
            })()}

            {/* Dialog: Imprimir ou Baixar PDF do Relatório por Meeiro */}
            <Dialog open={relPdfDialogOpen} onOpenChange={setRelPdfDialogOpen}>
              <DialogContent className="max-w-sm p-0 overflow-hidden">
                <DialogHeader className="flex flex-row items-start gap-3 space-y-0 px-6 pt-5 pb-4 border-b bg-card">
                  <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <DialogTitle className="text-base font-semibold text-foreground">
                      Relatório por Meeiro
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                      Baixar o relatório em PDF ou abrir para impressão.
                    </DialogDescription>
                  </div>
                </DialogHeader>

                <div className="px-6 py-5">
                  <div className="rounded-xl border bg-muted/40 p-4 space-y-3">
                    <p className="text-sm font-medium text-muted-foreground">Ações do relatório</p>
                    <div className="flex flex-col gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="justify-start gap-2 bg-background hover:bg-accent"
                        disabled={relPdfLoadingAction !== null}
                        onClick={async () => {
                          try {
                            setRelPdfLoadingAction('download');
                            await controleRocaService.downloadRelatorioMeeiroPdf({
                              meeiroId: Number(relMeeiroId),
                              dataInicial: relDataInicial || undefined,
                              dataFinal: relDataFinal || undefined,
                            });
                            toast.success('PDF baixado');
                            setRelPdfDialogOpen(false);
                          } catch (err: any) {
                            toast.error(err?.response?.data?.message || err?.message || 'Erro ao gerar PDF');
                          } finally {
                            setRelPdfLoadingAction(null);
                          }
                        }}
                      >
                        <Download className="w-4 h-4" />
                        <span className="text-sm">
                          {relPdfLoadingAction === 'download' ? 'Baixando...' : 'Baixar PDF'}
                        </span>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="justify-start gap-2 bg-background hover:bg-accent"
                        disabled={relPdfLoadingAction !== null}
                        onClick={async () => {
                          try {
                            setRelPdfLoadingAction('print');
                            await controleRocaService.printRelatorioMeeiroPdf({
                              meeiroId: Number(relMeeiroId),
                              dataInicial: relDataInicial || undefined,
                              dataFinal: relDataFinal || undefined,
                            });
                            setRelPdfDialogOpen(false);
                          } catch (err: any) {
                            toast.error(err?.response?.data?.message || err?.message || 'Erro ao abrir relatório.');
                          } finally {
                            setRelPdfLoadingAction(null);
                          }
                        }}
                      >
                        <Printer className="w-4 h-4" />
                        <span className="text-sm">
                          {relPdfLoadingAction === 'print' ? 'Abrindo...' : 'Imprimir'}
                        </span>
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            {relResult && (
              <div className="bg-card border rounded-xl overflow-hidden space-y-4">
                {relMeeiroId !== '' && (() => {
                  const meeiroSel = meeirosParaRelatorio.find((m) => Number(m.id) === Number(relMeeiroId));
                  if (!meeiroSel) return null;
                  const meeiroLabel = meeiroSel.nome;
                  return (
                    <div className="p-4 pb-0">
                      <p className="text-sm text-muted-foreground">Meeiro</p>
                      <p className="text-base font-semibold text-foreground">{meeiroLabel}</p>
                    </div>
                  );
                })()}
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
                      <TableHead>Meeiro</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Preço unit.</TableHead>
                      <TableHead>Valor total</TableHead>
                      <TableHead className="text-right">Porcentagem</TableHead>
                      <TableHead className="text-right">Valor a receber</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {relResult.linhas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-6">
                          Nenhum lançamento no período
                        </TableCell>
                      </TableRow>
                    ) : (
                      relResult.linhas.map((linha, idx) => {
                        const meeiroSel = meeirosParaRelatorio.find((m) => Number(m.id) === Number(relMeeiroId));
                        const meeiroNome = meeiroSel ? meeiroSel.nome : '-';
                        return (
                          <TableRow key={idx}>
                            <TableCell>{formatDate(linha.data)}</TableCell>
                            <TableCell>{meeiroNome}</TableCell>
                            <TableCell>{linha.produto}</TableCell>
                            <TableCell>{linha.quantidade}</TableCell>
                            <TableCell>{formatCurrency(linha.preco_unitario)}</TableCell>
                            <TableCell>{formatCurrency(linha.valor_total)}</TableCell>
                            <TableCell className="text-right">{linha.porcentagem ?? 0}%</TableCell>
                            <TableCell className="text-right">{formatCurrency(Number(linha.valorParte ?? linha.valor_parte ?? 0))}</TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Dialog Novo Produtor - mesmo design do Novo Cliente: tipo PF/PJ, CPF/CNPJ separados, consulta CNPJ */}
        <Dialog
        open={openProdutor}
        onOpenChange={(open) => {
          setOpenProdutor(open);
          if (!open) {
            setFormProdutor({
              nome: '',
              codigo: '',
              tipo_pessoa: 'pessoa_fisica',
              cpf: '',
              telefone: '',
              endereco: '',
              nome_razao: '',
              cnpj: '',
            });
          }
        }}
      >
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
        <Dialog
        open={openRoca}
        onOpenChange={(open) => {
          setOpenRoca(open);
          if (!open) setFormRoca({ produtorId: '', nome: '', codigo: '', localizacao: '' });
        }}
      >
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
                          ativo: detailRoca.ativo ?? true,
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
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <Label className="text-base">Roça ativa</Label>
                      <p className="text-sm text-muted-foreground">
                        Roças desativadas não aparecem na listagem. Ative para exibir novamente.
                      </p>
                    </div>
                    <Switch
                      checked={formEditRoca.ativo ?? true}
                      onCheckedChange={(checked) =>
                        setFormEditRoca((p) => ({ ...p, ativo: checked }))
                      }
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
                      ativo: formEditRoca.ativo,
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

        {/* Modal de confirmação para excluir lançamento */}
        <AlertDialog
          open={lancamentoParaExcluirId != null}
          onOpenChange={(open) => {
            if (!open) setLancamentoParaExcluirId(null);
          }}
        >
          <AlertDialogContent className="max-w-md rounded-2xl border shadow-xl">
            <AlertDialogHeader>
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                  <Trash2 className="h-6 w-6 text-destructive" />
                </div>
                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <AlertDialogTitle className="text-xl">
                    Excluir lançamento?
                  </AlertDialogTitle>
                  <AlertDialogDescription asChild>
                    <p className="text-sm text-muted-foreground">
                      Esta ação não pode ser desfeita. O lançamento será removido permanentemente.
                    </p>
                  </AlertDialogDescription>
                </div>
              </div>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex gap-2 sm:gap-2">
              <AlertDialogCancel className="mt-4 sm:mt-0">
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  if (lancamentoParaExcluirId != null) {
                    deleteLancamento.mutate(lancamentoParaExcluirId);
                  }
                }}
                disabled={deleteLancamento.isPending || lancamentoParaExcluirId == null}
                className="bg-destructive text-white hover:bg-destructive/90"
              >
                {deleteLancamento.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Modal de confirmação para desativar roça */}
        <AlertDialog
          open={openDeleteRoca}
          onOpenChange={(open) => {
            setOpenDeleteRoca(open);
            if (!open) setRocaToDelete(null);
          }}
        >
          <AlertDialogContent className="max-w-md rounded-2xl border shadow-xl">
            <AlertDialogHeader>
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                  <Archive className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <AlertDialogTitle className="text-xl">
                    Desativar roça?
                  </AlertDialogTitle>
                  <AlertDialogDescription asChild>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      {rocaToDelete && (
                        <p>
                          A roça <strong className="font-semibold text-foreground">{rocaToDelete.nome}</strong>{' '}
                          (<span className="font-mono">{rocaToDelete.codigo}</span>) será desativada e não aparecerá mais na listagem.
                        </p>
                      )}
                      <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                        Você pode reativá-la depois pela opção Editar, marcando a roça como ativa novamente.
                      </p>
                      <p>Tem certeza que deseja desativar?</p>
                    </div>
                  </AlertDialogDescription>
                </div>
              </div>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex gap-2 sm:gap-2">
              <AlertDialogCancel className="mt-4 sm:mt-0">
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  if (rocaToDelete) {
                    updateRoca.mutate({
                      id: rocaToDelete.id,
                      data: { ativo: false },
                    });
                  }
                }}
                disabled={updateRoca.isPending || !rocaToDelete}
                className="bg-amber-600 text-white hover:bg-amber-700"
              >
                {updateRoca.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Desativando...
                  </>
                ) : (
                  <>
                    <Archive className="mr-2 h-4 w-4" />
                    Desativar roça
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Dialog Novo Meeiro - mesmo design de criar cliente */}
        <Dialog
        open={openMeeiro}
        onOpenChange={(open) => {
          setOpenMeeiro(open);
          if (!open) {
            setFormMeeiro({
              produtorId: '',
              codigo: '',
              nome: '',
              cpf: '',
              telefone: '',
              endereco: '',
              porcentagem_padrao: '',
            });
          }
        }}
      >
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
        <Dialog
        open={openProduto}
        onOpenChange={(open) => {
          setOpenProduto(open);
          if (!open) {
            setProdutorIdProduto('');
            setFormProduto({ produtorId: '', nome: '', codigo: '', unidade_medida: 'KG' });
          }
        }}
      >
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Novo Produto</DialogTitle>
              <DialogDescription>
                Cadastre um produto no catálogo geral (disponível para qualquer produtor) ou vincule a um produtor específico. Produtos do catálogo podem ser usados em qualquer lançamento.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Onde cadastrar</Label>
                <Select
                  value={formProduto.produtorId === '' ? 'catalogo' : String(formProduto.produtorId)}
                  onValueChange={(v) =>
                    setFormProduto((p) => ({
                      ...p,
                      produtorId: v === 'catalogo' ? '' : Number(v),
                      codigo: '',
                      nome: p.nome,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="catalogo">
                      Catálogo geral (qualquer produtor)
                    </SelectItem>
                    {produtores.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.codigo} – {p.nome_razao}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {formProduto.produtorId === ''
                    ? 'O produto ficará disponível para todos os produtores nos lançamentos.'
                    : 'O produto será vinculado a este produtor e criado no catálogo.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Código do produto</Label>
                  <Input
                    value={formProduto.codigo ?? ''}
                    onChange={(e) =>
                      setFormProduto((p) => ({ ...p, codigo: e.target.value }))
                    }
                    placeholder="Deixe em branco para gerar automaticamente"
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
                  if (!formProduto.nome?.trim()) {
                    toast.error('Nome do produto é obrigatório');
                    return;
                  }
                  createProduto.mutate({
                    ...formProduto,
                    codigo: formProduto.codigo?.trim() || undefined,
                  });
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
        <Dialog
        open={openLancamento}
        onOpenChange={(open) => {
          setOpenLancamento(open);
          if (open) {
            setLancData(new Date().toISOString().slice(0, 10));
          } else {
            setProdutoPreselecionadoLancamento(null);
            setProdutorIdLanc('');
            setProdutorLancPopoverOpen(false);
            setProdutorLancSearchTerm('');
            setLancData('');
            setLancRocaId('');
            setLancMeeiros([]);
            setLancMeeiroSelecionado('');
            setLancProdutos([]);
          }
        }}
      >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Novo Lançamento de Produção</DialogTitle>
              <DialogDescription>
                Registre a produção: selecione roça, data, meeiros e produtos com quantidade e preço.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4 min-w-0">
              {/* Linha 1: Produtor, Data, Roça — grid alinhado */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 rounded-lg border border-border/60 bg-muted/10 p-3">
                <div className="space-y-2 min-w-0">
                  <Label>Produtor</Label>
                  <Popover open={produtorLancPopoverOpen} onOpenChange={setProdutorLancPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={produtorLancPopoverOpen}
                        className="w-full justify-between font-normal min-h-10"
                      >
                        <span className="truncate">
                          {produtorIdLanc !== ''
                            ? (() => {
                                const p = produtores.find((x) => x.id === produtorIdLanc);
                                return p ? `${p.codigo} – ${p.nome_razao}` : 'Selecione';
                              })()
                            : 'Selecione o produtor'}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] max-w-[400px] p-0" align="start">
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder="Buscar por código ou nome do produtor..."
                          value={produtorLancSearchTerm}
                          onValueChange={setProdutorLancSearchTerm}
                        />
                        <CommandList>
                          <CommandEmpty>Nenhum produtor encontrado.</CommandEmpty>
                          <CommandGroup>
                            {produtores
                              .filter((p) => {
                                if (!produtorLancSearchTerm.trim()) return true;
                                const term = produtorLancSearchTerm.toLowerCase();
                                return (
                                  (p.codigo?.toLowerCase().includes(term) ?? false) ||
                                  (p.nome_razao?.toLowerCase().includes(term) ?? false)
                                );
                              })
                              .map((p) => (
                                <CommandItem
                                  key={p.id}
                                  value={`${p.codigo ?? ''} ${p.nome_razao ?? ''}`.trim()}
                                  onSelect={() => {
                                    setProdutorIdLanc(p.id);
                                    setLancRocaId('');
                                    setLancMeeiros([]);
                                    setLancProdutos([]);
                                    setProdutorLancPopoverOpen(false);
                                    setProdutorLancSearchTerm('');
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      'mr-2 h-4 w-4',
                                      produtorIdLanc === p.id ? 'opacity-100' : 'opacity-0'
                                    )}
                                  />
                                  {p.codigo} – {p.nome_razao}
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2 min-w-0">
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={lancData}
                    onChange={(e) => setLancData(e.target.value)}
                    className="w-full min-h-10"
                  />
                </div>
                <div className="space-y-2 min-w-0">
                  <Label>Roça</Label>
                  <Select
                    value={lancRocaId === '' ? '' : String(lancRocaId)}
                    onValueChange={(v) => setLancRocaId(v === '' ? '' : Number(v))}
                    disabled={!produtorIdLanc}
                  >
                    <SelectTrigger className="w-full min-h-10">
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

              {/* Meeiros participantes (porcentagem é definida por produto abaixo) */}
              <div className="space-y-2 rounded-lg border border-border/60 bg-muted/10 p-3">
                <Label className="text-sm font-medium">Meeiros participantes</Label>
                <p className="text-xs text-muted-foreground">
                  Adicione os meeiros que participaram do lançamento. A porcentagem de cada um é definida ao lado de cada produto.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={lancMeeiroSelecionado}
                    onValueChange={(v) => {
                      if (!v) return;
                      handleAddMeeiro(v);
                    }}
                    disabled={!produtorIdLanc}
                  >
                    <SelectTrigger className="w-full sm:w-[240px] min-h-9">
                      <SelectValue placeholder="Selecione o meeiro" />
                    </SelectTrigger>
                    <SelectContent>
                      {meeirosParaLancamento.map((m) => {
                        const jaAdicionado = lancMeeiros.some(
                          (x) => Number(x.meeiroId) === Number(m.id)
                        );
                        return (
                          <SelectItem
                            key={m.id}
                            value={String(m.id)}
                            disabled={jaAdicionado}
                          >
                            {m.codigo} – {m.nome}
                            {jaAdicionado ? ' (já adicionado)' : ''}
                          </SelectItem>
                        );
                      })}
                      {meeirosParaLancamento.length === 0 && (
                        <div className="px-3 py-2 text-xs text-muted-foreground">
                          Nenhum meeiro cadastrado para este produtor
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  {lancMeeiros.length > 0 && (
                    <span className="text-xs text-muted-foreground hidden sm:inline">Adicionados:</span>
                  )}
                  {lancMeeiros.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {lancMeeiros.map((m) => (
                        <span
                          key={m.meeiroId}
                          className="inline-flex items-center gap-1.5 rounded-md border bg-background px-2.5 py-1.5 text-sm font-medium shadow-sm"
                        >
                          <span className="truncate max-w-[120px]">{m.nome ?? `Meeiro ${m.meeiroId}`}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 shrink-0 rounded-full hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleRemoveMeeiroLanc(m.meeiroId)}
                            aria-label={`Remover ${m.nome ?? m.meeiroId}`}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2 rounded-lg border border-border/60 bg-muted/10 p-3">
                <Label className="text-sm font-medium">Produtos (quantidade, preço e % por meeiro)</Label>
                <div className="rounded-md border border-border/40 bg-background p-3 space-y-3 max-h-[340px] overflow-y-auto min-h-[72px]">
                  {lancProdutos.map((item, idx) => {
                    const valorItem = item.quantidade * item.preco_unitario;
                    return (
                      <div
                        key={idx}
                        className="rounded-md border border-border/60 p-3 space-y-2 bg-background"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 gap-x-4 items-center text-sm">
                          <span className="font-medium truncate" title={String(item.nome ?? item.produtoId)}>
                            {item.nome ?? item.produtoId}
                          </span>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span className="tabular-nums">Qtd: {item.quantidade}</span>
                            <span className="tabular-nums">{formatCurrency(item.preco_unitario)}/un</span>
                            <span className="font-medium tabular-nums">{formatCurrency(valorItem)}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="shrink-0"
                              onClick={() =>
                                setLancProdutos((prev) => prev.filter((_, i) => i !== idx))
                              }
                            >
                              Remover
                            </Button>
                          </div>
                        </div>
                        {item.meeiros.length > 0 && (
                          <div className="space-y-2 pt-2 border-t border-border/40">
                            <p className="text-xs font-medium text-muted-foreground">Porcentagem por meeiro (sobre o valor deste produto)</p>
                            {item.meeiros.map((m) => {
                              const pct = Number(m.porcentagem ?? 0);
                              const valorParte = (valorItem * pct) / 100;
                              return (
                                <div
                                  key={m.meeiroId}
                                  className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm"
                                >
                                  <span className="font-medium text-foreground w-24 shrink-0">
                                    {m.nome ?? `Meeiro ${m.meeiroId}`}:
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    <Input
                                      type="number"
                                      min={0}
                                      max={100}
                                      placeholder="0"
                                      className="w-20 h-9 text-center tabular-nums"
                                      value={m.porcentagem !== undefined && m.porcentagem !== null && m.porcentagem !== 0 ? String(m.porcentagem) : ''}
                                      onChange={(e) => {
                                        const v = e.target.value === '' ? 0 : Number(e.target.value);
                                        setLancProdutos((prev) =>
                                          prev.map((p, i) =>
                                            i !== idx
                                              ? p
                                              : {
                                                  ...p,
                                                  meeiros: p.meeiros.map((mm) =>
                                                    mm.meeiroId === m.meeiroId
                                                      ? { ...mm, porcentagem: v }
                                                      : mm
                                                  ),
                                                }
                                          )
                                        );
                                      }}
                                    />
                                    <span className="text-muted-foreground w-4">%</span>
                                  </div>
                                  <span className="text-muted-foreground tabular-nums whitespace-nowrap">
                                    = {formatCurrency(valorParte)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <AddProdutoLanc
                    produtos={produtosDisponiveisLancamento}
                    onAdd={handleAddProdutoLanc}
                    disabled={!produtorIdLanc || lancMeeiros.length === 0}
                    produtoPreselecionado={produtoPreselecionadoLancamento}
                    onProdutoPreselecionadoConsumido={() => setProdutoPreselecionadoLancamento(null)}
                  />
                </div>
                <div className="flex items-center justify-between gap-4 pt-3 border-t border-border/60">
                  <p className="text-sm text-muted-foreground">Total geral</p>
                  <p className="text-base font-semibold tabular-nums">{formatCurrency(totalGeralLanc)}</p>
                </div>
              </div>
            </div>
            <DialogFooter className="border-t pt-4 mt-2">
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
  produtoPreselecionado,
  onProdutoPreselecionadoConsumido,
}: {
  produtos: Array<{ id: number; nome?: string; unidade_medida?: string }>;
  onAdd: (produtoId: number, quantidade: number, preco_unitario: number) => void;
  disabled: boolean;
  produtoPreselecionado?: { id: number; nome: string } | null;
  onProdutoPreselecionadoConsumido?: () => void;
}) {
  const [produtoId, setProdutoId] = useState<number | ''>('');
  const [qtd, setQtd] = useState('');
  const [preco, setPreco] = useState('');
  const [produtoPopoverOpen, setProdutoPopoverOpen] = useState(false);
  const [produtoSearchTerm, setProdutoSearchTerm] = useState('');

  useEffect(() => {
    if (produtoPreselecionado) {
      setProdutoId(produtoPreselecionado.id);
      setQtd('1');
      setPreco('0');
      onProdutoPreselecionadoConsumido?.();
    }
  }, [produtoPreselecionado, onProdutoPreselecionadoConsumido]);

  const produtosFiltrados = produtos.filter((p) => {
    if (!produtoSearchTerm.trim()) return true;
    const term = produtoSearchTerm.toLowerCase();
    const nome = (p.nome ?? '').toLowerCase();
    const unidade = (p.unidade_medida ?? '').toLowerCase();
    return nome.includes(term) || unidade.includes(term);
  });

  if (produtos.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">
        Nenhum produto disponível. Cadastre produtos na aba Produtos ou no catálogo geral.
      </p>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto] gap-2 pt-2 items-end">
      <Popover open={produtoPopoverOpen} onOpenChange={(open) => { setProdutoPopoverOpen(open); if (!open) setProdutoSearchTerm(''); }}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={produtoPopoverOpen}
            disabled={disabled}
            className="w-full min-w-0 sm:min-w-[200px] justify-between font-normal h-9"
          >
            <span className="truncate">
              {produtoId !== ''
                ? (() => {
                    const p = produtos.find((x) => x.id === produtoId);
                    return p ? `${p.nome ?? '—'} (${p.unidade_medida ?? 'UN'})` : 'Selecione o produto';
                  })()
                : 'Selecione o produto'}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] max-w-[360px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Buscar por nome ou unidade..."
              value={produtoSearchTerm}
              onValueChange={setProdutoSearchTerm}
            />
            <CommandList>
              <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
              <CommandGroup>
                {produtosFiltrados.map((p) => (
                  <CommandItem
                    key={p.id}
                    value={`${p.nome ?? ''} ${p.unidade_medida ?? ''}`.trim()}
                    onSelect={() => {
                      setProdutoId(p.id);
                      setProdutoPopoverOpen(false);
                      setProdutoSearchTerm('');
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        produtoId === p.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {p.nome ?? '—'} ({p.unidade_medida ?? 'UN'})
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <Input
        type="number"
        min={0.001}
        step="any"
        placeholder="Qtd"
        value={qtd}
        onChange={(e) => setQtd(e.target.value)}
        className="w-20 shrink-0"
        disabled={disabled}
      />
      <Input
        type="number"
        min={0}
        step="0.01"
        placeholder="Preço un."
        value={preco}
        onChange={(e) => setPreco(e.target.value)}
        className="w-24 shrink-0"
        disabled={disabled}
      />
      <Button
        type="button"
        size="sm"
        onClick={() => {
          if (!produtoId) {
            toast.error('Selecione um produto');
            return;
          }
          if (!qtd?.trim() || !preco?.trim()) {
            toast.error('Informe quantidade e preço unitário');
            return;
          }
          const q = parseFloat(qtd.replace(',', '.'));
          const p = parseFloat(preco.replace(',', '.'));
          if (Number.isNaN(q) || Number.isNaN(p)) {
            toast.error('Quantidade e preço devem ser números');
            return;
          }
          if (q <= 0) {
            toast.error('Quantidade deve ser maior que zero');
            return;
          }
          if (p < 0) {
            toast.error('Preço não pode ser negativo');
            return;
          }
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
