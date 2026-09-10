# Master Urgencias HPH — revisión de arquitectura y seguridad

Fecha: 10 de septiembre de 2026. Repositorio: `solrac031ch-prog/crs-2025-app`.
Base examinada: `abffa9f`. Alcance: arquitectura documentada, módulos de acceso,
Apps Script versionado, autenticación, políticas reales de Supabase, funciones
administrativas, caché de pacientes, CI y dependencias.

**Resultado: hay mejoras aplicadas, pero la app todavía no puede considerarse
completamente endurecida.** No es una certificación, pentest exhaustivo ni revisión
clínica de los protocolos. No se consultaron fichas de pacientes.

## Arquitectura observada

| Capa | Componentes | Evaluación |
|---|---|---|
| Publicación | GitHub Pages, HTML/JS/CSS | Todo archivo publicado es accesible sin sesión. Los documentos requieren clasificación previa. |
| Navegación | app-router, route-modules y módulos de pantalla | Existe carga bajo demanda y separación de datos; persisten listeners y compatibilidad global. Guardas estáticas pasan. |
| Contenido clínico | app-protocol-data, formularios, PDFs | Separado de UI. No se modificaron reglas clínicas. |
| Autenticación | Supabase Auth y supabase-admin-users | Credenciales individuales; reglas visibles de roles antes no coincidían con el servidor. |
| Contenido remoto | supabase-backend, tablas crs_* | RLS habilitada en tablas consultadas; lecturas públicas del contenido publicado. |
| Pacientes | gestion-pacientes-runtime → Apps Script → Google Sheets | Lectura protegida, pero registro público por RUT; falta autenticar a los médicos. |
| Archivos | bucket crs-public | Público. No apto para datos identificables ni documentos privados/borradores confidenciales. |
| IA | master-ai, proveedores externos, cuota SQL | Filtrado de identificadores en pregunta; fuentes aportadas por cliente necesitan controles adicionales. |
| Calidad | scripts/check-*, tests/e2e, nuevos tests/security | 16 guardas y 9 pruebas de seguridad aprobadas. Navegador pendiente. |

## Cambios aplicados en producción

1. **Escalada de privilegios por acceso directo a crs_admins.** La política anterior
   permitía a cualquier usuario considerado administrador por `crs_is_admin()`
   crear o modificar administradores, aunque la UI ocultara la opción a un jefe.
   Se aplicó `master_user_permission_boundary`, con una función en `crs_private`
   y una política de escritura para creador/admin/diseñador. Jefe y jefatura
   conservan acceso de contenido; no pueden modificar administradores.
2. **Mismo bypass por Edge Function.** `crs-admin-users` versión 8 sólo comprobaba
   `active`. Se desplegó versión 9, manteniendo validación JWT y exigiendo rol de
   gestión de usuarios. Rechaza roles de destino no admitidos.
3. **search_path del trigger.** `crs_touch_updated_at` ahora fija search_path vacío.
   El aviso correspondiente desapareció al repetir los advisors.

La prueba SQL usó cuentas ficticias dentro de una transacción revertida: un jefe
no pudo elevar su rol y un creador sí pudo modificar el estado de otro usuario.
Se verificó después la política instalada. La función desplegada rechaza una
petición sin credenciales con HTTP 401. Las combinaciones de rol fueron probadas
con dobles locales; no se modificaron contraseñas ni cuentas reales para probar.

## Cambios preparados en código, aún sin publicar

- Apps Script: rechaza JSON no objeto y solicitudes mayores de 65.536 caracteres.
- Elimina el despacho implícito de acciones desconocidas hacia el registro público.
- Exige `active === true` y rol autorizado para lectura/escritura de Jefatura;
  elimina la excepción por correo de propietario.
- Conserva el ID de la planilla si falla su apertura y detiene la operación.
- Serializa creación/actualización protegida mediante ScriptLock; mueve apertura
  de planilla pública dentro del lock existente.
- Genera número, ID, fecha y autor de registros protegidos en servidor.
- Escapa también las celdas del historial contra fórmulas.
- Frontend: elimina roles derivados de user_metadata y excepciones por correo.
- Vacía caché clínica al cambiar sesión y descarta respuestas pendientes de la
  sesión anterior para impedir que repueblen esa caché.
- Añade 9 pruebas funcionales de seguridad e incorpora su ejecución a CI.

