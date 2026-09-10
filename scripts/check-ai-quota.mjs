import fs from 'node:fs';

const migrationPath = 'supabase/migrations/20260910174500_ai_global_quota.sql';
const source = fs.readFileSync(migrationPath, 'utf8');
const errors = [];

const required = [
  [/create table if not exists public\.crs_ai_global_usage/i, 'Debe existir un contador global diario separado.'],
  [/alter table public\.crs_ai_global_usage enable row level security/i, 'El contador global debe tener RLS habilitada.'],
  [/revoke all on table public\.crs_ai_global_usage from public, anon, authenticated/i, 'Clientes no deben acceder directamente al contador global.'],
  [/create or replace function public\.crs_take_ai_quota\(\s*p_client_hash text,\s*p_limit integer default 250\s*\)/i, 'Debe conservarse la firma RPC de dos argumentos para compatibilidad.'],
  [/security definer\s*set search_path = ''/i, 'El SECURITY DEFINER debe fijar search_path vacío.'],
  [/p_client_hash !~ '\^\[0-9a-f\]\{64\}\$'/i, 'El RPC debe aceptar sólo hashes SHA-256 hexadecimales.'],
  [/global_daily_limit constant integer := 250/i, 'Debe existir un límite global diario explícito de 250.'],
  [/insert into public\.crs_ai_global_usage/i, 'El RPC debe consumir cuota global de forma atómica.'],
  [/if client_count > safe_client_limit[\s\S]*?return query select false, 0/i, 'Solicitudes ya bloqueadas por cliente no deben consumir cuota global.'],
  [/least\(\s*safe_client_limit - client_count,\s*global_daily_limit - global_count/i, 'remaining debe respetar simultáneamente ambos límites.'],
  [/revoke all on function public\.crs_take_ai_quota\(text, integer\) from public/i, 'El RPC privilegiado debe revocar EXECUTE heredado de PUBLIC.'],
  [/revoke execute on function public\.crs_take_ai_quota\(text, integer\) from anon, authenticated/i, 'anon/authenticated no deben ejecutar el SECURITY DEFINER.'],
  [/grant execute on function public\.crs_take_ai_quota\(text, integer\) to service_role/i, 'Sólo service_role debe invocar la cuota desde Edge.']
];

for (const [pattern, message] of required) {
  if (!pattern.test(source)) errors.push(message);
}

if (/grant\s+execute[\s\S]*?crs_take_ai_quota\(text, integer\)[\s\S]*?to\s+(anon|authenticated)/i.test(source)) {
  errors.push('La migración no debe volver a conceder el RPC a clientes finales.');
}

for (const error of errors) console.error(`ERROR: ${error}`);
if (errors.length) process.exit(1);
console.log('Cuota global de MASTER IA OK.');
