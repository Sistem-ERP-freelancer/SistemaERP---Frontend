# 📅 Guia - Filtro de Datas no Módulo de Pedidos

Este guia explica como usar o filtro de datas inicial e final para listar pedidos.

---

## ✅ Status

**Filtro de datas implementado e funcionando!**

---

## 🔗 Endpoint

```
GET /api/v1/pedidos
```

---

## 📋 Parâmetros de Query

### Filtros de Data

| Parâmetro | Tipo | Obrigatório | Formato | Descrição |
|-----------|------|-------------|---------|-----------|
| `data_inicial` | string | Não | `YYYY-MM-DD` | Data inicial do período (inclusiva) |
| `data_final` | string | Não | `YYYY-MM-DD` | Data final do período (inclusiva) |

### Outros Filtros Disponíveis

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `tipo` | `VENDA` \| `COMPRA` | Filtrar por tipo de pedido |
| `status` | `PENDENTE` \| `APROVADO` \| `EM_PROCESSAMENTO` \| `CONCLUIDO` \| `CANCELADO` | Filtrar por status |
| `cliente_id` | number | Filtrar por ID do cliente |
| `cliente_nome` | string | Buscar por nome do cliente (busca parcial) |
| `fornecedor_id` | number | Filtrar por ID do fornecedor |
| `fornecedor_nome` | string | Buscar por nome do fornecedor (busca parcial) |
| `page` | number | Número da página (padrão: 1) |
| `limit` | number | Itens por página (padrão: 15) |

---

## 💻 Exemplos de Uso

### Exemplo 1: Filtrar por Período Específico

```typescript
// Buscar pedidos entre 04/01/2026 e 10/01/2026
const response = await fetch(
  'http://seu-backend.com/api/v1/pedidos?data_inicial=2026-01-04&data_final=2026-01-10',
  {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }
);

const { pedidos, total } = await response.json();
```

### Exemplo 2: Filtrar por Data Inicial Apenas

```typescript
// Buscar pedidos a partir de 01/01/2026
const response = await fetch(
  'http://seu-backend.com/api/v1/pedidos?data_inicial=2026-01-01',
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

const { pedidos, total } = await response.json();
```

### Exemplo 3: Filtrar por Data Final Apenas

```typescript
// Buscar pedidos até 31/01/2026
const response = await fetch(
  'http://seu-backend.com/api/v1/pedidos?data_final=2026-01-31',
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

const { pedidos, total } = await response.json();
```

### Exemplo 4: Combinar Filtros (Data + Tipo + Status)

```typescript
// Buscar pedidos de VENDA, status CONCLUIDO, entre 04/01/2026 e 10/01/2026
const url = new URL('http://seu-backend.com/api/v1/pedidos');
url.searchParams.append('data_inicial', '2026-01-04');
url.searchParams.append('data_final', '2026-01-10');
url.searchParams.append('tipo', 'VENDA');
url.searchParams.append('status', 'CONCLUIDO');

const response = await fetch(url.toString(), {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { pedidos, total } = await response.json();
```

### Exemplo 5: Usando Axios

```typescript
import axios from 'axios';

const response = await axios.get('http://seu-backend.com/api/v1/pedidos', {
  params: {
    data_inicial: '2026-01-04',
    data_final: '2026-01-10',
    tipo: 'VENDA',
    status: 'CONCLUIDO',
    page: 1,
    limit: 15
  },
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { pedidos, total } = response.data;
```

### Exemplo 6: Implementação no Frontend (React)

