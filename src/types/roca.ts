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
  /** Mudas plantadas (cadastro). */
  quantidadeMudasPlantadas?: number | null;
  dataPlantio?: string | null;
  dataInicioColheita?: string | null;
  /** Soma da quantidade colhida nos lançamentos ativos. */
  quantidadeColhidaTotal?: number;
  quantidadePesColhidosTotal?: number;
  /** quantidadeColhidaTotal / quantidadePesColhidosTotal (calculado no backend). */
  quantidadeColhidaPorPe?: number | null;
  /** Divisor usado em quantidadeColhidaPorPe (pés nos lançamentos ou mudas do cadastro). */
  denominadorProdutividade?: number | null;
  /** De onde veio o divisor do cálculo de produtividade. */
  origemDenominadorProdutividade?: 'LANCAMENTOS' | 'MUDAS_CADASTRO' | null;
}

export interface CreateRocaDto {
  /** Se não informado, o backend gera automaticamente (ex: R001, R002). */
  codigo?: string;
  nome: string;
  localizacao?: string;
  produtorId: number;
  quantidadeMudasPlantadas?: number;
  dataPlantio?: string;
  dataInicioColheita?: string;
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
  quantidadeMudasPlantadas?: number | null;
  dataPlantio?: string | null;
  dataInicioColheita?: string | null;
}

export interface MeeiroRoca {
  id: number;
  codigo: string;
  nome: string;
  cpf?: string;
  telefone?: string;
  pixChave?: string;
  endereco?: string;
  porcentagem_padrao: number;
  produtorId: number;
  criadoEm?: string;
  atualizadoEm?: string;
}

/** Campos opcionais considerados no relatório de cadastro incompleto. */
export type CampoCadastroMeeiroPendente = 'cpf' | 'telefone' | 'chavePix' | 'endereco';

export interface MeeiroCadastroIncompletoItem {
  meeiroId: number;
  codigo: string;
  nome: string;
  cpf: string | null;
  telefone: string | null;
  chavePix: string | null;
  endereco: string | null;
  produtorId: number;
  produtorNome: string | null;
  camposPendentes: CampoCadastroMeeiroPendente[];
}

export interface RelatorioMeeirosCadastroIncompletoResponse {
  total: number;
  itens: MeeiroCadastroIncompletoItem[];
  page?: number;
  limit?: number;
}

export interface CreateMeeiroRocaDto {
  /** Se não informado, o backend gera automaticamente (ex: M001, M002). */
  codigo?: string;
  nome: string;
  cpf?: string;
  telefone?: string;
  /** Chave PIX (CPF, celular, e-mail ou chave aleatória), opcional, até 140 caracteres. */
  pixChave?: string;
  endereco?: string;
  porcentagem_padrao: number;
  produtorId: number;
}

export interface UpdateMeeiroRocaDto {
  codigo?: string;
  nome?: string;
  cpf?: string;
  telefone?: string;
  pixChave?: string;
  endereco?: string;
  porcentagem_padrao?: number;
  produtorId?: number;
}

/** Status do empréstimo. */
export type EmprestimoStatus = 'ABERTO' | 'LIQUIDADO' | 'CANCELADO';

export interface EmprestimoMeeiro {
  id: number;
  meeiroId: number;
  valor: number;
  data: string;
  observacao?: string;
  status: EmprestimoStatus;
  createdAt?: string;
  updatedAt?: string;
}

/** Resumo no detalhe do meeiro: em aberto ou já com pagamento registrado. */
export type ResumoFinanceiroMeeiro =
  | {
      jaPago: true;
      valorTotalPago: number;
      /** Total a receber (base) registrado no último pagamento. */
      valorBasePagamento: number;
      teveEmprestimoNoPagamento: boolean;
    }
  | {
      jaPago: false;
      totalReceber: number;
      totalEmprestimosAbertos: number;
      valorLiquido: number;
    };

/** Resposta de GET /meeiros/:id (detalhe com resumo e empréstimos). */
export interface MeeiroDetalhe extends MeeiroRoca {
  documento?: string;
  resumoFinanceiro?: ResumoFinanceiroMeeiro;
  emprestimos?: EmprestimoMeeiro[];
}

export interface ListaEmprestimosResponse {
  items: EmprestimoMeeiro[];
  total: number;
  page: number;
  limit: number;
}

/** Item do resumo para tela de pagamento de meeiros. */
export interface ResumoPagamentoMeeiro {
  meeiroId: number;
  nome: string;
  chavePix: string | null;
  totalReceber: number;
  totalEmprestimosAbertos: number;
  /** Valor final a pagar (totalReceber - totalEmprestimosAbertos). */
  valorLiquido: number;
  /** True se o meeiro já teve pelo menos um pagamento registrado. */
  jaPago?: boolean;
  /** Soma dos valores líquidos pagos (histórico de tb_roca_pagamento_meeiro). */
  valorTotalPago?: number;
  /** Total a receber (base) do último pagamento registrado. */
  valorBasePagamento?: number | null;
  /** Se em algum pagamento havia empréstimo a descontar. */
  teveEmprestimoNoPagamento?: boolean;
}

