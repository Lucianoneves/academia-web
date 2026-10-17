-- Ordem 7 de 10. Aplicar depois de 06_class_schedules.sql.
-- Políticas e permissões desta tabela ficam em 10_rls.sql.
-- Livro-caixa. Dinheiro na recepção e cartão confirmado pela Stripe.
-- A situação do aluno não fica gravada:
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
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  stripe_refund_id text,
  created_at timestamptz not null default pg_catalog.now(),
  constraint payments_amount_check check (amount_cents > 0),
  constraint payments_method_check check (method in ('dinheiro', 'cartao')),
  constraint payments_kind_check check (kind in ('recebimento', 'estorno')),
  constraint payments_stripe_shape_check check (
    (
      method = 'dinheiro'
      and stripe_checkout_session_id is null
      and stripe_payment_intent_id is null
      and stripe_refund_id is null
    )
    or (
      method = 'cartao'
      and kind = 'recebimento'
      and stripe_checkout_session_id is not null
      and stripe_payment_intent_id is not null
      and stripe_refund_id is null
    )
    or (
      method = 'cartao'
      and kind = 'estorno'
      and stripe_checkout_session_id is null
      and stripe_payment_intent_id is null
      and stripe_refund_id is not null
    )
  ),
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

create unique index payments_stripe_session_uidx
  on public.payments (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

create unique index payments_stripe_intent_uidx
  on public.payments (stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;

create unique index payments_stripe_refund_uidx
  on public.payments (stripe_refund_id)
  where stripe_refund_id is not null;

comment on table public.payments is
  'Recebimentos e estornos em dinheiro ou cartão. Um recebimento só tem um estorno.';

comment on column public.payments.amount_cents is 'Valor em centavos de real.';

comment on column public.payments.reverses_payment_id is
  'Preenchido só no estorno. Aponta o recebimento anulado.';

comment on column public.payments.stripe_checkout_session_id is
  'Sessão do Checkout, só no recebimento de cartão. Impede gravar a mesma cobrança duas vezes.';

comment on column public.payments.stripe_payment_intent_id is
  'Cobrança da Stripe usada no reembolso do recebimento de cartão.';

comment on column public.payments.stripe_refund_id is
  'Reembolso da Stripe, só no estorno de cartão.';

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

  if new.method not in ('dinheiro', 'cartao') then
    raise exception 'forma de pagamento inválida';
  end if;

  if new.method = 'dinheiro'
    and (
      new.stripe_checkout_session_id is not null
      or new.stripe_payment_intent_id is not null
      or new.stripe_refund_id is not null
    )
  then
    raise exception 'dinheiro não guarda cobrança da Stripe';
  end if;

  if new.kind = 'recebimento'
    and new.method = 'cartao'
    and (
      new.stripe_checkout_session_id is null
      or new.stripe_payment_intent_id is null
      or new.stripe_refund_id is not null
    )
  then
    raise exception 'cobrança de cartão precisa da sessão da Stripe';
  end if;

  if new.kind = 'estorno'
    and new.method = 'cartao'
    and new.stripe_refund_id is null
  then
    raise exception 'estorno de cartão precisa do reembolso da Stripe';
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

  if new.method is distinct from v_origin.method then
    raise exception 'estorno deve usar a mesma forma do recebimento';
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
