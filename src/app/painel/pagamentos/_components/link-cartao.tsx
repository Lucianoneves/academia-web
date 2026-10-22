"use client";

import { useState, useTransition, type FormEvent } from "react";
import { rotuloComPreco } from "@/lib/plano-escolha";
import { type FormState } from "@/lib/validacao";
import { iniciarCheckout } from "../_actions/cobrar-cartao";
import type { OpcoesLancamento } from "../tipos";

const initialState: FormState = { success: false };

const inputClass =
  "h-12 w-full rounded-lg bg-surface-container px-space-md font-body-md text-body-md text-on-surface focus:bg-surface-container-high focus:outline-none";

export function FormularioLinkCartao({
  opcoes,
  alunoInicial,
}: {
  opcoes: OpcoesLancamento;
  alunoInicial: string;
}) {
  const [state, setState] = useState(initialState);
  const [pending, startTransition] = useTransition();
  const alunoExiste = opcoes.alunos.some((aluno) => aluno.id === alunoInicial);
  const [alunoId, setAlunoId] = useState(alunoExiste ? alunoInicial : "");
  const [planoId, setPlanoId] = useState("");
  const [copiado, setCopiado] = useState(false);
  const erro = (campo: string) => state.errors?.[campo]?.[0];

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCopiado(false);
    const data = new FormData(event.currentTarget);
    startTransition(async () => {
      setState(await iniciarCheckout(initialState, data));
    });
  }

  async function copiar() {
    if (!state.link) return;
    await navigator.clipboard.writeText(state.link);
    setCopiado(true);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="grid grid-cols-1 gap-space-md md:grid-cols-2"
    >
      <div className="flex flex-col gap-space-xs">
        <label
          className="font-label-md text-label-md font-semibold text-on-surface-variant uppercase"
          htmlFor="aluno-link"
        >
          Aluno
        </label>
        <select
          id="aluno-link"
          name="aluno"
          required
          value={alunoId}
          onChange={(event) => setAlunoId(event.target.value)}
          className={`${inputClass} scheme-dark`}
        >
          <option value="">Selecione o aluno</option>
          {opcoes.alunos.map((aluno) => (
            <option key={aluno.id} value={aluno.id}>
              {aluno.nome}
            </option>
          ))}
        </select>
        {erro("aluno") ? (
          <p className="font-body-sm text-body-sm text-error" role="alert">
            {erro("aluno")}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-space-xs">
        <label
          className="font-label-md text-label-md font-semibold text-on-surface-variant uppercase"
          htmlFor="plano-link"
        >
          Plano
        </label>
        <select
          id="plano-link"
          name="plano"
          required
          value={planoId}
          onChange={(event) => setPlanoId(event.target.value)}
          className={`${inputClass} scheme-dark`}
        >
          <option value="">Selecione o plano</option>
          {opcoes.planos.map((plano) => (
            <option key={plano.id} value={plano.id}>
              {rotuloComPreco(plano.nome, plano.precoCentavos)}
            </option>
          ))}
        </select>
        {erro("plano") ? (
          <p className="font-body-sm text-body-sm text-error" role="alert">
            {erro("plano")}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-space-sm md:col-span-2">
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          O aluno paga no link, sem entrar no sistema. O valor é o preço do
          plano. O link vale 24 horas e não fica guardado nesta tela.
        </p>
        <button
          type="submit"
          disabled={pending || !alunoId || !planoId}
          className="h-12 w-fit rounded-lg bg-primary-fixed px-space-lg font-label-lg text-label-lg font-bold text-on-primary-fixed disabled:opacity-70"
        >
          {pending ? "Gerando..." : "Gerar link"}
        </button>
        {state.message ? (
          <p
            className={
              state.success
                ? "font-body-sm text-body-sm text-secondary-fixed"
                : "font-body-sm text-body-sm text-error"
            }
            role="status"
          >
            {state.message}
          </p>
        ) : null}
        {state.link ? (
          <div className="flex flex-col gap-space-sm sm:flex-row">
            <input
              readOnly
              value={state.link}
              aria-label="Link de pagamento"
              className={inputClass}
            />
            <button
              type="button"
              onClick={copiar}
              className="h-12 rounded-lg bg-surface-container-high px-space-lg font-label-lg text-label-lg font-bold text-on-surface"
            >
              {copiado ? "Copiado" : "Copiar"}
            </button>
          </div>
        ) : null}
      </div>
    </form>
  );
}
