# Lineas eliminadas | Multi-CEDIS

Aplicación web en React + Vite + Tailwind CSS + SheetJS (`xlsx`) para procesar reportes de líneas eliminadas / próximos a cero (`CancelacionPiezas` y `Config`) con soporte Multi-CEDIS.

## Funciones incluidas (v5)
- **Soporte Multi-CEDIS independiente:**
  - Da de alta todos los CEDIS que necesites (ej. `CEDIS SALTILLO`, `CEDIS MONTERREY`, `CEDIS TORREÓN`, etc.).
  - Cada CEDIS conserva su propia configuración independiente de **Pasillos Piezas**, **Pasillos Refri**, **Pasillos Cajas**, **Ítems UDA5** y **Catálogo de Comentarios Homologados** en el navegador (`localStorage`).
- **Navegación directa y Reinicio limpio:**
  - Botón **Inicio / Cargar Excel** siempre visible en la barra superior (incluso dentro de *Configuración* o *Histórico*) para regresar al instante sin perder ninguna configuración guardada.
  - Botón **Reiniciar info** para limpiar los datos del reporte cargado manteniendo intactos todos los CEDIS y sus parámetros.
- **Filtro por Turno o Vista General (`General`, `1er Turno`, `2do Turno`, `3er Turno`).**
- **Gráfica automática de usuarios cuando se selecciona el comentario `"Operacion"`.**
- **Histórico automático** de archivos Excel subidos identificado por CEDIS y turno.

## Instalación local

```bash
npm install
npm run dev
```
