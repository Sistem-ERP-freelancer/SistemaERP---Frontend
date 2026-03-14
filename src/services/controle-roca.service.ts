import type {
    CreateLancamentoProducaoRocaDto,
    CreateMeeiroRocaDto,
    CreateProdutoRocaDto,
    CreateProdutorRocaDto,
    CreateRocaDto,
    LancamentoDetalhesRoca,
    LancamentoProducaoRoca,
    MeeiroRoca,
    ProdutoRoca,
    ProdutorRoca,
    RelatorioMeeiroResponse,
    Roca,
    RocaDetalhes,
    UpdateLancamentoProducaoRocaDto,
    UpdateMeeiroRocaDto,
    UpdateProdutorRocaDto,
    UpdateRocaDto,
} from '@/types/roca';
import { apiClient } from './api';

const BASE = '/controle-roca';

class ControleRocaService {
  // Produtores
  async listarProdutores(): Promise<ProdutorRoca[]> {
    return apiClient.get<ProdutorRoca[]>(`${BASE}/produtores`);
  }

  async criarProdutor(data: CreateProdutorRocaDto): Promise<ProdutorRoca> {
    return apiClient.post<ProdutorRoca>(`${BASE}/produtores`, data);
  }

  async obterProdutor(id: number): Promise<ProdutorRoca> {
    return apiClient.get<ProdutorRoca>(`${BASE}/produtores/${id}`);
  }

  async atualizarProdutor(
    id: number,
    data: UpdateProdutorRocaDto
  ): Promise<ProdutorRoca> {
    return apiClient.patch<ProdutorRoca>(`${BASE}/produtores/${id}`, data);
  }

  // Roças
  async listarRocas(
    produtorId?: number,
    incluirInativos?: boolean,
  ): Promise<Roca[]> {
    const params = new URLSearchParams();
    if (produtorId != null) params.set('produtorId', String(produtorId));
    if (incluirInativos) params.set('incluirInativos', 'true');
    const q = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<Roca[]>(`${BASE}/rocas${q}`);
  }

  async criarRoca(data: CreateRocaDto): Promise<Roca> {
    return apiClient.post<Roca>(`${BASE}/rocas`, data);
  }

  async obterRoca(id: number): Promise<RocaDetalhes> {
    return apiClient.get<RocaDetalhes>(`${BASE}/rocas/${id}`);
  }

  async atualizarRoca(id: number, data: UpdateRocaDto): Promise<RocaDetalhes> {
    return apiClient.patch<RocaDetalhes>(`${BASE}/rocas/${id}`, data);
  }

  async excluirRoca(id: number): Promise<{ sucesso: boolean }> {
    return apiClient.delete<{ sucesso: boolean }>(`${BASE}/rocas/${id}`);
  }

  // Meeiros
  async listarMeeiros(produtorId?: number): Promise<MeeiroRoca[]> {
    const q = produtorId != null ? `?produtorId=${produtorId}` : '';
    return apiClient.get<MeeiroRoca[]>(`${BASE}/meeiros${q}`);
  }

  async buscarMeeiroPorCodigo(codigo: string): Promise<MeeiroRoca> {
    return apiClient.get<MeeiroRoca>(
      `${BASE}/meeiros/codigo/${encodeURIComponent(codigo)}`
    );
  }

  async criarMeeiro(data: CreateMeeiroRocaDto): Promise<MeeiroRoca> {
    return apiClient.post<MeeiroRoca>(`${BASE}/meeiros`, data);
  }

  async obterMeeiro(id: number): Promise<MeeiroRoca> {
    return apiClient.get<MeeiroRoca>(`${BASE}/meeiros/${id}`);
  }

  async atualizarMeeiro(
    id: number,
    data: UpdateMeeiroRocaDto
  ): Promise<MeeiroRoca> {
    return apiClient.patch<MeeiroRoca>(`${BASE}/meeiros/${id}`, data);
  }

  async excluirMeeiro(id: number): Promise<{ sucesso: boolean }> {
    return apiClient.delete<{ sucesso: boolean }>(`${BASE}/meeiros/${id}`);
  }

  // Produtos da roça
  async listarProdutosRoca(produtorId?: number): Promise<ProdutoRoca[]> {
    const q = produtorId != null ? `?produtorId=${produtorId}` : '';
    return apiClient.get<ProdutoRoca[]>(`${BASE}/produtos${q}`);
  }

