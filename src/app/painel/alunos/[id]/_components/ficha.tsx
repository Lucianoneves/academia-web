"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useActionState,
  useEffect,
  useState,
  useTransition,
  type FormEvent,
  type ReactNode,
} from "react";
import { alterarSituacao, atualizarAluno } from "../_actions/atualizar-aluno";
import { HistoricoPagamento } from "@/components/painel/historico-pagamento";
import type { PagamentoAluno } from "@/app/painel/pagamentos/tipos";
import type { AlunoFicha } from "../../tipos";
import { planosCadastro, type FormState } from "@/lib/validacao";

const initialState: FormState = { success: false };

const inputClass =
  "h-12 w-full rounded-lg bg-surface-container pr-space-md pl-10 font-body-md text-body-md text-on-surface transition-colors placeholder:text-on-surface-variant/50 focus:bg-surface-container-high focus:text-primary-fixed focus:outline-none";

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

export function FichaAluno({
  aluno,
  pagamento,
}: {
  aluno: AlunoFicha;
  pagamento: PagamentoAluno | null;
}) {
  const router = useRouter();
  const salvar = atualizarAluno.bind(null, aluno.id);
  const [state, action] = useActionState(salvar, initialState);
  const [pending, startTransition] = useTransition();
  const [confirmar, setConfirmar] = useState(false);
  const [situacao, setSituacao] = useState<FormState>(initialState);
  const [situacaoPendente, iniciarSituacao] = useTransition();
  const erro = (campo: string) => state.errors?.[campo]?.[0];

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

  function mudarSituacao(ativar: boolean) {
    iniciarSituacao(async () => {
      const resultado = await alterarSituacao(aluno.id, ativar);
      setSituacao(resultado);
      setConfirmar(false);
      if (resultado.success) router.refresh();
    });
  }

  return (
    <div className="flex w-full flex-col gap-space-lg p-space-lg">
      <div className="flex flex-col gap-space-sm">
        <Link
          href="/painel/alunos"
          className="font-label-md text-label-md text-primary-fixed"
        >
          Voltar para alunos
        </Link>
        <div className="flex flex-wrap items-center gap-space-sm">
          <h1 className="font-headline-lg text-headline-lg tracking-tight text-on-surface">
            {aluno.nome}
          </h1>
          <span
            className={
              aluno.ativo
                ? "rounded-full bg-secondary-fixed/15 px-space-sm py-0.5 font-label-sm text-label-sm font-bold text-secondary-fixed uppercase"
                : "rounded-full bg-surface-container-high px-space-sm py-0.5 font-label-sm text-label-sm font-bold text-on-surface-variant uppercase"
            }
          >
            {aluno.ativo ? "Ativo" : "Inativo"}
          </span>
        </div>
      </div>

      <section className="flex flex-col gap-space-lg rounded-xl bg-surface-container-low p-space-lg">
        <div>
          <h2 className="font-headline-lg text-headline-lg tracking-tight text-on-surface">
            Dados cadastrais e físicos
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Altura e plano vazios continuam como não informado. Restrições em
            branco contam como nenhuma.
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
              defaultValue={aluno.nome}
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
              defaultValue={aluno.nascimento}
              className={`${inputClass} scheme-dark`}
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
              defaultValue={aluno.telefone}
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
              defaultValue={String(aluno.peso)}
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
              inputMode="decimal"
              placeholder="Não informado"
              defaultValue={aluno.altura === null ? "" : String(aluno.altura)}
              className={inputClass}
            />
          </Campo>
          <Campo
            id="plano"
            label="Plano escolhido"
            icon="card_membership"
            error={erro("plano")}
            className="lg:col-span-2"
          >
            <select
              id="plano"
              name="plano"
              defaultValue={aluno.plano ?? ""}
              className={`${inputClass} scheme-dark`}
            >
              <option value="">Não informado</option>
              {planosCadastro.map((plano) => (
                <option key={plano.value} value={plano.value}>
                  {plano.label}
                </option>
              ))}
            </select>
          </Campo>
          <div className="flex flex-col gap-space-xs md:col-span-2 lg:col-span-4">
            <label
              className="font-label-md text-label-md font-semibold text-error uppercase"
              htmlFor="restricoes"
            >
              Restrições médicas
            </label>
            <textarea
              id="restricoes"
              name="restricoes"
              rows={3}
              defaultValue={aluno.restricoes ?? ""}
              placeholder="Nenhuma"
              className="w-full resize-none rounded-lg bg-surface-container p-space-md font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:bg-surface-container-high focus:outline-none"
            />
            {aluno.restricoes ? null : (
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Nenhuma restrição informada.
              </p>
            )}
          </div>
          <div className="md:col-span-2 lg:col-span-4">
            <button
              type="submit"
              disabled={pending}
              className="flex h-12 items-center justify-center gap-2 rounded-lg bg-primary-fixed px-space-lg font-label-lg text-label-lg font-bold text-on-primary-fixed disabled:opacity-70"
            >
              {pending ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        </form>
      </section>

      <section className="flex flex-col gap-space-md rounded-xl bg-surface-container-low p-space-lg">
        <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
          Situação cadastral
        </h2>
        {situacao.message ? (
          <p
            className={
              situacao.success
                ? "font-body-md text-body-md text-secondary-fixed"
                : "font-body-md text-body-md text-error"
            }
            role="status"
          >
            {situacao.message}
          </p>
        ) : null}
        {aluno.ativo ? (
          confirmar ? (
            <div className="flex flex-col gap-space-sm">
              <p className="font-body-md text-body-md text-on-surface">
                Inativar tira {aluno.nome} da lista padrão. A ficha continua no
                filtro de inativos.
              </p>
              <div className="flex flex-wrap gap-space-sm">
                <button
                  type="button"
                  disabled={situacaoPendente}
                  onClick={() => mudarSituacao(false)}
                  className="h-12 rounded-lg bg-error-container px-space-lg font-label-lg text-label-lg font-bold text-on-error-container disabled:opacity-70"
                >
                  {situacaoPendente ? "Inativando..." : "Confirmar inativação"}
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
          ) : (
            <button
              type="button"
              onClick={() => setConfirmar(true)}
              className="h-12 w-fit rounded-lg bg-surface-container px-space-lg font-label-lg text-label-lg text-error"
            >
              Inativar aluno
            </button>
          )
        ) : (
          <button
            type="button"
            disabled={situacaoPendente}
            onClick={() => mudarSituacao(true)}
            className="h-12 w-fit rounded-lg bg-secondary-fixed px-space-lg font-label-lg text-label-lg font-bold text-on-secondary-fixed disabled:opacity-70"
          >
            {situacaoPendente ? "Reativando..." : "Reativar aluno"}
          </button>
        )}
      </section>

      <div className="flex flex-col gap-space-md">
        <HistoricoPagamento
          alunoId={aluno.id}
          ativo={aluno.ativo}
          pagamento={pagamento}
          tentarDeNovo={`/painel/alunos/${aluno.id}`}
        />
        <div className="grid grid-cols-1 gap-space-md lg:grid-cols-2">
          <BlocoFuturo titulo="Agenda" />
          <BlocoFuturo titulo="Avaliação" />
        </div>
      </div>
    </div>
  );
}

function BlocoFuturo({ titulo }: { titulo: string }) {
  return (
    <section className="rounded-xl bg-surface-container-low p-space-lg">
      <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
        {titulo}
      </h2>
      <p className="mt-space-sm font-body-md text-body-md text-on-surface-variant">
        Ainda não há registros.
      </p>
    </section>
  );
}
