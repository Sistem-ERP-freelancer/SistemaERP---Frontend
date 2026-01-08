# Guia Frontend - Limite de Crédito do Cliente

## Visão Geral

Este documento descreve como o frontend deve integrar com o sistema de controle de limite de crédito do cliente. O sistema valida automaticamente se um cliente pode fazer um pedido sem ultrapassar seu limite de crédito e fornece informações em tempo real sobre o limite disponível.

## Funcionalidades

1. **Validação Automática**: Ao criar um pedido de VENDA, o backend valida automaticamente se o valor cabe no limite disponível
2. **Consulta de Limite**: Endpoint para consultar o limite atual de crédito do cliente
3. **Cálculo Dinâmico**: O limite usado é calculado dinamicamente baseado em pedidos em aberto

## Endpoints Disponíveis

### 1. Consultar Limite de Crédito do Cliente

**Endpoint:**
```
GET /api/v1/clientes/:id/limite-credito
```

**Autenticação:** Requerida (JWT Token)

**Parâmetros:**
- `id` (path): ID do cliente

**Resposta de Sucesso (200):**
```json
{
  "limiteCredito": 10000.0,
  "valorUtilizado": 3500.0,
  "valorDisponivel": 6500.0,
  "ultrapassouLimite": false
}
```

**Campos da Resposta:**
- `limiteCredito` (number): Limite total de crédito configurado para o cliente
- `valorUtilizado` (number): Soma dos valores de pedidos em aberto (status diferente de CANCELADO e FINALIZADO)
- `valorDisponivel` (number): Limite disponível para novos pedidos (limiteCredito - valorUtilizado)
- `ultrapassouLimite` (boolean): Indica se o limite foi ultrapassado (valorUtilizado > limiteCredito)

**Resposta de Erro (404):**
```json
{
  "statusCode": 404,
  "message": "Cliente não encontrado"
}
```

**Resposta de Erro (400):**
```json
{
  "statusCode": 400,
  "message": "Schema name é obrigatório"
}
```

### 2. Criar Pedido (com Validação Automática)

**Endpoint:**
```
POST /api/v1/pedidos
```

**Autenticação:** Requerida (JWT Token)

**Validação Automática:**
- Quando `tipo === "VENDA"` e `cliente_id` está presente, o backend valida automaticamente o limite de crédito
- Se o valor do pedido ultrapassar o limite disponível, retorna erro antes de criar o pedido

**Resposta de Erro - Limite Excedido (400):**
```json
{
  "statusCode": 400,
  "message": "Limite de crédito do cliente excedido. Limite: R$ 10.000,00. Valor já utilizado: R$ 3.500,00. Valor do pedido: R$ 7.000,00. Total seria: R$ 10.500,00"
}
```

## Como o Limite é Calculado

### Limite Usado
O limite usado é calculado dinamicamente somando o `valor_total` de todos os pedidos do cliente que têm status diferente de:
- `CANCELADO`
- `FINALIZADO`

### Limite Disponível
```
limiteDisponivel = limiteCredito - valorUtilizado
```

### Liberação Automática
Quando um pedido é:
- **Cancelado**: O valor volta automaticamente para o limite disponível
- **Finalizado**: O valor não conta mais no limite usado

## Fluxo de Uso no Frontend

### 1. Exibir Limite de Crédito na Tela do Cliente

```typescript
// Exemplo em React/TypeScript
import { useEffect, useState } from 'react';
import axios from 'axios';

interface LimiteCredito {
  limiteCredito: number;
  valorUtilizado: number;
  valorDisponivel: number;
  ultrapassouLimite: boolean;
}

function ClienteLimiteCredito({ clienteId }: { clienteId: number }) {
  const [limite, setLimite] = useState<LimiteCredito | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const buscarLimite = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `/api/v1/clientes/${clienteId}/limite-credito`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );
        setLimite(response.data);
        setError(null);
      } catch (err: any) {
        if (err.response?.status === 404) {
          setError('Cliente não encontrado');
        } else {
          setError('Erro ao buscar limite de crédito');
        }
      } finally {
        setLoading(false);
      }
    };

    if (clienteId) {
      buscarLimite();
    }
  }, [clienteId]);

  if (loading) return <div>Carregando...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!limite) return null;

  const porcentagemUsada = (limite.valorUtilizado / limite.limiteCredito) * 100;

  return (
    <div className="limite-credito-card">
      <h3>Limite de Crédito</h3>
      
      <div className="limite-info">
        <div className="limite-total">
          <span className="label">Limite Total:</span>
          <span className="value">
            {formatarMoeda(limite.limiteCredito)}
          </span>
        </div>
        
        <div className="limite-usado">
          <span className="label">Utilizado:</span>
          <span className={`value ${limite.ultrapassouLimite ? 'error' : ''}`}>
            {formatarMoeda(limite.valorUtilizado)}
          </span>
        </div>
        
        <div className="limite-disponivel">
          <span className="label">Disponível:</span>
          <span className={`value ${limite.valorDisponivel < 0 ? 'error' : 'success'}`}>
            {formatarMoeda(limite.valorDisponivel)}
          </span>
        </div>
      </div>

      {/* Barra de progresso */}
      <div className="progress-bar">
        <div
          className={`progress-fill ${limite.ultrapassouLimite ? 'error' : ''}`}
          style={{ width: `${Math.min(porcentagemUsada, 100)}%` }}
        />
      </div>
      
      <div className="progress-text">
        {porcentagemUsada.toFixed(1)}% utilizado
      </div>

      {limite.ultrapassouLimite && (
        <div className="alert alert-warning">
          ⚠️ Limite de crédito ultrapassado!
        </div>
      )}
    </div>
  );
}

function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}
```

