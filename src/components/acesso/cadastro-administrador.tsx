"use client";

import Link from "next/link";
import { useActionState, useState, useTransition, type FormEvent } from "react";
import { criarAdministrador } from "@/app/_actions/criar-administrador";
import { useBarraNaTroca } from "@/components/progresso-navegacao";
import type { FormState } from "@/lib/validacao";

const initialState: FormState = { success: false };

function PasswordField({
  id,
  label,
  placeholder,
  icon,
  error,
}: {
  id: string;
  label: string;
  placeholder: string;
  icon: string;
  error?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <label
        className="flex items-center font-label-md text-label-md text-on-surface"
        htmlFor={id}
      >
        {label}
        <span className="ml-1 text-error">*</span>
      </label>
      <div className="relative flex items-center">
        <span className="material-symbols-outlined pointer-events-none absolute left-3 text-xl text-outline">
          {icon}
        </span>
        <input
          id={id}
          name={id}
          type={visible ? "text" : "password"}
          required
          placeholder={placeholder}
          autoComplete={id === "senha" ? "new-password" : "new-password"}
          className="w-full rounded-lg bg-surface-container py-3 pr-10 pl-10 font-body-md text-body-md text-primary shadow-inner transition-colors placeholder:text-outline focus:bg-surface-container-high focus:outline-none"
        />
        <button
          type="button"
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          className="absolute right-3 flex items-center text-outline transition-colors hover:text-primary"
          onClick={() => setVisible((current) => !current)}
        >
          <span className="material-symbols-outlined text-xl">
            {visible ? "visibility_off" : "visibility"}
          </span>
        </button>
      </div>
      {error ? (
        <p className="font-body-sm text-body-sm text-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function CadastroAdministrador() {
  const [state, action] = useActionState(criarAdministrador, initialState);
  const [pending, startTransition] = useTransition();
  const iniciarBarra = useBarraNaTroca(
    pending,
    Boolean(state.message) || state.errors != null
  );
  const erro = (campo: string) => state.errors?.[campo]?.[0];

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    iniciarBarra();
    startTransition(() => {
      action(data);
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-space-lg">
      {state.message ? (
        <p className="font-body-md text-body-md text-error" role="alert">
          {state.message}
        </p>
      ) : null}
      <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label
            className="flex items-center font-label-md text-label-md text-on-surface"
            htmlFor="nome"
          >
            Nome Completo
            <span className="ml-1 text-error">*</span>
          </label>
          <div className="relative flex items-center">
            <span className="material-symbols-outlined pointer-events-none absolute left-3 text-xl text-outline">
              badge
            </span>
            <input
              id="nome"
              name="nome"
              type="text"
              required
              placeholder="Nome completo"
              autoComplete="name"
              className="w-full rounded-lg bg-surface-container py-3 pr-4 pl-10 font-body-md text-body-md text-primary shadow-inner transition-colors placeholder:text-outline focus:bg-surface-container-high focus:text-primary focus:outline-none"
            />
          </div>
          {erro("nome") ? (
            <p className="font-body-sm text-body-sm text-error" role="alert">
              {erro("nome")}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-2">
          <label
            className="flex items-center font-label-md text-label-md text-on-surface"
            htmlFor="email"
          >
            E-mail Corporativo
            <span className="ml-1 text-error">*</span>
          </label>
          <div className="relative flex items-center">
            <span className="material-symbols-outlined pointer-events-none absolute left-3 text-xl text-outline">
              mail
            </span>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="email@empresa.com"
              autoComplete="email"
              className="w-full rounded-lg bg-surface-container py-3 pr-4 pl-10 font-body-md text-body-md text-primary shadow-inner transition-colors placeholder:text-outline focus:bg-surface-container-high focus:outline-none"
            />
          </div>
          {erro("email") ? (
            <p className="font-body-sm text-body-sm text-error" role="alert">
              {erro("email")}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
        <PasswordField
          id="senha"
          label="Senha"
          placeholder="Sua senha"
          icon="key"
          error={erro("senha")}
        />
        <PasswordField
          id="confirmacao"
          label="Confirmação de Senha"
          placeholder="Confirme sua senha"
          icon="lock_reset"
          error={erro("confirmacao")}
        />
      </div>

      <div className="flex flex-col gap-space-md pt-space-xs">
        <button
          type="submit"
          disabled={pending}
          className="flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-primary-container font-headline-sm text-headline-sm tracking-wider text-on-primary-container uppercase shadow-lg transition-all hover:bg-primary-fixed-dim hover:shadow-primary-container/20 active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
        >
          <span>{pending ? "Salvando..." : "Cadastrar Administrador"}</span>
          <span className="material-symbols-outlined text-2xl font-bold">
            arrow_forward
          </span>
        </button>
        <div className="flex items-center justify-center gap-1 font-body-sm text-body-sm text-on-surface-variant">
          <span>Já tem uma conta?</span>
          <Link
            className="font-label-md text-label-md text-primary-fixed hover:underline"
            href="/login"
          >
            Fazer Login
          </Link>
        </div>
      </div>
    </form>
  );
}
