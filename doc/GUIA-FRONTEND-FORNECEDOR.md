# Guia Frontend - Criar e Editar Fornecedor

## 📋 Visão Geral

Este guia fornece todas as informações necessárias para implementar a criação e edição de fornecedores no frontend, incluindo DTOs, Entity, Enums e exemplos de uso dos endpoints da API.

---

## 🏗️ Estrutura da Entity

### Fornecedor Entity

```typescript
interface Fornecedor {
  id: number; // ID único do fornecedor (gerado automaticamente)
  nome_fantasia?: string; // Nome fantasia (obrigatório, max 255 caracteres)
  nome_razao: string; // Razão social (obrigatório, max 255 caracteres)
  tipoFornecedor: TipoFornecedor; // Enum: PESSOA_FISICA | PESSOA_JURIDICA
  statusFornecedor: StatusFornecedor; // Enum: ATIVO | INATIVO | BLOQUEADO
  cpf_cnpj?: string; // CPF ou CNPJ (obrigatório, único)
  inscricao_estadual?: string; // Inscrição estadual (opcional)
  criandoEm: Date; // Data de criação (automático)
  atualizadoEm: Date; // Data de atualização (automático)
  enderecos: Endereco[]; // Array de endereços (relacionamento)
  contato: Contato[]; // Array de contatos (relacionamento)
  produtos: Produto[]; // Array de produtos (relacionamento)
}
```

---

## 📦 Enums

### TipoFornecedor

```typescript
enum TipoFornecedor {
  PESSOA_FISICA = 'PESSOA_FISICA',
  PESSOA_JURIDICA = 'PESSOA_JURIDICA',
}
```

**Valores possíveis:**

- `PESSOA_FISICA`: Para fornecedores pessoa física
- `PESSOA_JURIDICA`: Para fornecedores pessoa jurídica

**Valor padrão:** `PESSOA_FISICA`

---

### StatusFornecedor

```typescript
enum StatusFornecedor {
  ATIVO = 'ATIVO',
  INATIVO = 'INATIVO',
  BLOQUEADO = 'BLOQUEADO',
}
```

**Valores possíveis:**

- `ATIVO`: Fornecedor ativo e operacional
- `INATIVO`: Fornecedor inativo (temporariamente)
- `BLOQUEADO`: Fornecedor bloqueado

**Valor padrão:** `ATIVO`

---

## 📝 DTOs (Data Transfer Objects)

### CreateFornecedorDto

DTO para criar um novo fornecedor:

```typescript
interface CreateFornecedorDto {
  nome_fantasia: string; // Obrigatório, 1-255 caracteres
  nome_razao: string; // Obrigatório, 1-255 caracteres
  tipoFornecedor: TipoFornecedor; // Obrigatório
  statusFornecedor?: StatusFornecedor; // Opcional (padrão: ATIVO)
  cpf_cnpj: string; // Obrigatório, único
  inscricao_estadual?: string; // Opcional
  enderecos?: CreateEnderecoDto[]; // Opcional, array de endereços
  contato?: CreateContatoDto[]; // Opcional, array de contatos
}
```

**Validações:**

- `nome_fantasia`: String, obrigatório, entre 1 e 255 caracteres
- `nome_razao`: String, obrigatório, entre 1 e 255 caracteres
- `tipoFornecedor`: Enum obrigatório (PESSOA_FISICA ou PESSOA_JURIDICA)
- `statusFornecedor`: Enum opcional (ATIVO, INATIVO ou BLOQUEADO)
- `cpf_cnpj`: String obrigatória, deve ser único no sistema
- `inscricao_estadual`: String opcional
- `enderecos`: Array opcional de endereços
- `contato`: Array opcional de contatos

---

### UpdateFornecedorDto

DTO para atualizar um fornecedor existente:

```typescript
interface UpdateFornecedorDto {
  nome_fantasia?: string; // Opcional
  nome_razao?: string; // Opcional
  tipoFornecedor?: TipoFornecedor; // Opcional
  statusFornecedor?: StatusFornecedor; // Opcional
  cpf_cnpj?: string; // Opcional (mas deve ser único se fornecido)
  inscricao_estadual?: string; // Opcional
  enderecos?: CreateEnderecoDto[]; // Opcional
  contato?: CreateContatoDto[]; // Opcional
}
```

