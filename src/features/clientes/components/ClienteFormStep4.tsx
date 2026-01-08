/**
 * Componente do Passo 4 do formulário de cliente
 * Condições de Pagamento
 */

import { Button } from "@/components/ui/button";
import { CreditCard, Plus } from "lucide-react";
import { CondicaoPagamento, FormaPagamento } from "@/shared/types/condicao-pagamento.types";
import { CondicaoPagamentoForm } from "./CondicaoPagamentoForm";

interface ClienteFormStep4Props {
  condicoesPagamento: CondicaoPagamento[];
  onCondicoesPagamentoChange: (condicoes: CondicaoPagamento[]) => void;
}

export const ClienteFormStep4 = ({
  condicoesPagamento,
  onCondicoesPagamentoChange,
}: ClienteFormStep4Props) => {
  const handleAddCondicao = () => {
    onCondicoesPagamentoChange([
      ...condicoesPagamento,
      {
        descricao: "",
        forma_pagamento: FormaPagamento.PIX,
        parcelado: false,
        padrao: condicoesPagamento.length === 0, // Primeira condição é padrão por padrão
        prazo_dias: 0,
      },
    ]);
  };

  const handleCondicaoChange = (index: number, condicao: CondicaoPagamento) => {
    const newCondicoes = [...condicoesPagamento];
    newCondicoes[index] = condicao;
    onCondicoesPagamentoChange(newCondicoes);
  };

  const handleRemoveCondicao = (index: number) => {
    onCondicoesPagamentoChange(condicoesPagamento.filter((_, i) => i !== index));
  };

  const handleSetPadrao = (index: number) => {
    const newCondicoes = condicoesPagamento.map((condicao, i) => ({
      ...condicao,
      padrao: i === index,
    }));
    onCondicoesPagamentoChange(newCondicoes);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-primary" />
          Condições de Pagamento
        </h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddCondicao}
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Condição
        </Button>
      </div>

      {condicoesPagamento.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Nenhuma condição de pagamento cadastrada.</p>
          <p className="text-sm mt-1">
            Clique em "Adicionar Condição" para começar.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {condicoesPagamento.map((condicao, index) => (
            <CondicaoPagamentoForm
              key={index}
              condicao={condicao}
              index={index}
              onChange={handleCondicaoChange}
              onRemove={handleRemoveCondicao}
              isPadrao={condicao.padrao}
              onSetPadrao={handleSetPadrao}
            />
          ))}
        </div>
      )}
    </div>
  );
};










