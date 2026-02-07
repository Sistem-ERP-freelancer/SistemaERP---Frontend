# Guia: Módulo Financeiro – Listagem agrupada (uma linha por cliente/pedido)

Este guia descreve como o frontend deve exibir a listagem do **módulo Financeiro** usando a visão **agrupada**: uma linha por cliente/pedido, com descrição do tipo “(N parcelas)”, valor total e status, **sem** listar cada parcela individualmente.

---

## 1. Objetivo

- Na tela principal do **Financeiro**, mostrar **uma linha por transação (pedido)** em vez de uma linha por parcela.
- Colunas: **Cliente**, **Descrição** (ex.: "Pedido VEND-2026-00001 (10 parcelas)"), **Tipo**, **Categoria**, **Valor (total)** e **Status**.
- O backend expõe um endpoint específico para essa visão: **GET /contas-financeiras/agrupado**.

---

## 2. Endpoint: listagem agrupada

| Método | URL | Uso |
|--------|-----|-----|
| GET | `/api/v1/contas-financeiras/agrupado` | Lista contas agrupadas por pedido (uma linha por cliente/pedido). |

**Headers:** `Authorization: Bearer <token>`

### 2.1 Parâmetros de query (opcionais)

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `tipo` | string | `RECEBER` ou `PAGAR` |
| `status` | string | `PENDENTE`, `PAGO_PARCIAL`, `PAGO_TOTAL`, `VENCIDO`, `CANCELADO` |
| `cliente_id` | number | Filtrar por ID do cliente |
| `fornecedor_id` | number | Filtrar por ID do fornecedor |
| `page` | number | Página (default: 1) |
| `limit` | number | Itens por página (default: 15) |

### 2.2 Estrutura da resposta

```json
{
  "itens": [
    {
      "id": 1,
      "pedido_id": 123,
      "cliente_nome": "João Silva",
      "descricao": "Pedido VEND-2026-00001 (10 parcelas)",
      "tipo": "RECEBER",
      "categoria": "Vendas",
      "valor_total": 360.00,
      "status": "PENDENTE"
    }
  ],
  "total": 1
}
```

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | number | ID da primeira conta do grupo (referência) |
| `pedido_id` | number \| null | ID do pedido; `null` para contas avulsas (sem pedido) |
| `cliente_nome` | string | Nome do cliente (receitas) ou do fornecedor (despesas) |
| `descricao` | string | "Pedido {numero} (N parcelas)" ou descrição da conta (avulsa) |
| `tipo` | string | `RECEBER` ou `PAGAR` |
| `categoria` | string | `Vendas` (RECEBER), `Compras` (PAGAR), `Outros` |
| `valor_total` | number | Soma do valor de todas as parcelas do grupo |
| `status` | string | Status do grupo: o “pior” entre as parcelas (PENDENTE > VENCIDO > PAGO_PARCIAL > PAGO_TOTAL) |

---

## 3. Onde usar no frontend

- **Tela principal do módulo Financeiro** (lista de receitas e despesas):
  - Chamar **GET /api/v1/contas-financeiras/agrupado** em vez de **GET /api/v1/contas-financeiras**.
  - Exibir a tabela com as colunas: **Cliente** (`cliente_nome`), **Descrição** (`descricao`), **Tipo** (`tipo`), **Categoria** (`categoria`), **Valor** (`valor_total`), **Status** (`status`).
- **Filtros:** repassar `tipo`, `status`, `cliente_id`, `fornecedor_id` como query params quando o usuário filtrar.
- **Paginação:** usar `page` e `limit`; o total de linhas vem em `total`.

---

## 4. Quando usar cada endpoint

| Cenário | Endpoint |
|---------|----------|
| Listagem do **Financeiro** (visão resumida: uma linha por cliente/pedido) | **GET /contas-financeiras/agrupado** |
| Detalhe de um cliente/pedido (listar parcelas para dar baixa, ver vencimentos) | **GET /contas-financeiras** (com filtros) ou endpoints por cliente/fornecedor |

O endpoint **GET /contas-financeiras** (sem agrupamento) continua disponível para telas que precisem da lista **por parcela** (ex.: dar baixa em parcelas, detalhe do pedido).

---

## 5. Exemplo de chamada (fetch)

```javascript
const params = new URLSearchParams();
if (tipo) params.set('tipo', tipo);           // ex: 'RECEBER'
if (status) params.set('status', status);     // ex: 'PENDENTE'
if (cliente_id) params.set('cliente_id', cliente_id);
if (page) params.set('page', page);
if (limit) params.set('limit', limit);

const res = await fetch(`/api/v1/contas-financeiras/agrupado?${params}`, {
  headers: { Authorization: `Bearer ${token}` },
});
const { itens, total } = await res.json();
```

---

## 6. Checklist de implementação

- [ ] Na tela principal do **Financeiro**, trocar a chamada de **GET /contas-financeiras** por **GET /contas-financeiras/agrupado**.
- [ ] Exibir na tabela: **Cliente**, **Descrição**, **Tipo**, **Categoria**, **Valor (total)** e **Status**.
- [ ] Repassar filtros (tipo, status, cliente, fornecedor) e paginação (page, limit) para o endpoint.
- [ ] Usar `itens` para as linhas e `total` para o total de registros (paginação).
- [ ] Manter **GET /contas-financeiras** (lista por parcela) para telas de detalhe/baixa quando necessário.

Com isso, o módulo Financeiro passa a listar **uma linha por cliente/pedido**, com valor total e descrição “(N parcelas)”, sem listar todas as parcelas na tabela principal.
