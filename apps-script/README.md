# Backend Apps Script de Gestión pacientes

El archivo `gestion-pacientes.gs` es el backend del módulo `#/gestion/pacientes`.

## Contrato

Acepta por POST JSON las acciones:

- `listPatientCases`
- `savePatientCase`
- `updatePatientCase`

Cada solicitud clínica debe incluir `accessToken` y `supabaseAnonKey`. El backend valida el access token contra Supabase Auth y comprueba que el usuario esté activo en `crs_admins` con rol de Jefatura antes de leer o escribir la planilla.

La planilla se crea automáticamente la primera vez con el nombre **CRS HPH - Gestión prioritaria de pacientes** y su ID queda guardado en Script Properties.

## Publicación

Actualizar el proyecto Apps Script que corresponde a la URL configurada en `gestion-pacientes-config.js`, reemplazar su `Code.gs` por `gestion-pacientes.gs` y crear una nueva versión del despliegue Web App. Debe ejecutarse como el propietario del script para que pueda crear y modificar la planilla en Drive.
