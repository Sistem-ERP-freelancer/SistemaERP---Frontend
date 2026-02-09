import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectSeparator,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn, formatCurrency } from '@/lib/utils';
import { Cliente, clientesService } from '@/services/clientes.service';
import { Fornecedor } from '@/services/fornecedores.service';
import { Produto, produtosService } from '@/services/produtos.service';
import { CondicaoPagamento } from '@/shared/types/condicao-pagamento.types';
import {
    CreatePedidoDto,
    FormaPagamento,
    Pedido,
    TipoPedido,
} from '@/types/pedido';
import { useQuery } from '@tanstack/react-query';
import { Download, Info, Loader2, Package, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

/** Evita reset do form quando order vira undefined ao fechar após salvar (edição). */
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}

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
  const [quantidadeParcelas, setQuantidadeParcelas] = useState<number | ''>('');
  const [queroParcelarDinheiroPix, setQueroParcelarDinheiroPix] = useState(false);
  const [condicaoPagamento, setCondicaoPagamento] = useState<string>('');
  const [condicoesPagamento, setCondicoesPagamento] = useState<CondicaoPagamento[]>([]);
  const [condicaoPagamentoId, setCondicaoPagamentoId] = useState<number | string>('');
  const [dataVencimento, setDataVencimento] = useState<string>('');
  const [prazoEntregaDias, setPrazoEntregaDias] = useState<number | undefined>(undefined);
  const [frete, setFrete] = useState<number | ''>('');
  const [outrasTaxas, setOutrasTaxas] = useState<number | ''>('');
  const [observacoesInternas, setObservacoesInternas] = useState<string>('');
  const [observacoesCliente, setObservacoesCliente] = useState<string>('');
  const [itens, setItens] = useState<OrderItemForm[]>([
    { produto_id: 0, quantidade: '', preco_unitario: '', desconto: '' },
  ]);

  // Buscar dados do cliente para pedido (GET /clientes/:id/dados-pedido) conforme guia
  const { data: dadosClientePedido, refetch: refetchDadosPedido, isLoading: isLoadingDadosPedido } = useQuery({
    queryKey: ['clientes', clienteId, 'dados-pedido'],
    queryFn: () => clientesService.buscarDadosParaPedido(clienteId!),
    enabled: !!clienteId && tipo === 'VENDA' && isOpen,
  });

  const { data: limiteCredito } = useQuery({
    queryKey: ['clientes', clienteId, 'limite-credito'],
    queryFn: () => clientesService.buscarLimiteCredito(clienteId!),
    enabled: !!clienteId && tipo === 'VENDA' && isOpen,
  });

  // Produtos do fornecedor (pedido de COMPRA): exibir apenas produtos vinculados ao fornecedor selecionado
  const {
    data: produtosPorFornecedor = [],
    isLoading: isLoadingProdutosFornecedor,
  } = useQuery({
    queryKey: ['produtos', 'fornecedor', fornecedorId],
    queryFn: () => produtosService.buscarPorFornecedor(fornecedorId!),
    enabled: tipo === 'COMPRA' && !!fornecedorId && isOpen,
  });

  const produtosParaExibir =
    tipo === 'COMPRA' && fornecedorId
      ? produtosPorFornecedor
      : produtos;

  const produtoSelectDesabilitado = tipo === 'COMPRA' && !fornecedorId;
  const produtoSelectPlaceholder =
    tipo === 'COMPRA' && !fornecedorId
      ? 'Selecione o fornecedor primeiro'
      : 'Selecione um produto';

  // Ao trocar o fornecedor em pedido de COMPRA, limpar seleção de produto nos itens
  const prevFornecedorIdRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (tipo !== 'COMPRA') return;
    if (prevFornecedorIdRef.current !== undefined && prevFornecedorIdRef.current !== fornecedorId) {
      setItens((prev) => prev.map((item) => ({ ...item, produto_id: 0 })));
    }
    prevFornecedorIdRef.current = fornecedorId;
  }, [tipo, fornecedorId]);

  // Preencher condicoesPagamento e, em edição, selecionar condição que corresponda ao pedido
  useEffect(() => {
    if (!dadosClientePedido || tipo !== 'VENDA' || !clienteId) return;
    const { condicoes_pagamento } = dadosClientePedido;
    setCondicoesPagamento(condicoes_pagamento || []);
    if (order) {
      const match = (condicoes_pagamento || []).find(
        (c: CondicaoPagamento) => c.descricao === order.condicao_pagamento
      );
      if (match) setCondicaoPagamentoId(match.id?.toString() ?? match.descricao ?? '');
    }
  }, [dadosClientePedido, tipo, clienteId, order]);

  // Dialog para escolher condição quando há múltiplas e nenhuma padrão
  const [dialogEscolherCondicaoOpen, setDialogEscolherCondicaoOpen] = useState(false);
  const [condicoesParaEscolha, setCondicoesParaEscolha] = useState<CondicaoPagamento[]>([]);

  const aplicarCondicao = (cond: CondicaoPagamento) => {
    setCondicaoPagamentoId(cond.id?.toString() ?? cond.descricao ?? '');
    setFormaPagamento(cond.forma_pagamento as FormaPagamento);
    setCondicaoPagamento(cond.descricao || '');
    setPrazoEntregaDias(cond.prazo_dias ?? undefined);
    if (cond.parcelado && cond.forma_pagamento === 'CARTAO_CREDITO' && cond.numero_parcelas) {
      setQuantidadeParcelas(Math.min(12, Math.max(1, cond.numero_parcelas)));
    } else if (cond.forma_pagamento === 'DINHEIRO' || cond.forma_pagamento === 'PIX') {
      const numPar = cond.numero_parcelas ? Math.min(12, Math.max(1, cond.numero_parcelas)) : 0;
      setQueroParcelarDinheiroPix(numPar > 1);
      setQuantidadeParcelas(numPar > 1 ? numPar : '');
    } else if (cond.forma_pagamento !== 'CARTAO_CREDITO') {
      setQuantidadeParcelas('');
    }
  };

  const handleImportarDoCliente = async () => {
    if (!clienteId || tipo !== 'VENDA') return;
    const { data } = await refetchDadosPedido();
    const dados = data ?? dadosClientePedido;
    if (!dados) {
      toast.error('Erro ao carregar dados do cliente');
      return;
    }
    const { condicoes_pagamento, condicao_pagamento_padrao } = dados;
    setCondicoesPagamento(condicoes_pagamento || []);
    if (!condicoes_pagamento || condicoes_pagamento.length === 0) {
      toast.error('Este cliente não possui condições de pagamento cadastradas.');
      return;
    }
    const condicao = condicao_pagamento_padrao ?? (condicoes_pagamento.length === 1 ? condicoes_pagamento[0] : null);
    if (condicao) {
      aplicarCondicao(condicao);
      setDialogEscolherCondicaoOpen(false);
      toast.success('Condição de pagamento importada do cliente.');
    } else {
      setCondicoesParaEscolha(condicoes_pagamento);
      setDialogEscolherCondicaoOpen(true);
    }
  };

  // Limpar condições quando cliente for desmarcado
  useEffect(() => {
    if (!clienteId && tipo === 'VENDA') {
      setCondicoesPagamento([]);
      setCondicaoPagamentoId('');
    }
  }, [clienteId, tipo]);

  const prevIsOpen = usePrevious(isOpen);
  // Só preencher o form a partir do `order` quando abrimos o dialog para este pedido (ou trocamos de pedido).
  // Evita que, após erro ao salvar, um refetch do mesmo pedido sobrescreva as alterações (ex.: "Quero parcelar" desmarcando).
  const lastSyncedOrderIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) {
      lastSyncedOrderIdRef.current = null;
      return;
    }
    if (order && isOpen) {
      const orderId = order.id;
      const isNewOrderSession = lastSyncedOrderIdRef.current !== orderId;
      if (isNewOrderSession) {
        lastSyncedOrderIdRef.current = orderId;
        setTipo(order.tipo);
        setClienteId(order.cliente_id);
        setFornecedorId(order.fornecedor_id);
        setTransportadoraId(order.transportadora_id);

        const dataPedidoOnly = order.data_pedido.split('T')[0].split(' ')[0];
        const dataEntregaOnly = order.data_entrega_prevista?.split('T')[0].split(' ')[0] || '';
        const dataVencimentoOnly = order.data_vencimento_base?.split('T')[0].split(' ')[0] || '';

        setDataPedido(dataPedidoOnly);
        setDataEntregaPrevista(dataEntregaOnly);
        setFormaPagamento(order.forma_pagamento);
        // Guia: derivar de condicao_pagamento quando quantidade_parcelas não vier no GET (nunca abrir sempre "à vista")
        const condicao = (order.condicao_pagamento || '').trim();
        const qtdParBackend = order.quantidade_parcelas ?? null;
        let qtdPar: number | '' = qtdParBackend ?? '';
        if (qtdPar === '' && condicao && !/vista/i.test(condicao)) {
          const match = condicao.match(/^(\d{1,2})x$/i);
          if (match) qtdPar = Math.min(12, Math.max(1, parseInt(match[1], 10) || 1));
        }
        setQuantidadeParcelas(qtdPar);
        const forma = order.forma_pagamento;
        const formasComCheckbox = ['DINHEIRO', 'PIX', 'BOLETO', 'CARTAO_DEBITO', 'CARTAO_CREDITO', 'TRANSFERENCIA', 'CHEQUE'];
        const parcelado = typeof qtdPar === 'number' && qtdPar >= 2 && qtdPar <= 12;
        setQueroParcelarDinheiroPix(!!forma && formasComCheckbox.includes(forma) && parcelado);
        setCondicaoPagamento(order.condicao_pagamento || '');
        setDataVencimento(dataVencimentoOnly);
        setPrazoEntregaDias(order.prazo_entrega_dias);
        setFrete(order.frete || '');
        setOutrasTaxas(order.outras_taxas || '');
        setObservacoesInternas(order.observacoes_internas || '');
        setObservacoesCliente(order.observacoes_cliente || '');

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
      }
    } else if (!order && prevIsOpen === false) {
      lastSyncedOrderIdRef.current = null;
      setTipo('VENDA');
      setClienteId(undefined);
      setFornecedorId(undefined);
      setCondicoesPagamento([]);
      setCondicaoPagamentoId('');
      setTransportadoraId(undefined);
      setDataPedido(new Date().toISOString().split('T')[0]);
      setDataEntregaPrevista('');
      setFormaPagamento(undefined);
      setQuantidadeParcelas('');
      setQueroParcelarDinheiroPix(false);
      setCondicaoPagamento('');
      setDataVencimento('');
      setPrazoEntregaDias(undefined);
      setFrete('');
      setOutrasTaxas('');
      setObservacoesInternas('');
      setObservacoesCliente('');
      setItens([{ produto_id: 0, quantidade: '', preco_unitario: '', desconto: '' }]);
    }
  }, [order, isOpen, prevIsOpen]);

  const handleAddItem = () => {
    setItens([...itens, { produto_id: 0, quantidade: '', preco_unitario: '', desconto: '' }]);
  };

  const handleRemoveItem = (index: number) => {
    if (itens.length > 1) {
      setItens(itens.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = async (index: number, field: keyof OrderItemForm, value: any) => {
    const newItens = [...itens];
    newItens[index] = { ...newItens[index], [field]: value };

    // Ao selecionar produto, chamar GET /produtos/:id e preencher preço (conforme guia)
    if (field === 'produto_id' && value && value !== 0) {
      try {
        const produto = await produtosService.buscarPorId(Number(value));
        const preco =
          produto.preco_promocional && produto.preco_promocional > 0
            ? produto.preco_promocional
            : produto.preco_venda ?? 0;
        newItens[index] = {
          ...newItens[index],
          preco_unitario: preco,
          quantidade: newItens[index].quantidade || 1,
        };
      } catch {
        // Em caso de erro, manter seleção; usuário pode digitar preço manualmente
      }
    }

    setItens([...newItens]);
  };

  const valorTotalPedido =
    itens.reduce((acc, item) => {
      const quantidade = typeof item.quantidade === 'number' ? item.quantidade : 0;
      const precoUnitario = typeof item.preco_unitario === 'number' ? item.preco_unitario : 0;
      const desconto = typeof item.desconto === 'number' ? item.desconto : 0;
      return acc + quantidade * precoUnitario - desconto;
    }, 0) +
    (typeof frete === 'number' ? frete : 0) +
    (typeof outrasTaxas === 'number' ? outrasTaxas : 0);

  const qtdParcelasNum = quantidadeParcelas === '' ? 1 : quantidadeParcelas;
  const valorPorParcela =
    formaPagamento && qtdParcelasNum >= 1
      ? valorTotalPedido / qtdParcelasNum
      : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parcelado = queroParcelarDinheiroPix && qtdParcelasNum >= 2;
    if (parcelado && !dataVencimento?.trim()) {
      toast.error('Informe a Data de Vencimento para parcelar o pedido.');
      return;
    }

    const itensFormatados = itens
      .filter(item => item.produto_id && item.produto_id !== 0)
      .map(item => ({
        produto_id: Number(item.produto_id),
        quantidade: Number(item.quantidade) || 0,
        preco_unitario: Number(item.preco_unitario) || 0,
        ...(item.desconto ? { desconto: Number(item.desconto) } : {}),
      }));
    
    // Guia: backend usa quantidade_parcelas no PATCH para definir condição (2–12 = parcelado, 1 = à vista).
    // Sempre enviar quantidade_parcelas quando há forma_pagamento para criar/editar corretamente.
    const quantidadeParcelasPayload: number =
      formaPagamento && queroParcelarDinheiroPix && qtdParcelasNum >= 2 && qtdParcelasNum <= 12
        ? qtdParcelasNum
        : 1;

    const pedidoData: CreatePedidoDto = {
      tipo,
      data_pedido: dataPedido,
      cliente_id: tipo === 'VENDA' ? clienteId : undefined,
      fornecedor_id: tipo === 'COMPRA' ? fornecedorId : undefined,
      transportadora_id: transportadoraId,
      data_entrega_prevista: dataEntregaPrevista || undefined,
      forma_pagamento: formaPagamento,
      data_vencimento: dataVencimento || undefined,
      data_vencimento_base: dataVencimento || undefined,
      condicao_pagamento:
        formaPagamento && qtdParcelasNum >= 2
          ? (condicaoPagamento || `${qtdParcelasNum}x`)
          : (condicaoPagamento || 'À vista'),
      quantidade_parcelas: formaPagamento ? quantidadeParcelasPayload : undefined,
      prazo_entrega_dias: prazoEntregaDias,
      frete: typeof frete === 'number' ? frete : (frete ? Number(frete) : undefined),
      outras_taxas: typeof outrasTaxas === 'number' ? outrasTaxas : (outrasTaxas ? Number(outrasTaxas) : undefined),
      observacoes_internas: observacoesInternas || undefined,
      observacoes_cliente: observacoesCliente || undefined,
      itens: itensFormatados,
    };

    if (import.meta.env.DEV && order) {
      console.log('📤 [OrderForm] PATCH payload (edição)', {
        quantidade_parcelas: pedidoData.quantidade_parcelas,
        condicao_pagamento: pedidoData.condicao_pagamento,
        forma_pagamento: pedidoData.forma_pagamento,
        queroParcelarDinheiroPix,
        qtdParcelasNum,
      });
    }

    onSubmit(pedidoData);
  };

  return (
    <>
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
                  {clienteId && (limiteCredito || dadosClientePedido?.cliente?.limite_credito != null) && (
                    <Alert className="mt-3">
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        {limiteCredito ? (
                          <>
                            Limite de crédito: {formatCurrency(limiteCredito.limiteCredito)}.
                            Valor já utilizado: {formatCurrency(limiteCredito.valorUtilizado)}.
                            Disponível: {formatCurrency(limiteCredito.valorDisponivel)}
                            {limiteCredito.ultrapassouLimite && (
                              <span className="block mt-1 font-medium text-destructive">
                                Limite excedido.
                              </span>
                            )}
                          </>
                        ) : (
                          <>Limite de crédito do cliente: {formatCurrency(dadosClientePedido!.cliente.limite_credito ?? 0)}</>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}
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
                      disabled={produtoSelectDesabilitado}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            isLoadingProdutosFornecedor && tipo === 'COMPRA' && fornecedorId
                              ? 'Carregando...'
                              : produtoSelectPlaceholder
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {tipo === 'COMPRA' && fornecedorId && !isLoadingProdutosFornecedor && produtosParaExibir.length === 0 ? (
                          <div className="py-4 px-2 text-sm text-muted-foreground text-center">
                            Nenhum produto vinculado a este fornecedor
                          </div>
                        ) : (
                          produtosParaExibir.map((produto) => (
                            <SelectItem key={produto.id} value={produto.id.toString()}>
                              {produto.nome}
                            </SelectItem>
                          ))
                        )}
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
                    onValueChange={(value) => {
                      if (value === '__IMPORTAR_CLIENTE__') {
                        handleImportarDoCliente();
                        return;
                      }
                      const forma = value as FormaPagamento;
                      setFormaPagamento(forma);
                      setCondicaoPagamentoId('');
                      setCondicaoPagamento('');
                      setPrazoEntregaDias(undefined);
                      const formasComCheckboxParcelar: FormaPagamento[] = [
                        'DINHEIRO', 'PIX', 'BOLETO', 'CARTAO_DEBITO', 'CARTAO_CREDITO', 'TRANSFERENCIA', 'CHEQUE',
                      ];
                      if (formasComCheckboxParcelar.includes(forma)) {
                        if (forma === 'CARTAO_CREDITO') {
                          setQueroParcelarDinheiroPix(true);
                          setQuantidadeParcelas(3);
                        } else {
                          setQueroParcelarDinheiroPix(false);
                          setQuantidadeParcelas('');
                        }
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a forma de pagamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem
                          value="__IMPORTAR_CLIENTE__"
                          disabled={!clienteId || tipo !== 'VENDA'}
                          className="text-primary font-medium"
                        >
                          <Download className="w-4 h-4 mr-2 inline" />
                          Importar do cliente
                        </SelectItem>
                      </SelectGroup>
                      <SelectSeparator />
                      <SelectItem value="DINHEIRO">Dinheiro</SelectItem>
                      <SelectItem value="PIX">PIX</SelectItem>
                      <SelectItem value="CARTAO_CREDITO">Cartão de Crédito</SelectItem>
                      <SelectItem value="CARTAO_DEBITO">Cartão de Débito</SelectItem>
                      <SelectItem value="BOLETO">Boleto</SelectItem>
                      <SelectItem value="TRANSFERENCIA">Transferência</SelectItem>
                      <SelectItem value="CHEQUE">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>
                    Data de Vencimento
                    {queroParcelarDinheiroPix && qtdParcelasNum >= 2 && (
                      <span className="text-destructive text-xs font-normal ml-1">(obrigatório ao parcelar)</span>
                    )}
                  </Label>
                  <Input
                    type="date"
                    value={dataVencimento}
                    onChange={(e) => setDataVencimento(e.target.value)}
                  />
                </div>
              </div>

              {formaPagamento && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    {/* Guia: Opção A – "Quero parcelar" + N parcelas (1 a 12). Backend prioriza quantidade_parcelas. */}
                    {['DINHEIRO', 'PIX', 'BOLETO', 'CARTAO_DEBITO', 'CARTAO_CREDITO', 'TRANSFERENCIA', 'CHEQUE'].includes(formaPagamento) && (
                      <>
                        <div className="space-y-1">
                          <Label className="text-muted-foreground">Condição de pagamento</Label>
                          <div className="text-sm font-medium">
                            {queroParcelarDinheiroPix && qtdParcelasNum >= 2 && qtdParcelasNum <= 12
                              ? `${qtdParcelasNum}x`
                              : 'À vista'}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="quero-parcelar"
                            checked={queroParcelarDinheiroPix}
                            onCheckedChange={(checked) => {
                              setQueroParcelarDinheiroPix(!!checked);
                              if (!checked) {
                                setQuantidadeParcelas('');
                              } else {
                                setQuantidadeParcelas(formaPagamento === 'CARTAO_CREDITO' ? 3 : 2);
                              }
                            }}
                          />
                          <Label
                            htmlFor="quero-parcelar"
                            className="text-sm font-normal cursor-pointer"
                          >
                            Quero parcelar
                          </Label>
                        </div>
                        {queroParcelarDinheiroPix && (
                          <div className="flex items-center gap-2 mt-2">
                            <Input
                              type="number"
                              min={1}
                              max={12}
                              placeholder="1"
                              value={quantidadeParcelas === '' ? '' : quantidadeParcelas}
                              onChange={(e) => {
                                const raw = e.target.value;
                                if (raw === '') {
                                  setQuantidadeParcelas('');
                                  return;
                                }
                                const v = Math.min(12, Math.max(1, parseInt(raw, 10) || 1));
                                setQuantidadeParcelas(v);
                                if (v > 1 && !condicaoPagamento) {
                                  setCondicaoPagamento(`${v}x`);
                                }
                              }}
                            />
                            <span className="text-sm text-muted-foreground">parcelas (1 a 12)</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Valor por parcela</Label>
                    <div className="h-10 flex items-center text-lg font-semibold">
                      {qtdParcelasNum > 1
                        ? `${qtdParcelasNum}x de ${formatCurrency(valorPorParcela)}`
                        : formatCurrency(valorTotalPedido) + ' (à vista)'}
                    </div>
                  </div>
                </div>
              )}

              {(() => {
                const deveExibirCondicaoETransportadora =
                  tipo === 'COMPRA' || !!formaPagamento;

                if (!deveExibirCondicaoETransportadora) return null;

                return (
              <>
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
              </>
                );
              })()}
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

    <Dialog open={dialogEscolherCondicaoOpen} onOpenChange={setDialogEscolherCondicaoOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Escolher condição de pagamento</DialogTitle>
          <DialogDescription>
            Este cliente possui mais de uma condição cadastrada. Selecione a que deseja usar no pedido.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 pt-2">
          {condicoesParaEscolha.map((cond) => (
            <Button
              key={cond.id ?? cond.descricao}
              type="button"
              variant="outline"
              className="w-full justify-start text-left h-auto py-3"
              onClick={() => {
                aplicarCondicao(cond);
                setDialogEscolherCondicaoOpen(false);
                toast.success('Condição de pagamento importada do cliente.');
              }}
            >
              <span className="font-medium">{cond.descricao}</span>
              {cond.forma_pagamento && (
                <span className="text-muted-foreground ml-2">({cond.forma_pagamento})</span>
              )}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  </>
  );
}

export default OrderForm;
