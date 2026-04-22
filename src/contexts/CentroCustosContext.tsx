import { useAuth } from '@/contexts/AuthContext';
import {
  centroCustoService,
  type ApiCentroCustoDespesa,
  type ApiCentroCustoTipo,
} from '@/services/centro-custo.service';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export const CENTRO_CUSTO_PAGE_SIZE = 15;

const QK_RESUMO = ['centro-custo', 'resumo'] as const;
const QK_TIPOS_OPCOES = ['centro-custo', 'tipos-opcoes'] as const;
const qkTiposPagina = (page: number) => ['centro-custo', 'tipos', page] as const;
const qkDespesasPagina = (page: number) =>
  ['centro-custo', 'despesas', page] as const;

export type CentroCustoTipo = {
  id: string;
  nome: string;
};

export type CentroCustoPagamento = {
  id: string;
  valor: number;
  data: string;
};

export type CentroCustoDespesa = {
  id: string;
  descricao: string;
  tipoId: string;
  /** Nome do tipo vindo da API (lista paginada). */
  tipoNome?: string;
  rocaId: number;
  rocaNome: string;
  /** ID da conta a pagar (mesma usada em Contas a Pagar). */
  contaFinanceiraId?: number | null;
  valor: number;
  data: string;
  observacoes?: string;
  pagamentos: CentroCustoPagamento[];
};

function mapTipo(row: ApiCentroCustoTipo): CentroCustoTipo {
  return { id: String(row.id), nome: row.nome };
}

function dataIso(d: string | Date): string {
  if (typeof d === 'string') return d.length >= 10 ? d.slice(0, 10) : d;
  return d.toISOString().slice(0, 10);
}

function mapDespesa(row: ApiCentroCustoDespesa): CentroCustoDespesa {
  return {
    id: String(row.id),
    descricao: row.descricao,
    tipoId: String(row.tipoId),
    tipoNome: row.tipoNome,
    rocaId: row.rocaId,
    rocaNome: row.rocaNome ?? '',
    contaFinanceiraId:
      row.contaFinanceiraId != null && row.contaFinanceiraId !== undefined
        ? Number(row.contaFinanceiraId)
        : null,
    valor: Number(row.valor),
    data: dataIso(row.data as string),
    observacoes: row.observacoes ?? undefined,
    pagamentos: (row.pagamentos ?? []).map((p) => ({
      id: String(p.id),
      valor: Number(p.valor),
      data: dataIso(p.data as string),
    })),
  };
}

export function totalPagoNaDespesa(d: CentroCustoDespesa): number {
  return d.pagamentos.reduce((s, p) => s + Number(p.valor || 0), 0);
}

export function statusDespesa(d: CentroCustoDespesa): 'ABERTO' | 'PARCIAL' | 'QUITADO' {
  const pago = totalPagoNaDespesa(d);
  const total = Number(d.valor) || 0;
  if (pago <= 0) return 'ABERTO';
  if (pago >= total - 0.005) return 'QUITADO';
  return 'PARCIAL';
}

export function valorAberto(d: CentroCustoDespesa): number {
  return Math.max(0, (Number(d.valor) || 0) - totalPagoNaDespesa(d));
}

type AtualizarDespesaInput = Partial<
  Omit<CentroCustoDespesa, 'id' | 'pagamentos'>
>;

type CentroCustosContextValue = {
  /** Página atual da tabela de tipos. */
  tiposPage: number;
  setTiposPage: (p: number | ((prev: number) => number)) => void;
  tiposTotal: number;
  /** Página atual da tabela de despesas. */
  despesasPage: number;
  setDespesasPage: (p: number | ((prev: number) => number)) => void;
  despesasTotal: number;
  /** Itens da página atual (tipos). */
  tipos: CentroCustoTipo[];
  /** Todos os tipos para selects (limitado no servidor). */
  tiposOpcoes: CentroCustoTipo[];
  despesas: CentroCustoDespesa[];
  resumo: {
    qAbertas: number;
    qQuitadas: number;
    valorAbertoTotal: number;
    valorPagoTotal: number;
  };
  /** Carregamento inicial (primeira busca de tipos ou despesas). */
  isLoading: boolean;
  adicionarTipo: (nome: string) => Promise<CentroCustoTipo>;
  atualizarTipo: (id: string, nome: string) => Promise<void>;
  excluirTipo: (id: string) => Promise<void>;
  adicionarDespesa: (
    data: Omit<CentroCustoDespesa, 'id' | 'pagamentos'>,
  ) => Promise<CentroCustoDespesa>;
  atualizarDespesa: (id: string, data: AtualizarDespesaInput) => Promise<void>;
  excluirDespesa: (id: string) => Promise<void>;
  registrarPagamento: (
    despesaId: string,
    valor: number,
    data: string,
  ) => Promise<CentroCustoDespesa | undefined>;
};

