/**
 * Componente do Passo 1 do formulário de cliente
 * Informações Básicas
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Check, Circle, FileText, Hash, User, DollarSign } from "lucide-react";
import { cleanDocument, formatCNPJ, formatCPF } from "@/lib/validators";
import { ClienteFormData } from "../types/cliente.types";

interface ClienteFormStep1Props {
  formData: ClienteFormData;
  onFormDataChange: (data: Partial<ClienteFormData>) => void;
}

export const ClienteFormStep1 = ({
  formData,
  onFormDataChange,
}: ClienteFormStep1Props) => {
  // Estado local para o valor do input de limite de crédito (permite digitação livre)
  const [limiteCreditoInput, setLimiteCreditoInput] = useState<string>('');
  const [isFocused, setIsFocused] = useState(false);

  // Sincroniza o estado local quando formData.limite_credito mudar externamente (apenas se não estiver focado)
  useEffect(() => {
    if (!isFocused && formData.limite_credito !== undefined && !isNaN(formData.limite_credito)) {
      const formatted = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(formData.limite_credito);
      setLimiteCreditoInput(formatted.replace('R$', '').trim());
    } else if (!isFocused && formData.limite_credito === undefined) {
      setLimiteCreditoInput('');
    }
  }, [formData.limite_credito, isFocused]);

  const handleTipoPessoaChange = (tipo: "PESSOA_FISICA" | "PESSOA_JURIDICA") => {
    onFormDataChange({
      tipoPessoa: tipo,
      cpf_cnpj: "", // Limpa o campo ao mudar o tipo
    });
  };

  const handleCPFCNPJChange = (value: string) => {
    const cleaned = cleanDocument(value);
    const maxLength = formData.tipoPessoa === "PESSOA_FISICA" ? 11 : 14;
    const limited = cleaned.slice(0, maxLength);

    let formatted = limited;
    if (formData.tipoPessoa === "PESSOA_FISICA" && limited.length === 11) {
      formatted = formatCPF(limited);
    } else if (formData.tipoPessoa === "PESSOA_JURIDICA" && limited.length === 14) {
      formatted = formatCNPJ(limited);
    } else if (limited.length > 0) {
      if (formData.tipoPessoa === "PESSOA_FISICA") {
        formatted = limited
          .replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4")
          .replace(/^(\d{3})(\d{3})(\d{3})$/, "$1.$2.$3")
          .replace(/^(\d{3})(\d{3})$/, "$1.$2")
          .replace(/^(\d{3})$/, "$1");
      } else {
        formatted = limited
          .replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")
          .replace(/^(\d{2})(\d{3})(\d{3})(\d{4})$/, "$1.$2.$3/$4")
          .replace(/^(\d{2})(\d{3})(\d{3})$/, "$1.$2.$3")
          .replace(/^(\d{2})(\d{3})$/, "$1.$2")
          .replace(/^(\d{2})$/, "$1");
      }
    }

    onFormDataChange({ cpf_cnpj: formatted });
  };

  const handleNomeChange = (value: string) => {
    if (formData.tipoPessoa === "PESSOA_JURIDICA") {
      // Para Pessoa Jurídica, o campo "Razão Social" deve ser enviado como nome_razao
      // NÃO enviar campo nome para Pessoa Jurídica
      onFormDataChange({
        nome_razao: value, // Campo principal que será enviado ao backend
      });
    } else {
      // Para Pessoa Física, usar apenas nome
      onFormDataChange({ nome: value });
    }
  };

  const handleLimiteCreditoChange = (value: string) => {
    // Permite digitação livre - apenas remove caracteres não numéricos exceto vírgula e ponto
    const cleaned = value.replace(/[^\d,.]/g, '');
    
    // Atualiza o estado local para permitir digitação livre (sem formatação durante digitação)
    setLimiteCreditoInput(cleaned);
    
    // Se estiver vazio, limpa o valor
    if (cleaned === '' || cleaned === ',' || cleaned === '.') {
      onFormDataChange({ limite_credito: undefined });
      return;
    }
    
    // Processa o valor digitado
    // Se tiver vírgula, trata como separador decimal brasileiro
    // Se tiver ponto, pode ser separador decimal ou milhar
    let normalized = cleaned;
    
    // Se tiver vírgula, substitui por ponto para parseFloat
    if (cleaned.includes(',')) {
      // Remove pontos (milhares) e substitui vírgula por ponto
      normalized = cleaned.replace(/\./g, '').replace(',', '.');
    } else if (cleaned.includes('.')) {
      // Se tiver ponto, verifica se é decimal ou milhar
      // Se tiver mais de um ponto ou ponto seguido de menos de 3 dígitos, é decimal
      const parts = cleaned.split('.');
      if (parts.length === 2 && parts[1].length <= 2) {
        // É decimal (ex: 4.50)
        normalized = cleaned;
      } else {
        // É milhar, remove pontos
        normalized = cleaned.replace(/\./g, '');
      }
    }
    
    // Converte para número
    const numericValue = parseFloat(normalized);
    
    // Permite qualquer valor positivo (incluindo valores muito pequenos e muito grandes)
    if (!isNaN(numericValue) && numericValue >= 0) {
      // Atualiza o valor numérico
      onFormDataChange({ limite_credito: numericValue });
    }
  };

  const handleLimiteCreditoBlur = () => {
    setIsFocused(false);
    // Quando sair do campo, formata o valor
    const value = formData.limite_credito;
    if (value !== undefined && !isNaN(value) && value >= 0) {
      const formatted = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
      setLimiteCreditoInput(formatted.replace('R$', '').trim());
    } else {
      setLimiteCreditoInput('');
    }
  };

  const handleLimiteCreditoFocus = () => {
    setIsFocused(true);
    // Quando focar no campo, mostra o valor numérico sem formatação para facilitar edição
    if (formData.limite_credito !== undefined && !isNaN(formData.limite_credito)) {
      // Converte para string sem formatação de moeda (usa vírgula como separador decimal)
      const valueStr = formData.limite_credito.toString().replace('.', ',');
      setLimiteCreditoInput(valueStr);
    } else {
      setLimiteCreditoInput('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Tipo de Cliente */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Tipo de Cliente</Label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => handleTipoPessoaChange("PESSOA_JURIDICA")}
            className={`relative p-6 rounded-lg border-2 transition-all ${
              formData.tipoPessoa === "PESSOA_JURIDICA"
                ? "border-primary bg-primary/5"
                : "border-border bg-card hover:border-primary/50"
            }`}
          >
            {formData.tipoPessoa === "PESSOA_JURIDICA" && (
              <div className="absolute top-3 right-3">
                <Check className="w-5 h-5 text-primary" />
              </div>
            )}
            <div className="flex flex-col items-center gap-3">
              <Building2
                className={`w-8 h-8 ${
                  formData.tipoPessoa === "PESSOA_JURIDICA"
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              />
              <div className="text-center">
                <p
                  className={`font-semibold ${
                    formData.tipoPessoa === "PESSOA_JURIDICA"
                      ? "text-primary"
                      : "text-foreground"
                  }`}
                >
                  Pessoa Jurídica
                </p>
                <p className="text-xs text-muted-foreground mt-1">CNPJ</p>
              </div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => handleTipoPessoaChange("PESSOA_FISICA")}
            className={`relative p-6 rounded-lg border-2 transition-all ${
              formData.tipoPessoa === "PESSOA_FISICA"
                ? "border-primary bg-primary/5"
                : "border-border bg-card hover:border-primary/50"
            }`}
          >
            {formData.tipoPessoa === "PESSOA_FISICA" && (
              <div className="absolute top-3 right-3">
                <Check className="w-5 h-5 text-primary" />
              </div>
            )}
            <div className="flex flex-col items-center gap-3">
              <User
                className={`w-8 h-8 ${
                  formData.tipoPessoa === "PESSOA_FISICA"
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              />
              <div className="text-center">
                <p
                  className={`font-semibold ${
                    formData.tipoPessoa === "PESSOA_FISICA"
                      ? "text-primary"
                      : "text-foreground"
                  }`}
                >
                  Pessoa Física
                </p>
                <p className="text-xs text-muted-foreground mt-1">CPF</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Nome Fantasia - Apenas para Pessoa Jurídica (PRIMEIRO) */}
      {formData.tipoPessoa === "PESSOA_JURIDICA" && (
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            Nome Fantasia
          </Label>
          <Input
            placeholder="Nome Fantasia da Empresa"
            value={formData.nome_fantasia || ""}
            onChange={(e) => onFormDataChange({ nome_fantasia: e.target.value })}
          />
        </div>
      )}

      {/* Nome / Razão Social (SEGUNDO) */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-muted-foreground" />
          {formData.tipoPessoa === "PESSOA_JURIDICA" ? "Razão Social" : "Nome"} *
        </Label>
        <Input
          placeholder={
            formData.tipoPessoa === "PESSOA_JURIDICA"
              ? "Razão Social da Empresa"
              : "Nome do cliente"
          }
          value={
            formData.tipoPessoa === "PESSOA_JURIDICA"
              ? formData.nome_razao || formData.nome
              : formData.nome
          }
          onChange={(e) => handleNomeChange(e.target.value)}
        />
      </div>

      {/* CPF/CNPJ */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Hash className="w-4 h-4 text-muted-foreground" />
          {formData.tipoPessoa === "PESSOA_FISICA" ? "CPF" : "CNPJ"} *
        </Label>
        <Input
          placeholder={
            formData.tipoPessoa === "PESSOA_FISICA"
              ? "000.000.000-00"
              : "00.000.000/0000-00"
          }
          value={formData.cpf_cnpj}
          onChange={(e) => handleCPFCNPJChange(e.target.value)}
        />
        {/* Mensagem de validação em tempo real */}
        {formData.tipoPessoa === "PESSOA_JURIDICA" &&
          cleanDocument(formData.cpf_cnpj).length > 0 &&
          cleanDocument(formData.cpf_cnpj).length !== 14 && (
            <p className="text-xs text-destructive mt-1">
              CNPJ deve ter 14 dígitos.
            </p>
          )}
        {formData.tipoPessoa === "PESSOA_FISICA" &&
          cleanDocument(formData.cpf_cnpj).length > 0 &&
          cleanDocument(formData.cpf_cnpj).length !== 11 && (
            <p className="text-xs text-destructive mt-1">
              CPF deve ter 11 dígitos.
            </p>
          )}
      </div>

      {/* Inscrição Estadual - Apenas para Pessoa Jurídica */}
      {formData.tipoPessoa === "PESSOA_JURIDICA" && (
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-muted-foreground" />
            Inscrição Estadual
          </Label>
          <Input
            placeholder="000.000.000.000"
            value={formData.inscricao_estadual || ""}
            onChange={(e) =>
              onFormDataChange({ inscricao_estadual: e.target.value })
            }
          />
        </div>
      )}

      {/* Limite de Crédito */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-muted-foreground" />
          Limite de Crédito
        </Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">R$</span>
          <Input
            type="text"
            placeholder="0,00"
            value={limiteCreditoInput}
            onChange={(e) => handleLimiteCreditoChange(e.target.value)}
            onBlur={handleLimiteCreditoBlur}
            onFocus={handleLimiteCreditoFocus}
            className="pl-8"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Valor máximo de crédito disponível para este cliente
        </p>
      </div>

      {/* Status Inicial */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Status Inicial</Label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => onFormDataChange({ statusCliente: "ATIVO" })}
            className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
              formData.statusCliente === "ATIVO"
                ? "border-primary bg-primary/5"
                : "border-border bg-card hover:border-primary/50"
            }`}
          >
            <Circle
              className={`w-4 h-4 ${
                formData.statusCliente === "ATIVO"
                  ? "text-green-500 fill-green-500"
                  : "text-muted-foreground"
              }`}
            />
            <span
              className={`font-medium ${
                formData.statusCliente === "ATIVO"
                  ? "text-primary"
                  : "text-foreground"
              }`}
            >
              Ativo
            </span>
          </button>
          <button
            type="button"
            onClick={() => onFormDataChange({ statusCliente: "INATIVO" })}
            className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
              formData.statusCliente === "INATIVO"
                ? "border-primary bg-primary/5"
                : "border-border bg-card hover:border-primary/50"
            }`}
          >
            <Circle
              className={`w-4 h-4 ${
                formData.statusCliente === "INATIVO"
                  ? "text-muted-foreground fill-muted-foreground"
                  : "text-muted-foreground"
              }`}
            />
            <span
              className={`font-medium ${
                formData.statusCliente === "INATIVO"
                  ? "text-primary"
                  : "text-foreground"
              }`}
            >
              Inativo
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

