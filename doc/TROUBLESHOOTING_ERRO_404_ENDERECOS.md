# 🔍 Troubleshooting - Erro 404 ao Adicionar Endereço

## 🚨 Problema

Ao adicionar um novo endereço e clicar em "Salvar Alterações", aparece o erro:
```
Registro não encontrado
```

## 🔍 Possíveis Causas

### 1. **Fornecedor não existe**

**Sintoma**: Erro 404 ao tentar atualizar qualquer campo do fornecedor.

**Como verificar**:
- Abra o console do navegador (F12)
- Procure por logs que mostram o `fornecedorId` sendo enviado
- Verifique se o ID do fornecedor é válido

**Solução**: 
- Verificar se o fornecedor existe no banco de dados
- Recarregar a página e tentar novamente

### 2. **Backend tentando atualizar endereço que não existe**

**Sintoma**: Erro 404 apenas ao adicionar novos endereços.

**Causa possível**: O backend pode estar tentando atualizar um endereço com ID inválido ou inexistente.

**Como verificar**:
1. Abra o console do navegador (F12)
2. Procure pelo log: `[Atualizar Parcial Fornecedor] Enviando payload:`
3. Verifique o array `enderecos` no payload
4. Confirme se há endereços com `id` que não existem no banco

**Solução no Backend**:
- Verificar se o backend está validando corretamente IDs de endereços
- Garantir que endereços sem `id` sejam criados, não atualizados

### 3. **Endereço com ID inválido sendo enviado**

**Sintoma**: Erro 404 ao salvar, mesmo com endereços novos.

**Causa possível**: O frontend pode estar enviando um endereço com `id: undefined` ou `id: null` que o backend está tentando processar como existente.

**Como verificar**:
1. Abra o console do navegador (F12)
2. Procure pelo log: `[prepararEndereco] Endereço processado:`
3. Verifique se endereços novos têm `id: undefined` (correto) ou algum valor inválido

**Solução**:
- Garantir que endereços novos não tenham campo `id` no payload
- Verificar função `prepararEndereco()` no frontend

### 4. **Backend retornando 404 incorretamente**

**Sintoma**: Erro 404 mesmo quando o fornecedor existe.

**Causa possível**: O backend pode estar retornando 404 quando deveria criar um novo endereço.

**Como verificar**:
- Verificar logs do backend
- Verificar se o endpoint `PATCH /fornecedor/:id` está processando corretamente endereços sem `id`

**Solução no Backend**:
- Garantir que endereços sem `id` sejam criados, não atualizados
- Verificar lógica de processamento conforme guia

## 🛠️ Passos para Diagnosticar

### Passo 1: Verificar Console do Navegador

1. Abra o console (F12 → Console)
2. Adicione um novo endereço
3. Clique em "Salvar Alterações"
4. Procure pelos seguintes logs:

```
[Salvar Fornecedor] Dados do formulário:
[prepararAtualizacaoFornecedor] Endereços processados:
[prepararEndereco] Endereço processado:
[prepararPayloadAtualizacaoFornecedor] Endereços no payload:
[Atualizar Parcial Fornecedor] Enviando payload:
[Salvar Fornecedor] Erro completo:
```

### Passo 2: Verificar Payload Enviado

No console, procure pelo log `[Atualizar Parcial Fornecedor] Enviando payload:` e verifique:

```json
{
  "enderecos": [
    {
      "id": 1,           // ← Endereço existente (deve ter ID válido)
      "cep": "...",
      ...
    },
    {
      // ← Endereço novo (NÃO deve ter campo "id")
      "cep": "54730-640",
      "logradouro": "teste",
      ...
    }
  ]
}
```

**Verificações importantes**:
- ✅ Endereços novos **NÃO** devem ter campo `id`
- ✅ Endereços existentes **DEVEM** ter `id` válido
- ✅ O `fornecedorId` no URL está correto

### Passo 3: Verificar Resposta do Backend

No console, procure pelo log `[Salvar Fornecedor] Erro completo:` e verifique:

```javascript
{
  status: 404,
  statusText: "Not Found",
  data: {
    message: "..." // Mensagem específica do backend
  }
}
```

A mensagem específica do backend ajudará a identificar o problema exato.

## 🔧 Soluções por Causa

### Se o problema for no Frontend

**Problema**: Endereço novo está sendo enviado com `id` inválido.

**Solução**: Verificar função `prepararEndereco()`:

```typescript
function prepararEndereco(endereco: EnderecoFormState): UpdateEndereco {
  const payload: UpdateEndereco = {};
  
  // ✅ CORRETO: Incluir ID apenas se não for novo
  if (endereco.id && !endereco.isNew) {
    payload.id = endereco.id;
  }
  // Se não tem ID ou é novo, não incluir campo "id"
  
  // ... resto do código
}
```

### Se o problema for no Backend

**Problema**: Backend está tentando atualizar endereço que não existe.

**Solução**: Verificar lógica de processamento:

```typescript
// ✅ CORRETO
if (endereco.id !== undefined) {
  // ATUALIZAR endereço existente
  // Validar que existe e pertence ao fornecedor
} else {
  // CRIAR novo endereço
  // Não tentar atualizar
}
```

## 📋 Checklist de Verificação

- [ ] Console do navegador está aberto (F12)
- [ ] Logs de debug estão aparecendo
- [ ] Payload está sendo enviado corretamente
- [ ] Endereços novos não têm campo `id`
- [ ] Endereços existentes têm `id` válido
- [ ] `fornecedorId` no URL está correto
- [ ] Mensagem de erro específica do backend foi verificada
- [ ] Backend está processando corretamente endereços sem `id`

## 🆘 Se o Problema Persistir

1. **Copie todos os logs do console** (especialmente o payload JSON)
2. **Verifique os logs do backend** (se tiver acesso)
3. **Verifique a mensagem específica** do erro 404 no console
4. **Compare o payload enviado** com o formato esperado no guia

## 📝 Informações para Reportar Bug

Se precisar reportar o problema, inclua:

1. **Payload enviado** (do log `[Atualizar Parcial Fornecedor]`)
2. **Resposta do backend** (do log `[Salvar Fornecedor] Erro completo`)
3. **Mensagem específica** do erro 404
4. **ID do fornecedor** sendo editado
5. **Quantidade de endereços** existentes e novos

---

**Última atualização**: 2024








