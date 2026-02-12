# Guia Prático de Implementação - Formulário de Fornecedor

## 🎯 Objetivo

Este guia fornece exemplos práticos e código pronto para implementar o formulário de fornecedor no frontend, seguindo as regras do backend:
- ✅ **Apenas `nome_fantasia` é obrigatório**
- ❌ **Campo `nome_razao` NÃO DEVE SER USADO no frontend** - é campo interno do backend
- ⚪ Todos os outros campos são opcionais

### ⚠️ IMPORTANTE sobre `nome_razao`:
- `nome_razao` existe no banco de dados, mas **NÃO deve ser usado no frontend**
- Se você não enviar `nome_razao`, o backend automaticamente usa `nome_fantasia` como valor
- **Não inclua `nome_razao` no formulário do frontend**

---

## 📋 Estrutura do Formulário

### Campos Disponíveis:

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `nome_fantasia` | string | ✅ SIM | Nome fantasia do fornecedor (1-255 caracteres) |
| `tipoFornecedor` | enum | ⚪ Não | `PESSOA_FISICA` ou `PESSOA_JURIDICA` |
| `statusFornecedor` | enum | ⚪ Não | `ATIVO`, `INATIVO` ou `BLOQUEADO` (padrão: `ATIVO`) |
| `cpf_cnpj` | string | ⚪ Não | CPF (11 dígitos) ou CNPJ (14 dígitos) |
| `documento` | string | ⚪ Não | Alias de `cpf_cnpj` (aceita formatado) |
| `inscricao_estadual` | string | ⚪ Não | Inscrição estadual (máx 20 caracteres) |
| `enderecos[]` | array | ⚪ Não | Array de endereços |
| `contato[]` | array | ⚪ Não | Array de contatos |

---

## 🔧 Implementação com React + TypeScript + React Hook Form + Yup

### 1. Instalação de Dependências

```bash
npm install react-hook-form @hookform/resolvers yup
# ou
yarn add react-hook-form @hookform/resolvers yup
```

### 2. Interface TypeScript

```typescript
// types/fornecedor.ts

export enum TipoFornecedor {
  PESSOA_FISICA = 'PESSOA_FISICA',
  PESSOA_JURIDICA = 'PESSOA_JURIDICA',
}

export enum StatusFornecedor {
  ATIVO = 'ATIVO',
  INATIVO = 'INATIVO',
  BLOQUEADO = 'BLOQUEADO',
}

export interface CreateFornecedorDto {
  // OBRIGATÓRIO
  nome_fantasia: string;
  
  // OPCIONAIS
  // nome_razao NÃO DEVE SER USADO - é campo interno do backend
  // Se não enviar nome_razao, o backend usa nome_fantasia automaticamente
  tipoFornecedor?: TipoFornecedor | null;
  statusFornecedor?: StatusFornecedor | null;
  cpf_cnpj?: string | null;
  documento?: string | null; // Alias de cpf_cnpj
  inscricao_estadual?: string | null;
  enderecos?: CreateEnderecoDto[] | null;
  contato?: CreateContatoDto[] | null;
}

export interface CreateEnderecoDto {
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  referencia?: string | null;
}

export interface CreateContatoDto {
  telefone?: string | null;
  email?: string | null;
  nomeContato?: string | null;
  outroTelefone?: string | null;
  nomeOutroTelefone?: string | null;
  observacao?: string | null;
  ativo?: boolean;
}
```

### 3. Schema de Validação com Yup

```typescript
// schemas/fornecedor.schema.ts

import * as yup from 'yup';
import { TipoFornecedor, StatusFornecedor } from '../types/fornecedor';

export const fornecedorSchema = yup.object().shape({
  // OBRIGATÓRIO
  nome_fantasia: yup
    .string()
    .required('Nome Fantasia é obrigatório')
    .min(1, 'Nome Fantasia deve ter pelo menos 1 caractere')
    .max(255, 'Nome Fantasia deve ter no máximo 255 caracteres')
    .trim(),
  
  // OPCIONAIS - Todos podem ser null ou undefined
  tipoFornecedor: yup
    .string()
    .oneOf([TipoFornecedor.PESSOA_FISICA, TipoFornecedor.PESSOA_JURIDICA])
    .nullable()
    .transform((value) => (value === '' ? null : value)),
  
  statusFornecedor: yup
    .string()
    .oneOf([StatusFornecedor.ATIVO, StatusFornecedor.INATIVO, StatusFornecedor.BLOQUEADO])
    .nullable()
    .transform((value) => (value === '' ? null : value)),
  
  cpf_cnpj: yup
    .string()
    .nullable()
    .transform((value) => (value === '' || value === null ? null : value)),
  
  documento: yup
    .string()
    .nullable()
    .transform((value) => (value === '' || value === null ? null : value)),
  
  inscricao_estadual: yup
    .string()
    .max(20, 'Inscrição Estadual deve ter no máximo 20 caracteres')
    .nullable()
    .transform((value) => (value === '' ? null : value)),
  
  enderecos: yup.array().nullable().default([]),
  contato: yup.array().nullable().default([]),
});

export type FornecedorFormData = yup.InferType<typeof fornecedorSchema>;
```

