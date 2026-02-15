# Guia completo — Implementação frontend (Pedido + Financeiro)

Guia para implementar no **frontend** tudo o que foi alterado nos módulos de **pedido** e **financeiro**: endpoints, dashboards, detalhes, listagens, antes e depois.

**Base URL da API:** ` /api/v1`

---

## Índice

1. [Resumo do que mudou no backend](#1-resumo-do-que-mudou-no-backend)
2. [Antes e depois por área](#2-antes-e-depois-por-área)
3. [Todos os endpoints (atual)](#3-todos-os-endpoints-atual)
4. [Dashboard — antes e depois](#4-dashboard--antes-e-depois)
5. [Detalhes — antes e depois](#5-detalhes--antes-e-depois)
6. [Listagem — antes e depois](#6-listagem--antes-e-depois)
7. [Passo a passo de implementação no frontend](#7-passo-a-passo-de-implementação-no-frontend)
8. [Tipagem e regras](#8-tipagem-e-regras)

---

## 1. Resumo do que mudou no backend

| Área | O que mudou |
|------|-------------|
| **Modelo** | Fim de “parcelas do pedido”. Agora: **1 conta financeira por pedido**, controle por **saldo** (valor_total, valor_pago, valor_em_aberto). |
| **Módulo Pedido** | Novos endpoints: GET `:id/financeiro`, GET `:id/pagamentos`, POST `:id/pagamentos`. Listagens `contas-receber` e `contas-pagar` passam a retornar **por pedido** (valor_pago, valor_em_aberto, data_vencimento). |
| **Módulo Financeiro** | **Novo.** Controller `/financeiro`: GET `dashboard`, GET `contas-receber` (contrato unificado para o front). |
| **Dashboard** | Cálculos passam a usar **saldo** (valor_em_aberto, valor_pago) e **pagamentos por pedido** (tb_pagamento.pedido_id), não mais parcelas. |
| **Detalhes** | Fonte da verdade é o **pedido**: resumo financeiro + histórico de pagamentos do pedido (não “detalhe da conta/parcela”). |
| **Registro de pagamento** | Única forma nova: POST `/pedidos/:id/pagamentos` (valor, forma_pagamento, data_pagamento). Não se paga mais “parcela_id”. |

---

## 2. Antes e depois por área

### 2.1 Endpoints

| Uso | Antes (com parcela) | Agora (modelo por saldo) |
|-----|----------------------|---------------------------|
| Resumo financeiro do título | Por conta ou parcela | **GET** `/pedidos/:id/financeiro` → valor_total, valor_pago, valor_em_aberto, status, data_vencimento |
| Histórico de pagamentos | Por parcela (ex.: pagamentos da parcela X) | **GET** `/pedidos/:id/pagamentos` → lista de pagamentos **do pedido** |
| Registrar pagamento | POST com `parcela_id` | **POST** `/pedidos/:id/pagamentos` com `valor`, `forma_pagamento`, `data_pagamento` |
| Listagem “contas a receber” | Lista de **contas/parcelas** (N por pedido) | **GET** `/pedidos/contas-receber` ou **GET** `/financeiro/contas-receber` → **1 linha por pedido** (valor_total, valor_pago, valor_em_aberto, status, data_vencimento) |
| Dashboard financeiro | Vários endpoints em `/contas-financeiras/dashboard/*` | **GET** `/financeiro/dashboard` (resumo unificado) ou manter `/contas-financeiras/dashboard/resumo` |

### 2.2 Módulo Pedido

| Antes | Depois |
|-------|--------|
| Sem endpoint de “resumo financeiro” do pedido. | **GET** `/pedidos/:id/financeiro` retorna valor_total, valor_pago, valor_em_aberto, status, data_vencimento. |
| Sem endpoint de “pagamentos do pedido”. | **GET** `/pedidos/:id/pagamentos` retorna array de { id, valor, forma_pagamento, data_pagamento }. |
| Pagamento era por parcela (outro fluxo). | **POST** `/pedidos/:id/pagamentos` registra pagamento no pedido (e atualiza conta automaticamente). |
| Listagem contas-receber com outro formato. | Listagem retorna **valor_pago** e **data_vencimento** em cada item (1 por pedido). |

### 2.3 Módulo Financeiro (novo)

| Endpoint | Descrição |
|----------|-----------|
| **GET** `/financeiro/dashboard` | Resumo geral (contas a receber, contas a pagar, saldo_atual, valor_pago_mes, etc.). |
| **GET** `/financeiro/contas-receber` | Listagem de contas a receber = **pedidos com valor em aberto** (mesma lógica de GET `/pedidos/contas-receber`). |

Use esses dois para o fluxo “financeiro” no front (listagem + dashboard).

### 2.4 Dashboards

| Antes | Depois |
|-------|--------|
| Dashboard usava **parcelas** e `tb_parcela_pedido` para valor pago e totais. | Dashboard usa **saldo** (valor_pago, valor_em_aberto) da **conta/pedido** e **pagamentos** (tb_pagamento com pedido_id). |
| Vários endpoints: `/contas-financeiras/dashboard/receber`, `/pagar`, `/resumo`, `/total-recebido`. | Pode usar só **GET** `/financeiro/dashboard` (resumo unificado) ou continuar usando os de `/contas-financeiras/dashboard/*` se já estiverem integrados. |

### 2.5 Detalhes (tela de “detalhe financeiro”)

| Antes | Depois |
|-------|--------|
| Detalhe por **conta** ou **parcela** (ex.: modal da conta, parcelas do pedido). | Detalhe por **pedido**: 1) **GET** `/pedidos/:id/financeiro` (cards: valor total, pago, em aberto, status); 2) **GET** `/pedidos/:id/pagamentos` (tabela Data, Valor, Forma). |
| Podia exibir “parcela 1/3”, “parcela 2/3”. | Não há mais “parcelas” do pedido. Exibir apenas resumo + histórico de pagamentos. |

### 2.6 Listagem (contas a receber / a pagar)

| Antes | Depois |
|-------|--------|
| Cada linha podia ser uma **parcela** ou **conta** (várias por pedido). | Cada linha = **1 pedido**. Campos: cliente_nome, numero_pedido, valor_total, **valor_pago**, **valor_em_aberto**, data_vencimento, status. |
| Sem valor_pago/valor_em_aberto na listagem. | Listagem já traz **valor_pago**, **valor_em_aberto**, **data_vencimento** por item. |

---

## 3. Todos os endpoints (atual)

### 3.1 Pedido (financeiro)

| Método | URL | Descrição |
|--------|-----|-----------|
| GET | `/pedidos/:id/financeiro` | Resumo financeiro do pedido (valor_total, valor_pago, valor_em_aberto, status, data_vencimento). |
| GET | `/pedidos/:id/pagamentos` | Histórico de pagamentos do pedido. |
| POST | `/pedidos/:id/pagamentos` | Registrar pagamento no pedido. |
| GET | `/pedidos/contas-receber` | Listagem contas a receber (1 linha por pedido; query params opcionais: codigo, cliente_id, cliente_nome, valor_inicial, valor_final, forma_pagamento, situacao, data_inicial, data_final). |
| GET | `/pedidos/contas-pagar` | Listagem contas a pagar (1 linha por pedido; query params análogos para fornecedor, etc.). |

**Response GET `/pedidos/:id/financeiro`:**
```json
{
  "valor_total": 500,
  "valor_pago": 200,
  "valor_em_aberto": 300,
  "status": "PARCIAL",
  "data_vencimento": "2026-03-15"
}
```

**Response GET `/pedidos/:id/pagamentos`:**
```json
[
  { "id": 1, "valor": 200, "forma_pagamento": "PIX", "data_pagamento": "2026-02-12" }
]
```

**Body POST `/pedidos/:id/pagamentos`:**
```json
{
  "valor": 200,
  "forma_pagamento": "PIX",
  "data_pagamento": "2026-02-12"
}
```
`data_pagamento` é opcional (default: hoje).

### 3.2 Financeiro (contrato unificado)

| Método | URL | Descrição |
|--------|-----|-----------|
| GET | `/financeiro/dashboard` | Resumo financeiro geral (contas_receber, contas_pagar, saldo_atual). |
| GET | `/financeiro/contas-receber` | Listagem contas a receber (mesmo formato de GET `/pedidos/contas-receber`). |

**Response GET `/financeiro/contas-receber`** (cada item = 1 pedido):
```json
[
  {
    "pedido_id": 1,
    "numero_pedido": "VEND-2026-00001",
    "cliente_id": 10,
    "cliente_nome": "Cliente X",
    "valor_total": 500,
    "valor_pago": 200,
    "valor_em_aberto": 300,
    "forma_pagamento": "PIX",
    "status": "PARCIAL",
    "data_pedido": "2026-02-01T00:00:00.000Z",
    "data_vencimento": "2026-03-15"
  }
]
```

**Response GET `/financeiro/dashboard`** (estrutura resumida):
```json
{
  "contas_receber": {
    "total": 10,
    "pendentes": 5,
    "pagas": 0,
    "vencidas": 2,
    "valor_total_receber": 15000,
    "valor_total_recebido": 8000,
    "valor_total_pendente": 7000,
    "receita_mes": 5000,
    "valor_pago_mes": 3200
  },
  "contas_pagar": { ... },
  "saldo_atual": 1200
}
```

### 3.3 Contas financeiras (alternativos / já existentes)

| Método | URL | Descrição |
|--------|-----|-----------|
| GET | `/contas-financeiras/dashboard/receber` | Resumo só “contas a receber”. |
| GET | `/contas-financeiras/dashboard/pagar` | Resumo só “contas a pagar”. |
| GET | `/contas-financeiras/dashboard/resumo` | Resumo geral (equivalente ao que `/financeiro/dashboard` entrega). |
| GET | `/contas-financeiras/dashboard/total-recebido` | Total recebido (valores já pagos). |
| GET | `/contas-financeiras/:id/detalhe` | Detalhe enriquecido de **uma conta** (pode continuar sendo usado para contas manuais; para “detalhe do pedido” use GET financeiro + GET pagamentos). |

---

## 4. Dashboard — Antes e depois

### Antes

- Fonte dos valores: **parcelas** (`tb_parcela_pedido`) e pagamentos por parcela.
- Endpoints: `/contas-financeiras/dashboard/receber`, `/pagar`, `/resumo`, `/total-recebido`.

### Depois

- Fonte: **saldo** do pedido/conta (valor_pago, valor_em_aberto) e **pagamentos** com `pedido_id` (sem parcela).
- **Recomendação no front:** usar **GET** `/financeiro/dashboard` para um único resumo.
- Métricas:
  - **Total a receber:** soma de valor_em_aberto (contas a receber não quitadas).
  - **Vencidos:** data_vencimento < hoje e valor_em_aberto > 0.
  - **Recebido no mês:** soma de `pagamento.valor` onde `data_lancamento` está no mês (não estornados).

**O que implementar no front (dashboard):**

1. Chamar **GET** `/financeiro/dashboard`.
2. Exibir cards usando `contas_receber` (e `contas_pagar` se usar).
3. Não calcular totais no front; usar apenas os campos retornados.

---

## 5. Detalhes — Antes e depois

### Antes

- Detalhe por **conta** ou por **parcelas do pedido** (lista de parcelas, pagar parcela X).

### Depois

- Detalhe por **pedido**:
  1. **GET** `/pedidos/:id/financeiro` → cards: Valor total, Total pago, Em aberto, Status (e data_vencimento se quiser).
  2. **GET** `/pedidos/:id/pagamentos` → tabela: Data, Valor, Forma.

**O que implementar no front (detalhes):**

1. Rota de detalhe por **pedido** (ex.: `/financeiro/contas-receber/:pedidoId` ou `/pedidos/:id`).
2. No carregamento: GET `/pedidos/:id/financeiro` + GET `/pedidos/:id/pagamentos`.
3. Exibir cards com os 4 valores e status; tabela com histórico.
4. Botão “Registrar pagamento” que leva à tela de pagamento (POST `/pedidos/:id/pagamentos`).

---

## 6. Listagem — Antes e depois

### Antes

- Listagem podia ser por **conta** ou **parcela** (várias linhas por pedido).
- Sem campos valor_pago / valor_em_aberto / data_vencimento na lista.

### Depois

- **1 linha = 1 pedido.**
- Endpoints: **GET** `/financeiro/contas-receber` ou **GET** `/pedidos/contas-receber`.
- Cada item tem: pedido_id, numero_pedido, cliente_nome, valor_total, **valor_pago**, **valor_em_aberto**, forma_pagamento, status, data_pedido, **data_vencimento**.

**O que implementar no front (listagem):**

1. Chamar GET `/financeiro/contas-receber` (ou GET `/pedidos/contas-receber`).
2. Colunas: Cliente, Nº pedido, Valor total, Valor pago, Valor em aberto, Vencimento, Status.
3. Status visual: ABERTO (cinza), PARCIAL (amarelo), QUITADO (verde), VENCIDO (vermelho).
4. Clique na linha → tela de detalhes do **pedido** (usando pedido_id).

---

## 7. Passo a passo de implementação no frontend

### 7.1 Listagem — Contas a receber

1. **Rota:** ex.: `/financeiro/contas-receber` ou `/contas-receber`.
2. **Request:** GET `/api/v1/financeiro/contas-receber` (ou GET `/api/v1/pedidos/contas-receber`).
3. **Tabela:** Cliente (cliente_nome), Nº pedido (numero_pedido), Valor total, Valor pago, Valor em aberto, Vencimento (data_vencimento), Status.
4. **Status:** cor por status (ABERTO cinza, PARCIAL amarelo, QUITADO verde, VENCIDO vermelho).
5. **Ação:** clique na linha → navegar para detalhe do pedido (ex.: `/financeiro/contas-receber/:pedidoId`).

### 7.2 Tela de detalhes do pedido

1. **Rota:** ex.: `/financeiro/contas-receber/:pedidoId` (onde `:pedidoId` é o id do pedido).
2. **Requests:**
   - GET `/api/v1/pedidos/:pedidoId/financeiro` → resumo.
   - GET `/api/v1/pedidos/:pedidoId/pagamentos` → histórico.
3. **Layout:**
   - Topo: 4 cards (Valor total, Total pago, Em aberto, Status) + data_vencimento se quiser.
   - Tabela “Histórico de pagamentos”: colunas Data, Valor, Forma.
   - Botão “Registrar pagamento” → vai para tela de pagamento.

### 7.3 Tela de registrar pagamento

1. **Rota:** ex.: `/financeiro/contas-receber/:pedidoId/pagamentos` ou `/pedidos/:pedidoId/pagar`.
2. **Dados do resumo:** usar GET `/pedidos/:pedidoId/financeiro` para preencher valor_em_aberto e validar.
3. **Formulário:**
   - Valor (sugestão: default = valor_em_aberto).
   - Forma de pagamento (select).
   - Data (opcional; default hoje).
4. **Validação no front:** valor > 0 e valor ≤ valor_em_aberto.
5. **Submit:** POST `/api/v1/pedidos/:pedidoId/pagamentos` com body `{ valor, forma_pagamento, data_pagamento? }`.
6. **Após sucesso:** refetch GET financeiro + GET pagamentos + GET dashboard; redirecionar para a tela de detalhes do pedido.

### 7.4 Dashboard financeiro

1. **Request:** GET `/api/v1/financeiro/dashboard`.
2. **Cards:** usar `contas_receber` (e `contas_pagar` se existir na tela): total, pendentes, vencidas, valor_total_receber, valor_total_pendente, valor_pago_mes, receita_mes; e `saldo_atual`.
3. Não calcular nada no front; só exibir os campos retornados.

---

## 8. Tipagem e regras

### Tipagem (TypeScript)

```ts
type StatusFinanceiro =
  | "ABERTO"
  | "PARCIAL"
  | "QUITADO"
  | "VENCIDO"
  | "CANCELADO";

// Resumo do pedido (GET /pedidos/:id/financeiro)
interface ResumoFinanceiroPedido {
  valor_total: number;
  valor_pago: number;
  valor_em_aberto: number;
  status: StatusFinanceiro;
  data_vencimento: string | null; // YYYY-MM-DD
}

// Item do histórico (GET /pedidos/:id/pagamentos)
interface ItemHistoricoPagamento {
  id: number;
  valor: number;
  forma_pagamento: string;
  data_pagamento: string; // YYYY-MM-DD
}

// Body ao registrar pagamento (POST /pedidos/:id/pagamentos)
interface RegistrarPagamentoBody {
  valor: number;
  forma_pagamento: string;
  data_pagamento?: string; // YYYY-MM-DD
}

// Item da listagem (GET /financeiro/contas-receber)
interface ContaReceberItem {
  pedido_id: number;
  numero_pedido: string;
  cliente_nome?: string | null;
  valor_total: number;
  valor_pago: number;
  valor_em_aberto: number;
  status: string;
  data_vencimento: string | null;
  data_pedido: string;
  forma_pagamento: string;
  // ... cliente_id, fornecedor_id, fornecedor_nome se contas a pagar
}
```

Tipos completos no backend: `src/financeiro/contrato-frontend.ts`.

### Regras no front

- Não calcular saldo (valor_em_aberto) no front; usar sempre o retorno do backend.
- Não definir status no front; usar sempre o status retornado (ABERTO, PARCIAL, QUITADO, VENCIDO).
- Validar antes de enviar: valor ≤ valor_em_aberto e valor > 0; pedido não quitado (não mostrar formulário de pagamento se status === 'QUITADO').

### Checklist de integração

- [ ] Listagem: GET `/financeiro/contas-receber` (ou `/pedidos/contas-receber`), 1 linha por pedido, colunas valor_total, valor_pago, valor_em_aberto, data_vencimento, status.
- [ ] Detalhes: GET `/pedidos/:id/financeiro` + GET `/pedidos/:id/pagamentos`; cards + tabela de histórico.
- [ ] Registrar pagamento: POST `/pedidos/:id/pagamentos` com valor, forma_pagamento, data_pagamento opcional; validação valor ≤ valor_em_aberto; refetch e redirecionar após sucesso.
- [ ] Dashboard: GET `/financeiro/dashboard`; exibir cards sem recalcular no front.
- [ ] Remover qualquer uso de `parcela_id` / “pagar parcela X” no fluxo de contas a receber/pagar e usar apenas “pedido” e “registrar pagamento no pedido”.

---

*Documento: guia completo de implementação frontend — alterações nos módulos Pedido e Financeiro (dashboard, detalhes, endpoints).*  
*Última atualização: fevereiro 2026.*
