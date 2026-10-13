-- Ordem 8 de 10. Aplicar depois de 07_payments.sql.
-- Políticas e permissões desta tabela ficam em 10_rls.sql.
-- Agenda do administrador. A vaga da data é a capacidade do horário
-- menos os agendamentos ainda marcados. Cancelado continua na tabela.
-- O crédito avulso consumido fica em consumed_payment_id.
-- Quem decide consumir é a aplicação; o banco recusa duplicata, lotação
-- e crédito que não seja um avulso daquele aluno, ainda não estornado.

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete restrict,
  schedule_id uuid not null references public.class_schedules (id) on delete restrict,
  appointment_date date not null,
  status text not null default 'marcado',
  consumed_payment_id uuid references public.payments (id) on delete restrict,
  created_at timestamptz not null default pg_catalog.now(),
  cancelled_at timestamptz,
  constraint appointments_status_check check (status in ('marcado', 'cancelado')),
  constraint appointments_cancel_shape_check check (
    (status = 'marcado' and cancelled_at is null)
    or (status = 'cancelado' and cancelled_at is not null)
  )
);

create unique index appointments_marked_slot_uidx
  on public.appointments (student_id, schedule_id, appointment_date)
  where status = 'marcado';

create unique index appointments_consumed_credit_uidx
  on public.appointments (consumed_payment_id)
  where status = 'marcado' and consumed_payment_id is not null;

create index appointments_schedule_id_idx
  on public.appointments (schedule_id);

create index appointments_student_id_idx
  on public.appointments (student_id);

create index appointments_consumed_payment_id_idx
  on public.appointments (consumed_payment_id);

create index appointments_occupancy_idx
  on public.appointments (schedule_id, appointment_date)
  where status = 'marcado';

create index appointments_date_status_idx
  on public.appointments (appointment_date, status);

comment on table public.appointments is
  'Marcação de um aluno num horário, numa data. Cancelar não apaga a linha.';

comment on column public.appointments.consumed_payment_id is
  'Recebimento avulso consumido por esta marcação. Permanece depois do cancelamento.';

create or replace function private.appointments_guard()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_weekday smallint;
  v_starts_at time;
  v_capacity integer;
  v_schedule_active boolean;
  v_student_active boolean;
  v_occupied bigint;
  v_payment_kind text;
  v_payment_student uuid;
  v_plan_kind text;
