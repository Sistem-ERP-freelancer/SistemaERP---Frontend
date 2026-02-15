# Guia de Migração — Modelo sem Parcelas (Frontend)

**Data:** 2026-02-12  
**Objetivo:** Migrar o frontend para o modelo baseado em `pedido` e `conta_financeira` (1 conta por pedido), removendo a dependência de `tb_parcela_pedido` e `parcela_id`.

---

## Alterações Implementadas no Frontend

### 1. `pagamentos.service.ts`

- **CreatePagamentoDto:** `parcela_id` → `pedido_id` + `conta_financeira_id?`
- **Pagamento:** `parcela_id` → `pedido_id` + `conta_financeira_id?`
- **Removido:** `listarPorParcela(parcelaId)` 
- **Adicionado:** `listarPorPedido(pedidoId)` — usa `GET /pagamentos?pedido_id=X`
- **Removido:** `recalcularParcela(parcelaId)`

### 2. `ContasAReceberPedidoPagamentos.tsx`

- **Removido:** toda lógica de seleção de parcela
- **Novo fluxo:** formulário simples com valor, data e forma de pagamento
- **Payload:** `{ pedido_id, conta_financeira_id?, valor_pago, forma_pagamento, data_lancamento, data_pagamento, observacoes }`
- Permite pagamento parcial (valor ≤ valor_em_aberto)

### 3. `HistoricoPagamentosPedido.tsx` (novo)

- Substitui `HistoricoPagamentosParcela`
- Usa `listarPorPedido(pedidoId)` em vez de `listarPorParcela`
- Props: `pedidoId` em vez de `parcelaId` e `parcelaLabel`

### 4. `PedidoFinanceiroResumo.tsx` (novo)

- Substitui `ParcelasPedido` no `OrderViewDialog`
- Mostra resumo financeiro (valor_total, valor_pago, valor_em_aberto)
- Botão "Registrar Pagamento" → `/financeiro/contas-receber/:pedidoId/pagamentos`
- Exibe `HistoricoPagamentosPedido`

### 5. `OrderViewDialog.tsx`

- `ParcelasPedido` substituído por `PedidoFinanceiroResumo`

### 6. `financeiro.service.ts`

- Removidos `numero_parcela`, `total_parcelas`, `parcela_texto` de `ContaFinanceira` e `CreateContaFinanceiraDto`
- Removidos do payload de atualização

---

## O que o Backend precisa implementar

### API de Pagamentos

1. **POST /pagamentos** — aceitar:
   ```json
   {
     "pedido_id": number,
     "conta_financeira_id": number (opcional),
     "valor_pago": number,
     "forma_pagamento": string,
     "data_lancamento": string,
     "data_pagamento": string,
     "observacoes": string (opcional)
   }
   ```
   - Remover `parcela_id` do payload

2. **GET /pagamentos?pedido_id=X** — listar pagamentos por pedido  
   - Substituir `GET /pagamentos/parcela/:parcelaId`

3. **Remover:**
   - `GET /pagamentos/parcela/:id`
   - `PATCH /pagamentos/parcela/:id/recalcular`

### GET /pedidos/:id/financeiro

- Retornar `{ pedido, conta_financeira?, resumo_financeiro }`
- `conta_financeira` opcional (1 conta por pedido)
- `resumo_financeiro`: `{ valor_total, valor_pago, valor_em_aberto }`
- Campo `parcelas` pode ser removido ou mantido vazio

---

## Componentes ainda com referência a parcelas

Estes arquivos ainda contêm código legado relacionado a parcelas e podem precisar de ajustes ou remoção conforme o backend migrar:

- `ParcelasChecklist.tsx` — não usado por `OrderViewDialog`; pode ser removido
- `ParcelasPedido.tsx` — substituído por `PedidoFinanceiroResumo`; pode ser removido
- `HistoricoPagamentosParcela.tsx` — substituído por `HistoricoPagamentosPedido`; pode ser removido
- `DarBaixaParcelaDialog.tsx` — usado por `ParcelasChecklist`; pode ser removido
- `useParcelasPedido.ts` — usado por `ParcelasPedido`; pode ser removido
- `ParcelasResumo.tsx` — usado por `ParcelasPedido`; pode ser removido

- `ContasAReceber.tsx` — ainda usa `numero_parcelas`, `parcela_texto` em formulários e formatação
- `ContasAReceberClienteDetalhes.tsx` — ainda mostra parcelas vindas do endpoint de detalhe
- `Dashboard.tsx` — formatação de `numero_parcela`/`total_parcelas`
- `lib/utils.ts` — `parseNumeroParcela`, `normalizarStatusParcela` (código legado)

---

## Fluxo de pagamento atual

1. Usuário acessa Contas a Receber e clica em "Registrar Pagamento" no menu (⋮).
2. Navega para `/financeiro/contas-receber/:pedidoId/pagamentos`.
3. Preenche valor, data e forma de pagamento.
4. Ao submeter, envia `POST /pagamentos` com `pedido_id` e `conta_financeira_id` (se disponível).
