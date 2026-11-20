import React, { useRef, useState } from 'react';
import { UploadCloud, FileSpreadsheet, AlertCircle } from 'lucide-react';

export default function FileUploader({ onFileLoaded, error }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = (files) => {
    if (!files || files.length === 0) return;
    onFileLoaded(files[0]);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
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
          Sube tu archivo de Cancelación de Piezas
        </h2>
        <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
          Arrastra aquí tu archivo <span className="font-semibold">.xlsx / .xlsm</span> con la hoja{' '}
          <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">CancelacionPiezas</code> (y{' '}
          <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">Config</code> si la incluye).
        </p>
        <button
          type="button"
          className="mt-5 inline-flex items-center gap-2 bg-oxxoRed hover:bg-red-800 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition shadow-sm"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Seleccionar archivo Excel
        </button>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
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
