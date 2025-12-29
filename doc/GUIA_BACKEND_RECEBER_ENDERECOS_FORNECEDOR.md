# 📘 Guia Backend - Receber e Processar Endereços de Fornecedor

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Como o Frontend Envia os Dados](#como-o-frontend-envia-os-dados)
3. [Formato do Payload](#formato-do-payload)
4. [Lógica de Processamento no Backend](#lógica-de-processamento-no-backend)
5. [Exemplos Práticos](#exemplos-práticos)
6. [Validações Necessárias](#validações-necessárias)
7. [Tratamento de Erros](#tratamento-de-erros)

---

## 🎯 Visão Geral

Quando o usuário adiciona um novo endereço no formulário de edição de fornecedor e clica em **"Salvar Alterações"**, o frontend envia uma requisição `PATCH` para o endpoint `/fornecedor/:id` com um array de endereços que inclui tanto os endereços existentes quanto os novos.

### Fluxo Completo

```
1. Usuário adiciona novo endereço no formulário
   ↓
2. Frontend marca endereço como novo (sem ID)
   ↓
3. Usuário clica em "Salvar Alterações"
   ↓
4. Frontend prepara payload com TODOS os endereços (existentes + novos)
   ↓
5. Frontend envia PATCH /fornecedor/:id com array de endereços
   ↓
6. Backend processa:
   - Endereços COM id → Atualiza
   - Endereços SEM id → Cria novo
   - Endereços não enviados → Remove
```

---

## 📤 Como o Frontend Envia os Dados

### Endpoint

```
PATCH /api/v1/fornecedor/:id
```

### Headers

```
Content-Type: application/json
Authorization: Bearer {token}
```

### Método de Envio

O frontend usa o método `atualizarParcial()` do serviço de fornecedores, que:

1. **Prepara o payload** usando `prepararPayloadAtualizacaoFornecedor()`
2. **Processa cada endereço** usando `prepararEndereco()`
3. **Envia via PATCH** para `/fornecedor/:id`

### Código Frontend (Referência)

```typescript
// Quando usuário adiciona novo endereço
const novoEndereco = {
  // SEM id (undefined) - indica que é novo
  cep: "54730-640",
  logradouro: "teste",
  numero: "45",
  complemento: "",
  bairro: "ada",
  cidade: "adwd",
  estado: "PE",
  referencia: ""
};

// Frontend prepara payload
const payload = {
  enderecos: [
    { id: 1, cep: "...", ... },  // Endereço existente (será atualizado)
    { cep: "54730-640", ... }     // Endereço novo SEM id (será criado)
  ]
};

// Envia para backend
PATCH /fornecedor/123
Body: { enderecos: [...] }
```

---

## 📦 Formato do Payload

### Estrutura Completa do Payload

```json
{
  "nome_fantasia": "string | null",
  "nome_razao": "string | null",
  "tipoFornecedor": "PESSOA_FISICA | PESSOA_JURIDICA",
  "statusFornecedor": "ATIVO | INATIVO | BLOQUEADO",
  "cpf_cnpj": "string",
  "inscricao_estadual": "string | null",
  "enderecos": [
    {
      "id": 1,                    // OPCIONAL: Se presente, atualiza endereço existente
      "cep": "54730-640",        // string | null
      "logradouro": "teste",     // string | null
      "numero": "45",            // string | null
      "complemento": null,       // string | null
      "bairro": "ada",           // string | null
      "cidade": "adwd",          // string | null
      "estado": "PE",            // string | null
      "referencia": null         // string | null
    },
    {
      // SEM "id" - indica que é um endereço NOVO
      "cep": "01310-100",
      "logradouro": "Av. Paulista",
      "numero": "1000",
      "complemento": "Sala 10",
      "bairro": "Bela Vista",
      "cidade": "São Paulo",
      "estado": "SP",
      "referencia": "Próximo ao metrô"
    }
  ],
  "contato": [...]
}
```

### Estrutura de um Endereço

```typescript
interface UpdateEndereco {
  id?: number;              // OPCIONAL: Se presente, atualiza endereço existente
                            // Se ausente, cria novo endereço
  
  cep?: string | null;      // CEP formatado ou null
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;   // UF (2 caracteres)
  referencia?: string | null;
}
```

### Regras Importantes

1. **Campo `id` presente**: Endereço existente → **ATUALIZAR**
2. **Campo `id` ausente**: Endereço novo → **CRIAR**
3. **Valores `null`**: Campos vazios são convertidos para `null` pelo frontend
4. **Valores `undefined`**: Campos não enviados (não altera valor existente)

---

## 🔧 Lógica de Processamento no Backend

### Algoritmo de Processamento

```typescript
// Pseudocódigo para processar endereços

async function processarEnderecosFornecedor(
  fornecedorId: number,
  enderecosRecebidos: UpdateEndereco[]
) {
  // 1. Buscar endereços existentes do fornecedor
  const enderecosExistentes = await buscarEnderecosPorFornecedor(fornecedorId);
  const idsExistentes = enderecosExistentes.map(e => e.id);
  const idsRecebidos = enderecosRecebidos
    .filter(e => e.id !== undefined)
    .map(e => e.id!);
  
  // 2. Identificar endereços para REMOVER
  // Endereços que existem no banco mas NÃO foram enviados no array
  const idsParaRemover = idsExistentes.filter(
    id => !idsRecebidos.includes(id)
  );
  
  // 3. REMOVER endereços não enviados
  for (const id of idsParaRemover) {
    await removerEndereco(id, fornecedorId); // Validar pertencimento
  }
  
  // 4. Processar cada endereço recebido
  for (const endereco of enderecosRecebidos) {
    if (endereco.id !== undefined) {
      // ENDEREÇO EXISTENTE → ATUALIZAR
      await atualizarEndereco(endereco.id, endereco, fornecedorId);
    } else {
      // ENDEREÇO NOVO → CRIAR
      await criarEndereco(endereco, fornecedorId);
    }
  }
}
```

### Passo a Passo Detalhado

#### 1. **Validar Fornecedor**

```typescript
const fornecedor = await Fornecedor.findByPk(fornecedorId);
if (!fornecedor) {
  throw new Error('Fornecedor não encontrado');
}
```

#### 2. **Buscar Endereços Existentes**

```typescript
const enderecosExistentes = await Endereco.findAll({
  where: { fornecedorId: fornecedorId }
});
```

#### 3. **Identificar Endereços para Remover**

```typescript
const idsRecebidos = enderecosRecebidos
  .filter(e => e.id !== undefined)
  .map(e => e.id!);

const idsParaRemover = enderecosExistentes
  .map(e => e.id)
  .filter(id => !idsRecebidos.includes(id));
```

#### 4. **Remover Endereços Não Enviados**

```typescript
for (const id of idsParaRemover) {
  // IMPORTANTE: Validar que o endereço pertence ao fornecedor
  const endereco = await Endereco.findOne({
    where: { id, fornecedorId }
  });
  
  if (endereco) {
    await endereco.destroy();
  }
}
```

#### 5. **Processar Endereços Recebidos**

```typescript
for (const enderecoData of enderecosRecebidos) {
  if (enderecoData.id !== undefined) {
    // ATUALIZAR ENDEREÇO EXISTENTE
    const endereco = await Endereco.findOne({
      where: { 
        id: enderecoData.id,
        fornecedorId: fornecedorId // Validar pertencimento
      }
    });
    
    if (!endereco) {
      throw new Error(`Endereço com ID ${enderecoData.id} não pertence a este fornecedor`);
    }
    
    // Atualizar campos (apenas os enviados)
    await endereco.update({
      cep: enderecoData.cep ?? endereco.cep,
      logradouro: enderecoData.logradouro ?? endereco.logradouro,
      numero: enderecoData.numero ?? endereco.numero,
      complemento: enderecoData.complemento ?? endereco.complemento,
      bairro: enderecoData.bairro ?? endereco.bairro,
      cidade: enderecoData.cidade ?? endereco.cidade,
      estado: enderecoData.estado ?? endereco.estado,
      referencia: enderecoData.referencia ?? endereco.referencia,
    });
    
  } else {
    // CRIAR NOVO ENDEREÇO
    // Validar campos obrigatórios
    if (!enderecoData.cep && !enderecoData.logradouro && !enderecoData.cidade) {
      // Endereço vazio - pular (frontend já filtra, mas validar no backend também)
      continue;
    }
    
    await Endereco.create({
      fornecedorId: fornecedorId,
      cep: enderecoData.cep || null,
      logradouro: enderecoData.logradouro || null,
      numero: enderecoData.numero || null,
      complemento: enderecoData.complemento || null,
      bairro: enderecoData.bairro || null,
      cidade: enderecoData.cidade || null,
      estado: enderecoData.estado || null,
      referencia: enderecoData.referencia || null,
    });
  }
}
```

---

## 📝 Exemplos Práticos

### Exemplo 1: Adicionar Novo Endereço

**Situação**: Fornecedor tem 1 endereço, usuário adiciona 1 novo.

**Payload Recebido**:
```json
{
  "enderecos": [
    {
      "id": 1,
      "cep": "01310-100",
      "logradouro": "Av. Paulista",
      "numero": "1000",
      "cidade": "São Paulo",
      "estado": "SP"
    },
    {
      "cep": "54730-640",
      "logradouro": "teste",
      "numero": "45",
      "bairro": "ada",
      "cidade": "adwd",
      "estado": "PE"
    }
  ]
}
```

**Processamento**:
1. Endereço com `id: 1` → Atualiza endereço existente
2. Endereço sem `id` → Cria novo endereço
3. **Resultado**: Fornecedor tem 2 endereços

### Exemplo 2: Remover Endereço

**Situação**: Fornecedor tem 3 endereços (IDs: 1, 2, 3), usuário remove 1.

**Payload Recebido**:
```json
{
  "enderecos": [
    {
      "id": 1,
      "cep": "01310-100",
      ...
    },
    {
      "id": 3,
      "cep": "04567-890",
      ...
    }
  ]
}
```

**Processamento**:
1. Endereço com `id: 1` → Atualiza
2. Endereço com `id: 3` → Atualiza
3. Endereço com `id: 2` não foi enviado → **Remove**
4. **Resultado**: Fornecedor tem 2 endereços (IDs: 1, 3)

### Exemplo 3: Atualizar e Adicionar

**Situação**: Fornecedor tem 1 endereço, usuário atualiza o existente e adiciona 1 novo.

**Payload Recebido**:
```json
{
  "enderecos": [
    {
      "id": 1,
      "cep": "01310-200",  // CEP alterado
      "logradouro": "Av. Paulista Atualizada",
      "numero": "2000",
      "cidade": "São Paulo",
      "estado": "SP"
    },
    {
      "cep": "54730-640",
      "logradouro": "Novo Endereço",
      "numero": "45",
      "cidade": "Recife",
      "estado": "PE"
    }
  ]
}
```

**Processamento**:
1. Endereço com `id: 1` → Atualiza com novos dados
2. Endereço sem `id` → Cria novo endereço
3. **Resultado**: Fornecedor tem 2 endereços (1 atualizado + 1 novo)

### Exemplo 4: Remover Todos os Endereços

**Situação**: Fornecedor tem 2 endereços, usuário remove todos.

**Payload Recebido**:
```json
{
  "enderecos": []
}
```

**Processamento**:
1. Array vazio → Remove todos os endereços existentes
2. **Resultado**: Fornecedor tem 0 endereços

### Exemplo 5: Manter Endereços Existentes

**Situação**: Usuário atualiza apenas nome do fornecedor, sem alterar endereços.

**Payload Recebido**:
```json
{
  "nome_fantasia": "Novo Nome",
  // enderecos NÃO está presente (undefined)
}
```

**Processamento**:
1. Campo `enderecos` não enviado → **Mantém todos os endereços existentes**
2. **Resultado**: Endereços permanecem inalterados

---

## ✅ Validações Necessárias

### 1. Validação de Pertencente

```typescript
// CRÍTICO: Sempre validar que o endereço pertence ao fornecedor
async function validarPertencentaEndereco(
  enderecoId: number,
  fornecedorId: number
): Promise<boolean> {
  const endereco = await Endereco.findOne({
    where: { id: enderecoId, fornecedorId: fornecedorId }
  });
  return endereco !== null;
}
```

### 2. Validação de Campos Obrigatórios (Novos Endereços)

```typescript
function validarEnderecoNovo(endereco: UpdateEndereco): boolean {
  // Endereço novo precisa ter pelo menos alguns campos preenchidos
  return !!(
    endereco.cep || 
    endereco.logradouro || 
    endereco.cidade || 
    endereco.estado
  );
}
```

### 3. Validação de Formato

```typescript
function validarFormatoEndereco(endereco: UpdateEndereco): void {
  // Validar CEP (se presente)
  if (endereco.cep && !/^\d{5}-?\d{3}$/.test(endereco.cep.replace(/\D/g, ''))) {
    throw new Error('CEP inválido');
  }
  
  // Validar Estado (se presente)
  if (endereco.estado && endereco.estado.length !== 2) {
    throw new Error('Estado deve ter 2 caracteres (UF)');
  }
}
```

### 4. Validação de IDs

```typescript
function validarIdsEnderecos(enderecos: UpdateEndereco[]): void {
  const ids = enderecos
    .filter(e => e.id !== undefined)
    .map(e => e.id!);
  
  // Verificar duplicatas
  const idsUnicos = new Set(ids);
  if (ids.length !== idsUnicos.size) {
    throw new Error('IDs duplicados no array de endereços');
  }
  
  // Verificar se são números válidos
  for (const id of ids) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error(`ID inválido: ${id}`);
    }
  }
}
```

---

## 🚨 Tratamento de Erros

### Erros Comuns e Respostas

#### 1. Endereço não pertence ao fornecedor

```typescript
// Status: 400 Bad Request
{
  "message": "Endereço com ID 5 não pertence a este fornecedor"
}
```

#### 2. Endereço não encontrado

```typescript
// Status: 404 Not Found
{
  "message": "Endereço com ID 5 não encontrado"
}
```

#### 3. Validação de campos

```typescript
// Status: 400 Bad Request
{
  "message": "Endereço novo deve ter pelo menos CEP, Logradouro ou Cidade preenchidos"
}
```

#### 4. IDs duplicados

```typescript
// Status: 400 Bad Request
{
  "message": "IDs duplicados no array de endereços"
}
```

### Exemplo de Tratamento Completo

```typescript
async function processarEnderecosComValidacao(
  fornecedorId: number,
  enderecosRecebidos: UpdateEndereco[]
): Promise<void> {
  try {
    // 1. Validar fornecedor existe
    const fornecedor = await Fornecedor.findByPk(fornecedorId);
    if (!fornecedor) {
      throw new Error('Fornecedor não encontrado');
    }
    
    // 2. Validar formato dos IDs
    validarIdsEnderecos(enderecosRecebidos);
    
    // 3. Validar pertencimento de endereços existentes
    for (const endereco of enderecosRecebidos) {
      if (endereco.id !== undefined) {
        const pertence = await validarPertencentaEndereco(
          endereco.id,
          fornecedorId
        );
        if (!pertence) {
          throw new Error(
            `Endereço com ID ${endereco.id} não pertence a este fornecedor`
          );
        }
      } else {
        // Validar endereço novo
        if (!validarEnderecoNovo(endereco)) {
          throw new Error(
            'Endereço novo deve ter pelo menos CEP, Logradouro ou Cidade preenchidos'
          );
        }
      }
      
      // Validar formato
      validarFormatoEndereco(endereco);
    }
    
    // 4. Processar endereços
    await processarEnderecosFornecedor(fornecedorId, enderecosRecebidos);
    
  } catch (error) {
    // Log do erro
    console.error('Erro ao processar endereços:', error);
    
    // Retornar erro apropriado
    throw error;
  }
}
```

---

## 📊 Resumo das Regras

### Regras de Processamento

| Situação | Campo `id` | Ação |
|----------|------------|------|
| Endereço existente | Presente | **ATUALIZAR** |
| Endereço novo | Ausente | **CRIAR** |
| Endereço não enviado | - | **REMOVER** |
| Array não enviado | - | **MANTER** todos existentes |
| Array vazio `[]` | - | **REMOVER** todos |

### Regras de Validação

1. ✅ **Sempre validar pertencimento** de endereços com ID
2. ✅ **Validar campos obrigatórios** para endereços novos
3. ✅ **Validar formato** de CEP, Estado, etc.
4. ✅ **Validar IDs** (não duplicados, números válidos)
5. ✅ **Tratar valores `null`** como campos vazios

---

## 🔍 Debug e Logs

### Logs Recomendados no Backend

```typescript
console.log('📥 [Backend] Recebendo atualização de fornecedor:', {
  fornecedorId,
  enderecosRecebidos: enderecosRecebidos.length,
  enderecosComId: enderecosRecebidos.filter(e => e.id).length,
  enderecosNovos: enderecosRecebidos.filter(e => !e.id).length,
  payload: enderecosRecebidos
});

console.log('🔄 [Backend] Processando endereços:', {
  enderecosExistentes: enderecosExistentes.length,
  idsParaRemover: idsParaRemover,
  idsParaAtualizar: idsRecebidos,
  enderecosNovos: enderecosRecebidos.filter(e => !e.id).length
});
```

---

## ✅ Checklist de Implementação Backend

- [ ] Validar que o fornecedor existe
- [ ] Buscar endereços existentes do fornecedor
- [ ] Identificar endereços para remover (não enviados no array)
- [ ] Validar pertencimento de endereços com ID
- [ ] Validar campos obrigatórios de endereços novos
- [ ] Validar formato de CEP, Estado, etc.
- [ ] Processar atualizações de endereços existentes
- [ ] Processar criação de endereços novos
- [ ] Remover endereços não enviados
- [ ] Retornar fornecedor atualizado com todos os endereços
- [ ] Tratar erros adequadamente
- [ ] Adicionar logs para debug

---

## ✅ Implementação Concluída

### Funções Implementadas

#### Validações
- ✅ `validarPertencentaEndereco()` - Valida se endereço pertence ao fornecedor
- ✅ `validarEnderecoNovo()` - Valida campos obrigatórios para novos endereços
- ✅ `validarFormatoEndereco()` - Valida formato de CEP e Estado (UF)
- ✅ `validarIdsEnderecos()` - Valida IDs duplicados e números válidos
- ✅ `normalizarEndereco()` - Normaliza dados recebidos do frontend

#### Processamento Principal
- ✅ `processarEnderecosFornecedor()` - Método principal seguindo algoritmo do guia
  - Busca endereços existentes
  - Normaliza e valida endereços recebidos
  - Valida IDs e pertencimento
  - Identifica endereços para remover
  - Remove endereços não enviados
  - Processa cada endereço (atualiza ou cria)

#### Métodos Auxiliares
- ✅ `atualizarEndereco()` - Atualiza endereço existente com validações
- ✅ `criarEndereco()` - Cria novo endereço com validações

### Regras Implementadas

| Regra | Status |
|-------|--------|
| Endereços com `id` → atualizar | ✅ |
| Endereços sem `id` → criar novo | ✅ |
| Endereços não enviados → remover | ✅ |
| Array não enviado → manter todos | ✅ |
| Array vazio `[]` → remover todos | ✅ |

### Validações Implementadas

- ✅ Validação de pertencimento de endereços com ID
- ✅ Validação de campos obrigatórios para novos endereços
- ✅ Validação de formato de CEP (8 dígitos)
- ✅ Validação de formato de Estado (2 caracteres UF)
- ✅ Validação de IDs duplicados
- ✅ Tratamento de valores `null` e `undefined`

---

## 🧪 Testes Recomendados

### Cenários de Teste

#### 1. Adicionar Novo Endereço
```
Dado: Fornecedor com 1 endereço existente
Quando: Enviar array com endereço existente + 1 novo (sem id)
Então: Fornecedor deve ter 2 endereços
```

#### 2. Remover Endereço
```
Dado: Fornecedor com 3 endereços (IDs: 1, 2, 3)
Quando: Enviar array apenas com IDs 1 e 3
Então: Endereço com ID 2 deve ser removido
```

#### 3. Atualizar Endereço Existente
```
Dado: Fornecedor com endereço ID 1 (CEP: "01310-100")
Quando: Enviar array com endereço ID 1 (CEP: "01310-200")
Então: Endereço ID 1 deve ter CEP atualizado
```

#### 4. Array Vazio Remove Todos
```
Dado: Fornecedor com 2 endereços
Quando: Enviar array vazio []
Então: Todos os endereços devem ser removidos
```

#### 5. Array Não Enviado Mantém Todos
```
Dado: Fornecedor com 2 endereços
Quando: Atualizar apenas nome_fantasia (sem campo enderecos)
Então: Endereços devem permanecer inalterados
```

#### 6. Validação de Pertencente
```
Dado: Endereço ID 5 pertence a outro fornecedor
Quando: Tentar atualizar endereço ID 5 para fornecedor diferente
Então: Deve retornar erro 400 "Endereço não pertence a este fornecedor"
```

#### 7. Validação de Endereço Novo Vazio
```
Dado: Endereço novo sem campos obrigatórios
Quando: Tentar criar endereço sem CEP, Logradouro ou Cidade
Então: Deve retornar erro 400 ou ignorar endereço vazio
```

---

## 📝 Notas de Implementação

### Boas Práticas Seguidas

1. ✅ **Validação de Segurança**: Sempre validar pertencimento antes de atualizar/remover
2. ✅ **Normalização**: Normalizar dados recebidos antes de processar
3. ✅ **Tratamento de Erros**: Erros específicos e informativos
4. ✅ **Logs**: Logs detalhados para debug
5. ✅ **Transações**: Usar transações para garantir consistência

### Pontos de Atenção

- ⚠️ **Performance**: Se houver muitos endereços, considerar processamento em lote
- ⚠️ **Transações**: Garantir que todas as operações sejam atômicas
- ⚠️ **Validação de CEP**: Considerar integração com API de CEP para validação
- ⚠️ **Auditoria**: Considerar log de alterações em endereços

---

**Última atualização**: 2024  
**Versão do Frontend**: Compatível com atualização parcial de Fornecedores  
**Status da Implementação Backend**: ✅ Concluída


