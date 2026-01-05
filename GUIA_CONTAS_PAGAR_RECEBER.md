# Guia dos Módulos de Contas a Pagar e Contas a Receber

## Índice
1. [Visão Geral](#visão-geral)
2. [Estrutura de Dados](#estrutura-de-dados)
3. [Módulo de Contas a Pagar](#módulo-de-contas-a-pagar)
4. [Módulo de Contas a Receber](#módulo-de-contas-a-receber)
5. [Atualização de Status](#atualização-de-status)
6. [Sistema de Validade e Vencimento](#sistema-de-validade-e-vencimento)
7. [Funcionalidades Principais](#funcionalidades-principais)
8. [Fluxos de Trabalho](#fluxos-de-trabalho)
9. [API e Serviços](#api-e-serviços)

---

## Visão Geral

O sistema de Contas a Pagar e Contas a Receber é um módulo financeiro completo que permite gerenciar todas as transações financeiras da empresa. O módulo oferece:

- **Gestão completa** de contas financeiras (pagar e receber)
- **Controle de status** em tempo real
- **Validação automática** de vencimentos
- **Dashboard** com estatísticas e métricas
- **Filtros avançados** por status, data e relacionamentos
- **Paginação** para grandes volumes de dados

---

## Estrutura de Dados

### Interface `ContaFinanceira`

```typescript
interface ContaFinanceira {
  id: number;
  numero_conta: string;
  tipo: 'RECEBER' | 'PAGAR';
  pedido_id?: number;
  cliente_id?: number;        // Apenas para contas a receber
  fornecedor_id?: number;      // Apenas para contas a pagar
  descricao: string;
  valor_original: number;
  valor_pago: number;
  valor_restante: number;
  data_emissao: string;         // Formato: YYYY-MM-DD
  data_vencimento: string;      // Formato: YYYY-MM-DD
  data_pagamento?: string;      // Formato: YYYY-MM-DD
  status: 'PENDENTE' | 'PAGO_PARCIAL' | 'PAGO_TOTAL' | 'VENCIDO' | 'CANCELADO';
  forma_pagamento?: 'DINHEIRO' | 'PIX' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO' | 'BOLETO' | 'TRANSFERENCIA';
  numero_parcela?: number;
  total_parcelas?: number;
  parcela_texto?: string;      // Ex: "1/3"
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
  
  // Campos calculados pelo backend
  dias_ate_vencimento?: number;        // Ex: -5 (vencida há 5 dias), 0 (vence hoje), 5 (vence em 5 dias)
  status_vencimento?: string;           // Ex: "Vencida há 5 dias", "Vence hoje", "Vence em 5 dias"
  proximidade_vencimento?: 'VENCIDA' | 'VENCE_HOJE' | 'CRITICO' | 'ATENCAO' | 'NORMAL' | 'LONGO_PRAZO';
}
```

### DTO de Criação

```typescript
interface CreateContaFinanceiraDto {
  tipo: 'RECEBER' | 'PAGAR';
  pedido_id?: number;
  cliente_id?: number;
  fornecedor_id?: number;
  descricao: string;
  valor_original: number;
  data_emissao: string;        // Formato: YYYY-MM-DD
  data_vencimento: string;       // Formato: YYYY-MM-DD
  data_pagamento?: string;
  forma_pagamento?: 'DINHEIRO' | 'PIX' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO' | 'BOLETO' | 'TRANSFERENCIA';
  numero_parcela?: number;
  total_parcelas?: number;
  parcela_texto?: string;
  observacoes?: string;
}
```

---

## Módulo de Contas a Pagar

### Localização
- **Arquivo**: `src/pages/ContasAPagar.tsx`
- **Rota**: `/contas-a-pagar`

### Funcionalidades

#### 1. Visualização de Contas
- Listagem paginada de todas as contas a pagar
- Filtros por status (Todos, Pendente, Pago Parcial, Pago Total, Vencido, Cancelado)
- Busca por descrição, ID da conta ou fornecedor
- Exibição de informações de vencimento com cores indicativas

#### 2. Estatísticas do Dashboard
O módulo exibe 4 cards com estatísticas principais:

- **Total a Pagar**: Soma de todas as contas pendentes, vencidas ou parcialmente pagas
- **Vencidas**: Quantidade de contas com status VENCIDO
- **Vencendo Hoje**: Contas que vencem no dia atual
- **Vencendo Este Mês**: Contas que vencem no mês corrente

#### 3. Criação de Nova Conta
Formulário completo com as seguintes seções:

**Informações Básicas:**
- Descrição (obrigatório)
- Valor Original (obrigatório)

**Relacionamentos:**
- Fornecedor (opcional)
- Pedido (opcional)

**Datas:**
- Data de Emissão (obrigatório)
- Data de Vencimento (obrigatório)
- Data de Pagamento (opcional)

**Pagamento:**
- Forma de Pagamento (opcional)

**Parcelas:**
- Número da Parcela
- Total de Parcelas
- Texto da Parcela (ex: "1/3")

**Observações:**
- Campo de texto livre para observações adicionais

#### 4. Edição de Conta
- Edição de todos os campos da conta
- Validação de campos obrigatórios
- Atualização em tempo real após salvar

#### 5. Visualização Detalhada
- Dialog com todos os detalhes da conta
- Informações de relacionamento (fornecedor, pedido)
- Histórico de valores (original, pago, restante)

### Código de Referência

```366:386:src/pages/ContasAPagar.tsx
  // Mutation para atualizar apenas o status (edição inline)
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return await financeiroService.atualizar(id, { status: status as any });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contas-financeiras"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-pagar"] });
      toast.success("Status atualizado com sucesso!");
      setEditingStatusId(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Erro ao atualizar status");
      setEditingStatusId(null);
    },
  });

  const handleStatusChange = (contaId: number, newStatus: string) => {
    setEditingStatusId(contaId);
    updateStatusMutation.mutate({ id: contaId, status: newStatus });
  };
```

---

## Módulo de Contas a Receber

### Localização
- **Arquivo**: `src/pages/ContasAReceber.tsx`
- **Rota**: `/contas-a-receber`

### Funcionalidades

#### 1. Visualização de Contas
- Listagem paginada de todas as contas a receber
- Filtros por status (Todos, Pendente, Pago Parcial, Pago Total, Vencido, Cancelado)
- Busca por descrição, ID da conta ou cliente
- Exibição de informações de vencimento com cores indicativas

#### 2. Estatísticas do Dashboard
O módulo exibe 4 cards com estatísticas principais:

- **Total a Receber**: Soma de todas as contas pendentes, vencidas ou parcialmente pagas
- **Vencidas**: Quantidade de contas com status VENCIDO
- **Vencendo Hoje**: Contas que vencem no dia atual
- **Vencendo Este Mês**: Contas que vencem no mês corrente

#### 3. Criação de Nova Conta
Formulário completo com as seguintes seções:

**Informações Básicas:**
- Descrição (obrigatório)
- Valor Original (obrigatório)

**Relacionamentos:**
- Cliente (opcional)
- Pedido (opcional)

**Datas:**
- Data de Emissão (obrigatório)
- Data de Vencimento (obrigatório)
- Data de Pagamento (opcional)

**Pagamento:**
- Forma de Pagamento (opcional)

**Parcelas:**
- Número da Parcela
- Total de Parcelas
- Texto da Parcela (ex: "1/3")

**Observações:**
- Campo de texto livre para observações adicionais

#### 4. Edição de Conta
- Edição de todos os campos da conta
- Validação de campos obrigatórios
- Atualização em tempo real após salvar

#### 5. Visualização Detalhada
- Dialog com todos os detalhes da conta
- Informações de relacionamento (cliente, pedido)
- Histórico de valores (original, pago, restante)

### Código de Referência

```365:385:src/pages/ContasAReceber.tsx
  // Mutation para atualizar apenas o status (edição inline)
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return await financeiroService.atualizar(id, { status: status as any });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contas-financeiras"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-receber"] });
      toast.success("Status atualizado com sucesso!");
      setEditingStatusId(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Erro ao atualizar status");
      setEditingStatusId(null);
    },
  });

  const handleStatusChange = (contaId: number, newStatus: string) => {
    setEditingStatusId(contaId);
    updateStatusMutation.mutate({ id: contaId, status: newStatus });
  };
```

---

## Atualização de Status

### Status Disponíveis

O sistema suporta 5 status diferentes:

1. **PENDENTE**: Conta criada mas ainda não paga
2. **PAGO_PARCIAL**: Conta parcialmente paga (valor_pago < valor_original)
3. **PAGO_TOTAL**: Conta totalmente paga (valor_pago >= valor_original)
4. **VENCIDO**: Conta que passou da data de vencimento sem estar paga
5. **CANCELADO**: Conta cancelada (não será mais processada)

### Como Atualizar Status

#### Método 1: Edição Inline na Tabela

O status pode ser atualizado diretamente na tabela através de um componente Select:

```1192:1212:src/pages/ContasAPagar.tsx
                      ) : (
                        <Select
                          value={transacao.statusOriginal || transacao.status}
                          onValueChange={(value) => handleStatusChange(transacao.contaId, value)}
                          disabled={updateStatusMutation.isPending}
                        >
                          <SelectTrigger className="h-7 w-[140px] text-xs border-0 bg-transparent hover:bg-transparent">
                            <SelectValue>
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(transacao.status)}`}>
                                {transacao.status}
                              </span>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PENDENTE">Pendente</SelectItem>
                            <SelectItem value="PAGO_PARCIAL">Pago Parcial</SelectItem>
                            <SelectItem value="PAGO_TOTAL">Pago Total</SelectItem>
                            <SelectItem value="VENCIDO">Vencido</SelectItem>
                            <SelectItem value="CANCELADO">Cancelado</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
```

**Fluxo de Atualização:**
1. Usuário seleciona novo status no dropdown
2. `handleStatusChange` é chamado com o ID da conta e novo status
3. `updateStatusMutation` faz a requisição PATCH para a API
4. Em caso de sucesso:
   - Cache do React Query é invalidado
   - Toast de sucesso é exibido
   - Tabela é atualizada automaticamente
5. Em caso de erro:
   - Toast de erro é exibido
   - Estado de edição é resetado

#### Método 2: Edição Completa da Conta

O status também pode ser atualizado através do formulário de edição completa da conta, junto com outros campos.

### Cores dos Status

O sistema utiliza cores diferentes para cada status, facilitando a identificação visual:

```534:543:src/pages/ContasAPagar.tsx
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pendente": return "bg-amber-500/10 text-amber-500";
      case "pago parcial": return "bg-blue-500/10 text-blue-500";
      case "pago total": return "bg-green-500/10 text-green-500";
      case "vencido": return "bg-red-500/10 text-red-500";
      case "cancelado": return "bg-slate-600/10 text-slate-600";
      default: return "bg-muted text-muted-foreground";
    }
  };
```

---

## Sistema de Validade e Vencimento

### Campos Calculados

O backend calcula automaticamente os seguintes campos:

1. **`dias_ate_vencimento`**: Número de dias até o vencimento
   - Valores negativos: conta vencida (ex: -5 = vencida há 5 dias)
   - Zero: vence hoje
   - Valores positivos: dias até vencer (ex: 5 = vence em 5 dias)

2. **`status_vencimento`**: Texto descritivo do status
   - Exemplos: "Vencida há 5 dias", "Vence hoje", "Vence em 5 dias"

3. **`proximidade_vencimento`**: Categoria de proximidade
   - `VENCIDA`: Conta já vencida
   - `VENCE_HOJE`: Vence no dia atual
   - `CRITICO`: Vence em 1-3 dias
   - `ATENCAO`: Vence em 4-7 dias
   - `NORMAL`: Vence em 8-30 dias
   - `LONGO_PRAZO`: Vence em mais de 30 dias

### Cálculo no Frontend (Fallback)

Se o backend não fornecer os campos calculados, o frontend calcula localmente:

```545:592:src/pages/ContasAPagar.tsx
  // Função para calcular dias até vencimento
  const calcularDiasAteVencimento = (dataVencimento: string): number | null => {
    if (!dataVencimento) return null;
    try {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const vencimento = new Date(dataVencimento);
      vencimento.setHours(0, 0, 0, 0);
      const diffTime = vencimento.getTime() - hoje.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch {
      return null;
    }
  };

  // Função para obter status de vencimento
  const getVencimentoStatus = (dias: number | null, status: string): { texto: string; cor: string; bgColor: string } => {
    if (status === "PAGO_TOTAL" || status === "CANCELADO") {
      return { texto: "", cor: "", bgColor: "" };
    }
    
    if (dias === null) {
      return { texto: "Data inválida", cor: "text-gray-500", bgColor: "bg-gray-100" };
    }
    
    if (dias < 0) {
      return { texto: "Vencida", cor: "text-red-600", bgColor: "bg-red-100" };
    }
    
    if (dias === 0) {
      return { texto: "Vence hoje", cor: "text-red-600", bgColor: "bg-red-100" };
    }
    
    if (dias <= 3) {
      return { texto: `Vence em ${dias} ${dias === 1 ? 'dia' : 'dias'}`, cor: "text-orange-600", bgColor: "bg-orange-100" };
    }
    
    if (dias <= 7) {
      return { texto: `Vence em ${dias} dias`, cor: "text-amber-600", bgColor: "bg-amber-100" };
    }
    
    if (dias <= 30) {
      return { texto: `Vence em ${dias} dias`, cor: "text-blue-600", bgColor: "bg-blue-100" };
    }
    
    return { texto: `Vence em ${dias} dias`, cor: "text-gray-600", bgColor: "bg-gray-100" };
  };
```

### Exibição Visual

O sistema exibe badges coloridos na tabela indicando o status de vencimento:

```1178:1184:src/pages/ContasAPagar.tsx
                    <TableCell>
                      {transacao.vencimentoStatus?.texto && (
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${transacao.vencimentoStatus.cor} ${transacao.vencimentoStatus.bgColor}`}>
                          {transacao.vencimentoStatus.texto}
                        </span>
                      )}
                    </TableCell>
```

### Mapeamento de Cores

O sistema mapeia a `proximidade_vencimento` do backend para cores visuais:

```635:662:src/pages/ContasAPagar.tsx
      } else if (conta.status_vencimento && conta.proximidade_vencimento) {
        // Mapear proximidade_vencimento do backend para cores
        const proximidade = conta.proximidade_vencimento;
        let cor = "text-gray-600";
        let bgColor = "bg-gray-100";
        
        if (proximidade === 'VENCIDA' || proximidade === 'VENCE_HOJE') {
          cor = "text-red-600";
          bgColor = "bg-red-100";
        } else if (proximidade === 'CRITICO') {
          cor = "text-orange-600";
          bgColor = "bg-orange-100";
        } else if (proximidade === 'ATENCAO') {
          cor = "text-amber-600";
          bgColor = "bg-amber-100";
        } else if (proximidade === 'NORMAL') {
          cor = "text-blue-600";
          bgColor = "bg-blue-100";
        } else if (proximidade === 'LONGO_PRAZO') {
          cor = "text-gray-600";
          bgColor = "bg-gray-100";
        }
        
        vencimentoStatus = {
          texto: conta.status_vencimento,
          cor,
          bgColor,
        };
      } else {
```

### Validação de Datas

O sistema valida o formato das datas antes de enviar para a API:

```471:484:src/pages/ContasAPagar.tsx
    // Validar formato das datas (deve estar em formato ISO YYYY-MM-DD)
    const dataEmissaoRegex = /^\d{4}-\d{2}-\d{2}$/;
    const dataVencimentoRegex = /^\d{4}-\d{2}-\d{2}$/;
    
    if (!dataEmissaoRegex.test(editConta.data_emissao)) {
      toast.error("A data de emissão deve estar no formato ISO (YYYY-MM-DD), por exemplo: 2025-12-01");
      return;
    }
    
    if (!dataVencimentoRegex.test(editConta.data_vencimento)) {
      toast.error("A data de vencimento deve estar no formato ISO (YYYY-MM-DD), por exemplo: 2025-12-01");
      return;
    }
```

---

## Funcionalidades Principais

### 1. Paginação

O sistema implementa paginação completa:

- **Tamanho padrão**: 15 registros por página
- **Navegação**: Botões anterior/próximo + números de página
- **Indicador**: Mostra "Mostrando X a Y de Z contas"
- **Reset automático**: Página volta para 1 ao mudar filtros ou busca

```1245:1295:src/pages/ContasAPagar.tsx
          {/* Paginação */}
          {totalPages > 1 && (
            <div className="border-t border-border p-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          onClick={() => setCurrentPage(pageNum)}
                          isActive={currentPage === pageNum}
                          className="cursor-pointer"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
              
              <div className="text-center text-sm text-muted-foreground mt-2">
                Mostrando {contas.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} a {Math.min(currentPage * pageSize, totalContas)} de {totalContas} contas
              </div>
            </div>
          )}
```

### 2. Busca Avançada

O sistema oferece busca por:
- **Descrição**: Busca parcial no texto da descrição
- **ID da Conta**: Busca exata por número da conta
- **Fornecedor/Cliente**: Busca pelo nome do relacionado

```702:761:src/pages/ContasAPagar.tsx
  // Filtrar por busca
  const filteredTransacoes = useMemo(() => {
    if (isNumericSearch && contaPorId && contaPorId.tipo === "PAGAR") {
      const contaEncontrada = contas.find(c => c.id === contaPorId.id);
      if (contaEncontrada) {
        const conta = contaEncontrada;
        let nomeFornecedor = "N/A";
        let categoria = "N/A";
        
        if (conta.fornecedor_id) {
          const fornecedor = fornecedores.find(f => f.id === conta.fornecedor_id);
          nomeFornecedor = fornecedor?.nome_fantasia || fornecedor?.nome_razao || "Fornecedor não encontrado";
          categoria = "Fornecedores";
        }

        const valorFormatado = new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(conta.valor_original || 0);

        const dataFormatada = conta.data_vencimento
          ? new Date(conta.data_vencimento).toLocaleDateString('pt-BR')
          : "N/A";

        const statusMap: Record<string, string> = {
          "PENDENTE": "Pendente",
          "PAGO_PARCIAL": "Pago Parcial",
          "PAGO_TOTAL": "Pago Total",
          "VENCIDO": "Vencido",
          "CANCELADO": "Cancelado",
        };
        const statusFormatado = statusMap[conta.status] || conta.status;

        return [{
          id: conta.numero_conta || `CONTA-${conta.id}`,
          descricao: conta.descricao,
          categoria: categoria,
          valor: valorFormatado,
          data: dataFormatada,
          status: statusFormatado,
          contaId: conta.id,
          fornecedor: nomeFornecedor,
        }];
      }
    }

    // Se não há termo de busca, retornar todas as transações
    if (!searchTerm.trim()) {
      return transacoesDisplay;
    }

    // Filtrar por termo de busca
    return transacoesDisplay.filter(t => {
      const matchesSearch = 
        t.descricao.toLowerCase().includes(searchTerm.toLowerCase()) || 
        t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.fornecedor.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [transacoesDisplay, searchTerm, isNumericSearch, contaPorId, contas, fornecedores]);
```

### 3. Filtros por Status

O sistema oferece tabs para filtrar por status:

```1083:1097:src/pages/ContasAPagar.tsx
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-4">
          {["Todos", "PENDENTE", "PAGO_PARCIAL", "PAGO_TOTAL", "VENCIDO", "CANCELADO"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab 
                  ? getActiveTabColor(tab)
                  : getInactiveTabColor(tab)
              }`}
            >
              {tab === "PENDENTE" ? "Pendente" : tab === "PAGO_PARCIAL" ? "Pago Parcial" : tab === "PAGO_TOTAL" ? "Pago Total" : tab === "VENCIDO" ? "Vencido" : tab === "CANCELADO" ? "Cancelado" : tab}
            </button>
          ))}
        </div>
```

### 4. Validação de Formulários

O sistema valida todos os campos obrigatórios antes de criar ou atualizar:

```451:470:src/pages/ContasAPagar.tsx
    // Validar campos obrigatórios
    if (!editConta.descricao || !editConta.descricao.trim()) {
      toast.error("Preencha a descrição");
      return;
    }
    
    if (!editConta.valor_original || editConta.valor_original <= 0) {
      toast.error("Preencha um valor original válido");
      return;
    }
    
    if (!editConta.data_emissao || !editConta.data_emissao.trim()) {
      toast.error("Preencha a data de emissão");
      return;
    }
    
    if (!editConta.data_vencimento || !editConta.data_vencimento.trim()) {
      toast.error("Preencha a data de vencimento");
      return;
    }
```

---

## Fluxos de Trabalho

### Fluxo 1: Criar Nova Conta a Pagar

1. Usuário clica em "Nova Conta a Pagar"
2. Preenche formulário com dados obrigatórios:
   - Descrição
   - Valor Original
   - Data de Emissão
   - Data de Vencimento
3. Opcionalmente preenche:
   - Fornecedor
   - Pedido relacionado
   - Forma de pagamento
   - Informações de parcelas
   - Observações
4. Clica em "Registrar Conta a Pagar"
5. Sistema valida campos
6. Envia requisição POST para API
7. Em caso de sucesso:
   - Toast de sucesso é exibido
   - Dialog é fechado
   - Lista é atualizada automaticamente
   - Dashboard é atualizado

### Fluxo 2: Atualizar Status de uma Conta

1. Usuário localiza a conta na tabela
2. Clica no dropdown de status na coluna "Status"
3. Seleciona novo status
4. Sistema automaticamente:
   - Mostra indicador de carregamento
   - Envia requisição PATCH para API
   - Atualiza cache do React Query
   - Exibe toast de sucesso/erro
   - Atualiza visualização da tabela

### Fluxo 3: Editar Conta Completa

1. Usuário clica no menu de ações (três pontos) da conta
2. Seleciona "Editar"
3. Dialog de edição abre com dados pré-preenchidos
4. Usuário modifica campos desejados
5. Clica em "Atualizar Conta"
6. Sistema valida e envia atualização
7. Dialog fecha e lista é atualizada

### Fluxo 4: Filtrar e Buscar Contas

1. Usuário seleciona tab de status (ex: "Vencido")
2. Sistema filtra contas automaticamente
3. Opcionalmente, usuário digita termo de busca
4. Sistema filtra resultados em tempo real
5. Paginação é resetada para página 1

---

## API e Serviços

### Serviço Financeiro

**Localização**: `src/services/financeiro.service.ts`

#### Métodos Principais

```typescript
// Listar contas com filtros
financeiroService.listar({
  page?: number;
  limit?: number;
  tipo?: 'RECEBER' | 'PAGAR';
  status?: string;
  cliente_id?: number;
  fornecedor_id?: number;
  pedido_id?: number;
  proximidade_vencimento?: string;
  dias_maximos?: number;
})

// Buscar conta por ID
financeiroService.buscarPorId(id: number)

// Criar nova conta
financeiroService.criar(data: CreateContaFinanceiraDto)

// Atualizar conta
financeiroService.atualizar(id: number, data: Partial<CreateContaFinanceiraDto>)

// Deletar conta
financeiroService.deletar(id: number)

// Cancelar conta
financeiroService.cancelar(id: number)

// Dashboard de contas a receber
financeiroService.getDashboardReceber()

// Dashboard de contas a pagar
financeiroService.getDashboardPagar()
```

### Endpoints da API

#### Listar Contas
```
GET /contas-financeiras?tipo=PAGAR&status=PENDENTE&page=1&limit=15
```

#### Buscar por ID
```
GET /contas-financeiras/:id
```

#### Criar Conta
```
POST /contas-financeiras
Body: CreateContaFinanceiraDto
```

#### Atualizar Conta
```
PATCH /contas-financeiras/:id
Body: Partial<CreateContaFinanceiraDto>
```

#### Cancelar Conta
```
PATCH /contas-financeiras/:id/cancelar
```

#### Dashboard Receber
```
GET /contas-financeiras/dashboard/receber
```

#### Dashboard Pagar
```
GET /contas-financeiras/dashboard/pagar
```

---

## Boas Práticas

### 1. Validação de Dados
- Sempre validar campos obrigatórios antes de enviar
- Validar formato de datas (YYYY-MM-DD)
- Validar valores numéricos (não negativos, não zero para obrigatórios)

### 2. Tratamento de Erros
- Sempre tratar erros da API
- Exibir mensagens de erro amigáveis ao usuário
- Logar erros no console para debug

### 3. Performance
- Usar paginação para grandes volumes de dados
- Implementar cache com React Query
- Invalidar cache apenas quando necessário

### 4. UX
- Mostrar indicadores de carregamento
- Exibir toasts de feedback
- Resetar formulários após sucesso
- Manter estado consistente entre componentes

### 5. Acessibilidade
- Usar labels descritivos
- Manter contraste adequado nas cores
- Suportar navegação por teclado

---

## Troubleshooting

### Problema: Status não atualiza após mudança
**Solução**: Verificar se o cache do React Query está sendo invalidado corretamente após a mutação.

### Problema: Datas não são exibidas corretamente
**Solução**: Verificar se as datas estão no formato ISO (YYYY-MM-DD) antes de enviar para a API.

### Problema: Validação de vencimento não funciona
**Solução**: Verificar se o backend está retornando os campos `dias_ate_vencimento`, `status_vencimento` e `proximidade_vencimento`.

### Problema: Busca não encontra contas
**Solução**: Verificar se o termo de busca está sendo comparado corretamente (case-insensitive) e se os campos estão sendo indexados.

---

## Conclusão

Este guia documenta completamente os módulos de Contas a Pagar e Contas a Receber, incluindo:

- ✅ Estrutura de dados completa
- ✅ Funcionalidades de criação, edição e visualização
- ✅ Sistema de atualização de status
- ✅ Validação e controle de vencimentos
- ✅ Fluxos de trabalho principais
- ✅ Referências de código importantes

Para mais informações sobre a implementação, consulte os arquivos:
- `src/pages/ContasAPagar.tsx`
- `src/pages/ContasAReceber.tsx`
- `src/services/financeiro.service.ts`

