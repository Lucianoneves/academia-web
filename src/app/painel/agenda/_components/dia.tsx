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
import { formatarDataIso } from "@/lib/pagamento-situacao";
import { type FormState } from "@/lib/validacao";
import { cancelarMarcacao, marcarAluno } from "../_actions/marcacao";
import type { AlunoAgenda, SlotDia } from "../_data-access/agenda";

const initialState: FormState = { success: false };

const inputClass =
  "h-12 w-full rounded-lg bg-surface-container px-space-md font-body-md text-body-md text-on-surface focus:bg-surface-container-high focus:outline-none";

function FormularioMarcar({
  horarioId,
  data,
  alunos,
}: {
  horarioId: string;
  data: string;
  alunos: AlunoAgenda[];
}) {
  const router = useRouter();
  const [state, action] = useActionState(marcarAluno, initialState);
  const [pending, startTransition] = useTransition();
  const [alunoId, setAlunoId] = useState("");
  const aviso = alunos.find((aluno) => aluno.id === alunoId)?.pagamento;

  useEffect(() => {
    if (!state.success) return;
    setAlunoId("");
    router.refresh();
  }, [router, state]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const dados = new FormData(event.currentTarget);
    startTransition(() => {
      action(dados);
    });
  }

  if (alunos.length === 0) {
    return (
      <p className="font-body-md text-body-md text-on-surface-variant">
        Nenhum aluno ativo para marcar.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-space-sm">
      <input type="hidden" name="horario" value={horarioId} />
      <input type="hidden" name="data" value={data} />
      <label
        className="font-label-md text-label-md font-semibold text-on-surface-variant uppercase"
        htmlFor={`aluno-${horarioId}`}
      >
        Aluno
      </label>
      <div className="flex flex-col gap-space-sm sm:flex-row">
        <select
          id={`aluno-${horarioId}`}
          name="aluno"
          required
          value={alunoId}
          onChange={(event) => setAlunoId(event.target.value)}
          className={`${inputClass} scheme-dark`}
        >
          <option value="">Selecione o aluno</option>
          {alunos.map((aluno) => (
            <option key={aluno.id} value={aluno.id}>
              {aluno.nome}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={pending}
          className="h-12 rounded-lg bg-primary-fixed px-space-lg font-label-lg text-label-lg font-bold text-on-primary-fixed disabled:opacity-70"
        >
          {pending ? "Marcando..." : "Marcar"}
        </button>
      </div>
      {aviso ? (
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Pagamento: {aviso}. Isso não impede a marcação.
        </p>
      ) : null}
      {state.errors?.aluno?.[0] ? (
        <p className="font-body-sm text-body-sm text-error" role="alert">
          {state.errors.aluno[0]}
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

function BotaoCancelar({ id }: { id: string }) {
  const router = useRouter();
  const [confirmar, setConfirmar] = useState(false);
  const [pending, startTransition] = useTransition();
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  function cancelar() {
    startTransition(async () => {
      const resultado = await cancelarMarcacao(id);
      setOk(resultado.success);
      setMensagem(resultado.message ?? null);
      setConfirmar(false);
      if (resultado.success) router.refresh();
    });
  }

  if (!confirmar) {
    return (
      <button
        type="button"
        onClick={() => setConfirmar(true)}
        className="font-label-md text-label-md text-error"
      >
        Cancelar
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-space-xs">
      <p className="font-body-sm text-body-sm text-on-surface">
        Cancelar esta marcação?
      </p>
      <div className="flex gap-space-sm">
        <button
          type="button"
          disabled={pending}
          onClick={cancelar}
          className="font-label-md text-label-md font-bold text-error disabled:opacity-70"
        >
          {pending ? "Cancelando..." : "Confirmar"}
        </button>
        <button
          type="button"
          onClick={() => setConfirmar(false)}
          className="font-label-md text-label-md text-on-surface-variant"
        >
          Voltar
        </button>
      </div>
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

export function DiaAgenda({
  data,
  slots,
  alunos,
}: {
  data: string;
  slots: SlotDia[];
  alunos: AlunoAgenda[];
}) {
  return (
    <div className="flex flex-col gap-space-lg">
      <form
        action="/painel/agenda"
        className="flex flex-col gap-space-sm sm:flex-row sm:items-end"
      >
        <div className="flex flex-col gap-space-xs">
          <label
            className="font-label-md text-label-md font-semibold text-on-surface-variant uppercase"
            htmlFor="data-agenda"
          >
            Data
          </label>
          <input
            id="data-agenda"
            name="data"
            type="date"
            required
            defaultValue={data}
            className="h-12 rounded-lg bg-surface-container px-space-md font-body-md text-body-md text-on-surface focus:bg-surface-container-high focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="h-12 rounded-lg bg-surface-container px-space-lg font-label-lg text-label-lg text-on-surface"
        >
          Ver este dia
        </button>
      </form>

      <p className="font-body-md text-body-md text-on-surface-variant">
        {formatarDataIso(data)}
      </p>

      {slots.length === 0 ? (
        <p className="font-body-md text-body-md text-on-surface-variant">
          Não há aula neste dia. A grade semanal fica em{" "}
          <Link href="/painel/horarios" className="text-primary-fixed">
            Horários
          </Link>
          .
        </p>
      ) : (
        <ul className="flex flex-col gap-space-md">
          {slots.map((slot) => (
            <li
              key={slot.id}
              className="flex flex-col gap-space-md rounded-xl bg-surface-container-low p-space-lg"
            >
              <div>
                <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  {slot.titulo}
                </h2>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  {slot.categoria} · {slot.ocupadas} de {slot.vagas}{" "}
                  {slot.vagas === 1 ? "vaga ocupada" : "vagas ocupadas"}
                </p>
                {slot.aviso ? (
                  <p className="mt-space-xs font-body-sm text-body-sm text-on-surface-variant">
                    {slot.aviso}
                  </p>
                ) : null}
              </div>

              {slot.pessoas.length === 0 ? (
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Ninguém marcado.
                </p>
              ) : (
                <ul className="flex flex-col gap-space-sm">
                  {slot.pessoas.map((pessoa) => (
                    <li
                      key={pessoa.id}
                      className="flex items-center justify-between gap-space-md rounded-lg bg-surface-container px-space-md py-space-sm"
                    >
                      <span className="font-body-md text-body-md text-on-surface">
                        {pessoa.nome}
                      </span>
                      <span className="flex items-center gap-space-md">
                        <span className="font-label-md text-label-md text-on-surface-variant">
                          {pessoa.situacao}
                        </span>
                        {pessoa.podeCancelar ? (
                          <BotaoCancelar id={pessoa.id} />
                        ) : null}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {slot.aceitaNova ? (
                <FormularioMarcar
                  horarioId={slot.id}
                  data={data}
                  alunos={alunos}
                />
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
