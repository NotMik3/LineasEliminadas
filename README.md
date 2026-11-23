# Portal Operativo CEDIS (Líneas Eliminadas + Tiendas Cerradas y Aperturas)

Aplicación web en React + Vite + Tailwind CSS + SheetJS (`xlsx`) lista para GitHub y Vercel.

## Módulos principales
1. **Líneas Eliminadas (`LNE`):**
   - Procesamiento de `CancelacionPiezas` y `Config` por CEDIS (`Cedis Saltillo`, etc.).
   - Filtro por turno (`General`, `1er Turno`, `2do Turno`, `3er Turno`), KPI Total de Líneas, Top Ítems de mayor impacto y gráfica de usuarios con `"Operacion"`.
   - Histórico local de cargas y exportación a `.xlsx`.
2. **Tiendas Cerradas y Aperturas:**
   - Lectura directa de `TIENDAS CERRADAS` y `APERTURAS` (ignorando la pestaña `TIENDAS SIN CERVEZA` del Excel).
   - **Catálogo editable de Tiendas Sin Cerveza:** Permite capturar, editar o eliminar manualmente las tiendas (`RETEK`, `TIENDA`, `PLAZA`, `MOTIVO`) que no deben llevar cerveza desde la app.
   - **KPIs y Gráficas:** Total de tiendas cerradas por motivo/plaza, cálculo dinámico de días transcurridos, aperturas programadas (`PENDIENTE` vs `ENTREGADA`), filtros por columna y exportación a `.xlsx`.

## Instalación local

```bash
npm install
npm run dev
```
