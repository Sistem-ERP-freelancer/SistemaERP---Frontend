# Guia Backend - Condições de Pagamento do Cliente

## Visão Geral

Este documento descreve o formato dos dados que o **frontend envia** para o backend ao criar ou atualizar um cliente com condições de pagamento.

## Endpoint

```
POST /api/v1/clientes
PATCH /api/v1/clientes/:id
```

## Estrutura do Payload

### Payload Completo de Criação de Cliente

```json
{
  "nome": "string",
  "nome_fantasia": "string (opcional)",
  "nome_razao": "string (opcional)",
  "tipoPessoa": "PESSOA_FISICA" | "PESSOA_JURIDICA",
  "statusCliente": "ATIVO" | "INATIVO" | "BLOQUEADO" | "INADIMPLENTE",
  "cpf_cnpj": "string (formatado)",
  "inscricao_estadual": "string (opcional)",
  "limite_credito": "number (opcional)",
  "enderecos": [...],
  "contatos": [...],
  "condicoes_pagamento": [
    {
      "descricao": "string",
      "forma_pagamento": "DINHEIRO" | "PIX" | "CARTAO_CREDITO" | "CARTAO_DEBITO" | "BOLETO" | "TRANSFERENCIA",
      "prazo_dias": "number (opcional)",
      "parcelado": "boolean",
      "numero_parcelas": "number (opcional)",
      "padrao": "boolean",
      "parcelas": [
        {
          "numero_parcela": "number",
          "dias_vencimento": "number",
          "percentual": "number"
        }
      ]
    }
  ]
}
```

## Campo: `condicoes_pagamento`

### Tipo

- **Array de objetos** (opcional)
- Se não fornecido ou array vazio, nenhuma condição de pagamento será criada

### Estrutura de Cada Condição de Pagamento

```typescript
{
  descricao: string;                    // OBRIGATÓRIO - Descrição da condição (ex: "Pagamento em 30 dias")
  forma_pagamento: string;               // OBRIGATÓRIO - Enum: DINHEIRO, PIX, CARTAO_CREDITO, CARTAO_DEBITO, BOLETO, TRANSFERENCIA
  prazo_dias?: number;                   // OPCIONAL - Apenas quando parcelado = false
  parcelado: boolean;                    // OBRIGATÓRIO - true = parcelado, false = à vista
  numero_parcelas?: number;              // OPCIONAL - Apenas quando parcelado = true
  padrao: boolean;                       // OBRIGATÓRIO - true = condição padrão do cliente
  parcelas?: Array<ParcelaPagamento>;   // OPCIONAL - Apenas quando parcelado = true
}
```

## Regras de Validação

### 1. Pagamento NÃO Parcelado (`parcelado: false`)

**Campos obrigatórios:**

- `descricao`
- `forma_pagamento`
- `prazo_dias` (deve ser fornecido)
- `parcelado: false`
- `padrao`

**Campos que NÃO devem ser enviados:**

- `numero_parcelas` → deve ser `undefined` ou não estar presente
- `parcelas` → deve ser `undefined` ou não estar presente

**Exemplo:**

```json
{
  "descricao": "Pagamento em 30 dias",
  "forma_pagamento": "PIX",
  "prazo_dias": 30,
  "parcelado": false,
  "padrao": true
}
```

### 2. Pagamento Parcelado (`parcelado: true`)

**Campos obrigatórios:**

- `descricao`
- `forma_pagamento`
- `parcelado: true`
- `numero_parcelas` (deve ser >= 1)
- `padrao`
- `parcelas` (array com pelo menos 1 parcela)

**Campos que NÃO devem ser enviados:**

- `prazo_dias` → deve ser `undefined` ou não estar presente

**Exemplo:**

```json
{
  "descricao": "Pagamento em 12x",
  "forma_pagamento": "CARTAO_CREDITO",
  "parcelado": true,
  "numero_parcelas": 12,
  "padrao": true,
  "parcelas": [
    {
      "numero_parcela": 1,
      "dias_vencimento": 30,
      "percentual": 8.33
    },
    {
      "numero_parcela": 2,
      "dias_vencimento": 60,
      "percentual": 8.33
    },
    // ... até 12 parcelas
    {
      "numero_parcela": 12,
      "dias_vencimento": 360,
      "percentual": 8.37
    }
  ]
}
```

