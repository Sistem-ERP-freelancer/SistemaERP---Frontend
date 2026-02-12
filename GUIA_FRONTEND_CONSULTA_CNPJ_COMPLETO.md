# Guia Completo - Implementação de Consulta CNPJ no Frontend

## 🎯 Objetivo

Este guia fornece uma implementação completa e pronta para uso da funcionalidade de consulta CNPJ no frontend, incluindo:
- Componente reutilizável com botão de consulta (lupa)
- Integração com formulários de Cliente e Fornecedor
- Tratamento de erros completo
- Feedback visual para o usuário
- Formatação automática de CNPJ

---

## 📋 Pré-requisitos

- React + TypeScript
- React Hook Form (ou similar)
- Biblioteca de requisições HTTP (fetch ou axios)

---

## 🔧 1. Serviço de API

### Arquivo: `services/cnpj.service.ts`

```typescript
// services/cnpj.service.ts

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api/v1';

export interface ConsultaCnpjResponse {
  razaoSocial: string;
  nomeFantasia: string;
  logradouro?: string | null;
  numero?: string | null;
  bairro?: string | null;
  cep?: string | null;
  cidade?: string | null;
  uf?: string | null;
  telefones: string[];
  situacaoCadastral?: string | null;
  inscricaoEstadual?: string | null;
}

export class CnpjService {
  private static getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('auth_token'); // Ajuste conforme sua implementação
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  /**
   * Consulta CNPJ na Receita Federal
   * @param cnpj CNPJ formatado (00.000.000/0000-00) ou apenas números
   * @returns Dados da empresa padronizados
   */
  static async consultar(cnpj: string): Promise<ConsultaCnpjResponse> {
    // Remove máscara do CNPJ para enviar na URL
    const cnpjLimpo = cnpj.replace(/\D/g, '');

    if (cnpjLimpo.length !== 14) {
      throw new Error('CNPJ inválido. Deve conter 14 dígitos.');
    }

    const response = await fetch(
      `${API_BASE_URL}/cnpj/consulta/${cnpjLimpo}`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao consultar CNPJ');
    }

    return response.json();
  }

  /**
   * Consulta CNPJ específico para clientes
   */
  static async consultarParaCliente(cnpj: string): Promise<ConsultaCnpjResponse> {
    const cnpjLimpo = cnpj.replace(/\D/g, '');
    
    if (cnpjLimpo.length !== 14) {
      throw new Error('CNPJ inválido. Deve conter 14 dígitos.');
    }

    const response = await fetch(
      `${API_BASE_URL}/clientes/consulta-cnpj/${cnpjLimpo}`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao consultar CNPJ');
    }

    return response.json();
  }

  /**
   * Consulta CNPJ específico para fornecedores
   */
  static async consultarParaFornecedor(cnpj: string): Promise<ConsultaCnpjResponse> {
    const cnpjLimpo = cnpj.replace(/\D/g, '');
    
    if (cnpjLimpo.length !== 14) {
      throw new Error('CNPJ inválido. Deve conter 14 dígitos.');
    }

    const response = await fetch(
      `${API_BASE_URL}/fornecedor/consulta-cnpj/${cnpjLimpo}`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao consultar CNPJ');
    }

    return response.json();
  }
}
```

---

## 🎨 2. Utilitários de Formatação

### Arquivo: `utils/cnpj-formatter.ts`

```typescript
// utils/cnpj-formatter.ts

/**
 * Formata CNPJ para exibição: 00.000.000/0000-00
 */
export function formatarCnpj(cnpj: string): string {
  const apenasNumeros = cnpj.replace(/\D/g, '');
  
  if (apenasNumeros.length !== 14) {
    return cnpj; // Retorna como está se não tiver 14 dígitos
  }

  return apenasNumeros.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  );
}

/**
 * Remove formatação do CNPJ
 */
export function removerFormatacaoCnpj(cnpj: string): string {
  return cnpj.replace(/\D/g, '');
}

/**
 * Valida se o CNPJ tem 14 dígitos
 */
export function validarCnpj(cnpj: string): boolean {
  const cnpjLimpo = removerFormatacaoCnpj(cnpj);
  return cnpjLimpo.length === 14;
}
```

