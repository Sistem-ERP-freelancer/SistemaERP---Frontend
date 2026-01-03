# 📘 Guia Completo - API de Transportadoras (Frontend)

Este guia contém todas as informações necessárias para integrar o frontend com a API de Transportadoras do backend, incluindo DTOs, Entity e exemplos práticos.

---

## 📋 Índice

1. [Status do Backend](#status-do-backend)
2. [Endpoints Disponíveis](#endpoints-disponíveis)
3. [Autenticação](#autenticação)
4. [DTOs (Data Transfer Objects)](#dtos-data-transfer-objects)
5. [Entity (Estrutura de Resposta)](#entity-estrutura-de-resposta)
6. [Exemplos de Requisições](#exemplos-de-requisições)
7. [Validações e Regras](#validações-e-regras)
8. [Tratamento de Erros](#tratamento-de-erros)
9. [Troubleshooting](#troubleshooting)

---

## ✅ Status do Backend

**Status:** ✅ **BACKEND FUNCIONANDO CORRETAMENTE**

O backend está configurado corretamente para gerenciar transportadoras com:
- ✅ Criação de transportadoras
- ✅ Listagem com paginação e busca
- ✅ Atualização de transportadoras
- ✅ Exclusão (soft delete)
- ✅ Ativação/Desativação
- ✅ Busca por nome ou CNPJ
- ✅ Busca de pedidos por transportadora

---

## 🔗 Endpoints Disponíveis

### Base URL
```
http://seu-backend.com/api/v1/transportadoras
```

**Nota:** O backend usa o prefixo `/api/v1` por padrão.

### Métodos HTTP

| Método | Endpoint | Descrição | Permissões |
|--------|----------|-----------|------------|
| `POST` | `/api/v1/transportadoras` | Criar nova transportadora | ADMIN, GERENTE |
| `GET` | `/api/v1/transportadoras` | Listar transportadoras (paginação e busca) | Todos autenticados |
| `GET` | `/api/v1/transportadoras/:id` | Buscar transportadora por ID | Todos autenticados |
| `GET` | `/api/v1/transportadoras/buscar` | Buscar por nome ou CNPJ | Todos autenticados |
| `GET` | `/api/v1/transportadoras/:identificador/pedidos` | Buscar pedidos por transportadora | Todos autenticados |
| `PATCH` | `/api/v1/transportadoras/:id` | Atualizar transportadora | ADMIN, GERENTE |
| `PATCH` | `/api/v1/transportadoras/:id/status` | Ativar/Desativar transportadora | ADMIN, GERENTE |
| `DELETE` | `/api/v1/transportadoras/:id` | Deletar transportadora (soft delete) | ADMIN, GERENTE |

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

### CreateTransportadoraDto (Criar Transportadora)

```typescript
interface CreateTransportadoraDto {
  // ⚠️ CAMPOS OBRIGATÓRIOS
  nome: string;                    // 3-255 caracteres

  // ✅ CAMPOS OPCIONAIS
  nome_fantasia?: string;           // Máx 255 caracteres
  cnpj?: string;                   // Aceita formatado ou apenas números (14 dígitos)
  inscricao_estadual?: string;     // Máx 50 caracteres
  telefone?: string;                // Máx 20 caracteres
  email?: string;                  // Formato de email válido
  cep?: string;                    // 8-10 caracteres
  logradouro?: string;             // Máx 255 caracteres
  numero?: string;                 // Máx 20 caracteres
  complemento?: string;            // Máx 100 caracteres
  bairro?: string;                 // Máx 100 caracteres
  cidade?: string;                 // Máx 100 caracteres
  estado?: string;                 // Exatamente 2 caracteres (UF)
  ativo?: boolean;                 // Padrão: true
  observacoes?: string;            // Texto livre
}
```

### UpdateTransportadoraDto (Atualizar Transportadora)

```typescript
// Todos os campos são opcionais (PartialType)
type UpdateTransportadoraDto = Partial<CreateTransportadoraDto>;
```

---

## 🗄️ Entity (Estrutura de Resposta)

### Transportadora (Resposta do Backend)

```typescript
interface Transportadora {
  id: number;                      // Gerado automaticamente
  nome: string;
  nome_fantasia?: string | null;
  cnpj?: string | null;            // Único
  inscricao_estadual?: string | null;
  telefone?: string | null;
  email?: string | null;
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;          // UF (2 caracteres)
  ativo: boolean;                  // Padrão: true
  observacoes?: string | null;
  pedidos?: Pedido[];              // Array de pedidos (se incluído)
  created_at: string;              // ISO 8601: '2024-01-15T10:30:00.000Z'
  updated_at: string;              // ISO 8601: '2024-01-15T10:30:00.000Z'
}
```

---

## 💻 Exemplos de Requisições

### 1. Criar Transportadora (POST)

#### JavaScript/TypeScript (Fetch API)

```typescript
interface CreateTransportadoraDto {
  nome: string;
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

const criarTransportadora = async (transportadoraData: CreateTransportadoraDto) => {
  try {
    const response = await fetch('http://seu-backend.com/api/v1/transportadoras', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${seuToken}`
      },
      body: JSON.stringify(transportadoraData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao criar transportadora');
    }

    const transportadora: Transportadora = await response.json();
    return transportadora;
  } catch (error) {
    console.error('Erro ao criar transportadora:', error);
    throw error;
  }
};

// Exemplo de uso
const novaTransportadora = await criarTransportadora({
  nome: "Transportadora Express",
  nome_fantasia: "Express Log",
  cnpj: "12345678000190",
  inscricao_estadual: "123.456.789.012",
  telefone: "(11) 99999-9999",
  email: "contato@transportadora.com",
  cep: "01310-100",
  logradouro: "Avenida Paulista",
  numero: "1000",
  complemento: "Sala 101",
  bairro: "Bela Vista",
  cidade: "São Paulo",
  estado: "SP",
  ativo: true,
  observacoes: "Transportadora especializada em entregas rápidas"
});
```

#### Axios

```typescript
import axios from 'axios';

const criarTransportadora = async (transportadoraData: CreateTransportadoraDto) => {
  try {
    const response = await axios.post<Transportadora>(
      'http://seu-backend.com/api/v1/transportadoras',
      transportadoraData,
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
      throw new Error(error.response?.data?.message || 'Erro ao criar transportadora');
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
const transportadoraSchema = z.object({
  nome: z.string().min(3).max(255),
  nome_fantasia: z.string().max(255).optional(),
  cnpj: z.string().optional(),
  inscricao_estadual: z.string().max(50).optional(),
  telefone: z.string().max(20).optional(),
  email: z.string().email().optional().or(z.literal('')),
  cep: z.string().min(8).max(10).optional(),
  logradouro: z.string().max(255).optional(),
  numero: z.string().max(20).optional(),
  complemento: z.string().max(100).optional(),
  bairro: z.string().max(100).optional(),
  cidade: z.string().max(100).optional(),
  estado: z.string().length(2).optional(),
  ativo: z.boolean().optional(),
  observacoes: z.string().optional(),
});

type TransportadoraFormData = z.infer<typeof transportadoraSchema>;

const TransportadoraForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<TransportadoraFormData>({
    resolver: zodResolver(transportadoraSchema),
    defaultValues: {
      ativo: true
    }
  });

  const onSubmit = async (data: TransportadoraFormData) => {
    try {
      // Converter strings vazias em undefined
      const cleanedData = Object.fromEntries(
        Object.entries(data).map(([key, value]) => [
          key,
          value === '' ? undefined : value
        ])
      );

      const transportadora = await criarTransportadora(cleanedData);
      console.log('Transportadora criada:', transportadora);
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Campo obrigatório */}
      <input {...register('nome')} placeholder="Nome da transportadora" />
      {errors.nome && <span>{errors.nome.message}</span>}

      {/* Campos opcionais */}
      <input {...register('nome_fantasia')} placeholder="Nome fantasia (opcional)" />
      
      <input {...register('cnpj')} placeholder="CNPJ (opcional)" />
      
      <input {...register('inscricao_estadual')} placeholder="Inscrição estadual (opcional)" />
      
      <input {...register('telefone')} placeholder="Telefone (opcional)" />
      
      <input 
        type="email" 
        {...register('email')} 
        placeholder="Email (opcional)" 
      />
      
      <input {...register('cep')} placeholder="CEP (opcional)" />
      
      <input {...register('logradouro')} placeholder="Logradouro (opcional)" />
      
      <input {...register('numero')} placeholder="Número (opcional)" />
      
      <input {...register('complemento')} placeholder="Complemento (opcional)" />
      
      <input {...register('bairro')} placeholder="Bairro (opcional)" />
      
      <input {...register('cidade')} placeholder="Cidade (opcional)" />
      
      <input 
        {...register('estado')} 
        placeholder="Estado (UF - 2 caracteres)" 
        maxLength={2}
      />
      
      <label>
        <input type="checkbox" {...register('ativo')} defaultChecked />
        Ativo
      </label>
      
      <textarea {...register('observacoes')} placeholder="Observações (opcional)" />

      <button type="submit">Criar Transportadora</button>
    </form>
  );
};
```

### 2. Listar Transportadoras (GET)

```typescript
interface ListarTransportadorasParams {
  page?: number;           // Padrão: 1
  limit?: number;          // Padrão: 15
  termo?: string;         // Busca por nome, nome_fantasia ou CNPJ
  apenasAtivos?: boolean; // Padrão: false
}

interface ListarTransportadorasResponse {
  transportadoras: Transportadora[];
  total: number;
}

const listarTransportadoras = async (
  params: ListarTransportadorasParams = {}
): Promise<ListarTransportadorasResponse> => {
  const queryParams = new URLSearchParams();
  
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.termo) queryParams.append('termo', params.termo);
  if (params.apenasAtivos) queryParams.append('apenasAtivos', 'true');

  const response = await fetch(
    `http://seu-backend.com/api/v1/transportadoras?${queryParams}`,
    {
      headers: {
        'Authorization': `Bearer ${seuToken}`
      }
    }
  );

  if (!response.ok) {
    throw new Error('Erro ao listar transportadoras');
  }

  return response.json();
};

// Exemplo de uso
const resultado = await listarTransportadoras({
  page: 1,
  limit: 15,
  termo: "Express",
  apenasAtivos: true
});

console.log(`Total: ${resultado.total}`);
console.log(`Transportadoras:`, resultado.transportadoras);
```

### 3. Buscar Transportadora por ID (GET)

```typescript
const buscarTransportadoraPorId = async (
  id: number,
  incluirPedidos: boolean = false
): Promise<Transportadora> => {
  const params = incluirPedidos ? '?incluirPedidos=true' : '';
  
  const response = await fetch(
    `http://seu-backend.com/api/v1/transportadoras/${id}${params}`,
    {
      headers: {
        'Authorization': `Bearer ${seuToken}`
      }
    }
  );

  if (!response.ok) {
    throw new Error('Transportadora não encontrada');
  }

  return response.json();
};

// Exemplo de uso
const transportadora = await buscarTransportadoraPorId(1, true);
console.log('Transportadora:', transportadora);
console.log('Pedidos:', transportadora.pedidos);
```

### 4. Buscar por Nome ou CNPJ (GET)

```typescript
const buscarPorNomeOuCnpj = async (termo: string): Promise<Transportadora[]> => {
  const response = await fetch(
    `http://seu-backend.com/api/v1/transportadoras/buscar?termo=${encodeURIComponent(termo)}`,
    {
      headers: {
        'Authorization': `Bearer ${seuToken}`
      }
    }
  );

  if (!response.ok) {
    throw new Error('Erro ao buscar transportadoras');
  }

  return response.json();
};

// Exemplo de uso
const transportadoras = await buscarPorNomeOuCnpj("Express");
// Retorna transportadoras que tenham "Express" no nome, nome_fantasia ou CNPJ
```

### 5. Buscar Pedidos por Transportadora (GET)

```typescript
const buscarPedidosPorTransportadora = async (
  identificador: string | number, // ID ou nome da transportadora
  page: number = 1,
  limit: number = 15
) => {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  });

  const response = await fetch(
    `http://seu-backend.com/api/v1/transportadoras/${identificador}/pedidos?${queryParams}`,
    {
      headers: {
        'Authorization': `Bearer ${seuToken}`
      }
    }
  );

  if (!response.ok) {
    throw new Error('Erro ao buscar pedidos');
  }

  return response.json();
};

// Exemplo de uso
const pedidos = await buscarPedidosPorTransportadora(1, 1, 15);
// ou
const pedidosPorNome = await buscarPedidosPorTransportadora("Express", 1, 15);
```

### 6. Atualizar Transportadora (PATCH)

```typescript
const atualizarTransportadora = async (
  id: number,
  dadosAtualizacao: Partial<CreateTransportadoraDto>
): Promise<Transportadora> => {
  // Converter strings vazias em undefined
  const cleanedData = Object.fromEntries(
    Object.entries(dadosAtualizacao).map(([key, value]) => [
      key,
      value === '' ? undefined : value
    ])
  );

  const response = await fetch(
    `http://seu-backend.com/api/v1/transportadoras/${id}`,
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
    throw new Error(error.message || 'Erro ao atualizar transportadora');
  }

  return response.json();
};

// Exemplo: Atualizar apenas alguns campos
await atualizarTransportadora(1, {
  telefone: "(11) 88888-8888",
  email: "novoemail@transportadora.com"
});

// Exemplo: Limpar campo (enviar string vazia)
await atualizarTransportadora(1, {
  observacoes: "" // Será convertido para null no backend
});
```

### 7. Ativar/Desativar Transportadora (PATCH)

```typescript
const alterarStatusTransportadora = async (
  id: number,
  ativo: boolean
): Promise<Transportadora> => {
  const response = await fetch(
    `http://seu-backend.com/api/v1/transportadoras/${id}/status?ativo=${ativo}`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${seuToken}`
      }
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erro ao alterar status');
  }

  return response.json();
};

// Exemplo de uso
await alterarStatusTransportadora(1, false); // Desativar
await alterarStatusTransportadora(1, true);  // Ativar
```

### 8. Deletar Transportadora (DELETE)

```typescript
const deletarTransportadora = async (id: number): Promise<void> => {
  const response = await fetch(
    `http://seu-backend.com/api/v1/transportadoras/${id}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${seuToken}`
      }
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erro ao deletar transportadora');
  }
};

// Exemplo de uso
await deletarTransportadora(1);
```

---

## ✅ Validações e Regras

### Campos Obrigatórios

| Campo | Tipo | Validação |
|-------|------|-----------|
| `nome` | string | 3-255 caracteres |

### Campos Opcionais

| Campo | Tipo | Validação |
|-------|------|-----------|
| `nome_fantasia` | string | Máx 255 caracteres |
| `cnpj` | string | Aceita formatado ou apenas números (14 dígitos), único |
| `inscricao_estadual` | string | Máx 50 caracteres |
| `telefone` | string | Máx 20 caracteres |
| `email` | string | Formato de email válido |
| `cep` | string | 8-10 caracteres |
| `logradouro` | string | Máx 255 caracteres |
| `numero` | string | Máx 20 caracteres |
| `complemento` | string | Máx 100 caracteres |
| `bairro` | string | Máx 100 caracteres |
| `cidade` | string | Máx 100 caracteres |
| `estado` | string | Exatamente 2 caracteres (UF) |
| `ativo` | boolean | Padrão: true |
| `observacoes` | string | Texto livre |

### ⚠️ Regras Importantes

1. **CNPJ deve ser único**: Não pode haver duas transportadoras com o mesmo CNPJ
2. **Nomenclatura**: Use sempre **snake_case** para os nomes dos campos:
   - ✅ `nome_fantasia` (correto)
   - ❌ `nomeFantasia` (incorreto)
3. **Strings Vazias**: Se enviar uma string vazia (`""`), o backend converterá para `null`
4. **Endereço Padrão**: Se nenhum campo de endereço for informado, o backend criará um endereço padrão automaticamente
5. **Estado (UF)**: Deve ter exatamente 2 caracteres (ex: "SP", "RJ", "MG")
6. **CNPJ**: Aceita formatado (`12.345.678/0001-90`) ou apenas números (`12345678000190`)

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
| `409` | Conflito (ex: CNPJ duplicado) |
| `500` | Erro interno do servidor |

### Exemplo de Tratamento de Erros

```typescript
const criarTransportadoraComTratamento = async (
  transportadoraData: CreateTransportadoraDto
) => {
  try {
    const response = await fetch('http://seu-backend.com/api/v1/transportadoras', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${seuToken}`
      },
      body: JSON.stringify(transportadoraData)
    });

    if (!response.ok) {
      const error = await response.json();
      
      switch (response.status) {
        case 400:
          console.error('Dados inválidos:', error.message);
          break;
        case 401:
          console.error('Não autenticado. Faça login novamente.');
          break;
        case 403:
          console.error('Sem permissão para criar transportadora.');
          break;
        case 409:
          console.error('CNPJ já cadastrado:', error.message);
          break;
        default:
          console.error('Erro desconhecido:', error.message);
      }
      
      throw new Error(error.message || 'Erro ao criar transportadora');
    }

    const transportadora: Transportadora = await response.json();
    return transportadora;
  } catch (error) {
    console.error('Erro:', error);
    throw error;
  }
};
```

---

## 🔍 Troubleshooting

### Problema: CNPJ já cadastrado (409)

**Solução:** O CNPJ deve ser único. Verifique se já existe uma transportadora com o mesmo CNPJ antes de criar.

### Problema: Campos não estão sendo salvos

**Solução:** Verifique se:
- Os nomes dos campos estão em **snake_case** (`nome_fantasia`, não `nomeFantasia`)
- O Content-Type do header está como `application/json`
- Os dados estão sendo enviados no body da requisição

### Problema: String vazia não está limpando o campo

**Solução:** O backend converte strings vazias (`""`) em `null` automaticamente. Certifique-se de enviar `""` (string vazia) e não `undefined` ou omitir o campo.

### Problema: Endereço padrão sendo criado automaticamente

**Solução:** Isso acontece quando nenhum campo de endereço é informado. Para evitar, informe pelo menos um campo de endereço (CEP, logradouro, cidade ou estado).

---

## 📝 Exemplo Completo de Integração

```typescript
// tipos.ts
export interface CreateTransportadoraDto {
  nome: string;
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

export interface Transportadora {
  id: number;
  nome: string;
  nome_fantasia?: string | null;
  cnpj?: string | null;
  inscricao_estadual?: string | null;
  telefone?: string | null;
  email?: string | null;
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  ativo: boolean;
  observacoes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ListarTransportadorasResponse {
  transportadoras: Transportadora[];
  total: number;
}

// api.ts
const API_BASE_URL = 'http://seu-backend.com/api/v1/transportadoras';

// Helper para limpar strings vazias
const limparDados = (data: any): any => {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      key,
      value === '' ? undefined : value
    ])
  );
};

export const transportadoraApi = {
  criar: async (
    dados: CreateTransportadoraDto,
    token: string
  ): Promise<Transportadora> => {
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
      throw new Error(error.message || 'Erro ao criar transportadora');
    }

    return response.json();
  },

  listar: async (
    token: string,
    page = 1,
    limit = 15,
    termo?: string,
    apenasAtivos = false
  ): Promise<ListarTransportadorasResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (termo) params.append('termo', termo);
    if (apenasAtivos) params.append('apenasAtivos', 'true');

    const response = await fetch(`${API_BASE_URL}?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Erro ao listar transportadoras');
    }

    return response.json();
  },

  buscarPorId: async (
    id: number,
    token: string,
    incluirPedidos = false
  ): Promise<Transportadora> => {
    const params = incluirPedidos ? '?incluirPedidos=true' : '';
    const response = await fetch(`${API_BASE_URL}/${id}${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Transportadora não encontrada');
    }

    return response.json();
  },

  buscarPorNomeOuCnpj: async (
    termo: string,
    token: string
  ): Promise<Transportadora[]> => {
    const response = await fetch(
      `${API_BASE_URL}/buscar?termo=${encodeURIComponent(termo)}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('Erro ao buscar transportadoras');
    }

    return response.json();
  },

  atualizar: async (
    id: number,
    dados: Partial<CreateTransportadoraDto>,
    token: string
  ): Promise<Transportadora> => {
    const cleanedData = limparDados(dados);

    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(cleanedData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao atualizar transportadora');
    }

    return response.json();
  },

  alterarStatus: async (
    id: number,
    ativo: boolean,
    token: string
  ): Promise<Transportadora> => {
    const response = await fetch(
      `${API_BASE_URL}/${id}/status?ativo=${ativo}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao alterar status');
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
      throw new Error(error.message || 'Erro ao deletar transportadora');
    }
  }
};

// Uso
const exemplo = async () => {
  const token = 'seu-token-jwt';

  // Criar transportadora
  const novaTransportadora = await transportadoraApi.criar({
    nome: "Transportadora Express",
    cnpj: "12345678000190",
    telefone: "(11) 99999-9999",
    email: "contato@transportadora.com",
    cidade: "São Paulo",
    estado: "SP",
    ativo: true
  }, token);

  console.log('Transportadora criada:', novaTransportadora);

  // Listar transportadoras
  const lista = await transportadoraApi.listar(token, 1, 15, "Express", true);
  console.log(`Total: ${lista.total}`);
  console.log('Transportadoras:', lista.transportadoras);

  // Atualizar transportadora
  const atualizada = await transportadoraApi.atualizar(
    novaTransportadora.id,
    {
      telefone: "(11) 88888-8888",
      observacoes: "" // Limpar campo
    },
    token
  );

  console.log('Transportadora atualizada:', atualizada);
};
```

---

## 🧪 Teste Manual (Postman/Insomnia)

### Requisição de Teste - Criar Transportadora

```http
POST http://seu-backend.com/api/v1/transportadoras
Content-Type: application/json
Authorization: Bearer seu-token-jwt

{
  "nome": "Transportadora Express",
  "nome_fantasia": "Express Log",
  "cnpj": "12345678000190",
  "telefone": "(11) 99999-9999",
  "email": "contato@transportadora.com",
  "cep": "01310-100",
  "logradouro": "Avenida Paulista",
  "numero": "1000",
  "bairro": "Bela Vista",
  "cidade": "São Paulo",
  "estado": "SP",
  "ativo": true
}
```

### Resposta Esperada

```json
{
  "id": 1,
  "nome": "Transportadora Express",
  "nome_fantasia": "Express Log",
  "cnpj": "12345678000190",
  "telefone": "(11) 99999-9999",
  "email": "contato@transportadora.com",
  "cep": "01310-100",
  "logradouro": "Avenida Paulista",
  "numero": "1000",
  "bairro": "Bela Vista",
  "cidade": "São Paulo",
  "estado": "SP",
  "ativo": true,
  "created_at": "2024-01-15T10:30:00.000Z",
  "updated_at": "2024-01-15T10:30:00.000Z"
}
```

---

## ✅ Checklist para o Frontend

- [ ] Campos estão sendo enviados com nomes corretos (snake_case)
- [ ] Campo `nome` está presente (obrigatório)
- [ ] Strings vazias são enviadas como `""` para limpar campos opcionais
- [ ] Header `Content-Type: application/json` está presente
- [ ] Token de autenticação está sendo enviado
- [ ] Dados estão sendo serializados com `JSON.stringify()`
- [ ] URL inclui o prefixo `/api/v1`
- [ ] CNPJ está sendo validado antes de enviar (se aplicável)
- [ ] Estado (UF) tem exatamente 2 caracteres

---

**Última atualização:** Janeiro 2024  
**Versão do Backend:** NestJS com TypeORM  
**Status:** ✅ Backend funcionando corretamente