**Nota:** Todos os campos são opcionais no DTO de atualização. Apenas os campos fornecidos serão atualizados.

---

### CreateEnderecoDto

DTO para criar um endereço (usado dentro do fornecedor):

```typescript
interface CreateEnderecoDto {
  cep?: string; // Opcional, formato: 00000-000 ou 00000000
  logradouro?: string; // Opcional
  numero?: string; // Opcional, max 10 caracteres
  complemento?: string; // Opcional, max 50 caracteres
  bairro?: string; // Opcional
  cidade?: string; // Opcional
  estado?: string; // Opcional, 2 caracteres (UF)
  referencia?: string; // Opcional, max 100 caracteres
}
```

**Validações:**

- `cep`: String opcional, formato `00000-000` ou `00000000`
- `numero`: String opcional, máximo 10 caracteres
- `complemento`: String opcional, máximo 50 caracteres
- `estado`: String opcional, máximo 2 caracteres (sigla UF)
- `referencia`: String opcional, máximo 100 caracteres

---

### CreateContatoDto

DTO para criar um contato (usado dentro do fornecedor):

```typescript
interface CreateContatoDto {
  nome_contato?: string; // Opcional, 2-255 caracteres (snake_case)
  nomeContato?: string; // Opcional, 2-255 caracteres (camelCase)
  email?: string; // Opcional, formato de email válido
  telefone?: string; // Opcional, formato: (00) 00000-0000 ou 0000000-0000
  outro_telefone?: string; // Opcional (snake_case)
  outroTelefone?: string; // Opcional (camelCase)
  nome_outro_telefone?: string; // Opcional, 2-255 caracteres (snake_case)
  nomeOutroTelefone?: string; // Opcional, 2-255 caracteres (camelCase)
  observacao?: string; // Opcional, max 500 caracteres
  ativo?: boolean; // Opcional, padrão: true
  id?: number; // Opcional, usado para atualizar contato existente
}
```

**Validações:**

- `nome_contato` ou `nomeContato`: String opcional, entre 2 e 255 caracteres
- `email`: String opcional, deve ser um email válido
- `telefone`: String opcional, formato `(00) 00000-0000` ou `0000000-0000`
- `outro_telefone` ou `outroTelefone`: String opcional, mesmo formato do telefone
- `nome_outro_telefone` ou `nomeOutroTelefone`: String opcional, entre 2 e 255 caracteres
- `observacao`: String opcional, máximo 500 caracteres
- `ativo`: Boolean opcional, padrão `true`

**Nota:** O DTO aceita tanto `snake_case` quanto `camelCase` para compatibilidade.

---

## 🔌 Endpoints da API

### Base URL

Todos os endpoints estão sob o prefixo `/fornecedor` e requerem autenticação JWT.

**Autenticação:** Todos os endpoints requerem o header:

```
Authorization: Bearer {token}
```

---

### 1. Criar Fornecedor

**Endpoint:** `POST /fornecedor`

**Permissões:** `ADMIN` ou `GERENTE`

**Body:**

```json
{
  "nome_fantasia": "Fornecedor ABC Ltda",
  "nome_razao": "Fornecedor ABC Comércio e Serviços Ltda",
  "tipoFornecedor": "PESSOA_JURIDICA",
  "statusFornecedor": "ATIVO",
  "cpf_cnpj": "12.345.678/0001-90",
  "inscricao_estadual": "123.456.789.012",
  "enderecos": [
    {
      "cep": "01310-100",
      "logradouro": "Avenida Paulista",
      "numero": "1000",
      "complemento": "Sala 101",
      "bairro": "Bela Vista",
      "cidade": "São Paulo",
      "estado": "SP",
      "referencia": "Próximo ao metrô"
    }
  ],
  "contato": [
    {
      "nome_contato": "João Silva",
      "email": "joao.silva@fornecedorabc.com",
      "telefone": "1199999-9999",
      "outro_telefone": "1188888-8888",
      "nome_outro_telefone": "WhatsApp",
      "observacao": "Melhor horário: 14h às 18h",
      "ativo": true
    }
  ]
}
```

**Resposta de Sucesso (201):**

