"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useActionState,
  useEffect,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import { registrarAvaliacao } from "../_actions/registrar-avaliacao";
import {
  limparMarcacaoAvaliacao,
  marcarAvaliacao,
} from "../_actions/marcar-avaliacao";
import type { AvaliacaoFicha } from "@/app/painel/avaliacoes/_data-access/avaliacoes";
import type { SituacaoAvaliacao } from "@/lib/avaliacao";
import { formatarDataIso } from "@/lib/pagamento-situacao";
import { type FormState } from "@/lib/validacao";

const initialState: FormState = { success: false };

const pill: Record<SituacaoAvaliacao, string> = {
  em_dia: "bg-secondary-fixed/15 text-secondary-fixed",
  a_vencer: "bg-primary-fixed/15 text-primary-fixed",
  vencida: "bg-error-container/40 text-error",
  sem_avaliacao: "bg-surface-container-high text-on-surface-variant",
};

const inputClass =
  "h-12 w-full rounded-lg bg-surface-container px-space-md font-body-md text-body-md text-on-surface focus:bg-surface-container-high focus:outline-none";

export function AvaliacaoAluno({
  alunoId,
  avaliacao,
  erro,
  hoje,
  tentarDeNovo,
}: {
  alunoId: string;
  avaliacao: AvaliacaoFicha | null;
  erro: string | null;
  hoje: string;
  tentarDeNovo: string;
}) {
  const router = useRouter();
  const registrar = registrarAvaliacao.bind(null, alunoId);
  const marcar = marcarAvaliacao.bind(null, alunoId);
  const limpar = limparMarcacaoAvaliacao.bind(null, alunoId);
  const [state, action] = useActionState(registrar, initialState);
  const [marcaState, marcaAction] = useActionState(marcar, initialState);
  const [limpaState, limpaAction] = useActionState(limpar, initialState);
  const [pending, startTransition] = useTransition();
  const [marcaPending, startMarca] = useTransition();
  const [limpaPending, startLimpa] = useTransition();
  const [data, setData] = useState(hoje);
  const [observacoes, setObservacoes] = useState("");
  const marcacao = avaliacao?.marcacao ?? null;
  const [dia, setDia] = useState(marcacao?.dia ?? hoje);
  const [hora, setHora] = useState(marcacao?.hora ?? "");

  useEffect(() => {
    if (!state.success) return;
    setData(hoje);
    setObservacoes("");
    router.refresh();
  }, [hoje, router, state]);

  useEffect(() => {
    setDia(marcacao?.dia ?? hoje);
    setHora(marcacao?.hora ?? "");
  }, [hoje, marcacao?.dia, marcacao?.hora]);

  useEffect(() => {
    if (!marcaState.success && !limpaState.success) return;
    router.refresh();
  }, [limpaState, marcaState, router]);

  function onMarcar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const dados = new FormData(event.currentTarget);
    startMarca(() => {
      marcaAction(dados);
    });
  }

  function onLimpar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const dados = new FormData(event.currentTarget);
    startLimpa(() => {
      limpaAction(dados);
    });
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const dados = new FormData(event.currentTarget);
    startTransition(() => {
      action(dados);
    });
  }

  return (
    <section className="rounded-xl bg-surface-container-low p-space-lg">
      <div className="flex flex-wrap items-center gap-space-sm">
        <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
          Avaliação
        </h2>
        {avaliacao ? (
          <span
            className={`rounded-full px-space-sm py-0.5 font-label-sm text-label-sm font-bold uppercase ${pill[avaliacao.situacao]}`}
          >
            {avaliacao.rotulo}
          </span>
        ) : null}
      </div>
      {avaliacao?.validade ? (
        <p className="mt-space-xs font-body-sm text-body-sm text-on-surface-variant">
          Válida até {avaliacao.validade}.
        </p>
      ) : null}

      <form
        onSubmit={onMarcar}
        className="mt-space-md flex flex-col gap-space-md"
      >
        <h3 className="font-label-lg text-label-lg font-bold text-on-surface">
          Marcação
        </h3>
        {marcacao ? (
          <p className="font-body-md text-body-md text-on-surface">
            Marcada para {formatarDataIso(marcacao.dia)} às {marcacao.hora}.
          </p>
        ) : (
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            O dia e a hora só avisam. A situação não muda.
          </p>
        )}
        <div className="grid gap-space-md sm:grid-cols-2">
          <div className="flex flex-col gap-space-xs">
            <label
              className="font-label-md text-label-md font-semibold text-on-surface-variant uppercase"
              htmlFor="marcacao-dia"
            >
              Dia
            </label>
            <input
              id="marcacao-dia"
              name="dia"
              type="date"
              required
              min={hoje}
              value={dia}
              onChange={(event) => setDia(event.target.value)}
              className={`${inputClass} scheme-dark`}
            />
            {marcaState.errors?.dia?.[0] ? (
              <p className="font-body-sm text-body-sm text-error" role="alert">
                {marcaState.errors.dia[0]}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-space-xs">
            <label
              className="font-label-md text-label-md font-semibold text-on-surface-variant uppercase"
              htmlFor="marcacao-hora"
            >
              Hora
            </label>
            <input
              id="marcacao-hora"
              name="hora"
              type="time"
              required
              value={hora}
              onChange={(event) => setHora(event.target.value)}
              className={`${inputClass} scheme-dark`}
            />
            {marcaState.errors?.hora?.[0] ? (
              <p className="font-body-sm text-body-sm text-error" role="alert">
                {marcaState.errors.hora[0]}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-space-sm">
          <button
            type="submit"
            disabled={marcaPending}
            className="h-12 w-fit rounded-lg bg-primary-fixed px-space-lg font-label-lg text-label-lg font-bold text-on-primary-fixed disabled:opacity-70"
          >
            {marcaPending ? "Marcando..." : "Marcar"}
          </button>
        </div>
        {marcaState.message ? (
          <p
            className={
              marcaState.success
                ? "font-body-sm text-body-sm text-secondary-fixed"
                : "font-body-sm text-body-sm text-error"
            }
            role="status"
          >
            {marcaState.message}
          </p>
        ) : null}
      </form>

      {marcacao ? (
        <form onSubmit={onLimpar} className="mt-space-sm">
          <button
            type="submit"
            disabled={limpaPending}
            className="h-12 w-fit rounded-lg bg-surface-container px-space-lg font-label-lg text-label-lg font-bold text-on-surface disabled:opacity-70"
          >
            {limpaPending ? "Limpando..." : "Limpar marcação"}
          </button>
          {limpaState.message ? (
            <p
              className={
                limpaState.success
                  ? "mt-space-xs font-body-sm text-body-sm text-secondary-fixed"
                  : "mt-space-xs font-body-sm text-body-sm text-error"
              }
              role="status"
            >
              {limpaState.message}
            </p>
          ) : null}
        </form>
      ) : null}

      {erro ? (
        <div className="mt-space-sm">
          <p className="font-body-md text-body-md text-error" role="alert">
            {erro}
          </p>
          <Link
            href={tentarDeNovo}
            className="mt-space-sm inline-flex font-label-md text-label-md text-primary-fixed"
          >
            Tentar de novo
          </Link>
        </div>
      ) : null}

      <form
        onSubmit={onSubmit}
        className="mt-space-md flex flex-col gap-space-md"
      >
        <div className="flex flex-col gap-space-xs">
          <label
            className="font-label-md text-label-md font-semibold text-on-surface-variant uppercase"
            htmlFor="avaliacao-data"
          >
            Data da avaliação
          </label>
          <input
            id="avaliacao-data"
            name="data"
            type="date"
            required
            max={hoje}
            value={data}
            onChange={(event) => setData(event.target.value)}
            className={`${inputClass} scheme-dark`}
          />
          {state.errors?.data?.[0] ? (
            <p className="font-body-sm text-body-sm text-error" role="alert">
              {state.errors.data[0]}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-space-xs">
          <label
            className="font-label-md text-label-md font-semibold text-on-surface-variant uppercase"
            htmlFor="avaliacao-observacoes"
          >
            Observações
          </label>
          <textarea
            id="avaliacao-observacoes"
            name="observacoes"
            rows={3}
            value={observacoes}
            onChange={(event) => setObservacoes(event.target.value)}
            className="w-full resize-none rounded-lg bg-surface-container p-space-md font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:bg-surface-container-high focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="h-12 w-fit rounded-lg bg-primary-fixed px-space-lg font-label-lg text-label-lg font-bold text-on-primary-fixed disabled:opacity-70"
        >
          {pending ? "Registrando..." : "Registrar avaliação"}
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
      </form>

      {avaliacao && avaliacao.historico.length === 0 ? (
        <p className="mt-space-md font-body-md text-body-md text-on-surface-variant">
          Ainda não há registros.
        </p>
      ) : null}

      {avaliacao && avaliacao.historico.length > 0 ? (
        <ul className="mt-space-md flex flex-col gap-space-sm">
          {avaliacao.historico.map((registro) => (
            <li
              key={registro.id}
              className="flex flex-col gap-space-xs rounded-lg bg-surface-container px-space-md py-space-sm"
            >
              <span className="font-body-md text-body-md text-on-surface">
                {registro.quando} · válida até {registro.validade}
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                {registro.observacoes ?? "Sem observações."}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
