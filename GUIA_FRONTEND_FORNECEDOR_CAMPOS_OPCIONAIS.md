# Guia de Implementação Frontend - Campos Opcionais em Fornecedores

## 📋 Resumo das Alterações

O backend foi atualizado para tornar **apenas o campo `nome_fantasia` obrigatório** em fornecedores. Todos os outros campos são **opcionais**, incluindo:
- `nome_razao`
- `tipoFornecedor` / `tipo_fornecedor`
- `statusFornecedor` / `status_fornecedor`
- `cpf_cnpj` / `documento`
- `inscricao_estadual`
- `enderecos[]`
- `contato[]`

---

## 🎯 Regras de Validação

### Campo Obrigatório
- ✅ **`nome_fantasia`** - Sempre obrigatório (mínimo 1 caractere, máximo 255)

### Campos Opcionais
- ⚪ **`nome_razao`** - Opcional (máximo 255 caracteres)
- ⚪ **`tipoFornecedor`** ou **`tipo_fornecedor`** - Opcional (padrão: `PESSOA_FISICA`)
  - Valores: `PESSOA_FISICA` | `PESSOA_JURIDICA`
- ⚪ **`statusFornecedor`** ou **`status_fornecedor`** - Opcional (padrão: `ATIVO`)
  - Valores: `ATIVO` | `INATIVO` | `BLOQUEADO`
- ⚪ **`cpf_cnpj`** ou **`documento`** - Opcional
  - Aceita formatado (`123.456.789-00` ou `12.345.678/0001-90`) ou apenas números
  - CPF: 11 dígitos | CNPJ: 14 dígitos
  - É normalizado automaticamente para apenas números
- ⚪ **`inscricao_estadual`** - Opcional (máximo 20 caracteres)
- ⚪ **`enderecos[]`** - Opcional (array de endereços)
- ⚪ **`contato[]`** - Opcional (array de contatos)

---

## 🔧 Implementação no Frontend

### 1. Atualizar Validação do Formulário

#### Antes (validação antiga):
```typescript
// ❌ ANTES - Validação incorreta
const schema = yup.object().shape({
  nome_fantasia: yup.string().required('Nome Fantasia é obrigatório'),
  nome_razao: yup.string().required('Razão Social é obrigatória'), // ❌ ERRADO
  cpf_cnpj: yup.string().required('CPF/CNPJ é obrigatório'), // ❌ ERRADO
  // ...
});
```

#### Depois (validação correta):
```typescript
// ✅ DEPOIS - Validação correta
const schema = yup.object().shape({
  nome_fantasia: yup
    .string()
    .required('Nome Fantasia é obrigatório')
    .min(1, 'Nome Fantasia deve ter pelo menos 1 caractere')
    .max(255, 'Nome Fantasia deve ter no máximo 255 caracteres'),
  
  // Todos os outros campos são opcionais
  nome_razao: yup
    .string()
    .max(255, 'Razão Social deve ter no máximo 255 caracteres')
    .nullable(),
  
  tipoFornecedor: yup
    .string()
    .oneOf(['PESSOA_FISICA', 'PESSOA_JURIDICA'])
    .nullable(),
  
  statusFornecedor: yup
    .string()
    .oneOf(['ATIVO', 'INATIVO', 'BLOQUEADO'])
    .nullable(),
  
  cpf_cnpj: yup
    .string()
    .nullable()
    .transform((value) => (value === '' ? null : value)),
  
  inscricao_estadual: yup
    .string()
    .max(20, 'Inscrição Estadual deve ter no máximo 20 caracteres')
    .nullable(),
  
  enderecos: yup.array().nullable(),
  contato: yup.array().nullable(),
});
```

### 2. Atualizar Interface TypeScript

```typescript
interface CreateFornecedorDto {
  // Obrigatório
  nome_fantasia: string;
  
  // Opcionais
  nome_razao?: string | null;
  tipoFornecedor?: 'PESSOA_FISICA' | 'PESSOA_JURIDICA' | null;
  tipo_fornecedor?: 'PESSOA_FISICA' | 'PESSOA_JURIDICA' | null; // snake_case também aceito
  statusFornecedor?: 'ATIVO' | 'INATIVO' | 'BLOQUEADO' | null;
  status_fornecedor?: 'ATIVO' | 'INATIVO' | 'BLOQUEADO' | null; // snake_case também aceito
  cpf_cnpj?: string | null;
  documento?: string | null; // Alias de cpf_cnpj
  inscricao_estadual?: string | null;
  enderecos?: CreateEnderecoDto[] | null;
  contato?: CreateContatoDto[] | null;
}
```

