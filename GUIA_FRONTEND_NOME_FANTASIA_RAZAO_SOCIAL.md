# Guia Frontend: Nome Fantasia obrigatório e Razão Social opcional (Pessoa Jurídica)

## Objetivo

Para **Cliente – Pessoa Jurídica (CNPJ)**:
- **Nome Fantasia:** campo **obrigatório** (com asterisco * na UI).
- **Razão Social:** campo **opcional** (sem asterisco; pode ficar em branco).

O backend já está configurado assim. O frontend precisa apenas refletir essa regra na validação e na interface.

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

- **Nome Fantasia:** enviar sempre que for Pessoa Jurídica e o usuário preencher (e é obrigatório nesse caso).
- **Razão Social:** enviar só se preenchido; pode ser omitido ou `null` quando vazio.

Exemplo de payload mínimo para criar cliente PJ:

```json
{
  "nome": "Nome do Cliente",
  "tipoPessoa": "PESSOA_JURIDICA",
  "statusCliente": "ATIVO",
  "nome_fantasia": "Empresa XYZ"
}
```

Razão Social pode vir junto se preenchida:

```json
{
  "nome": "Nome do Cliente",
  "tipoPessoa": "PESSOA_JURIDICA",
  "statusCliente": "ATIVO",
  "nome_fantasia": "Empresa XYZ",
  "nome_razao": "Empresa XYZ Ltda"
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

## 6. Resumo

| Onde            | Nome Fantasia      | Razão Social   |
|-----------------|--------------------|----------------|
| Label (PJ)      | Com * (obrigatório)| Sem * (opcional) |
| Validação (PJ)  | Obrigatório        | Opcional       |
| API             | Enviar sempre em PJ| Enviar se preenchido |

Com isso, o frontend fica alinhado ao backend: **Nome Fantasia obrigatório** e **Razão Social opcional** para Pessoa Jurídica.
