# Guia — O que foi implementado (Guias Financeiro + Migração sem Parcelas)

**Data:** 2026-02-14  
**Referências:** `GUIA_IMPLEMENTACAO_FRONTEND_FINANCEIRO.md` e `GUIA_MIGRACAO_SEM_PARCELAS.md`

Este documento descreve **exatamente** o que foi implementado no frontend para alinhar ao modelo por **pedido** e **saldo** (sem parcelas) e aos novos endpoints de financeiro.

---

## 1. Tipos e contratos

### 1.1 Novo arquivo: `src/types/pedido-financeiro.types.ts`

- **StatusFinanceiro:** `'ABERTO' | 'PARCIAL' | 'QUITADO' | 'VENCIDO' | 'CANCELADO'`
- **ResumoFinanceiroPedido:** `valor_total`, `valor_pago`, `valor_em_aberto`, `status`, `data_vencimento` (contrato de GET `/pedidos/:id/financeiro`)
- **ItemHistoricoPagamento:** `id`, `valor`, `forma_pagamento`, `data_pagamento` (contrato de GET `/pedidos/:id/pagamentos`)
- **RegistrarPagamentoBody:** `valor`, `forma_pagamento`, `data_pagamento?` (contrato de POST `/pedidos/:id/pagamentos`)

### 1.2 Ajustes em `src/types/contas-financeiras.types.ts`

- **ContaReceber:** inclusão dos campos opcionais `valor_pago?: number` e `data_vencimento?: string | null` para listagem (1 linha por pedido) e uso dos valores do backend sem cálculo no front.

---

## 2. Serviços

### 2.1 `src/services/pedidos.service.ts`

- **getResumoFinanceiro(id):** GET `/pedidos/:id/financeiro`. Retorna `ResumoFinanceiroPedido`. Se o backend devolver a estrutura antiga (com `resumo_financeiro` ou `parcelas`), o resultado é normalizado para o novo contrato.
- **listarPagamentosPedido(pedidoId):** GET `/pedidos/:id/pagamentos`. Retorna `ItemHistoricoPagamento[]`. Em erro, retorna array vazio.
- **registrarPagamentoPedido(pedidoId, body):** POST `/pedidos/:id/pagamentos` com body `{ valor, forma_pagamento, data_pagamento? }`.
- **buscarPorIdComFinanceiro:** marcado como `@deprecated`; preferir `getResumoFinanceiro` + `listarPagamentosPedido`.

### 2.2 `src/services/financeiro.service.ts`

- **getDashboardUnificado():** GET `/financeiro/dashboard`. Retorna tipo `DashboardUnificado` (`contas_receber`, `contas_pagar`, `saldo_atual`).
- **listarContasReceberFinanceiro(params?):** GET `/financeiro/contas-receber` com query params opcionais. Retorna array de itens (1 por pedido) com `valor_pago`, `data_vencimento`, etc.
- **DashboardUnificado:** interface adicionada para a resposta do dashboard unificado.

---

## 3. Dashboard

### 3.1 `src/pages/Dashboard.tsx`

- **GET /financeiro/dashboard:** nova query `getDashboardUnificado()`. Quando a resposta existe, os cards usam apenas esses dados (Total a Receber, Total a Pagar, Total Recebido, Contas Vencidas), sem recalcular no front.
- **Fallback:** se o dashboard unificado não existir ou falhar, mantém o uso de `getDashboardReceber`, `getDashboardPagar`, `obterDashboard` (pedidos) e `getTotalRecebido`.
- **Contas vencidas:** remoção da formatação por “parcela” (numero_parcela/total_parcelas). A descrição exibida é apenas `conta.descricao` (modelo sem parcelas).

---

## 4. Página Financeiro

### 4.1 `src/pages/Financeiro.tsx`

