-- Ordem 10 de 10. Aplicar por último, depois de 09_medical_evaluations.sql.
-- Políticas de segurança do painel.
-- Anônimo não lê nem grava nada, exceto public.admin_exists().
-- Administrador autenticado só alcança a linha se private.is_admin() for verdadeiro.
-- Não há policy de delete: aluno, plano, categoria, horário, pagamento,
-- agendamento e avaliação não são apagados pelo painel.
-- A service role continua sem policy porque ela ignora o RLS; os triggers
-- ainda bloqueiam exclusão e edição proibida.

-- Trava do primeiro administrador. Sem policy: ninguém pela API lê esta linha.
-- claim_first_admin() e release_first_admin_claim() são security definer.

alter table private.first_admin_claim enable row level security;
alter table private.first_admin_claim force row level security;

revoke all on table private.first_admin_claim from public, anon, authenticated;

-- Administradores. Quem entrou pode ler os nomes.
-- Incluir outro administrador é feito pela service role, não por policy de insert.

alter table public.administrators enable row level security;
alter table public.administrators force row level security;

drop policy if exists administrators_admin_select on public.administrators;

create policy administrators_admin_select
  on public.administrators
  for select
  to authenticated
  using ((select private.is_admin()));

revoke all on table public.administrators from public, anon;
grant select on table public.administrators to authenticated;
grant select, insert, update, delete on table public.administrators to service_role;

-- Alunos. Incluir, editar e inativar. Sem delete.

alter table public.students enable row level security;
alter table public.students force row level security;

drop policy if exists students_admin_select on public.students;
drop policy if exists students_admin_insert on public.students;
drop policy if exists students_admin_update on public.students;

create policy students_admin_select
  on public.students
  for select
  to authenticated
  using ((select private.is_admin()));

create policy students_admin_insert
  on public.students
  for insert
  to authenticated
  with check ((select private.is_admin()));

create policy students_admin_update
  on public.students
  for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

revoke all on table public.students from public, anon;
grant select, insert, update on table public.students to authenticated;
grant select, insert, update, delete on table public.students to service_role;

-- Planos. Só preço e situação mudam. Sem insert e sem delete para o painel.

alter table public.plans enable row level security;
alter table public.plans force row level security;

drop policy if exists plans_admin_select on public.plans;
drop policy if exists plans_admin_update on public.plans;

create policy plans_admin_select
  on public.plans
  for select
  to authenticated
  using ((select private.is_admin()));

create policy plans_admin_update
  on public.plans
  for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

revoke all on table public.plans from public, anon;
grant select, update on table public.plans to authenticated;
grant select, insert, update, delete on table public.plans to service_role;

-- Categorias. Incluir, renomear e inativar. Sem delete.

alter table public.class_categories enable row level security;
alter table public.class_categories force row level security;

drop policy if exists class_categories_admin_select on public.class_categories;
drop policy if exists class_categories_admin_insert on public.class_categories;
drop policy if exists class_categories_admin_update on public.class_categories;

create policy class_categories_admin_select
  on public.class_categories
  for select
  to authenticated
  using ((select private.is_admin()));

create policy class_categories_admin_insert
  on public.class_categories
  for insert
  to authenticated
  with check ((select private.is_admin()));

create policy class_categories_admin_update
  on public.class_categories
  for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

revoke all on table public.class_categories from public, anon;
grant select, insert, update on table public.class_categories to authenticated;
grant select, insert, update, delete on table public.class_categories to service_role;

-- Horários. Incluir, editar e inativar. Sem delete.

alter table public.class_schedules enable row level security;
alter table public.class_schedules force row level security;

drop policy if exists class_schedules_admin_select on public.class_schedules;
drop policy if exists class_schedules_admin_insert on public.class_schedules;
drop policy if exists class_schedules_admin_update on public.class_schedules;

create policy class_schedules_admin_select
  on public.class_schedules
  for select
  to authenticated
  using ((select private.is_admin()));

create policy class_schedules_admin_insert
  on public.class_schedules
  for insert
  to authenticated
  with check ((select private.is_admin()));

create policy class_schedules_admin_update
  on public.class_schedules
  for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

revoke all on table public.class_schedules from public, anon;
grant select, insert, update on table public.class_schedules to authenticated;
grant select, insert, update, delete on table public.class_schedules to service_role;

-- Pagamentos. Lançar recebimento ou estorno. Sem update e sem delete.

alter table public.payments enable row level security;
alter table public.payments force row level security;

drop policy if exists payments_admin_select on public.payments;
drop policy if exists payments_admin_insert on public.payments;

create policy payments_admin_select
  on public.payments
  for select
  to authenticated
  using ((select private.is_admin()));

create policy payments_admin_insert
  on public.payments
  for insert
  to authenticated
  with check ((select private.is_admin()));

revoke all on table public.payments from public, anon;
grant select, insert on table public.payments to authenticated;
grant select, insert, update, delete on table public.payments to service_role;

-- Agenda. Marcar e cancelar. Sem delete.
-- book_appointment e cancel_appointment continuam exigindo private.is_admin().

alter table public.appointments enable row level security;
alter table public.appointments force row level security;

drop policy if exists appointments_admin_select on public.appointments;
drop policy if exists appointments_admin_insert on public.appointments;
drop policy if exists appointments_admin_update on public.appointments;

create policy appointments_admin_select
  on public.appointments
  for select
  to authenticated
  using ((select private.is_admin()));

create policy appointments_admin_insert
  on public.appointments
  for insert
  to authenticated
  with check ((select private.is_admin()));

create policy appointments_admin_update
  on public.appointments
  for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

revoke all on table public.appointments from public, anon;
grant select, insert, update on table public.appointments to authenticated;
grant select, insert, update, delete on table public.appointments to service_role;

-- Avaliação médica. Registrar. Sem update e sem delete.

alter table public.medical_evaluations enable row level security;
alter table public.medical_evaluations force row level security;

drop policy if exists medical_evaluations_admin_select on public.medical_evaluations;
drop policy if exists medical_evaluations_admin_insert on public.medical_evaluations;

create policy medical_evaluations_admin_select
  on public.medical_evaluations
  for select
  to authenticated
  using ((select private.is_admin()));

create policy medical_evaluations_admin_insert
  on public.medical_evaluations
  for insert
  to authenticated
  with check ((select private.is_admin()));

revoke all on table public.medical_evaluations from public, anon;
grant select, insert on table public.medical_evaluations to authenticated;
grant select, insert, update, delete on table public.medical_evaluations to service_role;
