# Optimización global — septiembre 2026

Este cambio reduce el trabajo de arranque sin modificar contenido clínico ni contratos de seguridad.

- Gestión pacientes: la purga de almacenamiento clínico legado sigue ocurriendo al inicio; el runtime completo se difiere hasta una ruta que lo necesita.
- Protocolos: el pulido avanzado se difiere a Especialidades/Protocolos.
- Supabase: el SDK se solicita únicamente en rutas remotas o callbacks de autenticación, no por tiempo ocioso en Inicio.
- CI: se agregan guardas estáticas y pruebas de navegador para evitar regresiones de rendimiento, duplicación de runtimes y pérdida de privacidad.

La meta es mantener Inicio y rutas simples rápidas, mientras las funciones especializadas se cargan en el momento de uso.
