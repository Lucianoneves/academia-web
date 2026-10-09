import { CadastroAdministrador } from "@/components/acesso/cadastro-administrador";

export default function Home() {
  return (
    <>
      <header className="fixed top-0 z-50 w-full bg-surface/80 shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl">
        <div className="flex h-16 w-full items-center justify-between px-space-xl">
          <div className="flex items-center gap-space-sm">
            <div className="h-3 w-3 rounded-full bg-primary-container" />
            <span className="font-headline-sm text-headline-sm tracking-wider text-primary uppercase">
              APEX<span className="text-primary-container">.FIT</span>
            </span>
            <span className="mx-space-xs font-label-md text-outline">/</span>
            <span className="font-label-md text-label-md tracking-wider text-on-surface-variant uppercase">
              ADMIN CONSOLE
            </span>
          </div>
          <div className="flex items-center gap-space-sm">
            <span className="material-symbols-outlined text-[18px] text-primary-container">
              verified
            </span>
            <span className="font-label-sm text-label-sm tracking-widest text-on-surface-variant uppercase">
              UNIT SELECTOR: JARDINS HQ
            </span>
          </div>
        </div>
      </header>

      <main className="min-h-screen w-full bg-surface pt-16">
        <div className="relative flex min-h-[calc(100vh-4rem)] w-full items-center justify-center overflow-hidden px-space-xl py-space-xl">
          <div className="pointer-events-none absolute -top-32 -left-20 h-96 w-96 rounded-full bg-primary-container/10 blur-3xl" />
          <div className="pointer-events-none absolute top-1/2 -right-32 h-80 w-80 rounded-full bg-secondary-container/10 blur-3xl" />
          <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center">
            <div className="flex w-full flex-col gap-space-lg">
              <div className="relative rounded-xl bg-surface-container-low p-space-xl shadow-2xl">
                <div className="flex flex-col justify-between gap-space-sm pb-space-lg sm:flex-row sm:items-center">
                  <div className="flex flex-col text-left">
                    <h1 className="font-headline-xl text-headline-xl tracking-tight text-primary">
                      Cadastro do Administrador
                    </h1>
                    <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
                      Preencha os dados abaixo para criar sua conta de
                      administrador.
                    </p>
                  </div>
                </div>
                <CadastroAdministrador />
                <div className="mt-space-lg flex flex-col items-center justify-between gap-space-sm pt-space-md font-label-sm text-label-sm text-outline md:flex-row">
                  <div className="flex items-center gap-space-md">
                    <a
                      className="flex items-center gap-1 transition-colors hover:text-primary"
                      href="#suporte"
                    >
                      <span className="material-symbols-outlined text-base">
                        support_agent
                      </span>
                      Suporte de TI / Helpdesk
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
