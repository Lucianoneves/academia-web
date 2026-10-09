-- Ordem 7 de 10. Aplicar depois de 06_class_schedules.sql.
-- Políticas e permissões desta tabela ficam em 10_rls.sql.
-- Livro-caixa em dinheiro. A situação do aluno não fica gravada:
-- a aplicação recalcula a partir destas linhas.
-- Não se edita nem se apaga lançamento. Erro se corrige com estorno.

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete restrict,
  plan_id uuid not null references public.plans (id) on delete restrict,
  amount_cents integer not null,
  paid_on date not null,
  method text not null default 'dinheiro',
  kind text not null,
  reverses_payment_id uuid references public.payments (id) on delete restrict,
  created_at timestamptz not null default pg_catalog.now(),
  constraint payments_amount_check check (amount_cents > 0),
  constraint payments_method_check check (method = 'dinheiro'),
  constraint payments_kind_check check (kind in ('recebimento', 'estorno')),
  constraint payments_reversal_shape_check check (
    (kind = 'recebimento' and reverses_payment_id is null)
    or (kind = 'estorno' and reverses_payment_id is not null)
  )
);

create index payments_student_replay_idx
  on public.payments (student_id, paid_on, created_at);

create index payments_plan_id_idx
  on public.payments (plan_id);

create unique index payments_one_reversal_uidx
  on public.payments (reverses_payment_id)
  where reverses_payment_id is not null;

comment on table public.payments is
  'Recebimentos e estornos em dinheiro. Um recebimento só tem um estorno.';

comment on column public.payments.amount_cents is 'Valor em centavos de real.';

comment on column public.payments.reverses_payment_id is
  'Preenchido só no estorno. Aponta o recebimento anulado.';

create or replace function private.payments_guard()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_origin public.payments%rowtype;
  v_plan_active boolean;
  v_price_cents integer;
  v_student_active boolean;
  v_today date;
begin
  if tg_op = 'DELETE' or tg_op = 'UPDATE' then
    raise exception 'pagamento não pode ser alterado nem apagado';
  end if;

  v_today := private.today_sao_paulo();
  new.created_at := pg_catalog.now();

  if new.method is distinct from 'dinheiro' then
    raise exception 'neste recorte a forma de pagamento é dinheiro';
  end if;

  if new.kind = 'recebimento' then
    if new.reverses_payment_id is not null then
      raise exception 'recebimento não aponta estorno';
    end if;

    if new.paid_on > v_today then
      raise exception 'data do pagamento não pode ser futura';
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
      raise exception 'aluno inativo não recebe lançamento novo';
    end if;

    select active, price_cents
      into v_plan_active, v_price_cents
      from public.plans
      where id = new.plan_id
      for share;

    if v_plan_active is null then
      raise exception 'plano não encontrado';
    end if;

    if not v_plan_active or v_price_cents <= 0 then
      raise exception 'plano inativo ou sem preço não pode ser vendido';
    end if;

    return new;
  end if;

  if new.kind is distinct from 'estorno' then
    raise exception 'tipo de lançamento inválido';
  end if;

  if new.reverses_payment_id is null then
    raise exception 'estorno precisa de um recebimento de origem';
  end if;

  if new.paid_on is distinct from v_today then
    raise exception 'data do estorno é a data de hoje';
  end if;

  -- Trava o recebimento sem exigir permissão de update na tabela.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext('academia.payment'),
    pg_catalog.hashtext(new.reverses_payment_id::text)
  );

  select *
    into v_origin
    from public.payments
    where id = new.reverses_payment_id;

  if v_origin.id is null then
    raise exception 'recebimento de origem não encontrado';
  end if;

  if v_origin.kind is distinct from 'recebimento' then
    raise exception 'só é possível estornar um recebimento';
  end if;

  if exists (
    select 1
    from public.payments
    where reverses_payment_id = new.reverses_payment_id
  ) then
    raise exception 'este recebimento já foi estornado';
  end if;

  if new.amount_cents is distinct from v_origin.amount_cents
    or new.plan_id is distinct from v_origin.plan_id
    or new.student_id is distinct from v_origin.student_id
  then
    raise exception 'estorno deve anular o valor integral do mesmo aluno e do mesmo plano';
  end if;

  return new;
end;
$$;

drop trigger if exists payments_guard on public.payments;

create trigger payments_guard
  before insert or update or delete on public.payments
  for each row
  execute function private.payments_guard();

revoke all on function private.payments_guard() from public;
grant execute on function private.payments_guard() to authenticated, service_role;