### 4. Componente de Formulário Completo

```tsx
// components/FornecedorForm.tsx

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { fornecedorSchema, FornecedorFormData } from '../schemas/fornecedor.schema';
import { TipoFornecedor, StatusFornecedor, CreateFornecedorDto } from '../types/fornecedor';

interface FornecedorFormProps {
  onSubmit: (data: CreateFornecedorDto) => Promise<void>;
  initialData?: Partial<CreateFornecedorDto>;
}

export const FornecedorForm: React.FC<FornecedorFormProps> = ({ onSubmit, initialData }) => {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<FornecedorFormData>({
    resolver: yupResolver(fornecedorSchema),
    defaultValues: {
      nome_fantasia: initialData?.nome_fantasia || '',
      tipoFornecedor: initialData?.tipoFornecedor || null,
      statusFornecedor: initialData?.statusFornecedor || StatusFornecedor.ATIVO,
      cpf_cnpj: initialData?.cpf_cnpj || null,
      documento: initialData?.documento || null,
      inscricao_estadual: initialData?.inscricao_estadual || null,
      enderecos: initialData?.enderecos || [],
      contato: initialData?.contato || [],
    },
  });

  const tipoFornecedor = watch('tipoFornecedor');

  const onFormSubmit = async (data: FornecedorFormData) => {
    // Limpar campos vazios antes de enviar
    // NÃO incluir nome_razao - o backend usa nome_fantasia automaticamente se não informado
    const payload: CreateFornecedorDto = {
      nome_fantasia: data.nome_fantasia.trim(),
      
      // Incluir apenas campos preenchidos
      ...(data.tipoFornecedor && { tipoFornecedor: data.tipoFornecedor }),
      ...(data.statusFornecedor && { statusFornecedor: data.statusFornecedor }),
      ...(data.cpf_cnpj && { cpf_cnpj: data.cpf_cnpj }),
      ...(data.documento && { documento: data.documento }),
      ...(data.inscricao_estadual && { inscricao_estadual: data.inscricao_estadual }),
      ...(data.enderecos && data.enderecos.length > 0 && { enderecos: data.enderecos }),
      ...(data.contato && data.contato.length > 0 && { contato: data.contato }),
      // NÃO incluir nome_razao - o backend gerencia isso automaticamente
    };

    await onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="fornecedor-form">
      {/* Campo Obrigatório */}
      <div className="form-group">
        <label htmlFor="nome_fantasia">
          Nome Fantasia <span className="required">*</span>
        </label>
        <input
          id="nome_fantasia"
          type="text"
          {...register('nome_fantasia')}
          placeholder="Nome Fantasia"
          className={errors.nome_fantasia ? 'error' : ''}
        />
        {errors.nome_fantasia && (
          <span className="error-message">{errors.nome_fantasia.message}</span>
        )}
      </div>

      {/* Tipo de Fornecedor - Opcional */}
      <div className="form-group">
        <label htmlFor="tipoFornecedor">Tipo de Fornecedor</label>
        <Controller
          name="tipoFornecedor"
          control={control}
          render={({ field }) => (
            <select {...field} id="tipoFornecedor">
              <option value="">Selecione...</option>
              <option value={TipoFornecedor.PESSOA_FISICA}>Pessoa Física</option>
              <option value={TipoFornecedor.PESSOA_JURIDICA}>Pessoa Jurídica</option>
            </select>
          )}
        />
      </div>

      {/* CPF/CNPJ - Opcional */}
      <div className="form-group">
        <label htmlFor="cpf_cnpj">CPF/CNPJ</label>
        <input
          id="cpf_cnpj"
          type="text"
          {...register('cpf_cnpj')}
          placeholder={tipoFornecedor === TipoFornecedor.PESSOA_FISICA ? '000.000.000-00' : '00.000.000/0000-00'}
        />
      </div>

      {/* Inscrição Estadual - Opcional (apenas para PJ) */}
      {tipoFornecedor === TipoFornecedor.PESSOA_JURIDICA && (
        <div className="form-group">
          <label htmlFor="inscricao_estadual">Inscrição Estadual</label>
          <input
            id="inscricao_estadual"
            type="text"
            {...register('inscricao_estadual')}
            placeholder="000.000.000.000"
            maxLength={20}
          />
        </div>
      )}

      {/* Status - Opcional */}
      <div className="form-group">
        <label htmlFor="statusFornecedor">Status</label>
        <Controller
          name="statusFornecedor"
          control={control}
          render={({ field }) => (
            <select {...field} id="statusFornecedor">
              <option value={StatusFornecedor.ATIVO}>Ativo</option>
              <option value={StatusFornecedor.INATIVO}>Inativo</option>
              <option value={StatusFornecedor.BLOQUEADO}>Bloqueado</option>
            </select>
          )}
        />
      </div>

      {/* Botão de Submit */}
      <div className="form-actions">
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : 'Salvar Fornecedor'}
        </button>
      </div>
    </form>
  );
};
```

### 5. Serviço de API

