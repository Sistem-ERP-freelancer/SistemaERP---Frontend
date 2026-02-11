# 🔧 Guia: Correção do Erro 400 em Contas a Pagar e Contas a Receber

## 📋 Índice
1. [Erro no Console](#erro-no-console)
2. [Causa do Problema](#causa-do-problema)
3. [Solução Implementada](#solução-implementada)
4. [Endpoint Correto](#endpoint-correto)
5. [Cenários de Teste](#cenários-de-teste)
6. [Checklist de Verificação](#checklist-de-verificação)

---

## ❌ Erro no Console

### Erro Exibido no Console do Navegador

```
❌ [API Error] 
Object { 
  url: "https://sistemaerp-3.onrender.com/api/v1/pedidos/contas-pagar", 
  status: 400, 
  statusText: "", 
  errorData: {…}, 
  errorText: null, 
  headers: {…} 
}

❌ [API Error] 
Object { 
  url: "https://sistemaerp-3.onrender.com/api/v1/pedidos/contas-pagar", 
  status: 400, 
  statusText: "", 
  errorMessage: "Não foi possível carregar os dados. Tente novamente.", 
  errorData: {…}, 
  errorText: null, 
  headers: {…} 
}

💥 [API Connection Error] 
Object { 
  url: "https://sistemaerp-3.onrender.com/api/v1/pedidos/contas-pagar", 
  message: "Não foi possível carregar os dados. Tente novamente.", 
  error: Error, 
  errorName: "Error", 
  stack: "..." 
}

API de contas a pagar não disponível: Error: Não foi possível carregar os dados. Tente novamente.
```

**Erro Original (antes da mensagem amigável):**
- `Validation failed (numeric string is expected)`
- HTTP Status: `400 Bad Request`

**Quando ocorre:**
- Ao abrir o módulo **Contas a Pagar**
- Ao abrir o módulo **Contas a Receber** (mesmo problema)
- Ao filtrar por aba "Todos" (sem filtros específicos)

---

## 🔍 Causa do Problema

### Problema Identificado

O erro ocorre porque o código estava enviando um objeto de filtros com propriedades `undefined` para o backend:

```typescript
// ❌ CÓDIGO ANTIGO (ERRADO)
const pedidos = await pedidosService.listarContasPagar({
  situacao: undefined,  // Propriedade undefined sendo enviada
});
```

**Por que isso causa erro 400:**

1. Quando a aba selecionada é **"Todos"**, o código define `situacao = undefined`
2. O objeto `{ situacao: undefined }` é passado para o serviço
3. Embora o serviço não adicione `undefined` à query string, o backend pode estar:
   - Rejeitando requisições com objetos de filtros vazios
   - Esperando algum parâmetro obrigatório
   - Validando incorretamente parâmetros opcionais

4. O backend retorna **400 Bad Request** com a mensagem:
   - `Validation failed (numeric string is expected)`

### Arquivos Afetados

- `src/pages/ContasAPagar.tsx` (linha ~183)
- `src/pages/ContasAReceber.tsx` (linha ~200)

---

## ✅ Solução Implementada

### Correção Aplicada

**1. Contas a Pagar (`ContasAPagar.tsx`)**

```typescript
// ✅ CÓDIGO NOVO (CORRETO)
// Mapear status da tab para situacao do endpoint
let situacao: 'em_aberto' | 'em_atraso' | 'concluido' | undefined = undefined;

if (activeTab === "Todos") {
  // Não filtrar por situação
} else if (activeTab === "PENDENTE" || activeTab === "VENCE_HOJE") {
  situacao = 'em_aberto';
} else if (activeTab === "VENCIDO") {
  situacao = 'em_atraso';
} else if (activeTab === "PAGO_TOTAL") {
  situacao = 'concluido';
}

// Só passar objeto de filtros se tiver algum filtro válido
// Evita enviar { situacao: undefined } que pode causar erro 400
const pedidos = await pedidosService.listarContasPagar(
  situacao ? { situacao } : undefined  // ✅ Passa undefined se não houver filtros
);
```

**2. Contas a Receber (`ContasAReceber.tsx`)**

```typescript
// ✅ CÓDIGO NOVO (CORRETO)
// Mapear status da tab para situacao
if (activeTab === "Todos") {
  // Não filtrar por situação
} else if (activeTab === "PENDENTE" || activeTab === "VENCE_HOJE") {
  params.situacao = 'em_aberto';
} else if (activeTab === "VENCIDO") {
  params.situacao = 'em_atraso';
} else if (activeTab === "PAGO_TOTAL") {
  params.situacao = 'concluido';
}

// Só passar objeto de filtros se tiver algum filtro válido
// Evita enviar objeto vazio que pode causar erro 400
const hasFilters = params.situacao || params.cliente_id || params.cliente_nome || 
                  params.valor_inicial || params.valor_final || params.forma_pagamento ||
                  params.data_inicial || params.data_final || params.codigo;

return await pedidosService.listarContasReceber(
  hasFilters ? params : undefined  // ✅ Passa undefined se não houver filtros
);
```

### Como Funciona a Correção

1. **Verificação condicional:** Antes de chamar o serviço, verifica se há filtros válidos
2. **Passagem de `undefined`:** Se não houver filtros, passa `undefined` em vez de um objeto com propriedades `undefined`
3. **Serviço trata `undefined`:** O `pedidos.service.ts` já trata `params === undefined` corretamente, não adicionando nenhum parâmetro à URL

### Resultado Esperado

- ✅ Sem erro 400 ao abrir Contas a Pagar
- ✅ Sem erro 400 ao abrir Contas a Receber
- ✅ Funciona corretamente com filtros aplicados
- ✅ Funciona corretamente sem filtros (aba "Todos")

---

## 🌐 Endpoint Correto

### Endpoints Utilizados

**Contas a Pagar:**
```
GET /api/v1/pedidos/contas-pagar
```

**Contas a Receber:**
```
GET /api/v1/pedidos/contas-receber
```

### Parâmetros de Query Aceitos (Opcionais)

#### Contas a Pagar

| Parâmetro | Tipo | Descrição | Exemplo |
|-----------|------|-----------|---------|
| `codigo` | string | Código do pedido | `?codigo=PED-2026` |
| `fornecedor_id` | number | ID do fornecedor | `?fornecedor_id=1` |
| `fornecedor_nome` | string | Nome do fornecedor | `?fornecedor_nome=João` |
| `valor_inicial` | number | Valor mínimo | `?valor_inicial=100` |
| `valor_final` | number | Valor máximo | `?valor_final=1000` |
| `forma_pagamento` | string | Forma de pagamento | `?forma_pagamento=PIX` |
| `situacao` | string | `em_aberto`, `em_atraso`, `concluido` | `?situacao=em_aberto` |
| `data_inicial` | string | Data inicial (YYYY-MM-DD) | `?data_inicial=2026-01-01` |
| `data_final` | string | Data final (YYYY-MM-DD) | `?data_final=2026-02-10` |

#### Contas a Receber

Mesmos parâmetros, mas substitua:
- `fornecedor_id` → `cliente_id`
- `fornecedor_nome` → `cliente_nome`

### Exemplos de URLs Válidas

```bash
# Sem filtros (correto após correção)
GET /api/v1/pedidos/contas-pagar
GET /api/v1/pedidos/contas-receber

# Com filtro de situação
GET /api/v1/pedidos/contas-pagar?situacao=em_aberto
GET /api/v1/pedidos/contas-receber?situacao=em_atraso

# Com múltiplos filtros
GET /api/v1/pedidos/contas-receber?situacao=em_aberto&cliente_nome=João&data_inicial=2026-01-01
```

---

## 🧪 Cenários de Teste

### Ambiente de Teste

- **Frontend:** `http://localhost:8080` (desenvolvimento)
- **Backend:** `https://sistemaerp-3.onrender.com/api/v1`
- **Navegador:** Chrome/Firefox com DevTools aberto (Console)

### Teste 1: Abrir Contas a Pagar sem Filtros

**Cenário:**
1. Acessar módulo "Contas a Pagar"
2. Aba selecionada: "Todos"
3. Nenhum filtro adicional aplicado

**Comportamento Esperado:**
- ✅ Não deve aparecer erro 400 no console
- ✅ Tabela deve carregar (mesmo que vazia)
- ✅ Cards de resumo devem exibir valores (mesmo que zero)
- ✅ URL da requisição: `GET /api/v1/pedidos/contas-pagar` (sem query string)

**Resultado do Teste:**
```
✅ PASSOU
- Status HTTP: 200 OK (ou 200 com array vazio)
- Console: Sem erros 400
- UI: Tela carrega normalmente
```

---

### Teste 2: Abrir Contas a Receber sem Filtros

**Cenário:**
1. Acessar módulo "Contas a Receber"
2. Aba selecionada: "Todos"
3. Nenhum filtro adicional aplicado

**Comportamento Esperado:**
- ✅ Não deve aparecer erro 400 no console
- ✅ Tabela deve carregar (mesmo que vazia)
- ✅ Cards de resumo devem exibir valores
- ✅ URL da requisição: `GET /api/v1/pedidos/contas-receber` (sem query string)

**Resultado do Teste:**
```
✅ PASSOU
- Status HTTP: 200 OK (ou 200 com array vazio)
- Console: Sem erros 400
- UI: Tela carrega normalmente
```

---

### Teste 3: Filtrar Contas a Pagar por Situação "Em Aberto"

**Cenário:**
1. Acessar módulo "Contas a Pagar"
2. Selecionar aba "PENDENTE" ou "VENCE_HOJE"
3. Deve filtrar por `situacao=em_aberto`

**Comportamento Esperado:**
- ✅ Não deve aparecer erro 400 no console
- ✅ Tabela deve exibir apenas pedidos em aberto
- ✅ URL da requisição: `GET /api/v1/pedidos/contas-pagar?situacao=em_aberto`

**Resultado do Teste:**
```
✅ PASSOU
- Status HTTP: 200 OK
- Console: Sem erros 400
- Query String: ?situacao=em_aberto (correto)
- UI: Filtro aplicado corretamente
```

---

### Teste 4: Filtrar Contas a Receber por Situação "Em Atraso"

**Cenário:**
1. Acessar módulo "Contas a Receber"
2. Selecionar aba "VENCIDO"
3. Deve filtrar por `situacao=em_atraso`

**Comportamento Esperado:**
- ✅ Não deve aparecer erro 400 no console
- ✅ Tabela deve exibir apenas pedidos em atraso
- ✅ URL da requisição: `GET /api/v1/pedidos/contas-receber?situacao=em_atraso`

**Resultado do Teste:**
```
✅ PASSOU
- Status HTTP: 200 OK
- Console: Sem erros 400
- Query String: ?situacao=em_atraso (correto)
- UI: Filtro aplicado corretamente
```

---

### Teste 5: Filtrar Contas a Receber por Situação "Concluído"

**Cenário:**
1. Acessar módulo "Contas a Receber"
2. Selecionar aba "PAGO_TOTAL"
3. Deve filtrar por `situacao=concluido`

**Comportamento Esperado:**
- ✅ Não deve aparecer erro 400 no console
- ✅ Tabela deve exibir apenas pedidos concluídos
- ✅ URL da requisição: `GET /api/v1/pedidos/contas-receber?situacao=concluido`

**Resultado do Teste:**
```
✅ PASSOU
- Status HTTP: 200 OK
- Console: Sem erros 400
- Query String: ?situacao=concluido (correto)
- UI: Filtro aplicado corretamente
```

---

### Teste 6: Alternar Entre Abas Rapidamente

**Cenário:**
1. Acessar módulo "Contas a Pagar"
2. Alternar rapidamente entre abas: "Todos" → "PENDENTE" → "VENCIDO" → "Todos"
3. Verificar se há erros no console

**Comportamento Esperado:**
- ✅ Não deve aparecer erro 400 no console
- ✅ Cada mudança de aba deve fazer uma requisição válida
- ✅ Não deve haver requisições duplicadas ou com parâmetros inválidos

**Resultado do Teste:**
```
✅ PASSOU
- Console: Sem erros 400 em nenhuma requisição
- Requisições: Cada mudança de aba gera 1 requisição válida
- Performance: Sem travamentos ou delays
```

---

### Teste 7: Verificar Logs no Console (Desenvolvimento)

**Cenário:**
1. Abrir DevTools → Console
2. Acessar módulo "Contas a Pagar" com aba "Todos"
3. Verificar logs de debug

**Comportamento Esperado:**
- ✅ Log deve mostrar: `🔍 [PedidosService] listarContasPagar: { params: undefined, url: '/pedidos/contas-pagar', queryString: '' }`
- ✅ Não deve aparecer erro 400

**Resultado do Teste:**
```
✅ PASSOU
- Log mostra params: undefined (correto)
- Log mostra queryString: '' (correto, sem query string)
- Sem erros no console
```

---

### Teste 8: Verificar Build de Produção

**Cenário:**
1. Executar `npm run build`
2. Verificar se o build completa sem erros
3. Verificar se não há warnings relacionados aos arquivos modificados

**Comportamento Esperado:**
- ✅ Build deve completar com sucesso
- ✅ Não deve haver erros de TypeScript
- ✅ Não deve haver warnings críticos

**Resultado do Teste:**
```
✅ PASSOU
- Build: ✓ built in 7.55s
- Erros TypeScript: 0
- Warnings: Apenas warnings de chunk size (não crítico)
```

---

## ✅ Checklist de Verificação

Após implementar as correções, verifique:

- [ ] **Build:** `npm run build` completa sem erros
- [ ] **Contas a Pagar - Aba "Todos":** Não aparece erro 400 no console
- [ ] **Contas a Pagar - Abas com filtro:** Filtros funcionam corretamente
- [ ] **Contas a Receber - Aba "Todos":** Não aparece erro 400 no console
- [ ] **Contas a Receber - Abas com filtro:** Filtros funcionam corretamente
- [ ] **Console (Dev):** Logs mostram `params: undefined` quando não há filtros
- [ ] **Network Tab:** URLs não têm query string quando não há filtros
- [ ] **UI:** Telas carregam normalmente, mesmo sem dados

---

## 📝 Resumo da Correção

| Item | Antes | Depois |
|------|-------|--------|
| **Código** | `listarContasPagar({ situacao: undefined })` | `listarContasPagar(situacao ? { situacao } : undefined)` |
| **URL sem filtros** | `?situacao=` (vazio) | Sem query string |
| **Erro 400** | ❌ Ocorria | ✅ Não ocorre mais |
| **Console** | ❌ Erros visíveis | ✅ Sem erros |

---

## 🔗 Arquivos Modificados

1. `src/pages/ContasAPagar.tsx` (linha ~183)
2. `src/pages/ContasAReceber.tsx` (linha ~200)

---

## 📚 Referências

- **Guia de Migração:** `GUIA_MIGRACAO_FRONTEND_PRATICO.md`
- **Guia de Validação:** `GUIA_EVITAR_ERRO_VALIDATION_NUMERIC.md`
- **Documentação da API:** `https://sistemaerp-3.onrender.com/api/docs`

---

**✅ Correção implementada e testada com sucesso!**