- **Dashboard unificado:** tentativa de uso de `getDashboardUnificado()` para os cards de estatísticas; em caso de sucesso, usa `contas_receber` / `contas_pagar` e `saldo_atual`. Fallback para `getDashboardResumo()`.
- **Remoção de parcelas (GUIA_MIGRACAO_SEM_PARCELAS):**
  - Removida a seção “Parcelas” do formulário de **Nova Transação** (numero_parcela, total_parcelas, parcela_texto).
  - Removidos do payload de criação os campos `numero_parcela`, `total_parcelas`, `parcela_texto`.
  - Removida a seção “Parcelas” do formulário de **Edição** de conta e do preenchimento de `editConta` a partir de `contaSelecionada`.
  - Removido o bloco de visualização “Parcelas” (numero_parcela_atual, total_parcelas, texto_parcelas_quitadas) do modal de **Visualizar** conta.

---

## 5. Contas a Pagar

### 5.1 `src/pages/ContasAPagar.tsx`

- **Remoção de parcelas:** mesma lógica da página Financeiro:
  - Removida a seção “Parcelas” do formulário de nova conta e do formulário de edição.
  - Removidos `numero_parcela`, `total_parcelas`, `parcela_texto` do estado de edição e do payload de criação/atualização.

---

## 6. Contas a Receber

### 6.1 Listagem (1 linha = 1 pedido)

- **Tipo ContaReceber:** uso de `valor_pago` e `data_vencimento` quando o backend enviar.
- **Coluna “Total Pago”:** exibe `pedido.valor_pago` quando existir; caso contrário, mantém o cálculo `valor_total - valor_em_aberto` como fallback.
- **Coluna “Vencimento”:** nova coluna na tabela de pedidos, exibindo `data_vencimento` formatada (ou “—”) por linha.
- **colSpan:** ajuste para 10 colunas nos estados de carregamento e lista vazia.

### 6.2 Formulários e dialogs (modelo sem parcelas)

- **formatarDescricaoComParcela** substituída por **formatarDescricao(conta)** que retorna apenas `conta.descricao`.
- Removida a seção “Parcelas” do formulário de **Nova Conta a Receber** e os campos correspondentes do payload.
- Removidos `numero_parcela`, `total_parcelas`, `parcela_texto` do estado de edição e do payload de atualização.
- No modal de **Visualizar** conta, removido o bloco que exibia “Parcelado”, “Quantidade de Parcelas” e “Parcelas Pagas”.

---

## 7. Detalhes do pedido (contas a receber)

### 7.1 `src/pages/contas-a-receber/ContasAReceberPedidoDetalhes.tsx`

- **Fontes de dados (contrato novo):**
  - Pedido: `buscarPorId(pedidoId)`.
  - Resumo financeiro: `getResumoFinanceiro(pedidoId)`.
  - Histórico de pagamentos: `listarPagamentosPedido(pedidoId)`.
- **Fallback:** se `getResumoFinanceiro` ou `listarPagamentosPedido` falharem, usa `buscarPorIdComFinanceiro` e extrai `resumo_financeiro` e lista de pagamentos a partir de `parcelas[].pagamentos`.
- **Layout:**
  - Cards: Valor total, Total pago, Valor em aberto, Status financeiro e, se houver, Data de vencimento.
  - **Removida** a seção “Parcelas” (tabela de parcelas 1/N, vencimento, valor, status).
  - **Histórico de pagamentos:** uma única tabela com colunas Data, Valor, Forma (sem coluna “Parcela”), usando `ItemHistoricoPagamento` (data_pagamento, valor, forma_pagamento).

---

## 8. Registrar pagamento no pedido

### 8.1 `src/pages/contas-a-receber/ContasAReceberPedidoPagamentos.tsx`

- **Dados do resumo:** uso de `getResumoFinanceiro(pedidoId)` para valor em aberto e validação; fallback para `buscarPorIdComFinanceiro` quando o novo endpoint não existir.
- **Formulário:** Valor (sugestão = valor_em_aberto), Data de pagamento (opcional, default hoje), Forma de pagamento. Validação no front: valor > 0 e valor ≤ valor_em_aberto.
- **Submit (contrato novo):** POST `/pedidos/:id/pagamentos` via `registrarPagamentoPedido(pedidoId, { valor, forma_pagamento, data_pagamento })`.
- **Fallback:** em caso de 404 (ou 501), chama `pagamentosService.criar(...)` com `pedido_id`, `valor_pago`, `data_lancamento`, etc. (fluxo legado).
- **Pedido quitado:** quando status QUITADO ou valor_em_aberto ≤ 0, o formulário de pagamento não é exibido; é mostrada mensagem informando que o pedido já está quitado.
- **Inválidação de cache:** após sucesso, invalida queries de pedido, contas-receber e dashboard (incluindo `dashboard-unificado` quando aplicável).

