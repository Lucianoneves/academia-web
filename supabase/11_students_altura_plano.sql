-- Ordem 11. Aplicar em banco que já executou 03_students.sql sem estas colunas.
-- Banco novo que aplicar o 03 atual já nasce com altura e plano escolhido.

alter table public.students
  add column if not exists height_cm numeric(5, 1);

alter table public.students
  add column if not exists chosen_plan text;

do $$
begin
  if not exists (
    select 1
    from pg_catalog.pg_constraint
    where conname = 'students_height_check'
      and conrelid = 'public.students'::regclass
  ) then
    alter table public.students
      add constraint students_height_check
      check (height_cm is null or height_cm > 0);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_catalog.pg_constraint
    where conname = 'students_chosen_plan_check'
      and conrelid = 'public.students'::regclass
  ) then
    alter table public.students
      add constraint students_chosen_plan_check
      check (
        chosen_plan is null
        or chosen_plan in ('avulso', 'mensal', 'trimestral', 'semestral', 'anual')
      );
  end if;
end
$$;

comment on column public.students.height_cm is
  'Altura em centímetros, com uma casa decimal. Nula só em aluno gravado antes do campo.';

comment on column public.students.chosen_plan is
  'Plano escolhido no cadastro. Não é o plano vigente, que nasce do pagamento.';

notify pgrst, 'reload schema';
