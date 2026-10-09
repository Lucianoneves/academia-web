-- Ordem 3 de 10. Aplicar depois de 02_administrators.sql.
-- Políticas e permissões desta tabela ficam em 10_rls.sql.
-- Alunos. Não há exclusão: inativar muda active para false.

create table public.students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  birth_date date not null,
  phone text not null,
  phone_digits text generated always as (regexp_replace(phone, '\D', '', 'g')) stored,
  weight_kg numeric(5, 1) not null,
  medical_restrictions text,
  active boolean not null default true,
  created_at timestamptz not null default pg_catalog.now(),
  constraint students_name_check check (char_length(btrim(name)) >= 2),
  constraint students_weight_check check (weight_kg > 0),
  constraint students_phone_shape_check check (
    phone !~ '[[:alpha:]]'
    and regexp_replace(phone, '\D', '', 'g') ~ '^[0-9]{10,11}$'
  )
);

create unique index students_phone_digits_uidx
  on public.students (phone_digits);

create index students_active_created_idx
  on public.students (active, created_at desc);

comment on table public.students is
  'Alunos da academia. phone_digits guarda só os números, para a unicidade.';

comment on column public.students.weight_kg is 'Peso em quilogramas, com uma casa decimal.';

comment on column public.students.medical_restrictions is
  'Opcional. Vazio na aplicação aparece como nenhuma.';

create or replace function private.students_guard()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'aluno não pode ser apagado';
  end if;

  if tg_op = 'UPDATE' and new.id is distinct from old.id then
    raise exception 'aluno não pode trocar de identificador';
  end if;

  new.name := pg_catalog.btrim(new.name);
  new.phone := pg_catalog.btrim(new.phone);
  new.medical_restrictions := nullif(pg_catalog.btrim(new.medical_restrictions), '');

  if tg_op = 'INSERT' then
    new.created_at := pg_catalog.now();
    new.active := coalesce(new.active, true);
  else
    new.created_at := old.created_at;
  end if;

  if new.birth_date >= private.today_sao_paulo() then
    raise exception 'data de nascimento deve ser anterior a hoje';
  end if;

  return new;
end;
$$;

drop trigger if exists students_guard on public.students;

create trigger students_guard
  before insert or update or delete on public.students
  for each row
  execute function private.students_guard();

revoke all on function private.students_guard() from public;
grant execute on function private.students_guard() to authenticated, service_role;
