import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import type { SituacaoPagamento } from "@/lib/pagamento-situacao";
import { CarregandoAcesso } from "@/components/acesso/carregando-acesso";
import { PainelShell } from "@/components/painel/painel-shell";
import { FormularioLancamento } from "./_components/lancamento";
import { FormularioLinkCartao } from "./_components/link-cartao";
import { listarPagamentos } from "./_data-access/pagamentos";

export const metadata: Metadata = {
  title: "APEX.FIT — Pagamentos",
};

const pill: Record<SituacaoPagamento, string> = {
  em_dia: "bg-secondary-fixed/15 text-secondary-fixed",
  atrasado: "bg-error-container/40 text-error",
  sem_pagamento: "bg-surface-container-high text-on-surface-variant",
  credito_disponivel: "bg-primary-fixed/15 text-primary-fixed",
  credito_utilizado: "bg-tertiary-fixed/15 text-tertiary-fixed-dim",
};

const filtros: { value: SituacaoPagamento | null; label: string }[] = [
  { value: null, label: "Todos" },
  { value: "em_dia", label: "Em dia" },
  { value: "atrasado", label: "Atrasado" },
  { value: "sem_pagamento", label: "Sem pagamento" },
  { value: "credito_disponivel", label: "Crédito disponível" },
  { value: "credito_utilizado", label: "Crédito utilizado" },
];

const vazio: Record<SituacaoPagamento, string> = {
  em_dia: "Nenhum aluno em dia.",
  atrasado: "Nenhum aluno atrasado.",
  sem_pagamento: "Nenhum aluno sem pagamento.",
  credito_disponivel: "Nenhum aluno com crédito disponível.",
  credito_utilizado: "Nenhum aluno com crédito utilizado.",
};

function situacaoParam(valor: string | undefined): SituacaoPagamento | null {
  return filtros.some((filtro) => filtro.value === valor)
    ? (valor as SituacaoPagamento)
    : null;
}

function hrefLista(situacao: SituacaoPagamento | null, q: string) {
  const params = new URLSearchParams();
  if (situacao) params.set("situacao", situacao);
  if (q) params.set("q", q);
  const texto = params.toString();
  return texto ? `/painel/pagamentos?${texto}` : "/painel/pagamentos";
}

export default function PagamentosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; situacao?: string; aluno?: string }>;
}) {
  return (
    <Suspense fallback={<CarregandoAcesso titulo="Abrindo os pagamentos" />}>
      <Pagamentos searchParams={searchParams} />
    </Suspense>
  );
}

