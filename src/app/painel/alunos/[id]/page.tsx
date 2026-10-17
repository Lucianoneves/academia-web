import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { voltaDaFicha } from "@/lib/avaliacao";
import { requireAdmin } from "@/lib/auth";
import { hojeSaoPaulo } from "@/lib/validacao";
import { CarregandoAcesso } from "@/components/acesso/carregando-acesso";
import { PainelShell } from "@/components/painel/painel-shell";
import { marcacoesDoAluno } from "../../agenda/_data-access/agenda";
import { avaliacaoDoAluno } from "../../avaliacoes/_data-access/avaliacoes";
import { pagamentoDoAluno } from "../../pagamentos/_data-access/pagamentos";
import { obterAluno } from "../_data-access/alunos";
import { listarPlanos } from "../../planos/_data-access/planos";
import { FichaAluno } from "./_components/ficha";

export const metadata: Metadata = {
  title: "APEX.FIT — Ficha do aluno",
};

export default function FichaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ de?: string; filtro?: string }>;
}) {
  return (
    <Suspense fallback={<CarregandoAcesso titulo="Abrindo a ficha" />}>
      <Ficha params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Ficha({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ de?: string; filtro?: string }>;
}) {
  const admin = await requireAdmin();
  const { id } = await params;
  const origem = await searchParams;
  const volta = voltaDaFicha(origem.de, origem.filtro);
  const consulta = new URLSearchParams();
  if (origem.de === "avaliacoes") {
    consulta.set("de", "avaliacoes");
    if (origem.filtro) consulta.set("filtro", origem.filtro);
  }
  const texto = consulta.toString();
  const fichaHref = texto
    ? `/painel/alunos/${id}?${texto}`
    : `/painel/alunos/${id}`;
  const [aluno, pagamento, agenda, avaliacao, planos] = await Promise.all([
    obterAluno(id),
    pagamentoDoAluno(id),
    marcacoesDoAluno(id),
    avaliacaoDoAluno(id),
    listarPlanos(),
  ]);

  if (!aluno) notFound();

  return (
    <PainelShell adminName={admin.name} area={volta.area}>
      <FichaAluno
        aluno={aluno}
        pagamento={pagamento.ok ? pagamento.pagamento : null}
        marcacoes={agenda.ok ? agenda.marcacoes : []}
        agendaErro={agenda.ok ? null : agenda.erro}
        avaliacao={avaliacao.ok ? avaliacao.avaliacao : null}
        avaliacaoErro={avaliacao.ok ? null : avaliacao.erro}
        hoje={hojeSaoPaulo()}
        volta={volta}
        tentarDeNovo={fichaHref}
        planos={planos.ok ? planos.planos : []}
        planosErro={planos.ok ? null : planos.erro}
      />
    </PainelShell>
  );
}
