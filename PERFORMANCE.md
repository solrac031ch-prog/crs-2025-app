# Rendimiento y carga bajo demanda

La app mantiene un arranque liviano y carga los módulos secundarios únicamente cuando la ruta los necesita.

## Reglas

- `#/inicio` no debe descargar el SDK de Supabase por inactividad.
- Los callbacks de autenticación de Supabase sí deben activar el SDK aunque la ruta todavía no sea remota.
- `gestion-pacientes-core.js` es un bootstrap pequeño que purga inmediatamente respaldos clínicos heredados. La lógica completa vive en `gestion-pacientes-runtime.js` y se carga cuando corresponde.
- `protocolos-detalle-polish.js` es un bootstrap pequeño. La mejora completa del detalle vive en `protocolos-detalle-polish-runtime.js` y se carga sólo en Especialidades/Protocolos.
- `route-modules.js` es el único punto para incorporar módulos pesados a una ruta.
- Una optimización de rendimiento no puede eliminar validaciones de privacidad, seguridad, RLS, rutas ni contenido clínico.

Estas reglas se verifican en CI mediante `scripts/check-performance-boundary.mjs` y `tests/e2e/performance-smoke.spec.js`.
