import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
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
import { formatCurrency } from '@/lib/utils';
import { notaFiscalService } from '@/services/nota-fiscal.service';
import {
  STATUS_NOTA_FISCAL_LABELS,
  type CampoFaltanteNotaFiscal,
  type EmitirNotaFiscalPayload,
  type NotaFiscal,
  type NotaFiscalPreEmissaoEndereco,
} from '@/types/nota-fiscal';
import { Pedido } from '@/types/pedido';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, FileCheck2, Loader2, Receipt } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { toast } from 'sonner';

interface EmitirNotaFiscalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Pedido | null;
  onSuccess?: (nota: NotaFiscal) => void;
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border bg-card p-4 space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <p className="text-sm break-words">{value ?? '—'}</p>
    </div>
  );
}

function extractErrorMessage(error: unknown): string {
  const err = error as { message?: string; response?: { data?: { message?: string | string[] } } };
  const msg = err?.response?.data?.message;
  if (Array.isArray(msg)) return msg.join(', ');
  if (typeof msg === 'string' && msg.trim()) return msg;
  if (err?.message) return err.message;
  return 'Não foi possível concluir a operação.';
}

function campoVazio(val?: string | null): boolean {
  return !String(val ?? '').trim();
}

function normalizarDoc(doc: string): string {
  return doc.replace(/\D/g, '');
}

function formatarDataPedido(data?: string | null): string {
  if (!data?.trim()) return '—';
  const part = data.split('T')[0].split(' ')[0];
  const [y, m, d] = part.split('-').map(Number);
  if (!y || !m || !d) return part;
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
}

function labelFormaPagamento(forma?: string | null): string {
  const map: Record<string, string> = {
    DINHEIRO: 'Dinheiro',
    PIX: 'PIX',
    CARTAO_CREDITO: 'Cartão de crédito',
    CARTAO_DEBITO: 'Cartão de débito',
    BOLETO: 'Boleto',
    TRANSFERENCIA: 'Transferência',
    CHEQUE: 'Cheque',
  };
  return forma ? map[forma] || forma : '—';
}

function labelRegime(regime?: string | null): string {
  if (regime === 'SIMPLES_NACIONAL') return 'Simples Nacional';
  if (regime === 'REGIME_NORMAL') return 'Regime Normal';
  return regime || '—';
}

function formatEndereco(end?: NotaFiscalPreEmissaoEndereco | null): string {
  if (!end) return '—';
  const partes = [
    end.logradouro,
    end.numero,
    end.complemento,
    end.bairro,
    end.cidade,
    end.estado,
    end.cep ? `CEP ${end.cep}` : null,
  ].filter(Boolean);
  return partes.length ? partes.join(', ') : '—';
}

