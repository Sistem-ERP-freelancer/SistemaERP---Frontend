# Guia Frontend - Envio de Dados de Produto

## 📋 Campos de Localização e Estoque Máximo

O backend agora aceita os campos `localizacao` e `estoque_maximo` na criação de produtos. Este guia explica como enviar esses dados corretamente.

---

## 🔧 Endpoint

**POST** `/produtos` ou `/produto`

**Autenticação:** Requerida (Bearer Token)

**Permissões:** ADMIN, GERENTE ou VENDEDOR

---

## 📦 Estrutura do Payload

### Campos Obrigatórios

```json
{
  "nome": "string (2-255 caracteres)",
  "sku": "string (máx 100 caracteres)",
  "preco_custo": "number (decimal)",
  "preco_venda": "number (decimal)",
  "estoque_atual": "number",
  "estoque_minimo": "number"
}
```

### Campos Opcionais (incluindo os novos)

```json
{
  "descricao": "string (máx 2000 caracteres)",
  "preco_promocional": "number (decimal)",
  "estoque_maximo": "number",           // ⭐ NOVO CAMPO
  "localizacao": "string (máx 255 caracteres)", // ⭐ NOVO CAMPO
  "statusProduto": "ATIVO | INATIVO",
  "unidade_medida": "UN | KG | LT | CX",
  "data_validade": "YYYY-MM-DD",
  "ncm": "string (máx 20 caracteres)",
  "cest": "string (máx 20 caracteres)",
  "cfop": "string (máx 20 caracteres)",
  "observacoes": "string",
  "peso": "number (decimal)",
  "altura": "number (decimal)",
  "largura": "number (decimal)",
  "categoriaId": "number",
  "fornecedorId": "number"
}
```

---

## 📝 Exemplo Completo de Requisição

### JavaScript/TypeScript (Fetch API)

```javascript
const criarProduto = async () => {
  const produtoData = {
    nome: "Notebook Dell Inspiron",
    descricao: "Notebook com processador Intel i5, 8GB RAM, SSD 256GB",
    sku: "NOTE-DELL-001",
    preco_custo: 1500.00,
    preco_venda: 2000.00,
    preco_promocional: 1800.00,
    estoque_atual: 50,
    estoque_minimo: 10,
    estoque_maximo: 1000,        // ⭐ Campo novo
    localizacao: "Prateleira A-15", // ⭐ Campo novo
    statusProduto: "ATIVO",
    unidade_medida: "UN",
    categoriaId: 1,
    fornecedorId: 1
  };

  try {
    const response = await fetch('http://seu-backend.com/produtos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${seuToken}`
      },
      body: JSON.stringify(produtoData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao criar produto');
    }

    const produto = await response.json();
    console.log('Produto criado:', produto);
    return produto;
  } catch (error) {
    console.error('Erro:', error);
    throw error;
  }
};
```

### Axios

```javascript
import axios from 'axios';

const criarProduto = async () => {
  const produtoData = {
    nome: "Notebook Dell Inspiron",
    sku: "NOTE-DELL-001",
    preco_custo: 1500.00,
    preco_venda: 2000.00,
    estoque_atual: 50,
    estoque_minimo: 10,
    estoque_maximo: 1000,        // ⭐ Campo novo
    localizacao: "Prateleira A-15" // ⭐ Campo novo
  };

  try {
    const response = await axios.post(
      'http://seu-backend.com/produtos',
      produtoData,
      {
        headers: {
          'Authorization': `Bearer ${seuToken}`
        }
      }
    );

    console.log('Produto criado:', response.data);
    return response.data;
  } catch (error) {
    console.error('Erro:', error.response?.data || error.message);
    throw error;
  }
};
```

### React Hook Form (Exemplo)

```typescript
import { useForm } from 'react-hook-form';
import axios from 'axios';