  async criarProdutoRoca(data: CreateProdutoRocaDto): Promise<ProdutoRoca> {
    return apiClient.post<ProdutoRoca>(`${BASE}/produtos`, data);
  }

  // Lançamentos
  async listarLancamentos(params?: {
    produtorId?: number;
    rocaId?: number;
    dataInicial?: string;
    dataFinal?: string;
    incluirInativos?: boolean;
  }): Promise<LancamentoProducaoRoca[]> {
    const search = new URLSearchParams();
    if (params?.produtorId != null) search.set('produtorId', String(params.produtorId));
    if (params?.rocaId != null) search.set('rocaId', String(params.rocaId));
    if (params?.dataInicial) search.set('dataInicial', params.dataInicial);
    if (params?.dataFinal) search.set('dataFinal', params.dataFinal);
    if (params?.incluirInativos === true) search.set('incluirInativos', 'true');
    const q = search.toString() ? `?${search.toString()}` : '';
    return apiClient.get<LancamentoProducaoRoca[]>(`${BASE}/lancamentos${q}`);
  }

  async obterLancamento(id: number): Promise<LancamentoDetalhesRoca | null> {
    return apiClient.get<LancamentoDetalhesRoca | null>(`${BASE}/lancamentos/${id}`);
  }

  async atualizarLancamento(
    id: number,
    data: UpdateLancamentoProducaoRocaDto
  ): Promise<LancamentoProducaoRoca> {
    return apiClient.patch<LancamentoProducaoRoca>(`${BASE}/lancamentos/${id}`, data);
  }

  async criarLancamento(
    data: CreateLancamentoProducaoRocaDto
  ): Promise<LancamentoProducaoRoca> {
    return apiClient.post<LancamentoProducaoRoca>(`${BASE}/lancamentos`, data);
  }

  async excluirLancamento(id: number): Promise<{ sucesso: boolean }> {
    return apiClient.delete<{ sucesso: boolean }>(`${BASE}/lancamentos/${id}`);
  }

  /** Reajustar valor unitário de múltiplos lançamentos */
  async reajustarValorLancamentos(data: {
    idsLancamentos: number[];
    novoValorUnitario: number;
  }): Promise<{ sucesso: boolean; novoValorUnitario: number; lancamentosAtualizados: any[] }> {
    return apiClient.patch<{ sucesso: boolean; novoValorUnitario: number; lancamentosAtualizados: any[] }>(
      `${BASE}/lancamentos/reajustar-valor`,
      data
    );
  }

  // Relatório por meeiro
  async relatorioPorMeeiro(params: {
    meeiroId: number;
    dataInicial?: string;
    dataFinal?: string;
  }): Promise<RelatorioMeeiroResponse> {
    const search = new URLSearchParams({ meeiroId: String(params.meeiroId) });
    if (params.dataInicial) search.set('dataInicial', params.dataInicial);
    if (params.dataFinal) search.set('dataFinal', params.dataFinal);
    return apiClient.get<RelatorioMeeiroResponse>(
      `${BASE}/relatorios/meeiro?${search.toString()}`
    );
  }

  /**
   * Download do PDF do Relatório por Meeiro.
   */
  async downloadRelatorioMeeiroPdf(params: {
    meeiroId: number;
    dataInicial?: string;
    dataFinal?: string;
  }): Promise<void> {
    const search = new URLSearchParams({ meeiroId: String(params.meeiroId) });
    if (params.dataInicial) search.set('dataInicial', params.dataInicial);
    if (params.dataFinal) search.set('dataFinal', params.dataFinal);
    const blob = await apiClient.getBlob(
      `${BASE}/relatorios/meeiro/pdf?${search.toString()}`
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-meeiro-${params.meeiroId}-${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Abre o PDF do Relatório por Meeiro em nova aba para impressão.
   */
  async printRelatorioMeeiroPdf(params: {
    meeiroId: number;
    dataInicial?: string;
    dataFinal?: string;
  }): Promise<void> {
    const search = new URLSearchParams({ meeiroId: String(params.meeiroId) });
    if (params.dataInicial) search.set('dataInicial', params.dataInicial);
    if (params.dataFinal) search.set('dataFinal', params.dataFinal);
    const blob = await apiClient.getBlob(
      `${BASE}/relatorios/meeiro/pdf?${search.toString()}`
    );
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (!win) {
      throw new Error('Não foi possível abrir o PDF para impressão. Verifique o bloqueador de pop-ups.');
    }
  }
}

export const controleRocaService = new ControleRocaService();
