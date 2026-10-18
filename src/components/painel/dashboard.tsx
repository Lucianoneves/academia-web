import Link from "next/link";
import type { ResumoInicio } from "@/app/painel/_data-access/resumo-inicio";
import { hrefFichaDesdeFila } from "@/lib/avaliacao";
import { PainelShell } from "@/components/painel/painel-shell";

export function Dashboard({
  adminName,
  resumo,
}: {
  adminName: string;
  resumo: ResumoInicio;
}) {
  return (
    <PainelShell adminName={adminName} area="inicio">
      <div className="flex w-full flex-col gap-space-lg p-space-lg">
        <div>
          <div className="flex items-center gap-space-xs font-label-sm text-label-sm tracking-widest text-on-surface-variant uppercase">
            <span>Gestão Operacional</span>
            <span>•</span>
            <span className="text-primary-fixed">Início</span>
          </div>
          <h1 className="mt-space-xs font-headline-lg text-headline-lg tracking-tight text-on-surface">
            Painel da academia
          </h1>
        </div>

        {resumo.ok ? (
          <Conteudo resumo={resumo} />
        ) : (
          <Falha erro={resumo.erro} />
        )}
      </div>
    </PainelShell>
  );
}

function Falha({ erro }: { erro: string }) {
  return (
    <div className="rounded-xl bg-surface-container-low p-space-lg">
      <p className="font-body-md text-body-md text-error" role="alert">
        {erro}
      </p>
      <Link
        href="/painel"
        className="mt-space-sm inline-flex font-label-md text-label-md text-primary-fixed"
      >
        Tentar de novo
      </Link>
    </div>
  );
}

function Conteudo({ resumo }: { resumo: Extract<ResumoInicio, { ok: true }> }) {
  const cartoes = [
    {
      rotulo: "Alunos ativos",
      valor: resumo.ativos,
      href: "/painel/alunos",
      detalhe: "Cadastro",
    },
    {
      rotulo: "Em dia",
      valor: resumo.emDia,
      href: "/painel/pagamentos?situacao=em_dia",
      detalhe: "Planos com prazo",
    },
    {
      rotulo: "Atrasados",
      valor: resumo.atrasados,
      href: "/painel/pagamentos?situacao=atrasado",
      detalhe: "Planos com prazo",
    },
    {
      rotulo: "Sem pagamento",
      valor: resumo.semPagamento,
      href: "/painel/pagamentos?situacao=sem_pagamento",
      detalhe: "Planos com prazo",
    },
    {
      rotulo: "Marcações de hoje",
      valor: resumo.marcacoesHoje,
      href: `/painel/agenda?data=${resumo.hoje}`,
      detalhe: "Agenda",
    },
    {
      rotulo: "Avaliações",
      valor: resumo.avaliacoesAtencao,
      href: "/painel/avaliacoes",
      detalhe: "A vencer, vencida ou sem avaliação",
    },
    {
      rotulo: "Categorias ativas",
      valor: resumo.categoriasAtivas,
      href: "/painel/horarios",
      detalhe: "Usadas na grade",
    },
    {
      rotulo: "Planos à venda",
      valor: resumo.planosAVenda,
      href: "/painel/planos",
      detalhe: "Ativos com preço",
    },
  ];

  return (
    <>
      {resumo.ativos === 0 ? (
        <p className="font-body-md text-body-md text-on-surface-variant">
          Nenhum aluno cadastrado.{" "}
          <Link href="/painel/alunos/novo" className="text-primary-fixed">
            Inclua o primeiro aluno.
          </Link>
        </p>
      ) : null}

      <div
        id="financeiro"
        className="grid grid-cols-1 gap-space-md sm:grid-cols-2 xl:grid-cols-4"
      >
        {cartoes.map((cartao) => (
          <Link
            key={cartao.rotulo}
            href={cartao.href}
            className="flex flex-col justify-between rounded-xl bg-surface-container-low p-space-lg shadow-sm transition-colors hover:bg-surface-container"
          >
            <span className="font-label-sm text-label-sm font-semibold tracking-wider text-on-surface-variant uppercase">
              {cartao.rotulo}
            </span>
            <span className="mt-space-md font-data-display text-data-display font-bold tracking-tight text-on-surface">
              {cartao.valor}
            </span>
            <span className="mt-1 font-label-md text-label-md text-primary-fixed">
              {cartao.detalhe}
            </span>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-space-lg lg:grid-cols-2">
        <section
          id="aulas"
          className="flex flex-col rounded-xl bg-surface-container-low p-space-lg"
        >
          <div className="flex items-center justify-between pb-space-md">
            <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
              Aulas de hoje
            </h2>
            <Link
              href={`/painel/agenda?data=${resumo.hoje}`}
              className="font-label-sm text-label-sm text-primary-fixed"
            >
              Abrir agenda
            </Link>
          </div>
          {resumo.aulas.length === 0 ? (
            <p className="font-body-md text-body-md text-on-surface-variant">
              Não há marcação hoje.
            </p>
          ) : (
            <ul className="flex flex-col gap-space-sm">
              {resumo.aulas.map((aula) => (
                <li key={aula.id}>
                  <Link
                    href={`/painel/agenda?data=${resumo.hoje}`}
                    className="flex items-center justify-between gap-space-md rounded-lg bg-surface-container p-space-md transition-colors hover:bg-surface-container-high"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-label-lg text-label-lg font-bold text-on-surface">
                        {aula.nome}
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        {aula.categoria}
                      </span>
                    </span>
                    <span className="shrink-0 font-label-md text-label-md text-primary-fixed">
                      {aula.horario}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="flex flex-col rounded-xl bg-surface-container-low p-space-lg">
          <div className="flex items-center justify-between pb-space-md">
            <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
              Avaliações
            </h2>
            <Link
              href="/painel/avaliacoes"
              className="font-label-sm text-label-sm text-primary-fixed"
            >
              Ver todas ({resumo.avaliacoesAtencao})
            </Link>
          </div>
          {resumo.avaliacoes.length === 0 ? (
            <p className="font-body-md text-body-md text-on-surface-variant">
              Nenhuma avaliação pede atenção.
            </p>
          ) : (
            <ul className="flex flex-col gap-space-sm">
              {resumo.avaliacoes.map((aluno) => (
                <li key={aluno.id}>
                  <Link
                    href={hrefFichaDesdeFila(aluno.id, "todos")}
                    className="flex items-center justify-between gap-space-md rounded-lg bg-surface-container p-space-md transition-colors hover:bg-surface-container-high"
                  >
                    <span className="truncate font-label-lg text-label-lg font-bold text-on-surface">
                      {aluno.nome}
                    </span>
                    <span className="shrink-0 rounded-full bg-tertiary-fixed/15 px-space-sm py-0.5 font-label-sm text-label-sm font-bold text-tertiary-fixed-dim uppercase">
                      {aluno.rotulo}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
