-- Ordem 15. Aplicar em banco que já executou 01_funcoes.sql.
-- Tira o execute de public, anon e authenticated e recusa qualquer
-- papel que não seja service_role dentro da função.

create or replace function public.claim_first_admin()
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if (auth.jwt() ->> 'role') is distinct from 'service_role' then
    raise exception 'acesso recusado';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('academia.first_admin'));

  delete from private.first_admin_claim
  where id = true
    and not exists (select 1 from public.administrators)
    and claimed_at < pg_catalog.now() - interval '15 minutes';

  if exists (select 1 from public.administrators) then
    return false;
  end if;

  if exists (select 1 from private.first_admin_claim) then
    return false;
  end if;

  insert into private.first_admin_claim (id) values (true);
  return true;
end;
$$;

create or replace function public.release_first_admin_claim()
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if (auth.jwt() ->> 'role') is distinct from 'service_role' then
    raise exception 'acesso recusado';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('academia.first_admin'));

  if exists (select 1 from public.administrators) then
    raise exception 'já existe administrador';
  end if;

  delete from private.first_admin_claim where id = true;
end;
$$;

revoke all on function public.claim_first_admin() from public, anon, authenticated;
revoke all on function public.release_first_admin_claim() from public, anon, authenticated;
grant execute on function public.claim_first_admin() to service_role;
grant execute on function public.release_first_admin_claim() to service_role;
