# 📋 Guia de Implementação - Condições de Pagamento do Cliente

## 📌 Visão Geral

Este guia descreve como implementar a funcionalidade de condições de pagamento do cliente no frontend, permitindo que:

1. **Na criação do cliente**: Cadastrar condições de pagamento (prazo, forma de pagamento, parcelas)
2. **Na criação do pedido**: Preencher automaticamente os campos de pagamento ao selecionar um cliente

---

## 🗂️ Estrutura de Dados

### Condição de Pagamento

```typescript
interface CondicaoPagamento {
  id?: number;
  descricao: string;                    // Ex: "Pagamento em 30 dias"
  forma_pagamento: FormaPagamento;       // PIX, DINHEIRO, CARTAO_CREDITO, etc.
  prazo_dias?: number;                    // Prazo em dias (quando não parcelado)
  parcelado: boolean;                     // Se é parcelado ou não
  numero_parcelas?: number;               // Número de parcelas (quando parcelado)
  padrao: boolean;                         // Se é a condição padrão do cliente
  parcelas?: ParcelaPagamento[];          // Array de parcelas (quando parcelado)
}

interface ParcelaPagamento {
  id?: number;
  numero_parcela: number;                 // 1, 2, 3...
  dias_vencimento: number;                 // Dias para vencimento desta parcela
  percentual: number;                      // Percentual do valor total (soma deve ser 100%)
}
```

### Formas de Pagamento (Enum)

```typescript
enum FormaPagamento {
  DINHEIRO = 'DINHEIRO',
  PIX = 'PIX',
  CARTAO_CREDITO = 'CARTAO_CREDITO',
  CARTAO_DEBITO = 'CARTAO_DEBITO',
  BOLETO = 'BOLETO',
  TRANSFERENCIA = 'TRANSFERENCIA',
}
```

---

## 🎯 Parte 1: Cadastro de Condições de Pagamento no Cliente

### 1.1. Estrutura do Formulário

Ao criar ou editar um cliente, adicione uma seção para **Condições de Pagamento**:

```typescript
// Exemplo de estrutura no formulário
const [condicoesPagamento, setCondicoesPagamento] = useState<CondicaoPagamento[]>([]);

// Adicionar nova condição
const adicionarCondicao = () => {
  setCondicoesPagamento([
    ...condicoesPagamento,
    {
      descricao: '',
      forma_pagamento: FormaPagamento.PIX,
      parcelado: false,
      padrao: false,
      prazo_dias: 0,
    },
  ]);
};

// Remover condição
const removerCondicao = (index: number) => {
  setCondicoesPagamento(condicoesPagamento.filter((_, i) => i !== index));
};
```

### 1.2. Componente de Condição de Pagamento