interface ProdutoFormData {
  nome: string;
  sku: string;
  preco_custo: number;
  preco_venda: number;
  estoque_atual: number;
  estoque_minimo: number;
  estoque_maximo?: number;      // ⭐ Campo novo (opcional)
  localizacao?: string;         // ⭐ Campo novo (opcional)
  // ... outros campos
}

const ProdutoForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<ProdutoFormData>();

  const onSubmit = async (data: ProdutoFormData) => {
    try {
      const response = await axios.post(
        'http://seu-backend.com/produtos',
        data,
        {
          headers: {
            'Authorization': `Bearer ${seuToken}`
          }
        }
      );
      console.log('Produto criado:', response.data);
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Campos obrigatórios */}
      <input {...register('nome', { required: true })} />
      <input {...register('sku', { required: true })} />
      <input type="number" {...register('preco_custo', { required: true })} />
      <input type="number" {...register('preco_venda', { required: true })} />
      <input type="number" {...register('estoque_atual', { required: true })} />
      <input type="number" {...register('estoque_minimo', { required: true })} />
      
      {/* ⭐ Novos campos opcionais */}
      <input 
        type="number" 
        {...register('estoque_maximo')} 
        placeholder="Estoque Máximo (opcional)"
      />
      <input 
        {...register('localizacao')} 
        placeholder="Localização (opcional)"
        maxLength={255}
      />
      
      <button type="submit">Criar Produto</button>
    </form>
  );
};
```

---

## ✅ Validações

### `estoque_maximo`
- **Tipo:** `number` (opcional)
- **Validação:** Deve ser um número válido
- **Exemplo:** `1000`

### `localizacao`
- **Tipo:** `string` (opcional)
- **Validação:** Máximo de 255 caracteres
- **Exemplo:** `"Prateleira A-15"` ou `"Armazém 2 - Setor B"`

---

## ⚠️ Observações Importantes

1. **Campos Opcionais:** Tanto `estoque_maximo` quanto `localizacao` são opcionais. Se não forem enviados, serão salvos como `null` no banco de dados.

2. **Nomenclatura:** Use exatamente os nomes dos campos em **snake_case**:
   - ✅ `estoque_maximo` (correto)
   - ❌ `estoqueMaximo` (incorreto)
   - ✅ `localizacao` (correto)
   - ❌ `localização` (incorreto - sem acento)

3. **Tipos de Dados:**
   - `estoque_maximo`: Deve ser um número (não string)
   - `localizacao`: Deve ser uma string

4. **Resposta do Backend:** Após criar o produto, a resposta incluirá os campos `estoque_maximo` e `localizacao` se foram enviados.

---

## 🔍 Exemplo de Resposta do Backend

```json
{
  "id": 1,
  "nome": "Notebook Dell Inspiron",
  "sku": "NOTE-DELL-001",
  "preco_custo": 1500.00,
  "preco_venda": 2000.00,
  "estoque_atual": 50,
  "estoque_minimo": 10,
  "estoque_maximo": 1000,        // ⭐ Retornado se foi enviado
  "localizacao": "Prateleira A-15", // ⭐ Retornado se foi enviado
  "statusProduto": "ATIVO",
  "criadoEm": "2024-01-15T10:30:00.000Z",
  "atualizadoEm": "2024-01-15T10:30:00.000Z"
}
```

---

## 🐛 Troubleshooting

### Problema: Campos não estão sendo salvos

**Solução:** Verifique se:
1. Os nomes dos campos estão exatamente como especificado (`estoque_maximo` e `localizacao`)
2. O Content-Type do header está como `application/json`
3. Os dados estão sendo enviados no body da requisição (não na query string)

### Problema: Erro de validação

**Solução:** Verifique:
- `estoque_maximo` é um número válido (não string)
- `localizacao` não excede 255 caracteres
- Os campos obrigatórios estão presentes

---

## 📞 Suporte

Se encontrar problemas ao enviar esses campos, verifique:
1. A versão do backend está atualizada
2. O token de autenticação está válido
3. O formato JSON está correto

---

**Última atualização:** Janeiro 2024