### 2. Validar Limite Antes de Criar Pedido

```typescript
// Exemplo de validação antes de criar pedido
async function criarPedidoComValidacao(dadosPedido: CreatePedidoDto) {
  try {
    // Se for pedido de VENDA com cliente, verificar limite primeiro
    if (dadosPedido.tipo === 'VENDA' && dadosPedido.cliente_id) {
      const limiteResponse = await axios.get(
        `/api/v1/clientes/${dadosPedido.cliente_id}/limite-credito`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      const limite = limiteResponse.data;
      const valorPedido = calcularValorTotalPedido(dadosPedido);

      // Validar se o pedido cabe no limite disponível
      if (valorPedido > limite.valorDisponivel) {
        const mensagem = `
          Limite de crédito insuficiente!
          
          Limite disponível: ${formatarMoeda(limite.valorDisponivel)}
          Valor do pedido: ${formatarMoeda(valorPedido)}
          Diferença: ${formatarMoeda(valorPedido - limite.valorDisponivel)}
        `;
        
        // Mostrar alerta ao usuário
        if (!confirm(mensagem + '\n\nDeseja continuar mesmo assim?')) {
          return; // Usuário cancelou
        }
      }
    }

    // Criar pedido (backend também valida automaticamente)
    const response = await axios.post(
      '/api/v1/pedidos',
      dadosPedido,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );

    return response.data;
  } catch (error: any) {
    if (error.response?.status === 400) {
      // Erro de validação (pode ser limite excedido)
      const mensagem = error.response.data.message;
      
      if (mensagem.includes('Limite de crédito')) {
        // Mostrar erro específico de limite
        alert(mensagem);
        return null;
      }
    }
    
    // Outros erros
    throw error;
  }
}
```

### 3. Exibir Limite na Tela de Criação de Pedido

```typescript
// Componente para exibir limite durante criação de pedido
function LimiteCreditoPedido({ 
  clienteId, 
  valorPedido 
}: { 
  clienteId: number | null;
  valorPedido: number;
}) {
  const [limite, setLimite] = useState<LimiteCredito | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!clienteId) {
      setLimite(null);
      return;
    }

    const buscarLimite = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `/api/v1/clientes/${clienteId}/limite-credito`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );
        setLimite(response.data);
      } catch (error) {
        console.error('Erro ao buscar limite:', error);
      } finally {
        setLoading(false);
      }
    };

    buscarLimite();
  }, [clienteId]);

  if (!clienteId || !limite) return null;

  const valorDisponivelAposPedido = limite.valorDisponivel - valorPedido;
  const ultrapassaraLimite = valorDisponivelAposPedido < 0;

  return (
    <div className={`limite-pedido ${ultrapassaraLimite ? 'warning' : ''}`}>
      <div className="limite-header">
        <strong>Limite de Crédito</strong>
        {ultrapassaraLimite && (
          <span className="badge error">Limite Excedido</span>
        )}
      </div>
      
      <div className="limite-detalhes">
        <div className="limite-item">
          <span>Disponível:</span>
          <span>{formatarMoeda(limite.valorDisponivel)}</span>
        </div>
        
        <div className="limite-item">
          <span>Valor do Pedido:</span>
          <span>{formatarMoeda(valorPedido)}</span>
        </div>
        
        <div className="limite-item">
          <span>Disponível após pedido:</span>
          <span className={ultrapassaraLimite ? 'error' : ''}>
            {formatarMoeda(valorDisponivelAposPedido)}
          </span>
        </div>
      </div>

      {ultrapassaraLimite && (
        <div className="alert alert-error">
          ⚠️ Este pedido ultrapassará o limite de crédito em{' '}
          {formatarMoeda(Math.abs(valorDisponivelAposPedido))}
        </div>
      )}
    </div>
  );
}
```

### 4. Atualizar Limite Após Criar/Cancelar Pedido

```typescript
// Função para atualizar limite após operações no pedido
async function atualizarLimiteCredito(clienteId: number) {
  try {
    const response = await axios.get(
      `/api/v1/clientes/${clienteId}/limite-credito`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );
    
    // Atualizar estado ou contexto global
    setLimiteCredito(response.data);
    
    return response.data;
  } catch (error) {
    console.error('Erro ao atualizar limite:', error);
  }
}

// Usar após criar pedido
async function criarPedido(dadosPedido: CreatePedidoDto) {
  try {
    const response = await axios.post('/api/v1/pedidos', dadosPedido, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });

    // Atualizar limite após criar pedido
    if (dadosPedido.cliente_id) {
      await atualizarLimiteCredito(dadosPedido.cliente_id);
    }

    return response.data;
  } catch (error) {
    throw error;
  }
}

// Usar após cancelar pedido
async function cancelarPedido(pedidoId: number, clienteId: number) {
  try {
    await axios.patch(`/api/v1/pedidos/${pedidoId}/cancelar`, {}, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });

    // Atualizar limite após cancelar pedido
    await atualizarLimiteCredito(clienteId);
  } catch (error) {
    throw error;
  }
}
```

