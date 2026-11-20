import * as XLSX from 'xlsx';

export const DEFAULT_COMMENTS_CATALOG = [
  'En cero físico',
  'Reabasto pendiente',
  'Diferencia de inventario',
  'Ubicación bloqueada',
  'Merma / Dañado',
  'Pendiente de recibo',
  'Error de captura / sistema',
];

export const DEFAULT_CONFIG = {
  piezas: [],
  refri: [],
  cajas: [],
  uda5: [],
  commentsCatalog: DEFAULT_COMMENTS_CATALOG,
};

export function extractConfigFromWorkbook(workbook) {
  const configSheet = workbook.Sheets['Config'];
  if (!configSheet) return null;

  const rows = XLSX.utils.sheet_to_json(configSheet, { header: 1, defval: '' });
  const piezas = new Set();
  const refri = new Set();
  const cajas = new Set();
  const uda5 = new Set();

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] || [];
    const colA = String(row[0] ?? '').trim();
    const colB = String(row[1] ?? '').trim();
    const colC = String(row[2] ?? '').trim();
    const colD = String(row[3] ?? '').trim();

    if (colA) piezas.add(colA);
    if (colB) refri.add(colB);
    if (colC) cajas.add(colC);
    if (colD) uda5.add(colD);
  }

  return {
    piezas: Array.from(piezas),
    refri: Array.from(refri),
    cajas: Array.from(cajas),
    uda5: Array.from(uda5),
  };
}

export function parseBaseRecords(workbook) {
  const sheetName = workbook.Sheets['CancelacionPiezas']
    ? 'CancelacionPiezas'
    : workbook.SheetNames[0];

  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    throw new Error("No se encontró la hoja base 'CancelacionPiezas'.");
  }

  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  if (rows.length < 6) {
    throw new Error('La hoja no contiene datos a partir de la fila 6.');
  }

  const headerA5 = String(rows[4]?.[0] ?? '').trim().toLowerCase();
  const hasTotalCol = headerA5 === 'total';
  const offset = hasTotalCol ? 1 : 0;

  const records = [];
  for (let i = 5; i < rows.length; i++) {
    const r = rows[i] || [];
    const fecha = r[0 + offset] ?? '';
    const item = String(r[1 + offset] ?? '').trim();
    const paq = r[2 + offset] ?? '';
    const paqexist = String(r[3 + offset] ?? '').trim();
    const pivote = String(r[4 + offset] ?? '').trim();
    const producto = String(r[5 + offset] ?? '').trim();
    const usuario = String(r[6 + offset] ?? '').trim();

    if (!fecha && !item && !pivote) continue;

    records.push({
      total: 1,
      fecha,
      item,
      paq,
      paqexist,
      pivote,
      producto,
      usuario,
    });
  }

  return { records, sheetName };
}

function matchesAllowedAisle(pivote, allowedList) {
  if (!pivote || !allowedList || allowedList.length === 0) return false;
  const val = String(pivote).trim();
  return allowedList.some((prefix) => {
    const p = String(prefix).trim();
    return p !== '' && (val === p || val.startsWith(p));
  });
}

function aggregateReport(filteredRows, { includeUda = false, sortDescending = true } = {}) {
  const map = new Map();

  for (const row of filteredRows) {
    const key = includeUda
      ? `${row.item}||${row.producto}||${row.pivote}||${row.paqexist}||${row.uda}`
      : `${row.item}||${row.producto}||${row.pivote}||${row.paqexist}`;

    if (map.has(key)) {
      map.get(key).sumaTotal += 1;
    } else {
      map.set(key, {
        id: key,
        item: row.item,
        producto: row.producto,
        pivote: row.pivote,
        paqexist: row.paqexist,
        ...(includeUda ? { uda: row.uda } : {}),
        sumaTotal: 1,
        comentario: '',
      });
    }
  }

  const result = Array.from(map.values());

  if (sortDescending) {
    result.sort((a, b) => b.sumaTotal - a.sumaTotal);
  }

  return result;
}

export function runLneAnalysis(baseRecords, config) {
  const uda5Set = new Set((config.uda5 || []).map((x) => String(x).trim()));

  const rawPiezas = baseRecords.filter((r) => matchesAllowedAisle(r.pivote, config.piezas));
  const piezas = aggregateReport(rawPiezas, { includeUda: false, sortDescending: true });

  const rawRefri = baseRecords
    .filter((r) => matchesAllowedAisle(r.pivote, config.refri))
    .map((r) => ({
      ...r,
      uda: uda5Set.has(String(r.item).trim()) ? 'UDA5' : '',
    }));
  const refri = aggregateReport(rawRefri, { includeUda: true, sortDescending: false });

  const rawCajas = baseRecords.filter((r) => matchesAllowedAisle(r.pivote, config.cajas));
  const cajas = aggregateReport(rawCajas, { includeUda: false, sortDescending: true });

  return {
    piezas,
    refri,
    cajas,
    stats: {
      totalBase: baseRecords.length,
      piezasRows: rawPiezas.length,
      refriRows: rawRefri.length,
      cajasRows: rawCajas.length,
    },
  };
}

export function summarizeComments(reportRows) {
  const counts = new Map();
  let sinComentario = 0;

  for (const row of reportRows) {
    const c = String(row.comentario || '').trim();
    if (!c) {
      sinComentario += 1;
      continue;
    }
    counts.set(c, (counts.get(c) || 0) + 1);
  }

  const list = Array.from(counts.entries())
    .map(([comentario, totalItems]) => ({ comentario, totalItems }))
    .sort((a, b) => b.totalItems - a.totalItems);

  return { list, sinComentario };
}
