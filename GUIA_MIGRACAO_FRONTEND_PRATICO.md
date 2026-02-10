# 🚀 GUIA PRÁTICO DE MIGRAÇÃO - FRONTEND

## ⚠️ PROBLEMA ATUAL

O frontend está tentando acessar endpoints antigos que foram **removidos**:
- ❌ `/api/v1/duplicatas/contas-receber/clientes` → **404 Not Found**
- ❌ `/api/v1/duplicatas/agrupadas-por-pedido` → **404 Not Found**
- ❌ Erro: `Validation failed (numeric string is expected)` → **400 Bad Request**

---

## ✅ SOLUÇÃO: NOVOS ENDPOINTS

### 1. Contas a Receber

**❌ ANTIGO (não funciona mais):**
```typescript
// ❌ ERRADO - Não funciona mais
const response = await fetch('/api/v1/duplicatas/contas-receber/clientes');
const data = await response.json();
const clientes = data.clientes; // ❌ Não existe mais
```

**✅ NOVO (use este):**
```typescript
// ✅ CORRETO
const response = await fetch('/api/v1/pedidos/contas-receber');
const pedidos = await response.json(); // Array direto de pedidos
// Cada item é um pedido com valor em aberto
```

---

### 2. Contas a Pagar

**❌ ANTIGO (não funciona mais):**
```typescript
// ❌ ERRADO
const response = await fetch('/api/v1/duplicatas/contas-pagar/fornecedores');
```

**✅ NOVO (use este):**
```typescript
// ✅ CORRETO
const response = await fetch('/api/v1/pedidos/contas-pagar');
const pedidos = await response.json(); // Array direto de pedidos
```

---

## 📝 EXEMPLOS COMPLETOS DE CÓDIGO

### Exemplo 1: Buscar Contas a Receber (Básico)

```typescript
// ✅ CORRETO - Versão simples
async function buscarContasReceber() {
  try {
    const response = await fetch('/api/v1/pedidos/contas-receber', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erro ${response.status}: ${response.statusText}`);
    }
    
    const pedidos = await response.json();
    // pedidos é um array direto: [{ pedido_id, numero_pedido, cliente_nome, ... }]
    return pedidos;
  } catch (error) {
    console.error('Erro ao buscar contas a receber:', error);
    throw error;
  }
}
```

---

### Exemplo 2: Buscar Contas a Receber com Filtros

```typescript
// ✅ CORRETO - Com filtros
async function buscarContasReceberComFiltros(filtros: {
  situacao?: 'em_aberto' | 'em_atraso' | 'concluido';
  cliente_nome?: string;
  data_inicial?: string;
  data_final?: string;
  valor_inicial?: number;
  valor_final?: number;
}) {
  const params = new URLSearchParams();
  
  // Adicionar apenas parâmetros que têm valor
  if (filtros.situacao) params.append('situacao', filtros.situacao);
  if (filtros.cliente_nome) params.append('cliente_nome', filtros.cliente_nome);
  if (filtros.data_inicial) params.append('data_inicial', filtros.data_inicial);
  if (filtros.data_final) params.append('data_final', filtros.data_final);
  if (filtros.valor_inicial !== undefined) params.append('valor_inicial', filtros.valor_inicial.toString());
  if (filtros.valor_final !== undefined) params.append('valor_final', filtros.valor_final.toString());
  
  const url = `/api/v1/pedidos/contas-receber${params.toString() ? `?${params.toString()}` : ''}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Erro ${response.status}: ${response.statusText}`);
  }
  
  return await response.json();
}

// Uso:
const pedidos = await buscarContasReceberComFiltros({
  situacao: 'em_aberto',
  data_inicial: '2026-01-01',
  data_final: '2026-02-10'
});
```

---

### Exemplo 3: React Hook com React Query

```typescript
import { useQuery } from '@tanstack/react-query';

interface ContaReceber {
  pedido_id: number;
  numero_pedido: string;
  cliente_id?: number;
  cliente_nome?: string;
  valor_total: number;
  valor_em_aberto: number;
  forma_pagamento: string;
  status: string;
  data_pedido: string;
}

interface FiltrosContasReceber {
  situacao?: 'em_aberto' | 'em_atraso' | 'concluido';
  cliente_nome?: string;
  data_inicial?: string;
  data_final?: string;
}

