import "server-only";

import { requireAdmin } from "@/lib/auth";
import { formatarReais } from "@/lib/dinheiro";
import {
  analisarPagamentos,
  formatarDataIso,
  rotuloSituacao,
  type Lancamento,
  type SituacaoPagamento,
  type TipoPlano,
} from "@/lib/pagamento-situacao";
import { createSessionClient } from "@/lib/supabase/server";
import { hojeSaoPaulo, planosCadastro } from "@/lib/validacao";
import type {
  AlunoPagamento,
  LinhaHistorico,
  OpcoesLancamento,
  PagamentoAluno,
} from "../tipos";

const ordem = new Map(
  planosCadastro.map((plano, indice) => [plano.value, indice])
);

const tipos = new Set<string>(planosCadastro.map((plano) => plano.value));

type PlanoRow = {
  id: string;
  kind: string;
  duration_days: number | null;
  duration_label: string;
  price_cents: number;
  active: boolean;
};

type PaymentRow = {
  id: string;
  student_id: string;
  plan_id: string;
  amount_cents: number;
  paid_on: string;
  kind: string;
  reverses_payment_id: string | null;
  created_at: string;
};

type StudentRow = {
  id: string;
  name: string;
  active: boolean;
};

function nomePlano(kind: string) {
  return planosCadastro.find((item) => item.value === kind)?.label ?? kind;
}

function comoTipo(kind: string): TipoPlano | null {
  return tipos.has(kind) ? (kind as TipoPlano) : null;
}

function lancamentosDe(
  pagamentos: PaymentRow[],
  planos: Map<string, PlanoRow>
) {
  const lista: Lancamento[] = [];

  for (const pagamento of pagamentos) {
    const plano = planos.get(pagamento.plan_id);
    const tipo = plano ? comoTipo(plano.kind) : null;
    if (
      !tipo ||
      (pagamento.kind !== "recebimento" && pagamento.kind !== "estorno")
    ) {
      continue;
    }

    lista.push({
      id: pagamento.id,
      plano: tipo,
      duracaoDias: plano?.duration_days ?? null,
      pagoEm: pagamento.paid_on.slice(0, 10),
      criadoEm: pagamento.created_at,
      tipo: pagamento.kind,
      estornaId: pagamento.reverses_payment_id,
    });
  }

  return lista;
}

function linhasDe(
  pagamentos: PaymentRow[],
  planos: Map<string, PlanoRow>,
  efeitos: Map<string, string>
) {
  const ordenados = [...pagamentos].sort(
    (a, b) =>
      b.paid_on.localeCompare(a.paid_on) ||
      b.created_at.localeCompare(a.created_at)
  );

  const linhas: LinhaHistorico[] = ordenados.map((pagamento) => {
    const plano = planos.get(pagamento.plan_id);
    const estornado = efeitos.get(pagamento.id)?.startsWith("Estornado");

    return {
      id: pagamento.id,
      data: formatarDataIso(pagamento.paid_on.slice(0, 10)),
      plano: plano ? nomePlano(plano.kind) : "Plano",
      valor: formatarReais(pagamento.amount_cents),
      forma: "Dinheiro",
      efeito: efeitos.get(pagamento.id) ?? "",
      podeEstornar: pagamento.kind === "recebimento" && !estornado,
    };
  });

  return linhas;
}

async function carregar() {
  await requireAdmin();
  const supabase = await createSessionClient();
  const [planos, alunos, pagamentos] = await Promise.all([
    supabase
      .from("plans")
      .select("id, kind, duration_days, duration_label, price_cents, active"),
    supabase.from("students").select("id, name, active"),
    supabase
      .from("payments")
      .select(
        "id, student_id, plan_id, amount_cents, paid_on, kind, reverses_payment_id, created_at"
      ),
  ]);

  if (planos.error || alunos.error || pagamentos.error) {
    return {
      ok: false as const,
      erro: "Não foi possível carregar os pagamentos.",
    };
  }

  return {
    ok: true as const,
    planos: (planos.data ?? []) as PlanoRow[],
    alunos: (alunos.data ?? []) as StudentRow[],
    pagamentos: (pagamentos.data ?? []) as PaymentRow[],
  };
}