---

## 🧩 3. Componente Reutilizável - Campo CNPJ com Consulta

### Arquivo: `components/CampoCnpjComConsulta.tsx`

```tsx
// components/CampoCnpjComConsulta.tsx

import React, { useState } from 'react';
import { UseFormSetValue } from 'react-hook-form';
import { CnpjService, ConsultaCnpjResponse } from '../services/cnpj.service';
import { formatarCnpj, validarCnpj } from '../utils/cnpj-formatter';

interface CampoCnpjComConsultaProps {
  value: string;
  onChange: (value: string) => void;
  setValue: UseFormSetValue<any>;
  onConsultaSucesso?: (dados: ConsultaCnpjResponse) => void;
  onConsultaErro?: (erro: string) => void;
  tipoConsulta?: 'cliente' | 'fornecedor' | 'geral';
  disabled?: boolean;
}

export const CampoCnpjComConsulta: React.FC<CampoCnpjComConsultaProps> = ({
  value,
  onChange,
  setValue,
  onConsultaSucesso,
  onConsultaErro,
  tipoConsulta = 'geral',
  disabled = false,
}) => {
  const [consultando, setConsultando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    const formatado = formatarCnpj(valor);
    onChange(formatado);
    setErro(null);
    setSucesso(false);
  };

  const handleConsultar = async () => {
    const cnpjLimpo = value.replace(/\D/g, '');
    
    if (!validarCnpj(value)) {
      const mensagemErro = 'CNPJ inválido. Digite um CNPJ válido com 14 dígitos.';
      setErro(mensagemErro);
      if (onConsultaErro) {
        onConsultaErro(mensagemErro);
      }
      return;
    }

    setConsultando(true);
    setErro(null);
    setSucesso(false);

    try {
      let dados: ConsultaCnpjResponse;

      // Escolher endpoint baseado no tipo
      switch (tipoConsulta) {
        case 'cliente':
          dados = await CnpjService.consultarParaCliente(value);
          break;
        case 'fornecedor':
          dados = await CnpjService.consultarParaFornecedor(value);
          break;
        default:
          dados = await CnpjService.consultar(value);
      }

      // Preencher campos automaticamente
      preencherCampos(dados, setValue);

      // Callback de sucesso
      if (onConsultaSucesso) {
        onConsultaSucesso(dados);
      }

      setSucesso(true);
      setErro(null);

      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => setSucesso(false), 3000);
    } catch (error) {
      const mensagemErro = error instanceof Error ? error.message : 'Erro ao consultar CNPJ';
      setErro(mensagemErro);
      if (onConsultaErro) {
        onConsultaErro(mensagemErro);
      }
    } finally {
      setConsultando(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !consultando && validarCnpj(value)) {
      handleConsultar();
    }
  };

  return (
    <div className="campo-cnpj-container">
      <div className="campo-cnpj-wrapper">
        <input
          type="text"
          value={value}
          onChange={handleCnpjChange}
          onKeyPress={handleKeyPress}
          placeholder="00.000.000/0000-00"
          disabled={disabled || consultando}
          maxLength={18} // 14 dígitos + 4 caracteres de formatação
          className={`campo-cnpj-input ${erro ? 'erro' : ''} ${sucesso ? 'sucesso' : ''}`}
        />
        <button
          type="button"
          onClick={handleConsultar}
          disabled={consultando || !validarCnpj(value) || disabled}
          className="botao-consulta-cnpj"
          title="Consultar CNPJ na Receita Federal"
        >
          {consultando ? (
            <span className="spinner">⏳</span>
          ) : (
            <span>🔍</span>
          )}
        </button>
      </div>

      {/* Mensagens de feedback */}
      {erro && (
        <div className="mensagem-erro">
          <span>❌</span> {erro}
        </div>
      )}
      {sucesso && (
        <div className="mensagem-sucesso">
          <span>✅</span> Dados consultados com sucesso!
        </div>
      )}
      {consultando && (
        <div className="mensagem-info">
          <span>⏳</span> Consultando CNPJ na Receita Federal...
        </div>
      )}
    </div>
  );
};

/**
 * Função auxiliar para preencher campos do formulário
 */
function preencherCampos(
  dados: ConsultaCnpjResponse,
  setValue: UseFormSetValue<any>
) {
  // Dados básicos
  setValue('nome_fantasia', dados.nomeFantasia || '');
  setValue('nome_razao', dados.razaoSocial || '');
  setValue('tipoPessoa', 'PESSOA_JURIDICA');
  setValue('tipoFornecedor', 'PESSOA_JURIDICA'); // Para fornecedores
  setValue('inscricao_estadual', dados.inscricaoEstadual || '');

  // Endereço (se houver dados)
  if (dados.logradouro || dados.cep) {
    // Criar ou atualizar primeiro endereço
    setValue('enderecos.0.logradouro', dados.logradouro || '');
    setValue('enderecos.0.numero', dados.numero || '');
    setValue('enderecos.0.bairro', dados.bairro || '');
    setValue('enderecos.0.cep', dados.cep || '');
    setValue('enderecos.0.cidade', dados.cidade || '');
    setValue('enderecos.0.estado', dados.uf || '');
  }

  // Contato (se houver telefone)
  if (dados.telefones && dados.telefones.length > 0) {
    setValue('contato.0.telefone', dados.telefones[0]);
    // Se houver segundo telefone
    if (dados.telefones.length > 1) {
      setValue('contato.1.telefone', dados.telefones[1]);
    }
  }
}
```

