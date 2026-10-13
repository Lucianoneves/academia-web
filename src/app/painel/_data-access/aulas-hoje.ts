import "server-only";

import { diaDaSemana, horaCurta, rotuloCategoria } from "@/lib/agenda";
import { requireAdmin } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { hojeSaoPaulo } from "@/lib/validacao";

export type AulaHoje = {
  id: string;
  inicio: string;
  fim: string;
  categoria: string;
  vagas: number;
  ocupadas: number;
};

export type AulasHoje =
  { ok: true; data: string; aulas: AulaHoje[] } | { ok: false; erro: string };

type ScheduleRow = {
  id: string;
  starts_at: string;
  ends_at: string;
  category_id: string;
  capacity: number;
};

type CategoryRow = { id: string; name: string };
type MarcacaoRow = { schedule_id: string };

export async function aulasDeHoje(): Promise<AulasHoje> {
  await requireAdmin();
  const supabase = await createSessionClient();
  const data = hojeSaoPaulo();
  const dia = diaDaSemana(data);
  const [horarios, categorias, marcacoes] = await Promise.all([
    supabase
      .from("class_schedules")
      .select("id, starts_at, ends_at, category_id, capacity")
      .eq("active", true)
      .eq("weekday", dia),
    supabase.from("class_categories").select("id, name"),
    supabase
      .from("appointments")
      .select("schedule_id")
      .eq("appointment_date", data)
      .eq("status", "marcado"),
  ]);

  if (horarios.error || categorias.error || marcacoes.error) {
    return {
      ok: false,
      erro: "Não foi possível carregar as aulas de hoje.",
    };
  }

  const nomes = new Map(
    ((categorias.data ?? []) as CategoryRow[]).map((categoria) => [
      categoria.id,
      rotuloCategoria(categoria.name),
    ])
  );
  const ocupacao = new Map<string, number>();

  for (const marcacao of (marcacoes.data ?? []) as MarcacaoRow[]) {
    ocupacao.set(
      marcacao.schedule_id,
      (ocupacao.get(marcacao.schedule_id) ?? 0) + 1
    );
  }

  const aulas = ((horarios.data ?? []) as ScheduleRow[])
    .map((horario) => ({
      id: horario.id,
      inicio: horaCurta(horario.starts_at),
      fim: horaCurta(horario.ends_at),
      categoria: nomes.get(horario.category_id) ?? "Categoria",
      vagas: horario.capacity,
      ocupadas: ocupacao.get(horario.id) ?? 0,
    }))
    .sort((a, b) => {
      const inicio = a.inicio.localeCompare(b.inicio);
      if (inicio !== 0) return inicio;
      const fim = a.fim.localeCompare(b.fim);
      if (fim !== 0) return fim;
      return a.categoria.localeCompare(b.categoria, "pt-BR");
    });

  return { ok: true, data, aulas };
}
