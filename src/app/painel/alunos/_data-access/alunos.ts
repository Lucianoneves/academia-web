import "server-only";

import { requireAdmin } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { planosCadastro } from "@/lib/validacao";
import {
  formatarTelefone,
  type AlunoFicha,
  type AlunoLista,
  type ResumoAlunos,
} from "../tipos";

export function inicioDoMesSaoPaulo() {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  const ano = partes.find((parte) => parte.type === "year")?.value;
  const mes = partes.find((parte) => parte.type === "month")?.value;

  return `${ano}-${mes}-01T03:00:00.000Z`;
}

export async function resumoAlunos(): Promise<ResumoAlunos> {
  await requireAdmin();
  const supabase = await createSessionClient();
  const inicio = inicioDoMesSaoPaulo();
  const [total, ativos, nesteMes] = await Promise.all([
    supabase.from("students").select("id", { count: "exact", head: true }),
    supabase
      .from("students")
      .select("id", { count: "exact", head: true })
      .eq("active", true),
    supabase
      .from("students")
      .select("id", { count: "exact", head: true })
      .gte("created_at", inicio),
  ]);

  if (total.error || ativos.error || nesteMes.error) {
    throw new Error("Não foi possível consultar os alunos.");
  }

  return {
    total: total.count ?? 0,
    ativos: ativos.count ?? 0,
    nesteMes: nesteMes.count ?? 0,
  };
}

function termoBusca(q: string) {
  return q.trim().replace(/[%_,]/g, "");
}

export async function listarAlunos(filtro: { q: string; ativos: boolean }) {
  await requireAdmin();
  const supabase = await createSessionClient();
  let consulta = supabase
    .from("students")
    .select("id, name, phone, active")
    .eq("active", filtro.ativos)
    .order("name", { ascending: true });

  const termo = termoBusca(filtro.q);
  const digitos = termo.replace(/\D/g, "");

  if (termo) {
    const partes = [`name.ilike.%${termo}%`];
    if (digitos) partes.push(`phone_digits.ilike.%${digitos}%`);
    consulta = consulta.or(partes.join(","));
  }

  const { data, error } = await consulta;

  if (error) {
    throw new Error("Não foi possível listar os alunos.");
  }

  const alunos: AlunoLista[] = (data ?? []).map((aluno) => ({
    id: aluno.id,
    nome: aluno.name,
    telefone: formatarTelefone(aluno.phone),
    ativo: aluno.active,
  }));

  alunos.sort((a, b) =>
    a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" })
  );

  return alunos;
}

export async function contarAlunos() {
  await requireAdmin();
  const supabase = await createSessionClient();
  const { count, error } = await supabase
    .from("students")
    .select("id", { count: "exact", head: true });

  if (error) {
    throw new Error("Não foi possível consultar os alunos.");
  }

  return count ?? 0;
}

export async function obterAluno(id: string): Promise<AlunoFicha | null> {
  await requireAdmin();
  const supabase = await createSessionClient();
  const { data, error } = await supabase
    .from("students")
    .select(
      "id, name, birth_date, phone, weight_kg, height_cm, chosen_plan, medical_restrictions, active"
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error("Não foi possível abrir o aluno.");
  }

  if (!data) return null;

  const plano = planosCadastro.find((item) => item.value === data.chosen_plan);

  return {
    id: data.id,
    nome: data.name,
    nascimento: data.birth_date,
    telefone: formatarTelefone(data.phone),
    peso: Number(data.weight_kg),
    altura: data.height_cm === null ? null : Number(data.height_cm),
    plano: plano?.value ?? null,
    restricoes: data.medical_restrictions,
    ativo: data.active,
  };
}
