# Lineas eliminadas | CEDIS SALTILLO

Aplicación web en React + Vite + Tailwind CSS + SheetJS (`xlsx`) para procesar reportes de líneas eliminadas / próximos a cero (`CancelacionPiezas` y `Config`).

## Funciones incluidas (v4)
- **Filtro por Turno o Vista General (Todos los turnos juntos):**
  - `General (Todos los turnos)`
  - `1er Turno (06:30 a 13:30)`
  - `2do Turno (13:30 a 22:30)`
  - `3er Turno (22:30 a 06:30)`
- **Gráfica de Usuarios cuando se selecciona `"Operacion"`:**
  - Al asignar el comentario **`Operacion`** (de forma individual o masiva), aparece automáticamente una gráfica y tabla con los **usuarios (`usuario`)** que acumulan líneas y registros eliminados bajo ese motivo.
- **Ordenamiento y filtros por columna** en los encabezados de cada tabla.
- **Catálogo homologado de comentarios** configurable + **asignación masiva** a filas seleccionadas.
- **Histórico automático** de archivos Excel cargados en el navegador (`localStorage`).

## Instalación local

```bash
npm install
npm run dev
```