```typescript
import React, { useState, useEffect } from 'react';

interface FiltrosPedidos {
  data_inicial?: string;
  data_final?: string;
  tipo?: 'VENDA' | 'COMPRA';
  status?: string;
}

const ListaPedidos: React.FC = () => {
  const [pedidos, setPedidos] = useState([]);
  const [filtros, setFiltros] = useState<FiltrosPedidos>({
    data_inicial: '',
    data_final: '',
    tipo: undefined,
    status: undefined
  });

  const buscarPedidos = async () => {
    const params = new URLSearchParams();
    
    if (filtros.data_inicial) {
      params.append('data_inicial', filtros.data_inicial);
    }
    if (filtros.data_final) {
      params.append('data_final', filtros.data_final);
    }
    if (filtros.tipo) {
      params.append('tipo', filtros.tipo);
    }
    if (filtros.status) {
      params.append('status', filtros.status);
    }

    const response = await fetch(
      `http://seu-backend.com/api/v1/pedidos?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );

    const data = await response.json();
    setPedidos(data.pedidos);
  };

  useEffect(() => {
    buscarPedidos();
  }, [filtros]);

  return (
    <div>
      <div className="filtros">
        <input
          type="date"
          value={filtros.data_inicial || ''}
          onChange={(e) => setFiltros({ ...filtros, data_inicial: e.target.value })}
          placeholder="Data Inicial"
        />
        <input
          type="date"
          value={filtros.data_final || ''}
          onChange={(e) => setFiltros({ ...filtros, data_final: e.target.value })}
          placeholder="Data Final"
        />
        {/* Outros filtros... */}
      </div>
      {/* Lista de pedidos... */}
    </div>
  );
};
```

---

## 📝 Formato de Data

### Formato Aceito

- **Formato:** `YYYY-MM-DD`
- **Exemplos válidos:**
  - `2026-01-04`
  - `2026-01-10`
  - `2026-12-31`

### Validações

1. ✅ **Formato:** Deve seguir o padrão `YYYY-MM-DD`
2. ✅ **Data válida:** Deve ser uma data válida
3. ✅ **Ordem:** `data_inicial` não pode ser maior que `data_final`

### Erros Possíveis

#### Erro 400: Data inválida

```json
{
  "statusCode": 400,
  "message": "Data inicial inválida. Use o formato YYYY-MM-DD"
}
```

**Solução:** Verifique se a data está no formato correto (`YYYY-MM-DD`).

#### Erro 400: Data inicial maior que final

```json
{
  "statusCode": 400,
  "message": "Data inicial não pode ser maior que data final"
}
```

**Solução:** Certifique-se de que `data_inicial` <= `data_final`.

---

## 🔍 Como Funciona

### Lógica de Filtro

O filtro de datas funciona da seguinte forma:

1. **Apenas `data_inicial` informada:**
   - Retorna pedidos onde `data_pedido >= data_inicial`

2. **Apenas `data_final` informada:**
   - Retorna pedidos onde `data_pedido <= data_final`

3. **Ambas informadas:**
   - Retorna pedidos onde `data_inicial <= data_pedido <= data_final`

### Campo Utilizado

O filtro utiliza o campo `data_pedido` da tabela `tb_pedido`.

---

## 📊 Exemplo de Resposta

```json
{
  "pedidos": [
    {
      "id": 1,
      "numero_pedido": "VEND-2026-00001",
      "tipo": "VENDA",
      "status": "CONCLUIDO",
      "data_pedido": "2026-01-05",
      "valor_total": 144.04,
      "cliente": {
        "id": 1,
        "nome": "Cliente 1 EMP1"
      },
      "itens": [...]
    },
    {
      "id": 2,
      "numero_pedido": "VEND-2026-00002",
      "tipo": "VENDA",
      "status": "PENDENTE",
      "data_pedido": "2026-01-08",
      "valor_total": 500.00,
      "cliente": {
        "id": 2,
        "nome": "Cliente 2 EMP1"
      },
      "itens": [...]
    }
  ],
  "total": 2
}
```

---

## ✅ Resumo

- ✅ Filtro de `data_inicial` implementado
- ✅ Filtro de `data_final` implementado
- ✅ Validação de formato de data
- ✅ Validação de ordem das datas
- ✅ Pode ser combinado com outros filtros
- ✅ Funciona com paginação

---

**Última atualização:** Janeiro 2026  
**Versão do Backend:** NestJS com TypeORM  
**Status:** ✅ Implementado e funcionando