## Estrutura de `parcelas` (Array)

### Tipo ParcelaPagamento

```typescript
{
  numero_parcela: number; // OBRIGATÓRIO - Número sequencial da parcela (1, 2, 3, ...)
  dias_vencimento: number; // OBRIGATÓRIO - Dias até o vencimento (30, 60, 90, ...)
  percentual: number; // OBRIGATÓRIO - Percentual da parcela (0-100)
}
```

### Regras de Validação das Parcelas

1. **Número de Parcelas:**

   - O array `parcelas` deve ter exatamente `numero_parcelas` itens
   - Exemplo: Se `numero_parcelas = 12`, o array deve ter 12 objetos

2. **Sequência:**

   - `numero_parcela` deve começar em 1 e ser sequencial (1, 2, 3, ..., n)
   - Não pode haver duplicatas
   - Não pode pular números

3. **Percentuais:**

   - A soma de todos os `percentual` deve ser **exatamente 100%**
   - Tolerância aceitável: `Math.abs(soma - 100) <= 0.01`
   - Cada `percentual` deve ser >= 0 e <= 100

4. **Dias de Vencimento:**
   - Cada `dias_vencimento` deve ser >= 0
   - Geralmente incrementa de 30 em 30 dias (30, 60, 90, 120, ...)
   - Mas pode ser qualquer valor positivo

## Exemplo Completo: Cliente com Condição Parcelada

```json
{
  "nome": "João Silva",
  "tipoPessoa": "PESSOA_FISICA",
  "cpf_cnpj": "123.456.789-00",
  "statusCliente": "ATIVO",
  "limite_credito": 10000,
  "enderecos": [
    {
      "cep": "12345-678",
      "logradouro": "Rua Exemplo",
      "numero": "123",
      "bairro": "Centro",
      "cidade": "São Paulo",
      "estado": "SP"
    }
  ],
  "contatos": [
    {
      "telefone": "(11) 99999-9999",
      "email": "joao@email.com",
      "nomeContato": "João",
      "ativo": true
    }
  ],
  "condicoes_pagamento": [
    {
      "descricao": "Pagamento em 12x no cartão",
      "forma_pagamento": "CARTAO_CREDITO",
      "parcelado": true,
      "numero_parcelas": 12,
      "padrao": true,
      "parcelas": [
        { "numero_parcela": 1, "dias_vencimento": 30, "percentual": 8.33 },
        { "numero_parcela": 2, "dias_vencimento": 60, "percentual": 8.33 },
        { "numero_parcela": 3, "dias_vencimento": 90, "percentual": 8.33 },
        { "numero_parcela": 4, "dias_vencimento": 120, "percentual": 8.33 },
        { "numero_parcela": 5, "dias_vencimento": 150, "percentual": 8.33 },
        { "numero_parcela": 6, "dias_vencimento": 180, "percentual": 8.33 },
        { "numero_parcela": 7, "dias_vencimento": 210, "percentual": 8.33 },
        { "numero_parcela": 8, "dias_vencimento": 240, "percentual": 8.33 },
        { "numero_parcela": 9, "dias_vencimento": 270, "percentual": 8.33 },
        { "numero_parcela": 10, "dias_vencimento": 300, "percentual": 8.33 },
        { "numero_parcela": 11, "dias_vencimento": 330, "percentual": 8.33 },
        { "numero_parcela": 12, "dias_vencimento": 360, "percentual": 8.37 }
      ]
    }
  ]
}
```

## Exemplo Completo: Cliente com Condição à Vista

```json
{
  "nome": "Maria Santos",
  "tipoPessoa": "PESSOA_FISICA",
  "cpf_cnpj": "987.654.321-00",
  "statusCliente": "ATIVO",
  "condicoes_pagamento": [
    {
      "descricao": "Pagamento em 30 dias",
      "forma_pagamento": "PIX",
      "prazo_dias": 30,
      "parcelado": false,
      "padrao": true
    }
  ]
}
```

## Validações que o Backend DEVE Implementar

### Validações Gerais

1. ✅ Se `parcelado = false`:

   - `prazo_dias` deve estar presente e ser >= 0
   - `numero_parcelas` não deve estar presente ou deve ser `undefined`
   - `parcelas` não deve estar presente ou deve ser `undefined`

