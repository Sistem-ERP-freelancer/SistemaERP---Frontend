# 📘 Guia de Implementação Frontend - Atualização de Clientes e Fornecedores

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Como Funciona no Backend](#como-funciona-no-backend)
3. [O que o Backend Espera Receber](#o-que-o-backend-espera-receber)
4. [Implementação no Frontend](#implementação-no-frontend)
5. [Exemplos Práticos](#exemplos-práticos)
6. [Comportamentos Importantes](#comportamentos-importantes)
7. [Tratamento de Erros](#tratamento-de-erros)

---

## 🎯 Visão Geral

Este guia descreve como implementar a funcionalidade de **atualização parcial** de Clientes e Fornecedores no frontend, incluindo o gerenciamento de **endereços** e **contatos**.

### Funcionalidades Principais
- ✅ Atualização parcial de campos (apenas campos enviados são atualizados)
- ✅ Adicionar novos endereços/contatos
- ✅ Atualizar endereços/contatos existentes
- ✅ Remover endereços/contatos não enviados
- ✅ Valores vazios são convertidos para `NULL` no banco
- ✅ Validação de pertencimento (endereço/contato pertence ao cliente/fornecedor)

---

## 🔧 Como Funciona no Backend

### Endpoints Disponíveis

#### Clientes
```
PATCH /clientes/:id
```
- **Autenticação**: Requerida (JWT)
- **Roles**: ADMIN ou GERENTE
- **Content-Type**: `application/json`

#### Fornecedores
```
PATCH /fornecedor/:id
```
- **Autenticação**: Requerida (JWT)
- **Roles**: ADMIN ou GERENTE
- **Content-Type**: `application/json`

### Lógica de Processamento

#### 1. **Campos do Cliente/Fornecedor**
- Apenas campos **enviados** são atualizados
- Campos **não enviados** (`undefined`) permanecem inalterados
- Campos **vazios** (`""`) são convertidos para `NULL` no banco

#### 2. **Endereços**
- **Se o array `enderecos` for enviado**:
  - Endereços **com `id`**: são atualizados (verifica se pertence ao cliente/fornecedor)
  - Endereços **sem `id`**: são criados como novos
  - Endereços **não enviados no array**: são **REMOVIDOS**
- **Se o array `enderecos` NÃO for enviado** (`undefined`): mantém todos os endereços existentes

#### 3. **Contatos**
- **Se o array `contatos`/`contato` for enviado**:
  - Contatos **com `id`**: são atualizados (verifica se pertence ao cliente/fornecedor)
  - Contatos **sem `id`**: são criados como novos
  - Contatos **não enviados no array**: são **REMOVIDOS**
- **Se o array `contatos`/`contato` NÃO for enviado** (`undefined`): mantém todos os contatos existentes

---

## 📤 O que o Backend Espera Receber

### Estrutura do Payload

#### Para Clientes
```typescript
interface UpdateClientePayload {
  // Campos opcionais do cliente
  nome?: string;
  tipoPessoa?: 'PESSOA_FISICA' | 'PESSOA_JURIDICA';
  statusCliente?: 'ATIVO' | 'INATIVO' | 'BLOQUEADO';
  cpf_cnpj?: string; // 11 dígitos (CPF) ou 14 dígitos (CNPJ)
  nome_fantasia?: string | null;
  nome_razao?: string | null;
  inscricao_estadual?: string | null;
  
  // Array de endereços (OPCIONAL - se não enviar, mantém existentes)
  enderecos?: UpdateEndereco[];
  
  // Array de contatos (OPCIONAL - se não enviar, mantém existentes)
  contatos?: UpdateContato[]; // ou contato?: UpdateContato[]
}

interface UpdateEndereco {
  id?: number; // Se tiver ID, atualiza; se não tiver, cria novo
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  referencia?: string | null;
}

interface UpdateContato {
  id?: number; // Se tiver ID, atualiza; se não tiver, cria novo
  telefone?: string; // Obrigatório para criar novo
  email?: string | null;
  nomeContato?: string | null;
  outroTelefone?: string | null;
  nomeOutroTelefone?: string | null;
  observacao?: string | null;
  ativo?: boolean;
}
```

#### Para Fornecedores
```typescript
interface UpdateFornecedorPayload {
  // Campos opcionais do fornecedor
  nome_fantasia?: string | null;
  nome_razao?: string | null;
  tipoFornecedor?: 'PESSOA_FISICA' | 'PESSOA_JURIDICA';
  statusFornecedor?: 'ATIVO' | 'INATIVO' | 'BLOQUEADO';
  cpf_cnpj?: string; // 11 dígitos (CPF) ou 14 dígitos (CNPJ)
  inscricao_estadual?: string | null;
  
  // Array de endereços (OPCIONAL - se não enviar, mantém existentes)
  enderecos?: UpdateEndereco[];
  
  // Array de contatos (OPCIONAL - se não enviar, mantém existentes)
  contato?: UpdateContato[]; // Note: singular "contato" para fornecedores
}
```

### Regras Importantes

1. **Campos não enviados** (`undefined`): não são alterados
2. **Campos vazios** (`""`): são convertidos para `NULL` no banco
3. **Arrays não enviados** (`undefined`): mantém todos os itens existentes
4. **Arrays vazios** (`[]`): remove todos os itens
5. **IDs nos arrays**: devem ser números (não strings)

---

## 💻 Implementação no Frontend

### 1. Estrutura de Dados no Estado

```typescript
// Exemplo com React/TypeScript
interface ClienteFormState {
  // Campos principais
  nome?: string;
  tipoPessoa?: 'PESSOA_FISICA' | 'PESSOA_JURIDICA';
  cpf_cnpj?: string;
  // ... outros campos
  
  // Arrays de relacionamentos
  enderecos: EnderecoForm[];
  contatos: ContatoForm[];
}

interface EnderecoForm {
  id?: number; // ID do endereço existente (se houver)
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  referencia?: string;
  isNew?: boolean; // Flag para identificar novos endereços no frontend
}

interface ContatoForm {
  id?: number; // ID do contato existente (se houver)
  telefone?: string;
  email?: string;
  nomeContato?: string;
  outroTelefone?: string;
  nomeOutroTelefone?: string;
  observacao?: string;
  ativo?: boolean;
  isNew?: boolean; // Flag para identificar novos contatos no frontend
}
```

### 2. Função de Preparação do Payload

```typescript
function prepararPayloadAtualizacao(
  dadosForm: ClienteFormState,
  camposAlterados: string[] // Campos que foram realmente alterados
): UpdateClientePayload {
  const payload: UpdateClientePayload = {};
  
  // 1. Adicionar apenas campos que foram alterados
  if (camposAlterados.includes('nome') && dadosForm.nome !== undefined) {
    payload.nome = dadosForm.nome || null; // "" vira null
  }
  
  if (camposAlterados.includes('cpf_cnpj') && dadosForm.cpf_cnpj !== undefined) {
    payload.cpf_cnpj = dadosForm.cpf_cnpj.replace(/\D/g, ''); // Remove formatação
  }
  
  // ... outros campos
  
  // 2. Processar endereços
  // IMPORTANTE: Só enviar o array se houver alterações
  if (camposAlterados.includes('enderecos')) {
    payload.enderecos = dadosForm.enderecos.map(endereco => ({
      // Incluir ID apenas se não for novo
      ...(endereco.id && !endereco.isNew ? { id: endereco.id } : {}),
      cep: endereco.cep || null,
      logradouro: endereco.logradouro || null,
      numero: endereco.numero || null,
      complemento: endereco.complemento || null,
      bairro: endereco.bairro || null,
      cidade: endereco.cidade || null,
      estado: endereco.estado || null,
      referencia: endereco.referencia || null,
    }));
  }
  // Se não incluir 'enderecos' no payload, o backend mantém os existentes
  
  // 3. Processar contatos
  if (camposAlterados.includes('contatos')) {
    payload.contatos = dadosForm.contatos.map(contato => ({
      // Incluir ID apenas se não for novo
      ...(contato.id && !contato.isNew ? { id: contato.id } : {}),
      telefone: contato.telefone, // Obrigatório
      email: contato.email || null,
      nomeContato: contato.nomeContato || null,
      outroTelefone: contato.outroTelefone || null,
      nomeOutroTelefone: contato.nomeOutroTelefone || null,
      observacao: contato.observacao || null,
      ativo: contato.ativo !== undefined ? contato.ativo : true,
    }));
  }
  
  return payload;
}
```

### 3. Função de Atualização (Exemplo com Axios)

```typescript
async function atualizarCliente(
  clienteId: number,
  payload: UpdateClientePayload
): Promise<Cliente> {
  try {
    const response = await axios.patch(
      `/clientes/${clienteId}`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // Tratar erros específicos
      if (error.response?.status === 404) {
        throw new Error('Cliente não encontrado');
      }
      if (error.response?.status === 400) {
        throw new Error(error.response.data.message || 'Dados inválidos');
      }
      if (error.response?.status === 409) {
        throw new Error('CPF/CNPJ já cadastrado');
      }
    }
    throw error;
  }
}
```

### 4. Componente de Formulário (Exemplo React)

```typescript
function ClienteEditForm({ clienteId }: { clienteId: number }) {
  const [formData, setFormData] = useState<ClienteFormState>({
    enderecos: [],
    contatos: []
  });
  const [camposAlterados, setCamposAlterados] = useState<Set<string>>(new Set());
  
  // Carregar dados iniciais
  useEffect(() => {
    carregarCliente(clienteId).then(cliente => {
      setFormData({
        nome: cliente.nome,
        cpf_cnpj: cliente.cpf_cnpj,
        enderecos: cliente.enderecos || [],
        contatos: cliente.contatos || []
      });
    });
  }, [clienteId]);
  
  // Adicionar novo endereço
  const adicionarEndereco = () => {
    setFormData(prev => ({
      ...prev,
      enderecos: [...prev.enderecos, { isNew: true }]
    }));
    setCamposAlterados(prev => new Set([...prev, 'enderecos']));
  };
  
  // Remover endereço
  const removerEndereco = (index: number) => {
    setFormData(prev => ({
      ...prev,
      enderecos: prev.enderecos.filter((_, i) => i !== index)
    }));
    setCamposAlterados(prev => new Set([...prev, 'enderecos']));
  };
  
  // Atualizar endereço
  const atualizarEndereco = (index: number, campo: string, valor: string) => {
    setFormData(prev => ({
      ...prev,
      enderecos: prev.enderecos.map((endereco, i) =>
        i === index ? { ...endereco, [campo]: valor } : endereco
      )
    }));
    setCamposAlterados(prev => new Set([...prev, 'enderecos']));
  };
  
  // Mesma lógica para contatos...
  
  // Salvar alterações
  const handleSalvar = async () => {
    const payload = prepararPayloadAtualizacao(formData, Array.from(camposAlterados));
    
    try {
      const clienteAtualizado = await atualizarCliente(clienteId, payload);
      // Atualizar estado com dados retornados
      setFormData({
        nome: clienteAtualizado.nome,
        enderecos: clienteAtualizado.enderecos,
        contatos: clienteAtualizado.contatos
      });
      setCamposAlterados(new Set());
      alert('Cliente atualizado com sucesso!');
    } catch (error) {
      alert(`Erro ao atualizar: ${error.message}`);
    }
  };
  
  return (
    <form>
      {/* Campos do cliente */}
      <input
        value={formData.nome || ''}
        onChange={(e) => {
          setFormData(prev => ({ ...prev, nome: e.target.value }));
          setCamposAlterados(prev => new Set([...prev, 'nome']));
        }}
      />
      
      {/* Lista de endereços */}
      <div>
        <h3>Endereços</h3>
        <button type="button" onClick={adicionarEndereco}>
          + Adicionar Endereço
        </button>
        
        {formData.enderecos.map((endereco, index) => (
          <div key={index}>
            <input
              placeholder="CEP"
              value={endereco.cep || ''}
              onChange={(e) => atualizarEndereco(index, 'cep', e.target.value)}
            />
            <input
              placeholder="Logradouro"
              value={endereco.logradouro || ''}
              onChange={(e) => atualizarEndereco(index, 'logradouro', e.target.value)}
            />
            {/* ... outros campos */}
            <button
              type="button"
              onClick={() => removerEndereco(index)}
            >
              Remover
            </button>
          </div>
        ))}
      </div>
      
      {/* Lista de contatos */}
      {/* ... similar aos endereços */}
      
      <button type="button" onClick={handleSalvar}>
        Salvar Alterações
      </button>
    </form>
  );
}
```

---

## 📝 Exemplos Práticos

### Exemplo 1: Atualizar apenas nome do cliente
```json
{
  "nome": "João Silva Santos"
}
```
**Resultado**: Apenas o nome é atualizado. Endereços e contatos permanecem inalterados.

### Exemplo 2: Adicionar novo endereço
```json
{
  "enderecos": [
    { "id": 1, "cep": "01310-100", "logradouro": "Av. Paulista" },
    { "cep": "04567-890", "cidade": "São Paulo", "estado": "SP" }
  ]
}
```
**Resultado**: 
- Endereço com `id: 1` é atualizado
- Novo endereço é criado
- Outros endereços são removidos

### Exemplo 3: Remover todos os endereços
```json
{
  "enderecos": []
}
```
**Resultado**: Todos os endereços são removidos.

### Exemplo 4: Atualizar endereço e limpar campo
```json
{
  "enderecos": [
    {
      "id": 1,
      "cep": "01310-100",
      "complemento": ""  // String vazia vira NULL
    }
  ]
}
```
**Resultado**: O endereço é atualizado e o campo `complemento` é limpo (NULL).

### Exemplo 5: Atualizar múltiplos campos
```json
{
  "nome": "João Silva",
  "cpf_cnpj": "12345678900",
  "enderecos": [
    { "id": 1, "cep": "01310-100" },
    { "cep": "04567-890", "cidade": "São Paulo" }
  ],
  "contatos": [
    { "id": 1, "telefone": "11999999999" },
    { "telefone": "11888888888", "email": "novo@email.com" }
  ]
}
```
**Resultado**: Todos os campos são atualizados conforme especificado.

---

## ⚠️ Comportamentos Importantes

### 1. **Arrays Não Enviados vs Arrays Vazios**

```typescript
// ❌ ERRADO: Não enviar o campo (mantém existentes)
const payload1 = {
  nome: "João"
  // enderecos não está presente
};

// ✅ CORRETO: Enviar array vazio (remove todos)
const payload2 = {
  nome: "João",
  enderecos: [] // Remove todos os endereços
};

// ✅ CORRETO: Enviar array com itens (atualiza/cria/remove)
const payload3 = {
  nome: "João",
  enderecos: [
    { id: 1, cep: "01310-100" }, // Atualiza
    { cep: "04567-890" }          // Cria novo
    // Outros endereços são removidos
  ]
};
```

### 2. **IDs Devem Ser Números**

```typescript
// ❌ ERRADO
const endereco = {
  id: "1", // String
  cep: "01310-100"
};

// ✅ CORRETO
const endereco = {
  id: 1, // Number
  cep: "01310-100"
};
```

### 3. **Valores Vazios vs Não Enviados**

```typescript
// Limpar campo (vira NULL)
const payload1 = {
  enderecos: [
    { id: 1, complemento: "" } // "" vira NULL
  ]
};

// Não alterar campo (mantém valor atual)
const payload2 = {
  enderecos: [
    { id: 1 } // complemento não é alterado
  ]
};
```

### 4. **Telefone Obrigatório para Novos Contatos**

```typescript
// ❌ ERRADO: Contato sem telefone será ignorado
const payload = {
  contatos: [
    { email: "teste@email.com" } // Sem telefone - será ignorado
  ]
};

// ✅ CORRETO
const payload = {
  contatos: [
    { telefone: "11999999999", email: "teste@email.com" }
  ]
};
```

---

## 🚨 Tratamento de Erros

### Erros Comuns e Como Tratá-los

#### 1. **404 - Cliente/Fornecedor não encontrado**
```typescript
if (error.response?.status === 404) {
  alert('Cliente não encontrado. Ele pode ter sido removido.');
  // Redirecionar para lista
}
```

#### 2. **400 - Dados inválidos**
```typescript
if (error.response?.status === 400) {
  const mensagem = error.response.data.message;
  // Exibir mensagem de validação
  alert(mensagem);
}
```

#### 3. **409 - CPF/CNPJ já cadastrado**
```typescript
if (error.response?.status === 409) {
  alert('Este CPF/CNPJ já está cadastrado para outro cliente/fornecedor.');
  // Destacar campo no formulário
}
```

#### 4. **403 - Sem permissão**
```typescript
if (error.response?.status === 403) {
  alert('Você não tem permissão para editar clientes/fornecedores.');
  // Redirecionar ou desabilitar formulário
}
```

### Exemplo Completo de Tratamento

```typescript
async function atualizarComTratamentoErro(
  clienteId: number,
  payload: UpdateClientePayload
) {
  try {
    const cliente = await atualizarCliente(clienteId, payload);
    return { success: true, data: cliente };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const mensagem = error.response?.data?.message || 'Erro desconhecido';
      
      switch (status) {
        case 400:
          return { success: false, error: `Dados inválidos: ${mensagem}` };
        case 403:
          return { success: false, error: 'Sem permissão para editar' };
        case 404:
          return { success: false, error: 'Cliente não encontrado' };
        case 409:
          return { success: false, error: 'CPF/CNPJ já cadastrado' };
        default:
          return { success: false, error: `Erro ${status}: ${mensagem}` };
      }
    }
    return { success: false, error: 'Erro ao conectar com o servidor' };
  }
}
```

---

## ✅ Checklist de Implementação

- [ ] Criar interfaces TypeScript para os payloads
- [ ] Implementar função de preparação do payload
- [ ] Implementar função de atualização (API call)
- [ ] Criar componente de formulário com campos editáveis
- [ ] Implementar adicionar/remover endereços
- [ ] Implementar adicionar/remover contatos
- [ ] Implementar rastreamento de campos alterados
- [ ] Implementar tratamento de erros
- [ ] Implementar feedback visual (loading, sucesso, erro)
- [ ] Testar atualização parcial de campos
- [ ] Testar adicionar novos endereços/contatos
- [ ] Testar atualizar endereços/contatos existentes
- [ ] Testar remover endereços/contatos
- [ ] Testar valores vazios (devem virar NULL)
- [ ] Testar arrays não enviados (devem manter existentes)

---

## 📚 Recursos Adicionais

### Endpoints de Documentação
- Swagger/OpenAPI: `/api-docs` (se disponível)

### Estrutura de Resposta
```typescript
// Resposta do endpoint PATCH
interface ClienteResponse {
  id: number;
  nome: string;
  cpf_cnpj: string;
  tipoPessoa: 'PESSOA_FISICA' | 'PESSOA_JURIDICA';
  statusCliente: 'ATIVO' | 'INATIVO' | 'BLOQUEADO';
  enderecos: Endereco[];
  contatos: Contato[];
  // ... outros campos
}
```

---

## 🎓 Dicas Finais

1. **Sempre inclua o ID** nos endereços/contatos existentes para atualização
2. **Não inclua o ID** nos novos endereços/contatos
3. **Envie apenas campos alterados** para otimizar a requisição
4. **Trate arrays vazios** como remoção de todos os itens
5. **Não envie arrays** se não houver alterações (mantém existentes)
6. **Valores vazios** (`""`) são convertidos para `NULL` automaticamente
7. **Telefone é obrigatório** para criar novos contatos

---

**Última atualização**: 2024
**Versão do Backend**: Compatível com atualização parcial de Clientes e Fornecedores
