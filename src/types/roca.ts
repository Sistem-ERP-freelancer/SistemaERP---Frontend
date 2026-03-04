/**
 * Tipos do módulo Controle de Roça (produtor, roça, meeiro, produto, lançamento).
 */

export interface ProdutorRoca {
  id: number;
  codigo: string;
  nome_razao: string;
  cpf_cnpj?: string;
  telefone?: string;
  whatsapp?: string;
  endereco?: string;
  ativo?: boolean;
  criadoEm?: string;
  atualizadoEm?: string;
}

export interface CreateProdutorRocaDto {
  /** Se não informado, o backend gera automaticamente (ex: P001, P002). */
  codigo?: string;
  nome_razao: string;
  cpf_cnpj?: string;
  telefone?: string;
  whatsapp?: string;
  endereco?: string;
}

export interface UpdateProdutorRocaDto {
  codigo?: string;
  nome_razao?: string;
  cpf_cnpj?: string;
  telefone?: string;
  whatsapp?: string;
  endereco?: string;
  ativo?: boolean;
}

export interface Roca {
  id: number;
  codigo: string;
  nome: string;
  localizacao?: string;
  produtorId: number;
  ativo?: boolean;
  criadoEm?: string;
  atualizadoEm?: string;
}

export interface CreateRocaDto {
  /** Se não informado, o backend gera automaticamente (ex: R001, R002). */
  codigo?: string;
  nome: string;
  localizacao?: string;
  produtorId: number;
}

/** Resposta do GET /rocas/:id (detalhes com produtor) */
export interface RocaDetalhes extends Roca {
  produtorCodigo?: string;
  produtorNome?: string;
}

export interface UpdateRocaDto {
  codigo?: string | null;
  nome?: string;
  /** Envie null para limpar a localização. */
  localizacao?: string | null;
  produtorId?: number;
  /** Se false, desativa a roça (não aparece na listagem). */
  ativo?: boolean;
}

export interface MeeiroRoca {
  id: number;
  codigo: string;
  nome: string;
  cpf?: string;
  telefone?: string;
  endereco?: string;
  porcentagem_padrao: number;
  produtorId: number;
  criadoEm?: string;
  atualizadoEm?: string;
}

export interface CreateMeeiroRocaDto {
  /** Se não informado, o backend gera automaticamente (ex: M001, M002). */
  codigo?: string;
  nome: string;
  cpf?: string;
  telefone?: string;
  endereco?: string;
  porcentagem_padrao: number;
  produtorId: number;
}

export interface UpdateMeeiroRocaDto {
  codigo?: string;
  nome?: string;
  cpf?: string;
  telefone?: string;
  endereco?: string;
  porcentagem_padrao?: number;
  produtorId?: number;
}

export type UnidadeMedidaRoca = 'UN' | 'KG' | 'LT' | 'CX' | 'SC' | 'ARROBA';

export interface ProdutoRoca {
  id: number;
  codigo: string;
  nome: string;
  unidade_medida: string;
  produtorId: number;
  criadoEm?: string;
  atualizadoEm?: string;
}

export interface CreateProdutoRocaDto {
  codigo: string;
  nome: string;
  unidade_medida?: string;
  produtorId: number;
}

export interface LancamentoProducaoRocaMeeiroDto {
  meeiroId: number;
  porcentagem?: number;
}

export interface LancamentoProducaoRocaProdutoDto {
  produtoId: number;
  quantidade: number;
  preco_unitario: number;
}

export interface CreateLancamentoProducaoRocaDto {
  data: string;
  rocaId: number;
  meeiros: LancamentoProducaoRocaMeeiroDto[];
  produtos: LancamentoProducaoRocaProdutoDto[];
}

export interface LancamentoProducaoRoca {
  id: number;
  data: string;
  produtorId: number;
  rocaId: number;
  total_geral: number;
}

export interface LinhaRelatorioMeeiro {
  data: string;
  produto: string;
  quantidade: number;
  preco_unitario: number;
  valor_total: number;
}

export interface ResumoRelatorioMeeiro {
  valorBruto: number;
  percentualMedio: number;
  valorTotalReceber: number;
}

export interface RelatorioMeeiroResponse {
  linhas: LinhaRelatorioMeeiro[];
  resumo: ResumoRelatorioMeeiro;
}