### 3. Atualizar Componente de Formulário

#### Exemplo React com React Hook Form:

```tsx
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const schema = yup.object().shape({
  nome_fantasia: yup
    .string()
    .required('Nome Fantasia é obrigatório')
    .min(1, 'Nome Fantasia deve ter pelo menos 1 caractere')
    .max(255, 'Nome Fantasia deve ter no máximo 255 caracteres'),
  
  nome_razao: yup.string().max(255).nullable(),
  tipoFornecedor: yup.string().oneOf(['PESSOA_FISICA', 'PESSOA_JURIDICA']).nullable(),
  statusFornecedor: yup.string().oneOf(['ATIVO', 'INATIVO', 'BLOQUEADO']).nullable(),
  cpf_cnpj: yup.string().nullable(),
  inscricao_estadual: yup.string().max(20).nullable(),
  enderecos: yup.array().nullable(),
  contato: yup.array().nullable(),
});

function FormularioFornecedor() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      nome_fantasia: '',
      nome_razao: null,
      tipoFornecedor: null,
      statusFornecedor: 'ATIVO', // Valor padrão
      cpf_cnpj: null,
      inscricao_estadual: null,
      enderecos: [],
      contato: [],
    },
  });

  const onSubmit = async (data: CreateFornecedorDto) => {
    // Limpar campos vazios antes de enviar
    const payload: CreateFornecedorDto = {
      nome_fantasia: data.nome_fantasia.trim(),
      
      // Incluir apenas campos preenchidos
      ...(data.nome_razao && { nome_razao: data.nome_razao.trim() }),
      ...(data.tipoFornecedor && { tipoFornecedor: data.tipoFornecedor }),
      ...(data.statusFornecedor && { statusFornecedor: data.statusFornecedor }),
      ...(data.cpf_cnpj && { cpf_cnpj: data.cpf_cnpj }),
      ...(data.inscricao_estadual && { inscricao_estadual: data.inscricao_estadual }),
      ...(data.enderecos && data.enderecos.length > 0 && { enderecos: data.enderecos }),
      ...(data.contato && data.contato.length > 0 && { contato: data.contato }),
    };

    try {
      const response = await fetch('/api/v1/fornecedor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao criar fornecedor');
      }

      const fornecedor = await response.json();
      console.log('Fornecedor criado:', fornecedor);
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Campo Obrigatório */}
      <div>
        <label>
          Nome Fantasia <span style={{ color: 'red' }}>*</span>
        </label>
        <input
          {...register('nome_fantasia')}
          placeholder="Nome Fantasia"
        />
        {errors.nome_fantasia && (
          <span style={{ color: 'red' }}>{errors.nome_fantasia.message}</span>
        )}
      </div>

      {/* Campos Opcionais */}
      <div>
        <label>Razão Social (opcional)</label>
        <input
          {...register('nome_razao')}
          placeholder="Razão Social"
        />
      </div>

      <div>
        <label>Tipo de Fornecedor (opcional)</label>
        <select {...register('tipoFornecedor')}>
          <option value="">Selecione...</option>
          <option value="PESSOA_FISICA">Pessoa Física</option>
          <option value="PESSOA_JURIDICA">Pessoa Jurídica</option>
        </select>
      </div>

      <div>
        <label>CPF/CNPJ (opcional)</label>
        <input
          {...register('cpf_cnpj')}
          placeholder="00.000.000/0000-00"
        />
      </div>

      {/* ... outros campos opcionais ... */}

      <button type="submit">Criar Fornecedor</button>
    </form>
  );
}
```

### 4. Atualizar Mensagens de Validação na UI

#### Remover mensagens incorretas:
```tsx
// ❌ REMOVER estas mensagens
{/* 
  "Preencha os campos obrigatórios (Nome Fantasia, Razão Social e CNPJ)"
  "Razão Social é obrigatória"
  "CNPJ é obrigatório"
*/}
```

