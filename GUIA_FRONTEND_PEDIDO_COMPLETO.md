# 📘 Guia Completo - API de Pedidos (Frontend)

Este guia contém todas as informações necessárias para integrar o frontend com a API de Pedidos do backend, incluindo DTOs, Enums, Entity e exemplos práticos.

---

## 📋 Índice

1. [Status do Backend](#status-do-backend)
2. [Endpoints Disponíveis](#endpoints-disponíveis)
3. [Autenticação](#autenticação)
4. [DTOs (Data Transfer Objects)](#dtos-data-transfer-objects)
5. [Enums](#enums)
6. [Entity (Estrutura de Resposta)](#entity-estrutura-de-resposta)
7. [Exemplos de Requisições](#exemplos-de-requisições)
8. [Validações e Regras](#validações-e-regras)
9. [Tratamento de Erros](#tratamento-de-erros)
10. [Troubleshooting](#troubleshooting)

---

## ✅ Status do Backend

**Status:** ✅ **BACKEND FUNCIONANDO CORRETAMENTE**

O backend está configurado corretamente para gerenciar pedidos com:
- ✅ Criação de pedidos (VENDA e COMPRA)
- ✅ Listagem com paginação e filtros avançados
- ✅ Busca por ID
- ✅ Atualização de pedidos
- ✅ Cancelamento de pedidos
- ✅ Geração automática de número do pedido
- ✅ Cálculo automático de totais
- ✅ Vinculação com cliente, fornecedor e transportadora
- ✅ Gestão de itens do pedido

---

## 🔗 Endpoints Disponíveis

### Base URL
```
http://seu-backend.com/api/v1/pedidos
```

**Nota:** O backend usa o prefixo `/api/v1` por padrão.

### Métodos HTTP

| Método | Endpoint | Descrição | Permissões |
|--------|----------|-----------|------------|
| `POST` | `/api/v1/pedidos` | Criar novo pedido | ADMIN, GERENTE, VENDEDOR |
| `GET` | `/api/v1/pedidos` | Listar pedidos (com filtros) | ADMIN, GERENTE, VENDEDOR |
| `GET` | `/api/v1/pedidos/:id` | Buscar pedido por ID | ADMIN, GERENTE, VENDEDOR |
| `PATCH` | `/api/v1/pedidos/:id` | Atualizar pedido | ADMIN, GERENTE, VENDEDOR |
| `PATCH` | `/api/v1/pedidos/:id/cancelar` | Cancelar pedido | ADMIN, GERENTE |

---

## 🔐 Autenticação

Todas as requisições requerem autenticação via Bearer Token no header:

```javascript
headers: {
  'Authorization': `Bearer ${seuTokenJWT}`,
  'Content-Type': 'application/json'
}
```

**Importante:** O token JWT deve conter:
- `id`: ID do usuário (UUID)
- `schema_name`: Nome do schema do tenant
- `tenant_id`: ID do tenant

---

## 📦 DTOs (Data Transfer Objects)

### CreatePedidoDto (Criar Pedido)

```typescript
interface CreatePedidoDto {
  // ⚠️ CAMPOS OBRIGATÓRIOS
  tipo: TipoPedido;                // 'VENDA' | 'COMPRA'
  data_pedido: string;              // Formato ISO: 'YYYY-MM-DD' ou 'YYYY-MM-DDTHH:mm:ssZ'
  itens: CreatePedidoItemDto[];     // Array com pelo menos 1 item

  // ⚠️ CAMPOS OBRIGATÓRIOS CONDICIONAIS
  cliente_id?: number;              // Obrigatório se tipo = 'VENDA'
  fornecedor_id?: number;           // Obrigatório se tipo = 'COMPRA'

  // ✅ CAMPOS OPCIONAIS
  status?: StatusPeduto;            // Padrão: 'PENDENTE'
  transportadora_id?: number;        // ID da transportadora
  data_entrega_prevista?: string;   // Formato ISO
  data_entrega_realizada?: string;  // Formato ISO
  condicao_pagamento?: string;       // Máx 100 caracteres
  forma_pagamento?: FormaPagamento; // Enum
  prazo_entrega_dias?: number;      // ≥ 0
  subtotal?: number;                 // ≥ 0
  desconto_valor?: number;           // ≥ 0
  desconto_percentual?: number;      // ≥ 0
  frete?: number;                    // ≥ 0
  outras_taxas?: number;             // ≥ 0
  observacoes_internas?: string;
  observacoes_cliente?: string;
  usuario_criacao_id?: string;       // Preenchido automaticamente
  usuario_atualizacao_id?: string;
}
```

### CreatePedidoItemDto (Item do Pedido)

```typescript
interface CreatePedidoItemDto {
  // ⚠️ CAMPOS OBRIGATÓRIOS
  produto_id: number;                // ID do produto
  quantidade: number;                // > 0.001
  preco_unitario: number;            // ≥ 0

  // ✅ CAMPOS OPCIONAIS
  desconto?: number;                 // ≥ 0
}
```

### UpdatePedidoDto (Atualizar Pedido)

```typescript
// Todos os campos são opcionais (PartialType)
type UpdatePedidoDto = Partial<CreatePedidoDto>;
```

---

## 🔢 Enums

### TipoPedido

```typescript
enum TipoPedido {
  COMPRA = 'COMPRA',  // Pedido de compra (com fornecedor)
  VENDA = 'VENDA'     // Pedido de venda (com cliente)
}
```

**Valores aceitos:**
- `'COMPRA'` - Pedido de compra (requer `fornecedor_id`)
- `'VENDA'` - Pedido de venda (requer `cliente_id`)

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

**Valores aceitos:**
- `'PENDENTE'` - Pedido pendente (padrão)
- `'APROVADO'` - Pedido aprovado
- `'EM_PROCESSAMENTO'` - Pedido em processamento
- `'CONCLUIDO'` - Pedido concluído
- `'CANCELADO'` - Pedido cancelado

**Padrão:** `'PENDENTE'` (se não informado)

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

**Valores aceitos:**
- `'DINHEIRO'` - Pagamento em dinheiro
- `'PIX'` - Pagamento via PIX
- `'CARTAO_CREDITO'` - Cartão de crédito
- `'CARTAO_DEBITO'` - Cartão de débito
- `'BOLETO'` - Boleto bancário
- `'TRANSFERENCIA'` - Transferência bancária

---

## 🗄️ Entity (Estrutura de Resposta)

### Pedido (Resposta do Backend)

```typescript
interface Pedido {
  id: number;                        // Gerado automaticamente
  numero_pedido: string;             // Gerado automaticamente (ex: "VENDA-0001")
  tipo: TipoPedido;                  // 'VENDA' | 'COMPRA'
  status: StatusPedido;              // Status atual do pedido
  
  // Relacionamentos
  cliente_id?: number | null;        // ID do cliente (se tipo = VENDA)
  cliente?: Cliente | null;          // Objeto completo do cliente
  fornecedor_id?: number | null;     // ID do fornecedor (se tipo = COMPRA)
  fornecedor?: Fornecedor | null;    // Objeto completo do fornecedor
  transportadora_id?: number | null; // ID da transportadora
  transportadora?: Transportadora | null; // Objeto completo da transportadora
  usuario_criacao_id: string;        // UUID do usuário que criou
  usuario_criacao?: Usuario;         // Objeto completo do usuário
  usuario_atualizacao_id?: string | null; // UUID do usuário que atualizou
  usuario_atualizacao?: Usuario | null;   // Objeto completo do usuário
  
  // Datas
  data_pedido: string;                // ISO 8601: '2025-01-15T10:30:00.000Z'
  data_entrega_prevista?: string | null; // ISO 8601
  data_entrega_realizada?: string | null; // ISO 8601
  
  // Financeiro
  condicao_pagamento?: string | null;
  forma_pagamento?: FormaPagamento | null;
  prazo_entrega_dias?: number | null;
  subtotal: number;                  // Calculado automaticamente
  desconto_valor: number;            // Calculado automaticamente
  desconto_percentual: number;       // Calculado automaticamente
  frete: number;                     // Calculado automaticamente
  outras_taxas: number;              // Calculado automaticamente
  valor_total: number;               // Calculado automaticamente
  
  // Observações
  observacoes_internas?: string | null;
  observacoes_cliente?: string | null;
  
  // Itens
  itens: PedidoItem[];               // Array de itens do pedido
  
  // Timestamps
  created_at: string;                // ISO 8601
  updated_at: string;                // ISO 8601
}
```

### PedidoItem (Item do Pedido)

```typescript
interface PedidoItem {
  id: number;                        // Gerado automaticamente
  pedido_id: number;                 // ID do pedido
  produto_id: number;                // ID do produto
  produto?: Produto;                  // Objeto completo do produto
  quantidade: number;                // Quantidade do produto
  preco_unitario: number;            // Preço unitário
  desconto: number;                  // Desconto aplicado
  subtotal: number;                  // Calculado automaticamente (quantidade * preco_unitario - desconto)
}
```

---

## 💻 Exemplos de Requisições

### 1. Criar Pedido de Venda (POST)

#### JavaScript/TypeScript (Fetch API)

```typescript
interface CreatePedidoDto {
  tipo: 'VENDA' | 'COMPRA';
  data_pedido: string;
  cliente_id?: number;
  fornecedor_id?: number;
  transportadora_id?: number;
  itens: Array<{
    produto_id: number;
    quantidade: number;
    preco_unitario: number;
    desconto?: number;
  }>;
  // ... outros campos opcionais
}

const criarPedidoVenda = async (pedidoData: CreatePedidoDto) => {
  try {
    const response = await fetch('http://seu-backend.com/api/v1/pedidos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${seuToken}`
      },
      body: JSON.stringify(pedidoData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao criar pedido');
    }

    const pedido: Pedido = await response.json();
    return pedido;
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    throw error;
  }
};

// Exemplo de uso - Pedido de Venda
const novoPedidoVenda = await criarPedidoVenda({
  tipo: 'VENDA',
  data_pedido: '2025-01-15',
  cliente_id: 1,
  transportadora_id: 1,
  forma_pagamento: 'PIX',
  condicao_pagamento: 'À vista',
  frete: 50.00,
  itens: [
    {
      produto_id: 1,
      quantidade: 10,
      preco_unitario: 100.00,
      desconto: 0
    },
    {
      produto_id: 2,
      quantidade: 5,
      preco_unitario: 200.00,
      desconto: 50.00
    }
  ],
  observacoes_cliente: 'Entrega preferencial pela manhã'
});
```

#### Exemplo - Pedido de Compra

```typescript
// Exemplo de uso - Pedido de Compra
const novoPedidoCompra = await criarPedidoVenda({
  tipo: 'COMPRA',
  data_pedido: '2025-01-15',
  fornecedor_id: 1,
  transportadora_id: 2,
  forma_pagamento: 'BOLETO',
  condicao_pagamento: '30 dias',
  prazo_entrega_dias: 7,
  itens: [
    {
      produto_id: 3,
      quantidade: 20,
      preco_unitario: 50.00
    }
  ],
  observacoes_internas: 'Pedido urgente'
});
```

#### Axios

```typescript
import axios from 'axios';

const criarPedido = async (pedidoData: CreatePedidoDto) => {
  try {
    const response = await axios.post<Pedido>(
      'http://seu-backend.com/api/v1/pedidos',
      pedidoData,
      {
        headers: {
          'Authorization': `Bearer ${seuToken}`
        }
      }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Erro:', error.response?.data);
      throw new Error(error.response?.data?.message || 'Erro ao criar pedido');
    }
    throw error;
  }
};
```

#### React Hook Form

```typescript
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Schema de validação com Zod
const pedidoItemSchema = z.object({
  produto_id: z.number().int().positive(),
  quantidade: z.number().positive().min(0.001),
  preco_unitario: z.number().nonnegative(),
  desconto: z.number().nonnegative().optional(),
});

const pedidoSchema = z.object({
  tipo: z.enum(['VENDA', 'COMPRA']),
  data_pedido: z.string().regex(/^\d{4}-\d{2}-\d{2}/),
  cliente_id: z.number().int().positive().optional(),
  fornecedor_id: z.number().int().positive().optional(),
  transportadora_id: z.number().int().positive().optional(),
  forma_pagamento: z.enum(['DINHEIRO', 'PIX', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'BOLETO', 'TRANSFERENCIA']).optional(),
  frete: z.number().nonnegative().optional(),
  itens: z.array(pedidoItemSchema).min(1),
}).refine((data) => {
  if (data.tipo === 'VENDA') {
    return !!data.cliente_id;
  }
  if (data.tipo === 'COMPRA') {
    return !!data.fornecedor_id;
  }
  return true;
}, {
  message: 'Cliente é obrigatório para VENDA e Fornecedor é obrigatório para COMPRA',
  path: ['cliente_id', 'fornecedor_id']
});

type PedidoFormData = z.infer<typeof pedidoSchema>;

const PedidoForm = () => {
  const { register, handleSubmit, control, formState: { errors }, watch } = useForm<PedidoFormData>({
    resolver: zodResolver(pedidoSchema),
    defaultValues: {
      tipo: 'VENDA',
      data_pedido: new Date().toISOString().split('T')[0],
      itens: [{ produto_id: 0, quantidade: 1, preco_unitario: 0 }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'itens'
  });

  const tipo = watch('tipo');

  const onSubmit = async (data: PedidoFormData) => {
    try {
      const pedido = await criarPedido(data);
      console.log('Pedido criado:', pedido);
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Tipo de pedido */}
      <select {...register('tipo')}>
        <option value="VENDA">Venda</option>
        <option value="COMPRA">Compra</option>
      </select>

      {/* Data do pedido */}
      <input 
        type="date" 
        {...register('data_pedido')} 
      />

      {/* Cliente (se tipo = VENDA) */}
      {tipo === 'VENDA' && (
        <>
          <input 
            type="number" 
            {...register('cliente_id', { valueAsNumber: true })} 
            placeholder="ID do Cliente" 
          />
          {errors.cliente_id && <span>{errors.cliente_id.message}</span>}
        </>
      )}

      {/* Fornecedor (se tipo = COMPRA) */}
      {tipo === 'COMPRA' && (
        <>
          <input 
            type="number" 
            {...register('fornecedor_id', { valueAsNumber: true })} 
            placeholder="ID do Fornecedor" 
          />
          {errors.fornecedor_id && <span>{errors.fornecedor_id.message}</span>}
        </>
      )}

      {/* Transportadora */}
      <input 
        type="number" 
        {...register('transportadora_id', { valueAsNumber: true })} 
        placeholder="ID da Transportadora (opcional)" 
      />

      {/* Forma de pagamento */}
      <select {...register('forma_pagamento')}>
        <option value="">Selecione...</option>
        <option value="DINHEIRO">Dinheiro</option>
        <option value="PIX">PIX</option>
        <option value="CARTAO_CREDITO">Cartão de Crédito</option>
        <option value="CARTAO_DEBITO">Cartão de Débito</option>
        <option value="BOLETO">Boleto</option>
        <option value="TRANSFERENCIA">Transferência</option>
      </select>

      {/* Frete */}
      <input 
        type="number" 
        step="0.01"
        {...register('frete', { valueAsNumber: true })} 
        placeholder="Frete" 
      />

      {/* Itens do pedido */}
      <div>
        <h3>Itens do Pedido</h3>
        {fields.map((field, index) => (
          <div key={field.id}>
            <input 
              type="number" 
              {...register(`itens.${index}.produto_id`, { valueAsNumber: true })} 
              placeholder="ID do Produto" 
            />
            <input 
              type="number" 
              step="0.001"
              {...register(`itens.${index}.quantidade`, { valueAsNumber: true })} 
              placeholder="Quantidade" 
            />
            <input 
              type="number" 
              step="0.01"
              {...register(`itens.${index}.preco_unitario`, { valueAsNumber: true })} 
              placeholder="Preço Unitário" 
            />
            <input 
              type="number" 
              step="0.01"
              {...register(`itens.${index}.desconto`, { valueAsNumber: true })} 
              placeholder="Desconto (opcional)" 
            />
            <button type="button" onClick={() => remove(index)}>Remover</button>
          </div>
        ))}
        <button 
          type="button" 
          onClick={() => append({ produto_id: 0, quantidade: 1, preco_unitario: 0 })}
        >
          Adicionar Item
        </button>
      </div>

      <button type="submit">Criar Pedido</button>
    </form>
  );
};
```

### 2. Listar Pedidos (GET)

```typescript
interface ListarPedidosParams {
  id?: number;              // Buscar por ID específico
  tipo?: 'VENDA' | 'COMPRA';
  status?: StatusPedido;
  cliente_id?: number;
  cliente_nome?: string;
  fornecedor_id?: number;
  fornecedor_nome?: string;
  page?: number;            // Padrão: 1
  limit?: number;           // Padrão: 15
}

interface ListarPedidosResponse {
  pedidos: Pedido[];
  total: number;
}

const listarPedidos = async (
  params: ListarPedidosParams = {}
): Promise<ListarPedidosResponse> => {
  const queryParams = new URLSearchParams();
  
  if (params.id) queryParams.append('id', params.id.toString());
  if (params.tipo) queryParams.append('tipo', params.tipo);
  if (params.status) queryParams.append('status', params.status);
  if (params.cliente_id) queryParams.append('cliente_id', params.cliente_id.toString());
  if (params.cliente_nome) queryParams.append('cliente_nome', params.cliente_nome);
  if (params.fornecedor_id) queryParams.append('fornecedor_id', params.fornecedor_id.toString());
  if (params.fornecedor_nome) queryParams.append('fornecedor_nome', params.fornecedor_nome);
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());

  const response = await fetch(
    `http://seu-backend.com/api/v1/pedidos?${queryParams}`,
    {
      headers: {
        'Authorization': `Bearer ${seuToken}`
      }
    }
  );

  if (!response.ok) {
    throw new Error('Erro ao listar pedidos');
  }

  return response.json();
};

// Exemplo de uso
const resultado = await listarPedidos({
  tipo: 'VENDA',
  status: 'PENDENTE',
  page: 1,
  limit: 20
});

console.log(`Total: ${resultado.total}`);
console.log(`Pedidos:`, resultado.pedidos);
```

### 3. Buscar Pedido por ID (GET)

```typescript
const buscarPedidoPorId = async (id: number): Promise<Pedido> => {
  const response = await fetch(
    `http://seu-backend.com/api/v1/pedidos/${id}`,
    {
      headers: {
        'Authorization': `Bearer ${seuToken}`
      }
    }
  );

  if (!response.ok) {
    throw new Error('Pedido não encontrado');
  }

  return response.json();
};

// Exemplo de uso
const pedido = await buscarPedidoPorId(1);
console.log('Pedido:', pedido);
console.log('Cliente:', pedido.cliente);
console.log('Transportadora:', pedido.transportadora);
console.log('Itens:', pedido.itens);
```

### 4. Atualizar Pedido (PATCH)

```typescript
const atualizarPedido = async (
  id: number,
  dadosAtualizacao: Partial<CreatePedidoDto>
): Promise<Pedido> => {
  // Converter strings vazias em undefined
  const cleanedData = Object.fromEntries(
    Object.entries(dadosAtualizacao).map(([key, value]) => [
      key,
      value === '' ? undefined : value
    ])
  );

  const response = await fetch(
    `http://seu-backend.com/api/v1/pedidos/${id}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${seuToken}`
      },
      body: JSON.stringify(cleanedData)
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erro ao atualizar pedido');
  }

  return response.json();
};

// Exemplo: Atualizar status e transportadora
await atualizarPedido(1, {
  status: 'APROVADO',
  transportadora_id: 2,
  data_entrega_prevista: '2025-01-20'
});

// Exemplo: Atualizar apenas frete
await atualizarPedido(1, {
  frete: 75.00
});
```

### 5. Cancelar Pedido (PATCH)

```typescript
const cancelarPedido = async (id: number): Promise<Pedido> => {
  const response = await fetch(
    `http://seu-backend.com/api/v1/pedidos/${id}/cancelar`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${seuToken}`
      }
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erro ao cancelar pedido');
  }

  return response.json();
};

// Exemplo de uso
const pedidoCancelado = await cancelarPedido(1);
console.log('Pedido cancelado:', pedidoCancelado);
// O status será alterado para 'CANCELADO'
```

---

## ✅ Validações e Regras

### Campos Obrigatórios

| Campo | Tipo | Validação |
|-------|------|-----------|
| `tipo` | enum | 'VENDA' ou 'COMPRA' |
| `data_pedido` | string | Formato ISO: 'YYYY-MM-DD' ou 'YYYY-MM-DDTHH:mm:ssZ' |
| `itens` | array | Array com pelo menos 1 item |

### Campos Obrigatórios Condicionais

| Campo | Tipo | Condição |
|-------|------|----------|
| `cliente_id` | number | Obrigatório se `tipo = 'VENDA'` |
| `fornecedor_id` | number | Obrigatório se `tipo = 'COMPRA'` |

### Campos Opcionais

| Campo | Tipo | Validação |
|-------|------|-----------|
| `status` | enum | 'PENDENTE', 'APROVADO', 'EM_PROCESSAMENTO', 'CONCLUIDO', 'CANCELADO' |
| `transportadora_id` | number | ID válido de transportadora |
| `data_entrega_prevista` | string | Formato ISO |
| `data_entrega_realizada` | string | Formato ISO |
| `condicao_pagamento` | string | Máx 100 caracteres |
| `forma_pagamento` | enum | 'DINHEIRO', 'PIX', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'BOLETO', 'TRANSFERENCIA' |
| `prazo_entrega_dias` | number | ≥ 0 |
| `subtotal` | number | ≥ 0 |
| `desconto_valor` | number | ≥ 0 |
| `desconto_percentual` | number | ≥ 0 |
| `frete` | number | ≥ 0 |
| `outras_taxas` | number | ≥ 0 |
| `observacoes_internas` | string | Texto livre |
| `observacoes_cliente` | string | Texto livre |

### Validações de Itens

| Campo | Tipo | Validação |
|-------|------|-----------|
| `produto_id` | number | ID válido de produto |
| `quantidade` | number | > 0.001 |
| `preco_unitario` | number | ≥ 0 |
| `desconto` | number | ≥ 0 (opcional) |

### ⚠️ Regras Importantes

1. **Número do Pedido**: Gerado automaticamente pelo backend (ex: "VENDA-0001", "COMPRA-0001")
2. **Cálculos Automáticos**: O backend calcula automaticamente:
   - `subtotal` (soma dos subtotais dos itens)
   - `desconto_valor` e `desconto_percentual` (baseado nos itens)
   - `valor_total` (subtotal - descontos + frete + outras_taxas)
3. **Tipo de Pedido**: 
   - `VENDA`: Requer `cliente_id`
   - `COMPRA`: Requer `fornecedor_id`
4. **Itens**: Deve ter pelo menos 1 item no array
5. **Usuário**: `usuario_criacao_id` é preenchido automaticamente do token JWT
6. **Datas**: Aceita formato `YYYY-MM-DD` ou `YYYY-MM-DDTHH:mm:ssZ`

---

## 🚨 Tratamento de Erros

### Códigos de Status HTTP

| Código | Significado |
|--------|-------------|
| `200` | Sucesso |
| `201` | Criado com sucesso |
| `400` | Dados inválidos (validação) |
| `401` | Não autenticado |
| `403` | Sem permissão |
| `404` | Não encontrado |
| `500` | Erro interno do servidor |

### Exemplo de Tratamento de Erros

```typescript
const criarPedidoComTratamento = async (
  pedidoData: CreatePedidoDto
) => {
  try {
    const response = await fetch('http://seu-backend.com/api/v1/pedidos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${seuToken}`
      },
      body: JSON.stringify(pedidoData)
    });

    if (!response.ok) {
      const error = await response.json();
      
      switch (response.status) {
        case 400:
          console.error('Dados inválidos:', error.message);
          // error.message pode conter detalhes dos campos inválidos
          break;
        case 401:
          console.error('Não autenticado. Faça login novamente.');
          break;
        case 403:
          console.error('Sem permissão para criar pedido.');
          break;
        default:
          console.error('Erro desconhecido:', error.message);
      }
      
      throw new Error(error.message || 'Erro ao criar pedido');
    }

    const pedido: Pedido = await response.json();
    return pedido;
  } catch (error) {
    console.error('Erro:', error);
    throw error;
  }
};
```

---

## 🔍 Troubleshooting

### Problema: Erro "Cliente é obrigatório para pedidos de VENDA"

**Solução:** Certifique-se de enviar `cliente_id` quando `tipo = 'VENDA'`:

```typescript
// ✅ CORRETO
{
  tipo: 'VENDA',
  cliente_id: 1,
  // ...
}

// ❌ ERRADO
{
  tipo: 'VENDA',
  // cliente_id faltando
}
```

### Problema: Erro "Fornecedor é obrigatório para pedidos de COMPRA"

**Solução:** Certifique-se de enviar `fornecedor_id` quando `tipo = 'COMPRA'`:

```typescript
// ✅ CORRETO
{
  tipo: 'COMPRA',
  fornecedor_id: 1,
  // ...
}

// ❌ ERRADO
{
  tipo: 'COMPRA',
  // fornecedor_id faltando
}
```

### Problema: Erro "O pedido deve ter pelo menos um item"

**Solução:** Certifique-se de enviar pelo menos 1 item no array `itens`:

```typescript
// ✅ CORRETO
{
  itens: [
    {
      produto_id: 1,
      quantidade: 10,
      preco_unitario: 100.00
    }
  ]
}

// ❌ ERRADO
{
  itens: [] // Array vazio
}
```

### Problema: Cálculos não estão corretos

**Solução:** O backend calcula automaticamente os valores. Se você enviar `subtotal`, `desconto_valor`, etc., eles serão usados, mas normalmente é melhor deixar o backend calcular. Se precisar de valores específicos, envie-os explicitamente.

---

## 📝 Exemplo Completo de Integração

```typescript
// tipos.ts
export enum TipoPedido {
  COMPRA = 'COMPRA',
  VENDA = 'VENDA'
}

export enum StatusPedido {
  PENDENTE = 'PENDENTE',
  APROVADO = 'APROVADO',
  EM_PROCESSAMENTO = 'EM_PROCESSAMENTO',
  CONCLUIDO = 'CONCLUIDO',
  CANCELADO = 'CANCELADO'
}

export enum FormaPagamento {
  DINHEIRO = 'DINHEIRO',
  PIX = 'PIX',
  CARTAO_CREDITO = 'CARTAO_CREDITO',
  CARTAO_DEBITO = 'CARTAO_DEBITO',
  BOLETO = 'BOLETO',
  TRANSFERENCIA = 'TRANSFERENCIA'
}

export interface CreatePedidoItemDto {
  produto_id: number;
  quantidade: number;
  preco_unitario: number;
  desconto?: number;
}

export interface CreatePedidoDto {
  tipo: TipoPedido;
  data_pedido: string;
  cliente_id?: number;
  fornecedor_id?: number;
  transportadora_id?: number;
  status?: StatusPedido;
  forma_pagamento?: FormaPagamento;
  frete?: number;
  itens: CreatePedidoItemDto[];
  // ... outros campos opcionais
}

export interface Pedido {
  id: number;
  numero_pedido: string;
  tipo: TipoPedido;
  status: StatusPedido;
  cliente_id?: number | null;
  cliente?: Cliente | null;
  fornecedor_id?: number | null;
  fornecedor?: Fornecedor | null;
  transportadora_id?: number | null;
  transportadora?: Transportadora | null;
  data_pedido: string;
  subtotal: number;
  desconto_valor: number;
  frete: number;
  valor_total: number;
  itens: PedidoItem[];
  created_at: string;
  updated_at: string;
}

export interface PedidoItem {
  id: number;
  produto_id: number;
  produto?: Produto;
  quantidade: number;
  preco_unitario: number;
  desconto: number;
  subtotal: number;
}

// api.ts
const API_BASE_URL = 'http://seu-backend.com/api/v1/pedidos';

export const pedidoApi = {
  criar: async (
    dados: CreatePedidoDto,
    token: string
  ): Promise<Pedido> => {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(dados)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao criar pedido');
    }

    return response.json();
  },

  listar: async (
    token: string,
    filtros: {
      tipo?: TipoPedido;
      status?: StatusPedido;
      cliente_id?: number;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ pedidos: Pedido[]; total: number }> => {
    const params = new URLSearchParams();
    
    if (filtros.tipo) params.append('tipo', filtros.tipo);
    if (filtros.status) params.append('status', filtros.status);
    if (filtros.cliente_id) params.append('cliente_id', filtros.cliente_id.toString());
    if (filtros.page) params.append('page', filtros.page.toString());
    if (filtros.limit) params.append('limit', filtros.limit.toString());

    const response = await fetch(`${API_BASE_URL}?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Erro ao listar pedidos');
    }

    return response.json();
  },

  buscarPorId: async (
    id: number,
    token: string
  ): Promise<Pedido> => {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Pedido não encontrado');
    }

    return response.json();
  },

  atualizar: async (
    id: number,
    dados: Partial<CreatePedidoDto>,
    token: string
  ): Promise<Pedido> => {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(dados)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao atualizar pedido');
    }

    return response.json();
  },

  cancelar: async (
    id: number,
    token: string
  ): Promise<Pedido> => {
    const response = await fetch(`${API_BASE_URL}/${id}/cancelar`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao cancelar pedido');
    }

    return response.json();
  }
};

// Uso
const exemplo = async () => {
  const token = 'seu-token-jwt';

  // Criar pedido de venda
  const novoPedido = await pedidoApi.criar({
    tipo: TipoPedido.VENDA,
    data_pedido: '2025-01-15',
    cliente_id: 1,
    transportadora_id: 1,
    forma_pagamento: FormaPagamento.PIX,
    frete: 50.00,
    itens: [
      {
        produto_id: 1,
        quantidade: 10,
        preco_unitario: 100.00
      }
    ]
  }, token);

  console.log('Pedido criado:', novoPedido);
  console.log('Número do pedido:', novoPedido.numero_pedido);
  console.log('Valor total:', novoPedido.valor_total);

  // Atualizar pedido
  const pedidoAtualizado = await pedidoApi.atualizar(
    novoPedido.id,
    {
      status: StatusPedido.APROVADO,
      transportadora_id: 2
    },
    token
  );

  console.log('Pedido atualizado:', pedidoAtualizado);
};
```

---

## 🧪 Teste Manual (Postman/Insomnia)

### Requisição de Teste - Criar Pedido de Venda

```http
POST http://seu-backend.com/api/v1/pedidos
Content-Type: application/json
Authorization: Bearer seu-token-jwt

{
  "tipo": "VENDA",
  "data_pedido": "2025-01-15",
  "cliente_id": 1,
  "transportadora_id": 1,
  "forma_pagamento": "PIX",
  "condicao_pagamento": "À vista",
  "frete": 50.00,
  "itens": [
    {
      "produto_id": 1,
      "quantidade": 10,
      "preco_unitario": 100.00,
      "desconto": 0
    },
    {
      "produto_id": 2,
      "quantidade": 5,
      "preco_unitario": 200.00,
      "desconto": 50.00
    }
  ],
  "observacoes_cliente": "Entrega preferencial pela manhã"
}
```

### Resposta Esperada

```json
{
  "id": 1,
  "numero_pedido": "VENDA-0001",
  "tipo": "VENDA",
  "status": "PENDENTE",
  "cliente_id": 1,
  "cliente": {
    "id": 1,
    "nome": "Cliente Exemplo"
  },
  "transportadora_id": 1,
  "transportadora": {
    "id": 1,
    "nome": "Transportadora Express"
  },
  "data_pedido": "2025-01-15T00:00:00.000Z",
  "subtotal": 2450.00,
  "desconto_valor": 50.00,
  "desconto_percentual": 0,
  "frete": 50.00,
  "outras_taxas": 0,
  "valor_total": 2450.00,
  "itens": [
    {
      "id": 1,
      "produto_id": 1,
      "quantidade": 10,
      "preco_unitario": 100.00,
      "desconto": 0,
      "subtotal": 1000.00
    },
    {
      "id": 2,
      "produto_id": 2,
      "quantidade": 5,
      "preco_unitario": 200.00,
      "desconto": 50.00,
      "subtotal": 950.00
    }
  ],
  "created_at": "2025-01-15T10:30:00.000Z",
  "updated_at": "2025-01-15T10:30:00.000Z"
}
```

---

## ✅ Checklist para o Frontend

- [ ] Campo `tipo` está presente ('VENDA' ou 'COMPRA')
- [ ] Campo `data_pedido` está no formato ISO correto
- [ ] `cliente_id` está presente se `tipo = 'VENDA'`
- [ ] `fornecedor_id` está presente se `tipo = 'COMPRA'`
- [ ] Array `itens` tem pelo menos 1 item
- [ ] Cada item tem `produto_id`, `quantidade` e `preco_unitario`
- [ ] Header `Content-Type: application/json` está presente
- [ ] Token de autenticação está sendo enviado
- [ ] Dados estão sendo serializados com `JSON.stringify()`
- [ ] URL inclui o prefixo `/api/v1`

---

**Última atualização:** Janeiro 2024  
**Versão do Backend:** NestJS com TypeORM  
**Status:** ✅ Backend funcionando corretamente

