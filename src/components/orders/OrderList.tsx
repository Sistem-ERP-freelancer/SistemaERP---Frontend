import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { normalizeCurrency } from '@/lib/utils';
import { Pedido, StatusPedido } from '@/types/pedido';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Edit, Eye, Loader2, ShoppingCart, Trash2 } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { TypeBadge } from './TypeBadge';

interface OrderListProps {
  orders: Pedido[];
  isLoading: boolean;
  onView: (order: Pedido) => void;
  onEdit: (order: Pedido) => void;
  onCancel: (order: Pedido) => void;
  onStatusChange?: (id: number, status: StatusPedido) => void;
  updatingStatusId?: number | null;
}

export function OrderList({ 
  orders, 
  isLoading, 
  onView, 
  onEdit, 
  onCancel,
  onStatusChange,
  updatingStatusId = null,
}: OrderListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Nenhum pedido encontrado</p>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '--';
    try {
      // Se a data vem no formato YYYY-MM-DD ou YYYY-MM-DD HH:MM:SS
      // Extrair apenas a parte da data para evitar problemas de timezone
      const dateOnly = dateString.split('T')[0].split(' ')[0];
      const [year, month, day] = dateOnly.split('-').map(Number);
      
      // Criar data local (sem conversão de timezone)
      const localDate = new Date(year, month - 1, day);
      return format(localDate, 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return '--';
    }
  };

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Número</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Cliente/Fornecedor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Data</TableHead>
            <TableHead className="w-[120px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell>
                <span className="font-medium">{order.numero_pedido}</span>
              </TableCell>
              <TableCell>
                <TypeBadge tipo={order.tipo} />
              </TableCell>
              <TableCell>
                <span className="text-sm">
                  {order.tipo === 'VENDA'
                    ? order.cliente?.nome || 
                      (order.cliente_id ? `Cliente #${order.cliente_id}` : '--')
                    : order.fornecedor?.nome_fantasia || 
                      order.fornecedor?.nome_razao || 
                      (order.fornecedor_id ? `Fornecedor #${order.fornecedor_id}` : '--')}
                </span>
              </TableCell>
              <TableCell>
                {onStatusChange ? (
                  <Select
                    value={order.status}
                    onValueChange={(value) => {
                      if (value !== order.status) {
                        onStatusChange(order.id, value as StatusPedido);
                      }
                    }}
                    disabled={updatingStatusId === order.id}
                  >
                    <SelectTrigger
                      className={`h-7 w-[140px] text-xs font-medium rounded-full border-0 shadow-none hover:opacity-80 transition-opacity ${
                        order.status === 'PENDENTE'
                          ? 'bg-yellow-100 text-yellow-800 border border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800'
                          : order.status === 'APROVADO'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
                          : order.status === 'EM_PROCESSAMENTO'
                          ? 'bg-purple-100 text-purple-800 border border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800'
                          : order.status === 'CONCLUIDO'
                          ? 'bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                          : 'bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
                      }`}
                    >
                      <SelectValue>
                        {updatingStatusId === order.id ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Atualizando...</span>
                          </div>
                        ) : (
                          <span>
                            {order.status === 'PENDENTE'
                              ? 'Pendente'
                              : order.status === 'APROVADO'
                              ? 'Aprovado'
                              : order.status === 'EM_PROCESSAMENTO'
                              ? 'Em Processamento'
                              : order.status === 'CONCLUIDO'
                              ? 'Concluído'
                              : 'Cancelado'}
                          </span>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDENTE">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                          Pendente
                        </div>
                      </SelectItem>
                      <SelectItem value="APROVADO">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                          Aprovado
                        </div>
                      </SelectItem>
                      <SelectItem value="EM_PROCESSAMENTO">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                          Em Processamento
                        </div>
                      </SelectItem>
                      <SelectItem value="CONCLUIDO">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-500"></span>
                          Concluído
                        </div>
                      </SelectItem>
                      <SelectItem value="CANCELADO">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-red-500"></span>
                          Cancelado
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <StatusBadge status={order.status} />
                )}
              </TableCell>
              <TableCell>
                <span className="font-medium">{formatCurrency(normalizeCurrency(order.valor_total, false))}</span>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">{formatDate(order.data_pedido)}</span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onView(order)}
                    title="Visualizar"
                  >
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  </Button>
                  {order.status !== 'CANCELADO' && order.status !== 'CONCLUIDO' && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onEdit(order)}
                        title="Editar"
                      >
                        <Edit className="w-4 h-4 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onCancel(order)}
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