#### Manter apenas:
```tsx
// ✅ Manter apenas esta mensagem
{errors.nome_fantasia && (
  <span style={{ color: 'red' }}>Nome Fantasia é obrigatório</span>
)}
```

### 5. Exemplos de Payloads

#### Mínimo necessário (apenas nome_fantasia):
```json
{
  "nome_fantasia": "Fornecedor ABC"
}
```

#### Com alguns campos opcionais:
```json
{
  "nome_fantasia": "Fornecedor XYZ",
  "tipoFornecedor": "PESSOA_JURIDICA",
  "statusFornecedor": "ATIVO"
}
```

#### Completo (todos os campos):
```json
{
  "nome_fantasia": "Fornecedor Completo Ltda",
  "nome_razao": "Fornecedor Completo Comércio e Serviços Ltda",
  "tipoFornecedor": "PESSOA_JURIDICA",
  "statusFornecedor": "ATIVO",
  "cpf_cnpj": "12345678000190",
  "inscricao_estadual": "123.456.789.012",
  "enderecos": [
    {
      "cep": "01310100",
      "logradouro": "Avenida Paulista",
      "numero": "1000",
      "complemento": "Sala 100",
      "bairro": "Bela Vista",
      "cidade": "São Paulo",
      "estado": "SP"
    }
  ],
  "contato": [
    {
      "telefone": "11999999999",
      "email": "contato@fornecedor.com",
      "nomeContato": "João Silva"
    }
  ]
}
```

#### Usando snake_case (também aceito):
```json
{
  "nome_fantasia": "Fornecedor Teste",
  "tipo_fornecedor": "PESSOA_JURIDICA",
  "status_fornecedor": "ATIVO",
  "documento": "12345678000190"
}
```

---

## 🧪 Cenários de Teste

### ✅ Cenários que DEVEM funcionar:

1. **Apenas nome_fantasia**
   ```json
   { "nome_fantasia": "Fornecedor Teste" }
   ```
   ✅ Deve criar com sucesso

2. **nome_fantasia + tipoFornecedor**
   ```json
   {
     "nome_fantasia": "Fornecedor PF",
     "tipoFornecedor": "PESSOA_FISICA"
   }
   ```
   ✅ Deve criar com sucesso

3. **Todos os campos opcionais preenchidos**
   ```json
   {
     "nome_fantasia": "Fornecedor Completo",
     "nome_razao": "Razão Social",
     "tipoFornecedor": "PESSOA_JURIDICA",
     "statusFornecedor": "ATIVO",
     "cpf_cnpj": "12345678000190",
     "inscricao_estadual": "123.456.789.012",
     "enderecos": [...],
     "contato": [...]
   }
   ```
   ✅ Deve criar com sucesso

4. **Usando snake_case**
   ```json
   {
     "nome_fantasia": "Fornecedor Teste",
     "tipo_fornecedor": "PESSOA_JURIDICA",
     "status_fornecedor": "ATIVO"
   }
   ```
   ✅ Deve criar com sucesso

5. **Usando campo "documento" (alias de cpf_cnpj)**
   ```json
   {
     "nome_fantasia": "Fornecedor Teste",
     "documento": "12345678000190"
   }
   ```
   ✅ Deve criar com sucesso

6. **CPF/CNPJ formatado**
   ```json
   {
     "nome_fantasia": "Fornecedor Teste",
     "cpf_cnpj": "123.456.789-00"
   }
   ```
   ✅ Deve criar com sucesso (será normalizado para apenas números)

7. **Apenas endereços (sem contatos)**
   ```json
   {
     "nome_fantasia": "Fornecedor Teste",
     "enderecos": [...]
   }
   ```
   ✅ Deve criar com sucesso

8. **Apenas contatos (sem endereços)**
   ```json
   {
     "nome_fantasia": "Fornecedor Teste",
     "contato": [...]
   }
   ```
   ✅ Deve criar com sucesso

### ❌ Cenários que DEVEM falhar:

9. **Sem nome_fantasia**
   ```json
   { "nome_razao": "Teste" }
   ```
   ❌ Deve retornar erro: "Nome Fantasia é obrigatório."

