"use client";

import { useRouter } from "next/navigation";
import {
  useActionState,
  useEffect,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import { centavosParaCampo, formatarReais } from "@/lib/dinheiro";
import { type FormState } from "@/lib/validacao";
import {
  alterarDisponibilidade,
  salvarPreco,
} from "../_actions/atualizar-plano";
import type { PlanoPainel } from "../tipos";

const initialState: FormState = { success: false };

function situacaoPlano(plano: PlanoPainel) {
  if (!plano.ativo) return "Inativo";
  if (plano.precoCentavos <= 0) return "Ainda não está à venda";
  return "À venda";
}

function FormularioPreco({ plano }: { plano: PlanoPainel }) {
  const router = useRouter();
  const [state, action] = useActionState(salvarPreco, initialState);
  const [pending, startTransition] = useTransition();
  const erro = state.errors?.preco?.[0];

  useEffect(() => {
    if (state.success) router.refresh();
  }, [router, state]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(() => {
      action(data);
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-space-sm">
      <input type="hidden" name="id" value={plano.id} />
      <label
        className="font-label-md text-label-md font-semibold text-on-surface-variant uppercase"
        htmlFor={`preco-${plano.id}`}
      >
        Preço
      </label>
      <div className="flex flex-col gap-space-sm sm:flex-row">
        <input
          id={`preco-${plano.id}`}
          name="preco"
          inputMode="decimal"
          required
          defaultValue={centavosParaCampo(plano.precoCentavos)}
          className="h-12 w-full rounded-lg bg-surface-container px-space-md font-body-md text-body-md text-on-surface focus:bg-surface-container-high focus:outline-none sm:max-w-48"
        />
        <button
          type="submit"
          disabled={pending}
          className="h-12 rounded-lg bg-primary-fixed px-space-lg font-label-lg text-label-lg font-bold text-on-primary-fixed disabled:opacity-70"
        >
          {pending ? "Salvando..." : "Salvar preço"}
        </button>
      </div>
      {erro ? (
        <p className="font-body-sm text-body-sm text-error" role="alert">
          {erro}
        </p>
      ) : null}
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
    </form>
  );
}

function BotaoDisponibilidade({ plano }: { plano: PlanoPainel }) {
  const router = useRouter();
  const [confirmar, setConfirmar] = useState(false);
  const [pending, startTransition] = useTransition();
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  function mudar(ativo: boolean) {
    startTransition(async () => {
      const resultado = await alterarDisponibilidade(plano.id, ativo);
      setOk(resultado.success);
      setMensagem(resultado.message ?? null);
      setConfirmar(false);
      if (resultado.success) router.refresh();
    });
  }

  if (!plano.ativo) {
    return (
      <div className="flex flex-col items-start gap-space-xs">
        <button
          type="button"
          disabled={pending}
          onClick={() => mudar(true)}
          className="h-12 rounded-lg bg-secondary-fixed px-space-lg font-label-lg text-label-lg font-bold text-on-secondary-fixed disabled:opacity-70"
        >
          {pending ? "Ativando..." : "Ativar"}
        </button>
        {mensagem ? (
          <p
            className={
              ok
                ? "font-body-sm text-body-sm text-secondary-fixed"
                : "font-body-sm text-body-sm text-error"
            }
            role="status"
          >
            {mensagem}
          </p>
        ) : null}
      </div>
    );
  }

  if (confirmar) {
    return (
      <div className="flex flex-col items-start gap-space-sm">
        <p className="max-w-xs font-body-sm text-body-sm text-on-surface-variant">
          Este plano sai das vendas novas. O histórico de pagamento continua.
        </p>
        <div className="flex flex-wrap gap-space-sm">
          <button
            type="button"
            disabled={pending}
            onClick={() => mudar(false)}
            className="h-12 rounded-lg bg-error-container px-space-lg font-label-lg text-label-lg font-bold text-on-error-container disabled:opacity-70"
          >
            {pending ? "Inativando..." : "Confirmar"}
          </button>
          <button
            type="button"
            onClick={() => setConfirmar(false)}
            className="h-12 rounded-lg bg-surface-container px-space-lg font-label-lg text-label-lg text-on-surface"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirmar(true)}
      className="h-12 rounded-lg bg-surface-container px-space-lg font-label-lg text-label-lg text-error"
    >
      Inativar
    </button>
  );
}

export function ListaPlanos({ planos }: { planos: PlanoPainel[] }) {
  return (
    <ul className="grid grid-cols-1 gap-space-md">
      {planos.map((plano) => (
        <li
          key={`${plano.id}-${plano.precoCentavos}-${plano.ativo}`}
          className="flex flex-col gap-space-lg rounded-xl bg-surface-container-low p-space-lg"
        >
          <div className="flex flex-col justify-between gap-space-md sm:flex-row sm:items-start">
            <div>
              <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                {plano.nome}
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                {plano.duracao}
              </p>
              <p className="mt-space-xs font-label-md text-label-md text-primary-fixed">
                {formatarReais(plano.precoCentavos)} · {situacaoPlano(plano)}
              </p>
            </div>
            <BotaoDisponibilidade plano={plano} />
          </div>
          <FormularioPreco plano={plano} />
        </li>
      ))}
    </ul>
  );
}
