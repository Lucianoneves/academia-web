-- Ordem 6 de 10. Aplicar depois de 05_class_categories.sql.
-- Políticas e permissões desta tabela ficam em 10_rls.sql.
-- Grade semanal. Dois horários no mesmo dia podem se sobrepor.
-- weekday: 0 = domingo, 1 = segunda, ..., 6 = sábado.

create table public.class_schedules (
  id uuid primary key default gen_random_uuid(),
  weekday smallint not null,
  starts_at time not null,
  ends_at time not null,
  category_id uuid not null references public.class_categories (id) on delete restrict,
  capacity integer not null,
  active boolean not null default true,
  constraint class_schedules_weekday_check check (weekday between 0 and 6),
  constraint class_schedules_time_order_check check (ends_at > starts_at),
  constraint class_schedules_capacity_check check (capacity >= 1)
);

create index class_schedules_category_id_idx
  on public.class_schedules (category_id);

create index class_schedules_weekday_active_idx
  on public.class_schedules (weekday)
  where active;

comment on table public.class_schedules is
  'Horário que se repete toda semana. A vaga de uma data é contada nos agendamentos.';

comment on column public.class_schedules.weekday is
  '0 = domingo, 1 = segunda, 2 = terça, 3 = quarta, 4 = quinta, 5 = sexta, 6 = sábado.';

create or replace function private.class_schedules_guard()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_category_active boolean;
begin
  if tg_op = 'DELETE' then
    raise exception 'horário não pode ser apagado';
  end if;

  if tg_op = 'INSERT' then
    new.active := coalesce(new.active, true);
  elsif new.id is distinct from old.id then
    raise exception 'horário não pode trocar de identificador';
  end if;

  if tg_op = 'INSERT'
    or (
      tg_op = 'UPDATE'
      and (
        new.category_id is distinct from old.category_id
        or (new.active and not old.active)
      )
    )
  then
    select active
      into v_category_active
      from public.class_categories
      where id = new.category_id;

    if v_category_active is null then
      raise exception 'categoria não encontrada';
    end if;

    if not v_category_active then
      raise exception 'é preciso uma categoria ativa';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists class_schedules_guard on public.class_schedules;

create trigger class_schedules_guard
  before insert or update or delete on public.class_schedules
  for each row
  execute function private.class_schedules_guard();

revoke all on function private.class_schedules_guard() from public;
grant execute on function private.class_schedules_guard() to authenticated, service_role;