```tsx
interface CondicaoPagamentoFormProps {
  condicao: CondicaoPagamento;
  index: number;
  onChange: (index: number, condicao: CondicaoPagamento) => void;
  onRemove: (index: number) => void;
  isPadrao: boolean;
  onSetPadrao: (index: number) => void;
}

const CondicaoPagamentoForm: React.FC<CondicaoPagamentoFormProps> = ({
  condicao,
  index,
  onChange,
  onRemove,
  isPadrao,
  onSetPadrao,
}) => {
  const handleChange = (field: keyof CondicaoPagamento, value: any) => {
    const updated = { ...condicao, [field]: value };
    
    // Se mudou para não parcelado, limpar parcelas
    if (field === 'parcelado' && value === false) {
      updated.parcelas = undefined;
      updated.numero_parcelas = undefined;
    }
    
    // Se mudou para parcelado, inicializar parcelas
    if (field === 'parcelado' && value === true) {
      updated.numero_parcelas = 1;
      updated.parcelas = [
        {
          numero_parcela: 1,
          dias_vencimento: 30,
          percentual: 100,
        },
      ];
    }
    
    onChange(index, updated);
  };

  return (
    <div className="condicao-pagamento-card">
      <div className="card-header">
        <h4>Condição de Pagamento {index + 1}</h4>
        <div>
          <label>
            <input
              type="checkbox"
              checked={isPadrao}
              onChange={() => onSetPadrao(index)}
            />
            Condição Padrão
          </label>
          <button onClick={() => onRemove(index)}>Remover</button>
        </div>
      </div>

      {/* Descrição */}
      <div className="form-group">
        <label>Descrição *</label>
        <input
          type="text"
          value={condicao.descricao}
          onChange={(e) => handleChange('descricao', e.target.value)}
          placeholder="Ex: Pagamento em 30 dias"
          required
        />
      </div>

      {/* Forma de Pagamento */}
      <div className="form-group">
        <label>Forma de Pagamento *</label>
        <select
          value={condicao.forma_pagamento}
          onChange={(e) => handleChange('forma_pagamento', e.target.value)}
          required
        >
          <option value={FormaPagamento.PIX}>PIX</option>
          <option value={FormaPagamento.DINHEIRO}>Dinheiro</option>
          <option value={FormaPagamento.CARTAO_CREDITO}>Cartão de Crédito</option>
          <option value={FormaPagamento.CARTAO_DEBITO}>Cartão de Débito</option>
          <option value={FormaPagamento.BOLETO}>Boleto</option>
          <option value={FormaPagamento.TRANSFERENCIA}>Transferência</option>
        </select>
      </div>

      {/* Tipo de Pagamento */}
      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={condicao.parcelado}
            onChange={(e) => handleChange('parcelado', e.target.checked)}
          />
          Pagamento Parcelado
        </label>
      </div>

      {/* Prazo em Dias (quando não parcelado) */}
      {!condicao.parcelado && (
        <div className="form-group">
          <label>Prazo em Dias *</label>
          <input
            type="number"
            min="0"
            value={condicao.prazo_dias || 0}
            onChange={(e) => handleChange('prazo_dias', parseInt(e.target.value))}
            required
          />
        </div>
      )}

      {/* Parcelas (quando parcelado) */}
      {condicao.parcelado && (
        <div className="parcelas-section">
          <div className="form-group">
            <label>Número de Parcelas *</label>
            <input
              type="number"
              min="1"
              value={condicao.numero_parcelas || 1}
              onChange={(e) => {
                const numParcelas = parseInt(e.target.value);
                const parcelas: ParcelaPagamento[] = [];
                
                // Criar parcelas com distribuição igual
                const percentualPorParcela = 100 / numParcelas;
                for (let i = 1; i <= numParcelas; i++) {
                  parcelas.push({
                    numero_parcela: i,
                    dias_vencimento: i * 30, // Incremento de 30 dias por parcela
                    percentual: percentualPorParcela,
                  });
                }
                
                handleChange('numero_parcelas', numParcelas);
                handleChange('parcelas', parcelas);
              }}
              required
            />
          </div>

          {/* Tabela de Parcelas */}
          {condicao.parcelas && condicao.parcelas.length > 0 && (
            <div className="parcelas-table">
              <table>
                <thead>
                  <tr>
                    <th>Parcela</th>
                    <th>Dias Vencimento</th>
                    <th>Percentual (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {condicao.parcelas.map((parcela, pIndex) => (
                    <tr key={pIndex}>
                      <td>{parcela.numero_parcela}</td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          value={parcela.dias_vencimento}
                          onChange={(e) => {
                            const updatedParcelas = [...condicao.parcelas!];
                            updatedParcelas[pIndex].dias_vencimento = parseInt(e.target.value);
                            handleChange('parcelas', updatedParcelas);
                          }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={parcela.percentual}
                          onChange={(e) => {
                            const updatedParcelas = [...condicao.parcelas!];
                            updatedParcelas[pIndex].percentual = parseFloat(e.target.value);
                            handleChange('parcelas', updatedParcelas);
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={2}><strong>Total:</strong></td>
                    <td>
                      <strong>
                        {condicao.parcelas.reduce((sum, p) => sum + p.percentual, 0).toFixed(2)}%
                      </strong>
                    </td>
                  </tr>
                </tfoot>
              </table>
              
              {/* Validação: Soma deve ser 100% */}
              {Math.abs(
                condicao.parcelas.reduce((sum, p) => sum + p.percentual, 0) - 100
              ) > 0.01 && (
                <div className="error-message">
                  ⚠️ A soma dos percentuais deve ser 100%
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
```

### 1.3. Envio dos Dados

Ao salvar o cliente, inclua as condições de pagamento no payload:

```typescript
const criarCliente = async (dadosCliente: CreateClienteDto) => {
  const payload = {
    ...dadosCliente,
    condicoes_pagamento: condicoesPagamento.map((cp) => ({
      descricao: cp.descricao,
      forma_pagamento: cp.forma_pagamento,
      prazo_dias: cp.parcelado ? undefined : cp.prazo_dias,
      parcelado: cp.parcelado,
      numero_parcelas: cp.parcelado ? cp.numero_parcelas : undefined,
      padrao: cp.padrao,
      parcelas: cp.parcelado ? cp.parcelas : undefined,
    })),
  };

  const response = await fetch('/api/v1/clientes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  return response.json();
};
```

---

## 🎯 Parte 2: Preenchimento Automático no Pedido

### 2.1. Endpoint para Buscar Dados do Cliente

Quando o usuário selecionar um cliente no formulário de pedido, faça uma chamada para buscar os dados:

