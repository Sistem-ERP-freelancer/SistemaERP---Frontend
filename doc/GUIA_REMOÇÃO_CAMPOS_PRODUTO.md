# Guia: Remoção de Campos Opcionais na Edição de Produto

## Visão Geral

Este documento descreve como o **frontend** comunica ao **backend** quando um usuário remove dados de um campo opcional que estava preenchido durante a edição de um produto.

## Problema Identificado

Atualmente, quando um usuário edita um produto e remove o conteúdo de um campo opcional (como `descricao`, `observacoes`, `ncm`, etc.), o frontend não envia esse campo no payload da requisição de atualização. Isso faz com que o backend mantenha o valor antigo, já que campos não enviados não são atualizados.

## Solução Implementada

O frontend agora compara os valores originais do produto com os valores editados e envia explicitamente `null` ou string vazia (`""`) quando um campo opcional foi removido pelo usuário.

## Comportamento Esperado pelo Backend

### Campos de Texto (string)

Para campos opcionais do tipo `string`, o backend deve interpretar:

- **Campo não enviado**: Não atualizar o campo (manter valor atual)
- **Campo enviado com `null`**: Limpar o campo (definir como `null` no banco)
- **Campo enviado com string vazia `""`**: Limpar o campo (definir como `null` ou string vazia, conforme preferência do backend)
- **Campo enviado com valor**: Atualizar com o novo valor

**Campos afetados:**
- `descricao`
- `ncm`
- `cest`
- `cfop`
- `observacoes`
- `localizacao`
- `data_validade` (quando removida)

### Campos Numéricos (number)

Para campos opcionais do tipo `number`, o backend deve interpretar:

- **Campo não enviado**: Não atualizar o campo (manter valor atual)
- **Campo enviado com `null`**: Limpar o campo (definir como `null` no banco)
- **Campo enviado com valor numérico**: Atualizar com o novo valor

**Campos afetados:**
- `preco_promocional`
- `peso`
- `altura`
- `largura`
- `estoque_maximo`

### Campos de Relacionamento (number | null)

Para campos de relacionamento opcionais:

- **Campo não enviado**: Não atualizar o campo (manter valor atual)
- **Campo enviado com `null`**: Remover o relacionamento (definir como `null`)
- **Campo enviado com número**: Atualizar com o novo ID

**Campos afetados:**
- `categoriaId`
- `fornecedorId`

## Exemplos de Payloads

### Exemplo 1: Removendo descrição de um produto

**Situação:** Produto tem `descricao: "Produto de alta qualidade"` e usuário remove o texto.

**Payload enviado:**
```json
{
  "nome": "Produto Exemplo",
  "sku": "PROD-001",
  "preco_custo": 100.00,
  "preco_venda": 150.00,
  "descricao": null
}
```

**Comportamento esperado:** Backend deve definir `descricao` como `null` no banco de dados.

---

### Exemplo 2: Removendo preço promocional

**Situação:** Produto tem `preco_promocional: 120.00` e usuário remove o valor.

**Payload enviado:**
```json
{
  "nome": "Produto Exemplo",
  "sku": "PROD-001",
  "preco_custo": 100.00,
  "preco_venda": 150.00,
  "preco_promocional": null
}
```

**Comportamento esperado:** Backend deve definir `preco_promocional` como `null` no banco de dados.

---

### Exemplo 3: Removendo múltiplos campos opcionais

**Situação:** Produto tem vários campos opcionais preenchidos e usuário remove alguns.

**Payload enviado:**
```json
{
  "nome": "Produto Exemplo",
  "sku": "PROD-001",
  "preco_custo": 100.00,
  "preco_venda": 150.00,
  "descricao": null,
  "ncm": null,
  "observacoes": null,
  "peso": null,
  "altura": null,
  "largura": null,
  "preco_promocional": 120.00
}
```

**Comportamento esperado:** 
- Backend deve limpar (`null`) os campos: `descricao`, `ncm`, `observacoes`, `peso`, `altura`, `largura`
- Backend deve manter/atualizar `preco_promocional` com `120.00`

---

### Exemplo 4: Removendo categoria