2. ✅ Se `parcelado = true`:
   - `numero_parcelas` deve estar presente e ser >= 1
   - `parcelas` deve estar presente e ser um array não vazio
   - `prazo_dias` não deve estar presente ou deve ser `undefined`
   - O array `parcelas` deve ter exatamente `numero_parcelas` itens

### Validações das Parcelas

1. ✅ **Quantidade:**

   ```javascript
   parcelas.length === numero_parcelas;
   ```

2. ✅ **Sequência:**

   ```javascript
   // Verificar se os números são sequenciais de 1 até numero_parcelas
   const numeros = parcelas.map((p) => p.numero_parcela).sort((a, b) => a - b);
   numeros.every((num, index) => num === index + 1);
   ```

3. ✅ **Soma dos Percentuais:**

   ```javascript
   const soma = parcelas.reduce((sum, p) => sum + p.percentual, 0);
   Math.abs(soma - 100) <= 0.01; // Deve ser exatamente 100%
   ```

4. ✅ **Valores Válidos:**
   ```javascript
   parcelas.every(
     (p) =>
       p.numero_parcela >= 1 &&
       p.dias_vencimento >= 0 &&
       p.percentual >= 0 &&
       p.percentual <= 100
   );
   ```

## Mensagens de Erro Sugeridas

### Erros Comuns

1. **Pagamento não parcelado com parcelas:**

   ```
   "Quando parcelado é false, não é permitido enviar parcelas ou numero_parcelas"
   ```

2. **Pagamento parcelado sem parcelas:**

   ```
   "Quando parcelado é true, é obrigatório enviar numero_parcelas e parcelas"
   ```

3. **Número de parcelas inconsistente:**

   ```
   "O número de parcelas enviadas não corresponde ao numero_parcelas informado"
   ```

4. **Soma de percentuais inválida:**

   ```
   "A soma dos percentuais das parcelas deve ser exatamente 100%. Atual: {soma}%"
   ```

5. **Sequência de parcelas inválida:**
   ```
   "As parcelas devem ser numeradas sequencialmente de 1 até {numero_parcelas}"
   ```

## Observações Importantes

1. **Campo `id` nas parcelas:**

   - O frontend pode enviar `id` nas parcelas (opcional)
   - Se presente, significa que é uma parcela existente sendo atualizada
   - Se ausente, significa que é uma nova parcela a ser criada

2. **Múltiplas Condições:**

   - Um cliente pode ter múltiplas condições de pagamento
   - Apenas uma condição deve ter `padrao: true`
   - O backend deve validar que existe exatamente uma condição padrão

3. **Formato de Enum:**

   - `forma_pagamento` deve aceitar exatamente: `DINHEIRO`, `PIX`, `CARTAO_CREDITO`, `CARTAO_DEBITO`, `BOLETO`, `TRANSFERENCIA`
   - Case-sensitive (maiúsculas)

4. **Campos Opcionais:**
   - O frontend pode enviar campos como `undefined` ou simplesmente omiti-los
   - O backend deve tratar ambos os casos como "não fornecido"

## Exemplo de Validação no Backend (Pseudocódigo)

