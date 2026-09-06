# Rotativa mensual de especialistas

La aplicación está preparada para reemplazar mes a mes el PDF de **Especialistas de llamado** desde Jefatura sin modificar código.

## Contrato del PDF

Antes de reemplazar la rotativa vigente, el navegador valida automáticamente el archivo seleccionado:

- debe ser un PDF legible;
- debe contener mes y año dentro del propio documento;
- debe conservar la tabla mensual con los encabezados de todos los días del mes;
- debe conservar suficientes filas reconocibles de especialidades del catálogo de la aplicación.

Si alguna validación falla, la publicación se detiene **antes** de que Supabase reemplace el documento vigente. El PDF anterior sigue activo y aparece un mensaje indicando que el nuevo archivo no fue publicado.

Si el PDF es válido, la aplicación obtiene automáticamente el rótulo `Mes Año` desde el contenido del documento y lo guarda como título de la rotativa. Por lo tanto, el nombre del archivo puede ser cualquiera y no es necesario editar el código cada mes.

## Flujo mensual

1. Entrar a **Jefatura → Operación clínica → Especialistas de llamado**.
2. Seleccionar el PDF del nuevo mes.
3. Publicar.
4. Esperar el mensaje **PDF validado: Mes Año. Publicando como rotativa vigente…** y luego la confirmación normal de Supabase.
5. Abrir **Llamados y UHD** y comprobar una fecha del nuevo mes.

Mientras se mantenga el mismo formato institucional de la rotativa, el lector público usa los encabezados reales de cada semana y la posición de cada celda; no depende de que el mes empiece un día específico de la semana.