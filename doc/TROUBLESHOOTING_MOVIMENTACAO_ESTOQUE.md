# 🔧 Troubleshooting - Erro 400 ao Movimentar Estoque

Este documento explica as causas comuns do erro **400 Bad Request** ao tentar movimentar estoque e como corrigi-las.

## 📋 Índice

1. [Erro 400 - Visão Geral](#erro-400---visão-geral)
2. [Causas Comuns](#causas-comuns)
3. [Validações do DTO](#validações-do-dto)
4. [Exemplos de Requisições](#exemplos-de-requisições)
5. [Mensagens de Erro](#mensagens-de-erro)
6. [Solução Passo a Passo](#solução-passo-a-passo)

---

## ⚠️ Erro 400 - Visão Geral

O erro **400 Bad Request** ocorre quando a requisição está malformada ou não atende às validações do backend.

**Endpoint**: `POST /api/v1/estoque/produtos/:id/movimentar`

---

## 🔍 Causas Comuns

### 1. Campos Obrigatórios Ausentes

Os seguintes campos são **obrigatórios**:
- `tipo` (string/enum)
- `quantidade` (number)

### 2. Valores Inválidos

- **tipo**: Deve ser um dos valores do enum (veja abaixo)
- **quantidade**: Deve ser um número inteiro maior ou igual a 1

### 3. Token JWT Inválido ou Incompleto

O token JWT deve conter:
- `id` (ID do usuário)
- `schema_name` (nome do schema do tenant)

### 4. Produto Não Encontrado

O ID do produto na URL deve existir no banco de dados.

---

## ✅ Validações do DTO

### Campo `tipo` (Obrigatório)

**Tipo**: Enum  
**Valores aceitos**:
- `ENTRADA`
- `SAIDA`
- `AJUSTE`
- `DEVOLUCAO`
- `PERDA`
- `TRANSFERENCIA`

**Erro se**:
- Não for enviado
- Não for um dos valores acima
- For enviado em formato diferente (ex: "entrada" minúsculo)

### Campo `quantidade` (Obrigatório)

**Tipo**: Number (inteiro)  
**Valor mínimo**: 1

**Erro se**:
- Não for enviado
- Não for um número
- For um número decimal (ex: 10.5)
- For menor que 1
- For zero ou negativo

### Campo `observacao` (Opcional)

**Tipo**: String  
**Erro se**: Não for uma string quando enviado

### Campo `motivo` (Opcional)

**Tipo**: String  
**Erro se**: Não for uma string quando enviado

### Campo `documento_referencia` (Opcional)

**Tipo**: String  
**Erro se**: Não for uma string quando enviado

---

## 📤 Exemplos de Requisições

### ✅ Requisição Válida - Entrada

```json
POST /api/v1/estoque/produtos/9/movimentar
Content-Type: application/json
Authorization: Bearer {token}

{
  "tipo": "ENTRADA",
  "quantidade": 50,
  "observacao": "Entrada de mercadoria recebida",
  "motivo": "Compra de fornecedor",
  "documento_referencia": "NF-12345"
}
```

### ✅ Requisição Válida - Saída (Mínima)

```json
POST /api/v1/estoque/produtos/9/movimentar
Content-Type: application/json
Authorization: Bearer {token}

{
  "tipo": "SAIDA",
  "quantidade": 10
}
```

### ❌ Requisição Inválida - Tipo Ausente

```json
{
  "quantidade": 10
}
```

**Erro esperado**: `O tipo de movimentação é obrigatório`

### ❌ Requisição Inválida - Tipo Inválido

```json
{
  "tipo": "entrada",  // ❌ Deve ser "ENTRADA" (maiúsculo)
  "quantidade": 10
}
```

**Erro esperado**: `Tipo de movimentação inválido. Valores aceitos: ENTRADA, SAIDA, AJUSTE, DEVOLUCAO, PERDA, TRANSFERENCIA`

### ❌ Requisição Inválida - Quantidade Ausente

```json
{
  "tipo": "ENTRADA"
}
```

**Erro esperado**: `A quantidade é obrigatória`

### ❌ Requisição Inválida - Quantidade Inválida

```json
{
  "tipo": "ENTRADA",
  "quantidade": 0  // ❌ Deve ser >= 1
}
```

**Erro esperado**: `A quantidade deve ser maior ou igual a 1`

### ❌ Requisição Inválida - Quantidade Decimal

```json
{
  "tipo": "ENTRADA",
  "quantidade": 10.5  // ❌ Deve ser inteiro
}
```

**Erro esperado**: `A quantidade deve ser um número inteiro`

---

## 📝 Mensagens de Erro

### Erros de Validação do DTO

| Erro | Causa | Solução |
|------|-------|---------|
| `O tipo de movimentação é obrigatório` | Campo `tipo` não enviado | Adicionar campo `tipo` com valor válido |
| `Tipo de movimentação inválido` | Valor do `tipo` não está no enum | Usar um dos valores: ENTRADA, SAIDA, AJUSTE, DEVOLUCAO, PERDA, TRANSFERENCIA |
| `A quantidade é obrigatória` | Campo `quantidade` não enviado | Adicionar campo `quantidade` |
| `A quantidade deve ser um número` | `quantidade` não é um número | Enviar número válido |
| `A quantidade deve ser um número inteiro` | `quantidade` é decimal | Enviar número inteiro |
| `A quantidade deve ser maior ou igual a 1` | `quantidade` é 0 ou negativo | Enviar número >= 1 |

### Erros do Controller

| Erro | Causa | Solução |
|------|-------|---------|
| `Schema name é obrigatório` | Token JWT não contém `schema_name` | Verificar token JWT e fazer login novamente |
| `ID do usuário é obrigatório` | Token JWT não contém `id` | Verificar token JWT e fazer login novamente |

### Erros do Service

| Erro | Causa | Solução |
|------|-------|---------|
| `Produto não encontrado` | ID do produto não existe | Verificar se o produto existe |
| `Estoque insuficiente` | Tentativa de saída/perda com estoque menor que quantidade | Verificar estoque atual do produto |
| `Tipo de movimentação inválido` | Tipo não reconhecido no switch | Usar tipo válido do enum |

---

## 🔧 Solução Passo a Passo

### Passo 1: Verificar Estrutura da Requisição

Certifique-se de que a requisição está no formato correto:

```typescript
// Exemplo em JavaScript/TypeScript
const response = await fetch('/api/v1/estoque/produtos/9/movimentar', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    tipo: 'ENTRADA',        // ✅ Maiúsculo, valor do enum
    quantidade: 10,         // ✅ Número inteiro >= 1
    observacao: '...',      // ✅ Opcional, string se enviado
    motivo: '...',          // ✅ Opcional, string se enviado
    documento_referencia: '...' // ✅ Opcional, string se enviado
  }),
});
```

### Passo 2: Verificar Token JWT

O token deve conter as seguintes informações:

```json
{
  "id": "uuid-do-usuario",
  "schema_name": "nome-do-tenant",
  // ... outros campos
}
```

**Como verificar**:
1. Decodifique o token JWT (use jwt.io)
2. Verifique se contém `id` e `schema_name`
3. Se não contiver, faça login novamente

### Passo 3: Validar Dados Antes de Enviar

```typescript
function validarMovimentacao(dados: any): { valido: boolean; erros: string[] } {
  const erros: string[] = [];

  // Validar tipo
  const tiposValidos = ['ENTRADA', 'SAIDA', 'AJUSTE', 'DEVOLUCAO', 'PERDA', 'TRANSFERENCIA'];
  if (!dados.tipo || !tiposValidos.includes(dados.tipo)) {
    erros.push('Tipo de movimentação inválido ou ausente');
  }

  // Validar quantidade
  if (!dados.quantidade || typeof dados.quantidade !== 'number') {
    erros.push('Quantidade deve ser um número');
  } else if (!Number.isInteger(dados.quantidade)) {
    erros.push('Quantidade deve ser um número inteiro');
  } else if (dados.quantidade < 1) {
    erros.push('Quantidade deve ser maior ou igual a 1');
  }

  return {
    valido: erros.length === 0,
    erros,
  };
}

// Uso
const validacao = validarMovimentacao({
  tipo: 'ENTRADA',
  quantidade: 10,
});

if (!validacao.valido) {
  console.error('Erros:', validacao.erros);
  return;
}
```

### Passo 4: Tratamento de Erros

```typescript
try {
  const response = await fetch('/api/v1/estoque/produtos/9/movimentar', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      tipo: 'ENTRADA',
      quantidade: 10,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    
    // Erro 400 - Bad Request
    if (response.status === 400) {
      console.error('Erro de validação:', errorData.message);
      
      // Se houver array de erros de validação
      if (errorData.message && Array.isArray(errorData.message)) {
        errorData.message.forEach((erro: string) => {
          console.error('-', erro);
        });
      }
    }
    
    // Erro 401 - Não autenticado
    if (response.status === 401) {
      console.error('Token inválido ou expirado. Faça login novamente.');
      // Redirecionar para login
    }
    
    // Erro 404 - Produto não encontrado
    if (response.status === 404) {
      console.error('Produto não encontrado');
    }
    
    throw new Error(errorData.message || 'Erro ao movimentar estoque');
  }

  const data = await response.json();
  console.log('Movimentação realizada com sucesso:', data);
  
} catch (error) {
  console.error('Erro:', error);
}
```

---

## 🧪 Testando com cURL

### Teste 1: Requisição Válida

```bash
curl -X POST https://sistemaerp-3.onrender.com/api/v1/estoque/produtos/9/movimentar \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "tipo": "ENTRADA",
    "quantidade": 10,
    "observacao": "Teste de movimentação"
  }'
```

### Teste 2: Requisição Inválida (Tipo Ausente)

```bash
curl -X POST https://sistemaerp-3.onrender.com/api/v1/estoque/produtos/9/movimentar \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "quantidade": 10
  }'
```

**Resposta esperada**:
```json
{
  "statusCode": 400,
  "message": ["O tipo de movimentação é obrigatório"],
  "error": "Bad Request"
}
```

---

## 📚 Tipos de Movimentação Explicados

| Tipo | Descrição | Efeito no Estoque |
|------|-----------|-------------------|
| `ENTRADA` | Entrada de mercadoria | Aumenta o estoque |
| `SAIDA` | Saída de mercadoria | Diminui o estoque (valida estoque suficiente) |
| `AJUSTE` | Ajuste manual | Define o estoque para o valor especificado |
| `DEVOLUCAO` | Devolução de mercadoria | Aumenta o estoque |
| `PERDA` | Perda/dano de mercadoria | Diminui o estoque (valida estoque suficiente) |
| `TRANSFERENCIA` | Transferência entre locais | Diminui o estoque (valida estoque suficiente) |

---

## 🔗 Recursos Adicionais

- **Swagger UI**: `/api/docs` - Documentação interativa da API
- **Base URL**: `https://sistemaerp-3.onrender.com/api/v1`
- **Guia de Paginação**: Ver `GUIA_PAGINACAO_FRONTEND.md`

---

## ✅ Checklist de Validação

Antes de enviar a requisição, verifique:

- [ ] Token JWT está presente e válido
- [ ] Token contém `id` e `schema_name`
- [ ] Campo `tipo` está presente e é um valor válido do enum (maiúsculo)
- [ ] Campo `quantidade` está presente e é um número inteiro >= 1
- [ ] Campos opcionais (`observacao`, `motivo`, `documento_referencia`) são strings se enviados
- [ ] Content-Type está definido como `application/json`
- [ ] ID do produto na URL existe no banco de dados
- [ ] Para SAIDA/PERDA/TRANSFERENCIA, o estoque atual é suficiente

---

**Última atualização**: Janeiro 2024  
**Versão do Backend**: 1.0.0

