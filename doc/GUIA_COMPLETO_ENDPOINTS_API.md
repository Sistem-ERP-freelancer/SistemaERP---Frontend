# Guia Completo de Endpoints da API - Sistema ERP

## 📋 Índice

1. [Informações Gerais](#informações-gerais)
2. [Autenticação](#autenticação)
3. [Usuários](#usuários)
4. [Tenants](#tenants)
5. [Clientes](#clientes)
6. [Fornecedores](#fornecedores)
7. [Produtos](#produtos)
8. [Categorias](#categorias)
9. [Pedidos](#pedidos)
10. [Contas Financeiras](#contas-financeiras)
11. [Transportadoras](#transportadoras)
12. [Contatos](#contatos)
13. [Endereços](#endereços)
14. [Notificações](#notificações)
15. [Estoque](#estoque)
16. [Configurações](#configurações)

---

## 🔧 Informações Gerais

### Base URL
```
/api/v1
```

### Autenticação
A API utiliza autenticação JWT (JSON Web Tokens). Para acessar endpoints protegidos, inclua o token no header:
```
Authorization: Bearer <token>
```

### Multi-tenancy
O sistema utiliza arquitetura multi-tenant baseada em schemas PostgreSQL. Cada tenant possui um schema isolado no banco de dados. O `schema_name` é automaticamente extraído do token JWT do usuário autenticado.

### Roles e Permissões
- **SUPER_ADMIN**: Acesso total ao sistema, gerencia todos os tenants
- **ADMIN**: Administrador de um tenant específico
- **GERENTE**: Gerente com permissões amplas
- **VENDEDOR**: Vendedor com permissões limitadas (pode criar/listar/atualizar pedidos, mas não acessa módulo financeiro)
- **FINANCEIRO**: Acesso ao módulo financeiro

### Códigos de Status HTTP
- `200 OK`: Requisição bem-sucedida
- `201 Created`: Recurso criado com sucesso
- `204 No Content`: Requisição bem-sucedida sem conteúdo
- `400 Bad Request`: Dados inválidos
- `401 Unauthorized`: Não autenticado
- `403 Forbidden`: Sem permissão
- `404 Not Found`: Recurso não encontrado
- `409 Conflict`: Conflito (ex: CPF/CNPJ duplicado)
- `500 Internal Server Error`: Erro interno do servidor

---

## 🔐 Autenticação

### Base URL
```
/api/v1/usuarios
```

### 1. Login

**POST** `/usuarios/login`

Autentica um usuário e retorna um token JWT.

**Permissões:** Público (não requer autenticação)

**Request Body:**
```json
{
  "email": "admin@empresa.com",
  "senha": "senha123"
}
```

**Campos:**
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `email` | string | Sim | Email do usuário (formato válido) |
| `senha` | string | Sim | Senha do usuário (mínimo 6 caracteres) |

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "nome": "João Silva",
    "email": "admin@empresa.com",
    "role": "ADMIN",
    "tenant_id": "123e4567-e89b-12d3-a456-426614174001",
    "schema_name": "tenant_abc123"
  }
}
```

### 2. Logout

**POST** `/usuarios/logout`

Registra o logout do usuário.

**Permissões:** Autenticado

**Response (200):**
```json
{
  "message": "Logout realizado com sucesso",
  "success": true
}
```

---

## 👥 Usuários

### Base URL
```
/api/v1/usuarios
```

### Enums

#### RoleUsuario
```typescript
enum RoleUsuario {
  SUPER_ADMIN = 'SUPER_ADMIN',  // Administrador do sistema (gerencia todos os tenants)
  ADMIN = 'ADMIN',              // Administrador de um tenant específico
  GERENTE = 'GERENTE',
  VENDEDOR = 'VENDEDOR',
  FINANCEIRO = 'FINANCEIRO',
}
```

### DTOs

#### CreateUsuarioDto
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `tenant_id` | string (UUID) | Não | ID do tenant (será usado o tenant do usuário autenticado) |
| `nome` | string | Sim | Nome completo do usuário (mínimo 3 caracteres) |
| `email` | string | Sim | Email do usuário (deve ser único, formato válido) |
| `senha` | string | Sim | Senha do usuário (mínimo 6 caracteres) |
| `role` | RoleUsuario | Não | Papel/perfil do usuário (padrão: VENDEDOR) |
| `ativo` | boolean | Não | Indica se o usuário está ativo (padrão: true) |

#### UpdateUsuarioDto
Todos os campos são opcionais. Apenas os campos enviados serão atualizados.

### Entity

#### Usuario
```typescript
{
  id: string;                    // UUID
  tenant_id: string | null;      // UUID (null para SUPER_ADMIN)
  nome: string;
  email: string;                 // Único
  senha_hash: string;            // Hash da senha
  role: RoleUsuario;             // Padrão: VENDEDOR
  ativo: boolean;                // Padrão: true
  ultimo_acesso?: Date;
  created_at: Date;
  updated_at: Date;
}
```

### Endpoints

#### 1. Criar Usuário

**POST** `/usuarios`

**Permissões:** ADMIN, GERENTE

**Request Body:** CreateUsuarioDto

**Response (201):** Usuario

#### 2. Listar Usuários

**GET** `/usuarios`

**Permissões:** ADMIN, GERENTE

**Response (200):** Array<Usuario>

#### 3. Buscar Usuário por ID

**GET** `/usuarios/:id`

**Permissões:** Autenticado

**Parâmetros:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | string (UUID) | ID do usuário |

**Response (200):** Usuario

#### 4. Atualizar Usuário

**PUT** `/usuarios/:id`

**Permissões:** ADMIN, GERENTE

**Parâmetros:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | string (UUID) | ID do usuário |

**Request Body:** UpdateUsuarioDto

**Response (200):** Usuario

#### 5. Ativar Usuário

**PUT** `/usuarios/:id/ativar`

**Permissões:** ADMIN, GERENTE

**Parâmetros:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | string (UUID) | ID do usuário |

**Response (200):** Usuario

#### 6. Desativar Usuário

**PUT** `/usuarios/:id/desativar`

**Permissões:** ADMIN, GERENTE

**Parâmetros:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | string (UUID) | ID do usuário |

**Response (200):** Usuario

#### 7. Remover Usuário

**DELETE** `/usuarios/:id`

**Permissões:** ADMIN, GERENTE

**Parâmetros:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | string (UUID) | ID do usuário |

**Response (200):**
```json
{
  "message": "Usuário removido com sucesso"
}
```

---

## 🏢 Tenants

### Base URL
```
/api/v1/tenants
```

### Enums

#### StatusTenant
```typescript
enum StatusTenant {
  ATIVO = 'ATIVO',
  SUSPENSO = 'SUSPENSO',
  INATIVO = 'INATIVO',
}
```

### DTOs

#### CreateTenantDto
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `nome` | string | Sim | Nome do tenant |
| `schema_name` | string | Sim | Nome do schema no banco (único, sem espaços) |
| `email_admin` | string | Sim | Email do administrador inicial |
| `senha_admin` | string | Sim | Senha do administrador inicial (mínimo 6 caracteres) |
| `nome_admin` | string | Sim | Nome do administrador inicial |

#### UpdateTenantDto
Todos os campos são opcionais.

### Entity

#### Tenant
```typescript
{
  id: string;                    // UUID
  codigo: string;                // Único
  nome: string;
  cnpj?: string;
  email?: string;
  telefone?: string;
  schema_name: string;           // Único
  subdominio?: string;           // Único (quando fornecido)
  status: StatusTenant;          // Padrão: ATIVO
  data_expiracao?: Date | null;
  configuracoes?: Record<string, any>; // JSON
  data_criacao: Date;
  updated_at: Date;
}
```

### Endpoints

#### 1. Criar Tenant

**POST** `/tenants`

**Permissões:** SUPER_ADMIN

**Request Body:** CreateTenantDto

**Response (201):** Tenant

#### 2. Listar Tenants

**GET** `/tenants`

**Permissões:** SUPER_ADMIN

**Response (200):** Array<Tenant>

#### 3. Buscar Tenant por ID

**GET** `/tenants/:id`

**Permissões:** SUPER_ADMIN

**Parâmetros:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | string (UUID) | ID do tenant |

**Response (200):** Tenant

#### 4. Atualizar Tenant

**PUT** `/tenants/:id`

**Permissões:** SUPER_ADMIN

**Parâmetros:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | string (UUID) | ID do tenant |

**Request Body:** UpdateTenantDto

**Response (200):** Tenant

#### 5. Bloquear Tenant

**PUT** `/tenants/:id/bloquear`

**Permissões:** SUPER_ADMIN

**Parâmetros:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | string (UUID) | ID do tenant |

**Response (200):** Tenant (status: SUSPENSO)

#### 6. Desbloquear Tenant

**PUT** `/tenants/:id/desbloquear`

**Permissões:** SUPER_ADMIN

**Parâmetros:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | string (UUID) | ID do tenant |

**Response (200):** Tenant (status: ATIVO)

---

## 🏢 Tenant Info (Informações do Tenant Atual)

### Base URL
```
/api/v1/tenant
```

### DTOs

#### UpdateTenantInfoDto
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `nome` | string | Não | Nome da empresa |
| `cnpj` | string | Não | CNPJ da empresa |
| `email` | string | Não | Email da empresa (formato válido) |
| `telefone` | string | Não | Telefone da empresa |

### Endpoints

#### 1. Obter Informações do Tenant Atual

**GET** `/tenant/me`

**Permissões:** ADMIN, GERENTE

**Response (200):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "codigo": "TENANT001",
  "nome": "Empresa ABC",
  "cnpj": "12.345.678/0001-90",
  "email": "contato@empresa.com",
  "telefone": "(11) 99999-9999",
  "subdominio": "empresa-abc",
  "status": "ATIVO",
  "data_expiracao": null,
  "configuracoes": {},
  "data_criacao": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

#### 2. Atualizar Informações do Tenant Atual

**PUT** `/tenant/me`

**Permissões:** ADMIN

**Request Body:** UpdateTenantInfoDto

**Response (200):** Tenant

---

## 👤 Clientes

### Base URL
```
/api/v1/clientes
```

### Enums

#### TipoPessoa
```typescript
enum TipoPessoa {
  PESSOA_FISICA = 'PESSOA_FISICA',
  PESSOA_JURIDICA = 'PESSOA_JURIDICA',
}
```

#### StatusCliente
```typescript
enum StatusCliente {
  ATIVO = 'ATIVO',
  INATIVO = 'INATIVO',
}
```

### DTOs

#### CreateClienteDto
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `tenant_id` | string (UUID) | Não | ID do tenant (será usado o tenant do usuário autenticado) |
| `nome` | string | Não* | Nome completo (obrigatório para Pessoa Física) |
| `tipoPessoa` ou `tipo_pessoa` | TipoPessoa | Não | Tipo de pessoa (padrão: PESSOA_FISICA) |
| `statusCliente` ou `status_cliente` | StatusCliente | Não | Status do cliente (padrão: ATIVO) |
| `cpf_cnpj` ou `documento` | string | Não | CPF ou CNPJ (aceita formatado ou apenas números) |
| `nome_fantasia` | string | Não | Nome fantasia (apenas para Pessoa Jurídica) |
| `nome_razao` | string | Não* | Razão Social (obrigatório para Pessoa Jurídica) |
| `inscricao_estadual` | string | Não | Inscrição Estadual (apenas para Pessoa Jurídica) |
| `email` | string | Não | Email do cliente (formato válido) |
| `telefone` | string | Não | Telefone (formato: (00) 00000-0000) |
| `observacoes` | string | Não | Observações (máximo 500 caracteres) |
| `enderecos` | Array<CreateEnderecoDto> | Sim | Lista de endereços (mínimo 1) |
| `contatos` ou `contato` | Array<CreateContatoDto> | Sim | Lista de contatos (mínimo 1) |

#### UpdateClienteDto
Todos os campos são opcionais. Apenas os campos enviados serão atualizados.

### Entity

#### Cliente
```typescript
{
  id: number;
  nome: string;
  tipoPessoa: TipoPessoa;         // Padrão: PESSOA_FISICA
  statusCliente: StatusCliente;   // Padrão: ATIVO
  cpf_cnpj?: string;              // Único (quando fornecido)
  nome_fantasia?: string;
  nome_razao?: string;
  inscricao_estadual?: string;
  criadoEm: Date;
  atualizadoEm: Date;
  enderecos: Endereco[];
  contato: Contato[];
}
```

### Endpoints

#### 1. Criar Cliente

**POST** `/clientes`

**Permissões:** Autenticado

**Request Body:** CreateClienteDto

**Response (201):** Cliente

#### 2. Listar Clientes

**GET** `/clientes`

**Permissões:** Autenticado

**Query Parameters:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `page` | number | Número da página (padrão: 1) |
| `limit` | number | Itens por página (padrão: 15) |
| `status` | string | Filtro por status (ATIVO, INATIVO) |
| `tipo` | string | Filtro por tipo (FISICA, JURIDICA, PESSOA_FISICA, PESSOA_JURIDICA) |
| `busca` | string | Busca por nome, CPF/CNPJ ou email |

**Response (200):** Array<Cliente>

#### 3. Buscar Sugestões (Autocomplete)

**GET** `/clientes/sugestoes`

**Permissões:** Autenticado

**Query Parameters:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `termo` | string | Termo de busca |
| `limit` | number | Limite de resultados (padrão: 10) |
| `apenasAtivos` | string | Apenas clientes ativos (padrão: true) |

**Response (200):** Array<SugestaoCliente>

#### 4. Buscar por Nome

**GET** `/clientes/buscar-por-nome`

**Permissões:** Autenticado

**Query Parameters:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `nome` | string | Nome do cliente |

**Response (200):** Array<Cliente>

#### 5. Busca Avançada

**GET** `/clientes/buscar-avancado`

**Permissões:** Autenticado

**Query Parameters:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `termo` | string | Termo de busca |
| `tipoPessoa` | TipoPessoa | Filtro por tipo de pessoa |
| `statusCliente` | StatusCliente | Filtro por status |
| `cidade` | string | Filtro por cidade |
| `estado` | string | Filtro por estado (UF) |
| `page` | number | Número da página |
| `limit` | number | Itens por página |

**Response (200):** Array<Cliente>

#### 6. Buscar por Tipo

**GET** `/clientes/tipo/:tipoPessoa`

**Permissões:** Autenticado

**Parâmetros:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `tipoPessoa` | TipoPessoa | Tipo de pessoa |

**Response (200):** Array<Cliente>

#### 7. Buscar por Status

**GET** `/clientes/status/:statusCliente`

**Permissões:** Autenticado

**Parâmetros:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `statusCliente` | StatusCliente | Status do cliente |

**Response (200):** Array<Cliente>

#### 8. Obter Estatísticas

**GET** `/clientes/estatisticas`

**Permissões:** Autenticado

**Response (200):**
```json
{
  "total": 100,
  "ativos": 85,
  "inativos": 15,
  "pessoaFisica": 60,
  "pessoaJuridica": 40
}
```

#### 9. Buscar Cliente por ID

**GET** `/clientes/:id`

**Permissões:** Autenticado

**Parâmetros:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | number | ID do cliente |

**Response (200):** Cliente

#### 10. Atualizar Cliente

**PATCH** `/clientes/:id`

**Permissões:** ADMIN, GERENTE

**Parâmetros:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | number | ID do cliente |

**Request Body:** UpdateClienteDto

**Response (200):** Cliente

#### 11. Deletar Cliente

**DELETE** `/clientes/:id`

**Permissões:** ADMIN, GERENTE

**Parâmetros:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | number | ID do cliente |

**Response (200):**
```json
{
  "mensagem": "Cliente removido com sucesso"
}
```

---

## 🏭 Fornecedores

### Base URL
```
/api/v1/fornecedor
```

### Enums

#### TipoFornecedor
```typescript
enum TipoFornecedor {
  PESSOA_FISICA = 'PESSOA_FISICA',
  PESSOA_JURIDICA = 'PESSOA_JURIDICA',
}
```

#### StatusFornecedor
```typescript
enum StatusFornecedor {
  ATIVO = 'ATIVO',
  INATIVO = 'INATIVO',
  BLOQUEADO = 'BLOQUEADO',
}
```

### DTOs

#### CreateFornecedorDto
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `nome_fantasia` | string | Sim | Nome fantasia (1-255 caracteres) |
| `nome_razao` | string | Sim | Razão social (1-255 caracteres) |
| `tipoFornecedor` | TipoFornecedor | Sim | Tipo de fornecedor |
| `statusFornecedor` | StatusFornecedor | Não | Status (padrão: ATIVO) |
| `cpf_cnpj` | string | Sim | CPF ou CNPJ (único) |
| `inscricao_estadual` | string | Não | Inscrição estadual |
| `enderecos` | Array<CreateEnderecoDto> | Não | Lista de endereços |
| `contato` | Array<CreateContatoDto> | Não | Lista de contatos |

#### UpdateFornecedorDto
Todos os campos são opcionais. Apenas os campos enviados serão atualizados.

### Entity

#### Fornecedor
```typescript
{
  id: number;
  nome_fantasia?: string;
  nome_razao: string;
  tipoFornecedor: TipoFornecedor;
  statusFornecedor: StatusFornecedor;
  cpf_cnpj?: string;              // Único
  inscricao_estadual?: string;
  criandoEm: Date;
  atualizadoEm: Date;
  enderecos: Endereco[];
  contato: Contato[];
  produtos: Produto[];
}
```

### Endpoints

#### 1. Criar Fornecedor

**POST** `/fornecedor`

**Permissões:** ADMIN, GERENTE

**Request Body:** CreateFornecedorDto

**Response (201):** Fornecedor

#### 2. Listar Fornecedores

**GET** `/fornecedor`

**Permissões:** Autenticado

**Query Parameters:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `page` | number | Número da página (padrão: 1) |
| `limit` | number | Itens por página (padrão: 15) |
| `tipoFornecedor` | TipoFornecedor | Filtro por tipo |
| `statusFornecedor` | StatusFornecedor | Filtro por status |

**Response (200):** Array<Fornecedor>

#### 3. Obter Estatísticas

**GET** `/fornecedor/estatisticas`

**Permissões:** Autenticado

**Response (200):**
```json
{
  "total": 50,
  "ativos": 45,
  "inativos": 3,
  "bloqueados": 2
}
```

#### 4. Buscar por Nome ou CNPJ

**GET** `/fornecedor/buscar`

**Permissões:** Autenticado

**Query Parameters:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `termo` | string | Termo de busca (obrigatório) |
| `page` | number | Número da página |
| `limit` | number | Itens por página |

**Response (200):** Array<Fornecedor>

#### 5. Busca Avançada

**GET** `/fornecedor/buscar-avancado`

**Permissões:** Autenticado

**Query Parameters:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `termo` | string | Termo de busca |
| `tipoFornecedor` | TipoFornecedor | Filtro por tipo |
| `statusFornecedor` | StatusFornecedor | Filtro por status |
| `cidade` | string | Filtro por cidade |
| `estado` | string | Filtro por estado |
| `telefone` | string | Filtro por telefone |
| `email` | string | Filtro por email |
| `nomeContato` | string | Filtro por nome do contato |
| `page` | number | Número da página |
| `limit` | number | Itens por página |

**Response (200):** Array<Fornecedor>

#### 6. Buscar por Nome Fantasia

**GET** `/fornecedor/nome-fantasia`

**Permissões:** Autenticado

**Query Parameters:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `nome` | string | Nome fantasia |
| `page` | number | Número da página |
| `limit` | number | Itens por página |

**Response (200):** Array<Fornecedor>

#### 7. Buscar por Razão Social

**GET** `/fornecedor/razao-social`

**Permissões:** Autenticado

**Query Parameters:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `nome` | string | Razão social |
| `page` | number | Número da página |
| `limit` | number | Itens por página |

**Response (200):** Array<Fornecedor>

#### 8. Buscar por Tipo

**GET** `/fornecedor/tipo/:tipoFornecedor`

**Permissões:** Autenticado

**Parâmetros:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `tipoFornecedor` | TipoFornecedor | Tipo de fornecedor |

**Response (200):** Array<Fornecedor>

#### 9. Listar Status Disponíveis

**GET** `/fornecedor/status-disponiveis`

**Permissões:** Autenticado

**Response (200):**
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

#### 10. Buscar por Status

**GET** `/fornecedor/status/:statusFornecedor`

**Permissões:** Autenticado

**Parâmetros:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `statusFornecedor` | StatusFornecedor | Status do fornecedor |

**Response (200):** Array<Fornecedor>

#### 11. Buscar Fornecedor por ID

**GET** `/fornecedor/:id`

**Permissões:** Autenticado

**Parâmetros:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | number | ID do fornecedor |

**Response (200):** Fornecedor

#### 12. Atualizar Fornecedor

**PATCH** `/fornecedor/:id`

**Permissões:** ADMIN, GERENTE

**Parâmetros:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | number | ID do fornecedor |

**Request Body:** UpdateFornecedorDto

**Response (200):** Fornecedor

#### 13. Deletar Fornecedor

**DELETE** `/fornecedor/:id`

**Permissões:** ADMIN, GERENTE

**Parâmetros:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | number | ID do fornecedor |

**Response (200):**
```json
{
  "mensagem": "Fornecedor removido com sucesso"
}
```

---

## 📦 Produtos

### Base URL
```
/api/v1/produtos
```
ou
```
/api/v1/produto
```

### Enums

#### StatusProduto
```typescript
enum StatusProduto {
  ATIVO = 'ATIVO',
  INATIVO = 'INATIVO',
}
```

#### UnidadeMedida
```typescript
enum UnidadeMedida {
  UN = 'UN',    // Unidade
  KG = 'KG',    // Quilograma
  LT = 'LT',    // Litro
  CX = 'CX',    // Caixa
}
```

### DTOs

#### CreateProdutoDto
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `nome` | string | Sim | Nome do produto (2-255 caracteres) |
| `descricao` | string | Não | Descrição detalhada (máximo 2000 caracteres) |
| `sku` | string | Sim | SKU/Código único (máximo 100 caracteres) |
| `preco_custo` | number | Sim | Preço de custo (até 2 casas decimais) |
| `preco_venda` | number | Sim | Preço de venda (até 2 casas decimais) |
| `preco_promocional` | number | Não | Preço promocional (até 2 casas decimais) |
| `estoque_atual` | number | Sim | Quantidade atual em estoque |
| `estoque_minimo` | number | Sim | Quantidade mínima em estoque |
| `statusProduto` | StatusProduto | Não | Status (padrão: ATIVO) |
| `unidade_medida` | UnidadeMedida | Não | Unidade de medida |
| `data_validade` | string | Não | Data de validade (formato: YYYY-MM-DD) |
| `ncm` | string | Não | Código NCM (máximo 20 caracteres) |
| `cest` | string | Não | Código CEST (máximo 20 caracteres) |
| `cfop` | string | Não | Código CFOP (máximo 20 caracteres) |
| `observacoes` | string | Não | Observações |
| `peso` | number | Não | Peso em kg (até 3 casas decimais, > 0) |
| `altura` | number | Não | Altura em cm (até 2 casas decimais, > 0) |
| `largura` | number | Não | Largura em cm (até 2 casas decimais, > 0) |
| `categoriaId` | number | Não | ID da categoria |
| `fornecedorId` | number | Não | ID do fornecedor |

#### UpdateProdutoDto
Todos os campos são opcionais. Apenas os campos enviados serão atualizados.

### Entity

#### Produto
```typescript
{
  id: number;
  nome: string;
  descricao?: string;
  sku: string;                    // Único
  preco_custo: number;
  preco_venda: number;
  preco_promocional?: number;
  estoque_atual: number;          // Padrão: 0
  estoque_minimo: number;         // Padrão: 0
  estoque_maximo?: number;
  localizacao?: string;
  statusProduto: StatusProduto;   // Padrão: ATIVO
  unidade_medida: UnidadeMedida;  // Padrão: UN
  data_validade?: Date;
  ncm?: string;
  cest?: string;
  cfop?: string;
  observacoes?: string;
  peso?: number;                  // Em kg (até 3 casas decimais)
  altura?: number;                // Em cm (até 2 casas decimais)
  largura?: number;               // Em cm (até 2 casas decimais)
  categoriaId?: number | null;
  fornecedorId?: number | null;
  criadoEm: Date;
  atualizadoEm: Date;
  categoria?: Categoria | null;
  fornecedor?: Fornecedor | null;
}
```

### Endpoints

#### 1. Criar Produto

**POST** `/produtos`

**Permissões:** ADMIN, GERENTE, VENDEDOR

**Request Body:** CreateProdutoDto

**Response (201):** Produto

#### 2. Listar Produtos

**GET** `/produtos`

**Permissões:** Autenticado

**Query Parameters:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `page` | number | Número da página (padrão: 1) |
| `limit` | number | Itens por página (padrão: 15) |
| `statusProduto` | StatusProduto | Filtro por status |

**Response (200):** Array<Produto>

#### 3. Buscar Sugestões (Autocomplete)

**GET** `/produtos/sugestoes`

**Permissões:** Autenticado

**Query Parameters:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `termo` | string | Termo de busca |
| `limit` | number | Limite de resultados (padrão: 10) |
| `apenasAtivos` | string | Apenas produtos ativos (padrão: true) |

**Response (200):** Array<SugestaoProduto>

#### 4. Busca Avançada

**GET** `/produtos/buscar-avancado`

**Permissões:** Autenticado

**Query Parameters:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `termo` | string | Termo de busca |
| `categoriaId` | number | Filtro por categoria |
| `fornecedorId` | number | Filtro por fornecedor |
| `nomeFornecedor` | string | Filtro por nome do fornecedor |
| `statusProduto` | StatusProduto | Filtro por status |
| `unidade_medida` | UnidadeMedida | Filtro por unidade de medida |
| `precoMin` | number | Preço mínimo |
| `precoMax` | number | Preço máximo |
| `estoqueMin` | number | Estoque mínimo |
| `estoqueMax` | number | Estoque máximo |
| `validadeInicial` | string | Data inicial de validade (YYYY-MM-DD) |
| `validadeFinal` | string | Data final de validade (YYYY-MM-DD) |
| `page` | number | Número da página |
| `limit` | number | Itens por página |

**Response (200):** Array<Produto>

#### 5. Buscar por Categoria

**GET** `/produtos/categoria/:categoriaId`

**Permissões:** Autenticado

**Parâmetros:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `categoriaId` | number | ID da categoria |

**Query Parameters:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `page` | number | Número da página |
| `limit` | number | Itens por página |

**Response (200):** Array<Produto>

#### 6. Buscar por Fornecedor

**GET** `/produtos/fornecedor/:fornecedorId`

**Permissões:** Autenticado

**Parâmetros:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `fornecedorId` | number | ID do fornecedor |

**Query Parameters:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `page` | number | Número da página |
| `limit` | number | Itens por página |

**Response (200):** Array<Produto>

#### 7. Buscar Produtos Ativos

**GET** `/produtos/ativos`

**Permissões:** Autenticado

**Query Parameters:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `page` | number | Número da página |
| `limit` | number | Itens por página |

**Response (200):** Array<Produto>

#### 8. Buscar por Faixa de Preço

**GET** `/produtos/preco`

**Permissões:** Autenticado

**Query Parameters:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `min` | number | Preço mínimo |
| `max` | number | Preço máximo |
| `page` | number | Número da página |
| `limit` | number | Itens por página |

**Response (200):** Array<Produto>

#### 9. Buscar por Estoque

**GET** `/produtos/estoque`

**Permissões:** Autenticado

**Query Parameters:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `min` | number | Estoque mínimo |
| `max` | number | Estoque máximo |
| `page` | number | Número da página |
| `limit` | number | Itens por página |

**Response (200):** Array<Produto>

#### 10. Buscar por Validade

**GET** `/produtos/validade`

**Permissões:** Autenticado

**Query Parameters:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `inicio` | string | Data inicial (YYYY-MM-DD) |
| `fim` | string | Data final (YYYY-MM-DD) |
| `page` | number | Número da página |
| `limit` | number | Itens por página |

**Response (200):** Array<Produto>

#### 11. Buscar Produto por ID

**GET** `/produtos/:id`

**Permissões:** Autenticado

**Parâmetros:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | number | ID do produto |

**Response (200):** Produto

#### 12. Atualizar Produto

**PATCH** `/produtos/:id`

**Permissões:** ADMIN, GERENTE, VENDEDOR

**Parâmetros:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | number | ID do produto |

**Request Body:** UpdateProdutoDto

**Response (200):** Produto

#### 13. Deletar Produto

**DELETE** `/produtos/:id`

**Permissões:** ADMIN, GERENTE, VENDEDOR

**Parâmetros:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | number | ID do produto |

**Response (200):**
```json
{
  "mensagem": "Produto removido com sucesso"
}
```

---

## 📁 Categorias

### Base URL
```
/api/v1/categoria
```

### Enums

#### StatusCategoria
```typescript
enum StatusCategoria {
  ATIVO = 'ATIVO',
  INATIVO = 'INATIVO',
}
```

### DTOs

#### CategoriaDto (Create)
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `nome` | string | Sim | Nome da categoria (2-255 caracteres) |
| `descricao` | string | Não | Descrição (máximo 500 caracteres) |
| `statusCategoria` | StatusCategoria | Não | Status (padrão: ATIVO) |

#### UpdateCategoriaDto
Todos os campos são opcionais. Apenas os campos enviados serão atualizados.

### Entity

#### Categoria
```typescript
{
  id: number;
  nome: string;
  descricao?: string;
  StatusCategoria: StatusCategoria;
  criandoEm: Date;
  atualizadoEm: Date;
  produtos: Produto[];
}
```

### Endpoints

#### 1. Criar Categoria

**POST** `/categoria`

**Permissões:** ADMIN, GERENTE

**Request Body:** CategoriaDto

**Response (201):** Categoria

#### 2. Listar Categorias

**GET** `/categoria`

**Permissões:** Autenticado

**Query Parameters:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `page` | number | Número da página (padrão: 1) |
| `limit` | number | Itens por página (padrão: 15) |
| `statusCategoria` | StatusCategoria | Filtro por status |

**Response (200):** Array<Categoria>

#### 3. Buscar Sugestões (Autocomplete)

**GET** `/categoria/sugestoes`

**Permissões:** Autenticado

**Query Parameters:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `termo` | string | Termo de busca |
| `limit` | number | Limite de resultados (padrão: 10) |
| `apenasAtivos` | string | Apenas categorias ativas (padrão: true) |

**Response (200):** Array<SugestaoCategoria>

#### 4. Busca Avançada

**GET** `/categoria/buscar-avancado`

**Permissões:** Autenticado

**Query Parameters:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `termo` | string | Termo de busca |
| `statusCategoria` | StatusCategoria | Filtro por status |
| `page` | number | Número da página |
| `limit` | number | Itens por página |

**Response (200):** Array<Categoria>

#### 5. Buscar Categoria por ID

**GET** `/categoria/:id`

**Permissões:** Autenticado

**Parâmetros:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | number | ID da categoria |

**Response (200):** Categoria

#### 6. Atualizar Categoria

**PATCH** `/categoria/:id`

**Permissões:** ADMIN, GERENTE

**Parâmetros:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | number | ID da categoria |

**Request Body:** UpdateCategoriaDto

**Response (200):** Categoria

#### 7. Deletar Categoria

**DELETE** `/categoria/:id`

**Permissões:** ADMIN, GERENTE

**Parâmetros:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | number | ID da categoria |

**Response (200):**
```json
{
  "mensagem": "Categoria removida com sucesso"
}
```

---

## 📋 Pedidos

### Base URL
```
/api/v1/pedidos
```

### Enums

#### TipoPedido
```typescript
enum TipoPedido {
  VENDA = 'VENDA',        // Pedido de venda
  COMPRA = 'COMPRA',      // Pedido de compra
}
```

#### StatusPedido
```typescript
enum StatusPedido {
  PENDENTE = 'PENDENTE',
  APROVADO = 'APROVADO',
  EM_PROCESSAMENTO = 'EM_PROCESSAMENTO',
  CONCLUIDO = 'CONCLUIDO',
  CANCELADO = 'CANCELADO',
}
```

#### FormaPagamento
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

### DTOs

#### CreatePedidoItemDto
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `produto_id` | number | Sim | ID do produto |
| `quantidade` | number | Sim | Quantidade (deve ser > 0.001) |
| `preco_unitario` | number | Sim | Preço unitário (deve ser >= 0) |
| `desconto` | number | Não | Desconto aplicado no item (padrão: 0, deve ser >= 0) |

#### CreatePedidoDto
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `tipo` | TipoPedido | Sim | Tipo de pedido (VENDA ou COMPRA) |
| `cliente_id` | number | Não* | ID do cliente (obrigatório para VENDA) |
| `fornecedor_id` | number | Não* | ID do fornecedor (obrigatório para COMPRA) |
| `transportadora_id` | number | Não | ID da transportadora |
| `status` | StatusPedido | Não | Status (padrão: PENDENTE) |
| `data_pedido` | string | Sim | Data do pedido (formato ISO: YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ssZ) |
| `data_entrega_prevista` | string | Não | Data de entrega prevista (formato ISO) |
| `data_entrega_realizada` | string | Não | Data de entrega realizada (formato ISO) |
| `condicao_pagamento` | string | Não | Condição de pagamento (máximo 100 caracteres) |
| `forma_pagamento` | FormaPagamento | Não | Forma de pagamento |
| `prazo_entrega_dias` | number | Não | Prazo de entrega em dias (>= 0) |
| `subtotal` | number | Não | Subtotal do pedido (>= 0) |
| `desconto_valor` | number | Não | Desconto em valor (>= 0) |
| `desconto_percentual` | number | Não | Desconto percentual (>= 0) |
| `frete` | number | Não | Valor do frete (>= 0) |
| `outras_taxas` | number | Não | Outras taxas (>= 0) |
| `observacoes_internas` | string | Não | Observações internas |
| `observacoes_cliente` | string | Não | Observações para o cliente |
| `itens` | Array<CreatePedidoItemDto> | Sim | Lista de itens (mínimo 1) |
| `usuario_criacao_id` | string (UUID) | Não | ID do usuário (preenchido automaticamente do token) |
| `usuario_atualizacao_id` | string (UUID) | Não | ID do usuário que atualizou |

#### UpdatePedidoDto
Todos os campos são opcionais. Apenas os campos enviados serão atualizados.

### Entities

#### Pedido
```typescript
{
  id: number;
  numero_pedido: string;          // Único, formato: VEND-2025-00001 ou COMP-2025-00001
  tipo: TipoPedido;
  status: StatusPedido;
  cliente_id?: number;
  fornecedor_id?: number;
  transportadora_id?: number;
  usuario_criacao_id: string;     // UUID
  usuario_atualizacao_id?: string; // UUID
  data_pedido: Date;
  data_entrega_prevista?: Date;
  data_entrega_realizada?: Date;
  condicao_pagamento?: string;
  forma_pagamento?: FormaPagamento;
  prazo_entrega_dias?: number;
  subtotal: number;               // Padrão: 0
  desconto_valor: number;          // Padrão: 0
  desconto_percentual: number;     // Padrão: 0
  frete: number;                   // Padrão: 0
  outras_taxas: number;            // Padrão: 0
  valor_total: number;             // Calculado
  observacoes_internas?: string;
  observacoes_cliente?: string;
  created_at: Date;
  updated_at: Date;
  cliente?: Cliente;
  fornecedor?: Fornecedor;
  transportadora?: Transportadora;
  usuario_criacao?: Usuario;
  usuario_atualizacao?: Usuario;
  itens: PedidoItem[];
}
```

#### PedidoItem
```typescript
{
  id: number;
  pedido_id: number;
  produto_id: number;
  quantidade: number;
  preco_unitario: number;
  desconto: number;               // Padrão: 0
  subtotal: number;                // Calculado: (preco_unitario * quantidade) - desconto
  produto: Produto;
}
```

### Endpoints

#### 1. Criar Pedido

**POST** `/pedidos`

**Permissões:** ADMIN, GERENTE, VENDEDOR

**Request Body:** CreatePedidoDto

**Response (201):** Pedido

#### 2. Listar Pedidos

**GET** `/pedidos`

**Permissões:** ADMIN, GERENTE, VENDEDOR

**Query Parameters:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | number | Buscar pedido específico por ID |
| `tipo` | TipoPedido | Filtro por tipo |
| `status` | StatusPedido | Filtro por status |
| `cliente_id` | number | Filtro por cliente |
| `cliente_nome` | string | Filtro por nome do cliente |
| `fornecedor_id` | number | Filtro por fornecedor |
| `fornecedor_nome` | string | Filtro por nome do fornecedor |
| `page` | number | Número da página |
| `limit` | number | Itens por página |

**Response (200):** Array<Pedido> ou Pedido (se `id` fornecido)

#### 3. Buscar Pedido por ID

**GET** `/pedidos/:id`

**Permissões:** ADMIN, GERENTE, VENDEDOR

**Parâmetros:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | number | ID do pedido |

**Response (200):** Pedido

#### 4. Atualizar Pedido

**PATCH** `/pedidos/:id`

**Permissões:** ADMIN, GERENTE, VENDEDOR

**Parâmetros:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | number | ID do pedido |

**Request Body:** UpdatePedidoDto

**Nota:** O campo `usuario_atualizacao_id` é preenchido automaticamente do token JWT.

**Response (200):** Pedido

#### 5. Cancelar Pedido

**PATCH** `/pedidos/:id/cancelar`

**Permissões:** ADMIN, GERENTE

**Parâmetros:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | number | ID do pedido |

**Response (200):** Pedido (status: CANCELADO)

---

## 💰 Contas Financeiras

### Base URL
```
/api/v1/contas-financeiras
```

### Enums

#### TipoConta
```typescript
enum TipoConta {
  PAGAR = 'PAGAR',        // Conta a pagar
  RECEBER = 'RECEBER',    // Conta a receber
}
```

#### StatusConta
```typescript
enum StatusConta {
  PENDENTE = 'PENDENTE',
  PAGO = 'PAGO',
  PARCIALMENTE_PAGO = 'PARCIALMENTE_PAGO',
  VENCIDO = 'VENCIDO',
  CANCELADO = 'CANCELADO',
}
```

### DTOs

#### CreateContaFinanceiraDto
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `tipo` | TipoConta | Sim | Tipo de conta (PAGAR ou RECEBER) |
| `pedido_id` | number | Não | ID do pedido relacionado |
| `cliente_id` | number | Não* | ID do cliente (obrigatório para RECEBER) |
| `fornecedor_id` | number | Não* | ID do fornecedor (obrigatório para PAGAR) |
| `descricao` | string | Sim | Descrição da conta (3-255 caracteres) |
| `valor_original` | number | Sim | Valor original da conta (deve ser > 0.01) |
| `valor_pago` | number | Não | Valor já pago (padrão: 0, deve ser >= 0) |
| `data_emissao` | string | Sim | Data de emissão (formato ISO: YYYY-MM-DD) |
| `data_vencimento` | string | Sim | Data de vencimento (formato ISO: YYYY-MM-DD) |
| `data_pagamento` | string | Não | Data de pagamento (formato ISO: YYYY-MM-DD) |
| `status` | StatusConta | Não | Status (padrão: PENDENTE) |
| `forma_pagamento` | FormaPagamento | Não | Forma de pagamento |
| `numero_parcela` | number | Não | Número da parcela (>= 1) |
| `total_parcelas` | number | Não | Total de parcelas (>= 1) |
| `parcela_texto` | string | Não | Texto da parcela (ex: "1/3", máximo 20 caracteres) |
| `observacoes` | string | Não | Observações |

#### UpdateContaFinanceiraDto
Todos os campos são opcionais. Apenas os campos enviados serão atualizados.

### Entity

#### ContaFinanceira
```typescript
{
  id: number;
  numero_conta: string;            // Único, formato: REC-2025-00001 ou PAG-2025-00001
  tipo: TipoConta;
  pedido_id?: number;
  cliente_id?: number;
  fornecedor_id?: number;
  descricao: string;
  valor_original: number;
  valor_pago: number;              // Padrão: 0
  valor_restante: number;           // Calculado: valor_original - valor_pago
  data_emissao: Date;
  data_vencimento: Date;
  data_pagamento?: Date;
  status: StatusConta;
  forma_pagamento?: FormaPagamento;
  numero_parcela?: number;
  total_parcelas?: number;
  parcela_texto?: string;
  observacoes?: string;
  created_at: Date;
  updated_at: Date;
  cliente?: Cliente;
  fornecedor?: Fornecedor;
  pedido?: Pedido;
}
```

### Endpoints

#### 1. Criar Conta Financeira

**POST** `/contas-financeiras`

**Permissões:** ADMIN, GERENTE, FINANCEIRO

**Request Body:** CreateContaFinanceiraDto

**Response (201):** ContaFinanceira

#### 2. Listar Contas Financeiras

**GET** `/contas-financeiras`

**Permissões:** ADMIN, GERENTE, FINANCEIRO

**Query Parameters:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `tipo` | TipoConta | Filtro por tipo |
| `status` | StatusConta | Filtro por status |
| `cliente_id` | number | Filtro por cliente |
| `fornecedor_id` | number | Filtro por fornecedor |
| `page` | number | Número da página |
| `limit` | number | Itens por página |

**Response (200):** Array<ContaFinanceira>

#### 3. Dashboard - Resumo Contas a Receber

**GET** `/contas-financeiras/dashboard/receber`

**Permissões:** ADMIN, GERENTE, FINANCEIRO

**Response (200):**
```json
{
  "total": 100000.00,
  "pago": 60000.00,
  "pendente": 30000.00,
  "vencido": 10000.00
}
```

#### 4. Dashboard - Resumo Contas a Pagar

**GET** `/contas-financeiras/dashboard/pagar`

**Permissões:** ADMIN, GERENTE, FINANCEIRO

**Response (200):**
```json
{
  "total": 50000.00,
  "pago": 30000.00,
  "pendente": 15000.00,
  "vencido": 5000.00
}
```

#### 5. Dashboard - Resumo Financeiro Geral

**GET** `/contas-financeiras/dashboard/resumo`

**Permissões:** ADMIN, GERENTE, FINANCEIRO

**Response (200):**
```json
{
  "contasReceber": {
    "total": 100000.00,
    "pago": 60000.00,
    "pendente": 30000.00,
    "vencido": 10000.00
  },
  "contasPagar": {
    "total": 50000.00,
    "pago": 30000.00,
    "pendente": 15000.00,
    "vencido": 5000.00
  }
}
```

#### 6. Sincronizar Contas de Pedidos Existentes

**POST** `/contas-financeiras/sync/pedidos`

**Permissões:** ADMIN

**Response (200):**
```json
{
  "mensagem": "Contas sincronizadas com sucesso",
  "contasCriadas": 10
}
```

#### 7. Buscar Contas a Receber por Cliente

**GET** `/contas-financeiras/receber/cliente/:clienteId`

**Permissões:** ADMIN, GERENTE, FINANCEIRO

**Parâmetros:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `clienteId` | number | ID do cliente |

**Response (200):** Array<ContaFinanceira>

#### 8. Buscar Contas a Pagar por Fornecedor

**GET** `/contas-financeiras/pagar/fornecedor/:fornecedorId`

**Permissões:** ADMIN, GERENTE, FINANCEIRO

**Parâmetros:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `fornecedorId` | number | ID do fornecedor |

**Response (200):** Array<ContaFinanceira>

#### 9. Buscar Conta Financeira por ID

**GET** `/contas-financeiras/:id`

**Permissões:** ADMIN, GERENTE, FINANCEIRO

**Parâmetros:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | number | ID da conta financeira |

**Response (200):** ContaFinanceira

#### 10. Atualizar Conta Financeira

**PATCH** `/contas-financeiras/:id`

**Permissões:** ADMIN, GERENTE, FINANCEIRO

**Parâmetros:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | number | ID da conta financeira |

**Request Body:** UpdateContaFinanceiraDto

**Response (200):** ContaFinanceira

#### 11. Deletar Conta Financeira

**DELETE** `/contas-financeiras/:id`

**Permissões:** ADMIN, GERENTE, FINANCEIRO

**Parâmetros:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | number | ID da conta financeira |

**Response (200):**
```json
{
  "mensagem": "Conta financeira removida com sucesso"
}
```

---

## 🚚 Transportadoras

### Base URL
```
/api/v1/transportadoras
```

### DTOs

#### CreateTransportadoraDto
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `nome` | string | Sim | Nome da transportadora (3-255 caracteres) |
| `nome_fantasia` | string | Não | Nome fantasia (máximo 255 caracteres) |
| `cnpj` | string | Não | CNPJ (aceita formatado ou apenas números, 14 dígitos) |
| `inscricao_estadual` | string | Não | Inscrição estadual (máximo 50 caracteres) |
| `telefone` | string | Não | Telefone (máximo 20 caracteres) |
| `email` | string | Não | Email (formato válido) |
| `cep` | string | Não | CEP (8-10 caracteres) |
| `logradouro` | string | Não | Logradouro (máximo 255 caracteres) |
| `numero` | string | Não | Número (máximo 20 caracteres) |
| `complemento` | string | Não | Complemento (máximo 100 caracteres) |
| `bairro` | string | Não | Bairro (máximo 100 caracteres) |
| `cidade` | string | Não | Cidade (máximo 100 caracteres) |
| `estado` | string | Não | Estado/UF (exatamente 2 caracteres) |
| `ativo` | boolean | Não | Indica se está ativa (padrão: true) |
| `observacoes` | string | Não | Observações |

#### UpdateTransportadoraDto
Todos os campos são opcionais. Apenas os campos enviados serão atualizados.

### Entity

#### Transportadora
```typescript
{
  id: number;
  nome: string;
  nome_fantasia?: string;
  cnpj?: string;                   // Único (quando fornecido)
  inscricao_estadual?: string;
  telefone?: string;
  email?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  ativo: boolean;                  // Padrão: true
  observacoes?: string;
  created_at: Date;
  updated_at: Date;
  pedidos: Pedido[];
}
```

### Endpoints

#### 1. Criar Transportadora

**POST** `/transportadoras`

**Permissões:** ADMIN, GERENTE

**Request Body:** CreateTransportadoraDto

**Response (201):** Transportadora

#### 2. Listar Transportadoras

**GET** `/transportadoras`

**Permissões:** Autenticado

**Response (200):** Array<Transportadora>

#### 3. Buscar Transportadora por ID

**GET** `/transportadoras/:id`

**Permissões:** Autenticado

**Parâmetros:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | number | ID da transportadora |

**Response (200):** Transportadora

#### 4. Atualizar Transportadora

**PATCH** `/transportadoras/:id`

**Permissões:** ADMIN, GERENTE

**Parâmetros:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | number | ID da transportadora |

**Request Body:** UpdateTransportadoraDto

**Response (200):** Transportadora

#### 5. Deletar Transportadora

**DELETE** `/transportadoras/:id`

**Permissões:** ADMIN, GERENTE

**Parâmetros:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | number | ID da transportadora |

**Response (200):**
```json
{
  "mensagem": "Transportadora removida com sucesso"
}
```

---

## 📞 Contatos

### Base URL
```
/api/v1/contatos
```

### Enums

#### StatusContato
```typescript
enum StatusContato {
  ATIVO = 'ATIVO',
  INATIVO = 'INATIVO',
}
```

### DTOs

#### CreateContatoDto
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `telefone` | string | Sim* | Telefone principal (obrigatório para criação) |
| `email` | string | Não | Email (formato válido) |
| `nomeContato` ou `nome_contato` | string | Não | Nome do contato (2-255 caracteres) |
| `outroTelefone` ou `outro_telefone` | string | Não | Telefone secundário |
| `nomeOutroTelefone` ou `nome_outro_telefone` | string | Não | Nome/descrição do outro telefone (2-255 caracteres) |
| `observacao` | string | Não | Observações (máximo 500 caracteres) |
| `ativo` | boolean | Não | Indica se o contato está ativo (padrão: true) |
| `clienteId` | number | Não | ID do cliente |
| `fornecedorId` | number | Não | ID do fornecedor |
| `id` | number | Não | ID do contato (usado para atualização) |

**Nota:** Aceita tanto `nomeContato` (camelCase) quanto `nome_contato` (snake_case). O mesmo para `outroTelefone` e `nomeOutroTelefone`.

#### UpdateContatoDto
Todos os campos são opcionais. Apenas os campos enviados serão atualizados.

### Entity

#### Contato
```typescript
{
  id: number;
  telefone: string;
  email?: string;
  nomeContato?: string;
  outroTelefone?: string;
  nomeOutroTelefone?: string;
  observacao?: string;
  ativo: boolean;
  clienteId?: number;
  fornecedorId?: number;
  cliente?: Cliente;
  fornecedor?: Fornecedor;
}
```

### Endpoints

#### 1. Criar Contato

**POST** `/contatos`

**Permissões:** ADMIN, GERENTE

**Request Body:** CreateContatoDto

**Response (201):** Contato

#### 2. Listar Contatos

**GET** `/contatos`

**Permissões:** Autenticado

**Response (200):** Array<Contato>

#### 3. Buscar Contato por ID

**GET** `/contatos/:id`

**Permissões:** Autenticado

**Parâmetros:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | number | ID do contato |

**Response (200):** Contato

#### 4. Atualizar Contato

**PATCH** `/contatos/:id`

**Permissões:** ADMIN, GERENTE

**Parâmetros:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | number | ID do contato |

**Request Body:** UpdateContatoDto

**Response (200):** Contato

#### 5. Deletar Contato

**DELETE** `/contatos/:id`

**Permissões:** ADMIN, GERENTE

**Parâmetros:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | number | ID do contato |

**Response (200):**
```json
{
  "mensagem": "Contato removido com sucesso"
}
```

---

## 🏠 Endereços

### Base URL
```
/api/v1/enderecos
```

### DTOs

#### CreateEnderecoDto
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `cep` | string | Não* | CEP (obrigatório para criação, formato: 00000-000 ou 00000000) |
| `logradouro` | string | Não* | Logradouro (obrigatório para criação) |
| `numero` | string | Não* | Número (obrigatório para criação, máximo 10 caracteres) |
| `complemento` | string | Não | Complemento (máximo 50 caracteres) |
| `bairro` | string | Não* | Bairro (obrigatório para criação) |
| `cidade` | string | Não* | Cidade (obrigatório para criação) |
| `estado` | string | Não* | Estado/UF (obrigatório para criação, 2 caracteres) |
| `referencia` | string | Não | Referência (máximo 100 caracteres) |
| `clienteId` | number | Não | ID do cliente |
| `fornecedorId` | number | Não | ID do fornecedor |
| `id` | number | Não | ID do endereço (usado para atualização) |

#### UpdateEnderecoDto
Todos os campos são opcionais. Apenas os campos enviados serão atualizados.

### Entity

#### Endereco
```typescript
{
  id: number;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  referencia?: string;
  clienteId?: number;
  fornecedorId?: number;
  cliente?: Cliente;
  fornecedor?: Fornecedor;
}
```

### Endpoints

#### 1. Criar Endereço

**POST** `/enderecos`

**Permissões:** ADMIN, GERENTE

**Request Body:** CreateEnderecoDto

**Response (201):** Endereco

#### 2. Listar Endereços

**GET** `/enderecos`

**Permissões:** Autenticado

**Response (200):** Array<Endereco>

#### 3. Buscar Endereço por ID

**GET** `/enderecos/:id`

**Permissões:** Autenticado

**Parâmetros:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | number | ID do endereço |

**Response (200):** Endereco

#### 4. Atualizar Endereço

**PATCH** `/enderecos/:id`

**Permissões:** ADMIN, GERENTE

**Parâmetros:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | number | ID do endereço |

**Request Body:** UpdateEnderecoDto

**Response (200):** Endereco

#### 5. Deletar Endereço

**DELETE** `/enderecos/:id`

**Permissões:** ADMIN, GERENTE

**Parâmetros:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | number | ID do endereço |

**Response (200):**
```json
{
  "mensagem": "Endereço removido com sucesso"
}
```

---

## 🔔 Notificações

### Base URL
```
/api/v1/notificacoes
```

### Enums

#### TipoNotificacao
```typescript
enum TipoNotificacao {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
}
```

### DTOs

#### CreateNotificacaoDto
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `usuario_id` | string (UUID) | Sim | ID do usuário que receberá a notificação |
| `titulo` | string | Sim | Título da notificação |
| `mensagem` | string | Sim | Mensagem da notificação |
| `tipo` | TipoNotificacao | Sim | Tipo da notificação |
| `action_url` | string | Não | URL de ação (para navegação) |

### Entity

#### Notificacao
```typescript
{
  id: string;                    // UUID
  usuario_id: string;            // UUID
  titulo: string;
  mensagem: string;
  tipo: TipoNotificacao;         // Padrão: INFO
  lida: boolean;                 // Padrão: false
  action_url?: string;          // Máximo 500 caracteres
  criado_em: Date;
  atualizado_em: Date;
}
```

### Endpoints

#### 1. Listar Notificações

**GET** `/notificacoes`

**Permissões:** Autenticado

**Query Parameters:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `apenasNaoLidas` | boolean | Se `true`, retorna apenas notificações não lidas |

**Response (200):**
```json
{
  "data": [Notificacao],
  "total": 15,
  "unread": 8
}
```

#### 2. Marcar Notificação como Lida

**PATCH** `/notificacoes/:id/ler`

**Permissões:** Autenticado

**Parâmetros:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | string (UUID) | ID da notificação |

**Response (204):** Sem conteúdo

#### 3. Marcar Todas como Lidas

**PATCH** `/notificacoes/ler-todas`

**Permissões:** Autenticado

**Response (204):** Sem conteúdo

#### 4. Remover Notificação

**DELETE** `/notificacoes/:id`

**Permissões:** Autenticado

**Parâmetros:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | string (UUID) | ID da notificação |

**Response (204):** Sem conteúdo

#### 5. Remover Todas as Notificações

**DELETE** `/notificacoes`

**Permissões:** Autenticado

**Response (204):** Sem conteúdo

---

## 📊 Estoque

### Base URL
```
/api/v1/estoque
```

### Enums

#### TipoMovimentacaoEstoque
```typescript
enum TipoMovimentacaoEstoque {
  ENTRADA = 'ENTRADA',           // Entrada de estoque
  SAIDA = 'SAIDA',               // Saída de estoque
  AJUSTE = 'AJUSTE',             // Ajuste de estoque
  DEVOLUCAO = 'DEVOLUCAO',       // Devolução
  PERDA = 'PERDA',               // Perda de estoque
  TRANSFERENCIA = 'TRANSFERENCIA', // Transferência entre estoques
}
```

### DTOs

#### MovimentarEstoqueDto
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `tipo` | TipoMovimentacaoEstoque | Sim | Tipo de movimentação |
| `quantidade` | number | Sim | Quantidade (deve ser inteiro >= 1) |
| `observacao` | string | Não | Observação sobre a movimentação |
| `motivo` | string | Não | Motivo da movimentação |
| `documento_referencia` | string | Não | Documento de referência (ex: número do pedido) |

### Entity

#### MovimentacaoEstoque
```typescript
{
  id: number;
  produtoId: number;
  tipo: TipoMovimentacaoEstoque;
  quantidade: number;            // Inteiro
  estoque_anterior: number;      // Inteiro
  estoque_atual: number;         // Inteiro
  observacao?: string;
  motivo?: string;
  documento_referencia?: string; // Máximo 100 caracteres
  usuario_id: string;            // UUID do usuário que fez a movimentação
  criado_em: Date;
  produto: Produto;
  usuario: Usuario;
}
```

### Endpoints

#### 1. Movimentar Estoque de um Produto

**POST** `/estoque/produtos/:id/movimentar`

**Permissões:** ADMIN, GERENTE, VENDEDOR

**Parâmetros:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | number | ID do produto |

**Request Body:** MovimentarEstoqueDto

**Response (201):** MovimentacaoEstoque

#### 2. Obter Histórico de Movimentações de um Produto

**GET** `/estoque/produtos/:id/historico`

**Permissões:** ADMIN, GERENTE, VENDEDOR

**Parâmetros:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | number | ID do produto |

**Query Parameters:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `page` | number | Número da página (padrão: 1) |
| `limit` | number | Itens por página (padrão: 20) |

**Response (200):** Array<MovimentacaoEstoque>

#### 3. Obter Produtos com Estoque Baixo

**GET** `/estoque/baixo`

**Permissões:** ADMIN, GERENTE, VENDEDOR

**Query Parameters:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `page` | number | Número da página (padrão: 1) |
| `limit` | number | Itens por página (padrão: 20) |

**Response (200):** Array<Produto>

#### 4. Obter Produtos com Estoque Crítico

**GET** `/estoque/critico`

**Permissões:** ADMIN, GERENTE, VENDEDOR

**Query Parameters:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `page` | number | Número da página (padrão: 1) |
| `limit` | number | Itens por página (padrão: 20) |

**Response (200):** Array<Produto>

---

## ⚙️ Configurações

### Base URL
```
/api/v1/configuracoes
```

### DTOs

#### UpdateConfiguracaoDto
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `chave` | string | Não | Chave da configuração |
| `valor` | string | Não | Valor da configuração |
| `descricao` | string | Não | Descrição da configuração |

### Endpoints

#### 1. Obter Configurações

**GET** `/configuracoes`

**Permissões:** ADMIN, GERENTE

**Response (200):** Array<Configuracao>

#### 2. Atualizar Configurações

**PUT** `/configuracoes`

**Permissões:** ADMIN

**Request Body:** UpdateConfiguracaoDto

**Response (200):** Configuracao

---

## 📝 Notas Importantes

### 1. Atualização de Endereços e Contatos em Clientes/Fornecedores

Ao atualizar um cliente ou fornecedor que possui endereços ou contatos:

- **Para atualizar um endereço/contato existente:** Sempre inclua o campo `id` no objeto
- **Para criar um novo endereço/contato:** Não inclua o campo `id` ou envie `id` como `null`/`undefined`
- **Para manter um endereço/contato inalterado:** Não inclua no array enviado

**Exemplo de atualização de fornecedor com endereços:**
```json
{
  "nome_fantasia": "Fornecedor ABC",
  "enderecos": [
    {
      "id": 1,
      "cep": "01310-100",
      "logradouro": "Avenida Paulista",
      "numero": "1000"
    },
    {
      "cep": "01310-200",
      "logradouro": "Rua Nova",
      "numero": "2000",
      "bairro": "Centro",
      "cidade": "São Paulo",
      "estado": "SP"
    }
  ]
}
```

No exemplo acima:
- O primeiro endereço (com `id: 1`) será **atualizado**
- O segundo endereço (sem `id`) será **criado**

### 2. Validação de Campos

- Campos obrigatórios marcados com `*` devem sempre ser fornecidos
- Campos opcionais podem ser omitidos ou enviados como `null`
- Strings vazias (`""`) em campos obrigatórios serão rejeitadas
- Strings vazias em campos opcionais serão convertidas para `null`

### 3. Formato de Datas

Todas as datas devem ser enviadas no formato ISO 8601: `YYYY-MM-DD`

**Exemplo:** `2025-12-31`

### 4. Formato de CPF/CNPJ

O sistema aceita CPF/CNPJ formatado ou apenas números:
- Formatado: `123.456.789-00` ou `12.345.678/0001-90`
- Apenas números: `12345678900` ou `12345678000190`

### 5. Formato de Telefone

O sistema aceita telefone nos formatos:
- `(11) 99999-9999`
- `1199999-9999`
- `11999999999`

### 6. Formato de CEP

O sistema aceita CEP nos formatos:
- `01310-100`
- `01310100`

### 7. Paginação

A maioria dos endpoints de listagem suporta paginação:
- `page`: Número da página (padrão: 1)
- `limit`: Itens por página (padrão: 15)

**Exemplo:**
```
GET /api/v1/clientes?page=2&limit=20
```

### 8. Tratamento de Erros

A API retorna erros no seguinte formato:

```json
{
  "statusCode": 400,
  "message": ["Campo obrigatório não fornecido"],
  "error": "Bad Request"
}
```

Para erros de validação, o campo `message` pode ser um array de mensagens de erro.

---

## 🔗 Links Úteis

- **Swagger UI:** `/api/docs` (disponível em desenvolvimento ou se `ENABLE_SWAGGER=true`)
- **Health Check:** `GET /` (retorna "Hello World!")

---

**Última atualização:** Dezembro 2024

