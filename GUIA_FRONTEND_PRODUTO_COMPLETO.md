# 📘 Guia Completo - API de Produtos (Frontend)

Este guia contém todas as informações necessárias para integrar o frontend com a API de Produtos do backend, incluindo DTOs, Enums, Entity e exemplos práticos.

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

### Análise Técnica

**Status:** ✅ **BACKEND FUNCIONANDO CORRETAMENTE**

O backend está configurado corretamente para receber os campos `estoque_maximo` e `localizacao`:

1. ✅ **DTO (CreateProdutoDto)**: Campos definidos como opcionais com validações corretas
2. ✅ **Entity (Produto)**: Campos definidos na entidade do banco de dados
3. ✅ **Service (ProdutoService)**: Campos extraídos, inseridos no SQL e retornados na resposta
4. ✅ **Controller (ProdutoController)**: Recebe e valida os dados corretamente
5. ✅ **ValidationPipe**: Configurado para transformar tipos automaticamente

### Configuração do ValidationPipe

O backend está configurado com:
- `whitelist: true` - Remove campos não definidos no DTO
- `transform: true` - Transforma tipos automaticamente
- `enableImplicitConversion: true` - Converte tipos implicitamente

**Conclusão:** O backend não precisa de ajustes. Os dados serão recebidos corretamente se enviados no formato correto.

---

## 🔗 Endpoints Disponíveis

### Base URL
```
http://seu-backend.com/api/v1/produtos
ou
http://seu-backend.com/api/v1/produto
```

**Nota:** O backend usa o prefixo `/api/v1` por padrão.

### Métodos HTTP

| Método | Endpoint | Descrição | Permissões |
|--------|----------|-----------|------------|
| `POST` | `/api/v1/produtos` | Criar novo produto | ADMIN, GERENTE, VENDEDOR |
| `GET` | `/api/v1/produtos` | Listar produtos (paginação) | Todos autenticados |
| `GET` | `/api/v1/produtos/:id` | Buscar produto por ID | Todos autenticados |
| `PATCH` | `/api/v1/produtos/:id` | Atualizar produto | ADMIN, GERENTE, VENDEDOR |
| `DELETE` | `/api/v1/produtos/:id` | Deletar produto | ADMIN, GERENTE, VENDEDOR |
| `GET` | `/api/v1/produtos/sugestoes` | Buscar sugestões (autocomplete) | Todos autenticados |
| `GET` | `/api/v1/produtos/buscar-avancado` | Busca avançada com filtros | Todos autenticados |
| `GET` | `/api/v1/produtos/categoria/:categoriaId` | Produtos por categoria | Todos autenticados |
| `GET` | `/api/v1/produtos/fornecedor/:fornecedorId` | Produtos por fornecedor | Todos autenticados |
| `GET` | `/api/v1/produtos/ativos` | Produtos ativos | Todos autenticados |
| `GET` | `/api/v1/produtos/preco` | Produtos por faixa de preço | Todos autenticados |
| `GET` | `/api/v1/produtos/estoque` | Produtos por estoque | Todos autenticados |
| `GET` | `/api/v1/produtos/validade` | Produtos por validade | Todos autenticados |

---

## 🔐 Autenticação

Todas as requisições requerem autenticação via Bearer Token no header:

```javascript
headers: {
  'Authorization': `Bearer ${seuTokenJWT}`,
  'Content-Type': 'application/json'
}
```

---

## 📦 DTOs (Data Transfer Objects)

### CreateProdutoDto (Criar Produto)