---

## 📝 4. Estilos CSS

### Arquivo: `styles/campo-cnpj.css`

```css
/* styles/campo-cnpj.css */

.campo-cnpj-container {
  width: 100%;
}

.campo-cnpj-wrapper {
  display: flex;
  gap: 8px;
  align-items: center;
}

.campo-cnpj-input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.campo-cnpj-input:focus {
  outline: none;
  border-color: #3498db;
}

.campo-cnpj-input.erro {
  border-color: #e74c3c;
}

.campo-cnpj-input.sucesso {
  border-color: #27ae60;
}

.campo-cnpj-input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.botao-consulta-cnpj {
  padding: 10px 16px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 50px;
  transition: background-color 0.3s;
}

.botao-consulta-cnpj:hover:not(:disabled) {
  background-color: #2980b9;
}

.botao-consulta-cnpj:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
}

.botao-consulta-cnpj .spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.mensagem-erro,
.mensagem-sucesso,
.mensagem-info {
  margin-top: 8px;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.mensagem-erro {
  background-color: #fee;
  color: #c33;
  border: 1px solid #fcc;
}

.mensagem-sucesso {
  background-color: #efe;
  color: #3c3;
  border: 1px solid #cfc;
}

.mensagem-info {
  background-color: #eef;
  color: #33c;
  border: 1px solid #ccf;
}
```

---

## 🎯 5. Uso no Formulário de Cliente

### Arquivo: `pages/CriarCliente.tsx`