Estos cambios no actualizan el despliegue de Apps Script ni GitHub Pages por sí
solos. Debe cotejarse primero el Apps Script activo: el repositorio contiene una
versión 5 y hay un archivo histórico versión 7. No se asume que la copia del
repositorio sea idéntica a producción.

## Pendientes prioritarios

| Prioridad | Hallazgo y evidencia | Siguiente acción |
|---|---|---|
| Alta | `savePublicPatientCase` admite solicitudes usando un RUT registrado. `gestion-pacientes-runtime` y UHD lo utilizan sin sesión. | Crear autenticación individual para médicos y permiso de sólo envío. No otorgar Jefatura a todos los solicitantes. Retirar registro público al migrar ambos formularios. |
| Alta | Apps Script en repositorio y archivos históricos difieren. La UI no envía el código que la copia versión 5 pide para dar de alta un médico. | Obtener el código activo del editor y comparar antes de reemplazarlo. No publicar una versión antigua por accidente. |
| Alta | `crs-public` es público; ocultar una publicación no vuelve privado su archivo. | Separar archivos públicos y privados; usar URLs firmadas para privados y revisar inventario institucional sin extraer pacientes. |
| Alta | IA filtra identificadores en `question`, pero `sources` también llega al proveedor y lo controla el cliente (`master-ai/index.ts`). | Validar fuentes en servidor, examinar todos los campos y limitar el cuerpo antes de parsearlo. El filtro por patrones no garantiza anonimización. |
| Media | Cuota de IA usa cabeceras IP; su confiabilidad depende de la infraestructura. | Verificar qué cabecera impone el proxy y añadir límite global, no sólo cuota por IP. No se ha demostrado bypass en producción. |
| Media | SDK Supabase usa `@2` en CDN/Edge; no hay lockfile versionado. | Fijar versiones verificadas, registrar lockfile y probar actualización. No se eligió una versión arbitraria. |
| Media | Protección de contraseñas filtradas deshabilitada según advisors. | Activarla si el plan/configuración lo permite: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection |
| Media | `crs_is_admin()` real sólo comprueba usuario activo y difiere del setup, que además limita roles. | Versionar y conciliar funciones/políticas reales con una única secuencia reproducible. |
| Media | Función `master-ai-cloudflare-check` activa no aparece en el repositorio. | Revisar su contenido, autorización y propósito; no se eliminó ni se presume vulnerable. |
| Media | Escapar HTML no valida esquemas de enlaces; `documentButton` usa la URL remota. | Aplicar una política común de URLs permitidas en todos los renderizadores y probar casos maliciosos. |
| Media | Scripts globales y loaders aún distribuyen responsabilidades. | Consolidar ciclo de rutas/autenticación con pruebas de transición; evitar una reescritura masiva sin navegador. |
| Media | Creación inicial y migración de encabezados siguen ligadas a solicitudes; escrituras en Sheets e historial no son una transacción única. | Separar aprovisionamiento/migración, definir recuperación, idempotencia y control de versión de registros. |

## Validación y límites

- 16 scripts `scripts/check-*.mjs`: aprobados.
- 9 pruebas `node --test tests/security/access.test.mjs`: aprobadas.
- Prueba SQL de roles sobre la base real: aprobada y revertida.
- Política instalada, versión 9 de Edge y rechazo 401: comprobados.
- Aviso search_path: resuelto. Quedan avisos de función SECURITY DEFINER pública
  utilizada por políticas y protección de contraseñas. La tabla de cuota sin
  políticas está cerrada a clientes por diseño; no se abrió para silenciar el aviso.
- 5 pruebas de navegación intentadas: no arrancaron por ausencia de Chromium;
  no son cinco fallos funcionales demostrados. La instalación npm no pudo
  completarse por restricción de red; se utilizó el runner disponible del entorno,
  sin modificar dependencias versionadas.
- No se comprobaron permisos de Drive, copias/restauración, autenticación real de
  cada usuario, recorrido clínico completo, todas las rutas XSS ni contenido de
  todos los documentos binarios.

## Orden de cierre

1. Comparar Apps Script desplegado y migrar autenticación de médicos.
2. Publicar los cambios probados del frontend/Apps Script con pruebas de navegador.
3. Clasificar archivos, endurecer IA y conciliar esquema real/versionado.
4. Fijar dependencias, ejecutar E2E completo y ensayar recuperación de respaldo.

Referencia de permisos: https://supabase.com/docs/guides/database/postgres/row-level-security
