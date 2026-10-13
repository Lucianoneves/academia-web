-- Ordem 13. Aplicar em banco que já executou 04_plans.sql.
-- A cobertura do prazo passa a ser mês de calendário. O preço não muda.
-- O gatilho impede trocar o texto do plano; ele fica fora só durante esta atualização.

alter table public.plans drop constraint if exists plans_duration_check;

drop trigger if exists plans_guard on public.plans;

update public.plans
set duration_label = case kind
  when 'mensal' then '1 mês, até a véspera do mesmo dia'
  when 'trimestral' then '3 meses, até a véspera do mesmo dia'
  when 'semestral' then '6 meses, até a véspera do mesmo dia'
  when 'anual' then '1 ano, até a véspera do mesmo dia'
  else duration_label
end
where kind in ('mensal', 'trimestral', 'semestral', 'anual');

alter table public.plans add constraint plans_duration_check check (
  (kind = 'avulso' and duration_days is null and duration_label = '1 aula')
  or (kind = 'mensal' and duration_days = 30 and duration_label = '1 mês, até a véspera do mesmo dia')
  or (kind = 'trimestral' and duration_days = 90 and duration_label = '3 meses, até a véspera do mesmo dia')
  or (kind = 'semestral' and duration_days = 180 and duration_label = '6 meses, até a véspera do mesmo dia')
  or (kind = 'anual' and duration_days = 365 and duration_label = '1 ano, até a véspera do mesmo dia')
);

comment on column public.plans.duration_days is
  'Não entra na cobertura. O prazo cobre 1, 3, 6 ou 12 meses de calendário, até a véspera do mesmo dia. Nulo no avulso, que vale 1 aula.';

create trigger plans_guard
  before insert or update or delete on public.plans
  for each row
  execute function private.plans_guard();

notify pgrst, 'reload schema';