```tsx
// pages/CriarCliente.tsx

import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { CampoCnpjComConsulta } from '../components/CampoCnpjComConsulta';
import { ClienteService } from '../services/cliente.service';
import { ConsultaCnpjResponse } from '../services/cnpj.service';
import '../styles/campo-cnpj.css';

const schema = yup.object().shape({
  nome_fantasia: yup.string().required('Nome Fantasia é obrigatório'),
  nome_razao: yup.string().nullable(),
  cpf_cnpj: yup.string().nullable(),
  tipoPessoa: yup.string().nullable(),
  inscricao_estadual: yup.string().nullable(),
  enderecos: yup.array().nullable(),
  contato: yup.array().nullable(),
});

export const CriarCliente: React.FC = () => {
  const { register, setValue, watch, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      nome_fantasia: '',
      nome_razao: null,
      cpf_cnpj: null,
      tipoPessoa: null,
      inscricao_estadual: null,
      enderecos: [],
      contato: [],
    },
  });

  const cnpj = watch('cpf_cnpj') || '';

  const onSubmit = async (data: any) => {
    try {
      await ClienteService.criar(data);
      alert('Cliente criado com sucesso!');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro ao criar cliente');
    }
  };

  const handleConsultaSucesso = (dados: ConsultaCnpjResponse) => {
    console.log('Dados consultados:', dados);
    // Lógica adicional se necessário
  };

  const handleConsultaErro = (erro: string) => {
    console.error('Erro na consulta:', erro);
    // Pode mostrar toast ou notificação
  };

  return (
    <div className="page-container">
      <h1>Criar Novo Cliente</h1>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Campo CNPJ com consulta */}
        <div className="form-group">
          <label>CNPJ</label>
          <CampoCnpjComConsulta
            value={cnpj}
            onChange={(value) => setValue('cpf_cnpj', value)}
            setValue={setValue}
            tipoConsulta="cliente"
            onConsultaSucesso={handleConsultaSucesso}
            onConsultaErro={handleConsultaErro}
          />
        </div>

        {/* Campo Nome Fantasia (obrigatório) */}
        <div className="form-group">
          <label>
            Nome Fantasia <span className="required">*</span>
          </label>
          <input
            {...register('nome_fantasia')}
            placeholder="Nome Fantasia"
            className={errors.nome_fantasia ? 'error' : ''}
          />
          {errors.nome_fantasia && (
            <span className="error-message">
              {errors.nome_fantasia.message as string}
            </span>
          )}
        </div>

        {/* Campo Razão Social (opcional) */}
        <div className="form-group">
          <label>Razão Social</label>
          <input
            {...register('nome_razao')}
            placeholder="Razão Social"
          />
        </div>

        {/* Campo Inscrição Estadual */}
        <div className="form-group">
          <label>Inscrição Estadual</label>
          <input
            {...register('inscricao_estadual')}
            placeholder="000.000.000.000"
          />
        </div>

        {/* Tipo de Pessoa */}
        <div className="form-group">
          <label>Tipo de Pessoa</label>
          <select {...register('tipoPessoa')}>
            <option value="">Selecione...</option>
            <option value="PESSOA_FISICA">Pessoa Física</option>
            <option value="PESSOA_JURIDICA">Pessoa Jurídica</option>
          </select>
        </div>

        {/* Botão de Submit */}
        <div className="form-actions">
          <button type="submit">Salvar Cliente</button>
        </div>
      </form>
    </div>
  );
};
```

---

## 🎯 6. Uso no Formulário de Fornecedor

### Arquivo: `pages/CriarFornecedor.tsx`

```tsx
// pages/CriarFornecedor.tsx

import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { CampoCnpjComConsulta } from '../components/CampoCnpjComConsulta';
import { FornecedorService } from '../services/fornecedor.service';
import { ConsultaCnpjResponse } from '../services/cnpj.service';
import '../styles/campo-cnpj.css';

const schema = yup.object().shape({
  nome_fantasia: yup.string().required('Nome Fantasia é obrigatório'),
  tipoFornecedor: yup.string().nullable(),
  cpf_cnpj: yup.string().nullable(),
  inscricao_estadual: yup.string().nullable(),
  enderecos: yup.array().nullable(),
  contato: yup.array().nullable(),
});

export const CriarFornecedor: React.FC = () => {
  const { register, setValue, watch, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      nome_fantasia: '',
      tipoFornecedor: null,
      cpf_cnpj: null,
      inscricao_estadual: null,
      enderecos: [],
      contato: [],
    },
  });

  const cnpj = watch('cpf_cnpj') || '';

  const onSubmit = async (data: any) => {
    try {
      await FornecedorService.criar(data);
      alert('Fornecedor criado com sucesso!');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro ao criar fornecedor');
    }
  };

  return (
    <div className="page-container">
      <h1>Criar Novo Fornecedor</h1>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Campo CNPJ com consulta */}
        <div className="form-group">
          <label>CNPJ</label>
          <CampoCnpjComConsulta
            value={cnpj}
            onChange={(value) => setValue('cpf_cnpj', value)}
            setValue={setValue}
            tipoConsulta="fornecedor"
          />
        </div>

        {/* Campo Nome Fantasia (obrigatório) */}
        <div className="form-group">
          <label>
            Nome Fantasia <span className="required">*</span>
          </label>
          <input
            {...register('nome_fantasia')}
            placeholder="Nome Fantasia"
            className={errors.nome_fantasia ? 'error' : ''}
          />
          {errors.nome_fantasia && (
            <span className="error-message">
              {errors.nome_fantasia.message as string}
            </span>
          )}
        </div>

        {/* Tipo de Fornecedor */}
        <div className="form-group">
          <label>Tipo de Fornecedor</label>
          <select {...register('tipoFornecedor')}>
            <option value="">Selecione...</option>
            <option value="PESSOA_FISICA">Pessoa Física</option>
            <option value="PESSOA_JURIDICA">Pessoa Jurídica</option>
          </select>
        </div>

        {/* Inscrição Estadual */}
        <div className="form-group">
          <label>Inscrição Estadual</label>
          <input
            {...register('inscricao_estadual')}
            placeholder="000.000.000.000"
          />
        </div>

        {/* Botão de Submit */}
        <div className="form-actions">
          <button type="submit">Salvar Fornecedor</button>
        </div>
      </form>
    </div>
  );
};
```

