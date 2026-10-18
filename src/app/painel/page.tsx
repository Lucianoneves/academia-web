import type { Metadata } from "next";
import { Suspense } from "react";
import { CarregandoAcesso } from "@/components/acesso/carregando-acesso";
import { Dashboard } from "@/components/painel/dashboard";
import { requireAdmin } from "@/lib/auth";
import { resumoInicio } from "./_data-access/resumo-inicio";

export const metadata: Metadata = {
  title: "APEX.FIT — Painel da academia",
};

export default function PainelPage() {
  return (
    <Suspense fallback={<CarregandoAcesso titulo="Abrindo o painel" />}>
      <Painel />
    </Suspense>
  );
}

async function Painel() {
  const admin = await requireAdmin();
  const resumo = await resumoInicio();
  return <Dashboard adminName={admin.name} resumo={resumo} />;
}
