-- Ordem 1 de 10. Aplicar primeiro, no SQL Editor do Supabase.
-- As políticas de segurança ficam em 10_rls.sql.
-- Funções de acesso, fuso de São Paulo e trava do primeiro administrador.
-- A tabela public.administrators é criada em 02_administrators.sql.
-- As funções abaixo são plpgsql de propósito: o corpo só é resolvido na execução.

create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

create extension if not exists pgcrypto;

-- Data e hora locais da academia. Não usar now() cru nas regras de "hoje".

create or replace function private.today_sao_paulo()
returns date
language sql
stable
security invoker
set search_path = ''
as $$
  select (pg_catalog.timezone('America/Sao_Paulo', pg_catalog.now()))::date;
$$;

create or replace function private.now_sao_paulo()
returns timestamp
language sql
stable
security invoker
set search_path = ''
as $$
  select pg_catalog.timezone('America/Sao_Paulo', pg_catalog.now());
$$;

revoke all on function private.today_sao_paulo() from public;
revoke all on function private.now_sao_paulo() from public;
grant execute on function private.today_sao_paulo() to authenticated, service_role;
grant execute on function private.now_sao_paulo() to authenticated, service_role;

-- Verdadeiro só quando o usuário do JWT está em public.administrators.
-- security definer evita recursão nas policies que chamam esta função.

create or replace function private.is_admin()
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  return exists (
    select 1
    from public.administrators
    where id = (select auth.uid())
  );
end;
$$;

revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to authenticated, service_role;

-- A tela de entrada só precisa saber se o cadastro público ainda existe.
-- Não devolve nome nem e-mail.

create or replace function public.admin_exists()
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  return exists (select 1 from public.administrators);
end;
$$;

revoke all on function public.admin_exists() from public;
grant execute on function public.admin_exists() to anon, authenticated;

-- Uma única linha. Enquanto ela existir e não houver administrador,
-- outro cadastro público não passa. Some sozinha depois de 15 minutos
-- se o servidor criou a trava e falhou antes de gravar o administrador.

create table private.first_admin_claim (
  id boolean primary key default true,
  claimed_at timestamptz not null default pg_catalog.now(),
  constraint first_admin_claim_singleton check (id)
);

comment on table private.first_admin_claim is
  'Trava do primeiro administrador. Não é dado de negócio e não entra na API.';

-- Sequência esperada no servidor, com a service role:
-- 1. claim_first_admin() precisa devolver true
-- 2. criar o usuário no Auth
-- 3. inserir public.administrators
-- 4. se o passo 2 ou 3 falhar, chamar release_first_admin_claim()

create or replace function public.claim_first_admin()
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
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
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('academia.first_admin'));

  if exists (select 1 from public.administrators) then
    raise exception 'já existe administrador';
  end if;

  delete from private.first_admin_claim where id = true;
end;
$$;

revoke all on function public.claim_first_admin() from public;
revoke all on function public.release_first_admin_claim() from public;
grant execute on function public.claim_first_admin() to service_role;
grant execute on function public.release_first_admin_claim() to service_role;

comment on function public.admin_exists() is
  'Informa se já existe algum administrador, sem revelar e-mail.';

comment on function public.claim_first_admin() is
  'Reserva o cadastro do primeiro administrador. Só a service role chama.';

comment on function public.release_first_admin_claim() is
  'Solta a trava se o cadastro do primeiro administrador falhou antes de gravar a linha.';
