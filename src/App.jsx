import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  Download,
  RotateCcw,
  Settings,
  Layers,
  Snowflake,
  Package,
  FileSpreadsheet,
} from 'lucide-react';
import FileUploader from './components/FileUploader';
import ConfigPanel from './components/ConfigPanel';
import ReportTable from './components/ReportTable';
import {
  DEFAULT_CONFIG,
  extractConfigFromWorkbook,
  parseBaseRecords,
  runLneAnalysis,
} from './utils/lneProcessor';
import { exportLneWorkbook } from './utils/excelExporter';

const STORAGE_KEY = 'lne_oxxo_sal100_config_v1';

export default function App() {
  const [config, setConfig] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  });

  const [baseRecords, setBaseRecords] = useState(null);
  const [fileName, setFileName] = useState('');
  const [reports, setReports] = useState(null);
  const [activeTab, setActiveTab] = useState('piezas');
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch {
      // Ignorar si localStorage está restringido
    }
  }, [config]);

  const handleFileLoaded = (file) => {
    setError('');
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        const extractedConfig = extractConfigFromWorkbook(workbook);
        const activeConfig = extractedConfig || config;
        if (extractedConfig) {
          setConfig(extractedConfig);
        }

        const { records } = parseBaseRecords(workbook);
        setBaseRecords(records);
        setFileName(file.name);

        const generated = runLneAnalysis(records, activeConfig);
        setReports(generated);

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
    }
  };

  const handleUpdateComment = (area, rowId, value) => {
    setReports((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [area]: prev[area].map((row) =>
          row.id === rowId ? { ...row, comentario: value } : row
        ),
      };
    });
  };

  const handleResetAll = () => {
    if (!window.confirm('¿Estás seguro de reiniciar? Se limpiarán los reportes cargados.')) {
      return;
    }
    setBaseRecords(null);
    setReports(null);
    setFileName('');
    setError('');
    setActiveTab('piezas');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-oxxoRed text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white text-oxxoRed font-black px-2.5 py-1 rounded text-sm tracking-tight border-2 border-oxxoYellow">
              OXXO
            </div>
            <div>
              <h1 className="text-base md:text-lg font-bold leading-tight">
                Formato LNE • Próximos a Cero
              </h1>
              <p className="text-[11px] text-red-100">CEDIS Saltillo (SAL100)</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {fileName && (
              <span className="hidden md:inline-flex items-center gap-1.5 bg-red-900/60 text-xs px-3 py-1.5 rounded-lg border border-red-400/30">
                <FileSpreadsheet className="w-3.5 h-3.5 text-oxxoYellow" />
                {fileName}
              </span>
            )}

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
                  onClick={() => exportLneWorkbook(reports)}
                  className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-lg transition shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  Descargar Excel
                </button>

                <button
                  type="button"
                  onClick={handleResetAll}
                  className="inline-flex items-center gap-1.5 bg-white text-oxxoRed hover:bg-red-50 text-xs font-bold px-3.5 py-2 rounded-lg transition shadow-sm"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reiniciar
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

        {activeTab === 'config' && (
          <ConfigPanel
            config={config}
            onSaveConfig={handleSaveConfig}
            onResetDefaults={() => handleSaveConfig(DEFAULT_CONFIG)}
          />
        )}

        {!reports && activeTab !== 'config' && (
          <FileUploader onFileLoaded={handleFileLoaded} error={error} />
        )}

        {reports && activeTab === 'piezas' && (
          <ReportTable
            title="REPORTE DE PRÓXIMOS A CERO (PIEZAS) | OXXO CEDIS SALTILLO"
            rows={reports.piezas}
            includeUda={false}
            onUpdateComment={(id, val) => handleUpdateComment('piezas', id, val)}
          />
        )}

        {reports && activeTab === 'refri' && (
          <ReportTable
            title="REPORTE DE PRÓXIMOS A CERO (REFRI) | OXXO CEDIS SALTILLO"
            rows={reports.refri}
            includeUda={true}
            onUpdateComment={(id, val) => handleUpdateComment('refri', id, val)}
          />
        )}

        {reports && activeTab === 'cajas' && (
          <ReportTable
            title="REPORTE DE PRÓXIMOS A CERO (CAJAS) | OXXO CEDIS SALTILLO"
            rows={reports.cajas}
            includeUda={false}
            onUpdateComment={(id, val) => handleUpdateComment('cajas', id, val)}
          />
        )}
      </main>
    </div>
  );
}
