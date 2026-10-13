import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { CarregandoAcesso } from "@/components/acesso/carregando-acesso";
import { PainelShell } from "@/components/painel/painel-shell";
import { GradeHorarios } from "./_components/grade";
import { listarHorarios } from "./_data-access/horarios";

export const metadata: Metadata = {
  title: "APEX.FIT — Horários",
};

export default function HorariosPage({
  searchParams,
}: {
  searchParams: Promise<{ situacao?: string }>;
}) {
  return (
    <Suspense fallback={<CarregandoAcesso titulo="Abrindo os horários" />}>
      <Horarios searchParams={searchParams} />
    </Suspense>
  );
}

async function Horarios({
  searchParams,
}: {
  searchParams: Promise<{ situacao?: string }>;
}) {
  const admin = await requireAdmin();
  const params = await searchParams;
  const ativos = params.situacao !== "inativos";
  const resultado = await listarHorarios(ativos);

  return (
    <PainelShell adminName={admin.name} area="horarios">
      <div className="flex w-full flex-col gap-space-lg p-space-lg">
        <div className="flex flex-col justify-between gap-space-md md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-space-xs font-label-sm text-label-sm tracking-widest text-on-surface-variant uppercase">
              <span>Gestão Operacional</span>
              <span>•</span>
              <span className="text-primary-fixed">Horários</span>
            </div>
            <h1 className="mt-space-xs font-headline-lg text-headline-lg tracking-tight text-on-surface">
              {ativos ? "Horários ativos" : "Horários inativos"}
            </h1>
            <p className="mt-space-xs max-w-2xl font-body-md text-body-md text-on-surface-variant">
              A aula vale toda semana, no dia e no horário salvos. Duas aulas
              podem acontecer ao mesmo tempo.
            </p>
          </div>
          <div className="flex gap-space-sm">
            <Link
              href="/painel/horarios"
              className={
                ativos
                  ? "rounded-lg bg-primary-fixed px-space-md py-space-sm font-label-md text-label-md font-bold text-on-primary-fixed"
                  : "rounded-lg bg-surface-container px-space-md py-space-sm font-label-md text-label-md text-on-surface"
              }
            >
              Ativos
            </Link>
            <Link
              href="/painel/horarios?situacao=inativos"
              className={
                ativos
                  ? "rounded-lg bg-surface-container px-space-md py-space-sm font-label-md text-label-md text-on-surface"
                  : "rounded-lg bg-primary-fixed px-space-md py-space-sm font-label-md text-label-md font-bold text-on-primary-fixed"
              }
            >
              Inativos
            </Link>
          </div>
        </div>

        {!resultado.ok ? (
          <div className="rounded-xl bg-surface-container-low p-space-lg">
            <p className="font-body-md text-body-md text-error" role="alert">
              {resultado.erro}
            </p>
            <Link
              href="/painel/horarios"
              className="mt-space-sm inline-flex font-label-md text-label-md text-primary-fixed"
            >
              Tentar de novo
            </Link>
          </div>
        ) : (
          <GradeHorarios
            horarios={resultado.horarios}
            categorias={resultado.categorias}
            ativos={ativos}
          />
        )}
      </div>
    </PainelShell>
  );
}
