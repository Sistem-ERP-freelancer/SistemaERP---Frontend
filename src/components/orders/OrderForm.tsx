import { useState, useEffect, useMemo } from 'react';
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
  PedidoItem,
} from '@/types/pedido';
import { Loader2, ShoppingCart, Package, Calendar, DollarSign, Truck, FileText, Plus, Trash2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Cliente } from '@/services/clientes.service';
import { Fornecedor } from '@/services/fornecedores.service';
import { Produto } from '@/services/produtos.service';
import { toast } from 'sonner';

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
  produto_nome?: string;
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
  const [prazoEntregaDias, setPrazoEntregaDias] = useState<number | undefined>(undefined);
  const [frete, setFrete] = useState<number | ''>('');
  const [outrasTaxas, setOutrasTaxas] = useState<number | ''>('');
  const [observacoesInternas, setObservacoesInternas] = useState<string>('');
  const [observacoesCliente, setObservacoesCliente] = useState<string>('');
  const [itens, setItens] = useState<OrderItemForm[]>([
    { produto_id: 0, quantidade: '', preco_unitario: '', desconto: '' },
  ]);

  useEffect(() => {
    if (order) {
      setTipo(order.tipo);
      setClienteId(order.cliente_id);
      setFornecedorId(order.fornecedor_id);
      setTransportadoraId(order.transportadora_id);
      // Extrair apenas a data (YYYY-MM-DD) para evitar problemas de timezone
      const dataPedidoOnly = order.data_pedido.split('T')[0].split(' ')[0];
      const dataEntregaOnly = order.data_entrega_prevista?.split('T')[0].split(' ')[0] || '';
      setDataPedido(dataPedidoOnly);
      setDataEntregaPrevista(dataEntregaOnly);
      setFormaPagamento(order.forma_pagamento);
      setCondicaoPagamento(order.condicao_pagamento || '');
      setPrazoEntregaDias(order.prazo_entrega_dias);
      setFrete(order.frete || '');
      setOutrasTaxas(order.outras_taxas || '');
      setObservacoesInternas(order.observacoes_internas || '');
      setObservacoesCliente(order.observacoes_cliente || '');
      setItens(
        order.itens.map((item) => ({
          produto_id: item.produto_id,
          produto_nome: item.produto?.nome,
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario,
          desconto: item.desconto || '',
        }))
      );
    } else {
      // Reset form
      setTipo('VENDA');
      setClienteId(undefined);
      setFornecedorId(undefined);
      setTransportadoraId(undefined);
      setDataPedido(new Date().toISOString().split('T')[0]);
      setDataEntregaPrevista('');
      setFormaPagamento(undefined);
      setCondicaoPagamento('');
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
    const currentItem = { ...newItens[index] };
    
    // Atualizar o campo específico
    currentItem[field] = value;

    // Se mudou o produto, atualizar preço unitário
    if (field === 'produto_id' && value) {
      const produto = produtos.find((p) => p.id === value);
      if (produto && produto.preco_venda) {
        currentItem.preco_unitario = produto.preco_venda;
        currentItem.produto_nome = produto.nome;
      } else {
        currentItem.preco_unitario = '';
      }
    }

    newItens[index] = currentItem;
    
    // Forçar atualização do estado para garantir que o useMemo recalcule
    setItens([...newItens]);
  };

  const calculos = useMemo(() => {
    // Calcular subtotal: soma de todos os itens (quantidade × preco_unitario - desconto_item)
    const subtotal = itens.reduce((acc, item) => {
      // Garantir conversão correta para número
      const quantidade = typeof item.quantidade === 'number' ? item.quantidade : 
                        item.quantidade === '' ? 0 : Number(item.quantidade) || 0;
      const precoUnitario = typeof item.preco_unitario === 'number' ? item.preco_unitario : 
                           item.preco_unitario === '' ? 0 : Number(item.preco_unitario) || 0;
      const desconto = typeof item.desconto === 'number' ? item.desconto : 
                      item.desconto === '' ? 0 : Number(item.desconto) || 0;
      const itemSubtotal = quantidade * precoUnitario - desconto;
      return acc + itemSubtotal;
    }, 0);

    // Descontos gerais do pedido (por enquanto 0, pois não há campos no formulário)
    // Se no futuro houver campos para desconto_valor e desconto_percentual, usar aqui
    const descontoValor = 0;
    const descontoPercentual = 0;
    
    // Taxas
    const freteValue = typeof frete === 'number' ? frete : 0;
    const outrasTaxasValue = typeof outrasTaxas === 'number' ? outrasTaxas : 0;
    
    // Fórmula correta: valor_total = subtotal - desconto_valor - (subtotal * desconto_percentual / 100) + frete + outras_taxas
    const valorTotal = subtotal - descontoValor - (subtotal * descontoPercentual / 100) + freteValue + outrasTaxasValue;

    return {
      subtotal,
      descontoValor,
      descontoPercentual,
      valorTotal,
    };
  }, [itens, frete, outrasTaxas]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validações com feedback ao usuário
    if (tipo === 'VENDA' && !clienteId) {
      toast.error('Por favor, selecione um cliente para o pedido de venda.');
      return;
    }
    if (tipo === 'COMPRA' && !fornecedorId) {
      toast.error('Por favor, selecione um fornecedor para o pedido de compra.');
      return;
    }

    // Validar que todos os itens têm valores válidos
    const itensValidos = itens.filter((item) => {
      if (item.produto_id === 0) return false;
      const quantidade = typeof item.quantidade === 'number' ? item.quantidade : 0;
      const precoUnitario = typeof item.preco_unitario === 'number' ? item.preco_unitario : 0;
      return quantidade > 0 && precoUnitario > 0;
    });

    if (itensValidos.length === 0) {
      // Verificar se há itens mas nenhum está preenchido corretamente
      const temItensNaoPreenchidos = itens.some((item) => item.produto_id === 0);
      if (temItensNaoPreenchidos) {
        toast.error('Por favor, selecione um produto e preencha a quantidade e o preço unitário.');
      } else {
        toast.error('Por favor, preencha corretamente os produtos (quantidade e preço devem ser maiores que zero).');
      }
      return;
    }

    const pedidoData: CreatePedidoDto = {
      tipo,
      data_pedido: dataPedido,
      cliente_id: tipo === 'VENDA' ? clienteId : undefined,
      fornecedor_id: tipo === 'COMPRA' ? fornecedorId : undefined,
      transportadora_id: transportadoraId,
      data_entrega_prevista: dataEntregaPrevista || undefined,
      forma_pagamento: formaPagamento,
      condicao_pagamento: condicaoPagamento || undefined,
      prazo_entrega_dias: prazoEntregaDias,
      subtotal: calculos.subtotal,
      desconto_valor: calculos.descontoValor || undefined,
      desconto_percentual: calculos.descontoPercentual || undefined,
      frete: typeof frete === 'number' ? frete : undefined,
      outras_taxas: typeof outrasTaxas === 'number' ? outrasTaxas : undefined,
      observacoes_internas: observacoesInternas || undefined,
      observacoes_cliente: observacoesCliente || undefined,
      itens: itensValidos.map((item) => ({
        produto_id: item.produto_id,
        quantidade: typeof item.quantidade === 'number' ? item.quantidade : 0,
        preco_unitario: typeof item.preco_unitario === 'number' ? item.preco_unitario : 0,
        desconto: typeof item.desconto === 'number' ? item.desconto : undefined,
      })),
    };

    console.log('📦 [OrderForm] Submetendo pedido:', pedidoData);
    onSubmit(pedidoData);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
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
          {/* Seção: Tipo e Cliente/Fornecedor */}
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
                <p className="text-sm text-muted-foreground">
                  Tipo de pedido e cliente/fornecedor
                </p>
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
                      onClick={() => {
                        setTipo(tipoOption);
                        setClienteId(undefined);
                        setFornecedorId(undefined);
                      }}
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
                  <Label className="flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-muted-foreground" />
                    Cliente <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={clienteId?.toString() || ''}
                    onValueChange={(value) => setClienteId(Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.map((cliente) => {
                        // Se for pessoa física, exibir apenas o nome
                        if (cliente.tipoPessoa === 'PESSOA_FISICA') {
                          return (
                            <SelectItem key={cliente.id} value={cliente.id.toString()} textValue={cliente.nome}>
                              <div className="flex flex-col items-start">
                                <span className="font-medium">{cliente.nome}</span>
                              </div>
                            </SelectItem>
                          );
                        }
                        // Se for pessoa jurídica, exibir nome_fantasia com nome_razao abaixo (se diferentes)
                        const nomeExibicao = cliente.nome_fantasia || cliente.nome_razao || cliente.nome;
                        return (
                          <SelectItem key={cliente.id} value={cliente.id.toString()} textValue={nomeExibicao}>
                            <div className="flex flex-col items-start">
                              <span className="font-medium">{nomeExibicao}</span>
                              {cliente.nome_fantasia &&
                                cliente.nome_fantasia !== cliente.nome_razao && (
                                  <span className="text-xs text-muted-foreground">
                                    {cliente.nome_razao}
                                  </span>
                                )}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-muted-foreground" />
                    Fornecedor <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={fornecedorId?.toString() || ''}
                    onValueChange={(value) => setFornecedorId(Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um fornecedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {fornecedores.map((fornecedor) => {
                        const nomeExibicao = fornecedor.nome_fantasia || fornecedor.nome_razao;
                        return (
                          <SelectItem
                            key={fornecedor.id}
                            value={fornecedor.id.toString()}
                            textValue={nomeExibicao}
                          >
                            <div className="flex flex-col items-start">
                              <span className="font-medium">{nomeExibicao}</span>
                              {fornecedor.nome_fantasia &&
                                fornecedor.nome_fantasia !== fornecedor.nome_razao && (
                                  <span className="text-xs text-muted-foreground">
                                    {fornecedor.nome_razao}
                                  </span>
                                )}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    Data do Pedido <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={dataPedido}
                    onChange={(e) => setDataPedido(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    Data Entrega Prevista
                  </Label>
                  <Input
                    type="date"
                    value={dataEntregaPrevista}
                    onChange={(e) => setDataEntregaPrevista(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Seção: Itens do Pedido */}
          <div className="bg-card border rounded-lg p-6 space-y-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Package className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Itens do Pedido</h3>
                  <p className="text-sm text-muted-foreground">
                    Produtos e quantidades
                  </p>
                </div>
              </div>
              <Button type="button" onClick={handleAddItem} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Item
              </Button>
            </div>

            <div className="space-y-4">
              {itens.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-12 gap-4 p-4 border rounded-lg bg-background"
                >
                  <div className="col-span-4 space-y-2">
                    <Label>Produto</Label>
                    <Select
                      value={item.produto_id.toString()}
                      onValueChange={(value) =>
                        handleItemChange(index, 'produto_id', Number(value))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um produto" />
                      </SelectTrigger>
                      <SelectContent>
                        {produtos.map((produto) => (
                          <SelectItem key={produto.id} value={produto.id.toString()}>
                            {produto.nome} - {produto.sku}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label>Quantidade</Label>
                    <Input
                      type="number"
                      step="0.001"
                      min="0.001"
                      value={item.quantidade === '' ? '' : item.quantidade}
                      placeholder="0"
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '') {
                          handleItemChange(index, 'quantidade', '');
                        } else {
                          const numValue = parseFloat(value);
                          handleItemChange(index, 'quantidade', isNaN(numValue) ? '' : numValue);
                        }
                      }}
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label>Preço Unitário</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.preco_unitario === '' ? '' : item.preco_unitario}
                      placeholder="0,00"
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '') {
                          handleItemChange(index, 'preco_unitario', '');
                        } else {
                          const numValue = parseFloat(value);
                          handleItemChange(index, 'preco_unitario', isNaN(numValue) ? '' : numValue);
                        }
                      }}
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label>Desconto</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.desconto === '' ? '' : item.desconto}
                      placeholder="0,00"
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '') {
                          handleItemChange(index, 'desconto', '');
                        } else {
                          const numValue = parseFloat(value);
                          handleItemChange(index, 'desconto', isNaN(numValue) ? '' : numValue);
                        }
                      }}
                    />
                  </div>

                  <div className="col-span-1 space-y-2">
                    <Label>Subtotal</Label>
                    <div className="h-10 flex items-center text-sm font-medium">
                      {(() => {
                        // Garantir conversão correta para número
                        const quantidade = typeof item.quantidade === 'number' ? item.quantidade : 
                                          item.quantidade === '' ? 0 : Number(item.quantidade) || 0;
                        const precoUnitario = typeof item.preco_unitario === 'number' ? item.preco_unitario : 
                                             item.preco_unitario === '' ? 0 : Number(item.preco_unitario) || 0;
                        const desconto = typeof item.desconto === 'number' ? item.desconto : 
                                        item.desconto === '' ? 0 : Number(item.desconto) || 0;
                        const subtotal = quantidade * precoUnitario - desconto;
                        return formatCurrency(subtotal);
                      })()}
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

          {/* Seção: Pagamento e Entrega */}
          <div className="bg-card border rounded-lg p-6 space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-green-500/10">
                <DollarSign className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Pagamento e Entrega</h3>
                <p className="text-sm text-muted-foreground">
                  Informações de pagamento e entrega
                </p>
              </div>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    Forma de Pagamento
                  </Label>
                  <Select
                    value={formaPagamento || ''}
                    onValueChange={(value) =>
                      setFormaPagamento(value as FormaPagamento)
                    }
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
                  <Label className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    Condição de Pagamento
                  </Label>
                  <Input
                    value={condicaoPagamento}
                    onChange={(e) => setCondicaoPagamento(e.target.value)}
                    placeholder="Ex: À vista, 30 dias, etc."
                    maxLength={100}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-muted-foreground" />
                    Transportadora
                  </Label>
                  <Select
                    value={transportadoraId?.toString() || ''}
                    onValueChange={(value) => setTransportadoraId(Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma transportadora" />
                    </SelectTrigger>
                    <SelectContent>
                      {transportadoras.map((transportadora) => (
                        <SelectItem
                          key={transportadora.id}
                          value={transportadora.id.toString()}
                        >
                          {transportadora.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    Prazo de Entrega (dias)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    value={prazoEntregaDias || ''}
                    onChange={(e) =>
                      setPrazoEntregaDias(
                        e.target.value ? Number(e.target.value) : undefined
                      )
                    }
                    placeholder="Ex: 7"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    Frete
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={frete === '' ? '' : frete}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      setFrete('');
                    } else {
                      const numValue = parseFloat(value);
                      setFrete(isNaN(numValue) ? '' : numValue);
                    }
                  }}
                    placeholder="0,00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  Outras Taxas
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={outrasTaxas === '' ? '' : outrasTaxas}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      setOutrasTaxas('');
                    } else {
                      const numValue = parseFloat(value);
                      setOutrasTaxas(isNaN(numValue) ? '' : numValue);
                    }
                  }}
                  placeholder="0,00"
                />
              </div>
            </div>
          </div>

          {/* Seção: Resumo Financeiro */}
          <div className="bg-card border rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <DollarSign className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Resumo Financeiro</h3>
                <p className="text-sm text-muted-foreground">
                  Valores calculados automaticamente
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Subtotal</Label>
                <div className="text-lg font-semibold">
                  {formatCurrency(calculos.subtotal)}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Desconto</Label>
                <div className="text-lg font-semibold text-red-500">
                  - {formatCurrency(calculos.descontoValor)}
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
                    {formatCurrency(calculos.valorTotal)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Seção: Observações */}
          <div className="bg-card border rounded-lg p-6 space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-gray-500/10">
                <Info className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Observações</h3>
                <p className="text-sm text-muted-foreground">
                  Informações adicionais sobre o pedido
                </p>
              </div>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  Observações Internas
                </Label>
                <Textarea
                  value={observacoesInternas}
                  onChange={(e) => setObservacoesInternas(e.target.value)}
                  placeholder="Observações visíveis apenas para a equipe interna"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  Observações do Cliente
                </Label>
                <Textarea
                  value={observacoesCliente}
                  onChange={(e) => setObservacoesCliente(e.target.value)}
                  placeholder="Observações visíveis para o cliente"
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