function useContasReceber(filtros?: FiltrosContasReceber) {
  return useQuery<ContaReceber[]>({
    queryKey: ['contas-receber', filtros],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filtros?.situacao) params.append('situacao', filtros.situacao);
      if (filtros?.cliente_nome) params.append('cliente_nome', filtros.cliente_nome);
      if (filtros?.data_inicial) params.append('data_inicial', filtros.data_inicial);
      if (filtros?.data_final) params.append('data_final', filtros.data_final);
      
      const url = `/api/v1/pedidos/contas-receber${params.toString() ? `?${params.toString()}` : ''}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}`);
      }
      
      return response.json();
    }
  });
}

// Uso no componente:
function ContasReceberPage() {
  const { data: pedidos, isLoading, error } = useContasReceber({
    situacao: 'em_aberto'
  });
  
  if (isLoading) return <div>Carregando...</div>;
  if (error) return <div>Erro ao carregar contas</div>;
  
  return (
    <table>
      <thead>
        <tr>
          <th>Código</th>
          <th>Cliente</th>
          <th>Valor Total</th>
          <th>Valor em Aberto</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {pedidos?.map((pedido) => (
          <tr key={pedido.pedido_id}>
            <td>{pedido.numero_pedido}</td>
            <td>{pedido.cliente_nome || '-'}</td>
            <td>R$ {pedido.valor_total.toFixed(2)}</td>
            <td>R$ {pedido.valor_em_aberto.toFixed(2)}</td>
            <td>{pedido.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

---

### Exemplo 4: Contas a Pagar

```typescript
// ✅ CORRETO - Contas a Pagar
async function buscarContasPagar(filtros?: {
  situacao?: 'em_aberto' | 'em_atraso' | 'concluido';
  fornecedor_nome?: string;
  data_inicial?: string;
  data_final?: string;
}) {
  const params = new URLSearchParams();
  
  if (filtros?.situacao) params.append('situacao', filtros.situacao);
  if (filtros?.fornecedor_nome) params.append('fornecedor_nome', filtros.fornecedor_nome);
  if (filtros?.data_inicial) params.append('data_inicial', filtros.data_inicial);
  if (filtros?.data_final) params.append('data_final', filtros.data_final);
  
  const url = `/api/v1/pedidos/contas-pagar${params.toString() ? `?${params.toString()}` : ''}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Erro ${response.status}: ${response.statusText}`);
  }
  
  return await response.json();
}
```

---

## 🔄 MAPEAMENTO DE ESTRUTURAS

### Estrutura Antiga (Duplicatas) ❌

```typescript
// ❌ NÃO EXISTE MAIS
interface RespostaAntiga {
  clientes: Array<{
    cliente_id: number;
    cliente_nome: string;
    duplicatas: Array<{
      id: number;
      valor: number;
      // ...
    }>;
  }>;
}
```

### Estrutura Nova (Pedidos) ✅

```typescript
// ✅ USE ESTA ESTRUTURA
interface ContaReceber {
  pedido_id: number;
  numero_pedido: string;
  cliente_id?: number | null;
  cliente_nome?: string | null;
  fornecedor_id?: number | null;
  fornecedor_nome?: string | null;
  valor_total: number;
  valor_em_aberto: number;
  forma_pagamento: string; // 'PIX', 'DINHEIRO', 'CARTAO_CREDITO', etc.
  status: string; // 'PENDENTE', 'CONCLUIDO', 'CANCELADO'
  data_pedido: string; // ISO date string
}
```

---

## 📊 TIPOS E INTERFACES COMPLETAS

```typescript
// ✅ Tipos para usar no frontend

export enum FormaPagamento {
  DINHEIRO = 'DINHEIRO',
  PIX = 'PIX',
  CARTAO_CREDITO = 'CARTAO_CREDITO',
  CARTAO_DEBITO = 'CARTAO_DEBITO',
  BOLETO = 'BOLETO',
  TRANSFERENCIA = 'TRANSFERENCIA',
  CHEQUE = 'CHEQUE'
}

export enum StatusPedido {
  PENDENTE = 'PENDENTE',
  APROVADO = 'APROVADO',
  EM_PROCESSAMENTO = 'EM_PROCESSAMENTO',
  CONCLUIDO = 'CONCLUIDO',
  CANCELADO = 'CANCELADO'
}

export interface ContaReceber {
  pedido_id: number;
  numero_pedido: string;
  cliente_id?: number | null;
  cliente_nome?: string | null;
  valor_total: number;
  valor_em_aberto: number;
  forma_pagamento: FormaPagamento;
  status: StatusPedido;
  data_pedido: string; // ISO date: "2026-02-10"
}

export interface ContaPagar {
  pedido_id: number;
  numero_pedido: string;
  fornecedor_id?: number | null;
  fornecedor_nome?: string | null;
  valor_total: number;
  valor_em_aberto: number;
  forma_pagamento: FormaPagamento;
  status: StatusPedido;
  data_pedido: string;
}

export interface FiltrosContasReceber {
  codigo?: string;
  cliente_id?: number;
  cliente_nome?: string;
  valor_inicial?: number;
  valor_final?: number;
  forma_pagamento?: FormaPagamento;
  situacao?: 'em_aberto' | 'em_atraso' | 'concluido';
  data_inicial?: string; // YYYY-MM-DD
  data_final?: string; // YYYY-MM-DD
}

export interface FiltrosContasPagar {
  codigo?: string;
  fornecedor_id?: number;
  fornecedor_nome?: string;
  valor_inicial?: number;
  valor_final?: number;
  forma_pagamento?: FormaPagamento;
  situacao?: 'em_aberto' | 'em_atraso' | 'concluido';
  data_inicial?: string; // YYYY-MM-DD
  data_final?: string; // YYYY-MM-DD
}
```

---

## 🛠️ FUNÇÕES AUXILIARES

### Função para construir URL com filtros

```typescript
function construirUrlComFiltros(
  endpoint: string,
  filtros: Record<string, string | number | undefined>
): string {
  const params = new URLSearchParams();
  
  Object.entries(filtros).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value.toString());
    }
  });
  
  const queryString = params.toString();
  return `${endpoint}${queryString ? `?${queryString}` : ''}`;
}

// Uso:
const url = construirUrlComFiltros('/api/v1/pedidos/contas-receber', {
  situacao: 'em_aberto',
  cliente_nome: 'João',
  valor_inicial: 100
});
// Resultado: /api/v1/pedidos/contas-receber?situacao=em_aberto&cliente_nome=João&valor_inicial=100
```

---

### Função para formatar status para exibição

```typescript
function formatarStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'PENDENTE': 'Em aberto',
    'APROVADO': 'Em aberto',
    'EM_PROCESSAMENTO': 'Em aberto',
    'CONCLUIDO': 'Concluído',
    'CANCELADO': 'Cancelado'
  };
  
  return statusMap[status] || status;
}

// Uso:
const statusExibicao = formatarStatus(pedido.status); // "Em aberto"
```

---

### Função para formatar forma de pagamento

```typescript
function formatarFormaPagamento(forma: string): string {
  const formasMap: Record<string, string> = {
    'DINHEIRO': 'Dinheiro',
    'PIX': 'PIX',
    'CARTAO_CREDITO': 'Cartão de Crédito',
    'CARTAO_DEBITO': 'Cartão de Débito',
    'BOLETO': 'Boleto',
    'TRANSFERENCIA': 'Transferência',
    'CHEQUE': 'Cheque'
  };
  
  return formasMap[forma] || forma;
}
```

---

## 🔍 FILTROS DISPONÍVEIS

### Parâmetros de Query Aceitos:

#### Contas a Receber (`/api/v1/pedidos/contas-receber`)

| Parâmetro | Tipo | Descrição | Exemplo |
|-----------|------|-----------|---------|
| `codigo` | string | Código do pedido (busca parcial) | `?codigo=PED-2026` |
| `cliente_id` | number | ID do cliente | `?cliente_id=1` |
| `cliente_nome` | string | Nome do cliente (busca parcial) | `?cliente_nome=João` |
| `valor_inicial` | number | Valor mínimo em aberto | `?valor_inicial=100` |
| `valor_final` | number | Valor máximo em aberto | `?valor_final=1000` |
| `forma_pagamento` | string | Forma de pagamento | `?forma_pagamento=PIX` |
| `situacao` | string | Situação: `em_aberto`, `em_atraso`, `concluido` | `?situacao=em_aberto` |
| `data_inicial` | string | Data inicial (YYYY-MM-DD) | `?data_inicial=2026-01-01` |
| `data_final` | string | Data final (YYYY-MM-DD) | `?data_final=2026-02-10` |

#### Contas a Pagar (`/api/v1/pedidos/contas-pagar`)

Mesmos parâmetros, mas substitua:
- `cliente_id` → `fornecedor_id`
- `cliente_nome` → `fornecedor_nome`

---

## ⚠️ IMPORTANTE: MUDANÇAS DE COMPORTAMENTO

### 1. Não há mais agrupamento por cliente/fornecedor

**Antes:**
```typescript
// ❌ Antes: agrupado por cliente
data.clientes.forEach(cliente => {
  cliente.duplicatas.forEach(duplicata => {
    // ...
  });
});
```

**Agora:**
```typescript
// ✅ Agora: array direto de pedidos
pedidos.forEach(pedido => {
  // Cada pedido já tem cliente_nome ou fornecedor_nome
  console.log(pedido.cliente_nome, pedido.valor_em_aberto);
});
```

---

### 2. Cada linha = 1 pedido

**Antes:** Podia ter múltiplas duplicatas por cliente  
**Agora:** Cada item do array = 1 pedido com valor em aberto

---

### 3. Estrutura simplificada

**Antes:**
```json
{
  "clientes": [
    {
      "cliente_id": 1,
      "cliente_nome": "João",
      "duplicatas": [...]
    }
  ]
}
```

**Agora:**
```json
[
  {
    "pedido_id": 1,
    "numero_pedido": "PED-2026-0001",
    "cliente_nome": "João",
    "valor_em_aberto": 316.66
  }
]
```

---

## 🧪 TESTES RÁPIDOS

### Teste 1: Buscar todas as contas a receber

```typescript
const response = await fetch('/api/v1/pedidos/contas-receber', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const pedidos = await response.json();
console.log('Total de pedidos:', pedidos.length);
```

---

### Teste 2: Filtrar por situação

```typescript
const response = await fetch('/api/v1/pedidos/contas-receber?situacao=em_aberto', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const pedidos = await response.json();
console.log('Pedidos em aberto:', pedidos.length);
```

---

### Teste 3: Filtrar por período

```typescript
const url = '/api/v1/pedidos/contas-receber?data_inicial=2026-01-01&data_final=2026-02-10';
const response = await fetch(url, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const pedidos = await response.json();
console.log('Pedidos no período:', pedidos.length);
```

---

## 📋 CHECKLIST DE MIGRAÇÃO

- [ ] Substituir `/duplicatas/contas-receber/clientes` por `/pedidos/contas-receber`
- [ ] Substituir `/duplicatas/contas-pagar/fornecedores` por `/pedidos/contas-pagar`
- [ ] Remover código que espera estrutura `{ clientes: [...] }`
- [ ] Atualizar para array direto de pedidos
- [ ] Atualizar tipos/interfaces TypeScript
- [ ] Atualizar mapeamento de campos na tabela
- [ ] Testar filtros (situacao, data_inicial, data_final)
- [ ] Verificar se exibição está correta (cada linha = 1 pedido)
- [ ] Remover código relacionado a "duplicatas agrupadas"
- [ ] Atualizar funções de formatação de status

---

## 🐛 RESOLUÇÃO DE PROBLEMAS COMUNS

### Erro: "Validation failed (numeric string is expected)"

**Causa:** Enviando parâmetros numéricos vazios ou inválidos

**Solução:** Não envie parâmetros vazios:
```typescript
// ❌ ERRADO
const url = '/api/v1/pedidos/contas-receber?cliente_id=&valor_inicial=';

// ✅ CORRETO
const url = '/api/v1/pedidos/contas-receber'; // Sem parâmetros vazios

// ✅ CORRETO - Com valores válidos
const url = '/api/v1/pedidos/contas-receber?cliente_id=1&valor_inicial=100';
```

---

### Erro: "404 Not Found"

**Causa:** Usando endpoint antigo de duplicatas

**Solução:** Use os novos endpoints:
```typescript
// ❌ ERRADO
'/api/v1/duplicatas/contas-receber/clientes'

// ✅ CORRETO
'/api/v1/pedidos/contas-receber'
```

---

### Erro: "Cannot read property 'clientes' of undefined"

**Causa:** Tentando acessar estrutura antiga

**Solução:** Use array direto:
```typescript
// ❌ ERRADO
const clientes = data.clientes;

// ✅ CORRETO
const pedidos = data; // Já é um array
```

---

## 📚 RECURSOS ADICIONAIS

- **Documentação Swagger:** `https://sistemaerp-3.onrender.com/api/docs`
- **Guia Completo:** `GUIA_IMPLEMENTACAO_FRONTEND.md`
- **Guia de Migração:** `MIGRACAO_FRONTEND_ENDPOINTS.md`

---

## ✅ EXEMPLO COMPLETO: COMPONENTE REACT

```typescript
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

interface ContaReceber {
  pedido_id: number;
  numero_pedido: string;
  cliente_nome?: string | null;
  valor_total: number;
  valor_em_aberto: number;
  forma_pagamento: string;
  status: string;
  data_pedido: string;
}

function ContasReceberPage() {
  const [filtros, setFiltros] = useState({
    situacao: 'em_aberto' as 'em_aberto' | 'em_atraso' | 'concluido' | undefined,
    cliente_nome: '',
    data_inicial: '',
    data_final: ''
  });

  const { data: pedidos = [], isLoading, error, refetch } = useQuery<ContaReceber[]>({
    queryKey: ['contas-receber', filtros],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filtros.situacao) params.append('situacao', filtros.situacao);
      if (filtros.cliente_nome.trim()) params.append('cliente_nome', filtros.cliente_nome);
      if (filtros.data_inicial) params.append('data_inicial', filtros.data_inicial);
      if (filtros.data_final) params.append('data_final', filtros.data_final);
      
      const url = `/api/v1/pedidos/contas-receber${params.toString() ? `?${params.toString()}` : ''}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}`);
      }
      
      return response.json();
    }
  });

  const formatarStatus = (status: string) => {
    const map: Record<string, string> = {
      'PENDENTE': 'Em aberto',
      'APROVADO': 'Em aberto',
      'EM_PROCESSAMENTO': 'Em aberto',
      'CONCLUIDO': 'Concluído',
      'CANCELADO': 'Cancelado'
    };
    return map[status] || status;
  };

  const formatarFormaPagamento = (forma: string) => {
    const map: Record<string, string> = {
      'DINHEIRO': 'Dinheiro',
      'PIX': 'PIX',
      'CARTAO_CREDITO': 'Cartão de Crédito',
      'CARTAO_DEBITO': 'Cartão de Débito',
      'BOLETO': 'Boleto',
      'TRANSFERENCIA': 'Transferência',
      'CHEQUE': 'Cheque'
    };
    return map[forma] || forma;
  };

  if (isLoading) return <div>Carregando...</div>;
  if (error) return <div>Erro ao carregar contas: {error.message}</div>;

  const totalEmAberto = pedidos.reduce((sum, p) => sum + p.valor_em_aberto, 0);

  return (
    <div>
      <h1>Contas a Receber</h1>
      
      {/* Filtros */}
      <div style={{ marginBottom: '20px' }}>
        <select
          value={filtros.situacao || ''}
          onChange={(e) => setFiltros({ ...filtros, situacao: e.target.value as any || undefined })}
        >
          <option value="">Todas</option>
          <option value="em_aberto">Em aberto</option>
          <option value="em_atraso">Em atraso</option>
          <option value="concluido">Concluído</option>
        </select>
        
        <input
          type="text"
          placeholder="Nome do cliente"
          value={filtros.cliente_nome}
          onChange={(e) => setFiltros({ ...filtros, cliente_nome: e.target.value })}
        />
        
        <input
          type="date"
          placeholder="Data inicial"
          value={filtros.data_inicial}
          onChange={(e) => setFiltros({ ...filtros, data_inicial: e.target.value })}
        />
        
        <input
          type="date"
          placeholder="Data final"
          value={filtros.data_final}
          onChange={(e) => setFiltros({ ...filtros, data_final: e.target.value })}
        />
      </div>

      {/* Resumo */}
      <div style={{ marginBottom: '20px' }}>
        <p>Total de pedidos: {pedidos.length}</p>
        <p>Total em aberto: R$ {totalEmAberto.toFixed(2)}</p>
      </div>

      {/* Tabela */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>Código</th>
            <th>Cliente</th>
            <th>Valor Total</th>
            <th>Valor em Aberto</th>
            <th>Forma de Pagamento</th>
            <th>Status</th>
            <th>Data</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {pedidos.map((pedido) => (
            <tr key={pedido.pedido_id}>
              <td>{pedido.numero_pedido}</td>
              <td>{pedido.cliente_nome || '-'}</td>
              <td>R$ {pedido.valor_total.toFixed(2)}</td>
              <td>R$ {pedido.valor_em_aberto.toFixed(2)}</td>
              <td>{formatarFormaPagamento(pedido.forma_pagamento)}</td>
              <td>{formatarStatus(pedido.status)}</td>
              <td>{new Date(pedido.data_pedido).toLocaleDateString('pt-BR')}</td>
              <td>
                <button onClick={() => window.location.href = `/pedidos/${pedido.pedido_id}`}>
                  Ver detalhes
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {pedidos.length === 0 && (
        <p>Nenhum pedido encontrado com os filtros aplicados.</p>
      )}
    </div>
  );
}

export default ContasReceberPage;
```

---

## 🎯 RESUMO RÁPIDO

1. **Endpoint antigo:** `/duplicatas/contas-receber/clientes` ❌
2. **Endpoint novo:** `/pedidos/contas-receber` ✅
3. **Estrutura antiga:** `{ clientes: [...] }` ❌
4. **Estrutura nova:** `[...]` (array direto) ✅
5. **Cada linha:** 1 pedido (não agrupado) ✅

---

**✅ Pronto para implementar!** Use os exemplos acima como base para migrar seu código frontend.
