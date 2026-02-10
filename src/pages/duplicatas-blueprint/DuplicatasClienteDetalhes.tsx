import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatCurrency, normalizarStatusParcela } from '@/lib/utils';
import { clientesService } from '@/services/clientes.service';
import { contasReceberService, type ParcelaDetalhe } from '@/services/contas-receber.service';
import { pedidosService } from '@/services/pedidos.service';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, DollarSign, FileText, Loader2 } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const STATUS_LABELS: Record<string, string> = {
  ABERTA: 'Aberta',
  PARCIALMENTE_PAGA: 'Parcial',
  PAGA: 'Quitada',
  EM_COMPENSACAO: 'Em Compensação',
};

const STATUS_COLORS: Record<string, string> = {
  ABERTA: 'bg-slate-500/10 text-slate-600',
  PARCIALMENTE_PAGA: 'bg-amber-500/10 text-amber-600',
  PAGA: 'bg-green-500/10 text-green-600',
  EM_COMPENSACAO: 'bg-blue-500/10 text-blue-600',
};

function formatarDocumento(doc?: string): string {
  if (!doc) return '—';
  const n = doc.replace(/\D/g, '');
  if (n.length === 11) return n.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  if (n.length === 14) return n.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  return doc;
}

const DuplicatasClienteDetalhes = () => {
  const { clienteId } = useParams<{ clienteId: string }>();
  const navigate = useNavigate();

  const { data: cliente, isLoading: loadingCliente } = useQuery({
    queryKey: ['clientes', clienteId],
    queryFn: () => clientesService.buscarPorId(Number(clienteId!)),
    enabled: !!clienteId,
  });

  const { data: detalheApi } = useQuery({
    queryKey: ['contas-receber', 'detalhe', clienteId],
    queryFn: () => contasReceberService.obterDetalheCliente(Number(clienteId!)),
    enabled: !!clienteId,
  });

  // Usar novo endpoint /pedidos/contas-receber
  const { data: pedidosContasReceber } = useQuery({
    queryKey: ['pedidos', 'contas-receber', 'cliente', clienteId],
    queryFn: () =>
      pedidosService.listarContasReceber({
        cliente_id: Number(clienteId!),
        situacao: 'em_aberto',
      }),
    enabled: !!clienteId,
  });

  const parcelas: ParcelaDetalhe[] = useMemo(() => {
    // Usar endpoint de detalhe do cliente que retorna todas as parcelas
    if (detalheApi?.parcelas?.length) return detalheApi.parcelas;

    // Se não houver parcelas do endpoint de detalhe, retornar vazio
    // O novo endpoint /pedidos/contas-receber retorna apenas pedidos, não parcelas
    // Para ver parcelas, use o endpoint /clientes/:id/detalhe
    return [];
  }, [detalheApi]);

  const totalAberto = useMemo(
    () => parcelas.reduce((s, p) => s + (p.valor_aberto ?? 0), 0),
    [parcelas]
  );

  const documento = cliente?.cpf_cnpj || detalheApi?.cliente?.documento || detalheApi?.cliente?.cpf_cnpj;
  const nomeCliente = cliente?.nome_fantasia || cliente?.nome_razao || cliente?.nome || detalheApi?.cliente?.nome || '—';

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/duplicatas')}
          className="mb-2 -ml-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        {loadingCliente ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-semibold mb-4">Cliente</h2>
              <div className="grid gap-2 text-sm">
                <p>
                  <span className="text-muted-foreground">Cliente:</span>{' '}
                  <strong>{nomeCliente}</strong>
                </p>
                <p>
                  <span className="text-muted-foreground">Documento:</span>{' '}
                  {formatarDocumento(documento)}
                </p>
                <p>
                  <span className="text-muted-foreground">Total em aberto:</span>{' '}
                  <strong className="text-lg">{formatCurrency(totalAberto)}</strong>
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border overflow-hidden bg-card shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Pedido</TableHead>
                    <TableHead className="w-[80px]">Parcela</TableHead>
                    <TableHead className="w-[120px] text-right">Valor Parcela</TableHead>
                    <TableHead className="w-[100px] text-right">Pago</TableHead>
                    <TableHead className="w-[100px] text-right">Aberto</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead className="w-[140px] text-center">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parcelas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-16 text-center">
                        <FileText className="w-12 h-12 mx-auto text-muted-foreground/50" />
                        <p className="mt-2">Nenhuma parcela encontrada</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    parcelas.map((p) => (
                      <TableRow key={`${p.pedido_id}-${p.id}`}>
                        <TableCell className="font-medium">{p.numero_pedido}</TableCell>
                        <TableCell>
                          {p.numero_parcela}/{p.total_parcelas}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(p.valor)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(p.valor_pago ?? 0)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(p.valor_aberto ?? 0)}
                        </TableCell>
                        <TableCell>
                          {(() => {
                            // Normalizar status para garantir que seja válido
                            const statusNormalizado = normalizarStatusParcela(p.status);
                            return (
                              <span
                                className={`text-xs px-2 py-1 rounded-full font-medium ${
                                  STATUS_COLORS[statusNormalizado] || 'bg-slate-500/10'
                                }`}
                              >
                                {STATUS_LABELS[statusNormalizado] || statusNormalizado}
                              </span>
                            );
                          })()}
                        </TableCell>
                        <TableCell className="text-center">
                          {(p.valor_aberto ?? 0) > 0 ? (
                            <Button
                              size="sm"
                              onClick={() => {
                                const parcelaIdParaUrl = p.parcela_id ?? p.id;
                                navigate(
                                  `/duplicatas/clientes/${clienteId}/pagar/${p.pedido_id}/${parcelaIdParaUrl}`,
                                  {
                                    state: {
                                      parcela: p,
                                      parcela_pedido_id: p.parcela_id,
                                      cliente: nomeCliente,
                                      numeroPedido: p.numero_pedido,
                                    },
                                  }
                                );
                              }}
                            >
                              <DollarSign className="w-4 h-4 mr-1" />
                              Pagar parcela
                            </Button>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default DuplicatasClienteDetalhes;
