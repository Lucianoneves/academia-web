import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { CarregandoAcesso } from "@/components/acesso/carregando-acesso";
import { HistoricoPagamento } from "@/components/painel/historico-pagamento";
import { PainelShell } from "@/components/painel/painel-shell";
import { pagamentoDoAluno } from "../_data-access/pagamentos";

export const metadata: Metadata = {
  title: "APEX.FIT — Pagamento do aluno",
};

export default function PagamentoAlunoPage({
  params,
}: {
  params: Promise<{ alunoId: string }>;
}) {
  return (
    <Suspense fallback={<CarregandoAcesso titulo="Abrindo o pagamento" />}>
      <PagamentoAluno params={params} />
    </Suspense>
  );
}

async function PagamentoAluno({
  params,
}: {
  params: Promise<{ alunoId: string }>;
}) {
  const admin = await requireAdmin();
  const { alunoId } = await params;
  const resultado = await pagamentoDoAluno(alunoId);

  if (!resultado.ok && resultado.motivo === "ausente") notFound();

  return (
    <PainelShell adminName={admin.name} area="pagamentos">
      <div className="flex w-full flex-col gap-space-lg p-space-lg">
        <div className="flex flex-col gap-space-sm">
          <Link
            href="/painel/pagamentos"
            className="font-label-md text-label-md text-primary-fixed"
          >
            Voltar para pagamentos
          </Link>
          <h1 className="font-headline-lg text-headline-lg tracking-tight text-on-surface">
            {resultado.ok ? resultado.nome : "Pagamento"}
          </h1>
          <Link
            href={`/painel/alunos/${alunoId}`}
            className="font-label-md text-label-md text-on-surface-variant"
          >
            Abrir ficha
          </Link>
        </div>
        <HistoricoPagamento
          alunoId={alunoId}
          ativo={resultado.ok ? resultado.ativo : false}
          pagamento={resultado.ok ? resultado.pagamento : null}
          tentarDeNovo={`/painel/pagamentos/${alunoId}`}
        />
      </div>
    </PainelShell>
  );
}
