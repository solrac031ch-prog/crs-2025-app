# Arquitectura CRS HPH 2025

Este documento define responsabilidades para evitar que la app vuelva a crecer mediante parches que se pisan entre sí.

## Principios

1. **Un dueño por responsabilidad.** Un módulo puede consumir otro, pero no debe duplicar su ciclo de vida.
2. **Las rutas se renderizan una sola vez por cambio.** Los reintentos sólo se justifican para datos remotos y deben ser cancelables.
3. **Supabase es backend, no router.** Los módulos Supabase pueden aportar datos o acciones, pero no deben competir con el router visual.
4. **Jefatura tiene un solo controlador.** `supabase-admin-users.js` es el dueño del render y estado del panel restringido.
5. **Los parches de compatibilidad deben retirarse cuando la lógica puede vivir en su módulo dueño.** No se modifica el cliente Supabase global para resolver un caso local.

## Responsabilidades actuales

### `app.js`

Núcleo histórico de la aplicación. Contiene datos clínicos/operativos y render base de páginas, especialidades, formularios y directorio.

**Objetivo de refactor posterior:** separar datos estáticos de lógica de UI sin cambiar contenido clínico.

### `gestion-panel-final.js`

Dueño de las vistas visuales de Gestión, Noticias, Educación, Paper, Procedimientos y accesos del equipo de Urgencia.

No debe administrar autenticación ni usuarios.

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
  -> app.js (UI base)
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
- Toda escritura Supabase debe quedar protegida por RLS/rol en servidor.
- `supabase-backend.js` no puede contener login, logout ni administración de usuarios.
- El controlador de Jefatura debe aceptar correo directamente, sin monkey-patching de `api.rpc`.
- Los `redirectTo` de recuperación/confirmación no deben incluir `#/jefatura`, porque Supabase necesita controlar el retorno de Auth.
- Los cambios clínicos deben mantenerse separados de refactorizaciones técnicas siempre que sea posible.
- Todo PR debe pasar `.github/workflows/validate.yml`.

## Deuda técnica priorizada

1. Desplegar `crs_login_email` en todas las instalaciones si se decide mantener el ingreso por alias de usuario.
2. Separar datos clínicos estáticos de `app.js` hacia módulos de datos.
3. Reducir estilos inyectados desde JavaScript y moverlos progresivamente a CSS.
4. Añadir pruebas de navegación para rutas críticas.
5. Revisar periódicamente datos sensibles/operativos antes de publicar el repositorio en forma pública.
