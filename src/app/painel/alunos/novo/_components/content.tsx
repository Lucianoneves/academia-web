"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useTransition,
  type FormEvent,
  type ReactNode,
} from "react";
import { criarAluno } from "../_actions/criar-aluno";
import { planosCadastro, type FormState } from "@/lib/validacao";

const initialState: FormState = { success: false };

function Campo({
  id,
  label,
  icon,
  error,
  children,
  className = "",
}: {
  id: string;
  label: string;
  icon: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-space-xs ${className}`}>
      <label
        className="font-label-md text-label-md font-semibold text-on-surface-variant uppercase"
        htmlFor={id}
      >
        {label}
      </label>
      <div className="relative flex items-center">
        <span className="material-symbols-outlined pointer-events-none absolute left-3 text-[20px] text-on-surface-variant">
          {icon}
        </span>
        {children}
      </div>
      {error ? (
        <p className="font-body-sm text-body-sm text-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

const inputClass =
  "h-12 w-full rounded-lg bg-surface-container pr-space-md pl-10 font-body-md text-body-md text-on-surface transition-colors placeholder:text-on-surface-variant/50 focus:bg-surface-container-high focus:text-primary-fixed focus:outline-none";

export function CadastroAluno() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action] = useActionState(criarAluno, initialState);
  const [pending, startTransition] = useTransition();
  const erro = (campo: string) => state.errors?.[campo]?.[0];

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.stamp, state.success]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(() => {
      action(data);
    });
  }

  return (
    <div className="flex w-full flex-col gap-space-lg p-space-lg">
      <div className="flex flex-col">
        <div className="flex items-center gap-space-xs font-label-sm text-label-sm tracking-widest text-on-surface-variant uppercase">
          <span>Gestão Operacional</span>
          <span>•</span>
          <span className="text-primary-fixed">Novo Aluno</span>
        </div>
        <h1 className="mt-space-xs font-headline-lg text-headline-lg tracking-tight text-on-surface">
          Cadastrar aluno
        </h1>
      </div>

      <section className="flex flex-col gap-space-lg rounded-xl bg-surface-container-low p-space-lg shadow-xl">
        <div>
          <h2 className="font-headline-lg text-headline-lg tracking-tight text-on-surface">
            Dados cadastrais e físicos
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Nome, nascimento, telefone, peso, altura, plano e restrições
            médicas.
          </p>
        </div>

        {state.message ? (
          <p
            className={
              state.success
                ? "rounded-lg bg-secondary-fixed/15 px-space-md py-space-sm font-body-md text-body-md text-secondary-fixed"
                : "rounded-lg bg-error-container/30 px-space-md py-space-sm font-body-md text-body-md text-error"
            }
            role="status"
          >
            {state.message}
          </p>
        ) : null}

        <form
          ref={formRef}
          onSubmit={onSubmit}
          className="grid grid-cols-1 gap-space-md md:grid-cols-2 lg:grid-cols-4"
        >
          <Campo
            id="nome"
            label="Nome completo"
            icon="person"
            error={erro("nome")}
            className="lg:col-span-2"
          >
            <input
              id="nome"
              name="nome"
              type="text"
              required
              autoComplete="name"
              placeholder="Nome completo"
              className={inputClass}
            />
          </Campo>

          <Campo
            id="nascimento"
            label="Data de nascimento"
            icon="cake"
            error={erro("nascimento")}
          >
            <input
              id="nascimento"
              name="nascimento"
              type="date"
              required
              className={`${inputClass} [color-scheme:dark]`}
            />
          </Campo>

          <Campo
            id="telefone"
            label="Telefone / WhatsApp"
            icon="phone_iphone"
            error={erro("telefone")}
          >
            <input
              id="telefone"
              name="telefone"
              type="tel"
              required
              inputMode="tel"
              autoComplete="tel"
              placeholder="(11) 98765-4321"
              className={inputClass}
            />
          </Campo>

          <Campo
            id="peso"
            label="Peso atual (kg)"
            icon="monitor_weight"
            error={erro("peso")}
          >
            <input
              id="peso"
              name="peso"
              type="text"
              required
              inputMode="decimal"
              placeholder="78.4"
              className={inputClass}
            />
          </Campo>

          <Campo
            id="altura"
            label="Altura (cm)"
            icon="height"
            error={erro("altura")}
          >
            <input
              id="altura"
              name="altura"
              type="text"
              required
              inputMode="decimal"
              placeholder="170.5"
              className={inputClass}
            />
          </Campo>

          <Campo
            id="plano"
            label="Plano"
            icon="card_membership"
            error={erro("plano")}
            className="lg:col-span-2"
          >
            <select
              id="plano"
              name="plano"
              required
              defaultValue=""
              className={`${inputClass} scheme-dark`}
            >
              <option value="" disabled>
                Selecione o plano
              </option>
              {planosCadastro.map((plano) => (
                <option key={plano.value} value={plano.value}>
                  {plano.label}
                </option>
              ))}
            </select>
          </Campo>

          <div className="flex flex-col gap-space-xs md:col-span-2 lg:col-span-4">
            <label
              className="flex items-center gap-1 font-label-md text-label-md font-semibold text-error uppercase"
              htmlFor="restricoes"
            >
              <span className="material-symbols-outlined text-[16px]">
                medical_services
              </span>
              Restrições médicas
            </label>
            <textarea
              id="restricoes"
              name="restricoes"
              rows={3}
              placeholder="Opcional. Deixe em branco se não houver."
              className="w-full resize-none rounded-lg bg-surface-container p-space-md font-body-md text-body-md text-on-surface transition-colors placeholder:text-on-surface-variant/50 focus:bg-surface-container-high focus:outline-none"
            />
          </div>

          <div className="md:col-span-2 lg:col-span-4">
            <button
              type="submit"
              disabled={pending}
              className="flex h-12 items-center justify-center gap-2 rounded-lg bg-primary-fixed px-space-lg font-label-lg text-label-lg font-bold text-on-primary-fixed shadow-[0_0_12px_rgba(195,244,0,0.2)] transition-transform hover:bg-primary-fixed-dim disabled:cursor-wait disabled:opacity-70"
            >
              <span className="material-symbols-outlined text-[20px]">
                person_add
              </span>
              <span>{pending ? "Salvando..." : "Salvar aluno"}</span>
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