```typescript
interface CreateProdutoDto {
  // ⚠️ CAMPOS OBRIGATÓRIOS
  nome: string;                    // 2-255 caracteres
  sku: string;                      // Máx 100 caracteres, único
  preco_custo: number;             // Decimal (2 casas decimais)
  preco_venda: number;             // Decimal (2 casas decimais)
  estoque_atual: number;           // Número inteiro
  estoque_minimo: number;          // Número inteiro

  // ✅ CAMPOS OPCIONAIS
  descricao?: string;               // Máx 2000 caracteres
  preco_promocional?: number;       // Decimal (2 casas decimais)
  estoque_maximo?: number;          // ⭐ Número inteiro (OPCIONAL)
  localizacao?: string;             // ⭐ Máx 255 caracteres (OPCIONAL)
  statusProduto?: StatusProduto;    // 'ATIVO' | 'INATIVO' (padrão: 'ATIVO')
  unidade_medida?: UnidadeMedida;   // 'UN' | 'KG' | 'LT' | 'CX' (padrão: 'UN')
  data_validade?: string;           // Formato: 'YYYY-MM-DD'
  ncm?: string;                     // Máx 20 caracteres
  cest?: string;                    // Máx 20 caracteres
  cfop?: string;                    // Máx 20 caracteres
  observacoes?: string;             // Texto livre
  peso?: number;                    // Decimal (3 casas decimais), > 0
  altura?: number;                  // Decimal (2 casas decimais), > 0
  largura?: number;                 // Decimal (2 casas decimais), > 0
  categoriaId?: number;             // ID da categoria
  fornecedorId?: number;            // ID do fornecedor
}
```

### UpdateProdutoDto (Atualizar Produto)

```typescript
// Todos os campos são opcionais (PartialType)
type UpdateProdutoDto = Partial<CreateProdutoDto>;
```

---

## 🔢 Enums

### StatusProduto

```typescript
enum StatusProduto {
  ATIVO = 'ATIVO',
  INATIVO = 'INATIVO'
}
```

**Valores aceitos:**
- `'ATIVO'` - Produto ativo e disponível
- `'INATIVO'` - Produto inativo (não disponível)

**Padrão:** `'ATIVO'` (se não informado)

### UnidadeMedida

```typescript
enum UnidadeMedida {
  UN = 'UN',  // Unidade
  KG = 'KG',  // Quilograma
  LT = 'LT',  // Litro
  CX = 'CX'   // Caixa
}
```

**Valores aceitos:**
- `'UN'` - Unidade
- `'KG'` - Quilograma
- `'LT'` - Litro
- `'CX'` - Caixa

**Padrão:** `'UN'` (se não informado)

---

## 🗄️ Entity (Estrutura de Resposta)

### Produto (Resposta do Backend)

```typescript
interface Produto {
  id: number;                       // Gerado automaticamente
  nome: string;
  descricao?: string | null;
  sku: string;                       // Único
  preco_custo: number;
  preco_venda: number;
  preco_promocional?: number | null;
  estoque_atual: number;
  estoque_minimo: number;
  estoque_maximo?: number | null;   // ⭐ Pode ser null se não informado
  localizacao?: string | null;      // ⭐ Pode ser null se não informado
  statusProduto: StatusProduto;     // 'ATIVO' | 'INATIVO'
  unidade_medida: UnidadeMedida;    // 'UN' | 'KG' | 'LT' | 'CX'
  data_validade?: string | null;     // Formato: 'YYYY-MM-DD'
  ncm?: string | null;
  cest?: string | null;
  cfop?: string | null;
  observacoes?: string | null;
  peso?: number | null;
  altura?: number | null;
  largura?: number | null;
  categoriaId?: number | null;
  fornecedorId?: number | null;
  categoria?: Categoria | null;      // Objeto completo (se relacionado)
  fornecedor?: Fornecedor | null;    // Objeto completo (se relacionado)
  criadoEm: string;                  // ISO 8601: '2024-01-15T10:30:00.000Z'
  atualizadoEm: string;              // ISO 8601: '2024-01-15T10:30:00.000Z'
}
```

---

## 💻 Exemplos de Requisições

### 1. Criar Produto (POST)

#### JavaScript/TypeScript (Fetch API)

