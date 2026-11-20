# Control LNE Web App (OXXO CEDIS Saltillo)

Aplicación web en React + Vite + Tailwind CSS + SheetJS (`xlsx`) para procesar el reporte de próximos a cero (`CancelacionPiezas` y `Config`), generar vistas de **LNE PIEZAS**, **LNE REFRI** (con clasificación `UDA5`) y **LNE CAJAS**, capturar comentarios con resumen en tiempo real y exportar a `.xlsx`.

## Desarrollo local

```bash
npm install
npm run dev
```

## Despliegue en Vercel

1. Sube este proyecto a un repositorio de GitHub.
2. Importa el repositorio en Vercel (`vite` es detectado automáticamente).
3. Ejecuta el despliegue (`npm run build` -> `dist`).
