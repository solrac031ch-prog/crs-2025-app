# CRS HPH 2025

Aplicación web estática para organizar la información CRS por páginas:

1. Presentación general.
2. Botones por especialidad.
3. Detalle por especialidad + anexos documentales editables por jefatura.

## Edición rápida de documentos mensuales

Los enlaces editables están en `app.js`, dentro del objeto `documents`:

- `documents.onCall.url`: documento mensual de especialistas de llamado.
- `documents.rounds.url`: planilla de visita diaria (Excel/Drive).

Solo deben reemplazar la URL y (opcionalmente) el campo `updatedAt`.
