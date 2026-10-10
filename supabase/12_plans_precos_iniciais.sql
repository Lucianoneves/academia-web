-- Ordem 12. Aplicar em banco que já executou 04_plans.sql com preço zero.
-- Não altera preço que o administrador já salvou.

update public.plans
set price_cents = case kind
  when 'avulso' then 4000
  when 'mensal' then 15000
  when 'trimestral' then 40000
  when 'semestral' then 72000
  when 'anual' then 120000
  else price_cents
end
where price_cents = 0
  and kind in ('avulso', 'mensal', 'trimestral', 'semestral', 'anual');

notify pgrst, 'reload schema';