---

## 🎨 7. Versão com Material-UI (Opcional)

### Arquivo: `components/CampoCnpjComConsultaMUI.tsx`

```tsx
// components/CampoCnpjComConsultaMUI.tsx

import React, { useState } from 'react';
import { TextField, IconButton, InputAdornment, Alert, CircularProgress } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { UseFormSetValue } from 'react-hook-form';
import { CnpjService, ConsultaCnpjResponse } from '../services/cnpj.service';
import { formatarCnpj, validarCnpj } from '../utils/cnpj-formatter';

interface CampoCnpjComConsultaMUIProps {
  value: string;
  onChange: (value: string) => void;
  setValue: UseFormSetValue<any>;
  tipoConsulta?: 'cliente' | 'fornecedor' | 'geral';
  disabled?: boolean;
  label?: string;
  error?: boolean;
  helperText?: string;
}

export const CampoCnpjComConsultaMUI: React.FC<CampoCnpjComConsultaMUIProps> = ({
  value,
  onChange,
  setValue,
  tipoConsulta = 'geral',
  disabled = false,
  label = 'CNPJ',
  error = false,
  helperText,
}) => {
  const [consultando, setConsultando] = useState(false);
  const [erroConsulta, setErroConsulta] = useState<string | null>(null);
  const [sucessoConsulta, setSucessoConsulta] = useState(false);

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    const formatado = formatarCnpj(valor);
    onChange(formatado);
    setErroConsulta(null);
    setSucessoConsulta(false);
  };

  const handleConsultar = async () => {
    if (!validarCnpj(value)) {
      setErroConsulta('CNPJ inválido. Digite um CNPJ válido com 14 dígitos.');
      return;
    }

    setConsultando(true);
    setErroConsulta(null);
    setSucessoConsulta(false);

    try {
      let dados: ConsultaCnpjResponse;

      switch (tipoConsulta) {
        case 'cliente':
          dados = await CnpjService.consultarParaCliente(value);
          break;
        case 'fornecedor':
          dados = await CnpjService.consultarParaFornecedor(value);
          break;
        default:
          dados = await CnpjService.consultar(value);
      }

      // Preencher campos
      setValue('nome_fantasia', dados.nomeFantasia || '');
      setValue('nome_razao', dados.razaoSocial || '');
      setValue('tipoPessoa', 'PESSOA_JURIDICA');
      setValue('tipoFornecedor', 'PESSOA_JURIDICA');
      setValue('inscricao_estadual', dados.inscricaoEstadual || '');

      if (dados.logradouro || dados.cep) {
        setValue('enderecos.0.logradouro', dados.logradouro || '');
        setValue('enderecos.0.numero', dados.numero || '');
        setValue('enderecos.0.bairro', dados.bairro || '');
        setValue('enderecos.0.cep', dados.cep || '');
        setValue('enderecos.0.cidade', dados.cidade || '');
        setValue('enderecos.0.estado', dados.uf || '');
      }

      if (dados.telefones && dados.telefones.length > 0) {
        setValue('contato.0.telefone', dados.telefones[0]);
      }

      setSucessoConsulta(true);
      setTimeout(() => setSucessoConsulta(false), 3000);
    } catch (error) {
      setErroConsulta(error instanceof Error ? error.message : 'Erro ao consultar CNPJ');
    } finally {
      setConsultando(false);
    }
  };

  return (
    <div>
      <TextField
        label={label}
        value={value}
        onChange={handleCnpjChange}
        disabled={disabled || consultando}
        error={error || !!erroConsulta}
        helperText={helperText || erroConsulta}
        placeholder="00.000.000/0000-00"
        fullWidth
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={handleConsultar}
                disabled={consultando || !validarCnpj(value) || disabled}
                edge="end"
              >
                {consultando ? (
                  <CircularProgress size={20} />
                ) : (
                  <SearchIcon />
                )}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      {sucessoConsulta && (
        <Alert severity="success" sx={{ mt: 1 }}>
          Dados consultados com sucesso!
        </Alert>
      )}
    </div>
  );
};
```