---

## 9. Componentes de pedido (resumo e histórico)

### 9.1 `src/components/orders/PedidoFinanceiroResumo.tsx`

- **Fonte de dados:** preferência por `getResumoFinanceiro(pedidoId)` para o resumo (valor_total, valor_pago, valor_em_aberto).
- **Fallback:** em erro do novo endpoint, usa `buscarPorIdComFinanceiro` e extrai `resumo_financeiro`.
- Exibição dos 3 valores e do botão “Registrar Pagamento” (link para `/financeiro/contas-receber/:pedidoId/pagamentos`) e uso de `HistoricoPagamentosPedido` como antes.

### 9.2 `src/components/orders/HistoricoPagamentosPedido.tsx`

- **Fonte preferida:** `pedidosService.listarPagamentosPedido(pedidoId)` (GET `/pedidos/:id/pagamentos`). Resultado tratado como `ItemHistoricoPagamento[]` (valor, data_pagamento, forma_pagamento).
- **Fallback:** se o novo endpoint não retornar itens ou falhar, usa `pagamentosService.listarPorPedido(pedidoId)` e mapeia para o mesmo formato (valor_pago → valor, data_lancamento → data_pagamento).
- Tabela de histórico exibida com colunas Data, Forma, Valor, Status, usando `data_pagamento` e `valor` do item normalizado. Suporte a sublinha de cheques mantido quando o item legado tiver `cheques`.

---

## 10. Resumo do que NÃO foi alterado (ou foi mantido de forma compatível)

- **Rotas:** `/financeiro/contas-receber/:pedidoId` e `/financeiro/contas-receber/:pedidoId/pagamentos` já existiam e continuam iguais.
- **Listagem de contas a receber:** continua usando GET `/pedidos/contas-receber` (via `pedidosService.listarContasReceber`). O uso de GET `/financeiro/contas-receber` está disponível em `financeiroService.listarContasReceberFinanceiro()` para migração futura, se desejado.
- **pagamentos.service:** mantidos `listarPorPedido` e `criar` (POST `/pagamentos`) para fallback e outros fluxos.
- **contas-receber.service:** métodos legados (por cliente/parcela/duplicata) não foram removidos; podem ser descontinuados quando o backend deixar de expor esses contratos.
- **Componentes legados (ParcelasPedido, ParcelasChecklist, HistoricoPagamentosParcela, DarBaixaParcelaDialog, useParcelasPedido, ParcelasResumo):** não foram removidos; podem ser excluídos em uma etapa posterior quando não houver mais uso.

---

## 11. Checklist de integração (conforme guia)

- [x] Listagem: GET `/pedidos/contas-receber` (ou GET `/financeiro/contas-receber` disponível), 1 linha por pedido, colunas valor_total, valor_pago, valor_em_aberto, data_vencimento, status; coluna Vencimento exibida.
- [x] Detalhes: GET `/pedidos/:id/financeiro` + GET `/pedidos/:id/pagamentos`; cards (valor total, pago, em aberto, status, data_vencimento) + tabela de histórico; sem seção Parcelas.
- [x] Registrar pagamento: POST `/pedidos/:id/pagamentos` com valor, forma_pagamento, data_pagamento opcional; validação valor ≤ valor_em_aberto; fallback para POST `/pagamentos`; refetch e redirecionar após sucesso.
- [x] Dashboard: GET `/financeiro/dashboard` usado quando disponível; cards exibidos sem recalcular no front; fallback para endpoints antigos.
- [x] Remoção de uso de parcela no fluxo principal: formulários e exibição de “parcelas” removidos em Financeiro, Contas a Receber e Contas a Pagar; detalhe e pagamento por **pedido** apenas.

---

*Documento gerado após implementação das alterações dos guias GUIA_IMPLEMENTACAO_FRONTEND_FINANCEIRO.md e GUIA_MIGRACAO_SEM_PARCELAS.md.*
