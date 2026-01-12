import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pedido,
  CreatePedidoDto,
  TipoPedido,
  FormaPagamento,
} from '@/types/pedido';
import { Loader2, ShoppingCart, Package, Calendar, DollarSign, Truck, FileText, Plus, Trash2 } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { Cliente } from '@/services/clientes.service';
import { Fornecedor } from '@/services/fornecedores.service';
import { Produto } from '@/services/produtos.service';

interface OrderFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePedidoDto) => void;
  order?: Pedido | null;
  isPending?: boolean;
  clientes: Cliente[];
  fornecedores: Fornecedor[];
  produtos: Produto[];
  transportadoras: Array<{ id: number; nome: string }>;
}

interface OrderItemForm {
  produto_id: number;
  quantidade: number | '';
  preco_unitario: number | '';
  desconto: number | '';
}

export function OrderForm({
  isOpen,
  onClose,
  onSubmit,
  order,
  isPending = false,
  clientes,
  fornecedores,
  produtos,
  transportadoras,
}: OrderFormProps) {
  const [tipo, setTipo] = useState<TipoPedido>('VENDA');
  const [clienteId, setClienteId] = useState<number | undefined>(undefined);
  const [fornecedorId, setFornecedorId] = useState<number | undefined>(undefined);
  const [transportadoraId, setTransportadoraId] = useState<number | undefined>(undefined);
  const [dataPedido, setDataPedido] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [dataEntregaPrevista, setDataEntregaPrevista] = useState<string>('');
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento | undefined>(undefined);
  const [condicaoPagamento, setCondicaoPagamento] = useState<string>('');
  const [dataVencimento, setDataVencimento] = useState<string>('');
  const [prazoEntregaDias, setPrazoEntregaDias] = useState<number | undefined>(undefined);
  const [frete, setFrete] = useState<number | ''>('');
  const [outrasTaxas, setOutrasTaxas] = useState<number | ''>('');
  const [observacoesInternas, setObservacoesInternas] = useState<string>('');
  const [observacoesCliente, setObservacoesCliente] = useState<string>('');
  const [itens, setItens] = useState<OrderItemForm[]>([
    { produto_id: 0, quantidade: '', preco_unitario: '', desconto: '' },
  ]);

  // Preencher formulário quando order for carregado
  useEffect(() => {
    if (order && isOpen) {
      setTipo(order.tipo);
      setClienteId(order.cliente_id);
      setFornecedorId(order.fornecedor_id);
      setTransportadoraId(order.transportadora_id);
      
      // Extrair apenas a data (YYYY-MM-DD)
      const dataPedidoOnly = order.data_pedido.split('T')[0].split(' ')[0];
      const dataEntregaOnly = order.data_entrega_prevista?.split('T')[0].split(' ')[0] || '';
      const dataVencimentoOnly = order.data_vencimento_base?.split('T')[0].split(' ')[0] || '';
      
      setDataPedido(dataPedidoOnly);
      setDataEntregaPrevista(dataEntregaOnly);
      setFormaPagamento(order.forma_pagamento);
      setCondicaoPagamento(order.condicao_pagamento || '');
      setDataVencimento(dataVencimentoOnly);
      setPrazoEntregaDias(order.prazo_entrega_dias);
      setFrete(order.frete || '');
      setOutrasTaxas(order.outras_taxas || '');
      setObservacoesInternas(order.observacoes_internas || '');
      setObservacoesCliente(order.observacoes_cliente || '');
      
      // Preencher itens
      if (order.itens && order.itens.length > 0) {
        setItens(
          order.itens.map((item) => ({
            produto_id: item.produto_id,
            quantidade: item.quantidade,
            preco_unitario: item.preco_unitario,
            desconto: item.desconto || '',
          }))
        );
      }
    } else if (!order && isOpen) {
      // Reset form para novo pedido
      setTipo('VENDA');
      setClienteId(undefined);
      setFornecedorId(undefined);
      setTransportadoraId(undefined);
      setDataPedido(new Date().toISOString().split('T')[0]);
      setDataEntregaPrevista('');
      setFormaPagamento(undefined);
      setCondicaoPagamento('');
      setDataVencimento('');
      setPrazoEntregaDias(undefined);
      setFrete('');
      setOutrasTaxas('');
      setObservacoesInternas('');
      setObservacoesCliente('');
      setItens([{ produto_id: 0, quantidade: '', preco_unitario: '', desconto: '' }]);
    }
  }, [order, isOpen]);

  const handleAddItem = () => {
    setItens([...itens, { produto_id: 0, quantidade: '', preco_unitario: '', desconto: '' }]);
  };

  const handleRemoveItem = (index: number) => {
    if (itens.length > 1) {
      setItens(itens.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index: number, field: keyof OrderItemForm, value: any) => {
    const newItens = [...itens];
    newItens[index] = { ...newItens[index], [field]: value };
    setItens(newItens);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const itensFormatados = itens
      .filter(item => item.produto_id && item.produto_id !== 0)
      .map(item => ({
        produto_id: Number(item.produto_id),
        quantidade: Number(item.quantidade) || 0,
        preco_unitario: Number(item.preco_unitario) || 0,
        ...(item.desconto ? { desconto: Number(item.desconto) } : {}),
      }));
    
    const pedidoData: CreatePedidoDto = {
      tipo,
      data_pedido: dataPedido,
      cliente_id: tipo === 'VENDA' ? clienteId : undefined,
      fornecedor_id: tipo === 'COMPRA' ? fornecedorId : undefined,
      transportadora_id: transportadoraId,
      data_entrega_prevista: dataEntregaPrevista || undefined,
      forma_pagamento: formaPagamento,
      data_vencimento: dataVencimento || undefined,
      condicao_pagamento: condicaoPagamento || undefined,
      prazo_entrega_dias: prazoEntregaDias,
      frete: typeof frete === 'number' ? frete : (frete ? Number(frete) : undefined),
      outras_taxas: typeof outrasTaxas === 'number' ? outrasTaxas : (outrasTaxas ? Number(outrasTaxas) : undefined),
      observacoes_internas: observacoesInternas || undefined,
      observacoes_cliente: observacoesCliente || undefined,
      itens: itensFormatados,
    };

    onSubmit(pedidoData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {order ? 'Editar Pedido' : 'Novo Pedido'}
          </DialogTitle>
          <DialogDescription className="mt-1">
            {order
              ? 'Atualize as informações do pedido no sistema'
              : 'Preencha os dados para criar um novo pedido'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8 pt-6">
          <div className="bg-card border rounded-lg p-6 space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-orange-500/10">
                {tipo === 'VENDA' ? (
                  <ShoppingCart className="w-5 h-5 text-orange-500" />
                ) : (
                  <Package className="w-5 h-5 text-orange-500" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold">Informações Básicas</h3>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Tipo de Pedido</Label>
                <div className="grid grid-cols-2 gap-4">
                  {(['VENDA', 'COMPRA'] as TipoPedido[]).map((tipoOption) => (
                    <button
                      key={tipoOption}
                      type="button"
                      onClick={() => setTipo(tipoOption)}
                      className={cn(
                        'flex items-center gap-3 p-4 rounded-lg border-2 transition-all',
                        tipo === tipoOption
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-card hover:border-primary/50'
                      )}
                    >
                      {tipoOption === 'VENDA' ? (
                        <ShoppingCart className="w-5 h-5 text-green-500" />
                      ) : (
                        <Package className="w-5 h-5 text-blue-500" />
                      )}
                      <span className="font-medium">{tipoOption}</span>
                    </button>
                  ))}
                </div>
              </div>

              {tipo === 'VENDA' ? (
                <div className="space-y-2">
                  <Label>Cliente</Label>
                  <Select
                    value={clienteId?.toString() || ''}
                    onValueChange={(value) => setClienteId(Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.map((cliente) => (
                        <SelectItem key={cliente.id} value={cliente.id.toString()}>
                          {cliente.nome_fantasia || cliente.nome_razao || cliente.nome}
                            </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Fornecedor</Label>
                  <Select
                    value={fornecedorId?.toString() || ''}
                    onValueChange={(value) => setFornecedorId(Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um fornecedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {fornecedores.map((fornecedor) => (
                        <SelectItem key={fornecedor.id} value={fornecedor.id.toString()}>
                          {fornecedor.nome_fantasia || fornecedor.nome_razao}
                          </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data do Pedido</Label>
                  <Input
                    type="date"
                    value={dataPedido}
                    onChange={(e) => setDataPedido(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data Entrega Prevista</Label>
                  <Input
                    type="date"
                    value={dataEntregaPrevista}
                    onChange={(e) => setDataEntregaPrevista(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-lg p-6 space-y-6">
            <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Itens do Pedido</h3>
              <Button type="button" onClick={handleAddItem} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Item
              </Button>
            </div>

            <div className="space-y-4">
              {itens.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-4 p-4 border rounded-lg">
                  <div className="col-span-4 space-y-2">
                    <Label>Produto</Label>
                    <Select
                      value={item.produto_id && item.produto_id !== 0 ? item.produto_id.toString() : ''}
                      onValueChange={(value) => handleItemChange(index, 'produto_id', Number(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um produto" />
                      </SelectTrigger>
                      <SelectContent>
                        {produtos.map((produto) => (
                            <SelectItem key={produto.id} value={produto.id.toString()}>
                            {produto.nome}
                            </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label>Quantidade</Label>
                    <Input
                      type="number"
                      step="any"
                      min="0"
                      value={item.quantidade}
                      onChange={(e) => handleItemChange(index, 'quantidade', e.target.value ? Number(e.target.value) : '')}
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label>Preço Unitário</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.preco_unitario}
                      onChange={(e) => handleItemChange(index, 'preco_unitario', e.target.value ? Number(e.target.value) : '')}
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label>Desconto</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.desconto}
                      onChange={(e) => handleItemChange(index, 'desconto', e.target.value ? Number(e.target.value) : '')}
                    />
                  </div>

                  <div className="col-span-1 space-y-2">
                    <Label>Subtotal</Label>
                    <div className="h-10 flex items-center text-sm font-medium">
                      {formatCurrency(
                        Math.max(0, 
                          (typeof item.quantidade === 'number' ? item.quantidade : 0) * 
                          (typeof item.preco_unitario === 'number' ? item.preco_unitario : 0) - 
                          (typeof item.desconto === 'number' ? item.desconto : 0)
                        )
                      )}
                    </div>
                  </div>

                  <div className="col-span-1 flex items-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveItem(index)}
                      disabled={itens.length === 1}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border rounded-lg p-6 space-y-6">
                <h3 className="text-lg font-semibold">Pagamento e Entrega</h3>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Forma de Pagamento</Label>
                  <Select
                    value={formaPagamento || ''}
                    onValueChange={(value) => setFormaPagamento(value as FormaPagamento)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a forma de pagamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DINHEIRO">Dinheiro</SelectItem>
                      <SelectItem value="PIX">PIX</SelectItem>
                      <SelectItem value="CARTAO_CREDITO">Cartão de Crédito</SelectItem>
                      <SelectItem value="CARTAO_DEBITO">Cartão de Débito</SelectItem>
                      <SelectItem value="BOLETO">Boleto</SelectItem>
                      <SelectItem value="TRANSFERENCIA">Transferência</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Data de Vencimento</Label>
                  <Input
                    type="date"
                    value={dataVencimento}
                    onChange={(e) => setDataVencimento(e.target.value)}
                  />
                </div>
              </div>

                <div className="space-y-2">
                <Label>Condição de Pagamento</Label>
                <Input
                  type="text"
                  value={condicaoPagamento}
                  onChange={(e) => setCondicaoPagamento(e.target.value)}
                  placeholder="Ex: 30 dias, 3x sem juros, etc."
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Transportadora</Label>
                  <Select
                    value={transportadoraId?.toString() || ''}
                    onValueChange={(value) => setTransportadoraId(Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma transportadora" />
                    </SelectTrigger>
                    <SelectContent>
                      {transportadoras.map((transportadora) => (
                        <SelectItem key={transportadora.id} value={transportadora.id.toString()}>
                          {transportadora.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Prazo de Entrega (dias)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={prazoEntregaDias || ''}
                    onChange={(e) => setPrazoEntregaDias(e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Frete</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={frete}
                    onChange={(e) => setFrete(e.target.value ? Number(e.target.value) : '')}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Outras Taxas</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={outrasTaxas}
                  onChange={(e) => setOutrasTaxas(e.target.value ? Number(e.target.value) : '')}
                />
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold">Resumo Financeiro</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Subtotal</Label>
                <div className="text-lg font-semibold">
                  {formatCurrency(
                    itens.reduce((acc, item) => {
                      const quantidade = typeof item.quantidade === 'number' ? item.quantidade : 0;
                      const precoUnitario = typeof item.preco_unitario === 'number' ? item.preco_unitario : 0;
                      const desconto = typeof item.desconto === 'number' ? item.desconto : 0;
                      return acc + (quantidade * precoUnitario - desconto);
                    }, 0)
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Frete</Label>
                <div className="text-lg font-semibold">
                  {formatCurrency(typeof frete === 'number' ? frete : 0)}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Outras Taxas</Label>
                <div className="text-lg font-semibold">
                  {formatCurrency(typeof outrasTaxas === 'number' ? outrasTaxas : 0)}
                </div>
              </div>
              <div className="col-span-2 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <Label className="text-xl font-bold">Total</Label>
                  <div className="text-2xl font-bold text-primary">
                    {formatCurrency(
                      itens.reduce((acc, item) => {
                        const quantidade = typeof item.quantidade === 'number' ? item.quantidade : 0;
                        const precoUnitario = typeof item.preco_unitario === 'number' ? item.preco_unitario : 0;
                        const desconto = typeof item.desconto === 'number' ? item.desconto : 0;
                        return acc + (quantidade * precoUnitario - desconto);
                      }, 0) +
                      (typeof frete === 'number' ? frete : 0) +
                      (typeof outrasTaxas === 'number' ? outrasTaxas : 0)
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-lg p-6 space-y-6">
                <h3 className="text-lg font-semibold">Observações</h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Observações Internas</Label>
                <Textarea
                  value={observacoesInternas}
                  onChange={(e) => setObservacoesInternas(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Observações do Cliente</Label>
                <Textarea
                  value={observacoesCliente}
                  onChange={(e) => setObservacoesCliente(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            variant="gradient"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {order ? 'Atualizando...' : 'Criando...'}
              </>
            ) : (
              order ? 'Atualizar Pedido' : 'Criar Pedido'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
