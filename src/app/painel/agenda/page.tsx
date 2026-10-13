import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { hojeSaoPaulo } from "@/lib/validacao";
import { CarregandoAcesso } from "@/components/acesso/carregando-acesso";
import { PainelShell } from "@/components/painel/painel-shell";
import { DiaAgenda } from "./_components/dia";
import { agendaDoDia } from "./_data-access/agenda";

export const metadata: Metadata = {
  title: "APEX.FIT — Agenda",
};

function dataParam(valor: string | undefined) {
  if (valor && /^\d{4}-\d{2}-\d{2}$/.test(valor)) return valor;
  return hojeSaoPaulo();
}

export default function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string }>;
}) {
  return (
    <Suspense fallback={<CarregandoAcesso titulo="Abrindo a agenda" />}>
      <Agenda searchParams={searchParams} />
    </Suspense>
  );
}

async function Agenda({
  searchParams,
}: {
  searchParams: Promise<{ data?: string }>;
}) {
  const admin = await requireAdmin();
  const params = await searchParams;
  const data = dataParam(params.data);
  const resultado = await agendaDoDia(data);

  return (
    <PainelShell adminName={admin.name} area="agenda">
      <div className="flex w-full flex-col gap-space-lg p-space-lg">
        <div>
          <div className="flex items-center gap-space-xs font-label-sm text-label-sm tracking-widest text-on-surface-variant uppercase">
            <span>Gestão Operacional</span>
            <span>•</span>
            <span className="text-primary-fixed">Agenda</span>
          </div>
          <h1 className="mt-space-xs font-headline-lg text-headline-lg tracking-tight text-on-surface">
            Agenda do dia
          </h1>
          <p className="mt-space-xs max-w-2xl font-body-md text-body-md text-on-surface-variant">
            Cada marcação vale uma data. Hoje só entra e só cancela antes do
            início da aula.
          </p>
        </div>

        {!resultado.ok ? (
          <div className="rounded-xl bg-surface-container-low p-space-lg">
            <p className="font-body-md text-body-md text-error" role="alert">
              {resultado.erro}
            </p>
            <Link
              href="/painel/agenda"
              className="mt-space-sm inline-flex font-label-md text-label-md text-primary-fixed"
            >
              Tentar de novo
            </Link>
          </div>
        ) : (
          <DiaAgenda
            data={resultado.data}
            slots={resultado.slots}
            alunos={resultado.alunos}
          />
        )}
      </div>
    </PainelShell>
  );
}
