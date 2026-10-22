-- Ordem 20. Aplicar em banco que já executou 18_students_email.sql e 04_plans.sql.
-- Customer nasce na primeira geração do link. Price nasce ao salvar um preço à venda.

alter table public.students
  add column if not exists stripe_customer_id text;

create unique index if not exists students_stripe_customer_uidx
  on public.students (stripe_customer_id)
  where stripe_customer_id is not null;

comment on column public.students.stripe_customer_id is
  'Cliente da Stripe. Nasce na primeira geração de link de cartão e é reutilizado.';

alter table public.plans
  add column if not exists stripe_product_id text,
  add column if not exists stripe_price_id text;

comment on column public.plans.stripe_product_id is
  'Produto fixo do plano na Stripe. Não muda quando o preço muda.';

comment on column public.plans.stripe_price_id is
  'Price vigente. Cada preço novo grava outro id. O Price anterior continua na Stripe.';

notify pgrst, 'reload schema';
