# 📘 Guia de Integração - Pedidos e Contas Financeiras (Frontend)

Este guia explica como funciona a integração automática entre Pedidos e Contas Financeiras no backend e como o frontend deve trabalhar com isso.

---

## 📋 Índice

1. [Como Funciona a Integração Automática](#como-funciona-a-integração-automática)
2. [Quando as Contas são Criadas](#quando-as-contas-são-criadas)
3. [Tipos de Contas Geradas](#tipos-de-contas-geradas)
4. [Condições de Pagamento e Parcelas](#condições-de-pagamento-e-parcelas)
5. [Consultando Contas Criadas](#consultando-contas-criadas)
6. [Sincronização Automática](#sincronização-automática)
7. [Exemplos Práticos](#exemplos-práticos)
8. [Troubleshooting](#troubleshooting)

---

## ✅ Como Funciona a Integração Automática

### Processo Automático

**O backend cria contas financeiras automaticamente quando um pedido é criado ou atualizado.**

1. **Ao criar um pedido:**
   - O pedido é salvo no banco de dados
   - Automaticamente, o backend chama `sincronizarContasDoPedido()`
   - As contas financeiras são criadas baseadas no tipo de pedido e condição de pagamento

2. **Ao atualizar um pedido:**
   - Se o valor total ou condição de pagamento mudar, as contas são recriadas
   - Se apenas o status mudar, as contas são atualizadas

3. **Ao cancelar um pedido:**
   - Todas as contas relacionadas são canceladas automaticamente

### ⚠️ Importante

- **Não é necessário criar contas manualmente** quando criar um pedido
- O backend faz isso automaticamente
- O frontend apenas precisa criar o pedido normalmente

---

## ⏰ Quando as Contas são Criadas

### Status do Pedido

| Status do Pedido | Contas Criadas? | Observação |
|-------------------|-----------------|------------|
| `PENDENTE` | ✅ Sim | Contas criadas com status PENDENTE |
| `APROVADO` | ✅ Sim | Contas criadas com status PENDENTE |
| `EM_PROCESSAMENTO` | ✅ Sim | Contas criadas com status PENDENTE |
| `CONCLUIDO` | ✅ Sim | Contas criadas com status PAGO_TOTAL |
| `CANCELADO` | ❌ Não | Contas são canceladas (se existirem) |

**Regra:** Contas são criadas para **TODOS os pedidos**, exceto `CANCELADO`.

---

## 💰 Tipos de Contas Geradas

### Pedido de VENDA → Contas a RECEBER

Quando você cria um pedido de **VENDA**:

```typescript
{
  tipo: 'VENDA',
  cliente_id: 1,
  valor_total: 1000.00,
  condicao_pagamento: '30 dias',
  // ...
}
```

**Resultado:** O backend cria contas do tipo **RECEBER** vinculadas ao cliente.

### Pedido de COMPRA → Contas a PAGAR

Quando você cria um pedido de **COMPRA**:

```typescript
{
  tipo: 'COMPRA',
  fornecedor_id: 1,
  valor_total: 2000.00,
  condicao_pagamento: '60 dias',
  // ...
}
```

**Resultado:** O backend cria contas do tipo **PAGAR** vinculadas ao fornecedor.

---

## 📅 Condições de Pagamento e Parcelas

### Como Funciona

O backend calcula automaticamente as parcelas baseado na `condicao_pagamento` do pedido.

### Formatos Aceitos

| Condição de Pagamento | Parcelas Geradas | Exemplo |
|------------------------|------------------|---------|
| `"À vista"` | 1 parcela | Valor total em 1 parcela |
| `"30 dias"` | 1 parcela | Valor total vencendo em 30 dias |
| `"2x"` ou `"2X"` | 2 parcelas | Valor dividido em 2 parcelas |
| `"3x 30/60/90"` | 3 parcelas | 3 parcelas vencendo em 30, 60 e 90 dias |
| `"10x sem juros"` | 10 parcelas | Valor dividido em 10 parcelas |

### Exemplos de Criação de Contas

#### Exemplo 1: Pedido à Vista

```typescript
const pedido = {
  tipo: 'VENDA',
  cliente_id: 1,
  valor_total: 1000.00,
  condicao_pagamento: 'À vista',
  // ...
};

// Resultado: 1 conta criada
// - CREC-2025-00001
// - Valor: R$ 1.000,00
// - Vencimento: Data do pedido
```

#### Exemplo 2: Pedido Parcelado

```typescript
const pedido = {
  tipo: 'VENDA',
  cliente_id: 1,
  valor_total: 3000.00,
  condicao_pagamento: '3x',
  // ...
};

// Resultado: 3 contas criadas
// - CREC-2025-00001 (Parcela 1/3) - R$ 1.000,00
// - CREC-2025-00002 (Parcela 2/3) - R$ 1.000,00
// - CREC-2025-00003 (Parcela 3/3) - R$ 1.000,00
```

#### Exemplo 3: Pedido com Prazo

```typescript
const pedido = {
  tipo: 'COMPRA',
  fornecedor_id: 1,
  valor_total: 5000.00,
  condicao_pagamento: '30 dias',
  // ...
};

// Resultado: 1 conta criada
// - CPAG-2025-00001
// - Valor: R$ 5.000,00
// - Vencimento: Data do pedido + 30 dias
```

---

## 🔍 Consultando Contas Criadas

### 1. Buscar Contas por Pedido

```typescript
const buscarContasPorPedido = async (pedidoId: number) => {
  const response = await fetch(
    `http://seu-backend.com/api/v1/contas-financeiras?pedido_id=${pedidoId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  return response.json();
};

// Exemplo de uso
const contas = await buscarContasPorPedido(1);
console.log('Contas do pedido:', contas);
```

### 2. Buscar Contas a Receber por Cliente

```typescript
const buscarContasReceberPorCliente = async (clienteId: number) => {
  const response = await fetch(
    `http://seu-backend.com/api/v1/contas-financeiras/receber/cliente/${clienteId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  return response.json();
};
```

### 3. Buscar Contas a Pagar por Fornecedor

```typescript
const buscarContasPagarPorFornecedor = async (fornecedorId: number) => {
  const response = await fetch(
    `http://seu-backend.com/api/v1/contas-financeiras/pagar/fornecedor/${fornecedorId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  return response.json();
};
```

### 4. Listar Todas as Contas

```typescript
const listarContas = async (
  tipo?: 'PAGAR' | 'RECEBER',
  status?: 'PENDENTE' | 'PAGO_TOTAL' | 'VENCIDO' | 'CANCELADO',
  page: number = 1,
  limit: number = 15
) => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  });

  if (tipo) params.append('tipo', tipo);
  if (status) params.append('status', status);

  const response = await fetch(
    `http://seu-backend.com/api/v1/contas-financeiras?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  return response.json();
};
```

---

## 🔄 Sincronização Automática

### Quando Ocorre

A sincronização acontece automaticamente em:

1. **Criação de pedido** - Contas são criadas automaticamente
2. **Atualização de pedido** - Contas são atualizadas ou recriadas se necessário
3. **Cancelamento de pedido** - Contas são canceladas

### O que é Sincronizado

- **Número de parcelas** - Baseado na condição de pagamento
- **Valores** - Baseado no valor total do pedido
- **Datas de vencimento** - Calculadas automaticamente
- **Status** - Baseado no status do pedido
- **Forma de pagamento** - Copiada do pedido

### Exemplo de Fluxo Completo

```typescript
// 1. Criar pedido
const pedido = await criarPedido({
  tipo: 'VENDA',
  cliente_id: 1,
  valor_total: 3000.00,
  condicao_pagamento: '3x',
  forma_pagamento: 'PIX',
  data_pedido: '2025-01-15',
  itens: [
    { produto_id: 1, quantidade: 10, preco_unitario: 300.00 }
  ]
});

console.log('Pedido criado:', pedido.numero_pedido);

// 2. Buscar contas criadas automaticamente
const contas = await buscarContasPorPedido(pedido.id);
console.log('Contas criadas:', contas);
// Output: 3 contas a receber, uma para cada parcela

// 3. Atualizar pedido (mudar valor)
await atualizarPedido(pedido.id, {
  valor_total: 4000.00
});

// 4. Contas são recriadas automaticamente com novos valores
const contasAtualizadas = await buscarContasPorPedido(pedido.id);
console.log('Contas atualizadas:', contasAtualizadas);
```

---

## 💻 Exemplos Práticos

### Exemplo 1: Criar Pedido e Verificar Contas

```typescript
const criarPedidoComVerificacao = async () => {
  // Criar pedido
  const pedido = await criarPedido({
    tipo: 'VENDA',
    cliente_id: 1,
    valor_total: 2000.00,
    condicao_pagamento: '2x',
    forma_pagamento: 'PIX',
    data_pedido: '2025-01-15',
    itens: [
      { produto_id: 1, quantidade: 5, preco_unitario: 400.00 }
    ]
  });

  // Aguardar um pouco para garantir que as contas foram criadas
  await new Promise(resolve => setTimeout(resolve, 500));

  // Buscar contas criadas
  const contas = await buscarContasPorPedido(pedido.id);

  console.log(`Pedido ${pedido.numero_pedido} criado`);
  console.log(`${contas.length} conta(s) financeira(s) criada(s):`);
  
  contas.forEach((conta, index) => {
    console.log(`  ${index + 1}. ${conta.numero_conta} - R$ ${conta.valor_original.toFixed(2)} - Vencimento: ${conta.data_vencimento}`);
  });

  return { pedido, contas };
};
```

### Exemplo 2: Dashboard de Contas após Criar Pedido

```typescript
const criarPedidoEAtualizarDashboard = async () => {
  // Criar pedido
  const pedido = await criarPedido({
    tipo: 'VENDA',
    cliente_id: 1,
    valor_total: 5000.00,
    condicao_pagamento: '5x',
    forma_pagamento: 'BOLETO',
    data_pedido: '2025-01-15',
    itens: [
      { produto_id: 1, quantidade: 10, preco_unitario: 500.00 }
    ]
  });

  // Buscar resumo financeiro
  const resumo = await fetch(
    'http://seu-backend.com/api/v1/contas-financeiras/dashboard/resumo',
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  ).then(r => r.json());

  console.log('Resumo Financeiro:');
  console.log(`  Total a Receber: R$ ${resumo.total_receber}`);
  console.log(`  Total a Pagar: R$ ${resumo.total_pagar}`);
  console.log(`  Saldo: R$ ${resumo.saldo}`);

  return { pedido, resumo };
};
```

### Exemplo 3: Cancelar Pedido e Verificar Contas

```typescript
const cancelarPedidoEVerificarContas = async (pedidoId: number) => {
  // Cancelar pedido
  const pedidoCancelado = await cancelarPedido(pedidoId);

  // Buscar contas (devem estar canceladas)
  const contas = await buscarContasPorPedido(pedidoId);

  console.log(`Pedido ${pedidoCancelado.numero_pedido} cancelado`);
  console.log('Status das contas:');
  
  contas.forEach(conta => {
    console.log(`  ${conta.numero_conta}: ${conta.status}`);
    // Todas devem estar com status CANCELADO
  });

  return { pedido: pedidoCancelado, contas };
};
```

---

## 📊 Estrutura das Contas Financeiras

### ContaFinanceira (Resposta do Backend)

```typescript
interface ContaFinanceira {
  id: number;
  numero_conta: string;              // Ex: "CREC-2025-00001"
  tipo: TipoConta;                    // 'PAGAR' | 'RECEBER'
  pedido_id?: number;                 // ID do pedido relacionado
  cliente_id?: number;                // ID do cliente (se tipo = RECEBER)
  fornecedor_id?: number;             // ID do fornecedor (se tipo = PAGAR)
  descricao: string;                  // Ex: "Pedido VENDA-0001 - Parcela 1/3"
  valor_original: number;             // Valor original da conta
  valor_pago: number;                 // Valor já pago
  valor_restante: number;             // Valor ainda a pagar/receber
  data_emissao: string;               // ISO 8601
  data_vencimento: string;            // ISO 8601
  data_pagamento?: string | null;      // ISO 8601 (se pago)
  status: StatusConta;                // 'PENDENTE' | 'PAGO_TOTAL' | 'PAGO_PARCIAL' | 'VENCIDO' | 'CANCELADO'
  forma_pagamento?: FormaPagamento;   // 'DINHEIRO' | 'PIX' | 'CARTAO_CREDITO' | etc.
  numero_parcela?: number;            // Número da parcela (1, 2, 3...)
  total_parcelas?: number;            // Total de parcelas
  parcela_texto?: string;             // Ex: "1/3"
  observacoes?: string | null;
  created_at: string;                 // ISO 8601
  updated_at: string;                 // ISO 8601
}
```

### Enums

```typescript
enum TipoConta {
  PAGAR = 'PAGAR',
  RECEBER = 'RECEBER'
}

enum StatusConta {
  PENDENTE = 'PENDENTE',
  PAGO_PARCIAL = 'PAGO_PARCIAL',
  PAGO_TOTAL = 'PAGO_TOTAL',
  VENCIDO = 'VENCIDO',
  CANCELADO = 'CANCELADO'
}
```

---

## 🔄 Fluxo Completo de Integração

### 1. Criar Pedido

```typescript
// Frontend apenas cria o pedido
const pedido = await criarPedido({
  tipo: 'VENDA',
  cliente_id: 1,
  valor_total: 3000.00,
  condicao_pagamento: '3x',
  forma_pagamento: 'PIX',
  data_pedido: '2025-01-15',
  itens: [
    { produto_id: 1, quantidade: 10, preco_unitario: 300.00 }
  ]
});

// Backend automaticamente:
// ✅ Cria o pedido
// ✅ Calcula parcelas baseado em '3x'
// ✅ Cria 3 contas a RECEBER
// ✅ Vincula contas ao cliente
// ✅ Define datas de vencimento
```

### 2. Verificar Contas Criadas

```typescript
// Após criar o pedido, buscar as contas
const contas = await buscarContasPorPedido(pedido.id);

// Exibir para o usuário
contas.forEach(conta => {
  console.log(`${conta.numero_conta}: R$ ${conta.valor_original} - Vence em ${conta.data_vencimento}`);
});
```

### 3. Atualizar Pedido

```typescript
// Se o valor ou condição mudar, as contas são recriadas automaticamente
await atualizarPedido(pedido.id, {
  valor_total: 4000.00,
  condicao_pagamento: '4x'
});

// Backend automaticamente:
// ✅ Verifica se contas existem
// ✅ Compara valores e parcelas
// ✅ Se diferente, deleta contas antigas (sem pagamento) e cria novas
// ✅ Se igual, apenas atualiza status
```

### 4. Cancelar Pedido

```typescript
// Ao cancelar, as contas são canceladas automaticamente
await cancelarPedido(pedido.id);

// Backend automaticamente:
// ✅ Cancela o pedido
// ✅ Cancela todas as contas relacionadas
```

---

## 📝 Exemplo Completo de Integração

```typescript
// api.ts
const API_BASE_URL = 'http://seu-backend.com/api/v1';

export const pedidoApi = {
  criar: async (dados: CreatePedidoDto, token: string): Promise<Pedido> => {
    const response = await fetch(`${API_BASE_URL}/pedidos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(dados)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao criar pedido');
    }

    return response.json();
  },

  buscarPorId: async (id: number, token: string): Promise<Pedido> => {
    const response = await fetch(`${API_BASE_URL}/pedidos/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Pedido não encontrado');
    }

    return response.json();
  }
};

export const contaFinanceiraApi = {
  buscarPorPedido: async (
    pedidoId: number,
    token: string
  ): Promise<ContaFinanceira[]> => {
    const response = await fetch(
      `${API_BASE_URL}/contas-financeiras?pedido_id=${pedidoId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('Erro ao buscar contas');
    }

    const resultado = await response.json();
    return resultado.contas || resultado; // Pode retornar array direto ou objeto com contas
  },

  listar: async (
    token: string,
    tipo?: 'PAGAR' | 'RECEBER',
    status?: StatusConta,
    page: number = 1,
    limit: number = 15
  ): Promise<{ contas: ContaFinanceira[]; total: number }> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    if (tipo) params.append('tipo', tipo);
    if (status) params.append('status', status);

    const response = await fetch(
      `${API_BASE_URL}/contas-financeiras?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('Erro ao listar contas');
    }

    return response.json();
  },

  buscarPorId: async (
    id: number,
    token: string
  ): Promise<ContaFinanceira> => {
    const response = await fetch(
      `${API_BASE_URL}/contas-financeiras/${id}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('Conta não encontrada');
    }

    return response.json();
  }
};

// Uso completo
const exemploCompleto = async () => {
  const token = 'seu-token-jwt';

  // 1. Criar pedido
  const pedido = await pedidoApi.criar({
    tipo: 'VENDA',
    cliente_id: 1,
    valor_total: 3000.00,
    condicao_pagamento: '3x',
    forma_pagamento: 'PIX',
    data_pedido: '2025-01-15',
    itens: [
      { produto_id: 1, quantidade: 10, preco_unitario: 300.00 }
    ]
  }, token);

  console.log('✅ Pedido criado:', pedido.numero_pedido);

  // 2. Aguardar sincronização (opcional, mas recomendado)
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 3. Buscar contas criadas automaticamente
  const contas = await contaFinanceiraApi.buscarPorPedido(pedido.id, token);

  console.log(`✅ ${contas.length} conta(s) financeira(s) criada(s) automaticamente:`);
  contas.forEach((conta, index) => {
    console.log(`  ${index + 1}. ${conta.numero_conta}`);
    console.log(`     Descrição: ${conta.descricao}`);
    console.log(`     Valor: R$ ${conta.valor_original.toFixed(2)}`);
    console.log(`     Vencimento: ${conta.data_vencimento}`);
    console.log(`     Status: ${conta.status}`);
  });

  // 4. Listar todas as contas a receber
  const todasContasReceber = await contaFinanceiraApi.listar(
    token,
    'RECEBER',
    'PENDENTE'
  );

  console.log(`\n📊 Total de contas a receber pendentes: ${todasContasReceber.total}`);

  return { pedido, contas, todasContasReceber };
};
```

---

## ⚠️ Regras Importantes

### 1. Contas são Criadas Automaticamente

- ✅ **Não é necessário** criar contas manualmente ao criar um pedido
- ✅ O backend faz isso automaticamente
- ✅ Apenas crie o pedido normalmente

### 2. Condição de Pagamento

- ✅ Use formatos padrão: `"À vista"`, `"30 dias"`, `"2x"`, `"3x 30/60/90"`, etc.
- ✅ O backend calcula as parcelas automaticamente
- ✅ Se não informar, usa `"À vista"` como padrão

### 3. Valor Total

- ✅ O backend calcula automaticamente baseado nos itens
- ✅ Você pode enviar `valor_total` explicitamente se necessário
- ✅ Se `valor_total <= 0`, nenhuma conta será criada

### 4. Status do Pedido

- ✅ Pedidos `PENDENTE`, `APROVADO`, `EM_PROCESSAMENTO` → Contas com status `PENDENTE`
- ✅ Pedidos `CONCLUIDO` → Contas com status `PAGO_TOTAL`
- ✅ Pedidos `CANCELADO` → Contas são canceladas

### 5. Sincronização

- ✅ Contas são sincronizadas automaticamente ao atualizar pedido
- ✅ Se valores ou parcelas mudarem, contas são recriadas
- ✅ Se apenas status mudar, contas são atualizadas

---

## 🔍 Troubleshooting

### Problema: Contas não estão sendo criadas

**Possíveis causas:**

1. **Valor total zero ou negativo**
   ```typescript
   // ❌ ERRADO
   { valor_total: 0 }
   
   // ✅ CORRETO
   { valor_total: 100.00 }
   ```

2. **Condição de pagamento inválida**
   ```typescript
   // ✅ Use formatos padrão
   { condicao_pagamento: 'À vista' }
   { condicao_pagamento: '30 dias' }
   { condicao_pagamento: '3x' }
   ```

3. **Pedido cancelado**
   - Pedidos `CANCELADO` não geram contas

**Solução:** Verifique os logs do backend para ver se há erros na sincronização.

### Problema: Contas duplicadas

**Causa:** Pode acontecer se o pedido for atualizado múltiplas vezes rapidamente.

**Solução:** O backend já trata isso verificando se contas existem antes de criar novas.

### Problema: Não consigo buscar contas por pedido

**Solução:** Verifique se o endpoint está correto:
```typescript
// ✅ CORRETO
GET /api/v1/contas-financeiras?pedido_id=1

// ❌ ERRADO
GET /api/v1/contas-financeiras/pedido/1
```

---

## 📊 Dashboard Financeiro

### Resumo Financeiro

```typescript
const obterResumoFinanceiro = async (token: string) => {
  const response = await fetch(
    'http://seu-backend.com/api/v1/contas-financeiras/dashboard/resumo',
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  return response.json();
};

// Retorna:
// {
//   total_receber: number,
//   total_pagar: number,
//   saldo: number,
//   contas_vencidas: number,
//   contas_vencendo_hoje: number,
//   // ... outros dados
// }
```

### Resumo Contas a Receber

```typescript
const obterResumoReceber = async (token: string) => {
  const response = await fetch(
    'http://seu-backend.com/api/v1/contas-financeiras/dashboard/receber',
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  return response.json();
};
```

### Resumo Contas a Pagar

```typescript
const obterResumoPagar = async (token: string) => {
  const response = await fetch(
    'http://seu-backend.com/api/v1/contas-financeiras/dashboard/pagar',
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  return response.json();
};
```

---

## ✅ Checklist para o Frontend

- [ ] Entender que contas são criadas automaticamente
- [ ] Não tentar criar contas manualmente ao criar pedido
- [ ] Buscar contas após criar pedido para exibir ao usuário
- [ ] Atualizar dashboard financeiro após criar pedido
- [ ] Tratar casos onde contas podem não ser criadas (valor zero, etc.)
- [ ] Exibir contas relacionadas ao pedido na tela de detalhes do pedido
- [ ] Atualizar lista de contas quando pedido for atualizado

---

## 🎯 Resumo

### ✅ O que o Backend Faz Automaticamente

1. **Ao criar pedido:**
   - Cria contas financeiras automaticamente
   - Calcula parcelas baseado na condição de pagamento
   - Vincula contas ao cliente/fornecedor
   - Define datas de vencimento

2. **Ao atualizar pedido:**
   - Sincroniza contas automaticamente
   - Recria contas se valores ou parcelas mudarem
   - Atualiza status das contas

3. **Ao cancelar pedido:**
   - Cancela todas as contas relacionadas

### ✅ O que o Frontend Precisa Fazer

1. **Criar pedido normalmente** - Não precisa criar contas manualmente
2. **Buscar contas após criar pedido** - Para exibir ao usuário
3. **Atualizar dashboard** - Após criar/atualizar pedido
4. **Exibir contas relacionadas** - Na tela de detalhes do pedido

---

**Última atualização:** Janeiro 2024  
**Versão do Backend:** NestJS com TypeORM  
**Status:** ✅ Integração automática funcionando corretamente

