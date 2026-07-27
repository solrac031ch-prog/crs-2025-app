# Arquitectura CRS HPH 2025

Este documento define responsabilidades para evitar que la app vuelva a crecer mediante parches que se pisan entre sí.

## Principios

1. **Un dueño por responsabilidad.** Un módulo puede consumir otro, pero no debe duplicar su ciclo de vida.
2. **Las rutas se renderizan una sola vez por cambio.** Los reintentos sólo se justifican para datos remotos y deben ser cancelables.
3. **Supabase es backend, no router.** Los módulos Supabase pueden aportar datos o acciones, pero no deben competir con el router visual.
4. **Jefatura tiene un solo controlador.** `supabase-admin-users.js` es el dueño del render y estado del panel restringido.
5. **Los parches de compatibilidad deben retirarse cuando la lógica puede vivir en su módulo dueño.** No se modifica un cliente o API global para resolver un caso local.
6. **Los datos clínicos identificables no se persisten en el navegador.** Gestión de pacientes debe fallar cerrada si el almacenamiento remoto no está disponible.
7. **Datos clínicos y lógica visual se versionan por separado.** Las refactorizaciones no deben reescribir contenido clínico mientras cambian arquitectura.
8. **Los estilos estáticos viven en CSS.** JavaScript no debe inyectar hojas de estilo completas cuando pueden cargarse desde `index.html`.

## Responsabilidades actuales

### `app-protocol-data.js`

Dueño del dataset estático de protocolos CRS. Contiene títulos, categorías, campos, flujos, advertencias, patologías y referencias tal como estaban históricamente en `app.js`.

Los cambios de contenido clínico deben hacerse aquí en PRs separados de las refactorizaciones técnicas.

### `app-operational-data.js`

Dueño de datos operativos no clínicos extraídos de `app.js`: documentos/enlaces, formularios externos, rotativa de llamados, directorio telefónico y enlaces de educación.

### `app-forms-data.js`

Dueño de los datos estáticos usados por Formularios: patologías de notificación obligatoria, grupos y sinónimos de búsqueda de Ley de Urgencias, PDF del Decreto 34 y catálogo de formularios de turno.

No renderiza interfaz ni controla rutas. Consume únicamente enlaces ya definidos en `app-operational-data.js`.

### `app.js`

Núcleo visual/base de la aplicación. Consume `window.CRS_PROTOCOLS`, `window.CRS_APP_OPERATIONAL` y `window.CRS_FORMS_DATA`, normaliza los protocolos y mantiene los renderizadores base de especialidades, documentos, directorio y cierre de derivación.

No debe volver a incrustar los datasets ya separados ni recuperar responsabilidades de formularios, router o gestión local de pacientes.

### `app-forms.js`

Dueño de la UI y rutas internas de Formularios, Ley de Urgencias y notificación obligatoria.

Consume los datos preparados por `app-forms-data.js`; no debe volver a contener los listados estáticos de patologías, grupos o sinónimos.

### `app-router.js`

Dueño del router base, filtros y listeners generales de interacción de la app.

No guarda ni exporta casos clínicos. Gestión de pacientes pertenece a `gestion-pacientes-core.js`.

### `gestion-pacientes-core.js`

Único dueño del flujo de Gestión prioritaria de pacientes. Intercepta el formulario de cierre de derivación, exige sesión autorizada, envía los casos al servicio remoto/Google Sheets y renderiza `#/gestion/pacientes`.

Si Drive no está disponible, no debe dejar nombres, RUN, teléfonos ni resúmenes clínicos como respaldo persistente en el navegador. También purga las claves históricas de almacenamiento local.

### `gestion-panel-final.js`

Dueño de las vistas visuales de Gestión, Noticias, Educación, Paper, Procedimientos y accesos del equipo de Urgencia.

No debe administrar autenticación, usuarios ni inyectar su hoja de estilos.

### `gestion-panel-final.css`

