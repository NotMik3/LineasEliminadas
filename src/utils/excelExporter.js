import * as XLSX from 'xlsx';
import { summarizeComments } from './lneProcessor';

function buildSheet(title, rows, includeUda = false) {
  const aoa = [
    [title],
    [],
    ['CONTROL Y SEGUIMIENTO'],
    [],
  ];

  const headers = includeUda
    ? ['Item', 'Producto', 'Pivote', 'Paqexist', 'UDA', 'Suma de Total', 'Comentario']
    : ['Item', 'Producto', 'pivote', 'Paqexist', 'Suma de Total', 'Comentario'];

  aoa.push(headers);

  let grandTotal = 0;
  for (const r of rows) {
    grandTotal += r.sumaTotal;
    if (includeUda) {
      aoa.push([r.item, r.producto, r.pivote, r.paqexist, r.uda || '', r.sumaTotal, r.comentario || '']);
    } else {
      aoa.push([r.item, r.producto, r.pivote, r.paqexist, r.sumaTotal, r.comentario || '']);
    }
  }

  if (includeUda) {
    aoa.push(['Total general', '', '', '', '', grandTotal, '']);
  } else {
    aoa.push(['Total general', '', '', '', grandTotal, '']);
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 1, c: 8 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 8 } },
  ];

  const summary = summarizeComments(rows);
  if (summary.length > 0) {
    XLSX.utils.sheet_add_aoa(
      ws,
      [
        ['Comentario', 'Total Ítems'],
        ...summary.map((s) => [s.comentario, s.totalItems]),
      ],
      { origin: 'K5' }
    );
  }

  ws['!cols'] = includeUda
    ? [
        { wch: 14 },
        { wch: 38 },
        { wch: 14 },
        { wch: 12 },
        { wch: 10 },
        { wch: 15 },
        { wch: 28 },
        { wch: 4 },
        { wch: 4 },
        { wch: 4 },
        { wch: 24 },
        { wch: 14 },
      ]
    : [
        { wch: 14 },
        { wch: 38 },
        { wch: 14 },
        { wch: 12 },
        { wch: 15 },
        { wch: 28 },
        { wch: 4 },
        { wch: 4 },
        { wch: 4 },
        { wch: 4 },
        { wch: 24 },
        { wch: 14 },
      ];

  return ws;
}

export function exportLneWorkbook(reports) {
  const wb = XLSX.utils.book_new();

  const wsPiezas = buildSheet(
    'REPORTE DE PRÓXIMOS A CERO (PIEZAS) | OXXO CEDIS SALTILLO',
    reports.piezas,
    false
  );
  const wsRefri = buildSheet(
    'REPORTE DE PRÓXIMOS A CERO (REFRI) | OXXO CEDIS SALTILLO',
    reports.refri,
    true
  );
  const wsCajas = buildSheet(
    'REPORTE DE PRÓXIMOS A CERO (CAJAS) | OXXO CEDIS SALTILLO',
    reports.cajas,
    false
  );

  XLSX.utils.book_append_sheet(wb, wsPiezas, 'LNE PIEZAS');
  XLSX.utils.book_append_sheet(wb, wsRefri, 'LNE REFRI');
  XLSX.utils.book_append_sheet(wb, wsCajas, 'LNE CAJAS');

  const today = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `Reporte_LNE_${today}.xlsx`);
}
