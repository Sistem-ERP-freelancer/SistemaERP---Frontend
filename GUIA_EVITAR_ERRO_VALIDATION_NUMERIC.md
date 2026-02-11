# Guia: Evitar erro "Validation failed (numeric string is expected)"

Este guia descreve como o frontend deve chamar os endpoints **Contas a Receber** e **Contas a Pagar** sem disparar o erro **400 – Validation failed (numeric string is expected)**.

---

## 1. O que é o erro

- **Mensagem:** `Validation failed (numeric string is expected)`
- **HTTP:** 400 Bad Request
- **Onde aparece:** Ao abrir as telas **Contas a Receber** e **Contas a Pagar**, nas chamadas:
  - `GET /api/v1/pedidos/contas-receber`
  - `GET /api/v1/pedidos/contas-receber?situacao=em_aberto`
  - `GET /api/v1/pedidos/contas-pagar`

O backend valida os **query params**. Se algum parâmetro que deveria ser numérico for enviado **vazio**, como **string vazia** ou **inválido**, a API responde com esse erro.

---

## 2. Causa no frontend

O erro acontece quando a URL de requisição inclui parâmetros **vazios ou inválidos**, por exemplo:

| Situação                         | Exemplo de URL (errada)                    | Problema                          |
|----------------------------------|--------------------------------------------|-----------------------------------|
| Parâmetro numérico vazio        | `?cliente_id=&valor_inicial=`              | `cliente_id` e `valor_inicial` vazios |
| String vazia                    | `?cliente_nome=&situacao=`                 | Strings vazias na query           |
| Número inválido (NaN, negativo)* | `?cliente_id=abc` ou `?valor_inicial=-1`   | Backend espera número válido      |
| Data em formato errado          | `?data_inicial=10/02/2026`                 | Backend espera `YYYY-MM-DD`       |

\*Dependendo da regra do backend, zero ou negativos podem ser rejeitados para alguns campos.

**Regra de ouro:** **nunca** adicionar à query string um parâmetro que esteja vazio, indefinido ou inválido.

---

## 3. Regras para montar a query string

Seguir estas regras em **todo** código que monta URLs para `contas-receber` e `contas-pagar`:

1. **Não enviar parâmetros vazios**
   - Não usar `?cliente_id=` ou `?valor_inicial=` (valor em branco).
   - Se não houver valor, **não** incluir o parâmetro na URL.

2. **Números (IDs, valores)**
   - Só enviar se o valor for **realmente** um número válido.
   - Para IDs (ex.: `cliente_id`, `fornecedor_id`): número inteiro **> 0**.
   - Para valores monetários (ex.: `valor_inicial`, `valor_final`): número **>= 0**.
   - Garantir `!isNaN(Number(valor))` antes de adicionar.

3. **Strings (nome, situação, forma de pagamento, código)**
   - Só enviar se a string tiver conteúdo após `.trim()`.
   - Não enviar `""` ou só espaços.

4. **Datas**
   - Formato aceito: **YYYY-MM-DD** (ex.: `2026-02-10`).
   - Só adicionar `data_inicial` / `data_final` se a string estiver nesse formato (validar com regex ou parsing).

5. **Chamada sem filtros**
   - Chamar **sem query string**:  
     `GET /api/v1/pedidos/contas-receber`  
     `GET /api/v1/pedidos/contas-pagar`  
   - Isso é válido e não deve gerar erro de validação.

---

## 4. Onde implementar no frontend

O ponto central já está em **um único lugar**: o serviço de pedidos.

| Arquivo                         | Responsabilidade                                                                 |
|---------------------------------|-----------------------------------------------------------------------------------|
| `src/services/pedidos.service.ts` | Métodos `listarContasReceber(params?)` e `listarContasPagar(params?)` que montam a query e chamam a API. |

**Não** montar query strings para esses endpoints em outros arquivos. Sempre passar os filtros para o serviço e deixar o serviço:
- validar cada parâmetro (número, string, data),
- adicionar à URL **apenas** os que forem válidos.

Assim, todas as telas (Contas a Receber, Contas a Pagar, listas por cliente, etc.) passam a seguir as mesmas regras e deixam de exibir o erro.

---

## 5. Padrão de validação (referência)

O código em `pedidos.service.ts` já segue o padrão abaixo. Use-o como referência se criar outro método que chame esses endpoints.

### 5.1 Strings (codigo, cliente_nome, situacao, forma_pagamento)

```typescript
// Só adicionar se existir e não for só espaços
if (params?.situacao && params.situacao.trim()) {
  queryParams.append('situacao', params.situacao.trim());
}
```

### 5.2 IDs numéricos (cliente_id, fornecedor_id)

```typescript
// Número definido, não NaN e > 0
if (
  params?.cliente_id !== undefined &&
  params.cliente_id !== null &&
  !isNaN(Number(params.cliente_id)) &&
  params.cliente_id > 0
) {
  queryParams.append('cliente_id', params.cliente_id.toString());
}
```

### 5.3 Valores monetários (valor_inicial, valor_final)

```typescript
// Número definido, não NaN e >= 0
if (
  params?.valor_inicial !== undefined &&
  params.valor_inicial !== null &&
  !isNaN(Number(params.valor_inicial)) &&
  params.valor_inicial >= 0
) {
  queryParams.append('valor_inicial', params.valor_inicial.toString());
}
```

