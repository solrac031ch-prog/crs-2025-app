# Backend Apps Script de Gestión pacientes

El archivo `gestion-pacientes.gs` es el backend del módulo `#/gestion/pacientes`.

## Contrato

Acepta por POST JSON las acciones:

- `listPatientCases`
- `savePatientCase`
- `updatePatientCase`

Las tres acciones protegidas deben incluir `accessToken` y `supabaseAnonKey`. El backend valida el access token contra Supabase Auth y comprueba que el usuario esté activo en `crs_admins` con rol de Jefatura antes de leer o escribir la planilla.

La planilla se crea automáticamente la primera vez con el nombre **CRS HPH - Gestión prioritaria de pacientes** y su ID queda guardado en Script Properties.

## Publicación

Actualizar el proyecto Apps Script que corresponde a la URL configurada en `gestion-pacientes-config.js`, reemplazar su `Code.gs` por `gestion-pacientes.gs` y crear una nueva versión del despliegue Web App. Debe ejecutarse como el propietario del script para que pueda crear y modificar la planilla en Drive.

## Revisión de seguridad de septiembre de 2026

Las escrituras protegidas se serializan mediante ScriptLock. Los números de
solicitud, ID, fecha y autor del registro protegido se generan en servidor.
Si la planilla configurada deja de ser accesible, la operación falla conservando
su ID; no se crea otro archivo como sustituto.

**Limitación pendiente:** el código también conserva `savePublicPatientCase`,
usado por los formularios públicos y UHD. Esta ruta no autentica al médico:
el RUT no acredita identidad. Requiere sustituir ese contrato por una sesión
personal de médico antes de considerar seguro el registro público. La interfaz
actual no envía el código compartido que exige esta copia del backend para altas.
Por tanto, el código publicado de Apps Script debe cotejarse antes de desplegar.
