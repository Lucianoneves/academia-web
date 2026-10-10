"use client";

import { useRouter } from "next/navigation";
import {
  useActionState,
  useEffect,
  useState,
  useTransition,
  type FormEvent,
  type ReactNode,
} from "react";
import { centavosParaCampo } from "@/lib/dinheiro";
import { type FormState } from "@/lib/validacao";
import { lancarPagamento } from "../_actions/lancar-pagamento";
import type { OpcoesLancamento } from "../tipos";

const initialState: FormState = { success: false };

const inputClass =
  "h-12 w-full rounded-lg bg-surface-container px-space-md font-body-md text-body-md text-on-surface focus:bg-surface-container-high focus:outline-none";

export function FormularioLancamento({
  opcoes,
  alunoInicial,
}: {
  opcoes: OpcoesLancamento;
  alunoInicial: string;
}) {
  const router = useRouter();
  const [state, action] = useActionState(lancarPagamento, initialState);
  const [pending, startTransition] = useTransition();
  const alunoExiste = opcoes.alunos.some((aluno) => aluno.id === alunoInicial);
  const [alunoId, setAlunoId] = useState(alunoExiste ? alunoInicial : "");
  const [planoId, setPlanoId] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState(opcoes.hoje);
  const erro = (campo: string) => state.errors?.[campo]?.[0];

  useEffect(() => {
    if (!state.success) return;
    setAlunoId("");
    setPlanoId("");
    setValor("");
    setData(opcoes.hoje);
    router.refresh();
  }, [opcoes.hoje, router, state]);

  function aoMudarPlano(id: string) {
    setPlanoId(id);
    const plano = opcoes.planos.find((item) => item.id === id);
    setValor(plano ? centavosParaCampo(plano.precoCentavos) : "");
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const dados = new FormData(event.currentTarget);
    startTransition(() => {
      action(dados);
    });
  }

  if (opcoes.alunos.length === 0) {
    return (
      <p className="font-body-md text-body-md text-on-surface-variant">
        Nenhum aluno ativo. Inclua um aluno antes de lançar um pagamento.
      </p>
    );
  }

  if (opcoes.planos.length === 0) {
    return (
      <p className="font-body-md text-body-md text-on-surface-variant">
        Nenhum plano à venda. Ative um plano com preço maior que zero.
      </p>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="grid grid-cols-1 gap-space-md md:grid-cols-2"
    >
      <Campo id="aluno" label="Aluno" erro={erro("aluno")}>
        <select
          id="aluno"
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
      </Campo>

      <Campo id="plano-pagamento" label="Plano" erro={erro("plano")}>
        <select
          id="plano-pagamento"
          name="plano"
          required
          value={planoId}
          onChange={(event) => aoMudarPlano(event.target.value)}
          className={`${inputClass} scheme-dark`}
        >
          <option value="">Selecione o plano</option>
          {opcoes.planos.map((plano) => (
            <option key={plano.id} value={plano.id}>
              {plano.nome}
            </option>
          ))}
        </select>
      </Campo>

      <Campo id="valor" label="Valor" erro={erro("valor")}>
        <input
          id="valor"
          name="valor"
          inputMode="decimal"
          required
          value={valor}
          onChange={(event) => setValor(event.target.value)}
          placeholder="0,00"
          className={inputClass}
        />
      </Campo>

      <Campo id="data" label="Data" erro={erro("data")}>
        <input
          id="data"
          name="data"
          type="date"
          required
          max={opcoes.hoje}
          value={data}
          onChange={(event) => setData(event.target.value)}
          className={`${inputClass} scheme-dark`}
        />
      </Campo>

      <div className="flex flex-col gap-space-sm md:col-span-2">
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Forma: dinheiro. O valor sugerido acompanha o plano e pode ser
          ajustado.
        </p>
        <button
          type="submit"
          disabled={pending}
          className="h-12 w-fit rounded-lg bg-primary-fixed px-space-lg font-label-lg text-label-lg font-bold text-on-primary-fixed disabled:opacity-70"
        >
          {pending ? "Lançando..." : "Confirmar pagamento"}
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
      </div>
    </form>
  );
}

function Campo({
  id,
  label,
  erro,
  children,
}: {
  id: string;
  label: string;
  erro?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-space-xs">
      <label
        className="font-label-md text-label-md font-semibold text-on-surface-variant uppercase"
        htmlFor={id}
      >
        {label}
      </label>
      {children}
      {erro ? (
        <p className="font-body-sm text-body-sm text-error" role="alert">
          {erro}
        </p>
      ) : null}
    </div>
  );
}