```typescript
// services/fornecedor.service.ts

import { CreateFornecedorDto } from '../types/fornecedor';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api/v1';

export class FornecedorService {
  private static getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('auth_token'); // Ajuste conforme sua implementação
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  static async criarFornecedor(data: CreateFornecedorDto): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/fornecedor`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao criar fornecedor');
    }

    return response.json();
  }

  static async atualizarFornecedor(id: number, data: Partial<CreateFornecedorDto>): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/fornecedor/${id}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao atualizar fornecedor');
    }

    return response.json();
  }
}
```

### 6. Uso do Componente

```tsx
// pages/CriarFornecedor.tsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FornecedorForm } from '../components/FornecedorForm';
import { FornecedorService } from '../services/fornecedor.service';
import { CreateFornecedorDto } from '../types/fornecedor';

export const CriarFornecedor: React.FC = () => {
  const navigate = useNavigate();

  const handleSubmit = async (data: CreateFornecedorDto) => {
    try {
      await FornecedorService.criarFornecedor(data);
      alert('Fornecedor criado com sucesso!');
      navigate('/fornecedores');
    } catch (error) {
      alert(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  return (
    <div className="page-container">
      <h1>Criar Novo Fornecedor</h1>
      <FornecedorForm onSubmit={handleSubmit} />
    </div>
  );
};
```

---

## 🎨 Estilos CSS (Exemplo)

```css
/* styles/fornecedor-form.css */

.fornecedor-form {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #333;
}

.form-group label .required {
  color: #e74c3c;
  margin-left: 3px;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #3498db;
}

.form-group input.error {
  border-color: #e74c3c;
}

.error-message {
  display: block;
  color: #e74c3c;
  font-size: 12px;
  margin-top: 5px;
}

.form-actions {
  margin-top: 30px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.form-actions button {
  padding: 10px 20px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.form-actions button:hover:not(:disabled) {
  background-color: #2980b9;
}

.form-actions button:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
}
```

---

## ✅ Checklist de Implementação

- [ ] **NÃO incluir `nome_razao` no formulário** (campo interno do backend)
- [ ] **NÃO incluir `nome_razao` nas interfaces TypeScript** (ou marcar como deprecated)
- [ ] Garantir que apenas `nome_fantasia` tem asterisco vermelho (*)
- [ ] Implementar validação com Yup (ou similar) apenas para `nome_fantasia` como obrigatório
- [ ] Garantir que campos opcionais podem ser `null` ou `undefined`
- [ ] Testar criação com apenas `nome_fantasia` (deve funcionar)
- [ ] Testar criação com todos os campos opcionais
- [ ] Verificar que não há erros no console ao enviar formulário
- [ ] **Confirmar que `nome_razao` não é enviado nas requisições**

---

## 🧪 Exemplos de Payloads

### Mínimo (apenas obrigatório):
```json
{
  "nome_fantasia": "Fornecedor ABC"
}
```

### Com alguns campos opcionais:
```json
{
  "nome_fantasia": "Fornecedor XYZ",
  "tipoFornecedor": "PESSOA_JURIDICA",
  "statusFornecedor": "ATIVO"
}
```

### Completo:
```json
{
  "nome_fantasia": "Fornecedor Completo Ltda",
  "tipoFornecedor": "PESSOA_JURIDICA",
  "statusFornecedor": "ATIVO",
  "cpf_cnpj": "12345678000190",
  "inscricao_estadual": "123.456.789.012",
  "enderecos": [
    {
      "cep": "01310100",
      "logradouro": "Avenida Paulista",
      "numero": "1000",
      "cidade": "São Paulo",
      "estado": "SP"
    }
  ],
  "contato": [
    {
      "telefone": "11999999999",
      "email": "contato@fornecedor.com"
    }
  ]
}
```

---

## ⚠️ Erros Comuns a Evitar

### ❌ ERRADO:
```tsx
// NÃO fazer isso - campo não deve ser usado no frontend
<input name="nome_razao" />
<label>Razão Social <span>*</span></label>

// NÃO fazer isso - validação incorreta
nome_razao: yup.string().required('Razão Social é obrigatória')

// NÃO fazer isso - não enviar nome_razao
const payload = {
  nome_fantasia: 'Teste',
  nome_razao: 'Razão Social' // ❌ NÃO ENVIAR
}
```

### ✅ CORRETO:
```tsx
// Apenas nome_fantasia é obrigatório
<input name="nome_fantasia" required />
<label>Nome Fantasia <span>*</span></label>

// Validação correta
nome_fantasia: yup.string().required('Nome Fantasia é obrigatório')

// Payload correto - não incluir nome_razao
const payload = {
  nome_fantasia: 'Teste'
  // nome_razao será preenchido automaticamente pelo backend com nome_fantasia
}
```

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique que o campo `nome_razao` foi completamente removido
2. Confirme que apenas `nome_fantasia` está marcado como obrigatório
3. Teste com o payload mínimo primeiro
4. Verifique os logs do console do navegador

---

**Última atualização**: 12/02/2026
**Versão do Backend**: SistemaERP v0.0.1
