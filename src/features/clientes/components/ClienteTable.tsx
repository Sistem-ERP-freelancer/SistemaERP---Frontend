/**
 * Componente de tabela de clientes
 */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusCliente } from "@/services/clientes.service";
import { motion } from "framer-motion";
import {
  Edit,
  Eye,
  Loader2,
  Mail,
  Phone,
  Trash2,
  Users,
  XCircle,
} from "lucide-react";

interface Cliente {
  id: number;
  nome: string;
  nome_fantasia?: string | null;
  nome_razao?: string | null;
  cpf_cnpj: string;
  tipoPessoa: "PESSOA_FISICA" | "PESSOA_JURIDICA";
  statusCliente: "ATIVO" | "INATIVO" | "BLOQUEADO" | "INADIMPLENTE";
  contato?: Array<{
    email?: string;
    telefone?: string;
  }>;
}

interface ClienteTableProps {
  clientes: Cliente[];
  isLoading: boolean;
  error: Error | null;
  searchTerm: string;
  hasActiveFilters: boolean;
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onStatusChange?: (id: number, novoStatus: StatusCliente) => void;
  updatingStatusId?: number | null;
}

export const ClienteTable = ({
  clientes,
  isLoading,
  error,
  searchTerm,
  hasActiveFilters,
  onView,
  onEdit,
  onDelete,
  onStatusChange,
  updatingStatusId,
}: ClienteTableProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "ATIVO":
        return "bg-cyan/10 text-cyan";
      case "INATIVO":
        return "bg-muted text-muted-foreground";
      case "BLOQUEADO":
        return "bg-red-500/10 text-red-500";
      case "INADIMPLENTE":
        return "bg-orange-500/10 text-orange-500";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "ATIVO":
        return "Ativo";
      case "INATIVO":
        return "Inativo";
      case "BLOQUEADO":
        return "Bloqueado";
      case "INADIMPLENTE":
        return "Inadimplente";
      default:
        return status;
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-border overflow-hidden"
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-sidebar text-sidebar-foreground">
              <th className="text-left py-3 px-4 text-sm font-medium">Nome</th>
              <th className="text-left py-3 px-4 text-sm font-medium">
                CPF/CNPJ
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium">
                E-mail
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium">
                Telefone
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium">Tipo</th>
              <th className="text-left py-3 px-4 text-sm font-medium">
                Status
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={7}
                  className="py-8 text-center text-muted-foreground"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Carregando clientes...
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={7} className="py-8 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <XCircle className="w-8 h-8 text-destructive" />
                    <p className="text-destructive font-medium">
                      Erro ao carregar clientes
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {error instanceof Error
                        ? error.message
                        : "Verifique sua conexão e tente novamente"}
                    </p>
                    {import.meta.env.DEV && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Verifique o console para mais detalhes
                      </p>
                    )}
                  </div>
                </td>
              </tr>
            ) : clientes.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="py-8 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Users className="w-8 h-8 text-muted-foreground/50" />
                    <p className="font-medium">
                      {searchTerm.trim() || hasActiveFilters
                        ? "Nenhum cliente encontrado"
                        : "Nenhum cliente cadastrado"}
                    </p>
                    {!searchTerm.trim() && !hasActiveFilters && (
                      <p className="text-sm">
                        Clique em "Criar Cliente" para adicionar o primeiro
                        cliente
                      </p>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              clientes.map((cliente) => (
                <tr
                  key={cliente.id}
                  className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors"
                >
                  <td className="py-3 px-4 text-sm">
                    {cliente.tipoPessoa === "PESSOA_JURIDICA" ? (
                      <div>
                        {/* Exibir nome fantasia em destaque (ou razão social/nome se não tiver) */}
                        <div className="font-medium text-foreground">
                          {cliente.nome_fantasia ||
                            cliente.nome_razao ||
                            cliente.nome}
                        </div>
                        {/* Exibir razão social abaixo quando:
                            - Tiver nome fantasia E razão social E forem diferentes, OU
                            - Não tiver nome fantasia mas tiver razão social */}
                        {((cliente.nome_fantasia &&
                          cliente.nome_razao &&
                          cliente.nome_fantasia !== cliente.nome_razao) ||
                          (!cliente.nome_fantasia &&
                            cliente.nome_razao &&
                            cliente.nome_razao !== cliente.nome)) && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {cliente.nome_razao}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="font-medium text-foreground">
                        {cliente.nome}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {cliente.cpf_cnpj}
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {cliente.contato?.[0]?.email || "-"}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {cliente.contato?.[0]?.telefone || "-"}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-xs px-2 py-1 rounded-full font-medium bg-royal/10 text-royal">
                      {cliente.tipoPessoa === "PESSOA_FISICA" ? "PF" : "PJ"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {onStatusChange ? (
                      <Select
                        value={cliente.statusCliente}
                        onValueChange={(value) => {
                          if (value !== cliente.statusCliente) {
                            onStatusChange(cliente.id, value as StatusCliente);
                          }
                        }}
                        disabled={updatingStatusId === cliente.id}
                      >
                        <SelectTrigger
                          className={`h-7 w-[140px] text-xs font-medium rounded-full border-0 shadow-none hover:opacity-80 transition-opacity ${getStatusColor(
                            cliente.statusCliente
                          )}`}
                        >
                          <SelectValue>
                            {updatingStatusId === cliente.id ? (
                              <div className="flex items-center gap-2">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span>Atualizando...</span>
                              </div>
                            ) : (
                              getStatusLabel(cliente.statusCliente)
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={StatusCliente.ATIVO}>
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-cyan"></span>
                              Ativo
                            </div>
                          </SelectItem>
                          <SelectItem value={StatusCliente.INATIVO}>
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-muted-foreground"></span>
                              Inativo
                            </div>
                          </SelectItem>
                          <SelectItem value={StatusCliente.BLOQUEADO}>
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-red-500"></span>
                              Bloqueado
                            </div>
                          </SelectItem>
                          <SelectItem value={StatusCliente.INADIMPLENTE}>
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                              Inadimplente
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(
                          cliente.statusCliente
                        )}`}
                      >
                        {getStatusLabel(cliente.statusCliente)}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1">
                      <button
                        className="p-2 hover:bg-secondary rounded-lg transition-colors"
                        onClick={() => onView(cliente.id)}
                        title="Visualizar cliente"
                      >
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button
                        className="p-2 hover:bg-secondary rounded-lg transition-colors"
                        onClick={() => onEdit(cliente.id)}
                        title="Editar cliente"
                      >
                        <Edit className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button
                        className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                        onClick={() => onDelete(cliente.id)}
                        title="Excluir cliente"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};
