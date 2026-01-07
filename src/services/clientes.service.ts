import { apiClient } from "./api";
import { UpdateClientePayload } from "@/shared/types/update.types";
import { prepararPayloadAtualizacaoCliente, tratarErroAtualizacao } from "@/lib/update-payload";
import { ClienteFormState } from "@/shared/types/update.types";

// Enum de Status do Cliente (conforme GUIA-FRONTEND-ATUALIZACAO-STATUS-CLIENTE.md)
export enum StatusCliente {
  ATIVO = "ATIVO",
  INATIVO = "INATIVO",
  BLOQUEADO = "BLOQUEADO",
  INADIMPLENTE = "INADIMPLENTE",
}

export interface Cliente {
  id: number;
  nome: string;
  nome_fantasia?: string;
  nome_razao?: string;
  tipoPessoa: "PESSOA_FISICA" | "PESSOA_JURIDICA";
  statusCliente: StatusCliente;
  cpf_cnpj: string;
  inscricao_estadual?: string;
  limite_credito?: number;
  criadoEm?: string;
  atualizadoEm?: string;
  enderecos?: Array<{
    id?: number;
    cep: string;
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
    referencia?: string;
  }>;
  contato?: Array<{
    id?: number;
    telefone: string;
    email?: string;
    nomeContato?: string;
    nome_contato?: string;
    outroTelefone?: string;
    outro_telefone?: string;
    nomeOutroTelefone?: string;
    nome_outro_telefone?: string;
    observacao?: string;
    ativo?: boolean;
  }>;
}

export interface CreateClienteDto {
  nome: string;
  nome_fantasia?: string;
  nome_razao?: string;
  tipoPessoa: "PESSOA_FISICA" | "PESSOA_JURIDICA";
  statusCliente?: StatusCliente;
  cpf_cnpj: string;
  inscricao_estadual?: string;
  limite_credito?: number;
  contatos?: Array<{
    id?: number;
    telefone: string;
    email?: string;
    nomeContato?: string;
    outroTelefone?: string;
    nomeOutroTelefone?: string;
    observacao?: string;
    ativo?: boolean;
  }>;
  enderecos?: Array<{
    id?: number;
    cep: string;
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
    referencia?: string;
  }>;
}

export interface UpdateStatusClientePayload {
  statusCliente: StatusCliente;
  // Outros campos opcionais...
  nome?: string;
  tipoPessoa?: string;
  cpf_cnpj?: string;
}

export interface ClientesResponse {
  data?: Cliente[];
  clientes?: Cliente[];
  total: number;
  page?: number;
  limit?: number;
}

export interface ClientesEstatisticas {
  total: number;
  ativos: number;
  inativos: number;
  bloqueados: number;
  inadimplentes: number;
  novosNoMes: number;
}

export interface FiltrosClientes {
  termo?: string;
  tipoPessoa?: string;
  statusCliente?: string;
  cidade?: string;
  estado?: string;
  telefone?: string;
  email?: string;
  nomeContato?: string;
  page?: number;
  limit?: number;
}

// Função helper para extrair clientes de forma consistente
export function extractClientesFromResponse(response: any): Cliente[] {
  if (Array.isArray(response)) {
    return response;
  }
  if (response?.data && Array.isArray(response.data)) {
    return response.data;
  }
  if (response?.clientes && Array.isArray(response.clientes)) {
    return response.clientes;
  }
  return [];
}

