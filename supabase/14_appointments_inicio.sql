-- Ordem 14. Aplicar em banco que já executou 08_appointments.sql.
-- Marcar no dia de hoje só vale antes do início da aula.
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