```json
{
  "id": 1,
  "nome_fantasia": "Fornecedor ABC Ltda",
  "nome_razao": "Fornecedor ABC Comércio e Serviços Ltda",
  "tipoFornecedor": "PESSOA_JURIDICA",
  "statusFornecedor": "ATIVO",
  "cpf_cnpj": "12.345.678/0001-90",
  "inscricao_estadual": "123.456.789.012",
  "criandoEm": "2024-01-15T10:00:00.000Z",
  "atualizadoEm": "2024-01-15T10:00:00.000Z",
  "enderecos": [
    {
      "id": 1,
      "cep": "01310-100",
      "logradouro": "Avenida Paulista",
      "numero": "1000",
      "complemento": "Sala 101",
      "bairro": "Bela Vista",
      "cidade": "São Paulo",
      "estado": "SP",
      "referencia": "Próximo ao metrô"
    }
  ],
  "contato": [
    {
      "id": 1,
      "nome_contato": "João Silva",
      "email": "joao.silva@fornecedorabc.com",
      "telefone": "1199999-9999",
      "outro_telefone": "1188888-8888",
      "nome_outro_telefone": "WhatsApp",
      "observacao": "Melhor horário: 14h às 18h",
      "ativo": true
    }
  ],
  "produtos": []
}
```

**Erros possíveis:**

- `400 Bad Request`: Dados inválidos ou faltando campos obrigatórios
- `401 Unauthorized`: Token inválido ou ausente
- `403 Forbidden`: Usuário sem permissão (não é ADMIN ou GERENTE)
- `409 Conflict`: CPF/CNPJ já existe no sistema

---

### 2. Atualizar Fornecedor

**Endpoint:** `PATCH /fornecedor/:id`

**Permissões:** `ADMIN` ou `GERENTE`

**Parâmetros:**

- `id` (path): ID do fornecedor a ser atualizado

**Body (todos os campos são opcionais):**

```json
{
  "nome_fantasia": "Fornecedor ABC Ltda - Atualizado",
  "statusFornecedor": "INATIVO",
  "inscricao_estadual": "123.456.789.013"
}
```

**Resposta de Sucesso (200):**

```json
{
  "id": 1,
  "nome_fantasia": "Fornecedor ABC Ltda - Atualizado",
  "nome_razao": "Fornecedor ABC Comércio e Serviços Ltda",
  "tipoFornecedor": "PESSOA_JURIDICA",
  "statusFornecedor": "INATIVO",
  "cpf_cnpj": "12.345.678/0001-90",
  "inscricao_estadual": "123.456.789.013",
  "criandoEm": "2024-01-15T10:00:00.000Z",
  "atualizadoEm": "2024-01-15T11:30:00.000Z",
  "enderecos": [...],
  "contato": [...],
  "produtos": []
}
```

**Erros possíveis:**

- `400 Bad Request`: Dados inválidos
- `401 Unauthorized`: Token inválido ou ausente
- `403 Forbidden`: Usuário sem permissão
- `404 Not Found`: Fornecedor não encontrado
- `409 Conflict`: CPF/CNPJ já existe (se fornecido)

---

### 3. Buscar Fornecedor por ID

**Endpoint:** `GET /fornecedor/:id`

**Permissões:** Qualquer usuário autenticado

**Parâmetros:**

- `id` (path): ID do fornecedor

**Resposta de Sucesso (200):**

```json
{
  "id": 1,
  "nome_fantasia": "Fornecedor ABC Ltda",
  "nome_razao": "Fornecedor ABC Comércio e Serviços Ltda",
  "tipoFornecedor": "PESSOA_JURIDICA",
  "statusFornecedor": "ATIVO",
  "cpf_cnpj": "12.345.678/0001-90",
  "inscricao_estadual": "123.456.789.012",
  "criandoEm": "2024-01-15T10:00:00.000Z",
  "atualizadoEm": "2024-01-15T10:00:00.000Z",
  "enderecos": [...],
  "contato": [...],
  "produtos": []
}
```

**Erros possíveis:**

- `401 Unauthorized`: Token inválido ou ausente
- `404 Not Found`: Fornecedor não encontrado

---

### 4. Listar Fornecedores

