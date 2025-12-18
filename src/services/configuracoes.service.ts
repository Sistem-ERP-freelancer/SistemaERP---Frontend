import { apiClient } from './api';

export interface Configuracoes {
  tema?: 'claro' | 'escuro';
  moeda?: string;
  fuso_horario?: string;
  idioma?: string;
  [key: string]: any; // Permite outras configurações personalizadas
}

export interface UpdateConfiguracoesDto {
  configuracoes?: Configuracoes;
  tema?: 'claro' | 'escuro';
  moeda?: string;
  fuso_horario?: string;
  idioma?: string;
}

class ConfiguracoesService {
  async obter(): Promise<Configuracoes> {
    return apiClient.get<Configuracoes>('/configuracoes');
  }

  async atualizar(data: UpdateConfiguracoesDto): Promise<Configuracoes> {
    // Se vier com 'configuracoes', usa diretamente
    if (data.configuracoes) {
      return apiClient.put<Configuracoes>('/configuracoes', {
        configuracoes: data.configuracoes,
      });
    }
    
    // Caso contrário, envia os campos diretamente (atualização parcial)
    const payload: Partial<Configuracoes> = {};
    if (data.tema !== undefined) payload.tema = data.tema;
    if (data.moeda !== undefined) payload.moeda = data.moeda;
    if (data.fuso_horario !== undefined) payload.fuso_horario = data.fuso_horario;
    if (data.idioma !== undefined) payload.idioma = data.idioma;

    return apiClient.put<Configuracoes>('/configuracoes', payload);
  }
}

export const configuracoesService = new ConfiguracoesService();