function calcularFaltantesLocal(data: {
  empresaCnpj: string;
  spedyConfigurado: boolean;
  pedidoTipo: string;
  pedidoStatus: string;
  clienteId?: number | null;
  clienteNome: string;
  clienteDoc: string;
  endereco: NotaFiscalPreEmissaoEndereco | null;
  itens: Array<{ produto_id: number; nome: string; ncm: string }>;
  notaBloqueia: boolean;
  temItens: boolean;
}): CampoFaltanteNotaFiscal[] {
  const faltantes: CampoFaltanteNotaFiscal[] = [];

  if (campoVazio(data.empresaCnpj) || normalizarDoc(data.empresaCnpj).length !== 14) {
    faltantes.push({ campo: 'empresa.cnpj', label: 'CNPJ da empresa', secao: 'empresa' });
  }
  if (!data.spedyConfigurado) {
    faltantes.push({
      campo: 'spedy.api_key',
      label: 'Integração Spedy (Configurações)',
      secao: 'integracao',
    });
  }
  if (data.pedidoTipo !== 'VENDA') {
    faltantes.push({ campo: 'pedido.tipo', label: 'Pedido deve ser Venda', secao: 'pedido' });
  }
  if (data.pedidoStatus === 'CANCELADO') {
    faltantes.push({ campo: 'pedido.status', label: 'Pedido cancelado', secao: 'pedido' });
  }
  if (!data.clienteId) {
    faltantes.push({ campo: 'pedido.cliente_id', label: 'Cliente no pedido', secao: 'pedido' });
  }
  if (!data.temItens) {
    faltantes.push({ campo: 'pedido.itens', label: 'Itens do pedido', secao: 'pedido' });
  }
  if (data.notaBloqueia) {
    faltantes.push({
      campo: 'nota.status',
      label: 'Nota já autorizada ou em processamento',
      secao: 'pedido',
    });
  }
  if (campoVazio(data.clienteNome)) {
    faltantes.push({ campo: 'cliente.nome', label: 'Nome do cliente', secao: 'cliente' });
  }
  const doc = normalizarDoc(data.clienteDoc);
  if (!doc || (doc.length !== 11 && doc.length !== 14)) {
    faltantes.push({ campo: 'cliente.cpf_cnpj', label: 'CPF/CNPJ do cliente', secao: 'cliente' });
  }
  if (!data.endereco) {
    faltantes.push({ campo: 'endereco', label: 'Endereço completo', secao: 'endereco' });
  } else {
    const checks: Array<[string, string, keyof NotaFiscalPreEmissaoEndereco]> = [
      ['endereco.cep', 'CEP', 'cep'],
      ['endereco.logradouro', 'Logradouro', 'logradouro'],
      ['endereco.numero', 'Número', 'numero'],
      ['endereco.bairro', 'Bairro', 'bairro'],
      ['endereco.cidade', 'Cidade', 'cidade'],
      ['endereco.estado', 'UF', 'estado'],
    ];
    for (const [campo, label, key] of checks) {
      if (campoVazio(data.endereco[key] as string)) {
        faltantes.push({ campo, label, secao: 'endereco' });
      }
    }
  }
  for (const item of data.itens) {
    if (campoVazio(item.ncm)) {
      faltantes.push({
        campo: `produto.${item.produto_id}.ncm`,
        label: `NCM — ${item.nome}`,
        secao: 'produto',
        produto_id: item.produto_id,
      });
    }
  }
  return faltantes;
}

function campoFaltando(faltantes: CampoFaltanteNotaFiscal[], campo: string): boolean {
  return faltantes.some((f) => f.campo === campo || f.campo.startsWith(`${campo}.`));
}

