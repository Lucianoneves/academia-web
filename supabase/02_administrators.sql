-- Ordem 2 de 10. Aplicar depois de 01_funcoes.sql.
-- Políticas e permissões desta tabela ficam em 10_rls.sql.
-- Administradores do painel. A senha fica no Supabase Auth, não nesta tabela.

create table public.administrators (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null,
  created_at timestamptz not null default pg_catalog.now(),
  constraint administrators_name_check check (char_length(btrim(name)) >= 2),
  constraint administrators_email_check check (
    email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  )
);

create unique index administrators_email_lower_uidx
  on public.administrators (lower(email));

comment on table public.administrators is
  'Administradores autenticados. O id é o mesmo do usuário em auth.users.';

create or replace function private.administrators_guard()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.name := pg_catalog.btrim(new.name);
    new.email := lower(pg_catalog.btrim(new.email));
    new.created_at := pg_catalog.now();
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if new.id is distinct from old.id then
      raise exception 'administrador não pode trocar de identificador';
    end if;

    new.name := pg_catalog.btrim(new.name);
    new.email := lower(pg_catalog.btrim(new.email));
    new.created_at := old.created_at;
    return new;
  end if;

  return old;
end;
$$;

drop trigger if exists administrators_guard on public.administrators;

create trigger administrators_guard
  before insert or update on public.administrators
  for each row
  execute function private.administrators_guard();

revoke all on function private.administrators_guard() from public;
grant execute on function private.administrators_guard() to service_role;
