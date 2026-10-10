function readEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variável de ambiente ausente: ${name}`);
  }
  return value;
}

export function supabaseUrl() {
  return readEnv("NEXT_PUBLIC_SUPABASE_URL");
}

export function supabaseAnonKey() {
  return readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export function supabaseServiceRoleKey() {
  return readEnv("SUPABASE_SERVICE_ROLE_KEY");
}
