import { apiClient } from "./api";

export interface Contato {
  id?: number;
  telefone?: string;
  email?: string;
  nomeContato?: string;
  nome_contato?: string;
  outroTelefone?: string;
  outro_telefone?: string;
  nomeOutroTelefone?: string;
  nome_outro_telefone?: string;
  observacao?: string;
  ativo?: boolean;
}

export interface Endereco {
  id?: number;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  referencia?: string;
}

export interface Fornecedor {
  id: number;
  nome_fantasia?: string;
  nome_razao: string;
  tipoFornecedor: "PESSOA_FISICA" | "PESSOA_JURIDICA";
  statusFornecedor: "ATIVO" | "INATIVO" | "BLOQUEADO";
  cpf_cnpj?: string;
  inscricao_estadual?: string;
  criandoEm?: string;
  atualizadoEm?: string;
  enderecos?: Endereco[];
  contato?: Contato[];
}

export interface CreateEnderecoDto {
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  referencia?: string;
}

export interface CreateContatoDto {
  nome_contato?: string;
  nomeContato?: string;
  email?: string;
  telefone?: string;
  outro_telefone?: string;
  outroTelefone?: string;
  nome_outro_telefone?: string;
  nomeOutroTelefone?: string;
  observacao?: string;
  ativo?: boolean;
}

export interface CreateFornecedorDto {
  nome_fantasia: string;
  nome_razao: string;
  tipoFornecedor: "PESSOA_FISICA" | "PESSOA_JURIDICA";
  statusFornecedor?: "ATIVO" | "INATIVO" | "BLOQUEADO";
  cpf_cnpj: string;
  inscricao_estadual?: string;
  enderecos?: CreateEnderecoDto[];
  contato?: CreateContatoDto[];
}

export interface FornecedoresResponse {
  data?: Fornecedor[];
  fornecedores?: Fornecedor[];
  total: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export interface FornecedoresEstatisticas {
  total: number;
  ativos: number;
  inativos: number;
  bloqueados: number;
  novosNoMes: number;
}

class FornecedoresService {
  async listar(params?: {
    page?: number;
    limit?: number;
    statusFornecedor?: string;
  }): Promise<FornecedoresResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.statusFornecedor)
      queryParams.append("statusFornecedor", params.statusFornecedor);

    const query = queryParams.toString();
    return apiClient.get<FornecedoresResponse>(
      `/fornecedor${query ? `?${query}` : ""}`
    );
  }

  async buscarPorId(id: number): Promise<Fornecedor> {
    return apiClient.get<Fornecedor>(`/fornecedor/${id}`);
  }

  async criar(data: CreateFornecedorDto): Promise<Fornecedor> {
    // Mapear campos do DTO para o formato esperado pela API
    const payload: any = {
      nome_fantasia: data.nome_fantasia,
      nome_razao: data.nome_razao,
      cpf_cnpj: data.cpf_cnpj,
      tipoFornecedor: data.tipoFornecedor,
      statusFornecedor: data.statusFornecedor || "ATIVO",
    };

    if (data.inscricao_estadual) {
      payload.inscricao_estadual = data.inscricao_estadual;
    }

    // Adicionar endereços se fornecidos
    if (data.enderecos && data.enderecos.length > 0) {
      payload.enderecos = data.enderecos;
    }

    // Adicionar contatos se fornecidos
    if (data.contato && data.contato.length > 0) {
      payload.contato = data.contato;
    }

    return apiClient.post<Fornecedor>("/fornecedor", payload);
  }

  async atualizar(
    id: number,
    data: Partial<CreateFornecedorDto>
  ): Promise<Fornecedor> {
    return apiClient.patch<Fornecedor>(`/fornecedor/${id}`, data);
  }

  async deletar(id: number): Promise<void> {
    return apiClient.delete<void>(`/fornecedor/${id}`);
  }

  async buscarSugestoes(
    termo: string,
    limit: number = 10
  ): Promise<Fornecedor[]> {
    return apiClient.get<Fornecedor[]>(
      `/fornecedor/sugestoes?termo=${termo}&limit=${limit}`
    );
  }

  async getEstatisticas(): Promise<FornecedoresEstatisticas> {
    return apiClient.get<FornecedoresEstatisticas>("/fornecedor/estatisticas");
  }

  async buscar(
    termo: string,
    params?: {
      page?: number;
      limit?: number;
    }
  ): Promise<FornecedoresResponse> {
    const queryParams = new URLSearchParams();
    queryParams.append("termo", termo);
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const query = queryParams.toString();
    return apiClient.get<FornecedoresResponse>(`/fornecedor/buscar?${query}`);
  }

  async buscarAvancado(params?: {
    termo?: string;
    tipoFornecedor?: string;
    statusFornecedor?: string;
    cidade?: string;
    estado?: string;
    telefone?: string;
    email?: string;
    nomeContato?: string;
    page?: number;
    limit?: number;
  }): Promise<FornecedoresResponse> {
    const queryParams = new URLSearchParams();
    if (params?.termo) queryParams.append("termo", params.termo);
    if (params?.tipoFornecedor)
      queryParams.append("tipoFornecedor", params.tipoFornecedor);
    if (params?.statusFornecedor)
      queryParams.append("statusFornecedor", params.statusFornecedor);
    if (params?.cidade) queryParams.append("cidade", params.cidade);
    if (params?.estado) queryParams.append("estado", params.estado);
    if (params?.telefone) queryParams.append("telefone", params.telefone);
    if (params?.email) queryParams.append("email", params.email);
    if (params?.nomeContato)
      queryParams.append("nomeContato", params.nomeContato);
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const query = queryParams.toString();
    return apiClient.get<FornecedoresResponse>(
      `/fornecedor/buscar-avancado?${query}`
    );
  }
}

export const fornecedoresService = new FornecedoresService();
