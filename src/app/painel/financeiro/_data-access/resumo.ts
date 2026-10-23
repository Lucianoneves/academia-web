import "server-only";

import { requireAdmin } from "@/lib/auth";
import {
  analisarPagamentos,
  type Lancamento,
  type TipoPlano,
} from "@/lib/pagamento-situacao";
import {
  montarResumo,
  normalizarMes,
  type MovimentoMes,
  type ResumoMes,
} from "@/lib/resumo-financeiro";
import { createSessionClient } from "@/lib/supabase/server";
import { hojeSaoPaulo, planosCadastro } from "@/lib/validacao";

const tipos = new Set<string>(planosCadastro.map((plano) => plano.value));

type PlanoRow = { id: string; kind: string };
type StudentRow = { id: string; name: string };
type PaymentRow = {
  id: string;
  student_id: string;
  plan_id: string;
  amount_cents: number;
  paid_on: string;
  method: string;
  kind: string;
  reverses_payment_id: string | null;
  created_at: string;
};

function nomePlano(kind: string) {
  return planosCadastro.find((item) => item.value === kind)?.label ?? kind;
}

function comoTipo(kind: string): TipoPlano | null {
  return tipos.has(kind) ? (kind as TipoPlano) : null;
}

function movimentosDe(
  pagamentos: PaymentRow[],
  planos: Map<string, PlanoRow>,
  alunos: Map<string, StudentRow>
) {
  const porAluno = new Map<string, PaymentRow[]>();

  for (const pagamento of pagamentos) {
    const linhas = porAluno.get(pagamento.student_id) ?? [];
    linhas.push(pagamento);
    porAluno.set(pagamento.student_id, linhas);
  }

  const movimentos: MovimentoMes[] = [];

  for (const [alunoId, linhas] of porAluno) {
    const lancamentos: Lancamento[] = [];

    for (const pagamento of linhas) {
      const plano = planos.get(pagamento.plan_id);
      const tipo = plano ? comoTipo(plano.kind) : null;
      if (
        !tipo ||
        (pagamento.kind !== "recebimento" && pagamento.kind !== "estorno")
      ) {
        continue;
      }

      lancamentos.push({
        id: pagamento.id,
        plano: tipo,
        pagoEm: pagamento.paid_on.slice(0, 10),
        criadoEm: pagamento.created_at,
        tipo: pagamento.kind,
        estornaId: pagamento.reverses_payment_id,
      });
    }

    const efeitos = analisarPagamentos(lancamentos, hojeSaoPaulo()).efeitos;
    const aluno = alunos.get(alunoId)?.name ?? "Aluno";

    for (const lancamento of lancamentos) {
      const pagamento = linhas.find((item) => item.id === lancamento.id);
      if (!pagamento) continue;

      movimentos.push({
        id: lancamento.id,
        alunoId,
        aluno,
        plano: nomePlano(lancamento.plano),
        pagoEm: lancamento.pagoEm,
        criadoEm: lancamento.criadoEm,
        tipo: lancamento.tipo,
        forma: pagamento.method === "cartao" ? "cartao" : "dinheiro",
        centavos: pagamento.amount_cents,
        efeito: efeitos.get(lancamento.id) ?? "",
      });
    }
  }

  return movimentos;
}

export async function resumoDoMes(
  mesInformado: string | undefined
): Promise<
  | ({ ok: true; hoje: string; mes: string } & ResumoMes)
  | { ok: false; erro: string }
> {
  await requireAdmin();
  const hoje = hojeSaoPaulo();
  const mes = normalizarMes(mesInformado, hoje);
  const supabase = await createSessionClient();
  const [planos, alunos, pagamentos] = await Promise.all([
    supabase.from("plans").select("id, kind"),
    supabase.from("students").select("id, name"),
    supabase
      .from("payments")
      .select(
        "id, student_id, plan_id, amount_cents, paid_on, method, kind, reverses_payment_id, created_at"
      ),
  ]);

  if (planos.error || alunos.error || pagamentos.error) {
    return {
      ok: false,
      erro: "Não foi possível carregar o resumo financeiro.",
    };
  }

  const mapaPlanos = new Map(
    ((planos.data ?? []) as PlanoRow[]).map((plano) => [plano.id, plano])
  );
  const mapaAlunos = new Map(
    ((alunos.data ?? []) as StudentRow[]).map((aluno) => [aluno.id, aluno])
  );
  const resumo = montarResumo(
    movimentosDe(
      (pagamentos.data ?? []) as PaymentRow[],
      mapaPlanos,
      mapaAlunos
    ),
    mes
  );

  return { ok: true, hoje, mes, ...resumo };
}
