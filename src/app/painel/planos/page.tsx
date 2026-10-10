import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { CarregandoAcesso } from "@/components/acesso/carregando-acesso";
import { PainelShell } from "@/components/painel/painel-shell";
import { ListaPlanos } from "./_components/lista";
import { listarPlanos } from "./_data-access/planos";

export const metadata: Metadata = {
  title: "APEX.FIT — Planos",
};

export default function PlanosPage() {
  return (
    <Suspense fallback={<CarregandoAcesso titulo="Abrindo os planos" />}>
      <Planos />
    </Suspense>
  );
}

async function Planos() {
  const admin = await requireAdmin();
  const resultado = await listarPlanos();

  return (
    <PainelShell adminName={admin.name} area="planos">
      <div className="flex w-full flex-col gap-space-lg p-space-lg">
        <div>
          <div className="flex items-center gap-space-xs font-label-sm text-label-sm tracking-widest text-on-surface-variant uppercase">
            <span>Gestão Operacional</span>
            <span>•</span>
            <span className="text-primary-fixed">Planos</span>
          </div>
          <h1 className="mt-space-xs font-headline-lg text-headline-lg tracking-tight text-on-surface">
            Planos ofertados
          </h1>
          <p className="mt-space-xs max-w-2xl font-body-md text-body-md text-on-surface-variant">
            Avulso, mensal, trimestral, semestral e anual. O preço salvo é o
            valor sugerido no pagamento. O plano escolhido no cadastro do aluno
            não muda.
          </p>
        </div>

        {!resultado.ok ? (
          <div className="rounded-xl bg-surface-container-low p-space-lg">
            <p className="font-body-md text-body-md text-error" role="alert">
              {resultado.erro}
            </p>
            <Link
              href="/painel/planos"
              className="mt-space-sm inline-flex font-label-md text-label-md text-primary-fixed"
            >
              Tentar de novo
            </Link>
          </div>
        ) : null}

        {resultado.ok && resultado.planos.length === 0 ? (
          <p className="font-body-md text-body-md text-on-surface-variant">
            Os cinco planos ainda não estão no banco. Aplique{" "}
            <span className="text-on-surface">supabase/04_plans.sql</span> no
            editor SQL do Supabase.
          </p>
        ) : null}

        {resultado.ok && resultado.planos.length > 0 ? (
          <ListaPlanos planos={resultado.planos} />
        ) : null}
      </div>
    </PainelShell>
  );
}
