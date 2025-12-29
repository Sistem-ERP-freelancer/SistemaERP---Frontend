# 🔄 Guia de Adaptação Frontend - Tratamento de Campos Vazios

## 📋 Resumo das Mudanças no Backend

O backend agora segue a **semântica REST padrão** para campos vazios:

| Valor Enviado | Comportamento no Backend |
|---------------|-------------------------|
| `undefined` | ❌ **Não altera** o campo (mantém valor atual) |
| `""` (string vazia) | ✅ **Limpa** o campo (salva `NULL` no banco) |
| `"valor"` | ✅ **Atualiza** com o valor |

---

## ⚠️ O QUE MUDOU

### Antes (Comportamento Antigo)
- Campos vazios (`""`) eram **ignorados** pelo backend
- Se você enviava `complemento: ""`, o campo não era alterado

### Agora (Comportamento Novo)
- Campos vazios (`""`) são **limpos** no banco (salvam `NULL`)
- Se você envia `complemento: ""`, o campo será limpo

---

## ✅ O QUE O FRONTEND PRECISA FAZER

### Opção 1: Enviar Apenas Campos Alterados (RECOMENDADO)

**Vantagem:** Mais eficiente e seguro. Campos não enviados não são alterados.

```typescript
prepararPayload(): UpdateFornecedorDto {
  const valores = this.formulario.value;
  const payload: UpdateFornecedorDto = {};

  // Campos do fornecedor (apenas se alterados)
  if (valores.nome_fantasia !== this.fornecedorOriginal.nome_fantasia) {
    payload.nome_fantasia = valores.nome_fantasia;
  }

  // Endereços - apenas os que foram modificados
  if (valores.enderecos && valores.enderecos.length > 0) {
    payload.enderecos = valores.enderecos
      .map((endereco: any) => {
        const enderecoId = endereco.id 
          ? (typeof endereco.id === 'string' ? parseInt(endereco.id, 10) : endereco.id)
          : undefined;

        if (enderecoId && !isNaN(enderecoId) && enderecoId > 0) {
          // ✅ ATUALIZAÇÃO: Comparar com original e enviar apenas campos alterados
          const original = this.fornecedorOriginal.enderecos.find(
            (e: any) => e.id === enderecoId
          );

          if (!original) return null;

          const enderecoPayload: any = { id: enderecoId };

          // Comparar cada campo e incluir apenas se mudou
          if (endereco.cep !== original.cep) {
            enderecoPayload.cep = endereco.cep || ''; // "" limpa, undefined não altera
          }
          if (endereco.logradouro !== original.logradouro) {
            enderecoPayload.logradouro = endereco.logradouro || '';
          }
          if (endereco.numero !== original.numero) {
            enderecoPayload.numero = endereco.numero || '';
          }
          
          // Campos opcionais: comparar considerando null/undefined
          const complementoOriginal = original.complemento || null;
          const complementoNovo = endereco.complemento || null;
          if (complementoNovo !== complementoOriginal) {
            enderecoPayload.complemento = endereco.complemento || ''; // "" limpa
          }

          const referenciaOriginal = original.referencia || null;
          const referenciaNova = endereco.referencia || null;
          if (referenciaNova !== referenciaOriginal) {
            enderecoPayload.referencia = endereco.referencia || ''; // "" limpa
          }

          // Retornar apenas se houver campos para atualizar
          return Object.keys(enderecoPayload).length > 1 ? enderecoPayload : null;
        } else {
          // ✅ CRIAÇÃO: Incluir todos os campos obrigatórios
          return {
            cep: endereco.cep,
            logradouro: endereco.logradouro,
            numero: endereco.numero,
            complemento: endereco.complemento || null,
            bairro: endereco.bairro,
            cidade: endereco.cidade,
            estado: endereco.estado,
            referencia: endereco.referencia || null
          };
        }
      })
      .filter((e: any) => e !== null);
  }

  return payload;
}
```

**Vantagens desta abordagem:**
- ✅ Campos não alterados não são enviados (mais seguro)
- ✅ Campos vazios são enviados como `""` (serão limpos)
- ✅ Mais eficiente (menos dados no payload)

---

### Opção 2: Enviar Todos os Campos (Atual - Precisa Ajuste)

Se você prefere manter o comportamento atual de enviar todos os campos, precisa garantir que campos vazios sejam enviados como `""`:

```typescript
// ❌ PROBLEMA: Isso envia '' mesmo quando não mudou
cep: endereco.cep || '',

// ✅ SOLUÇÃO: Comparar antes de enviar
if (endereco.cep !== original.cep) {
  enderecoPayload.cep = endereco.cep || ''; // "" limpa
}
// Se não mudou, não inclui no payload (undefined = não altera)
```

---

## 🎯 REGRAS IMPORTANTES

### 1. Campos Obrigatórios

Para campos obrigatórios (`cep`, `logradouro`, `numero`, etc.):

```typescript
// ✅ CORRETO: Se mudou, enviar (mesmo que vazio)
if (endereco.logradouro !== original.logradouro) {
  enderecoPayload.logradouro = endereco.logradouro || '';
  // "" será limpo no banco (pode causar erro se campo for NOT NULL)
}

// ⚠️ ATENÇÃO: Campos obrigatórios não podem ser NULL no banco
// Se o campo for NOT NULL, enviar "" causará erro
// Nesse caso, não permita limpar campos obrigatórios no frontend
```

### 2. Campos Opcionais

Para campos opcionais (`complemento`, `referencia`, `email`, etc.):

```typescript
// ✅ CORRETO: "" limpa o campo (NULL no banco)
if (endereco.complemento !== original.complemento) {
  enderecoPayload.complemento = endereco.complemento || '';
  // "" → NULL no banco
  // undefined → não altera
  // "valor" → atualiza
}
```

