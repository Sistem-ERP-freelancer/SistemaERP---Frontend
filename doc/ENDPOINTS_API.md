# 📡 Documentação Completa de Endpoints da API

**Base URL:** `/api/v1`  
**Autenticação:** Bearer Token (JWT) - exceto onde indicado

---

## 📋 Índice

1. [Autenticação e Usuários](#autenticação-e-usuários)
2. [Tenants](#tenants)
3. [Clientes](#clientes)
4. [Fornecedores](#fornecedores)
5. [Produtos](#produtos)
6. [Categorias](#categorias)
7. [Pedidos](#pedidos)
8. [Contas Financeiras](#contas-financeiras)
9. [Transportadoras](#transportadoras)
10. [Estoque](#estoque)
11. [Contatos](#contatos)
12. [Endereços](#endereços)
13. [Notificações](#notificações)
14. [Configurações](#configurações)
15. [Sistema](#sistema)

---

## 🔐 Autenticação e Usuários

### POST `/api/v1/usuarios/login`
**Público** - Não requer autenticação

Login de usuário.

**Body:**
```json
{
  "email": "string",
  "senha": "string",
  "tenant_codigo": "string" // opcional
}
```

**Response:**
```json
{
  "access_token": "string",
  "user": {
    "id": "uuid",
    "email": "string",
    "nome": "string",
    "role": "ADMIN | GERENTE | VENDEDOR | FINANCEIRO",
    "tenant_id": "uuid",
    "schema_name": "string"
  }
}
```

---

### POST `/api/v1/usuarios/logout`
**Autenticado**

Logout do usuário.

**Response:**
```json
{
  "message": "Logout realizado com sucesso",
  "success": true
}
```

---

### POST `/api/v1/usuarios`
**Roles:** ADMIN, GERENTE

Criar novo usuário.

**Body:**
```json
{
  "nome": "string",
  "email": "string",
  "senha": "string",
  "role": "ADMIN | GERENTE | VENDEDOR | FINANCEIRO"
}
```

---

### GET `/api/v1/usuarios`
**Roles:** ADMIN, GERENTE

Listar todos os usuários do tenant.

---

### GET `/api/v1/usuarios/:id`
**Autenticado**

Buscar usuário por ID.

---

### PUT `/api/v1/usuarios/:id`
**Roles:** ADMIN, GERENTE

Atualizar usuário.

**Body:**
```json
{
  "nome": "string",
  "email": "string",
  "senha": "string",
  "role": "ADMIN | GERENTE | VENDEDOR | FINANCEIRO"
}
```

---

### PUT `/api/v1/usuarios/:id/ativar`
**Roles:** ADMIN, GERENTE

Ativar usuário.

---

### PUT `/api/v1/usuarios/:id/desativar`
**Roles:** ADMIN, GERENTE

Desativar usuário.

---

### DELETE `/api/v1/usuarios/:id`
**Roles:** ADMIN, GERENTE

Remover usuário.

---

## 🏢 Tenants

### POST `/api/v1/tenants`
**Role:** SUPER_ADMIN

Criar novo tenant.

**Body:**
```json
{
  "codigo": "string",
  "nome": "string",
  "cnpj": "string",
  "email": "string",
  "telefone": "string",
  "subdominio": "string"
}
```

---

### GET `/api/v1/tenants`
**Role:** SUPER_ADMIN

Listar todos os tenants.

---

### GET `/api/v1/tenants/:id`
**Role:** SUPER_ADMIN

Buscar tenant por ID.

---

### PUT `/api/v1/tenants/:id`
**Role:** SUPER_ADMIN

Atualizar tenant.

---

### PUT `/api/v1/tenants/:id/bloquear`
**Role:** SUPER_ADMIN

Bloquear tenant (status: SUSPENSO).

---

### PUT `/api/v1/tenants/:id/desbloquear`
**Role:** SUPER_ADMIN

Desbloquear tenant (status: ATIVO).

---

### PUT `/api/v1/tenants/:id/ativar`
**Role:** SUPER_ADMIN

Ativar tenant.

---

### PUT `/api/v1/tenants/:id/desativar`
**Role:** SUPER_ADMIN

Desativar tenant.

---

### GET `/api/v1/tenant/me`
**Roles:** ADMIN, GERENTE

Obter informações do tenant atual.

**Response:**
```json
{
  "id": "uuid",
  "codigo": "string",
  "nome": "string",
  "cnpj": "string",
  "email": "string",
  "telefone": "string",
  "subdominio": "string",
  "status": "ATIVO | INATIVO | SUSPENSO | TRIAL",
  "data_expiracao": "date",
  "configuracoes": {},
  "data_criacao": "datetime",
  "updated_at": "datetime"
}
```

---

### PUT `/api/v1/tenant/me`
**Role:** ADMIN

Atualizar informações do tenant atual.

**Body:**
```json
{
  "nome": "string",
  "cnpj": "string",
  "email": "string",
  "telefone": "string"
}
```

---

## 👥 Clientes

### POST `/api/v1/clientes`
**Autenticado**

Criar novo cliente.

**Body:**
```json
{
  "nome": "string",
  "tipo_pessoa": "PESSOA_FISICA | PESSOA_JURIDICA",
  "documento": "string (CPF/CNPJ - aceita formatado ou apenas números)",
  "status_cliente": "ATIVO | INATIVO | BLOQUEADO | INADIMPLENTE",
  "enderecos": [
    {
      "cep": "string",
      "logradouro": "string",
      "numero": "string",
      "complemento": "string",
      "bairro": "string",
      "cidade": "string",
      "estado": "string",
      "referencia": "string"
    }
  ],
  "contatos": [
    {
      "telefone": "string",
      "email": "string",
      "nome_contato": "string",
      "outro_telefone": "string",
      "nome_outro_telefone": "string",
      "observacao": "string"
    }
  ]
}
```

---

### GET `/api/v1/clientes`
**Autenticado**

Listar clientes com paginação e filtros.

**Query Params:**
- `page` (number, default: 1)
- `limit` (number, default: 15)
- `status` (string: "ATIVO" | "INATIVO")
- `tipo` (string: "FISICA" | "JURIDICA" | "PESSOA_FISICA" | "PESSOA_JURIDICA")
- `busca` (string)

---

### GET `/api/v1/clientes/sugestoes`
**Autenticado**

Buscar sugestões de clientes (autocomplete).

**Query Params:**
- `termo` (string, obrigatório)
- `limit` (number, default: 10)
- `apenasAtivos` (string: "true" | "false", default: "true")

---

### GET `/api/v1/clientes/buscar-por-nome`
**Autenticado**

Buscar clientes por nome.

**Query Params:**
- `nome` (string, obrigatório)

---

### GET `/api/v1/clientes/buscar-avancado`
**Autenticado**

Busca avançada com múltiplos filtros.

**Query Params:**
- `termo` (string)
- `tipoPessoa` (enum)
- `statusCliente` (enum)
- `cidade` (string)
- `estado` (string)
- `page` (number, default: 1)
- `limit` (number, default: 15)

---

### GET `/api/v1/clientes/tipo/:tipoPessoa`
**Autenticado**

Buscar clientes por tipo de pessoa.

**Path Params:**
- `tipoPessoa` (enum: PESSOA_FISICA | PESSOA_JURIDICA)

---

### GET `/api/v1/clientes/status/:statusCliente`
**Autenticado**

Buscar clientes por status.

**Path Params:**
- `statusCliente` (enum)

---

### GET `/api/v1/clientes/:id`
**Autenticado**

Buscar cliente por ID.

---

### PATCH `/api/v1/clientes/:id`
**Roles:** ADMIN, GERENTE

Atualizar cliente.

---

### DELETE `/api/v1/clientes/:id`
**Roles:** ADMIN, GERENTE

Deletar cliente.

---

## 🏭 Fornecedores

### POST `/api/v1/fornecedor`
**Roles:** ADMIN, GERENTE

Criar novo fornecedor.

**Body:**
```json
{
  "nome_fantasia": "string",
  "nome_razao": "string",
  "tipoFornecedor": "PESSOA_FISICA | PESSOA_JURIDICA",
  "cpf_cnpj": "string",
  "inscricao_estadual": "string",
  "enderecos": [],
  "contato": []
}
```

---

### GET `/api/v1/fornecedor`
**Autenticado**

Listar fornecedores com paginação e filtros.

**Query Params:**
- `page` (number, default: 1)
- `limit` (number, default: 15)
- `tipoFornecedor` (enum)
- `statusFornecedor` (enum)

---

### GET `/api/v1/fornecedor/estatisticas`
**Autenticado**

Obter estatísticas de fornecedores.

---

### GET `/api/v1/fornecedor/buscar`
**Autenticado**

Buscar por nome ou CNPJ.

**Query Params:**
- `termo` (string, obrigatório)
- `page` (number, default: 1)
- `limit` (number, default: 15)

---

### GET `/api/v1/fornecedor/buscar-avancado`
**Autenticado**

Busca avançada.

**Query Params:**
- `termo` (string)
- `tipoFornecedor` (enum)
- `statusFornecedor` (enum)
- `cidade` (string)
- `estado` (string)
- `telefone` (string)
- `email` (string)
- `nomeContato` (string)
- `page` (number, default: 1)
- `limit` (number, default: 15)

---

### GET `/api/v1/fornecedor/nome-fantasia`
**Autenticado**

Buscar por nome fantasia.

**Query Params:**
- `nome` (string, obrigatório)
- `page` (string, default: "1")
- `limit` (string, default: "10")

---

### GET `/api/v1/fornecedor/razao-social`
**Autenticado**

Buscar por razão social.

**Query Params:**
- `nome` (string, obrigatório)
- `page` (string, default: "1")
- `limit` (string, default: "10")

---

### GET `/api/v1/fornecedor/tipo/:tipoFornecedor`
**Autenticado**

Buscar por tipo.

---

### GET `/api/v1/fornecedor/status/:statusFornecedor`
**Autenticado**

Buscar por status.

---

### GET `/api/v1/fornecedor/:id`
**Autenticado**

Buscar fornecedor por ID.

---

### PATCH `/api/v1/fornecedor/:id`
**Roles:** ADMIN, GERENTE

Atualizar fornecedor.

---

### DELETE `/api/v1/fornecedor/:id`
**Roles:** ADMIN, GERENTE

Deletar fornecedor.

---

## 📦 Produtos

### POST `/api/v1/produtos`
**Roles:** ADMIN, GERENTE, VENDEDOR

Criar novo produto.

**Body:**
```json
{
  "nome": "string",
  "descricao": "string",
  "sku": "string",
  "preco_custo": "number",
  "preco_venda": "number",
  "preco_promocional": "number",
  "estoque_atual": "number",
  "estoque_minimo": "number",
  "estoque_maximo": "number",
  "localizacao": "string",
  "statusProduto": "ATIVO | INATIVO",
  "unidade_medida": "UN | KG | LT | MT | etc",
  "data_validade": "date",
  "ncm": "string",
  "cest": "string",
  "cfop": "string",
  "peso": "number",
  "altura": "number",
  "largura": "number",
  "categoriaId": "number",
  "fornecedorId": "number"
}
```

---

### GET `/api/v1/produtos`
**Autenticado**

Listar produtos com paginação e status.

**Query Params:**
- `page` (number, default: 1)
- `limit` (number, default: 15)
- `statusProduto` (enum)

---

### GET `/api/v1/produtos/sugestoes`
**Autenticado**

Buscar sugestões de produtos (autocomplete).

**Query Params:**
- `termo` (string, obrigatório)
- `limit` (number, default: 10)
- `apenasAtivos` (string: "true" | "false", default: "true")

---

### GET `/api/v1/produtos/buscar-avancado`
**Autenticado**

Busca avançada de produtos.

**Query Params:**
- `termo` (string)
- `categoriaId` (number)
- `fornecedorId` (number)
- `nomeFornecedor` (string)
- `statusProduto` (enum)
- `unidade_medida` (enum)
- `precoMin` (number)
- `precoMax` (number)
- `estoqueMin` (number)
- `estoqueMax` (number)
- `validadeInicial` (date)
- `validadeFinal` (date)
- `page` (number, default: 1)
- `limit` (number, default: 15)

---

### GET `/api/v1/produtos/categoria/:categoriaId`
**Autenticado**

Buscar produtos por categoria.

**Query Params:**
- `page` (number, default: 1)
- `limit` (number, default: 15)

---

### GET `/api/v1/produtos/fornecedor/:fornecedorId`
**Autenticado**

Buscar produtos por fornecedor.

**Query Params:**
- `page` (number, default: 1)
- `limit` (number, default: 15)

---

### GET `/api/v1/produtos/ativos`
**Autenticado**

Buscar produtos ativos.

**Query Params:**
- `page` (number, default: 1)
- `limit` (number, default: 15)

---

### GET `/api/v1/produtos/preco`
**Autenticado**

Buscar produtos por faixa de preço.

**Query Params:**
- `min` (number)
- `max` (number)
- `page` (number, default: 1)
- `limit` (number, default: 15)

---

### GET `/api/v1/produtos/estoque`
**Autenticado**

Buscar produtos por estoque.

**Query Params:**
- `min` (number)
- `max` (number)
- `page` (number, default: 1)
- `limit` (number, default: 15)

---

### GET `/api/v1/produtos/validade`
**Autenticado**

Buscar produtos por validade.

**Query Params:**
- `inicio` (date)
- `fim` (date)
- `page` (number, default: 1)
- `limit` (number, default: 15)

---

### GET `/api/v1/produtos/:id`
**Autenticado**

Buscar produto por ID.

---

### PATCH `/api/v1/produtos/:id`
**Roles:** ADMIN, GERENTE, VENDEDOR

Atualizar produto.

---

### DELETE `/api/v1/produtos/:id`
**Roles:** ADMIN, GERENTE, VENDEDOR

Deletar produto.

---

## 📁 Categorias

### POST `/api/v1/categoria`
**Roles:** ADMIN, GERENTE

Criar nova categoria.

**Body:**
```json
{
  "nome": "string",
  "descricao": "string",
  "statusCategoria": "ATIVO | INATIVO"
}
```

---

### GET `/api/v1/categoria`
**Autenticado**

Listar categorias.

**Query Params:**
- `page` (number, default: 1)
- `limit` (number, default: 15)
- `statusCategoria` (enum)

---

### GET `/api/v1/categoria/sugestoes`
**Autenticado**

Buscar sugestões de categorias.

**Query Params:**
- `termo` (string, obrigatório)
- `limit` (number, default: 10)
- `apenasAtivos` (string: "true" | "false", default: "true")

---

### GET `/api/v1/categoria/buscar-avancado`
**Autenticado**

Busca avançada de categorias.

**Query Params:**
- `termo` (string)
- `statusCategoria` (enum)
- `page` (number, default: 1)
- `limit` (number, default: 15)

---

### GET `/api/v1/categoria/:id`
**Autenticado**

Buscar categoria por ID.

---

### PATCH `/api/v1/categoria/:id`
**Roles:** ADMIN, GERENTE

Atualizar categoria.

---

### DELETE `/api/v1/categoria/:id`
**Roles:** ADMIN, GERENTE

Deletar categoria.

---

## 🛒 Pedidos

### POST `/api/v1/pedidos`
**Roles:** ADMIN, GERENTE, VENDEDOR

Criar novo pedido.

**Body:**
```json
{
  "tipo": "VENDA | COMPRA",
  "cliente_id": "number",
  "fornecedor_id": "number",
  "transportadora_id": "number",
  "data_pedido": "date",
  "data_entrega_prevista": "date",
  "condicao_pagamento": "string",
  "forma_pagamento": "DINHEIRO | CARTAO | BOLETO | PIX | etc",
  "prazo_entrega_dias": "number",
  "subtotal": "number",
  "desconto_valor": "number",
  "desconto_percentual": "number",
  "frete": "number",
  "outras_taxas": "number",
  "observacoes_internas": "string",
  "observacoes_cliente": "string",
  "itens": [
    {
      "produto_id": "number",
      "quantidade": "number",
      "preco_unitario": "number",
      "desconto": "number"
    }
  ]
}
```

---

### GET `/api/v1/pedidos`
**Roles:** ADMIN, GERENTE, VENDEDOR

Listar pedidos com filtros ou buscar por ID.

**Query Params:**
- `id` (number) - Se fornecido, busca pedido por ID
- `tipo` (enum)
- `status` (enum)
- `cliente_id` (number)
- `cliente_nome` (string)
- `fornecedor_id` (number)
- `fornecedor_nome` (string)
- `page` (number, default: 1)
- `limit` (number, default: 15)

---

### GET `/api/v1/pedidos/:id`
**Roles:** ADMIN, GERENTE, VENDEDOR

Buscar pedido por ID.

---

### PATCH `/api/v1/pedidos/:id`
**Roles:** ADMIN, GERENTE, VENDEDOR

Atualizar pedido.

---

### PATCH `/api/v1/pedidos/:id/cancelar`
**Roles:** ADMIN, GERENTE

Cancelar pedido.

---

## 💰 Contas Financeiras

### POST `/api/v1/contas-financeiras`
**Roles:** ADMIN, GERENTE, FINANCEIRO

Criar conta financeira manual.

**Body:**
```json
{
  "tipo": "RECEBER | PAGAR",
  "pedido_id": "number",
  "cliente_id": "number",
  "fornecedor_id": "number",
  "descricao": "string",
  "valor_original": "number",
  "valor_pago": "number",
  "data_emissao": "date",
  "data_vencimento": "date",
  "forma_pagamento": "enum",
  "observacoes": "string"
}
```

---

### GET `/api/v1/contas-financeiras`
**Roles:** ADMIN, GERENTE, FINANCEIRO

Listar contas com filtros.

**Query Params:**
- `tipo` (enum: RECEBER | PAGAR)
- `status` (enum)
- `cliente_id` (number)
- `fornecedor_id` (number)
- `page` (number, default: 1)
- `limit` (number, default: 15)

---

### GET `/api/v1/contas-financeiras/dashboard/receber`
**Roles:** ADMIN, GERENTE, FINANCEIRO

Obter resumo de contas a receber.

---

### GET `/api/v1/contas-financeiras/dashboard/pagar`
**Roles:** ADMIN, GERENTE, FINANCEIRO

Obter resumo de contas a pagar.

---

### GET `/api/v1/contas-financeiras/dashboard/resumo`
**Roles:** ADMIN, GERENTE, FINANCEIRO

Obter resumo financeiro geral.

---

### POST `/api/v1/contas-financeiras/sync/pedidos`
**Role:** ADMIN

Sincronizar contas de pedidos existentes.

---

### GET `/api/v1/contas-financeiras/receber/cliente/:clienteId`
**Roles:** ADMIN, GERENTE, FINANCEIRO

Buscar contas a receber por cliente.

---

### GET `/api/v1/contas-financeiras/pagar/fornecedor/:fornecedorId`
**Roles:** ADMIN, GERENTE, FINANCEIRO

Buscar contas a pagar por fornecedor.

---

### GET `/api/v1/contas-financeiras/:id`
**Roles:** ADMIN, GERENTE, FINANCEIRO

Buscar conta por ID.

---

### PATCH `/api/v1/contas-financeiras/:id/cancelar`
**Roles:** ADMIN, GERENTE, FINANCEIRO

Cancelar conta.

---

### PATCH `/api/v1/contas-financeiras/:id`
**Roles:** ADMIN, GERENTE, FINANCEIRO

Atualizar conta.

---

### DELETE `/api/v1/contas-financeiras/:id`
**Roles:** ADMIN, GERENTE

Deletar conta.

---

## 🚚 Transportadoras

### POST `/api/v1/transportadoras`
**Roles:** ADMIN, GERENTE

Criar transportadora.

**Body:**
```json
{
  "nome": "string",
  "nome_fantasia": "string",
  "cnpj": "string",
  "inscricao_estadual": "string",
  "telefone": "string",
  "email": "string",
  "cep": "string",
  "logradouro": "string",
  "numero": "string",
  "complemento": "string",
  "bairro": "string",
  "cidade": "string",
  "estado": "string",
  "observacoes": "string"
}
```

---

### GET `/api/v1/transportadoras`
**Autenticado**

Listar transportadoras com paginação e busca.

**Query Params:**
- `page` (number, default: 1)
- `limit` (number, default: 15)
- `termo` (string)
- `apenasAtivos` (string: "true" | "false")

---

### GET `/api/v1/transportadoras/buscar`
**Autenticado**

Buscar por nome ou CNPJ.

**Query Params:**
- `termo` (string, obrigatório)

---

### GET `/api/v1/transportadoras/:identificador/pedidos`
**Autenticado**

Buscar pedidos por transportadora (ID ou Nome).

**Query Params:**
- `page` (number, default: 1)
- `limit` (number, default: 15)

---

### GET `/api/v1/transportadoras/:id`
**Autenticado**

Buscar transportadora por ID.

**Query Params:**
- `incluirPedidos` (string: "true" | "false")

---

### PATCH `/api/v1/transportadoras/:id`
**Roles:** ADMIN, GERENTE

Atualizar transportadora.

---

### DELETE `/api/v1/transportadoras/:id`
**Roles:** ADMIN, GERENTE

Deletar transportadora (soft delete).

---

### PATCH `/api/v1/transportadoras/:id/status`
**Roles:** ADMIN, GERENTE

Alterar status da transportadora (ativar/desativar).

**Query Params:**
- `ativo` (boolean, obrigatório)

---

## 📊 Estoque

### POST `/api/v1/estoque/produtos/:id/movimentar`
**Roles:** ADMIN, GERENTE, VENDEDOR

Movimentar estoque de um produto.

**Body:**
```json
{
  "tipo": "ENTRADA | SAIDA | AJUSTE",
  "quantidade": "number",
  "motivo": "string",
  "observacoes": "string"
}
```

---

### GET `/api/v1/estoque/produtos/:id/historico`
**Roles:** ADMIN, GERENTE, VENDEDOR

Obter histórico de movimentações de um produto.

**Query Params:**
- `page` (number, default: 1)
- `limit` (number, default: 20)

---

### GET `/api/v1/estoque/baixo`
**Roles:** ADMIN, GERENTE, VENDEDOR

Obter produtos com estoque baixo.

**Query Params:**
- `page` (number, default: 1)
- `limit` (number, default: 20)

---

### GET `/api/v1/estoque/critico`
**Roles:** ADMIN, GERENTE, VENDEDOR

Obter produtos com estoque crítico.

**Query Params:**
- `page` (number, default: 1)
- `limit` (number, default: 20)

---

## 📞 Contatos

### POST `/api/v1/contatos`
**Roles:** ADMIN, GERENTE

Criar contato.

**Body:**
```json
{
  "nomeContato": "string",
  "email": "string",
  "telefone": "string",
  "outroTelefone": "string",
  "nomeOutroTelefone": "string",
  "observacao": "string",
  "ativo": "boolean",
  "clienteId": "number",
  "fornecedorId": "number"
}
```

---

### GET `/api/v1/contatos`
**Autenticado**

Listar contatos.

**Query Params:**
- `page` (number, default: 1)
- `limit` (number, default: 15)
- `ativo` (boolean)

---

### GET `/api/v1/contatos/telefone/:telefone`
**Autenticado**

Buscar contato por telefone.

---

### GET `/api/v1/contatos/email/:email`
**Autenticado**

Buscar contato por email.

---

### GET `/api/v1/contatos/:id`
**Autenticado**

Buscar contato por ID.

---

### PATCH `/api/v1/contatos/:id`
**Roles:** ADMIN, GERENTE

Atualizar contato.

**Body:**
```json
{
  "nomeContato": "string",
  "email": "string",
  "telefone": "string",
  "outroTelefone": "string",
  "nomeOutroTelefone": "string",
  "observacao": "string",
  "ativo": "boolean"
}
```

**Nota:** Todos os campos são opcionais. Apenas os campos fornecidos serão atualizados. O sistema valida se email e telefone são únicos quando alterados.

---

### DELETE `/api/v1/contatos/:id`
**Roles:** ADMIN, GERENTE

Deletar contato.

---

## 📍 Endereços

### POST `/api/v1/endereco`
**Roles:** ADMIN, GERENTE

Criar endereço.

**Body:**
```json
{
  "cep": "string",
  "logradouro": "string",
  "numero": "string",
  "complemento": "string",
  "bairro": "string",
  "cidade": "string",
  "estado": "string",
  "referencia": "string",
  "clienteId": "number",
  "fornecedorId": "number"
}
```

---

### GET `/api/v1/endereco`
**Autenticado**

Listar todos os endereços.

**Query Params:**
- `page` (number, default: 1)
- `limit` (number, default: 15)

---

### GET `/api/v1/endereco/:id`
**Autenticado**

Buscar endereço por ID.

---

### GET `/api/v1/endereco/cep/:cep`
**Autenticado**

Buscar endereço por CEP.

---

### PATCH `/api/v1/endereco/:id`
**Roles:** ADMIN, GERENTE

Atualizar endereço.

**Query Params:**
- `clienteId` (number, opcional) - ID do cliente para validação de permissão

**Body:**
```json
{
  "cep": "string",
  "logradouro": "string",
  "numero": "string",
  "complemento": "string",
  "bairro": "string",
  "cidade": "string",
  "estado": "string",
  "referencia": "string"
}
```

**Nota:** Todos os campos são opcionais. Apenas os campos fornecidos serão atualizados.

---

### DELETE `/api/v1/endereco/:id`
**Roles:** ADMIN, GERENTE

Deletar endereço.

**Body:**
```json
{
  "clienteId": "number"
}
```

---

## 🔔 Notificações

### GET `/api/v1/notificacoes`
**Autenticado**

Listar todas as notificações do usuário autenticado.

**Query Params:**
- `apenasNaoLidas` (string: "true" | "false")

---

### PATCH `/api/v1/notificacoes/:id/ler`
**Autenticado**

Marcar notificação como lida.

---

### PATCH `/api/v1/notificacoes/ler-todas`
**Autenticado**

Marcar todas as notificações como lidas.

---

### DELETE `/api/v1/notificacoes/:id`
**Autenticado**

Remover uma notificação.

---

### DELETE `/api/v1/notificacoes`
**Autenticado**

Remover todas as notificações.

---

## ⚙️ Configurações

### GET `/api/v1/configuracoes`
**Roles:** ADMIN, GERENTE

Obter configurações do tenant atual.

---

### PUT `/api/v1/configuracoes`
**Role:** ADMIN

Atualizar configurações do tenant atual.

**Body:**
```json
{
  // Objeto JSON com configurações personalizadas
}
```

---

## 🔧 Sistema

### GET `/api/v1/`
**Público**

Endpoint de teste.

---

### POST `/api/v1/init-system`
**Público**

⚠️ **TEMPORÁRIO** - Inicializar schema system (remover após uso).

---

## 📝 Notas Importantes

1. **Autenticação:** A maioria dos endpoints requer autenticação via Bearer Token (JWT). O token deve ser enviado no header:
   ```
   Authorization: Bearer <token>
   ```

2. **Multi-tenant:** O sistema é multi-tenant. O `tenant_id` e `schema_name` são obtidos automaticamente do token JWT.

3. **Paginação:** A maioria dos endpoints de listagem suporta paginação via query params `page` e `limit`.

4. **Filtros:** Muitos endpoints suportam filtros opcionais via query params.

5. **Roles:** Alguns endpoints requerem roles específicas:
   - `SUPER_ADMIN`: Apenas para gerenciamento de tenants
   - `ADMIN`: Acesso completo ao tenant
   - `GERENTE`: Acesso gerencial
   - `VENDEDOR`: Acesso de vendas
   - `FINANCEIRO`: Acesso financeiro

6. **Formato de Datas:** Use formato ISO 8601 (YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ssZ).

7. **Formato de Documentos:** CPF/CNPJ podem ser enviados formatados ou apenas números. O sistema valida apenas o tamanho (CPF: 11 dígitos, CNPJ: 14 dígitos) e formato numérico, sem algoritmo de validação.

---

**Última atualização:** 2025-01-09  
**Versão da API:** 1.0

