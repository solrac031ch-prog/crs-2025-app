# CRS HPH 2025

Web app estatica para consulta rapida de flujos de derivacion CRS 2025 de Urgencia Adulto HPH.

## Pantallas

- `#/inicio`: portada y accesos rapidos.
- `#/especialidades`: grilla de especialidades y flujos con buscador.
- `#/especialidad/urologia`: ejemplo de pagina individual por especialidad.
- `#/llamados`: acceso al documento mensual de especialistas de llamado.
- `#/visita`: acceso a la planilla de visita diaria.

Los enlaces de Google Drive se configuran en `app.js`, dentro de:

```js
const externalDocs = {
  llamadosUrl: "",
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
