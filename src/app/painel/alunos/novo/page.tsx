import type { Metadata } from "next";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { CarregandoAcesso } from "@/components/acesso/carregando-acesso";
import { PainelShell } from "@/components/painel/painel-shell";
import { CadastroAluno } from "./_components/content";
import { listarPlanos } from "../../planos/_data-access/planos";

export const metadata: Metadata = {
  title: "APEX.FIT — Novo aluno",
};

export default function NovoAlunoPage() {
  return (
    <Suspense
      fallback={<CarregandoAcesso titulo="Abrindo o cadastro de aluno" />}
    >
      <NovoAluno />
    </Suspense>
  );
}

async function NovoAluno() {
  const admin = await requireAdmin();
  const planos = await listarPlanos();

  return (
    <PainelShell adminName={admin.name} area="novo">
      <CadastroAluno
        planos={planos.ok ? planos.planos : []}
        planosErro={planos.ok ? null : planos.erro}
      />
    </PainelShell>
  );
}