### 3. Comparação com Null/Undefined

```typescript
// ✅ CORRETO: Normalizar antes de comparar
const valorOriginal = original.complemento || null;
const valorNovo = endereco.complemento || null;

if (valorNovo !== valorOriginal) {
  // Mudou, incluir no payload
  enderecoPayload.complemento = endereco.complemento || '';
}
```

---

## 📝 EXEMPLO COMPLETO - Função Helper Recomendada

```typescript
/**
 * Compara dois valores considerando null/undefined como equivalentes
 */
private normalizarParaComparacao(valor: any): any {
  if (valor === null || valor === undefined || valor === '') {
    return null;
  }
  return valor;
}

/**
 * Prepara campo para envio ao backend
 * - undefined = não altera (não inclui no payload)
 * - "" = limpa (inclui no payload como "")
 * - valor = atualiza (inclui no payload)
 */
private prepararCampoParaEnvio(valorNovo: any, valorOriginal: any): any {
  const novoNormalizado = this.normalizarParaComparacao(valorNovo);
  const originalNormalizado = this.normalizarParaComparacao(valorOriginal);

  // Se não mudou, não enviar (undefined = não altera)
  if (novoNormalizado === originalNormalizado) {
    return undefined;
  }

  // Se mudou, enviar ("" limpa, valor atualiza)
  return valorNovo || '';
}

// Uso:
const complemento = this.prepararCampoParaEnvio(
  endereco.complemento,
  original.complemento
);

if (complemento !== undefined) {
  enderecoPayload.complemento = complemento;
}
```

---

## 🧪 CENÁRIOS DE TESTE

### Cenário 1: Limpar Campo Opcional

**Formulário:**
- `complemento`: estava "Sala 101", usuário apagou (ficou vazio)

**Payload esperado:**
```json
{
  "enderecos": [
    {
      "id": 5,
      "complemento": ""
    }
  ]
}
```

**Resultado:** Campo será limpo (NULL no banco)

---

### Cenário 2: Não Alterar Campo

**Formulário:**
- `complemento`: estava "Sala 101", usuário não mexeu

**Payload esperado:**
```json
{
  "enderecos": [
    {
      "id": 5,
      "logradouro": "Rua Nova"  // apenas campos alterados
    }
  ]
}
```

**Resultado:** Campo `complemento` não é alterado (não foi enviado)

---

### Cenário 3: Atualizar Campo

**Formulário:**
- `complemento`: estava "Sala 101", usuário mudou para "Sala 202"

**Payload esperado:**
```json
{
  "enderecos": [
    {
      "id": 5,
      "complemento": "Sala 202"
    }
  ]
}
```

**Resultado:** Campo é atualizado

---

## ⚠️ PONTOS DE ATENÇÃO

### 1. Campos Obrigatórios Não Podem Ser Limpos

Se um campo é `NOT NULL` no banco, enviar `""` causará erro:

```typescript
// ⚠️ PERIGO: Se logradouro for NOT NULL, isso causará erro
if (endereco.logradouro !== original.logradouro) {
  enderecoPayload.logradouro = endereco.logradouro || ''; // "" causará erro
}

// ✅ SEGURO: Validar no frontend antes de enviar
if (endereco.logradouro !== original.logradouro) {
  if (!endereco.logradouro || endereco.logradouro.trim() === '') {
    // Campo obrigatório não pode ser vazio
    throw new Error('Logradouro é obrigatório');
  }
  enderecoPayload.logradouro = endereco.logradouro;
}
```

### 2. Comparação de Arrays/Objetos

```typescript
// ❌ ERRADO: Comparação direta pode não funcionar
if (endereco.complemento !== original.complemento) { ... }

// ✅ CORRETO: Normalizar antes de comparar
const complementoOriginal = original.complemento || null;
const complementoNovo = endereco.complemento || null;
if (complementoNovo !== complementoOriginal) { ... }
```

### 3. Contatos - Mesma Lógica

Aplique a mesma lógica para contatos:

```typescript
// Campos opcionais podem ser limpos
if (contato.email !== original.email) {
  contatoPayload.email = contato.email || ''; // "" limpa
}

// Campos obrigatórios (telefone) não podem ser limpos
if (contato.telefone !== original.telefone) {
  if (!contato.telefone || contato.telefone.trim() === '') {
    throw new Error('Telefone é obrigatório');
  }
  contatoPayload.telefone = contato.telefone;
}
```

---

## ✅ CHECKLIST DE ADAPTAÇÃO

- [ ] Atualizar função `prepararPayload()` para comparar campos antes de enviar
- [ ] Garantir que campos vazios sejam enviados como `""` (não `null` ou `undefined`)
- [ ] Validar que campos obrigatórios não sejam enviados vazios
- [ ] Testar limpeza de campos opcionais (complemento, referencia, email, etc.)
- [ ] Testar que campos não alterados não são enviados
- [ ] Aplicar mesma lógica para endereços e contatos

---

## 🎯 RESUMO FINAL

**Mudança Principal:**
- Campos vazios (`""`) agora **limpam** o campo no banco (antes eram ignorados)

**O que fazer:**
1. Comparar campos antes de enviar
2. Enviar apenas campos alterados (recomendado)
3. Campos vazios devem ser enviados como `""` (não `null` ou omitidos)
4. Validar campos obrigatórios no frontend antes de enviar

**Compatibilidade:**
- ✅ Código atual continuará funcionando
- ⚠️ Mas campos vazios serão limpos (pode ser comportamento desejado)
- ✅ Recomendado: atualizar para enviar apenas campos alterados

---

**Última atualização:** Baseado nas mudanças do backend (resolveValorCampo)

