# Guia Frontend: Nome Fantasia obrigatório e Razão Social opcional (Pessoa Jurídica)

## Objetivo

Para **Cliente – Pessoa Jurídica (CNPJ)**:
- **Nome Fantasia:** campo **obrigatório** (com asterisco * na UI).
- **Razão Social:** campo **opcional** (sem asterisco; pode ficar em branco).

O backend aceita criação de cliente PJ **apenas com Nome Fantasia** (sem enviar o campo `nome`); o backend preenche `nome` automaticamente com o valor de `nome_fantasia`.

---

## 0. Problema que ocorria e correção no backend

### Erro no console

- **Requisição:** `POST /api/v1/clientes` com payload:
  ```json
  { "nome_fantasia": "dadadad", "tipoPessoa": "PESSOA_JURIDICA", "statusCliente": "ATIVO" }
  ```
- **Resposta:** `400` com mensagem **"Nome é obrigatório."**

### Causa

O backend exige o campo **`nome`** para todo cliente. O frontend, ao ter apenas **Nome Fantasia** preenchido (e não um campo "Nome" separado no passo 1 para PJ), enviava só `nome_fantasia` e não enviava `nome`, gerando o 400.

### Correção aplicada no backend

Para **Pessoa Jurídica**, antes da validação "Nome é obrigatório", o backend agora faz:

- Se `nome` estiver vazio e `nome_fantasia` estiver preenchido → **define `nome = nome_fantasia`**.

Assim, o frontend pode enviar **somente** `nome_fantasia` (e `tipoPessoa`, `statusCliente`) para criar cliente PJ; o campo `nome` deixa de ser obrigatório no payload quando for PJ com nome_fantasia informado.

---

## 1. Regras de negócio (backend)

| Tipo de Cliente   | Nome Fantasia | Razão Social |
|-------------------|---------------|--------------|
| Pessoa Física    | Não exibido   | Não exibido  |
| **Pessoa Jurídica** | **Obrigatório** | **Opcional** |

- Se o usuário não preencher Razão Social, o backend usa o Nome Fantasia como fallback.
- Criar/editar cliente PJ sem Nome Fantasia retorna **400** com mensagem: *"Nome Fantasia é obrigatório para Pessoa Jurídica."*

---

## 2. Ajustes na interface (UI)

### 2.1 Modal/Formulário “Novo Cliente” – Passo 1 (Pessoa Jurídica)

- **Nome Fantasia**
  - Exibir **asterisco vermelho (*)** ao lado do label.
  - Label sugerido: `Nome Fantasia *` ou `Nome Fantasia (obrigatório)`.
  - Placeholder: ex. “Nome fantasia da empresa”.

- **Razão Social**
  - **Não** exibir asterisco.
  - Label sugerido: `Razão Social` ou `Razão Social (opcional)`.
  - Placeholder: ex. “Razão Social da Empresa”.

Exemplo de estrutura (só referência visual):

```
Tipo de Cliente: [Pessoa Jurídica (CNPJ)] [Pessoa Física (CPF)]

Nome Fantasia *          ← obrigatório
[Nome fantasia da empresa        ]

Razão Social (opcional)  ← opcional
[Razão Social da Empresa         ]

CNPJ (opcional)
[00.000.000/0000-00     ] [🔍]
```

### 2.2 Formulário de edição

- Mesma regra: Nome Fantasia com *, Razão Social sem * quando o tipo for Pessoa Jurídica.

---

## 3. Validação no frontend

### 3.1 Quando validar

- Só exige Nome Fantasia quando **Tipo de Cliente = Pessoa Jurídica**.
- Razão Social não deve ser obrigatória em nenhum caso.

### 3.2 Exemplo com Zod (React Hook Form)