```typescript
interface CreateProdutoDto {
  nome: string;
  sku: string;
  preco_custo: number;
  preco_venda: number;
  estoque_atual: number;
  estoque_minimo: number;
  estoque_maximo?: number;      // ⭐ OPCIONAL
  localizacao?: string;         // ⭐ OPCIONAL
  descricao?: string;
  preco_promocional?: number;
  statusProduto?: 'ATIVO' | 'INATIVO';
  unidade_medida?: 'UN' | 'KG' | 'LT' | 'CX';
  data_validade?: string;
  ncm?: string;
  cest?: string;
  cfop?: string;
  observacoes?: string;
  peso?: number;
  altura?: number;
  largura?: number;
  categoriaId?: number;
  fornecedorId?: number;
}

const criarProduto = async (produtoData: CreateProdutoDto) => {
  try {
    const response = await fetch('http://seu-backend.com/api/v1/produtos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${seuToken}`
      },
      body: JSON.stringify(produtoData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao criar produto');
    }

    const produto: Produto = await response.json();
    return produto;
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    throw error;
  }
};

// Exemplo de uso
const novoProduto = await criarProduto({
  nome: "Notebook Dell Inspiron",
  descricao: "Notebook com processador Intel i5, 8GB RAM, SSD 256GB",
  sku: "NOTE-DELL-001",
  preco_custo: 1500.00,
  preco_venda: 2000.00,
  preco_promocional: 1800.00,
  estoque_atual: 50,
  estoque_minimo: 10,
  estoque_maximo: 1000,        // ⭐ Campo opcional
  localizacao: "Prateleira A-15", // ⭐ Campo opcional
  statusProduto: "ATIVO",
  unidade_medida: "UN",
  categoriaId: 1,
  fornecedorId: 1
});
```

#### Axios

```typescript
import axios from 'axios';

const criarProduto = async (produtoData: CreateProdutoDto) => {
  try {
    const response = await axios.post<Produto>(
      'http://seu-backend.com/api/v1/produtos',
      produtoData,
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
      throw new Error(error.response?.data?.message || 'Erro ao criar produto');
    }
    throw error;
  }
};
```

#### React Hook Form

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Schema de validação com Zod
const produtoSchema = z.object({
  nome: z.string().min(2).max(255),
  sku: z.string().max(100),
  preco_custo: z.number().positive(),
  preco_venda: z.number().positive(),
  estoque_atual: z.number().int().min(0),
  estoque_minimo: z.number().int().min(0),
  estoque_maximo: z.number().int().min(0).optional(),  // ⭐ Opcional
  localizacao: z.string().max(255).optional(),        // ⭐ Opcional
  descricao: z.string().max(2000).optional(),
  preco_promocional: z.number().positive().optional(),
  statusProduto: z.enum(['ATIVO', 'INATIVO']).optional(),
  unidade_medida: z.enum(['UN', 'KG', 'LT', 'CX']).optional(),
  data_validade: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  categoriaId: z.number().int().positive().optional(),
  fornecedorId: z.number().int().positive().optional(),
});

type ProdutoFormData = z.infer<typeof produtoSchema>;

const ProdutoForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<ProdutoFormData>({
    resolver: zodResolver(produtoSchema)
  });

  const onSubmit = async (data: ProdutoFormData) => {
    try {
      const produto = await criarProduto(data);
      console.log('Produto criado:', produto);
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Campos obrigatórios */}
      <input {...register('nome')} placeholder="Nome do produto" />
      {errors.nome && <span>{errors.nome.message}</span>}

      <input {...register('sku')} placeholder="SKU" />
      {errors.sku && <span>{errors.sku.message}</span>}

      <input 
        type="number" 
        step="0.01"
        {...register('preco_custo', { valueAsNumber: true })} 
        placeholder="Preço de custo" 
      />

      <input 
        type="number" 
        step="0.01"
        {...register('preco_venda', { valueAsNumber: true })} 
        placeholder="Preço de venda" 
      />

      <input 
        type="number" 
        {...register('estoque_atual', { valueAsNumber: true })} 
        placeholder="Estoque atual" 
      />

      <input 
        type="number" 
        {...register('estoque_minimo', { valueAsNumber: true })} 
        placeholder="Estoque mínimo" 
      />

      {/* ⭐ Campos opcionais - Estoque Máximo e Localização */}
      <input 
        type="number" 
        {...register('estoque_maximo', { valueAsNumber: true })} 
        placeholder="Estoque máximo (opcional)" 
      />

      <input 
        {...register('localizacao')} 
        placeholder="Localização (opcional)"
        maxLength={255}
      />

      {/* Outros campos opcionais */}
      <textarea {...register('descricao')} placeholder="Descrição" />

      <select {...register('statusProduto')}>
        <option value="">Selecione...</option>
        <option value="ATIVO">Ativo</option>
        <option value="INATIVO">Inativo</option>
      </select>

      <select {...register('unidade_medida')}>
        <option value="">Selecione...</option>
        <option value="UN">Unidade</option>
        <option value="KG">Quilograma</option>
        <option value="LT">Litro</option>
        <option value="CX">Caixa</option>
      </select>

      <input 
        type="date" 
        {...register('data_validade')} 
        placeholder="Data de validade" 
      />

      <button type="submit">Criar Produto</button>
    </form>
  );
};
```

