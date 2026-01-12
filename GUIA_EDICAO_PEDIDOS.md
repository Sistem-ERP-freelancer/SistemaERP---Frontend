# Guia de Edição de Pedidos

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Endpoints](#endpoints)
3. [Formato de Dados](#formato-de-dados)
4. [Exemplos de Requisições](#exemplos-de-requisições)
5. [Validações e Regras](#validações-e-regras)
6. [Problemas Corrigidos](#problemas-corrigidos)

---

## Visão Geral

Este guia descreve como editar pedidos no sistema ERP. O backend utiliza o método PATCH para atualizações parciais, permitindo que apenas os campos desejados sejam enviados.

### ⚠️ Importante

- O tipo de pedido (`tipo`) **NÃO pode ser alterado** após a criação
- Todos os campos são opcionais, exceto quando especificado
- O `usuario_atualizacao_id` é preenchido automaticamente pelo backend a partir do token JWT
- Ao atualizar itens, todos os itens antigos são removidos e os novos são criados

---

## Endpoints

### 1. Listar Pedidos

**GET** `/pedidos`

Lista pedidos com filtros opcionais e paginação.

**Query Parameters:**

- `id` (opcional): Se fornecido, retorna apenas o pedido com esse ID (equivalente a GET `/pedidos/{id}`)
- `tipo` (opcional): Filtrar por tipo (VENDA ou COMPRA)
- `status` (opcional): Filtrar por status
- `cliente_id` (opcional): Filtrar por ID do cliente
- `cliente_nome` (opcional): Filtrar por nome do cliente (busca parcial)
- `fornecedor_id` (opcional): Filtrar por ID do fornecedor
- `fornecedor_nome` (opcional): Filtrar por nome do fornecedor (busca parcial)
- `data_inicial` (opcional): Data inicial no formato YYYY-MM-DD
- `data_final` (opcional): Data final no formato YYYY-MM-DD
- `page` (opcional): Número da página (padrão: 1)
- `limit` (opcional): Itens por página (padrão: 15)

**Headers:**

```
Authorization: Bearer {token}
```

**Resposta de Sucesso (200) - Listagem:**

```json
{
  "pedidos": [
    {
      "id": 1,
      "numero_pedido": "VENDA-0001",
      "tipo": "VENDA",
      "status": "PENDENTE",
      "valor_total": 1550.00,
      "subtotal": 1500.00,
      "itens": [...]
    }
  ],
  "total": 1
}
```

**Resposta de Sucesso (200) - Busca por ID (query param):**
Mesma estrutura do endpoint GET `/pedidos/{id}` abaixo.

---

### 2. Buscar Pedido por ID

**GET** `/pedidos/{id}`

Retorna os dados completos do pedido, incluindo itens, cliente, fornecedor, etc.

**Headers:**

```
Authorization: Bearer {token}
```

**Resposta de Sucesso (200):**

```json
{
  "id": 1,
  "numero_pedido": "VENDA-0001",
  "tipo": "VENDA",
  "status": "PENDENTE",
  "cliente_id": 1,
  "cliente": {
    "id": 1,
    "nome": "Cliente Exemplo",
    "tipoPessoa": "FISICA",
    "cpf_cnpj": "123.456.789-00"
  },
  "data_pedido": "2025-01-15T00:00:00.000Z",
  "data_entrega_prevista": "2025-01-20",
  "data_entrega_realizada": null,
  "data_vencimento_base": "2025-01-15",
  "condicao_pagamento": "30 dias",
  "forma_pagamento": "PIX",
  "prazo_entrega_dias": 5,
  "subtotal": 1500.0,
  "desconto_valor": 0.0,
  "desconto_percentual": 0.0,
  "frete": 50.0,
  "outras_taxas": 0.0,
  "valor_total": 1550.0,
  "observacoes_internas": "Cliente preferencial",
  "observacoes_cliente": "Entrega pela manhã",
  "itens": [
    {
      "id": 1,
      "produto_id": 10,
      "quantidade": 5,
      "preco_unitario": 100.0,
      "desconto": 0.0,
      "subtotal": 500.0,
      "produto": {
        "id": 10,
        "nome": "Produto A",
        "sku": "PROD-A-001",
        "preco_venda": 100.0,
        "preco_custo": 60.0,
        "estoque_atual": 50,
        "statusProduto": "ATIVO"
      }
    }
  ],
  "usuario_criacao": {
    "id": "uuid-do-usuario",
    "nome": "João Silva",
    "email": "joao@example.com"
  },
  "created_at": "2025-01-15T10:30:00.000Z",
  "updated_at": "2025-01-15T10:30:00.000Z"
}
```

---

### 3. Atualizar Pedido

**PATCH** `/pedidos/{id}`

Atualiza parcialmente um pedido. Todos os campos são opcionais.

**Headers:**

```
Authorization: Bearer {token}
Content-Type: application/json
```

**Permissões Necessárias:**

- ADMIN
- GERENTE
- VENDEDOR

---

## Formato de Dados

### UpdatePedidoDto

O DTO de atualização aceita os seguintes campos (todos opcionais):

```typescript
{
  // Campos básicos
  status?: StatusPedido;                    // Enum: PENDENTE, APROVADO, EM_PROCESSAMENTO, CONCLUIDO, CANCELADO
  cliente_id?: number;                       // Obrigatório apenas para pedidos de VENDA
  fornecedor_id?: number;                    // Obrigatório apenas para pedidos de COMPRA
  transportadora_id?: number;                // Opcional

  // Datas
  data_pedido?: string;                      // Formato ISO: YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ssZ
  data_entrega_prevista?: string;            // Formato ISO: YYYY-MM-DD
  data_entrega_realizada?: string;            // Formato ISO: YYYY-MM-DD
  data_vencimento_base?: string;             // Formato ISO: YYYY-MM-DD

  // Financeiro
  condicao_pagamento?: string;              // Ex: "30 dias", "3x", "À vista"
  forma_pagamento?: FormaPagamento;          // Enum: DINHEIRO, PIX, CARTAO_CREDITO, CARTAO_DEBITO, BOLETO, TRANSFERENCIA
  prazo_entrega_dias?: number;               // Número inteiro

  // Valores (se não informados, serão calculados automaticamente a partir dos itens)
  subtotal?: number;                         // Calculado automaticamente se itens forem atualizados
  desconto_valor?: number;                    // Calculado automaticamente se desconto_percentual for informado
  desconto_percentual?: number;              // Percentual de desconto (0-100)
  frete?: number;                            // Valor do frete
  outras_taxas?: number;                     // Outras taxas adicionais

  // Observações
  observacoes_internas?: string;            // Texto livre
  observacoes_cliente?: string;              // Texto livre

  // Itens do pedido
  itens?: CreatePedidoItemDto[];            // Array de itens (se fornecido, substitui todos os itens existentes)
}
```

### CreatePedidoItemDto

Cada item do pedido deve seguir este formato:

```typescript
{
  produto_id: number;                        // ID do produto (obrigatório)
  quantidade: number;                        // Quantidade (obrigatório, mínimo 0.001)
  preco_unitario: number;                    // Preço unitário (obrigatório, mínimo 0)
  desconto?: number;                         // Desconto no item (opcional, mínimo 0)
}
```

---

## Exemplos de Requisições

### Exemplo 1: Atualizar apenas o status

```http
PATCH /pedidos/1
Content-Type: application/json
Authorization: Bearer {token}

{
  "status": "APROVADO"
}
```

### Exemplo 2: Atualizar dados financeiros

```http
PATCH /pedidos/1
Content-Type: application/json
Authorization: Bearer {token}

{
  "desconto_percentual": 10.0,
  "frete": 75.00,
  "outras_taxas": 5.00
}
```

**Nota:** O `valor_total` será recalculado automaticamente pelo backend.

### Exemplo 3: Atualizar datas

```http
PATCH /pedidos/1
Content-Type: application/json
Authorization: Bearer {token}

{
  "data_entrega_prevista": "2025-01-25",
  "data_vencimento_base": "2025-01-20"
}
```

**Nota:** Se `data_vencimento_base` ou `condicao_pagamento` forem atualizados, as parcelas pendentes serão recalculadas automaticamente.

### Exemplo 4: Atualizar itens do pedido

```http
PATCH /pedidos/1
Content-Type: application/json
Authorization: Bearer {token}

{
  "itens": [
    {
      "produto_id": 10,
      "quantidade": 3,
      "preco_unitario": 100.00,
      "desconto": 0.00
    },
    {
      "produto_id": 15,
      "quantidade": 2,
      "preco_unitario": 250.00,
      "desconto": 10.00
    }
  ],
  "desconto_percentual": 5.0,
  "frete": 50.00
}
```

**Importante:**

- Ao enviar `itens`, **todos os itens antigos são removidos** e os novos são criados
- O `subtotal` e `valor_total` são **recalculados automaticamente** a partir dos novos itens
- O `desconto_valor` é calculado automaticamente se `desconto_percentual` for informado

### Exemplo 5: Atualização completa

```http
PATCH /pedidos/1
Content-Type: application/json
Authorization: Bearer {token}

{
  "status": "EM_PROCESSAMENTO",
  "data_entrega_prevista": "2025-01-25",
  "condicao_pagamento": "2x",
  "forma_pagamento": "PIX",
  "itens": [
    {
      "produto_id": 10,
      "quantidade": 5,
      "preco_unitario": 100.00,
      "desconto": 0.00
    }
  ],
  "desconto_percentual": 10.0,
  "frete": 50.00,
  "observacoes_internas": "Pedido urgente",
  "observacoes_cliente": "Entregar na recepção"
}
```

---

## Validações e Regras

### Validações Gerais

1. **Tipo de Pedido:**
   - ❌ **NÃO pode ser alterado** após a criação
   - Se tentar alterar, retorna erro 400: "Não é possível alterar o tipo do pedido"

2. **Cliente/Fornecedor:**
   - Para pedidos de **VENDA**: `cliente_id` é obrigatório
   - Para pedidos de **COMPRA**: `fornecedor_id` é obrigatório
   - Os IDs devem existir no banco de dados

3. **Produtos:**
   - Todos os `produto_id` nos itens devem existir no banco de dados
   - Retorna erro 404 se algum produto não for encontrado

4. **Estoque (apenas para pedidos de VENDA):**
   - A quantidade solicitada não pode ser maior que o estoque disponível
   - Produtos com estoque zerado não podem ser adicionados
   - Retorna erro 400 com lista de problemas de estoque

5. **Limite de Crédito (apenas para pedidos de VENDA):**
   - O `valor_total` do pedido não pode exceder o limite de crédito do cliente
   - Retorna erro 400 se o limite for excedido

### Cálculos Automáticos

1. **Subtotal:**
   - Calculado automaticamente como: `Σ(quantidade × preco_unitario - desconto)` para cada item
   - Se `itens` forem atualizados, o subtotal é recalculado automaticamente

2. **Desconto em Valor:**
   - Calculado automaticamente como: `subtotal × (desconto_percentual / 100)`
   - Se `desconto_percentual` for atualizado, o `desconto_valor` é recalculado

3. **Valor Total:**
   - Calculado automaticamente como: `subtotal - desconto_valor - (subtotal × desconto_percentual / 100) + frete + outras_taxas`
   - Sempre recalculado quando:
     - Itens são atualizados
     - `subtotal`, `desconto_valor`, `desconto_percentual`, `frete` ou `outras_taxas` são atualizados

### Atualizações Automáticas

1. **Parcelas:**
   - Se `data_vencimento_base` ou `condicao_pagamento` forem atualizados, as parcelas pendentes são recalculadas
   - Parcelas já pagas não são alteradas

2. **Contas Financeiras:**
   - Sempre sincronizadas automaticamente após qualquer atualização do pedido
   - Criadas/atualizadas conforme o status e valores do pedido

3. **Estoque:**
   - **NÃO é atualizado** quando o pedido é editado
   - O estoque só é alterado na criação do pedido

---

## Problemas Corrigidos

### ✅ Problema 1: Itens não eram atualizados

**Descrição:** Quando o frontend enviava `itens` no `UpdatePedidoDto`, os itens não eram atualizados no banco de dados.

**Solução:** Adicionado tratamento completo de atualização de itens no método `atualizar`:

- Validação de produtos
- Validação de estoque (para pedidos de VENDA)
- Remoção de itens antigos
- Criação de novos itens
- Recalculação automática de `subtotal`, `desconto_valor` e `valor_total`

### ✅ Problema 2: Cálculo duplicado de valor_total

**Descrição:** Quando itens eram atualizados junto com campos financeiros, o `valor_total` era calculado duas vezes, causando valores incorretos.

**Solução:** Adicionada flag `itensForamAtualizados` para evitar recálculo duplicado do `valor_total`.

### ✅ Problema 3: Valores incorretos exibidos no frontend

**Descrição:** O frontend exibia valores diferentes dos que estavam no banco de dados ao clicar em editar. A tabela mostrava valores corretos, mas ao abrir o formulário de edição, os valores eram diferentes.

**Causa Raiz:**

- O método `listar` não estava normalizando corretamente os valores monetários dos itens do pedido
- Os valores DECIMAL do PostgreSQL eram retornados como strings, mas não eram convertidos para números no método `listar`
- O método `buscarPorId` já normalizava corretamente usando `mapRawItemToPedidoItem`, mas o `listar` não
- Isso causava inconsistência: a tabela mostrava valores como string, mas ao buscar por ID para editar, os valores eram normalizados como números

**Solução:**

- Corrigido o método `listar` para usar o mesmo helper `mapRawItemToPedidoItem` usado em `buscarPorId`
- Agora todos os valores monetários são normalizados consistentemente (convertidos de string para number)
- Os valores exibidos na tabela e no formulário de edição são idênticos

---

## Respostas de Erro

### 400 Bad Request

```json
{
  "statusCode": 400,
  "message": "Não é possível alterar o tipo do pedido"
}
```

```json
{
  "statusCode": 400,
  "message": "Problemas de estoque:\nProduto \"Produto A\" (SKU: PROD-A-001): quantidade solicitada (10) é maior que estoque disponível (5)"
}
```

### 401 Unauthorized

```json
{
  "statusCode": 401,
  "message": "Usuário não identificado no token. Faça login novamente."
}
```

### 404 Not Found

```json
{
  "statusCode": 404,
  "message": "Pedido não encontrado"
}
```

```json
{
  "statusCode": 404,
  "message": "Produto(s) com ID(s) 999 não encontrado(s) no tenant."
}
```

---

## Formato de Datas

### Datas Aceitas

- **Formato ISO Date:** `YYYY-MM-DD` (ex: `2025-01-15`)
- **Formato ISO DateTime:** `YYYY-MM-DDTHH:mm:ssZ` (ex: `2025-01-15T10:30:00Z`)
- **Formato ISO DateTime com timezone:** `YYYY-MM-DDTHH:mm:ss+HH:mm` (ex: `2025-01-15T10:30:00-03:00`)

### Campos de Data

| Campo                    | Tipo     | Formato Recomendado    |
| ------------------------ | -------- | ---------------------- |
| `data_pedido`            | DateTime | `YYYY-MM-DDTHH:mm:ssZ` |
| `data_entrega_prevista`  | Date     | `YYYY-MM-DD`           |
| `data_entrega_realizada` | Date     | `YYYY-MM-DD`           |
| `data_vencimento_base`   | Date     | `YYYY-MM-DD`           |

---

## Enums

### StatusPedido

```typescript
enum StatusPedido {
  PENDENTE = 'PENDENTE',
  APROVADO = 'APROVADO',
  EM_PROCESSAMENTO = 'EM_PROCESSAMENTO',
  CONCLUIDO = 'CONCLUIDO',
  CANCELADO = 'CANCELADO',
}
```

### TipoPedido

```typescript
enum TipoPedido {
  VENDA = 'VENDA',
  COMPRA = 'COMPRA',
}
```

### FormaPagamento

```typescript
enum FormaPagamento {
  DINHEIRO = 'DINHEIRO',
  PIX = 'PIX',
  CARTAO_CREDITO = 'CARTAO_CREDITO',
  CARTAO_DEBITO = 'CARTAO_DEBITO',
  BOLETO = 'BOLETO',
  TRANSFERENCIA = 'TRANSFERENCIA',
}
```

---

## Fluxo Recomendado no Frontend

1. **Ao clicar em "Editar":**
   - Fazer GET `/pedidos/{id}` para obter os dados atuais do pedido
   - Preencher o formulário com os dados retornados
   - **IMPORTANTE:** Sempre usar os valores retornados pelo GET `/pedidos/{id}`, não os valores da tabela
   - Todos os valores monetários já vêm normalizados como números (não strings)

2. **Ao salvar:**
   - Enviar apenas os campos que foram alterados (PATCH)
   - Se itens foram alterados, enviar o array completo de `itens`
   - Aguardar resposta do backend

3. **Após salvar:**
   - Fazer GET `/pedidos/{id}` novamente para obter os dados atualizados
   - Atualizar a tabela com os novos dados retornados

### ⚠️ Observação sobre Normalização de Valores

O backend normaliza automaticamente todos os valores monetários (DECIMAL do PostgreSQL) de string para number. Isso garante consistência entre:

- Valores retornados na listagem (`GET /pedidos`)
- Valores retornados ao buscar por ID (`GET /pedidos/{id}`)
- Valores salvos no banco de dados

Todos os campos monetários (`subtotal`, `desconto_valor`, `desconto_percentual`, `frete`, `outras_taxas`, `valor_total`, `preco_unitario`, `desconto`, `subtotal` dos itens) são sempre retornados como números, não strings.

---

## Notas Importantes

1. **Não envie `usuario_atualizacao_id`:** Este campo é preenchido automaticamente pelo backend a partir do token JWT.

2. **Não envie `tipo`:** O tipo não pode ser alterado após a criação.

3. **Ao atualizar itens:** Sempre envie o array completo de itens. Os itens antigos serão removidos.

4. **Valores calculados:** Não é necessário enviar `subtotal`, `desconto_valor` ou `valor_total` se estiver atualizando itens ou campos financeiros. Eles serão calculados automaticamente.

5. **Parcelas:** Ao atualizar `data_vencimento_base` ou `condicao_pagamento`, as parcelas pendentes são recalculadas automaticamente.

6. **Normalização de valores:** Todos os valores monetários são retornados como números (não strings), garantindo consistência entre listagem e busca por ID.

7. **Consistência de dados:** Após a correção do problema de normalização, os valores exibidos na tabela são idênticos aos valores retornados ao buscar por ID para edição.

---

## Suporte

Para dúvidas ou problemas, consulte a documentação do Swagger em `/api-docs` ou entre em contato com a equipe de desenvolvimento.
