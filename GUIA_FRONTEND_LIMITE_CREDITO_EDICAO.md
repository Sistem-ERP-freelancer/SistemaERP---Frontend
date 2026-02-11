# Guia Frontend: Campo Limite de Crédito na Edição de Cliente

## Objetivo

Permitir editar o **Limite de Crédito** do cliente no formulário "Editar Cliente". O backend já aceita e persiste o campo `limite_credito` no **PATCH** `/api/v1/clientes/:id`.

---

## 1. Regras do backend

| Item | Regra |
|------|--------|
| **Campo** | `limite_credito` |
| **Tipo** | `number` (opcional) |
| **Valores** | Número ≥ 0 com até 2 casas decimais, ou `null` |
| **Significado** | Valor numérico = limite em reais; `null` ou omitido = "sem limite" |
| **Validação** | Não pode ser negativo |

---

## 2. Onde colocar o campo na tela

- No modal/formulário **"Editar Cliente"**.
- Sugestão: na seção **"Informações Básicas"** ou **"Dados principais"**, junto a Nome Fantasia, Razão Social, CNPJ (por exemplo abaixo de Inscrição Estadual ou em um bloco "Financeiro").
- Label sugerido: **"Limite de Crédito (opcional)"**.
- Texto de ajuda: *"Valor máximo de crédito para este cliente. Deixe em branco para sem limite."*

---

## 3. Comportamento na UI

- **Input:** numérico, formato moeda (ex.: R$ 0,00), ou número simples.
- **Vazio:** significa "sem limite" → enviar `null` no PATCH.
- **Preenchido:** enviar o valor numérico (ex.: 10000.50).
- **Ao abrir o formulário:** preencher o campo com o valor atual do cliente (`cliente.limite_credito`). Se for `null` ou 0 e a regra de negócio for "0 = sem limite", exibir vazio ou "Sem limite".

---

## 4. Dados do cliente (GET)

O cliente retornado pela API já traz `limite_credito`:

```json
{
  "id": 1,
  "nome": "Cliente X",
  "limite_credito": 10000.50,
  ...
}
```

- Se for `null` ou não vier: tratar como "sem limite" na exibição e no envio (vazio → `null`).

---

## 5. Envio na edição (PATCH)

### Payload

Incluir `limite_credito` apenas quando o usuário alterar o valor (ou sempre enviar o valor atual do formulário).

**Exemplo: definir limite de R$ 10.000,50**

```json
PATCH /api/v1/clientes/5
{
  "limite_credito": 10000.50
}
```

**Exemplo: deixar "sem limite"**

```json
PATCH /api/v1/clientes/5
{
  "limite_credito": null
}
```

**Exemplo: edição com outros campos**

```json
PATCH /api/v1/clientes/5
{
  "nome_fantasia": "Empresa XYZ",
  "limite_credito": 5000
}
```

### Regras no frontend

- Campo **vazio** ou "Sem limite" → enviar `limite_credito: null`.
- Campo **preenchido** → enviar número (ex.: 10000 ou 10000.50), nunca negativo.
- Se o formulário for de "atualização parcial", inclua `limite_credito` no objeto do PATCH sempre que o usuário puder alterá-lo (valor ou null).

---

## 5.1 Enviar `null` quando o usuário remove o limite

Quando o usuário **apaga** o valor do campo (deixa em branco / "Sem limite"), o frontend deve enviar **`limite_credito: null`** no PATCH. O backend grava `null` no banco e o cliente fica sem limite.

### Por que o valor “voltava” e não apagava no banco

- **Frontend enviava string vazia `""`** em vez de `null` → o backend antigo não tratava `""` como “sem limite” e podia rejeitar ou gravar valor errado.
- **Frontend omitia o campo** quando vazio → o backend só atualiza `limite_credito` quando o campo vem no body; ao omitir, o valor antigo permanecia no banco.
- **Após salvar, a tela não atualizava** → refetch ou estado local ainda mostrava o valor antigo.

**Correções no backend (já feitas):** o backend agora aceita `null` e trata string vazia `""` como `null`, gravando “sem limite” no banco.

