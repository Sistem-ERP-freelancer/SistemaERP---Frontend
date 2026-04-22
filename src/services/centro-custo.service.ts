import { apiClient } from './api';

const BASE = '/centro-custo';

export type ApiCentroCustoTipo = {
  id: number;
  nome: string;
  criadoEm?: string;
  atualizadoEm?: string;
};

export type ApiCentroCustoPagamento = {
  id: number;
  valor: number;
  data: string;
};

export type ApiCentroCustoDespesa = {
  id: number;
  tipoId: number;
  tipoNome: string;
  rocaId: number;
  rocaNome: string;
  fornecedorId?: number | null;
  /** Conta a pagar espelhada (CPAG-…); necessário para abrir a tela de registrar pagamento. */
  contaFinanceiraId?: number | null;
  descricao: string;
  valor: number;
  data: string;
  observacoes?: string | null;
  pagamentos: ApiCentroCustoPagamento[];
};

export type CentroCustoResumoModulo = {
  qAbertas: number;
  qQuitadas: number;
  valorAbertoTotal: number;
  valorPagoTotal: number;
};

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

const PAGE = 15;

class CentroCustoService {
  listarTipos(
    page = 1,
    limit = PAGE,
  ): Promise<PaginatedResult<ApiCentroCustoTipo>> {
    const q = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    return apiClient.get<PaginatedResult<ApiCentroCustoTipo>>(
      `${BASE}/tipos?${q}`,
    );
  }

  listarTiposOpcoes(): Promise<ApiCentroCustoTipo[]> {
    return apiClient.get<ApiCentroCustoTipo[]>(`${BASE}/tipos/opcoes`);
  }

  criarTipo(data: { nome: string }): Promise<ApiCentroCustoTipo> {
    return apiClient.post<ApiCentroCustoTipo>(`${BASE}/tipos`, data);
  }

  atualizarTipo(id: number, data: { nome: string }): Promise<ApiCentroCustoTipo> {
    return apiClient.patch<ApiCentroCustoTipo>(`${BASE}/tipos/${id}`, data);
  }

  excluirTipo(id: number): Promise<{ ok: boolean }> {
    return apiClient.delete<{ ok: boolean }>(`${BASE}/tipos/${id}`);
  }

  listarDespesas(
    page = 1,
    limit = PAGE,
  ): Promise<PaginatedResult<ApiCentroCustoDespesa>> {
    const q = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    return apiClient.get<PaginatedResult<ApiCentroCustoDespesa>>(
      `${BASE}/despesas?${q}`,
    );
  }

  buscarDespesaPorId(id: number): Promise<ApiCentroCustoDespesa> {
    return apiClient.get<ApiCentroCustoDespesa>(`${BASE}/despesas/${id}`);
  }

  sincronizarContasFinanceiras(): Promise<{ alvo: number; criadas: number }> {
    return apiClient.post<{ alvo: number; criadas: number }>(
      `${BASE}/despesas/sincronizar-contas-financeiras`,
      {},
    );
  }

  resumoModulo(): Promise<CentroCustoResumoModulo> {
    return apiClient.get<CentroCustoResumoModulo>(`${BASE}/resumo`);
  }

  criarDespesa(data: {
    tipoId: number;
    rocaId: number;
    descricao: string;
    valor: number;
    data: string;
    observacoes?: string;
  }): Promise<ApiCentroCustoDespesa> {
    return apiClient.post<ApiCentroCustoDespesa>(`${BASE}/despesas`, data);
  }

  atualizarDespesa(
    id: number,
    data: Partial<{
      tipoId: number;
      rocaId: number;
      descricao: string;
      valor: number;
      data: string;
      observacoes: string | null;
    }>,
  ): Promise<ApiCentroCustoDespesa> {
    return apiClient.patch<ApiCentroCustoDespesa>(`${BASE}/despesas/${id}`, data);
  }

  excluirDespesa(id: number): Promise<{ ok: boolean }> {
    return apiClient.delete<{ ok: boolean }>(`${BASE}/despesas/${id}`);
  }

  registrarPagamento(
    despesaId: number,
    data: { valor: number; data: string },
  ): Promise<ApiCentroCustoPagamento> {
    return apiClient.post<ApiCentroCustoPagamento>(
      `${BASE}/despesas/${despesaId}/pagamentos`,
      data,
    );
  }
}

/** Centro de custo / despesa por roça */
export const centroCustoService = new CentroCustoService();