```typescript
import { z } from 'zod';

const clienteSchema = z
  .object({
    tipo_pessoa: z.enum(['PESSOA_FISICA', 'PESSOA_JURIDICA']),
    nome: z.string().min(1, 'Nome é obrigatório'),
    nome_fantasia: z.string().optional(),
    nome_razao: z.string().optional(),
    // ... outros campos
  })
  .refine(
    (data) => {
      // Nome Fantasia obrigatório apenas para Pessoa Jurídica
      if (data.tipo_pessoa === 'PESSOA_JURIDICA') {
        return (
          data.nome_fantasia !== undefined &&
          data.nome_fantasia.trim() !== ''
        );
      }
      return true;
    },
    {
      message: 'Nome Fantasia é obrigatório para Pessoa Jurídica.',
      path: ['nome_fantasia'],
    }
  );
```

### 3.3 Exemplo com validação manual (onSubmit)

```typescript
function validateClientePJ(data: ClienteFormData): string | null {
  if (data.tipo_pessoa !== 'PESSOA_JURIDICA') return null;

  if (!data.nome_fantasia || data.nome_fantasia.trim() === '') {
    return 'Nome Fantasia é obrigatório para Pessoa Jurídica.';
  }

  // Razão Social não é validada como obrigatória
  return null;
}

// No submit:
const error = validateClientePJ(formData);
if (error) {
  setFieldError('nome_fantasia', error);
  return;
}
```

### 3.4 Exemplo com Yup

```typescript
import * as Yup from 'yup';

const clienteSchema = Yup.object({
  tipo_pessoa: Yup.string().oneOf(['PESSOA_FISICA', 'PESSOA_JURIDICA']),
  nome: Yup.string().required('Nome é obrigatório'),
  nome_fantasia: Yup.string().when('tipo_pessoa', {
    is: 'PESSOA_JURIDICA',
    then: (schema) =>
      schema.required('Nome Fantasia é obrigatório para Pessoa Jurídica.'),
    otherwise: (schema) => schema.optional(),
  }),
  nome_razao: Yup.string().optional(), // sempre opcional
});
```

---

## 4. Envio para a API

### Pessoa Jurídica (CNPJ)

- **Nome Fantasia:** obrigatório; sempre enviar quando for PJ.
- **Nome (`nome`):** opcional no payload. Se não enviar ou enviar vazio, o backend usa o valor de **Nome Fantasia** como `nome`.
- **Razão Social (`nome_razao`):** opcional; enviar só se preenchido; caso vazio, o backend usa Nome Fantasia como fallback.

**Payload mínimo aceito para criar cliente PJ (apenas Nome Fantasia):**

```json
{
  "nome_fantasia": "Empresa XYZ",
  "tipoPessoa": "PESSOA_JURIDICA",
  "statusCliente": "ATIVO"
}
```

**Alternativa (com nome explícito):**

```json
{
  "nome": "Empresa XYZ",
  "tipoPessoa": "PESSOA_JURIDICA",
  "statusCliente": "ATIVO",
  "nome_fantasia": "Empresa XYZ"
}
```

**Com Razão Social preenchida:**

```json
{
  "nome_fantasia": "Empresa XYZ",
  "nome_razao": "Empresa XYZ Ltda",
  "tipoPessoa": "PESSOA_JURIDICA",
  "statusCliente": "ATIVO"
}
```

Se o usuário deixar Razão Social em branco, não envie `nome_razao` ou envie `null`; o backend preenche com o Nome Fantasia.

---

## 5. Checklist de implementação

- [ ] **UI – Criar cliente (PJ):** Nome Fantasia com asterisco (*), Razão Social sem asterisco.
- [ ] **UI – Editar cliente (PJ):** Mesma regra.
- [ ] **Validação:** Nome Fantasia obrigatório somente quando `tipo_pessoa === 'PESSOA_JURIDICA'`.
- [ ] **Validação:** Razão Social nunca obrigatória.
- [ ] **Submit:** Não bloquear envio quando Razão Social estiver vazia; enviar apenas Nome Fantasia (e nome, tipoPessoa, statusCliente) se for o caso.
- [ ] **Mensagem de erro:** Exibir “Nome Fantasia é obrigatório para Pessoa Jurídica.” quando a validação falhar.

---

## 6. Cenários de teste e resultados

