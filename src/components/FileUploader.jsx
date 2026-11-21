import React, { useRef, useState } from 'react';
import { UploadCloud, FileSpreadsheet, AlertCircle, Clock, Building2, Settings } from 'lucide-react';
import { getShiftFromDate } from '../utils/shiftUtils';

export default function FileUploader({
  activeCedis,
  cedisList,
  onSelectCedis,
  onOpenConfig,
  onFileLoaded,
  error,
  historyCount,
  onOpenHistory,
}) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const currentShift = getShiftFromDate(new Date());

  const handleFiles = (files) => {
    if (!files || files.length === 0) return;
    onFileLoaded(files[0]);
  };

  const totalConfiguredAisles =
    (activeCedis?.config?.piezas?.length || 0) +
    (activeCedis?.config?.refri?.length || 0) +
    (activeCedis?.config?.cajas?.length || 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-5">
      {/* Barra superior: Selector de CEDIS + Turno en curso + Histórico */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 text-oxxoRed px-3 py-1.5 rounded-lg text-xs font-bold">
            <Building2 className="w-4 h-4 shrink-0" />
            <span>CEDIS activo:</span>
            <select
              value={activeCedis?.id || ''}
              onChange={(e) => onSelectCedis(e.target.value)}
              className="bg-white border border-red-300 text-slate-900 rounded px-2 py-0.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-oxxoRed cursor-pointer"
            >
              {cedisList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.code ? `(${c.code})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
            <Clock className="w-3.5 h-3.5 text-oxxoRed" />
            Turno actual: <span className="text-slate-900 font-bold">{currentShift.label}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {historyCount > 0 && (
            <button
              type="button"
              onClick={onOpenHistory}
              className="text-xs font-bold text-oxxoRed hover:underline"
            >
              Ver histórico ({historyCount}) →
            </button>
          )}
        </div>
      </div>

      {/* Aviso si el CEDIS seleccionado aún no tiene pasillos configurados */}
      {totalConfiguredAisles === 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-amber-50 border border-amber-300 text-amber-900 px-4 py-3 rounded-lg text-xs">
          <div>
            <p className="font-bold">
              El perfil &quot;{activeCedis?.name}&quot; aún no tiene pasillos configurados.
            </p>
            <p className="text-amber-800 mt-0.5">
              Puedes configurarlos ahora o subir un Excel que contenga la pestaña{' '}
              <code className="bg-amber-100 px-1 rounded">Config</code> para importarlos
              automáticamente a este CEDIS.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenConfig}
            className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3 py-1.5 rounded-lg transition"
          >
            <Settings className="w-3.5 h-3.5" />
            Configurar {activeCedis?.name}
          </button>
        </div>
      )}

      {/* Zona Drag & Drop */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer border-2 border-dashed rounded-xl p-10 text-center transition ${
          dragging
            ? 'border-oxxoRed bg-red-50/60'
            : 'border-slate-300 hover:border-oxxoRed hover:bg-slate-50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.xlsm,.csv"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="mx-auto w-14 h-14 rounded-full bg-red-50 text-oxxoRed flex items-center justify-center mb-4">
          <UploadCloud className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">
          Sube tu archivo de Cancelación de Piezas para{' '}
          <span className="text-oxxoRed">{activeCedis?.name}</span>
        </h2>
        <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
          Arrastra aquí tu archivo <span className="font-semibold">.xlsx / .xlsm</span> con la hoja{' '}
          <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">CancelacionPiezas</code>. Se
          aplicarán los pasillos configurados de este CEDIS.
        </p>
        <button
          type="button"
          className="mt-5 inline-flex items-center gap-2 bg-oxxoRed hover:bg-red-700 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition shadow-sm"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Seleccionar archivo Excel
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-oxxoRed" />
          <div>
            <p className="font-semibold">Error al procesar el archivo</p>
            <p>{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
