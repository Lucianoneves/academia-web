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
  searchParams,
}: {
  params: Promise<{ alunoId: string }>;
  searchParams: Promise<{ checkout?: string }>;
}) {
  return (
    <Suspense fallback={<CarregandoAcesso titulo="Abrindo o pagamento" />}>
      <PagamentoAluno params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function PagamentoAluno({
  params,
  searchParams,
}: {
  params: Promise<{ alunoId: string }>;
  searchParams: Promise<{ checkout?: string }>;
}) {
  const admin = await requireAdmin();
  const { alunoId } = await params;
  const { checkout } = await searchParams;
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
        {checkout === "enviado" ? (
          <p
            className="rounded-lg bg-secondary-fixed/15 px-space-md py-space-sm font-body-md text-body-md text-secondary-fixed"
            role="status"
          >
            Cobrança enviada. O recebimento aparece aqui quando a Stripe
            confirmar.
          </p>
        ) : null}
        {checkout === "cancelado" ? (
          <p
            className="rounded-lg bg-surface-container px-space-md py-space-sm font-body-md text-body-md text-on-surface"
            role="status"
          >
            Cobrança não concluída.
          </p>
        ) : null}
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
