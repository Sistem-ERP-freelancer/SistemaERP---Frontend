/**
 * Componente do Passo 2 do formulário de cliente
 * Endereços
 */

import { Button } from "@/components/ui/button";
import { MapPin as MapPinIcon, Plus } from "lucide-react";
import { EnderecoFormData } from "../types/cliente.types";
import { EnderecoForm } from "./EnderecoForm";

interface ClienteFormStep2Props {
  enderecos: EnderecoFormData[];
  onEnderecosChange: (enderecos: EnderecoFormData[]) => void;
}

export const ClienteFormStep2 = ({
  enderecos,
  onEnderecosChange,
}: ClienteFormStep2Props) => {
  const handleAddEndereco = () => {
    onEnderecosChange([
      ...enderecos,
      {
        cep: "",
        logradouro: "",
        numero: "",
        complemento: "",
        bairro: "",
        cidade: "",
        estado: "",
        referencia: "",
      },
    ]);
  };

  const handleEnderecoChange = (index: number, endereco: EnderecoFormData) => {
    const newEnderecos = [...enderecos];
    newEnderecos[index] = endereco;
    onEnderecosChange(newEnderecos);
  };

  const handleRemoveEndereco = (index: number) => {
    onEnderecosChange(enderecos.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="bg-card border rounded-lg p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <MapPinIcon className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Endereços</h3>
              <p className="text-sm text-muted-foreground">
                Localizações do cliente
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddEndereco}
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Endereço
          </Button>
        </div>

        {enderecos.map((endereco, index) => (
          <EnderecoForm
            key={index}
            endereco={endereco}
            index={index}
            totalEnderecos={enderecos.length}
            onChange={(updated) => handleEnderecoChange(index, updated)}
            onRemove={() => handleRemoveEndereco(index)}
          />
        ))}
      </div>
    </div>
  );
};

