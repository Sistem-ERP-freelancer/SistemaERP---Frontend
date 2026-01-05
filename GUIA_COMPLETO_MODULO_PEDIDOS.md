# 📘 Guia Completo - Módulo de Pedidos (Backend e Frontend)

Este guia explica a lógica completa do módulo de pedidos, incluindo dashboard, cálculos financeiros e regras de negócio.

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Lógica de Valores e Cancelamento](#lógica-de-valores-e-cancelamento)
3. [Dashboard de Pedidos](#dashboard-de-pedidos)
4. [Status dos Pedidos](#status-dos-pedidos)
5. [Cálculo de Valores](#cálculo-de-valores)
6. [Endpoints Disponíveis](#endpoints-disponíveis)
7. [Estrutura de Dados](#estrutura-de-dados)
8. [Exemplos Práticos](#exemplos-práticos)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

O módulo de pedidos gerencia **vendas** e **compras** da empresa, incluindo:

- ✅ Criação de pedidos (VENDA e COMPRA)
- ✅ Gestão de itens do pedido
- ✅ Cálculo automático de totais
- ✅ Controle de status
- ✅ Integração automática com contas financeiras
- ✅ Dashboard com estatísticas financeiras e operacionais (VENDA e COMPRA)

---

## 💰 Lógica de Valores e Cancelamento

### ⚠️ Pergunta Importante: "Se eu cancelo o pedido, o valor deveria ser subtraído do valor_total?"

**Resposta:** ❌ **NÃO**

### Por que não subtrair?

1. **Histórico Preservado**
   - O `valor_total` é um dado **histórico** do pedido
   - Mesmo cancelado, o pedido representa uma transação que aconteceu
   - Subtrair o valor apagaria informações importantes

2. **Rastreabilidade**
   - Permite entender o impacto de cancelamentos
   - Facilita auditoria e relatórios
   - Mantém integridade dos dados

3. **Cálculos Corretos**
   - Nos dashboards, pedidos cancelados **não são incluídos** nos totais financeiros
   - O valor permanece no pedido, mas não conta para faturamento ou valores em aberto

### Como Funciona na Prática

```typescript
// Pedido criado
const pedido = {
  id: 1,
  numero_pedido: 'VEND-2026-00001',
  valor_total: 1000.00,
  status: 'PENDENTE'
};

// Pedido cancelado
const pedidoCancelado = {
  id: 1,
  numero_pedido: 'VEND-2026-00001',
  valor_total: 1000.00,  // ✅ Valor permanece o mesmo
  status: 'CANCELADO'     // ✅ Apenas o status muda
};

// No dashboard:
// - Faturamento Confirmado: NÃO inclui este pedido (status ≠ CONCLUIDO)
// - Valor em Aberto: NÃO inclui este pedido (status = CANCELADO)
// - Pedidos Cancelados: INCLUI este pedido (contagem)
```

### Regra de Negócio

**Pedidos cancelados:**
- ✅ Mantêm o `valor_total` original
- ✅ Não entram nos cálculos de faturamento
- ✅ Não entram nos cálculos de valores em aberto
- ✅ São contados separadamente na seção "Pedidos Cancelados"

---

## 📊 Dashboard de Pedidos

### Endpoint

```
GET /api/v1/pedidos/dashboard/resumo
```

### Estrutura da Resposta

```typescript
interface DashboardPedidos {
  // 🔹 BLOCO 1 — Financeiro VENDA (valores)
  faturamento_confirmado_venda: {
    valor: number;        // R$ total faturado em vendas
    quantidade: number;   // Quantidade de pedidos de venda concluídos
  };
  valor_em_aberto_venda: {
    valor: number;        // R$ total em aberto de vendas
    quantidade: number;   // Quantidade de pedidos de venda em aberto
  };
  
  // 🔹 BLOCO 1 — Financeiro COMPRA (valores)
  compras_confirmadas: {
    valor: number;        // R$ total de compras confirmadas
    quantidade: number;   // Quantidade de pedidos de compra concluídos
  };
  compras_em_aberto: {
    valor: number;        // R$ total de compras em aberto
    quantidade: number;   // Quantidade de pedidos de compra em aberto
  };
  
  // 🔹 BLOCO 2 — Operacional (quantidade)
  pedidos_em_andamento: {
    quantidade: number;  // Total de pedidos em andamento (VENDA + COMPRA)
    detalhes: {
      pendente: number;           // Status: PENDENTE
      aprovado: number;          // Status: APROVADO
      em_processamento: number;  // Status: EM_PROCESSAMENTO
    };
  };
  pedidos_concluidos: {
    quantidade: number;  // Total de pedidos concluídos (VENDA + COMPRA)
  };
  pedidos_cancelados: {
    quantidade: number;  // Total de pedidos cancelados (VENDA + COMPRA)
  };
}
```

### Regras de Cálculo

#### 🔹 BLOCO 1 — Financeiro VENDA (valores)

**💰 Faturamento Confirmado (Vendas)**
- **Regra:** `tipo = 'VENDA' AND status = 'CONCLUIDO'`
- **Descrição:** Pedidos de venda pagos e faturados
- **Inclui:** Apenas dinheiro real recebido de vendas
- **Não inclui:** Pedidos pendentes, em andamento ou cancelados

**🧾 Valor em Aberto (Vendas)**
- **Regra:** `tipo = 'VENDA' AND status != 'CONCLUIDO' AND status != 'CANCELADO'`
- **Descrição:** Pedidos de venda aguardando pagamento ou faturamento
- **Inclui:** Vendas que ainda podem gerar receita
- **Não inclui:** Pedidos concluídos ou cancelados

#### 🔹 BLOCO 1 — Financeiro COMPRA (valores)

**🛒 Compras Confirmadas**
- **Regra:** `tipo = 'COMPRA' AND status = 'CONCLUIDO'`
- **Descrição:** Pedidos de compra finalizados e pagos
- **Inclui:** Compras já realizadas e pagas
- **Não inclui:** Compras pendentes, em andamento ou canceladas

**📋 Compras em Aberto**
- **Regra:** `tipo = 'COMPRA' AND status != 'CONCLUIDO' AND status != 'CANCELADO'`
- **Descrição:** Pedidos de compra aguardando pagamento ou finalização
- **Inclui:** Compras que ainda precisam ser pagas
- **Não inclui:** Compras concluídas ou canceladas

#### 🔹 BLOCO 2 — Operacional (quantidade)

**📦 Pedidos em Andamento**
- **Regra:** `status IN ('PENDENTE', 'APROVADO', 'EM_PROCESSAMENTO')`
- **Inclui:** Pedidos de VENDA e COMPRA
- **Descrição:** Pedidos criados, mas não finalizados
- **Detalhes:**
  - Pendente de pagamento
  - Em separação
  - Aguardando faturamento

**✅ Pedidos Concluídos**
- **Regra:** `status = 'CONCLUIDO'`
- **Inclui:** Pedidos de VENDA e COMPRA
- **Descrição:** Pedidos finalizados com sucesso
- **Inclui:** Processo encerrado, pedido entregue ou serviço concluído

**❌ Pedidos Cancelados**
- **Regra:** `status = 'CANCELADO'`
- **Inclui:** Pedidos de VENDA e COMPRA
- **Descrição:** Pedidos cancelados antes da conclusão
- **Inclui:** Todos os pedidos cancelados (independente do valor ou tipo)

### Exemplo de Resposta

```json
{
  "faturamento_confirmado_venda": {
    "valor": 144.04,
    "quantidade": 1
  },
  "valor_em_aberto_venda": {
    "valor": 500.00,
    "quantidade": 2
  },
  "compras_confirmadas": {
    "valor": 2000.00,
    "quantidade": 3
  },
  "compras_em_aberto": {
    "valor": 800.00,
    "quantidade": 1
  },
  "pedidos_em_andamento": {
    "quantidade": 5,
    "detalhes": {
      "pendente": 2,
      "aprovado": 2,
      "em_processamento": 1
    }
  },
  "pedidos_concluidos": {
    "quantidade": 4
  },
  "pedidos_cancelados": {
    "quantidade": 1
  }
}
```

### Exemplo de Uso no Frontend

```typescript
const obterDashboardPedidos = async (token: string) => {
  const response = await fetch(
    'http://seu-backend.com/api/v1/pedidos/dashboard/resumo',
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    throw new Error('Erro ao obter dashboard');
  }

  return response.json();
};

// Uso
const dashboard = await obterDashboardPedidos(token);

// Vendas
console.log(`💰 Faturamento Confirmado (Vendas): R$ ${dashboard.faturamento_confirmado_venda.valor.toFixed(2)}`);
console.log(`🧾 Valor em Aberto (Vendas): R$ ${dashboard.valor_em_aberto_venda.valor.toFixed(2)}`);

// Compras
console.log(`🛒 Compras Confirmadas: R$ ${dashboard.compras_confirmadas.valor.toFixed(2)}`);
console.log(`📋 Compras em Aberto: R$ ${dashboard.compras_em_aberto.valor.toFixed(2)}`);

// Operacional
console.log(`📦 Pedidos em Andamento: ${dashboard.pedidos_em_andamento.quantidade}`);
console.log(`✅ Pedidos Concluídos: ${dashboard.pedidos_concluidos.quantidade}`);
console.log(`❌ Pedidos Cancelados: ${dashboard.pedidos_cancelados.quantidade}`);
```

---

## 📈 Status dos Pedidos

### Enum StatusPedido

```typescript
enum StatusPedido {
  PENDENTE = 'PENDENTE',                    // Aguardando processamento
  APROVADO = 'APROVADO',                    // Aprovado, aguardando separação
  EM_PROCESSAMENTO = 'EM_PROCESSAMENTO',    // Em separação/preparação
  CONCLUIDO = 'CONCLUIDO',                  // Finalizado e entregue
  CANCELADO = 'CANCELADO'                   // Cancelado
}
```

### Fluxo de Status

```
PENDENTE → APROVADO → EM_PROCESSAMENTO → CONCLUIDO
    ↓
CANCELADO (pode acontecer em qualquer momento)
```

### Impacto no Dashboard

| Status | Faturamento Venda | Valor Aberto Venda | Compras Confirmadas | Compras em Aberto | Em Andamento | Concluídos | Cancelados |
|--------|-------------------|---------------------|----------------------|-------------------|--------------|------------|------------|
| `PENDENTE` | ❌ | ✅ (se VENDA) | ❌ | ✅ (se COMPRA) | ✅ | ❌ | ❌ |
| `APROVADO` | ❌ | ✅ (se VENDA) | ❌ | ✅ (se COMPRA) | ✅ | ❌ | ❌ |
| `EM_PROCESSAMENTO` | ❌ | ✅ (se VENDA) | ❌ | ✅ (se COMPRA) | ✅ | ❌ | ❌ |
| `CONCLUIDO` | ✅ (se VENDA) | ❌ | ✅ (se COMPRA) | ❌ | ❌ | ✅ | ❌ |
| `CANCELADO` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 🧮 Cálculo de Valores

### Fórmula do Valor Total

```typescript
valor_total = subtotal - desconto_valor - (subtotal * desconto_percentual / 100) + frete + outras_taxas
```

### Onde:
- **subtotal:** Soma de todos os itens (quantidade × preco_unitario - desconto_item)
- **desconto_valor:** Desconto em valor fixo
- **desconto_percentual:** Desconto em percentual
- **frete:** Valor do frete
- **outras_taxas:** Outras taxas adicionais

### Exemplo de Cálculo

```typescript
// Itens do pedido
const itens = [
  { quantidade: 10, preco_unitario: 100.00, desconto: 0 },
  { quantidade: 5, preco_unitario: 50.00, desconto: 10.00 }
];

// Cálculo do subtotal
const subtotal = (10 * 100.00 - 0) + (5 * 50.00 - 10.00) = 1000.00 + 240.00 = 1240.00

// Descontos
const desconto_valor = 0;
const desconto_percentual = 10; // 10%

// Taxas
const frete = 50.00;
const outras_taxas = 10.00;

// Valor total
const valor_total = 1240.00 - 0 - (1240.00 * 10 / 100) + 50.00 + 10.00
                  = 1240.00 - 124.00 + 50.00 + 10.00
                  = 1176.00
```

---

## 🔗 Endpoints Disponíveis

### Base URL
```
http://seu-backend.com/api/v1/pedidos
```

### Lista Completa de Endpoints

| Método | Endpoint | Descrição | Permissões |
|--------|----------|-----------|------------|
| `POST` | `/api/v1/pedidos` | Criar novo pedido | ADMIN, GERENTE, VENDEDOR |
| `GET` | `/api/v1/pedidos` | Listar pedidos (com filtros) | ADMIN, GERENTE, VENDEDOR |
| `GET` | `/api/v1/pedidos/:id` | Buscar pedido por ID | ADMIN, GERENTE, VENDEDOR |
| `PATCH` | `/api/v1/pedidos/:id` | Atualizar pedido | ADMIN, GERENTE, VENDEDOR |
| `PATCH` | `/api/v1/pedidos/:id/cancelar` | Cancelar pedido | ADMIN, GERENTE |
| `GET` | `/api/v1/pedidos/dashboard/resumo` | Obter dashboard de pedidos | ADMIN, GERENTE, VENDEDOR |

### Exemplo de Requisição - Dashboard

```typescript
// Fetch API
const response = await fetch(
  'http://seu-backend.com/api/v1/pedidos/dashboard/resumo',
  {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }
);

const dashboard = await response.json();
```

```typescript
// Axios
const response = await axios.get(
  'http://seu-backend.com/api/v1/pedidos/dashboard/resumo',
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

const dashboard = response.data;
```

---

## 📦 Estrutura de Dados

### Pedido (Entity)

```typescript
interface Pedido {
  id: number;
  numero_pedido: string;              // Ex: "VEND-2026-00001" ou "COMP-2026-00001"
  tipo: TipoPedido;                    // 'VENDA' | 'COMPRA'
  status: StatusPedido;                // Enum de status
  cliente_id?: number;                 // ID do cliente (se tipo = VENDA)
  fornecedor_id?: number;               // ID do fornecedor (se tipo = COMPRA)
  transportadora_id?: number;          // ID da transportadora
  usuario_criacao_id: string;          // UUID do usuário que criou
  usuario_atualizacao_id?: string;     // UUID do usuário que atualizou
  
  // Datas
  data_pedido: string;                  // ISO 8601
  data_entrega_prevista?: string;       // ISO 8601
  data_entrega_realizada?: string;      // ISO 8601
  
  // Financeiro
  condicao_pagamento?: string;          // Ex: "30 dias", "2x", "À vista"
  forma_pagamento?: FormaPagamento;     // Enum
  prazo_entrega_dias?: number;
  subtotal: number;                     // Subtotal dos itens
  desconto_valor: number;               // Desconto em valor fixo
  desconto_percentual: number;          // Desconto em percentual
  frete: number;                        // Valor do frete
  outras_taxas: number;                 // Outras taxas
  valor_total: number;                  // Valor total do pedido
  
  // Observações
  observacoes_internas?: string;
  observacoes_cliente?: string;
  
  // Relacionamentos
  cliente?: Cliente;
  fornecedor?: Fornecedor;
  transportadora?: Transportadora;
  itens?: PedidoItem[];
  
  // Timestamps
  created_at: string;                   // ISO 8601
  updated_at: string;                   // ISO 8601
}
```

### Enums

```typescript
enum TipoPedido {
  VENDA = 'VENDA',
  COMPRA = 'COMPRA'
}

enum StatusPedido {
  PENDENTE = 'PENDENTE',
  APROVADO = 'APROVADO',
  EM_PROCESSAMENTO = 'EM_PROCESSAMENTO',
  CONCLUIDO = 'CONCLUIDO',
  CANCELADO = 'CANCELADO'
}

enum FormaPagamento {
  DINHEIRO = 'DINHEIRO',
  PIX = 'PIX',
  CARTAO_CREDITO = 'CARTAO_CREDITO',
  CARTAO_DEBITO = 'CARTAO_DEBITO',
  BOLETO = 'BOLETO',
  TRANSFERENCIA = 'TRANSFERENCIA'
}
```

---

## 💻 Exemplos Práticos

### Exemplo 1: Criar Pedido de Venda e Verificar Dashboard

```typescript
// 1. Criar pedido de venda
const pedidoVenda = await criarPedido({
  tipo: 'VENDA',
  cliente_id: 1,
  data_pedido: '2026-01-15',
  valor_total: 1000.00,
  status: 'PENDENTE',
  itens: [
    { produto_id: 1, quantidade: 10, preco_unitario: 100.00 }
  ]
});

// 2. Verificar dashboard
const dashboard = await obterDashboardPedidos(token);

console.log('Valor em Aberto (Vendas):', dashboard.valor_em_aberto_venda.valor); // 1000.00
console.log('Pedidos em Andamento:', dashboard.pedidos_em_andamento.quantidade); // +1
```

### Exemplo 2: Criar Pedido de Compra e Verificar Dashboard

```typescript
// 1. Criar pedido de compra
const pedidoCompra = await criarPedido({
  tipo: 'COMPRA',
  fornecedor_id: 1,
  data_pedido: '2026-01-15',
  valor_total: 2000.00,
  status: 'PENDENTE',
  itens: [
    { produto_id: 2, quantidade: 20, preco_unitario: 100.00 }
  ]
});

// 2. Verificar dashboard
const dashboard = await obterDashboardPedidos(token);

console.log('Compras em Aberto:', dashboard.compras_em_aberto.valor); // 2000.00
console.log('Pedidos em Andamento:', dashboard.pedidos_em_andamento.quantidade); // +1
```

### Exemplo 3: Concluir Pedido e Verificar Dashboard

```typescript
// 1. Atualizar pedido para CONCLUIDO
await atualizarPedido(pedidoId, {
  status: 'CONCLUIDO'
});

// 2. Verificar dashboard
const dashboard = await obterDashboardPedidos(token);

// Se for pedido de VENDA
if (pedido.tipo === 'VENDA') {
  console.log('Faturamento Confirmado (Vendas):', dashboard.faturamento_confirmado_venda.valor); // +1000.00
  console.log('Valor em Aberto (Vendas):', dashboard.valor_em_aberto_venda.valor); // -1000.00
}

// Se for pedido de COMPRA
if (pedido.tipo === 'COMPRA') {
  console.log('Compras Confirmadas:', dashboard.compras_confirmadas.valor); // +2000.00
  console.log('Compras em Aberto:', dashboard.compras_em_aberto.valor); // -2000.00
}

console.log('Pedidos Concluídos:', dashboard.pedidos_concluidos.quantidade); // +1
```

### Exemplo 4: Cancelar Pedido e Verificar Dashboard

```typescript
// 1. Cancelar pedido
await cancelarPedido(pedidoId);

// 2. Verificar dashboard
const dashboard = await obterDashboardPedidos(token);

// O valor_total do pedido permanece o mesmo
// Mas não aparece mais nos cálculos financeiros

// Se for pedido de VENDA
if (pedido.tipo === 'VENDA') {
  console.log('Faturamento Confirmado (Vendas):', dashboard.faturamento_confirmado_venda.valor); // Não inclui
  console.log('Valor em Aberto (Vendas):', dashboard.valor_em_aberto_venda.valor); // Não inclui
}

// Se for pedido de COMPRA
if (pedido.tipo === 'COMPRA') {
  console.log('Compras Confirmadas:', dashboard.compras_confirmadas.valor); // Não inclui
  console.log('Compras em Aberto:', dashboard.compras_em_aberto.valor); // Não inclui
}

console.log('Pedidos Cancelados:', dashboard.pedidos_cancelados.quantidade); // +1
```

### Exemplo 5: Implementação Completa do Dashboard

```typescript
// api/pedidos.ts
export const pedidoApi = {
  obterDashboard: async (token: string): Promise<DashboardPedidos> => {
    const response = await fetch(
      'http://seu-backend.com/api/v1/pedidos/dashboard/resumo',
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Erro ao obter dashboard');
    }

    return response.json();
  }
};

// components/DashboardPedidos.tsx
import React, { useEffect, useState } from 'react';
import { pedidoApi } from '../api/pedidos';

interface DashboardPedidos {
  faturamento_confirmado_venda: { valor: number; quantidade: number };
  valor_em_aberto_venda: { valor: number; quantidade: number };
  compras_confirmadas: { valor: number; quantidade: number };
  compras_em_aberto: { valor: number; quantidade: number };
  pedidos_em_andamento: { quantidade: number; detalhes: any };
  pedidos_concluidos: { quantidade: number };
  pedidos_cancelados: { quantidade: number };
}

export const DashboardPedidos: React.FC = () => {
  const [dashboard, setDashboard] = useState<DashboardPedidos | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarDashboard = async () => {
      try {
        const token = localStorage.getItem('token');
        const data = await pedidoApi.obterDashboard(token!);
        setDashboard(data);
      } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    carregarDashboard();
  }, []);

  if (loading) return <div>Carregando...</div>;
  if (!dashboard) return <div>Erro ao carregar dashboard</div>;

  return (
    <div className="dashboard-pedidos">
      {/* BLOCO 1 — Financeiro VENDA */}
      <div className="bloco-financeiro-venda">
        <h2>💰 Vendas</h2>
        <div className="card">
          <h3>Faturamento Confirmado</h3>
          <p className="valor">
            R$ {dashboard.faturamento_confirmado_venda.valor.toFixed(2)}
          </p>
          <p className="quantidade">
            {dashboard.faturamento_confirmado_venda.quantidade} pedidos
          </p>
        </div>

        <div className="card">
          <h3>Valor em Aberto</h3>
          <p className="valor">
            R$ {dashboard.valor_em_aberto_venda.valor.toFixed(2)}
          </p>
          <p className="quantidade">
            {dashboard.valor_em_aberto_venda.quantidade} pedidos
          </p>
        </div>
      </div>

      {/* BLOCO 1 — Financeiro COMPRA */}
      <div className="bloco-financeiro-compra">
        <h2>🛒 Compras</h2>
        <div className="card">
          <h3>Compras Confirmadas</h3>
          <p className="valor">
            R$ {dashboard.compras_confirmadas.valor.toFixed(2)}
          </p>
          <p className="quantidade">
            {dashboard.compras_confirmadas.quantidade} pedidos
          </p>
        </div>

        <div className="card">
          <h3>Compras em Aberto</h3>
          <p className="valor">
            R$ {dashboard.compras_em_aberto.valor.toFixed(2)}
          </p>
          <p className="quantidade">
            {dashboard.compras_em_aberto.quantidade} pedidos
          </p>
        </div>
      </div>

      {/* BLOCO 2 — Operacional */}
      <div className="bloco-operacional">
        <div className="card">
          <h3>📦 Pedidos em Andamento</h3>
          <p className="quantidade">
            {dashboard.pedidos_em_andamento.quantidade} pedidos
          </p>
          <div className="detalhes">
            <span>Pendente: {dashboard.pedidos_em_andamento.detalhes.pendente}</span>
            <span>Aprovado: {dashboard.pedidos_em_andamento.detalhes.aprovado}</span>
            <span>Em Processamento: {dashboard.pedidos_em_andamento.detalhes.em_processamento}</span>
          </div>
        </div>

        <div className="card">
          <h3>✅ Pedidos Concluídos</h3>
          <p className="quantidade">
            {dashboard.pedidos_concluidos.quantidade} pedidos
          </p>
        </div>

        <div className="card">
          <h3>❌ Pedidos Cancelados</h3>
          <p className="quantidade">
            {dashboard.pedidos_cancelados.quantidade} pedidos
          </p>
        </div>
      </div>
    </div>
  );
};
```

---

## 🔍 Troubleshooting

### Problema: Dashboard não retorna valores de compras

**Solução:** ✅ **Agora incluído!** O dashboard agora retorna valores separados para VENDA e COMPRA.

- `faturamento_confirmado_venda`: Vendas concluídas
- `valor_em_aberto_venda`: Vendas em aberto
- `compras_confirmadas`: Compras concluídas
- `compras_em_aberto`: Compras em aberto

### Problema: Valores não batem com a soma dos pedidos

**Solução:** Verifique:
- Se está usando os campos corretos (`faturamento_confirmado_venda` para vendas, `compras_confirmadas` para compras)
- Se está excluindo pedidos CANCELADOS
- Se está filtrando pelo tipo correto (VENDA ou COMPRA)

### Problema: Valor total não muda ao cancelar

**Solução:** ✅ **Correto!** O valor_total não deve mudar ao cancelar. É um dado histórico.

- O valor permanece no pedido para histórico
- Mas não entra nos cálculos do dashboard

### Problema: Dashboard retorna erro 401

**Solução:** Verifique se o token JWT está válido e contém `schema_name`.

```typescript
// Verificar token
const token = localStorage.getItem('token');
if (!token) {
  // Redirecionar para login
}
```

---

## ✅ Resumo das Regras

### Valores Financeiros - VENDA

- ✅ **Faturamento Confirmado:** Apenas pedidos `VENDA` com status `CONCLUIDO`
- ✅ **Valor em Aberto:** Apenas pedidos `VENDA` com status diferente de `CONCLUIDO` e `CANCELADO`

### Valores Financeiros - COMPRA

- ✅ **Compras Confirmadas:** Apenas pedidos `COMPRA` com status `CONCLUIDO`
- ✅ **Compras em Aberto:** Apenas pedidos `COMPRA` com status diferente de `CONCLUIDO` e `CANCELADO`

### Quantidades Operacionais

- ✅ **Em Andamento:** Status `PENDENTE`, `APROVADO` ou `EM_PROCESSAMENTO` (inclui VENDA e COMPRA)
- ✅ **Concluídos:** Status `CONCLUIDO` (inclui VENDA e COMPRA)
- ✅ **Cancelados:** Status `CANCELADO` (inclui VENDA e COMPRA)

### Cancelamento

- ✅ **Valor Total:** Permanece o mesmo (dado histórico)
- ✅ **Dashboard:** Não inclui em cálculos financeiros (nem VENDA nem COMPRA)
- ✅ **Contagem:** Inclui na seção "Pedidos Cancelados"

---

**Última atualização:** Janeiro 2026  
**Versão do Backend:** NestJS com TypeORM  
**Status:** ✅ Dashboard implementado com suporte a VENDA e COMPRA