```javascript
function validarCondicaoPagamento(condicao) {
  // Validações básicas
  if (!condicao.descricao) {
    throw new Error("descricao é obrigatória");
  }

  if (!condicao.forma_pagamento) {
    throw new Error("forma_pagamento é obrigatória");
  }

  if (typeof condicao.parcelado !== "boolean") {
    throw new Error("parcelado deve ser boolean");
  }

  // Validação para pagamento não parcelado
  if (!condicao.parcelado) {
    if (condicao.prazo_dias === undefined || condicao.prazo_dias === null) {
      throw new Error("prazo_dias é obrigatório quando parcelado é false");
    }
    if (condicao.numero_parcelas !== undefined) {
      throw new Error(
        "numero_parcelas não deve ser enviado quando parcelado é false"
      );
    }
    if (condicao.parcelas !== undefined && condicao.parcelas.length > 0) {
      throw new Error("parcelas não deve ser enviado quando parcelado é false");
    }
  }

  // Validação para pagamento parcelado
  if (condicao.parcelado) {
    if (!condicao.numero_parcelas || condicao.numero_parcelas < 1) {
      throw new Error(
        "numero_parcelas é obrigatório e deve ser >= 1 quando parcelado é true"
      );
    }

    if (
      !condicao.parcelas ||
      !Array.isArray(condicao.parcelas) ||
      condicao.parcelas.length === 0
    ) {
      throw new Error(
        "parcelas é obrigatório e deve ser um array não vazio quando parcelado é true"
      );
    }

    // Validar quantidade
    if (condicao.parcelas.length !== condicao.numero_parcelas) {
      throw new Error(
        `O número de parcelas enviadas (${condicao.parcelas.length}) não corresponde ao numero_parcelas informado (${condicao.numero_parcelas})`
      );
    }

    // Validar sequência
    const numeros = condicao.parcelas
      .map((p) => p.numero_parcela)
      .sort((a, b) => a - b);
    for (let i = 0; i < numeros.length; i++) {
      if (numeros[i] !== i + 1) {
        throw new Error(
          `As parcelas devem ser numeradas sequencialmente de 1 até ${condicao.numero_parcelas}`
        );
      }
    }

    // Validar soma dos percentuais
    const soma = condicao.parcelas.reduce((sum, p) => sum + p.percentual, 0);
    if (Math.abs(soma - 100) > 0.01) {
      throw new Error(
        `A soma dos percentuais das parcelas deve ser exatamente 100%. Atual: ${soma.toFixed(
          2
        )}%`
      );
    }

    // Validar valores individuais
    for (const parcela of condicao.parcelas) {
      if (parcela.dias_vencimento < 0) {
        throw new Error(
          `dias_vencimento deve ser >= 0 para a parcela ${parcela.numero_parcela}`
        );
      }
      if (parcela.percentual < 0 || parcela.percentual > 100) {
        throw new Error(
          `percentual deve estar entre 0 e 100 para a parcela ${parcela.numero_parcela}`
        );
      }
    }
  }

  return true;
}
```

## Estrutura do Banco de Dados

### Tabela: `tb_condicao_pagamento_cliente`

O backend precisa ter uma tabela para armazenar as condições de pagamento dos clientes. Segue a estrutura sugerida:

```sql
CREATE TABLE tb_condicao_pagamento_cliente (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER NOT NULL REFERENCES tb_cliente(id) ON DELETE CASCADE,
  descricao VARCHAR(255) NOT NULL,
  forma_pagamento VARCHAR(50) NOT NULL CHECK (forma_pagamento IN ('DINHEIRO', 'PIX', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'BOLETO', 'TRANSFERENCIA')),
  parcelado BOOLEAN NOT NULL DEFAULT false,
  prazo_dias INTEGER,
  numero_parcelas INTEGER,
  padrao BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Validações
  CONSTRAINT check_pagamento_nao_parcelado
    CHECK (
      (parcelado = false AND prazo_dias IS NOT NULL AND numero_parcelas IS NULL) OR
      (parcelado = true AND prazo_dias IS NULL AND numero_parcelas IS NOT NULL AND numero_parcelas > 0)
    )
);
```

### Tabela: `tb_parcela_pagamento`

Tabela para armazenar os detalhes de cada parcela:

```sql
CREATE TABLE tb_parcela_pagamento (
  id SERIAL PRIMARY KEY,
  condicao_pagamento_id INTEGER NOT NULL REFERENCES tb_condicao_pagamento_cliente(id) ON DELETE CASCADE,
  numero_parcela INTEGER NOT NULL CHECK (numero_parcela > 0),
  dias_vencimento INTEGER NOT NULL CHECK (dias_vencimento >= 0),
  percentual DECIMAL(5, 2) NOT NULL CHECK (percentual >= 0 AND percentual <= 100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Garantir que não há parcelas duplicadas na mesma condição
  UNIQUE(condicao_pagamento_id, numero_parcela)
);

-- Índice para melhorar performance
CREATE INDEX idx_parcela_condicao_pagamento ON tb_parcela_pagamento(condicao_pagamento_id);
```

### Trigger para Validação de Percentuais

Para garantir que a soma dos percentuais seja sempre 100%, você pode criar um trigger:

