/**
 * Detecta el turno operativo en CEDIS Saltillo:
 * - 1er turno: 06:30 a 13:30
 * - 2do turno: 13:30 a 22:30
 * - 3er turno: 22:30 a 06:30
 */
export function getShiftFromDate(dateObj = new Date()) {
  const hours = dateObj.getHours();
  const minutes = dateObj.getMinutes();
  const totalMinutes = hours * 60 + minutes;

  const t1Start = 6 * 60 + 30;  // 06:30 -> 390
  const t2Start = 13 * 60 + 30; // 13:30 -> 810
  const t3Start = 22 * 60 + 30; // 22:30 -> 1350

  if (totalMinutes >= t1Start && totalMinutes < t2Start) {
    return {
      id: '1er Turno',
      label: '1er Turno (06:30 - 13:30)',
      shortLabel: '1er Turno',
      schedule: '06:30 a 13:30',
    };
  }

  if (totalMinutes >= t2Start && totalMinutes < t3Start) {
    return {
      id: '2do Turno',
      label: '2do Turno (13:30 - 22:30)',
      shortLabel: '2do Turno',
      schedule: '13:30 a 22:30',
    };
  }

  return {
    id: '3er Turno',
    label: '3er Turno (22:30 - 06:30)',
    shortLabel: '3er Turno',
    schedule: '22:30 a 06:30',
  };
}

/**
 * Intenta extraer una fecha/hora de la columna Fecha de los registros o usa la hora actual
 */
export function detectShiftFromRecords(records) {
  if (Array.isArray(records) && records.length > 0) {
    for (const r of records) {
      const raw = r.fecha;
      if (raw instanceof Date && !isNaN(raw)) {
        return { ...getShiftFromDate(raw), source: 'Archivo Excel' };
      }
      if (typeof raw === 'number' && raw > 20000) {
        const utcDays = Math.floor(raw - 25569);
        const utcValue = utcDays * 86400;
        const fractionalDay = raw - Math.floor(raw) + 0.0000001;
        const totalSeconds = Math.floor(86400 * fractionalDay);
        const dateInfo = new Date((utcValue + totalSeconds) * 1000);
        const localDate = new Date(
          dateInfo.getUTCFullYear(),
          dateInfo.getUTCMonth(),
          dateInfo.getUTCDate(),
          dateInfo.getUTCHours(),
          dateInfo.getUTCMinutes(),
          dateInfo.getUTCSeconds()
        );
        if (!isNaN(localDate)) {
          return { ...getShiftFromDate(localDate), source: 'Hora en archivo' };
        }
      }
      if (typeof raw === 'string' && raw.includes(':')) {
        const match = raw.match(/(\d{1,2}):(\d{2})/);
        if (match) {
          const d = new Date();
          d.setHours(parseInt(match[1], 10), parseInt(match[2], 10), 0, 0);
          return { ...getShiftFromDate(d), source: 'Hora en archivo' };
        }
      }
    }
  }

  return { ...getShiftFromDate(new Date()), source: 'Hora de carga' };
}