**Endpoint:** `GET /fornecedor`

**Permissões:** Qualquer usuário autenticado

**Query Parameters:**

- `page` (opcional): Número da página (padrão: 1)
- `limit` (opcional): Itens por página (padrão: 15)
- `tipoFornecedor` (opcional): Filtrar por tipo (`PESSOA_FISICA` ou `PESSOA_JURIDICA`)
- `statusFornecedor` (opcional): Filtrar por status (`ATIVO`, `INATIVO` ou `BLOQUEADO`)

**Exemplo:**

```
GET /fornecedor?page=1&limit=15&tipoFornecedor=PESSOA_JURIDICA&statusFornecedor=ATIVO
```

**Resposta de Sucesso (200):**

```json
{
  "data": [
    {
      "id": 1,
      "nome_fantasia": "Fornecedor ABC Ltda",
      "nome_razao": "Fornecedor ABC Comércio e Serviços Ltda",
      "tipoFornecedor": "PESSOA_JURIDICA",
      "statusFornecedor": "ATIVO",
      "cpf_cnpj": "12.345.678/0001-90",
      "inscricao_estadual": "123.456.789.012",
      "criandoEm": "2024-01-15T10:00:00.000Z",
      "atualizadoEm": "2024-01-15T10:00:00.000Z"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 15,
  "totalPages": 7
}
```

---

### 5. Buscar Fornecedores (Busca Simples)

**Endpoint:** `GET /fornecedor/buscar`

**Permissões:** Qualquer usuário autenticado

**Query Parameters:**

- `termo` (obrigatório): Termo de busca (nome, razão social, nome fantasia ou CPF/CNPJ)
- `page` (opcional): Número da página (padrão: 1)
- `limit` (opcional): Itens por página (padrão: 15)

**Exemplo:**

```
GET /fornecedor/buscar?termo=ABC&page=1&limit=15
```

**Resposta:** Mesmo formato do endpoint de listagem

---

### 6. Buscar Fornecedores (Busca Avançada)

**Endpoint:** `GET /fornecedor/buscar-avancado`

**Permissões:** Qualquer usuário autenticado

**Query Parameters (todos opcionais):**

- `termo`: Termo de busca geral
- `tipoFornecedor`: Filtrar por tipo
- `statusFornecedor`: Filtrar por status
- `cidade`: Filtrar por cidade
- `estado`: Filtrar por estado (UF)
- `telefone`: Filtrar por telefone
- `email`: Filtrar por email
- `nomeContato`: Filtrar por nome do contato
- `page`: Número da página (padrão: 1)
- `limit`: Itens por página (padrão: 15)

**Exemplo:**

```
GET /fornecedor/buscar-avancado?termo=ABC&cidade=São Paulo&estado=SP&page=1&limit=15
```

---

### 7. Deletar Fornecedor

**Endpoint:** `DELETE /fornecedor/:id`

**Permissões:** `ADMIN` ou `GERENTE`

**Parâmetros:**

- `id` (path): ID do fornecedor a ser deletado

**Resposta de Sucesso (200):**

```json
{
  "mensagem": "Fornecedor removido com sucesso"
}
```

**Erros possíveis:**

- `401 Unauthorized`: Token inválido ou ausente
- `403 Forbidden`: Usuário sem permissão
- `404 Not Found`: Fornecedor não encontrado

---

## 💻 Exemplos de Implementação no Frontend

### 1. Interfaces TypeScript

