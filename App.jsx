import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  Download,
  Settings,
  Layers,
  Snowflake,
  Package,
  FileSpreadsheet,
  History,
  Clock,
  Home,
  RotateCcw,
  Building2,
  Store,
  Scissors,
} from 'lucide-react';
import FileUploader from './components/FileUploader';
import ConfigPanel from './components/ConfigPanel';
import ReportTable from './components/ReportTable';
import HistoryPanel from './components/HistoryPanel';
import StoresModule from './components/StoresModule';
import {
  DEFAULT_MULTI_CEDIS_STATE,
  createEmptyCedisConfig,
  DEFAULT_COMMENTS_CATALOG,
  extractConfigFromWorkbook,
  parseBaseRecords,
  runLneAnalysis,
  formatAppPageTitle,
  formatCedisDisplay,
} from './utils/lneProcessor';
import { exportLneWorkbook } from './utils/excelExporter';
import { detectDominantShift, SHIFT_OPTIONS } from './utils/shiftUtils';

const MULTI_CEDIS_STORAGE_KEY = 'lne_multi_cedis_state_v8';
const HISTORY_STORAGE_KEY = 'lne_multi_cedis_history_v8';
const NO_BEER_STORAGE_KEY = 'cedis_no_beer_stores_v8';
const MAX_HISTORY_ITEMS = 25;

