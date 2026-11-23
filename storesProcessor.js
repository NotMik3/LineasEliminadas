import * as XLSX from 'xlsx';

/**
 * Convierte fechas seriales de Excel, Date o texto a un formato limpio YYYY-MM-DD (o conserva texto descriptivo)
 */
function formatExcelDateValue(val) {
  if (val === null || val === undefined || val === '') return '';

  if (val instanceof Date && !isNaN(val)) {
    return val.toISOString().slice(0, 10);
  }

  if (typeof val === 'number' && val > 20000 && val < 90000) {
    const utcDays = Math.floor(val - 25569);
    const d = new Date(utcDays * 86400 * 1000);
    if (!isNaN(d)) {
      return d.toISOString().slice(0, 10);
    }
  }

  return String(val).trim();
}

/**
 * Calcula los días transcurridos desde FECHA DE AVISO hasta hoy si es fecha válida
 */
function computeElapsedDays(rawFechaAviso, rawDiasCol) {
  if (typeof rawDiasCol === 'number' && !isNaN(rawDiasCol) && rawDiasCol < 10000) {
    return Math.max(0, Math.round(rawDiasCol));
  }

  const formatted = formatExcelDateValue(rawFechaAviso);
  if (/^\d{4}-\d{2}-\d{2}$/.test(formatted)) {
    const [y, m, d] = formatted.split('-').map(Number);
    const start = new Date(y, m - 1, d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.floor((today - start) / (1000 * 60 * 60 * 24));
    if (!isNaN(diff) && diff >= 0 && diff < 10000) {
      return diff;
    }
  }

  return null;
}

/**
 * Procesa el archivo Excel de Tiendas Cerradas y Aperturas.
 * Nota: Ignora intencionalmente la pestaña "TIENDAS SIN CERVEZA" del Excel,
 * ya que ese listado se administra manualmente desde la interfaz web.
 */
export function parseStoresWorkbook(workbook) {
  const closedSheetName = workbook.SheetNames.find(
    (name) => name.trim().toUpperCase() === 'TIENDAS CERRADAS'
  );
  const openingsSheetName = workbook.SheetNames.find(
    (name) => name.trim().toUpperCase() === 'APERTURAS'
  );

  if (!closedSheetName && !openingsSheetName) {
    throw new Error(
      "No se encontraron las pestañas 'TIENDAS CERRADAS' ni 'APERTURAS' en el archivo Excel."
    );
  }

  // 1. Parsear TIENDAS CERRADAS (Encabezados en fila 1 -> índice 0)
  const closedStores = [];
  if (closedSheetName) {
    const ws = workbook.Sheets[closedSheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

    // Buscar fila de encabezados donde aparezca RETEK o PLAZA
    let headerIdx = 0;
    for (let i = 0; i < Math.min(5, rows.length); i++) {
      const rowUpper = (rows[i] || []).map((c) => String(c).trim().toUpperCase());
      if (rowUpper.includes('RETEK') || rowUpper.includes('TIENDA')) {
        headerIdx = i;
        break;
      }
    }

    for (let i = headerIdx + 1; i < rows.length; i++) {
      const r = rows[i] || [];
      const plaza = String(r[0] ?? '').trim();
      const retekRaw = r[1];
      const retek =
        typeof retekRaw === 'number' ? String(Math.round(retekRaw)) : String(retekRaw ?? '').trim();
      const tienda = String(r[2] ?? '').trim();
      const fechaAviso = formatExcelDateValue(r[3]);
      const notifico = String(r[4] ?? '').trim();
      const comentario = String(r[5] ?? '').trim() || 'SIN COMENTARIO';
      const diasTranscurridos = computeElapsedDays(r[3], r[6]);

      if (!plaza && !retek && !tienda) continue;

      closedStores.push({
        id: `closed_${i}_${retek || tienda}`,
        plaza: plaza || 'SIN PLAZA',
        retek,
        tienda,
        fechaAviso,
        notifico: notifico || 'Sin especificar',
        comentario,
        diasTranscurridos,
      });
    }
  }

  // 2. Parsear APERTURAS (Título en fila 1, encabezados en fila 2 -> índice 1)
  const openings = [];
  if (openingsSheetName) {
    const ws = workbook.Sheets[openingsSheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

    let headerIdx = 1;
    for (let i = 0; i < Math.min(5, rows.length); i++) {
      const rowUpper = (rows[i] || []).map((c) => String(c).trim().toUpperCase());
      if (rowUpper.includes('RETEK') || rowUpper.includes('ESTATUS')) {
        headerIdx = i;
        break;
      }
    }

    for (let i = headerIdx + 1; i < rows.length; i++) {
      const r = rows[i] || [];
      const plaza = String(r[0] ?? '').trim();
      const retekRaw = r[1];
      const retek =
        typeof retekRaw === 'number' ? String(Math.round(retekRaw)) : String(retekRaw ?? '').trim();
      const tienda = String(r[2] ?? '').trim();
      const fechaAviso = formatExcelDateValue(r[3]);
      const notifico = String(r[4] ?? '').trim();
      const entregaEnTienda = formatExcelDateValue(r[5]);
      const fechaApertura = formatExcelDateValue(r[6]);
      const estatusRaw = String(r[7] ?? '').trim().toUpperCase();
      const mes = String(r[8] ?? '').trim().toUpperCase();
      const anioRaw = r[9];
      const anio =
        typeof anioRaw === 'number' && !isNaN(anioRaw)
          ? String(Math.round(anioRaw))
          : String(anioRaw ?? '').trim();
      const comentarios = String(r[10] ?? '').trim();

      if (!plaza && !retek && !tienda) continue;

      openings.push({
        id: `open_${i}_${retek || tienda}`,
        plaza: plaza || 'SIN PLAZA',
        retek,
        tienda,
        fechaAviso,
        notifico: notifico || 'Sin especificar',
        entregaEnTienda,
        fechaApertura,
        estatus: estatusRaw || 'PENDIENTE',
        mes,
        anio,
        comentarios,
      });
    }
  }

  return {
    closedStores,
    openings,
  };
}

/**
 * Exporta a Excel las Tiendas Cerradas, Aperturas Programadas y el catálogo manual de Tiendas Sin Cerveza
 */
export function exportStoresWorkbook({ closedStores = [], openings = [], noBeerStores = [] }) {
  const wb = XLSX.utils.book_new();

  // Hoja 1: TIENDAS CERRADAS
  const closedAoa = [
    ['PLAZA', 'RETEK', 'TIENDA', 'FECHA DE AVISO', 'NOTIFICO', 'COMENTARIO', 'DIAS TRANSCURRIDOS'],
    ...closedStores.map((s) => [
      s.plaza,
      s.retek,
      s.tienda,
      s.fechaAviso,
      s.notifico,
      s.comentario,
      s.diasTranscurridos ?? '',
    ]),
  ];
  const wsClosed = XLSX.utils.aoa_to_sheet(closedAoa);
  wsClosed['!cols'] = [
    { wch: 12 },
    { wch: 12 },
    { wch: 28 },
    { wch: 16 },
    { wch: 20 },
    { wch: 36 },
    { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, wsClosed, 'TIENDAS CERRADAS');

  // Hoja 2: APERTURAS
  const openingsAoa = [
    [
      'PLAZA',
      'RETEK',
      'TIENDA',
      'FECHA AVISO',
      'NOTIFICO',
      'ENTREGA EN TIENDA',
      'FECHA DE APERTURA',
      'ESTATUS',
      'MES',
      'AÑO',
      'COMENTARIOS',
    ],
    ...openings.map((o) => [
      o.plaza,
      o.retek,
      o.tienda,
      o.fechaAviso,
      o.notifico,
      o.entregaEnTienda,
      o.fechaApertura,
      o.estatus,
      o.mes,
      o.anio,
      o.comentarios,
    ]),
  ];
  const wsOpenings = XLSX.utils.aoa_to_sheet(openingsAoa);
  wsOpenings['!cols'] = [
    { wch: 12 },
    { wch: 12 },
    { wch: 28 },
    { wch: 24 },
    { wch: 18 },
    { wch: 24 },
    { wch: 24 },
    { wch: 16 },
    { wch: 14 },
    { wch: 10 },
    { wch: 32 },
  ];
  XLSX.utils.book_append_sheet(wb, wsOpenings, 'APERTURAS');

  // Hoja 3: TIENDAS SIN CERVEZA (Lista personalizada desde la app)
  const noBeerAoa = [
    ['PLAZA', 'RETEK', 'TIENDA', 'MOTIVO / OBSERVACIÓN'],
    ...noBeerStores.map((b) => [b.plaza, b.retek, b.tienda, b.motivo]),
  ];
  const wsNoBeer = XLSX.utils.aoa_to_sheet(noBeerAoa);
  wsNoBeer['!cols'] = [{ wch: 14 }, { wch: 14 }, { wch: 30 }, { wch: 36 }];
  XLSX.utils.book_append_sheet(wb, wsNoBeer, 'TIENDAS SIN CERVEZA');

  const today = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `Tiendas_Cerradas_y_Aperturas_${today}.xlsx`);
}