---

## 🔄 8. Hook Customizado (Alternativa)

### Arquivo: `hooks/useConsultaCnpj.ts`

```typescript
// hooks/useConsultaCnpj.ts

import { useState } from 'react';
import { UseFormSetValue } from 'react-hook-form';
import { CnpjService, ConsultaCnpjResponse } from '../services/cnpj.service';
import { validarCnpj } from '../utils/cnpj-formatter';

interface UseConsultaCnpjOptions {
  setValue: UseFormSetValue<any>;
  tipoConsulta?: 'cliente' | 'fornecedor' | 'geral';
  onSucesso?: (dados: ConsultaCnpjResponse) => void;
  onErro?: (erro: string) => void;
}

export function useConsultaCnpj(options: UseConsultaCnpjOptions) {
  const { setValue, tipoConsulta = 'geral', onSucesso, onErro } = options;
  const [consultando, setConsultando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  const consultar = async (cnpj: string) => {
    if (!validarCnpj(cnpj)) {
      const mensagemErro = 'CNPJ inválido. Digite um CNPJ válido com 14 dígitos.';
      setErro(mensagemErro);
      if (onErro) onErro(mensagemErro);
      return;
    }

    setConsultando(true);
    setErro(null);
    setSucesso(false);

    try {
      let dados: ConsultaCnpjResponse;

      switch (tipoConsulta) {
        case 'cliente':
          dados = await CnpjService.consultarParaCliente(cnpj);
          break;
        case 'fornecedor':
          dados = await CnpjService.consultarParaFornecedor(cnpj);
          break;
        default:
          dados = await CnpjService.consultar(cnpj);
      }

      // Preencher campos
      setValue('nome_fantasia', dados.nomeFantasia || '');
      setValue('nome_razao', dados.razaoSocial || '');
      setValue('tipoPessoa', 'PESSOA_JURIDICA');
      setValue('tipoFornecedor', 'PESSOA_JURIDICA');
      setValue('inscricao_estadual', dados.inscricaoEstadual || '');

      if (dados.logradouro || dados.cep) {
        setValue('enderecos.0.logradouro', dados.logradouro || '');
        setValue('enderecos.0.numero', dados.numero || '');
        setValue('enderecos.0.bairro', dados.bairro || '');
        setValue('enderecos.0.cep', dados.cep || '');
        setValue('enderecos.0.cidade', dados.cidade || '');
        setValue('enderecos.0.estado', dados.uf || '');
      }

      if (dados.telefones && dados.telefones.length > 0) {
        setValue('contato.0.telefone', dados.telefones[0]);
      }

      setSucesso(true);
      if (onSucesso) onSucesso(dados);
      setTimeout(() => setSucesso(false), 3000);
    } catch (error) {
      const mensagemErro = error instanceof Error ? error.message : 'Erro ao consultar CNPJ';
      setErro(mensagemErro);
      if (onErro) onErro(mensagemErro);
    } finally {
      setConsultando(false);
    }
  };

  return {
    consultar,
    consultando,
    erro,
    sucesso,
  };
}
```

