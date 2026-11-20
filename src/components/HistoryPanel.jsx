import React from 'react';
import { History, FolderOpen, Trash2, Clock, FileSpreadsheet, Calendar } from 'lucide-react';

export default function HistoryPanel({ history, activeHistoryId, onLoadEntry, onDeleteEntry, onClearHistory }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-red-50 text-oxxoRed">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Histórico de Archivos Excel Subidos
            </h2>
            <p className="text-xs text-slate-500">
              Cada carga se guarda automáticamente con sus turnos y comentarios capturados.
            </p>
          </div>
        </div>

        {history.length > 0 && (
          <button
            type="button"
            onClick={onClearHistory}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 border border-red-200 px-3 py-2 rounded-lg transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Borrar todo el histórico
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <FileSpreadsheet className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm font-semibold text-slate-600">Aún no hay archivos en el histórico</p>
          <p className="text-xs mt-1">Sube un archivo Excel para que quede registrado aquí.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {history.map((entry) => {
            const isCurrent = entry.id === activeHistoryId;
            return (
              <div
                key={entry.id}
                className={`rounded-xl border p-4 flex flex-col justify-between transition ${
                  isCurrent
                    ? 'border-oxxoRed bg-red-50/30 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-oxxoDark text-white">
                      <Clock className="w-3 h-3 text-oxxoYellow" />
                      {entry.shift?.shortLabel || 'General'}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-oxxoRed bg-red-100 px-2 py-0.5 rounded">
                        Activo
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-sm text-slate-800 mt-2.5 break-all">
                    {entry.fileName}
                  </h3>

                  <p className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(entry.uploadedAt).toLocaleString('es-MX', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>

                  <div className="grid grid-cols-3 gap-1.5 mt-3 pt-3 border-t border-slate-100 text-center text-xs">
                    <div className="bg-slate-50 rounded p-1.5">
                      <span className="block text-[10px] text-slate-400 font-semibold">PIEZAS</span>
                      <span className="font-bold text-slate-800">{entry.reports?.piezas?.length ?? 0}</span>
                    </div>
                    <div className="bg-slate-50 rounded p-1.5">
                      <span className="block text-[10px] text-slate-400 font-semibold">REFRI</span>
                      <span className="font-bold text-slate-800">{entry.reports?.refri?.length ?? 0}</span>
                    </div>
                    <div className="bg-slate-50 rounded p-1.5">
                      <span className="block text-[10px] text-slate-400 font-semibold">CAJAS</span>
                      <span className="font-bold text-slate-800">{entry.reports?.cajas?.length ?? 0}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => onLoadEntry(entry)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 bg-oxxoRed hover:bg-red-700 text-white text-xs font-bold py-2 px-3 rounded-lg transition"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    Abrir reporte
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteEntry(entry.id)}
                    title="Eliminar del histórico"
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
