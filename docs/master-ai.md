# MASTER IA

MASTER IA es un asistente local de acceso a protocolos de Urgencia Adulto HPH. La consulta se procesa dentro del navegador y la respuesta se construye únicamente con `window.CRS_PROTOCOLS` y los módulos clínicos cargados por la propia app.

## Objetivo de costo

MASTER IA no depende de OpenAI, Cloudflare Workers AI ni de otra API generativa para funcionar. El modo principal es costo $0 por consulta y no requiere saldo de API.

La Edge Function `master-ai` se mantiene solo como compatibilidad para versiones antiguas de la web. También funciona de manera extractiva y ya no llama a OpenAI ni consume cuota de un proveedor de IA.

## Principios de seguridad

- La pregunta clínica no se envía a un proveedor de IA externo.
- La consulta se rechaza si contiene patrones de RUT/RUN, ficha o correo electrónico.
- Si no existe respaldo suficiente en MASTER, el asistente lo indica explícitamente.
- La respuesta reproduce contenido estructurado del protocolo recuperado: resumen, campos, pasos, advertencias y coincidencias relevantes.
- No añade conocimiento general, recomendaciones externas ni datos inventados.
- No consulta datos de pacientes ni la rotativa mensual de especialistas de llamado.

## Flujo

1. El usuario escribe una pregunta.
2. El navegador normaliza términos y reconoce sinónimos clínicos frecuentes.
3. Se puntúan los protocolos cargados en MASTER.
4. Se selecciona la fuente principal y fuentes relacionadas.
5. La respuesta se arma localmente con el contenido institucional de la fuente principal.
6. Se muestran los documentos/fuentes utilizadas.

## Corpus

Al abrir MASTER IA se cargan, si aún no estaban disponibles, los mismos módulos clínicos que usa Especialidades: `protocolo-saturacion-sea.js` y `protocolos-2026-ajustes.js`. El runtime completo sigue siendo diferido para no afectar el arranque de Inicio.

## Proveedores externos opcionales

La arquitectura puede incorporar en el futuro una capa opcional de redacción con un proveedor gratuito, por ejemplo Cloudflare Workers AI, pero nunca será necesaria para que MASTER funcione. Si se agrega, el motor local seguirá siendo la ruta de respaldo obligatoria.

## Pruebas

Las pruebas de navegador deben comprobar carga diferida, recuperación de fuentes, bloqueo de identificadores, ausencia de llamadas a `functions/v1/master-ai`/OpenAI durante una consulta normal, respuesta local y ausencia de overflow móvil.