### 2. Listar Produtos (GET)

```typescript
const listarProdutos = async (
  page: number = 1,
  limit: number = 15,
  statusProduto?: 'ATIVO' | 'INATIVO'
) => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (statusProduto) {
    params.append('statusProduto', statusProduto);
  }

  const response = await fetch(
    `http://seu-backend.com/api/v1/produtos?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${seuToken}`
      }
    }
  );

  const produtos: Produto[] = await response.json();
  return produtos;
};
```

### 3. Buscar Produto por ID (GET)

```typescript
const buscarProdutoPorId = async (id: number): Promise<Produto> => {
  const response = await fetch(
    `http://seu-backend.com/api/v1/produtos/${id}`,
    {
      headers: {
        'Authorization': `Bearer ${seuToken}`
      }
    }
  );

  if (!response.ok) {
    throw new Error('Produto não encontrado');
  }

  const produto: Produto = await response.json();
  return produto;
};
```

### 4. Atualizar Produto (PATCH)

```typescript
const atualizarProduto = async (
  id: number,
  dadosAtualizacao: Partial<CreateProdutoDto>
): Promise<Produto> => {
  const response = await fetch(
    `http://seu-backend.com/api/v1/produtos/${id}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${seuToken}`
      },
      body: JSON.stringify(dadosAtualizacao)
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erro ao atualizar produto');
  }

  const produto: Produto = await response.json();
  return produto;
};