### Uso do Hook:

```tsx
import { useConsultaCnpj } from '../hooks/useConsultaCnpj';

const { consultar, consultando, erro, sucesso } = useConsultaCnpj({
  setValue,
  tipoConsulta: 'cliente',
});

// No JSX:
<button onClick={() => consultar(cnpj)} disabled={consultando}>
  {consultando ? 'Consultando...' : 'Consultar CNPJ'}
</button>
```

---

## 📋 9. Mapeamento Completo de Campos

### Tabela de Mapeamento

| Campo da Resposta | Campo Cliente | Campo Fornecedor | Observações |
|-------------------|---------------|-----------------|-------------|
| `nomeFantasia` | `nome_fantasia` | `nome_fantasia` | ✅ Obrigatório |
| `razaoSocial` | `nome_razao` | `nome_razao` | ⚪ Opcional (backend usa nome_fantasia se não informado) |
| `logradouro` | `enderecos[0].logradouro` | `enderecos[0].logradouro` | ⚪ Opcional |
| `numero` | `enderecos[0].numero` | `enderecos[0].numero` | ⚪ Opcional |
| `bairro` | `enderecos[0].bairro` | `enderecos[0].bairro` | ⚪ Opcional |
| `cep` | `enderecos[0].cep` | `enderecos[0].cep` | ⚪ Opcional |
| `cidade` | `enderecos[0].cidade` | `enderecos[0].cidade` | ⚪ Opcional |
| `uf` | `enderecos[0].estado` | `enderecos[0].estado` | ⚪ Opcional |
| `telefones[0]` | `contato[0].telefone` | `contato[0].telefone` | ⚪ Opcional |
| `telefones[1]` | `contato[1].telefone` | `contato[1].telefone` | ⚪ Opcional |
| `inscricaoEstadual` | `inscricao_estadual` | `inscricao_estadual` | ⚪ Opcional |
| - | `tipoPessoa` = `PESSOA_JURIDICA` | `tipoFornecedor` = `PESSOA_JURIDICA` | ✅ Definido automaticamente |

---

## ⚠️ 10. Tratamento de Erros

### Códigos de Erro e Mensagens

| Status | Mensagem | Ação Recomendada |
|--------|----------|------------------|
| 400 | CNPJ inválido | Validar formato antes de enviar |
| 404 | CNPJ não encontrado | Informar que CNPJ não existe na Receita Federal |
| 408 | Timeout | Pedir para tentar novamente |
| 502 | Erro na Receita Federal | Pedir para tentar mais tarde |
| 401 | Não autenticado | Redirecionar para login |

### Exemplo de Tratamento:

```tsx
try {
  const dados = await CnpjService.consultar(cnpj);
  // Sucesso
} catch (error) {
  if (error.message.includes('404')) {
    // CNPJ não encontrado
    alert('CNPJ não encontrado na Receita Federal. Verifique se o CNPJ está correto.');
  } else if (error.message.includes('Timeout')) {
    // Timeout
    alert('A consulta demorou muito. Tente novamente.');
  } else if (error.message.includes('inválido')) {
    // CNPJ inválido
    alert('CNPJ inválido. Verifique o formato.');
  } else {
    // Erro genérico
    alert('Erro ao consultar CNPJ. Tente novamente mais tarde.');
  }
}
```

---

## ✅ 11. Checklist de Implementação

- [ ] Criar serviço `CnpjService` com métodos de consulta
- [ ] Criar utilitários de formatação (`formatarCnpj`, `validarCnpj`)
- [ ] Criar componente `CampoCnpjComConsulta` reutilizável
- [ ] Adicionar estilos CSS para o componente
- [ ] Integrar no formulário de Cliente
- [ ] Integrar no formulário de Fornecedor
- [ ] Implementar tratamento de erros
- [ ] Adicionar feedback visual (loading, sucesso, erro)
- [ ] Testar com CNPJ válido
- [ ] Testar com CNPJ inválido
- [ ] Testar com CNPJ não encontrado
- [ ] Validar preenchimento automático de campos
- [ ] Testar formatação automática de CNPJ

