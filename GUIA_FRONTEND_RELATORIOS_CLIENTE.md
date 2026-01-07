# 📄 Guia Frontend - Relatórios por Cliente

## 📌 Visão Geral

Este guia descreve como implementar no frontend todas as funcionalidades de relatórios por cliente, incluindo:
- Relatório Financeiro (com valores)
- Relatório de Produção (sem valores)
- Download de PDFs
- Impressão de PDFs
- Compartilhamento via link temporário
- Envio por email

---

## 🔗 Endpoints Disponíveis

### 📊 Relatório Financeiro

#### Download
```
GET /api/v1/relatorios/cliente/:clienteId/financeiro/pdf
```

#### Imprimir
```
GET /api/v1/relatorios/cliente/:clienteId/financeiro/imprimir
```

### 🏭 Relatório de Produção

#### Download
```
GET /api/v1/relatorios/cliente/:clienteId/producao/pdf?data_inicial=YYYY-MM-DD&data_final=YYYY-MM-DD
```

#### Imprimir
```
GET /api/v1/relatorios/cliente/:clienteId/producao/imprimir?data_inicial=YYYY-MM-DD&data_final=YYYY-MM-DD
```

### 📲 Compartilhar Relatório

```
POST /api/v1/relatorios/cliente/:clienteId/compartilhar
Body: {
  tipoRelatorio: "financeiro" | "producao",
  dataInicial?: "YYYY-MM-DD",
  dataFinal?: "YYYY-MM-DD",
  horasValidade?: number
}
```

### 📧 Enviar por Email

```
POST /api/v1/relatorios/cliente/:clienteId/enviar-email
Body: {
  email: "destinatario@email.com",
  tipoRelatorio: "financeiro" | "producao",
  dataInicial?: "YYYY-MM-DD",
  dataFinal?: "YYYY-MM-DD"
}
```

### 🔓 Acessar Relatório Compartilhado (Público)

```
GET /api/v1/relatorios/compartilhado/:token
```

---

## 🔐 Autenticação

Todos os endpoints (exceto acesso público) requerem autenticação via JWT:

```
Authorization: Bearer <seu_token_jwt>
```

**Roles permitidas:**
- `ADMIN`
- `GERENTE`
- `VENDEDOR`

---

## 💻 Implementação Frontend

### 1. Download de Relatório Financeiro

#### Exemplo com Fetch API

```typescript
/**
 * Baixa o relatório financeiro de um cliente
 * @param clienteId ID do cliente
 * @param token Token JWT de autenticação
 */
async function downloadRelatorioFinanceiro(
  clienteId: number,
  token: string
): Promise<void> {
  try {
    const response = await fetch(
      `/api/v1/relatorios/cliente/${clienteId}/financeiro/pdf`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erro ${response.status}`);
    }

    const blob = await response.blob();
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = `relatorio-financeiro-cliente-${clienteId}.pdf`;
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Erro ao baixar relatório:', error);
    throw error;
  }
}
```

#### Exemplo com Axios

```typescript
import axios from 'axios';

async function downloadRelatorioFinanceiro(
  clienteId: number,
  token: string
): Promise<void> {
  try {
    const response = await axios.get(
      `/api/v1/relatorios/cliente/${clienteId}/financeiro/pdf`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        responseType: 'blob',
      }
    );

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const contentDisposition = response.headers['content-disposition'];
    let filename = `relatorio-financeiro-cliente-${clienteId}.pdf`;
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error: any) {
    console.error('Erro ao baixar relatório:', error);
    throw error;
  }
}
```

---

### 2. Imprimir Relatório Financeiro

```typescript
/**
 * Abre o relatório financeiro para impressão
 * @param clienteId ID do cliente
 * @param token Token JWT de autenticação
 */
