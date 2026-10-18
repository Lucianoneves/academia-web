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
import { centavosParaCampo, formatarReais } from "@/lib/dinheiro";
import { NENHUM_PLANO_A_VENDA, rotuloComPreco } from "@/lib/plano-escolha";
import {
  fieldErrors,
  lancamentoSchema,
  type FieldErrors,
  type FormState,
} from "@/lib/validacao";
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
  const [dinheiro, lancar] = useActionState(lancarPagamento, initialState);
  const [pending, startTransition] = useTransition();
  const alunoExiste = opcoes.alunos.some((aluno) => aluno.id === alunoInicial);
  const [alunoId, setAlunoId] = useState(alunoExiste ? alunoInicial : "");
  const [planoId, setPlanoId] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState(opcoes.hoje);
  const [tocados, setTocados] = useState<Record<string, boolean>>({});
  const parsed = lancamentoSchema.safeParse({
    aluno: alunoId,
    plano: planoId,
    valor,
    data,
  });
  const errosCliente: FieldErrors = parsed.success
    ? {}
    : fieldErrors(parsed.error);
  const erro = (campo: string) =>
    (tocados[campo] ? errosCliente[campo]?.[0] : undefined) ??
    dinheiro.errors?.[campo]?.[0];
  const planoSelecionado = opcoes.planos.find((plano) => plano.id === planoId);

  function tocar(campo: string) {
    setTocados((atual) => ({ ...atual, [campo]: true }));
  }

  useEffect(() => {
    if (!dinheiro.success) return;
    setAlunoId("");
    setPlanoId("");
    setValor("");
    setData(opcoes.hoje);
    setTocados({});
    router.refresh();
  }, [dinheiro, opcoes.hoje, router]);

  function aoMudarPlano(id: string) {
    setPlanoId(id);
    const plano = opcoes.planos.find((item) => item.id === id);
    setValor(plano ? centavosParaCampo(plano.precoCentavos) : "");
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!parsed.success) {
      setTocados({ aluno: true, plano: true, valor: true, data: true });
      return;
    }
    startTransition(() => {
      lancar(new FormData(event.currentTarget));
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
        {NENHUM_PLANO_A_VENDA}
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
          onBlur={() => tocar("aluno")}
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

      <Campo
        id="plano-pagamento"
        label="Plano"
        erro={erro("plano")}
        dica={
          planoSelecionado
            ? `Valor do plano: ${formatarReais(planoSelecionado.precoCentavos)}`
            : undefined
        }
      >
        <select
          id="plano-pagamento"
          name="plano"
          required
          value={planoId}
          onChange={(event) => aoMudarPlano(event.target.value)}
          onBlur={() => tocar("plano")}
          className={`${inputClass} scheme-dark`}
        >
          <option value="">Selecione o plano</option>
          {opcoes.planos.map((plano) => (
            <option key={plano.id} value={plano.id}>
              {rotuloComPreco(plano.nome, plano.precoCentavos)}
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
          onBlur={() => tocar("valor")}
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
          onBlur={() => tocar("data")}
          className={`${inputClass} scheme-dark`}
        />
      </Campo>

      <div className="flex flex-col gap-space-sm md:col-span-2">
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          A forma é dinheiro. O valor sugerido acompanha o plano e pode ser
          ajustado.
        </p>
        <button
          type="submit"
          disabled={pending || !parsed.success}
          className="h-12 w-fit rounded-lg bg-primary-fixed px-space-lg font-label-lg text-label-lg font-bold text-on-primary-fixed disabled:opacity-70"
        >
          {pending ? "Lançando..." : "Confirmar pagamento"}
        </button>
        {dinheiro.message ? (
          <p
            className={
              dinheiro.success
                ? "font-body-sm text-body-sm text-secondary-fixed"
                : "font-body-sm text-body-sm text-error"
            }
            role="status"
          >
            {dinheiro.message}
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
  dica,
  children,
}: {
  id: string;
  label: string;
  erro?: string;
  dica?: string;
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
      {dica ? (
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          {dica}
        </p>
      ) : null}
      {erro ? (
        <p className="font-body-sm text-body-sm text-error" role="alert">
          {erro}
        </p>
      ) : null}
    </div>
  );
}
