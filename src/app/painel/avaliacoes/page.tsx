import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import {
  hrefFichaDesdeFila,
  hrefFiltroAvaliacao,
  lerFiltroAvaliacao,
  type FiltroAvaliacao,
  type SituacaoAtencao,
} from "@/lib/avaliacao";
import { formatarDataIso } from "@/lib/pagamento-situacao";
import { CarregandoAcesso } from "@/components/acesso/carregando-acesso";
import { PainelShell } from "@/components/painel/painel-shell";
import { filaAvaliacoes, type AlunoFila } from "./_data-access/avaliacoes";

export const metadata: Metadata = {
  title: "APEX.FIT — Avaliações médicas",
};

const pill: Record<SituacaoAtencao, string> = {
  a_vencer: "bg-primary-fixed/15 text-primary-fixed",
  vencida: "bg-error-container/40 text-error",
  sem_avaliacao: "bg-surface-container-high text-on-surface-variant",
};

const filtros: FiltroAvaliacao[] = [
  "todos",
  "a_vencer",
  "vencida",
  "sem_avaliacao",
];

const rotuloFiltro: Record<FiltroAvaliacao, string> = {
  todos: "Todos",
  a_vencer: "A vencer",
  vencida: "Vencida",
  sem_avaliacao: "Sem avaliação",
};

export default function AvaliacoesPage({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string }>;
}) {
  return (
    <Suspense fallback={<CarregandoAcesso titulo="Abrindo as avaliações" />}>
      <Avaliacoes searchParams={searchParams} />
    </Suspense>
  );
}

async function Avaliacoes({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string }>;
}) {
  const admin = await requireAdmin();
  const params = await searchParams;
  const filtro = lerFiltroAvaliacao(params.filtro);
  const resultado = await filaAvaliacoes(filtro);

  return (
    <PainelShell adminName={admin.name} area="avaliacoes">
      <div className="flex w-full flex-col gap-space-lg p-space-lg">
        <div>
          <div className="flex items-center gap-space-xs font-label-sm text-label-sm tracking-widest text-on-surface-variant uppercase">
            <span>Gestão Operacional</span>
            <span>•</span>
            <span className="text-primary-fixed">Avaliações médicas</span>
          </div>
          <h1 className="mt-space-xs font-headline-lg text-headline-lg tracking-tight text-on-surface">
            Avaliações médicas
          </h1>
          <p className="mt-space-xs max-w-2xl font-body-md text-body-md text-on-surface-variant">
            Alunos ativos a vencer, vencidos ou sem avaliação. Em dia continua
            na ficha. Quando houver marcação, o dia e a hora aparecem na linha.
          </p>
        </div>

        {!resultado.ok ? (
          <div className="rounded-xl bg-surface-container-low p-space-lg">
            <p className="font-body-md text-body-md text-error" role="alert">
              {resultado.erro}
            </p>
            <Link
              href={hrefFiltroAvaliacao(filtro)}
              className="mt-space-sm inline-flex font-label-md text-label-md text-primary-fixed"
            >
              Tentar de novo
            </Link>
          </div>
        ) : (
          <section className="flex flex-col gap-space-md rounded-xl bg-surface-container-low p-space-lg">
            <div className="flex flex-wrap gap-space-xs">
              {filtros.map((item) => {
                const ativo = item === filtro;
                return (
                  <Link
                    key={item}
                    href={hrefFiltroAvaliacao(item)}
                    aria-current={ativo ? "page" : undefined}
                    className={
                      ativo
                        ? "rounded-lg bg-primary-fixed px-space-md py-space-sm font-label-md text-label-md font-bold text-on-primary-fixed"
                        : "rounded-lg bg-surface-container px-space-md py-space-sm font-label-md text-label-md text-on-surface-variant"
                    }
                  >
                    {rotuloFiltro[item]}
                  </Link>
                );
              })}
            </div>

            <Lista
              ativos={resultado.ativos}
              filtro={filtro}
              alunos={resultado.alunos}
            />
          </section>
        )}
      </div>
    </PainelShell>
  );
}

function mensagemVazia(ativos: number, filtro: FiltroAvaliacao) {
  if (ativos === 0) return "Nenhum aluno ativo.";
  if (filtro === "todos") return "Nenhum aluno precisa de avaliação.";
  return "Nenhum aluno nesta situação.";
}

function Lista({
  ativos,
  filtro,
  alunos,
}: {
  ativos: number;
  filtro: FiltroAvaliacao;
  alunos: AlunoFila[];
}) {
  if (alunos.length === 0) {
    return (
      <p className="font-body-md text-body-md text-on-surface-variant">
        {mensagemVazia(ativos, filtro)}
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-space-xs">
      {alunos.map((aluno) => (
        <li key={aluno.id}>
          <Link
            href={hrefFichaDesdeFila(aluno.id, filtro)}
            className="flex items-center justify-between gap-space-md rounded-lg bg-surface-container px-space-md py-space-sm transition-colors hover:bg-surface-container-high"
          >
            <span className="min-w-0">
              <span className="block truncate font-label-lg text-label-lg font-bold text-on-surface">
                {aluno.nome}
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                {aluno.telefone}
                {aluno.validade
                  ? ` · válida até ${formatarDataIso(aluno.validade)}`
                  : ""}
                {aluno.marcacao ? ` · marcada para ${aluno.marcacao}` : ""}
              </span>
            </span>
            <span
              className={`shrink-0 rounded-full px-space-sm py-0.5 font-label-sm text-label-sm font-bold uppercase ${pill[aluno.situacao]}`}
            >
              {aluno.rotulo}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
