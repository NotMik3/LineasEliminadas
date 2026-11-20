import React, { useState, useEffect } from 'react';
import { Settings, Save, RotateCcw, CheckCircle2, MessageSquarePlus } from 'lucide-react';
import { DEFAULT_COMMENTS_CATALOG } from '../utils/lneProcessor';

export default function ConfigPanel({ config, onSaveConfig, onResetDefaults }) {
  const [piezasText, setPiezasText] = useState('');
  const [refriText, setRefriText] = useState('');
  const [cajasText, setCajasText] = useState('');
  const [uda5Text, setUda5Text] = useState('');
  const [commentsText, setCommentsText] = useState('');
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    setPiezasText((config.piezas || []).join('\n'));
    setRefriText((config.refri || []).join('\n'));
    setCajasText((config.cajas || []).join('\n'));
    setUda5Text((config.uda5 || []).join('\n'));
    setCommentsText((config.commentsCatalog || DEFAULT_COMMENTS_CATALOG).join('\n'));
  }, [config]);

  const parseLines = (text) =>
    Array.from(
      new Set(
        text
          .split(/[\n,;]+/)
          .map((s) => s.trim())
          .filter(Boolean)
      )
    );

  const handleSave = (e) => {
    e.preventDefault();
    const parsedComments = parseLines(commentsText);
    // Garantizar que "Operacion" siempre esté disponible en el catálogo
    if (!parsedComments.some((c) => c.toLowerCase() === 'operacion' || c.toLowerCase() === 'operación')) {
      parsedComments.unshift('Operacion');
    }

    onSaveConfig({
      piezas: parseLines(piezasText),
      refri: parseLines(refriText),
      cajas: parseLines(cajasText),
      uda5: parseLines(uda5Text),
      commentsCatalog: parsedComments.length > 0 ? parsedComments : DEFAULT_COMMENTS_CATALOG,
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-slate-100 text-oxxoDark">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Parámetros de Pasillos, UDA5 y Catálogo de Comentarios
            </h2>
            <p className="text-xs text-slate-500">
              Un valor por línea. Se guarda automáticamente en tu navegador.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {savedNotice && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
              Guardado y recalculado
            </span>
          )}
          <button
            type="button"
            onClick={onResetDefaults}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restaurar valores
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-oxxoRed hover:bg-red-700 px-4 py-2 rounded-lg transition shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            Guardar parámetros
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Pasillos Piezas (Col A)
          </label>
          <textarea
            rows={10}
            value={piezasText}
            onChange={(e) => setPiezasText(e.target.value)}
            placeholder={'Ej:\n54\n55'}
            className="w-full rounded-lg border border-slate-300 p-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-oxxoRed"
          />
          <p className="text-[11px] text-slate-400 mt-1">{parseLines(piezasText).length} pasillos</p>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Pasillos Refri (Col B)
          </label>
          <textarea
            rows={10}
            value={refriText}
            onChange={(e) => setRefriText(e.target.value)}
            placeholder={'Ej:\n10\n11'}
            className="w-full rounded-lg border border-slate-300 p-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-oxxoRed"
          />
          <p className="text-[11px] text-slate-400 mt-1">{parseLines(refriText).length} pasillos</p>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Pasillos Cajas (Col C)
          </label>
          <textarea
            rows={10}
            value={cajasText}
            onChange={(e) => setCajasText(e.target.value)}
            placeholder={'Ej:\n20\n21'}
            className="w-full rounded-lg border border-slate-300 p-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-oxxoRed"
          />
          <p className="text-[11px] text-slate-400 mt-1">{parseLines(cajasText).length} pasillos</p>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Ítems UDA5 Refri (Col D)
          </label>
          <textarea
            rows={10}
            value={uda5Text}
            onChange={(e) => setUda5Text(e.target.value)}
            placeholder="Códigos de Item UDA5..."
            className="w-full rounded-lg border border-slate-300 p-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-oxxoRed"
          />
          <p className="text-[11px] text-slate-400 mt-1">{parseLines(uda5Text).length} ítems UDA5</p>
        </div>

        <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/80">
          <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-900 mb-1.5">
            <MessageSquarePlus className="w-3.5 h-3.5 text-oxxoRed" />
            Comentarios Homologados
          </label>
          <textarea
            rows={10}
            value={commentsText}
            onChange={(e) => setCommentsText(e.target.value)}
            placeholder="Escribe opciones estándar..."
            className="w-full rounded-lg border border-amber-300 bg-white p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-oxxoRed"
          />
          <p className="text-[11px] text-amber-800 mt-1">
            {parseLines(commentsText).length} opciones para selector y gráfica
          </p>
        </div>
      </div>
    </form>
  );
}
