-- Ordem 18. Aplicar em banco que já executou 03_students.sql.
-- E-mail opcional do aluno. Não é login. Vazio fica nulo.
-- Preenchido, não se repete. Maiúsculas contam como o mesmo endereço.

alter table public.students
  add column if not exists email text;

comment on column public.students.email is
  'Contato opcional, em minúsculas. Nulo quando vazio. Não autentica o aluno.';

create unique index if not exists students_email_uidx
  on public.students (email)
  where email is not null;

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
  new.email := nullif(lower(pg_catalog.btrim(new.email)), '');

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
