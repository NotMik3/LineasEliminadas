export const SHIFT_OPTIONS = [
  { id: 'ALL', label: 'General (Todos los turnos)', shortLabel: 'General', schedule: 'Todos' },
  { id: '1er Turno', label: '1er Turno (06:30 - 13:30)', shortLabel: '1er Turno', schedule: '06:30 a 13:30' },
  { id: '2do Turno', label: '2do Turno (13:30 - 22:30)', shortLabel: '2do Turno', schedule: '13:30 a 22:30' },
  { id: '3er Turno', label: '3er Turno (22:30 - 06:30)', shortLabel: '3er Turno', schedule: '22:30 a 06:30' },
];

export function getShiftFromDate(dateObj = new Date()) {
  const hours = dateObj.getHours();
  const minutes = dateObj.getMinutes();
  const totalMinutes = hours * 60 + minutes;

  const t1Start = 6 * 60 + 30;  // 06:30 -> 390
  const t2Start = 13 * 60 + 30; // 13:30 -> 810
  const t3Start = 22 * 60 + 30; // 22:30 -> 1350

  if (totalMinutes >= t1Start && totalMinutes < t2Start) {
    return SHIFT_OPTIONS[1];
  }

  if (totalMinutes >= t2Start && totalMinutes < t3Start) {
    return SHIFT_OPTIONS[2];
  }

  return SHIFT_OPTIONS[3];
}

export function getShiftFromExcelCell(rawFecha) {
  if (rawFecha instanceof Date && !isNaN(rawFecha)) {
    return getShiftFromDate(rawFecha);
  }

  if (typeof rawFecha === 'number' && rawFecha > 0) {
    const fractionalDay = rawFecha - Math.floor(rawFecha);
    if (fractionalDay > 0) {
      const totalSeconds = Math.round(86400 * fractionalDay);
      const hours = Math.floor(totalSeconds / 3600) % 24;
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const d = new Date();
      d.setHours(hours, minutes, 0, 0);
      return getShiftFromDate(d);
    }
  }

  if (typeof rawFecha === 'string' && rawFecha.includes(':')) {
    const match = rawFecha.match(/(\d{1,2}):(\d{2})/);
    if (match) {
      const d = new Date();
      d.setHours(parseInt(match[1], 10), parseInt(match[2], 10), 0, 0);
      return getShiftFromDate(d);
    }
  }

  return null;
}

export function detectDominantShift(records) {
  if (!Array.isArray(records) || records.length === 0) {
    return getShiftFromDate(new Date());
  }

  const counts = new Map();
  for (const r of records) {
    const shiftId = r.turno || getShiftFromExcelCell(r.fecha)?.id;
    if (shiftId && shiftId !== 'ALL') {
      counts.set(shiftId, (counts.get(shiftId) || 0) + 1);
    }
  }

  if (counts.size === 0) {
    return getShiftFromDate(new Date());
  }

  let bestId = null;
  let bestCount = -1;
  for (const [id, cnt] of counts.entries()) {
    if (cnt > bestCount) {
      bestId = id;
      bestCount = cnt;
    }
  }

  return SHIFT_OPTIONS.find((s) => s.id === bestId) || getShiftFromDate(new Date());
}
