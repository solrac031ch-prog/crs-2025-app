# Arquitectura CRS HPH 2025

Este documento define responsabilidades para evitar que la app vuelva a crecer mediante parches que se pisan entre sí.

## Principios

1. **Un dueño por responsabilidad.** Un módulo puede consumir otro, pero no debe duplicar su ciclo de vida.
2. **Las rutas se renderizan una sola vez por cambio.** Los reintentos sólo se justifican para datos remotos y deben ser cancelables.
3. **Supabase es backend, no router.** Los módulos Supabase pueden aportar datos o acciones, pero no deben competir con el router visual.
4. **Jefatura tiene un solo controlador.** `supabase-admin-users.js` es el dueño del render y estado del panel restringido.
5. **Los parches de compatibilidad deben ser temporales y explícitos.** No se agregan listeners globales para corregir un problema local.

## Responsabilidades actuales

### `app.js`

Núcleo histórico de la aplicación. Contiene datos clínicos/operativos y render base de páginas, especialidades, formularios y directorio.

**Objetivo de refactor posterior:** separar datos estáticos de lógica de UI sin cambiar contenido clínico.

### `gestion-panel-final.js`

Dueño de las vistas visuales de Gestión, Noticias, Educación, Paper, Procedimientos y accesos del equipo de Urgencia.

No debe administrar autenticación ni usuarios.

### `supabase-backend.js`

Capa de acceso a datos remotos y operaciones CRUD de contenido/documentos/flujos. Expone `window.CRS_SUPABASE`.

No debe convertirse en un segundo router general.

### `supabase-admin-users.js`

**Único controlador de Jefatura.** Administra autenticación, roles, render del panel y administración de usuarios. Expone `window.CRS_SUPABASE_JEFATURA`.

### `supabase-jefatura-panel.js`

Extensión pequeña para recuperación de contraseña. No controla el ciclo de render de Jefatura ni registra listeners globales de navegación.

### `supabase-config.js`

Configuración y bootstrap de Supabase. Puede cargar el fallback del SDK y normalizar pequeños textos, pero no debe renderizar Jefatura directamente.

## Flujo esperado

```text
index.html
  -> app.js (UI base)
  -> gestion-panel-final.js (vistas de gestión/contenido)
  -> Supabase SDK
  -> supabase-config.js (config/bootstrap)
  -> supabase-admin-users.js (Jefatura)
  -> supabase-backend.js (datos/CRUD)
  -> supabase-jefatura-panel.js (recuperación de clave)
```

## Reglas para cambios nuevos

- No agregar un nuevo `hashchange` si una ruta ya tiene controlador.
- No usar múltiples `setTimeout` para "forzar" el mismo render.
- No modificar `navigator.serviceWorker.register` globalmente.
- No borrar todos los caches del origen.
- Toda escritura Supabase debe quedar protegida por RLS/rol en servidor.
- Los cambios clínicos deben mantenerse separados de refactorizaciones técnicas siempre que sea posible.
- Todo PR debe pasar `.github/workflows/validate.yml`.

## Deuda técnica priorizada

1. Convertir el scheduler doble de `gestion-panel-final.js` en un render cancelable/debounced.
2. Separar datos clínicos estáticos de `app.js` hacia módulos de datos.
3. Reducir estilos inyectados desde JavaScript y moverlos progresivamente a CSS.
4. Añadir pruebas de navegación para rutas críticas.
5. Revisar periódicamente datos sensibles/operativos antes de publicar el repositorio en forma pública.
