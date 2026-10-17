import "server-only";

import { requireAdmin } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";

export async function planoEstaAVenda(
  kind: string
): Promise<{ ok: true; venda: boolean } | { ok: false }> {
  await requireAdmin();
  const supabase = await createSessionClient();
  const { data, error } = await supabase
    .from("plans")
    .select("active, price_cents")
    .eq("kind", kind)
    .maybeSingle();

  if (error) return { ok: false };
  if (!data) return { ok: true, venda: false };

  return {
    ok: true,
    venda: data.active === true && data.price_cents > 0,
  };
}
