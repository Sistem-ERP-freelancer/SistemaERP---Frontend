import { CreateProdutoDto } from '@/services/produtos.service';
import { toast } from 'sonner';

export type ProdutoFormData = Partial<CreateProdutoDto> & {
  estoque_maximo?: number | string;
  localizacao?: string;
};

export function prepararCriacaoProduto(form: ProdutoFormData): CreateProdutoDto | null {
  const precoVenda =
    form.preco_venda !== undefined && form.preco_venda !== null
      ? Number(form.preco_venda)
      : undefined;
  const precoPromocional =
    form.preco_promocional !== undefined && form.preco_promocional !== null
      ? Number(form.preco_promocional)
      : undefined;

  if (
    precoVenda !== undefined &&
    precoPromocional !== undefined &&
    precoPromocional > precoVenda
  ) {
    toast.error('O preço promocional não pode ser maior que o preço de venda');
    return null;
  }

  const produtoData: CreateProdutoDto = {
    nome: form.nome || undefined,
    preco_custo:
      form.preco_custo !== undefined && form.preco_custo !== null
        ? Number(form.preco_custo)
        : undefined,
    preco_venda: precoVenda,
    estoque_atual:
      form.estoque_atual !== undefined && form.estoque_atual !== null
        ? Number(form.estoque_atual)
        : undefined,
    estoque_minimo:
      form.estoque_minimo !== undefined && form.estoque_minimo !== null
        ? Number(form.estoque_minimo)
        : undefined,
    unidade_medida: (form.unidade_medida as CreateProdutoDto['unidade_medida']) || 'UN',
    statusProduto: (form.statusProduto as CreateProdutoDto['statusProduto']) || 'ATIVO',
  };

  if (form.sku && String(form.sku).trim()) {
    produtoData.sku = String(form.sku).trim();
  } else {
    produtoData.sku = '';
  }

  if (form.descricao) produtoData.descricao = form.descricao;
  if (precoPromocional !== undefined) produtoData.preco_promocional = precoPromocional;
  if (form.categoriaId) produtoData.categoriaId = form.categoriaId;
  if (form.fornecedorId) produtoData.fornecedorId = form.fornecedorId;
  if (form.data_validade) produtoData.data_validade = form.data_validade;
  if (form.ncm) produtoData.ncm = form.ncm;
  if (form.cest) produtoData.cest = form.cest;
  if (form.cfop) produtoData.cfop = form.cfop;
  if (form.observacoes) produtoData.observacoes = form.observacoes;
  if (form.peso) produtoData.peso = Number(form.peso);
  if (form.altura) produtoData.altura = Number(form.altura);
  if (form.largura) produtoData.largura = Number(form.largura);

  if (
    form.estoque_maximo !== undefined &&
    form.estoque_maximo !== null &&
    form.estoque_maximo !== ''
  ) {
    const estoqueMaximoNum = Number(form.estoque_maximo);
    if (!isNaN(estoqueMaximoNum) && estoqueMaximoNum >= 0) {
      produtoData.estoque_maximo = estoqueMaximoNum;
    }
  }

  if (form.localizacao && typeof form.localizacao === 'string' && form.localizacao.trim() !== '') {
    produtoData.localizacao = form.localizacao.trim().substring(0, 255);
  }

  return produtoData;
}
