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
import { iniciarCheckout } from "../_actions/cobrar-cartao";
import { lancarPagamento } from "../_actions/lancar-pagamento";
import type { OpcoesLancamento } from "../tipos";

const AVISO_TESTE =
  "Cobrança no cartão disponível só com a chave de teste da Stripe.";

const initialState: FormState = { success: false };

const inputClass =
  "h-12 w-full rounded-lg bg-surface-container px-space-md font-body-md text-body-md text-on-surface focus:bg-surface-container-high focus:outline-none";

export function FormularioLancamento({
  opcoes,
  alunoInicial,
  cartaoDisponivel,
}: {
  opcoes: OpcoesLancamento;
  alunoInicial: string;
  cartaoDisponivel: boolean;
}) {
  const router = useRouter();
  const [dinheiro, lancar] = useActionState(lancarPagamento, initialState);
  const [cartao, cobrar] = useActionState(iniciarCheckout, initialState);
  const [pending, startTransition] = useTransition();
  const alunoExiste = opcoes.alunos.some((aluno) => aluno.id === alunoInicial);
  const [alunoId, setAlunoId] = useState(alunoExiste ? alunoInicial : "");
  const [planoId, setPlanoId] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState(opcoes.hoje);
  const [forma, setForma] = useState<"dinheiro" | "cartao">("dinheiro");
  const [tocados, setTocados] = useState<Record<string, boolean>>({});
  const noCartao = forma === "cartao";
  const parsed = lancamentoSchema.safeParse({
    aluno: alunoId,
    plano: planoId,
    valor,
    data,
  });
  const errosCliente: FieldErrors = parsed.success
    ? {}
    : fieldErrors(parsed.error);
  const state = noCartao ? cartao : dinheiro;
  const erro = (campo: string) => {
    if (noCartao && (campo === "valor" || campo === "data")) return undefined;
    return (
      (tocados[campo] ? errosCliente[campo]?.[0] : undefined) ??
      state.errors?.[campo]?.[0]
    );
  };
  const planoSelecionado = opcoes.planos.find((plano) => plano.id === planoId);
  const valido = noCartao
    ? Boolean(alunoId && planoId) && cartaoDisponivel
    : parsed.success;

  function tocar(campo: string) {
    setTocados((atual) => ({ ...atual, [campo]: true }));
  }

  useEffect(() => {
    if (cartao.redirect) {
      window.location.assign(cartao.redirect);
      return;
    }
    if (!dinheiro.success) return;
    setAlunoId("");
    setPlanoId("");
    setValor("");
    setData(opcoes.hoje);
    setTocados({});
    router.refresh();
  }, [cartao.redirect, dinheiro, opcoes.hoje, router]);

  function aoMudarPlano(id: string) {
    setPlanoId(id);
    const plano = opcoes.planos.find((item) => item.id === id);
    setValor(plano ? centavosParaCampo(plano.precoCentavos) : "");
  }

  function escolherForma(proxima: "dinheiro" | "cartao") {
    setForma(proxima);
    if (proxima === "cartao" && planoSelecionado) {
      setValor(centavosParaCampo(planoSelecionado.precoCentavos));
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (noCartao) {
      if (!cartaoDisponivel || !alunoId || !planoId) {
        setTocados({ aluno: true, plano: true });
        return;
      }
      startTransition(() => {
        cobrar(new FormData(event.currentTarget));
      });
      return;
    }
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
      <div className="flex flex-wrap gap-space-sm md:col-span-2">
        <button
          type="button"
          aria-pressed={forma === "dinheiro"}
          onClick={() => escolherForma("dinheiro")}
          className={
            forma === "dinheiro"
              ? "h-12 rounded-lg bg-primary-fixed px-space-lg font-label-lg text-label-lg font-bold text-on-primary-fixed"
              : "h-12 rounded-lg bg-surface-container px-space-lg font-label-lg text-label-lg text-on-surface"
          }
        >
          Dinheiro
        </button>
        <button
          type="button"
          aria-pressed={forma === "cartao"}
          onClick={() => escolherForma("cartao")}
          className={
            forma === "cartao"
              ? "h-12 rounded-lg bg-primary-fixed px-space-lg font-label-lg text-label-lg font-bold text-on-primary-fixed"
              : "h-12 rounded-lg bg-surface-container px-space-lg font-label-lg text-label-lg text-on-surface"
          }
        >
          Cartão
        </button>
      </div>

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
          readOnly={noCartao}
          onChange={(event) => {
            if (!noCartao) setValor(event.target.value);
          }}
          onBlur={() => tocar("valor")}
          placeholder="0,00"
          className={inputClass}
        />
      </Campo>

      {noCartao ? null : (
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
      )}

      <div className="flex flex-col gap-space-sm md:col-span-2">
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          {noCartao
            ? "No cartão o valor fica no preço do plano. A linha aparece quando a Stripe confirmar."
            : "No dinheiro o valor sugerido acompanha o plano e pode ser ajustado."}
        </p>
        {noCartao && !cartaoDisponivel ? (
          <p className="font-body-sm text-body-sm text-error" role="alert">
            {AVISO_TESTE}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending || !valido}
          className="h-12 w-fit rounded-lg bg-primary-fixed px-space-lg font-label-lg text-label-lg font-bold text-on-primary-fixed disabled:opacity-70"
        >
          {pending
            ? noCartao
              ? "Abrindo..."
              : "Lançando..."
            : noCartao
              ? "Cobrar no cartão"
              : "Confirmar pagamento"}
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
