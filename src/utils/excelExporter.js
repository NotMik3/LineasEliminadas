import * as XLSX from 'xlsx';
import { summarizeComments, summarizeOperacionUsers } from './lneProcessor';

function buildSheet(title, cedisName, shiftLabel, rows, includeUda = false) {
  const aoa = [
    [title],
    [],
    [`CONTROL Y SEGUIMIENTO • ${cedisName} | ${shiftLabel || 'GENERAL'}`],
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

  const { list: summary } = summarizeComments(rows);
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

  const { users: operacionUsers } = summarizeOperacionUsers(rows);
  if (operacionUsers.length > 0) {
    const startRow = summary.length > 0 ? 5 + summary.length + 3 : 5;
    XLSX.utils.sheet_add_aoa(
      ws,
      [
        ['Usuario ("Operacion")', 'Líneas'],
        ...operacionUsers.map((u) => [u.usuario, u.lineas]),
      ],
      { origin: `K${startRow}` }
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

export function exportLneWorkbook(reports, cedisName = 'CEDIS SALTILLO', cedisCode = '', shiftLabel = '') {
  const wb = XLSX.utils.book_new();
  const cedisFull = cedisCode ? `${cedisName} (${cedisCode})` : cedisName;

  const wsPiezas = buildSheet(
    `LINEAS ELIMINADAS (PIEZAS) | ${cedisFull}`,
    cedisFull,
    shiftLabel,
    reports.piezas,
    false
  );
  const wsRefri = buildSheet(
    `LINEAS ELIMINADAS (REFRI) | ${cedisFull}`,
    cedisFull,
    shiftLabel,
    reports.refri,
    true
  );
  const wsCajas = buildSheet(
    `LINEAS ELIMINADAS (CAJAS) | ${cedisFull}`,
    cedisFull,
    shiftLabel,
    reports.cajas,
    false
  );

  XLSX.utils.book_append_sheet(wb, wsPiezas, 'LNE PIEZAS');
  XLSX.utils.book_append_sheet(wb, wsRefri, 'LNE REFRI');
  XLSX.utils.book_append_sheet(wb, wsCajas, 'LNE CAJAS');

  const today = new Date().toISOString().slice(0, 10);
  const safeSlug = (cedisCode || cedisName || 'CEDIS')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_');
  XLSX.writeFile(wb, `Lineas_Eliminadas_${safeSlug}_${today}.xlsx`);
}
