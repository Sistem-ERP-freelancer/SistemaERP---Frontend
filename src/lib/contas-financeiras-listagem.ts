import { parseDateOnlyLocal } from '@/lib/utils';
import {
  type ContaFinanceira,
  financeiroService,
} from '@/services/financeiro.service';

export function toYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function fimDoMesYMD(ref = new Date()): string {
  return toYMD(new Date(ref.getFullYear(), ref.getMonth() + 1, 0));
}

export function parseListarContasResponse(response: unknown): {
  data: ContaFinanceira[];
  total: number;
} {
  if (Array.isArray(response)) {
    return { data: response, total: response.length };
  }
  const r = response as {
    data?: ContaFinanceira[];
    total?: number;
    contas?: ContaFinanceira[];
  };
  if (r?.data && Array.isArray(r.data)) {
    return { data: r.data, total: r.total ?? r.data.length };
  }
  if (r?.contas && Array.isArray(r.contas)) {
    return { data: r.contas, total: r.total ?? r.contas.length };
  }
  return { data: [], total: 0 };
}

/** Busca todas as páginas de contas financeiras para o mesmo filtro. */
export async function listarContasTodasAsPaginas(
  base: Parameters<typeof financeiroService.listar>[0],
): Promise<ContaFinanceira[]> {
  const pageLimit = 200;
  let page = 1;
  const acc: ContaFinanceira[] = [];
  let totalEsperado = 0;

  for (;;) {
    const response = await financeiroService.listar({
      ...base,
      page,
      limit: pageLimit,
    });
    const { data, total } = parseListarContasResponse(response);
    if (page === 1) totalEsperado = total;
    acc.push(...data);
    if (data.length < pageLimit || acc.length >= totalEsperado || data.length === 0) {
      break;
    }
    page += 1;
  }

  return acc;
}

export function contaTemSaldoAberto(c: ContaFinanceira): boolean {
  const st = String(c.status ?? '').toUpperCase();
  if (st === 'QUITADO' || st === 'PAGO_TOTAL' || st === 'CANCELADO') return false;
  const aberto = Number(
    (c as { valor_restante?: number; valor_em_aberto?: number }).valor_restante ??
      (c as { valor_em_aberto?: number }).valor_em_aberto ??
      0,
  );
  if (aberto > 0.009) return true;
  return (
    st === 'PENDENTE' ||
    st === 'ABERTO' ||
    st === 'PARCIAL' ||
    st === 'PAGO_PARCIAL' ||
    st === 'VENCIDO'
  );
}

export function contaEstaPaga(c: ContaFinanceira): boolean {
  const st = String(c.status ?? '').toUpperCase();
  return (
    st === 'PAGO_TOTAL' ||
    st === 'PAGO_PARCIAL' ||
    st === 'QUITADO' ||
    st === 'PARCIAL'
  );
}

export function saldoAbertoConta(c: ContaFinanceira): number {
  const st = String(c.status ?? '').toUpperCase();
  if (st === 'CANCELADO' || st === 'QUITADO' || st === 'PAGO_TOTAL') return 0;
  const r = c.valor_restante != null ? Number(c.valor_restante) : 0;
  const em = c.valor_em_aberto != null ? Number(c.valor_em_aberto) : 0;
  return Math.max(0, r || em);
}

/** Resumo dos cards de Contas a Receber a partir da listagem filtrada (mesma base da tabela). */
export function calcularResumoCardsReceber(contas: ContaFinanceira[]): {
  totalReceber: number;
  valorRecebido: number;
  vencidas: number;
  vencendoHoje: number;
  vencendoEsteMes: number;
} {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();

  let totalReceber = 0;
  let valorRecebido = 0;
  let vencidas = 0;
  let vencendoHoje = 0;
  let vencendoEsteMes = 0;

  for (const conta of contas) {
    if (conta.tipo !== 'RECEBER') continue;
    const st = String(conta.status ?? '').toUpperCase();
    if (st === 'CANCELADO') continue;

    valorRecebido += Number(conta.valor_pago) || 0;

    if (!contaTemSaldoAberto(conta)) continue;

    totalReceber += saldoAbertoConta(conta);

    const diasAte =
      conta.dias_ate_vencimento !== undefined && conta.dias_ate_vencimento !== null
        ? conta.dias_ate_vencimento
        : (() => {
            const vencimento = parseDateOnlyLocal(conta.data_vencimento);
            if (!vencimento) return null;
            vencimento.setHours(0, 0, 0, 0);
            return Math.round(
              (vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24),
            );
          })();

    if (st === 'VENCIDO' || (diasAte != null && diasAte < 0)) {
      vencidas += 1;
      continue;
    }

    if (diasAte === 0) {
      vencendoHoje += 1;
    }

    if (diasAte != null && diasAte > 0) {
      const vencimento = parseDateOnlyLocal(conta.data_vencimento);
      if (
        vencimento &&
        vencimento.getMonth() === mesAtual &&
        vencimento.getFullYear() === anoAtual
      ) {
        vencendoEsteMes += 1;
      }
    }
  }

  return {
    totalReceber: Number(totalReceber.toFixed(2)),
    valorRecebido: Number(valorRecebido.toFixed(2)),
    vencidas,
    vencendoHoje,
    vencendoEsteMes,
  };
}
