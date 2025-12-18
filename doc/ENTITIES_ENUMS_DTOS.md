# 📚 Entities, Enums e DTOs - Documentação para Frontend

Este documento contém todas as estruturas de dados (Entities, Enums e DTOs) do sistema para uso no frontend.

---

## 📋 Índice

1. [Entities (Entidades)](#entities-entidades)
2. [Enums](#enums)
3. [DTOs (Data Transfer Objects)](#dtos-data-transfer-objects)

---

## 🗄️ Entities (Entidades)

### Cliente

```typescript
interface Cliente {
  id: number;
  nome: string;
  tipoPessoa: TipoPessoa; // 'PESSOA_FISICA' | 'PESSOA_JURIDICA'
  statusCliente: StatusCliente; // 'ATIVO' | 'INATIVO' | 'BLOQUEADO' | 'INADIMPLENTE'
  cpf_cnpj?: string; // CPF (11 dígitos) ou CNPJ (14 dígitos) - aceita formatado ou apenas números
  enderecos?: Endereco[];
  contato?: Contato[];
  criadoEm: Date;
  atualizadoEm: Date;
}
```

---

### Fornecedor

```typescript
interface Fornecedor {
  id: number;
  nome_fantasia?: string;
  nome_razao: string;
  tipoFornecedor: TipoFornecedor; // 'PESSOA_FISICA' | 'PESSOA_JURIDICA'
  statusFornecedor: StatusFornecedor; // 'ATIVO' | 'INATIVO' | 'BLOQUEADO'
  cpf_cnpj?: string;
  inscricao_estadual?: string;
  enderecos?: Endereco[];
  contato?: Contato[];
  produtos?: Produto[];
  criandoEm: Date;
  atualizadoEm: Date;
}
```

---

### Produto

```typescript
interface Produto {
  id: number;
  nome: string;
  descricao?: string;
  sku: string; // Único
  preco_custo: number;
  preco_venda: number;
  preco_promocional?: number;
  estoque_atual: number;
  estoque_minimo: number;
  estoque_maximo?: number;
  localizacao?: string;
  statusProduto: StatusProduto; // 'ATIVO' | 'INATIVO'
  unidade_medida: UnidadeMedida; // 'UN' | 'KG' | 'LT' | 'CX'
  data_validade?: Date;
  ncm?: string; // Nomenclatura Comum do Mercosul
  cest?: string; // Código Especificador da Substituição Tributária
  cfop?: string; // Código Fiscal de Operações e Prestações
  observacoes?: string;
  peso?: number;
  altura?: number;
  largura?: number;
  categoriaId?: number | null;
  categoria?: Categoria | null;
  fornecedorId?: number | null;
  fornecedor?: Fornecedor | null;
  criadoEm: Date;
  atualizadoEm: Date;
}
```

---

### Categoria

```typescript
interface Categoria {
  id: number;
  nome: string;
  descricao?: string;
  StatusCategoria: StatusCategoria; // 'ATIVO' | 'INATIVO'
  produtos?: Produto[];
  criandoEm: Date;
  atualizadoEm: Date;
}
```

---

### Pedido

```typescript
interface Pedido {
  id: number;
  numero_pedido: string; // Único, formato: VEND-2025-00001
  tipo: TipoPedido; // 'COMPRA' | 'VENDA'
  status: StatusPedido; // 'PENDENTE' | 'APROVADO' | 'EM_PROCESSAMENTO' | 'CONCLUIDO' | 'CANCELADO'
  cliente_id?: number;
  cliente?: Cliente;
  fornecedor_id?: number;
  fornecedor?: Fornecedor;
  transportadora_id?: number;
  transportadora?: Transportadora;
  usuario_criacao_id: string; // UUID
  usuario_criacao: Usuario;
  usuario_atualizacao_id?: string; // UUID
  usuario_atualizacao?: Usuario;
  data_pedido: Date;
  data_entrega_prevista?: Date;
  data_entrega_realizada?: Date;
  condicao_pagamento?: string;
  forma_pagamento?: FormaPagamento;
  prazo_entrega_dias?: number;
  subtotal: number;
  desconto_valor: number;
  desconto_percentual: number;
  frete: number;
  outras_taxas: number;
  valor_total: number;
  observacoes_internas?: string;
  observacoes_cliente?: string;
  itens: PedidoItem[];
  created_at: Date;
  updated_at: Date;
}
```

---

### PedidoItem

```typescript
interface PedidoItem {
  id: number;
  pedido_id: number;
  pedido: Pedido;
  produto_id: number;
  produto: Produto;
  quantidade: number;
  preco_unitario: number;
  desconto: number;
  subtotal: number;
}
```

---

### ContaFinanceira

```typescript
interface ContaFinanceira {
  id: number;
  numero_conta: string; // Único
  tipo: TipoConta; // 'PAGAR' | 'RECEBER'
  pedido_id?: number;
  pedido?: Pedido;
  cliente_id?: number;
  cliente?: Cliente;
  fornecedor_id?: number;
  fornecedor?: Fornecedor;
  descricao: string;
  valor_original: number;
  valor_pago: number;
  valor_restante: number;
  data_emissao: Date;
  data_vencimento: Date;
  data_pagamento?: Date;
  status: StatusConta; // 'PENDENTE' | 'PAGO_PARCIAL' | 'PAGO_TOTAL' | 'VENCIDO' | 'CANCELADO'
  forma_pagamento?: FormaPagamento;
  numero_parcela?: number;
  total_parcelas?: number;
  parcela_texto?: string; // Ex: "1/3"
  observacoes?: string;
  created_at: Date;
  updated_at: Date;
}
```

---

### Transportadora

```typescript
interface Transportadora {
  id: number;
  nome: string;
  nome_fantasia?: string;
  cnpj?: string; // Único
  inscricao_estadual?: string;
  telefone?: string;
  email?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string; // 2 caracteres (UF)
  ativo: boolean;
  observacoes?: string;
  pedidos?: Pedido[];
  created_at: Date;
  updated_at: Date;
}
```

---

### Endereco

```typescript
interface Endereco {
  id: number;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string; // 2 caracteres (UF)
  referencia?: string;
  cliente?: Cliente; // Relacionamento
  fornecedor?: Fornecedor; // Relacionamento
}
```

---

### Contato

```typescript
interface Contato {
  id: number;
  telefone: string;
  email?: string;
  nomeContato?: string;
  outroTelefone?: string;
  nomeOutroTelefone?: string;
  observacao?: string;
  ativo: boolean;
  cliente?: Cliente; // Relacionamento
  fornecedor?: Fornecedor; // Relacionamento
}
```

---

### Usuario

```typescript
interface Usuario {
  id: string; // UUID
  tenant_id: string | null; // UUID (null para SUPER_ADMIN)
  nome: string;
  email: string;
  senha_hash: string; // Não enviar para frontend
  role: RoleUsuario; // 'SUPER_ADMIN' | 'ADMIN' | 'GERENTE' | 'VENDEDOR' | 'FINANCEIRO'
  ativo: boolean;
  ultimo_acesso?: Date;
  created_at: Date;
  updated_at: Date;
}
```

---

### Tenant

```typescript
interface Tenant {
  id: string; // UUID
  codigo: string; // Único
  nome: string;
  cnpj?: string;
  email?: string;
  telefone?: string;
  schema_name: string; // Único
  subdominio?: string; // Único
  status: StatusTenant; // 'ATIVO' | 'INATIVO' | 'SUSPENSO' | 'TRIAL'
  data_expiracao?: Date | null;
  configuracoes?: Record<string, any>; // JSON
  data_criacao: Date;
  updated_at: Date;
}
```

---

### Notificacao

```typescript
interface Notificacao {
  id: string; // UUID
  usuario_id: string; // UUID
  titulo: string;
  mensagem: string;
  tipo: TipoNotificacao; // 'info' | 'success' | 'warning' | 'error'
  lida: boolean;
  action_url?: string;
  criado_em: Date;
  atualizado_em: Date;
}
```

---

### MovimentacaoEstoque

```typescript
interface MovimentacaoEstoque {
  id: number;
  produtoId: number;
  produto: Produto;
  tipo: TipoMovimentacaoEstoque; // 'ENTRADA' | 'SAIDA' | 'AJUSTE' | 'DEVOLUCAO' | 'PERDA' | 'TRANSFERENCIA'
  quantidade: number;
  estoque_anterior: number;
  estoque_atual: number;
  observacao?: string;
  motivo?: string;
  usuario_id: string; // UUID
  usuario: Usuario;
  documento_referencia?: string; // Número de pedido, nota fiscal, etc.
  criado_em: Date;
}
```

---

## 🔢 Enums

### TipoPessoa

```typescript
enum TipoPessoa {
  PESSOA_FISICA = 'PESSOA_FISICA',
  PESSOA_JURIDICA = 'PESSOA_JURIDICA'
}
```

---

### StatusCliente

```typescript
enum StatusCliente {
  ATIVO = 'ATIVO',
  INATIVO = 'INATIVO',
  BLOQUADO = 'BLOQUEADO', // ⚠️ Note: No enum está escrito "BLOQUADO" (sem E)
  INADIMPLENTE = 'INADIMPLENTE'
}
```

---

### StatusProduto

```typescript
enum StatusProduto {
  ATIVO = 'ATIVO',
  INATIVO = 'INATIVO'
}
```

---

### UnidadeMedida

```typescript
enum UnidadeMedida {
  UN = 'UN', // Unidade
  KG = 'KG', // Quilograma
  LT = 'LT', // Litro
  CX = 'CX'  // Caixa
}
```

---

### TipoPedido

```typescript
enum TipoPedido {
  COMPRA = 'COMPRA',
  VENDA = 'VENDA'
}
```

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

---

### FormaPagamento

```typescript
enum FormaPagamento {
  DINHEIRO = 'DINHEIRO',
  PIX = 'PIX',
  CARTAO_CREDITO = 'CARTAO_CREDITO',
  CARTAO_DEBITO = 'CARTAO_DEBITO',
  BOLETO = 'BOLETO',
  TRANSFERENCIA = 'TRANSFERENCIA'
}
```

---

### TipoConta

```typescript
enum TipoConta {
  PAGAR = 'PAGAR',
  RECEBER = 'RECEBER'
}
```

---

### StatusConta

```typescript
enum StatusConta {
  PENDENTE = 'PENDENTE',
  PAGO_PARCIAL = 'PAGO_PARCIAL',
  PAGO_TOTAL = 'PAGO_TOTAL',
  VENCIDO = 'VENCIDO',
  CANCELADO = 'CANCELADO'
}
```

---

### TipoFornecedor

```typescript
enum TipoFornecedor {
  PESSOA_FISICA = 'PESSOA_FISICA',
  PESSOA_JURIDICA = 'PESSOA_JURIDICA'
}
```

---

### StatusFornecedor

```typescript
enum StatusFornecedor {
  ATIVO = 'ATIVO',
  INATIVO = 'INATIVO',
  BLOQUEADO = 'BLOQUEADO'
}
```

---

### StatusCategoria

```typescript
enum StatusCategoria {
  ATIVO = 'ATIVO',
  INATIVO = 'INATIVO'
}
```

---

### RoleUsuario

```typescript
enum RoleUsuario {
  SUPER_ADMIN = 'SUPER_ADMIN', // Administrador do sistema (gerencia todos os tenants)
  ADMIN = 'ADMIN', // Administrador de um tenant específico
  GERENTE = 'GERENTE',
  VENDEDOR = 'VENDEDOR',
  FINANCEIRO = 'FINANCEIRO'
}
```

---

### StatusTenant

```typescript
enum StatusTenant {
  ATIVO = 'ATIVO',
  INATIVO = 'INATIVO',
  SUSPENSO = 'SUSPENSO',
  TRIAL = 'TRIAL'
}
```

---

### TipoNotificacao

```typescript
enum TipoNotificacao {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error'
}
```

---

### TipoMovimentacaoEstoque

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

### StatusContato

```typescript
enum StatusContato {
  ATIVO = 'ATIVO',
  INATIVO = 'INATIVO'
}
```

---

## 📝 DTOs (Data Transfer Objects)

### CreateClienteDto

**⚠️ IMPORTANTE:** O frontend pode enviar campos em **snake_case** ou **camelCase**. O backend aceita ambos.

```typescript
interface CreateClienteDto {
  // Campos aceitos em ambos os formatos
  tipo_pessoa?: TipoPessoa; // snake_case (do frontend)
  tipoPessoa?: TipoPessoa; // camelCase
  
  status_cliente?: StatusCliente; // snake_case (do frontend)
  statusCliente?: StatusCliente; // camelCase
  
  documento?: string; // snake_case (do frontend) - CPF/CNPJ (aceita formatado ou apenas números)
  cpf_cnpj?: string; // camelCase - CPF/CNPJ (aceita formatado ou apenas números)
  
  contatos?: CreateContatoDto[]; // plural (do frontend)
  contato?: CreateContatoDto[]; // singular
  
  // Campos obrigatórios
  nome: string; // min: 3, max: 255
  
  // Campos opcionais
  email?: string;
  telefone?: string;
  observacoes?: string; // max: 500
  enderecos?: CreateEnderecoDto[];
}
```

---

### UpdateClienteDto

```typescript
interface UpdateClienteDto {
  nome?: string;
  tipoPessoa?: TipoPessoa;
  statusCliente?: StatusCliente;
  cpf_cnpj?: string;
  email?: string;
  telefone?: string;
  observacoes?: string;
}
```

---

### CreateEnderecoDto

```typescript
interface CreateEnderecoDto {
  cep?: string; // Formato: 00000-000 ou 00000000
  logradouro?: string;
  numero?: string; // max: 10
  complemento?: string; // max: 50
  bairro?: string;
  cidade?: string;
  estado?: string; // 2 caracteres (UF)
  referencia?: string; // max: 100
  clienteId?: number;
  fornecedorId?: number;
}
```

---

### UpdateEnderecoDto

```typescript
interface UpdateEnderecoDto {
  cep?: string; // Formato: 00000-000 ou 00000000
  logradouro?: string;
  numero?: string; // max: 10
  complemento?: string; // max: 50
  bairro?: string;
  cidade?: string;
  estado?: string; // 2 caracteres (UF)
  referencia?: string; // max: 100
}
```

**Nota:** Todos os campos são opcionais. Apenas os campos fornecidos serão atualizados.

---

### CreateContatoDto

**⚠️ IMPORTANTE:** O frontend pode enviar campos em **snake_case**. O backend aceita ambos.

```typescript
interface CreateContatoDto {
  // Campos aceitos em ambos os formatos
  nome_contato?: string; // snake_case (do frontend)
  nomeContato?: string; // camelCase
  
  outro_telefone?: string; // snake_case (do frontend)
  outroTelefone?: string; // camelCase
  
  nome_outro_telefone?: string; // snake_case (do frontend)
  nomeOutroTelefone?: string; // camelCase
  
  // Campos
  telefone?: string; // Obrigatório se contato for fornecido (pode ser vazio)
  email?: string; // Formato de email válido
  observacao?: string; // max: 500
  ativo?: boolean; // default: true
  clienteId?: number;
  fornecedorId?: number;
}
```

---

### UpdateContatoDto

**⚠️ IMPORTANTE:** O frontend pode enviar campos em **snake_case**. O backend aceita ambos.

```typescript
interface UpdateContatoDto {
  // Campos aceitos em ambos os formatos
  nome_contato?: string; // snake_case (do frontend)
  nomeContato?: string; // camelCase
  
  outro_telefone?: string; // snake_case (do frontend)
  outroTelefone?: string; // camelCase
  
  nome_outro_telefone?: string; // snake_case (do frontend)
  nomeOutroTelefone?: string; // camelCase
  
  // Campos opcionais
  email?: string; // Formato de email válido (deve ser único se alterado)
  telefone?: string; // Deve ser único se alterado
  observacao?: string; // max: 500
  ativo?: boolean;
}
```

**Nota:** Todos os campos são opcionais. Apenas os campos fornecidos serão atualizados. O sistema valida se email e telefone são únicos quando alterados.

---

### CreateProdutoDto

```typescript
interface CreateProdutoDto {
  nome: string; // min: 3, max: 255
  descricao?: string;
  sku: string; // Único, min: 3, max: 100
  preco_custo: number; // min: 0.01
  preco_venda: number; // min: 0.01
  preco_promocional?: number; // min: 0.01
  estoque_atual?: number; // default: 0, min: 0
  estoque_minimo?: number; // default: 0, min: 0
  estoque_maximo?: number; // min: 0
  localizacao?: string; // max: 255
  statusProduto?: StatusProduto; // default: ATIVO
  unidade_medida?: UnidadeMedida; // default: UN
  data_validade?: string; // Formato: YYYY-MM-DD
  ncm?: string; // max: 20
  cest?: string; // max: 20
  cfop?: string; // max: 20
  observacoes?: string;
  peso?: number; // min: 0
  altura?: number; // min: 0
  largura?: number; // min: 0
  categoriaId?: number | null;
  fornecedorId?: number | null;
}
```

---

### UpdateProdutoDto

```typescript
interface UpdateProdutoDto {
  nome?: string;
  descricao?: string;
  sku?: string;
  preco_custo?: number;
  preco_venda?: number;
  preco_promocional?: number;
  estoque_atual?: number;
  estoque_minimo?: number;
  estoque_maximo?: number;
  localizacao?: string;
  statusProduto?: StatusProduto;
  unidade_medida?: UnidadeMedida;
  data_validade?: string;
  ncm?: string;
  cest?: string;
  cfop?: string;
  observacoes?: string;
  peso?: number;
  altura?: number;
  largura?: number;
  categoriaId?: number | null;
  fornecedorId?: number | null;
}
```

---

### CreateCategoriaDto

```typescript
interface CreateCategoriaDto {
  nome: string; // min: 3, max: 255
  descricao?: string; // max: 500
  statusCategoria?: StatusCategoria; // default: ATIVO
}
```

---

### UpdateCategoriaDto

```typescript
interface UpdateCategoriaDto {
  nome?: string;
  descricao?: string;
  statusCategoria?: StatusCategoria;
}
```

---

### CreateFornecedorDto

```typescript
interface CreateFornecedorDto {
  nome_fantasia?: string;
  nome_razao: string; // min: 3, max: 255
  tipoFornecedor?: TipoFornecedor; // default: PESSOA_FISICA
  statusFornecedor?: StatusFornecedor; // default: ATIVO
  cpf_cnpj?: string; // CPF (11 dígitos) ou CNPJ (14 dígitos) - aceita formatado ou apenas números
  inscricao_estadual?: string;
  enderecos?: CreateEnderecoDto[];
  contato?: CreateContatoDto[];
}
```

---

### UpdateFornecedorDto

```typescript
interface UpdateFornecedorDto {
  nome_fantasia?: string;
  nome_razao?: string;
  tipoFornecedor?: TipoFornecedor;
  statusFornecedor?: StatusFornecedor;
  cpf_cnpj?: string;
  inscricao_estadual?: string;
}
```

---

### CreatePedidoDto

```typescript
interface CreatePedidoDto {
  tipo: TipoPedido; // 'COMPRA' | 'VENDA'
  cliente_id?: number;
  fornecedor_id?: number;
  transportadora_id?: number;
  data_pedido: string; // Formato: YYYY-MM-DD
  data_entrega_prevista?: string; // Formato: YYYY-MM-DD
  condicao_pagamento?: string; // max: 100
  forma_pagamento?: FormaPagamento;
  prazo_entrega_dias?: number;
  subtotal: number; // default: 0
  desconto_valor?: number; // default: 0
  desconto_percentual?: number; // default: 0
  frete?: number; // default: 0
  outras_taxas?: number; // default: 0
  observacoes_internas?: string;
  observacoes_cliente?: string;
  itens: CreatePedidoItemDto[]; // Mínimo 1 item
  usuario_criacao_id?: string; // UUID (preenchido automaticamente do token)
}
```

---

### CreatePedidoItemDto

```typescript
interface CreatePedidoItemDto {
  produto_id: number;
  quantidade: number; // min: 0.001
  preco_unitario: number; // min: 0.01
  desconto?: number; // default: 0, min: 0
}
```

---

### UpdatePedidoDto

```typescript
interface UpdatePedidoDto {
  tipo?: TipoPedido;
  cliente_id?: number;
  fornecedor_id?: number;
  transportadora_id?: number;
  data_pedido?: string;
  data_entrega_prevista?: string;
  data_entrega_realizada?: string;
  condicao_pagamento?: string;
  forma_pagamento?: FormaPagamento;
  prazo_entrega_dias?: number;
  subtotal?: number;
  desconto_valor?: number;
  desconto_percentual?: number;
  frete?: number;
  outras_taxas?: number;
  observacoes_internas?: string;
  observacoes_cliente?: string;
  usuario_atualizacao_id?: string; // UUID (preenchido automaticamente do token)
}
```

---

### CreateContaFinanceiraDto

```typescript
interface CreateContaFinanceiraDto {
  tipo: TipoConta; // 'PAGAR' | 'RECEBER'
  pedido_id?: number;
  cliente_id?: number;
  fornecedor_id?: number;
  descricao: string; // min: 3, max: 255
  valor_original: number; // min: 0.01
  valor_pago?: number; // default: 0, min: 0
  data_emissao: string; // Formato: YYYY-MM-DD
  data_vencimento: string; // Formato: YYYY-MM-DD
  forma_pagamento?: FormaPagamento;
  numero_parcela?: number;
  total_parcelas?: number;
  parcela_texto?: string; // max: 20
  observacoes?: string;
}
```

---

### UpdateContaFinanceiraDto

```typescript
interface UpdateContaFinanceiraDto {
  tipo?: TipoConta;
  pedido_id?: number;
  cliente_id?: number;
  fornecedor_id?: number;
  descricao?: string;
  valor_original?: number;
  valor_pago?: number;
  data_emissao?: string;
  data_vencimento?: string;
  data_pagamento?: string;
  forma_pagamento?: FormaPagamento;
  numero_parcela?: number;
  total_parcelas?: number;
  parcela_texto?: string;
  observacoes?: string;
}
```

---

### CreateTransportadoraDto

```typescript
interface CreateTransportadoraDto {
  nome: string; // min: 3, max: 255
  nome_fantasia?: string; // max: 255
  cnpj?: string; // Formato: 00.000.000/0000-00, único
  inscricao_estadual?: string; // max: 50
  telefone?: string; // max: 20
  email?: string; // Formato de email válido
  cep?: string; // max: 10
  logradouro?: string; // max: 255
  numero?: string; // max: 20
  complemento?: string; // max: 100
  bairro?: string; // max: 100
  cidade?: string; // max: 100
  estado?: string; // 2 caracteres (UF)
  observacoes?: string;
}
```

---

### UpdateTransportadoraDto

```typescript
interface UpdateTransportadoraDto {
  nome?: string;
  nome_fantasia?: string;
  cnpj?: string;
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
  ativo?: boolean;
  observacoes?: string;
}
```

---

### MovimentarEstoqueDto

```typescript
interface MovimentarEstoqueDto {
  tipo: TipoMovimentacaoEstoque; // 'ENTRADA' | 'SAIDA' | 'AJUSTE' | 'DEVOLUCAO' | 'PERDA' | 'TRANSFERENCIA'
  quantidade: number; // min: 1
  motivo?: string; // max: 255
  observacoes?: string;
}
```

---

### CreateUsuarioDto

```typescript
interface CreateUsuarioDto {
  nome: string; // min: 3, max: 255
  email: string; // Formato de email válido, único
  senha: string; // min: 6, max: 255
  role: RoleUsuario; // 'ADMIN' | 'GERENTE' | 'VENDEDOR' | 'FINANCEIRO'
}
```

---

### UpdateUsuarioDto

```typescript
interface UpdateUsuarioDto {
  nome?: string;
  email?: string;
  senha?: string;
  role?: RoleUsuario;
  ativo?: boolean;
}
```

---

### LoginDto

```typescript
interface LoginDto {
  email: string;
  senha: string;
  tenant_codigo?: string; // Opcional
}
```

---

### AuthResponseDto

```typescript
interface AuthResponseDto {
  access_token: string;
  user: {
    id: string; // UUID
    email: string;
    nome: string;
    role: RoleUsuario;
    tenant_id: string; // UUID
    schema_name: string;
  };
}
```

---

### CreateTenantDto

```typescript
interface CreateTenantDto {
  codigo: string; // Único, min: 3, max: 100
  nome: string; // min: 3, max: 255
  cnpj?: string; // Formato: 00.000.000/0000-00, único
  email?: string; // Formato de email válido
  telefone?: string; // max: 20
  subdominio?: string; // Único, max: 100
}
```

---

### UpdateTenantDto

```typescript
interface UpdateTenantDto {
  codigo?: string;
  nome?: string;
  cnpj?: string;
  email?: string;
  telefone?: string;
  subdominio?: string;
  status?: StatusTenant;
  data_expiracao?: string; // Formato: YYYY-MM-DD
}
```

---

### UpdateTenantInfoDto

```typescript
interface UpdateTenantInfoDto {
  nome?: string;
  cnpj?: string;
  email?: string;
  telefone?: string;
}
```

---

### CreateNotificacaoDto

```typescript
interface CreateNotificacaoDto {
  usuario_id: string; // UUID
  titulo: string; // max: 255
  mensagem: string;
  tipo: TipoNotificacao; // 'info' | 'success' | 'warning' | 'error'
  action_url?: string; // max: 500
}
```

---

### UpdateConfiguracaoDto

```typescript
interface UpdateConfiguracaoDto {
  // Objeto JSON com configurações personalizadas
  // Exemplo:
  // {
  //   "nfe": { ... },
  //   "email": { ... },
  //   "custom": { ... }
  // }
  [key: string]: any;
}
```

---

## 📌 Notas Importantes

### 1. Formato de Datas
- **Enviar para API:** Formato ISO 8601 (YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ssZ)
- **Receber da API:** Formato ISO 8601 (string) ou Date object (depende do framework)

### 2. Formato de Documentos
- **CPF:** `000.000.000-00` (formatado) ou `00000000000` (sem formatação) - **11 dígitos numéricos**
- **CNPJ:** `00.000.000/0000-00` (formatado) ou `00000000000000` (sem formatação) - **14 dígitos numéricos**
- O backend aceita ambos os formatos (com ou sem formatação)
- **Validação:** O sistema valida apenas o tamanho correto (11 para CPF, 14 para CNPJ) e que contenha apenas números. **Não há algoritmo de validação de CPF/CNPJ** (verificação de dígitos verificadores).

### 3. Campos em Snake_case vs CamelCase
- O backend aceita **ambos os formatos** para compatibilidade
- Campos do frontend podem ser enviados em **snake_case** (ex: `tipo_pessoa`, `status_cliente`)
- O backend converte automaticamente para **camelCase** internamente

### 4. Validações
- Todos os campos obrigatórios devem ser fornecidos
- Valores numéricos devem ser positivos quando aplicável
- Strings têm limites de tamanho (min/max)
- Emails devem estar em formato válido
- Enums devem usar exatamente os valores especificados

### 5. Relacionamentos
- Ao criar entidades com relacionamentos, forneça apenas os IDs
- O backend preenche automaticamente os objetos relacionados nas respostas
- Use `null` para remover relacionamentos opcionais

### 6. Multi-tenant
- Todos os dados são isolados por tenant
- O `tenant_id` e `schema_name` são obtidos automaticamente do token JWT
- Não é necessário enviar esses campos nas requisições

---

**Última atualização:** 2025-01-09  
**Versão da API:** 1.0