async function imprimirRelatorioFinanceiro(
  clienteId: number,
  token: string
): Promise<void> {
  try {
    const response = await fetch(
      `/api/v1/relatorios/cliente/${clienteId}/financeiro/imprimir`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Erro ao gerar relatório: ${response.statusText}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    
    // Abrir em nova janela para impressão
    const printWindow = window.open(url, '_blank');
    
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
    
    // Limpar URL após um tempo
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 1000);
  } catch (error) {
    console.error('Erro ao imprimir relatório:', error);
    throw error;
  }
}
```

---

### 3. Download de Relatório de Produção (com filtro de período)

```typescript
/**
 * Baixa o relatório de produção de um cliente
 * @param clienteId ID do cliente
 * @param token Token JWT de autenticação
 * @param dataInicial Data inicial (opcional) - formato YYYY-MM-DD
 * @param dataFinal Data final (opcional) - formato YYYY-MM-DD
 */
async function downloadRelatorioProducao(
  clienteId: number,
  token: string,
  dataInicial?: string,
  dataFinal?: string
): Promise<void> {
  try {
    // Construir URL com query params
    const params = new URLSearchParams();
    if (dataInicial) params.append('data_inicial', dataInicial);
    if (dataFinal) params.append('data_final', dataFinal);
    
    const url = `/api/v1/relatorios/cliente/${clienteId}/producao/pdf${params.toString() ? '?' + params.toString() : ''}`;

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
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = `relatorio-producao-cliente-${clienteId}.pdf`;
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    const urlBlob = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = urlBlob;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(urlBlob);
  } catch (error) {
    console.error('Erro ao baixar relatório:', error);
    throw error;
  }
}
```

---

### 4. Compartilhar Relatório

```typescript
interface CompartilharRelatorioParams {
  tipoRelatorio: 'financeiro' | 'producao';
  dataInicial?: string;
  dataFinal?: string;
  horasValidade?: number;
}

interface CompartilharRelatorioResponse {
  token: string;
  url: string;
  linkWhatsApp: string;
  expiraEm: string;
}

/**
 * Gera link de compartilhamento para um relatório
 * @param clienteId ID do cliente
 * @param token Token JWT de autenticação
 * @param params Parâmetros do compartilhamento
 */
