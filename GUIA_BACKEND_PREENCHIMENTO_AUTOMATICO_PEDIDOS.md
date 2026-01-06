# Guia Backend: Preenchimento Automático ao Selecionar Produto na Criação de Pedido

## ✅ Status: IMPLEMENTADO

O backend já implementou todas as mudanças necessárias conforme este guia. O frontend foi atualizado para trabalhar com o novo formato de resposta.

## Problema Identificado (RESOLVIDO)

Quando o frontend tenta selecionar um produto no formulário de criação de pedido, o produto não é encontrado ou não retorna o campo `preco_venda`, impedindo o preenchimento automático do preço e quantidade.

**Solução implementada pelo backend:**
- Retorno completo quando `limit >= 100` e `statusProduto=ATIVO`
- Filtro de produtos sem `preco_venda` válido
- Formato de resposta padronizado: `{ data: Produto[], total, page, limit }`

## Requisitos do Backend

### 1. Endpoint de Listagem de Produtos para Pedidos

**Endpoint:** `GET /api/v1/produtos`

**Parâmetros de Query:**
- `page` (opcional): Número da página (padrão: 1)
- `limit` (opcional): Itens por página (padrão: 15, recomendado: mínimo 100 para pedidos)
- `statusProduto` (opcional): Filtro por status (`ATIVO` ou `INATIVO`)

**Exemplo de Requisição:**
```
GET /api/v1/produtos?limit=100&statusProduto=ATIVO
```

### 2. Estrutura de Resposta Esperada

O backend **DEVE** retornar todos os produtos ativos disponíveis, não apenas uma página limitada. Para o formulário de pedidos funcionar corretamente, é necessário que **TODOS** os produtos ativos sejam retornados.

**Formato de Resposta:**

```json
{
  "data": [
    {
      "id": 1,
      "nome": "Produto 1",
      "sku": "SKU-001",
      "preco_venda": 2.50,
      "preco_custo": 1.50,
      "preco_promocional": null,
      "estoque_atual": 100,
      "estoque_minimo": 10,
      "statusProduto": "ATIVO",
      "unidade_medida": "UN"
    },
    {
      "id": 2,
      "nome": "Produto 2",
      "sku": "SKU-002",
      "preco_venda": 5.00,
      "preco_custo": 3.00,
      "preco_promocional": null,
      "estoque_atual": 50,
      "estoque_minimo": 5,
      "statusProduto": "ATIVO",
      "unidade_medida": "UN"
    },
    {
      "id": 3,
      "nome": "Produto 3",
      "sku": "SKU-003",
      "preco_venda": 10.00,
      "preco_custo": 7.00,
      "preco_promocional": 8.50,
      "estoque_atual": 25,
      "estoque_minimo": 3,
      "statusProduto": "ATIVO",
      "unidade_medida": "KG"
    }
  ],
  "total": 3,
  "page": 1,
  "limit": 100
}
```

**OU** pode retornar como array direto:

```json
[
  {
    "id": 1,
    "nome": "Produto 1",
    "sku": "SKU-001",
    "preco_venda": 2.50,
    ...
  },
  {
    "id": 2,
    "nome": "Produto 2",
    "sku": "SKU-002",
    "preco_venda": 5.00,
    ...
  }
]
```

### 3. Campos Obrigatórios na Resposta

O backend **DEVE** incluir os seguintes campos para cada produto:

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | number | ✅ Sim | ID único do produto |
| `nome` | string | ✅ Sim | Nome do produto |
| `sku` | string | ✅ Sim | Código SKU do produto |
| `preco_venda` | number | ✅ Sim | **Preço de venda do produto (usado para preenchimento automático)** |
| `preco_custo` | number | ✅ Sim | Preço de custo |
| `statusProduto` | string | ✅ Sim | Status do produto (`ATIVO` ou `INATIVO`) |
| `unidade_medida` | string | ✅ Sim | Unidade de medida (`UN`, `KG`, `LT`, `CX`) |
| `estoque_atual` | number | ✅ Sim | Quantidade em estoque |
| `preco_promocional` | number/null | ❌ Não | Preço promocional (opcional) |

### 4. Comportamento Esperado

#### 4.1. Quando `limit` é maior que o total de produtos

Se o frontend solicitar `limit=100` mas houver apenas 10 produtos ativos, o backend deve retornar **todos os 10 produtos**, não apenas uma página limitada.

