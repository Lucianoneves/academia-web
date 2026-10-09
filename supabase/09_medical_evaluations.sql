-- Ordem 9 de 10. Aplicar depois de 08_appointments.sql.
-- Políticas e permissões desta tabela ficam em 10_rls.sql.
-- Histórico de avaliação médica. Não se edita nem se apaga.
-- A validade de 6 meses e a situação (em dia, a vencer, vencida, sem avaliação)
-- são calculadas na aplicação a partir da data e de created_at.
-- Dois registros do mesmo aluno, na mesma data, com as mesmas observações
-- (vazio igual a vazio, ignorando espaço nas pontas) não entram.

create table public.medical_evaluations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete restrict,
  evaluated_on date not null,
  notes text,
  created_at timestamptz not null default pg_catalog.now()
);

create unique index medical_evaluations_same_record_uidx
  on public.medical_evaluations (
    student_id,
    evaluated_on,
    md5(coalesce(btrim(notes), ''))
  );

create index medical_evaluations_student_created_idx
  on public.medical_evaluations (student_id, created_at desc);

comment on table public.medical_evaluations is
  'Histórico de avaliação. A situação usa o registro de created_at mais recente.';

comment on column public.medical_evaluations.evaluated_on is
  'Data da avaliação. Hoje ou no passado. A validade não é digitada.';

comment on column public.medical_evaluations.notes is
  'Observações opcionais. Não são apagadas.';

create or replace function private.medical_evaluations_guard()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' or tg_op = 'UPDATE' then
    raise exception 'avaliação não pode ser alterada nem apagada';
  end if;

  new.notes := nullif(pg_catalog.btrim(new.notes), '');
  new.created_at := pg_catalog.now();

  if new.evaluated_on > private.today_sao_paulo() then
    raise exception 'data da avaliação não pode ser futura';
  end if;

  return new;
end;
$$;

drop trigger if exists medical_evaluations_guard on public.medical_evaluations;

create trigger medical_evaluations_guard
  before insert or update or delete on public.medical_evaluations
  for each row
  execute function private.medical_evaluations_guard();

revoke all on function private.medical_evaluations_guard() from public;
grant execute on function private.medical_evaluations_guard() to authenticated, service_role;
