import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Transportadora, Pedido } from '@/types/carrier';
import { OrderStatusBadge } from './OrderStatusBadge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CarrierOrdersDialogProps {
  /** Controla visibilidade do modal */
  isOpen: boolean;
  
  /** Callback ao fechar */
  onClose: () => void;
  
  /** Transportadora selecionada */
  carrier: Transportadora | null;
  
  /** Lista de pedidos da transportadora */
  orders: Pedido[];
}

export function CarrierOrdersDialog({
  isOpen,
  onClose,
  carrier,
  orders,
}: CarrierOrdersDialogProps) {
  const stats = {
    total: orders.length,
    pendentes: orders.filter((o) => o.status === 'pendente').length,
    emTransito: orders.filter((o) => o.status === 'em_transito').length,
    entregues: orders.filter((o) => o.status === 'entregue').length,
    valorTotal: orders.reduce((sum, o) => sum + (o.valor || 0), 0),
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pedidos - {carrier?.nome}</DialogTitle>
          <DialogDescription>
            Visualização de pedidos vinculados à transportadora
          </DialogDescription>
        </DialogHeader>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="text-sm text-muted-foreground">Total</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
            <div className="text-sm text-muted-foreground">Pendentes</div>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {stats.pendentes}
            </div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <div className="text-sm text-muted-foreground">Em Trânsito</div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.emTransito}
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <div className="text-sm text-muted-foreground">Entregues</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.entregues}
            </div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
            <div className="text-sm text-muted-foreground">Valor Total</div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(stats.valorTotal)}
            </div>
          </div>
        </div>

        {/* Tabela de Pedidos */}
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Nenhum pedido encontrado para esta transportadora
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data Criação</TableHead>
                  <TableHead>Data Entrega</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      {order.numero || `#${order.id}`}
                    </TableCell>
                    <TableCell>{order.cliente || '--'}</TableCell>
                    <TableCell>{order.destino || '--'}</TableCell>
                    <TableCell>
                      {order.valor
                        ? new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(order.valor)
                        : '--'}
                    </TableCell>
                    <TableCell>
                      {order.status ? (
                        <OrderStatusBadge status={order.status} />
                      ) : (
                        '--'
                      )}
                    </TableCell>
                    <TableCell>
                      {order.dataCriacao
                        ? format(
                            new Date(order.dataCriacao),
                            'dd/MM/yyyy',
                            { locale: ptBR }
                          )
                        : '--'}
                    </TableCell>
                    <TableCell>
                      {order.dataEntrega
                        ? format(
                            new Date(order.dataEntrega),
                            'dd/MM/yyyy',
                            { locale: ptBR }
                          )
                        : '--'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}