```sql
CREATE OR REPLACE FUNCTION validar_soma_percentuais()
RETURNS TRIGGER AS $$
DECLARE
  soma_percentuais DECIMAL(5, 2);
BEGIN
  SELECT COALESCE(SUM(percentual), 0) INTO soma_percentuais
  FROM tb_parcela_pagamento
  WHERE condicao_pagamento_id = NEW.condicao_pagamento_id;

  IF ABS(soma_percentuais - 100) > 0.01 THEN
    RAISE EXCEPTION 'A soma dos percentuais das parcelas deve ser exatamente 100%%. Atual: %%%', soma_percentuais;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validar_percentuais
AFTER INSERT OR UPDATE ON tb_parcela_pagamento
FOR EACH ROW
EXECUTE FUNCTION validar_soma_percentuais();
```

### Migração Sugerida

Se estiver usando um sistema de migrações, crie uma migração similar a:

```sql
-- Migration: Create condicoes_pagamento tables
-- Date: 2024-01-XX

BEGIN;

-- Criar tabela de condições de pagamento
CREATE TABLE IF NOT EXISTS tb_condicao_pagamento_cliente (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER NOT NULL REFERENCES tb_cliente(id) ON DELETE CASCADE,
  descricao VARCHAR(255) NOT NULL,
  forma_pagamento VARCHAR(50) NOT NULL,
  parcelado BOOLEAN NOT NULL DEFAULT false,
  prazo_dias INTEGER,
  numero_parcelas INTEGER,
  padrao BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela de parcelas
CREATE TABLE IF NOT EXISTS tb_parcela_pagamento (
  id SERIAL PRIMARY KEY,
  condicao_pagamento_id INTEGER NOT NULL REFERENCES tb_condicao_pagamento_cliente(id) ON DELETE CASCADE,
  numero_parcela INTEGER NOT NULL,
  dias_vencimento INTEGER NOT NULL,
  percentual DECIMAL(5, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(condicao_pagamento_id, numero_parcela)
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_condicao_cliente ON tb_condicao_pagamento_cliente(cliente_id);
CREATE INDEX IF NOT EXISTS idx_parcela_condicao ON tb_parcela_pagamento(condicao_pagamento_id);

-- Adicionar constraints
ALTER TABLE tb_condicao_pagamento_cliente
  ADD CONSTRAINT check_forma_pagamento
    CHECK (forma_pagamento IN ('DINHEIRO', 'PIX', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'BOLETO', 'TRANSFERENCIA'));

ALTER TABLE tb_condicao_pagamento_cliente
  ADD CONSTRAINT check_pagamento_nao_parcelado
    CHECK (
      (parcelado = false AND prazo_dias IS NOT NULL AND numero_parcelas IS NULL) OR
      (parcelado = true AND prazo_dias IS NULL AND numero_parcelas IS NOT NULL AND numero_parcelas > 0)
    );

ALTER TABLE tb_parcela_pagamento
  ADD CONSTRAINT check_numero_parcela
    CHECK (numero_parcela > 0);

ALTER TABLE tb_parcela_pagamento
  ADD CONSTRAINT check_dias_vencimento
    CHECK (dias_vencimento >= 0);

ALTER TABLE tb_parcela_pagamento
  ADD CONSTRAINT check_percentual
    CHECK (percentual >= 0 AND percentual <= 100);

COMMIT;
```

## Erro Comum: Tabela Não Existe

### Erro: `relation "tb_condicao_pagamento_cliente" does not exist`

**Causa:** A tabela `tb_condicao_pagamento_cliente` não foi criada no banco de dados.

**Solução:**

1. Execute a migração SQL acima para criar as tabelas necessárias
2. Verifique se o schema/tenant está correto (no erro aparece `tenant_empresa-1`)
3. Certifique-se de que as tabelas foram criadas no schema correto do tenant

**Verificação:**

```sql
-- Verificar se a tabela existe
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'tenant_empresa-1'
  AND table_name = 'tb_condicao_pagamento_cliente';

-- Se não existir, criar usando a migração acima
```

## Changelog

- **2024-01-XX**: Versão inicial do guia
  - Documentação completa do formato de dados
  - Validações necessárias
  - Exemplos práticos
  - Estrutura do banco de dados
  - Migrações SQL

---

**Nota:** Este guia foi criado com base no código atual do frontend. Qualquer alteração no formato de dados do frontend deve ser refletida neste documento.
