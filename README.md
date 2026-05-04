# CRS HPH 2025

Web app estatica para consulta rapida de flujos de derivacion CRS 2025 de Urgencia Adulto HPH.

## Pantallas

- `#/inicio`: portada y accesos rapidos.
- `#/especialidades`: grilla de especialidades y flujos con buscador.
- `#/especialidad/urologia`: ejemplo de pagina individual por especialidad.
- `#/llamados`: acceso al documento mensual de especialistas de llamado y disponibilidad UHD.
- `#/visita`: acceso a la planilla de visita diaria.

Cada pagina de especialidad termina con una pregunta de gestion prioritaria. Si se requiere, la app abre un correo prellenado para enviar a `gestionaltaseahph@gmail.com`; el envio final queda a cargo del usuario.

La portada incluye un boton externo `Activar formulario`. El flujo `ECO TVP Hospital Sotero del Rio` incluye un boton propio para abrir su cuestionario de Google Forms.

## Instalacion en dispositivos

### Windows con Chrome

1. Abrir `https://solrac031ch-prog.github.io/crs-2025-app/`.
2. En la barra superior, presionar el icono de instalar si aparece.
3. Si no aparece, abrir el menu de Chrome.
4. Elegir `Guardar y compartir > Instalar pagina como app` o `Instalar CRS HPH`.
5. Confirmar `Instalar`.

### Windows con Microsoft Edge

1. Abrir `https://solrac031ch-prog.github.io/crs-2025-app/`.
2. Abrir el menu de Edge.
3. Elegir `Aplicaciones > Instalar este sitio como una aplicacion`.
4. Confirmar el nombre `CRS HPH`.
5. Opcional: anclar a barra de tareas o menu inicio.

### iPhone o iPad

1. Abrir la app en Safari: `https://solrac031ch-prog.github.io/crs-2025-app/`.
2. Presionar el boton de compartir.
3. Elegir `Agregar a pantalla de inicio`.
4. Confirmar el nombre `CRS HPH`.
5. Abrir desde el icono creado en la pantalla de inicio.

Los enlaces de Google Drive se configuran en `app.js`, dentro de:

```js
const externalDocs = {
  llamadosUrl: "",
  uhdDisponibilidadUrl: "",
  visitaDiariaUrl: ""
};
```

## Publicacion con GitHub Pages

1. Crear un repositorio publico en GitHub, por ejemplo `crs-2025-app`.
2. Subir el contenido completo de esta carpeta al repositorio.
3. Entrar en `Settings > Pages`.
4. En `Build and deployment`, elegir `Deploy from a branch`.
5. Seleccionar la rama `main` y la carpeta `/(root)`.
6. Guardar.

El sitio quedara disponible en:

```text
https://TU-USUARIO.github.io/crs-2025-app/
```

## Archivos principales

- `index.html`: estructura de la app.
- `app.js`: datos de protocolos, buscador y filtros.
- `styles.css`: diseno visual responsive.
- `manifest.webmanifest` y `sw.js`: instalacion y uso offline basico.
- `pdf-images/`: imagenes de apoyo extraidas del PDF original.
