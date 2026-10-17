"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useActionState,
  useEffect,
  useState,
  useTransition,
  type FocusEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import { alterarSituacao, atualizarAluno } from "../_actions/atualizar-aluno";
import { HistoricoPagamento } from "@/components/painel/historico-pagamento";
import type { AvaliacaoFicha } from "@/app/painel/avaliacoes/_data-access/avaliacoes";
import type { PagamentoAluno } from "@/app/painel/pagamentos/tipos";
import type { MarcacaoFicha } from "@/app/painel/agenda/_data-access/agenda";
import type { AlunoFicha } from "../../tipos";
import { AvaliacaoAluno } from "./avaliacao";
import {
  alunoEdicaoSchema,
  fieldErrors,
  formatarAltura,
  type FieldErrors,
  type FormState,
} from "@/lib/validacao";
import {
  dicaPlano,
  escolhasDePlano,
  rotuloEscolha,
  type PlanoEscolha,
} from "@/lib/plano-escolha";

const initialState: FormState = { success: false };

const inputClass =
  "h-12 w-full rounded-lg bg-surface-container pr-space-md pl-10 font-body-md text-body-md text-on-surface transition-colors placeholder:text-on-surface-variant/50 focus:bg-surface-container-high focus:text-primary-fixed focus:outline-none";

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

export function FichaAluno({
  aluno,
  pagamento,
  marcacoes,
  agendaErro,
  avaliacao,
  avaliacaoErro,
  hoje,
  volta,
  tentarDeNovo,
  planos,
  planosErro,
}: {
  aluno: AlunoFicha;
  pagamento: PagamentoAluno | null;
  marcacoes: MarcacaoFicha[];
  agendaErro: string | null;
  avaliacao: AvaliacaoFicha | null;
  avaliacaoErro: string | null;
  hoje: string;
  volta: { href: string; rotulo: string };
  tentarDeNovo: string;
  planos: PlanoEscolha[];
  planosErro: string | null;
}) {
  const router = useRouter();
  const salvar = atualizarAluno.bind(null, aluno.id);
  const [state, action] = useActionState(salvar, initialState);
  const [pending, startTransition] = useTransition();
  const [confirmar, setConfirmar] = useState(false);
  const [situacao, setSituacao] = useState<FormState>(initialState);
  const [situacaoPendente, iniciarSituacao] = useTransition();
  const iniciais = {
    nome: aluno.nome,
    nascimento: aluno.nascimento,
    telefone: aluno.telefone,
    email: aluno.email ?? "",
    peso: String(aluno.peso),
    altura: aluno.altura === null ? "" : formatarAltura(aluno.altura),
    plano: aluno.plano ?? "",
    restricoes: aluno.restricoes ?? "",
  };
  const [valores, setValores] = useState(iniciais);
  const [tocados, setTocados] = useState<Record<string, boolean>>({});
  const escolhas = escolhasDePlano(planos, aluno.plano);
  const planoAtual = escolhas.find((plano) => plano.kind === valores.plano);
  const parsed = alunoEdicaoSchema.safeParse(valores);
  const errosCliente: FieldErrors = parsed.success
    ? {}
    : fieldErrors(parsed.error);
  const erro = (campo: string) =>
    (tocados[campo] ? errosCliente[campo]?.[0] : undefined) ??
    state.errors?.[campo]?.[0];

  useEffect(() => {
    if (state.success) router.refresh();
  }, [router, state]);

  function aoMudar(event: FormEvent<HTMLFormElement>) {
    const data = new FormData(event.currentTarget);
    setValores({
      nome: String(data.get("nome") ?? ""),
      nascimento: String(data.get("nascimento") ?? ""),
      telefone: String(data.get("telefone") ?? ""),
      email: String(data.get("email") ?? ""),
      peso: String(data.get("peso") ?? ""),
      altura: String(data.get("altura") ?? ""),
      plano: String(data.get("plano") ?? ""),
      restricoes: String(data.get("restricoes") ?? ""),
    });
  }

  function aoBlur(event: FocusEvent<HTMLFormElement>) {
    const campo = (event.target as unknown as { name?: string }).name;
    if (!campo) return;
    setTocados((atual) => ({ ...atual, [campo]: true }));
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const lido = {
      nome: String(data.get("nome") ?? ""),
      nascimento: String(data.get("nascimento") ?? ""),
      telefone: String(data.get("telefone") ?? ""),
      email: String(data.get("email") ?? ""),
      peso: String(data.get("peso") ?? ""),
      altura: String(data.get("altura") ?? ""),
      plano: String(data.get("plano") ?? ""),
      restricoes: String(data.get("restricoes") ?? ""),
    };
    setValores(lido);
    if (!alunoEdicaoSchema.safeParse(lido).success) {
      setTocados({
        nome: true,
        nascimento: true,
        telefone: true,
        email: true,
        peso: true,
        altura: true,
        plano: true,
      });
      return;
    }
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
          href={volta.href}
          className="font-label-md text-label-md text-primary-fixed"
        >
          {volta.rotulo}
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
            branco contam como nenhuma. E-mail vazio não aparece como dado.
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
          onChange={aoMudar}
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
              maxLength={13}
              defaultValue={aluno.telefone}
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
              defaultValue={aluno.email ?? ""}
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
              defaultValue={String(aluno.peso)}
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
              inputMode="decimal"
              placeholder="1.60"
              defaultValue={
                aluno.altura === null ? "" : formatarAltura(aluno.altura)
              }
              className={inputClass}
            />
          </Campo>
          <Campo
            id="plano"
            label="Plano escolhido"
            icon="card_membership"
            error={erro("plano") ?? planosErro ?? undefined}
            dica={dicaPlano(planoAtual)}
            className="lg:col-span-2"
          >
            <select
              id="plano"
              name="plano"
              defaultValue={aluno.plano ?? ""}
              className={`${inputClass} scheme-dark`}
            >
              <option value="">Não informado</option>
              {escolhas.map((plano) => (
                <option key={plano.kind} value={plano.kind}>
                  {rotuloEscolha(plano)}
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
              disabled={pending || !parsed.success}
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
        <section className="rounded-xl bg-surface-container-low p-space-lg">
          <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
            Agenda
          </h2>
          {agendaErro ? (
            <p
              className="mt-space-sm font-body-md text-body-md text-error"
              role="alert"
            >
              {agendaErro}
            </p>
          ) : marcacoes.length === 0 ? (
            <p className="mt-space-sm font-body-md text-body-md text-on-surface-variant">
              Nenhuma aula a partir de hoje.
            </p>
          ) : (
            <ul className="mt-space-md flex flex-col gap-space-sm">
              {marcacoes.map((marcacao) => (
                <li
                  key={marcacao.id}
                  className="flex flex-col gap-space-xs rounded-lg bg-surface-container px-space-md py-space-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="font-body-md text-body-md text-on-surface">
                    {marcacao.quando} · {marcacao.categoria}
                  </span>
                  <span className="font-label-md text-label-md text-on-surface-variant">
                    {marcacao.situacao}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <AvaliacaoAluno
          alunoId={aluno.id}
          avaliacao={avaliacao}
          erro={avaliacaoErro}
          hoje={hoje}
          tentarDeNovo={tentarDeNovo}
        />
      </div>
    </div>
  );
}