begin
  if tg_op = 'DELETE' then
    raise exception 'agendamento não pode ser apagado';
  end if;

  if tg_op = 'UPDATE' then
    if new.id is distinct from old.id
      or new.student_id is distinct from old.student_id
      or new.schedule_id is distinct from old.schedule_id
      or new.appointment_date is distinct from old.appointment_date
      or new.consumed_payment_id is distinct from old.consumed_payment_id
      or new.created_at is distinct from old.created_at
    then
      raise exception 'agendamento não pode ser editado';
    end if;

    if old.status is distinct from 'marcado' or new.status is distinct from 'cancelado' then
      raise exception 'a única alteração permitida é o cancelamento';
    end if;

    select starts_at
      into v_starts_at
      from public.class_schedules
      where id = old.schedule_id;

    if private.now_sao_paulo() >= (old.appointment_date + v_starts_at) then
      raise exception 'cancelamento somente antes do início da aula';
    end if;

    new.cancelled_at := pg_catalog.now();
    return new;
  end if;

  new.status := 'marcado';
  new.cancelled_at := null;
  new.created_at := pg_catalog.now();

  if new.appointment_date < private.today_sao_paulo() then
    raise exception 'não é possível agendar em data passada';
  end if;

  select weekday, starts_at, capacity, active
    into v_weekday, v_starts_at, v_capacity, v_schedule_active
    from public.class_schedules
    where id = new.schedule_id
    for update;

  if v_weekday is null then
    raise exception 'horário não encontrado';
  end if;

  if not v_schedule_active then
    raise exception 'horário inativo não aceita marcação nova';
  end if;

  if extract(dow from new.appointment_date)::smallint is distinct from v_weekday then
    raise exception 'este horário não ocorre nesse dia da semana';
  end if;

  if private.now_sao_paulo() >= (new.appointment_date + v_starts_at) then
    raise exception 'não é possível agendar depois do início da aula';
  end if;

  select active
    into v_student_active
    from public.students
    where id = new.student_id
    for share;

  if v_student_active is null then
    raise exception 'aluno não encontrado';
  end if;

  if not v_student_active then
    raise exception 'aluno inativo não pode ser agendado';
  end if;

  if exists (
    select 1
    from public.appointments
    where student_id = new.student_id
      and schedule_id = new.schedule_id
      and appointment_date = new.appointment_date
      and status = 'marcado'
  ) then
    raise exception 'aluno já está marcado neste horário nesta data';
  end if;

  select count(*)
    into v_occupied
    from public.appointments
    where schedule_id = new.schedule_id
      and appointment_date = new.appointment_date
      and status = 'marcado';

  if v_occupied >= v_capacity then
    raise exception 'não há vaga';
  end if;

  if new.consumed_payment_id is null then
    return new;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext('academia.payment'),
    pg_catalog.hashtext(new.consumed_payment_id::text)
  );

  select payments.kind, payments.student_id, plans.kind
    into v_payment_kind, v_payment_student, v_plan_kind
    from public.payments
    join public.plans on plans.id = payments.plan_id
    where payments.id = new.consumed_payment_id;

  if v_payment_kind is null
    or v_payment_kind is distinct from 'recebimento'
    or v_plan_kind is distinct from 'avulso'
    or v_payment_student is distinct from new.student_id
  then
    raise exception 'crédito avulso inválido';
  end if;

  if exists (
    select 1
    from public.payments
    where reverses_payment_id = new.consumed_payment_id
  ) then
    raise exception 'crédito avulso inválido';
  end if;

  if exists (
    select 1
    from public.appointments
    where consumed_payment_id = new.consumed_payment_id
      and status = 'marcado'
  ) then
    raise exception 'crédito avulso já utilizado';
  end if;

  return new;
end;
$$;

drop trigger if exists appointments_guard on public.appointments;

create trigger appointments_guard
  before insert or update or delete on public.appointments
  for each row
  execute function private.appointments_guard();

revoke all on function private.appointments_guard() from public;
grant execute on function private.appointments_guard() to authenticated, service_role;

-- Marcação e cancelamento passam por estas funções para a trava da vaga
-- acontecer na mesma transação da gravação. Precisam do JWT do administrador:
-- auth.uid() precisa ser o id de um administrador.

create or replace function public.book_appointment(
  p_student_id uuid,
  p_schedule_id uuid,
  p_appointment_date date,
  p_consumed_payment_id uuid default null
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if not private.is_admin() then
    raise exception 'acesso negado';
  end if;

  insert into public.appointments (
    student_id,
    schedule_id,
    appointment_date,
    consumed_payment_id
  )
  values (
    p_student_id,
    p_schedule_id,
    p_appointment_date,
    p_consumed_payment_id
  )
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.cancel_appointment(p_appointment_id uuid)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if not private.is_admin() then
    raise exception 'acesso negado';
  end if;

  update public.appointments
  set status = 'cancelado'
  where id = p_appointment_id
  returning id into v_id;

  if v_id is null then
    raise exception 'agendamento não encontrado';
  end if;

  return v_id;
end;
$$;

revoke all on function public.book_appointment(uuid, uuid, date, uuid) from public;
revoke all on function public.cancel_appointment(uuid) from public;
grant execute on function public.book_appointment(uuid, uuid, date, uuid) to authenticated;
grant execute on function public.cancel_appointment(uuid) to authenticated;

comment on function public.book_appointment(uuid, uuid, date, uuid) is
  'Marca um aluno num horário e numa data. p_consumed_payment_id é o avulso consumido, ou nulo.';

comment on function public.cancel_appointment(uuid) is
  'Cancela um agendamento marcado, somente antes do início da aula.';
