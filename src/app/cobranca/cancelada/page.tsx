import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "APEX.FIT — Pagamento não concluído",
};

export default function CobrancaCanceladaPage() {
  return (
    <main className="mx-auto flex min-h-full max-w-lg flex-col gap-space-md p-space-lg">
      <h1 className="font-headline-lg text-headline-lg tracking-tight text-on-surface">
        Pagamento não concluído
      </h1>
      <p className="font-body-md text-body-md text-on-surface-variant">
        Nada foi cobrado. Peça um novo link à academia se ainda quiser pagar.
      </p>
    </main>
  );
}
