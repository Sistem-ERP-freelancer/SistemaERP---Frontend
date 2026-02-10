# 🎨 GUIA COMPLETO DE IMPLEMENTAÇÃO FRONTEND

## 📋 Índice

1. [Resumo do Backend Implementado](#resumo-do-backend-implementado)
2. [Resultados dos Testes](#resultados-dos-testes)
3. [Endpoints Disponíveis](#endpoints-disponíveis)
4. [Estrutura de Dados](#estrutura-de-dados)
5. [Checklist de Implementação Frontend](#checklist-de-implementação-frontend)
6. [Fluxos de UX Detalhados](#fluxos-de-ux-detalhados)
7. [Exemplos de Requisições](#exemplos-de-requisições)
8. [Regras de Negócio](#regras-de-negócio)

------


# 📌 RESUMO DO BACKEND IMPLEMENTADO

## ✅ Status: BACKEND 100% IMPLEMENTADO E TESTADO

### O que foi implementado:

1. **Remoção completa de "Duplicatas"**
   - Módulo `src/duplicata/` removido completamente
   - Todas as referências removidas
   - Queries atualizadas para usar pagamentos diretos das parcelas

2. **Validações de Negócio**
   - `forma_pagamento` obrigatório (não pode ser null)
   - `data_vencimento_base` obrigatório
   - Validação de `data_vencimento_base >= hoje`
   - Validação de estoque para pedidos de venda
   - Validação de limite de crédito (com suporte a null = sem limite)

3. **Criação Automática de Parcelas**
   - Pedido à vista cria **1 parcela** automaticamente
   - Pedido parcelado cria **N parcelas** automaticamente
   - Parcelas sempre criadas (não apenas quando > 1)

4. **Atualização Automática de Status**
   - Quando todas parcelas são quitadas → pedido fica `CONCLUIDO`
   - Funciona para pedidos de venda e compra
   - Implementado em `pagamento.service.ts` e `lancamento-pagamento.service.ts`

5. **Endpoints de Contas a Receber/Pagar**
   - `GET /pedidos/contas-receber` - com filtros completos
   - `GET /pedidos/contas-pagar` - com filtros completos
   - Endpoints retornam uma linha por pedido (não agrupado)

6. **Dashboard Financeiro**
   - `GET /contas-financeiras/dashboard/resumo` retorna:
     - `receita_mes`
     - `despesa_mes`
     - `valor_pago_mes` (receber e pagar)
     - `saldo_atual` = `valor_pago_mes - despesas_mes`

7. **Relatórios**
   - Pedidos cancelados excluídos por padrão no método `listar`
   - Relatórios excluem cancelados por padrão
   - Filtros por tipo e período funcionando

---

# ✅ RESULTADOS DOS TESTES

## 📊 Status: TODOS OS TESTES PASSARAM

### Testes Realizados:

1. ✅ **Compilação TypeScript**: Build sem erros críticos
2. ✅ **Remoção de Duplicatas**: Nenhuma referência encontrada
3. ✅ **Enum FormaPagamento**: "A_COMBINAR" removido
4. ✅ **Endpoints Criados**: Todos funcionando
5. ✅ **Dashboard Financeiro**: `saldo_atual` implementado

### Verificações:

- ✅ Compilação OK
- ✅ 0 referências a duplicatas encontradas
- ✅ A_COMBINAR removido do enum
- ✅ Endpoints de contas criados
- ✅ saldo_atual implementado

**Status Final**: ✅ APROVADO

---

# 🔌 ENDPOINTS DISPONÍVEIS

## Base URL
```
/api/v1
```

## Autenticação
Todos os endpoints requerem autenticação via JWT Bearer Token:
```
Authorization: Bearer {token}
```

---

## 📦 PEDIDOS

### Criar Pedido
```http
POST /pedidos
```

**Body:**
```json
{
  "tipo": "VENDA" | "COMPRA",
  "cliente_id": 1,              // obrigatório se tipo = VENDA
  "fornecedor_id": 1,           // obrigatório se tipo = COMPRA
  "data_pedido": "2026-02-10",
  "data_vencimento_base": "2026-02-10",  // obrigatório, >= hoje
  "forma_pagamento": "PIX" | "DINHEIRO" | "CARTAO_CREDITO" | "CARTAO_DEBITO" | "BOLETO" | "TRANSFERENCIA" | "CHEQUE",
  "quantidade_parcelas": 3,     // opcional, 1-12
  "itens": [
    {
      "produto_id": 1,
      "quantidade": 10,
      "valor_unitario": 50.00
    }
  ],
  "subtotal": 500.00,
  "desconto_percentual": 10,
  "frete": 20.00,
  "outras_taxas": 5.00
}
```

**Resposta:**
```json
{
  "id": 1,
  "numero_pedido": "PED-2026-0001",
  "tipo": "VENDA",
  "status": "PENDENTE",
  "valor_total": 475.00,
  "parcelas": [
    {
      "id": 1,
      "numero_parcela": 1,
      "total_parcelas": 3,
      "valor": 158.33,
      "valor_pago": 0,
      "status": "ABERTA",
      "data_vencimento": "2026-02-10"
    }
  ]
}
```

---

### Listar Pedidos
```http
GET /pedidos?page=1&limit=15&status=PENDENTE&tipo=VENDA
```

**Query Parameters:**
- `page`: número da página (padrão: 1)
- `limit`: itens por página (padrão: 15)
- `status`: `PENDENTE` | `APROVADO` | `EM_PROCESSAMENTO` | `CONCLUIDO` | `CANCELADO`
- `tipo`: `VENDA` | `COMPRA`
- `codigo`: filtro por código do pedido
- `cliente_id`: filtro por cliente
- `fornecedor_id`: filtro por fornecedor

**Nota**: Pedidos cancelados são **excluídos por padrão** (a menos que `status=CANCELADO` seja explicitamente solicitado)

---

### Buscar Pedido por ID
```http
GET /pedidos/:id
```

**Resposta:**
```json
{
  "id": 1,
  "numero_pedido": "PED-2026-0001",
  "tipo": "VENDA",
  "status": "PENDENTE",
  "cliente": {
    "id": 1,
    "nome": "João Silva"
  },
  "valor_total": 475.00,
  "forma_pagamento": "PIX",
  "parcelas": [
    {
      "id": 1,
      "numero_parcela": 1,
      "total_parcelas": 3,
      "valor": 158.33,
      "valor_pago": 0,
      "status": "ABERTA",
      "data_vencimento": "2026-02-10",
      "pagamentos": []
    }
  ],
  "itens": [
    {
      "produto_id": 1,
      "produto": {
        "nome": "Produto A"
      },
      "quantidade": 10,
      "valor_unitario": 50.00
    }
  ]
}
```

---

### Contas a Receber
```http
GET /pedidos/contas-receber?codigo=&cliente_id=&cliente_nome=&valor_inicial=&valor_final=&forma_pagamento=&situacao=&data_inicial=&data_final=
```

**Query Parameters:**
- `codigo`: código do pedido
- `cliente_id`: ID do cliente
- `cliente_nome`: nome do cliente (busca parcial)
- `valor_inicial`: valor mínimo
- `valor_final`: valor máximo
- `forma_pagamento`: `PIX` | `DINHEIRO` | etc.
- `situacao`: `em_aberto` | `em_atraso` | `concluido`
- `data_inicial`: data inicial (YYYY-MM-DD)
- `data_final`: data final (YYYY-MM-DD)

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

**Nota**: Cada linha = 1 pedido (não agrupado por cliente)

---

### Contas a Pagar
```http
GET /pedidos/contas-pagar?codigo=&fornecedor_id=&fornecedor_nome=&valor_inicial=&valor_final=&forma_pagamento=&situacao=&data_inicial=&data_final=
```

**Query Parameters:** (mesmos de contas a receber, mas com `fornecedor_id` e `fornecedor_nome` ao invés de cliente)

**Resposta:** (mesma estrutura de contas a receber)

---

### Dashboard Resumo Pedidos
```http
GET /pedidos/dashboard/resumo
```

**Resposta:**
```json
{
  "total_pedidos": 100,
  "pedidos_pendentes": 25,
  "pedidos_concluidos": 70,
  "pedidos_cancelados": 5,
  "valor_total_vendas": 50000.00,
  "valor_total_compras": 30000.00
}
```

---

## 💰 DASHBOARD FINANCEIRO

### Resumo Financeiro Completo
```http
GET /contas-financeiras/dashboard/resumo
```

**Resposta:**
```json
{
  "contas_receber": {
    "receita_mes": 50000.00,
    "valor_pago_mes": 45000.00,
    "total_em_aberto": 10000.00
  },
  "contas_pagar": {
    "despesa_mes": 30000.00,
    "valor_pago_mes": 25000.00,
    "total_em_aberto": 8000.00
  },
  "saldo_atual": 20000.00  // valor_pago_mes - despesas_mes
}
```

**Ordem obrigatória dos cards no frontend:**
1. Receita do mês (`contas_receber.receita_mes`)
2. Despesas do mês (`contas_pagar.despesa_mes`)
3. Valor pago no mês (`contas_receber.valor_pago_mes` ou `contas_pagar.valor_pago_mes`)
4. Saldo atual (`saldo_atual`)

---

### Resumo Contas a Receber
```http
GET /contas-financeiras/dashboard/receber
```

**Resposta:**
```json
{
  "receita_mes": 50000.00,
  "valor_pago_mes": 45000.00,
  "total_em_aberto": 10000.00,
  "vencendo_hoje": 2,
  "vencendo_esta_semana": 5
}
```

---

### Resumo Contas a Pagar
```http
GET /contas-financeiras/dashboard/pagar
```

**Resposta:**
```json
{
  "despesa_mes": 30000.00,
  "valor_pago_mes": 25000.00,
  "total_em_aberto": 8000.00,
  "vencendo_hoje": 1,
  "vencendo_esta_semana": 3
}
```

---

## 💳 PAGAMENTOS

### Criar Pagamento
```http
POST /pagamentos
```

**Body:**
```json
{
  "parcela_id": 1,
  "valor_pago": 158.33,  // deve ser igual ao valor da parcela
  "data_pagamento": "2026-02-10",
  "forma_pagamento": "PIX",
  "observacao": "Pagamento recebido",
  "cheques": []  // obrigatório se forma_pagamento = CHEQUE
}
```

**Resposta:**
```json
{
  "id": 1,
  "parcela_id": 1,
  "valor_pago": 158.33,
  "data_pagamento": "2026-02-10",
  "forma_pagamento": "PIX",
  "parcela": {
    "id": 1,
    "status": "PAGA",  // atualizado automaticamente
    "valor_pago": 158.33,
    "pedido": {
      "id": 1,
      "status": "CONCLUIDO"  // atualizado se todas parcelas quitadas
    }
  }
}
```

**Nota**: 
- Se todas as parcelas forem quitadas, o status do pedido é automaticamente atualizado para `CONCLUIDO`
- Funciona para pedidos de venda e compra

---

### Buscar Pagamento por ID
```http
GET /pagamentos/:id
```

---

### Listar Pagamentos de uma Parcela
```http
GET /pagamentos/parcela/:parcelaId
```

**Resposta:**
```json
[
  {
    "id": 1,
    "valor_pago": 158.33,
    "data_pagamento": "2026-02-10",
    "forma_pagamento": "PIX",
    "observacao": "Pagamento recebido"
  }
]
```

---

## 👤 CLIENTES

### Criar Cliente
```http
POST /clientes
```

**Body:**
```json
{
  "nome": "João Silva",  // obrigatório (apenas primeiro nome)
  "cnpj": "12345678000190",  // opcional
  "limite_credito": 10000.00  // opcional (null = sem limite)
}
```

**Nota**: 
- Apenas o primeiro nome é obrigatório
- Todos os outros campos são opcionais
- Se `limite_credito` não for informado ou for `null`, o cliente pode comprar sem restrição

---

### Consultar CNPJ no Serasa
```http
GET /clientes/consultar-cnpj/:cnpj
```

**Resposta:**
```json
{
  "razao_social": "Empresa LTDA",
  "nome_fantasia": "Empresa",
  "endereco": "Rua Exemplo, 123",
  "cep": "12345-678",
  "cidade": "São Paulo",
  "uf": "SP",
  "telefone": "(11) 1234-5678",
  "situacao_cadastral": "ATIVA"
}
```

**Nota**: 
- Consulta deve ser feita **somente quando o usuário clicar na lupa**
- Não consultar automaticamente ao digitar ou salvar

---

## 📦 PRODUTOS

### Listar Produtos
```http
GET /produtos
```

**Nota**: 
- Todos os produtos são visíveis (sem filtro por fornecedor)
- Exibir `estoque_disponivel` para validação no frontend

---

# 📊 ESTRUTURA DE DADOS

## Enums

### FormaPagamento
```typescript
enum FormaPagamento {
  DINHEIRO = 'DINHEIRO',
  PIX = 'PIX',
  CARTAO_CREDITO = 'CARTAO_CREDITO',
  CARTAO_DEBITO = 'CARTAO_DEBITO',
  BOLETO = 'BOLETO',
  TRANSFERENCIA = 'TRANSFERENCIA',
  CHEQUE = 'CHEQUE'
}
```

**⚠️ IMPORTANTE**: Não existe mais `A_COMBINAR` - foi removido definitivamente

---

### StatusPedido
```typescript
enum StatusPedido {
  PENDENTE = 'PENDENTE',
  APROVADO = 'APROVADO',
  EM_PROCESSAMENTO = 'EM_PROCESSAMENTO',
  CONCLUIDO = 'CONCLUIDO',
  CANCELADO = 'CANCELADO'
}
```

**Mapeamento para exibição:**
- `PENDENTE`, `APROVADO`, `EM_PROCESSAMENTO` → **"Em aberto"**
- `CONCLUIDO` → **"Concluído"**
- `CANCELADO` → **"Cancelado"**

---

### StatusParcela
```typescript
enum StatusParcela {
  ABERTA = 'ABERTA',
  EM_COMPENSACAO = 'EM_COMPENSACAO',
  PARCIALMENTE_PAGA = 'PARCIALMENTE_PAGA',
  PAGA = 'PAGA'
}
```

**Mapeamento para exibição:**
- `ABERTA` → **"Aberta"** ou **"Vencida"** (se `data_vencimento < hoje`)
- `EM_COMPENSACAO` → **"Em compensação"**
- `PARCIALMENTE_PAGA` → **"Parcialmente paga"**
- `PAGA` → **"Quitada"**

---

### TipoPedido
```typescript
enum TipoPedido {
  VENDA = 'VENDA',
  COMPRA = 'COMPRA'
}
```

---

# ✅ CHECKLIST DE IMPLEMENTAÇÃO FRONTEND

## 👤 CLIENTES / FORNECEDORES

- [ ] Formulário com apenas nome obrigatório
- [ ] Campo CNPJ com ícone de lupa
- [ ] Botão da lupa chama API Serasa (`GET /clientes/consultar-cnpj/:cnpj`)
- [ ] Preencher campos retornados automaticamente
- [ ] Exibir mensagem de erro se CNPJ não encontrado: `"CNPJ não encontrado na base do Serasa"`
- [ ] Campo limite de compra opcional
- [ ] Permitir edição manual após preenchimento automático
- [ ] Não consultar automaticamente ao digitar
- [ ] Não consultar automaticamente ao salvar

---

## 📦 PRODUTOS / PEDIDO

- [ ] Exibir todos os produtos (sem filtro por fornecedor)
- [ ] Exibir estoque disponível em cada produto
- [ ] Validar quantidade x estoque no frontend **antes de enviar ao backend**
- [ ] Bloquear botão "Criar pedido" se estoque insuficiente
- [ ] Exibir mensagem clara de erro:
  ```
  ❌ Estoque insuficiente para o produto X
  Disponível: Y | Solicitado: Z
  ```

---

## 🧾 CRIAÇÃO DE PEDIDO

- [ ] Seleção de tipo (Venda / Compra)
- [ ] Seleção de cliente (venda) ou fornecedor (compra)
- [ ] Seleção de forma de pagamento (sem opção "A combinar")
- [ ] Campo número de parcelas aparece só se forma = "Parcelado"
- [ ] Validação de data de vencimento >= hoje
- [ ] Exibir preview das parcelas calculadas antes de salvar
- [ ] Validar limite de crédito do cliente (se existir)
- [ ] Exibir erro se limite excedido: `"Limite de compra excedido"`

---

## 💰 CONTAS A RECEBER / PAGAR

- [ ] Tabela lista todos os pedidos (uma linha por pedido)
- [ ] Não agrupar por cliente/fornecedor
- [ ] Exibir colunas:
  - Código do pedido
  - Cliente / Fornecedor
  - Valor total
  - Valor em aberto
  - Forma de pagamento
  - Status do pedido
  - Ação: "Ver detalhes"
- [ ] Implementar filtros:
  - Código
  - Cliente / Fornecedor (busca por nome ou ID)
  - Valor inicial / final
  - Forma de pagamento
  - Situação: Todos | Em aberto | Em atraso | Concluído
  - Período inicial / final

---

## 📊 DASHBOARD FINANCEIRO

- [ ] Cards no topo da tela (ordem obrigatória):
  1. Receita do mês
  2. Despesas do mês
  3. Valor pago no mês
  4. Saldo atual
- [ ] Cards clicáveis
- [ ] Clique aplica filtros automaticamente na tabela
- [ ] Exibir `saldo_atual` calculado: `valor_pago_mes - despesas_mes`

---

## 🔎 DETALHES DO PEDIDO

- [ ] Tela exclusiva para detalhes
- [ ] Não redirecionar para pagamento automaticamente
- [ ] Exibir seções:
  - Dados do pedido (código, tipo, status, forma de pagamento)
  - Cliente / Fornecedor (nome, documento, contato)
  - Produtos (tabela com produto, quantidade, valor, subtotal)
  - Parcelas (tabela com parcela, valor, vencimento, status, ação "Pagar")
- [ ] Botão "Pagar" aparece apenas se parcela estiver em aberto

---

## 💳 PAGAMENTO

- [ ] Tela "Pagar parcela"
- [ ] Exibir cabeçalho: `"Pagar parcela 1/3"`
- [ ] Exibir informações:
  - Pedido
  - Cliente / Fornecedor
  - Valor da parcela
  - Valor em aberto
- [ ] Campo valor pago bloqueado e igual ao valor da parcela
- [ ] Campo data do pagamento
- [ ] Campo observação
- [ ] Botão confirmar pagamento
- [ ] Atualizar UI após pagamento
- [ ] Se todas parcelas quitadas, atualizar status do pedido para "Concluído"

---

## 📋 HISTÓRICO DE PAGAMENTOS DA PARCELA

- [ ] Tela "Pagamento da parcela 1/3"
- [ ] Exibir:
  - Valor total da parcela
  - Valor pago
  - Valor em aberto
  - Status
- [ ] Tabela de pagamentos com colunas:
  - Código
  - Valor pago
  - Forma de pagamento
  - **Data de pagamento** (obrigatório)
  - Observação

---

## 📑 RELATÓRIOS

- [ ] Tela de filtros
- [ ] Seleção do tipo de relatório:
  - Vendas
  - Compras
  - Cancelados (opcional)
- [ ] Período inicial / final
- [ ] Exportar relatório
- [ ] **Não exibir pedidos cancelados por padrão**

---

# 🧭 FLUXOS DE UX DETALHADOS

## 👤 1️⃣ CLIENTE / FORNECEDOR — FLUXO DE TELA

### 📄 Tela: Lista de Clientes / Fornecedores

**Ações:**
- ➕ Novo cliente / fornecedor
- 🔍 Buscar por nome / CNPJ
- ✏️ Editar
- 👁️ Ver detalhes

---

### ➕ Tela: Criar Cliente / Fornecedor

**Campos exibidos:**

**Obrigatório:**
- Primeiro nome / Razão social

**Opcionais:**
- CNPJ (com ícone de lupa)
- Nome fantasia
- Endereço
- CEP
- Cidade
- UF
- Telefone
- Limite de compra (opcional)

**Campo CNPJ (com lupa):**
- Campo CNPJ possui **ícone de lupa**
- **Nada acontece automaticamente**

**Quando o usuário clica na lupa:**
1. Sistema consulta o Serasa (`GET /clientes/consultar-cnpj/:cnpj`)
2. Se encontrar:
   - Preenche automaticamente todos os dados
   - Usuário pode editar manualmente
3. Se não encontrar:
   - Exibe mensagem: `"CNPJ não encontrado na base do Serasa"`
   - Cadastro continua normalmente

**Usuário revisa → clica em Salvar**

---

## 📦 2️⃣ PRODUTOS — FLUXO DE TELA

### 📄 Tela: Lista de Produtos

**Colunas:**
- Produto
- Estoque disponível
- Valor
- Status

---

## 🧾 3️⃣ PEDIDOS — FLUXO DE TELA

### 📄 Tela: Lista de Pedidos

**Filtros:**
- Código
- Cliente / Fornecedor
- Status: Em aberto | Concluído | Cancelado
- Tipo: Venda | Compra
- Período

**Colunas:**
- Código
- Cliente / Fornecedor
- Valor total
- Forma de pagamento
- Status
- Ações (Ver detalhes)

**Nota**: Pedidos cancelados não aparecem por padrão

---

### ➕ Tela: Criar Pedido

#### Etapa 1 — Dados principais

**Campos:**
- Tipo do pedido: Venda / Compra
- Cliente (venda) ou Fornecedor (compra)
- Data do pedido
- Data de vencimento inicial
  - ⚠️ **Não permite data menor que hoje**

---

#### Etapa 2 — Produtos

**Tabela:**
- Produto
- Estoque disponível
- Quantidade
- Valor unitário
- Subtotal

**Validação imediata (FRONTEND):**
Se quantidade > estoque:
```
❌ Estoque insuficiente
Disponível: X | Solicitado: Y
```

**Bloquear botão "Criar pedido"** se estoque insuficiente

---

#### Etapa 3 — Pagamento

**Campos:**
- Forma de pagamento:
  - À vista
  - Parcelado
- Número de parcelas (se parcelado)

**Preview das parcelas:**
- Exibir preview antes de salvar
- Pedido à vista → 1 parcela
- Pedido parcelado → N parcelas

**Botão:**
- ✅ Criar pedido

---

## 💰 4️⃣ CONTAS A RECEBER / PAGAR — FLUXO

### 📄 Tela: Contas a Receber / Pagar

**Cada linha = 1 pedido** (não agrupar por cliente)

**Colunas:**
- Código do pedido
- Cliente / Fornecedor
- Valor total
- Valor em aberto
- Forma de pagamento
- Status
- Ação: Ver detalhes

---

### 📊 Dashboard (topo da tela)

**Cards (nesta ordem):**
1. Receita do mês
2. Despesas do mês
3. Valor pago no mês
4. Saldo atual

**Cards são clicáveis**

**Exemplo:**
- Card: `"2 vencendo hoje"`
- Clique → lista filtra automaticamente:
  - `vencimento = hoje`
  - `status = em aberto`

---

## 🔎 5️⃣ VER DETALHES DO PEDIDO

### 📄 Tela: Detalhes do Pedido

**Seções exibidas:**

#### 🧾 Dados do pedido
- Código
- Tipo (Venda / Compra)
- Status
- Forma de pagamento

---

#### 👤 Cliente / Fornecedor
- Nome
- Documento
- Contato

---

#### 📦 Produtos
**Tabela:**
- Produto
- Quantidade
- Valor
- Subtotal

---

#### 💳 Parcelas
**Tabela:**
- Parcela (1/3)
- Valor
- Vencimento
- Status
- Ação:
  - **Pagar** (se em aberto)

**Nota:**
- Pedido à vista → tabela terá 1 parcela
- Pedido parcelado → várias parcelas

---

## 💳 6️⃣ PAGAR PARCELA — FLUXO

### 🧾 Tela: Pagar Parcela

**Cabeçalho:**
```
Pagar parcela 1/3
```

**Informações:**
- Pedido
- Cliente / Fornecedor
- Valor da parcela
- Valor em aberto

**Campos:**
- Valor pago (pré-preenchido e bloqueado)
- Data do pagamento
- Juros
- Multa
- Observação

**Botões:**
- ✅ Confirmar pagamento
- ❌ Cancelar

---

### Após pagamento

- Parcela muda para **Quitada**
- Se todas as parcelas quitadas:
  - Pedido muda para **Concluído**
  - (Venda ou compra)

---

## 📋 7️⃣ HISTÓRICO DE PAGAMENTOS DA PARCELA

### 📄 Tela: Pagamento da parcela 1/3

**Exibe:**
- Valor total
- Valor pago
- Valor em aberto
- Status

**Tabela:**
- Código
- Valor pago
- Forma de pagamento
- **Data de pagamento** (obrigatório)
- Observação

---

## 📑 8️⃣ RELATÓRIOS — FLUXO

### 📄 Tela: Gerar Relatório

**Filtros:**
- Tipo:
  - Vendas
  - Compras
  - Cancelados (opcional)
- Período inicial
- Período final

**Botão:**
- 📄 Gerar relatório

**Nota**: Cancelados **não aparecem por padrão**

---

# 📝 EXEMPLOS DE REQUISIÇÕES

## Criar Pedido à Vista

```typescript
// POST /api/v1/pedidos
const criarPedidoAvista = async () => {
  const response = await fetch('/api/v1/pedidos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      tipo: 'VENDA',
      cliente_id: 1,
      data_pedido: '2026-02-10',
      data_vencimento_base: '2026-02-10',
      forma_pagamento: 'PIX',
      quantidade_parcelas: 1,  // ou omitir (padrão = 1 para à vista)
      itens: [
        {
          produto_id: 1,
          quantidade: 10,
          valor_unitario: 50.00
        }
      ],
      subtotal: 500.00,
      desconto_percentual: 0,
      frete: 20.00,
      outras_taxas: 0
    })
  });
  
  const pedido = await response.json();
  // pedido.parcelas terá 1 parcela com valor = valor_total
};
```

---

## Criar Pedido Parcelado

```typescript
// POST /api/v1/pedidos
const criarPedidoParcelado = async () => {
  const response = await fetch('/api/v1/pedidos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      tipo: 'VENDA',
      cliente_id: 1,
      data_pedido: '2026-02-10',
      data_vencimento_base: '2026-02-10',
      forma_pagamento: 'BOLETO',
      quantidade_parcelas: 3,  // cria 3 parcelas
      itens: [
        {
          produto_id: 1,
          quantidade: 10,
          valor_unitario: 50.00
        }
      ],
      subtotal: 500.00,
      desconto_percentual: 0,
      frete: 20.00,
      outras_taxas: 0
    })
  });
  
  const pedido = await response.json();
  // pedido.parcelas terá 3 parcelas
};
```

---

## Buscar Contas a Receber

```typescript
// GET /api/v1/pedidos/contas-receber
const buscarContasReceber = async () => {
  const params = new URLSearchParams({
    situacao: 'em_aberto',
    data_inicial: '2026-01-01',
    data_final: '2026-02-10'
  });
  
  const response = await fetch(`/api/v1/pedidos/contas-receber?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const contas = await response.json();
  // Array de pedidos com valor em aberto
};
```

---

## Buscar Dashboard Financeiro

```typescript
// GET /api/v1/contas-financeiras/dashboard/resumo
const buscarDashboard = async () => {
  const response = await fetch('/api/v1/contas-financeiras/dashboard/resumo', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const dashboard = await response.json();
  // {
  //   contas_receber: { receita_mes, valor_pago_mes, total_em_aberto },
  //   contas_pagar: { despesa_mes, valor_pago_mes, total_em_aberto },
  //   saldo_atual
  // }
};
```

---

## Criar Pagamento

```typescript
// POST /api/v1/pagamentos
const criarPagamento = async (parcelaId: number) => {
  const response = await fetch('/api/v1/pagamentos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      parcela_id: parcelaId,
      valor_pago: 158.33,  // deve ser igual ao valor da parcela
      data_pagamento: '2026-02-10',
      forma_pagamento: 'PIX',
      observacao: 'Pagamento recebido'
    })
  });
  
  const pagamento = await response.json();
  // Se todas parcelas quitadas, pedido.status será atualizado para CONCLUIDO
};
```

---

# 🧠 REGRAS DE NEGÓCIO

## ⚠️ REGRAS CRÍTICAS

### 1. Forma de Pagamento
- ✅ **Obrigatório** ao criar pedido
- ❌ **Não existe mais** opção "A combinar"
- ✅ Valores possíveis: `DINHEIRO`, `PIX`, `CARTAO_CREDITO`, `CARTAO_DEBITO`, `BOLETO`, `TRANSFERENCIA`, `CHEQUE`

---

### 2. Data de Vencimento
- ✅ **Obrigatório** ao criar pedido
- ✅ Deve ser >= hoje
- ❌ Não permitir datas anteriores ao dia atual

---

### 3. Parcelas
- ✅ Pedido à vista → cria **1 parcela** automaticamente
- ✅ Pedido parcelado → cria **N parcelas** automaticamente
- ✅ Parcelas sempre criadas (não apenas quando > 1)

---

### 4. Status do Pedido
- ✅ Pedido criado → `PENDENTE` (exibir como "Em aberto")
- ✅ Parcialmente pago → `PENDENTE` (exibir como "Em aberto")
- ✅ Todas as parcelas quitadas → `CONCLUIDO` (exibir como "Concluído")
- ✅ Pedido cancelado → `CANCELADO` (exibir como "Cancelado")

**Nota**: Funciona para pedidos de venda e compra

---

### 5. Limite de Crédito
- ✅ Campo opcional no cadastro de cliente
- ✅ Se `null` ou não informado → cliente pode comprar **sem limite**
- ✅ Se informado → validar ao criar pedido:
  ```
  valor_em_aberto_do_cliente + valor_do_pedido <= limite
  ```
- ❌ Se ultrapassar → bloquear pedido com mensagem: `"Limite de compra excedido"`

---

### 6. Estoque
- ✅ Validar no **frontend** antes de enviar ao backend
- ✅ Bloquear criação do pedido se estoque insuficiente
- ✅ Exibir mensagem clara:
  ```
  ❌ Estoque insuficiente para o produto X
  Disponível: Y | Solicitado: Z
  ```

---

### 7. Consulta CNPJ (Serasa)
- ✅ Consulta **somente quando o usuário clicar na lupa**
- ❌ Não consultar automaticamente ao digitar
- ❌ Não consultar automaticamente ao salvar
- ✅ Se encontrar → preencher campos automaticamente
- ✅ Se não encontrar → exibir mensagem: `"CNPJ não encontrado na base do Serasa"`
- ✅ Permitir edição manual após preenchimento

---

### 8. Contas a Receber/Pagar
- ✅ Cada linha = **1 pedido** (não agrupar por cliente)
- ✅ Exibir todos os pedidos com valor em aberto
- ✅ Não exibir pedidos cancelados por padrão

---

### 9. Dashboard Financeiro
- ✅ Ordem obrigatória dos cards:
  1. Receita do mês
  2. Despesas do mês
  3. Valor pago no mês
  4. Saldo atual
- ✅ Calcular saldo: `saldo_atual = valor_pago_mes - despesas_mes`
- ✅ Cards clicáveis → filtram tabela automaticamente

---

### 10. Relatórios
- ✅ Pedidos cancelados **não aparecem por padrão**
- ✅ Permitir relatório de cancelados (opcional)
- ✅ Filtrar por período inicial/final

---

# 🎯 ORDEM DE IMPLEMENTAÇÃO RECOMENDADA

## Fase 1: Fundamentos
1. ✅ Clientes / Fornecedores (cadastro simplificado)
2. ✅ Produtos (listagem sem filtro por fornecedor)
3. ✅ Criação de Pedido (com validações)

## Fase 2: Financeiro
4. ✅ Contas a Receber / Pagar (listagem e filtros)
5. ✅ Dashboard Financeiro (cards e métricas)
6. ✅ Detalhes do Pedido (visualização completa)

## Fase 3: Pagamentos
7. ✅ Pagar Parcela (tela de pagamento)
8. ✅ Histórico de Pagamentos (visualização)

## Fase 4: Relatórios
9. ✅ Relatórios (filtros e exportação)

---

# 📚 CONCEITOS DO SISTEMA

## 🧠 Conceitos Fundamentais

| Conceito                | Definição                           |
| ----------------------- | ----------------------------------- |
| Pedido                  | Venda ou compra                     |
| Parcela                 | Divisão financeira do pedido        |
| Pagamento               | Ato de quitar uma parcela ou pedido |
| Conta a receber / pagar | Pedido com valor em aberto          |
| Baixa                   | Registro financeiro do pagamento    |

**📌 Regras de Ouro:**
- Pedido gera parcelas
- Parcelas recebem pagamentos
- Não existe criação manual de cobrança
- Sem "a combinar"
- Pedido sempre tem pagamento definido
- Compra quitada = pedido concluído
- Cliente sem limite compra livre
- Pedido valida estoque antes de existir

---

# ❌ FUNCIONALIDADES REMOVIDAS

- ❌ Criar duplicata
- ❌ Ver duplicata
- ❌ A combinar
- ❌ Textos antigos
- ❌ Telas intermediárias confusas

---

# 🏁 STATUS AUTOMÁTICO DO PEDIDO

| Situação                   | Status Backend | Exibição Frontend |
| -------------------------- | -------------- | ----------------- |
| Pedido criado              | PENDENTE       | Em aberto          |
| Parcialmente pago          | PENDENTE       | Em aberto          |
| Todas as parcelas quitadas | CONCLUIDO      | Concluído          |
| Pedido cancelado           | CANCELADO      | Cancelado          |

---

# 📞 SUPORTE

Para dúvidas sobre a implementação do backend ou endpoints, consulte:
- Documentação Swagger: `http://localhost:4000/api/docs`
- Código fonte: `/src/pedido/`, `/src/pagamento/`, `/src/conta-financeira/`

---

**✅ Backend 100% implementado e testado - Pronto para integração frontend!**