### O que fazer no frontend

1. **Campo vazio** = string vazia `""`, ou estado `null`/`undefined` no form.
2. Ao montar o payload do PATCH, se o campo estiver vazio → incluir **`limite_credito: null`** (recomendado). O backend também aceita `""`, mas enviar `null` é o correto.
3. **Não omitir** o campo quando o usuário limpou: quem removeu quer “sem limite”, então é preciso enviar `limite_credito: null` para o backend atualizar.
4. **Após sucesso do PATCH:** atualizar o estado local com a resposta da API (o cliente retornado terá `limite_credito: null`) ou refazer o GET do cliente, para o campo não “voltar” com o valor antigo.

**Exemplo:**

```ts
// Ao montar o payload de edição
const payload: any = { /* outros campos */ };

if (formData.limite_credito === '' || formData.limite_credito == null) {
  payload.limite_credito = null;  // usuário removeu = sem limite
} else {
  payload.limite_credito = Number(formData.limite_credito);
}
```

**Resumo:** Usuário remove o valor → enviar `limite_credito: null` no PATCH e, após salvar, usar a resposta (ou refetch) para atualizar a tela.

---

## 6. Exemplo de implementação (React)

### Estado / valor do formulário

```ts
// Ex.: estado local ou valor do form
const [limiteCredito, setLimiteCredito] = useState<number | null>(
  cliente?.limite_credito ?? null
);
```

### Montagem do payload de edição

```ts
function buildUpdatePayload(formData: ClienteEditFormData) {
  const payload: Record<string, unknown> = {};

  if (formData.nome_fantasia !== undefined) payload.nome_fantasia = formData.nome_fantasia;
  if (formData.nome_razao !== undefined) payload.nome_razao = formData.nome_razao;
  // ... outros campos

  // Limite de crédito: enviar número ou null (vazio = sem limite)
  if (formData.limite_credito !== undefined) {
    payload.limite_credito =
      formData.limite_credito === '' || formData.limite_credito === null
        ? null
        : Number(formData.limite_credito);
  }

  return payload;
}
```

### Validação antes de enviar

```ts
// Limite não pode ser negativo
if (
  payload.limite_credito != null &&
  (typeof payload.limite_credito !== 'number' || payload.limite_credito < 0)
) {
  // mostrar erro ou ajustar para null/0
  payload.limite_credito = null;
}
```

### Exemplo de campo (input numérico simples)

```tsx
<TextField
  label="Limite de Crédito (opcional)"
  type="number"
  value={limiteCredito ?? ''}
  onChange={(e) => {
    const v = e.target.value;
    setLimiteCredito(v === '' ? null : parseFloat(v) || null);
  }}
  inputProps={{ min: 0, step: 0.01 }}
  helperText="Deixe em branco para sem limite."
/>
```

### Exemplo com máscara de moeda (R$)

Se usar máscara, ao enviar converta o valor formatado para número (ex.: "10.000,50" → 10000.50) e envie no PATCH; para "sem limite", envie `null` quando o campo estiver vazio.

---

## 7. Checklist

- [x] Campo "Limite de Crédito" no formulário **Editar Cliente**.
- [x] Valor inicial preenchido com `cliente.limite_credito` (ou vazio se null).
- [x] Campo vazio ou "Sem limite" → enviar `limite_credito: null`.
- [x] Campo preenchido → enviar número ≥ 0 (até 2 decimais).
- [x] PATCH inclui `limite_credito` no body quando o usuário alterar (ou sempre enviar o valor atual do form).
- [x] Não enviar valor negativo; backend rejeita com 400.

---

## 8. Resumo

| Ação | O que fazer |
|------|-------------|
| **Exibir** | Mostrar `cliente.limite_credito` no formulário (ou vazio se null). |
| **Editar** | Input numérico ou moeda; vazio = sem limite. |
| **Enviar** | Incluir `limite_credito` no PATCH: número ou `null`. |
| **Validar** | Apenas garantir ≥ 0 (e tipo number); backend valida o resto. |

Com isso, o campo de limite de crédito fica integrado à edição de cliente no frontend usando o que o backend já oferece.
