"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginAdministrador() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [remember, setRemember] = useState(true);
  const [sessionVisible, setSessionVisible] = useState(true);

  function dismissSession() {
    setSessionVisible(false);
  }

  return (
    <div className="relative flex w-full flex-col items-center justify-center px-gutter py-space-xl">
      <div className="pointer-events-none absolute -top-24 h-[480px] w-[480px] rounded-full bg-primary-fixed/5 blur-3xl select-none" />
      <div className="relative z-10 flex w-full max-w-[480px] flex-col gap-space-md">
        {sessionVisible ? (
          <div className="flex w-full items-center justify-between rounded-xl bg-surface-container-low p-space-sm shadow-md">
            <div className="flex min-w-0 items-center gap-space-sm">
              <div className="relative shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-highest font-headline-sm text-headline-sm text-primary-fixed">
                  CE
                </div>
                <span className="absolute right-0 bottom-0 h-2 w-2 rounded-full bg-secondary-fixed ring-2 ring-surface-container-low" />
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="truncate font-headline-sm text-headline-sm text-on-surface">
                  Carlos Eduardo
                </span>
                <span className="truncate font-body-sm text-body-sm text-on-surface-variant">
                  carlos.oliveira@fitadmin.com.br
                </span>
              </div>
            </div>
            <button
              type="button"
              title="Desconectar sessão ativa"
              className="group ml-space-sm flex shrink-0 items-center gap-1 rounded-lg bg-surface-container px-space-sm py-1.5 text-on-surface-variant transition-colors hover:bg-error-container/20 hover:text-error"
              onClick={dismissSession}
            >
              <span className="material-symbols-outlined text-[18px] transition-colors group-hover:text-error">
                logout
              </span>
              <span className="hidden font-label-md text-label-md sm:inline">
                Logout
              </span>
            </button>
          </div>
        ) : null}

        <div className="flex w-full flex-col rounded-xl bg-surface-container p-space-xl shadow-xl">
          <div className="mb-space-lg flex flex-col items-center text-center">
            <div className="mb-space-md flex h-12 w-12 items-center justify-center rounded-xl bg-surface-container-highest text-primary-fixed shadow-inner">
              <span className="material-symbols-outlined text-[26px]">
                admin_panel_settings
              </span>
            </div>
            <h1 className="mb-space-xs font-headline-lg text-headline-lg tracking-tight text-on-surface">
              Login do Administrador
            </h1>
            <p className="max-w-[340px] font-body-md text-body-md text-on-surface-variant">
              Insira suas credenciais corporativas para acessar o painel de
              gestão.
            </p>
          </div>

          <form
            className="flex flex-col gap-space-lg"
            onSubmit={(event) => {
              event.preventDefault();
              router.push("/painel");
            }}
          >
            <div className="flex flex-col gap-space-xs">
              <label
                className="flex items-center justify-between font-label-md text-label-md tracking-wider text-on-surface uppercase"
                htmlFor="email"
              >
                <span>
                  E-mail Corporativo{" "}
                  <span className="text-primary-fixed">*</span>
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant lowercase">
                  admin / gestor
                </span>
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined pointer-events-none absolute left-3.5 text-[20px] text-on-surface-variant">
                  mail
                </span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="exemplo@fitadmin.com.br"
                  autoComplete="email"
                  className="h-12 w-full rounded-lg bg-surface-container-low pr-4 pl-11 font-body-md text-body-md text-on-surface transition-colors placeholder:text-on-surface-variant/50 focus:bg-surface-container-highest focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-space-xs">
              <div className="flex items-center justify-between">
                <label
                  className="font-label-md text-label-md tracking-wider text-on-surface uppercase"
                  htmlFor="senha"
                >
                  Senha <span className="text-primary-fixed">*</span>
                </label>
                <a
                  className="flex items-center gap-0.5 font-label-md text-label-md text-primary-fixed transition-colors hover:text-primary-fixed-dim"
                  href="#recuperar"
                >
                  Esqueceu a senha?
                </a>
              </div>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined pointer-events-none absolute left-3.5 text-[20px] text-on-surface-variant">
                  lock
                </span>
                <input
                  id="senha"
                  name="senha"
                  type={visible ? "text" : "password"}
                  required
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  className="h-12 w-full rounded-lg bg-surface-container-low pr-12 pl-11 font-body-md text-body-md text-on-surface transition-colors placeholder:text-on-surface-variant/50 focus:bg-surface-container-highest focus:outline-none"
                />
                <button
                  type="button"
                  aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute right-3.5 flex items-center justify-center p-1 text-on-surface-variant transition-colors hover:text-on-surface"
                  onClick={() => setVisible((current) => !current)}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {visible ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-space-sm pt-space-xs">
              <label className="relative flex cursor-pointer items-center gap-space-sm select-none">
                <input
                  className="sr-only"
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                />
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded transition-colors ${remember ? "bg-primary-fixed" : "bg-surface-container-low"}`}
                >
                  <span
                    className={`material-symbols-outlined text-[16px] font-bold text-surface ${remember ? "opacity-100" : "opacity-0"}`}
                  >
                    check
                  </span>
                </div>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Manter sessão ativa neste dispositivo
                </span>
              </label>
            </div>

            <button
              type="submit"
              className="mt-space-xs flex h-[52px] w-full items-center justify-center gap-space-sm rounded-lg bg-primary-fixed font-headline-sm text-headline-sm tracking-wide text-surface shadow-md transition-all hover:bg-primary-fixed-dim active:scale-[0.99]"
            >
              <span>ENTRAR NO SISTEMA</span>
              <span className="material-symbols-outlined text-[22px]">
                arrow_forward
              </span>
            </button>
          </form>

          <div className="mt-space-lg flex flex-col items-center gap-space-sm pt-space-xl">
            <div className="h-px w-full bg-surface-container-highest" />
            <div className="flex items-center justify-center gap-1 pt-space-xs font-body-sm text-body-sm text-on-surface-variant">
              <span>Não tem uma conta corporativa?</span>
              <Link
                className="ml-1 inline-flex items-center gap-0.5 font-headline-sm text-headline-sm text-primary-fixed transition-colors hover:text-primary-fixed-dim"
                href="/"
              >
                Fazer Cadastro
              </Link>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-space-xs font-label-sm text-label-sm tracking-widest text-on-surface-variant uppercase">
          <div className="flex items-center gap-1.5 opacity-75">
            <span className="h-1.5 w-1.5 rounded-full bg-secondary-fixed" />
            <span>Conexão Segura TLS 256-Bit</span>
          </div>
          <button
            type="button"
            className="flex items-center gap-1 opacity-75 transition-all hover:text-error hover:opacity-100"
            onClick={dismissSession}
          >
            <span className="material-symbols-outlined text-[14px]">
              power_settings_new
            </span>
            <span>Sair da Conta</span>
          </button>
        </div>
      </div>
    </div>
  );
}
