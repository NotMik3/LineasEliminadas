import React, { useState, useMemo } from 'react';
import {
  Search,
  BarChart3,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  CheckSquare,
  XCircle,
  Users,
  Clock,
} from 'lucide-react';
import {
  summarizeComments,
  summarizeOperacionUsers,
  DEFAULT_COMMENTS_CATALOG,
  isOperacionComment,
} from '../utils/lneProcessor';
import { SHIFT_OPTIONS } from '../utils/shiftUtils';

const BAR_COLORS = [
  'bg-oxxoRed',
  'bg-amber-500',
  'bg-slate-700',
  'bg-emerald-600',
  'bg-blue-600',
  'bg-purple-600',
  'bg-rose-500',
];

export default function ReportTable({
  title,
  rows,
  includeUda = false,
  commentsCatalog = DEFAULT_COMMENTS_CATALOG,
  selectedShiftId = 'ALL',
  onSelectShift,
  shiftCounts = {},
  onUpdateComment,
  onBulkUpdateComments,
}) {
  const [search, setSearch] = useState('');
  const [showSummary, setShowSummary] = useState(true);

  const [sortConfig, setSortConfig] = useState({
    key: 'sumaTotal',
    direction: 'desc',
  });

  const [colFilters, setColFilters] = useState({
    item: '',
    producto: '',
    pivote: '',
    paqexist: '',
    uda: '',
    comentario: '',
  });
  const [showColumnFilters, setShowColumnFilters] = useState(true);

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkComment, setBulkComment] = useState('');

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: key === 'sumaTotal' ? 'desc' : 'asc' };
    });
  };

  const handleColFilterChange = (col, value) => {
    setColFilters((prev) => ({ ...prev, [col]: value }));
  };

  const clearAllFilters = () => {
    setSearch('');
    setColFilters({
      item: '',
      producto: '',
      pivote: '',
      paqexist: '',
      uda: '',
      comentario: '',
    });
  };

  const hasActiveFilters =
    search.trim() !== '' || Object.values(colFilters).some((v) => v.trim() !== '');

  const processedRows = useMemo(() => {
    const q = search.trim().toLowerCase();

    const filtered = rows.filter((r) => {
      if (q) {
        const userNames = Object.keys(r.userBreakdown || {}).join(' ').toLowerCase();
        const matchesGlobal =
          r.item.toLowerCase().includes(q) ||
          r.producto.toLowerCase().includes(q) ||
          r.pivote.toLowerCase().includes(q) ||
          (r.uda && r.uda.toLowerCase().includes(q)) ||
          (r.comentario && r.comentario.toLowerCase().includes(q)) ||
          userNames.includes(q);
        if (!matchesGlobal) return false;
      }

      if (colFilters.item && !r.item.toLowerCase().includes(colFilters.item.toLowerCase())) {
        return false;
      }
      if (
        colFilters.producto &&
        !r.producto.toLowerCase().includes(colFilters.producto.toLowerCase())
      ) {
        return false;
      }
      if (colFilters.pivote && !r.pivote.toLowerCase().includes(colFilters.pivote.toLowerCase())) {
        return false;
      }
      if (
        colFilters.paqexist &&
        !String(r.paqexist).toLowerCase().includes(colFilters.paqexist.toLowerCase())
      ) {
        return false;
      }
      if (includeUda && colFilters.uda) {
        if (colFilters.uda === '__SIN_UDA__' && r.uda) return false;
        if (colFilters.uda !== '__SIN_UDA__' && r.uda !== colFilters.uda) return false;
      }
      if (colFilters.comentario) {
        if (colFilters.comentario === '__SIN_COMENTARIO__' && r.comentario) return false;
        if (
          colFilters.comentario !== '__SIN_COMENTARIO__' &&
          r.comentario !== colFilters.comentario
        ) {
          return false;
        }
      }

      return true;
    });

    if (!sortConfig.key) return filtered;

    return [...filtered].sort((a, b) => {
      const { key, direction } = sortConfig;
      const mult = direction === 'asc' ? 1 : -1;

      if (key === 'sumaTotal' || key === 'paqexist') {
        const numA = parseFloat(a[key]) || 0;
        const numB = parseFloat(b[key]) || 0;
        if (numA !== numB) return (numA - numB) * mult;
      }

      const strA = String(a[key] ?? '').toLowerCase();
      const strB = String(b[key] ?? '').toLowerCase();
      return strA.localeCompare(strB, 'es', { numeric: true }) * mult;
    });
  }, [rows, search, colFilters, sortConfig, includeUda]);

  const grandTotal = useMemo(
    () => processedRows.reduce((acc, r) => acc + r.sumaTotal, 0),
    [processedRows]
  );

  const { list: commentSummary, sinComentario } = useMemo(
    () => summarizeComments(rows),
    [rows]
  );

  // Gráfica especial cuando se detecta "Operacion"
  const { users: operacionUsers, matchingLinesCount: operacionLinesCount } = useMemo(
    () => summarizeOperacionUsers(rows),
    [rows]
  );

  const maxChartCount = useMemo(() => {
    if (commentSummary.length === 0) return 1;
    return Math.max(...commentSummary.map((c) => c.totalItems));
  }, [commentSummary]);

  const maxUserLinesCount = useMemo(() => {
    if (operacionUsers.length === 0) return 1;
    return Math.max(...operacionUsers.map((u) => u.lineas));
  }, [operacionUsers]);

  const allVisibleSelected =
    processedRows.length > 0 && processedRows.every((r) => selectedIds.has(r.id));

  const toggleSelectAllVisible = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        processedRows.forEach((r) => next.delete(r.id));
      } else {
        processedRows.forEach((r) => next.add(r.id));
      }
      return next;
    });
  };

  const toggleSelectRow = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const applyBulkComment = () => {
    if (selectedIds.size === 0) return;
    onBulkUpdateComments(Array.from(selectedIds), bulkComment);
    setSelectedIds(new Set());
  };

  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="w-3 h-3 opacity-45 inline ml-1" />;
    }
    return sortConfig.direction === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-oxxoYellow inline ml-1" />
    ) : (
      <ArrowDown className="w-3 h-3 text-oxxoYellow inline ml-1" />
    );
  };

  const allCommentOptions = useMemo(() => {
    const set = new Set(commentsCatalog);
    rows.forEach((r) => {
      if (r.comentario) set.add(r.comentario);
    });
    return Array.from(set);
  }, [commentsCatalog, rows]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl overflow-hidden shadow-sm border border-slate-200">
        <div className="bg-oxxoRed text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base md:text-lg font-bold tracking-wide">{title}</h2>
            <p className="text-xs text-red-100">CONTROL Y SEGUIMIENTO • CEDIS SALTILLO</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowColumnFilters((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg border transition ${
                showColumnFilters
                  ? 'bg-oxxoYellow text-slate-900 border-oxxoYellow'
                  : 'bg-white/15 hover:bg-white/25 text-white border-white/40'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              Filtros de columna
            </button>

            <button
              type="button"
              onClick={() => setShowSummary((prev) => !prev)}
              className="inline-flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white border border-white/40 text-xs font-bold px-3.5 py-2 rounded-lg transition"
            >
              <BarChart3 className="w-4 h-4" />
              {showSummary ? 'Ocultar Gráficas' : 'Ver Gráficas'}
            </button>
          </div>
        </div>

        {/* Selector rápido de Turno / Vista General */}
        <div className="bg-slate-800 text-white px-5 py-2 border-b border-slate-700 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-slate-300 font-semibold mr-1">
              <Clock className="w-3.5 h-3.5 text-oxxoYellow" />
              Vista de turno:
            </span>
            {SHIFT_OPTIONS.map((opt) => {
              const isActive = selectedShiftId === opt.id;
              const count = shiftCounts[opt.id] ?? 0;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onSelectShift(opt.id)}
                  className={`px-2.5 py-1 rounded-md font-bold transition ${
                    isActive
                      ? 'bg-oxxoYellow text-slate-900 shadow-sm'
                      : 'bg-slate-700/80 text-slate-200 hover:bg-slate-600'
                  }`}
                >
                  {opt.shortLabel}
                  {typeof shiftCounts[opt.id] === 'number' && (
                    <span
                      className={`ml-1.5 text-[10px] px-1.5 py-0.2 rounded-full ${
                        isActive ? 'bg-slate-900/15 text-slate-900' : 'bg-black/30 text-slate-300'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar ítem, producto, usuario..."
              className="w-full bg-white text-slate-800 rounded-md pl-8 pr-3 py-1 text-xs focus:outline-none"
            />
          </div>
        </div>

        {/* Sub-barra de métricas */}
        <div className="bg-oxxoDark text-white px-5 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <span>
              Mostrando: <strong className="text-oxxoYellow">{processedRows.length}</strong> de{' '}
              {rows.length} ítems
            </span>
            <span>
              Suma de Total:{' '}
              <strong className="text-oxxoYellow">{grandTotal.toLocaleString('es-MX')}</strong>
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="inline-flex items-center gap-1 text-amber-300 hover:text-white underline font-semibold"
              >
                <XCircle className="w-3.5 h-3.5" />
                Limpiar filtros
              </button>
            )}
          </div>

          {operacionLinesCount > 0 && (
            <span className="inline-flex items-center gap-1.5 bg-red-600/30 border border-red-400/40 text-amber-200 px-2.5 py-0.5 rounded font-semibold">
              <Users className="w-3.5 h-3.5 text-oxxoYellow" />
              {operacionLinesCount} {operacionLinesCount === 1 ? 'línea marcada' : 'líneas marcadas'} como &quot;Operacion&quot;
            </span>
          )}
        </div>
      </div>

      {/* Barra de asignación masiva de comentarios */}
      {selectedIds.size > 0 && (
        <div className="bg-amber-50 border-2 border-oxxoYellow rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <CheckSquare className="w-4 h-4 text-oxxoRed" />
            <span>
              {selectedIds.size}{' '}
              {selectedIds.size === 1 ? 'línea seleccionada' : 'líneas seleccionadas'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={bulkComment}
              onChange={(e) => setBulkComment(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-3 py-1.5 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-oxxoRed"
            >
              <option value="">-- Seleccionar comentario homologado (o limpiar) --</option>
              {allCommentOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={applyBulkComment}
              className="bg-oxxoRed hover:bg-red-700 text-white text-xs font-bold px-4 py-1.5 rounded-lg transition shadow-sm"
            >
              Aplicar a seleccionadas
            </button>

            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-2 py-1.5"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Grid: Tabla + Panel lateral de Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        <div
          className={`${
            showSummary ? 'lg:col-span-8' : 'lg:col-span-12'
          } bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden`}
        >
          <div className="overflow-x-auto max-h-[70vh]">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-oxxoDark text-white sticky top-0 z-10 select-none">
                <tr>
                  <th className="py-2.5 px-2.5 w-8 text-center">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleSelectAllVisible}
                      title="Seleccionar todas las filas visibles"
                      className="rounded border-slate-400 text-oxxoRed focus:ring-oxxoRed cursor-pointer"
                    />
                  </th>
                  <th
                    onClick={() => handleSort('item')}
                    className="py-2.5 px-3 font-bold cursor-pointer hover:bg-slate-700 whitespace-nowrap"
                  >
                    Item {renderSortIcon('item')}
                  </th>
                  <th
                    onClick={() => handleSort('producto')}
                    className="py-2.5 px-3 font-bold cursor-pointer hover:bg-slate-700"
                  >
                    Producto {renderSortIcon('producto')}
                  </th>
                  <th
                    onClick={() => handleSort('pivote')}
                    className="py-2.5 px-3 font-bold cursor-pointer hover:bg-slate-700 whitespace-nowrap"
                  >
                    Pivote {renderSortIcon('pivote')}
                  </th>
                  <th
                    onClick={() => handleSort('paqexist')}
                    className="py-2.5 px-3 font-bold text-right cursor-pointer hover:bg-slate-700 whitespace-nowrap"
                  >
                    Paqexist {renderSortIcon('paqexist')}
                  </th>
                  {includeUda && (
                    <th
                      onClick={() => handleSort('uda')}
                      className="py-2.5 px-3 font-bold text-center cursor-pointer hover:bg-slate-700 whitespace-nowrap"
                    >
                      UDA {renderSortIcon('uda')}
                    </th>
                  )}
                  <th
                    onClick={() => handleSort('sumaTotal')}
                    className="py-2.5 px-3 font-bold text-right cursor-pointer hover:bg-slate-700 whitespace-nowrap"
                  >
                    Suma Total {renderSortIcon('sumaTotal')}
                  </th>
                  <th
                    onClick={() => handleSort('comentario')}
                    className="py-2.5 px-3 font-bold w-60 cursor-pointer hover:bg-slate-700"
                  >
                    Comentario {renderSortIcon('comentario')}
                  </th>
                </tr>

                {showColumnFilters && (
                  <tr className="bg-slate-800 border-t border-slate-600">
                    <th className="p-1.5"></th>
                    <th className="p-1.5">
                      <input
                        type="text"
                        value={colFilters.item}
                        onChange={(e) => handleColFilterChange('item', e.target.value)}
                        placeholder="Filtrar..."
                        className="w-full bg-white text-slate-800 rounded px-2 py-1 text-[11px] font-normal focus:outline-none"
                      />
                    </th>
                    <th className="p-1.5">
                      <input
                        type="text"
                        value={colFilters.producto}
                        onChange={(e) => handleColFilterChange('producto', e.target.value)}
                        placeholder="Filtrar producto..."
                        className="w-full bg-white text-slate-800 rounded px-2 py-1 text-[11px] font-normal focus:outline-none"
                      />
                    </th>
                    <th className="p-1.5">
                      <input
                        type="text"
                        value={colFilters.pivote}
                        onChange={(e) => handleColFilterChange('pivote', e.target.value)}
                        placeholder="Pasillo..."
                        className="w-full bg-white text-slate-800 rounded px-2 py-1 text-[11px] font-normal focus:outline-none"
                      />
                    </th>
                    <th className="p-1.5">
                      <input
                        type="text"
                        value={colFilters.paqexist}
                        onChange={(e) => handleColFilterChange('paqexist', e.target.value)}
                        placeholder="Exist..."
                        className="w-full bg-white text-slate-800 rounded px-2 py-1 text-[11px] font-normal text-right focus:outline-none"
                      />
                    </th>
                    {includeUda && (
                      <th className="p-1.5">
                        <select
                          value={colFilters.uda}
                          onChange={(e) => handleColFilterChange('uda', e.target.value)}
                          className="w-full bg-white text-slate-800 rounded px-1.5 py-1 text-[11px] font-normal focus:outline-none"
                        >
                          <option value="">Todos</option>
                          <option value="UDA5">UDA5</option>
                          <option value="__SIN_UDA__">Sin UDA</option>
                        </select>
                      </th>
                    )}
                    <th className="p-1.5"></th>
                    <th className="p-1.5">
                      <select
                        value={colFilters.comentario}
                        onChange={(e) => handleColFilterChange('comentario', e.target.value)}
                        className="w-full bg-white text-slate-800 rounded px-1.5 py-1 text-[11px] font-normal focus:outline-none"
                      >
                        <option value="">Todos los comentarios</option>
                        <option value="__SIN_COMENTARIO__">-- Sin comentario --</option>
                        {allCommentOptions.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </th>
                  </tr>
                )}
              </thead>

              <tbody className="divide-y divide-slate-200">
                {processedRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={includeUda ? 8 : 7}
                      className="py-10 text-center text-slate-400 text-sm"
                    >
                      No hay registros para el turno o filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  processedRows.map((row) => {
                    const isSelected = selectedIds.has(row.id);
                    const isOperacion = isOperacionComment(row.comentario);
                    const rowUsers = Object.entries(row.userBreakdown || {});

                    return (
                      <tr
                        key={row.id}
                        className={`transition-colors ${
                          isSelected
                            ? 'bg-amber-50/80'
                            : isOperacion
                            ? 'bg-red-50/40 hover:bg-red-50/70'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-2 px-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectRow(row.id)}
                            className="rounded border-slate-300 text-oxxoRed focus:ring-oxxoRed cursor-pointer"
                          />
                        </td>
                        <td className="py-2 px-3 font-mono font-semibold text-slate-800 whitespace-nowrap">
                          {row.item}
                        </td>
                        <td className="py-2 px-3 text-slate-700">
                          <div>{row.producto}</div>
                          {isOperacion && rowUsers.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {rowUsers.map(([usr, cnt]) => (
                                <span
                                  key={usr}
                                  className="inline-flex items-center gap-1 text-[10px] font-semibold bg-red-100 text-red-800 px-1.5 py-0.5 rounded"
                                >
                                  <Users className="w-2.5 h-2.5" />
                                  {usr} ({cnt})
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-600 whitespace-nowrap">
                          {row.pivote}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-slate-700">
                          {row.paqexist}
                        </td>
                        {includeUda && (
                          <td className="py-2 px-3 text-center">
                            {row.uda ? (
                              <span className="inline-block bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded text-[11px]">
                                {row.uda}
                              </span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                        )}
                        <td className="py-2 px-3 text-right font-bold text-slate-900">
                          {row.sumaTotal.toLocaleString('es-MX')}
                        </td>
                        <td className="py-1.5 px-3">
                          <select
                            value={row.comentario}
                            onChange={(e) => onUpdateComment(row.id, e.target.value)}
                            className={`w-full border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-oxxoRed ${
                              isOperacion
                                ? 'border-oxxoRed bg-red-50 text-oxxoRed font-bold'
                                : row.comentario
                                ? 'border-emerald-300 bg-emerald-50/50 text-slate-800 font-medium'
                                : 'border-slate-200 bg-white text-slate-500'
                            }`}
                          >
                            <option value="">-- Seleccionar motivo --</option>
                            {allCommentOptions.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {processedRows.length > 0 && (
                <tfoot className="bg-slate-100 font-bold text-slate-800 border-t-2 border-slate-300">
                  <tr>
                    <td></td>
                    <td colSpan={includeUda ? 5 : 4} className="py-2.5 px-3">
                      Total general
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {grandTotal.toLocaleString('es-MX')}
                    </td>
                    <td className="py-2.5 px-3"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Panel lateral: Gráfica de Comentarios + Gráfica de Usuarios ("Operacion") */}
        {showSummary && (
          <div className="lg:col-span-4 space-y-4">
            {/* Tarjeta 1: Gráfica por Comentario */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-oxxoDark text-white px-4 py-2.5 flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-oxxoYellow" />
                  Gráfica por Comentario
                </span>
                <span className="text-[11px] font-normal text-slate-300">
                  {rows.length - sinComentario}/{rows.length} clasificados
                </span>
              </div>

              <div className="p-4 space-y-4">
                {commentSummary.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400">
                    Selecciona comentarios en la tabla (individual o masivamente) para generar la
                    gráfica automáticamente.
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {commentSummary.map((item, idx) => {
                        const pctOfMax = Math.round((item.totalItems / maxChartCount) * 100);
                        const pctOfTotal =
                          rows.length > 0 ? ((item.totalItems / rows.length) * 100).toFixed(1) : 0;
                        const barColor = isOperacionComment(item.comentario)
                          ? 'bg-oxxoRed'
                          : BAR_COLORS[(idx + 1) % BAR_COLORS.length];

                        return (
                          <div key={item.comentario} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-slate-700 truncate pr-2">
                                {item.comentario}
                              </span>
                              <span className="font-bold text-slate-900 whitespace-nowrap">
                                {item.totalItems}{' '}
                                <span className="text-[11px] font-normal text-slate-500">
                                  ({pctOfTotal}%)
                                </span>
                              </span>
                            </div>
                            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${barColor} rounded-full transition-all duration-300`}
                                style={{ width: `${Math.max(pctOfMax, 6)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="pt-3 border-t border-slate-200">
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500">
                            <th className="py-1.5 px-2 text-left font-semibold">Motivo</th>
                            <th className="py-1.5 px-2 text-right font-semibold">Ítems</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {commentSummary.map((item) => (
                            <tr
                              key={item.comentario}
                              onClick={() =>
                                handleColFilterChange(
                                  'comentario',
                                  colFilters.comentario === item.comentario ? '' : item.comentario
                                )
                              }
                              title="Clic para filtrar la tabla por este comentario"
                              className="cursor-pointer hover:bg-slate-50"
                            >
                              <td className="py-1.5 px-2 text-slate-700">{item.comentario}</td>
                              <td className="py-1.5 px-2 text-right font-bold text-oxxoRed">
                                {item.totalItems}
                              </td>
                            </tr>
                          ))}
                          {sinComentario > 0 && (
                            <tr
                              onClick={() =>
                                handleColFilterChange(
                                  'comentario',
                                  colFilters.comentario === '__SIN_COMENTARIO__'
                                    ? ''
                                    : '__SIN_COMENTARIO__'
                                )
                              }
                              className="cursor-pointer hover:bg-slate-50 text-slate-400 italic"
                            >
                              <td className="py-1.5 px-2">Sin comentario asignado</td>
                              <td className="py-1.5 px-2 text-right font-semibold">
                                {sinComentario}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Tarjeta 2: Gráfica de Usuarios cuando se detecta el comentario "Operacion" */}
            {operacionUsers.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border-2 border-oxxoRed/80 overflow-hidden">
                <div className="bg-oxxoRed text-white px-4 py-2.5 flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-oxxoYellow" />
                    Usuarios con &quot;Operacion&quot;
                  </span>
                  <span className="bg-black/25 px-2 py-0.5 rounded text-[11px]">
                    {operacionLinesCount} {operacionLinesCount === 1 ? 'línea' : 'líneas'}
                  </span>
                </div>

                <div className="p-4 space-y-4">
                  <p className="text-[11px] text-slate-500">
                    Acumulado de líneas eliminadas por usuario asignadas a Operacion:
                  </p>

                  {/* Barras por usuario */}
                  <div className="space-y-3">
                    {operacionUsers.map((u) => {
                      const pctOfMax = Math.round((u.lineas / maxUserLinesCount) * 100);
                      return (
                        <div key={u.usuario} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-800 truncate pr-2">
                              {u.usuario}
                            </span>
                            <span className="font-bold text-oxxoRed whitespace-nowrap">
                              {u.lineas} {u.lineas === 1 ? 'línea' : 'líneas'}{' '}
                              <span className="text-[11px] font-normal text-slate-500">
                                ({u.eventos} reg.)
                              </span>
                            </span>
                          </div>
                          <div className="w-full h-3 bg-red-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-oxxoRed rounded-full transition-all duration-300"
                              style={{ width: `${Math.max(pctOfMax, 8)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Tabla resumen por usuario */}
                  <div className="pt-3 border-t border-slate-200">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500">
                          <th className="py-1.5 px-2 text-left font-semibold">Usuario</th>
                          <th className="py-1.5 px-2 text-right font-semibold">Líneas</th>
                          <th className="py-1.5 px-2 text-right font-semibold">Total Reg.</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {operacionUsers.map((u) => (
                          <tr
                            key={u.usuario}
                            onClick={() => setSearch(search === u.usuario ? '' : u.usuario)}
                            title="Clic para filtrar la tabla por este usuario"
                            className="cursor-pointer hover:bg-red-50/60"
                          >
                            <td className="py-1.5 px-2 font-semibold text-slate-700">
                              {u.usuario}
                            </td>
                            <td className="py-1.5 px-2 text-right font-bold text-oxxoRed">
                              {u.lineas}
                            </td>
                            <td className="py-1.5 px-2 text-right text-slate-600">{u.eventos}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