---

## 🧪 12. Exemplos de Teste

### CNPJ Válido para Teste:
```
27865757000102
27.865.757/0001-02
```

### Teste Manual no Browser Console:

```javascript
// Teste direto da API
fetch('http://localhost:4000/api/v1/cnpj/consulta/27865757000102', {
  headers: {
    'Authorization': 'Bearer SEU_TOKEN'
  }
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

---

## 📱 13. Exemplo Completo - Formulário Multi-Step

```tsx
// components/FormularioClienteMultiStep.tsx

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { CampoCnpjComConsulta } from './CampoCnpjComConsulta';

export const FormularioClienteMultiStep: React.FC = () => {
  const [step, setStep] = useState(1);
  const { register, setValue, watch, handleSubmit } = useForm();

  const cnpj = watch('cpf_cnpj') || '';

  return (
    <form>
      {step === 1 && (
        <div>
          <h2>Passo 1: Dados Básicos</h2>
          
          <div className="form-group">
            <label>CNPJ</label>
            <CampoCnpjComConsulta
              value={cnpj}
              onChange={(value) => setValue('cpf_cnpj', value)}
              setValue={setValue}
              tipoConsulta="cliente"
            />
          </div>

          <div className="form-group">
            <label>Nome Fantasia *</label>
            <input {...register('nome_fantasia')} />
          </div>

          <button type="button" onClick={() => setStep(2)}>
            Continuar
          </button>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2>Passo 2: Endereço</h2>
          {/* Campos de endereço já preenchidos se consultou CNPJ */}
          <button type="button" onClick={() => setStep(1)}>
            Voltar
          </button>
          <button type="button" onClick={() => setStep(3)}>
            Continuar
          </button>
        </div>
      )}

      {step === 3 && (
        <div>
          <h2>Passo 3: Contatos</h2>
          {/* Campos de contato já preenchidos se consultou CNPJ */}
          <button type="button" onClick={() => setStep(2)}>
            Voltar
          </button>
          <button type="submit">Finalizar</button>
        </div>
      )}
    </form>
  );
};
```

---

## 🎯 14. Fluxo Completo Visual

```
┌─────────────────────────────────────┐
│  Usuário digita CNPJ                │
│  "27.865.757/0001-02"               │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Usuário clica no botão 🔍          │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Frontend valida formato            │
│  Remove máscara: "27865757000102"   │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Frontend chama backend             │
│  GET /api/v1/clientes/consulta-cnpj │
│  /27865757000102                    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Backend consulta BrasilAPI         │
│  Retorna dados padronizados         │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Frontend recebe resposta           │
│  {                                  │
│    nomeFantasia: "...",             │
│    razaoSocial: "...",              │
│    ...                              │
│  }                                  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Frontend preenche campos           │
│  automaticamente                    │
└─────────────────────────────────────┘
```

---

## 📚 15. Recursos Adicionais

### Toast/Notificação (Opcional)

```tsx
// utils/toast.ts

export const toast = {
  success: (message: string) => {
    // Implementar sua biblioteca de toast
    console.log('✅', message);
  },
  error: (message: string) => {
    console.error('❌', message);
  },
  info: (message: string) => {
    console.info('ℹ️', message);
  },
};
```

### Uso no Componente:

```tsx
import { toast } from '../utils/toast';

const handleConsultaSucesso = (dados: ConsultaCnpjResponse) => {
  toast.success('Dados consultados com sucesso!');
};

const handleConsultaErro = (erro: string) => {
  toast.error(erro);
};
```

---

## 🚀 16. Pronto para Produção

### Melhorias Recomendadas:

1. **Debounce**: Aguardar usuário parar de digitar antes de habilitar consulta
2. **Cache Local**: Armazenar consultas recentes no localStorage
3. **Validação Visual**: Mostrar indicador quando CNPJ está completo
4. **Acessibilidade**: Adicionar aria-labels e suporte a teclado
5. **Loading State**: Melhorar feedback visual durante consulta

---

**Última atualização**: 12/02/2026
**Versão do Backend**: SistemaERP v0.0.1
