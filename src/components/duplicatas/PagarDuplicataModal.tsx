import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '@/lib/utils';
import {
    DarBaixaDto,
    FormaRecebimento,
    duplicatasService,
} from '@/services/duplicatas.service';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export interface DuplicataParaBaixa {
  id: number;
  numero?: string;
  valor_original: number;
  valor_aberto: number;
}

interface PagarDuplicataModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  duplicata: DuplicataParaBaixa | null;
  onSuccess: () => void;
}

export function PagarDuplicataModal({
  open,
  onOpenChange,
  duplicata,
  onSuccess,
}: PagarDuplicataModalProps) {
  const [valorPago, setValorPago] = useState(0);
  const [dataBaixa, setDataBaixa] = useState(
    new Date().toISOString().split('T')[0]
  );
  // Forma de recebimento removida - usando valor padrão 'PIX' internamente
  const formaRecebimento: FormaRecebimento = 'PIX';
  const [juros, setJuros] = useState(0);
  const [multa, setMulta] = useState(0);
  const [desconto, setDesconto] = useState(0);
  const [observacao, setObservacao] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const valorAberto = duplicata?.valor_aberto ?? 0;

  useEffect(() => {
    if (open && duplicata) {
      setValorPago(duplicata.valor_aberto);
      setDataBaixa(new Date().toISOString().split('T')[0]);
      setJuros(0);
      setMulta(0);
      setDesconto(0);
      setObservacao('');
      setErro('');
    }
  }, [open, duplicata]);

  const valorLiquido =
    valorPago + (juros || 0) + (multa || 0) - (desconto || 0);

  const resetForm = () => {
    setValorPago(duplicata?.valor_aberto ?? 0);
    setDataBaixa(new Date().toISOString().split('T')[0]);
    setJuros(0);
    setMulta(0);
    setDesconto(0);
    setObservacao('');
    setErro('');
  };

  const handleOpenChange = (o: boolean) => {
    if (!o) resetForm();
    onOpenChange(o);
  };

  const handleSubmit = async () => {
    if (!duplicata) return;
    setErro('');

    if (!valorPago || valorPago <= 0) {
      setErro('Informe o valor pago');
      return;
    }
    if (valorPago > valorAberto) {
      setErro('Valor pago não pode ser maior que o valor em aberto');
      return;
    }
    if (valorLiquido > valorAberto) {
      setErro(
        'Valor líquido (valor + juros + multa - desconto) não pode ser maior que o valor em aberto'
      );
      return;
    }

    setLoading(true);
    try {
      const payload: DarBaixaDto = {
        valor_pago: valorPago,
        data_baixa: dataBaixa.includes('T') ? dataBaixa.split('T')[0] : dataBaixa,
        forma_recebimento: formaRecebimento, // Valor padrão 'PIX'
        juros: juros || 0,
        multa: multa || 0,
        desconto: desconto || 0,
        observacao: observacao || undefined,
      };
      await duplicatasService.darBaixa(duplicata.id, payload);
      onSuccess();
      handleOpenChange(false);
    } catch (error: any) {
      setErro(
        error?.response?.data?.message ||
          error?.message ||
          'Erro ao registrar pagamento'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!duplicata) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pagar duplicata</DialogTitle>
          <DialogDescription>
            {duplicata.numero && (
              <>
                Duplicata {duplicata.numero} — Valor original:{' '}
                {formatCurrency(duplicata.valor_original)}
              </>
            )}
            <br />
            Valor em aberto: <strong>{formatCurrency(valorAberto)}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Valor pago *</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={valorPago || ''}
              onChange={(e) => setValorPago(Number(e.target.value) || 0)}
              placeholder="0,00"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Pré-preenchido com o valor em aberto. Permite baixa parcial.
            </p>
          </div>

          <div>
            <Label>Data da baixa *</Label>
            <Input
              type="date"
              value={dataBaixa}
              onChange={(e) => setDataBaixa(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Juros</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={juros || ''}
                onChange={(e) => setJuros(Number(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label>Multa</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={multa || ''}
                onChange={(e) => setMulta(Number(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label>Desconto</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={desconto || ''}
                onChange={(e) => setDesconto(Number(e.target.value) || 0)}
              />
            </div>
          </div>

          <div>
            <Label>Observação</Label>
            <Textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Opcional"
              rows={2}
            />
          </div>

          {erro && <p className="text-sm text-destructive">{erro}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Registrar pagamento'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
