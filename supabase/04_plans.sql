-- Ordem 4 de 10. Aplicar depois de 03_students.sql.
-- Políticas e permissões desta tabela ficam em 10_rls.sql.
-- Os cinco planos nascem aqui. Não se cria um sexto tipo nem se apaga um tipo.
-- Preço zero é válido e significa que o plano ainda não está à venda.

create table public.plans (
  id uuid primary key,
  kind text not null,
  duration_days integer,
  duration_label text not null,
  price_cents integer not null default 0,
  active boolean not null default true,
  constraint plans_kind_unique unique (kind),
  constraint plans_kind_check check (
    kind in ('avulso', 'mensal', 'trimestral', 'semestral', 'anual')
  ),
  constraint plans_price_check check (price_cents >= 0),
  constraint plans_duration_check check (
    (kind = 'avulso' and duration_days is null and duration_label = '1 aula')
    or (kind = 'mensal' and duration_days = 30 and duration_label = '30 dias')
    or (kind = 'trimestral' and duration_days = 90 and duration_label = '90 dias')
    or (kind = 'semestral' and duration_days = 180 and duration_label = '180 dias')
    or (kind = 'anual' and duration_days = 365 and duration_label = '365 dias')
  )
);

comment on table public.plans is
  'Tipos fixos de plano. price_cents zero não pode ser vendido.';

comment on column public.plans.price_cents is 'Preço em centavos de real.';

comment on column public.plans.duration_days is
  'Dias corridos do plano com prazo. Nulo no avulso, que vale 1 aula.';

insert into public.plans (id, kind, duration_days, duration_label, price_cents, active)
values
  ('a0000000-0000-4000-8000-000000000001', 'avulso', null, '1 aula', 0, true),
  ('a0000000-0000-4000-8000-000000000002', 'mensal', 30, '30 dias', 0, true),
  ('a0000000-0000-4000-8000-000000000003', 'trimestral', 90, '90 dias', 0, true),
  ('a0000000-0000-4000-8000-000000000004', 'semestral', 180, '180 dias', 0, true),
  ('a0000000-0000-4000-8000-000000000005', 'anual', 365, '365 dias', 0, true);

create or replace function private.plans_guard()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'plano não pode ser apagado';
  end if;

  if tg_op = 'INSERT' then
    raise exception 'não é permitido criar um novo tipo de plano';
  end if;

  if new.id is distinct from old.id
    or new.kind is distinct from old.kind
    or new.duration_days is distinct from old.duration_days
    or new.duration_label is distinct from old.duration_label
  then
    raise exception 'tipo e duração do plano são fixos';
  end if;

  return new;
end;
$$;

drop trigger if exists plans_guard on public.plans;

create trigger plans_guard
  before insert or update or delete on public.plans
  for each row
  execute function private.plans_guard();

revoke all on function private.plans_guard() from public;
grant execute on function private.plans_guard() to authenticated, service_role;