```typescript
// Endpoint: GET /api/v1/pedidos/cliente/:clienteId/dados
// OU: GET /api/v1/clientes/:id/dados-pedido

const buscarDadosClienteParaPedido = async (clienteId: number) => {
  const response = await fetch(`/api/v1/pedidos/cliente/${clienteId}/dados`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  return data;
  // Retorna:
  // {
  //   cliente: { id, nome, cpf_cnpj, limite_credito },
  //   condicao_pagamento_padrao: CondicaoPagamento | null,
  //   condicoes_pagamento: CondicaoPagamento[]
  // }
};
```

### 2.2. Implementação no Formulário de Pedido

```typescript
const [clienteSelecionado, setClienteSelecionado] = useState<number | null>(null);
const [dadosCliente, setDadosCliente] = useState<any>(null);
const [condicaoPagamentoSelecionada, setCondicaoPagamentoSelecionada] = useState<CondicaoPagamento | null>(null);

// Quando o cliente é selecionado
const handleClienteChange = async (clienteId: number) => {
  setClienteSelecionado(clienteId);
  
  try {
    const dados = await buscarDadosClienteParaPedido(clienteId);
    setDadosCliente(dados);
    
    // Preencher automaticamente com a condição padrão
    if (dados.condicao_pagamento_padrao) {
      setCondicaoPagamentoSelecionada(dados.condicao_pagamento_padrao);
      preencherCamposPagamento(dados.condicao_pagamento_padrao);
    }
  } catch (error) {
    console.error('Erro ao buscar dados do cliente:', error);
  }
};

// Preencher campos do formulário de pedido
const preencherCamposPagamento = (condicao: CondicaoPagamento) => {
  // Preencher forma de pagamento
  setFormaPagamento(condicao.forma_pagamento);
  
  // Preencher condição de pagamento (texto)
  if (condicao.parcelado) {
    setCondicaoPagamento(`${condicao.numero_parcelas}x ${condicao.descricao}`);
  } else {
    setCondicaoPagamento(`${condicao.prazo_dias} dias - ${condicao.descricao}`);
  }
  
  // Se houver parcelas, calcular datas de vencimento
  if (condicao.parcelado && condicao.parcelas) {
    const dataBase = new Date(); // Data do pedido
    const vencimentos = condicao.parcelas.map((parcela) => {
      const dataVencimento = new Date(dataBase);
      dataVencimento.setDate(dataVencimento.getDate() + parcela.dias_vencimento);
      return {
        parcela: parcela.numero_parcela,
        vencimento: dataVencimento.toISOString().split('T')[0],
        percentual: parcela.percentual,
      };
    });
    
    // Armazenar vencimentos para exibição ou processamento
    setVencimentosParcelas(vencimentos);
  }
};
```

### 2.3. Componente de Seleção de Condição de Pagamento

```tsx
const SelecaoCondicaoPagamento: React.FC<{
  condicoes: CondicaoPagamento[];
  condicaoPadrao: CondicaoPagamento | null;
  onSelect: (condicao: CondicaoPagamento) => void;
}> = ({ condicoes, condicaoPadrao, onSelect }) => {
  return (
    <div className="selecao-condicao-pagamento">
      <label>Condição de Pagamento</label>
      <select
        onChange={(e) => {
          const condicao = condicoes.find((c) => c.id === parseInt(e.target.value));
          if (condicao) {
            onSelect(condicao);
          }
        }}
      >
        <option value="">Selecione uma condição...</option>
        {condicoes.map((condicao) => (
          <option key={condicao.id} value={condicao.id}>
            {condicao.descricao}
            {condicao.padrao && ' (Padrão)'}
            {condicao.parcelado
              ? ` - ${condicao.numero_parcelas}x`
              : ` - ${condicao.prazo_dias} dias`}
            {` - ${condicao.forma_pagamento}`}
          </option>
        ))}
      </select>
      
      {/* Exibir detalhes da condição selecionada */}
      {condicaoPadrao && (
        <div className="detalhes-condicao">
          <h4>Detalhes da Condição Padrão</h4>
          <p><strong>Descrição:</strong> {condicaoPadrao.descricao}</p>
          <p><strong>Forma:</strong> {condicaoPadrao.forma_pagamento}</p>
          {condicaoPadrao.parcelado ? (
            <>
              <p><strong>Parcelas:</strong> {condicaoPadrao.numero_parcelas}x</p>
              <table>
                <thead>
                  <tr>
                    <th>Parcela</th>
                    <th>Dias</th>
                    <th>Percentual</th>
                  </tr>
                </thead>
                <tbody>
                  {condicaoPadrao.parcelas?.map((p) => (
                    <tr key={p.numero_parcela}>
                      <td>{p.numero_parcela}</td>
                      <td>{p.dias_vencimento}</td>
                      <td>{p.percentual}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <p><strong>Prazo:</strong> {condicaoPadrao.prazo_dias} dias</p>
          )}
        </div>
      )}
    </div>
  );
};
```

