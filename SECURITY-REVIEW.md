# Master Urgencias HPH — revisión de arquitectura y seguridad

Fecha: 10 de septiembre de 2026. Repositorio: `solrac031ch-prog/crs-2025-app`.
Base examinada: `abffa9f`. Alcance: arquitectura documentada, módulos de acceso,
Apps Script versionado, autenticación, políticas reales de Supabase, funciones
administrativas, caché de pacientes, MASTER IA, URLs remotas, Storage, CI y
dependencias.

**Resultado: hay mejoras aplicadas y otras preparadas en una rama de revisión, pero
la app todavía no puede considerarse completamente endurecida.** No es una
certificación, pentest exhaustivo ni revisión clínica de los protocolos. No se
consultaron fichas de pacientes ni se abrió el contenido de los archivos de Storage.

## Arquitectura observada

| Capa | Componentes | Evaluación |
|---|---|---|
| Publicación | GitHub Pages, HTML/JS/CSS | Todo archivo publicado en Pages es accesible sin sesión. Los documentos requieren clasificación previa. |
| Navegación | app-router, route-modules y módulos de pantalla | Existe carga bajo demanda y separación de datos. Llamados quedó bajo propiedad explícita de ruta: usa base estructurada sólo con cobertura completa y PDF como respaldo. Persisten responsabilidades globales en otros subsistemas. |
| Contenido clínico | app-protocol-data, formularios, PDFs | Separado de UI. No se modificaron reglas clínicas. |
| Autenticación | Supabase Auth y supabase-admin-users | Credenciales individuales; reglas visibles de roles antes no coincidían con el servidor. |
| Contenido remoto | supabase-backend, tablas crs_* | RLS habilitada en tablas consultadas; lecturas públicas del contenido publicado. La rama valida esquemas de URL al persistir, leer y renderizar. |
| Pacientes | gestion-pacientes-runtime → Apps Script → Google Sheets | Lectura protegida, pero registro público por RUT; falta autenticar a los médicos. |
| Archivos | Storage `crs-public` | Producción aún usa un bucket público. La rama ya está preparada para usar `file_path` + URLs firmadas y contiene una migración de cutover no aplicada que vuelve privado el bucket y liga lectura a contenido publicado. |
| IA | master-ai, proveedores externos, cuota SQL | La rama filtra identificadores en la pregunta, valida las fuentes contra el catálogo canónico en servidor, limita el body y falla cerrado si el catálogo no puede verificarse. Aún no está desplegada. |
| Calidad | scripts/check-*, tests/e2e, tests/security | Guardas estáticas, pruebas de seguridad y workflow E2E completo aprobados en Chromium. |

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
- Llamados: unifica el contrato del buscador y conserva fecha/consulta durante
  transiciones entre motores para evitar pérdidas de estado por carreras.
- La base estructurada de Llamados sólo sustituye al PDF si cubre todas las
  especialidades del catálogo; una extracción parcial se rechaza antes de reemplazar filas.
- La reconstrucción desde Jefatura tampoco considera vigente una base parcial y
  valida cobertura completa antes de una sustitución.
- Los módulos estructurado/backfill dejaron el arranque global: Jefatura y Llamados
  los cargan bajo demanda, con una guarda de arquitectura que impide regresiones.
- MASTER IA ya no confía en `source.text` ni en el resumen enviado por el navegador:
  valida título/categoría/página contra el catálogo canónico y reconstruye el texto
  server-side antes de llamar a Cloudflare/OpenAI.
- MASTER IA limita la solicitud completa a 32 KB antes de parsear JSON y falla
  cerrado, sin llamar a proveedores externos, si el catálogo canónico no puede verificarse.
- El parser JSON5 de MASTER IA está fijado exactamente a `2.2.3` y CI impide
  reintroducir confianza en contenido de fuente controlado por el cliente.
- Se añadió una política común de URLs: permite HTTPS y enlaces relativos; HTTP sólo
  en localhost para desarrollo. Rechaza esquemas como `javascript:`, `data:`,
  `blob:`, `file:`, `mailto:` y HTTP remoto.
- Supabase valida URLs al guardar y al leer; los renderizadores vuelven a validarlas
  antes de crear enlaces o imágenes. Una URL insegura ya almacenada queda sin enlace.
- Se invalidó la versión anterior de caché pública para que URLs antiguas no sobrevivan
  en `sessionStorage`, y se añadieron pruebas de regresión para la nueva política.
