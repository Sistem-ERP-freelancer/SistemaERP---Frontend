import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { Loader2, ShoppingCart, Package, Calendar, DollarSign, Truck, FileText, Plus, Trash2, Info, CreditCard, AlertCircle } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { Cliente, clientesService, LimiteCredito } from '@/services/clientes.service';
import { Fornecedor } from '@/services/fornecedores.service';
import { Produto } from '@/services/produtos.service';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CondicaoPagamento, DadosClienteParaPedido } from '@/shared/types/condicao-pagamento.types';

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
  // Log quando produtos são recebidos
  useEffect(() => {
    if (import.meta.env.DEV && produtos.length > 0) {
      console.log('[OrderForm] Produtos recebidos no componente:', {
        total: produtos.length,
        produtos: produtos.map(p => ({ id: p.id, nome: p.nome, preco_venda: p.preco_venda, statusProduto: p.statusProduto }))
      });
    }
  }, [produtos]);

  const [tipo, setTipo] = useState<TipoPedido>('VENDA');
  const [clienteId, setClienteId] = useState<number | undefined>(undefined);
  const [limiteCreditoCliente, setLimiteCreditoCliente] = useState<number | undefined>(undefined);
  const [limiteCreditoInfo, setLimiteCreditoInfo] = useState<LimiteCredito | null>(null);
  const [fornecedorId, setFornecedorId] = useState<number | undefined>(undefined);
  const [transportadoraId, setTransportadoraId] = useState<number | undefined>(undefined);
  const [dataPedido, setDataPedido] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [dataEntregaPrevista, setDataEntregaPrevista] = useState<string>('');
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento | undefined>(undefined);
  const [condicaoPagamento, setCondicaoPagamento] = useState<string>('');
  const [dataVencimento, setDataVencimento] = useState<string>('');
  const [numeroParcelas, setNumeroParcelas] = useState<number>(1);
  const [valorParcela, setValorParcela] = useState<number | ''>('');
  const [prazoEntregaDias, setPrazoEntregaDias] = useState<number | undefined>(undefined);
  const [frete, setFrete] = useState<number | ''>('');
  const [outrasTaxas, setOutrasTaxas] = useState<number | ''>('');
  const [observacoesInternas, setObservacoesInternas] = useState<string>('');
  const [observacoesCliente, setObservacoesCliente] = useState<string>('');
  const [itens, setItens] = useState<OrderItemForm[]>([
    { produto_id: 0, quantidade: '', preco_unitario: '', desconto: '' },
  ]);
  const [condicoesPagamentoDisponiveis, setCondicoesPagamentoDisponiveis] = useState<CondicaoPagamento[]>([]);
  const [condicaoPagamentoSelecionada, setCondicaoPagamentoSelecionada] = useState<CondicaoPagamento | null>(null);
  const [carregandoCondicoes, setCarregandoCondicoes] = useState(false);

  useEffect(() => {
    if (order) {
      setTipo(order.tipo);
      setClienteId(order.cliente_id);
      // Buscar limite de crédito quando carregar pedido existente
      if (order.cliente_id) {
        const cliente = clientes.find(c => c.id === order.cliente_id);
        setLimiteCreditoCliente(cliente?.limite_credito);
      }
      setFornecedorId(order.fornecedor_id);
      setTransportadoraId(order.transportadora_id);
      // Extrair apenas a data (YYYY-MM-DD) para evitar problemas de timezone
      const dataPedidoOnly = order.data_pedido.split('T')[0].split(' ')[0];
      const dataEntregaOnly = order.data_entrega_prevista?.split('T')[0].split(' ')[0] || '';
      setDataPedido(dataPedidoOnly);
      setDataEntregaPrevista(dataEntregaOnly);
      setFormaPagamento(order.forma_pagamento);
      setCondicaoPagamento(order.condicao_pagamento || '');
      // Se o pedido tiver uma data de vencimento associada, usar ela
      // Caso contrário, calcular 30 dias a partir da data do pedido
      const dataVencimentoCalculada = order.data_pedido 
        ? new Date(new Date(order.data_pedido).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : '';
      setDataVencimento(dataVencimentoCalculada);
      setNumeroParcelas(1);
      setValorParcela('');
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
      setDataVencimento('');
      setNumeroParcelas(1);
      setValorParcela('');
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
    
    // Se mudou o produto, atualizar preço unitário e quantidade automaticamente ANTES de atualizar o campo
    if (field === 'produto_id' && value && value !== 0) {
      const produtoId = typeof value === 'string' ? Number(value) : value;
      
      // Tentar encontrar o produto com diferentes comparações (pode haver problema de tipo)
      const produto = produtos.find((p) => {
        const pId = typeof p.id === 'string' ? Number(p.id) : p.id;
        const vId = typeof produtoId === 'string' ? Number(produtoId) : produtoId;
        return pId === vId || String(pId) === String(vId) || Number(pId) === Number(vId);
      });
      
      if (import.meta.env.DEV) {
        console.log('[OrderForm] Produto selecionado:', {
          produtoId,
          produto,
          preco_venda: produto?.preco_venda,
          produtosDisponiveis: produtos.length,
          idsDisponiveis: produtos.map(p => ({ id: p.id, nome: p.nome, preco_venda: p.preco_venda })),
          produtoEncontrado: !!produto,
          tipoProdutoId: typeof produtoId,
          tipoIdsDisponiveis: produtos.map(p => typeof p.id)
        });
      }
      
      if (produto) {
        // Preencher preço unitário com o preço de venda do produto
        // Verificar diferentes possíveis nomes de campos do backend
        const precoVenda = produto.preco_venda || (produto as any).precoVenda || (produto as any).precoVenda || 0;
        
        if (import.meta.env.DEV) {
          console.log('[OrderForm] Dados do produto:', {
            produtoCompleto: produto,
            preco_venda: produto.preco_venda,
            precoVenda: (produto as any).precoVenda,
            todosCampos: Object.keys(produto),
            valorPrecoVenda: precoVenda
          });
        }
        
        if (precoVenda && precoVenda > 0) {
          currentItem.preco_unitario = Number(precoVenda);
        } else {
          // Se não tem preço, deixar vazio mas mostrar aviso
          currentItem.preco_unitario = '';
          if (import.meta.env.DEV) {
            console.warn('[OrderForm] Produto sem preço de venda:', produto);
          }
        }
        
        // Preencher quantidade com 1 se estiver vazia ou zero
        if (currentItem.quantidade === '' || currentItem.quantidade === 0 || !currentItem.quantidade) {
          currentItem.quantidade = 1;
        }
        
        // Atualizar nome do produto
        currentItem.produto_nome = produto.nome;
        
        // Atualizar o produto_id
        currentItem.produto_id = produtoId;
      } else {
        // Se não encontrou o produto, limpar os campos e mostrar aviso
        if (import.meta.env.DEV) {
          console.error('[OrderForm] Produto não encontrado:', {
            produtoId,
            produtosDisponiveis: produtos.map(p => ({ id: p.id, nome: p.nome })),
            problema: 'O produto selecionado não está disponível na lista carregada. Verifique se o backend está retornando todos os produtos ativos.'
          });
        }
        
        // Mostrar toast informativo para o usuário
        toast.warning(`Produto não encontrado. Verifique se o produto está ativo e disponível.`, {
          description: `ID do produto: ${produtoId}. Total de produtos carregados: ${produtos.length}`
        });
        
        currentItem.preco_unitario = '';
        currentItem.produto_id = value;
      }
    } else {
      // Atualizar o campo específico normalmente
      currentItem[field] = value;
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

  // Buscar condições de pagamento quando cliente é selecionado
  useEffect(() => {
    const buscarCondicoesPagamento = async () => {
      if (tipo === 'VENDA' && clienteId) {
        setCarregandoCondicoes(true);
        try {
          const dados = await clientesService.buscarDadosParaPedido(clienteId);
          
          // Atualizar limite de crédito (será atualizado pela query de limite de crédito)
          if (dados.cliente?.limite_credito !== undefined) {
            setLimiteCreditoCliente(dados.cliente.limite_credito);
          } else {
            setLimiteCreditoCliente(undefined);
          }
          
          // Atualizar condições de pagamento disponíveis
          if (dados.condicoes_pagamento && Array.isArray(dados.condicoes_pagamento)) {
            setCondicoesPagamentoDisponiveis(dados.condicoes_pagamento);
            
            // Preencher automaticamente com a condição padrão
            if (dados.condicao_pagamento_padrao) {
              const condicaoPadrao = dados.condicao_pagamento_padrao;
              setCondicaoPagamentoSelecionada(condicaoPadrao);
              
              // Preencher forma de pagamento
              setFormaPagamento(condicaoPadrao.forma_pagamento as FormaPagamento);
              
              // Preencher condição de pagamento (texto)
              if (condicaoPadrao.parcelado) {
                setCondicaoPagamento(`${condicaoPadrao.numero_parcelas}x ${condicaoPadrao.descricao}`);
              } else {
                setCondicaoPagamento(`${condicaoPadrao.prazo_dias} dias - ${condicaoPadrao.descricao}`);
              }
              
              // Calcular data de vencimento
              if (condicaoPadrao.parcelado && condicaoPadrao.parcelas && condicaoPadrao.parcelas.length > 0) {
                // Usar a primeira parcela para calcular a data de vencimento
                const dataBase = new Date(dataPedido || new Date());
                const primeiraParcela = condicaoPadrao.parcelas[0];
                const dataVencimento = new Date(dataBase);
                dataVencimento.setDate(dataVencimento.getDate() + primeiraParcela.dias_vencimento);
                setDataVencimento(dataVencimento.toISOString().split('T')[0]);
              } else if (condicaoPadrao.prazo_dias) {
                const dataBase = new Date(dataPedido || new Date());
                const dataVencimento = new Date(dataBase);
                dataVencimento.setDate(dataVencimento.getDate() + condicaoPadrao.prazo_dias);
                setDataVencimento(dataVencimento.toISOString().split('T')[0]);
              }
            }
          } else {
            setCondicoesPagamentoDisponiveis([]);
            setCondicaoPagamentoSelecionada(null);
          }
        } catch (error) {
          console.error('Erro ao buscar condições de pagamento:', error);
          toast.error('Erro ao buscar condições de pagamento do cliente');
          setCondicoesPagamentoDisponiveis([]);
          setCondicaoPagamentoSelecionada(null);
        } finally {
          setCarregandoCondicoes(false);
        }
      } else {
        // Limpar condições quando não há cliente selecionado ou não é venda
        setCondicoesPagamentoDisponiveis([]);
        setCondicaoPagamentoSelecionada(null);
        setLimiteCreditoCliente(undefined);
        setLimiteCreditoInfo(null);
      }
    };

    buscarCondicoesPagamento();
  }, [clienteId, tipo, dataPedido]);

  // Buscar limite de crédito do cliente usando endpoint dedicado
  const { data: limiteCreditoData, isLoading: isLoadingCreditoUtilizado } = useQuery({
    queryKey: ['limite-credito-cliente', clienteId],
    queryFn: async () => {
      if (!clienteId || tipo !== 'VENDA') {
        setLimiteCreditoInfo(null);
        return null;
      }
      try {
        const limite = await clientesService.buscarLimiteCredito(clienteId);
        setLimiteCreditoInfo(limite);
        return limite;
      } catch (error: any) {
        console.error('Erro ao buscar limite de crédito:', error);
        // Se o erro for 404, o cliente não tem limite configurado
        if (error?.response?.status === 404) {
          setLimiteCreditoInfo(null);
          return null;
        }
        setLimiteCreditoInfo(null);
        return null;
      }
    },
    enabled: !!clienteId && tipo === 'VENDA',
    staleTime: 30000, // Cache por 30 segundos
  });

  // Recalcular valor da parcela automaticamente quando subtotal ou número de parcelas mudar
  useEffect(() => {
    if (formaPagamento === 'CARTAO_CREDITO' && calculos && calculos.subtotal > 0 && numeroParcelas > 0) {
      const valorCalculado = calculos.subtotal / numeroParcelas;
      setValorParcela(Number(valorCalculado.toFixed(2)));
    }
  }, [calculos, formaPagamento, numeroParcelas]);

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

    // Validar limite de crédito do cliente (apenas para pedidos de venda)
    if (tipo === 'VENDA' && clienteId && limiteCreditoInfo) {
      const valorTotalPedido = calculos.valorTotal;
      const valorTotalComPedido = limiteCreditoInfo.valorUtilizado + valorTotalPedido;
      
      if (valorTotalComPedido > limiteCreditoInfo.limiteCredito) {
        toast.error(
          `Limite excedido! Utilizado: ${formatCurrency(limiteCreditoInfo.valorUtilizado)} | Disponível: ${formatCurrency(limiteCreditoInfo.valorDisponivel)} | Pedido: ${formatCurrency(valorTotalPedido)}`,
          {
            duration: 4000,
          }
        );
        return;
      }
    }

    // Validar que todos os itens têm valores válidos
    const itensValidos = itens.filter((item) => {
      // Verificar se o produto foi selecionado
      if (!item.produto_id || item.produto_id === 0) {
        if (import.meta.env.DEV) {
          console.warn('[OrderForm] Item removido - produto_id inválido:', item);
        }
        return false;
      }
      
      // Converter quantidade para número
      const quantidade = typeof item.quantidade === 'number' 
        ? item.quantidade 
        : (item.quantidade === '' ? 0 : Number(item.quantidade) || 0);
      
      // Converter preço unitário para número
      const precoUnitario = typeof item.preco_unitario === 'number' 
        ? item.preco_unitario 
        : (item.preco_unitario === '' ? 0 : Number(item.preco_unitario) || 0);
      
      // Validar valores
      const isValid = quantidade > 0 && precoUnitario > 0;
      
      if (!isValid && import.meta.env.DEV) {
        console.warn('[OrderForm] Item removido - valores inválidos:', {
          item,
          quantidade,
          precoUnitario,
          produto_id: item.produto_id,
        });
      }
      
      return isValid;
    });

    if (itensValidos.length === 0) {
      // Verificar se há itens mas nenhum está preenchido corretamente
      const temItensNaoPreenchidos = itens.some((item) => !item.produto_id || item.produto_id === 0);
      if (temItensNaoPreenchidos) {
        toast.error('Por favor, selecione um produto e preencha a quantidade e o preço unitário.');
      } else {
        toast.error('Por favor, preencha corretamente os produtos (quantidade e preço devem ser maiores que zero).');
      }
      
      if (import.meta.env.DEV) {
        console.error('[OrderForm] Nenhum item válido encontrado:', {
          totalItens: itens.length,
          itens,
          itensValidos,
        });
      }
      return;
    }

    // Formatar itens garantindo que todos os campos sejam números válidos
    const itensFormatados = itensValidos.map((item) => {
      const quantidade = typeof item.quantidade === 'number' 
        ? item.quantidade 
        : (item.quantidade === '' ? 0 : Number(item.quantidade) || 0);
      
      const precoUnitario = typeof item.preco_unitario === 'number' 
        ? item.preco_unitario 
        : (item.preco_unitario === '' ? 0 : Number(item.preco_unitario) || 0);
      
      const desconto = typeof item.desconto === 'number' 
        ? item.desconto 
        : (item.desconto === '' ? undefined : Number(item.desconto) || undefined);
      
      return {
        produto_id: Number(item.produto_id),
        quantidade: quantidade,
        preco_unitario: precoUnitario,
        ...(desconto !== undefined && desconto > 0 ? { desconto } : {}),
      };
    });

    // Garantir que os itens não estejam vazios
    if (itensFormatados.length === 0) {
      toast.error('Erro: Nenhum item válido foi encontrado. Por favor, adicione pelo menos um produto ao pedido.');
      if (import.meta.env.DEV) {
        console.error('[OrderForm] Erro crítico: itensFormatados está vazio após formatação:', {
          itensValidos,
          itens,
        });
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
      data_vencimento: dataVencimento || undefined,
      prazo_entrega_dias: prazoEntregaDias,
      subtotal: calculos.subtotal,
      desconto_valor: calculos.descontoValor || undefined,
      desconto_percentual: calculos.descontoPercentual || undefined,
      frete: typeof frete === 'number' ? frete : undefined,
      outras_taxas: typeof outrasTaxas === 'number' ? outrasTaxas : undefined,
      observacoes_internas: observacoesInternas || undefined,
      observacoes_cliente: observacoesCliente || undefined,
      itens: itensFormatados, // Garantir que os itens sempre sejam incluídos
    };

    // Verificação final antes de enviar
    if (!pedidoData.itens || pedidoData.itens.length === 0) {
      toast.error('Erro crítico: Os itens do pedido não foram incluídos. Por favor, tente novamente.');
      if (import.meta.env.DEV) {
        console.error('[OrderForm] Erro crítico: pedidoData.itens está vazio ou undefined:', {
          pedidoData,
          itensFormatados,
          itensValidos,
        });
      }
      return;
    }

    console.log('📦 [OrderForm] Submetendo pedido:', {
      tipo,
      totalItens: itensFormatados.length,
      itens: itensFormatados,
      itensValidos: itensValidos,
      todosItens: itens,
      pedidoData,
      pedidoDataItens: pedidoData.itens,
      pedidoDataString: JSON.stringify(pedidoData),
    });
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
                        setLimiteCreditoCliente(undefined);
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
                    onValueChange={(value) => {
                      const selectedClienteId = Number(value);
                      setClienteId(selectedClienteId);
                      // Buscar o limite de crédito do cliente selecionado
                      const clienteSelecionado = clientes.find(c => c.id === selectedClienteId);
                      setLimiteCreditoCliente(clienteSelecionado?.limite_credito);
                    }}
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
                  
                  {/* Alerta de Limite de Crédito */}
                  {limiteCreditoInfo && limiteCreditoInfo.limiteCredito > 0 && (() => {
                    const valorTotalComPedido = limiteCreditoInfo.valorUtilizado + calculos.valorTotal;
                    const novoCreditoDisponivel = Math.max(0, limiteCreditoInfo.valorDisponivel - calculos.valorTotal);
                    const percentualComPedido = limiteCreditoInfo.limiteCredito > 0 ? (valorTotalComPedido / limiteCreditoInfo.limiteCredito) * 100 : 0;
                    const ultrapassaraLimite = valorTotalComPedido > limiteCreditoInfo.limiteCredito;
                    
                    return (
                      <Alert 
                        variant={ultrapassaraLimite ? "destructive" : "default"}
                        className={cn(
                          ultrapassaraLimite && "border-destructive",
                          percentualComPedido > 90 && !ultrapassaraLimite && "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20"
                        )}
                      >
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle className="text-sm font-semibold">
                          Limite de Crédito
                        </AlertTitle>
                        <AlertDescription className="text-xs mt-1">
                          {isLoadingCreditoUtilizado ? (
                            <span className="flex items-center gap-2">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Carregando limite de crédito...
                            </span>
                          ) : ultrapassaraLimite ? (
                            <span className="text-destructive font-medium">
                              Limite excedido! Utilizado: {formatCurrency(limiteCreditoInfo.valorUtilizado)} | Disponível: {formatCurrency(limiteCreditoInfo.valorDisponivel)} | Pedido: {formatCurrency(calculos.valorTotal)}
                            </span>
                          ) : percentualComPedido > 90 ? (
                            <span className="text-yellow-700 dark:text-yellow-400">
                              Atenção! Disponível após pedido: {formatCurrency(novoCreditoDisponivel)} de {formatCurrency(limiteCreditoInfo.limiteCredito)} | Utilizado: {formatCurrency(limiteCreditoInfo.valorUtilizado)}
                            </span>
                          ) : (
                            <span>
                              Disponível após pedido: {formatCurrency(novoCreditoDisponivel)} de {formatCurrency(limiteCreditoInfo.limiteCredito)} | Utilizado: {formatCurrency(limiteCreditoInfo.valorUtilizado)}
                            </span>
                          )}
                        </AlertDescription>
                      </Alert>
                    );
                  })()}
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
                      value={item.produto_id && item.produto_id !== 0 ? item.produto_id.toString() : undefined}
                      onValueChange={(value) => {
                        if (value) {
                          const produtoId = Number(value);
                          
                          if (import.meta.env.DEV) {
                            console.log('[OrderForm] Selecionando produto:', {
                              value,
                              produtoId,
                              produtosDisponiveis: produtos.length,
                              idsDisponiveis: produtos.map(p => p.id),
                              produtoExiste: produtos.some(p => p.id === produtoId)
                            });
                          }
                          
                          handleItemChange(index, 'produto_id', produtoId);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um produto" />
                      </SelectTrigger>
                      <SelectContent>
                        {produtos.length === 0 ? (
                          <SelectItem value="" disabled>
                            Nenhum produto disponível
                          </SelectItem>
                        ) : (
                          produtos.map((produto) => (
                            <SelectItem key={produto.id} value={produto.id.toString()}>
                              {produto.nome} - {produto.sku} {produto.preco_venda ? `(R$ ${produto.preco_venda.toFixed(2)})` : ''}
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
                    <div className="h-10 flex items-center text-sm font-medium text-foreground">
                      {(() => {
                        // Garantir conversão correta para número
                        const quantidade = typeof item.quantidade === 'number' ? item.quantidade : 
                                          item.quantidade === '' ? 0 : Number(item.quantidade) || 0;
                        const precoUnitario = typeof item.preco_unitario === 'number' ? item.preco_unitario : 
                                             item.preco_unitario === '' ? 0 : Number(item.preco_unitario) || 0;
                        const desconto = typeof item.desconto === 'number' ? item.desconto : 
                                        item.desconto === '' ? 0 : Number(item.desconto) || 0;
                        const subtotal = Math.max(0, quantidade * precoUnitario - desconto);
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
                    onValueChange={(value) => {
                      const novaForma = value as FormaPagamento;
                      setFormaPagamento(novaForma);
                      
                      // Se a forma de pagamento mudou manualmente e é diferente da condição selecionada,
                      // limpar a condição de pagamento selecionada
                      if (condicaoPagamentoSelecionada && condicaoPagamentoSelecionada.forma_pagamento !== novaForma) {
                        setCondicaoPagamentoSelecionada(null);
                        setCondicaoPagamento('');
                        setDataVencimento('');
                      }
                    }}
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
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    Data de Vencimento
                  </Label>
                  <Input
                    type="date"
                    value={dataVencimento}
                    onChange={(e) => setDataVencimento(e.target.value)}
                    min={dataPedido}
                    placeholder="Selecione a data de vencimento"
                  />
                  <p className="text-xs text-muted-foreground">
                    Data de vencimento para as contas financeiras deste pedido
                  </p>
                </div>
              </div>

              {/* Seleção de Condição de Pagamento - Apenas para pedidos de venda */}
              {tipo === 'VENDA' && clienteId && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                    Condição de Pagamento
                    {carregandoCondicoes && (
                      <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                    )}
                  </Label>
                  {condicoesPagamentoDisponiveis.length > 0 ? (
                    <Select
                      value={condicaoPagamentoSelecionada?.id?.toString() || ''}
                      onValueChange={(value) => {
                        const condicao = condicoesPagamentoDisponiveis.find(
                          (c) => c.id?.toString() === value
                        );
                        if (condicao) {
                          setCondicaoPagamentoSelecionada(condicao);
                          setFormaPagamento(condicao.forma_pagamento as FormaPagamento);
                          
                          // Preencher condição de pagamento (texto)
                          if (condicao.parcelado) {
                            setCondicaoPagamento(`${condicao.numero_parcelas}x ${condicao.descricao}`);
                          } else {
                            setCondicaoPagamento(`${condicao.prazo_dias} dias - ${condicao.descricao}`);
                          }
                          
                          // Calcular data de vencimento
                          if (condicao.parcelado && condicao.parcelas && condicao.parcelas.length > 0) {
                            const dataBase = new Date(dataPedido || new Date());
                            const primeiraParcela = condicao.parcelas[0];
                            const dataVencimento = new Date(dataBase);
                            dataVencimento.setDate(dataVencimento.getDate() + primeiraParcela.dias_vencimento);
                            setDataVencimento(dataVencimento.toISOString().split('T')[0]);
                          } else if (condicao.prazo_dias) {
                            const dataBase = new Date(dataPedido || new Date());
                            const dataVencimento = new Date(dataBase);
                            dataVencimento.setDate(dataVencimento.getDate() + condicao.prazo_dias);
                            setDataVencimento(dataVencimento.toISOString().split('T')[0]);
                          }
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma condição de pagamento" />
                      </SelectTrigger>
                      <SelectContent>
                        {condicoesPagamentoDisponiveis.map((condicao) => (
                          <SelectItem
                            key={condicao.id}
                            value={condicao.id?.toString() || ''}
                          >
                            {condicao.descricao}
                            {condicao.padrao && ' (Padrão)'}
                            {condicao.parcelado
                              ? ` - ${condicao.numero_parcelas}x`
                              : ` - ${condicao.prazo_dias} dias`}
                            {` - ${condicao.forma_pagamento}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="text-sm text-muted-foreground p-2 border rounded">
                      Nenhuma condição de pagamento cadastrada para este cliente.
                    </div>
                  )}
                  
                  {/* Exibir detalhes da condição selecionada */}
                  {condicaoPagamentoSelecionada && (
                    <div className="mt-2 p-3 bg-muted/50 rounded-md border">
                      <p className="text-sm font-medium mb-2">Detalhes da Condição:</p>
                      <div className="text-sm space-y-1">
                        <p><strong>Prazo de Pagamento:</strong> {condicaoPagamentoSelecionada.descricao}</p>
                        <p><strong>Forma:</strong> {condicaoPagamentoSelecionada.forma_pagamento}</p>
                        {condicaoPagamentoSelecionada.parcelado ? (
                          <>
                            <p><strong>Parcelas:</strong> {condicaoPagamentoSelecionada.numero_parcelas}x</p>
                            {condicaoPagamentoSelecionada.parcelas && condicaoPagamentoSelecionada.parcelas.length > 0 && (
                              <div className="mt-2">
                                <p className="font-medium text-xs mb-1">Detalhamento:</p>
                                <div className="text-xs space-y-1">
                                  {condicaoPagamentoSelecionada.parcelas.map((p) => (
                                    <p key={p.numero_parcela}>
                                      {p.numero_parcela}ª parcela: {p.dias_vencimento} dias ({p.percentual}%)
                                    </p>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <p><strong>Prazo:</strong> {condicaoPagamentoSelecionada.prazo_dias} dias</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  Descrição da Condição de Pagamento
                </Label>
                <Input
                  type="text"
                  value={condicaoPagamento}
                  onChange={(e) => setCondicaoPagamento(e.target.value)}
                  placeholder="Ex: 30 dias, 3x sem juros, etc."
                />
                <p className="text-xs text-muted-foreground">
                  Este campo é preenchido automaticamente ao selecionar uma condição acima. Você pode editar manualmente se necessário.
                </p>
              </div>

              {/* Campos de Parcelamento - Apenas para Cartão de Crédito */}
              {formaPagamento === 'CARTAO_CREDITO' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                  <h3 className="text-sm font-semibold text-blue-900 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Parcelamento no Cartão de Crédito
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Número de Parcelas</Label>
                      <Select
                        value={numeroParcelas.toString()}
                        onValueChange={(value) => {
                          const parcelas = Number(value);
                          setNumeroParcelas(parcelas);
                          // Calcular valor da parcela automaticamente usando o subtotal
                          if (calculos.subtotal > 0) {
                            const valorCalculado = calculos.subtotal / parcelas;
                            setValorParcela(Number(valorCalculado.toFixed(2)));
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o número de parcelas" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              {num}x
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Valor da Parcela (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={valorParcela}
                        onChange={(e) => {
                          const valor = e.target.value === '' ? '' : Number(e.target.value);
                          setValorParcela(valor);
                        }}
                        placeholder="0,00"
                      />
                      <p className="text-xs text-muted-foreground">
                        {numeroParcelas > 1 && typeof valorParcela === 'number' && valorParcela > 0
                          ? `Total: R$ ${(valorParcela * numeroParcelas).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : 'Digite o valor desejado para cada parcela'}
                      </p>
                    </div>
                  </div>
                  {numeroParcelas > 1 && (
                    <div className="mt-2 p-3 bg-white rounded border border-blue-200">
                      <p className="text-sm text-blue-900">
                        <strong>Resumo do Parcelamento:</strong>
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {typeof valorParcela === 'number' && valorParcela > 0
                          ? `${numeroParcelas} parcelas de R$ ${valorParcela.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} = R$ ${(valorParcela * numeroParcelas).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : `Parcelar em ${numeroParcelas}x parcelas`}
                      </p>
                    </div>
                  )}
                </div>
              )}

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

