import React, { useState, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  UploadCloud,
  FileSpreadsheet,
  AlertCircle,
  Store,
  DoorClosed,
  CalendarPlus,
  BeerOff,
  Download,
  RotateCcw,
  Plus,
  Trash2,
  Search,
  BarChart3,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';
import { parseStoresWorkbook, exportStoresWorkbook } from '../utils/storesProcessor';

const BAR_COLORS = [
  'bg-oxxoRed',
  'bg-amber-500',
  'bg-slate-700',
  'bg-emerald-600',
  'bg-blue-600',
  'bg-purple-600',
];

export default function StoresModule({
  storesData,
  onSetStoresData,
  noBeerStores,
  onAddNoBeerStore,
  onAddBulkNoBeerStores,
  onDeleteNoBeerStore,
  onClearNoBeerStores,
}) {
  const fileInputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  // Sub-pestaña interna: 'cerradas' | 'aperturas' | 'sin_cerveza'
  const [subTab, setSubTab] = useState('cerradas');

  // Filtros y ordenamiento para TIENDAS CERRADAS
  const [closedSearch, setClosedSearch] = useState('');
  const [closedFilters, setClosedFilters] = useState({
    plaza: '',
    retek: '',
    tienda: '',
    notifico: '',
    comentario: '',
  });
  const [closedSort, setClosedSort] = useState({ key: 'diasTranscurridos', direction: 'desc' });

  // Filtros y ordenamiento para APERTURAS
  const [openSearch, setOpenSearch] = useState('');
  const [openFilters, setOpenFilters] = useState({
    plaza: '',
    retek: '',
    tienda: '',
    estatus: '',
    mes: '',
    anio: '',
  });
  const [openSort, setOpenSort] = useState({ key: 'anio', direction: 'desc' });

  // Formulario para agregar tienda sin cerveza
  const [newPlaza, setNewPlaza] = useState('');
  const [newRetek, setNewRetek] = useState('');
  const [newTienda, setNewTienda] = useState('');
  const [newMotivo, setNewMotivo] = useState('NO DEBE LLEVAR CERVEZA');
  const [bulkText, setBulkText] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [noBeerSearch, setNoBeerSearch] = useState('');

  const handleFileUpload = (file) => {
    if (!file) return;
    setError('');
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const parsed = parseStoresWorkbook(workbook);

        onSetStoresData({
          fileName: file.name,
          uploadedAt: new Date().toISOString(),
          closedStores: parsed.closedStores,
          openings: parsed.openings,
        });
        setSubTab('cerradas');
      } catch (err) {
        setError(err.message || 'No se pudo procesar el archivo Excel.');
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const closedStores = storesData?.closedStores || [];
  const openings = storesData?.openings || [];

  // Métricas y resúmenes de TIENDAS CERRADAS
  const closedByComment = useMemo(() => {
    const map = new Map();
    for (const s of closedStores) {
      const c = s.comentario || 'SIN COMENTARIO';
      map.set(c, (map.get(c) || 0) + 1);
    }
    return Array.from(map.entries())
      .map(([comentario, count]) => ({ comentario, count }))
      .sort((a, b) => b.count - a.count);
  }, [closedStores]);

  const closedByPlaza = useMemo(() => {
    const map = new Map();
    for (const s of closedStores) {
      map.set(s.plaza, (map.get(s.plaza) || 0) + 1);
    }
    return Array.from(map.entries())
      .map(([plaza, count]) => ({ plaza, count }))
      .sort((a, b) => b.count - a.count);
  }, [closedStores]);

  // Métricas de APERTURAS
  const openingsStats = useMemo(() => {
    let pendientes = 0;
    let entregadas = 0;
    let otras = 0;
    for (const o of openings) {
      if (o.estatus === 'PENDIENTE') pendientes += 1;
      else if (o.estatus === 'ENTREGADA') entregadas += 1;
      else otras += 1;
    }
    return { total: openings.length, pendientes, entregadas, otras };
  }, [openings]);

  const openingsByYear = useMemo(() => {
    const map = new Map();
    for (const o of openings) {
      const y = o.anio || 'S/A';
      map.set(y, (map.get(y) || 0) + 1);
    }
    return Array.from(map.entries())
      .map(([anio, count]) => ({ anio, count }))
      .sort((a, b) => String(b.anio).localeCompare(String(a.anio)));
  }, [openings]);

  // Filtrado y ordenamiento TIENDAS CERRADAS
  const filteredClosed = useMemo(() => {
    const q = closedSearch.trim().toLowerCase();
    const list = closedStores.filter((s) => {
      if (q) {
        const match =
          s.plaza.toLowerCase().includes(q) ||
          s.retek.toLowerCase().includes(q) ||
          s.tienda.toLowerCase().includes(q) ||
          s.notifico.toLowerCase().includes(q) ||
          s.comentario.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (closedFilters.plaza && s.plaza !== closedFilters.plaza) return false;
      if (closedFilters.retek && !s.retek.toLowerCase().includes(closedFilters.retek.toLowerCase()))
        return false;
      if (
        closedFilters.tienda &&
        !s.tienda.toLowerCase().includes(closedFilters.tienda.toLowerCase())
      )
        return false;
      if (
        closedFilters.notifico &&
        !s.notifico.toLowerCase().includes(closedFilters.notifico.toLowerCase())
      )
        return false;
      if (closedFilters.comentario && s.comentario !== closedFilters.comentario) return false;
      return true;
    });

    return [...list].sort((a, b) => {
      const { key, direction } = closedSort;
      const mult = direction === 'asc' ? 1 : -1;
      if (key === 'diasTranscurridos') {
        const dA = a.diasTranscurridos ?? -1;
        const dB = b.diasTranscurridos ?? -1;
        return (dA - dB) * mult;
      }
      return String(a[key] ?? '').localeCompare(String(b[key] ?? ''), 'es', { numeric: true }) * mult;
    });
  }, [closedStores, closedSearch, closedFilters, closedSort]);

  // Filtrado y ordenamiento APERTURAS
  const filteredOpenings = useMemo(() => {
    const q = openSearch.trim().toLowerCase();
    const list = openings.filter((o) => {
      if (q) {
        const match =
          o.plaza.toLowerCase().includes(q) ||
          o.retek.toLowerCase().includes(q) ||
          o.tienda.toLowerCase().includes(q) ||
          o.notifico.toLowerCase().includes(q) ||
          o.estatus.toLowerCase().includes(q) ||
          o.mes.toLowerCase().includes(q) ||
          o.anio.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (openFilters.plaza && o.plaza !== openFilters.plaza) return false;
      if (openFilters.retek && !o.retek.toLowerCase().includes(openFilters.retek.toLowerCase()))
        return false;
      if (openFilters.tienda && !o.tienda.toLowerCase().includes(openFilters.tienda.toLowerCase()))
        return false;
      if (openFilters.estatus && o.estatus !== openFilters.estatus) return false;
      if (openFilters.mes && o.mes !== openFilters.mes) return false;
      if (openFilters.anio && o.anio !== openFilters.anio) return false;
      return true;
    });

    return [...list].sort((a, b) => {
      const { key, direction } = openSort;
      const mult = direction === 'asc' ? 1 : -1;
      return String(a[key] ?? '').localeCompare(String(b[key] ?? ''), 'es', { numeric: true }) * mult;
    });
  }, [openings, openSearch, openFilters, openSort]);

  // Filtrado TIENDAS SIN CERVEZA (Lista manual)
  const filteredNoBeer = useMemo(() => {
    const q = noBeerSearch.trim().toLowerCase();
    if (!q) return noBeerStores;
    return noBeerStores.filter(
      (b) =>
        b.plaza.toLowerCase().includes(q) ||
        b.retek.toLowerCase().includes(q) ||
        b.tienda.toLowerCase().includes(q) ||
        b.motivo.toLowerCase().includes(q)
    );
  }, [noBeerStores, noBeerSearch]);

  const handleAddSingleNoBeer = (e) => {
    e.preventDefault();
    if (!newRetek.trim() && !newTienda.trim()) return;
    onAddNoBeerStore({
      plaza: newPlaza.trim().toUpperCase() || 'N/A',
      retek: newRetek.trim(),
      tienda: newTienda.trim(),
      motivo: newMotivo.trim() || 'NO DEBE LLEVAR CERVEZA',
    });
    setNewPlaza('');
    setNewRetek('');
    setNewTienda('');
  };

  // Pegado masivo desde Excel o texto (columnas separadas por tabulador o coma: PLAZA, RETEK, TIENDA, MOTIVO)
  const handleBulkPasteSubmit = (e) => {
    e.preventDefault();
    const lines = bulkText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    const parsedItems = [];
    for (const line of lines) {
      const parts = line.includes('\t') ? line.split('\t') : line.split(',');
      const clean = parts.map((p) => p.trim());
      if (clean.length === 1) {
        parsedItems.push({
          plaza: 'N/A',
          retek: clean[0],
          tienda: '',
          motivo: 'NO DEBE LLEVAR CERVEZA',
        });
      } else if (clean.length === 2) {
        parsedItems.push({
          plaza: 'N/A',
          retek: clean[0],
          tienda: clean[1],
          motivo: 'NO DEBE LLEVAR CERVEZA',
        });
      } else {
        parsedItems.push({
          plaza: clean[0].toUpperCase() || 'N/A',
          retek: clean[1] || '',
          tienda: clean[2] || '',
          motivo: clean[3] || 'NO DEBE LLEVAR CERVEZA',
        });
      }
    }

    if (parsedItems.length > 0) {
      onAddBulkNoBeerStores(parsedItems);
    }
    setBulkText('');
    setShowBulkModal(false);
  };

  const renderSortIcon = (sortObj, key) => {
    if (sortObj.key !== key) return <ArrowUpDown className="w-3 h-3 opacity-45 inline ml-1" />;
    return sortObj.direction === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-oxxoYellow inline ml-1" />
    ) : (
      <ArrowDown className="w-3 h-3 text-oxxoYellow inline ml-1" />
    );
  };

  // Listas únicas para selectores de filtros
  const closedUniquePlazas = useMemo(
    () => Array.from(new Set(closedStores.map((s) => s.plaza))).sort(),
    [closedStores]
  );
  const closedUniqueComments = useMemo(
    () => Array.from(new Set(closedStores.map((s) => s.comentario))).sort(),
    [closedStores]
  );

  const openUniquePlazas = useMemo(
    () => Array.from(new Set(openings.map((o) => o.plaza))).sort(),
    [openings]
  );
  const openUniqueEstatus = useMemo(
    () => Array.from(new Set(openings.map((o) => o.estatus))).sort(),
    [openings]
  );
  const openUniqueYears = useMemo(
    () => Array.from(new Set(openings.map((o) => o.anio).filter(Boolean))).sort().reverse(),
    [openings]
  );
  const openUniqueMonths = useMemo(
    () => Array.from(new Set(openings.map((o) => o.mes).filter(Boolean))),
    [openings]
  );

  return (
    <div className="space-y-6">
      {/* Encabezado del módulo */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-50 text-oxxoRed">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-800">
              Control de Tiendas Cerradas, Aperturas y Restricción de Cerveza
            </h2>
            <p className="text-xs text-slate-500">
              Lee las pestañas <code className="bg-slate-100 px-1 rounded">TIENDAS CERRADAS</code> y{' '}
              <code className="bg-slate-100 px-1 rounded">APERTURAS</code> de tu Excel (omitiendo la
              pestaña de cerveza del archivo para administrarla aquí mismo).
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.xlsm"
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files?.[0])}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 bg-oxxoRed hover:bg-red-700 text-white text-xs font-bold px-3.5 py-2 rounded-lg transition shadow-sm"
          >
            <UploadCloud className="w-4 h-4" />
            {storesData ? 'Actualizar Excel' : 'Subir Excel de Tiendas'}
          </button>

          {(storesData || noBeerStores.length > 0) && (
            <button
              type="button"
              onClick={() =>
                exportStoresWorkbook({
                  closedStores,
                  openings,
                  noBeerStores,
                })
              }
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-lg transition shadow-sm"
            >
              <Download className="w-4 h-4" />
              Exportar Excel
            </button>
          )}

          {storesData && (
            <button
              type="button"
              onClick={() => {
                onSetStoresData(null);
                setError('');
              }}
              className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-lg transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Limpiar Excel
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-oxxoRed" />
          <div>
            <p className="font-semibold">Error al leer el archivo</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Sub-pestañas siempre disponibles (incluso antes de subir Excel para gestionar Tiendas sin Cerveza) */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setSubTab('cerradas')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
            subTab === 'cerradas'
              ? 'bg-oxxoRed text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
          }`}
        >
          <DoorClosed className="w-4 h-4" />
          TIENDAS CERRADAS ({closedStores.length})
        </button>

        <button
          type="button"
          onClick={() => setSubTab('aperturas')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
            subTab === 'aperturas'
              ? 'bg-oxxoRed text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
          }`}
        >
          <CalendarPlus className="w-4 h-4" />
          APERTURAS ({openings.length})
        </button>

        <button
          type="button"
          onClick={() => setSubTab('sin_cerveza')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
            subTab === 'sin_cerveza'
              ? 'bg-oxxoDark text-oxxoYellow shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
          }`}
        >
          <BeerOff className="w-4 h-4" />
          TIENDAS SIN CERVEZA ({noBeerStores.length})
        </button>
      </div>

      {/* ZONA DE CARGA SI AÚN NO SE SUBE EXCEL Y SE ESTÁ EN CERRADAS O APERTURAS */}
      {!storesData && subTab !== 'sin_cerveza' && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFileUpload(e.dataTransfer.files?.[0]);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer bg-white border-2 border-dashed rounded-xl p-12 text-center transition ${
            dragging
              ? 'border-oxxoRed bg-red-50/60'
              : 'border-slate-300 hover:border-oxxoRed hover:bg-slate-50'
          }`}
        >
          <div className="mx-auto w-14 h-14 rounded-full bg-red-50 text-oxxoRed flex items-center justify-center mb-4">
            <FileSpreadsheet className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">
            Sube tu archivo &quot;TIENDAS CERRADAS Y APERTURAS.xlsx&quot;
          </h3>
          <p className="text-sm text-slate-500 mt-1 max-w-lg mx-auto">
            Se cargarán automáticamente las pestañas <strong>TIENDAS CERRADAS</strong> (con su
            comentario del porqué) y <strong>APERTURAS</strong>. La pestaña de cerveza del Excel
            será ignorada para que tú definas exactamente cuáles agregar en{' '}
            <strong>TIENDAS SIN CERVEZA</strong>.
          </p>
          <button
            type="button"
            className="mt-5 inline-flex items-center gap-2 bg-oxxoRed hover:bg-red-700 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition shadow-sm"
          >
            <UploadCloud className="w-4 h-4" />
            Seleccionar archivo Excel
          </button>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUB-PESTAÑA 1: TIENDAS CERRADAS                                       */}
      {/* ===================================================================== */}
      {storesData && subTab === 'cerradas' && (
        <div className="space-y-4">
          {/* Tarjetas KPI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-oxxoRed text-white rounded-xl p-4 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-red-100">
                Total Tiendas Cerradas
              </span>
              <p className="text-3xl font-black mt-1">{closedStores.length}</p>
              <p className="text-xs text-red-100 mt-0.5">Archivo: {storesData.fileName}</p>
            </div>

            {closedByPlaza.slice(0, 3).map((p) => (
              <div
                key={p.plaza}
                onClick={() =>
                  setClosedFilters((prev) => ({
                    ...prev,
                    plaza: prev.plaza === p.plaza ? '' : p.plaza,
                  }))
                }
                className={`cursor-pointer rounded-xl p-4 border shadow-sm transition ${
                  closedFilters.plaza === p.plaza
                    ? 'bg-amber-50 border-oxxoYellow'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Plaza {p.plaza}
                </span>
                <p className="text-2xl font-black text-slate-800 mt-1">{p.count} tiendas</p>
                <p className="text-[11px] text-oxxoRed font-semibold mt-0.5">
                  Clic para filtrar plaza
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Tabla de Tiendas Cerradas */}
            <div className="lg:col-span-8 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-oxxoDark text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <span>
                    Mostrando: <strong className="text-oxxoYellow">{filteredClosed.length}</strong>{' '}
                    de {closedStores.length} tiendas
                  </span>
                  {(closedSearch || Object.values(closedFilters).some(Boolean)) && (
                    <button
                      type="button"
                      onClick={() => {
                        setClosedSearch('');
                        setClosedFilters({
                          plaza: '',
                          retek: '',
                          tienda: '',
                          notifico: '',
                          comentario: '',
                        });
                      }}
                      className="inline-flex items-center gap-1 text-amber-300 hover:text-white underline font-semibold"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Limpiar filtros
                    </button>
                  )}
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={closedSearch}
                    onChange={(e) => setClosedSearch(e.target.value)}
                    placeholder="Buscar RETEK, tienda, motivo..."
                    className="w-full bg-white text-slate-800 rounded-md pl-8 pr-3 py-1 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="overflow-x-auto max-h-[68vh]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-800 text-white sticky top-0 z-10 select-none">
                    <tr>
                      <th
                        onClick={() =>
                          setClosedSort((p) => ({
                            key: 'plaza',
                            direction: p.key === 'plaza' && p.direction === 'asc' ? 'desc' : 'asc',
                          }))
                        }
                        className="py-2.5 px-3 font-bold cursor-pointer hover:bg-slate-700"
                      >
                        Plaza {renderSortIcon(closedSort, 'plaza')}
                      </th>
                      <th
                        onClick={() =>
                          setClosedSort((p) => ({
                            key: 'retek',
                            direction: p.key === 'retek' && p.direction === 'asc' ? 'desc' : 'asc',
                          }))
                        }
                        className="py-2.5 px-3 font-bold cursor-pointer hover:bg-slate-700"
                      >
                        RETEK {renderSortIcon(closedSort, 'retek')}
                      </th>
                      <th
                        onClick={() =>
                          setClosedSort((p) => ({
                            key: 'tienda',
                            direction:
                              p.key === 'tienda' && p.direction === 'asc' ? 'desc' : 'asc',
                          }))
                        }
                        className="py-2.5 px-3 font-bold cursor-pointer hover:bg-slate-700"
                      >
                        Tienda {renderSortIcon(closedSort, 'tienda')}
                      </th>
                      <th
                        onClick={() =>
                          setClosedSort((p) => ({
                            key: 'fechaAviso',
                            direction:
                              p.key === 'fechaAviso' && p.direction === 'asc' ? 'desc' : 'asc',
                          }))
                        }
                        className="py-2.5 px-3 font-bold cursor-pointer hover:bg-slate-700 whitespace-nowrap"
                      >
                        Fecha Aviso {renderSortIcon(closedSort, 'fechaAviso')}
                      </th>
                      <th
                        onClick={() =>
                          setClosedSort((p) => ({
                            key: 'notifico',
                            direction:
                              p.key === 'notifico' && p.direction === 'asc' ? 'desc' : 'asc',
                          }))
                        }
                        className="py-2.5 px-3 font-bold cursor-pointer hover:bg-slate-700"
                      >
                        Notificó {renderSortIcon(closedSort, 'notifico')}
                      </th>
                      <th
                        onClick={() =>
                          setClosedSort((p) => ({
                            key: 'comentario',
                            direction:
                              p.key === 'comentario' && p.direction === 'asc' ? 'desc' : 'asc',
                          }))
                        }
                        className="py-2.5 px-3 font-bold cursor-pointer hover:bg-slate-700"
                      >
                        Comentario del Porqué {renderSortIcon(closedSort, 'comentario')}
                      </th>
                      <th
                        onClick={() =>
                          setClosedSort((p) => ({
                            key: 'diasTranscurridos',
                            direction:
                              p.key === 'diasTranscurridos' && p.direction === 'desc'
                                ? 'asc'
                                : 'desc',
                          }))
                        }
                        className="py-2.5 px-3 font-bold text-right cursor-pointer hover:bg-slate-700 whitespace-nowrap"
                      >
                        Días {renderSortIcon(closedSort, 'diasTranscurridos')}
                      </th>
                    </tr>

                    {/* Fila de filtros */}
                    <tr className="bg-slate-700 border-t border-slate-600">
                      <th className="p-1.5">
                        <select
                          value={closedFilters.plaza}
                          onChange={(e) =>
                            setClosedFilters((p) => ({ ...p, plaza: e.target.value }))
                          }
                          className="w-full bg-white text-slate-800 rounded px-1.5 py-1 text-[11px] font-normal"
                        >
                          <option value="">Todas</option>
                          {closedUniquePlazas.map((pl) => (
                            <option key={pl} value={pl}>
                              {pl}
                            </option>
                          ))}
                        </select>
                      </th>
                      <th className="p-1.5">
                        <input
                          type="text"
                          value={closedFilters.retek}
                          onChange={(e) =>
                            setClosedFilters((p) => ({ ...p, retek: e.target.value }))
                          }
                          placeholder="RETEK..."
                          className="w-full bg-white text-slate-800 rounded px-2 py-1 text-[11px] font-normal"
                        />
                      </th>
                      <th className="p-1.5">
                        <input
                          type="text"
                          value={closedFilters.tienda}
                          onChange={(e) =>
                            setClosedFilters((p) => ({ ...p, tienda: e.target.value }))
                          }
                          placeholder="Tienda..."
                          className="w-full bg-white text-slate-800 rounded px-2 py-1 text-[11px] font-normal"
                        />
                      </th>
                      <th className="p-1.5"></th>
                      <th className="p-1.5">
                        <input
                          type="text"
                          value={closedFilters.notifico}
                          onChange={(e) =>
                            setClosedFilters((p) => ({ ...p, notifico: e.target.value }))
                          }
                          placeholder="Notificó..."
                          className="w-full bg-white text-slate-800 rounded px-2 py-1 text-[11px] font-normal"
                        />
                      </th>
                      <th className="p-1.5">
                        <select
                          value={closedFilters.comentario}
                          onChange={(e) =>
                            setClosedFilters((p) => ({ ...p, comentario: e.target.value }))
                          }
                          className="w-full bg-white text-slate-800 rounded px-1.5 py-1 text-[11px] font-normal"
                        >
                          <option value="">Todos los motivos</option>
                          {closedUniqueComments.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </th>
                      <th className="p-1.5"></th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200">
                    {filteredClosed.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-bold text-slate-700">{s.plaza}</td>
                        <td className="py-2 px-3 font-mono font-semibold text-oxxoRed">
                          {s.retek}
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-800">{s.tienda}</td>
                        <td className="py-2 px-3 text-slate-600 whitespace-nowrap">
                          {s.fechaAviso}
                        </td>
                        <td className="py-2 px-3 text-slate-600">{s.notifico}</td>
                        <td className="py-2 px-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded font-semibold text-[11px] ${
                              s.comentario.includes('DEFINITIVO')
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-900'
                            }`}
                          >
                            {s.comentario}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-700">
                          {s.diasTranscurridos !== null ? `${s.diasTranscurridos} d` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Gráfica lateral de Motivos de Cierre */}
            <div className="lg:col-span-4 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-oxxoDark text-white px-4 py-2.5 flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-oxxoYellow" />
                  Motivos de Cierre
                </span>
                <span className="text-oxxoYellow">{closedStores.length} tiendas</span>
              </div>

              <div className="p-4 space-y-3">
                {closedByComment.map((item, idx) => {
                  const maxVal = closedByComment[0]?.count || 1;
                  const pctBar = Math.round((item.count / maxVal) * 100);
                  const pctTotal =
                    closedStores.length > 0
                      ? ((item.count / closedStores.length) * 100).toFixed(1)
                      : 0;
                  return (
                    <div
                      key={item.comentario}
                      onClick={() =>
                        setClosedFilters((p) => ({
                          ...p,
                          comentario: p.comentario === item.comentario ? '' : item.comentario,
                        }))
                      }
                      className="cursor-pointer space-y-1 p-1.5 -mx-1.5 rounded-lg hover:bg-slate-50"
                    >
                      <div className="flex items-center justify-between text-xs gap-2">
                        <span className="font-semibold text-slate-700">{item.comentario}</span>
                        <span className="font-bold text-slate-900 whitespace-nowrap">
                          {item.count} ({pctTotal}%)
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${BAR_COLORS[idx % BAR_COLORS.length]} rounded-full`}
                          style={{ width: `${Math.max(pctBar, 8)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUB-PESTAÑA 2: APERTURAS PROGRAMADAS                                  */}
      {/* ===================================================================== */}
      {storesData && subTab === 'aperturas' && (
        <div className="space-y-4">
          {/* KPIs de Aperturas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-oxxoDark text-white rounded-xl p-4 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                Total Registro Aperturas
              </span>
              <p className="text-3xl font-black text-oxxoYellow mt-1">{openingsStats.total}</p>
            </div>

            <div
              onClick={() =>
                setOpenFilters((p) => ({
                  ...p,
                  estatus: p.estatus === 'PENDIENTE' ? '' : 'PENDIENTE',
                }))
              }
              className={`cursor-pointer rounded-xl p-4 border-2 transition ${
                openFilters.estatus === 'PENDIENTE'
                  ? 'border-amber-500 bg-amber-50'
                  : 'border-amber-200 bg-white hover:border-amber-400'
              }`}
            >
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-800">
                <Clock className="w-3.5 h-3.5" />
                Aperturas Programadas (Pendientes)
              </span>
              <p className="text-3xl font-black text-amber-600 mt-1">{openingsStats.pendientes}</p>
            </div>

            <div
              onClick={() =>
                setOpenFilters((p) => ({
                  ...p,
                  estatus: p.estatus === 'ENTREGADA' ? '' : 'ENTREGADA',
                }))
              }
              className={`cursor-pointer rounded-xl p-4 border-2 transition ${
                openFilters.estatus === 'ENTREGADA'
                  ? 'border-emerald-600 bg-emerald-50'
                  : 'border-emerald-200 bg-white hover:border-emerald-400'
              }`}
            >
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Aperturas Entregadas
              </span>
              <p className="text-3xl font-black text-emerald-600 mt-1">{openingsStats.entregadas}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Tabla de Aperturas */}
            <div className="lg:col-span-9 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-oxxoDark text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <span>
                    Mostrando:{' '}
                    <strong className="text-oxxoYellow">{filteredOpenings.length}</strong> de{' '}
                    {openings.length} aperturas
                  </span>
                  {(openSearch || Object.values(openFilters).some(Boolean)) && (
                    <button
                      type="button"
                      onClick={() => {
                        setOpenSearch('');
                        setOpenFilters({
                          plaza: '',
                          retek: '',
                          tienda: '',
                          estatus: '',
                          mes: '',
                          anio: '',
                        });
                      }}
                      className="inline-flex items-center gap-1 text-amber-300 hover:text-white underline font-semibold"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Limpiar filtros
                    </button>
                  )}
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={openSearch}
                    onChange={(e) => setOpenSearch(e.target.value)}
                    placeholder="Buscar tienda, RETEK, mes..."
                    className="w-full bg-white text-slate-800 rounded-md pl-8 pr-3 py-1 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="overflow-x-auto max-h-[68vh]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-800 text-white sticky top-0 z-10 select-none">
                    <tr>
                      <th
                        onClick={() =>
                          setOpenSort((p) => ({
                            key: 'plaza',
                            direction: p.key === 'plaza' && p.direction === 'asc' ? 'desc' : 'asc',
                          }))
                        }
                        className="py-2.5 px-2.5 font-bold cursor-pointer hover:bg-slate-700"
                      >
                        Plaza {renderSortIcon(openSort, 'plaza')}
                      </th>
                      <th
                        onClick={() =>
                          setOpenSort((p) => ({
                            key: 'retek',
                            direction: p.key === 'retek' && p.direction === 'asc' ? 'desc' : 'asc',
                          }))
                        }
                        className="py-2.5 px-2.5 font-bold cursor-pointer hover:bg-slate-700"
                      >
                        RETEK {renderSortIcon(openSort, 'retek')}
                      </th>
                      <th
                        onClick={() =>
                          setOpenSort((p) => ({
                            key: 'tienda',
                            direction:
                              p.key === 'tienda' && p.direction === 'asc' ? 'desc' : 'asc',
                          }))
                        }
                        className="py-2.5 px-2.5 font-bold cursor-pointer hover:bg-slate-700"
                      >
                        Tienda {renderSortIcon(openSort, 'tienda')}
                      </th>
                      <th className="py-2.5 px-2.5 font-bold whitespace-nowrap">
                        Entrega en Tienda
                      </th>
                      <th className="py-2.5 px-2.5 font-bold whitespace-nowrap">
                        Fecha Apertura
                      </th>
                      <th
                        onClick={() =>
                          setOpenSort((p) => ({
                            key: 'estatus',
                            direction:
                              p.key === 'estatus' && p.direction === 'asc' ? 'desc' : 'asc',
                          }))
                        }
                        className="py-2.5 px-2.5 font-bold cursor-pointer hover:bg-slate-700"
                      >
                        Estatus {renderSortIcon(openSort, 'estatus')}
                      </th>
                      <th
                        onClick={() =>
                          setOpenSort((p) => ({
                            key: 'mes',
                            direction: p.key === 'mes' && p.direction === 'asc' ? 'desc' : 'asc',
                          }))
                        }
                        className="py-2.5 px-2.5 font-bold cursor-pointer hover:bg-slate-700"
                      >
                        Mes {renderSortIcon(openSort, 'mes')}
                      </th>
                      <th
                        onClick={() =>
                          setOpenSort((p) => ({
                            key: 'anio',
                            direction: p.key === 'anio' && p.direction === 'desc' ? 'asc' : 'desc',
                          }))
                        }
                        className="py-2.5 px-2.5 font-bold cursor-pointer hover:bg-slate-700"
                      >
                        Año {renderSortIcon(openSort, 'anio')}
                      </th>
                    </tr>

                    {/* Fila de filtros */}
                    <tr className="bg-slate-700 border-t border-slate-600">
                      <th className="p-1">
                        <select
                          value={openFilters.plaza}
                          onChange={(e) => setOpenFilters((p) => ({ ...p, plaza: e.target.value }))}
                          className="w-full bg-white text-slate-800 rounded px-1 py-1 text-[11px] font-normal"
                        >
                          <option value="">Todas</option>
                          {openUniquePlazas.map((pl) => (
                            <option key={pl} value={pl}>
                              {pl}
                            </option>
                          ))}
                        </select>
                      </th>
                      <th className="p-1">
                        <input
                          type="text"
                          value={openFilters.retek}
                          onChange={(e) => setOpenFilters((p) => ({ ...p, retek: e.target.value }))}
                          placeholder="RETEK..."
                          className="w-full bg-white text-slate-800 rounded px-1.5 py-1 text-[11px] font-normal"
                        />
                      </th>
                      <th className="p-1">
                        <input
                          type="text"
                          value={openFilters.tienda}
                          onChange={(e) =>
                            setOpenFilters((p) => ({ ...p, tienda: e.target.value }))
                          }
                          placeholder="Tienda..."
                          className="w-full bg-white text-slate-800 rounded px-1.5 py-1 text-[11px] font-normal"
                        />
                      </th>
                      <th className="p-1"></th>
                      <th className="p-1"></th>
                      <th className="p-1">
                        <select
                          value={openFilters.estatus}
                          onChange={(e) =>
                            setOpenFilters((p) => ({ ...p, estatus: e.target.value }))
                          }
                          className="w-full bg-white text-slate-800 rounded px-1 py-1 text-[11px] font-normal"
                        >
                          <option value="">Todos</option>
                          {openUniqueEstatus.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </th>
                      <th className="p-1">
                        <select
                          value={openFilters.mes}
                          onChange={(e) => setOpenFilters((p) => ({ ...p, mes: e.target.value }))}
                          className="w-full bg-white text-slate-800 rounded px-1 py-1 text-[11px] font-normal"
                        >
                          <option value="">Todos</option>
                          {openUniqueMonths.map((m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                        </select>
                      </th>
                      <th className="p-1">
                        <select
                          value={openFilters.anio}
                          onChange={(e) => setOpenFilters((p) => ({ ...p, anio: e.target.value }))}
                          className="w-full bg-white text-slate-800 rounded px-1 py-1 text-[11px] font-normal"
                        >
                          <option value="">Todos</option>
                          {openUniqueYears.map((y) => (
                            <option key={y} value={y}>
                              {y}
                            </option>
                          ))}
                        </select>
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200">
                    {filteredOpenings.map((o) => (
                      <tr
                        key={o.id}
                        className={
                          o.estatus === 'PENDIENTE'
                            ? 'bg-amber-50/50 hover:bg-amber-50'
                            : 'hover:bg-slate-50'
                        }
                      >
                        <td className="py-2 px-2.5 font-bold text-slate-700">{o.plaza}</td>
                        <td className="py-2 px-2.5 font-mono font-semibold text-oxxoRed">
                          {o.retek}
                        </td>
                        <td className="py-2 px-2.5 font-semibold text-slate-800">{o.tienda}</td>
                        <td className="py-2 px-2.5 text-slate-600 whitespace-nowrap">
                          {o.entregaEnTienda || '-'}
                        </td>
                        <td className="py-2 px-2.5 text-slate-600 whitespace-nowrap">
                          {o.fechaApertura || '-'}
                        </td>
                        <td className="py-2 px-2.5">
                          <span
                            className={`inline-block px-2 py-0.5 rounded font-bold text-[10px] ${
                              o.estatus === 'PENDIENTE'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : o.estatus === 'ENTREGADA'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {o.estatus}
                          </span>
                        </td>
                        <td className="py-2 px-2.5 text-slate-600">{o.mes}</td>
                        <td className="py-2 px-2.5 font-mono font-semibold text-slate-700">
                          {o.anio}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Gráfica lateral de Aperturas por Año */}
            <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-oxxoDark text-white px-4 py-2.5 flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-oxxoYellow" />
                  Aperturas por Año
                </span>
              </div>

              <div className="p-4 space-y-3">
                {openingsByYear.map((item, idx) => {
                  const maxVal = Math.max(...openingsByYear.map((x) => x.count), 1);
                  const pctBar = Math.round((item.count / maxVal) * 100);
                  return (
                    <div
                      key={item.anio}
                      onClick={() =>
                        setOpenFilters((p) => ({
                          ...p,
                          anio: p.anio === item.anio ? '' : item.anio,
                        }))
                      }
                      className="cursor-pointer space-y-1 p-1.5 -mx-1.5 rounded-lg hover:bg-slate-50"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700">Año {item.anio}</span>
                        <span className="font-bold text-oxxoRed">{item.count} tiendas</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${BAR_COLORS[idx % BAR_COLORS.length]} rounded-full`}
                          style={{ width: `${Math.max(pctBar, 8)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUB-PESTAÑA 3: TIENDAS SIN CERVEZA (GESTIÓN MANUAL EN LA APP)         */}
      {/* ===================================================================== */}
      {subTab === 'sin_cerveza' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-100 text-amber-900">
                  <BeerOff className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    Tiendas que NO deben llevar cerveza ({noBeerStores.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Lista personalizada administrada directamente aquí (no se toma de la pestaña del
                    Excel) y guardada en tu navegador.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowBulkModal((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 bg-oxxoDark hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2 rounded-lg transition"
                >
                  <Plus className="w-3.5 h-3.5 text-oxxoYellow" />
                  Pegar varias tiendas
                </button>

                {noBeerStores.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('¿Vaciar toda la lista de tiendas sin cerveza?')) {
                        onClearNoBeerStores();
                      }
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 border border-red-200 px-3 py-2 rounded-lg transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Vaciar lista
                  </button>
                )}
              </div>
            </div>

            {/* Formulario individual para agregar tienda */}
            <form
              onSubmit={handleAddSingleNoBeer}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 mb-5 items-end"
            >
              <div className="lg:col-span-2">
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                  Plaza
                </label>
                <input
                  type="text"
                  value={newPlaza}
                  onChange={(e) => setNewPlaza(e.target.value)}
                  placeholder="Ej: 10ZAI"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs uppercase focus:outline-none focus:ring-2 focus:ring-oxxoRed"
                />
              </div>

              <div className="lg:col-span-2">
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                  RETEK / CR *
                </label>
                <input
                  type="text"
                  required
                  value={newRetek}
                  onChange={(e) => setNewRetek(e.target.value)}
                  placeholder="Ej: 14993"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-oxxoRed"
                />
              </div>

              <div className="lg:col-span-3">
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                  Nombre de Tienda *
                </label>
                <input
                  type="text"
                  required
                  value={newTienda}
                  onChange={(e) => setNewTienda(e.target.value)}
                  placeholder="Ej: Cerro Del Oro Slw"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-oxxoRed"
                />
              </div>

              <div className="lg:col-span-3">
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                  Motivo / Observación
                </label>
                <input
                  type="text"
                  value={newMotivo}
                  onChange={(e) => setNewMotivo(e.target.value)}
                  placeholder="Ej: DOMI - NO DEBE LLEVAR CERVEZA"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-oxxoRed"
                />
              </div>

              <div className="lg:col-span-2">
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-1.5 bg-oxxoRed hover:bg-red-700 text-white text-xs font-bold py-2 px-3 rounded-lg transition shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Agregar tienda
                </button>
              </div>
            </form>

            {/* Panel opcional de pegado masivo */}
            {showBulkModal && (
              <form
                onSubmit={handleBulkPasteSubmit}
                className="mb-5 bg-amber-50 border border-amber-300 rounded-xl p-4 space-y-3"
              >
                <div>
                  <h4 className="text-xs font-bold text-amber-950">
                    Pegar lista masiva (una tienda por línea)
                  </h4>
                  <p className="text-[11px] text-amber-800">
                    Puedes copiar y pegar directo desde Excel o escribir separado por comas:{' '}
                    <code className="bg-amber-100 px-1 rounded">
                      PLAZA, RETEK, NOMBRE TIENDA, MOTIVO
                    </code>
                  </p>
                </div>

                <textarea
                  rows={5}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder={'10ZAI, 14993, Cerro Del Oro Slw, NO DEBE LLEVAR CERVEZA
10GTO, 33660, Penasquito Zcl, DOMI'}
                  className="w-full rounded-lg border border-amber-300 bg-white p-2.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-oxxoRed"
                />

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-1.5 rounded-lg transition"
                  >
                    Importar líneas
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBulkModal(false)}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}

            {/* Buscador de la lista */}
            {noBeerStores.length > 0 && (
              <div className="mb-3 flex justify-end">
                <div className="relative w-full sm:w-72">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={noBeerSearch}
                    onChange={(e) => setNoBeerSearch(e.target.value)}
                    placeholder="Buscar RETEK o tienda sin cerveza..."
                    className="w-full border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-oxxoRed"
                  />
                </div>
              </div>
            )}

            {/* Tabla de Tiendas Sin Cerveza */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-oxxoDark text-white">
                  <tr>
                    <th className="py-2.5 px-3 font-bold">Plaza</th>
                    <th className="py-2.5 px-3 font-bold">RETEK</th>
                    <th className="py-2.5 px-3 font-bold">Tienda</th>
                    <th className="py-2.5 px-3 font-bold">Motivo / Observación</th>
                    <th className="py-2.5 px-3 font-bold text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredNoBeer.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No hay tiendas registradas en la lista de restricción de cerveza. Agrega una
                        arriba.
                      </td>
                    </tr>
                  ) : (
                    filteredNoBeer.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-bold text-slate-700">{b.plaza}</td>
                        <td className="py-2 px-3 font-mono font-bold text-oxxoRed">{b.retek}</td>
                        <td className="py-2 px-3 font-semibold text-slate-800">{b.tienda}</td>
                        <td className="py-2 px-3 text-slate-600">{b.motivo}</td>
                        <td className="py-2 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => onDeleteNoBeerStore(b.id)}
                            title="Eliminar de la lista"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
