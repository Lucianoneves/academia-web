-- Ordem 17. Aplicar depois de 10_rls.sql.
-- Uma marcação de avaliação por aluno: dia e hora de início.
-- Não é o exame. Não muda a validade. Pode ser substituída, limpa ou
-- apagada quando uma avaliação é registrada.
-- Dois alunos podem no mesmo dia. Não podem na mesma data e na mesma hora.

create table if not exists public.evaluation_appointments (
  student_id uuid primary key references public.students (id) on delete restrict,
  scheduled_on date not null,
  starts_at time not null,
  updated_at timestamptz not null default pg_catalog.now()
);

create unique index if not exists evaluation_appointments_slot_uidx
  on public.evaluation_appointments (scheduled_on, starts_at);

comment on table public.evaluation_appointments is
  'Aviso de avaliação marcada. Uma por aluno. Não calcula validade.';

comment on column public.evaluation_appointments.scheduled_on is
  'Dia da marcação. Hoje ou futuro. Se o dia passar sem exame, continua gravado.';

comment on column public.evaluation_appointments.starts_at is
  'Hora de início. Sem hora de fim. Hora de hoje que já passou pode salvar.';

create or replace function private.evaluation_appointments_guard()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    return old;
  end if;

  new.updated_at := pg_catalog.now();

  if new.scheduled_on < private.today_sao_paulo() then
    raise exception 'dia da marcação não pode ser no passado';
  end if;

  return new;
end;
$$;

drop trigger if exists evaluation_appointments_guard on public.evaluation_appointments;

create trigger evaluation_appointments_guard
  before insert or update or delete on public.evaluation_appointments
  for each row
  execute function private.evaluation_appointments_guard();

revoke all on function private.evaluation_appointments_guard() from public;
grant execute on function private.evaluation_appointments_guard() to authenticated, service_role;

alter table public.evaluation_appointments enable row level security;
alter table public.evaluation_appointments force row level security;

drop policy if exists evaluation_appointments_admin_select on public.evaluation_appointments;
drop policy if exists evaluation_appointments_admin_insert on public.evaluation_appointments;
drop policy if exists evaluation_appointments_admin_update on public.evaluation_appointments;
drop policy if exists evaluation_appointments_admin_delete on public.evaluation_appointments;

create policy evaluation_appointments_admin_select
  on public.evaluation_appointments
  for select
  to authenticated
  using ((select private.is_admin()));

create policy evaluation_appointments_admin_insert
  on public.evaluation_appointments
  for insert
  to authenticated
  with check ((select private.is_admin()));

create policy evaluation_appointments_admin_update
  on public.evaluation_appointments
  for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy evaluation_appointments_admin_delete
  on public.evaluation_appointments
  for delete
  to authenticated
  using ((select private.is_admin()));

revoke all on table public.evaluation_appointments from public, anon;
grant select, insert, update, delete on table public.evaluation_appointments to authenticated;
grant select, insert, update, delete on table public.evaluation_appointments to service_role;
