import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { CheckCircle2, Calendar, AlertCircle } from 'lucide-react';
import { Parcela } from '@/hooks/useParcelasPedido';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ParcelasChecklistProps {
  parcelas: Parcela[];
  onMarcarPaga: (parcelaId: number, dataPagamento?: string, observacoes?: string) => Promise<void>;
  onDesmarcarPaga: (parcelaId: number) => Promise<void>;
  loading?: boolean;
}

export function ParcelasChecklist({
  parcelas,
  onMarcarPaga,
  onDesmarcarPaga,
  loading = false,
}: ParcelasChecklistProps) {
  const [dialogAberto, setDialogAberto] = useState(false);
  const [parcelaSelecionada, setParcelaSelecionada] = useState<Parcela | null>(null);
  const [dataPagamento, setDataPagamento] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [processando, setProcessando] = useState(false);

  const formatarData = (data: string) => {
    try {
      const date = new Date(data);
      return format(date, 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return data;
    }
  };

  const handleCheckboxChange = async (parcela: Parcela, checked: boolean) => {
    if (checked) {
      // Abrir dialog para confirmar pagamento
      setParcelaSelecionada(parcela);
      setDataPagamento(new Date().toISOString().split('T')[0]);
      setObservacoes('');
      setDialogAberto(true);
    } else {
      // Desmarcar diretamente
      if (window.confirm('Deseja realmente desmarcar esta parcela como paga?')) {
        try {
          setProcessando(true);
          await onDesmarcarPaga(parcela.id);
        } catch (error) {
          alert('Erro ao desmarcar parcela');
        } finally {
          setProcessando(false);
        }
      }
    }
  };

  const handleConfirmarPagamento = async () => {
    if (!parcelaSelecionada) return;

    try {
      setProcessando(true);
      await onMarcarPaga(parcelaSelecionada.id, dataPagamento, observacoes);
      setDialogAberto(false);
      setParcelaSelecionada(null);
      setDataPagamento('');
      setObservacoes('');
    } catch (error) {
      alert('Erro ao marcar parcela como paga');
    } finally {
      setProcessando(false);
    }
  };

  const getStatusBadge = (parcela: Parcela) => {
    if (parcela.status === 'PAGA') {
      return (
        <Badge variant="default" className="bg-green-600 hover:bg-green-700">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Paga
        </Badge>
      );
    }

    // Verificar se está vencida
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const vencimento = new Date(parcela.data_vencimento);
    vencimento.setHours(0, 0, 0, 0);

    if (vencimento < hoje) {
      return (
        <Badge variant="destructive">
          <AlertCircle className="w-3 h-3 mr-1" />
          Vencida
        </Badge>
      );
    }

    return (
      <Badge variant="secondary">
        <Calendar className="w-3 h-3 mr-1" />
        Pendente
      </Badge>
    );
  };

  return (
    <>
      <div className="space-y-2">
        {parcelas.map((parcela) => (
          <div
            key={parcela.id}
            className={`flex items-start gap-3 p-4 border rounded-lg transition-colors ${
              parcela.status === 'PAGA'
                ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                : 'bg-card border-border'
            }`}
          >
            <Checkbox
              checked={parcela.status === 'PAGA'}
              onCheckedChange={(checked) =>
                handleCheckboxChange(parcela, checked === true)
              }
              disabled={loading || processando}
              className="mt-1"
            />

            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold">
                  Parcela {parcela.numero_parcela}/{parcela.total_parcelas}
                </span>
                {getStatusBadge(parcela)}
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span>
                  <strong>Valor:</strong> {formatCurrency(parcela.valor)}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <strong>Vencimento:</strong> {formatarData(parcela.data_vencimento)}
                </span>
                {parcela.status === 'PAGA' && parcela.data_pagamento && (
                  <span className="text-green-600 dark:text-green-400">
                    <strong>Paga em:</strong> {formatarData(parcela.data_pagamento)}
                  </span>
                )}
              </div>

              {parcela.observacoes && (
                <p className="text-xs text-muted-foreground mt-1">
                  {parcela.observacoes}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Dialog de Confirmação de Pagamento */}
      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Pagamento da Parcela</DialogTitle>
            <DialogDescription>
              Preencha as informações do pagamento
            </DialogDescription>
          </DialogHeader>

          {parcelaSelecionada && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Parcela</Label>
                <p className="text-sm font-medium">
                  {parcelaSelecionada.numero_parcela}/{parcelaSelecionada.total_parcelas}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Valor</Label>
                <p className="text-sm font-medium">
                  {formatCurrency(parcelaSelecionada.valor)}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Vencimento</Label>
                <p className="text-sm font-medium">
                  {formatarData(parcelaSelecionada.data_vencimento)}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="data-pagamento">Data de Pagamento</Label>
                <Input
                  id="data-pagamento"
                  type="date"
                  value={dataPagamento}
                  onChange={(e) => setDataPagamento(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações (opcional)</Label>
                <Textarea
                  id="observacoes"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Ex: Pagamento via PIX, referência..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogAberto(false);
                setParcelaSelecionada(null);
                setDataPagamento('');
                setObservacoes('');
              }}
              disabled={processando}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmarPagamento}
              disabled={processando}
            >
              {processando ? 'Processando...' : 'Confirmar Pagamento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
