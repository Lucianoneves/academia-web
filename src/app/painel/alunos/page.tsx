import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { CarregandoAcesso } from "@/components/acesso/carregando-acesso";
import { PainelShell } from "@/components/painel/painel-shell";
import { contarAlunos, listarAlunos } from "./_data-access/alunos";

export const metadata: Metadata = {
  title: "APEX.FIT — Alunos",
};

export default function AlunosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; situacao?: string }>;
}) {
  return (
    <Suspense fallback={<CarregandoAcesso titulo="Abrindo os alunos" />}>
      <Alunos searchParams={searchParams} />
    </Suspense>
  );
}

async function Alunos({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; situacao?: string }>;
}) {
  const admin = await requireAdmin();
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const ativos = params.situacao !== "inativos";
  const [alunos, total] = await Promise.all([
    listarAlunos({ q, ativos }),
    contarAlunos(),
  ]);

  return (
    <PainelShell adminName={admin.name} area="lista">
      <ListaAlunos alunos={alunos} total={total} q={q} ativos={ativos} />
    </PainelShell>
  );
}

function hrefLista(ativos: boolean, q: string) {
  const params = new URLSearchParams();
  if (!ativos) params.set("situacao", "inativos");
  if (q) params.set("q", q);
  const texto = params.toString();
  return texto ? `/painel/alunos?${texto}` : "/painel/alunos";
}

function ListaAlunos({
  alunos,
  total,
  q,
  ativos,
}: {
  alunos: Awaited<ReturnType<typeof listarAlunos>>;
  total: number;
  q: string;
  ativos: boolean;
}) {
  const buscaVazia = q.length > 0 && alunos.length === 0;

  return (
    <div className="flex w-full flex-col gap-space-lg p-space-lg">
      <div className="flex flex-col justify-between gap-space-md md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-space-xs font-label-sm text-label-sm tracking-widest text-on-surface-variant uppercase">
            <span>Gestão Operacional</span>
            <span>•</span>
            <span className="text-primary-fixed">Alunos</span>
          </div>
          <h1 className="mt-space-xs font-headline-lg text-headline-lg tracking-tight text-on-surface">
            {ativos ? "Alunos ativos" : "Alunos inativos"}
          </h1>
        </div>
        <Link
          href="/painel/alunos/novo"
          className="flex h-12 items-center justify-center gap-2 rounded-lg bg-primary-fixed px-space-lg font-label-lg text-label-lg font-bold text-on-primary-fixed"
        >
          <span className="material-symbols-outlined text-[20px]">
            person_add
          </span>
          Novo Aluno
        </Link>
      </div>

      <div className="flex flex-col gap-space-md rounded-xl bg-surface-container-low p-space-lg">
        <div className="flex gap-space-xs">
          <Link
            href={hrefLista(true, q)}
            aria-current={ativos ? "page" : undefined}
            className={
              ativos
                ? "rounded-lg bg-primary-fixed px-space-md py-space-sm font-label-md text-label-md font-bold text-on-primary-fixed"
                : "rounded-lg bg-surface-container px-space-md py-space-sm font-label-md text-label-md text-on-surface-variant"
            }
          >
            Ativos
          </Link>
          <Link
            href={hrefLista(false, q)}
            aria-current={!ativos ? "page" : undefined}
            className={
              !ativos
                ? "rounded-lg bg-primary-fixed px-space-md py-space-sm font-label-md text-label-md font-bold text-on-primary-fixed"
                : "rounded-lg bg-surface-container px-space-md py-space-sm font-label-md text-label-md text-on-surface-variant"
            }
          >
            Inativos
          </Link>
        </div>

        <form
          action="/painel/alunos"
          className="flex flex-col gap-space-sm sm:flex-row"
        >
          {ativos ? null : (
            <input type="hidden" name="situacao" value="inativos" />
          )}
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar por nome ou telefone"
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
              href={hrefLista(ativos, "")}
              className="flex h-12 items-center justify-center px-space-md font-label-md text-label-md text-primary-fixed"
            >
              Limpar
            </Link>
          ) : null}
        </form>

        {buscaVazia ? (
          <p className="font-body-md text-body-md text-on-surface-variant">
            Nenhum aluno encontrado com essa busca.
          </p>
        ) : null}

        {!buscaVazia && alunos.length === 0 && total === 0 ? (
          <p className="font-body-md text-body-md text-on-surface-variant">
            Nenhum aluno cadastrado.{" "}
            <Link href="/painel/alunos/novo" className="text-primary-fixed">
              Inclua o primeiro aluno.
            </Link>
          </p>
        ) : null}

        {!buscaVazia && alunos.length === 0 && total > 0 ? (
          <p className="font-body-md text-body-md text-on-surface-variant">
            {ativos ? "Nenhum aluno ativo." : "Nenhum aluno inativo."}
          </p>
        ) : null}

        {alunos.length > 0 ? (
          <ul className="flex flex-col gap-space-xs">
            {alunos.map((aluno) => (
              <li key={aluno.id}>
                <Link
                  href={`/painel/alunos/${aluno.id}`}
                  className="flex items-center justify-between gap-space-md rounded-lg bg-surface-container px-space-md py-space-sm transition-colors hover:bg-surface-container-high"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-label-lg text-label-lg font-bold text-on-surface">
                      {aluno.nome}
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      {aluno.telefone}
                    </span>
                  </span>
                  <span
                    className={
                      aluno.ativo
                        ? "rounded-full bg-secondary-fixed/15 px-space-sm py-0.5 font-label-sm text-label-sm font-bold text-secondary-fixed uppercase"
                        : "rounded-full bg-surface-container-high px-space-sm py-0.5 font-label-sm text-label-sm font-bold text-on-surface-variant uppercase"
                    }
                  >
                    {aluno.ativo ? "Ativo" : "Inativo"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
