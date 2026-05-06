# CRS HPH 2025

Web app estatica para consulta rapida de flujos de derivacion CRS 2025 de Urgencia Adulto HPH.

## Pantallas

- `#/inicio`: portada y accesos rapidos.
- `#/especialidades`: grilla de especialidades y flujos con buscador.
- `#/especialidad/urologia`: ejemplo de pagina individual por especialidad.
- `#/llamados`: acceso al documento mensual de especialistas de llamado y disponibilidad UHD.
- `#/visita`: acceso a la planilla de visita diaria.
- `#/formularios`: formularios de turno, con antimicrobianos activo y otros espacios preparados.
- `#/telefonos`: directorio interno de anexos frecuentes, con buscador y respaldo PDF.
- `#/educacion`: espacio para canal YouTube de Urgencias HPH y podcasts docentes.
- `#/gestion`: registro local de casos con gestion prioritaria, exportable a CSV/Excel compatible o Word.

Cada pagina de especialidad termina con una pregunta de gestion prioritaria. Si se requiere, la app solicita nombre, RUN, telefono, resumen y necesidad del paciente; guarda el caso localmente para jefatura y mantiene disponible el correo prellenado a `gestionaltaseahph@gmail.com`.

La portada incluye un boton `Formularios de turno`. El primer formulario activo es `Antimicrobianos H. Padre Hurtado`. Ley de urgencias abre una pantalla propia con alerta operativa, Decreto 34 local completo y buscador dinamico por patologia/sigla/sinonimo. La busqueda se puede modificar sin partir de cero y los resultados se abren en pantalla separada, ordenados por probabilidad. Los formularios de activacion/consentimiento quedan pendientes. Los formularios de medicamentos de uso ocasional, solicitud de VIH y notificacion obligatoria quedan preparados como pendientes. Los flujos de TVP quedaron concentrados en un solo boton: sospecha TVP, ECO TVP Sotero del Rio y ECO Doppler horario inhabil, con decision separada para inhabil entre semana versus fin de semana. Neurologia queda como boton unico con tres flujos internos: neurorradiologia intervencional, evaluacion neurologica a distancia y posible donante. Viruela simica queda en Protocolos.

La app tambien incluye una carpeta `protocol-docs/` con documentos fuente para abrir el PDF o imagen original desde cada flujo. Al subir esta carpeta a GitHub Pages, esos documentos quedan disponibles para toda persona que tenga el enlace de la app, por lo que deben ser documentos autorizados para publicacion o uso institucional compartido.

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
  visitaDiariaUrl: "https://docs.google.com/spreadsheets/d/14-90hMv4JciofpxQz8TTEXwLHxvKb4iNmOGrpQACmpQ/edit?usp=drive_link"
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
- `ley-urgencias-data.js`: condiciones adultas buscables del Decreto 34.
- `styles.css`: diseno visual responsive.
- `manifest.webmanifest` y `sw.js`: instalacion y uso offline basico.
- `pdf-images/`: imagenes de apoyo extraidas del PDF original.
- `protocol-docs/`: PDFs e imagenes fuente de los flujos actualizados.
- `form-docs/`: documentos operativos anexados a formularios y respaldos internos.
  - `examenes-hph-editable.pdf` y `transfusion-editable.pdf`: versiones digitales rellenables.
