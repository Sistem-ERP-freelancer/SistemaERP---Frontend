# 📄 Guia de Paginação - Frontend

Este documento descreve como implementar paginação no frontend seguindo o padrão do backend.

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Formato das Requisições](#formato-das-requisições)
3. [Formato das Respostas](#formato-das-respostas)
4. [Exemplos Práticos](#exemplos-práticos)
5. [Componentes de Paginação](#componentes-de-paginação)
6. [Tratamento de Erros](#tratamento-de-erros)
7. [Boas Práticas](#boas-práticas)

---

## 🎯 Visão Geral

O backend utiliza paginação baseada em **offset/limit** através de query parameters. Todas as rotas que retornam listas suportam os parâmetros `page` e `limit`.

### Padrão de Paginação

- **page**: Número da página (começa em 1)
- **limit**: Quantidade de itens por página
- **total**: Total de registros disponíveis (retornado na resposta)

---

## 📤 Formato das Requisições

### Query Parameters

Todas as rotas de listagem aceitam os seguintes query parameters:

| Parâmetro | Tipo | Obrigatório | Padrão | Descrição |
|-----------|------|-------------|--------|-----------|
| `page` | number | Não | 1 | Número da página (mínimo: 1) |
| `limit` | number | Não | Varia por módulo | Itens por página (mínimo: 1, máximo: 100) |

### Valores Padrão por Módulo

| Módulo | Rota | Padrão `limit` |
|--------|------|----------------|
| Movimentações | `GET /api/v1/estoque/movimentacoes` | 20 |
| Pedidos | `GET /api/v1/pedidos` | 15 |
| Produtos | `GET /api/v1/produtos` | 15 |
| Clientes | `GET /api/v1/clientes` | 15 |
| Fornecedores | `GET /api/v1/fornecedor` | 15 |
| Transportadoras | `GET /api/v1/transportadoras` | 15 |
| Contas Financeiras | `GET /api/v1/conta-financeira` | 15 |

### Exemplo de URL

```typescript
// Página 1, 20 itens por página
GET /api/v1/estoque/movimentacoes?page=1&limit=20

// Página 2, 50 itens por página
GET /api/v1/pedidos?page=2&limit=50

// Com filtros adicionais
GET /api/v1/pedidos?page=1&limit=15&status=PENDENTE&tipo=VENDA
```

---

## 📥 Formato das Respostas

### Estrutura Padrão

Todas as respostas de listagem seguem o padrão:

```typescript
{
  [nomeDoArray]: Array<TipoItem>,
  total: number
}
```

### Exemplos de Respostas

#### Movimentações de Estoque

```json
{
  "movimentacoes": [
    {
      "id": 1,
      "produto_id": 10,
      "produto_nome": "Produto A",
      "produto_sku": "SKU001",
      "tipo": "ENTRADA",
      "quantidade": 50,
      "estoque_anterior": 100,
      "estoque_atual": 150,
      "usuario_nome": "João Silva",
      "criado_em": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 150
}
```

#### Pedidos

```json
{
  "pedidos": [
    {
      "id": 1,
      "numero_pedido": "VEND-2024-00001",
      "tipo": "VENDA",
      "status": "PENDENTE",
      "valor_total": 1500.00
    }
  ],
  "total": 45
}
```

#### Produtos

```json
{
  "produtos": [
    {
      "id": 1,
      "nome": "Produto A",
      "sku": "SKU001",
      "preco": 99.90,
      "estoque_atual": 50
    }
  ],
  "total": 120
}
```

**Nota**: Alguns módulos podem retornar apenas o array sem o objeto wrapper. Verifique a documentação específica de cada endpoint.

---

## 💻 Exemplos Práticos

### Exemplo 1: React com TypeScript

```typescript
import { useState, useEffect } from 'react';
import axios from 'axios';

interface Movimentacao {
  id: number;
  produto_id: number;
  produto_nome: string;
  tipo: string;
  quantidade: number;
  criado_em: string;
}

interface PaginatedResponse<T> {
  movimentacoes?: T[];
  pedidos?: T[];
  produtos?: T[];
  clientes?: T[];
  total: number;
}

interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

function usePaginatedData<T>(
  endpoint: string,
  arrayKey: string,
  defaultLimit: number = 20
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: defaultLimit,
    total: 0,
    totalPages: 0,
  });

  const fetchData = async (page: number = pagination.page) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get<PaginatedResponse<T>>(endpoint, {
        params: {
          page,
          limit: pagination.limit,
        },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const items = response.data[arrayKey as keyof PaginatedResponse<T>] as T[];
      const total = response.data.total;
      const totalPages = Math.ceil(total / pagination.limit);

      setData(items || []);
      setPagination({
        ...pagination,
        page,
        total,
        totalPages,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchData(page);
    }
  };

  const changeLimit = (newLimit: number) => {
    setPagination({
      ...pagination,
      limit: newLimit,
      page: 1, // Reset para primeira página
    });
    // Recarregar dados com novo limit
    setTimeout(() => fetchData(1), 0);
  };

  return {
    data,
    loading,
    error,
    pagination,
    goToPage,
    changeLimit,
    refresh: () => fetchData(pagination.page),
  };
}

// Uso do hook
function MovimentacoesList() {
  const {
    data: movimentacoes,
    loading,
    error,
    pagination,
    goToPage,
    changeLimit,
  } = usePaginatedData<Movimentacao>(
    '/api/v1/estoque/movimentacoes',
    'movimentacoes',
    20
  );

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error}</div>;

  return (
    <div>
      <h2>Movimentações de Estoque</h2>
      
      {/* Lista de dados */}
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Produto</th>
            <th>Tipo</th>
            <th>Quantidade</th>
            <th>Data</th>
          </tr>
        </thead>
        <tbody>
          {movimentacoes.map((mov) => (
            <tr key={mov.id}>
              <td>{mov.id}</td>
              <td>{mov.produto_nome}</td>
              <td>{mov.tipo}</td>
              <td>{mov.quantidade}</td>
              <td>{new Date(mov.criado_em).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Componente de Paginação */}
      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        totalItems={pagination.total}
        itemsPerPage={pagination.limit}
        onPageChange={goToPage}
        onLimitChange={changeLimit}
      />
    </div>
  );
}
```

### Exemplo 2: Vue 3 com Composition API

```vue
<template>
  <div>
    <h2>Movimentações de Estoque</h2>
    
    <div v-if="loading">Carregando...</div>
    <div v-else-if="error">Erro: {{ error }}</div>
    <div v-else>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Produto</th>
            <th>Tipo</th>
            <th>Quantidade</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="mov in movimentacoes" :key="mov.id">
            <td>{{ mov.id }}</td>
            <td>{{ mov.produto_nome }}</td>
            <td>{{ mov.tipo }}</td>
            <td>{{ mov.quantidade }}</td>
          </tr>
        </tbody>
      </table>

      <Pagination
        :current-page="page"
        :total-pages="totalPages"
        :total-items="total"
        :items-per-page="limit"
        @page-change="handlePageChange"
        @limit-change="handleLimitChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';

interface Movimentacao {
  id: number;
  produto_nome: string;
  tipo: string;
  quantidade: number;
}

const movimentacoes = ref<Movimentacao[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const page = ref(1);
const limit = ref(20);
const total = ref(0);

const totalPages = computed(() => Math.ceil(total.value / limit.value));

const fetchMovimentacoes = async () => {
  loading.value = true;
  error.value = null;

  try {
    const response = await axios.get('/api/v1/estoque/movimentacoes', {
      params: {
        page: page.value,
        limit: limit.value,
      },
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });

    movimentacoes.value = response.data.movimentacoes || [];
    total.value = response.data.total || 0;
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Erro ao carregar dados';
  } finally {
    loading.value = false;
  }
};

const handlePageChange = (newPage: number) => {
  if (newPage >= 1 && newPage <= totalPages.value) {
    page.value = newPage;
    fetchMovimentacoes();
  }
};

const handleLimitChange = (newLimit: number) => {
  limit.value = newLimit;
  page.value = 1; // Reset para primeira página
  fetchMovimentacoes();
};

onMounted(() => {
  fetchMovimentacoes();
});
</script>
```

### Exemplo 3: Angular com RxJS

```typescript
import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

interface Movimentacao {
  id: number;
  produto_nome: string;
  tipo: string;
  quantidade: number;
}

interface PaginatedResponse {
  movimentacoes: Movimentacao[];
  total: number;
}

@Component({
  selector: 'app-movimentacoes',
  template: `
    <div>
      <h2>Movimentações de Estoque</h2>
      
      <div *ngIf="loading$ | async">Carregando...</div>
      <div *ngIf="error$ | async as error">Erro: {{ error }}</div>
      
      <table *ngIf="movimentacoes$ | async as movs">
        <thead>
          <tr>
            <th>ID</th>
            <th>Produto</th>
            <th>Tipo</th>
            <th>Quantidade</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let mov of movs">
            <td>{{ mov.id }}</td>
            <td>{{ mov.produto_nome }}</td>
            <td>{{ mov.tipo }}</td>
            <td>{{ mov.quantidade }}</td>
          </tr>
        </tbody>
      </table>

      <app-pagination
        [currentPage]="page$ | async"
        [totalPages]="totalPages$ | async"
        [totalItems]="total$ | async"
        [itemsPerPage]="limit$ | async"
        (pageChange)="goToPage($event)"
        (limitChange)="changeLimit($event)"
      ></app-pagination>
    </div>
  `,
})
export class MovimentacoesComponent implements OnInit {
  private pageSubject = new BehaviorSubject<number>(1);
  private limitSubject = new BehaviorSubject<number>(20);

  page$ = this.pageSubject.asObservable();
  limit$ = this.limitSubject.asObservable();

  movimentacoes$: Observable<Movimentacao[]>;
  total$: Observable<number>;
  totalPages$: Observable<number>;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;

  constructor(private http: HttpClient) {
    const data$ = this.pageSubject.pipe(
      switchMap((page) => {
        const params = new HttpParams()
          .set('page', page.toString())
          .set('limit', this.limitSubject.value.toString());

        return this.http.get<PaginatedResponse>(
          '/api/v1/estoque/movimentacoes',
          { params }
        );
      })
    );

    this.movimentacoes$ = data$.pipe(map((res) => res.movimentacoes || []));
    this.total$ = data$.pipe(map((res) => res.total || 0));
    this.totalPages$ = this.total$.pipe(
      map((total) => Math.ceil(total / this.limitSubject.value))
    );
    this.loading$ = new BehaviorSubject<boolean>(false).asObservable();
    this.error$ = new BehaviorSubject<string | null>(null).asObservable();
  }

  ngOnInit(): void {
    // Dados são carregados automaticamente via Observable
  }

  goToPage(page: number): void {
    this.pageSubject.next(page);
  }

  changeLimit(limit: number): void {
    this.limitSubject.next(limit);
    this.pageSubject.next(1); // Reset para primeira página
  }
}
```

---

## 🧩 Componentes de Paginação

### Componente React de Exemplo

```typescript
import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  showLimitSelector?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onLimitChange,
  showLimitSelector = true,
}) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      // Mostrar todas as páginas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Lógica para mostrar páginas com ellipsis
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="pagination">
      {/* Informações */}
      <div className="pagination-info">
        Mostrando {startItem} a {endItem} de {totalItems} resultados
      </div>

      {/* Controles de página */}
      <div className="pagination-controls">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          aria-label="Primeira página"
        >
          ««
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Página anterior"
        >
          ‹
        </button>

        {getPageNumbers().map((page, index) => (
          <React.Fragment key={index}>
            {page === '...' ? (
              <span className="ellipsis">...</span>
            ) : (
              <button
                onClick={() => onPageChange(page as number)}
                className={currentPage === page ? 'active' : ''}
                aria-label={`Página ${page}`}
              >
                {page}
              </button>
            )}
          </React.Fragment>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Próxima página"
        >
          ›
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          aria-label="Última página"
        >
          »»
        </button>
      </div>

      {/* Seletor de itens por página */}
      {showLimitSelector && onLimitChange && (
        <div className="pagination-limit">
          <label>
            Itens por página:
            <select
              value={itemsPerPage}
              onChange={(e) => onLimitChange(Number(e.target.value))}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </label>
        </div>
      )}
    </div>
  );
};
```

### Estilos CSS (Exemplo)

```css
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 8px;
}

.pagination-info {
  color: #666;
  font-size: 14px;
}

.pagination-controls {
  display: flex;
  gap: 5px;
}

.pagination-controls button {
  padding: 8px 12px;
  border: 1px solid #ddd;
  background: white;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.pagination-controls button:hover:not(:disabled) {
  background: #e0e0e0;
}

.pagination-controls button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-controls button.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.pagination-limit select {
  padding: 5px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-left: 10px;
}
```

---

## ⚠️ Tratamento de Erros

### Validação de Parâmetros

```typescript
function validatePaginationParams(page: number, limit: number): boolean {
  if (page < 1) {
    console.error('Page deve ser maior ou igual a 1');
    return false;
  }
  
  if (limit < 1 || limit > 100) {
    console.error('Limit deve estar entre 1 e 100');
    return false;
  }
  
  return true;
}
```

### Tratamento de Erros HTTP

```typescript
async function fetchPaginatedData(endpoint: string, page: number, limit: number) {
  try {
    const response = await axios.get(endpoint, {
      params: { page, limit },
    });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      // Erro do servidor
      switch (error.response.status) {
        case 400:
          throw new Error('Parâmetros de paginação inválidos');
        case 401:
          throw new Error('Não autenticado. Faça login novamente.');
        case 403:
          throw new Error('Sem permissão para acessar este recurso');
        case 404:
          throw new Error('Recurso não encontrado');
        case 500:
          throw new Error('Erro interno do servidor');
        default:
          throw new Error('Erro ao carregar dados');
      }
    } else if (error.request) {
      // Erro de rede
      throw new Error('Erro de conexão. Verifique sua internet.');
    } else {
      // Outro erro
      throw new Error('Erro inesperado');
    }
  }
}
```

---

## ✅ Boas Práticas

### 1. Cache e Otimização

```typescript
// Usar cache para evitar requisições desnecessárias
const cache = new Map<string, any>();

async function fetchWithCache(
  endpoint: string,
  page: number,
  limit: number
) {
  const cacheKey = `${endpoint}?page=${page}&limit=${limit}`;
  
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }
  
  const data = await fetchPaginatedData(endpoint, page, limit);
  cache.set(cacheKey, data);
  
  // Limpar cache após 5 minutos
  setTimeout(() => cache.delete(cacheKey), 5 * 60 * 1000);
  
  return data;
}
```

### 2. Debounce para Busca

```typescript
import { debounce } from 'lodash';

// Aplicar debounce em buscas para evitar muitas requisições
const debouncedSearch = debounce((searchTerm: string) => {
  fetchData(1, 20, searchTerm);
}, 300);
```

### 3. Loading States

```typescript
// Sempre mostrar estados de loading
const [loading, setLoading] = useState(false);
const [skeletonLoading, setSkeletonLoading] = useState(true);

// Skeleton loading na primeira carga
// Spinner em mudanças de página
```

### 4. Validação de Dados

```typescript
// Validar estrutura da resposta
function validateResponse(data: any): boolean {
  if (!data || typeof data !== 'object') {
    return false;
  }
  
  if (typeof data.total !== 'number' || data.total < 0) {
    return false;
  }
  
  // Validar se o array existe (pode ter nomes diferentes)
  const hasArray = 
    Array.isArray(data.movimentacoes) ||
    Array.isArray(data.pedidos) ||
    Array.isArray(data.produtos) ||
    Array.isArray(data.clientes);
  
  return hasArray;
}
```

### 5. Acessibilidade

```typescript
// Adicionar atributos ARIA para acessibilidade
<nav aria-label="Paginação">
  <button
    aria-label="Página anterior"
    aria-disabled={currentPage === 1}
  >
    Anterior
  </button>
  
  <span aria-current="page">
    Página {currentPage} de {totalPages}
  </span>
  
  <button
    aria-label="Próxima página"
    aria-disabled={currentPage === totalPages}
  >
    Próxima
  </button>
</nav>
```

---

## 📚 Rotas com Paginação Disponíveis

### Estoque
- `GET /api/v1/estoque/movimentacoes?page=1&limit=20`
- `GET /api/v1/estoque/produtos/:id/historico?page=1&limit=20`
- `GET /api/v1/estoque/baixo?page=1&limit=20`
- `GET /api/v1/estoque/critico?page=1&limit=20`

### Pedidos
- `GET /api/v1/pedidos?page=1&limit=15`
- `GET /api/v1/pedidos?page=1&limit=15&status=PENDENTE&tipo=VENDA`

### Produtos
- `GET /api/v1/produtos?page=1&limit=15`
- `GET /api/v1/produtos?page=1&limit=15&statusProduto=ATIVO`
- `GET /api/v1/produtos/buscar-avancado?page=1&limit=15&termo=...`

### Clientes
- `GET /api/v1/clientes?page=1&limit=15`
- `GET /api/v1/clientes/buscar-avancado?page=1&limit=15&termo=...`

### Fornecedores
- `GET /api/v1/fornecedor?page=1&limit=15`
- `GET /api/v1/fornecedor/buscar-avancado?page=1&limit=15&termo=...`

### Transportadoras
- `GET /api/v1/transportadoras?page=1&limit=15`

### Contas Financeiras
- `GET /api/v1/conta-financeira?page=1&limit=15`

---

## 🔗 Recursos Adicionais

- Documentação da API: `/api/docs` (Swagger)
- Base URL: `https://sistemaerp-3.onrender.com/api/v1`
- Autenticação: Bearer Token (JWT)

---

## 📝 Notas Importantes

1. **Índice começa em 1**: A primeira página é sempre `page=1`, não `page=0`
2. **Total de páginas**: Calcule usando `Math.ceil(total / limit)`
3. **Limite máximo**: O backend aceita até 100 itens por página
4. **Filtros**: Podem ser combinados com paginação em algumas rotas
5. **Ordenação**: Os dados já vêm ordenados do backend (geralmente por data de criação DESC)

---

**Última atualização**: Janeiro 2024
**Versão do Backend**: 1.0.0


