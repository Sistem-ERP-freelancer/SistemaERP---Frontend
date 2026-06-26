import type { FluxoCaixaResponse } from '@/services/financeiro.service';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtValor(v: number | null): string {
  if (v === null) return '';
  return v.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtMoeda(v: number): string {
  return v.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
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

function classeLinha(tipo: string): string {
  if (tipo === 'secao') return 'secao';
  if (tipo === 'subtotal') return 'subtotal';
  if (tipo === 'saldo-dia') return 'saldo-dia';
  if (tipo === 'saldo-acumulado') return 'saldo-acumulado';
  return '';
}

/**
 * Exporta fluxo de caixa em planilha Excel (.xls HTML).
 * Evita CSV com separador `;` que o Excel Online abre em coluna única.
 */
export function exportarFluxoCaixaExcel(
  data: FluxoCaixaResponse,
  options?: { rocaNome?: string },
): void {
  const { periodo, cards, colunas, linhas: rows } = data;
  const numCols = 1 + colunas.length;

  const metaRows: string[] = [
    `<tr><td class="titulo" colspan="${numCols}">Fluxo de Caixa — ${escapeHtml(periodo.inicio)} a ${escapeHtml(periodo.fim)}</td></tr>`,
  ];
  if (options?.rocaNome) {
    metaRows.push(
      `<tr><td class="meta" colspan="${numCols}">Roça: ${escapeHtml(options.rocaNome)}</td></tr>`,
    );
  }
  metaRows.push('<tr><td colspan="' + numCols + '"></td></tr>');
  metaRows.push(
    `<tr><td class="meta">Saldo inicial</td><td class="num meta-valor" colspan="${numCols - 1}">${escapeHtml(fmtMoeda(cards.saldo_inicial))}</td></tr>`,
    `<tr><td class="meta">Total a receber</td><td class="num meta-valor verde" colspan="${numCols - 1}">${escapeHtml(fmtMoeda(cards.total_a_receber))}</td></tr>`,
    `<tr><td class="meta">Total a pagar</td><td class="num meta-valor vermelho" colspan="${numCols - 1}">${escapeHtml(fmtMoeda(cards.total_a_pagar))}</td></tr>`,
    `<tr><td class="meta">Saldo projetado</td><td class="num meta-valor" colspan="${numCols - 1}">${escapeHtml(fmtMoeda(cards.saldo_projetado))}</td></tr>`,
    `<tr><td colspan="${numCols}"></td></tr>`,
  );

  const cabecalhoCols = colunas
    .map(
      (c) =>
        `<th>${escapeHtml(c.label)}<br/><span class="weekday">${escapeHtml(c.weekday)}</span></th>`,
    )
    .join('');
  const cabecalho = `<tr><th class="col-label">Centro de custo / Categoria</th>${cabecalhoCols}</tr>`;

  const bodyRows = rows
    .map((row) => {
      const cls = classeLinha(row.tipo);
      const indent = row.indent ? ' indent' : '';
      const label = escapeHtml(row.label);

      if (row.tipo === 'secao') {
        return `<tr class="${cls}"><td class="col-label" colspan="${numCols}">${label}</td></tr>`;
      }

      const cells = row.valores
        .map((v) => `<td class="num">${escapeHtml(fmtValor(v))}</td>`)
        .join('');

      return `<tr class="${cls}"><td class="col-label${indent}">${label}</td>${cells}</tr>`;
    })
    .join('');

  const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:x="urn:schemas-microsoft-com:office:excel"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8"/>
<!--[if gte mso 9]><xml>
<x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
<x:Name>Fluxo de Caixa</x:Name>
<x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
</x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook>
</xml><![endif]-->
<style>
  table { border-collapse: collapse; font-family: Calibri, Arial, sans-serif; font-size: 11pt; }
  td, th { border: 1px solid #cbd5e1; padding: 6px 8px; vertical-align: middle; white-space: nowrap; }
  th { background: #003366; color: #ffffff; font-weight: bold; text-align: center; }
  th .weekday { font-size: 9pt; font-weight: normal; opacity: 0.9; }
  .col-label { min-width: 220px; width: 220px; text-align: left; background: #f8fafc; }
  .col-label.indent { padding-left: 24px; }
  td.num, th:not(.col-label) { min-width: 88px; width: 88px; text-align: right; }
  .titulo { font-size: 14pt; font-weight: bold; color: #003366; border: none; padding: 8px 4px 12px; }
  .meta { font-weight: 600; color: #334155; border: none; background: transparent; }
  .meta-valor { font-weight: 600; border: none; background: transparent; }
  .meta-valor.verde { color: #047857; }
  .meta-valor.vermelho { color: #be123c; }
  tr.secao td { background: #e2e8f0; font-weight: bold; color: #1e293b; }
  tr.subtotal td { background: #fff1f2; font-weight: bold; color: #be123c; }
  tr.saldo-dia td { background: #f1f5f9; font-weight: bold; }
  tr.saldo-acumulado td { background: #e0f2fe; font-weight: bold; color: #003366; }
</style>
</head>
<body>
<table>
<colgroup>
<col style="width:220px"/>
${colunas.map(() => '<col style="width:88px"/>').join('')}
</colgroup>
<tbody>
${metaRows.join('\n')}
${cabecalho}
${bodyRows}
</tbody>
</table>
</body>
</html>`;

  const blob = new Blob([html], {
    type: 'application/vnd.ms-excel;charset=utf-8',
  });
  const nomeArquivo = `fluxo-caixa_${periodo.inicio}_${periodo.fim}.xls`;
  downloadBlob(blob, nomeArquivo);
}