// Exemplo: Atualizar apenas estoque máximo e localização
await atualizarProduto(1, {
  estoque_maximo: 2000,        // ⭐ Atualizar estoque máximo
  localizacao: "Prateleira B-20" // ⭐ Atualizar localização
});
```

### 5. Deletar Produto (DELETE)

```typescript
const deletarProduto = async (id: number): Promise<void> => {
  const response = await fetch(
    `http://seu-backend.com/api/v1/produtos/${id}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${seuToken}`
      }
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erro ao deletar produto');
  }
};
```

### 6. Buscar Sugestões (Autocomplete)

```typescript
const buscarSugestoes = async (
  termo: string,
  limit: number = 10,
  apenasAtivos: boolean = true
) => {
  const params = new URLSearchParams({
    termo,
    limit: limit.toString(),
    apenasAtivos: apenasAtivos.toString()
  });

  const response = await fetch(
    `http://seu-backend.com/api/v1/produtos/sugestoes?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${seuToken}`
      }
    }
  );

  const sugestoes = await response.json();
  return sugestoes;
};
```

---

## ✅ Validações e Regras

### Campos Obrigatórios

| Campo | Tipo | Validação |
|-------|------|-----------|
| `nome` | string | 2-255 caracteres |
| `sku` | string | Máx 100 caracteres, único |
| `preco_custo` | number | Decimal (2 casas), > 0 |
| `preco_venda` | number | Decimal (2 casas), > 0 |
| `estoque_atual` | number | Inteiro, ≥ 0 |
| `estoque_minimo` | number | Inteiro, ≥ 0 |

### Campos Opcionais

| Campo | Tipo | Validação |
|-------|------|-----------|
| `estoque_maximo` | number | ⭐ Inteiro, ≥ 0 |
| `localizacao` | string | ⭐ Máx 255 caracteres |
| `descricao` | string | Máx 2000 caracteres |
| `preco_promocional` | number | Decimal (2 casas), > 0 |
| `statusProduto` | enum | 'ATIVO' ou 'INATIVO' |
| `unidade_medida` | enum | 'UN', 'KG', 'LT', 'CX' |
| `data_validade` | string | Formato: 'YYYY-MM-DD' |
| `ncm` | string | Máx 20 caracteres |
| `cest` | string | Máx 20 caracteres |
| `cfop` | string | Máx 20 caracteres |
| `peso` | number | Decimal (3 casas), > 0 |
| `altura` | number | Decimal (2 casas), > 0 |
| `largura` | number | Decimal (2 casas), > 0 |
| `categoriaId` | number | ID válido de categoria |
| `fornecedorId` | number | ID válido de fornecedor |

### ⚠️ Regras Importantes

1. **SKU deve ser único**: Não pode haver dois produtos com o mesmo SKU
2. **Nomenclatura**: Use sempre **snake_case** para os nomes dos campos:
   - ✅ `estoque_maximo` (correto)
   - ❌ `estoqueMaximo` (incorreto)
   - ✅ `localizacao` (correto)
   - ❌ `localização` (incorreto - sem acento)
3. **Tipos de Dados**:
   - Números devem ser enviados como `number`, não como `string`
   - Datas devem estar no formato `'YYYY-MM-DD'`
4. **Valores Padrão**:
   - `statusProduto`: `'ATIVO'` (se não informado)
   - `unidade_medida`: `'UN'` (se não informado)
5. **Campos Opcionais**:
   - Se não enviados, serão salvos como `null` no banco de dados
   - Podem ser omitidos completamente do objeto JSON

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
| `409` | Conflito (ex: SKU duplicado) |
| `500` | Erro interno do servidor |

### Exemplo de Tratamento de Erros

```typescript
const criarProdutoComTratamento = async (produtoData: CreateProdutoDto) => {
  try {
    const response = await fetch('http://seu-backend.com/api/v1/produtos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${seuToken}`
      },
      body: JSON.stringify(produtoData)
    });

    if (!response.ok) {
      const error = await response.json();
      
      switch (response.status) {
        case 400:
          // Erro de validação
          console.error('Dados inválidos:', error.message);
          // error.message pode conter detalhes dos campos inválidos
          break;
        case 401:
          console.error('Não autenticado. Faça login novamente.');
          break;
        case 403:
          console.error('Sem permissão para criar produto.');
          break;
        case 409:
          console.error('SKU já cadastrado:', error.message);
          break;
        default:
          console.error('Erro desconhecido:', error.message);
      }
      
      throw new Error(error.message || 'Erro ao criar produto');
    }

    const produto: Produto = await response.json();
    return produto;
  } catch (error) {
    console.error('Erro:', error);
    throw error;
  }
};
```

---

## 🔍 Troubleshooting

### Problema: Campos `estoque_maximo` e `localizacao` não estão sendo salvos

**Possíveis causas e soluções:**

1. **Nomes dos campos incorretos**
   ```typescript
   // ❌ ERRADO
   {
     estoqueMaximo: 1000,      // camelCase
     localização: "A-15"       // Com acento
   }

   // ✅ CORRETO
   {
     estoque_maximo: 1000,     // snake_case
     localizacao: "A-15"       // Sem acento
   }
   ```

2. **Campos não estão sendo enviados no body**
   ```typescript
   // ❌ ERRADO - Campos não estão no objeto
   const produto = {
     nome: "Produto",
     sku: "SKU-001",
     preco_custo: 100,
     preco_venda: 150,
     estoque_atual: 50,
     estoque_minimo: 10
     // estoque_maximo e localizacao faltando
   };

   // ✅ CORRETO - Campos incluídos
   const produto = {
     nome: "Produto",
     sku: "SKU-001",
     preco_custo: 100,
     preco_venda: 150,
     estoque_atual: 50,
     estoque_minimo: 10,
     estoque_maximo: 1000,        // ⭐ Incluído
     localizacao: "Prateleira A-15" // ⭐ Incluído
   };
   ```

3. **Tipos de dados incorretos**
   ```typescript
   // ❌ ERRADO - String ao invés de number
   {
     estoque_maximo: "1000"  // String
   }

   // ✅ CORRETO - Number
   {
     estoque_maximo: 1000    // Number
   }
   ```

4. **Content-Type não está configurado**
   ```typescript
   // ✅ Certifique-se de incluir o header
   headers: {
     'Content-Type': 'application/json',
     'Authorization': `Bearer ${token}`
   }
   ```

5. **URL incorreta (faltando prefixo /api/v1)**
   ```typescript
   // ❌ ERRADO
   'http://seu-backend.com/produtos'

   // ✅ CORRETO
   'http://seu-backend.com/api/v1/produtos'
   ```

### Problema: Erro de validação

**Solução:** Verifique:
- Todos os campos obrigatórios estão presentes
- Tipos de dados estão corretos (number, string, etc.)
- Valores estão dentro dos limites (ex: nome 2-255 caracteres)
- Enums estão com valores válidos ('ATIVO'/'INATIVO', 'UN'/'KG'/'LT'/'CX')

### Problema: SKU já cadastrado (409)

**Solução:** O SKU deve ser único. Verifique se já existe um produto com o mesmo SKU antes de criar.

### Problema: Campos opcionais sendo removidos

**Solução:** O ValidationPipe está configurado com `whitelist: true`, então apenas campos definidos no DTO serão aceitos. Certifique-se de que os campos estão definidos no DTO (já estão ✅).

---

## 📝 Exemplo Completo de Integração

```typescript
// tipos.ts
export enum StatusProduto {
  ATIVO = 'ATIVO',
  INATIVO = 'INATIVO'
}