async function Pagamentos({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; situacao?: string; aluno?: string }>;
}) {
  const admin = await requireAdmin();
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const situacao = situacaoParam(params.situacao);
  const resultado = await listarPagamentos({ q, situacao });

  return (
    <PainelShell adminName={admin.name} area="pagamentos">
      <div className="flex w-full flex-col gap-space-lg p-space-lg">
        <div>
          <div className="flex items-center gap-space-xs font-label-sm text-label-sm tracking-widest text-on-surface-variant uppercase">
            <span>Gestão Operacional</span>
            <span>•</span>
            <span className="text-primary-fixed">Pagamentos</span>
          </div>
          <h1 className="mt-space-xs font-headline-lg text-headline-lg tracking-tight text-on-surface">
            Pagamentos
          </h1>
          <p className="mt-space-xs max-w-2xl font-body-md text-body-md text-on-surface-variant">
            Recebimento em dinheiro, com valor ajustável. Um erro se corrige com
            estorno, sem apagar a linha. Se o avulso já marcou uma aula que
            ainda não começou, cancele a aula antes de estornar.
          </p>
        </div>

        {!resultado.ok ? (
          <div className="rounded-xl bg-surface-container-low p-space-lg">
            <p className="font-body-md text-body-md text-error" role="alert">
              {resultado.erro}
            </p>
            <Link
              href="/painel/pagamentos"
              className="mt-space-sm inline-flex font-label-md text-label-md text-primary-fixed"
            >
              Tentar de novo
            </Link>
          </div>
        ) : (
          <>
            <section
              id="lancar"
              className="flex flex-col gap-space-md rounded-xl bg-surface-container-low p-space-lg"
            >
              <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                Lançar pagamento
              </h2>
              <FormularioLancamento
                opcoes={resultado.opcoes}
                alunoInicial={params.aluno ?? ""}
              />
            </section>

            <section className="flex flex-col gap-space-md rounded-xl bg-surface-container-low p-space-lg">
              <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                Link de cartão
              </h2>
              <FormularioLinkCartao
                opcoes={resultado.opcoes}
                alunoInicial={params.aluno ?? ""}
              />
            </section>

            <section className="flex flex-col gap-space-md rounded-xl bg-surface-container-low p-space-lg">
              <div className="flex flex-wrap gap-space-xs">
                {filtros.map((filtro) => {
                  const ativo = filtro.value === situacao;
                  return (
                    <Link
                      key={filtro.label}
                      href={hrefLista(filtro.value, q)}
                      aria-current={ativo ? "page" : undefined}
                      className={
                        ativo
                          ? "rounded-lg bg-primary-fixed px-space-md py-space-sm font-label-md text-label-md font-bold text-on-primary-fixed"
                          : "rounded-lg bg-surface-container px-space-md py-space-sm font-label-md text-label-md text-on-surface-variant"
                      }
                    >
                      {filtro.label}
                    </Link>
                  );
                })}
              </div>

              <form
                action="/painel/pagamentos"
                className="flex flex-col gap-space-sm sm:flex-row"
              >
                {situacao ? (
                  <input type="hidden" name="situacao" value={situacao} />
                ) : null}
                <input
                  name="q"
                  defaultValue={q}
                  placeholder="Buscar por nome"
                  className="h-12 flex-1 rounded-lg bg-surface-container px-space-md font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:bg-surface-container-high focus:outline-none"
                />
                <button
                  type="submit"
                  className="h-12 rounded-lg bg-surface-container-high px-space-lg font-label-lg text-label-lg text-on-surface"
                >
                  Buscar
                </button>
                {q ? (
                  <Link
                    href={hrefLista(situacao, "")}
                    className="flex h-12 items-center justify-center px-space-md font-label-md text-label-md text-primary-fixed"
                  >
                    Limpar
                  </Link>
                ) : null}
              </form>

              <Lista
                total={resultado.total}
                quantidade={resultado.alunos.length}
                q={q}
                situacao={situacao}
                alunos={resultado.alunos}
              />
            </section>
          </>
        )}
      </div>
    </PainelShell>
  );
}

function Lista({
  total,
  quantidade,
  q,
  situacao,
  alunos,
}: {
  total: number;
  quantidade: number;
  q: string;
  situacao: SituacaoPagamento | null;
  alunos: {
    id: string;
    nome: string;
    ativo: boolean;
    rotulo: string;
    planoAtivo: string | null;
    situacao: SituacaoPagamento;
  }[];
}) {
  if (q && quantidade === 0) {
    return (
      <p className="font-body-md text-body-md text-on-surface-variant">
        Nenhum aluno encontrado com essa busca.
      </p>
    );
  }

  if (quantidade === 0 && total === 0) {
    return (
      <p className="font-body-md text-body-md text-on-surface-variant">
        Nenhum aluno cadastrado.{" "}
        <Link href="/painel/alunos/novo" className="text-primary-fixed">
          Inclua o primeiro aluno.
        </Link>
      </p>
    );
  }

  if (quantidade === 0 && situacao) {
    return (
      <p className="font-body-md text-body-md text-on-surface-variant">
        {vazio[situacao]}
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-space-xs">
      {alunos.map((aluno) => (
        <li key={aluno.id}>
          <Link
            href={`/painel/pagamentos/${aluno.id}`}
            className="flex items-center justify-between gap-space-md rounded-lg bg-surface-container px-space-md py-space-sm transition-colors hover:bg-surface-container-high"
          >
            <span className="min-w-0">
              <span className="block truncate font-label-lg text-label-lg font-bold text-on-surface">
                {aluno.nome}
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                {aluno.planoAtivo ?? aluno.rotulo}
                {aluno.ativo ? "" : " · Inativo"}
              </span>
            </span>
            <span
              className={`rounded-full px-space-sm py-0.5 font-label-sm text-label-sm font-bold uppercase ${pill[aluno.situacao]}`}
            >
              {aluno.rotulo}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
