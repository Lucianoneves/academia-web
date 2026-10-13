import "server-only";

import { requireAdmin } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { planosCadastro } from "@/lib/validacao";
import type { PlanoPainel } from "../tipos";

const ordem = new Map(
  planosCadastro.map((plano, indice) => [plano.value, indice])
);

export async function listarPlanos(): Promise<
  { ok: true; planos: PlanoPainel[] } | { ok: false; erro: string }
> {
  await requireAdmin();
  const supabase = await createSessionClient();
  const { data, error } = await supabase
    .from("plans")
    .select("id, kind, price_cents, active");

  if (error) {
    return { ok: false, erro: "Não foi possível carregar os planos." };
  }

  const planos: PlanoPainel[] = [];

  for (const plano of data ?? []) {
    const conhecido = planosCadastro.find((item) => item.value === plano.kind);
    if (!conhecido) continue;

    planos.push({
      id: plano.id,
      kind: conhecido.value,
      nome: conhecido.label,
      duracao: conhecido.duracao,
      precoCentavos: plano.price_cents,
      ativo: plano.active,
    });
  }

  planos.sort((a, b) => (ordem.get(a.kind) ?? 0) - (ordem.get(b.kind) ?? 0));

  return { ok: true, planos };
}
