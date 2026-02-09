/**
 * Componente para gerenciar condições de pagamento do cliente
 */

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    CondicaoPagamento,
    FormaPagamento,
    ParcelaPagamento,
} from "@/shared/types/condicao-pagamento.types";
import { CreditCard, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

interface CondicaoPagamentoFormProps {
  condicao: CondicaoPagamento;
  index: number;
  onChange: (index: number, condicao: CondicaoPagamento) => void;
  onRemove: (index: number) => void;
  isPadrao: boolean;
  onSetPadrao: (index: number) => void;
}

export const CondicaoPagamentoForm: React.FC<CondicaoPagamentoFormProps> = ({
  condicao,
  index,
  onChange,
  onRemove,
  isPadrao,
  onSetPadrao,
}) => {
  // Estado local para armazenar o valor digitado no campo de número de parcelas
  const [numeroParcelasInput, setNumeroParcelasInput] = useState<string>(
    condicao.numero_parcelas?.toString() || ''
  );

  // Sincronizar o estado local quando o valor externo mudar
  useEffect(() => {
    if (condicao.numero_parcelas !== undefined) {
      setNumeroParcelasInput(condicao.numero_parcelas.toString());
    } else {
      setNumeroParcelasInput('');
    }
  }, [condicao.numero_parcelas]);

  const handleChange = (field: keyof CondicaoPagamento, value: any) => {
    const updated = { ...condicao, [field]: value };

    // Se mudou para não parcelado, limpar parcelas
    if (field === "parcelado" && value === false) {
      updated.parcelas = undefined;
      updated.numero_parcelas = undefined;
      updated.prazo_dias = undefined; // Não definir valor padrão, deixar vazio
    }

    // Se mudou para parcelado, limpar parcelas (usuário deve digitar o número)
    if (field === "parcelado" && value === true) {
      updated.numero_parcelas = undefined;
      updated.prazo_dias = undefined;
      updated.parcelas = undefined;
      // Limpar o input
      setNumeroParcelasInput('');
    }

    onChange(index, updated);
  };

  return (
    <Card className="border-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">
              Condição de Pagamento {index + 1}
            </CardTitle>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id={`padrao-${index}`}
                checked={isPadrao}
                onCheckedChange={() => onSetPadrao(index)}
              />
              <Label
                htmlFor={`padrao-${index}`}
                className="text-sm font-normal cursor-pointer"
              >
                Padrão
              </Label>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onRemove(index)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Descrição */}
        <div className="space-y-2">
          <Label htmlFor={`descricao-${index}`}>
            Prazo de Pagamento <span className="text-destructive">*</span>
          </Label>
          <Input
            id={`descricao-${index}`}
            type="text"
            value={condicao.descricao}
            onChange={(e) => handleChange("descricao", e.target.value)}
            placeholder="Ex: Pagamento em 30 dias ou 12x sem juros"
            required
          />
          <p className="text-xs text-muted-foreground">
            Descreva o prazo e condições de pagamento (ex: "À vista em 30 dias", "12x no cartão", "Entrada + 6x")
          </p>
        </div>

        {/* Forma de Pagamento */}
        <div className="space-y-2">
          <Label htmlFor={`forma-${index}`}>
            Forma de Pagamento <span className="text-destructive">*</span>
          </Label>
          <Select
            value={condicao.forma_pagamento}
            onValueChange={(value) =>
              handleChange("forma_pagamento", value as FormaPagamento)
            }
          >
            <SelectTrigger id={`forma-${index}`}>
              <SelectValue placeholder="Selecione a forma de pagamento" />
            </SelectTrigger>
            <SelectContent position="item-aligned" className="max-h-[280px]">
              <SelectItem value={FormaPagamento.PIX}>PIX</SelectItem>
              <SelectItem value={FormaPagamento.DINHEIRO}>Dinheiro</SelectItem>
              <SelectItem value={FormaPagamento.CARTAO_CREDITO}>
                Cartão de Crédito
              </SelectItem>
              <SelectItem value={FormaPagamento.CARTAO_DEBITO}>
                Cartão de Débito
              </SelectItem>
              <SelectItem value={FormaPagamento.BOLETO}>Boleto</SelectItem>
              <SelectItem value={FormaPagamento.TRANSFERENCIA}>
                Transferência Bancária
              </SelectItem>
              <SelectItem value={FormaPagamento.CHEQUE}>Cheque</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tipo de Pagamento */}
        <div className="flex items-center gap-2">
          <Checkbox
            id={`parcelado-${index}`}
            checked={condicao.parcelado}
            onCheckedChange={(checked) =>
              handleChange("parcelado", checked === true)
            }
          />
          <Label
            htmlFor={`parcelado-${index}`}
            className="text-sm font-normal cursor-pointer"
          >
            Pagamento Parcelado
          </Label>
        </div>

        {/* Prazo em Dias (quando não parcelado) */}
        {!condicao.parcelado && (
          <div className="space-y-2">
            <Label htmlFor={`prazo-${index}`}>
              Prazo em Dias <span className="text-destructive">*</span>
            </Label>
            <Input
              id={`prazo-${index}`}
              type="number"
              min="0"
              value={condicao.prazo_dias ?? ''}
              placeholder="Digite o prazo em dias"
              onChange={(e) => {
                const value = e.target.value.trim();
                if (value === '' || value === null || value === undefined) {
                  handleChange("prazo_dias", undefined);
                  return;
                }
                const numValue = parseInt(value, 10);
                if (!isNaN(numValue) && numValue >= 0) {
                  handleChange("prazo_dias", numValue);
                }
              }}
              required
            />
          </div>
        )}

        {/* Parcelas (quando parcelado) */}
        {condicao.parcelado && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`num-parcelas-${index}`}>
                Número de Parcelas <span className="text-destructive">*</span>
              </Label>
              <Input
                id={`num-parcelas-${index}`}
                type="number"
                min="1"
                value={numeroParcelasInput}
                placeholder="Digite o número de parcelas"
                onChange={(e) => {
                  const value = e.target.value;
                  
                  // Sempre atualizar o estado local para exibir o valor digitado
                  setNumeroParcelasInput(value);
                  
                  // Se estiver vazio, limpar tudo mas manter o campo editável
                  if (value === '' || value === null || value === undefined) {
                    handleChange("numero_parcelas", undefined);
                    return;
                  }
                  
                  // Converter para número inteiro
                  const numParcelas = parseInt(value, 10);
                  
                  // Validar se é um número válido e maior que 0
                  if (!isNaN(numParcelas) && numParcelas >= 1) {
                    // Criar parcelas automaticamente com distribuição igual de percentuais
                    const parcelas: ParcelaPagamento[] = [];
                    const percentualPorParcela = 100 / numParcelas;
                    
                    for (let i = 1; i <= numParcelas; i++) {
                      parcelas.push({
                        numero_parcela: i,
                        dias_vencimento: i * 30, // Incremento de 30 dias por parcela
                        percentual: parseFloat(
                          percentualPorParcela.toFixed(2)
                        ),
                      });
                    }

                    // Ajustar última parcela para garantir soma = 100%
                    const soma = parcelas.reduce((sum, p) => sum + p.percentual, 0);
                    if (Math.abs(soma - 100) > 0.01) {
                      parcelas[parcelas.length - 1].percentual = parseFloat(
                        (parcelas[parcelas.length - 1].percentual + (100 - soma)).toFixed(2)
                      );
                    }

                    // Atualizar número de parcelas e parcelas em uma única operação
                    // para evitar problemas de sincronização
                    const updated = { ...condicao };
                    updated.numero_parcelas = numParcelas;
                    updated.parcelas = parcelas;
                    onChange(index, updated);

                    if (import.meta.env.DEV) {
                      console.log('[CondicaoPagamentoForm] Parcelas criadas:', {
                        numero_parcelas: numParcelas,
                        quantidade_parcelas: parcelas.length,
                        primeira_parcela: parcelas[0],
                        ultima_parcela: parcelas[parcelas.length - 1],
                        soma_percentuais: parcelas.reduce((sum, p) => sum + p.percentual, 0),
                      });
                    }
                  } else {
                    // Se não for válido, limpar número de parcelas mas manter o valor digitado visível
                    const updated = { ...condicao };
                    updated.numero_parcelas = undefined;
                    updated.parcelas = undefined;
                    onChange(index, updated);
                  }
                }}
                required
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

