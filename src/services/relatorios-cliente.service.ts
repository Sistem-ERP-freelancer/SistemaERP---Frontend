/**
 * Serviço para relatórios de cliente
 * Implementa todas as funcionalidades de relatórios conforme GUIA_FRONTEND_RELATORIOS_CLIENTE.md
 */

// Obter a URL base da API
const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  return 'https://sistemaerp-3.onrender.com/api/v1';
};

const API_BASE_URL = getApiBaseUrl();

export interface CompartilharRelatorioParams {
  tipoRelatorio: 'financeiro' | 'producao';
  dataInicial?: string;
  dataFinal?: string;
  horasValidade?: number;
}

export interface CompartilharRelatorioResponse {
  token: string;
  url: string;
  linkWhatsApp: string;
  expiraEm: string;
}

export interface EnviarEmailParams {
  email: string;
  tipoRelatorio: 'financeiro' | 'producao';
  dataInicial?: string;
  dataFinal?: string;
}

export interface EnviarEmailResponse {
  success: boolean;
  message: string;
  email: string;
}

class RelatoriosClienteService {
  private getAuthToken(): string | null {
    return localStorage.getItem('access_token');
  }

  private async downloadPDF(
    endpoint: string,
    defaultFilename: string
  ): Promise<void> {
    const token = this.getAuthToken();
    if (!token) {
      throw new Error('Token de autenticação não encontrado');
    }

    const url = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    // Verificar se a resposta é um PDF
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/pdf')) {
      try {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao gerar relatório');
      } catch {
        throw new Error(`Erro HTTP: ${response.status} ${response.statusText}`);
      }
    }

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();

    if (blob.size === 0) {
      throw new Error('O PDF gerado está vazio');
    }

    // Extrair nome do arquivo do header Content-Disposition
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = defaultFilename;
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    // Criar URL temporária e fazer download
    const urlBlob = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = urlBlob;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    // Limpar
    document.body.removeChild(link);
    window.URL.revokeObjectURL(urlBlob);
  }

  /**
   * Baixa o relatório financeiro de um cliente
   */
  async downloadRelatorioFinanceiro(clienteId: number): Promise<void> {
    await this.downloadPDF(
      `/relatorios/cliente/${clienteId}/financeiro/pdf`,
      `relatorio-financeiro-cliente-${clienteId}.pdf`
    );
  }

  /**
   * Abre o relatório financeiro para impressão
   */
  async imprimirRelatorioFinanceiro(clienteId: number): Promise<void> {
    const token = this.getAuthToken();
    if (!token) {
      throw new Error('Token de autenticação não encontrado');
    }

    const url = `${API_BASE_URL}/relatorios/cliente/${clienteId}/financeiro/imprimir`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erro ${response.status}`);
    }

    const blob = await response.blob();
    const urlBlob = window.URL.createObjectURL(blob);
    
    // Abrir em nova janela para impressão
    const printWindow = window.open(urlBlob, '_blank');
    
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
    
    // Limpar URL após um tempo
    setTimeout(() => {
      window.URL.revokeObjectURL(urlBlob);
    }, 1000);
  }

  /**
   * Baixa o relatório de produção de um cliente (com filtro de período opcional)
   */
  async downloadRelatorioProducao(
    clienteId: number,
    dataInicial?: string,
    dataFinal?: string
  ): Promise<void> {
    const params = new URLSearchParams();
    if (dataInicial) params.append('data_inicial', dataInicial);
    if (dataFinal) params.append('data_final', dataFinal);
    
    const queryString = params.toString();
    const endpoint = `/relatorios/cliente/${clienteId}/producao/pdf${queryString ? `?${queryString}` : ''}`;

    await this.downloadPDF(
      endpoint,
      `relatorio-producao-cliente-${clienteId}.pdf`
    );
  }

  /**
   * Abre o relatório de produção para impressão (com filtro de período opcional)
   */
  async imprimirRelatorioProducao(
    clienteId: number,
    dataInicial?: string,
    dataFinal?: string
  ): Promise<void> {
    const token = this.getAuthToken();
    if (!token) {
      throw new Error('Token de autenticação não encontrado');
    }

    const params = new URLSearchParams();
    if (dataInicial) params.append('data_inicial', dataInicial);
    if (dataFinal) params.append('data_final', dataFinal);
    
    const queryString = params.toString();
    const url = `${API_BASE_URL}/relatorios/cliente/${clienteId}/producao/imprimir${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erro ${response.status}`);
    }

    const blob = await response.blob();
    const urlBlob = window.URL.createObjectURL(blob);
    
    // Abrir em nova janela para impressão
    const printWindow = window.open(urlBlob, '_blank');
    
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
    
    // Limpar URL após um tempo
    setTimeout(() => {
      window.URL.revokeObjectURL(urlBlob);
    }, 1000);
  }

  /**
   * Gera link de compartilhamento para um relatório
   */
  async compartilharRelatorio(
    clienteId: number,
    params: CompartilharRelatorioParams
  ): Promise<CompartilharRelatorioResponse> {
    const token = this.getAuthToken();
    if (!token) {
      throw new Error('Token de autenticação não encontrado');
    }

    const url = `${API_BASE_URL}/relatorios/cliente/${clienteId}/compartilhar`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erro ${response.status}`);
    }

    const data: CompartilharRelatorioResponse = await response.json();
    return data;
  }

  /**
   * Envia relatório por email
   */
  async enviarRelatorioPorEmail(
    clienteId: number,
    params: EnviarEmailParams
  ): Promise<EnviarEmailResponse> {
    const token = this.getAuthToken();
    if (!token) {
      throw new Error('Token de autenticação não encontrado');
    }

    const url = `${API_BASE_URL}/relatorios/cliente/${clienteId}/enviar-email`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erro ${response.status}`);
    }

    const data: EnviarEmailResponse = await response.json();
    return data;
  }
}

export const relatoriosClienteService = new RelatoriosClienteService();















