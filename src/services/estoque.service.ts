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
}

export const estoqueService = new EstoqueService();



