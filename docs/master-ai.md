# MASTER IA

MASTER IA es un asistente de acceso a protocolos de Urgencia Adulto HPH. Recupera primero fuentes desde `window.CRS_PROTOCOLS` y, cuando la API generativa está disponible, usa una Edge Function de Supabase para redactar una respuesta únicamente con esos fragmentos.

## Principios de seguridad

- La clave de OpenAI nunca se expone en el navegador ni se guarda en GitHub.
- La consulta se rechaza si contiene patrones de RUT/RUN, ficha o correo electrónico.
- La Edge Function vuelve a validar la consulta y limita longitud y cantidad de fuentes.
- El modelo recibe la instrucción de no usar conocimiento general ni completar datos faltantes.
- Si no existe respaldo suficiente en MASTER, debe decirlo explícitamente.
- Las llamadas generativas tienen una cuota diaria por identificador de red seudonimizado. No se guardan preguntas ni datos clínicos en la tabla de cuota.
- `store: false` se envía a la Responses API.
- Las respuestas HTTP de la Edge Function usan `Cache-Control: no-store`.

## Dos modos de respuesta

1. `generative`: la Edge Function usa OpenAI para redactar una respuesta basada exclusivamente en las fuentes recuperadas.
2. `sources`: si OpenAI no está configurado, no tiene cuota/crédito disponible, supera el límite temporal o falla la red, MASTER sigue funcionando y muestra una respuesta extractiva construida solo con el contenido recuperado de los protocolos. Este modo nunca añade conocimiento externo.

El modo `sources` evita que una caída o problema de facturación de un proveedor deje inutilizable el acceso a los protocolos.

## Activación generativa

La recuperación local y la interfaz funcionan sin credencial externa. Para activar la redacción por IA se debe crear el secreto `OPENAI_API_KEY` en Supabase Edge Functions > Secrets. Opcionalmente se puede definir `OPENAI_MODEL`; si no existe, la función usa `gpt-5.4-mini`.

Nunca copiar la clave a `supabase-config.js`, JavaScript público, GitHub, una tabla pública ni localStorage.

## Corpus

Al abrir MASTER IA se cargan, si aún no estaban disponibles, los mismos módulos clínicos vigentes que usa Especialidades: `protocolo-saturacion-sea.js` y `protocolos-2026-ajustes.js`. El runtime completo del asistente sigue siendo diferido y no afecta el arranque normal de Inicio.

## Alcance inicial

La versión inicial responde sobre flujos, protocolos y procedimientos presentes en MASTER. No consulta datos de pacientes ni la rotativa mensual de especialistas de llamado. La rotativa debe seguir verificándose en su módulo específico.

## Pruebas

Las pruebas normales de navegador validan la interfaz, recuperación, privacidad, modo generativo simulado, modo extractivo y móvil sin consumir cuota externa. La prueba real contra la Edge Function queda opt-in y solo se ejecuta con `MASTER_AI_LIVE=1`.
