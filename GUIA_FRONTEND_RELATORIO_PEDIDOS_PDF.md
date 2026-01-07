# 📄 Guia Frontend - Relatório de Pedidos em PDF

## 📌 Visão Geral

Este guia descreve como implementar no frontend a funcionalidade de download do relatório de pedidos em formato PDF.

---

## 🔗 Endpoint da API

### Informações do Endpoint

```
GET /api/v1/pedidos/relatorio/pdf
```

**Método:** `GET`  
**Autenticação:** Requerida (JWT Token)  
**Content-Type da Resposta:** `application/pdf`

---

## 🔐 Autenticação

O endpoint requer autenticação via JWT. O token deve ser enviado no header `Authorization`:

```
Authorization: Bearer <seu_token_jwt>
```

**Roles permitidas:**
- `ADMIN`
- `GERENTE`
- `VENDEDOR`

---

## 📥 Resposta da API

### Headers de Resposta

```
Content-Type: application/pdf
Content-Disposition: attachment; filename="relatorio-pedidos-YYYY-MM-DD.pdf"
Content-Length: <tamanho_do_arquivo>
```

### Corpo da Resposta

O corpo da resposta é um arquivo PDF binário (Buffer/Blob).

---

## 💻 Implementação Frontend

### 1. Exemplo com Fetch API (JavaScript/TypeScript)

```typescript
/**
 * Função para baixar o relatório de pedidos em PDF
 * @param token - Token JWT de autenticação
 */
async function downloadRelatorioPedidosPDF(token: string): Promise<void> {
  try {
    const response = await fetch('/api/v1/pedidos/relatorio/pdf', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Erro ao gerar relatório: ${response.statusText}`);
    }

    // Obter o blob do PDF
    const blob = await response.blob();

    // Extrair nome do arquivo do header Content-Disposition
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = 'relatorio-pedidos.pdf';
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    // Criar URL temporária para download
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    // Limpar
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Erro ao baixar relatório:', error);
    throw error;
  }
}
```

---

### 2. Exemplo com Axios (React/Vue/Angular)

```typescript
import axios from 'axios';

/**
 * Função para baixar o relatório de pedidos em PDF usando Axios
 * @param token - Token JWT de autenticação
 */
async function downloadRelatorioPedidosPDF(token: string): Promise<void> {
  try {
    const response = await axios.get('/api/v1/pedidos/relatorio/pdf', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      responseType: 'blob', // Importante: definir responseType como 'blob'
    });

    // Criar blob do PDF
    const blob = new Blob([response.data], { type: 'application/pdf' });

    // Extrair nome do arquivo do header
    const contentDisposition = response.headers['content-disposition'];
    let filename = 'relatorio-pedidos.pdf';
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    // Criar URL temporária e fazer download
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    // Limpar
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Erro ao baixar relatório:', error);
    throw error;
  }
}
```

---

### 3. Exemplo com React Hook (Custom Hook)

```typescript
import { useState } from 'react';
import axios from 'axios';

interface UseRelatorioPedidosReturn {
  downloadRelatorio: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

/**
 * Hook customizado para download do relatório de pedidos
 * @param token - Token JWT de autenticação
 */
export function useRelatorioPedidos(token: string): UseRelatorioPedidosReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const downloadRelatorio = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get('/api/v1/pedidos/relatorio/pdf', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        responseType: 'blob',
      });

      // Criar blob do PDF
      const blob = new Blob([response.data], { type: 'application/pdf' });

      // Extrair nome do arquivo
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'relatorio-pedidos.pdf';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Criar URL e fazer download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();

      // Limpar
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao gerar relatório';
      setError(errorMessage);
      console.error('Erro ao baixar relatório:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    downloadRelatorio,
    loading,
    error,
  };
}
```

**Uso do Hook no Componente:**

```tsx
import React from 'react';
import { useRelatorioPedidos } from './hooks/useRelatorioPedidos';

