import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "APEX.FIT — Pagamento recebido",
};

export default function CobrancaRecebidaPage() {
  return (
    <main className="mx-auto flex min-h-full max-w-lg flex-col gap-space-md p-space-lg">
      <h1 className="font-headline-lg text-headline-lg tracking-tight text-on-surface">
        Pagamento recebido
      </h1>
      <p className="font-body-md text-body-md text-on-surface-variant">
        A academia confirma o recebimento em instantes. Você pode fechar esta
        página.
      </p>
    </main>
  );
}
