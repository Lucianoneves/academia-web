import "server-only";

import { ordemDias, rotuloCategoria, rotuloProximaData } from "@/lib/agenda";
import { requireAdmin } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";

export type CategoriaHorario = {
  id: string;
  nome: string;
  ativa: boolean;
};

export type HorarioPainel = {
  id: string;
  dia: number;
  inicio: string;
  fim: string;
  categoriaId: string;
  categoria: string;
  vagas: number;
  ativo: boolean;
  ocorrencia: string;
};

type ScheduleRow = {
  id: string;
  weekday: number;
  starts_at: string;
  ends_at: string;
  category_id: string;
  capacity: number;
  active: boolean;
};

type CategoryRow = {
  id: string;
  name: string;
  active: boolean;
};

export async function listarHorarios(ativos: boolean): Promise<
  | {
      ok: true;
      horarios: HorarioPainel[];
      categorias: CategoriaHorario[];
    }
  | { ok: false; erro: string }
> {
  await requireAdmin();
  const supabase = await createSessionClient();
  const [horarios, categorias] = await Promise.all([
    supabase
      .from("class_schedules")
      .select("id, weekday, starts_at, ends_at, category_id, capacity, active")
      .eq("active", ativos),
    supabase.from("class_categories").select("id, name, active"),
  ]);

  if (horarios.error || categorias.error) {
    return { ok: false, erro: "Não foi possível carregar os horários." };
  }

  const nomes = new Map(
    ((categorias.data ?? []) as CategoryRow[]).map((categoria) => [
      categoria.id,
      categoria,
    ])
  );

  const lista = ((horarios.data ?? []) as ScheduleRow[])
    .map((horario) => {
      const categoria = nomes.get(horario.category_id);
      return {
        id: horario.id,
        dia: horario.weekday,
        inicio: horario.starts_at,
        fim: horario.ends_at,
        categoriaId: horario.category_id,
        categoria: rotuloCategoria(categoria?.name ?? "Categoria"),
        vagas: horario.capacity,
        ativo: horario.active,
        ocorrencia: rotuloProximaData(horario.weekday),
      };
    })
    .sort((a, b) => {
      const dia = ordemDias.indexOf(a.dia) - ordemDias.indexOf(b.dia);
      if (dia !== 0) return dia;
      return a.inicio.localeCompare(b.inicio);
    });

  return {
    ok: true,
    horarios: lista,
    categorias: ((categorias.data ?? []) as CategoryRow[])
      .map((categoria) => ({
        id: categoria.id,
        nome: rotuloCategoria(categoria.name),
        ativa: categoria.active,
      }))
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
  };
}