### 5.4 Datas (data_inicial, data_final)

```typescript
// Formato YYYY-MM-DD
const regexData = /^\d{4}-\d{2}-\d{2}$/;
if (
  params?.data_inicial &&
  params.data_inicial.trim() &&
  regexData.test(params.data_inicial.trim())
) {
  queryParams.append('data_inicial', params.data_inicial.trim());
}
```

### 5.5 Montagem da URL

```typescript
const query = queryParams.toString();
const url = `/pedidos/contas-receber${query ? `?${query}` : ''}`;
// Sem filtros: url = '/pedidos/contas-receber'
// Com filtros:  url = '/pedidos/contas-receber?situacao=em_aberto'
```

---

## 6. O que NÃO fazer

- **Não** fazer `params.append('cliente_id', params.cliente_id ?? '')` — evita enviar string vazia.
- **Não** fazer `params.append('valor_inicial', String(valor))` quando `valor` for `undefined`, `null`, `NaN` ou negativo (se a API não aceitar).
- **Não** montar a URL manualmente em componentes (ex.: em `ContasAReceber.tsx` ou `ContasAPagar.tsx`) para esses endpoints; usar sempre `pedidosService.listarContasReceber` / `listarContasPagar`.
- **Não** enviar datas em formato brasileiro (`DD/MM/YYYY`); usar sempre `YYYY-MM-DD`.

---

## 7. Tratamento de erro na UI (não exibir o erro técnico)

Para **deixar de exibir** a mensagem crua "Validation failed (numeric string is expected)" para o usuário:

1. **Nas telas que usam esses endpoints** (ex.: Contas a Receber, Contas a Pagar):
   - No `catch` da chamada (ou no callback de erro do React Query), **não** mostrar `error.message` diretamente quando for essa mensagem.
   - Exibir uma mensagem amigável, por exemplo:  
     *"Não foi possível carregar as contas. Tente novamente."*

2. **Exemplo com React Query:**

```typescript
const { data, error, isError } = useQuery({
  queryKey: ['contas-receber', filtros],
  queryFn: () => pedidosService.listarContasReceber(filtros),
  retry: false,
});

// Na renderização:
if (isError && error) {
  const msgAmigavel =
    error.message?.includes('Validation failed') ||
    error.message?.includes('numeric string')
      ? 'Não foi possível carregar as contas. Tente novamente.'
      : error.message;
  return <div className="text-destructive">{msgAmigavel}</div>;
}
```

3. **Toast / notificação:**
   - Se usar toast ao falhar, aplicar a mesma lógica: se a mensagem for de "Validation failed (numeric string is expected)", mostrar só a mensagem amigável e não o texto técnico.

Assim, o erro deixa de ser exibido para o usuário, enquanto o time pode continuar vendo o erro real em console (em dev) ou em logs.

---

## 8. Checklist de implementação

- [ ] **Serviço:** Em `pedidos.service.ts`, `listarContasReceber` e `listarContasPagar` só adicionam à URL parâmetros válidos (conforme seção 5).
- [ ] **Chamadas:** Nenhum componente ou hook monta query string manualmente para esses endpoints; todos usam o serviço.
- [ ] **Filtros:** Ao construir o objeto de filtros (ex.: `situacao`, `cliente_id`), não passar `undefined` como string (`"undefined"`) nem string vazia; usar `undefined` ou omitir o campo.
- [ ] **UI de erro:** Em Contas a Receber e Contas a Pagar, erros de validação (mensagem contendo "Validation failed" ou "numeric string") são substituídos por mensagem amigável e não são exibidos ao usuário em formato técnico.
- [ ] **Testes:** Abrir Contas a Receber e Contas a Pagar com e sem filtros; não deve mais aparecer 400 com "Validation failed (numeric string is expected)" e a UI não deve mostrar essa mensagem.

---

## 9. O que já está implementado neste projeto

- **`src/services/api.ts`**  
  No tratamento de resposta com status **400**, se a mensagem contiver `"Validation failed"` ou `"numeric string is expected"`, a mensagem exibida ao usuário é substituída por:  
  *"Não foi possível carregar os dados. Tente novamente."*  
  Assim, o erro técnico deixa de ser exibido em qualquer lugar que use `error.message` (toast, tela de erro, etc.).

- **`src/services/pedidos.service.ts`**  
  Os métodos `listarContasReceber` e `listarContasPagar` já validam todos os parâmetros antes de montar a query string (strings não vazias, números válidos, datas em YYYY-MM-DD), evitando enviar valores que gerem o 400.

---

## 10. Resumo

| Objetivo                         | Ação                                                                 |
|----------------------------------|----------------------------------------------------------------------|
| Evitar o 400 de validação        | Só enviar parâmetros válidos; nunca vazios ou inválidos na query.   |
| Ponto único de regra             | Centralizar em `pedidos.service.ts` (listarContasReceber / listarContasPagar). |
| Parar de exibir o erro ao usuário | Tratar erro na UI e mostrar mensagem amigável em vez do texto da API. |

Seguindo este guia, o frontend implementa as chamadas corretamente e deixa de exibir o erro "Validation failed (numeric string is expected)" para o usuário.  
Neste projeto, a mensagem amigável já é aplicada centralmente em `api.ts` (seção 9).
