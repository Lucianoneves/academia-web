"use client";

import {
  useActionState,
  useEffect,
  useState,
  useTransition,
  type FocusEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import { criarAluno } from "../_actions/criar-aluno";
import {
  dicaPlano,
  escolhasDePlano,
  NENHUM_PLANO_A_VENDA,
  rotuloEscolha,
  type PlanoEscolha,
} from "@/lib/plano-escolha";
import {
  alunoSchema,
  fieldErrors,
  type FieldErrors,
  type FormState,
} from "@/lib/validacao";

const initialState: FormState = { success: false };

const vazio = {
  nome: "",
  nascimento: "",
  telefone: "",
  peso: "",
  altura: "",
  plano: "",
  restricoes: "",
  email: "",
};

function lerFormulario(data: FormData) {
  return {
    nome: String(data.get("nome") ?? ""),
    nascimento: String(data.get("nascimento") ?? ""),
    telefone: String(data.get("telefone") ?? ""),
    peso: String(data.get("peso") ?? ""),
    altura: String(data.get("altura") ?? ""),
    plano: String(data.get("plano") ?? ""),
    restricoes: String(data.get("restricoes") ?? ""),
    email: String(data.get("email") ?? ""),
  };
}

function Campo({
  id,
  label,
  icon,
  error,
  dica,
  children,
  className = "",
}: {
  id: string;
  label: string;
  icon: string;
  error?: string;
  dica?: string | null;
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
      {dica ? (
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          {dica}
        </p>
      ) : null}
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

export function CadastroAluno({
  planos,
  planosErro,
}: {
  planos: PlanoEscolha[];
  planosErro: string | null;
}) {
  const [state, action] = useActionState(criarAluno, initialState);
  const [pending, startTransition] = useTransition();
  const [valores, setValores] = useState(vazio);
  const [tocados, setTocados] = useState<Record<string, boolean>>({});
  const escolhas = escolhasDePlano(planos, null);
  const aviso =
    planosErro ?? (escolhas.length === 0 ? NENHUM_PLANO_A_VENDA : null);
  const parsed = alunoSchema.safeParse(valores);
  const errosCliente: FieldErrors = parsed.success
    ? {}
    : fieldErrors(parsed.error);
  const erro = (campo: string) =>
    (tocados[campo] ? errosCliente[campo]?.[0] : undefined) ??
    state.errors?.[campo]?.[0];
  const planoAtual = escolhas.find((plano) => plano.kind === valores.plano);

  useEffect(() => {
    if (state.success) {
      setValores(vazio);
      setTocados({});
    }
  }, [state.stamp, state.success]);

  function alterar(campo: keyof typeof vazio, valor: string) {
    setValores((atual) => ({ ...atual, [campo]: valor }));
  }

  function aoBlur(event: FocusEvent<HTMLFormElement>) {
    const campo = (event.target as unknown as { name?: string }).name;
    if (!campo) return;
    setTocados((atual) => ({ ...atual, [campo]: true }));
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const lido = lerFormulario(data);
    setValores(lido);
    if (!alunoSchema.safeParse(lido).success || aviso) {
      setTocados({
        nome: true,
        nascimento: true,
        telefone: true,
        peso: true,
        altura: true,
        plano: true,
        email: true,
      });
      return;
    }
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
            Nome, nascimento, telefone, e-mail, peso, altura, plano e restrições
            médicas. O e-mail pode ficar vazio.
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
          onSubmit={onSubmit}
          onBlur={aoBlur}
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
              value={valores.nome}
              onChange={(event) => alterar("nome", event.target.value)}
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
              value={valores.nascimento}
              onChange={(event) => alterar("nascimento", event.target.value)}
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
              maxLength={13}
              value={valores.telefone}
              onChange={(event) => alterar("telefone", event.target.value)}
              placeholder="11 98765-4321"
              className={inputClass}
            />
          </Campo>

          <Campo
            id="email"
            label="E-mail"
            icon="mail"
            error={erro("email")}
            className="lg:col-span-2"
          >
            <input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={valores.email}
              onChange={(event) => alterar("email", event.target.value)}
              placeholder="Opcional"
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
              value={valores.peso}
              onChange={(event) => alterar("peso", event.target.value)}
              placeholder="78.4"
              className={inputClass}
            />
          </Campo>

          <Campo
            id="altura"
            label="Altura (m)"
            icon="height"
            error={erro("altura")}
          >
            <input
              id="altura"
              name="altura"
              type="text"
              required
              inputMode="decimal"
              value={valores.altura}
              onChange={(event) => alterar("altura", event.target.value)}
              placeholder="1.60"
              className={inputClass}
            />
          </Campo>

          {aviso ? (
            <div className="flex flex-col gap-space-xs lg:col-span-2">
              <p className="font-label-md text-label-md font-semibold text-on-surface-variant uppercase">
                Plano
              </p>
              <p className="font-body-md text-body-md text-error" role="alert">
                {aviso}
              </p>
            </div>
          ) : (
            <Campo
              id="plano"
              label="Plano"
              icon="card_membership"
              error={erro("plano")}
              dica={dicaPlano(planoAtual)}
              className="lg:col-span-2"
            >
              <select
                id="plano"
                name="plano"
                required
                value={valores.plano}
                onChange={(event) => alterar("plano", event.target.value)}
                className={`${inputClass} scheme-dark`}
              >
                <option value="" disabled>
                  Selecione o plano
                </option>
                {escolhas.map((plano) => (
                  <option key={plano.kind} value={plano.kind}>
                    {rotuloEscolha(plano)}
                  </option>
                ))}
              </select>
            </Campo>
          )}

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
              value={valores.restricoes}
              onChange={(event) => alterar("restricoes", event.target.value)}
              placeholder="Opcional. Deixe em branco se não houver."
              className="w-full resize-none rounded-lg bg-surface-container p-space-md font-body-md text-body-md text-on-surface transition-colors placeholder:text-on-surface-variant/50 focus:bg-surface-container-high focus:outline-none"
            />
          </div>

          <div className="md:col-span-2 lg:col-span-4">
            <button
              type="submit"
              disabled={pending || Boolean(aviso) || !parsed.success}
              className="flex h-12 items-center justify-center gap-2 rounded-lg bg-primary-fixed px-space-lg font-label-lg text-label-lg font-bold text-on-primary-fixed shadow-[0_0_12px_rgba(195,244,0,0.2)] transition-transform hover:bg-primary-fixed-dim disabled:cursor-not-allowed disabled:opacity-70"
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
