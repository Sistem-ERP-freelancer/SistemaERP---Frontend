# Documentação - Funcionalidades de Estoque

Este documento descreve todas as funcionalidades disponibilizadas pelo backend para a seção de estoque, incluindo endpoints, comportamentos esperados e formatos de dados.

---

## 📋 Índice

1. [Movimentar Estoque de um Produto](#1-movimentar-estoque-de-um-produto)
2. [Obter Histórico de Movimentações de um Produto](#2-obter-histórico-de-movimentações-de-um-produto)
3. [Obter Produtos com Estoque Baixo](#3-obter-produtos-com-estoque-baixo)
4. [Obter Produtos com Estoque Crítico](#4-obter-produtos-com-estoque-crítico)
5. [Buscar Produtos por Estoque](#5-buscar-produtos-por-estoque)

---

## 1. Movimentar Estoque de um Produto

### Endpoint
```
POST /estoque/produtos/:id/movimentar
```

### Autenticação
- **Requerida**: Sim (JWT Token)
- **Roles permitidas**: `ADMIN`, `GERENTE`, `VENDEDOR`

### Parâmetros da URL
- `id` (number, obrigatório): ID do produto a ser movimentado

### Corpo da Requisição (Body)
```json
{
  "tipo": "ENTRADA",
  "quantidade": 10,
  "observacao": "Entrada de mercadoria",
  "motivo": "Compra de fornecedor",
  "documento_referencia": "NF-12345"
}
```

#### Campos do Body

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `tipo` | enum | Sim | Tipo de movimentação (ver tipos abaixo) |
| `quantidade` | number (int) | Sim | Quantidade a ser movimentada (mínimo: 1) |
| `observacao` | string | Não | Observação adicional sobre a movimentação |
| `motivo` | string | Não | Motivo da movimentação |
| `documento_referencia` | string | Não | Número de documento de referência (NF, pedido, etc.) |

#### Tipos de Movimentação Disponíveis

| Tipo | Descrição | Comportamento |
|------|-----------|---------------|
| `ENTRADA` | Entrada de produtos | Adiciona quantidade ao estoque atual |
| `SAIDA` | Saída de produtos | Subtrai quantidade do estoque atual (valida se há estoque suficiente) |
| `AJUSTE` | Ajuste de estoque | Define o estoque atual para a quantidade informada |
| `DEVOLUCAO` | Devolução de produtos | Adiciona quantidade ao estoque atual |
| `PERDA` | Perda de produtos | Subtrai quantidade do estoque atual (valida se há estoque suficiente) |
| `TRANSFERENCIA` | Transferência de produtos | Subtrai quantidade do estoque atual (valida se há estoque suficiente) |

### Comportamento

1. **Validações**:
   - Verifica se o produto existe
   - Para tipos `SAIDA`, `PERDA` e `TRANSFERENCIA`: valida se há estoque suficiente
   - Valida se `schema_name` e `user_id` estão presentes no token JWT

2. **Processamento**:
   - Calcula o novo estoque baseado no tipo de movimentação
   - Atualiza o estoque do produto na tabela `tb_produto`
   - Cria um registro na tabela `tb_movimentacao_estoque` com:
     - Estoque anterior
     - Estoque atual após movimentação
     - Quantidade movimentada (positiva para entradas, negativa para saídas)
     - Dados do usuário que realizou a movimentação
     - Observações e motivo (se fornecidos)

3. **Notificações**:
   - Se após a movimentação o estoque ficar abaixo ou igual ao estoque mínimo do produto:
     - Cria notificações para todos os usuários com role `ADMIN` ou `GERENTE`
     - Tipo de notificação: `WARNING`
     - Mensagem informa o produto e os valores de estoque atual/mínimo

4. **Transação**:
   - Toda operação é executada em uma transação
   - Em caso de erro, todas as alterações são revertidas (rollback)

### Resposta de Sucesso (200)
```json
{
  "id": 1,
  "produto_id": 123,
  "tipo": "ENTRADA",
  "quantidade": 10,
  "estoque_anterior": 50,
  "estoque_atual": 60,
  "observacao": "Entrada de mercadoria",
  "motivo": "Compra de fornecedor",
  "usuario_id": "uuid-do-usuario",
  "documento_referencia": "NF-12345",
  "criado_em": "2024-01-15T10:30:00.000Z"
}
```

### Respostas de Erro

| Status | Descrição |
|--------|-----------|
| 400 | Dados inválidos, estoque insuficiente, ou schema/user_id ausente |
| 401 | Token JWT inválido ou ausente |
| 403 | Usuário sem permissão (role não permitida) |
| 404 | Produto não encontrado |

---

## 2. Obter Histórico de Movimentações de um Produto

### Endpoint
```
GET /estoque/produtos/:id/historico
```

### Autenticação
- **Requerida**: Sim (JWT Token)
- **Roles permitidas**: `ADMIN`, `GERENTE`, `VENDEDOR`

### Parâmetros da URL
- `id` (number, obrigatório): ID do produto

### Query Parameters
- `page` (number, opcional): Número da página (padrão: 1)
- `limit` (number, opcional): Itens por página (padrão: 20)

### Comportamento

1. **Validações**:
   - Valida se `schema_name` está presente no token JWT

2. **Processamento**:
   - Busca todas as movimentações do produto ordenadas por data (mais recentes primeiro)
   - Inclui informações do produto (nome, SKU) e do usuário (nome)
   - Retorna resultados paginados

### Resposta de Sucesso (200)
```json
{
  "movimentacoes": [
    {
      "id": 1,
      "produto_id": 123,
      "tipo": "ENTRADA",
      "quantidade": 10,
      "estoque_anterior": 50,
      "estoque_atual": 60,
      "observacao": "Entrada de mercadoria",
      "motivo": "Compra de fornecedor",
      "usuario_id": "uuid-do-usuario",
      "documento_referencia": "NF-12345",
      "criado_em": "2024-01-15T10:30:00.000Z",
      "produto_nome": "Produto Exemplo",
      "produto_sku": "SKU-123",
      "usuario_nome": "João Silva"
    }
  ],
  "total": 1
}
```

### Respostas de Erro

| Status | Descrição |
|--------|-----------|
| 400 | Schema name ausente |
| 401 | Token JWT inválido ou ausente |
| 403 | Usuário sem permissão |

---

## 3. Obter Produtos com Estoque Baixo

### Endpoint
```
GET /estoque/baixo
```

### Autenticação
- **Requerida**: Sim (JWT Token)
- **Roles permitidas**: `ADMIN`, `GERENTE`, `VENDEDOR`

### Query Parameters
- `page` (number, opcional): Número da página (padrão: 1)
- `limit` (number, opcional): Itens por página (padrão: 20)

### Comportamento

1. **Critério de Estoque Baixo**:
   - Produtos onde `estoque_atual <= estoque_minimo`
   - E `estoque_atual > 0` (não inclui produtos zerados)
   - E `statusProduto = 'ATIVO'`

2. **Ordenação**:
   - Ordena por razão `estoque_atual / estoque_minimo` (menor primeiro)
   - Produtos mais críticos aparecem primeiro

3. **Informações Retornadas**:
   - Dados completos do produto
   - Nome da categoria (se houver)
   - Nome do fornecedor (se houver)

### Resposta de Sucesso (200)
```json
{
  "produtos": [
    {
      "id": 123,
      "nome": "Produto Exemplo",
      "sku": "SKU-123",
      "estoque_atual": 5,
      "estoque_minimo": 10,
      "preco_venda": 29.90,
      "categoria_nome": "Categoria A",
      "fornecedor_nome": "Fornecedor XYZ",
      // ... outros campos do produto
    }
  ],
  "total": 1
}
```

### Respostas de Erro

| Status | Descrição |
|--------|-----------|
| 400 | Schema name ausente |
| 401 | Token JWT inválido ou ausente |
| 403 | Usuário sem permissão |

---

## 4. Obter Produtos com Estoque Crítico

### Endpoint
```
GET /estoque/critico
```

### Autenticação
- **Requerida**: Sim (JWT Token)
- **Roles permitidas**: `ADMIN`, `GERENTE`, `VENDEDOR`

### Query Parameters
- `page` (number, opcional): Número da página (padrão: 1)
- `limit` (number, opcional): Itens por página (padrão: 20)

### Comportamento

1. **Critério de Estoque Crítico**:
   - Produtos onde `estoque_atual = 0` OU `estoque_atual < (estoque_minimo * 0.5)`
   - E `statusProduto = 'ATIVO'`

2. **Ordenação**:
   - Primeiro: produtos com estoque zerado (estoque_atual = 0)
   - Depois: produtos ordenados por razão `estoque_atual / estoque_minimo` (menor primeiro)

3. **Informações Retornadas**:
   - Dados completos do produto
   - Nome da categoria (se houver)
   - Nome do fornecedor (se houver)

### Resposta de Sucesso (200)
```json
{
  "produtos": [
    {
      "id": 123,
      "nome": "Produto Exemplo",
      "sku": "SKU-123",
      "estoque_atual": 0,
      "estoque_minimo": 10,
      "preco_venda": 29.90,
      "categoria_nome": "Categoria A",
      "fornecedor_nome": "Fornecedor XYZ",
      // ... outros campos do produto
    }
  ],
  "total": 1
}
```

### Respostas de Erro

| Status | Descrição |
|--------|-----------|
| 400 | Schema name ausente |
| 401 | Token JWT inválido ou ausente |
| 403 | Usuário sem permissão |

---

## 5. Buscar Produtos por Estoque

### Endpoint
```
GET /produtos/estoque
```

### Autenticação
- **Requerida**: Sim (JWT Token)
- **Roles permitidas**: Todas (não há restrição específica de role neste endpoint)

### Query Parameters
- `min` (number, opcional): Estoque mínimo (filtra produtos com estoque >= min)
- `max` (number, opcional): Estoque máximo (filtra produtos com estoque <= max)
- `page` (number, opcional): Número da página (padrão: 1)
- `limit` (number, opcional): Itens por página (padrão: 15)

### Comportamento

1. **Filtros**:
   - Se `min` for fornecido: retorna apenas produtos com `estoque_atual >= min`
   - Se `max` for fornecido: retorna apenas produtos com `estoque_atual <= max`
   - Ambos podem ser usados simultaneamente para criar um intervalo

2. **Ordenação**:
   - Produtos ordenados por nome (ordem alfabética)

3. **Informações Retornadas**:
   - Retorna array de produtos completos com todas as relações carregadas

### Exemplos de Uso

**Buscar produtos com estoque entre 10 e 50:**
```
GET /produtos/estoque?min=10&max=50&page=1&limit=20
```

**Buscar produtos com estoque mínimo de 100:**
```
GET /produtos/estoque?min=100
```

**Buscar produtos com estoque máximo de 5:**
```
GET /produtos/estoque?max=5
```

### Resposta de Sucesso (200)
```json
[
  {
    "id": 123,
    "nome": "Produto Exemplo",
    "sku": "SKU-123",
    "estoque_atual": 25,
    "estoque_minimo": 10,
    "preco_venda": 29.90,
    // ... outros campos do produto com relações
  }
]
```

### Respostas de Erro

| Status | Descrição |
|--------|-----------|
| 400 | Schema name ausente |
| 401 | Token JWT inválido ou ausente |

---

## 🔐 Autenticação e Autorização

Todos os endpoints de estoque requerem:

1. **Token JWT** no header da requisição:
   ```
   Authorization: Bearer <token>
   ```

2. **Schema Name**: O token JWT deve conter o campo `schema_name` que identifica o tenant/schema do banco de dados.

3. **User ID**: Para movimentações, o token deve conter o campo `id` do usuário.

---

## 📝 Observações Importantes

1. **Multi-tenancy**: Todos os endpoints utilizam o sistema de multi-tenancy baseado em schemas do PostgreSQL. O schema é identificado automaticamente através do token JWT.

2. **Transações**: A movimentação de estoque é executada em transação, garantindo consistência dos dados.

3. **Validações de Estoque**: Para saídas, perdas e transferências, o sistema valida se há estoque suficiente antes de processar.

4. **Notificações**: O sistema cria notificações automáticas quando o estoque fica abaixo do mínimo após uma movimentação.

5. **Histórico**: Todas as movimentações são registradas permanentemente, permitindo auditoria completa.

6. **Paginação**: Endpoints de listagem suportam paginação através dos parâmetros `page` e `limit`.

---

## 🔄 Fluxo de Movimentação de Estoque

```
1. Cliente envia requisição POST /estoque/produtos/:id/movimentar
2. Backend valida token JWT e permissões
3. Backend busca produto no banco de dados
4. Backend valida estoque (se necessário para saídas)
5. Backend calcula novo estoque
6. Backend inicia transação
7. Backend atualiza estoque do produto
8. Backend cria registro de movimentação
9. Backend confirma transação (commit)
10. Backend verifica se estoque está baixo e cria notificações
11. Backend retorna movimentação criada
```

---

## 📊 Estrutura de Dados

### MovimentacaoEstoque Entity
```typescript
{
  id: number;
  produto_id: number;
  tipo: TipoMovimentacaoEstoque;
  quantidade: number; // Positivo para entradas, negativo para saídas
  estoque_anterior: number;
  estoque_atual: number;
  observacao?: string;
  motivo?: string;
  usuario_id: string;
  documento_referencia?: string;
  criado_em: Date;
}
```

### TipoMovimentacaoEstoque Enum
```typescript
enum TipoMovimentacaoEstoque {
  ENTRADA = 'ENTRADA',
  SAIDA = 'SAIDA',
  AJUSTE = 'AJUSTE',
  DEVOLUCAO = 'DEVOLUCAO',
  PERDA = 'PERDA',
  TRANSFERENCIA = 'TRANSFERENCIA'
}
```

---

## 🚀 Exemplos de Requisições

### Exemplo 1: Entrada de Estoque
```bash
curl -X POST http://localhost:3000/estoque/produtos/123/movimentar \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "ENTRADA",
    "quantidade": 50,
    "observacao": "Recebimento de pedido",
    "motivo": "Compra de fornecedor",
    "documento_referencia": "NF-2024-001"
  }'
```

### Exemplo 2: Saída de Estoque
```bash
curl -X POST http://localhost:3000/estoque/produtos/123/movimentar \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "SAIDA",
    "quantidade": 10,
    "observacao": "Venda realizada",
    "motivo": "Venda para cliente",
    "documento_referencia": "VENDA-2024-001"
  }'
```

### Exemplo 3: Ajuste de Estoque
```bash
curl -X POST http://localhost:3000/estoque/produtos/123/movimentar \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "AJUSTE",
    "quantidade": 100,
    "observacao": "Ajuste após inventário físico",
    "motivo": "Inventário físico"
  }'
```

### Exemplo 4: Buscar Histórico
```bash
curl -X GET "http://localhost:3000/estoque/produtos/123/historico?page=1&limit=20" \
  -H "Authorization: Bearer <token>"
```

### Exemplo 5: Produtos com Estoque Baixo
```bash
curl -X GET "http://localhost:3000/estoque/baixo?page=1&limit=20" \
  -H "Authorization: Bearer <token>"
```

### Exemplo 6: Produtos com Estoque Crítico
```bash
curl -X GET "http://localhost:3000/estoque/critico?page=1&limit=20" \
  -H "Authorization: Bearer <token>"
```

### Exemplo 7: Buscar Produtos por Estoque
```bash
curl -X GET "http://localhost:3000/produtos/estoque?min=10&max=50&page=1&limit=15" \
  -H "Authorization: Bearer <token>"
```

---

**Última atualização**: Janeiro 2024