**Exemplo:**
- Total de produtos ativos: 10
- Requisição: `GET /api/v1/produtos?limit=100&statusProduto=ATIVO`
- Resposta esperada: **Todos os 10 produtos**, não apenas os primeiros 15

#### 4.2. Campo `preco_venda` nunca deve ser null ou undefined

O campo `preco_venda` **SEMPRE** deve ter um valor numérico válido (maior que 0) para produtos ativos. Se um produto não tiver preço cadastrado, ele não deve aparecer na listagem de produtos ativos para pedidos.

**Valores inválidos:**
- `null`
- `undefined`
- `0`
- String vazia `""`

**Valores válidos:**
- `2.50`
- `10.00`
- `100`

### 5. Tratamento de Erros

Se houver algum erro ao buscar produtos, o backend deve retornar:

```json
{
  "error": "Mensagem de erro",
  "data": [],
  "total": 0
}
```

**NUNCA** retornar `null` ou `undefined` no campo `data`. Sempre retornar um array vazio `[]`.

### 6. Paginação

Para o formulário de pedidos, o frontend solicita `limit=100` para obter uma lista maior de produtos. O backend deve:

1. **Respeitar o limite solicitado** quando possível
2. **Retornar todos os produtos disponíveis** se o total for menor que o limite
3. **Não aplicar paginação rígida** quando o limite solicitado for alto (ex: 100+)

**Exemplo de Comportamento:**

```
Total de produtos ativos: 150
Requisição: GET /api/v1/produtos?limit=100&statusProduto=ATIVO

Resposta esperada:
- Retornar os primeiros 100 produtos
- Incluir `total: 150` na resposta
- Frontend pode fazer requisições adicionais se necessário
```

**OU** (preferível para pedidos):

```
Total de produtos ativos: 150
Requisição: GET /api/v1/produtos?limit=1000&statusProduto=ATIVO

Resposta esperada:
- Retornar TODOS os 150 produtos (ignorar paginação quando limite é muito alto)
- Incluir `total: 150` na resposta
```

## Checklist de Implementação

- [ ] Endpoint `/api/v1/produtos` retorna todos os produtos quando `limit` é alto (100+)
- [ ] Campo `preco_venda` está sempre presente e nunca é `null` ou `undefined`
- [ ] Campo `preco_venda` é sempre um número válido (maior que 0)
- [ ] Produtos inativos não aparecem quando `statusProduto=ATIVO`
- [ ] Resposta sempre inclui array `data` (mesmo que vazio)
- [ ] Campo `total` reflete o número real de produtos disponíveis
- [ ] Todos os campos obrigatórios estão presentes na resposta

## Exemplo de Implementação (Pseudocódigo)

```python
def listar_produtos(page=1, limit=15, statusProduto=None):
    # Buscar produtos
    query = Produto.query
    
    # Filtrar por status se fornecido
    if statusProduto:
        query = query.filter(Produto.statusProduto == statusProduto)
    
    # Se limite for alto (>= 100), retornar todos os produtos ativos
    # Isso é importante para o formulário de pedidos
    if limit >= 100 and statusProduto == 'ATIVO':
        produtos = query.all()
        total = len(produtos)
    else:
        # Aplicar paginação normal
        offset = (page - 1) * limit
        produtos = query.offset(offset).limit(limit).all()
        total = query.count()
    
    # Validar que todos os produtos têm preco_venda
    produtos_validos = []
    for produto in produtos:
        # Garantir que preco_venda existe e é válido
        if produto.preco_venda and produto.preco_venda > 0:
            produtos_validos.append({
                'id': produto.id,
                'nome': produto.nome,
                'sku': produto.sku,
                'preco_venda': float(produto.preco_venda),  # Garantir que é número
                'preco_custo': float(produto.preco_custo),
                'preco_promocional': float(produto.preco_promocional) if produto.preco_promocional else None,
                'estoque_atual': produto.estoque_atual,
                'estoque_minimo': produto.estoque_minimo,
                'statusProduto': produto.statusProduto,
                'unidade_medida': produto.unidade_medida
            })
    
    return {
        'data': produtos_validos,
        'total': len(produtos_validos),
        'page': page,
        'limit': limit
    }
```

## Testes Recomendados

