export function CarregandoAcesso({ titulo }: { titulo: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-gutter">
      <p className="font-body-md text-body-md text-on-surface-variant">
        {titulo}
      </p>
    </main>
  );
}
