# ✅ Adaptação Implementada - Tratamento de Campos Vazios

## 📋 Resumo

O código foi adaptado para seguir **exatamente** o guia `GUIA_ADAPTACAO_FRONTEND_CAMPOS_VAZIOS.md`.

---

## 🔧 Mudanças Implementadas

### 1. Funções Helper Adicionadas

✅ **`normalizarParaComparacao`**
- Compara valores considerando `null`, `undefined` e `''` como equivalentes
- Trata strings com `trim()` antes de comparar
- Preserva valores boolean

✅ **`prepararCampoParaEnvio`**
- Retorna `undefined` se não mudou (não altera)
- Retorna `""` se mudou para vazio (limpa campo)
- Retorna valor se mudou (atualiza campo)

---

### 2. Campos do Fornecedor

✅ **Atualização parcial implementada:**
- Compara cada campo antes de enviar
- Usa `prepararCampoParaEnvio` para determinar se deve incluir
- `undefined` = não inclui no payload (não altera)
- `""` = inclui no payload (limpa campo)

**Exemplo:**
```typescript
const nomeFantasia = prepararCampoParaEnvio(
  editFornecedor.nome_fantasia,
  fornecedorOriginal.nome_fantasia
);
if (nomeFantasia !== undefined) {
  payload.nome_fantasia = nomeFantasia;
}
```

---

### 3. Endereços

✅ **Lógica conforme guia:**
- Compara cada campo individualmente
- Usa `prepararCampoParaEnvio` para cada campo
- Campos opcionais: `""` limpa (NULL no banco)
- Campos obrigatórios: `""` também limpa (mas pode causar erro se NOT NULL)

**Exemplo de payload:**
```json
{
  "enderecos": [
    {
      "id": 59,
      "logradouro": "atualizado",
      "complemento": ""  // ← Limpa o campo (NULL no banco)
    }
  ]
}
```

**Se campo não mudou:**
- Não é incluído no payload
- Backend não altera o campo

---

### 4. Contatos

✅ **Mesma lógica aplicada:**
- Compara cada campo individualmente
- Campos opcionais podem ser limpos com `""`
- Campo `ativo` (boolean) comparado diretamente
- Aceita valores originais em snake_case ou camelCase

**Exemplo de payload:**
```json
{
  "contato": [
    {
      "id": 14,
      "email": "",  // ← Limpa o campo (NULL no banco)
      "nome_contato": ""  // ← Limpa o campo (NULL no banco)
    }
  ]
}
```

---

## 📊 Comportamento Final

### Semântica REST Padrão

| Valor Enviado | Comportamento |
|---------------|---------------|
| `undefined` (não incluído) | ❌ **Não altera** o campo |
| `""` (string vazia) | ✅ **Limpa** o campo (NULL no banco) |
| `"valor"` | ✅ **Atualiza** com o valor |

---

## 🎯 Exemplos de Payloads

### Exemplo 1: Limpar Campo Opcional

**Usuário apagou o complemento:**
```json
{
  "enderecos": [
    {
      "id": 59,
      "complemento": ""  // ← Será limpo (NULL no banco)
    }
  ]
}
```

### Exemplo 2: Não Alterar Campo

**Usuário não mexeu no complemento:**
```json
{
  "enderecos": [
    {
      "id": 59,
      "logradouro": "atualizado"  // ← Apenas logradouro alterado
    }
  ]
}
// complemento não está no payload = não altera
```

### Exemplo 3: Atualizar Campo

**Usuário mudou o complemento:**
```json
{
  "enderecos": [
    {
      "id": 59,
      "complemento": "Sala 202"  // ← Será atualizado
    }
  ]
}
```

---

## ✅ Checklist de Implementação

- [x] Função `normalizarParaComparacao` implementada
- [x] Função `prepararCampoParaEnvio` implementada
- [x] Campos do fornecedor usando `prepararCampoParaEnvio`
- [x] Endereços usando `prepararCampoParaEnvio` para cada campo
- [x] Contatos usando `prepararCampoParaEnvio` para cada campo
- [x] Campos opcionais podem ser limpos com `""`
- [x] Campos não alterados não são enviados (`undefined`)
- [x] Tratamento especial para campo `ativo` (boolean)

---

## ⚠️ Pontos de Atenção

### 1. Campos Obrigatórios Não Podem Ser Limpos

Se um campo é `NOT NULL` no banco, enviar `""` causará erro. O código atual permite isso, mas o backend deve validar.

**Recomendação:** Validar no frontend antes de enviar campos obrigatórios vazios.

### 2. Comparação de Valores

A função `normalizarParaComparacao` trata:
- `null`, `undefined`, `''` → todos como `null` (equivalentes)
- Strings são normalizadas com `trim()`
- Boolean são preservados

### 3. Formato de Envio

- Campos opcionais: `""` limpa (NULL no banco)
- Campos obrigatórios: `""` também limpa (pode causar erro)
- Campos não alterados: `undefined` (não incluídos)

---

## 🧪 Testes Recomendados

1. **Limpar campo opcional:**
   - Apagar `complemento` → deve enviar `complemento: ""`
   - Verificar no banco se ficou NULL

2. **Não alterar campo:**
   - Não mexer em `complemento` → não deve estar no payload
   - Verificar no banco se não mudou

3. **Atualizar campo:**
   - Mudar `logradouro` → deve enviar `logradouro: "novo valor"`
   - Verificar no banco se foi atualizado

---

**Última atualização:** Código adaptado conforme `GUIA_ADAPTACAO_FRONTEND_CAMPOS_VAZIOS.md`





























