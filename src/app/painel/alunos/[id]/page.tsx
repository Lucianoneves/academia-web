import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { CarregandoAcesso } from "@/components/acesso/carregando-acesso";
import { PainelShell } from "@/components/painel/painel-shell";
import { marcacoesDoAluno } from "../../agenda/_data-access/agenda";
import { pagamentoDoAluno } from "../../pagamentos/_data-access/pagamentos";
import { obterAluno } from "../_data-access/alunos";
import { FichaAluno } from "./_components/ficha";

export const metadata: Metadata = {
  title: "APEX.FIT — Ficha do aluno",
};

export default function FichaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<CarregandoAcesso titulo="Abrindo a ficha" />}>
      <Ficha params={params} />
    </Suspense>
  );
}

async function Ficha({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  const [aluno, pagamento, agenda] = await Promise.all([
    obterAluno(id),
    pagamentoDoAluno(id),
    marcacoesDoAluno(id),
  ]);

  if (!aluno) notFound();

  return (
    <PainelShell adminName={admin.name} area="lista">
      <FichaAluno
        aluno={aluno}
        pagamento={pagamento.ok ? pagamento.pagamento : null}
        marcacoes={agenda.ok ? agenda.marcacoes : []}
        agendaErro={agenda.ok ? null : agenda.erro}
      />
    </PainelShell>
  );
}