## Tratamento de Erros

### Erro: Limite de Crédito Excedido

Quando o backend retorna erro 400 com mensagem sobre limite de crédito:

```typescript
try {
  await criarPedido(dadosPedido);
} catch (error: any) {
  if (error.response?.status === 400) {
    const mensagem = error.response.data.message;
    
    if (mensagem.includes('Limite de crédito')) {
      // Extrair informações da mensagem
      const match = mensagem.match(/Limite: (.+?)\. Valor já utilizado: (.+?)\. Valor do pedido: (.+?)\. Total seria: (.+?)$/);
      
      if (match) {
        const [, limite, utilizado, pedido, total] = match;
        
        // Mostrar modal ou alerta detalhado
        mostrarErroLimite({
          limite,
          utilizado,
          pedido,
          total,
        });
      } else {
        // Fallback: mostrar mensagem completa
        alert(mensagem);
      }
      
      return;
    }
  }
  
  // Outros erros
  console.error('Erro ao criar pedido:', error);
}
```

## Sugestões de UI/UX

### 1. Card de Limite de Crédito

```css
.limite-credito-card {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.limite-info {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 15px;
}

.limite-info .label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 5px;
}

.limite-info .value {
  display: block;
  font-size: 18px;
  font-weight: 600;
}

.limite-info .value.success {
  color: #4caf50;
}

.limite-info .value.error {
  color: #f44336;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 10px;
}

.progress-fill {
  height: 100%;
  background: #4caf50;
  transition: width 0.3s ease;
}

.progress-fill.error {
  background: #f44336;
}

.progress-text {
  font-size: 12px;
  color: #666;
  text-align: center;
}
```

### 2. Indicador Visual Durante Criação de Pedido

```css
.limite-pedido {
  background: #f5f5f5;
  border-left: 4px solid #4caf50;
  padding: 15px;
  margin-top: 20px;
  border-radius: 4px;
}

.limite-pedido.warning {
  border-left-color: #ff9800;
  background: #fff3e0;
}

.limite-pedido.error {
  border-left-color: #f44336;
  background: #ffebee;
}

.limite-detalhes {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 10px;
}

.limite-item {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.limite-item span:first-child {
  color: #666;
}

.limite-item span:last-child {
  font-weight: 600;
}
```

## Exemplo Completo: Hook React

```typescript
// hooks/useLimiteCredito.ts
import { useState, useEffect } from 'react';
import axios from 'axios';

interface LimiteCredito {
  limiteCredito: number;
  valorUtilizado: number;
  valorDisponivel: number;
  ultrapassouLimite: boolean;
}

export function useLimiteCredito(clienteId: number | null) {
  const [limite, setLimite] = useState<LimiteCredito | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscarLimite = async () => {
    if (!clienteId) {
      setLimite(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(
        `/api/v1/clientes/${clienteId}/limite-credito`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      
      setLimite(response.data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('Cliente não encontrado');
      } else {
        setError('Erro ao buscar limite de crédito');
      }
      setLimite(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    buscarLimite();
  }, [clienteId]);

  return {
    limite,
    loading,
    error,
    refetch: buscarLimite,
  };
}
```

**Uso do Hook:**

```typescript
function ComponentePedido({ clienteId }: { clienteId: number }) {
  const { limite, loading, error, refetch } = useLimiteCredito(clienteId);

  if (loading) return <div>Carregando limite...</div>;
  if (error) return <div>Erro: {error}</div>;
  if (!limite) return null;

  return (
    <div>
      <p>Limite disponível: {formatarMoeda(limite.valorDisponivel)}</p>
      {/* ... resto do componente */}
    </div>
  );
}
```

## Resumo das Funcionalidades

✅ **Validação Automática**: Backend valida limite ao criar pedido  
✅ **Consulta em Tempo Real**: Endpoint para buscar limite atual  
✅ **Cálculo Dinâmico**: Limite usado calculado automaticamente  
✅ **Liberação Automática**: Limite liberado ao cancelar/finalizar pedido  
✅ **Feedback Visual**: Sugestões de UI para exibir informações  

## Observações Importantes

1. **Limite Usado**: Calculado dinamicamente, não precisa ser atualizado manualmente
2. **Pedidos Considerados**: Apenas pedidos com status diferente de `CANCELADO` e `FINALIZADO`
3. **Validação Dupla**: Backend valida automaticamente, mas frontend pode validar antes para melhor UX
4. **Atualização**: Recomenda-se atualizar o limite após criar/cancelar pedidos para feedback imediato

---

**Última atualização**: 2024-01-XX

