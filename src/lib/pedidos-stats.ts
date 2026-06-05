import { pedidosService } from '@/services/pedidos.service';
import type { DashboardPedidos, FiltrosPedidos, Pedido } from '@/types/pedido';

type PedidoComSaldo = Pedido & { valor_em_aberto?: number; valor_pago?: number };

function saldoAbertoPedido(p: PedidoComSaldo): number {
  if (p.status === 'QUITADO' || p.status === 'CANCELADO') return 0;
  if (p.valor_em_aberto != null) return Math.max(0, Number(p.valor_em_aberto));
  const pago = Number(p.valor_pago ?? 0);
  return Math.max(0, Number(p.valor_total ?? 0) - pago);
}

function parsePedidosResponse(response: unknown): Pedido[] {
  if (Array.isArray(response)) return response;
  const r = response as { data?: Pedido[]; pedidos?: Pedido[] };
  if (r?.data && Array.isArray(r.data)) return r.data;
  if (r?.pedidos && Array.isArray(r.pedidos)) return r.pedidos;
  return [];
}

/** Busca todos os pedidos que batem com os filtros da listagem (sem filtro de card). */
export async function listarPedidosTodasPaginas(
  filtros: FiltrosPedidos,
): Promise<Pedido[]> {
  const { card_filtro: _card, page: _page, limit: _limit, ...rest } = filtros;
  const pageLimit = 200;
  let page = 1;
  const acc: Pedido[] = [];
  let totalEsperado = 0;

  for (;;) {
    const response = await pedidosService.listar({
      ...rest,
      page,
      limit: pageLimit,
    });
    const data = parsePedidosResponse(response);
    const total =
      typeof (response as { total?: number })?.total === 'number'
        ? (response as { total: number }).total
        : data.length;
    if (page === 1) totalEsperado = total;
    acc.push(...data);
    if (data.length < pageLimit || acc.length >= totalEsperado || data.length === 0) {
      break;
    }
    page += 1;
  }

  return acc;
}

/** Resumo dos cards de Pedidos a partir da listagem filtrada. */
export function calcularResumoCardsPedidos(pedidos: Pedido[]): Pick<
  DashboardPedidos,
  | 'faturamento_confirmado_venda'
  | 'valor_em_aberto_venda'
  | 'pedidos_em_andamento'
  | 'pedidos_cancelados'
> {
  const vendas = pedidos.filter((p) => p.tipo === 'VENDA');
  const quitadosVenda = vendas.filter((p) => p.status === 'QUITADO');
  const abertoVenda = vendas.filter(
    (p) => p.status !== 'QUITADO' && p.status !== 'CANCELADO',
  );
  const emAndamento = pedidos.filter(
    (p) => p.status === 'ABERTO' || p.status === 'PARCIAL',
  );
  const cancelados = pedidos.filter((p) => p.status === 'CANCELADO');

  return {
    faturamento_confirmado_venda: {
      valor: Number(
        quitadosVenda
          .reduce((s, p) => s + Number(p.valor_total ?? 0), 0)
          .toFixed(2),
      ),
      quantidade: quitadosVenda.length,
    },
    valor_em_aberto_venda: {
      valor: Number(
        abertoVenda.reduce((s, p) => s + saldoAbertoPedido(p), 0).toFixed(2),
      ),
      quantidade: abertoVenda.length,
    },
    pedidos_em_andamento: {
      quantidade: emAndamento.length,
      detalhes: { pendente: 0, aprovado: 0, em_processamento: 0 },
    },
    pedidos_cancelados: {
      quantidade: cancelados.length,
    },
  };
}