export async function listarPagamentos(filtro: {
  q: string;
  situacao: SituacaoPagamento | null;
}): Promise<
  | {
      ok: true;
      total: number;
      alunos: AlunoPagamento[];
      opcoes: OpcoesLancamento;
    }
  | { ok: false; erro: string }
> {
  const base = await carregar();
  if (!base.ok) return base;

  const hoje = hojeSaoPaulo();
  const planos = new Map(base.planos.map((plano) => [plano.id, plano]));
  const porAluno = new Map<string, PaymentRow[]>();

  for (const pagamento of base.pagamentos) {
    const lista = porAluno.get(pagamento.student_id) ?? [];
    lista.push(pagamento);
    porAluno.set(pagamento.student_id, lista);
  }

  const termo = filtro.q.trim().toLocaleLowerCase("pt-BR");
  const todos: AlunoPagamento[] = base.alunos
    .map((aluno) => {
      const analise = analisarPagamentos(
        lancamentosDe(porAluno.get(aluno.id) ?? [], planos),
        hoje
      );

      return {
        id: aluno.id,
        nome: aluno.name,
        ativo: aluno.active,
        situacao: analise.situacao,
        rotulo: rotuloSituacao(analise.situacao),
        planoAtivo: analise.planoAtivo ? nomePlano(analise.planoAtivo) : null,
      };
    })
    .sort((a, b) =>
      a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" })
    );

  const alunos = todos.filter((aluno) => {
    const busca =
      !termo || aluno.nome.toLocaleLowerCase("pt-BR").includes(termo);
    const situacao = !filtro.situacao || aluno.situacao === filtro.situacao;
    return busca && situacao;
  });

  const opcoes: OpcoesLancamento = {
    hoje,
    alunos: todos
      .filter((aluno) => aluno.ativo)
      .map((aluno) => ({ id: aluno.id, nome: aluno.nome })),
    planos: base.planos
      .filter(
        (plano) => plano.active && plano.price_cents > 0 && comoTipo(plano.kind)
      )
      .sort(
        (a, b) =>
          (ordem.get(a.kind as TipoPlano) ?? 0) -
          (ordem.get(b.kind as TipoPlano) ?? 0)
      )
      .map((plano) => ({
        id: plano.id,
        nome: nomePlano(plano.kind),
        precoCentavos: plano.price_cents,
      })),
  };

  return { ok: true, total: todos.length, alunos, opcoes };
}

export async function pagamentoDoAluno(
  alunoId: string
): Promise<
  | { ok: true; nome: string; ativo: boolean; pagamento: PagamentoAluno }
  | { ok: false; motivo: "erro" | "ausente" }
> {
  const base = await carregar();
  if (!base.ok) return { ok: false, motivo: "erro" };

  const aluno = base.alunos.find((item) => item.id === alunoId);
  if (!aluno) return { ok: false, motivo: "ausente" };

  const planos = new Map(base.planos.map((plano) => [plano.id, plano]));
  const pagamentos = base.pagamentos.filter(
    (pagamento) => pagamento.student_id === alunoId
  );
  const analise = analisarPagamentos(
    lancamentosDe(pagamentos, planos),
    hojeSaoPaulo()
  );

  return {
    ok: true,
    nome: aluno.name,
    ativo: aluno.active,
    pagamento: {
      situacao: analise.situacao,
      rotulo: rotuloSituacao(analise.situacao),
      planoAtivo: analise.planoAtivo ? nomePlano(analise.planoAtivo) : null,
      linhas: linhasDe(pagamentos, planos, analise.efeitos),
    },
  };
}
