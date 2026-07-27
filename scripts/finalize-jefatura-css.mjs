import fs from 'node:fs';

function replaceOnce(path, from, to) {
  const source = fs.readFileSync(path, 'utf8');
  if (!source.includes(from)) throw new Error(`No se encontró bloque esperado en ${path}`);
  fs.writeFileSync(path, source.replace(from, to), 'utf8');
}

replaceOnce(
  'index.html',
  '    <link rel="stylesheet" href="./gestion-pacientes-core.css?v=1" />',
  '    <link rel="stylesheet" href="./gestion-pacientes-core.css?v=1" />\n    <link rel="stylesheet" href="./supabase-admin-users.css?v=1" />'
);
replaceOnce('index.html', './supabase-admin-users.js?v=4', './supabase-admin-users.js?v=5');

replaceOnce(
  '.github/workflows/validate.yml',
  '      - name: Validar frontera de estilos de Gestión pacientes\n        run: node scripts/check-patient-style-boundary.mjs\n',
  '      - name: Validar frontera de estilos de Gestión pacientes\n        run: node scripts/check-patient-style-boundary.mjs\n\n      - name: Validar frontera de estilos de Jefatura\n        run: node scripts/check-jefatura-style-boundary.mjs\n'
);

replaceOnce(
  'ARCHITECTURE.md',
  'El correo electrónico se autentica directamente. La resolución por nombre de usuario mediante `crs_login_email` es opcional. El módulo debe tolerar instalaciones antiguas donde `crs_admins.username` todavía no exista.\n\n### `supabase-jefatura-panel.js`',
  'El correo electrónico se autentica directamente. La resolución por nombre de usuario mediante `crs_login_email` es opcional. El módulo debe tolerar instalaciones antiguas donde `crs_admins.username` todavía no exista.\n\nNo debe inyectar su hoja visual; los estilos `crs-access-*` pertenecen a `supabase-admin-users.css`.\n\n### `supabase-admin-users.css`\n\nDueño de los estilos visuales del panel Jefatura: login, tarjetas, formularios, estados y comportamiento responsivo.\n\nSe carga desde `<head>` y debe mantenerse separado de autenticación, roles y CRUD.\n\n### `supabase-jefatura-panel.js`'
);

replaceOnce(
  'ARCHITECTURE.md',
  '  -> gestion-pacientes-core.css (estilos de Gestión pacientes)\n  -> gestion-pacientes-core.js (gestión clínica segura)',
  '  -> gestion-pacientes-core.css (estilos de Gestión pacientes)\n  -> supabase-admin-users.css (estilos de Jefatura)\n  -> gestion-pacientes-core.js (gestión clínica segura)'
);

replaceOnce(
  'ARCHITECTURE.md',
  '- No volver a inyectar estilos `patient-*` desde `gestion-pacientes-core.js`.\n',
  '- No volver a inyectar estilos `patient-*` desde `gestion-pacientes-core.js`.\n- No volver a inyectar estilos `crs-access-*` desde `supabase-admin-users.js`.\n'
);

replaceOnce(
  'ARCHITECTURE.md',
  '1. Mover progresivamente a CSS los estilos todavía inyectados por módulos de Jefatura y otros módulos secundarios.',
  '1. Mover progresivamente a CSS los estilos todavía inyectados por módulos secundarios restantes.'
);

console.log('Frontera CSS de Jefatura finalizada.');
// Commit de disparo: el workflow temporal ya existe en la rama.
