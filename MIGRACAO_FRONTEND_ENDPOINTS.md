# 🔄 MIGRAÇÃO DE ENDPOINTS - FRONTEND

## ⚠️ ENDPOINTS ANTIGOS REMOVIDOS

Os seguintes endpoints **não existem mais** e retornam **404**:

### ❌ Endpoints Removidos:
1. `GET /api/v1/duplicatas/contas-receber/clientes`
2. `GET /api/v1/duplicatas/agrupadas-por-pedido`
3. `GET /api/v1/duplicatas/agrupadas-por-pedido?status=ABERTA`
4. Todos os outros endpoints que começam com `/duplicatas/`

---

## ✅ NOVOS ENDPOINTS DISPONÍVEIS

### 1. Contas a Receber

**Antigo (removido):**
```
GET /api/v1/duplicatas/contas-receber/clientes
```

**Novo:**
```
GET /api/v1/pedidos/contas-receber
```

**Query Parameters:**
- `codigo` - código do pedido
- `cliente_id` - ID do cliente
- `cliente_nome` - nome do cliente (busca parcial)
- `valor_inicial` - valor mínimo
- `valor_final` - valor máximo
- `forma_pagamento` - PIX, DINHEIRO, CARTAO_CREDITO, etc.
- `situacao` - `em_aberto`, `em_atraso`, `concluido`
- `data_inicial` - data inicial (YYYY-MM-DD)
- `data_final` - data final (YYYY-MM-DD)

**Resposta:**
```json
[
  {
    "pedido_id": 1,
    "numero_pedido": "PED-2026-0001",
    "cliente_id": 1,
    "cliente_nome": "João Silva",
    "valor_total": 475.00,
    "valor_em_aberto": 316.66,
    "forma_pagamento": "PIX",
    "status": "PENDENTE",
    "data_pedido": "2026-02-10"
  }
]
```

**⚠️ IMPORTANTE:**
- Cada linha = **1 pedido** (não agrupado por cliente)
- Não existe mais agrupamento por cliente
- Retorna array direto (não precisa de `.clientes`)

---

### 2. Contas a Pagar

**Antigo (removido):**
```
GET /api/v1/duplicatas/contas-pagar/fornecedores
```

**Novo:**
```
GET /api/v1/pedidos/contas-pagar
```

**Query Parameters:**
- `codigo` - código do pedido
- `fornecedor_id` - ID do fornecedor
- `fornecedor_nome` - nome do fornecedor (busca parcial)
- `valor_inicial` - valor mínimo
- `valor_final` - valor máximo
- `forma_pagamento` - PIX, DINHEIRO, CARTAO_CREDITO, etc.
- `situacao` - `em_aberto`, `em_atraso`, `concluido`
- `data_inicial` - data inicial (YYYY-MM-DD)
- `data_final` - data final (YYYY-MM-DD)

**Resposta:** (mesma estrutura de contas a receber)

---

### 3. Duplicatas Agrupadas por Pedido

**Antigo (removido):**
```
GET /api/v1/duplicatas/agrupadas-por-pedido
GET /api/v1/duplicatas/agrupadas-por-pedido?status=ABERTA
```

**Novo:**
Não existe mais endpoint de agrupamento. Use:
```
GET /api/v1/pedidos/contas-receber
```

**Motivo:** 
- Cada linha já representa 1 pedido
- Não há mais necessidade de agrupar
- O endpoint retorna diretamente os pedidos com valor em aberto

---

## 📝 EXEMPLOS DE CÓDIGO PARA ATUALIZAR

### Antes (❌ Não funciona mais):
```typescript
// ❌ ERRADO
const response = await fetch('/api/v1/duplicatas/contas-receber/clientes');
const data = await response.json();
const clientes = data.clientes; // ❌ Não existe mais
```

### Depois (✅ Correto):
```typescript
// ✅ CORRETO
const response = await fetch('/api/v1/pedidos/contas-receber');
const pedidos = await response.json(); // Array direto de pedidos
// Cada item do array é um pedido com valor em aberto
```

---

### Exemplo com filtros:
```typescript
// ✅ CORRETO
const params = new URLSearchParams({
  situacao: 'em_aberto',
  data_inicial: '2026-01-01',
  data_final: '2026-02-10'
});

const response = await fetch(`/api/v1/pedidos/contas-receber?${params}`);
const pedidos = await response.json();
```

---

## 🔍 MAPEAMENTO DE CAMPOS

### Estrutura Antiga (Duplicatas):
```typescript
{
  clientes: [
    {
      cliente_id: 1,
      cliente_nome: "João",
      duplicatas: [...]
    }
  ]
}
```

### Estrutura Nova (Pedidos):
```typescript
[
  {
    pedido_id: 1,
    numero_pedido: "PED-2026-0001",
    cliente_id: 1,
    cliente_nome: "João Silva",
    valor_total: 475.00,
    valor_em_aberto: 316.66,
    forma_pagamento: "PIX",
    status: "PENDENTE",
    data_pedido: "2026-02-10"
  }
]
```

---

## ⚡ CHECKLIST DE ATUALIZAÇÃO

- [ ] Substituir `/duplicatas/contas-receber/clientes` por `/pedidos/contas-receber`
- [ ] Substituir `/duplicatas/contas-pagar/fornecedores` por `/pedidos/contas-pagar`
- [ ] Remover chamadas para `/duplicatas/agrupadas-por-pedido`
- [ ] Atualizar código que espera estrutura `{ clientes: [...] }` para array direto
- [ ] Atualizar mapeamento de campos (ver seção acima)
- [ ] Testar filtros (situacao, data_inicial, data_final, etc.)
- [ ] Verificar se a exibição na tabela está correta (cada linha = 1 pedido)

---

## 📚 DOCUMENTAÇÃO COMPLETA

Para mais detalhes sobre os novos endpoints, consulte:
- `GUIA_IMPLEMENTACAO_FRONTEND.md` - Guia completo de implementação
- Seção "Endpoints Disponíveis" para exemplos completos

---

## 🆘 SUPORTE

Se encontrar problemas na migração:
1. Verifique se está usando os endpoints corretos
2. Confira a estrutura de resposta esperada
3. Verifique os logs do console do navegador
4. Consulte a documentação Swagger: `https://sistemaerp-3.onrender.com/api/docs`