| # | Cenário | Payload (resumido) | Resultado esperado |
|---|--------|---------------------|---------------------|
| 1 | PJ só com Nome Fantasia | `{ nome_fantasia: "Empresa X", tipoPessoa: "PESSOA_JURIDICA", statusCliente: "ATIVO" }` | **201** – Cliente criado; `nome` e `nome_razao` iguais a `nome_fantasia`. |
| 2 | PJ com Nome Fantasia + Razão Social | `{ nome_fantasia: "Empresa X", nome_razao: "Empresa X Ltda", tipoPessoa: "PESSOA_JURIDICA", statusCliente: "ATIVO" }` | **201** – Cliente criado com os dois nomes. |
| 3 | PJ sem Nome Fantasia | `{ nome_razao: "Empresa X", tipoPessoa: "PESSOA_JURIDICA", statusCliente: "ATIVO" }` | **400** – "Nome Fantasia é obrigatório para Pessoa Jurídica." |
| 4 | PJ com Nome Fantasia vazio | `{ nome_fantasia: "", tipoPessoa: "PESSOA_JURIDICA", statusCliente: "ATIVO" }` | **400** – "Nome Fantasia é obrigatório para Pessoa Jurídica." |
| 5 | PF com nome | `{ nome: "João", tipoPessoa: "PESSOA_FISICA", statusCliente: "ATIVO" }` | **201** – Cliente PF criado. |

### Como testar no frontend

1. Abrir "Novo Cliente", escolher **Pessoa Jurídica**.
2. Preencher **apenas Nome Fantasia** (ex.: "dadadad"), deixar Razão Social em branco.
3. Avançar até o passo 4 e clicar em **Finalizar Cadastro**.
4. **Resultado esperado:** cadastro concluído sem erro "Nome é obrigatório."; cliente criado com nome igual ao Nome Fantasia.

---

## 6.1 O que fazer no frontend (implementação)

Para **Pessoa Jurídica**, ao montar o payload de criação de cliente:

**Opção A (recomendada):** Enviar apenas Nome Fantasia, sem o campo `nome`. O backend preenche `nome` com o valor de `nome_fantasia`.

```typescript
// Exemplo: montar payload para PJ
const payload: any = {
  tipoPessoa: 'PESSOA_JURIDICA',
  statusCliente: formData.statusCliente || 'ATIVO',
  nome_fantasia: formData.nome_fantasia?.trim() || '',
};
if (formData.nome_razao?.trim()) payload.nome_razao = formData.nome_razao.trim();
// Não é necessário enviar "nome" para PJ; backend usa nome_fantasia
```

**Opção B:** Enviar também `nome` com o mesmo valor de `nome_fantasia` (para exibição/listagem).

```typescript
const payload = {
  nome: formData.nome_fantasia?.trim(),
  nome_fantasia: formData.nome_fantasia?.trim(),
  nome_razao: formData.nome_razao?.trim() || undefined,
  tipoPessoa: 'PESSOA_JURIDICA',
  statusCliente: formData.statusCliente || 'ATIVO',
};
```

**Não fazer:** Exigir um campo "Nome" separado no passo 1 para PJ; o único obrigatório é **Nome Fantasia**. Se o formulário não tiver "Nome" para PJ, não adicione `nome` ao payload (ou use nome_fantasia como nome na Opção B).

---

## 7. Resumo

| Onde            | Nome Fantasia      | Razão Social   | Nome (campo) |
|-----------------|--------------------|----------------|--------------|
| Label (PJ)      | Com * (obrigatório)| Sem * (opcional) | Opcional para PJ (pode ser omitido; backend usa nome_fantasia) |
| Validação (PJ)  | Obrigatório        | Opcional       | Não exigir para PJ |
| API (PJ)        | Enviar sempre      | Enviar se preenchido | Opcional; se vazio, backend usa nome_fantasia |

Com isso, o frontend fica alinhado ao backend: **Nome Fantasia obrigatório**, **Razão Social opcional**, e **nome** pode ser omitido para PJ quando só Nome Fantasia for preenchido.
