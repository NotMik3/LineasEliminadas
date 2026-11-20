import React, { useState, useMemo } from 'react';
import { Search, BarChart3, MessageSquare } from 'lucide-react';
import { summarizeComments } from '../utils/lneProcessor';

const QUICK_COMMENTS = [
  'En cero físico',
  'Reabasto pendiente',
  'Diferencia de inventario',
  'Ubicación bloqueada',
  'Merma / Dañado',
];

export default function ReportTable({ title, rows, includeUda = false, onUpdateComment }) {
  const [search, setSearch] = useState('');
  const [showSummary, setShowSummary] = useState(true);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.item.toLowerCase().includes(q) ||
        r.producto.toLowerCase().includes(q) ||
        r.pivote.toLowerCase().includes(q) ||
        (r.uda && r.uda.toLowerCase().includes(q)) ||
        (r.comentario && r.comentario.toLowerCase().includes(q))
    );
  }, [rows, search]);

  const grandTotal = useMemo(
    () => filteredRows.reduce((acc, r) => acc + r.sumaTotal, 0),
    [filteredRows]
  );

  const commentSummary = useMemo(() => summarizeComments(rows), [rows]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl overflow-hidden shadow-sm border border-slate-200">
        <div className="bg-oxxoRed text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base md:text-lg font-bold tracking-wide">{title}</h2>
            <p className="text-xs text-red-100">CONTROL Y SEGUIMIENTO • OXXO CEDIS SALTILLO</p>
          </div>
          <button
            type="button"
            onClick={() => setShowSummary((prev) => !prev)}
            className="inline-flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white border border-white/40 text-xs font-bold px-3.5 py-2 rounded-lg transition"
          >
            <BarChart3 className="w-4 h-4" />
            {showSummary ? 'Ocultar Resumen' : 'Ver Resumen'}
          </button>
        </div>

        <div className="bg-oxxoDark text-white px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <span>
              Ítems únicos: <strong className="text-oxxoYellow">{filteredRows.length}</strong>
            </span>
            <span>
              Suma de Total:{' '}
              <strong className="text-oxxoYellow">{grandTotal.toLocaleString('es-MX')}</strong>
            </span>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar ítem, producto, pivote..."
              className="w-full bg-white text-slate-800 rounded-md pl-8 pr-3 py-1 text-xs focus:outline-none"
            />
          </div>
        </div>
      </div>

      <datalist id="quick-comments-list">
        {QUICK_COMMENTS.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        <div
          className={`${
            showSummary ? 'lg:col-span-9' : 'lg:col-span-12'
          } bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden`}
        >
          <div className="overflow-x-auto max-h-[65vh]">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-oxxoDark text-white sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-3 font-bold">Item</th>
                  <th className="py-2.5 px-3 font-bold">Producto</th>
                  <th className="py-2.5 px-3 font-bold">Pivote</th>
                  <th className="py-2.5 px-3 font-bold text-right">Paqexist</th>
                  {includeUda && <th className="py-2.5 px-3 font-bold text-center">UDA</th>}
                  <th className="py-2.5 px-3 font-bold text-right">Suma de Total</th>
                  <th className="py-2.5 px-3 font-bold w-64">Comentario</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={includeUda ? 7 : 6}
                      className="py-10 text-center text-slate-400 text-sm"
                    >
                      No hay registros que coincidan con los pasillos configurados o el filtro.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2 px-3 font-mono font-semibold text-slate-800 whitespace-nowrap">
                        {row.item}
                      </td>
                      <td className="py-2 px-3 text-slate-700">{row.producto}</td>
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
                        <input
                          type="text"
                          list="quick-comments-list"
                          value={row.comentario}
                          onChange={(e) => onUpdateComment(row.id, e.target.value)}
                          placeholder="Agregar comentario..."
                          className="w-full border border-slate-200 focus:border-oxxoRed focus:ring-1 focus:ring-oxxoRed rounded px-2 py-1 text-xs bg-white"
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {filteredRows.length > 0 && (
                <tfoot className="bg-slate-100 font-bold text-slate-800 border-t-2 border-slate-300">
                  <tr>
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

        {showSummary && (
          <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-oxxoDark text-white px-4 py-2.5 flex items-center gap-2 text-xs font-bold">
              <MessageSquare className="w-4 h-4 text-oxxoYellow" />
              Resumen de Comentarios
            </div>
            <div className="p-3">
              {commentSummary.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">
                  Escribe comentarios en la tabla para ver el conteo agrupado aquí.
                </p>
              ) : (
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="py-1.5 px-2 text-left font-semibold">Comentario</th>
                      <th className="py-1.5 px-2 text-right font-semibold">Total Ítems</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {commentSummary.map((item) => (
                      <tr key={item.comentario}>
                        <td className="py-2 px-2 text-slate-700">{item.comentario}</td>
                        <td className="py-2 px-2 text-right font-bold text-oxxoRed">
                          {item.totalItems}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
