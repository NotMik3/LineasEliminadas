import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  RotateCcw,
  CheckCircle2,
  MessageSquarePlus,
  Building2,
  Plus,
  Trash2,
  ArrowLeft,
} from 'lucide-react';
import { DEFAULT_COMMENTS_CATALOG, formatCedisDisplay } from '../utils/lneProcessor';

export default function ConfigPanel({
  cedisList,
  activeCedis,
  onSelectCedis,
  onAddCedis,
  onUpdateCedisName,
  onDeleteCedis,
  onSaveConfig,
  onResetDefaults,
  onBackToMain,
  hasLoadedReport,
}) {
  const [cedisName, setCedisName] = useState('');
  const [piezasText, setPiezasText] = useState('');
  const [refriText, setRefriText] = useState('');
  const [cajasText, setCajasText] = useState('');
  const [uda5Text, setUda5Text] = useState('');
  const [commentsText, setCommentsText] = useState('');
  const [savedNotice, setSavedNotice] = useState(false);

  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (!activeCedis) return;
    const cfg = activeCedis.config || {};
    setCedisName(activeCedis.name || '');
    setPiezasText((cfg.piezas || []).join('\n'));
    setRefriText((cfg.refri || []).join('\n'));
    setCajasText((cfg.cajas || []).join('\n'));
    setUda5Text((cfg.uda5 || []).join('\n'));
    setCommentsText((cfg.commentsCatalog || DEFAULT_COMMENTS_CATALOG).join('\n'));
  }, [activeCedis]);

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
    if (!parsedComments.some((c) => c.toLowerCase() === 'operacion' || c.toLowerCase() === 'operación')) {
      parsedComments.unshift('Operacion');
    }

    onUpdateCedisName(activeCedis.id, cedisName.trim() || activeCedis.name);

    onSaveConfig(activeCedis.id, {
      piezas: parseLines(piezasText),
      refri: parseLines(refriText),
      cajas: parseLines(cajasText),
      uda5: parseLines(uda5Text),
      commentsCatalog: parsedComments.length > 0 ? parsedComments : DEFAULT_COMMENTS_CATALOG,
    });

    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleCreateCedis = (e) => {
    e.preventDefault();
    const cleanName = newName.trim();
    if (!cleanName) return;
    onAddCedis(cleanName);
    setNewName('');
    setShowNewForm(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-xl shadow-sm border border-slate-200 px-5 py-3.5">
        <button
          type="button"
          onClick={onBackToMain}
          className="inline-flex items-center gap-2 text-xs font-bold text-white bg-oxxoDark hover:bg-slate-800 px-4 py-2 rounded-lg transition shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 text-oxxoYellow" />
          {hasLoadedReport ? 'Regresar al reporte activo' : 'Volver al inicio (Cargar Excel)'}
        </button>

        <p className="text-xs text-slate-500">
          Toda la configuración por CEDIS se guarda automáticamente en este navegador.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-red-50 text-oxxoRed">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Catálogo de CEDIS ({cedisList.length})
              </h2>
              <p className="text-xs text-slate-500">
                Selecciona un CEDIS para editar sus pasillos o agrega nuevos CEDIS.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowNewForm((prev) => !prev)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-oxxoRed hover:bg-red-700 px-3.5 py-2 rounded-lg transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Agregar nuevo CEDIS
          </button>
        </div>

        {showNewForm && (
          <form
            onSubmit={handleCreateCedis}
            className="mb-4 bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-wrap items-end gap-3"
          >
            <div className="flex-1 min-w-[220px]">
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                Nombre del CEDIS *
              </label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ej: Monterrey"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-oxxoRed"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition"
              >
                Crear CEDIS
              </button>
              <button
                type="button"
                onClick={() => setShowNewForm(false)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-2"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {cedisList.map((cedis) => {
            const isSelected = cedis.id === activeCedis?.id;
            const totalPasillos =
              (cedis.config?.piezas?.length || 0) +
              (cedis.config?.refri?.length || 0) +
              (cedis.config?.cajas?.length || 0);

            return (
              <div
                key={cedis.id}
                onClick={() => onSelectCedis(cedis.id)}
                className={`cursor-pointer rounded-xl border-2 p-3.5 transition flex items-start justify-between gap-2 ${
                  isSelected
                    ? 'border-oxxoRed bg-red-50/40 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div>
                  <span className="font-bold text-xs text-slate-800 block">
                    {formatCedisDisplay(cedis.name)}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {totalPasillos} pasillos • {cedis.config?.uda5?.length || 0} UDA5
                  </p>
                </div>

                {cedisList.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteCedis(cedis.id);
                    }}
                    title="Eliminar este CEDIS"
                    className="p-1 text-slate-400 hover:text-red-600 rounded transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-slate-100 text-oxxoDark">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Configuración de:{' '}
                <span className="text-oxxoRed">{formatCedisDisplay(activeCedis?.name)}</span>
              </h2>
              <p className="text-xs text-slate-500">
                Un valor por línea. Estos parámetros aplican exclusivamente al CEDIS seleccionado.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {savedNotice && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                <CheckCircle2 className="w-4 h-4" />
                Guardado
              </span>
            )}
            <button
              type="button"
              onClick={() => onResetDefaults(activeCedis.id)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Limpiar listas
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-oxxoRed hover:bg-red-700 px-4 py-2 rounded-lg transition shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              Guardar configuración
            </button>
          </div>
        </div>

        <div className="mb-5 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 max-w-md">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
            Nombre del CEDIS
          </label>
          <input
            type="text"
            value={cedisName}
            onChange={(e) => setCedisName(e.target.value)}
            placeholder="Ej: Saltillo"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-oxxoRed"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Se mostrará como:{' '}
            <strong className="text-slate-600">
              Lineas Eliminadas | {formatCedisDisplay(cedisName)}
            </strong>
          </p>
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
    </div>
  );
}