10. **nome_fantasia vazio**
    ```json
    { "nome_fantasia": "" }
    ```
    ❌ Deve retornar erro: "Nome Fantasia é obrigatório."

11. **nome_fantasia apenas com espaços**
    ```json
    { "nome_fantasia": "   " }
    ```
    ❌ Deve retornar erro: "Nome Fantasia é obrigatório."

---

## 📝 Respostas da API

### Sucesso (201 Created):
```json
{
  "id": 1,
  "nome_fantasia": "Fornecedor Teste",
  "nome_razao": null,
  "tipoFornecedor": "PESSOA_FISICA",
  "statusFornecedor": "ATIVO",
  "cpf_cnpj": null,
  "inscricao_estadual": null,
  "criandoEm": "2026-02-12T10:00:00.000Z",
  "atualizadoEm": "2026-02-12T10:00:00.000Z",
  "enderecos": [],
  "contato": []
}
```

### Erro - nome_fantasia ausente (400 Bad Request):
```json
{
  "statusCode": 400,
  "message": "Nome Fantasia é obrigatório.",
  "error": "Bad Request"
}
```

### Erro - nome_fantasia vazio (400 Bad Request):
```json
{
  "statusCode": 400,
  "message": "Nome Fantasia é obrigatório.",
  "error": "Bad Request"
}
```

---

## 🔄 Migração do Código Existente

### Checklist de Migração:

- [ ] Remover validação obrigatória de `nome_razao`
- [ ] Remover validação obrigatória de `cpf_cnpj`
- [ ] Remover validação obrigatória de `inscricao_estadual`
- [ ] Atualizar mensagens de erro na UI
- [ ] Atualizar indicadores visuais (asteriscos vermelhos) nos campos
- [ ] Testar criação com apenas `nome_fantasia`
- [ ] Testar criação com todos os campos opcionais
- [ ] Verificar que contatos e endereços são opcionais
- [ ] Atualizar documentação interna

### Campos que devem perder o asterisco vermelho (*):

- ❌ `nome_razao` - Remover `*`
- ❌ `cpf_cnpj` - Remover `*`
- ❌ `inscricao_estadual` - Remover `*`
- ❌ `enderecos` - Remover `*`
- ❌ `contato` - Remover `*`

### Campo que deve manter o asterisco vermelho (*):

- ✅ `nome_fantasia` - Manter `*`

---

## 🧪 Como Testar

### 1. Usando o script de teste fornecido:

```bash
# Configurar token JWT
export TOKEN="seu_token_jwt_aqui"
export BASE_URL="http://localhost:4000"

# Executar testes
node scripts/test-fornecedor-campos-opcionais.js
```

### 2. Testando manualmente com cURL:

```bash
# Teste 1: Apenas nome_fantasia (deve funcionar)
curl -X POST http://localhost:4000/api/v1/fornecedor \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nome_fantasia": "Fornecedor Teste"}'

# Teste 2: Sem nome_fantasia (deve falhar)
curl -X POST http://localhost:4000/api/v1/fornecedor \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nome_razao": "Teste"}'
```

### 3. Testando no Postman/Insomnia:

1. Criar requisição POST para `/api/v1/fornecedor`
2. Adicionar header: `Authorization: Bearer SEU_TOKEN`
3. Testar os cenários listados acima

---

## 📚 Referências

- **Endpoint**: `POST /api/v1/fornecedor`
- **Autenticação**: Bearer Token (JWT)
- **Permissões**: ADMIN ou GERENTE
- **Content-Type**: `application/json`

---

## ✅ Resultado dos Testes Automatizados

Execute o script `test-fornecedor-campos-opcionais.js` para validar todos os cenários:

```bash
node scripts/test-fornecedor-campos-opcionais.js
```

O script testa:
- ✅ Criação com apenas `nome_fantasia`
- ✅ Criação com campos opcionais
- ✅ Suporte a snake_case e camelCase
- ✅ Validação de campos obrigatórios
- ✅ Normalização de documentos
- ✅ Campos opcionais (endereços, contatos)

---

**Última atualização**: 12/02/2026
**Versão do Backend**: SistemaERP v0.0.1