async function compartilharRelatorio(
  clienteId: number,
  token: string,
  params: CompartilharRelatorioParams
): Promise<CompartilharRelatorioResponse> {
  try {
    const response = await fetch(
      `/api/v1/relatorios/cliente/${clienteId}/compartilhar`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erro ${response.status}`);
    }

    const data: CompartilharRelatorioResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao compartilhar relatório:', error);
    throw error;
  }
}

// Exemplo de uso
async function exemploCompartilhar() {
  const resultado = await compartilharRelatorio(1, token, {
    tipoRelatorio: 'financeiro',
    horasValidade: 48, // Link válido por 48 horas
  });

  console.log('Link público:', resultado.url);
  console.log('Link WhatsApp:', resultado.linkWhatsApp);
  console.log('Expira em:', resultado.expiraEm);
}
```

---

### 5. Enviar Relatório por Email

```typescript
interface EnviarEmailParams {
  email: string;
  tipoRelatorio: 'financeiro' | 'producao';
  dataInicial?: string;
  dataFinal?: string;
}

/**
 * Envia relatório por email
 * @param clienteId ID do cliente
 * @param token Token JWT de autenticação
 * @param params Parâmetros do envio
 */
async function enviarRelatorioPorEmail(
  clienteId: number,
  token: string,
  params: EnviarEmailParams
): Promise<{ success: boolean; message: string; email: string }> {
  try {
    const response = await fetch(
      `/api/v1/relatorios/cliente/${clienteId}/enviar-email`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erro ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao enviar relatório por email:', error);
    throw error;
  }
}

// Exemplo de uso
async function exemploEnviarEmail() {
  try {
    const resultado = await enviarRelatorioPorEmail(1, token, {
      email: 'cliente@email.com',
      tipoRelatorio: 'financeiro',
    });

    alert(`Relatório enviado com sucesso para ${resultado.email}`);
  } catch (error) {
    alert(`Erro ao enviar email: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}
```

---

### 6. Acessar Relatório Compartilhado (Público)

```typescript
/**
 * Abre relatório compartilhado (público, sem autenticação)
 * @param token Token do link compartilhado
 */
async function abrirRelatorioCompartilhado(token: string): Promise<void> {
  try {
    const url = `/api/v1/relatorios/compartilhado/${token}`;
    
    // Abrir em nova aba
    window.open(url, '_blank');
  } catch (error) {
    console.error('Erro ao abrir relatório compartilhado:', error);
    throw error;
  }
}

// Exemplo de uso
// Quando usuário clica em link compartilhado
function handleLinkCompartilhado(token: string) {
  abrirRelatorioCompartilhado(token);
}
```

---

## 🎨 Componente React Completo

```tsx
import React, { useState } from 'react';
import axios from 'axios';

interface RelatorioClienteProps {
  clienteId: number;
  token: string;
}

export const RelatorioCliente: React.FC<RelatorioClienteProps> = ({
  clienteId,
  token,
}) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dataInicial, setDataInicial] = useState<string>('');
  const [dataFinal, setDataFinal] = useState<string>('');
  const [emailDestinatario, setEmailDestinatario] = useState<string>('');
  const [linkCompartilhado, setLinkCompartilhado] = useState<string | null>(null);

  // Download Relatório Financeiro
  const handleDownloadFinanceiro = async () => {
    setLoading('download-financeiro');
    setError(null);

    try {
      const response = await axios.get(
        `/api/v1/relatorios/cliente/${clienteId}/financeiro/pdf`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
          responseType: 'blob',
        }
      );

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const contentDisposition = response.headers['content-disposition'];
      let filename = `relatorio-financeiro-cliente-${clienteId}.pdf`;
      
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) filename = match[1];
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao baixar relatório');
    } finally {
      setLoading(null);
    }
  };

  // Imprimir Relatório Financeiro
  const handleImprimirFinanceiro = async () => {
    setLoading('imprimir-financeiro');
    setError(null);

    try {
      const response = await axios.get(
        `/api/v1/relatorios/cliente/${clienteId}/financeiro/imprimir`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
          responseType: 'blob',
        }
      );

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank');
      
      if (printWindow) {
        printWindow.onload = () => printWindow.print();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao imprimir relatório');
    } finally {
      setLoading(null);
    }
  };

  // Download Relatório de Produção
  const handleDownloadProducao = async () => {
    setLoading('download-producao');
    setError(null);

    try {
      const params = new URLSearchParams();
      if (dataInicial) params.append('data_inicial', dataInicial);
      if (dataFinal) params.append('data_final', dataFinal);

      const url = `/api/v1/relatorios/cliente/${clienteId}/producao/pdf${params.toString() ? '?' + params.toString() : ''}`;

      const response = await axios.get(url, {
        headers: { 'Authorization': `Bearer ${token}` },
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const urlBlob = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = urlBlob;
      link.download = `relatorio-producao-cliente-${clienteId}.pdf`;
      link.click();
      window.URL.revokeObjectURL(urlBlob);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao baixar relatório');
    } finally {
      setLoading(null);
    }
  };

  // Compartilhar Relatório
  const handleCompartilhar = async (tipoRelatorio: 'financeiro' | 'producao') => {
    setLoading(`compartilhar-${tipoRelatorio}`);
    setError(null);

    try {
      const response = await axios.post(
        `/api/v1/relatorios/cliente/${clienteId}/compartilhar`,
        {
          tipoRelatorio,
          dataInicial: dataInicial || undefined,
          dataFinal: dataFinal || undefined,
          horasValidade: 24,
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      setLinkCompartilhado(response.data.url);
      
      // Copiar para clipboard
      await navigator.clipboard.writeText(response.data.url);
      alert('Link copiado para a área de transferência!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao compartilhar relatório');
    } finally {
      setLoading(null);
    }
  };

  // Enviar por Email
  const handleEnviarEmail = async (tipoRelatorio: 'financeiro' | 'producao') => {
    if (!emailDestinatario) {
      setError('Email do destinatário é obrigatório');
      return;
    }

    setLoading(`email-${tipoRelatorio}`);
    setError(null);

    try {
      const response = await axios.post(
        `/api/v1/relatorios/cliente/${clienteId}/enviar-email`,
        {
          email: emailDestinatario,
          tipoRelatorio,
          dataInicial: dataInicial || undefined,
          dataFinal: dataFinal || undefined,
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      alert(`Relatório enviado com sucesso para ${response.data.email}`);
      setEmailDestinatario('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao enviar email');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="relatorio-cliente">
      <h2>Relatórios do Cliente</h2>

      {/* Filtros de Período (para relatório de produção) */}
      <div className="filtros">
        <label>
          Data Inicial:
          <input
            type="date"
            value={dataInicial}
            onChange={(e) => setDataInicial(e.target.value)}
          />
        </label>
        <label>
          Data Final:
          <input
            type="date"
            value={dataFinal}
            onChange={(e) => setDataFinal(e.target.value)}
          />
        </label>
      </div>

      {/* Relatório Financeiro */}
      <div className="relatorio-section">
        <h3>Relatório Financeiro</h3>
        <div className="acoes">
          <button
            onClick={handleDownloadFinanceiro}
            disabled={loading === 'download-financeiro'}
          >
            {loading === 'download-financeiro' ? 'Baixando...' : '📥 Baixar PDF'}
          </button>
          <button
            onClick={handleImprimirFinanceiro}
            disabled={loading === 'imprimir-financeiro'}
          >
            {loading === 'imprimir-financeiro' ? 'Gerando...' : '🖨️ Imprimir'}
          </button>
          <button
            onClick={() => handleCompartilhar('financeiro')}
            disabled={loading === 'compartilhar-financeiro'}
          >
            {loading === 'compartilhar-financeiro' ? 'Gerando...' : '📲 Compartilhar'}
          </button>
          <div className="enviar-email">
            <input
              type="email"
              placeholder="Email do destinatário"
              value={emailDestinatario}
              onChange={(e) => setEmailDestinatario(e.target.value)}
            />
            <button
              onClick={() => handleEnviarEmail('financeiro')}
              disabled={loading === 'email-financeiro' || !emailDestinatario}
            >
              {loading === 'email-financeiro' ? 'Enviando...' : '📧 Enviar'}
            </button>
          </div>
        </div>
      </div>

      {/* Relatório de Produção */}
      <div className="relatorio-section">
        <h3>Relatório de Produção</h3>
        <div className="acoes">
          <button
            onClick={handleDownloadProducao}
            disabled={loading === 'download-producao'}
          >
            {loading === 'download-producao' ? 'Baixando...' : '📥 Baixar PDF'}
          </button>
          <button
            onClick={() => handleCompartilhar('producao')}
            disabled={loading === 'compartilhar-producao'}
          >
            {loading === 'compartilhar-producao' ? 'Gerando...' : '📲 Compartilhar'}
          </button>
          <div className="enviar-email">
            <input
              type="email"
              placeholder="Email do destinatário"
              value={emailDestinatario}
              onChange={(e) => setEmailDestinatario(e.target.value)}
            />
            <button
              onClick={() => handleEnviarEmail('producao')}
              disabled={loading === 'email-producao' || !emailDestinatario}
            >
              {loading === 'email-producao' ? 'Enviando...' : '📧 Enviar'}
            </button>
          </div>
        </div>
      </div>

      {/* Link Compartilhado */}
      {linkCompartilhado && (
        <div className="link-compartilhado">
          <p>Link gerado:</p>
          <input type="text" value={linkCompartilhado} readOnly />
          <button onClick={() => navigator.clipboard.writeText(linkCompartilhado)}>
            Copiar
          </button>
        </div>
      )}

      {/* Mensagem de Erro */}
      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
};
```

**CSS de Exemplo:**

```css
.relatorio-cliente {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.filtros {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.filtros label {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.relatorio-section {
  background: #f9fafb;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.relatorio-section h3 {
  margin-top: 0;
  color: #1f2937;
}

.acoes {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
}

.acoes button {
  padding: 0.75rem 1.5rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s;
}

.acoes button:hover:not(:disabled) {
  background-color: #0056b3;
}

.acoes button:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
  opacity: 0.7;
}

.enviar-email {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.enviar-email input {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 1rem;
}

.link-compartilhado {
  background: #e0f2fe;
  padding: 1rem;
  border-radius: 4px;
  margin-top: 1rem;
}

.link-compartilhado input {
  width: 100%;
  padding: 0.5rem;
  margin: 0.5rem 0;
  border: 1px solid #bae6fd;
  border-radius: 4px;
}

.error-message {
  background-color: #fef2f2;
  color: #991b1b;
  padding: 1rem;
  border-radius: 4px;
  margin-top: 1rem;
  border: 1px solid #fecaca;
}
```

---

## 🎣 React Hook Customizado

```typescript
import { useState } from 'react';
import axios from 'axios';

interface UseRelatorioClienteParams {
  clienteId: number;
  token: string;
}

interface CompartilharParams {
  tipoRelatorio: 'financeiro' | 'producao';
  dataInicial?: string;
  dataFinal?: string;
  horasValidade?: number;
}

interface EnviarEmailParams {
  email: string;
  tipoRelatorio: 'financeiro' | 'producao';
  dataInicial?: string;
  dataFinal?: string;
}

export function useRelatorioCliente({ clienteId, token }: UseRelatorioClienteParams) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const downloadFinanceiro = async () => {
    setLoading('download-financeiro');
    setError(null);
    try {
      const response = await axios.get(
        `/api/v1/relatorios/cliente/${clienteId}/financeiro/pdf`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
          responseType: 'blob',
        }
      );
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio-financeiro-cliente-${clienteId}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao baixar relatório');
      throw err;
    } finally {
      setLoading(null);
    }
  };

  const imprimirFinanceiro = async () => {
    setLoading('imprimir-financeiro');
    setError(null);
    try {
      const response = await axios.get(
        `/api/v1/relatorios/cliente/${clienteId}/financeiro/imprimir`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
          responseType: 'blob',
        }
      );
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank');
      if (printWindow) printWindow.onload = () => printWindow.print();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao imprimir relatório');
      throw err;
    } finally {
      setLoading(null);
    }
  };

  const downloadProducao = async (dataInicial?: string, dataFinal?: string) => {
    setLoading('download-producao');
    setError(null);
    try {
      const params = new URLSearchParams();
      if (dataInicial) params.append('data_inicial', dataInicial);
      if (dataFinal) params.append('data_final', dataFinal);
      const url = `/api/v1/relatorios/cliente/${clienteId}/producao/pdf${params.toString() ? '?' + params.toString() : ''}`;
      const response = await axios.get(url, {
        headers: { 'Authorization': `Bearer ${token}` },
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const urlBlob = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = urlBlob;
      link.download = `relatorio-producao-cliente-${clienteId}.pdf`;
      link.click();
      window.URL.revokeObjectURL(urlBlob);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao baixar relatório');
      throw err;
    } finally {
      setLoading(null);
    }
  };

  const compartilhar = async (params: CompartilharParams) => {
    setLoading('compartilhar');
    setError(null);
    try {
      const response = await axios.post(
        `/api/v1/relatorios/cliente/${clienteId}/compartilhar`,
        params,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao compartilhar relatório');
      throw err;
    } finally {
      setLoading(null);
    }
  };

  const enviarEmail = async (params: EnviarEmailParams) => {
    setLoading('enviar-email');
    setError(null);
    try {
      const response = await axios.post(
        `/api/v1/relatorios/cliente/${clienteId}/enviar-email`,
        params,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao enviar email');
      throw err;
    } finally {
      setLoading(null);
    }
  };

  return {
    loading,
    error,
    downloadFinanceiro,
    imprimirFinanceiro,
    downloadProducao,
    compartilhar,
    enviarEmail,
  };
}
```

**Uso do Hook:**

```tsx
function MeuComponente() {
  const token = localStorage.getItem('token');
  const { downloadFinanceiro, imprimirFinanceiro, compartilhar, loading, error } = 
    useRelatorioCliente({ clienteId: 1, token: token || '' });

  return (
    <div>
      <button onClick={downloadFinanceiro} disabled={loading === 'download-financeiro'}>
        Baixar Relatório Financeiro
      </button>
      <button onClick={imprimirFinanceiro} disabled={loading === 'imprimir-financeiro'}>
        Imprimir
      </button>
      {error && <p>Erro: {error}</p>}
    </div>
  );
}
```

---

## 🧪 Testando a Implementação

### 1. Teste Manual com cURL

#### Download Relatório Financeiro
```bash
curl -X GET \
  http://localhost:3000/api/v1/relatorios/cliente/1/financeiro/pdf \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  --output relatorio-financeiro.pdf
```

#### Compartilhar Relatório
```bash
curl -X POST \
  http://localhost:3000/api/v1/relatorios/cliente/1/compartilhar \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "tipoRelatorio": "financeiro",
    "horasValidade": 24
  }'
```

#### Enviar por Email
```bash
curl -X POST \
  http://localhost:3000/api/v1/relatorios/cliente/1/enviar-email \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "destinatario@email.com",
    "tipoRelatorio": "financeiro"
  }'
```

---

## ✅ Checklist de Implementação

- [ ] Criar função/service para download de relatório financeiro
- [ ] Criar função/service para impressão de relatório financeiro
- [ ] Criar função/service para download de relatório de produção
- [ ] Criar função/service para compartilhamento
- [ ] Criar função/service para envio por email
- [ ] Configurar headers de autenticação (Bearer Token)
- [ ] Configurar `responseType: 'blob'` (se usar Axios)
- [ ] Extrair nome do arquivo do header `Content-Disposition`
- [ ] Criar Blob a partir da resposta
- [ ] Criar elemento `<a>` temporário para download
- [ ] Adicionar tratamento de erros (401, 403, 500, etc.)
- [ ] Adicionar estado de loading durante operações
- [ ] Adicionar feedback visual para o usuário
- [ ] Limpar URL do objeto após download
- [ ] Implementar filtros de período para relatório de produção
- [ ] Implementar formulário para envio por email
- [ ] Implementar UI para compartilhamento (copiar link, WhatsApp)
- [ ] Testar em diferentes navegadores

---

## 🐛 Troubleshooting

### Problema: PDF não baixa, apenas abre em nova aba

**Solução:** Verificar se o header `Content-Disposition` está sendo enviado corretamente pelo backend. O endpoint de download deve retornar `attachment`, enquanto o de impressão retorna `inline`.

### Problema: Erro 401 (Unauthorized)

**Solução:** Verificar se o token JWT está sendo enviado corretamente e se não expirou. Implementar refresh token se necessário.

### Problema: Erro ao compartilhar (token inválido)

**Solução:** Verificar se o token está sendo gerado corretamente. O link compartilhado expira após X horas (padrão: 24h).

### Problema: Email não chega

**Solução:** Verificar configuração de email no backend. O EmailService pode não estar configurado corretamente (Mailgun, SendGrid ou SMTP).

### Problema: Filtro de período não funciona

**Solução:** Verificar formato das datas (YYYY-MM-DD). Validar se data inicial não é maior que data final.

---

## 📝 Notas Importantes

1. **Token JWT**: O token deve estar válido e conter informações do tenant (`schema_name`, `tenant_id`)
2. **Permissões**: Apenas usuários com roles ADMIN, GERENTE ou VENDEDOR podem acessar os relatórios
3. **Tamanho do Arquivo**: Para muitos pedidos, o PDF pode ser grande. Considere adicionar feedback de progresso
4. **Performance**: O PDF é gerado dinamicamente no backend, então pode levar alguns segundos
5. **Links Compartilhados**: Expirem após X horas (padrão: 24h). Em produção, considere usar Redis para persistência
6. **Email**: Requer configuração de provedor de email no backend (Mailgun, SendGrid ou SMTP)

---

## 🚀 Melhorias Futuras (Opcional)

1. **Preview do PDF** - Mostrar preview antes de baixar
2. **Notificações** - Notificar quando email for enviado
3. **Histórico de Compartilhamentos** - Listar links compartilhados anteriormente
4. **Agendamento** - Enviar relatórios automaticamente em intervalos
5. **Múltiplos Destinatários** - Enviar para vários emails de uma vez
6. **Personalização** - Permitir personalizar mensagem ao compartilhar

---

**Última atualização:** Janeiro 2025  
**Versão da API:** v1

