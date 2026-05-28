# Activar Supabase en CRS HPH 2025

Esta app puede seguir publicada en GitHub Pages y usar Supabase como backend para publicaciones frecuentes de Jefatura.

## 1. Crear proyecto

1. Entra a Supabase y crea un proyecto nuevo.
2. Guarda estos dos datos:
   - Project URL
   - anon public key

Estan en Project Settings > API.

## 2. Crear base de datos y storage

1. Abre Supabase > SQL Editor.
2. Copia el contenido de `supabase-setup.sql`.
3. Ejecutalo completo.

Eso crea:

- Publicaciones: noticias, educacion, paper del mes y procedimientos.
- Documentos/formularios globales.
- Flujos nuevos publicados por Jefatura.
- Especialistas de llamado y UHD como documentos globales.
- Usuarios autorizados en `crs_admins`.
- Bucket publico `crs-public` para PDF, imagenes y videos.

## 3. Crear usuario de Jefatura

1. Ve a Authentication > Users.
2. Crea un usuario con correo y clave.
3. Ese correo tambien debe estar en la tabla `crs_admins`.

El SQL deja agregado por defecto:

```text
mdcarlosherrera@gmail.com
```

Puedes cambiarlo o agregar otros correos desde la tabla `crs_admins`.

## 3.1 Activar administracion de usuarios desde la web

Para crear y eliminar usuarios sin entrar al panel de Supabase, despliega la funcion segura incluida en este repositorio:

```bash
supabase functions deploy crs-admin-users
```

La funcion usa `SUPABASE_SERVICE_ROLE_KEY` solo dentro de Supabase Edge Functions. No pongas esa clave en `supabase-config.js` ni en ningun archivo publico.

Despues de desplegarla, el modulo Jefatura puede:

- Crear el usuario en Supabase Authentication.
- Agregar o actualizar su permiso en `crs_admins`.
- Eliminar el usuario de Authentication y de `crs_admins`.

## 4. Conectar la web

Edita `supabase-config.js`:

```js
window.CRS_SUPABASE_CONFIG = {
  url: "https://TU-PROYECTO.supabase.co",
  anonKey: "TU-ANON-PUBLIC-KEY",
  enabled: true,
  bucket: "crs-public",
  adminUsersFunction: "crs-admin-users",
  tables: {
    content: "crs_content_items",
    documents: "crs_documents",
    flows: "crs_flows",
    calls: "crs_call_schedules",
    admins: "crs_admins"
  }
};
```

Despues de publicar ese cambio en GitHub Pages, entra a:

```text
https://solrac031ch-prog.github.io/crs-2025-app/#/jefatura
```

Aparecera el panel Supabase para iniciar sesion y publicar globalmente.

## 5. Como queda el flujo diario

- Jefatura entra al modulo Jefatura.
- Inicia sesion Supabase.
- Publica Paper del mes, Noticias/Educacion, Procedimiento medico, formularios, especialistas/UHD o flujos.
- La app muestra esos cambios desde cualquier computador o celular.

## Importante

No guardar datos sensibles de pacientes en este backend publico sin disenar reglas especificas para datos clinicos. Para casos de pacientes se debe usar un esquema privado separado, con permisos mas estrictos.