- Storage: `file_path` pasa a ser la referencia canónica para objetos propios. El
  frontend deja de usar `getPublicUrl()` y genera URLs firmadas de 900 segundos con
  `createSignedUrl()`; las URLs HTTPS externas siguen admitidas.
- Las nuevas cargas a Storage dejan de persistir una URL pública derivada. Las filas
  históricas que todavía contienen esa URL usan `file_path` y una firma temporal.
- La migración `20260910170000_private_published_storage.sql` está preparada pero
  **no aplicada**. Limpia sólo URLs públicas derivadas cuando existe `file_path`,
  cambia `crs-public` a privado y reemplaza la lectura global por una política que
  permite SELECT de objetos únicamente cuando están referenciados por una fila
  `status='published'` en contenido, documentos o flujos.
- La migración de Storage no mueve ni borra archivos. Una firma creada antes de
  archivar un elemento puede seguir funcionando hasta que venza su TTL de 15 minutos.
- Las guardas de CI prohíben reintroducir `getPublicUrl()` en el backend y exigen el
  contrato de URLs firmadas y la política de Storage ligada a publicación.

## Inventario de Storage observado

La revisión de producción se hizo sólo sobre metadatos de `storage.buckets`,
`storage.objects` y referencias `file_path`; no se descargaron ni abrieron archivos.

- Existe un único bucket, `crs-public`, que **sigue marcado `public=true` en producción**.
- Contiene 24 objetos, aproximadamente 566 MB: 13 MP4, 9 PDF y 2 JPEG.
- Los 24 objetos están referenciados por las tablas de contenido: no se observaron
  objetos huérfanos en este inventario.
- 13 objetos están referenciados por filas `published` y 11 por filas archivadas.
- Con el predicado exacto de la migración preparada, los 13 publicados conservarían
  acceso mediante firma temporal y los 11 archivados dejarían de poder obtener una
  nueva firma pública.
- El bucket público actual omite el control de lectura de RLS al servir un objeto por
  su URL pública. Supabase documenta que un bucket privado vuelve a someter las
  descargas a control de acceso y permite compartirlas mediante URLs firmadas.

No se ejecutó la migración porque el frontend firmado todavía no está desplegado.
Aplicarla antes del frontend rompería enlaces históricos. El orden seguro es:
publicar primero el frontend compatible, verificar firmas reales y recién entonces
hacer el cutover de Storage con una comprobación posterior de 13/11 o del inventario
vigente en ese momento.

La tabla estructurada de Llamados de septiembre observada durante esta revisión
contiene 177 asignaciones pero sólo 8 de las 16 especialidades del catálogo. No se
reescribió ni borró esa información durante la corrección: mientras permanezca
incompleta, la rama utiliza el PDF vigente como fuente funcional de respaldo.

Estos cambios no actualizan el despliegue de Apps Script, GitHub Pages, MASTER IA ni
Storage por sí solos. Debe cotejarse primero el Apps Script activo: el repositorio
contiene una versión 5 y hay un archivo histórico versión 7. No se asume que la copia
del repositorio sea idéntica a producción.

## Pendientes prioritarios