Dueño de los estilos `gf-*` usados por `gestion-panel-final.js`, incluidos sus breakpoints responsivos.

Se carga desde `<head>` y debe mantenerse separado de la lógica de render.

### `supabase-backend.js`

Capa de acceso a datos remotos y operaciones CRUD de contenido/documentos/flujos. Expone `window.CRS_SUPABASE`.

No debe convertirse en un segundo router general ni administrar login o usuarios.

### `supabase-admin-users.js`

**Único controlador de Jefatura.** Administra autenticación, roles, render del panel y administración de usuarios. Expone `window.CRS_SUPABASE_JEFATURA`.

El correo electrónico se autentica directamente. La resolución por nombre de usuario mediante `crs_login_email` es opcional. El módulo debe tolerar instalaciones antiguas donde `crs_admins.username` todavía no exista.

### `supabase-jefatura-panel.js`

Extensión pequeña para recuperación de contraseña. Escucha `PASSWORD_RECOVERY`, permite establecer una nueva clave y no controla el ciclo de render de Jefatura ni registra listeners globales de navegación.

### `supabase-config.js`

Configuración y bootstrap de Supabase. Puede cargar el fallback del SDK y normalizar pequeños textos, pero no debe renderizar Jefatura directamente.

## Flujo esperado

```text
index.html
  -> gestion-panel-final.css (estilos de Gestión)
  -> gestion-pacientes-core.js (gestión clínica segura)
  -> app-protocol-data.js (dataset clínico CRS)
  -> app-operational-data.js (datos no clínicos)
  -> app-forms-data.js (datos de formularios/Ley de Urgencias)
  -> app.js (núcleo visual/base)
  -> app-forms.js (UI de formularios y Ley de Urgencias)
  -> app-router.js (router base)
  -> Supabase SDK
  -> supabase-config.js (config/bootstrap)
  -> supabase-backend.js (cliente, datos y CRUD)
  -> supabase-jefatura-panel.js (recuperación de clave)
  -> supabase-admin-users.js (Jefatura)
  -> gestion-panel-final.js (vistas de gestión/contenido)
```

## Reglas para cambios nuevos

- No agregar un nuevo `hashchange` si una ruta ya tiene controlador.
- No usar múltiples `setTimeout` para "forzar" el mismo render.
- No modificar `navigator.serviceWorker.register` globalmente.
- No borrar todos los caches del origen.
- No reintroducir persistencia clínica identificable en `localStorage`.
- No volver a incrustar el dataset de protocolos dentro de `app.js`.
- No volver a incrustar datos estáticos de Ley de Urgencias/notificación obligatoria en `app.js` o `app-forms.js`.
- No volver a inyectar estilos `gf-*` desde `gestion-panel-final.js`.
- Toda escritura Supabase debe quedar protegida por RLS/rol en servidor.
- `supabase-backend.js` no puede contener login, logout ni administración de usuarios.
- El controlador de Jefatura debe aceptar correo directamente, sin monkey-patching de `api.rpc`.
- Los `redirectTo` de recuperación/confirmación no deben incluir `#/jefatura`, porque Supabase necesita controlar el retorno de Auth.
- Los cambios clínicos deben mantenerse separados de refactorizaciones técnicas siempre que sea posible.
- Todo PR debe pasar `.github/workflows/validate.yml`.

## Deuda técnica priorizada

1. Mover progresivamente a CSS los estilos todavía inyectados por módulos como `gestion-pacientes-core.js` y Jefatura.
2. Añadir pruebas de navegador/end-to-end para rutas y formularios críticos.
3. Seguir separando datasets menores de UI sólo cuando reduzca acoplamiento real.
4. Desplegar `crs_login_email` en todas las instalaciones sólo si se decide mantener el ingreso por alias de usuario.
5. Revisar periódicamente datos sensibles/operativos antes de publicar el repositorio en forma pública.
