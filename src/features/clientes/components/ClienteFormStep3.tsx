/**
 * Componente do Passo 3 do formulário de cliente
 * Contatos
 */

import { Button } from "@/components/ui/button";
import { Phone as PhoneIcon, Plus } from "lucide-react";
import { ContatoFormData } from "../types/cliente.types";
import { ContatoForm } from "./ContatoForm";

interface ClienteFormStep3Props {
  contatos: ContatoFormData[];
  onContatosChange: (contatos: ContatoFormData[]) => void;
  totalEnderecos: number;
}

export const ClienteFormStep3 = ({
  contatos,
  onContatosChange,
  totalEnderecos,
}: ClienteFormStep3Props) => {
  const handleAddContato = () => {
    onContatosChange([
      ...contatos,
      {
        telefone: "",
        email: "",
        nomeContato: "",
        outroTelefone: "",
        nomeOutroTelefone: "",
        observacao: "",
        ativo: true,
      },
    ]);
  };

  const handleContatoChange = (index: number, contato: ContatoFormData) => {
    const newContatos = [...contatos];
    newContatos[index] = contato;
    onContatosChange(newContatos);
  };

  const handleRemoveContato = (index: number) => {
    onContatosChange(contatos.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <PhoneIcon className="w-5 h-5 text-primary" />
          Contatos
        </h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddContato}
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Contato
        </Button>
      </div>

      {contatos.map((contato, index) => (
        <ContatoForm
          key={index}
          contato={contato}
          index={index}
          totalContatos={contatos.length}
          onChange={(updated) => handleContatoChange(index, updated)}
          onRemove={() => handleRemoveContato(index)}
          showAtivoSwitch={false}
          showOutroTelefone={totalEnderecos > 1}
        />
      ))}
    </div>
  );
};
