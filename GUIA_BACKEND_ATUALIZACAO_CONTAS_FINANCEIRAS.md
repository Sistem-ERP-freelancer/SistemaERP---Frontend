# Guia Backend - Atualização de Contas Financeiras (Pagar e Receber)

## Índice
1. [Visão Geral](#visão-geral)
2. [Endpoint de Atualização](#endpoint-de-atualização)
3. [Formato da Requisição](#formato-da-requisição)
4. [Campos Aceitos](#campos-aceitos)
5. [Validações Necessárias](#validações-necessárias)
6. [Status Permitidos](#status-permitidos)
7. [Formato de Resposta](#formato-de-resposta)
8. [Tratamento de Erros](#tratamento-de-erros)
9. [Exemplos Práticos](#exemplos-práticos)
10. [Regras de Negócio](#regras-de-negócio)
11. [Considerações Importantes](#considerações-importantes)

---

## Visão Geral

Este guia documenta como o backend deve receber e processar atualizações de contas financeiras (contas a pagar e contas a receber). O frontend envia requisições PATCH com atualizações parciais, permitindo modificar apenas os campos necessários.

### Características Principais

- **Atualização Parcial**: Apenas campos enviados são atualizados
- **Validação de Status**: Status deve ser um dos valores permitidos
- **Formato de Datas**: Todas as datas devem estar no formato ISO (YYYY-MM-DD)
- **Campos Opcionais**: Campos não enviados não alteram valores existentes
- **Campos Calculados**: Backend deve recalcular campos derivados após atualização

---

## Endpoint de Atualização

### URL Base
```
PATCH /api/v1/contas-financeiras/{id}
```

### Método HTTP
```
PATCH
```

### Autenticação
```
Authorization: Bearer {token}
Content-Type: application/json
```

### Parâmetros de URL
- `id` (obrigatório): ID numérico da conta financeira a ser atualizada

---

## Formato da Requisição

### Headers
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

### Body
O body deve ser um objeto JSON contendo apenas os campos que deseja atualizar. Campos não enviados serão ignorados (não alteram valores existentes).

### Exemplo Básico
```json
{
  "status": "PAGO_TOTAL",
  "data_pagamento": "2024-12-15"
}
```

---

## Campos Aceitos

### Campos Obrigatórios na Criação (Opcionais na Atualização)

| Campo | Tipo | Descrição | Validação |
|-------|------|-----------|-----------|
| `tipo` | string | Tipo da conta: `RECEBER` ou `PAGAR` | Enum: `RECEBER`, `PAGAR` |
| `descricao` | string | Descrição da conta | Min: 1 caractere, Max: 255 caracteres |
| `valor_original` | number | Valor original da conta | Deve ser > 0 |
| `data_emissao` | string | Data de emissão | Formato: `YYYY-MM-DD` |
| `data_vencimento` | string | Data de vencimento | Formato: `YYYY-MM-DD` |

### Campos Opcionais

| Campo | Tipo | Descrição | Validação |
|-------|------|-----------|-----------|
| `status` | string | Status da conta | Enum: `PENDENTE`, `PAGO_PARCIAL`, `PAGO_TOTAL`, `VENCIDO`, `CANCELADO` |
| `data_pagamento` | string | Data de pagamento | Formato: `YYYY-MM-DD` ou `null` |
| `forma_pagamento` | string | Forma de pagamento | Enum: `DINHEIRO`, `PIX`, `CARTAO_CREDITO`, `CARTAO_DEBITO`, `BOLETO`, `TRANSFERENCIA` |
| `cliente_id` | number | ID do cliente (apenas para RECEBER) | Deve existir na tabela de clientes |
| `fornecedor_id` | number | ID do fornecedor (apenas para PAGAR) | Deve existir na tabela de fornecedores |
| `pedido_id` | number | ID do pedido relacionado | Deve existir na tabela de pedidos |
| `numero_parcela` | number | Número da parcela | Deve ser > 0 |
| `total_parcelas` | number | Total de parcelas | Deve ser > 0 |
| `parcela_texto` | string | Texto da parcela (ex: "1/3") | Max: 20 caracteres |
| `observacoes` | string | Observações adicionais | Texto livre |

### Campos Calculados (Somente Leitura)

Estes campos são calculados pelo backend e **NÃO devem ser aceitos** na atualização:

- `valor_pago` - Calculado automaticamente
- `valor_restante` - Calculado automaticamente
- `numero_conta` - Gerado automaticamente
- `dias_ate_vencimento` - Calculado automaticamente
- `status_vencimento` - Calculado automaticamente
- `proximidade_vencimento` - Calculado automaticamente
- `created_at` - Timestamp de criação
- `updated_at` - Timestamp de atualização (atualizado automaticamente)

---

## Validações Necessárias

### 1. Validação de ID
```python
# Exemplo em Python/Flask
if not conta_financeira:
    return jsonify({
        'message': 'Conta financeira não encontrada',
        'error': 'NOT_FOUND'
    }), 404
```

### 2. Validação de Status
```python
STATUS_PERMITIDOS = [
    'PENDENTE',
    'PAGO_PARCIAL',
    'PAGO_TOTAL',
    'VENCIDO',
    'CANCELADO'
]

if 'status' in dados and dados['status'] not in STATUS_PERMITIDOS:
    return jsonify({
        'message': f'Status inválido. Valores permitidos: {", ".join(STATUS_PERMITIDOS)}',
        'error': 'VALIDATION_ERROR',
        'field': 'status',
        'allowed_values': STATUS_PERMITIDOS
    }), 400
```

### 3. Validação de Tipo
```python
TIPOS_PERMITIDOS = ['RECEBER', 'PAGAR']

if 'tipo' in dados and dados['tipo'] not in TIPOS_PERMITIDOS:
    return jsonify({
        'message': f'Tipo inválido. Valores permitidos: {", ".join(TIPOS_PERMITIDOS)}',
        'error': 'VALIDATION_ERROR',
        'field': 'tipo'
    }), 400
```

### 4. Validação de Formato de Data
```python
import re
from datetime import datetime

DATE_PATTERN = r'^\d{4}-\d{2}-\d{2}$'

def validar_data(data_str):
    if not re.match(DATE_PATTERN, data_str):
        return False
    try:
        datetime.strptime(data_str, '%Y-%m-%d')
        return True
    except ValueError:
        return False

# Exemplo de uso
if 'data_emissao' in dados and not validar_data(dados['data_emissao']):
    return jsonify({
        'message': 'Data de emissão inválida. Use o formato YYYY-MM-DD',
        'error': 'VALIDATION_ERROR',
        'field': 'data_emissao'
    }), 400
```

### 5. Validação de Valores Numéricos
```python
if 'valor_original' in dados:
    try:
        valor = float(dados['valor_original'])
        if valor <= 0:
            return jsonify({
                'message': 'Valor original deve ser maior que zero',
                'error': 'VALIDATION_ERROR',
                'field': 'valor_original'
            }), 400
    except (ValueError, TypeError):
        return jsonify({
            'message': 'Valor original deve ser um número válido',
            'error': 'VALIDATION_ERROR',
            'field': 'valor_original'
        }), 400
```

### 6. Validação de Relacionamentos
```python
# Validar cliente_id (apenas para contas a receber)
if 'cliente_id' in dados:
    if dados.get('tipo') != 'RECEBER' and dados.get('tipo') is None:
        # Verificar tipo da conta existente se não foi enviado
        if conta_financeira.tipo != 'RECEBER':
            return jsonify({
                'message': 'cliente_id só pode ser usado em contas a receber',
                'error': 'VALIDATION_ERROR',
                'field': 'cliente_id'
            }), 400
    
    # Verificar se cliente existe
    cliente = Cliente.query.get(dados['cliente_id'])
    if not cliente:
        return jsonify({
            'message': 'Cliente não encontrado',
            'error': 'VALIDATION_ERROR',
            'field': 'cliente_id'
        }), 400

# Validar fornecedor_id (apenas para contas a pagar)
if 'fornecedor_id' in dados:
    if dados.get('tipo') != 'PAGAR' and dados.get('tipo') is None:
        if conta_financeira.tipo != 'PAGAR':
            return jsonify({
                'message': 'fornecedor_id só pode ser usado em contas a pagar',
                'error': 'VALIDATION_ERROR',
                'field': 'fornecedor_id'
            }), 400
    
    # Verificar se fornecedor existe
    fornecedor = Fornecedor.query.get(dados['fornecedor_id'])
    if not fornecedor:
        return jsonify({
            'message': 'Fornecedor não encontrado',
            'error': 'VALIDATION_ERROR',
            'field': 'fornecedor_id'
        }), 400
```

### 7. Validação de Forma de Pagamento
```python
FORMAS_PAGAMENTO = [
    'DINHEIRO',
    'PIX',
    'CARTAO_CREDITO',
    'CARTAO_DEBITO',
    'BOLETO',
    'TRANSFERENCIA'
]

if 'forma_pagamento' in dados and dados['forma_pagamento'] not in FORMAS_PAGAMENTO:
    return jsonify({
        'message': f'Forma de pagamento inválida. Valores permitidos: {", ".join(FORMAS_PAGAMENTO)}',
        'error': 'VALIDATION_ERROR',
        'field': 'forma_pagamento'
    }), 400
```

---

## Status Permitidos

### Valores de Status

| Status | Descrição | Quando Usar |
|--------|-----------|-------------|
| `PENDENTE` | Conta criada mas ainda não paga | Status inicial de novas contas |
| `PAGO_PARCIAL` | Conta parcialmente paga | Quando `valor_pago` < `valor_original` |
| `PAGO_TOTAL` | Conta totalmente paga | Quando `valor_pago` >= `valor_original` |
| `VENCIDO` | Conta vencida sem pagamento | Quando `data_vencimento` < hoje e status não é pago |
| `CANCELADO` | Conta cancelada | Quando a conta não será mais processada |

### Regras de Transição de Status

O backend deve validar transições lógicas de status:

```python
def validar_transicao_status(status_atual, novo_status):
    """
    Valida se a transição de status é permitida
    """
    transicoes_permitidas = {
        'PENDENTE': ['PAGO_PARCIAL', 'PAGO_TOTAL', 'VENCIDO', 'CANCELADO'],
        'PAGO_PARCIAL': ['PAGO_TOTAL', 'CANCELADO'],
        'PAGO_TOTAL': ['CANCELADO'],  # Raramente, mas possível
        'VENCIDO': ['PAGO_PARCIAL', 'PAGO_TOTAL', 'CANCELADO'],
        'CANCELADO': []  # Não pode sair de cancelado
    }
    
    if status_atual == novo_status:
        return True  # Manter o mesmo status é válido
    
    if status_atual in transicoes_permitidas:
        return novo_status in transicoes_permitidas[status_atual]
    
    return False
```

---

## Formato de Resposta

### Resposta de Sucesso (200 OK)

```json
{
  "id": 9,
  "numero_conta": "CONTA-0009",
  "tipo": "RECEBER",
  "cliente_id": 5,
  "fornecedor_id": null,
  "pedido_id": 12,
  "descricao": "Recebimento de venda",
  "valor_original": 1500.00,
  "valor_pago": 1500.00,
  "valor_restante": 0.00,
  "data_emissao": "2024-12-01",
  "data_vencimento": "2024-12-15",
  "data_pagamento": "2024-12-15",
  "status": "PAGO_TOTAL",
  "forma_pagamento": "PIX",
  "numero_parcela": 1,
  "total_parcelas": 1,
  "parcela_texto": "1/1",
  "observacoes": "Pagamento recebido via PIX",
  "created_at": "2024-12-01T10:00:00Z",
  "updated_at": "2024-12-15T14:30:00Z",
  "dias_ate_vencimento": 0,
  "status_vencimento": "Pago",
  "proximidade_vencimento": null
}
```

### Campos Calculados na Resposta

Após atualizar a conta, o backend deve recalcular e retornar:

- `valor_pago`: Soma de todos os pagamentos registrados
- `valor_restante`: `valor_original - valor_pago`
- `dias_ate_vencimento`: Diferença em dias entre hoje e `data_vencimento`
- `status_vencimento`: Texto descritivo do status de vencimento
- `proximidade_vencimento`: Categoria de proximidade (`VENCIDA`, `VENCE_HOJE`, `CRITICO`, `ATENCAO`, `NORMAL`, `LONGO_PRAZO`)
- `updated_at`: Timestamp da última atualização

---

## Tratamento de Erros

### Erro 400 - Bad Request (Validação)

```json
{
  "message": "Status inválido. Valores permitidos: PENDENTE, PAGO_PARCIAL, PAGO_TOTAL, VENCIDO, CANCELADO",
  "error": "VALIDATION_ERROR",
  "field": "status",
  "allowed_values": ["PENDENTE", "PAGO_PARCIAL", "PAGO_TOTAL", "VENCIDO", "CANCELADO"]
}
```

### Erro 404 - Not Found

```json
{
  "message": "Conta financeira não encontrada",
  "error": "NOT_FOUND"
}
```

### Erro 422 - Unprocessable Entity (Validação de Negócio)

```json
{
  "message": "Não é possível alterar o tipo de uma conta existente",
  "error": "BUSINESS_RULE_VIOLATION",
  "field": "tipo"
}
```

### Erro 500 - Internal Server Error

```json
{
  "message": "Erro interno do servidor",
  "error": "INTERNAL_ERROR"
}
```

**IMPORTANTE**: Em produção, não exponha detalhes técnicos do erro 500. Em desenvolvimento, pode incluir mais informações.

---

## Exemplos Práticos

### Exemplo 1: Atualizar Apenas o Status

**Requisição:**
```http
PATCH /api/v1/contas-financeiras/9
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "PAGO_TOTAL"
}
```

**Resposta:**
```json
{
  "id": 9,
  "status": "PAGO_TOTAL",
  "valor_pago": 1500.00,
  "valor_restante": 0.00,
  "data_pagamento": "2024-12-15",
  ...
}
```

### Exemplo 2: Atualizar Status e Data de Pagamento

**Requisição:**
```http
PATCH /api/v1/contas-financeiras/9
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "PAGO_TOTAL",
  "data_pagamento": "2024-12-15",
  "forma_pagamento": "PIX"
}
```

**Resposta:**
```json
{
  "id": 9,
  "status": "PAGO_TOTAL",
  "data_pagamento": "2024-12-15",
  "forma_pagamento": "PIX",
  "valor_pago": 1500.00,
  "valor_restante": 0.00,
  ...
}
```

### Exemplo 3: Atualizar Múltiplos Campos

**Requisição:**
```http
PATCH /api/v1/contas-financeiras/9
Authorization: Bearer {token}
Content-Type: application/json

{
  "descricao": "Recebimento de venda atualizado",
  "valor_original": 2000.00,
  "data_vencimento": "2024-12-20",
  "observacoes": "Valor ajustado após negociação"
}
```

**Resposta:**
```json
{
  "id": 9,
  "descricao": "Recebimento de venda atualizado",
  "valor_original": 2000.00,
  "data_vencimento": "2024-12-20",
  "observacoes": "Valor ajustado após negociação",
  "valor_restante": 2000.00,
  "dias_ate_vencimento": 5,
  ...
}
```

### Exemplo 4: Atualizar Status para Pago Parcial

**Requisição:**
```http
PATCH /api/v1/contas-financeiras/9
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "PAGO_PARCIAL"
}
```

**Nota**: O backend deve validar se existe um registro de pagamento parcial. Se não existir, pode retornar erro ou criar automaticamente.

---

## Regras de Negócio

### 1. Cálculo Automático de Valores

Quando o status é atualizado, o backend deve recalcular:

```python
def recalcular_valores(conta_financeira):
    """
    Recalcula valores_pago e valor_restante baseado nos pagamentos registrados
    """
    # Buscar todos os pagamentos da conta
    pagamentos = Pagamento.query.filter_by(conta_financeira_id=conta_financeira.id).all()
    
    valor_pago_total = sum(p.valor for p in pagamentos)
    
    conta_financeira.valor_pago = valor_pago_total
    conta_financeira.valor_restante = conta_financeira.valor_original - valor_pago_total
    
    # Atualizar status baseado nos valores
    if conta_financeira.status != 'CANCELADO':
        if valor_pago_total >= conta_financeira.valor_original:
            conta_financeira.status = 'PAGO_TOTAL'
        elif valor_pago_total > 0:
            conta_financeira.status = 'PAGO_PARCIAL'
        else:
            # Verificar se está vencida
            hoje = datetime.now().date()
            if conta_financeira.data_vencimento < hoje:
                conta_financeira.status = 'VENCIDO'
            else:
                conta_financeira.status = 'PENDENTE'
```

### 2. Atualização de Status de Vencimento

O backend deve recalcular os campos de vencimento após qualquer atualização:

```python
def calcular_status_vencimento(conta_financeira):
    """
    Calcula dias_ate_vencimento, status_vencimento e proximidade_vencimento
    """
    if conta_financeira.status in ['PAGO_TOTAL', 'CANCELADO']:
        conta_financeira.dias_ate_vencimento = None
        conta_financeira.status_vencimento = None
        conta_financeira.proximidade_vencimento = None
        return
    
    hoje = datetime.now().date()
    vencimento = datetime.strptime(conta_financeira.data_vencimento, '%Y-%m-%d').date()
    dias = (vencimento - hoje).days
    
    conta_financeira.dias_ate_vencimento = dias
    
    if dias < 0:
        conta_financeira.status_vencimento = f"Vencida há {abs(dias)} {'dia' if abs(dias) == 1 else 'dias'}"
        conta_financeira.proximidade_vencimento = 'VENCIDA'
    elif dias == 0:
        conta_financeira.status_vencimento = "Vence hoje"
        conta_financeira.proximidade_vencimento = 'VENCE_HOJE'
    elif dias <= 3:
        conta_financeira.status_vencimento = f"Vence em {dias} {'dia' if dias == 1 else 'dias'}"
        conta_financeira.proximidade_vencimento = 'CRITICO'
    elif dias <= 7:
        conta_financeira.status_vencimento = f"Vence em {dias} dias"
        conta_financeira.proximidade_vencimento = 'ATENCAO'
    elif dias <= 30:
        conta_financeira.status_vencimento = f"Vence em {dias} dias"
        conta_financeira.proximidade_vencimento = 'NORMAL'
    else:
        conta_financeira.status_vencimento = f"Vence em {dias} dias"
        conta_financeira.proximidade_vencimento = 'LONGO_PRAZO'
```

### 3. Validação de Tipo de Conta

- Contas do tipo `RECEBER` devem ter `cliente_id` (não podem ter `fornecedor_id`)
- Contas do tipo `PAGAR` devem ter `fornecedor_id` (não podem ter `cliente_id`)

### 4. Atualização de Timestamp

O campo `updated_at` deve ser atualizado automaticamente sempre que a conta for modificada.

---

## Considerações Importantes

### 1. Campos Não Enviados

O frontend **NÃO envia** campos `undefined`, `null` ou strings vazias. O backend deve:

- **Ignorar campos não presentes** no payload
- **Manter valores existentes** para campos não enviados
- **Não tratar campos ausentes como erro**

### 2. Payload Mínimo

O frontend sempre envia pelo menos um campo. Se nenhum campo válido for enviado, o frontend retorna erro antes de fazer a requisição.

### 3. Case Sensitivity

- Status e tipos devem ser aceitos em **MAIÚSCULAS** (padrão)
- O backend pode aceitar minúsculas e converter, mas o padrão é maiúsculas

### 4. Formato de Datas

- **Sempre** formato ISO: `YYYY-MM-DD`
- **Não aceitar** outros formatos como `DD/MM/YYYY` ou timestamps
- **Validar** que a data é válida (não 31 de fevereiro, etc.)

### 5. Validação de Relacionamentos

- Verificar se `cliente_id`, `fornecedor_id` e `pedido_id` existem antes de atualizar
- Retornar erro 400 se relacionamento não existir
- Não permitir alterar `tipo` de uma conta existente (regra de negócio)

### 6. Performance

- Recalcular campos derivados apenas quando necessário
- Usar transações de banco de dados para garantir consistência
- Atualizar índices se necessário (ex: para busca por status)

### 7. Logging

Em desenvolvimento, o backend deve logar:
- Payload recebido
- Validações realizadas
- Campos atualizados
- Erros encontrados

### 8. Segurança

- Validar permissões do usuário antes de permitir atualização
- Verificar se o usuário tem acesso à conta (se aplicável)
- Sanitizar inputs para prevenir SQL injection
- Validar tipos de dados antes de processar

---

## Checklist de Implementação

- [ ] Endpoint PATCH `/api/v1/contas-financeiras/{id}` implementado
- [ ] Validação de ID da conta
- [ ] Validação de campos obrigatórios (quando aplicável)
- [ ] Validação de formato de datas
- [ ] Validação de status permitidos
- [ ] Validação de tipo (RECEBER/PAGAR)
- [ ] Validação de relacionamentos (cliente_id, fornecedor_id, pedido_id)
- [ ] Validação de valores numéricos
- [ ] Validação de forma de pagamento
- [ ] Cálculo automático de `valor_pago` e `valor_restante`
- [ ] Cálculo automático de campos de vencimento
- [ ] Atualização automática de `updated_at`
- [ ] Tratamento de erros com mensagens claras
- [ ] Resposta com todos os campos calculados
- [ ] Logging adequado
- [ ] Testes unitários
- [ ] Testes de integração

---

## Exemplo de Implementação (Pseudocódigo)

```python
@route('/api/v1/contas-financeiras/<int:id>', methods=['PATCH'])
@require_auth
def atualizar_conta_financeira(id):
    """
    Atualiza parcialmente uma conta financeira
    """
    # 1. Buscar conta
    conta = ContaFinanceira.query.get(id)
    if not conta:
        return jsonify({
            'message': 'Conta financeira não encontrada',
            'error': 'NOT_FOUND'
        }), 404
    
    # 2. Obter dados do body
    dados = request.get_json()
    if not dados:
        return jsonify({
            'message': 'Body da requisição vazio',
            'error': 'VALIDATION_ERROR'
        }), 400
    
    # 3. Validar campos
    erros = []
    
    # Validar status
    if 'status' in dados:
        if dados['status'] not in STATUS_PERMITIDOS:
            erros.append({
                'field': 'status',
                'message': f'Status inválido. Valores permitidos: {", ".join(STATUS_PERMITIDOS)}'
            })
    
    # Validar datas
    campos_data = ['data_emissao', 'data_vencimento', 'data_pagamento']
    for campo in campos_data:
        if campo in dados and not validar_data(dados[campo]):
            erros.append({
                'field': campo,
                'message': f'{campo} deve estar no formato YYYY-MM-DD'
            })
    
    if erros:
        return jsonify({
            'message': 'Erros de validação',
            'error': 'VALIDATION_ERROR',
            'errors': erros
        }), 400
    
    # 4. Atualizar campos
    campos_atualizados = []
    for campo, valor in dados.items():
        if campo in CAMPOS_PERMITIDOS_ATUALIZACAO:
            setattr(conta, campo, valor)
            campos_atualizados.append(campo)
    
    # 5. Recalcular campos derivados
    recalcular_valores(conta)
    calcular_status_vencimento(conta)
    conta.updated_at = datetime.utcnow()
    
    # 6. Salvar no banco
    try:
        db.session.commit()
        
        # 7. Retornar resposta
        return jsonify(conta.to_dict()), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f'Erro ao atualizar conta {id}: {str(e)}')
        return jsonify({
            'message': 'Erro ao atualizar conta financeira',
            'error': 'INTERNAL_ERROR'
        }), 500
```

---

## Conclusão

Este guia fornece todas as informações necessárias para implementar o endpoint de atualização de contas financeiras no backend. O frontend já está preparado para enviar os dados no formato correto, e o backend deve seguir estas especificações para garantir compatibilidade e funcionamento correto.

Para dúvidas ou esclarecimentos, consulte:
- `GUIA_CONTAS_PAGAR_RECEBER.md` - Guia completo do módulo frontend
- `src/services/financeiro.service.ts` - Implementação do serviço frontend
- `src/pages/ContasAPagar.tsx` - Implementação da página de contas a pagar
- `src/pages/ContasAReceber.tsx` - Implementação da página de contas a receber


