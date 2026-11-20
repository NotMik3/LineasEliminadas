# Lineas eliminadas | CEDIS SALTILLO

Aplicación web en React + Vite + Tailwind CSS + SheetJS (`xlsx`) para procesar reportes de líneas eliminadas / próximos a cero (`CancelacionPiezas` y `Config`).

## Funciones incluidas
- **Detección automática de turno** (por hora del reporte o reloj en tiempo real):
  - 1er turno: `06:30 a 13:30`
  - 2do turno: `13:30 a 22:30`
  - 3er turno: `22:30 a 06:30`
- **Ordenamiento y filtros por columna** en los encabezados de cada tabla.
- **Catálogo homologado de comentarios** configurable + **asignación masiva** a filas seleccionadas.
- **Gráfica visual y resumen en tiempo real** junto a la tabla según el comentario asignado.
- **Histórico automático** de archivos Excel cargados en el navegador (`localStorage`), permitiendo recargar sesiones anteriores, continuar editando comentarios o eliminar registros.
- **Exportación a Excel (`.xlsx`)** con pestañas `LNE PIEZAS`, `LNE REFRI` (con regla `UDA5`) y `LNE CAJAS`.

## Instalación local

```bash
npm install
npm run dev
```
