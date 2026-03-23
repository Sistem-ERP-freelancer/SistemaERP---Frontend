import type {
    CreateLancamentoProducaoRocaDto,
    CreateMeeiroRocaDto,
    CreateProdutoRocaDto,
    CreateProdutorRocaDto,
    CreateRocaDto,
    EmprestimoMeeiro,
    LancamentoDetalhesRoca,
    LancamentoProducaoRoca,
    ListaEmprestimosResponse,
    MeeiroDetalhe,
    MeeiroRoca,
    ProdutoRoca,
    ProdutorRoca,
    RelatorioMeeiroResponse,
    ResumoPagamentoMeeirosResponse,
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
  async listarMeeiros(
    produtorId?: number,
    opts?: { comEmprestimos?: boolean; page?: number; limit?: number }
  ): Promise<MeeiroRoca[]> {
    const params = new URLSearchParams();
    if (produtorId != null) params.set('produtorId', String(produtorId));
    if (opts?.comEmprestimos === true) params.set('comEmprestimos', 'true');
    if (opts?.page != null) params.set('page', String(opts.page));
    if (opts?.limit != null) params.set('limit', String(opts.limit));
    const q = params.toString() ? `?${params.toString()}` : '';
    const res = await apiClient.get<MeeiroRoca[] | { items: MeeiroRoca[] }>(`${BASE}/meeiros${q}`);
    return Array.isArray(res) ? res : (res?.items ?? []);
  }

  async buscarMeeiroPorCodigo(codigo: string): Promise<MeeiroRoca> {
    return apiClient.get<MeeiroRoca>(
      `${BASE}/meeiros/codigo/${encodeURIComponent(codigo)}`
    );
  }

  async criarMeeiro(data: CreateMeeiroRocaDto): Promise<MeeiroRoca> {
    return apiClient.post<MeeiroRoca>(`${BASE}/meeiros`, data);
  }

  /** Retorna detalhe do meeiro com resumo financeiro e lista de empréstimos. */
  async obterMeeiro(id: number): Promise<MeeiroDetalhe> {
    return apiClient.get<MeeiroDetalhe>(`${BASE}/meeiros/${id}`);
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

  // Empréstimos
  async criarEmprestimo(data: {
    meeiroId: number;
    valor: number;
    data: string;
    observacao?: string;
  }): Promise<EmprestimoMeeiro> {
    return apiClient.post<EmprestimoMeeiro>(`${BASE}/emprestimos`, data);
  }

  async listarEmprestimosMeeiro(
    meeiroId: number,
    opts?: { page?: number; limit?: number; status?: string }
  ): Promise<ListaEmprestimosResponse> {
    const params = new URLSearchParams();
    if (opts?.page != null) params.set('page', String(opts.page));
    if (opts?.limit != null) params.set('limit', String(opts.limit));
    if (opts?.status) params.set('status', opts.status);
    const q = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<ListaEmprestimosResponse>(
      `${BASE}/meeiros/${meeiroId}/emprestimos${q}`
    );
  }

  async atualizarStatusEmprestimo(
    id: number,
    data: { status: 'ABERTO' | 'LIQUIDADO' | 'CANCELADO' }
  ): Promise<EmprestimoMeeiro> {
    return apiClient.patch<EmprestimoMeeiro>(
      `${BASE}/emprestimos/${id}/status`,
      data
    );
  }

  // Pagamentos de meeiros
  async listarResumoPagamentoMeeiros(params?: {
    produtorId?: number;
    dataInicial?: string;
    dataFinal?: string;
    rocas?: number[];
    page?: number;
    limit?: number;
    apenasComValorEmAberto?: boolean;
    apenasPagos?: boolean;
  }): Promise<ResumoPagamentoMeeirosResponse> {
    const search = new URLSearchParams();
    if (params?.produtorId != null) search.set('produtorId', String(params.produtorId));
    if (params?.dataInicial) search.set('dataInicial', params.dataInicial);
    if (params?.dataFinal) search.set('dataFinal', params.dataFinal);
    if (params?.rocas?.length) search.set('rocas', params.rocas.join(','));
    if (params?.page != null) search.set('page', String(params.page));
    if (params?.limit != null) search.set('limit', String(params.limit));
    if (params?.apenasComValorEmAberto === true) search.set('apenasComValorEmAberto', 'true');
    if (params?.apenasPagos === true) search.set('apenasPagos', 'true');
    const q = search.toString() ? `?${search.toString()}` : '';
    return apiClient.get<ResumoPagamentoMeeirosResponse>(
      `${BASE}/pagamentos-meeiros/resumo${q}`
    );
  }

  async registrarPagamentoMeeiro(data: {
    meeiroId: number;
    formaPagamento: string;
    contaCaixa?: string;
    dataPagamento: string;
    observacao?: string;
  }): Promise<{
    pagamento: any;
    totalReceber: number;
    totalEmprestimos: number;
    valorLiquido: number;
    emprestimosLiquidados: Array<{ id: number; valor: number }>;
  }> {
    return apiClient.post(`${BASE}/pagamentos-meeiros`, data);
  }

  /** Relatório de Meeiros (múltiplos) em PDF – filtro por período e roças. */
  async downloadRelatorioMeeirosPdf(params?: {
    meeiroId?: number;
    dataInicial?: string;
    dataFinal?: string;
    rocas?: number[];
    /** pagos = com registro de pagamento; pendentes = sem pagamento e valor a pagar; todos = todos */
    filtroPagamento?: 'todos' | 'pagos' | 'pendentes';
  }): Promise<void> {
    const search = new URLSearchParams();
    if (params?.meeiroId != null) search.set('meeiroId', String(params.meeiroId));
    if (params?.dataInicial) search.set('dataInicial', params.dataInicial);
    if (params?.dataFinal) search.set('dataFinal', params.dataFinal);
    if (params?.rocas?.length) search.set('rocas', params.rocas.join(','));
    if (params?.filtroPagamento && params.filtroPagamento !== 'todos') {
      search.set('filtroPagamento', params.filtroPagamento);
    }
    const q = search.toString() ? `?${search.toString()}` : '';
    const blob = await apiClient.getBlob(
      `${BASE}/relatorios/meeiros/pdf${q}`
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const sfx =
      params?.filtroPagamento === 'pagos'
        ? '-pagos'
        : params?.filtroPagamento === 'pendentes'
          ? '-pendentes'
          : '';
    a.download = `relatorio-meeiros${sfx}-${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async printRelatorioMeeirosPdf(params?: {
    meeiroId?: number;
    dataInicial?: string;
    dataFinal?: string;
    rocas?: number[];
    filtroPagamento?: 'todos' | 'pagos' | 'pendentes';
  }): Promise<void> {
    const search = new URLSearchParams();
    if (params?.meeiroId != null) search.set('meeiroId', String(params.meeiroId));
    if (params?.dataInicial) search.set('dataInicial', params.dataInicial);
    if (params?.dataFinal) search.set('dataFinal', params.dataFinal);
    if (params?.rocas?.length) search.set('rocas', params.rocas.join(','));
    if (params?.filtroPagamento && params.filtroPagamento !== 'todos') {
      search.set('filtroPagamento', params.filtroPagamento);
    }
    const q = search.toString() ? `?${search.toString()}` : '';
    const blob = await apiClient.getBlob(
      `${BASE}/relatorios/meeiros/pdf${q}`
    );
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (!win) {
      throw new Error('Não foi possível abrir o PDF para impressão. Verifique o bloqueador de pop-ups.');
    }
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
    meeiroId?: number;
    dataInicial?: string;
    dataFinal?: string;
    incluirInativos?: boolean;
  }): Promise<LancamentoProducaoRoca[]> {
    const search = new URLSearchParams();
    if (params?.produtorId != null) search.set('produtorId', String(params.produtorId));
    if (params?.rocaId != null) search.set('rocaId', String(params.rocaId));
    if (params?.meeiroId != null) search.set('meeiroId', String(params.meeiroId));
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

  /** Download do PDF "Relatório por Meeiro" (lançamentos do meeiro selecionado). */
  async downloadRelatorioPorMeeiroPdf(params: {
    meeiroId: number;
    dataInicial?: string;
    dataFinal?: string;
    rocas?: number[];
  }): Promise<void> {
    const search = new URLSearchParams({ meeiroId: String(params.meeiroId) });
    if (params.dataInicial) search.set('dataInicial', params.dataInicial);
    if (params.dataFinal) search.set('dataFinal', params.dataFinal);
    if (params.rocas?.length) search.set('rocas', params.rocas.join(','));
    const blob = await apiClient.getBlob(
      `${BASE}/relatorios/meeiro/pdf?${search.toString()}`
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-por-meeiro-${params.meeiroId}-${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /** Abre o PDF "Relatório por Meeiro" em nova aba para impressão. */
  async printRelatorioPorMeeiroPdf(params: {
    meeiroId: number;
    dataInicial?: string;
    dataFinal?: string;
    rocas?: number[];
  }): Promise<void> {
    const search = new URLSearchParams({ meeiroId: String(params.meeiroId) });
    if (params.dataInicial) search.set('dataInicial', params.dataInicial);
    if (params.dataFinal) search.set('dataFinal', params.dataFinal);
    if (params.rocas?.length) search.set('rocas', params.rocas.join(','));
    const blob = await apiClient.getBlob(
      `${BASE}/relatorios/meeiro/pdf?${search.toString()}`
    );
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (!win) {
      throw new Error('Não foi possível abrir o PDF para impressão. Verifique o bloqueador de pop-ups.');
    }
  }

  /**
   * Download do PDF "PAGAMENTO DE PRODUTORES" (fechamento do meeiro: tabela de lançamentos, faturas, vales, a receber).
   * Backend: GET /relatorios/pagamento-produtores/pdf
   */
  async downloadRelatorioMeeiroPdf(params: {
    meeiroId: number;
    dataInicial?: string;
    dataFinal?: string;
    /** Data exibida no campo "Pagamento em" do PDF (opcional). */
    dataPagamento?: string;
    produtorId?: number;
    rocas?: number[];
  }): Promise<void> {
    const search = new URLSearchParams({ meeiroId: String(params.meeiroId) });
    if (params.dataInicial) search.set('dataInicial', params.dataInicial);
    if (params.dataFinal) search.set('dataFinal', params.dataFinal);
    if (params.dataPagamento?.trim()) search.set('dataPagamento', params.dataPagamento.trim());
    if (params.produtorId != null) search.set('produtorId', String(params.produtorId));
    if (params.rocas?.length) search.set('rocas', params.rocas.join(','));
    const blob = await apiClient.getBlob(
      `${BASE}/relatorios/pagamento-produtores/pdf?${search.toString()}`
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pagamento-produtores-${params.meeiroId}-${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Abre o PDF "PAGAMENTO DE PRODUTORES" em nova aba para impressão.
   */
  async printRelatorioMeeiroPdf(params: {
    meeiroId: number;
    dataInicial?: string;
    dataFinal?: string;
    dataPagamento?: string;
    produtorId?: number;
    rocas?: number[];
  }): Promise<void> {
    const search = new URLSearchParams({ meeiroId: String(params.meeiroId) });
    if (params.dataInicial) search.set('dataInicial', params.dataInicial);
    if (params.dataFinal) search.set('dataFinal', params.dataFinal);
    if (params.dataPagamento?.trim()) search.set('dataPagamento', params.dataPagamento.trim());
    if (params.produtorId != null) search.set('produtorId', String(params.produtorId));
    if (params.rocas?.length) search.set('rocas', params.rocas.join(','));
    const blob = await apiClient.getBlob(
      `${BASE}/relatorios/pagamento-produtores/pdf?${search.toString()}`
    );
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (!win) {
      throw new Error('Não foi possível abrir o PDF para impressão. Verifique o bloqueador de pop-ups.');
    }
  }

  /** Download do PDF de meeiros pagos no período. */
  async downloadRelatorioMeeirosPagosPdf(params?: {
    dataPagamentoInicial?: string;
    dataPagamentoFinal?: string;
    dataLancamentoInicial?: string;
    dataLancamentoFinal?: string;
    produtorId?: number;
    rocas?: number[];
    aplicarEmbalagem?: boolean;
  }): Promise<void> {
    const q = new URLSearchParams();
    if (params?.dataPagamentoInicial?.trim()) q.set('dataPagamentoInicial', params.dataPagamentoInicial.trim());
    if (params?.dataPagamentoFinal?.trim()) q.set('dataPagamentoFinal', params.dataPagamentoFinal.trim());
    if (params?.dataLancamentoInicial?.trim()) q.set('dataLancamentoInicial', params.dataLancamentoInicial.trim());
    if (params?.dataLancamentoFinal?.trim()) q.set('dataLancamentoFinal', params.dataLancamentoFinal.trim());
    if (params?.produtorId != null) q.set('produtorId', String(params.produtorId));
    if (params?.rocas?.length) q.set('rocas', params.rocas.join(','));
    if (params?.aplicarEmbalagem) q.set('aplicarEmbalagem', 'true');
    const query = q.toString();
    const blob = await apiClient.getBlob(
      `${BASE}/relatorios/meeiros-pagos/pdf${query ? `?${query}` : ''}`
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-meeiros-pagos-${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /** Abre o PDF de meeiros pagos em nova aba para impressão. */
  async printRelatorioMeeirosPagosPdf(params?: {
    dataPagamentoInicial?: string;
    dataPagamentoFinal?: string;
    dataLancamentoInicial?: string;
    dataLancamentoFinal?: string;
    produtorId?: number;
    rocas?: number[];
    aplicarEmbalagem?: boolean;
  }): Promise<void> {
    const q = new URLSearchParams();
    if (params?.dataPagamentoInicial?.trim()) q.set('dataPagamentoInicial', params.dataPagamentoInicial.trim());
    if (params?.dataPagamentoFinal?.trim()) q.set('dataPagamentoFinal', params.dataPagamentoFinal.trim());
    if (params?.dataLancamentoInicial?.trim()) q.set('dataLancamentoInicial', params.dataLancamentoInicial.trim());
    if (params?.dataLancamentoFinal?.trim()) q.set('dataLancamentoFinal', params.dataLancamentoFinal.trim());
    if (params?.produtorId != null) q.set('produtorId', String(params.produtorId));
    if (params?.rocas?.length) q.set('rocas', params.rocas.join(','));
    if (params?.aplicarEmbalagem) q.set('aplicarEmbalagem', 'true');
    const query = q.toString();
    const blob = await apiClient.getBlob(
      `${BASE}/relatorios/meeiros-pagos/pdf${query ? `?${query}` : ''}`
    );
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (!win) {
      throw new Error('Não foi possível abrir o PDF para impressão. Verifique o bloqueador de pop-ups.');
    }
  }

  /** Download do PDF de meeiros com empréstimos. */
  async downloadRelatorioEmprestimosMeeirosPdf(params?: {
    dataInicial?: string;
    dataFinal?: string;
    rocas?: number[];
  }): Promise<void> {
    const q = new URLSearchParams();
    if (params?.dataInicial?.trim()) q.set('dataInicial', params.dataInicial.trim());
    if (params?.dataFinal?.trim()) q.set('dataFinal', params.dataFinal.trim());
    if (params?.rocas?.length) q.set('rocas', params.rocas.join(','));
    const query = q.toString();
    const blob = await apiClient.getBlob(
      `${BASE}/relatorios/emprestimos-meeiros/pdf${query ? `?${query}` : ''}`
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-emprestimos-meeiros-${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /** Abre o PDF de meeiros com empréstimos para impressão. */
  async printRelatorioEmprestimosMeeirosPdf(params?: {
    dataInicial?: string;
    dataFinal?: string;
    rocas?: number[];
  }): Promise<void> {
    const q = new URLSearchParams();
    if (params?.dataInicial?.trim()) q.set('dataInicial', params.dataInicial.trim());
    if (params?.dataFinal?.trim()) q.set('dataFinal', params.dataFinal.trim());
    if (params?.rocas?.length) q.set('rocas', params.rocas.join(','));
    const query = q.toString();
    const blob = await apiClient.getBlob(
      `${BASE}/relatorios/emprestimos-meeiros/pdf${query ? `?${query}` : ''}`
    );
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (!win) {
      throw new Error('Não foi possível abrir o PDF para impressão. Verifique o bloqueador de pop-ups.');
    }
  }

  /** Dados do Relatório de Lançamento de Produtos (apenas produtos com lançamento no período). */
  async getRelatorioLancamentoProdutos(params?: {
    data_inicial?: string;
    data_final?: string;
    rocaId?: number;
  }): Promise<RelatorioLancamentoProdutosLinha[]> {
    const q = new URLSearchParams();
    if (params?.data_inicial) q.set('data_inicial', params.data_inicial);
    if (params?.data_final) q.set('data_final', params.data_final);
    if (params?.rocaId != null) q.set('rocaId', String(params.rocaId));
    const query = q.toString();
    return apiClient.get<RelatorioLancamentoProdutosLinha[]>(
      `${BASE}/relatorio/lancamento-produtos${query ? `?${query}` : ''}`
    );
  }

  async downloadRelatorioLancamentoProdutosPdf(
    dataInicial?: string,
    dataFinal?: string,
    rocaId?: number
  ): Promise<void> {
    const q = new URLSearchParams();
    if (dataInicial?.trim()) q.set('data_inicial', dataInicial.trim());
    if (dataFinal?.trim()) q.set('data_final', dataFinal.trim());
    if (rocaId != null) q.set('rocaId', String(rocaId));
    const query = q.toString();
    const blob = await apiClient.getBlob(
      `${BASE}/relatorio/lancamento-produtos/pdf${query ? `?${query}` : ''}`
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-lancamento-produtos-${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async printRelatorioLancamentoProdutosPdf(
    dataInicial?: string,
    dataFinal?: string,
    rocaId?: number
  ): Promise<void> {
    const q = new URLSearchParams();
    if (dataInicial?.trim()) q.set('data_inicial', dataInicial.trim());
    if (dataFinal?.trim()) q.set('data_final', dataFinal.trim());
    if (rocaId != null) q.set('rocaId', String(rocaId));
    const query = q.toString();
    const blob = await apiClient.getBlob(
      `${BASE}/relatorio/lancamento-produtos/pdf${query ? `?${query}` : ''}`
    );
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (!win) {
      throw new Error('Não foi possível abrir o PDF para impressão. Verifique o bloqueador de pop-ups.');
    }
  }
}

export interface RelatorioLancamentoProdutosLinha {
  produto_id: number;
  codigo: string;
  nome: string;
  roca_nome: string;
  estoque_inicial: number;
  qtde_lancada: number;
  valor_total_lancado: number;
  total_pagar_meeiros: number;
  estoque_atual: number;
}

export const controleRocaService = new ControleRocaService();
