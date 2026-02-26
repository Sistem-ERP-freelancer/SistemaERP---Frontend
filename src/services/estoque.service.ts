import { apiClient } from './api';

export type TipoMovimentacao = 
  | 'ENTRADA' 
  | 'SAIDA' 
  | 'AJUSTE' 
  | 'DEVOLUCAO' 
  | 'PERDA' 
  | 'TRANSFERENCIA';

export interface MovimentacaoEstoqueDto {
  tipo: TipoMovimentacao;
  quantidade: number;
  observacao?: string;
  motivo?: string;
  documento_referencia?: string;
}

export interface MovimentacaoEstoque {
  id: number;
  produto_id: number;
  tipo: TipoMovimentacao;
  quantidade: number;
  estoque_anterior: number;
  estoque_atual: number;
  observacao?: string;
  motivo?: string;
  documento_referencia?: string;
  usuario_id: string;
  criado_em: string;
  produto?: {
    id: number;
    nome: string;
    sku: string;
  };
  usuario?: {
    id: string;
    nome: string;
  };
}

export interface HistoricoMovimentacao {
  movimentacoes: MovimentacaoEstoque[];
  total: number;
}

export interface ProdutoEstoque {
  id: number;
  nome: string;
  sku: string;
  estoque_atual: number;
  estoque_minimo: number;
  categoria_nome?: string;
  fornecedor_nome?: string;
}

export interface ProdutosEstoqueResponse {
  produtos: ProdutoEstoque[];
  total: number;
}

class EstoqueService {
  /**
   * Movimenta o estoque de um produto
   */
  async movimentar(
    produtoId: number,
    data: MovimentacaoEstoqueDto
  ): Promise<MovimentacaoEstoque> {
    return apiClient.post<MovimentacaoEstoque>(
      `/estoque/produtos/${produtoId}/movimentar`,
      data
    );
  }

  /**
   * Retorna o histórico de movimentações de um produto
   */
  async obterHistorico(
    produtoId: number,
    params?: { page?: number; limit?: number }
  ): Promise<HistoricoMovimentacao> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    return apiClient.get<HistoricoMovimentacao>(
      `/estoque/produtos/${produtoId}/historico${query ? `?${query}` : ''}`
    );
  }

  /**
   * Retorna produtos com estoque abaixo do mínimo (mas maior que zero)
   */
  async obterEstoqueBaixo(params?: {
    page?: number;
    limit?: number;
  }): Promise<ProdutosEstoqueResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    return apiClient.get<ProdutosEstoqueResponse>(
      `/estoque/baixo${query ? `?${query}` : ''}`
    );
  }

  /**
   * Retorna produtos com estoque crítico (zero ou muito abaixo do mínimo)
   */
  async obterEstoqueCritico(params?: {
    page?: number;
    limit?: number;
  }): Promise<ProdutosEstoqueResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    return apiClient.get<ProdutosEstoqueResponse>(
      `/estoque/critico${query ? `?${query}` : ''}`
    );
  }

  /**
   * Lista todas as movimentações de estoque
   */
  async listarMovimentacoes(params?: {
    page?: number;
    limit?: number;
    tipo?: TipoMovimentacao;
    produtoId?: number;
  }): Promise<HistoricoMovimentacao> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.tipo) queryParams.append('tipo', params.tipo);
    if (params?.produtoId) queryParams.append('produtoId', params.produtoId.toString());

    const query = queryParams.toString();
    return apiClient.get<HistoricoMovimentacao>(
      `/estoque/movimentacoes${query ? `?${query}` : ''}`
    );
  }

  /**
   * Dados do Relatório de Acompanhamento do Estoque (por período)
   */
  async getRelatorioAcompanhamento(params?: {
    data_inicial?: string;
    data_final?: string;
  }): Promise<RelatorioAcompanhamentoLinha[]> {
    const q = new URLSearchParams();
    if (params?.data_inicial) q.append('data_inicial', params.data_inicial);
    if (params?.data_final) q.append('data_final', params.data_final);
    const query = q.toString();
    return apiClient.get<RelatorioAcompanhamentoLinha[]>(
      `/estoque/relatorio/acompanhamento${query ? `?${query}` : ''}`
    );
  }

  /**
   * Download do PDF do Relatório de Acompanhamento do Estoque
   */
  async downloadRelatorioAcompanhamentoPdf(
    dataInicial?: string,
    dataFinal?: string
  ): Promise<void> {
    const q = new URLSearchParams();
    if (dataInicial?.trim()) q.append('data_inicial', dataInicial.trim());
    if (dataFinal?.trim()) q.append('data_final', dataFinal.trim());
    const query = q.toString();
    const blob = await apiClient.getBlob(
      `/estoque/relatorio/acompanhamento/pdf${query ? `?${query}` : ''}`
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-acompanhamento-estoque-${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export interface RelatorioAcompanhamentoLinha {
  produto_id: number;
  codigo: string;
  nome: string;
  estoque_inicial: number;
  total_compra: number;
  total_venda: number;
  estoque_atual: number;
}

export const estoqueService = new EstoqueService();