export interface ResumoPagamentoMeeirosResponse {
  items: ResumoPagamentoMeeiro[];
  total: number;
  page: number;
  limit: number;
  /** Contagem da aba Em aberto (mesmos filtros da lista). */
  totalEmAberto?: number;
  /** Meeiros totalmente quitados: pagamento registrado, sem empréstimo em aberto e sem produção a receber. */
  totalQuitados?: number;
}

/** Payload para registrar pagamento de meeiro. */
export interface RegistrarPagamentoMeeiroDto {
  meeiroId: number;
  formaPagamento: string;
  contaCaixa?: string;
  dataPagamento: string;
  observacao?: string;
  /** Valor digitado pelo usuário para abater dos empréstimos em aberto. */
  valorAbaterEmprestimo?: number;
}

export interface RegistrarPagamentoMeeiroResponse {
  meeiroId: number;
  nome: string;
  dataPagamento: string;
  formaPagamento: string;
  contaCaixa: string | null;
  observacao: string | null;
  totalReceber: number;
  totalEmprestimos: number;
  valorAbaterEmprestimo: number;
  totalEmprestimosAbertosApos: number;
  valorLiquido: number;
  emprestimosLiquidados: Array<{ id: number; valor: number }>;
}

export type UnidadeMedidaRoca = 'UN' | 'KG' | 'LT' | 'CX' | 'SC' | 'ARROBA';

export interface ProdutoRoca {
  id: number;
  codigo: string;
  nome: string;
  unidade_medida: string;
  produtorId: number;
  /** ID do produto no catálogo global (módulo Produtos), quando criado via Controle de Roça. */
  produtoGlobalId?: number | null;
  criadoEm?: string;
  atualizadoEm?: string;
}

export interface CreateProdutoRocaDto {
  /** Se não informado, o sistema gera automaticamente (ex: PRD001, PRD002). */
  codigo?: string;
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
  /** Pés colhidos neste item (denominador da produtividade por pé na roça). */
  quantidadePesColhidos?: number;
  /** Porcentagem por meeiro sobre o valor deste produto (qtd × preço). */
  meeiros: LancamentoProducaoRocaMeeiroDto[];
}

export interface CreateLancamentoProducaoRocaDto {
  data: string;
  rocaId: number;
  produtos: LancamentoProducaoRocaProdutoDto[];
}

/** Item do lançamento (produto + quantidade) retornado na listagem/detalhes */
export interface LancamentoItemRoca {
  produtoId?: number;
  produto: string;
  unidade_medida?: string;
  quantidade: number;
  quantidadePesColhidos?: number | null;
  preco_unitario?: number;
  valor_total?: number;
  /** Meeiros e porcentagem/valor da parte sobre este item */
  meeiros?: LancamentoMeeiroRoca[];
}

export interface LancamentoProducaoRoca {
  id: number;
  data: string;
  produtorId: number;
  rocaId: number;
  /** Nome da roça conforme cadastro (preenchido pela API em listagem/detalhe) */
  rocaNome?: string | null;
  total_geral: number;
  ativo?: boolean;
  /** Itens do lançamento (produto, quantidade) — preenchido pela API ao listar */
  itens?: LancamentoItemRoca[];
  /** Meeiros do lançamento (nome, porcentagem, valor_parte) — preenchido pela API ao listar */
  meeiros?: LancamentoMeeiroRoca[];
}

export interface ListaLancamentosRocaResponse {
  items: LancamentoProducaoRoca[];
  total: number;
  page: number;
  limit: number;
}

export interface LancamentoMeeiroRoca {
  meeiroId: number;
  meeiroNome?: string;
  porcentagem: number;
  valor_parte: number;
}

/** Detalhes do lançamento (GET /lancamentos/:id) com itens e meeiros */
export interface LancamentoDetalhesRoca extends LancamentoProducaoRoca {
  meeiros?: LancamentoMeeiroRoca[];
}

export interface UpdateLancamentoProducaoRocaDto {
  data?: string;
  rocaId?: number;
  meeiros?: { meeiroId: number; porcentagem?: number }[];
  produtos?: LancamentoProducaoRocaProdutoDto[];
  ativo?: boolean;
}

export interface LinhaRelatorioMeeiro {
  data: string;
  produto: string;
  quantidade: number;
  preco_unitario: number;
  valor_total: number;
  /** Porcentagem do meeiro sobre o valor deste item (vindo da API) */
  porcentagem?: number;
  /** Valor que o meeiro recebe neste item (camelCase ou valor_parte em snake_case) */
  valorParte?: number;
  valor_parte?: number;
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