function RelatorioPedidosButton() {
  const token = localStorage.getItem('token'); // ou use seu contexto de autenticação
  const { downloadRelatorio, loading, error } = useRelatorioPedidos(token || '');

  return (
    <div>
      <button 
        onClick={downloadRelatorio} 
        disabled={loading}
        className="btn-download-pdf"
      >
        {loading ? 'Gerando PDF...' : 'Baixar Relatório PDF'}
      </button>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
```

---

### 4. Exemplo com Visualização em Nova Aba (sem download)

Se você quiser abrir o PDF em uma nova aba ao invés de fazer download:

```typescript
async function visualizarRelatorioPedidosPDF(token: string): Promise<void> {
  try {
    const response = await fetch('/api/v1/pedidos/relatorio/pdf', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Erro ao gerar relatório: ${response.statusText}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    
    // Abrir em nova aba
    window.open(url, '_blank');
    
    // Opcional: revogar URL após um tempo
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 1000);
  } catch (error) {
    console.error('Erro ao visualizar relatório:', error);
    throw error;
  }
}
```

---

### 5. Exemplo com Tratamento de Erros Completo

```typescript
interface ErrorResponse {
  message: string;
  statusCode: number;
}

async function downloadRelatorioPedidosPDF(token: string): Promise<void> {
  try {
    const response = await fetch('/api/v1/pedidos/relatorio/pdf', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    // Verificar se a resposta é um PDF
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/pdf')) {
      // Tentar parsear como JSON (erro da API)
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erro ao gerar relatório');
    }

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();

    // Verificar se o blob não está vazio
    if (blob.size === 0) {
      throw new Error('O PDF gerado está vazio');
    }

    // Extrair nome do arquivo
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = `relatorio-pedidos-${new Date().toISOString().split('T')[0]}.pdf`;
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    // Criar URL e fazer download
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    // Limpar
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Erro ao baixar relatório:', error);
    
    // Exibir mensagem de erro para o usuário
    if (error instanceof Error) {
      alert(`Erro ao gerar relatório: ${error.message}`);
    } else {
      alert('Erro desconhecido ao gerar relatório');
    }
    
    throw error;
  }
}
```

---

## 🎨 Exemplo de Componente React Completo

```tsx
import React, { useState } from 'react';
import axios from 'axios';

interface RelatorioPedidosProps {
  token: string;
}

export const RelatorioPedidos: React.FC<RelatorioPedidosProps> = ({ token }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get('/api/v1/pedidos/relatorio/pdf', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'relatorio-pedidos.pdf';
      
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
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao gerar relatório');
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relatorio-pedidos">
      <button
        onClick={handleDownload}
        disabled={loading}
        className={`btn-download ${loading ? 'loading' : ''}`}
      >
        {loading ? (
          <>
            <span className="spinner"></span>
            Gerando PDF...
          </>
        ) : (
          <>
            <span className="icon">📄</span>
            Baixar Relatório PDF
          </>
        )}
      </button>
      
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
.relatorio-pedidos {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.btn-download {
  padding: 0.75rem 1.5rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.3s;
}

.btn-download:hover:not(:disabled) {
  background-color: #0056b3;
}

.btn-download:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.btn-download.loading {
  opacity: 0.7;
}

.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #ffffff;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-message {
  padding: 0.75rem;
  background-color: #f8d7da;
  color: #721c24;
  border-radius: 4px;
  border: 1px solid #f5c6cb;
}
```

---

## 🔍 Tratamento de Erros HTTP

### Códigos de Status Possíveis

| Código | Descrição | Ação Recomendada |
|--------|-----------|------------------|
| `200` | Sucesso | PDF gerado e disponível para download |
| `400` | Bad Request | Verificar se o schema name está presente no token |
| `401` | Unauthorized | Token inválido ou expirado - redirecionar para login |
| `403` | Forbidden | Usuário não tem permissão - exibir mensagem |
| `500` | Internal Server Error | Erro no servidor - exibir mensagem genérica |

### Exemplo de Tratamento de Erros

```typescript
async function downloadRelatorioPedidosPDF(token: string): Promise<void> {
  try {
    const response = await fetch('/api/v1/pedidos/relatorio/pdf', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      // Token expirado ou inválido
      localStorage.removeItem('token');
      window.location.href = '/login';
      return;
    }

    if (response.status === 403) {
      throw new Error('Você não tem permissão para acessar este relatório');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
    }

    // ... resto do código de download
  } catch (error) {
    // Tratamento de erro
  }
}
```

---

## 📱 Exemplo com Vue.js

```vue
<template>
  <div class="relatorio-pedidos">
    <button
      @click="downloadRelatorio"
      :disabled="loading"
      class="btn-download"
    >
      <span v-if="loading">Gerando PDF...</span>
      <span v-else>📄 Baixar Relatório PDF</span>
    </button>
    
    <div v-if="error" class="error-message">
      ⚠️ {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import axios from 'axios';

const props = defineProps<{
  token: string;
}>();

const loading = ref(false);
const error = ref<string | null>(null);

const downloadRelatorio = async () => {
  loading.value = true;
  error.value = null;

  try {
    const response = await axios.get('/api/v1/pedidos/relatorio/pdf', {
      headers: {
        'Authorization': `Bearer ${props.token}`,
      },
      responseType: 'blob',
    });

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const contentDisposition = response.headers['content-disposition'];
    let filename = 'relatorio-pedidos.pdf';
    
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
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Erro ao gerar relatório';
    console.error('Erro:', err);
  } finally {
    loading.value = false;
  }
};
</script>
```

---

## 🧪 Testando a Implementação

### 1. Teste Manual com cURL

```bash
curl -X GET \
  http://localhost:3000/api/v1/pedidos/relatorio/pdf \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  --output relatorio-pedidos.pdf
```

### 2. Teste no Postman/Insomnia

1. Método: `GET`
2. URL: `http://localhost:3000/api/v1/pedidos/relatorio/pdf`
3. Headers:
   - `Authorization: Bearer SEU_TOKEN_JWT`
4. Clique em "Send and Download" para salvar o PDF

### 3. Teste no Navegador (Console)

```javascript
fetch('/api/v1/pedidos/relatorio/pdf', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
  },
})
  .then(response => response.blob())
  .then(blob => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'relatorio-pedidos.pdf';
    link.click();
  });
```

---

## ✅ Checklist de Implementação

- [ ] Criar função/service para fazer requisição ao endpoint
- [ ] Configurar headers de autenticação (Bearer Token)
- [ ] Configurar `responseType: 'blob'` (se usar Axios)
- [ ] Extrair nome do arquivo do header `Content-Disposition`
- [ ] Criar Blob a partir da resposta
- [ ] Criar elemento `<a>` temporário para download
- [ ] Adicionar tratamento de erros (401, 403, 500, etc.)
- [ ] Adicionar estado de loading durante a geração
- [ ] Adicionar feedback visual para o usuário
- [ ] Limpar URL do objeto após download
- [ ] Testar em diferentes navegadores

---

## 🚀 Melhorias Futuras (Opcional)

### 1. Adicionar Filtros (quando implementado no backend)

```typescript
interface FiltrosRelatorio {
  dataInicial?: string;
  dataFinal?: string;
  tipo?: 'VENDA' | 'COMPRA';
  status?: string;
}

async function downloadRelatorioPedidosPDF(
  token: string,
  filtros?: FiltrosRelatorio
): Promise<void> {
  const params = new URLSearchParams();
  
  if (filtros?.dataInicial) params.append('data_inicial', filtros.dataInicial);
  if (filtros?.dataFinal) params.append('data_final', filtros.dataFinal);
  if (filtros?.tipo) params.append('tipo', filtros.tipo);
  if (filtros?.status) params.append('status', filtros.status);

  const url = `/api/v1/pedidos/relatorio/pdf?${params.toString()}`;
  
  // ... resto do código
}
```

### 2. Preview do PDF antes de baixar

```typescript
async function previewRelatorioPedidosPDF(token: string): Promise<void> {
  const response = await fetch('/api/v1/pedidos/relatorio/pdf', {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  
  // Abrir em modal ou iframe
  const modal = window.open(url, '_blank', 'width=800,height=600');
}
```

### 3. Notificação de Sucesso

```typescript
import { toast } from 'react-toastify'; // ou sua biblioteca de notificação

// Após download bem-sucedido
toast.success('Relatório baixado com sucesso!');
```

---

## 📚 Recursos Adicionais

- [MDN - Blob API](https://developer.mozilla.org/pt-BR/docs/Web/API/Blob)
- [MDN - URL.createObjectURL](https://developer.mozilla.org/pt-BR/docs/Web/API/URL/createObjectURL)
- [Axios - Response Type](https://axios-http.com/docs/req_config)

---

## 🐛 Troubleshooting

### Problema: PDF não baixa, apenas abre em nova aba

**Solução:** Verificar se o header `Content-Disposition` está sendo enviado corretamente pelo backend. Se não estiver, o navegador pode tentar abrir ao invés de baixar.

### Problema: PDF aparece corrompido

**Solução:** Verificar se `responseType: 'blob'` está configurado corretamente no Axios, ou se está usando `response.blob()` no Fetch.

### Problema: Erro 401 (Unauthorized)

**Solução:** Verificar se o token JWT está sendo enviado corretamente e se não expirou. Implementar refresh token se necessário.

### Problema: Erro CORS

**Solução:** Verificar se o backend está configurado para aceitar requisições do frontend. O backend já tem `app.enableCors()` configurado.

---

## 📝 Notas Importantes

1. **Token JWT**: O token deve estar válido e conter as informações do tenant (`schema_name`, `tenant_id`)
2. **Permissões**: Apenas usuários com roles ADMIN, GERENTE ou VENDEDOR podem acessar o relatório
3. **Tamanho do Arquivo**: Para muitos pedidos, o PDF pode ser grande. Considere adicionar feedback de progresso
4. **Performance**: O PDF é gerado dinamicamente no backend, então pode levar alguns segundos dependendo da quantidade de pedidos

---

**Última atualização:** Dezembro 2024  
**Versão da API:** v1