---

## 📝 Exemplo Completo de Fluxo

### Fluxo 1: Criar Cliente com Condições de Pagamento

```typescript
// 1. Usuário preenche dados do cliente
const dadosCliente = {
  nome: 'João Silva',
  cpf_cnpj: '12345678900',
  tipoPessoa: TipoPessoa.PESSOA_FISICA,
  limite_credito: 10000,
  enderecos: [...],
  contato: [...],
  condicoes_pagamento: [
    {
      descricao: 'Pagamento em 30 dias',
      forma_pagamento: FormaPagamento.PIX,
      parcelado: false,
      prazo_dias: 30,
      padrao: true,
    },
    {
      descricao: 'Pagamento em 3x',
      forma_pagamento: FormaPagamento.CARTAO_CREDITO,
      parcelado: true,
      numero_parcelas: 3,
      padrao: false,
      parcelas: [
        { numero_parcela: 1, dias_vencimento: 30, percentual: 33.33 },
        { numero_parcela: 2, dias_vencimento: 60, percentual: 33.33 },
        { numero_parcela: 3, dias_vencimento: 90, percentual: 33.34 },
      ],
    },
  ],
};

// 2. Enviar para API
await criarCliente(dadosCliente);
```

### Fluxo 2: Criar Pedido com Preenchimento Automático

```typescript
// 1. Usuário seleciona cliente no formulário de pedido
const clienteId = 123;

// 2. Buscar dados do cliente
const dados = await buscarDadosClienteParaPedido(clienteId);
// Retorna:
// {
//   cliente: { id: 123, nome: 'João Silva', ... },
//   condicao_pagamento_padrao: {
//     descricao: 'Pagamento em 30 dias',
//     forma_pagamento: 'PIX',
//     prazo_dias: 30,
//     ...
//   },
//   condicoes_pagamento: [...]
// }

// 3. Preencher automaticamente os campos
setFormaPagamento(dados.condicao_pagamento_padrao.forma_pagamento);
setCondicaoPagamento(`${dados.condicao_pagamento_padrao.prazo_dias} dias`);

// 4. Usuário pode alterar se necessário
// 5. Ao salvar, usar os dados preenchidos
```

---

## 🔍 Endpoints Disponíveis

### 1. Criar Cliente (com condições de pagamento)
```
POST /api/v1/clientes
Body: {
  ...dadosCliente,
  condicoes_pagamento: CondicaoPagamento[]
}
```

### 2. Buscar Condições de Pagamento do Cliente
```
GET /api/v1/clientes/:id/condicoes-pagamento
Response: CondicaoPagamento[]
```

### 3. Buscar Dados do Cliente para Pedido
```
GET /api/v1/clientes/:id/dados-pedido
OU
GET /api/v1/pedidos/cliente/:clienteId/dados
Response: {
  cliente: { id, nome, cpf_cnpj, limite_credito },
  condicao_pagamento_padrao: CondicaoPagamento | null,
  condicoes_pagamento: CondicaoPagamento[]
}
```

---

## ✅ Validações Importantes

1. **Condição não parcelada**: `prazo_dias` é obrigatório
2. **Condição parcelada**: `numero_parcelas` e `parcelas` são obrigatórios
3. **Soma dos percentuais**: Deve ser exatamente 100% (tolerância de 0.01%)
4. **Condição padrão**: Apenas uma condição pode ser marcada como padrão
5. **Parcelas**: Devem ter `numero_parcela` sequencial (1, 2, 3...)

---

## 🎨 Sugestões de UI/UX

1. **Card de Condição**: Use cards destacados para cada condição de pagamento
2. **Validação em Tempo Real**: Mostre erros de validação enquanto o usuário digita
3. **Preview de Parcelas**: Mostre uma prévia das datas de vencimento ao calcular parcelas
4. **Indicador de Padrão**: Destaque visualmente a condição padrão
5. **Confirmação**: Peça confirmação antes de remover uma condição

---

## 📚 Recursos Adicionais

- **Formatação de Datas**: Use bibliotecas como `date-fns` ou `moment.js`
- **Validação**: Use `yup` ou `zod` para validação de formulários
- **Estado**: Considere usar `react-hook-form` para gerenciar formulários complexos

---

## 🐛 Troubleshooting

### Erro: "A soma dos percentuais deve ser 100%"
- Verifique se todas as parcelas têm percentuais válidos
- Use `toFixed(2)` para arredondar e comparar

### Erro: "Prazo em dias é obrigatório"
- Certifique-se de que `prazo_dias` está preenchido quando `parcelado = false`

### Condição padrão não está sendo aplicada
- Verifique se apenas uma condição está marcada como `padrao: true`
- A API mantém apenas a primeira condição padrão encontrada

---

**Fim do Guia** 🎉