const CentroCustosContext = createContext<CentroCustosContextValue | null>(null);

export function CentroCustosProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const podeSincronizar = !authLoading && isAuthenticated;

  const [tiposPage, setTiposPage] = useState(1);
  const [despesasPage, setDespesasPage] = useState(1);

  const resumoQuery = useQuery({
    queryKey: QK_RESUMO,
    enabled: podeSincronizar,
    queryFn: () => centroCustoService.resumoModulo(),
  });

  const tiposOpcoesQuery = useQuery({
    queryKey: QK_TIPOS_OPCOES,
    enabled: podeSincronizar,
    queryFn: async () => {
      const rows = await centroCustoService.listarTiposOpcoes();
      return rows.map(mapTipo);
    },
  });

  const tiposQuery = useQuery({
    queryKey: qkTiposPagina(tiposPage),
    enabled: podeSincronizar,
    queryFn: async () => {
      const res = await centroCustoService.listarTipos(
        tiposPage,
        CENTRO_CUSTO_PAGE_SIZE,
      );
      return {
        items: res.items.map(mapTipo),
        total: res.total,
        page: res.page,
        limit: res.limit,
      };
    },
  });

  const despesasQuery = useQuery({
    queryKey: qkDespesasPagina(despesasPage),
    enabled: podeSincronizar,
    queryFn: async () => {
      const res = await centroCustoService.listarDespesas(
        despesasPage,
        CENTRO_CUSTO_PAGE_SIZE,
      );
      return {
        items: res.items.map(mapDespesa),
        total: res.total,
        page: res.page,
        limit: res.limit,
      };
    },
  });

  const tipos = tiposQuery.data?.items ?? [];
  const tiposTotal = tiposQuery.data?.total ?? 0;
  const tiposOpcoes = tiposOpcoesQuery.data ?? [];
  const despesas = despesasQuery.data?.items ?? [];
  const despesasTotal = despesasQuery.data?.total ?? 0;

  const resumo = resumoQuery.data ?? {
    qAbertas: 0,
    qQuitadas: 0,
    valorAbertoTotal: 0,
    valorPagoTotal: 0,
  };

  const invalidateCentroCustoLists = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['centro-custo'] });
  }, [queryClient]);

  const buscarDespesaPorId = useCallback(async (id: string) => {
    const first = await centroCustoService.listarDespesas(
      1,
      CENTRO_CUSTO_PAGE_SIZE,
    );
    const pages = Math.max(
      1,
      Math.ceil(first.total / CENTRO_CUSTO_PAGE_SIZE),
    );
    for (let p = 1; p <= pages; p++) {
      const res =
        p === 1
          ? first
          : await centroCustoService.listarDespesas(p, CENTRO_CUSTO_PAGE_SIZE);
      const found = res.items.map(mapDespesa).find((d) => d.id === id);
      if (found) return found;
    }
    return undefined;
  }, []);

  const adicionarTipo = useCallback(
    async (nome: string) => {
      const row = await centroCustoService.criarTipo({ nome: nome.trim() });
      await invalidateCentroCustoLists();
      return mapTipo(row);
    },
    [invalidateCentroCustoLists],
  );

  const atualizarTipo = useCallback(
    async (id: string, nome: string) => {
      await centroCustoService.atualizarTipo(Number(id), { nome: nome.trim() });
      await invalidateCentroCustoLists();
    },
    [invalidateCentroCustoLists],
  );

  const excluirTipo = useCallback(
    async (id: string) => {
      await centroCustoService.excluirTipo(Number(id));
      await invalidateCentroCustoLists();
    },
    [invalidateCentroCustoLists],
  );

  const adicionarDespesa = useCallback(
    async (data: Omit<CentroCustoDespesa, 'id' | 'pagamentos'>) => {
      const row = await centroCustoService.criarDespesa({
        tipoId: Number(data.tipoId),
        rocaId: data.rocaId,
        descricao: data.descricao.trim(),
        valor: data.valor,
        data: dataIso(data.data),
        observacoes: data.observacoes?.trim() || undefined,
      });
      setDespesasPage(1);

      const r = row as ApiCentroCustoDespesa;
      const tipoNome =
        data.tipoNome?.trim() ||
        tiposOpcoesQuery.data?.find((t) => t.id === data.tipoId)?.nome ||
        r.tipoNome;
      const rocaNome = data.rocaNome?.trim() || r.rocaNome;
      const newItem = mapDespesa({
        ...r,
        tipoNome: tipoNome || '—',
        rocaNome: rocaNome || '—',
        pagamentos: r.pagamentos ?? [],
      });

      queryClient.setQueryData(
        qkDespesasPagina(1),
        (
          old:
            | {
                items: CentroCustoDespesa[];
                total: number;
                page: number;
                limit: number;
              }
            | undefined,
        ) => {
          if (!old) {
            return {
              items: [newItem],
              total: 1,
              page: 1,
              limit: CENTRO_CUSTO_PAGE_SIZE,
            };
          }
          const items = [newItem, ...old.items].slice(0, CENTRO_CUSTO_PAGE_SIZE);
          return {
            ...old,
            items,
            total: old.total + 1,
            page: 1,
            limit: old.limit,
          };
        },
      );

      void queryClient.invalidateQueries({ queryKey: QK_RESUMO });
      return newItem;
    },
    [queryClient, tiposOpcoesQuery.data],
  );

  const atualizarDespesa = useCallback(
    async (id: string, data: AtualizarDespesaInput) => {
      const payload: Parameters<typeof centroCustoService.atualizarDespesa>[1] = {};
      if (data.tipoId !== undefined) payload.tipoId = Number(data.tipoId);
      if (data.rocaId !== undefined) payload.rocaId = data.rocaId;
      if (data.descricao !== undefined) payload.descricao = data.descricao.trim();
      if (data.valor !== undefined) payload.valor = data.valor;
      if (data.data !== undefined) payload.data = dataIso(data.data);
      if (data.observacoes !== undefined) {
        payload.observacoes = data.observacoes?.trim() ? data.observacoes.trim() : null;
      }
      await centroCustoService.atualizarDespesa(Number(id), payload);
      await invalidateCentroCustoLists();
    },
    [invalidateCentroCustoLists],
  );

  const excluirDespesa = useCallback(
    async (id: string) => {
      await centroCustoService.excluirDespesa(Number(id));
      await invalidateCentroCustoLists();
    },
    [invalidateCentroCustoLists],
  );

  const registrarPagamento = useCallback(
    async (despesaId: string, valor: number, dataPag: string) => {
      await centroCustoService.registrarPagamento(Number(despesaId), {
        valor,
        data: dataIso(dataPag),
      });
      await invalidateCentroCustoLists();
      return buscarDespesaPorId(despesaId);
    },
    [invalidateCentroCustoLists, buscarDespesaPorId],
  );

  const isLoading =
    podeSincronizar &&
    (tiposQuery.isPending ||
      despesasQuery.isPending ||
      resumoQuery.isPending ||
      tiposOpcoesQuery.isPending);

  const value = useMemo(
    () => ({
      tiposPage,
      setTiposPage,
      tiposTotal,
      despesasPage,
      setDespesasPage,
      despesasTotal,
      tipos,
      tiposOpcoes,
      despesas,
      resumo,
      isLoading,
      adicionarTipo,
      atualizarTipo,
      excluirTipo,
      adicionarDespesa,
      atualizarDespesa,
      excluirDespesa,
      registrarPagamento,
    }),
    [
      tiposPage,
      tiposTotal,
      despesasPage,
      despesasTotal,
      tipos,
      tiposOpcoes,
      despesas,
      resumo,
      isLoading,
      adicionarTipo,
      atualizarTipo,
      excluirTipo,
      adicionarDespesa,
      atualizarDespesa,
      excluirDespesa,
      registrarPagamento,
    ],
  );

  return <CentroCustosContext.Provider value={value}>{children}</CentroCustosContext.Provider>;
}

export function useCentroCustos(): CentroCustosContextValue {
  const ctx = useContext(CentroCustosContext);
  if (!ctx) {
    throw new Error('useCentroCustos deve ser usado dentro de CentroCustosProvider');
  }
  return ctx;
}