```typescript
// src/types/fornecedor.types.ts

export enum TipoFornecedor {
  PESSOA_FISICA = 'PESSOA_FISICA',
  PESSOA_JURIDICA = 'PESSOA_JURIDICA',
}

export enum StatusFornecedor {
  ATIVO = 'ATIVO',
  INATIVO = 'INATIVO',
  BLOQUEADO = 'BLOQUEADO',
}

export interface Endereco {
  id?: number;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  referencia?: string;
}

export interface Contato {
  id?: number;
  nome_contato?: string;
  nomeContato?: string;
  email?: string;
  telefone?: string;
  outro_telefone?: string;
  outroTelefone?: string;
  nome_outro_telefone?: string;
  nomeOutroTelefone?: string;
  observacao?: string;
  ativo?: boolean;
}

export interface Fornecedor {
  id: number;
  nome_fantasia?: string;
  nome_razao: string;
  tipoFornecedor: TipoFornecedor;
  statusFornecedor: StatusFornecedor;
  cpf_cnpj?: string;
  inscricao_estadual?: string;
  criandoEm: Date;
  atualizadoEm: Date;
  enderecos?: Endereco[];
  contato?: Contato[];
  produtos?: any[];
}

export interface CreateFornecedorDto {
  nome_fantasia: string;
  nome_razao: string;
  tipoFornecedor: TipoFornecedor;
  statusFornecedor?: StatusFornecedor;
  cpf_cnpj: string;
  inscricao_estadual?: string;
  enderecos?: Endereco[];
  contato?: Contato[];
}

export interface UpdateFornecedorDto {
  nome_fantasia?: string;
  nome_razao?: string;
  tipoFornecedor?: TipoFornecedor;
  statusFornecedor?: StatusFornecedor;
  cpf_cnpj?: string;
  inscricao_estadual?: string;
  enderecos?: Endereco[];
  contato?: Contato[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

---

### 2. Service/API Client

```typescript
// src/services/fornecedor.service.ts

