# 📚 Guia Completo de Endpoints de Busca e Filtro

Este guia documenta todos os endpoints de busca, filtro e listagem disponíveis no sistema ERP.

---

## 📋 Índice

1. [Fornecedores](#fornecedores)
2. [Clientes](#clientes)
3. [Produtos](#produtos)
4. [Pedidos](#pedidos)
5. [Categorias](#categorias)
6. [Transportadoras](#transportadoras)
7. [Convenções Gerais](#convenções-gerais)

---

## 🏢 Fornecedores

### Base URL
```
/fornecedor
```

### 1. Listar Fornecedores (com filtros básicos)

**GET** `/fornecedor`

**Permissões:** Autenticado

**Query Parameters:**

| Parâmetro | Tipo | Obrigatório | Padrão | Descrição |
|-----------|------|-------------|--------|-----------|
| `page` | number | Não | 1 | Número da página |
| `limit` | number | Não | 15 | Itens por página |
| `tipoFornecedor` | TipoFornecedor | Não | - | Filtro por tipo (PESSOA_FISICA, PESSOA_JURIDICA) |
| `statusFornecedor` | StatusFornecedor | Não | - | Filtro por status (ATIVO, INATIVO, BLOQUEADO) |

**Exemplo de Requisição:**
```bash
GET /fornecedor?page=1&limit=20&tipoFornecedor=PESSOA_JURIDICA&statusFornecedor=ATIVO
```

**Resposta (200):**
```json
[
  {
    "id": 1,
    "nome_fantasia": "Empresa ABC",
    "nome_razao": "ABC Ltda",
    "tipoFornecedor": "PESSOA_JURIDICA",
    "statusFornecedor": "ATIVO",
    "cpf_cnpj": "12345678000190",
    "enderecos": [...],
    "contato": [...]
  }
]
```

---

### 2. Buscar por Nome ou CNPJ (Busca Simples)

**GET** `/fornecedor/buscar`

**Permissões:** Autenticado

**Query Parameters:**

| Parâmetro | Tipo | Obrigatório | Padrão | Descrição |
|-----------|------|-------------|--------|-----------|
| `termo` | string | **Sim** | - | Termo de busca (nome fantasia, razão social ou CNPJ) |
| `page` | number | Não | 1 | Número da página |
| `limit` | number | Não | 15 | Itens por página |

**Exemplo de Requisição:**
```bash
GET /fornecedor/buscar?termo=ABC&page=1&limit=10
```

**Resposta (200):**
```json
{
  "fornecedores": [...],
  "total": 5
}
```

---

### 3. Busca Avançada

**GET** `/fornecedor/buscar-avancado`

**Permissões:** Autenticado

**Query Parameters:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `termo` | string | Não | Busca geral (nome, razão social, CNPJ) |
| `tipoFornecedor` | TipoFornecedor | Não | Filtro por tipo |
| `statusFornecedor` | StatusFornecedor | Não | Filtro por status |
| `cidade` | string | Não | Filtro por cidade do endereço |
| `estado` | string | Não | Filtro por estado (UF) do endereço |
| `telefone` | string | Não | Filtro por telefone do contato |
| `email` | string | Não | Filtro por email do contato |
| `nomeContato` | string | Não | Filtro por nome do contato |
| `page` | number | Não | Número da página (padrão: 1) |
| `limit` | number | Não | Itens por página (padrão: 15) |

**Exemplo de Requisição:**
```bash
GET /fornecedor/buscar-avancado?termo=ABC&cidade=São Paulo&estado=SP&statusFornecedor=ATIVO&page=1&limit=20
```

**Resposta (200):**
```json
{
  "fornecedor": [...],
  "total": 10
}
```

---

### 4. Buscar por Nome Fantasia

**GET** `/fornecedor/nome-fantasia`

**Permissões:** Autenticado

**Query Parameters:**

| Parâmetro | Tipo | Obrigatório | Padrão | Descrição |
|-----------|------|-------------|--------|-----------|
| `nome` | string | **Sim** | - | Nome fantasia para buscar |
| `page` | number | Não | 1 | Número da página |
| `limit` | number | Não | 10 | Itens por página |

**Exemplo de Requisição:**
```bash
GET /fornecedor/nome-fantasia?nome=Empresa ABC&page=1&limit=10
```

---

### 5. Buscar por Razão Social

**GET** `/fornecedor/razao-social`

**Permissões:** Autenticado

**Query Parameters:**

| Parâmetro | Tipo | Obrigatório | Padrão | Descrição |
|-----------|------|-------------|--------|-----------|
| `nome` | string | **Sim** | - | Razão social para buscar |
| `page` | number | Não | 1 | Número da página |
| `limit` | number | Não | 10 | Itens por página |

**Exemplo de Requisição:**
```bash
GET /fornecedor/razao-social?nome=ABC Ltda&page=1&limit=10
```

---

### 6. Buscar por Tipo

**GET** `/fornecedor/tipo/:tipoFornecedor`

**Permissões:** Autenticado

**Parâmetros de Rota:**

| Parâmetro | Tipo | Valores Aceitos |
|-----------|------|-----------------|
| `tipoFornecedor` | TipoFornecedor | `PESSOA_FISICA`, `PESSOA_JURIDICA` |

**Exemplo de Requisição:**
```bash
GET /fornecedor/tipo/PESSOA_JURIDICA
```

---

### 7. Buscar por Status

**GET** `/fornecedor/status/:statusFornecedor`

**Permissões:** Autenticado

**Parâmetros de Rota:**

| Parâmetro | Tipo | Valores Aceitos |
|-----------|------|-----------------|
| `statusFornecedor` | StatusFornecedor | `ATIVO`, `INATIVO`, `BLOQUEADO` |

**Exemplo de Requisição:**
```bash
GET /fornecedor/status/ATIVO
```

---

### 8. Listar Status Disponíveis

**GET** `/fornecedor/status-disponiveis`

**Permissões:** Autenticado

**Resposta (200):**
```json
{
  "status": ["ATIVO", "INATIVO", "BLOQUEADO"],
  "descricoes": {
    "ATIVO": "Fornecedor ativo e disponível para operações",
    "INATIVO": "Fornecedor inativo temporariamente",
    "BLOQUEADO": "Fornecedor bloqueado para operações"
  }
}
```

---

### 9. Obter Estatísticas

**GET** `/fornecedor/estatisticas`

**Permissões:** Autenticado

**Resposta (200):**
```json
{
  "total": 50,
  "ativos": 45,
  "inativos": 3,
  "novosNoMes": 5
}
```

---

### 10. Buscar Sugestões (Autocomplete)

**GET** `/fornecedor/sugestoes`

**Permissões:** Autenticado

**Query Parameters:**

| Parâmetro | Tipo | Obrigatório | Padrão | Descrição |
|-----------|------|-------------|--------|-----------|
| `termo` | string | **Sim** | - | Termo de busca (mínimo 2 caracteres) |
| `limit` | number | Não | 10 | Limite de resultados |
| `apenasAtivos` | boolean | Não | true | Apenas fornecedores ativos |

**Exemplo de Requisição:**
```bash
GET /fornecedor/sugestoes?termo=ABC&limit=5&apenasAtivos=true
```

**Resposta (200):**
```json
[
  {
    "id": 1,
    "nome_fantasia": "Empresa ABC",
    "nome_razao": "ABC Ltda",
    "cpf_cnpj": "12345678000190",
    "tipoFornecedor": "PESSOA_JURIDICA",
    "statusFornecedor": "ATIVO",
    "email": "contato@abc.com",
    "telefone": "11999999999"
  }
]
```

---

### 11. Buscar por ID

**GET** `/fornecedor/:id`

**Permissões:** Autenticado

**Parâmetros de Rota:**

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | number | ID do fornecedor |

**Exemplo de Requisição:**
```bash
GET /fornecedor/1
```

---

## 👥 Clientes

### Base URL
```
/clientes
```

### 1. Listar Clientes (com filtros básicos)

**GET** `/clientes`

**Permissões:** Autenticado

**Query Parameters:**

| Parâmetro | Tipo | Obrigatório | Padrão | Descrição |
|-----------|------|-------------|--------|-----------|
| `page` | number | Não | 1 | Número da página |
| `limit` | number | Não | 15 | Itens por página |
| `status` | string | Não | - | Filtro por status (ATIVO, INATIVO) |
| `tipo` | string | Não | - | Filtro por tipo (FISICA, JURIDICA, PESSOA_FISICA, PESSOA_JURIDICA) |
| `busca` | string | Não | - | Busca por nome, CPF/CNPJ ou email |

**Exemplo de Requisição:**
```bash
GET /clientes?page=1&limit=20&status=ATIVO&tipo=PESSOA_FISICA&busca=João
```

---

### 2. Buscar Sugestões (Autocomplete)

**GET** `/clientes/sugestoes`

**Permissões:** Autenticado

**Query Parameters:**

| Parâmetro | Tipo | Obrigatório | Padrão | Descrição |
|-----------|------|-------------|--------|-----------|
| `termo` | string | **Sim** | - | Termo de busca (mínimo 2 caracteres) |
| `limit` | number | Não | 10 | Limite de resultados |
| `apenasAtivos` | boolean | Não | true | Apenas clientes ativos |

**Exemplo de Requisição:**
```bash
GET /clientes/sugestoes?termo=João&limit=5&apenasAtivos=true
```

**Resposta (200):**
```json
[
  {
    "id": 1,
    "nome": "João Silva",
    "nome_fantasia": null,
    "nome_razao": "João Silva",
    "cpf_cnpj": "12345678900",
    "tipoPessoa": "PESSOA_FISICA",
    "statusCliente": "ATIVO",
    "email": "joao@email.com",
    "telefone": "11999999999"
  }
]
```

---

### 3. Buscar por Nome

**GET** `/clientes/buscar-por-nome`

**Permissões:** Autenticado

**Query Parameters:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `nome` | string | **Sim** | Nome do cliente para buscar |

**Exemplo de Requisição:**
```bash
GET /clientes/buscar-por-nome?nome=João Silva
```

---

### 4. Busca Avançada

**GET** `/clientes/buscar-avancado`

**Permissões:** Autenticado

**Query Parameters:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `termo` | string | Não | Busca geral (nome, razão social, CPF/CNPJ) |
| `tipoPessoa` | TipoPessoa | Não | Filtro por tipo (PESSOA_FISICA, PESSOA_JURIDICA) |
| `statusCliente` | StatusCliente | Não | Filtro por status (ATIVO, INATIVO) |
| `cidade` | string | Não | Filtro por cidade do endereço |
| `estado` | string | Não | Filtro por estado (UF) do endereço |
| `page` | number | Não | Número da página (padrão: 1) |
| `limit` | number | Não | Itens por página (padrão: 15) |

**Exemplo de Requisição:**
```bash
GET /clientes/buscar-avancado?termo=João&cidade=São Paulo&estado=SP&statusCliente=ATIVO&page=1&limit=20
```

**Resposta (200):**
```json
{
  "clientes": [...],
  "total": 10
}
```

---

### 5. Buscar por Tipo de Pessoa

**GET** `/clientes/tipo/:tipoPessoa`

**Permissões:** Autenticado

**Parâmetros de Rota:**

| Parâmetro | Tipo | Valores Aceitos |
|-----------|------|-----------------|
| `tipoPessoa` | TipoPessoa | `PESSOA_FISICA`, `PESSOA_JURIDICA` |

**Exemplo de Requisição:**
```bash
GET /clientes/tipo/PESSOA_FISICA
```

---

### 6. Buscar por Status

**GET** `/clientes/status/:statusCliente`

**Permissões:** Autenticado

**Parâmetros de Rota:**

| Parâmetro | Tipo | Valores Aceitos |
|-----------|------|-----------------|
| `statusCliente` | StatusCliente | `ATIVO`, `INATIVO` |

**Exemplo de Requisição:**
```bash
GET /clientes/status/ATIVO
```

---

### 7. Obter Estatísticas

**GET** `/clientes/estatisticas`

**Permissões:** Autenticado

**Resposta (200):**
```json
{
  "total": 100,
  "ativos": 85,
  "inativos": 15,
  "novosNoMes": 10
}
```

---

### 8. Buscar por ID

**GET** `/clientes/:id`

**Permissões:** Autenticado

**Parâmetros de Rota:**

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | number | ID do cliente |

**Exemplo de Requisição:**
```bash
GET /clientes/1
```

---

## 📦 Produtos

### Base URL
```
/produtos
```

### 1. Listar Produtos (com filtro de status)

**GET** `/produtos`

**Permissões:** Autenticado

**Query Parameters:**

| Parâmetro | Tipo | Obrigatório | Padrão | Descrição |
|-----------|------|-------------|--------|-----------|
| `page` | number | Não | 1 | Número da página |
| `limit` | number | Não | 15 | Itens por página |
| `statusProduto` | StatusProduto | Não | - | Filtro por status (ATIVO, INATIVO, DESCONTINUADO) |

**Exemplo de Requisição:**
```bash
GET /produtos?page=1&limit=20&statusProduto=ATIVO
```

---

### 2. Buscar Sugestões (Autocomplete)

**GET** `/produtos/sugestoes`

**Permissões:** Autenticado

**Query Parameters:**

| Parâmetro | Tipo | Obrigatório | Padrão | Descrição |
|-----------|------|-------------|--------|-----------|
| `termo` | string | **Sim** | - | Termo de busca (nome do produto) |
| `limit` | number | Não | 10 | Limite de resultados |
| `apenasAtivos` | boolean | Não | true | Apenas produtos ativos |

**Exemplo de Requisição:**
```bash
GET /produtos/sugestoes?termo=Notebook&limit=5&apenasAtivos=true
```

---

### 3. Busca Avançada

**GET** `/produtos/buscar-avancado`

**Permissões:** Autenticado

**Query Parameters:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `termo` | string | Não | Busca geral (nome do produto) |
| `categoriaId` | number | Não | Filtro por categoria |
| `fornecedorId` | number | Não | Filtro por fornecedor (ID) |
| `nomeFornecedor` | string | Não | Filtro por nome do fornecedor |
| `statusProduto` | StatusProduto | Não | Filtro por status |
| `unidade_medida` | UnidadeMedida | Não | Filtro por unidade de medida |
| `precoMin` | number | Não | Preço mínimo |
| `precoMax` | number | Não | Preço máximo |
| `estoqueMin` | number | Não | Estoque mínimo |
| `estoqueMax` | number | Não | Estoque máximo |
| `validadeInicial` | string | Não | Data inicial de validade (YYYY-MM-DD) |
| `validadeFinal` | string | Não | Data final de validade (YYYY-MM-DD) |
| `page` | number | Não | Número da página (padrão: 1) |
| `limit` | number | Não | Itens por página (padrão: 15) |

**Exemplo de Requisição:**
```bash
GET /produtos/buscar-avancado?termo=Notebook&categoriaId=1&precoMin=1000&precoMax=5000&statusProduto=ATIVO&page=1&limit=20
```

**Resposta (200):**
```json
{
  "produtos": [...],
  "total": 15
}
```

---

### 4. Buscar por Categoria

**GET** `/produtos/categoria/:categoriaId`

**Permissões:** Autenticado

**Parâmetros de Rota:**

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `categoriaId` | number | ID da categoria |

**Query Parameters:**

| Parâmetro | Tipo | Obrigatório | Padrão | Descrição |
|-----------|------|-------------|--------|-----------|
| `page` | number | Não | 1 | Número da página |
| `limit` | number | Não | 15 | Itens por página |

**Exemplo de Requisição:**
```bash
GET /produtos/categoria/1?page=1&limit=20
```

---

### 5. Buscar por Fornecedor

**GET** `/produtos/fornecedor/:fornecedorId`

**Permissões:** Autenticado

**Parâmetros de Rota:**

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `fornecedorId` | number | ID do fornecedor |

**Query Parameters:**

| Parâmetro | Tipo | Obrigatório | Padrão | Descrição |
|-----------|------|-------------|--------|-----------|
| `page` | number | Não | 1 | Número da página |
| `limit` | number | Não | 15 | Itens por página |

**Exemplo de Requisição:**
```bash
GET /produtos/fornecedor/1?page=1&limit=20
```

---

### 6. Buscar Produtos Ativos

**GET** `/produtos/ativos`

**Permissões:** Autenticado

**Query Parameters:**

| Parâmetro | Tipo | Obrigatório | Padrão | Descrição |
|-----------|------|-------------|--------|-----------|
| `page` | number | Não | 1 | Número da página |
| `limit` | number | Não | 15 | Itens por página |

**Exemplo de Requisição:**
```bash
GET /produtos/ativos?page=1&limit=20
```

---

### 7. Buscar por Faixa de Preço

**GET** `/produtos/preco`

**Permissões:** Autenticado

**Query Parameters:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `min` | number | Não | Preço mínimo |
| `max` | number | Não | Preço máximo |
| `page` | number | Não | Número da página (padrão: 1) |
| `limit` | number | Não | Itens por página (padrão: 15) |

**Exemplo de Requisição:**
```bash
GET /produtos/preco?min=1000&max=5000&page=1&limit=20
```

---

### 8. Buscar por Estoque

**GET** `/produtos/estoque`

**Permissões:** Autenticado

**Query Parameters:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `min` | number | Não | Estoque mínimo |
| `max` | number | Não | Estoque máximo |
| `page` | number | Não | Número da página (padrão: 1) |
| `limit` | number | Não | Itens por página (padrão: 15) |

**Exemplo de Requisição:**
```bash
GET /produtos/estoque?min=10&max=100&page=1&limit=20
```

---

### 9. Buscar por Validade

**GET** `/produtos/validade`

**Permissões:** Autenticado

**Query Parameters:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `inicio` | string | Não | Data inicial (YYYY-MM-DD) |
| `fim` | string | Não | Data final (YYYY-MM-DD) |
| `page` | number | Não | Número da página (padrão: 1) |
| `limit` | number | Não | Itens por página (padrão: 15) |

**Exemplo de Requisição:**
```bash
GET /produtos/validade?inicio=2024-01-01&fim=2024-12-31&page=1&limit=20
```

---

### 10. Buscar por ID

**GET** `/produtos/:id`

**Permissões:** Autenticado

**Parâmetros de Rota:**

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | number | ID do produto |

**Exemplo de Requisição:**
```bash
GET /produtos/1
```

---

## 🛒 Pedidos

### Base URL
```
/pedidos
```

### 1. Listar Pedidos (com filtros)

**GET** `/pedidos`

**Permissões:** ADMIN, GERENTE, VENDEDOR

**Query Parameters:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `id` | number | Não | Buscar pedido específico por ID |
| `tipo` | TipoPedido | Não | Filtro por tipo de pedido |
| `status` | StatusPedido | Não | Filtro por status do pedido |
| `cliente_id` | number | Não | Filtro por ID do cliente |
| `cliente_nome` | string | Não | Filtro por nome do cliente |
| `fornecedor_id` | number | Não | Filtro por ID do fornecedor |
| `fornecedor_nome` | string | Não | Filtro por nome do fornecedor |
| `page` | number | Não | Número da página (padrão: 1) |
| `limit` | number | Não | Itens por página (padrão: 15) |

**Exemplo de Requisição:**
```bash
GET /pedidos?status=PENDENTE&cliente_id=1&page=1&limit=20
```

**Nota:** Se o parâmetro `id` for fornecido, retorna apenas o pedido específico.

---

### 2. Buscar por ID

**GET** `/pedidos/:id`

**Permissões:** ADMIN, GERENTE, VENDEDOR

**Parâmetros de Rota:**

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | number | ID do pedido |

**Exemplo de Requisição:**
```bash
GET /pedidos/1
```

---

## 📁 Categorias

### Base URL
```
/categorias
```

### 1. Busca Avançada de Categorias

**GET** `/categorias/buscar-avancado`

**Permissões:** Autenticado

**Query Parameters:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `termo` | string | Não | Termo de busca (nome da categoria) |
| `page` | number | Não | Número da página (padrão: 1) |
| `limit` | number | Não | Itens por página (padrão: 15) |

**Exemplo de Requisição:**
```bash
GET /categorias/buscar-avancado?termo=Eletrônicos&page=1&limit=20
```

---

## 🚚 Transportadoras

### Base URL
```
/transportadoras
```

### 1. Buscar Transportadoras

**GET** `/transportadoras/buscar`

**Permissões:** Autenticado

**Query Parameters:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `termo` | string | Não | Termo de busca (nome da transportadora) |
| `page` | number | Não | Número da página (padrão: 1) |
| `limit` | number | Não | Itens por página (padrão: 15) |

**Exemplo de Requisição:**
```bash
GET /transportadoras/buscar?termo=Correios&page=1&limit=20
```

---

## 📝 Convenções Gerais

### Autenticação

Todos os endpoints requerem autenticação via JWT token no header:

```
Authorization: Bearer <token>
```

O token deve conter:
- `schema_name`: Schema do tenant
- `tenant_id`: ID do tenant
- `id`: ID do usuário

---

### Paginação

A maioria dos endpoints suporta paginação através dos parâmetros:

- `page`: Número da página (padrão: 1)
- `limit`: Itens por página (padrão: 15)

**Exemplo:**
```bash
GET /fornecedor?page=2&limit=50
```

---

### Filtros de Busca

#### Busca por Termo (ILIKE)

Quando um parâmetro `termo` é aceito, a busca é feita usando `ILIKE` (case-insensitive) nos seguintes campos:

**Fornecedores:**
- `nome_fantasia`
- `nome_razao`
- `cpf_cnpj`
- `email` (dos contatos)
- `telefone` (dos contatos)

**Clientes:**
- `nome`
- `nome_fantasia`
- `nome_razao`
- `cpf_cnpj`
- `email` (dos contatos)

**Produtos:**
- `nome`

---

### Códigos de Status HTTP

| Código | Descrição |
|--------|-----------|
| 200 | Sucesso |
| 201 | Criado com sucesso |
| 400 | Requisição inválida (parâmetros incorretos) |
| 401 | Não autenticado |
| 403 | Sem permissão |
| 404 | Recurso não encontrado |
| 500 | Erro interno do servidor |

---

### Formato de Datas

Para parâmetros de data, use o formato ISO 8601:

```
YYYY-MM-DD
```

**Exemplo:**
```
2024-01-15
```

---

### Enums Comuns

#### TipoFornecedor / TipoPessoa
- `PESSOA_FISICA`
- `PESSOA_JURIDICA`

#### StatusFornecedor
- `ATIVO`
- `INATIVO`
- `BLOQUEADO`

#### StatusCliente
- `ATIVO`
- `INATIVO`

#### StatusProduto
- `ATIVO`
- `INATIVO`
- `DESCONTINUADO`

#### StatusPedido
- `PENDENTE`
- `APROVADO`
- `CANCELADO`
- `FINALIZADO`

#### TipoPedido
- `VENDA`
- `COMPRA`

---

### Exemplos de Uso com cURL

#### Buscar Fornecedores Ativos
```bash
curl -X GET "https://api.exemplo.com/fornecedor?statusFornecedor=ATIVO&page=1&limit=20" \
  -H "Authorization: Bearer <token>"
```

#### Busca Avançada de Produtos
```bash
curl -X GET "https://api.exemplo.com/produtos/buscar-avancado?termo=Notebook&precoMin=1000&precoMax=5000&statusProduto=ATIVO" \
  -H "Authorization: Bearer <token>"
```

#### Buscar Sugestões de Clientes
```bash
curl -X GET "https://api.exemplo.com/clientes/sugestoes?termo=João&limit=5&apenasAtivos=true" \
  -H "Authorization: Bearer <token>"
```

---

### Notas Importantes

1. **Tenant Isolation**: Todos os endpoints respeitam o isolamento de tenants. Você só verá dados do seu próprio tenant.

2. **Case-Insensitive**: As buscas por texto são case-insensitive (não diferenciam maiúsculas/minúsculas).

3. **Wildcards**: O sistema usa `ILIKE` com `%termo%` internamente, então não é necessário adicionar wildcards manualmente.

4. **Performance**: Para grandes volumes de dados, sempre use paginação e filtros específicos quando possível.

5. **Cache**: Alguns endpoints podem retornar dados em cache. Para dados sempre atualizados, considere adicionar um parâmetro `_t` (timestamp) à URL.

---

## 📞 Suporte

Para dúvidas ou problemas com os endpoints, consulte a documentação completa da API ou entre em contato com a equipe de desenvolvimento.

---

**Última atualização:** 2024-01-15

