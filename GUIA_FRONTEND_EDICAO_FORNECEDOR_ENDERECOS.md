# 📘 Guia Frontend - Edição de Fornecedor com Endereços

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Estrutura da API](#estrutura-da-api)
3. [Endpoint de Edição](#endpoint-de-edição)
4. [Estrutura de Dados](#estrutura-de-dados)
5. [Regras de Negócio](#regras-de-negócio)
6. [Preparação do Payload](#preparação-do-payload)
7. [Lógica de Endereços](#lógica-de-endereços)
8. [Tratamento de Campos](#tratamento-de-campos)
9. [Exemplos Práticos](#exemplos-práticos)
10. [Tratamento de Erros](#tratamento-de-erros)
11. [Implementação Completa](#implementação-completa)
12. [Boas Práticas](#boas-práticas)

---

## 🎯 Visão Geral

Este guia descreve como implementar a edição de fornecedor com suporte a múltiplos endereços no frontend. O sistema permite:

- ✅ Editar dados do fornecedor (parcial ou completo)
- ✅ Adicionar novos endereços
- ✅ Editar endereços existentes
- ✅ Remover endereços
- ✅ Limpar campos opcionais (converter "" para null)

### Fluxo Completo

```
1. Usuário carrega formulário de edição
   ↓
2. Frontend busca fornecedor completo (GET /fornecedor/:id)
   ↓
3. Usuário edita dados e/ou endereços
   ↓
4. Frontend prepara payload seguindo regras
   ↓
5. Frontend envia PATCH /fornecedor/:id
   ↓
6. Backend processa e retorna fornecedor atualizado
   ↓
7. Frontend atualiza interface com dados retornados
```

---

## 📡 Estrutura da API

### Base URL

```
/api/v1/fornecedor
```

### Autenticação

Todas as rotas requerem autenticação JWT. O token deve ser enviado no header:

```
Authorization: Bearer <token>
```

### Permissões

A edição de fornecedor requer uma das seguintes roles:
- `ADMIN`
- `GERENTE`

---

## 🔌 Endpoint de Edição

### Atualizar Fornecedor

**PATCH** `/fornecedor/:id`

Atualiza um fornecedor existente. Permite atualização parcial de todos os campos.

#### Parâmetros de URL

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `id` | number | Sim | ID do fornecedor a ser atualizado |

#### Headers

```
Content-Type: application/json
Authorization: Bearer <token>
```

#### Exemplo de Requisição

```typescript
PATCH /api/v1/fornecedor/123
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "nome_fantasia": "Fornecedor Atualizado",
  "enderecos": [
    {
      "id": 5,
      "logradouro": "Rua Alterada"
    },
    {
      "cep": "01310-100",
      "logradouro": "Av. Paulista",
      "numero": "1000",
      "cidade": "São Paulo",
      "estado": "SP"
    }
  ]
}
```

#### Resposta de Sucesso (200 OK)

```json
{
  "id": 123,
  "nome_fantasia": "Fornecedor Atualizado",
  "nome_razao": "Fornecedor ABC LTDA",
  "tipoFornecedor": "PESSOA_JURIDICA",
  "statusFornecedor": "ATIVO",
  "cpf_cnpj": "12.345.678/0001-90",
  "inscricao_estadual": null,
  "criandoEm": "2024-01-15T10:00:00Z",
  "atualizadoEm": "2024-01-20T15:30:00Z",
  "enderecos": [
    {
      "id": 5,
      "cep": "01310-100",
      "logradouro": "Rua Alterada",
      "numero": "1000",
      "complemento": null,
      "bairro": "Bela Vista",
      "cidade": "São Paulo",
      "estado": "SP",
      "referencia": null,
      "fornecedorId": 123
    },
    {
      "id": 6,
      "cep": "01310-100",
      "logradouro": "Av. Paulista",
      "numero": "1000",
      "complemento": null,
      "bairro": "Bela Vista",
      "cidade": "São Paulo",
      "estado": "SP",
      "referencia": null,
      "fornecedorId": 123
    }
  ],
  "contato": []
}
```

---

## 📊 Estrutura de Dados

### Tipo: UpdateFornecedorDto

Todos os campos são **opcionais**. Apenas os campos enviados serão atualizados.

```typescript
interface UpdateFornecedorDto {
  // Campos do fornecedor (opcionais)
  nome_fantasia?: string;
  nome_razao?: string;
  tipoFornecedor?: 'PESSOA_FISICA' | 'PESSOA_JURIDICA';
  statusFornecedor?: 'ATIVO' | 'INATIVO' | 'BLOQUEADO';
  cpf_cnpj?: string;
  inscricao_estadual?: string | null;
  
  // Array de endereços (opcional)
  enderecos?: UpdateEnderecoDto[];
  
  // Array de contatos (opcional)
  contato?: UpdateContatoDto[];
}
```

### Tipo: UpdateEnderecoDto

```typescript
interface UpdateEnderecoDto {
  // ID é OBRIGATÓRIO para atualizar, OMITIR para criar novo
  id?: number;
  
  // Campos do endereço (todos opcionais)
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string | null;  // "" será convertido para null
  bairro?: string;
  cidade?: string;
  estado?: string;  // UF (2 caracteres)
  referencia?: string | null;  // "" será convertido para null
}
```

---

## 🧱 Regras de Negócio

### 1️⃣ Edição de Fornecedor

- ✅ A rota permite editar um fornecedor existente
- ✅ Os dados enviados sobrescrevem os dados atuais
- ✅ Nenhum INSERT de fornecedor ocorre durante edição, apenas UPDATE
- ✅ Campos não enviados mantêm seus valores atuais

### 2️⃣ Campos Obrigatórios

- ✅ Campos obrigatórios podem ser editados
- ✅ Se um campo obrigatório **não for enviado**, mantém o valor atual
- ✅ Se for enviado, substitui o valor antigo
- ⚠️ Se enviado, não pode ser vazio (será validado pelo backend)

**Exemplo:**

```typescript
// Enviar apenas nome_fantasia
{
  "nome_fantasia": "Novo Nome"
}
// Resultado: apenas nome_fantasia é atualizado, outros campos permanecem inalterados
```

### 3️⃣ Campos Opcionais

Campos opcionais podem receber:
- ✅ Valor válido (string não vazia)
- ✅ String vazia `""` → será convertido para `null` pelo backend
- ✅ `null` → limpa o campo

**Regra Importante:**

```typescript
// Se o frontend enviar "" (string vazia), o backend converte para NULL
{
  "inscricao_estadual": ""  // Backend salva como NULL
}

// Resultado esperado no banco:
// inscricao_estadual = NULL
```

### 4️⃣ Relacionamento com Endereços

- ✅ Um fornecedor pode ter N endereços
- ✅ Todo endereço deve conter `fornecedor_id` (gerenciado pelo backend)
- ✅ Nenhum endereço pode existir sem fornecedor
- ✅ Endereços são vinculados automaticamente ao `fornecedor_id`

---

## 🏠 Lógica de Endereços

### Decisão: Criar vs Atualizar vs Remover

A decisão é baseada **EXCLUSIVAMENTE** no campo `id`:

| Situação | Campo `id` | Ação do Backend |
|----------|------------|-----------------|
| **Atualizar endereço existente** | Presente e válido (> 0) | UPDATE |
| **Criar novo endereço** | Ausente, `null` ou `undefined` | INSERT |
| **Remover endereço** | Não enviado no array | DELETE |

### 5️⃣ Adicionar Novos Endereços

O frontend pode enviar novos endereços **sem `id`**:

```typescript
{
  "enderecos": [
    {
      // SEM id → será criado
      "cep": "01310-100",
      "logradouro": "Av. Paulista",
      "numero": "1000",
      "bairro": "Bela Vista",
      "cidade": "São Paulo",
      "estado": "SP"
    }
  ]
}
```

**Regras:**
- ✅ Endereço novo precisa ter campos obrigatórios preenchidos
- ✅ Backend vincula automaticamente ao `fornecedor_id`
- ✅ Backend retorna o `id` do endereço criado

### 6️⃣ Editar Endereços Existentes

Se o endereço vier com `id`, ele já existe:

```typescript
{
  "enderecos": [
    {
      "id": 5,  // ← ID presente = atualizar
      "logradouro": "Rua Alterada",
      "numero": "999"
      // Outros campos não enviados mantêm valores atuais
    }
  ]
}
```

**Regras:**
- ✅ Backend faz UPDATE apenas nos campos enviados
- ✅ Campos não enviados mantêm valores atuais
- ✅ Backend valida que o endereço pertence ao fornecedor

### 7️⃣ Campos Opcionais do Endereço

Campos opcionais (`complemento`, `referencia`) seguem a regra:

```typescript
// "" → converter para NULL
{
  "id": 5,
  "complemento": ""  // Backend salva como NULL
}

// null → manter NULL
{
  "id": 5,
  "complemento": null  // Backend salva como NULL
}

// Valor válido → atualizar
{
  "id": 5,
  "complemento": "Sala 101"  // Backend salva como "Sala 101"
}
```

### 8️⃣ Remover Endereços

**CRÍTICO:** Para remover um endereço, **não o envie no array**:

```typescript
// Situação: Fornecedor tem 3 endereços (IDs: 1, 2, 3)
// Usuário quer remover endereço com ID 2

// ❌ ERRADO: Enviar array vazio remove TODOS
{
  "enderecos": []
}

// ✅ CORRETO: Enviar apenas os endereços que devem permanecer
{
  "enderecos": [
    { "id": 1, ... },  // Mantém
    { "id": 3, ... }   // Mantém
    // ID 2 não enviado → será removido
  ]
}
```

**Regra:**
- ✅ Endereços não enviados no array são **removidos automaticamente**
- ✅ Endereços enviados são **mantidos ou atualizados**

---

## 🔧 Preparação do Payload

### Função Helper: Preparar Endereço

```typescript
/**
 * Prepara um endereço para envio ao backend
 * @param endereco - Endereço do formulário
 * @returns Endereço formatado para API
 */
function prepararEndereco(endereco: any): UpdateEnderecoDto {
  const enderecoPreparado: UpdateEnderecoDto = {};
  
  // Se tem ID, incluir para atualização
  if (endereco.id && endereco.id > 0) {
    enderecoPreparado.id = Number(endereco.id);
  }
  // Se não tem ID, omitir (será criado novo)
  
  // Campos obrigatórios (apenas se preenchidos)
  if (endereco.cep) {
    enderecoPreparado.cep = endereco.cep.trim();
  }
  if (endereco.logradouro) {
    enderecoPreparado.logradouro = endereco.logradouro.trim();
  }
  if (endereco.numero) {
    enderecoPreparado.numero = endereco.numero.trim();
  }
  if (endereco.bairro) {
    enderecoPreparado.bairro = endereco.bairro.trim();
  }
  if (endereco.cidade) {
    enderecoPreparado.cidade = endereco.cidade.trim();
  }
  if (endereco.estado) {
    enderecoPreparado.estado = endereco.estado.trim().toUpperCase();
  }
  
  // Campos opcionais: "" vira null
  if (endereco.complemento !== undefined) {
    enderecoPreparado.complemento = endereco.complemento === '' 
      ? null 
      : endereco.complemento.trim();
  }
  if (endereco.referencia !== undefined) {
    enderecoPreparado.referencia = endereco.referencia === '' 
      ? null 
      : endereco.referencia.trim();
  }
  
  return enderecoPreparado;
}
```

### Função Helper: Preparar Payload Completo

```typescript
/**
 * Prepara payload completo para atualização de fornecedor
 * @param fornecedor - Dados do fornecedor do formulário
 * @returns Payload formatado para API
 */
function prepararPayloadAtualizacao(
  fornecedor: any
): UpdateFornecedorDto {
  const payload: UpdateFornecedorDto = {};
  
  // Campos do fornecedor (apenas se alterados)
  if (fornecedor.nome_fantasia !== undefined) {
    payload.nome_fantasia = fornecedor.nome_fantasia.trim();
  }
  if (fornecedor.nome_razao !== undefined) {
    payload.nome_razao = fornecedor.nome_razao.trim();
  }
  if (fornecedor.tipoFornecedor !== undefined) {
    payload.tipoFornecedor = fornecedor.tipoFornecedor;
  }
  if (fornecedor.statusFornecedor !== undefined) {
    payload.statusFornecedor = fornecedor.statusFornecedor;
  }
  if (fornecedor.cpf_cnpj !== undefined) {
    payload.cpf_cnpj = fornecedor.cpf_cnpj.replace(/\D/g, ''); // Apenas números
  }
  
  // Campo opcional: "" vira null
  if (fornecedor.inscricao_estadual !== undefined) {
    payload.inscricao_estadual = fornecedor.inscricao_estadual === '' 
      ? null 
      : fornecedor.inscricao_estadual.trim();
  }
  
  // Array de endereços (apenas se houver alterações)
  if (fornecedor.enderecos && fornecedor.enderecos.length > 0) {
    payload.enderecos = fornecedor.enderecos.map((e: any) => 
      prepararEndereco(e)
    );
  }
  
  // Array de contatos (se necessário)
  if (fornecedor.contato && fornecedor.contato.length > 0) {
    payload.contato = fornecedor.contato.map((c: any) => 
      prepararContato(c)
    );
  }
  
  return payload;
}
```

---

## 📝 Exemplos Práticos

### Exemplo 1: Adicionar Novo Endereço

**Situação:** Fornecedor tem 1 endereço, usuário adiciona 1 novo.

**Estado Inicial:**
```typescript
fornecedor.enderecos = [
  { id: 1, cep: "01310-100", logradouro: "Av. Paulista", ... }
]
```

**Usuário adiciona:**
```typescript
novoEndereco = {
  // SEM id
  cep: "54730-640",
  logradouro: "Rua Nova",
  numero: "123",
  bairro: "Centro",
  cidade: "Recife",
  estado: "PE"
}
```

**Payload Enviado:**
```json
{
  "enderecos": [
    {
      "id": 1,
      "cep": "01310-100",
      "logradouro": "Av. Paulista",
      "numero": "1000",
      "bairro": "Bela Vista",
      "cidade": "São Paulo",
      "estado": "SP"
    },
    {
      "cep": "54730-640",
      "logradouro": "Rua Nova",
      "numero": "123",
      "bairro": "Centro",
      "cidade": "Recife",
      "estado": "PE"
    }
  ]
}
```

**Resultado:** Fornecedor tem 2 endereços (1 existente + 1 novo criado)

---

### Exemplo 2: Editar Endereço Existente

**Situação:** Usuário altera apenas o logradouro de um endereço.

**Payload Enviado:**
```json
{
  "enderecos": [
    {
      "id": 5,
      "logradouro": "Rua Alterada"
      // Apenas logradouro enviado, outros campos mantêm valores atuais
    }
  ]
}
```

**Resultado:** Apenas `logradouro` é atualizado, outros campos permanecem inalterados.

---

### Exemplo 3: Remover Endereço

**Situação:** Fornecedor tem 3 endereços (IDs: 1, 2, 3), usuário remove endereço ID 2.

**Payload Enviado:**
```json
{
  "enderecos": [
    {
      "id": 1,
      "cep": "01310-100",
      "logradouro": "Av. Paulista",
      ...
    },
    {
      "id": 3,
      "cep": "04567-890",
      "logradouro": "Rua das Flores",
      ...
    }
    // ID 2 não enviado → será removido
  ]
}
```

**Resultado:** Fornecedor tem 2 endereços (IDs: 1 e 3). Endereço ID 2 foi removido.

---

### Exemplo 4: Limpar Campo Opcional

**Situação:** Usuário quer remover o complemento de um endereço.

**Payload Enviado:**
```json
{
  "enderecos": [
    {
      "id": 5,
      "complemento": ""  // String vazia → backend converte para null
    }
  ]
}
```

**Resultado:** Campo `complemento` é limpo (salvo como `null` no banco).

---

### Exemplo 5: Editar Apenas Fornecedor (Sem Endereços)

**Situação:** Usuário edita apenas nome do fornecedor, sem alterar endereços.

**Payload Enviado:**
```json
{
  "nome_fantasia": "Novo Nome"
  // enderecos não enviado → mantém todos os endereços existentes
}
```

**Resultado:** Apenas `nome_fantasia` é atualizado. Endereços permanecem inalterados.

---

### Exemplo 6: Remover Todos os Endereços

**Situação:** Usuário quer remover todos os endereços.

**Payload Enviado:**
```json
{
  "enderecos": []  // Array vazio → remove todos
}
```

**Resultado:** Todos os endereços são removidos.

---

## ⚠️ Tratamento de Erros

### Códigos de Status HTTP

| Código | Significado | Ação Recomendada |
|--------|-------------|------------------|
| `200` | Sucesso | Atualizar interface com dados retornados |
| `400` | Dados inválidos | Mostrar mensagens de validação |
| `401` | Não autenticado | Redirecionar para login |
| `403` | Sem permissão | Mostrar mensagem de acesso negado |
| `404` | Fornecedor não encontrado | Mostrar erro e redirecionar |
| `409` | CPF/CNPJ duplicado | Mostrar erro específico |
| `500` | Erro interno | Mostrar erro genérico |

### Exemplo de Tratamento de Erros

```typescript
async function atualizarFornecedor(
  id: number,
  dados: UpdateFornecedorDto
): Promise<Fornecedor> {
  try {
    const response = await fetch(`/api/v1/fornecedor/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify(dados)
    });
    
    if (!response.ok) {
      const error = await response.json();
      
      switch (response.status) {
        case 400:
          // Dados inválidos
          throw new Error(
            Array.isArray(error.message) 
              ? error.message.join(', ') 
              : error.message
          );
          
        case 404:
          throw new Error('Fornecedor não encontrado');
          
        case 409:
          throw new Error('CPF/CNPJ já cadastrado em outro fornecedor');
          
        case 403:
          throw new Error('Você não tem permissão para editar fornecedores');
          
        default:
          throw new Error('Erro ao atualizar fornecedor');
      }
    }
    
    return await response.json();
    
  } catch (error) {
    console.error('Erro ao atualizar fornecedor:', error);
    throw error;
  }
}
```

---

## 💻 Implementação Completa

### Serviço de Fornecedor (TypeScript/Angular)

```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface UpdateFornecedorDto {
  nome_fantasia?: string;
  nome_razao?: string;
  tipoFornecedor?: 'PESSOA_FISICA' | 'PESSOA_JURIDICA';
  statusFornecedor?: 'ATIVO' | 'INATIVO' | 'BLOQUEADO';
  cpf_cnpj?: string;
  inscricao_estadual?: string | null;
  enderecos?: UpdateEnderecoDto[];
  contato?: UpdateContatoDto[];
}

export interface UpdateEnderecoDto {
  id?: number;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string | null;
  bairro?: string;
  cidade?: string;
  estado?: string;
  referencia?: string | null;
}

export interface Fornecedor {
  id: number;
  nome_fantasia: string;
  nome_razao: string;
  tipoFornecedor: string;
  statusFornecedor: string;
  cpf_cnpj: string;
  inscricao_estadual: string | null;
  criandoEm: Date;
  atualizadoEm: Date;
  enderecos: Endereco[];
  contato: Contato[];
}

@Injectable({
  providedIn: 'root'
})
export class FornecedorService {
  private apiUrl = '/api/v1/fornecedor';
  
  constructor(private http: HttpClient) {}
  
  /**
   * Busca fornecedor por ID
   */
  buscarPorId(id: number): Observable<Fornecedor> {
    return this.http.get<Fornecedor>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }
  
  /**
   * Atualiza fornecedor (parcial)
   */
  atualizar(
    id: number,
    dados: UpdateFornecedorDto
  ): Observable<Fornecedor> {
    const payload = this.prepararPayload(dados);
    
    return this.http.patch<Fornecedor>(
      `${this.apiUrl}/${id}`,
      payload,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }
  
  /**
   * Prepara payload para atualização
   */
  private prepararPayload(dados: any): UpdateFornecedorDto {
    const payload: UpdateFornecedorDto = {};
    
    // Campos do fornecedor
    if (dados.nome_fantasia !== undefined) {
      payload.nome_fantasia = dados.nome_fantasia.trim();
    }
    if (dados.nome_razao !== undefined) {
      payload.nome_razao = dados.nome_razao.trim();
    }
    if (dados.tipoFornecedor !== undefined) {
      payload.tipoFornecedor = dados.tipoFornecedor;
    }
    if (dados.statusFornecedor !== undefined) {
      payload.statusFornecedor = dados.statusFornecedor;
    }
    if (dados.cpf_cnpj !== undefined) {
      payload.cpf_cnpj = dados.cpf_cnpj.replace(/\D/g, '');
    }
    
    // Campo opcional: "" vira null
    if (dados.inscricao_estadual !== undefined) {
      payload.inscricao_estadual = dados.inscricao_estadual === '' 
        ? null 
        : dados.inscricao_estadual.trim();
    }
    
    // Array de endereços
    if (dados.enderecos && dados.enderecos.length > 0) {
      payload.enderecos = dados.enderecos.map((e: any) => 
        this.prepararEndereco(e)
      );
    }
    
    return payload;
  }
  
  /**
   * Prepara endereço para envio
   */
  private prepararEndereco(endereco: any): UpdateEnderecoDto {
    const preparado: UpdateEnderecoDto = {};
    
    // ID (apenas se existir)
    if (endereco.id && endereco.id > 0) {
      preparado.id = Number(endereco.id);
    }
    
    // Campos obrigatórios
    if (endereco.cep) {
      preparado.cep = endereco.cep.trim();
    }
    if (endereco.logradouro) {
      preparado.logradouro = endereco.logradouro.trim();
    }
    if (endereco.numero) {
      preparado.numero = endereco.numero.trim();
    }
    if (endereco.bairro) {
      preparado.bairro = endereco.bairro.trim();
    }
    if (endereco.cidade) {
      preparado.cidade = endereco.cidade.trim();
    }
    if (endereco.estado) {
      preparado.estado = endereco.estado.trim().toUpperCase();
    }
    
    // Campos opcionais: "" vira null
    if (endereco.complemento !== undefined) {
      preparado.complemento = endereco.complemento === '' 
        ? null 
        : endereco.complemento.trim();
    }
    if (endereco.referencia !== undefined) {
      preparado.referencia = endereco.referencia === '' 
        ? null 
        : endereco.referencia.trim();
    }
    
    return preparado;
  }
  
  /**
   * Headers HTTP
   */
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }
  
  /**
   * Tratamento de erros
   */
  private handleError(error: any): Observable<never> {
    let errorMessage = 'Erro desconhecido';
    
    if (error.error?.message) {
      errorMessage = Array.isArray(error.error.message)
        ? error.error.message.join(', ')
        : error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    console.error('Erro:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
```

### Componente de Edição (Angular)

```typescript
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FornecedorService, Fornecedor, UpdateFornecedorDto } from './fornecedor.service';

@Component({
  selector: 'app-editar-fornecedor',
  templateUrl: './editar-fornecedor.component.html'
})
export class EditarFornecedorComponent implements OnInit {
  formulario: FormGroup;
  fornecedorId: number;
  fornecedorOriginal: Fornecedor | null = null;
  carregando = false;
  salvando = false;
  erro: string | null = null;

  constructor(
    private fb: FormBuilder,
    private fornecedorService: FornecedorService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.formulario = this.criarFormulario();
  }

  ngOnInit(): void {
    this.fornecedorId = +this.route.snapshot.paramMap.get('id')!;
    this.carregarFornecedor();
  }

  criarFormulario(): FormGroup {
    return this.fb.group({
      nome_fantasia: ['', [Validators.required, Validators.maxLength(255)]],
      nome_razao: ['', [Validators.required, Validators.maxLength(255)]],
      tipoFornecedor: ['PESSOA_FISICA', Validators.required],
      statusFornecedor: ['ATIVO'],
      cpf_cnpj: ['', Validators.required],
      inscricao_estadual: [''],
      enderecos: this.fb.array([])
    });
  }

  get enderecosFormArray(): FormArray {
    return this.formulario.get('enderecos') as FormArray;
  }

  carregarFornecedor(): void {
    this.carregando = true;
    this.erro = null;

    this.fornecedorService.buscarPorId(this.fornecedorId).subscribe({
      next: (fornecedor) => {
        this.fornecedorOriginal = fornecedor;
        this.preencherFormulario(fornecedor);
        this.carregando = false;
      },
      error: (error) => {
        this.erro = error.message || 'Erro ao carregar fornecedor';
        this.carregando = false;
      }
    });
  }

  preencherFormulario(fornecedor: Fornecedor): void {
    this.formulario.patchValue({
      nome_fantasia: fornecedor.nome_fantasia,
      nome_razao: fornecedor.nome_razao,
      tipoFornecedor: fornecedor.tipoFornecedor,
      statusFornecedor: fornecedor.statusFornecedor,
      cpf_cnpj: fornecedor.cpf_cnpj,
      inscricao_estadual: fornecedor.inscricao_estadual || ''
    });

    // Preencher endereços
    const enderecosArray = this.fb.array([]);
    fornecedor.enderecos.forEach(endereco => {
      enderecosArray.push(this.criarFormGroupEndereco(endereco));
    });
    this.formulario.setControl('enderecos', enderecosArray);
  }

  criarFormGroupEndereco(endereco?: any): FormGroup {
    return this.fb.group({
      id: [endereco?.id || null],
      cep: [endereco?.cep || '', Validators.required],
      logradouro: [endereco?.logradouro || '', Validators.required],
      numero: [endereco?.numero || '', Validators.required],
      complemento: [endereco?.complemento || ''],
      bairro: [endereco?.bairro || '', Validators.required],
      cidade: [endereco?.cidade || '', Validators.required],
      estado: [endereco?.estado || '', [Validators.required, Validators.maxLength(2)]],
      referencia: [endereco?.referencia || '']
    });
  }

  adicionarEndereco(): void {
    this.enderecosFormArray.push(this.criarFormGroupEndereco());
  }

  removerEndereco(index: number): void {
    this.enderecosFormArray.removeAt(index);
  }

  salvar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.salvando = true;
    this.erro = null;

    const dados = this.formulario.value;
    
    this.fornecedorService.atualizar(this.fornecedorId, dados).subscribe({
      next: (fornecedorAtualizado) => {
        this.salvando = false;
        // Redirecionar ou atualizar interface
        this.router.navigate(['/fornecedores', fornecedorAtualizado.id]);
      },
      error: (error) => {
        this.erro = error.message || 'Erro ao salvar fornecedor';
        this.salvando = false;
      }
    });
  }
}
```

---

## ✅ Boas Práticas

### 1. Sempre Enviar Todos os Endereços

Quando o usuário edita endereços, **sempre envie TODOS os endereços** que devem permanecer:

```typescript
// ✅ CORRETO
const enderecosParaEnviar = enderecosFormArray.value.filter(e => 
  e.cep && e.logradouro && e.numero  // Apenas endereços válidos
);

// ❌ ERRADO: Enviar apenas endereços modificados
const enderecosModificados = enderecosFormArray.value.filter(e => e.modificado);
```

### 2. Validar Antes de Enviar

```typescript
function validarEnderecos(enderecos: any[]): boolean {
  for (const endereco of enderecos) {
    // Endereços novos precisam ter campos obrigatórios
    if (!endereco.id) {
      if (!endereco.cep || !endereco.logradouro || !endereco.numero) {
        return false;
      }
    }
  }
  return true;
}
```

### 3. Tratar Campos Opcionais Corretamente

```typescript
// ✅ CORRETO: Converter "" para null
complemento: endereco.complemento === '' ? null : endereco.complemento

// ❌ ERRADO: Enviar string vazia
complemento: endereco.complemento || ''
```

### 4. Não Enviar Campos Não Alterados

```typescript
// ✅ CORRETO: Enviar apenas campos alterados
if (fornecedor.nome_fantasia !== fornecedorOriginal.nome_fantasia) {
  payload.nome_fantasia = fornecedor.nome_fantasia;
}

// ❌ ERRADO: Enviar todos os campos sempre
payload.nome_fantasia = fornecedor.nome_fantasia; // Mesmo sem alteração
```

### 5. Feedback Visual

```typescript
// Mostrar loading durante salvamento
salvando = true;

// Mostrar sucesso
this.snackBar.open('Fornecedor atualizado com sucesso!', 'Fechar', {
  duration: 3000
});

// Mostrar erro
this.snackBar.open('Erro ao atualizar fornecedor', 'Fechar', {
  duration: 5000
});
```

---

## 📚 Resumo das Regras

### ✅ O Que Fazer

1. **Sempre enviar todos os endereços** que devem permanecer
2. **Incluir `id`** para endereços existentes que serão atualizados
3. **Omitir `id`** para novos endereços
4. **Converter `""` para `null`** em campos opcionais
5. **Enviar apenas campos alterados** do fornecedor
6. **Validar dados** antes de enviar

### ❌ O Que NÃO Fazer

1. **Não enviar apenas endereços modificados** (remove os não enviados)
2. **Não enviar `id` como string** (deve ser number)
3. **Não enviar string vazia** em campos opcionais (usar `null`)
4. **Não enviar todos os campos** se não foram alterados
5. **Não esquecer de incluir endereços existentes** no array

---

## 🎯 Checklist de Implementação

- [ ] Criar serviço de fornecedor com método `atualizar()`
- [ ] Implementar função `prepararEndereco()`
- [ ] Implementar função `prepararPayload()`
- [ ] Criar componente de edição com FormArray para endereços
- [ ] Implementar validação de formulário
- [ ] Implementar tratamento de erros
- [ ] Adicionar feedback visual (loading, sucesso, erro)
- [ ] Testar adicionar novo endereço
- [ ] Testar editar endereço existente
- [ ] Testar remover endereço
- [ ] Testar limpar campo opcional
- [ ] Testar editar apenas fornecedor (sem endereços)

---

## 📞 Suporte

Em caso de dúvidas ou problemas:

1. Verifique os logs do backend para detalhes do erro
2. Valide o formato do payload enviado
3. Confirme que todos os endereços estão sendo enviados
4. Verifique se os IDs dos endereços estão corretos

---

**Última atualização:** 2024-01-20
**Versão do Backend:** Compatível com implementação atual

