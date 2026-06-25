import type { FluxoCaixaResponse } from '@/services/financeiro.service';

const SEP = ';';

function escapeCell(value: string): string {
  if (/[";\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function fmtValor(v: number | null): string {
  if (v === null) return '';
  return v.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exporta o fluxo de caixa em CSV compatível com Excel (UTF-8 BOM, separador `;`).
 */
export function exportarFluxoCaixaExcel(
  data: FluxoCaixaResponse,
  options?: { rocaNome?: string },
): void {
  const linhas: string[] = [];
  const { periodo, cards, colunas, linhas: rows } = data;

  linhas.push(
    [
      'Fluxo de Caixa',
      `${periodo.inicio} a ${periodo.fim}`,
    ].map(escapeCell).join(SEP),
  );
  if (options?.rocaNome) {
    linhas.push(['Roça', options.rocaNome].map(escapeCell).join(SEP));
  }
  linhas.push('');
  linhas.push(
    ['Saldo inicial', fmtValor(cards.saldo_inicial)].map(escapeCell).join(SEP),
  );
  linhas.push(
    ['Total a receber', fmtValor(cards.total_a_receber)].map(escapeCell).join(SEP),
  );
  linhas.push(
    ['Total a pagar', fmtValor(cards.total_a_pagar)].map(escapeCell).join(SEP),
  );
  linhas.push(
    ['Saldo projetado', fmtValor(cards.saldo_projetado)].map(escapeCell).join(SEP),
  );
  linhas.push('');

  const cabecalho = [
    'Centro de custo / Categoria',
    ...colunas.map((c) => `${c.label} (${c.weekday})`),
  ];
  linhas.push(cabecalho.map(escapeCell).join(SEP));

  for (const row of rows) {
    if (row.tipo === 'secao') {
      linhas.push([row.label, ...colunas.map(() => '')].map(escapeCell).join(SEP));
      continue;
    }
    const cells = [row.label, ...row.valores.map((v) => fmtValor(v))];
    linhas.push(cells.map(escapeCell).join(SEP));
  }

  const bom = '\uFEFF';
  const blob = new Blob([bom + linhas.join('\r\n')], {
    type: 'text/csv;charset=utf-8;',
  });
  const nomeArquivo = `fluxo-caixa_${periodo.inicio}_${periodo.fim}.csv`;
  downloadBlob(blob, nomeArquivo);
}
