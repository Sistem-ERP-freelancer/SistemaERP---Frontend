import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import { Baixa, duplicatasService } from '@/services/duplicatas.service';
import { Pagamento, pagamentosService } from '@/services/pagamentos.service';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronDown, ChevronUp, History, Loader2 } from 'lucide-react';
import React, { useMemo, useState } from 'react';

const FORMAS_LABEL: Record<string, string> = {
  DINHEIRO: 'Dinheiro',
  PIX: 'PIX',
  CARTAO_CREDITO: 'Cartão Crédito',
  CARTAO_DEBITO: 'Cartão Débito',
  BOLETO: 'Boleto',
  TRANSFERENCIA: 'Transferência',
  CHEQUE: 'Cheque',
};

/** Item unificado para exibição (pagamento direto ou baixa de duplicata) */
interface ItemHistorico {
  id: number;
  data_lancamento: string;
  forma_pagamento: string;
  valor_pago: number;
  estornado: boolean;
  origem: 'pagamento' | 'baixa';
  cheques?: Pagamento['cheques'] | Baixa['cheques'];
}

interface HistoricoPagamentosParcelaProps {
  parcelaId: number;
  parcelaLabel: string;
  onEstornoSucesso?: () => void;
}

export function HistoricoPagamentosParcela({
  parcelaId,
  parcelaLabel,
  onEstornoSucesso,
}: HistoricoPagamentosParcelaProps) {
  const [aberto, setAberto] = useState(false);

  const { data: pagamentos, isLoading: loadingPagamentos } = useQuery({
    queryKey: ['pagamentos', 'parcela', parcelaId],
    queryFn: () => pagamentosService.listarPorParcela(parcelaId),
    enabled: aberto,
  });

  const { data: duplicatas, isLoading: loadingDuplicatas } = useQuery({
    queryKey: ['duplicatas', 'parcela-pedido', parcelaId],
    queryFn: () => duplicatasService.listar({ parcela_pedido_id: parcelaId }),
    enabled: aberto,
  });

  const idsDuplicatas = useMemo(
    () => (duplicatas?.length ? duplicatas.map((d) => d.id).join(',') : ''),
    [duplicatas]
  );

  const { data: baixasPorDuplicata, isLoading: loadingBaixas } = useQuery({
    queryKey: ['duplicatas', 'historico-parcela', parcelaId, idsDuplicatas],
    queryFn: async () => {
      if (!duplicatas?.length) return [];
      const listas = await Promise.all(
        duplicatas.map((d) => duplicatasService.obterHistorico(d.id))
      );
      return listas.flat();
    },
    enabled: aberto && (duplicatas?.length ?? 0) > 0,
  });

  const listaUnificada = useMemo((): ItemHistorico[] => {
    const itens: ItemHistorico[] = [];
    (pagamentos || []).forEach((p) => {
      itens.push({
        id: p.id,
        data_lancamento: p.data_lancamento,
        forma_pagamento: p.forma_pagamento,
        valor_pago: p.valor_pago,
        estornado: !!p.estornado,
        origem: 'pagamento',
        cheques: p.cheques,
      });
    });
    (baixasPorDuplicata || []).forEach((b) => {
      itens.push({
        id: b.id,
        data_lancamento: b.data_baixa,
        forma_pagamento: b.forma_recebimento,
        valor_pago: b.valor_pago,
        estornado: !!b.estornado,
        origem: 'baixa',
        cheques: b.cheques,
      });
    });
    itens.sort(
      (a, b) => new Date(b.data_lancamento).getTime() - new Date(a.data_lancamento).getTime()
    );
    return itens;
  }, [pagamentos, baixasPorDuplicata]);

  const isLoading = loadingPagamentos || loadingDuplicatas || loadingBaixas;

  const formatarData = (data: string) => {
    try {
      return format(new Date(data), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return data;
    }
  };

  return (
    <>
      <Collapsible open={aberto} onOpenChange={setAberto}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 gap-1 text-muted-foreground">
            <History className="w-4 h-4" />
            Histórico de pagamentos
            {aberto ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-2 border rounded-lg overflow-hidden">
            {isLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : listaUnificada.length === 0 ? (
              <p className="py-4 px-4 text-sm text-muted-foreground text-center">
                Nenhum pagamento registrado
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Data</TableHead>
                    <TableHead>Forma</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listaUnificada.map((p) => (
                    <React.Fragment key={`${p.origem}-${p.id}`}>
                      <TableRow>
                        <TableCell className="text-sm">{formatarData(p.data_lancamento)}</TableCell>
                        <TableCell className="text-sm">
                          {FORMAS_LABEL[p.forma_pagamento] || p.forma_pagamento}
                        </TableCell>
                        <TableCell className="text-sm">{formatCurrency(p.valor_pago)}</TableCell>
                        <TableCell>
                          {p.estornado ? (
                            <Badge variant="secondary">Estornado</Badge>
                          ) : (
                            <Badge className="bg-green-500/10 text-green-600">Pago</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                      {p.forma_pagamento === 'CHEQUE' && p.cheques && p.cheques.length > 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="bg-muted/30 py-2">
                            <div className="text-sm">
                              <p className="font-medium mb-2">Cheques:</p>
                              <ul className="space-y-1">
                                {(p.cheques as Array<{ id?: number; numero_cheque?: string; valor?: number; titular?: string; banco?: string; data_vencimento?: string; status?: string }>).map((ch, idx) => (
                                  <li key={ch.id ?? idx} className="flex gap-4 flex-wrap">
                                    <span><strong>{ch.numero_cheque}</strong> — {formatCurrency(ch.valor ?? 0)}</span>
                                    <span>{ch.titular}</span>
                                    <span>{ch.banco}</span>
                                    {ch.data_vencimento && <span>Venc: {formatarData(ch.data_vencimento)}</span>}
                                    {ch.status && <Badge variant="outline">{ch.status}</Badge>}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </>
  );
}
