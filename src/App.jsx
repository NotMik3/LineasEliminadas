import React, { useState, useEffect } from 'react';
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
  Upload,
} from 'lucide-react';
import FileUploader from './components/FileUploader';
import ConfigPanel from './components/ConfigPanel';
import ReportTable from './components/ReportTable';
import HistoryPanel from './components/HistoryPanel';
import {
  DEFAULT_CONFIG,
  DEFAULT_COMMENTS_CATALOG,
  extractConfigFromWorkbook,
  parseBaseRecords,
  runLneAnalysis,
} from './utils/lneProcessor';
import { exportLneWorkbook } from './utils/excelExporter';
import { detectShiftFromRecords, getShiftFromDate } from './utils/shiftUtils';

const CONFIG_STORAGE_KEY = 'lne_cedis_saltillo_config_v2';
const HISTORY_STORAGE_KEY = 'lne_cedis_saltillo_history_v2';
const MAX_HISTORY_ITEMS = 25;

export default function App() {
  const [config, setConfig] = useState(() => {
    try {
      const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (!saved) return DEFAULT_CONFIG;
      const parsed = JSON.parse(saved);
      return {
        ...DEFAULT_CONFIG,
        ...parsed,
        commentsCatalog:
          parsed.commentsCatalog && parsed.commentsCatalog.length > 0
            ? parsed.commentsCatalog
            : DEFAULT_COMMENTS_CATALOG,
      };
    } catch {
      return DEFAULT_CONFIG;
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

  const [activeHistoryId, setActiveHistoryId] = useState(null);
  const [baseRecords, setBaseRecords] = useState(null);
  const [fileName, setFileName] = useState('');
  const [activeShift, setActiveShift] = useState(() => getShiftFromDate(new Date()));
  const [reports, setReports] = useState(null);
  const [activeTab, setActiveTab] = useState('piezas');
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
    } catch {
      // Ignorar si localStorage está restringido
    }
  }, [config]);

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch {
      // Ignorar si excede cuota
    }
  }, [history]);

  const syncReportsToHistory = (entryId, updatedReports) => {
    if (!entryId) return;
    setHistory((prev) =>
      prev.map((item) => (item.id === entryId ? { ...item, reports: updatedReports } : item))
    );
  };

  const handleFileLoaded = (file) => {
    setError('');
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        const extractedConfig = extractConfigFromWorkbook(workbook);
        const activeConfig = extractedConfig
          ? {
              ...config,
              ...extractedConfig,
            }
          : config;

        if (extractedConfig) {
          setConfig(activeConfig);
        }

        const { records } = parseBaseRecords(workbook);
        const detectedShift = detectShiftFromRecords(records);
        const generated = runLneAnalysis(records, activeConfig);

        const newEntryId = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const newHistoryEntry = {
          id: newEntryId,
          fileName: file.name,
          uploadedAt: new Date().toISOString(),
          shift: detectedShift,
          reports: generated,
        };

        setBaseRecords(records);
        setFileName(file.name);
        setActiveShift(detectedShift);
        setReports(generated);
        setActiveHistoryId(newEntryId);
        setHistory((prev) => [newHistoryEntry, ...prev].slice(0, MAX_HISTORY_ITEMS));

        const hasAnyAisle =
          activeConfig.piezas.length > 0 ||
          activeConfig.refri.length > 0 ||
          activeConfig.cajas.length > 0;

        setActiveTab(hasAnyAisle ? 'piezas' : 'config');
      } catch (err) {
        setError(err.message || 'No se pudo leer el archivo Excel.');
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleSaveConfig = (newConfig) => {
    setConfig(newConfig);
    if (baseRecords) {
      const fresh = runLneAnalysis(baseRecords, newConfig);
      if (reports) {
        const preserveComments = (oldList, newList) => {
          const map = new Map(oldList.map((r) => [r.id, r.comentario]));
          return newList.map((r) => ({ ...r, comentario: map.get(r.id) || '' }));
        };
        fresh.piezas = preserveComments(reports.piezas, fresh.piezas);
        fresh.refri = preserveComments(reports.refri, fresh.refri);
        fresh.cajas = preserveComments(reports.cajas, fresh.cajas);
      }
      setReports(fresh);
      syncReportsToHistory(activeHistoryId, fresh);
    }
  };

  const handleUpdateComment = (area, rowId, value) => {
    setReports((prev) => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        [area]: prev[area].map((row) =>
          row.id === rowId ? { ...row, comentario: value } : row
        ),
      };
      syncReportsToHistory(activeHistoryId, updated);
      return updated;
    });
  };

  const handleBulkUpdateComments = (area, rowIds, value) => {
    const idSet = new Set(rowIds);
    setReports((prev) => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        [area]: prev[area].map((row) =>
          idSet.has(row.id) ? { ...row, comentario: value } : row
        ),
      };
      syncReportsToHistory(activeHistoryId, updated);
      return updated;
    });
  };

  const handleLoadHistoryEntry = (entry) => {
    setBaseRecords(null);
    setFileName(entry.fileName);
    setActiveShift(entry.shift || getShiftFromDate(new Date(entry.uploadedAt)));
    setReports(entry.reports);
    setActiveHistoryId(entry.id);
    setError('');
    setActiveTab('piezas');
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

  const handleResetAll = () => {
    setBaseRecords(null);
    setReports(null);
    setFileName('');
    setActiveHistoryId(null);
    setActiveShift(getShiftFromDate(new Date()));
    setError('');
    setActiveTab('piezas');
  };

  const shiftOptions = [
    { id: '1er Turno', label: '1er Turno (06:30 - 13:30)', shortLabel: '1er Turno', schedule: '06:30 a 13:30' },
    { id: '2do Turno', label: '2do Turno (13:30 - 22:30)', shortLabel: '2do Turno', schedule: '13:30 a 22:30' },
    { id: '3er Turno', label: '3er Turno (22:30 - 06:30)', shortLabel: '3er Turno', schedule: '22:30 a 06:30' },
  ];

  const handleShiftChange = (shiftId) => {
    const found = shiftOptions.find((s) => s.id === shiftId);
    if (!found) return;
    setActiveShift(found);
    if (activeHistoryId) {
      setHistory((prev) =>
        prev.map((item) => (item.id === activeHistoryId ? { ...item, shift: found } : item))
      );
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-oxxoRed text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <img
              src="/logo-oxxo.png"
              alt="Logo OXXO"
              className="h-10 w-auto rounded shadow-sm bg-white p-0.5"
            />
            <div>
              <h1 className="text-base md:text-lg font-extrabold tracking-tight leading-tight">
                Lineas eliminadas | CEDIS SALTILLO
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-0.5">
                <span className="inline-flex items-center gap-1 text-[11px] bg-black/25 text-white px-2 py-0.5 rounded font-semibold">
                  <Clock className="w-3 h-3 text-oxxoYellow" />
                  <select
                    value={activeShift.id}
                    onChange={(e) => handleShiftChange(e.target.value)}
                    aria-label="Seleccionar turno"
                    className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
                  >
                    {shiftOptions.map((s) => (
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
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-lg transition ${
                activeTab === 'history'
                  ? 'bg-oxxoYellow text-slate-900'
                  : 'bg-white/15 hover:bg-white/25 text-white'
              }`}
            >
              <History className="w-4 h-4" />
              Histórico ({history.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('config')}
              className={`inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-lg transition ${
                activeTab === 'config'
                  ? 'bg-oxxoYellow text-slate-900'
                  : 'bg-white/15 hover:bg-white/25 text-white'
              }`}
            >
              <Settings className="w-4 h-4" />
              Config ({config.piezas.length + config.refri.length + config.cajas.length})
            </button>

            {reports && (
              <>
                <button
                  type="button"
                  onClick={() => exportLneWorkbook(reports, activeShift.label)}
                  className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-lg transition shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  Exportar Excel
                </button>

                <button
                  type="button"
                  onClick={handleResetAll}
                  className="inline-flex items-center gap-1.5 bg-white text-oxxoRed hover:bg-red-50 text-xs font-bold px-3.5 py-2 rounded-lg transition shadow-sm"
                >
                  <Upload className="w-4 h-4" />
                  Nuevo archivo
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 space-y-6">
        {reports && (
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
            <button
              type="button"
              onClick={() => setActiveTab('piezas')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'piezas'
                  ? 'bg-oxxoRed text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <Layers className="w-4 h-4" />
              LNE PIEZAS ({reports.piezas.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('refri')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'refri'
                  ? 'bg-oxxoRed text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <Snowflake className="w-4 h-4" />
              LNE REFRI ({reports.refri.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('cajas')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'cajas'
                  ? 'bg-oxxoRed text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <Package className="w-4 h-4" />
              LNE CAJAS ({reports.cajas.length})
            </button>
          </div>
        )}

        {activeTab === 'history' && (
          <HistoryPanel
            history={history}
            activeHistoryId={activeHistoryId}
            onLoadEntry={handleLoadHistoryEntry}
            onDeleteEntry={handleDeleteHistoryEntry}
            onClearHistory={handleClearHistory}
          />
        )}

        {activeTab === 'config' && (
          <ConfigPanel
            config={config}
            onSaveConfig={handleSaveConfig}
            onResetDefaults={() => handleSaveConfig(DEFAULT_CONFIG)}
          />
        )}

        {!reports && activeTab !== 'config' && activeTab !== 'history' && (
          <FileUploader
            onFileLoaded={handleFileLoaded}
            error={error}
            historyCount={history.length}
            onOpenHistory={() => setActiveTab('history')}
          />
        )}

        {reports && activeTab === 'piezas' && (
          <ReportTable
            title={`LINEAS ELIMINADAS (PIEZAS) • ${activeShift.shortLabel.toUpperCase()}`}
            rows={reports.piezas}
            includeUda={false}
            commentsCatalog={config.commentsCatalog}
            onUpdateComment={(id, val) => handleUpdateComment('piezas', id, val)}
            onBulkUpdateComments={(ids, val) => handleBulkUpdateComments('piezas', ids, val)}
          />
        )}

        {reports && activeTab === 'refri' && (
          <ReportTable
            title={`LINEAS ELIMINADAS (REFRI) • ${activeShift.shortLabel.toUpperCase()}`}
            rows={reports.refri}
            includeUda={true}
            commentsCatalog={config.commentsCatalog}
            onUpdateComment={(id, val) => handleUpdateComment('refri', id, val)}
            onBulkUpdateComments={(ids, val) => handleBulkUpdateComments('refri', ids, val)}
          />
        )}

        {reports && activeTab === 'cajas' && (
          <ReportTable
            title={`LINEAS ELIMINADAS (CAJAS) • ${activeShift.shortLabel.toUpperCase()}`}
            rows={reports.cajas}
            includeUda={false}
            commentsCatalog={config.commentsCatalog}
            onUpdateComment={(id, val) => handleUpdateComment('cajas', id, val)}
            onBulkUpdateComments={(ids, val) => handleBulkUpdateComments('cajas', ids, val)}
          />
        )}
      </main>
    </div>
  );
}