| Prioridad | Hallazgo y evidencia | Siguiente acción |
|---|---|---|
| Alta | `savePublicPatientCase` admite solicitudes usando un RUT registrado. `gestion-pacientes-runtime` y UHD lo utilizan sin sesión. | Crear autenticación individual para médicos y permiso de sólo envío. No otorgar Jefatura a todos los solicitantes. Retirar registro público al migrar ambos formularios. |
| Alta | Apps Script en repositorio y archivos históricos difieren. La UI no envía el código que la copia versión 5 pide para dar de alta un médico. | Obtener el código activo del editor y comparar antes de reemplazarlo. No publicar una versión antigua por accidente. |
| Alta | Producción todavía mantiene `crs-public` como bucket público; 11 objetos archivados continúan servibles si se conoce su URL. La rama ya contiene frontend firmado y migración privada, ambos probados en CI pero no desplegados. | Desplegar primero el frontend firmado, comprobar `createSignedUrl()` contra producción y después aplicar la migración privada. Confirmar que sólo los objetos actualmente publicados obtienen nuevas firmas. Para futuros archivos realmente confidenciales, usar un bucket privado separado con política de acceso por rol, no la política pública por estado de publicación. |
| Media | El endurecimiento de MASTER IA de esta rama aún no está desplegado y depende de poder obtener el catálogo canónico publicado. | Verificar la URL canónica desde un entorno Edge/staging y comparar con la versión desplegada antes de publicar la función. |
| Media | Cuota de IA usa cabeceras IP; su confiabilidad depende de la infraestructura. | Verificar qué cabecera impone el proxy y añadir límite global, no sólo cuota por IP. No se ha demostrado bypass en producción. |
| Media | SDK Supabase usa `@2` en CDN/Edge; no hay lockfile versionado. | Fijar versiones verificadas, registrar lockfile y probar actualización. No se eligió una versión arbitraria. |
| Media | Protección de contraseñas filtradas deshabilitada según advisors. | Activarla si el plan/configuración lo permite: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection |
| Media | `crs_is_admin()` real sólo comprueba usuario activo y difiere del setup, que además limita roles. | Versionar y conciliar funciones/políticas reales con una única secuencia reproducible. |
| Media | Función `master-ai-cloudflare-check` activa no aparece en el repositorio. | Revisar su contenido, autorización y propósito; no se eliminó ni se presume vulnerable. |
| Media | Fuera de Llamados aún existen scripts globales y listeners de compatibilidad que reparten responsabilidades. | Seguir consolidando por subsistema con pruebas de transición; evitar una reescritura masiva. |
| Media | Creación inicial y migración de encabezados siguen ligadas a solicitudes; escrituras en Sheets e historial no son una transacción única. | Separar aprovisionamiento/migración, definir recuperación, idempotencia y control de versión de registros. |

## Validación y límites

- Guardas `scripts/check-*.mjs`: aprobadas, incluidas las fronteras de Llamados,
  MASTER IA, URLs remotas y el contrato privado de Storage.
- Pruebas `node --test tests/security/access.test.mjs`: aprobadas.
- Workflow E2E de navegación real: aprobado en Chromium tras corregir las carreras
  y el fallback de Llamados; también pasan las pruebas de esquemas de URL seguros y
  la prueba que exige una URL `/storage/v1/object/sign/...` y ausencia de enlaces
  permanentes `/storage/v1/object/public/crs-public/`.
- La prueba de Storage simula una fila histórica con URL pública + `file_path` y
  comprueba que el backend ignore la URL pública persistida y firme `file_path` por
  900 segundos. La ruta puede renderizarse más de una vez; todas las solicitudes de
  firma deben conservar exactamente bucket, ruta y TTL esperados.
- La caché de contenido público vence a los 5 minutos, antes del TTL de firma de
  15 minutos; no se reutilizan firmas vencidas desde esa caché.
- Consulta SQL de sólo lectura sobre producción: el predicado de la migración
  clasifica 13 objetos como permitidos y 11 como denegados. No se aplicó el cambio.
- Prueba SQL de roles sobre la base real: aprobada y revertida.
- Política instalada, versión 9 de Edge y rechazo 401: comprobados.
- Aviso search_path: resuelto. Quedan avisos de función SECURITY DEFINER pública
  utilizada por políticas y protección de contraseñas. La tabla de cuota sin
  políticas está cerrada a clientes por diseño; no se abrió para silenciar el aviso.
- No se comprobaron permisos de Drive, copias/restauración, autenticación real de
  cada usuario, recorrido clínico completo, todas las rutas XSS ni contenido de
  todos los documentos binarios.

## Orden de cierre

1. Comparar Apps Script desplegado y migrar autenticación individual de médicos.
2. Publicar y verificar el frontend de URLs firmadas; sólo después aplicar la
   migración privada de Storage y comprobar acceso publicado/archivado.
3. Verificar el catálogo canónico desde Edge/staging y publicar sólo los cambios de
   MASTER IA ya probados cuando se decida integrar; mantener Apps Script bloqueado.
4. Revisar cuota de IA, conciliar el esquema real/versionado y fijar dependencias.
5. Diseñar un bucket separado para futuros borradores o documentos confidenciales
   que deban ser accesibles sólo por roles autorizados.
6. Ensayar recuperación y restauración antes de considerar la revisión cerrada.

Referencias:
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Buckets públicos/privados: https://supabase.com/docs/guides/storage/buckets/fundamentals
- URLs firmadas de Storage: https://supabase.com/docs/guides/storage/serving/downloads
