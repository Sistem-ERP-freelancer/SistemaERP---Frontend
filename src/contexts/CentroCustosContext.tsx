import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

const STORAGE_KEY = 'topERP_centro_custos_demo_v1';

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
  rocaId: number;
  rocaNome: string;
  valor: number;
  data: string;
  observacoes?: string;
  pagamentos: CentroCustoPagamento[];
};

type PersistShape = {
  tipos: CentroCustoTipo[];
  despesas: CentroCustoDespesa[];
};

function novoId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
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

function despesaNaCompetenciaMes(d: CentroCustoDespesa, yyyyMm: string): boolean {
  const data = (d.data || '').slice(0, 7);
  return data === yyyyMm;
}

type CentroCustosContextValue = {
  tipos: CentroCustoTipo[];
  despesas: CentroCustoDespesa[];
  adicionarTipo: (nome: string) => CentroCustoTipo;
  atualizarTipo: (id: string, nome: string) => void;
  excluirTipo: (id: string) => void;
  adicionarDespesa: (data: Omit<CentroCustoDespesa, 'id' | 'pagamentos'>) => CentroCustoDespesa;
  atualizarDespesa: (id: string, data: Partial<Omit<CentroCustoDespesa, 'id' | 'pagamentos'>>) => void;
  excluirDespesa: (id: string) => void;
  registrarPagamento: (despesaId: string, valor: number, data: string) => CentroCustoDespesa | undefined;
  /** Soma dos valores (competência) das despesas cuja data cai no mês — para o card "Despesa do mês". */
  somaCompetenciaCentroCustosMes: (yyyyMm: string) => number;
  /** Resumo interno do módulo (todas as despesas em memória). */
  resumoModulo: () => {
    qAbertas: number;
    qQuitadas: number;
    valorAbertoTotal: number;
    valorPagoTotal: number;
  };
};

const CentroCustosContext = createContext<CentroCustosContextValue | null>(null);

function carregar(): PersistShape {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { tipos: [], despesas: [] };
    const p = JSON.parse(raw) as PersistShape;
    return {
      tipos: Array.isArray(p.tipos) ? p.tipos : [],
      despesas: Array.isArray(p.despesas) ? p.despesas : [],
    };
  } catch {
    return { tipos: [], despesas: [] };
  }
}

export function CentroCustosProvider({ children }: { children: ReactNode }) {
  const [tipos, setTipos] = useState<CentroCustoTipo[]>(() => carregar().tipos);
  const [despesas, setDespesas] = useState<CentroCustoDespesa[]>(() => carregar().despesas);

  useEffect(() => {
    const payload: PersistShape = { tipos, despesas };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [tipos, despesas]);

  const adicionarTipo = useCallback((nome: string) => {
    const t: CentroCustoTipo = { id: novoId('tipo'), nome: nome.trim() };
    setTipos((prev) => [...prev, t]);
    return t;
  }, []);

  const atualizarTipo = useCallback((id: string, nome: string) => {
    setTipos((prev) => prev.map((t) => (t.id === id ? { ...t, nome: nome.trim() } : t)));
  }, []);

  const excluirTipo = useCallback((id: string) => {
    setTipos((prev) => prev.filter((t) => t.id !== id));
    setDespesas((prev) => prev.filter((d) => d.tipoId !== id));
  }, []);

  const adicionarDespesa = useCallback(
    (data: Omit<CentroCustoDespesa, 'id' | 'pagamentos'>) => {
      const d: CentroCustoDespesa = {
        ...data,
        id: novoId('desp'),
        pagamentos: [],
      };
      setDespesas((prev) => [...prev, d]);
      return d;
    },
    [],
  );

  const atualizarDespesa = useCallback(
    (id: string, data: Partial<Omit<CentroCustoDespesa, 'id' | 'pagamentos'>>) => {
      setDespesas((prev) =>
        prev.map((d) => (d.id === id ? { ...d, ...data, id: d.id, pagamentos: d.pagamentos } : d)),
      );
    },
    [],
  );

  const excluirDespesa = useCallback((id: string) => {
    setDespesas((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const registrarPagamento = useCallback((despesaId: string, valor: number, data: string) => {
    const v = Number(valor);
    if (!Number.isFinite(v) || v <= 0) return undefined;
    let out: CentroCustoDespesa | undefined;
    setDespesas((prev) =>
      prev.map((d) => {
        if (d.id !== despesaId) return d;
        const pago = totalPagoNaDespesa(d);
        const restante = Math.max(0, Number(d.valor) - pago);
        const aplicar = Math.min(v, restante);
        if (aplicar <= 0) return d;
        const next = {
          ...d,
          pagamentos: [
            ...d.pagamentos,
            { id: novoId('pag'), valor: aplicar, data: data.slice(0, 10) },
          ],
        };
        out = next;
        return next;
      }),
    );
    return out;
  }, []);

  const somaCompetenciaCentroCustosMes = useCallback(
    (yyyyMm: string) =>
      despesas
        .filter((d) => despesaNaCompetenciaMes(d, yyyyMm))
        .reduce((s, d) => s + (Number(d.valor) || 0), 0),
    [despesas],
  );

  const resumoModulo = useCallback(() => {
    let qAbertas = 0;
    let qQuitadas = 0;
    let valorAbertoTotal = 0;
    let valorPagoTotal = 0;
    for (const d of despesas) {
      const st = statusDespesa(d);
      const pago = totalPagoNaDespesa(d);
      valorPagoTotal += pago;
      if (st === 'QUITADO') qQuitadas += 1;
      else qAbertas += 1;
      valorAbertoTotal += Math.max(0, Number(d.valor) - pago);
    }
    return { qAbertas, qQuitadas, valorAbertoTotal, valorPagoTotal };
  }, [despesas]);

  const value = useMemo(
    () => ({
      tipos,
      despesas,
      adicionarTipo,
      atualizarTipo,
      excluirTipo,
      adicionarDespesa,
      atualizarDespesa,
      excluirDespesa,
      registrarPagamento,
      somaCompetenciaCentroCustosMes,
      resumoModulo,
    }),
    [
      tipos,
      despesas,
      adicionarTipo,
      atualizarTipo,
      excluirTipo,
      adicionarDespesa,
      atualizarDespesa,
      excluirDespesa,
      registrarPagamento,
      somaCompetenciaCentroCustosMes,
      resumoModulo,
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