export enum UnidadeMedida {
  UN = 'UN',
  KG = 'KG',
  LT = 'LT',
  CX = 'CX'
}

export interface CreateProdutoDto {
  nome: string;
  sku: string;
  preco_custo: number;
  preco_venda: number;
  estoque_atual: number;
  estoque_minimo: number;
  estoque_maximo?: number;      // ⭐ OPCIONAL
  localizacao?: string;         // ⭐ OPCIONAL
  descricao?: string;
  preco_promocional?: number;
  statusProduto?: StatusProduto;
  unidade_medida?: UnidadeMedida;
  data_validade?: string;
  categoriaId?: number;
  fornecedorId?: number;
}

export interface Produto {
  id: number;
  nome: string;
  sku: string;
  preco_custo: number;
  preco_venda: number;
  estoque_atual: number;
  estoque_minimo: number;
  estoque_maximo?: number | null;   // ⭐ Pode ser null
  localizacao?: string | null;      // ⭐ Pode ser null
  statusProduto: StatusProduto;
  unidade_medida: UnidadeMedida;
  criadoEm: string;
  atualizadoEm: string;
  // ... outros campos
}

// api.ts
const API_BASE_URL = 'http://seu-backend.com/api/v1/produtos';

export const produtoApi = {
  criar: async (dados: CreateProdutoDto, token: string): Promise<Produto> => {
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
      throw new Error(error.message || 'Erro ao criar produto');
    }

    return response.json();
  },

  listar: async (token: string, page = 1, limit = 15): Promise<Produto[]> => {
    const response = await fetch(
      `${API_BASE_URL}?page=${page}&limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('Erro ao listar produtos');
    }

    return response.json();
  },

  buscarPorId: async (id: number, token: string): Promise<Produto> => {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Produto não encontrado');
    }

    return response.json();
  },

  atualizar: async (
    id: number,
    dados: Partial<CreateProdutoDto>,
    token: string
  ): Promise<Produto> => {
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
      throw new Error(error.message || 'Erro ao atualizar produto');
    }

    return response.json();
  },

  deletar: async (id: number, token: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao deletar produto');
    }
  }
};

// Uso
const exemplo = async () => {
  const token = 'seu-token-jwt';

  // Criar produto com estoque_maximo e localizacao
  const novoProduto = await produtoApi.criar({
    nome: "Notebook Dell",
    sku: "NOTE-DELL-001",
    preco_custo: 1500,
    preco_venda: 2000,
    estoque_atual: 50,
    estoque_minimo: 10,
    estoque_maximo: 1000,        // ⭐ Campo opcional
    localizacao: "Prateleira A-15" // ⭐ Campo opcional
  }, token);

  console.log('Produto criado:', novoProduto);
  console.log('Estoque máximo:', novoProduto.estoque_maximo);
  console.log('Localização:', novoProduto.localizacao);

  // Atualizar apenas estoque_maximo e localizacao
  const produtoAtualizado = await produtoApi.atualizar(
    novoProduto.id,
    {
      estoque_maximo: 2000,
      localizacao: "Prateleira B-20"
    },
    token
  );

  console.log('Produto atualizado:', produtoAtualizado);
};
```

---

## 🧪 Teste Manual (Postman/Insomnia)

### Requisição de Teste

```http
POST http://seu-backend.com/api/v1/produtos
Content-Type: application/json
Authorization: Bearer seu-token-jwt

{
  "nome": "Produto Teste",
  "sku": "TEST-001",
  "preco_custo": 100.00,
  "preco_venda": 150.00,
  "estoque_atual": 50,
  "estoque_minimo": 10,
  "estoque_maximo": 1000,
  "localizacao": "Prateleira A-15"
}
```

### Resposta Esperada

```json
{
  "id": 1,
  "nome": "Produto Teste",
  "sku": "TEST-001",
  "preco_custo": 100.00,
  "preco_venda": 150.00,
  "estoque_atual": 50,
  "estoque_minimo": 10,
  "estoque_maximo": 1000,
  "localizacao": "Prateleira A-15",
  "statusProduto": "ATIVO",
  "unidade_medida": "UN",
  "criadoEm": "2024-01-15T10:30:00.000Z",
  "atualizadoEm": "2024-01-15T10:30:00.000Z"
}
```

---

## 📞 Resumo dos Campos Críticos

### ⭐ Campos Novos (estoque_maximo e localizacao)

```typescript
{
  estoque_maximo: 1000,        // number (opcional)
  localizacao: "Prateleira A-15" // string, máx 255 caracteres (opcional)
}
```

**Importante:**
- ✅ Use `estoque_maximo` (snake_case, sem acento)
- ✅ Use `localizacao` (sem acento)
- ✅ Envie como `number` e `string` respectivamente
- ✅ Ambos são opcionais (podem ser omitidos)
- ✅ Se não enviados, serão salvos como `null` no banco
- ✅ Use a URL completa: `/api/v1/produtos` (não apenas `/produtos`)

---

## ✅ Checklist para o Frontend

- [ ] Campos estão sendo enviados com nomes corretos (`estoque_maximo`, `localizacao`)
- [ ] Campos estão no objeto JSON enviado no body
- [ ] `estoque_maximo` é enviado como `number` (não string)
- [ ] `localizacao` é enviado como `string`
- [ ] Header `Content-Type: application/json` está presente
- [ ] Token de autenticação está sendo enviado
- [ ] Dados estão sendo serializados com `JSON.stringify()`
- [ ] URL inclui o prefixo `/api/v1`

---

**Última atualização:** Janeiro 2024  
**Versão do Backend:** NestJS com TypeORM  
**Status:** ✅ Backend funcionando corretamente - Não precisa de ajustes

