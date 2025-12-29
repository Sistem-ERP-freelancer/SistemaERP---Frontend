/**
 * Função helper para preparar atualização de cliente conforme GUIA_FRONTEND_ATUALIZACAO_CLIENTES_E_FORNECEDORES.md
 * 
 * Esta função converte os dados do formulário de edição para o formato esperado pelo método atualizarParcial
 */

import { ClienteFormState } from '@/shared/types/update.types';
import { Cliente } from '@/services/clientes.service';

interface EditFormData {
  nome?: string;
  nome_fantasia?: string;
  nome_razao?: string;
  tipoPessoa?: 'PESSOA_FISICA' | 'PESSOA_JURIDICA';
  statusCliente?: 'ATIVO' | 'INATIVO' | 'BLOQUEADO' | 'INADIMPLENTE';
  cpf_cnpj?: string;
  inscricao_estadual?: string;
  enderecos?: Array<{
    id?: number;
    cep?: string;
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    referencia?: string;
  }>;
  contatos?: Array<{
    id?: number;
    telefone?: string;
    email?: string;
    nomeContato?: string;
    outroTelefone?: string;
    nomeOutroTelefone?: string;
    observacao?: string;
    ativo?: boolean;
  }>;
}

/**
 * Converte dados do formulário de edição para ClienteFormState e identifica campos alterados
 */
export function prepararAtualizacaoCliente(
  clienteOriginal: Cliente,
  dadosEditados: EditFormData
): { formState: ClienteFormState; camposAlterados: string[] } {
  const camposAlterados: string[] = [];
  const formState: ClienteFormState = {
    enderecos: [],
    contatos: [],
  };

  // Verificar campos básicos alterados
  if (dadosEditados.nome !== undefined && dadosEditados.nome !== clienteOriginal.nome) {
    formState.nome = dadosEditados.nome;
    camposAlterados.push('nome');
  }

  if (dadosEditados.tipoPessoa !== undefined && dadosEditados.tipoPessoa !== clienteOriginal.tipoPessoa) {
    formState.tipoPessoa = dadosEditados.tipoPessoa;
    camposAlterados.push('tipoPessoa');
  }

  if (dadosEditados.statusCliente !== undefined && dadosEditados.statusCliente !== clienteOriginal.statusCliente) {
    formState.statusCliente = dadosEditados.statusCliente;
    camposAlterados.push('statusCliente');
  }

  if (dadosEditados.cpf_cnpj !== undefined && dadosEditados.cpf_cnpj !== clienteOriginal.cpf_cnpj) {
    formState.cpf_cnpj = dadosEditados.cpf_cnpj;
    camposAlterados.push('cpf_cnpj');
  }

  if (dadosEditados.nome_fantasia !== undefined && dadosEditados.nome_fantasia !== (clienteOriginal.nome_fantasia || '')) {
    formState.nome_fantasia = dadosEditados.nome_fantasia;
    camposAlterados.push('nome_fantasia');
  }

  if (dadosEditados.nome_razao !== undefined && dadosEditados.nome_razao !== (clienteOriginal.nome_razao || '')) {
    formState.nome_razao = dadosEditados.nome_razao;
    camposAlterados.push('nome_razao');
  }

  if (dadosEditados.inscricao_estadual !== undefined && dadosEditados.inscricao_estadual !== (clienteOriginal.inscricao_estadual || '')) {
    formState.inscricao_estadual = dadosEditados.inscricao_estadual;
    camposAlterados.push('inscricao_estadual');
  }

  // Processar endereços
  if (dadosEditados.enderecos !== undefined) {
    formState.enderecos = dadosEditados.enderecos.map((end) => ({
      id: end.id,
      cep: end.cep || '',
      logradouro: end.logradouro || '',
      numero: end.numero || '',
      complemento: end.complemento || '',
      bairro: end.bairro || '',
      cidade: end.cidade || '',
      estado: end.estado || '',
      referencia: end.referencia || '',
      isNew: !end.id, // Se não tem ID, é novo
    }));
    camposAlterados.push('enderecos');
  } else {
    // Se não foi enviado, manter os existentes
    formState.enderecos = (clienteOriginal.enderecos || []).map((end) => ({
      id: end.id,
      cep: end.cep || '',
      logradouro: end.logradouro || '',
      numero: end.numero || '',
      complemento: end.complemento || '',
      bairro: end.bairro || '',
      cidade: end.cidade || '',
      estado: end.estado || '',
      referencia: end.referencia || '',
      isNew: false,
    }));
  }

  // Processar contatos
  if (dadosEditados.contatos !== undefined) {
    formState.contatos = dadosEditados.contatos
      .filter((cont) => cont.telefone?.trim()) // Filtrar contatos sem telefone
      .map((cont) => ({
        id: cont.id,
        telefone: cont.telefone || '',
        email: cont.email || '',
        nomeContato: cont.nomeContato || '',
        outroTelefone: cont.outroTelefone || '',
        nomeOutroTelefone: cont.nomeOutroTelefone || '',
        observacao: cont.observacao || '',
        ativo: cont.ativo !== undefined ? cont.ativo : true,
        isNew: !cont.id, // Se não tem ID, é novo
      }));
    camposAlterados.push('contatos');
  } else {
    // Se não foi enviado, manter os existentes
    formState.contatos = (clienteOriginal.contato || []).map((cont) => ({
      id: cont.id,
      telefone: cont.telefone || '',
      email: cont.email || '',
      nomeContato: cont.nomeContato || cont.nome_contato || '',
      outroTelefone: cont.outroTelefone || cont.outro_telefone || '',
      nomeOutroTelefone: cont.nomeOutroTelefone || cont.nome_outro_telefone || '',
      observacao: cont.observacao || '',
      ativo: cont.ativo !== undefined ? cont.ativo : true,
      isNew: false,
    }));
  }

  return { formState, camposAlterados };
}