import axios from 'axios';
import {
  Fornecedor,
  CreateFornecedorDto,
  UpdateFornecedorDto,
  PaginatedResponse,
  TipoFornecedor,
  StatusFornecedor,
} from '@/types/fornecedor.types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export class FornecedorService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  async criarFornecedor(data: CreateFornecedorDto): Promise<Fornecedor> {
    const response = await axios.post<Fornecedor>(
      `${API_BASE_URL}/fornecedor`,
      data,
      { headers: this.getAuthHeaders() },
    );
    return response.data;
  }

  async atualizarFornecedor(
    id: number,
    data: UpdateFornecedorDto,
  ): Promise<Fornecedor> {
    const response = await axios.patch<Fornecedor>(
      `${API_BASE_URL}/fornecedor/${id}`,
      data,
      { headers: this.getAuthHeaders() },
    );
    return response.data;
  }

  async buscarPorId(id: number): Promise<Fornecedor> {
    const response = await axios.get<Fornecedor>(
      `${API_BASE_URL}/fornecedor/${id}`,
      { headers: this.getAuthHeaders() },
    );
    return response.data;
  }

  async listarFornecedores(
    page: number = 1,
    limit: number = 15,
    tipoFornecedor?: TipoFornecedor,
    statusFornecedor?: StatusFornecedor,
  ): Promise<PaginatedResponse<Fornecedor>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (tipoFornecedor) {
      params.append('tipoFornecedor', tipoFornecedor);
    }

    if (statusFornecedor) {
      params.append('statusFornecedor', statusFornecedor);
    }

    const response = await axios.get<PaginatedResponse<Fornecedor>>(
      `${API_BASE_URL}/fornecedor?${params.toString()}`,
      { headers: this.getAuthHeaders() },
    );
    return response.data;
  }

  async buscarFornecedores(
    termo: string,
    page: number = 1,
    limit: number = 15,
  ): Promise<PaginatedResponse<Fornecedor>> {
    const params = new URLSearchParams({
      termo,
      page: page.toString(),
      limit: limit.toString(),
    });

    const response = await axios.get<PaginatedResponse<Fornecedor>>(
      `${API_BASE_URL}/fornecedor/buscar?${params.toString()}`,
      { headers: this.getAuthHeaders() },
    );
    return response.data;
  }

  async buscarAvancado(filtros: {
    termo?: string;
    tipoFornecedor?: TipoFornecedor;
    statusFornecedor?: StatusFornecedor;
    cidade?: string;
    estado?: string;
    telefone?: string;
    email?: string;
    nomeContato?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Fornecedor>> {
    const params = new URLSearchParams();

    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await axios.get<PaginatedResponse<Fornecedor>>(
      `${API_BASE_URL}/fornecedor/buscar-avancado?${params.toString()}`,
      { headers: this.getAuthHeaders() },
    );
    return response.data;
  }

  async deletarFornecedor(id: number): Promise<void> {
    await axios.delete(`${API_BASE_URL}/fornecedor/${id}`, {
      headers: this.getAuthHeaders(),
    });
  }
}

export const fornecedorService = new FornecedorService();
```

---

### 3. Formulário de Criação (React + TypeScript)

```typescript
// src/components/FornecedorForm.tsx

import React, { useState } from 'react';
import { fornecedorService } from '@/services/fornecedor.service';
import {
  CreateFornecedorDto,
  TipoFornecedor,
  StatusFornecedor,
  Endereco,
  Contato,
} from '@/types/fornecedor.types';

interface FornecedorFormProps {
  onSubmit: (fornecedor: any) => void;
  onCancel: () => void;
}

export const FornecedorForm: React.FC<FornecedorFormProps> = ({
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState<CreateFornecedorDto>({
    nome_fantasia: '',
    nome_razao: '',
    tipoFornecedor: TipoFornecedor.PESSOA_FISICA,
    statusFornecedor: StatusFornecedor.ATIVO,
    cpf_cnpj: '',
    inscricao_estadual: '',
    enderecos: [],
    contato: [],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const fornecedor = await fornecedorService.criarFornecedor(formData);
      onSubmit(fornecedor);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Erro ao criar fornecedor'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddEndereco = () => {
    setFormData({
      ...formData,
      enderecos: [
        ...(formData.enderecos || []),
        {
          cep: '',
          logradouro: '',
          numero: '',
          complemento: '',
          bairro: '',
          cidade: '',
          estado: '',
          referencia: '',
        },
      ],
    });
  };

  const handleAddContato = () => {
    setFormData({
      ...formData,
      contato: [
        ...(formData.contato || []),
        {
          nome_contato: '',
          email: '',
          telefone: '',
          ativo: true,
        },
      ],
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}

      <div>
        <label>
          Nome Fantasia *
          <input
            type="text"
            value={formData.nome_fantasia}
            onChange={(e) =>
              setFormData({ ...formData, nome_fantasia: e.target.value })
            }
            required
            maxLength={255}
          />
        </label>
      </div>

      <div>
        <label>
          Razão Social *
          <input
            type="text"
            value={formData.nome_razao}
            onChange={(e) =>
              setFormData({ ...formData, nome_razao: e.target.value })
            }
            required
            maxLength={255}
          />
        </label>
      </div>

      <div>
        <label>
          Tipo de Fornecedor *
          <select
            value={formData.tipoFornecedor}
            onChange={(e) =>
              setFormData({
                ...formData,
                tipoFornecedor: e.target.value as TipoFornecedor,
              })
            }
            required
          >
            <option value={TipoFornecedor.PESSOA_FISICA}>
              Pessoa Física
            </option>
            <option value={TipoFornecedor.PESSOA_JURIDICA}>
              Pessoa Jurídica
            </option>
          </select>
        </label>
      </div>

      <div>
        <label>
          Status
          <select
            value={formData.statusFornecedor}
            onChange={(e) =>
              setFormData({
                ...formData,
                statusFornecedor: e.target.value as StatusFornecedor,
              })
            }
          >
            <option value={StatusFornecedor.ATIVO}>Ativo</option>
            <option value={StatusFornecedor.INATIVO}>Inativo</option>
            <option value={StatusFornecedor.BLOQUEADO}>Bloqueado</option>
          </select>
        </label>
      </div>

      <div>
        <label>
          CPF/CNPJ *
          <input
            type="text"
            value={formData.cpf_cnpj}
            onChange={(e) =>
              setFormData({ ...formData, cpf_cnpj: e.target.value })
            }
            required
          />
        </label>
      </div>

      <div>
        <label>
          Inscrição Estadual
          <input
            type="text"
            value={formData.inscricao_estadual || ''}
            onChange={(e) =>
              setFormData({ ...formData, inscricao_estadual: e.target.value })
            }
          />
        </label>
      </div>

      {/* Seção de Endereços */}
      <div>
        <h3>Endereços</h3>
        <button type="button" onClick={handleAddEndereco}>
          Adicionar Endereço
        </button>
        {formData.enderecos?.map((endereco, index) => (
          <div key={index}>
            {/* Campos do endereço */}
            <input
              type="text"
              placeholder="CEP"
              value={endereco.cep || ''}
              onChange={(e) => {
                const newEnderecos = [...(formData.enderecos || [])];
                newEnderecos[index] = { ...endereco, cep: e.target.value };
                setFormData({ ...formData, enderecos: newEnderecos });
              }}
            />
            {/* Adicionar outros campos do endereço */}
          </div>
        ))}
      </div>

      {/* Seção de Contatos */}
      <div>
        <h3>Contatos</h3>
        <button type="button" onClick={handleAddContato}>
          Adicionar Contato
        </button>
        {formData.contato?.map((contato, index) => (
          <div key={index}>
            {/* Campos do contato */}
            <input
              type="text"
              placeholder="Nome do Contato"
              value={contato.nome_contato || ''}
              onChange={(e) => {
                const newContatos = [...(formData.contato || [])];
                newContatos[index] = { ...contato, nome_contato: e.target.value };
                setFormData({ ...formData, contato: newContatos });
              }}
            />
            {/* Adicionar outros campos do contato */}
          </div>
        ))}
      </div>

      <div>
        <button type="submit" disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar'}
        </button>
        <button type="button" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  );
};
```

---

### 4. Formulário de Edição

```typescript
// src/components/FornecedorEditForm.tsx

import React, { useState, useEffect } from 'react';
import { fornecedorService } from '@/services/fornecedor.service';
import {
  Fornecedor,
  UpdateFornecedorDto,
  TipoFornecedor,
  StatusFornecedor,
} from '@/types/fornecedor.types';

interface FornecedorEditFormProps {
  fornecedorId: number;
  onSubmit: (fornecedor: Fornecedor) => void;
  onCancel: () => void;
}

export const FornecedorEditForm: React.FC<FornecedorEditFormProps> = ({
  fornecedorId,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState<UpdateFornecedorDto>({});
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFornecedor = async () => {
      try {
        const fornecedor = await fornecedorService.buscarPorId(fornecedorId);
        setFormData({
          nome_fantasia: fornecedor.nome_fantasia,
          nome_razao: fornecedor.nome_razao,
          tipoFornecedor: fornecedor.tipoFornecedor,
          statusFornecedor: fornecedor.statusFornecedor,
          cpf_cnpj: fornecedor.cpf_cnpj,
          inscricao_estadual: fornecedor.inscricao_estadual,
          enderecos: fornecedor.enderecos,
          contato: fornecedor.contato,
        });
      } catch (err: any) {
        setError('Erro ao carregar fornecedor');
      } finally {
        setLoadingData(false);
      }
    };

    loadFornecedor();
  }, [fornecedorId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const fornecedor = await fornecedorService.atualizarFornecedor(
        fornecedorId,
        formData
      );
      onSubmit(fornecedor);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Erro ao atualizar fornecedor'
      );
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return <div>Carregando...</div>;
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}

      {/* Campos do formulário (similar ao formulário de criação) */}
      {/* Todos os campos são opcionais na edição */}

      <div>
        <label>
          Nome Fantasia
          <input
            type="text"
            value={formData.nome_fantasia || ''}
            onChange={(e) =>
              setFormData({ ...formData, nome_fantasia: e.target.value })
            }
            maxLength={255}
          />
        </label>
      </div>

      {/* Adicionar outros campos... */}

      <div>
        <button type="submit" disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar Alterações'}
        </button>
        <button type="button" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  );
};
```

---

## ✅ Checklist de Implementação

### Criação de Fornecedor

- [ ] Criar interfaces TypeScript para Fornecedor, DTOs e Enums
- [ ] Implementar service/API client para criar fornecedor
- [ ] Criar formulário de criação com validações
- [ ] Implementar campos obrigatórios (nome_fantasia, nome_razao, tipoFornecedor, cpf_cnpj)
- [ ] Implementar campos opcionais (statusFornecedor, inscricao_estadual)
- [ ] Implementar seção de endereços (múltiplos)
- [ ] Implementar seção de contatos (múltiplos)
- [ ] Tratar erros de validação do backend
- [ ] Tratar erro de CPF/CNPJ duplicado (409 Conflict)
- [ ] Exibir mensagens de sucesso/erro

### Edição de Fornecedor

- [ ] Implementar service/API client para buscar fornecedor por ID
- [ ] Implementar service/API client para atualizar fornecedor
- [ ] Criar formulário de edição que carrega dados existentes
- [ ] Implementar atualização parcial (apenas campos alterados)
- [ ] Tratar erros de validação
- [ ] Exibir mensagens de sucesso/erro

### Validações Frontend

- [ ] Validar nome_fantasia (obrigatório, 1-255 caracteres)
- [ ] Validar nome_razao (obrigatório, 1-255 caracteres)
- [ ] Validar CPF/CNPJ (obrigatório, formato correto)
- [ ] Validar CEP (formato 00000-000 ou 00000000)
- [ ] Validar email (formato válido)
- [ ] Validar telefone (formato correto)
- [ ] Validar estado (2 caracteres, sigla UF)

---

## 🎯 Exemplos de Uso

### Exemplo 1: Criar Fornecedor Pessoa Jurídica

```typescript
const novoFornecedor: CreateFornecedorDto = {
  nome_fantasia: 'Fornecedor ABC Ltda',
  nome_razao: 'Fornecedor ABC Comércio e Serviços Ltda',
  tipoFornecedor: TipoFornecedor.PESSOA_JURIDICA,
  statusFornecedor: StatusFornecedor.ATIVO,
  cpf_cnpj: '12.345.678/0001-90',
  inscricao_estadual: '123.456.789.012',
  enderecos: [
    {
      cep: '01310-100',
      logradouro: 'Avenida Paulista',
      numero: '1000',
      complemento: 'Sala 101',
      bairro: 'Bela Vista',
      cidade: 'São Paulo',
      estado: 'SP',
    },
  ],
  contato: [
    {
      nome_contato: 'João Silva',
      email: 'joao@fornecedorabc.com',
      telefone: '1199999-9999',
      ativo: true,
    },
  ],
};

const fornecedor = await fornecedorService.criarFornecedor(novoFornecedor);
```

### Exemplo 2: Atualizar Status do Fornecedor

```typescript
const atualizacao: UpdateFornecedorDto = {
  statusFornecedor: StatusFornecedor.INATIVO,
};

const fornecedorAtualizado = await fornecedorService.atualizarFornecedor(
  1,
  atualizacao,
);
```

### Exemplo 3: Buscar e Editar Fornecedor

```typescript
// Buscar fornecedor
const fornecedor = await fornecedorService.buscarPorId(1);

// Atualizar apenas nome fantasia
const atualizacao: UpdateFornecedorDto = {
  nome_fantasia: 'Novo Nome Fantasia',
};

const fornecedorAtualizado = await fornecedorService.atualizarFornecedor(
  1,
  atualizacao,
);
```

---

## 🔍 Tratamento de Erros

### Erros Comuns e Como Tratá-los

1. **400 Bad Request - Dados Inválidos**

   ```typescript
   try {
     await fornecedorService.criarFornecedor(data);
   } catch (error: any) {
     if (error.response?.status === 400) {
       const errors = error.response.data.message;
       // Exibir erros de validação para o usuário
     }
   }
   ```

2. **401 Unauthorized - Token Inválido**

   ```typescript
   // Redirecionar para login ou renovar token
   if (error.response?.status === 401) {
     // Redirecionar para página de login
   }
   ```

3. **403 Forbidden - Sem Permissão**

   ```typescript
   // Exibir mensagem de permissão insuficiente
   if (error.response?.status === 403) {
     alert('Você não tem permissão para realizar esta ação');
   }
   ```

4. **404 Not Found - Fornecedor Não Encontrado**

   ```typescript
   if (error.response?.status === 404) {
     alert('Fornecedor não encontrado');
   }
   ```

5. **409 Conflict - CPF/CNPJ Duplicado**
   ```typescript
   if (error.response?.status === 409) {
     alert('Este CPF/CNPJ já está cadastrado no sistema');
   }
   ```

---

## 📞 Suporte

Se tiver dúvidas ou problemas na implementação:

1. Verifique se as interfaces TypeScript estão corretas
2. Verifique se o token de autenticação está sendo enviado
3. Teste os endpoints diretamente (Postman/Insomnia)
4. Verifique os logs do console do navegador
5. Verifique os logs do backend

---

**Data de criação:** 2024  
**Última atualização:** 2024