class ClientesService {
  async listar(params?: {
    page?: number;
    limit?: number;
    statusCliente?: string;
  }): Promise<ClientesResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.statusCliente)
      queryParams.append("statusCliente", params.statusCliente);

    const query = queryParams.toString();
    return apiClient.get<ClientesResponse>(
      `/clientes${query ? `?${query}` : ""}`
    );
  }

  async buscarPorId(id: number): Promise<Cliente> {
    return apiClient.get<Cliente>(`/clientes/${id}`);
  }

  async criar(data: CreateClienteDto): Promise<Cliente> {
    return apiClient.post<Cliente>("/clientes", data);
  }

  async atualizar(
    id: number,
    data: Partial<CreateClienteDto>
  ): Promise<Cliente> {
    return apiClient.patch<Cliente>(`/clientes/${id}`, data);
  }

  /**
   * Atualiza parcialmente um cliente conforme GUIA_FRONTEND_ATUALIZACAO_CLIENTES_E_FORNECEDORES.md
   * 
   * @param id - ID do cliente
   * @param dadosForm - Dados do formulário com estado completo
   * @param camposAlterados - Array de nomes dos campos que foram alterados
   * @returns Cliente atualizado
   * 
   * Comportamento:
   * - Apenas campos enviados são atualizados
   * - Campos não enviados permanecem inalterados
   * - Campos vazios são convertidos para NULL
   * - Arrays não enviados mantêm os itens existentes
   * - Arrays vazios removem todos os itens
   */
  async atualizarParcial(
    id: number,
    dadosForm: ClienteFormState,
    camposAlterados: string[]
  ): Promise<Cliente> {
    try {
      const payload = prepararPayloadAtualizacaoCliente(dadosForm, camposAlterados);
      
      if (import.meta.env.DEV) {
        console.log("📤 [Atualizar Parcial Cliente] Enviando payload:", {
          id,
          payload,
          camposAlterados,
          payloadJSON: JSON.stringify(payload, null, 2),
        });
      }
      
      const response = await apiClient.patch<Cliente>(`/clientes/${id}`, payload);
      
      if (import.meta.env.DEV) {
        console.log("✅ [Atualizar Parcial Cliente] Cliente atualizado:", response);
      }
      
      return response;
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error("❌ [Atualizar Parcial Cliente] Erro:", error);
      }
      
      const erroTratado = tratarErroAtualizacao(error);
      throw new Error(erroTratado.error);
    }
  }

  /**
   * Atualiza o status de um cliente
   * @param id - ID do cliente
   * @param status - Novo status (ATIVO, INATIVO, BLOQUEADO, INADIMPLENTE)
   * @returns Cliente atualizado
   * 
   * Conforme GUIA-FRONTEND-ATUALIZACAO-STATUS-CLIENTE.md:
   * - Endpoint: PATCH /api/v1/clientes/:id
   * - Campo: statusCliente (camelCase) - OBRIGATÓRIO usar camelCase
   * - Valores: ATIVO, INATIVO, BLOQUEADO, INADIMPLENTE
   * - Permissão: ADMIN ou GERENTE
   */
  async atualizarStatus(id: number, status: StatusCliente): Promise<Cliente> {
    const payload: UpdateStatusClientePayload = {
      statusCliente: status, // ✅ Use camelCase: statusCliente
    };

    console.log("📤 [Atualizar Status] Enviando payload:", payload);

    try {
      const response = await apiClient.patch<Cliente>(
        `/clientes/${id}`,
        payload
      );

      console.log(
        "✅ [Atualizar Status] Status atualizado com sucesso:",
        response
      );
      return response;
    } catch (error) {
      console.error("❌ [Atualizar Status] Erro ao atualizar status:", error);
      throw error;
    }
  }

  async deletar(id: number): Promise<void> {
    return apiClient.delete<void>(`/clientes/${id}`);
  }

  /**
   * Busca clientes por termo (nome, razão social, nome fantasia, CPF/CNPJ)
   * Usa o endpoint GET /api/v1/clientes?busca={termo} conforme documentação
   */
  async buscar(
    termo: string,
    page: number = 1,
    limit: number = 100
  ): Promise<ClientesResponse> {
    const queryParams = new URLSearchParams();
    queryParams.append("busca", termo); // Usar "busca" conforme documentação
    queryParams.append("page", page.toString());
    queryParams.append("limit", limit.toString());

    return apiClient.get<ClientesResponse>(
      `/clientes?${queryParams.toString()}`
    );
  }

  async buscarAvancado(params?: FiltrosClientes): Promise<ClientesResponse> {
    const queryParams = new URLSearchParams();
    if (params?.termo) queryParams.append("termo", params.termo);
    if (params?.tipoPessoa) queryParams.append("tipoPessoa", params.tipoPessoa);
    if (params?.statusCliente)
      queryParams.append("statusCliente", params.statusCliente);
    if (params?.cidade) queryParams.append("cidade", params.cidade);
    if (params?.estado) queryParams.append("estado", params.estado);
    if (params?.telefone) queryParams.append("telefone", params.telefone);
    if (params?.email) queryParams.append("email", params.email);
    if (params?.nomeContato)
      queryParams.append("nomeContato", params.nomeContato);
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const query = queryParams.toString();
    return apiClient.get<ClientesResponse>(
      `/clientes/buscar-avancado${query ? `?${query}` : ""}`
    );
  }

  /**
   * Busca estatísticas de clientes
   * @returns Estatísticas de clientes (total, ativos, inativos, etc.)
   *
   * NOTA: Se receber erro 400 "Validation failed (numeric string is expected)",
   * o problema está no backend que está validando incorretamente parâmetros opcionais.
   * O endpoint não deveria exigir parâmetros para retornar estatísticas gerais.
   */
  async getEstatisticas(): Promise<ClientesEstatisticas> {
    return apiClient.get<ClientesEstatisticas>("/clientes/estatisticas");
  }
}

export const clientesService = new ClientesService();
