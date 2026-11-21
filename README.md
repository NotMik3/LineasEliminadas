# Lineas Eliminadas | Cedis

Aplicación web en React + Vite + Tailwind CSS + SheetJS (`xlsx`) para procesar reportes de líneas eliminadas (`CancelacionPiezas` y `Config`).

## Funciones incluidas (v7)
- **KPI Principal destacado (`Total de Líneas`):** Tarjeta de indicador principal visible en el panel de gráficas mostrando el total de líneas eliminadas (tanto en ítems únicos como el acumulado de líneas) con desglose por comentario y porcentaje.
- **Gráfica de Top Ítems con mayor impacto:** Gráfica y tabla ranking con código de `Item`, descripción (`Producto`), `Pivote` y total de líneas eliminadas para identificar de inmediato los productos que más impactan.
- **Gráfica de Usuarios con `"Operacion"`:** Acumulado de líneas y registros por usuario cuando se selecciona el comentario `Operacion`.
- **Título y pestaña dinámicos por CEDIS (`Lineas Eliminadas | Cedis <Nombre>`).**
- **Filtro por Turno (`General`, `1er Turno`, `2do Turno`, `3er Turno`)**, ordenamiento y filtros por columna, asignación masiva de comentarios e histórico.

## Instalación local

```bash
npm install
npm run dev
```