1. **Teste de Listagem Completa:**
   ```bash
   GET /api/v1/produtos?limit=100&statusProduto=ATIVO
   ```
   Verificar se retorna todos os produtos ativos disponíveis.

2. **Teste de Preço Obrigatório:**
   Verificar se todos os produtos retornados têm `preco_venda > 0`.

3. **Teste de Produto Específico:**
   ```bash
   GET /api/v1/produtos?limit=100&statusProduto=ATIVO
   ```
   Verificar se o produto com ID 3 (ou qualquer ID) está presente na resposta.

4. **Teste de Resposta Vazia:**
   Se não houver produtos, verificar se retorna `{"data": [], "total": 0}` e não `null` ou erro.

## Notas Importantes

1. **Performance:** Se houver muitos produtos (1000+), considere implementar busca/filtro no frontend ou usar um endpoint específico para autocomplete.

2. **Cache:** O frontend faz cache dos produtos por alguns minutos. Se um produto for atualizado no backend, pode levar alguns minutos para aparecer no frontend.

3. **Validação:** O backend deve validar que produtos ativos sempre tenham `preco_venda` cadastrado antes de permitir ativação.

4. **Compatibilidade:** O frontend aceita tanto resposta com `data` quanto array direto, mas prefere formato com `data` para consistência.

## ✅ Implementação Concluída

### Mudanças Implementadas pelo Backend

1. **Modificação do método `listarProdutos`** (`src/produto/service/produto.service.ts`):
   - ✅ Retorno completo quando `limit >= 100` e `statusProduto=ATIVO`
   - ✅ Retorna todos os produtos ativos, sem paginação
   - ✅ Filtro de produtos sem `preco_venda` válido (exclui produtos com `preco_venda <= 0` ou `null`)
   - ✅ Formato de resposta padronizado: `{ data: Produto[], total, page, limit }`
   - ✅ Garantia de tipos numéricos para `preco_venda`

2. **Modificação do controller** (`src/produto/controller/produto.controller.ts`):
   - ✅ Tipo de retorno atualizado para objeto com `data`, `total`, `page`, `limit`
   - ✅ Tratamento de erros melhorado (retorna formato consistente mesmo em erro)

3. **Validações implementadas**:
   - ✅ Filtro SQL: `WHERE p.preco_venda > 0`
   - ✅ Validação JavaScript: filtra produtos sem preço válido
   - ✅ Conversão garantida: `Number(produto.preco_venda) || 0`

### Mudanças Implementadas pelo Frontend

1. **Atualização do hook `useOrders.ts`**:
   - ✅ Prioriza o campo `data` do novo formato
   - ✅ Mantém compatibilidade com formatos antigos (fallback)
   - ✅ Valida produtos com `preco_venda` válido
   - ✅ Logs de debug melhorados

2. **Atualização das páginas**:
   - ✅ `src/pages/Produtos.tsx` - Prioriza campo `data`
   - ✅ `src/pages/Estoque.tsx` - Prioriza campo `data`
   - ✅ Mantém compatibilidade com formatos antigos

3. **Formulário de Pedidos** (`src/components/orders/OrderForm.tsx`):
   - ✅ Preenchimento automático de preço ao selecionar produto
   - ✅ Preenchimento automático de quantidade (padrão: 1)
   - ✅ Cálculo automático de subtotal
   - ✅ Mensagens de erro quando produto não é encontrado

### Comportamento Atual

- ✅ Quando `limit >= 100` e `statusProduto=ATIVO`: Retorna todos os produtos ativos disponíveis
- ✅ Produtos sem `preco_venda` válido: Automaticamente excluídos da listagem
- ✅ Formato de resposta: `{ data: Produto[], total: number, page: number, limit: number }`
- ✅ Preenchimento automático: Ao selecionar produto, preço e quantidade são preenchidos automaticamente

### Breaking Change

⚠️ **ATENÇÃO**: O formato de resposta do endpoint `GET /api/v1/produtos` mudou de `Produto[]` para `{ data: Produto[], total: number, page: number, limit: number }`.

O frontend foi atualizado para trabalhar com o novo formato, mas se houver outros consumidores diretos da API, eles precisarão ser atualizados para acessar `response.data` ao invés de `response` diretamente.

## Contato

Se houver dúvidas sobre este guia ou problemas na implementação, verifique os logs do console do navegador (F12) que mostram exatamente quais dados estão sendo retornados pelo backend.


