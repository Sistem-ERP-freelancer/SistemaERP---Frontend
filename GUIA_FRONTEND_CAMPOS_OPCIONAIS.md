# 📋 Guia Frontend - Campos Opcionais em Cliente e Fornecedor

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Cliente - Campos Obrigatórios](#cliente---campos-obrigatórios)
3. [Cliente - Campos Opcionais](#cliente---campos-opcionais)
4. [Fornecedor - Campos Obrigatórios](#fornecedor---campos-obrigatórios)
5. [Fornecedor - Campos Opcionais](#fornecedor---campos-opcionais)
6. [Implementação no Frontend](#implementação-no-frontend)
7. [Exemplos de Código](#exemplos-de-código)
8. [Validações](#validações)
9. [Tratamento de Limite de Crédito](#tratamento-de-limite-de-crédito)

---

## 🎯 Visão Geral

Após as atualizações no backend, **apenas o nome é obrigatório** na criação de cliente e fornecedor. Todos os outros campos são opcionais.

### Regras Principais

- ✅ **Cliente:** Apenas `nome` é obrigatório
- ✅ **Fornecedor:** Apenas `nome_fantasia` é obrigatório
- ✅ **Limite de crédito:** Se não informado (null), cliente compra sem limite
- ✅ **Endereços e contatos:** Opcionais em ambos

---

## 👤 Cliente - Campos Obrigatórios

### Campo Único Obrigatório

```typescript
nome: string  // OBRIGATÓRIO - Mínimo 1 caractere
```

---

## 👤 Cliente - Campos Opcionais

### Informações Básicas

```typescript
tipo_pessoa?: TipoPessoa          // Opcional: PESSOA_FISICA | PESSOA_JURIDICA
status_cliente?: StatusCliente     // Opcional: ATIVO | INATIVO | BLOQUEADO (padrão: ATIVO)
documento?: string                 // Opcional: CPF ou CNPJ
cpf_cnpj?: string                  // Opcional: CPF ou CNPJ (alternativo)
nome_fantasia?: string             // Opcional: Nome fantasia (PJ)
nome_razao?: string                // Opcional: Razão social (PJ)
inscricao_estadual?: string        // Opcional: Inscrição estadual (PJ)
email?: string                     // Opcional: Email válido
telefone?: string                  // Opcional: Telefone válido
observacoes?: string               // Opcional: Observações (máx 500 caracteres)
```

### Limite de Crédito

```typescript
limite_credito?: number | null     // Opcional: null = sem limite, número = limite definido
```

**Regras:**
- Se `null` ou `undefined` → Cliente compra sem limite
- Se número → Cliente tem limite definido
- Deve ser >= 0 se informado

### Endereços

```typescript
enderecos?: CreateEnderecoDto[]    // Opcional: Array de endereços
```

**Estrutura de Endereço:**
```typescript
interface CreateEnderecoDto {
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  referencia?: string;
}
```

**Validação:** Se informar endereços, pelo menos um deve ter CEP, logradouro ou cidade preenchidos.

### Contatos

```typescript
contatos?: CreateContatoDto[]      // Opcional: Array de contatos
```

**Estrutura de Contato:**
```typescript
interface CreateContatoDto {
  telefone?: string;               // Se informar contato, telefone é obrigatório
  email?: string;
  nomeContato?: string;
  outroTelefone?: string;
  nomeOutroTelefone?: string;
  observacao?: string;
  ativo?: boolean;
}
```

**Validação:** Se informar contatos, pelo menos um deve ter telefone preenchido.

### Condições de Pagamento

```typescript
condicoes_pagamento?: CreateCondicaoPagamentoDto[]  // Opcional
```

---

## 🏢 Fornecedor - Campos Obrigatórios

### Campo Único Obrigatório

```typescript
nome_fantasia: string  // OBRIGATÓRIO - Mínimo 1 caractere
```

---

## 🏢 Fornecedor - Campos Opcionais

### Informações Básicas

```typescript
nome_razao?: string                // Opcional: Razão social
tipoFornecedor?: TipoFornecedor    // Opcional: PESSOA_FISICA | PESSOA_JURIDICA
statusFornecedor?: StatusFornecedor // Opcional: ATIVO | INATIVO | BLOQUEADO (padrão: ATIVO)
cpf_cnpj?: string                  // Opcional: CPF ou CNPJ
inscricao_estadual?: string        // Opcional: Inscrição estadual
```

### Endereços

```typescript
enderecos?: CreateEnderecoDto[]    // Opcional: Array de endereços
```

**Nota:** Não é criado endereço padrão automaticamente. Se não informar, o fornecedor será criado sem endereços.

### Contatos

```typescript
contato?: CreateContatoDto[]       // Opcional: Array de contatos
```

**Validação:** Se informar contatos, todos devem ter telefone preenchido.

---

## 💻 Implementação no Frontend

### 1. Formulário de Cliente

#### Estrutura Básica

```typescript
interface ClienteFormData {
  // OBRIGATÓRIO
  nome: string;
  
  // OPCIONAIS
  tipo_pessoa?: TipoPessoa;
  documento?: string;
  nome_fantasia?: string;
  nome_razao?: string;
  inscricao_estadual?: string;
  email?: string;
  telefone?: string;
  limite_credito?: number | null;
  observacoes?: string;
  enderecos?: EnderecoFormData[];
  contatos?: ContatoFormData[];
}
```

#### Validação do Formulário

```typescript
import { z } from 'zod'; // ou yup, joi, etc.

const clienteSchema = z.object({
  // Obrigatório
  nome: z.string().min(1, 'Nome é obrigatório'),
  
  // Opcionais
  tipo_pessoa: z.enum(['PESSOA_FISICA', 'PESSOA_JURIDICA']).optional(),
  documento: z.string().optional(),
  nome_fantasia: z.string().optional(),
  nome_razao: z.string().optional(),
  inscricao_estadual: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefone: z.string().optional(),
  limite_credito: z.number().min(0).nullable().optional(),
  observacoes: z.string().max(500).optional(),
  enderecos: z.array(enderecoSchema).optional(),
  contatos: z.array(contatoSchema).optional(),
});
```

### 2. Formulário de Fornecedor

#### Estrutura Básica

```typescript
interface FornecedorFormData {
  // OBRIGATÓRIO
  nome_fantasia: string;
  
  // OPCIONAIS
  nome_razao?: string;
  tipoFornecedor?: TipoFornecedor;
  cpf_cnpj?: string;
  inscricao_estadual?: string;
  enderecos?: EnderecoFormData[];
  contato?: ContatoFormData[];
}
```

#### Validação do Formulário

```typescript
const fornecedorSchema = z.object({
  // Obrigatório
  nome_fantasia: z.string().min(1, 'Nome fantasia é obrigatório'),
  
  // Opcionais
  nome_razao: z.string().optional(),
  tipoFornecedor: z.enum(['PESSOA_FISICA', 'PESSOA_JURIDICA']).optional(),
  cpf_cnpj: z.string().optional(),
  inscricao_estadual: z.string().optional(),
  enderecos: z.array(enderecoSchema).optional(),
  contato: z.array(contatoSchema).optional(),
});
```

---

## 📝 Exemplos de Código

### Exemplo 1: Criar Cliente Mínimo (Apenas Nome)

```typescript
// ✅ VÁLIDO - Apenas nome obrigatório
const clienteMinimo = {
  nome: 'João Silva'
};

await clienteService.criar(clienteMinimo);
```

### Exemplo 2: Criar Cliente Completo

```typescript
// ✅ VÁLIDO - Todos os campos opcionais preenchidos
const clienteCompleto = {
  nome: 'João Silva',
  tipo_pessoa: 'PESSOA_FISICA',
  documento: '123.456.789-00',
  email: 'joao@email.com',
  telefone: '(11) 99999-9999',
  limite_credito: 10000.00,
  enderecos: [
    {
      cep: '01234-567',
      logradouro: 'Rua Exemplo',
      numero: '123',
      cidade: 'São Paulo',
      estado: 'SP'
    }
  ],
  contatos: [
    {
      telefone: '(11) 99999-9999',
      email: 'joao@email.com'
    }
  ]
};

await clienteService.criar(clienteCompleto);
```

### Exemplo 3: Cliente sem Limite de Crédito

```typescript
// ✅ VÁLIDO - Limite null = sem limite
const clienteSemLimite = {
  nome: 'Maria Santos',
  limite_credito: null  // ou undefined, ou simplesmente não enviar
};

await clienteService.criar(clienteSemLimite);
```

### Exemplo 4: Cliente com Limite de Crédito

```typescript
// ✅ VÁLIDO - Limite definido
const clienteComLimite = {
  nome: 'Pedro Oliveira',
  limite_credito: 5000.00
};

await clienteService.criar(clienteComLimite);
```

### Exemplo 5: Criar Fornecedor Mínimo

```typescript
// ✅ VÁLIDO - Apenas nome_fantasia obrigatório
const fornecedorMinimo = {
  nome_fantasia: 'Fornecedor ABC'
};

await fornecedorService.criar(fornecedorMinimo);
```

### Exemplo 6: Criar Fornecedor Completo

```typescript
// ✅ VÁLIDO - Todos os campos opcionais preenchidos
const fornecedorCompleto = {
  nome_fantasia: 'Fornecedor ABC',
  nome_razao: 'Fornecedor ABC Comércio Ltda',
  tipoFornecedor: 'PESSOA_JURIDICA',
  cpf_cnpj: '12.345.678/0001-90',
  inscricao_estadual: '123.456.789.012',
  enderecos: [
    {
      cep: '01234-567',
      logradouro: 'Av. Exemplo',
      numero: '456',
      cidade: 'São Paulo',
      estado: 'SP'
    }
  ],
  contato: [
    {
      telefone: '(11) 88888-8888',
      email: 'contato@fornecedor.com'
    }
  ]
};

await fornecedorService.criar(fornecedorCompleto);
```

---

## ✅ Validações

### Validações no Frontend (Recomendado)

#### Cliente

```typescript
function validarCliente(data: ClienteFormData): ValidationResult {
  const errors: Record<string, string> = {};

  // Obrigatório
  if (!data.nome || data.nome.trim() === '') {
    errors.nome = 'Nome é obrigatório';
  }

  // Opcionais - validar apenas se informados
  if (data.email && data.email.trim() !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      errors.email = 'Email inválido';
    }
  }

  if (data.limite_credito !== undefined && data.limite_credito !== null) {
    if (data.limite_credito < 0) {
      errors.limite_credito = 'Limite de crédito não pode ser negativo';
    }
  }

  // Validar endereços se informados
  if (data.enderecos && data.enderecos.length > 0) {
    const enderecosValidos = data.enderecos.filter(
      (e) => e.cep || e.logradouro || e.cidade
    );
    if (enderecosValidos.length === 0) {
      errors.enderecos = 'Pelo menos um endereço deve ter CEP, logradouro ou cidade';
    }
  }

  // Validar contatos se informados
  if (data.contatos && data.contatos.length > 0) {
    const contatosComTelefone = data.contatos.filter(
      (c) => c.telefone && c.telefone.trim() !== ''
    );
    if (contatosComTelefone.length === 0) {
      errors.contatos = 'Pelo menos um contato deve ter telefone';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
```

#### Fornecedor

```typescript
function validarFornecedor(data: FornecedorFormData): ValidationResult {
  const errors: Record<string, string> = {};

  // Obrigatório
  if (!data.nome_fantasia || data.nome_fantasia.trim() === '') {
    errors.nome_fantasia = 'Nome fantasia é obrigatório';
  }

  // Validar contatos se informados
  if (data.contato && data.contato.length > 0) {
    const contatosSemTelefone = data.contato.filter(
      (c) => !c.telefone || c.telefone.trim() === ''
    );
    if (contatosSemTelefone.length > 0) {
      errors.contato = 'Todos os contatos devem ter telefone preenchido';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
```

---

## 💰 Tratamento de Limite de Crédito

### Comportamento Esperado

```typescript
// Cliente SEM limite (compra livre)
const clienteSemLimite = {
  nome: 'Cliente Teste',
  limite_credito: null  // ou undefined, ou não enviar o campo
};

// Cliente COM limite
const clienteComLimite = {
  nome: 'Cliente Teste',
  limite_credito: 10000.00
};
```

### Interface no Frontend

#### Opção 1: Campo de Texto com Checkbox

```tsx
function LimiteCreditoField() {
  const [temLimite, setTemLimite] = useState(false);
  const [valorLimite, setValorLimite] = useState<number | null>(null);

  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={temLimite}
          onChange={(e) => {
            setTemLimite(e.target.checked);
            if (!e.target.checked) {
              setValorLimite(null);
            }
          }}
        />
        Cliente possui limite de compra
      </label>
      
      {temLimite && (
        <input
          type="number"
          value={valorLimite || ''}
          onChange={(e) => setValorLimite(parseFloat(e.target.value))}
          placeholder="Limite de crédito"
          min="0"
          step="0.01"
        />
      )}
    </div>
  );
}
```

#### Opção 2: Campo Opcional com Placeholder

```tsx
function LimiteCreditoField() {
  return (
    <div>
      <label>
        Limite de compra (opcional)
        <input
          type="number"
          placeholder="Deixe em branco para sem limite"
          min="0"
          step="0.01"
        />
      </label>
      <small>Se não informado, cliente compra sem limite</small>
    </div>
  );
}
```

### Envio para API

```typescript
function prepararDadosCliente(formData: ClienteFormData) {
  const dadosParaEnvio: any = {
    nome: formData.nome,
  };

  // Adicionar campos opcionais apenas se preenchidos
  if (formData.tipo_pessoa) dadosParaEnvio.tipo_pessoa = formData.tipo_pessoa;
  if (formData.documento) dadosParaEnvio.documento = formData.documento;
  if (formData.email) dadosParaEnvio.email = formData.email;
  if (formData.telefone) dadosParaEnvio.telefone = formData.telefone;
  
  // Limite de crédito: null se não informado, número se informado
  if (formData.limite_credito !== undefined && formData.limite_credito !== null) {
    dadosParaEnvio.limite_credito = formData.limite_credito;
  }
  // Se não informado, não enviar o campo (backend trata como null)

  // Endereços e contatos apenas se informados
  if (formData.enderecos && formData.enderecos.length > 0) {
    dadosParaEnvio.enderecos = formData.enderecos;
  }
  if (formData.contatos && formData.contatos.length > 0) {
    dadosParaEnvio.contatos = formData.contatos;
  }

  return dadosParaEnvio;
}
```

---

## 🎨 Exemplo de Formulário React

### Cliente Form Component

```tsx
import { useState } from 'react';
import { clienteService } from '../services/cliente.service';

export function ClienteForm() {
  const [formData, setFormData] = useState({
    nome: '', // OBRIGATÓRIO
    tipo_pessoa: undefined,
    documento: '',
    email: '',
    telefone: '',
    limite_credito: null as number | null,
    enderecos: [] as any[],
    contatos: [] as any[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação
    if (!formData.nome.trim()) {
      setErrors({ nome: 'Nome é obrigatório' });
      return;
    }

    // Preparar dados para envio
    const dadosParaEnvio: any = {
      nome: formData.nome,
    };

    // Adicionar apenas campos preenchidos
    if (formData.tipo_pessoa) dadosParaEnvio.tipo_pessoa = formData.tipo_pessoa;
    if (formData.documento) dadosParaEnvio.documento = formData.documento;
    if (formData.email) dadosParaEnvio.email = formData.email;
    if (formData.telefone) dadosParaEnvio.telefone = formData.telefone;
    if (formData.limite_credito !== null && formData.limite_credito !== undefined) {
      dadosParaEnvio.limite_credito = formData.limite_credito;
    }
    if (formData.enderecos.length > 0) dadosParaEnvio.enderecos = formData.enderecos;
    if (formData.contatos.length > 0) dadosParaEnvio.contatos = formData.contatos;

    try {
      await clienteService.criar(dadosParaEnvio);
      // Sucesso
    } catch (error) {
      // Tratar erro
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Campo obrigatório */}
      <div>
        <label>
          Nome <span style={{ color: 'red' }}>*</span>
          <input
            type="text"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            required
          />
        </label>
        {errors.nome && <span style={{ color: 'red' }}>{errors.nome}</span>}
      </div>

      {/* Campos opcionais */}
      <div>
        <label>
          Email
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </label>
      </div>

      <div>
        <label>
          Limite de crédito (opcional)
          <input
            type="number"
            value={formData.limite_credito || ''}
            onChange={(e) => {
              const value = e.target.value;
              setFormData({
                ...formData,
                limite_credito: value === '' ? null : parseFloat(value),
              });
            }}
            placeholder="Deixe em branco para sem limite"
            min="0"
            step="0.01"
          />
        </label>
        <small>Se não informado, cliente compra sem limite</small>
      </div>

      {/* Botão de submit */}
      <button type="submit">Criar Cliente</button>
    </form>
  );
}
```

---

## 📋 Checklist de Implementação

### Cliente

- [ ] Campo `nome` marcado como obrigatório no formulário
- [ ] Campo `limite_credito` opcional com tratamento de null
- [ ] Campos `enderecos` e `contatos` opcionais
- [ ] Validação apenas para campos preenchidos
- [ ] Não enviar campos vazios/undefined na requisição
- [ ] Mensagem clara sobre limite de crédito (null = sem limite)

### Fornecedor

- [ ] Campo `nome_fantasia` marcado como obrigatório
- [ ] Demais campos opcionais
- [ ] Não criar endereço padrão automaticamente
- [ ] Validação de contatos apenas se informados

---

## 🚨 Erros Comuns a Evitar

### ❌ Erro 1: Enviar campos vazios como string vazia

```typescript
// ❌ ERRADO
const dados = {
  nome: 'João',
  email: '',  // String vazia
  telefone: '', // String vazia
};

// ✅ CORRETO
const dados = {
  nome: 'João',
  // Não enviar email e telefone se vazios
};
```

### ❌ Erro 2: Enviar undefined explicitamente

```typescript
// ❌ ERRADO
const dados = {
  nome: 'João',
  limite_credito: undefined,
};

// ✅ CORRETO
const dados = {
  nome: 'João',
  // Não enviar limite_credito se não informado
};
```

### ❌ Erro 3: Validar campos opcionais como obrigatórios

```typescript
// ❌ ERRADO
if (!formData.email) {
  errors.email = 'Email é obrigatório'; // Email é opcional!
}

// ✅ CORRETO
if (formData.email && !isValidEmail(formData.email)) {
  errors.email = 'Email inválido'; // Valida apenas se informado
}
```

---

## 📚 Resumo

### Cliente

| Campo | Obrigatório | Tipo | Observações |
|-------|-------------|------|-------------|
| `nome` | ✅ Sim | string | Mínimo 1 caractere |
| `limite_credito` | ❌ Não | number \| null | null = sem limite |
| `enderecos` | ❌ Não | array | Opcional |
| `contatos` | ❌ Não | array | Opcional |
| Demais campos | ❌ Não | vários | Todos opcionais |

### Fornecedor

| Campo | Obrigatório | Tipo | Observações |
|-------|-------------|------|-------------|
| `nome_fantasia` | ✅ Sim | string | Mínimo 1 caractere |
| `nome_razao` | ❌ Não | string | Opcional |
| `cpf_cnpj` | ❌ Não | string | Opcional |
| `tipoFornecedor` | ❌ Não | enum | Opcional |
| `enderecos` | ❌ Não | array | Opcional (não cria padrão) |
| `contato` | ❌ Não | array | Opcional |

---

**Última Atualização:** 11 de Fevereiro de 2026  
**Versão:** 1.0.0
