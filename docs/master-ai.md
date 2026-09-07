# MASTER IA

MASTER IA es un asistente de acceso a protocolos de Urgencia Adulto HPH. Recupera primero fuentes desde `window.CRS_PROTOCOLS` y usa una Edge Function de Supabase para decidir cómo responder sin sacar la consulta del marco institucional.

## Arquitectura de costo $0 obligatorio

Orden de ejecución:

1. MASTER recupera localmente los protocolos relevantes.
2. Cloudflare Workers AI intenta redactar la respuesta con esas fuentes.
3. OpenAI queda integrado como fallback opcional, pero viene desactivado por defecto para evitar cualquier cobro inesperado.
4. Si la IA externa no está disponible, MASTER responde en modo `sources`, usando únicamente contenido extraído de los protocolos.

Así la aplicación nunca depende de un proveedor pagado para seguir funcionando.

## Proveedores

### Cloudflare Workers AI

Es el proveedor principal. Variables esperadas en Supabase Edge Functions > Secrets:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_MODEL` opcional; por defecto `@cf/meta/llama-3.3-70b-instruct-fp8-fast`

El modelo por defecto se eligió después de una prueba real de respuesta institucional con Clave Negra. La integración acepta también un token pegado accidentalmente dentro de un comando de ejemplo, extrayendo únicamente el valor `cfut_...`; aun así, la forma recomendada es guardar solo el token en el secreto.

Las credenciales nunca se exponen en el navegador ni se guardan en GitHub.

### OpenAI

OpenAI permanece integrado como segundo proveedor. Variables:

- `OPENAI_API_KEY`
- `OPENAI_MODEL` opcional; por defecto `gpt-5.4-mini`
- `OPENAI_FALLBACK_ENABLED=true` solo si se decide permitir que la Edge Function lo invoque.

`OPENAI_FALLBACK_ENABLED` queda desactivado por defecto. Esto es intencional: no existe una forma fiable de garantizar desde MASTER que una llamada a OpenAI consumirá únicamente crédito gratuito y nunca saldo pagado. Mientras el objetivo sea costo $0 obligatorio, no activar este flag.

## Principios de seguridad

- Ninguna credencial privada se expone en JavaScript público.
- La consulta se rechaza si contiene patrones de RUT/RUN, ficha o correo electrónico.
- La Edge Function vuelve a validar la consulta y limita longitud y cantidad de fuentes.
- Los modelos reciben la instrucción de usar únicamente las fuentes recuperadas de MASTER.
- Si no existe respaldo suficiente, la aplicación debe decirlo en vez de completar información por conocimiento general.
- Las llamadas generativas mantienen una cuota diaria por identificador de red seudonimizado. La tabla de cuota no almacena preguntas ni datos clínicos.
- Las respuestas HTTP usan `Cache-Control: no-store`.
- OpenAI, cuando se habilite, usa `store: false`.

## Modos de respuesta

- `generative` + `provider: cloudflare`: respuesta redactada por Workers AI usando únicamente las fuentes de MASTER.
- `generative` + `provider: openai`: fallback opcional si se habilita conscientemente.
- `sources` + `provider: local`: respuesta extractiva sin IA externa y sin costo por modelo.
- `none`: no se encontró respaldo institucional suficiente.

## Corpus

Al abrir MASTER IA se cargan, si aún no estaban disponibles, los mismos módulos clínicos vigentes que usa Especialidades: `protocolo-saturacion-sea.js` y `protocolos-2026-ajustes.js`. El runtime completo del asistente sigue siendo diferido y no afecta el arranque normal de Inicio.

## Alcance

MASTER IA responde sobre flujos, protocolos y procedimientos presentes en MASTER. No consulta datos de pacientes ni la rotativa mensual de especialistas de llamado. La rotativa debe seguir verificándose en su módulo específico.

## Pruebas

Las pruebas normales de navegador validan interfaz, recuperación, privacidad, modo generativo simulado, modo extractivo y móvil sin consumir cuota externa. La integración Cloudflare se validó además contra la Edge Function real con un caso de Clave Negra antes de habilitarla en producción. Las pruebas reales recurrentes se mantienen fuera del flujo normal para no consumir cuota gratuita de proveedores en cada PR.