export default function App() {
  // Pestaña superior principal de la aplicación: 'lne' (Líneas Eliminadas) | 'stores' (Tiendas Cerradas y Aperturas)
  const [mainModule, setMainModule] = useState('lne');

  const [cedisState, setCedisState] = useState(() => {
    try {
      const saved = localStorage.getItem(MULTI_CEDIS_STORAGE_KEY);
      if (!saved) return DEFAULT_MULTI_CEDIS_STATE;
      const parsed = JSON.parse(saved);
      if (!parsed?.cedisList || parsed.cedisList.length === 0) {
        return DEFAULT_MULTI_CEDIS_STATE;
      }
      return parsed;
    } catch {
      return DEFAULT_MULTI_CEDIS_STATE;
    }
  });

  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Estado del módulo Tiendas Cerradas y Aperturas
  const [storesData, setStoresData] = useState(null);
  const [noBeerStores, setNoBeerStores] = useState(() => {
    try {
      const saved = localStorage.getItem(NO_BEER_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeHistoryId, setActiveHistoryId] = useState(null);
  const [baseRecords, setBaseRecords] = useState(null);
  const [fileName, setFileName] = useState('');
  const [selectedShiftId, setSelectedShiftId] = useState('ALL');
  const [commentsStore, setCommentsStore] = useState({});
  const [reports, setReports] = useState(null);
  const [viewMode, setViewMode] = useState('home');
  const [reportTab, setReportTab] = useState('piezas');
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem(MULTI_CEDIS_STORAGE_KEY, JSON.stringify(cedisState));
    } catch {
      // Ignorar si localStorage está restringido
    }
  }, [cedisState]);

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch {
      // Ignorar si excede cuota
    }
  }, [history]);

  useEffect(() => {
    try {
      localStorage.setItem(NO_BEER_STORAGE_KEY, JSON.stringify(noBeerStores));
    } catch {
      // Ignorar si excede cuota
    }
  }, [noBeerStores]);

  const activeCedis = useMemo(() => {
    return (
      cedisState.cedisList.find((c) => c.id === cedisState.activeCedisId) ||
      cedisState.cedisList[0]
    );
  }, [cedisState]);

  useEffect(() => {
    const prefix =
      mainModule === 'stores' ? 'Tiendas Cerradas y Aperturas' : 'Lineas Eliminadas';
    document.title = formatAppPageTitle(activeCedis?.name, prefix);
  }, [activeCedis, mainModule]);

  const activeConfig = activeCedis?.config || createEmptyCedisConfig();

  const activeShiftObj = useMemo(
    () => SHIFT_OPTIONS.find((s) => s.id === selectedShiftId) || SHIFT_OPTIONS[0],
    [selectedShiftId]
  );

  const shiftCounts = useMemo(() => {
    if (!baseRecords) return {};
    const counts = {
      ALL: baseRecords.length,
      '1er Turno': 0,
      '2do Turno': 0,
      '3er Turno': 0,
    };
    for (const r of baseRecords) {
      if (counts[r.turno] !== undefined) {
        counts[r.turno] += 1;
      }
    }
    return counts;
  }, [baseRecords]);

  const attachStoredComments = (rawReports, store, shiftId) => {
    const applyArea = (areaName, list) =>
      list.map((row) => {
        const exactKey = `${shiftId}::${areaName}::${row.id}`;
        const fallbackKey = `ALL::${areaName}::${row.id}`;
        const comment = store[exactKey] ?? store[fallbackKey] ?? row.comentario ?? '';
        return { ...row, comentario: comment };
      });

    return {
      ...rawReports,
      piezas: applyArea('piezas', rawReports.piezas),
      refri: applyArea('refri', rawReports.refri),
      cajas: applyArea('cajas', rawReports.cajas),
    };
  };

  const syncHistoryEntry = (entryId, updatedReports, updatedCommentsStore, shiftId) => {
    if (!entryId) return;
    setHistory((prev) =>
      prev.map((item) =>
        item.id === entryId
          ? {
              ...item,
              reports: updatedReports,
              commentsStore: updatedCommentsStore,
              selectedShiftId: shiftId,
            }
          : item
      )
    );
  };

  const handleSelectCedis = (newCedisId) => {
    const targetCedis = cedisState.cedisList.find((c) => c.id === newCedisId);
    if (!targetCedis) return;

    setCedisState((prev) => ({ ...prev, activeCedisId: newCedisId }));

    if (baseRecords) {
      const fresh = runLneAnalysis(baseRecords, targetCedis.config, selectedShiftId);
      const withComments = attachStoredComments(fresh, commentsStore, selectedShiftId);
      setReports(withComments);
    }
  };

  const handleAddCedis = (name) => {
    const newId = `cedis_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newCedis = {
      id: newId,
      name,
      config: createEmptyCedisConfig(),
    };
    setCedisState((prev) => ({
      activeCedisId: newId,
      cedisList: [...prev.cedisList, newCedis],
    }));

    if (baseRecords) {
      const fresh = runLneAnalysis(baseRecords, newCedis.config, selectedShiftId);
      setReports(fresh);
    }
  };

  const handleUpdateCedisName = (cedisId, name) => {
    setCedisState((prev) => ({
      ...prev,
      cedisList: prev.cedisList.map((c) =>
        c.id === cedisId ? { ...c, name: name || c.name } : c
      ),
    }));
  };

  const handleDeleteCedis = (cedisId) => {
    if (cedisState.cedisList.length <= 1) return;
    const target = cedisState.cedisList.find((c) => c.id === cedisId);
    if (
      !window.confirm(
        `¿Seguro que deseas eliminar "${formatCedisDisplay(target?.name)}" y su configuración de pasillos?`
      )
    ) {
      return;
    }

    setCedisState((prev) => {
      const remaining = prev.cedisList.filter((c) => c.id !== cedisId);
      const nextActiveId =
        prev.activeCedisId === cedisId ? remaining[0].id : prev.activeCedisId;
      return {
        activeCedisId: nextActiveId,
        cedisList: remaining,
      };
    });
  };

  const handleSaveCedisConfig = (cedisId, newConfig) => {
    setCedisState((prev) => ({
      ...prev,
      cedisList: prev.cedisList.map((c) =>
        c.id === cedisId ? { ...c, config: newConfig } : c
      ),
    }));

    if (baseRecords && cedisId === activeCedis?.id) {
      const fresh = runLneAnalysis(baseRecords, newConfig, selectedShiftId);
      const withComments = attachStoredComments(fresh, commentsStore, selectedShiftId);
      setReports(withComments);
      syncHistoryEntry(activeHistoryId, withComments, commentsStore, selectedShiftId);
    }
  };

  const handleFileLoaded = (file) => {
    setError('');
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        const extractedConfig = extractConfigFromWorkbook(workbook);
        let configToUse = activeConfig;

        if (extractedConfig) {
          configToUse = {
            ...activeConfig,
            ...extractedConfig,
            commentsCatalog:
              activeConfig.commentsCatalog && activeConfig.commentsCatalog.length > 0
                ? activeConfig.commentsCatalog
                : DEFAULT_COMMENTS_CATALOG,
          };

          setCedisState((prev) => ({
            ...prev,
            cedisList: prev.cedisList.map((c) =>
              c.id === activeCedis.id ? { ...c, config: configToUse } : c
            ),
          }));
        }

        const { records } = parseBaseRecords(workbook);
        const dominantShift = detectDominantShift(records);
        const initialShiftId = dominantShift.id;

        const generated = runLneAnalysis(records, configToUse, initialShiftId);
        const emptyStore = {};

        const newEntryId = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const newHistoryEntry = {
          id: newEntryId,
          cedisId: activeCedis.id,
          cedisName: activeCedis.name,
          fileName: file.name,
          uploadedAt: new Date().toISOString(),
          shift: dominantShift,
          selectedShiftId: initialShiftId,
          baseRecords: records,
          commentsStore: emptyStore,
          reports: generated,
        };

        setBaseRecords(records);
        setFileName(file.name);
        setSelectedShiftId(initialShiftId);
        setCommentsStore(emptyStore);
        setReports(generated);
        setActiveHistoryId(newEntryId);
        setHistory((prev) => [newHistoryEntry, ...prev].slice(0, MAX_HISTORY_ITEMS));

        const hasAnyAisle =
          configToUse.piezas.length > 0 ||
          configToUse.refri.length > 0 ||
          configToUse.cajas.length > 0;

        if (hasAnyAisle) {
          setReportTab('piezas');
          setViewMode('report');
        } else {
          setViewMode('config');
        }
      } catch (err) {
        setError(err.message || 'No se pudo leer el archivo Excel.');
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleShiftChange = (newShiftId) => {
    setSelectedShiftId(newShiftId);
    if (!baseRecords) return;

    const recalculated = runLneAnalysis(baseRecords, activeConfig, newShiftId);
    const withComments = attachStoredComments(recalculated, commentsStore, newShiftId);
    setReports(withComments);
    syncHistoryEntry(activeHistoryId, withComments, commentsStore, newShiftId);
  };

  const handleUpdateComment = (area, rowId, value) => {
    const nextStore = {
      ...commentsStore,
      [`${selectedShiftId}::${area}::${rowId}`]: value,
      [`ALL::${area}::${rowId}`]: value,
    };
    setCommentsStore(nextStore);

    setReports((prev) => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        [area]: prev[area].map((row) =>
          row.id === rowId ? { ...row, comentario: value } : row
        ),
      };
      syncHistoryEntry(activeHistoryId, updated, nextStore, selectedShiftId);
      return updated;
    });
  };

  const handleBulkUpdateComments = (area, rowIds, value) => {
    const idSet = new Set(rowIds);
    const nextStore = { ...commentsStore };
    rowIds.forEach((id) => {
      nextStore[`${selectedShiftId}::${area}::${id}`] = value;
      nextStore[`ALL::${area}::${id}`] = value;
    });
    setCommentsStore(nextStore);

    setReports((prev) => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        [area]: prev[area].map((row) =>
          idSet.has(row.id) ? { ...row, comentario: value } : row
        ),
      };
      syncHistoryEntry(activeHistoryId, updated, nextStore, selectedShiftId);
      return updated;
    });
  };

  const handleLoadHistoryEntry = (entry) => {
    const restoredRecords = entry.baseRecords || null;
    const restoredStore = entry.commentsStore || {};
    const restoredShiftId = entry.selectedShiftId || entry.shift?.id || 'ALL';

    const matchedCedis =
      cedisState.cedisList.find((c) => c.id === entry.cedisId) || activeCedis;

    if (matchedCedis && matchedCedis.id !== cedisState.activeCedisId) {
      setCedisState((prev) => ({ ...prev, activeCedisId: matchedCedis.id }));
    }

    setBaseRecords(restoredRecords);
    setFileName(entry.fileName);
    setCommentsStore(restoredStore);
    setSelectedShiftId(restoredShiftId);

    if (restoredRecords) {
      const fresh = runLneAnalysis(
        restoredRecords,
        matchedCedis?.config || activeConfig,
        restoredShiftId
      );
      setReports(attachStoredComments(fresh, restoredStore, restoredShiftId));
    } else {
      setReports(entry.reports);
    }

    setActiveHistoryId(entry.id);
    setError('');
    setReportTab('piezas');
    setViewMode('report');
  };

  const handleDeleteHistoryEntry = (id) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
    if (activeHistoryId === id) {
      setActiveHistoryId(null);
    }
  };

  const handleClearHistory = () => {
    if (!window.confirm('¿Seguro que deseas borrar todo el histórico guardado?')) return;
    setHistory([]);
    setActiveHistoryId(null);
  };

  const handleResetAndGoHome = () => {
    setBaseRecords(null);
    setReports(null);
    setFileName('');
    setCommentsStore({});
    setActiveHistoryId(null);
    setSelectedShiftId('ALL');
    setError('');
    setReportTab('piezas');
    setViewMode('home');
  };

  const handleBackFromSubpage = () => {
    if (reports) {
      setViewMode('report');
    } else {
      setViewMode('home');
    }
  };

  // Handlers Tiendas Sin Cerveza
  const handleAddNoBeerStore = (item) => {
    const newEntry = {
      id: `nobeer_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      ...item,
    };
    setNoBeerStores((prev) => [newEntry, ...prev]);
  };

  const handleAddBulkNoBeerStores = (items) => {
    const mapped = items.map((it, idx) => ({
      id: `nobeer_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 5)}`,
      ...it,
    }));
    setNoBeerStores((prev) => [...mapped, ...prev]);
  };

  const handleDeleteNoBeerStore = (id) => {
    setNoBeerStores((prev) => prev.filter((b) => b.id !== id));
  };

  const handleClearNoBeerStores = () => {
    setNoBeerStores([]);
  };

  const totalActiveAisles =
    (activeConfig.piezas?.length || 0) +
    (activeConfig.refri?.length || 0) +
    (activeConfig.cajas?.length || 0);

  const headerTitle =
    mainModule === 'stores'
      ? formatAppPageTitle(activeCedis?.name, 'Tiendas Cerradas y Aperturas')
      : formatAppPageTitle(activeCedis?.name, 'Lineas Eliminadas');

  return (
    <div className="min-h-screen flex flex-col">
      {/* Barra superior roja principal */}
      <header className="bg-oxxoRed text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={() => {
                if (mainModule === 'lne') {
                  setViewMode(reports ? 'report' : 'home');
                }
              }}
              className="shrink-0 focus:outline-none"
              title="Ir al inicio"
            >
              <img
                src="/logo-oxxo.png"
                alt="Logo OXXO"
                className="h-10 w-auto rounded shadow-sm bg-white p-0.5"
              />
            </button>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base md:text-lg font-extrabold tracking-tight leading-tight">
                  {headerTitle}
                </h1>

                <span className="inline-flex items-center gap-1 bg-white/15 border border-white/30 px-2 py-0.5 rounded text-[11px] font-bold">
                  <Building2 className="w-3 h-3 text-oxxoYellow" />
                  <select
                    value={activeCedis?.id || ''}
                    onChange={(e) => handleSelectCedis(e.target.value)}
                    aria-label="Cambiar CEDIS"
                    className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
                  >
                    {cedisState.cedisList.map((c) => (
                      <option key={c.id} value={c.id} className="text-slate-900">
                        {formatCedisDisplay(c.name)}
                      </option>
                    ))}
                  </select>
                </span>
              </div>

              {mainModule === 'lne' && (
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="inline-flex items-center gap-1 text-[11px] bg-black/25 text-white px-2 py-0.5 rounded font-semibold">
                    <Clock className="w-3 h-3 text-oxxoYellow" />
                    <select
                      value={selectedShiftId}
                      onChange={(e) => handleShiftChange(e.target.value)}
                      aria-label="Seleccionar turno o vista general"
                      className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
                    >
                      {SHIFT_OPTIONS.map((s) => (
                        <option key={s.id} value={s.id} className="text-slate-900">
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </span>

                  {fileName && (
                    <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-red-100">
                      <FileSpreadsheet className="w-3 h-3 text-oxxoYellow" />
                      {fileName}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Controles del módulo Líneas Eliminadas */}
          {mainModule === 'lne' && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setViewMode(reports ? 'report' : 'home')}
                className={`inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-lg transition ${
                  viewMode === 'home' || viewMode === 'report'
                    ? 'bg-oxxoYellow text-slate-900 shadow-sm'
                    : 'bg-white/15 hover:bg-white/25 text-white'
                }`}
              >
                <Home className="w-4 h-4" />
                Inicio
              </button>

              <button
                type="button"
                onClick={() => setViewMode('history')}
                className={`inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-lg transition ${
                  viewMode === 'history'
                    ? 'bg-oxxoYellow text-slate-900 shadow-sm'
                    : 'bg-white/15 hover:bg-white/25 text-white'
                }`}
              >
                <History className="w-4 h-4" />
                Histórico ({history.length})
              </button>

              <button
                type="button"
                onClick={() => setViewMode('config')}
                className={`inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-lg transition ${
                  viewMode === 'config'
                    ? 'bg-oxxoYellow text-slate-900 shadow-sm'
                    : 'bg-white/15 hover:bg-white/25 text-white'
                }`}
              >
                <Settings className="w-4 h-4" />
                Config ({totalActiveAisles})
              </button>

              {reports && (
                <button
                  type="button"
                  onClick={() =>
                    exportLneWorkbook(reports, activeCedis?.name, activeShiftObj.label)
                  }
                  className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-lg transition shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  Exportar Excel
                </button>
              )}

              <button
                type="button"
                onClick={handleResetAndGoHome}
                title="Limpia los datos cargados y vuelve a la pantalla inicial manteniendo la configuración de tus CEDIS"
                className="inline-flex items-center gap-1.5 bg-white text-oxxoRed hover:bg-red-50 text-xs font-bold px-3.5 py-2 rounded-lg transition shadow-sm"
              >
                <RotateCcw className="w-4 h-4" />
                Reiniciar e Inicio
              </button>
            </div>
          )}
        </div>

        {/* Barra de navegación global entre las 2 grandes pestañas de la app */}
        <div className="bg-red-950/60 border-t border-red-400/20">
          <div className="max-w-7xl mx-auto px-4 flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => setMainModule('lne')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-t-lg text-xs font-extrabold tracking-wide transition ${
                mainModule === 'lne'
                  ? 'bg-slate-100 text-oxxoRed shadow-sm'
                  : 'text-red-100 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Scissors className="w-4 h-4" />
              LÍNEAS ELIMINADAS
            </button>

            <button
              type="button"
              onClick={() => setMainModule('stores')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-t-lg text-xs font-extrabold tracking-wide transition ${
                mainModule === 'stores'
                  ? 'bg-slate-100 text-oxxoRed shadow-sm'
                  : 'text-red-100 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Store className="w-4 h-4" />
              TIENDAS CERRADAS Y APERTURAS
              {storesData && (
                <span className="ml-1 bg-oxxoRed text-white text-[10px] px-1.5 py-0.2 rounded-full">
                  {storesData.closedStores.length + storesData.openings.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 space-y-6">
        {/* ==================== PESTAÑA 1: LÍNEAS ELIMINADAS ==================== */}
        {mainModule === 'lne' && (
          <>
            {reports && viewMode === 'report' && (
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
                <button
                  type="button"
                  onClick={() => setReportTab('piezas')}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                    reportTab === 'piezas'
                      ? 'bg-oxxoRed text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  LNE PIEZAS ({reports.piezas.reduce((a, b) => a + (b.sumaTotal || 0), 0)} líneas)
                </button>

                <button
                  type="button"
                  onClick={() => setReportTab('refri')}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                    reportTab === 'refri'
                      ? 'bg-oxxoRed text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  <Snowflake className="w-4 h-4" />
                  LNE REFRI ({reports.refri.reduce((a, b) => a + (b.sumaTotal || 0), 0)} líneas)
                </button>

                <button
                  type="button"
                  onClick={() => setReportTab('cajas')}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                    reportTab === 'cajas'
                      ? 'bg-oxxoRed text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  LNE CAJAS ({reports.cajas.reduce((a, b) => a + (b.sumaTotal || 0), 0)} líneas)
                </button>
              </div>
            )}

            {viewMode === 'history' && (
              <HistoryPanel
                history={history}
                activeHistoryId={activeHistoryId}
                onLoadEntry={handleLoadHistoryEntry}
                onDeleteEntry={handleDeleteHistoryEntry}
                onClearHistory={handleClearHistory}
                onBackToMain={handleBackFromSubpage}
                hasLoadedReport={Boolean(reports)}
              />
            )}

            {viewMode === 'config' && (
              <ConfigPanel
                cedisList={cedisState.cedisList}
                activeCedis={activeCedis}
                onSelectCedis={handleSelectCedis}
                onAddCedis={handleAddCedis}
                onUpdateCedisName={handleUpdateCedisName}
                onDeleteCedis={handleDeleteCedis}
                onSaveConfig={handleSaveCedisConfig}
                onResetDefaults={(cedisId) =>
                  handleSaveCedisConfig(cedisId, createEmptyCedisConfig())
                }
                onBackToMain={handleBackFromSubpage}
                hasLoadedReport={Boolean(reports)}
              />
            )}

            {viewMode === 'home' && (
              <FileUploader
                activeCedis={activeCedis}
                cedisList={cedisState.cedisList}
                onSelectCedis={handleSelectCedis}
                onOpenConfig={() => setViewMode('config')}
                onFileLoaded={handleFileLoaded}
                error={error}
                historyCount={history.length}
                onOpenHistory={() => setViewMode('history')}
              />
            )}

            {reports && viewMode === 'report' && reportTab === 'piezas' && (
              <ReportTable
                title={`LINEAS ELIMINADAS (PIEZAS) • ${activeShiftObj.shortLabel.toUpperCase()}`}
                cedisName={activeCedis?.name}
                rows={reports.piezas}
                includeUda={false}
                commentsCatalog={activeConfig.commentsCatalog}
                selectedShiftId={selectedShiftId}
                onSelectShift={handleShiftChange}
                shiftCounts={shiftCounts}
                onUpdateComment={(id, val) => handleUpdateComment('piezas', id, val)}
                onBulkUpdateComments={(ids, val) => handleBulkUpdateComments('piezas', ids, val)}
              />
            )}

            {reports && viewMode === 'report' && reportTab === 'refri' && (
              <ReportTable
                title={`LINEAS ELIMINADAS (REFRI) • ${activeShiftObj.shortLabel.toUpperCase()}`}
                cedisName={activeCedis?.name}
                rows={reports.refri}
                includeUda={true}
                commentsCatalog={activeConfig.commentsCatalog}
                selectedShiftId={selectedShiftId}
                onSelectShift={handleShiftChange}
                shiftCounts={shiftCounts}
                onUpdateComment={(id, val) => handleUpdateComment('refri', id, val)}
                onBulkUpdateComments={(ids, val) => handleBulkUpdateComments('refri', ids, val)}
              />
            )}

            {reports && viewMode === 'report' && reportTab === 'cajas' && (
              <ReportTable
                title={`LINEAS ELIMINADAS (CAJAS) • ${activeShiftObj.shortLabel.toUpperCase()}`}
                cedisName={activeCedis?.name}
                rows={reports.cajas}
                includeUda={false}
                commentsCatalog={activeConfig.commentsCatalog}
                selectedShiftId={selectedShiftId}
                onSelectShift={handleShiftChange}
                shiftCounts={shiftCounts}
                onUpdateComment={(id, val) => handleUpdateComment('cajas', id, val)}
                onBulkUpdateComments={(ids, val) => handleBulkUpdateComments('cajas', ids, val)}
              />
            )}
          </>
        )}

        {/* =============== PESTAÑA 2: TIENDAS CERRADAS Y APERTURAS =============== */}
        {mainModule === 'stores' && (
          <StoresModule
            storesData={storesData}
            onSetStoresData={setStoresData}
            noBeerStores={noBeerStores}
            onAddNoBeerStore={handleAddNoBeerStore}
            onAddBulkNoBeerStores={handleAddBulkNoBeerStores}
            onDeleteNoBeerStore={handleDeleteNoBeerStore}
            onClearNoBeerStores={handleClearNoBeerStores}
          />
        )}
      </main>
    </div>
  );
}
