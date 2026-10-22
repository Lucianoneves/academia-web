-- Ordem 16. Aplicar em banco que já executou 07_payments.sql só com dinheiro.
-- Banco novo que aplicar o 07 atual já nasce com cartão; este arquivo continua seguro.

alter table public.payments
  add column if not exists stripe_checkout_session_id text,
  add column if not exists stripe_payment_intent_id text,
  add column if not exists stripe_refund_id text;

alter table public.payments drop constraint if exists payments_method_check;
alter table public.payments drop constraint if exists payments_stripe_shape_check;

alter table public.payments
  add constraint payments_method_check check (method in ('dinheiro', 'cartao'));

alter table public.payments
  add constraint payments_stripe_shape_check check (
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
  );

create unique index if not exists payments_stripe_session_uidx
  on public.payments (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

create unique index if not exists payments_stripe_intent_uidx
  on public.payments (stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;

create unique index if not exists payments_stripe_refund_uidx
  on public.payments (stripe_refund_id)
  where stripe_refund_id is not null;

comment on table public.payments is
  'Recebimentos e estornos em dinheiro ou cartão. Um recebimento só tem um estorno.';

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

  if new.method = 'dinheiro' and new.paid_on is distinct from v_today then
    raise exception 'data do estorno é a data de hoje';
  end if;

  if new.method = 'cartao' and new.paid_on > v_today then
    raise exception 'data do estorno não pode ser futura';
  end if;

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

notify pgrst, 'reload schema';