**Situação:** Produto tem `categoriaId: 5` e usuário remove a categoria selecionada.

**Payload enviado:**
```json
{
  "nome": "Produto Exemplo",
  "sku": "PROD-001",
  "preco_custo": 100.00,
  "preco_venda": 150.00,
  "categoriaId": null
}
```

**Comportamento esperado:** Backend deve definir `categoriaId` como `null` no banco de dados, removendo o relacionamento.

---

### Exemplo 5: Atualizando sem remover campos

**Situação:** Produto tem vários campos opcionais preenchidos e usuário apenas atualiza campos obrigatórios.

**Payload enviado:**
```json
{
  "nome": "Produto Atualizado",
  "sku": "PROD-001",
  "preco_custo": 110.00,
  "preco_venda": 160.00
}
```

**Comportamento esperado:** Backend deve atualizar apenas os campos enviados (`nome`, `preco_custo`, `preco_venda`) e manter todos os campos opcionais existentes inalterados.

---

## Lógica de Detecção no Frontend

O frontend implementa a seguinte lógica para detectar remoções:

1. **Armazena valores originais** quando o diálogo de edição é aberto
2. **Compara valores originais com valores editados** antes de enviar
3. **Identifica campos que foram removidos** (tinham valor, agora estão vazios/null)
4. **Inclui explicitamente no payload** campos removidos com valor `null`

### Pseudocódigo da Lógica

```typescript
// Para cada campo opcional
if (campo tinha valor originalmente && campo está vazio/null agora) {
  // Campo foi removido - enviar null
  payload[campo] = null;
} else if (campo tem novo valor) {
  // Campo foi atualizado - enviar novo valor
  payload[campo] = novoValor;
}
// Se campo não foi modificado, não incluir no payload
```

## Campos Obrigatórios

Os seguintes campos são **sempre enviados** e **nunca podem ser removidos**:

- `nome` (string, obrigatório)
- `sku` (string, obrigatório)
- `preco_custo` (number, obrigatório)
- `preco_venda` (number, obrigatório)
- `estoque_atual` (number, obrigatório)
- `estoque_minimo` (number, obrigatório)
- `unidade_medida` (enum, obrigatório)
- `statusProduto` (enum, obrigatório)
- `categoriaId` (number, obrigatório - não pode ser null)
- `fornecedorId` (number, obrigatório - não pode ser null)

## Validações Recomendadas no Backend

1. **Validar tipos**: Garantir que campos enviados como `null` sejam do tipo correto
2. **Validar constraints**: Se algum campo opcional tem constraints (ex: tamanho máximo), validar mesmo quando `null`
3. **Tratamento de strings vazias**: Decidir se `""` e `null` devem ser tratados da mesma forma
4. **Logs**: Registrar quando campos são limpos para auditoria

## Endpoint Afetado

- **PATCH** `/produtos/:id`

## Notas Importantes

1. **Compatibilidade retroativa**: O backend deve continuar funcionando mesmo se receber requisições sem campos opcionais (comportamento atual)

2. **Campos não modificados**: Campos que não foram modificados pelo usuário **não devem ser enviados** no payload

3. **Campos modificados para vazio**: Campos que foram modificados para vazio/null **devem ser enviados explicitamente** com valor `null`

4. **Performance**: O payload pode incluir vários campos `null` quando o usuário remove múltiplos campos, isso é esperado e não deve causar problemas

## Checklist de Implementação no Backend

- [ ] Validar que campos `null` são aceitos para campos opcionais
- [ ] Implementar lógica para limpar campos quando receber `null`
- [ ] Garantir que campos não enviados não sejam atualizados
- [ ] Testar cenários de remoção de campos individuais
- [ ] Testar cenários de remoção de múltiplos campos
- [ ] Testar cenários de atualização sem remover campos
- [ ] Validar tratamento de strings vazias vs `null`
- [ ] Adicionar logs para auditoria de remoções

## Contato e Suporte

Em caso de dúvidas sobre a implementação deste comportamento, consulte o código-fonte do frontend em:
- `src/pages/Produtos.tsx` - Função `handleUpdate()`
- `src/services/produtos.service.ts` - Interface `CreateProdutoDto`

