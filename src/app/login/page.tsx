import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { CarregandoAcesso } from "@/components/acesso/carregando-acesso";
import { LoginAdministrador } from "@/components/acesso/login-administrador";
import { administradorExiste, getCurrentAdmin } from "@/lib/auth";

export const metadata: Metadata = {
  title: "APEX.FIT — Login do administrador",
};

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <Suspense fallback={<CarregandoAcesso titulo="Abrindo o login" />}>
      <LoginConteudo searchParams={searchParams} />
    </Suspense>
  );
}

export async function LoginConteudo({
  searchParams,
}: {
  searchParams: Promise<{ aviso?: string }>;
}) {
  await connection();
  const admin = await getCurrentAdmin();
  if (admin) redirect("/painel");

  const params = await searchParams;
  let mostrarCadastro = false;

  try {
    mostrarCadastro = !(await administradorExiste());
  } catch {
    mostrarCadastro = false;
  }

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-surface px-gutter py-space-xl">
      <LoginAdministrador
        aviso={params.aviso}
        mostrarCadastro={mostrarCadastro}
      />
    </main>
  );
}
