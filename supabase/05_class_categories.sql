-- Ordem 5 de 10. Aplicar depois de 04_plans.sql.
-- Políticas e permissões desta tabela ficam em 10_rls.sql.
-- Categorias de aula. As quatro iniciais permanecem, mesmo inativas ou renomeadas.

create table public.class_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_key text generated always as (lower(btrim(name))) stored,
  active boolean not null default true,
  is_initial boolean not null default false,
  constraint class_categories_name_check check (char_length(btrim(name)) >= 2),
  constraint class_categories_name_key_unique unique (name_key)
);

comment on table public.class_categories is
  'Categorias de aula. name_key impede nome repetido sem distinguir maiúsculas.';

comment on column public.class_categories.is_initial is
  'Marca as quatro categorias criadas com o banco. Não muda depois.';

insert into public.class_categories (id, name, active, is_initial)
values
  ('c0000000-0000-4000-8000-000000000001', 'hipertrofia', true, true),
  ('c0000000-0000-4000-8000-000000000002', 'emagrecer', true, true),
  ('c0000000-0000-4000-8000-000000000003', 'resistência', true, true),
  ('c0000000-0000-4000-8000-000000000004', 'bem-estar', true, true);

create or replace function private.class_categories_guard()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'categoria não pode ser apagada';
  end if;

  new.name := pg_catalog.btrim(new.name);

  if tg_op = 'INSERT' then
    if new.is_initial then
      raise exception 'categoria inicial só existe no cadastro inicial';
    end if;

    new.is_initial := false;
    new.active := coalesce(new.active, true);
    return new;
  end if;

  if new.id is distinct from old.id then
    raise exception 'categoria não pode trocar de identificador';
  end if;

  if new.is_initial is distinct from old.is_initial then
    raise exception 'não é permitido mudar a marca de categoria inicial';
  end if;

  return new;
end;
$$;

drop trigger if exists class_categories_guard on public.class_categories;

create trigger class_categories_guard
  before insert or update or delete on public.class_categories
  for each row
  execute function private.class_categories_guard();

revoke all on function private.class_categories_guard() from public;
grant execute on function private.class_categories_guard() to authenticated, service_role;