export function EmitirNotaFiscalDialog({
  open,
  onOpenChange,
  order,
  onSuccess,
}: EmitirNotaFiscalDialogProps) {
  const queryClient = useQueryClient();
  const pedidoId = order?.id;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['pedidos', pedidoId, 'nota-fiscal', 'pre-emissao'],
    queryFn: () => notaFiscalService.obterPreEmissao(pedidoId!),
    enabled: open && !!pedidoId && order?.tipo === 'VENDA',
  });

  const [clienteNome, setClienteNome] = useState('');
  const [clienteFantasia, setClienteFantasia] = useState('');
  const [clienteRazao, setClienteRazao] = useState('');
  const [clienteDoc, setClienteDoc] = useState('');
  const [clienteIe, setClienteIe] = useState('');
  const [clienteEmail, setClienteEmail] = useState('');
  const [clienteTelefone, setClienteTelefone] = useState('');
  const [endereco, setEndereco] = useState<NotaFiscalPreEmissaoEndereco>({
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    codigo_ibge: '',
  });
  const [ncmPorProduto, setNcmPorProduto] = useState<Record<number, string>>({});

  useEffect(() => {
    if (!data) return;
    const c = data.cliente;
    setClienteNome(c?.nome || '');
    setClienteFantasia(c?.nome_fantasia || '');
    setClienteRazao(c?.nome_razao || '');
    setClienteDoc(c?.cpf_cnpj || '');
    setClienteIe(c?.inscricao_estadual || '');
    setClienteEmail(c?.email || '');
    setClienteTelefone(c?.telefone || '');
    setEndereco({
      id: c?.endereco?.id ?? undefined,
      cep: c?.endereco?.cep || '',
      logradouro: c?.endereco?.logradouro || '',
      numero: c?.endereco?.numero || '',
      complemento: c?.endereco?.complemento || '',
      bairro: c?.endereco?.bairro || '',
      cidade: c?.endereco?.cidade || '',
      estado: c?.endereco?.estado || '',
      codigo_ibge: c?.endereco?.codigo_ibge || '',
    });
    const ncms: Record<number, string> = {};
    for (const item of data.itens) {
      ncms[item.produto_id] = item.ncm || '';
    }
    setNcmPorProduto(ncms);
  }, [data]);

  const faltantes = useMemo(() => {
    if (!data || !order) return [];
    return calcularFaltantesLocal({
      empresaCnpj: data.empresa.cnpj,
      spedyConfigurado: data.spedy_configurado,
      pedidoTipo: order.tipo,
      pedidoStatus: order.status,
      clienteId: data.cliente?.id,
      clienteNome,
      clienteDoc,
      endereco: endereco.cep || endereco.logradouro ? endereco : null,
      itens: data.itens.map((i) => ({
        produto_id: i.produto_id,
        nome: i.nome,
        ncm: ncmPorProduto[i.produto_id] ?? i.ncm,
      })),
      notaBloqueia: !!data.nota_existente?.bloqueia_reemissao,
      temItens: data.itens.length > 0,
    });
  }, [data, order, clienteNome, clienteDoc, endereco, ncmPorProduto]);

  const podeEmitir = faltantes.length === 0;

  const emitirMutation = useMutation({
    mutationFn: (payload: EmitirNotaFiscalPayload) =>
      notaFiscalService.emitir(pedidoId!, payload),
    onSuccess: (nota) => {
      queryClient.invalidateQueries({ queryKey: ['pedidos', pedidoId, 'nota-fiscal'] });
      toast.success('Nota enviada à Spedy', {
        description: STATUS_NOTA_FISCAL_LABELS[nota.status] ?? nota.status,
      });
      onSuccess?.(nota);
      onOpenChange(false);
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const handleEmitir = () => {
    if (!data || !podeEmitir) return;
    const payload: EmitirNotaFiscalPayload = {
      cliente: {
        nome: clienteNome.trim(),
        nome_fantasia: clienteFantasia.trim() || undefined,
        nome_razao: clienteRazao.trim() || undefined,
        cpf_cnpj: clienteDoc.trim(),
        inscricao_estadual: clienteIe.trim() || undefined,
        email: clienteEmail.trim() || undefined,
        telefone: clienteTelefone.trim() || undefined,
      },
      endereco: {
        ...endereco,
        id: endereco.id,
        cep: endereco.cep.trim(),
        logradouro: endereco.logradouro.trim(),
        numero: endereco.numero.trim(),
        complemento: endereco.complemento?.trim() || undefined,
        bairro: endereco.bairro.trim(),
        cidade: endereco.cidade.trim(),
        estado: endereco.estado.trim().toUpperCase().slice(0, 2),
        codigo_ibge: endereco.codigo_ibge?.trim() || undefined,
      },
      produtos: data.itens.map((item) => ({
        produto_id: item.produto_id,
        ncm: (ncmPorProduto[item.produto_id] ?? item.ncm).trim(),
        sku: item.sku || undefined,
      })),
    };
    emitirMutation.mutate(payload);
  };

  const inputClass = (campo: string) =>
    campoFaltando(faltantes, campo)
      ? 'border-destructive focus-visible:ring-destructive'
      : undefined;

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-violet-600" />
            Emitir Nota Fiscal
          </DialogTitle>
          <DialogDescription>
            Pedido {order.numero_pedido} — revise todos os dados antes de emitir.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 px-6 py-4">
          {isLoading && (
            <div className="flex items-center gap-2 py-8 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              Carregando dados para emissão...
            </div>
          )}

          {isError && (
            <Alert variant="destructive" className="my-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro ao carregar</AlertTitle>
              <AlertDescription className="flex flex-wrap items-center gap-2">
                {extractErrorMessage(error)}
                <Button size="sm" variant="outline" onClick={() => refetch()}>
                  Tentar novamente
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {data && (
            <div className="space-y-4 pb-2">
              {faltantes.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Dados incompletos ({faltantes.length})</AlertTitle>
                  <AlertDescription>
                    <ul className="mt-2 list-disc pl-4 space-y-0.5 text-sm">
                      {faltantes.map((f) => (
                        <li key={f.campo}>{f.label}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {data.nota_existente && (
                <div className="flex items-center gap-2 text-sm px-1">
                  <span className="text-muted-foreground">Nota existente:</span>
                  <Badge variant="outline">
                    {STATUS_NOTA_FISCAL_LABELS[data.nota_existente.status]}
                  </Badge>
                </div>
              )}

              <SectionCard title="Pedido" description="Dados da venda que serão enviados na NF-e">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  <ReadOnlyField label="Número" value={data.pedido.numero_pedido} />
                  <ReadOnlyField label="Data" value={formatarDataPedido(data.pedido.data_pedido)} />
                  <ReadOnlyField label="Status" value={data.pedido.status} />
                  <ReadOnlyField
                    label="Forma de pagamento"
                    value={labelFormaPagamento(data.pedido.forma_pagamento)}
                  />
                  <ReadOnlyField label="Subtotal" value={formatCurrency(data.pedido.subtotal)} />
                  <ReadOnlyField label="Frete" value={formatCurrency(data.pedido.frete)} />
                  <ReadOnlyField
                    label="Desconto"
                    value={formatCurrency(data.pedido.desconto_valor)}
                  />
                  <ReadOnlyField
                    label="Valor total"
                    value={
                      <span className="font-semibold text-primary">
                        {formatCurrency(data.pedido.valor_total)}
                      </span>
                    }
                  />
                </div>
              </SectionCard>

              <SectionCard
                title="Empresa emitente"
                description="Dados fiscais da empresa (Configurações → Empresa)"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <ReadOnlyField
                    label="Razão social"
                    value={data.empresa.razao_social || data.empresa.nome_fantasia}
                  />
                  <ReadOnlyField label="Nome fantasia" value={data.empresa.nome_fantasia} />
                  <ReadOnlyField
                    label="CNPJ"
                    value={
                      <span className={inputClass('empresa.cnpj') ? 'text-destructive' : ''}>
                        {data.empresa.cnpj || 'Não informado'}
                      </span>
                    }
                  />
                  <ReadOnlyField
                    label="Inscrição estadual"
                    value={data.empresa.inscricao_estadual}
                  />
                  <ReadOnlyField
                    label="Endereço fiscal"
                    value={formatEndereco(data.empresa.endereco)}
                  />
                  <ReadOnlyField
                    label="Regime tributário"
                    value={labelRegime(data.empresa.regime_tributario)}
                  />
                  <ReadOnlyField label="CFOP interno" value={data.empresa.cfop_interno} />
                  <ReadOnlyField
                    label="CFOP interestadual"
                    value={data.empresa.cfop_interestadual}
                  />
                  <div className="sm:col-span-2">
                    <ReadOnlyField
                      label="Integração Spedy"
                      value={
                        <span
                          className={
                            !data.spedy_configurado
                              ? 'text-destructive'
                              : 'text-green-700 dark:text-green-400'
                          }
                        >
                          {data.spedy_configurado
                            ? 'Configurada'
                            : 'Não configurada — peça ao administrador'}
                        </span>
                      }
                    />
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                title="Cliente (destinatário)"
                description="Edite os campos necessários para a NF-e"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <Label htmlFor="nf-cliente-nome">Nome *</Label>
                    <Input
                      id="nf-cliente-nome"
                      value={clienteNome}
                      onChange={(e) => setClienteNome(e.target.value)}
                      className={inputClass('cliente.nome')}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="nf-cliente-fantasia">Nome fantasia</Label>
                    <Input
                      id="nf-cliente-fantasia"
                      value={clienteFantasia}
                      onChange={(e) => setClienteFantasia(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="nf-cliente-razao">Razão social</Label>
                    <Input
                      id="nf-cliente-razao"
                      value={clienteRazao}
                      onChange={(e) => setClienteRazao(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="nf-cliente-doc">CPF/CNPJ *</Label>
                    <Input
                      id="nf-cliente-doc"
                      value={clienteDoc}
                      onChange={(e) => setClienteDoc(e.target.value)}
                      className={inputClass('cliente.cpf_cnpj')}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="nf-cliente-ie">Inscrição estadual</Label>
                    <Input
                      id="nf-cliente-ie"
                      value={clienteIe}
                      onChange={(e) => setClienteIe(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="nf-cliente-email">E-mail</Label>
                    <Input
                      id="nf-cliente-email"
                      type="email"
                      value={clienteEmail}
                      onChange={(e) => setClienteEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="nf-cliente-tel">Telefone</Label>
                    <Input
                      id="nf-cliente-tel"
                      value={clienteTelefone}
                      onChange={(e) => setClienteTelefone(e.target.value)}
                    />
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Endereço do cliente" description="Endereço de entrega/faturamento">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="nf-cep">CEP *</Label>
                    <Input
                      id="nf-cep"
                      value={endereco.cep}
                      onChange={(e) => setEndereco((p) => ({ ...p, cep: e.target.value }))}
                      className={inputClass('endereco.cep')}
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <Label htmlFor="nf-log">Logradouro *</Label>
                    <Input
                      id="nf-log"
                      value={endereco.logradouro}
                      onChange={(e) =>
                        setEndereco((p) => ({ ...p, logradouro: e.target.value }))
                      }
                      className={inputClass('endereco.logradouro')}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="nf-num">Número *</Label>
                    <Input
                      id="nf-num"
                      value={endereco.numero}
                      onChange={(e) => setEndereco((p) => ({ ...p, numero: e.target.value }))}
                      className={inputClass('endereco.numero')}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="nf-comp">Complemento</Label>
                    <Input
                      id="nf-comp"
                      value={endereco.complemento || ''}
                      onChange={(e) =>
                        setEndereco((p) => ({ ...p, complemento: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="nf-bairro">Bairro *</Label>
                    <Input
                      id="nf-bairro"
                      value={endereco.bairro}
                      onChange={(e) => setEndereco((p) => ({ ...p, bairro: e.target.value }))}
                      className={inputClass('endereco.bairro')}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="nf-cidade">Cidade *</Label>
                    <Input
                      id="nf-cidade"
                      value={endereco.cidade}
                      onChange={(e) => setEndereco((p) => ({ ...p, cidade: e.target.value }))}
                      className={inputClass('endereco.cidade')}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="nf-uf">UF *</Label>
                    <Input
                      id="nf-uf"
                      maxLength={2}
                      value={endereco.estado}
                      onChange={(e) =>
                        setEndereco((p) => ({
                          ...p,
                          estado: e.target.value.toUpperCase().slice(0, 2),
                        }))
                      }
                      className={inputClass('endereco.estado')}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="nf-ibge">Código IBGE</Label>
                    <Input
                      id="nf-ibge"
                      value={endereco.codigo_ibge || ''}
                      onChange={(e) =>
                        setEndereco((p) => ({ ...p, codigo_ibge: e.target.value }))
                      }
                      placeholder="Opcional"
                    />
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                title={`Produtos (${data.itens.length})`}
                description="Itens do pedido — informe o NCM de cada produto"
              >
                <div className="rounded-lg border overflow-x-auto">
                  <table className="w-full text-sm min-w-[640px]">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-2 font-medium w-10">#</th>
                        <th className="text-left p-2 font-medium w-24">SKU</th>
                        <th className="text-left p-2 font-medium">Produto</th>
                        <th className="text-right p-2 font-medium w-16">Qtd</th>
                        <th className="text-right p-2 font-medium w-28">Unit.</th>
                        <th className="text-right p-2 font-medium w-28">Subtotal</th>
                        <th className="text-left p-2 font-medium w-36">NCM *</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.itens.map((item, idx) => {
                        const ncmKey = `produto.${item.produto_id}.ncm`;
                        const ncmVal = ncmPorProduto[item.produto_id] ?? '';
                        return (
                          <tr key={item.produto_id} className="border-t">
                            <td className="p-2 text-muted-foreground">{idx + 1}</td>
                            <td className="p-2 font-mono text-xs">{item.sku || '—'}</td>
                            <td className="p-2">{item.nome}</td>
                            <td className="p-2 text-right">{item.quantidade}</td>
                            <td className="p-2 text-right">
                              {formatCurrency(item.preco_unitario)}
                            </td>
                            <td className="p-2 text-right font-medium">
                              {formatCurrency(item.subtotal)}
                            </td>
                            <td className="p-2">
                              <Input
                                value={ncmVal}
                                onChange={(e) =>
                                  setNcmPorProduto((p) => ({
                                    ...p,
                                    [item.produto_id]: e.target.value,
                                  }))
                                }
                                placeholder="00000000"
                                className={
                                  campoFaltando(faltantes, ncmKey)
                                    ? 'border-destructive h-8 font-mono text-xs'
                                    : 'h-8 font-mono text-xs'
                                }
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="border-t bg-muted/30">
                      <tr>
                        <td colSpan={5} className="p-2 text-right font-medium">
                          Total do pedido
                        </td>
                        <td className="p-2 text-right font-semibold text-primary">
                          {formatCurrency(data.pedido.valor_total)}
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </SectionCard>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t shrink-0 gap-2 sm:gap-0 bg-background">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleEmitir}
            disabled={!data || !podeEmitir || emitirMutation.isPending || isLoading}
            className="gap-2"
          >
            {emitirMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileCheck2 className="w-4 h-4" />
            )}
            Emitir NF-e
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
