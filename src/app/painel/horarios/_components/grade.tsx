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
import { horaCurta, nomeDia, ordemDias } from "@/lib/agenda";
import { type FormState } from "@/lib/validacao";
import {
  alterarHorarioAtivo,
  atualizarHorario,
  criarHorario,
} from "../_actions/horario";
import type { CategoriaHorario, HorarioPainel } from "../_data-access/horarios";

const initialState: FormState = { success: false };

const inputClass =
  "h-12 w-full rounded-lg bg-surface-container px-space-md font-body-md text-body-md text-on-surface focus:bg-surface-container-high focus:outline-none";

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

function OpcoesCategoria({
  categorias,
  atual,
}: {
  categorias: CategoriaHorario[];
  atual?: string;
}) {
  const visiveis = categorias.filter(
    (categoria) => categoria.ativa || categoria.id === atual
  );

  return (
    <>
      <option value="">Selecione a categoria</option>
      {visiveis.map((categoria) => (
        <option key={categoria.id} value={categoria.id}>
          {categoria.nome}
          {categoria.ativa ? "" : " (inativa)"}
        </option>
      ))}
    </>
  );
}

function FormularioNovo({ categorias }: { categorias: CategoriaHorario[] }) {
  const router = useRouter();
  const [state, action] = useActionState(criarHorario, initialState);
  const [pending, startTransition] = useTransition();
  const erro = (campo: string) => state.errors?.[campo]?.[0];
  const ativas = categorias.some((categoria) => categoria.ativa);

  useEffect(() => {
    if (state.success) router.refresh();
  }, [router, state]);

  if (!ativas) {
    return (
      <p className="font-body-md text-body-md text-on-surface-variant">
        Nenhuma categoria ativa. O horário precisa de uma categoria ativa.
      </p>
    );
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const dados = new FormData(event.currentTarget);
    startTransition(() => {
      action(dados);
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="grid grid-cols-1 gap-space-md rounded-xl bg-surface-container-low p-space-lg md:grid-cols-2 xl:grid-cols-6"
    >
      <Campo id="dia-novo" label="Dia" erro={erro("dia")}>
        <select
          id="dia-novo"
          name="dia"
          required
          defaultValue=""
          className={`${inputClass} scheme-dark`}
        >
          <option value="" disabled>
            Selecione o dia
          </option>
          {ordemDias.map((dia) => (
            <option key={dia} value={dia}>
              {nomeDia(dia)}
            </option>
          ))}
        </select>
      </Campo>
      <Campo id="inicio-novo" label="Início" erro={erro("inicio")}>
        <input
          id="inicio-novo"
          name="inicio"
          type="time"
          required
          className={inputClass}
        />
      </Campo>
      <Campo id="fim-novo" label="Fim" erro={erro("fim")}>
        <input
          id="fim-novo"
          name="fim"
          type="time"
          required
          className={inputClass}
        />
      </Campo>
      <Campo id="categoria-nova" label="Categoria" erro={erro("categoria")}>
        <select
          id="categoria-nova"
          name="categoria"
          required
          defaultValue=""
          className={`${inputClass} scheme-dark`}
        >
          <OpcoesCategoria categorias={categorias} />
        </select>
      </Campo>
      <Campo id="vagas-novas" label="Vagas" erro={erro("vagas")}>
        <input
          id="vagas-novas"
          name="vagas"
          type="number"
          min={1}
          required
          className={inputClass}
        />
      </Campo>
      <div className="flex items-end">
        <button
          type="submit"
          disabled={pending}
          className="h-12 w-full rounded-lg bg-primary-fixed px-space-lg font-label-lg text-label-lg font-bold text-on-primary-fixed disabled:opacity-70"
        >
          {pending ? "Salvando..." : "Criar horário"}
        </button>
      </div>
      {state.message ? (
        <p
          className={
            state.success
              ? "font-body-sm text-body-sm text-secondary-fixed md:col-span-2 xl:col-span-6"
              : "font-body-sm text-body-sm text-error md:col-span-2 xl:col-span-6"
          }
          role="status"
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

function FormularioEdicao({
  horario,
  categorias,
}: {
  horario: HorarioPainel;
  categorias: CategoriaHorario[];
}) {
  const router = useRouter();
  const [state, action] = useActionState(atualizarHorario, initialState);
  const [pending, startTransition] = useTransition();
  const erro = (campo: string) => state.errors?.[campo]?.[0];

  useEffect(() => {
    if (state.success) router.refresh();
  }, [router, state]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const dados = new FormData(event.currentTarget);
    startTransition(() => {
      action(dados);
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="grid grid-cols-1 gap-space-md md:grid-cols-2 xl:grid-cols-6"
    >
      <input type="hidden" name="id" value={horario.id} />
      <Campo id={`dia-${horario.id}`} label="Dia" erro={erro("dia")}>
        <select
          id={`dia-${horario.id}`}
          name="dia"
          required
          defaultValue={String(horario.dia)}
          className={`${inputClass} scheme-dark`}
        >
          {ordemDias.map((dia) => (
            <option key={dia} value={dia}>
              {nomeDia(dia)}
            </option>
          ))}
        </select>
      </Campo>
      <Campo id={`inicio-${horario.id}`} label="Início" erro={erro("inicio")}>
        <input
          id={`inicio-${horario.id}`}
          name="inicio"
          type="time"
          required
          defaultValue={horaCurta(horario.inicio)}
          className={inputClass}
        />
      </Campo>
      <Campo id={`fim-${horario.id}`} label="Fim" erro={erro("fim")}>
        <input
          id={`fim-${horario.id}`}
          name="fim"
          type="time"
          required
          defaultValue={horaCurta(horario.fim)}
          className={inputClass}
        />
      </Campo>
      <Campo
        id={`categoria-${horario.id}`}
        label="Categoria"
        erro={erro("categoria")}
      >
        <select
          id={`categoria-${horario.id}`}
          name="categoria"
          required
          defaultValue={horario.categoriaId}
          className={`${inputClass} scheme-dark`}
        >
          <OpcoesCategoria
            categorias={categorias}
            atual={horario.categoriaId}
          />
        </select>
      </Campo>
      <Campo id={`vagas-${horario.id}`} label="Vagas" erro={erro("vagas")}>
        <input
          id={`vagas-${horario.id}`}
          name="vagas"
          type="number"
          min={1}
          required
          defaultValue={horario.vagas}
          className={inputClass}
        />
      </Campo>
      <div className="flex items-end">
        <button
          type="submit"
          disabled={pending}
          className="h-12 w-full rounded-lg bg-primary-fixed px-space-lg font-label-lg text-label-lg font-bold text-on-primary-fixed disabled:opacity-70"
        >
          {pending ? "Salvando..." : "Salvar"}
        </button>
      </div>
      {state.message ? (
        <p
          className={
            state.success
              ? "font-body-sm text-body-sm text-secondary-fixed md:col-span-2 xl:col-span-6"
              : "font-body-sm text-body-sm text-error md:col-span-2 xl:col-span-6"
          }
          role="status"
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

function CartaoHorario({
  horario,
  categorias,
}: {
  horario: HorarioPainel;
  categorias: CategoriaHorario[];
}) {
  const router = useRouter();
  const [editar, setEditar] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const [pending, startTransition] = useTransition();
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  function mudar(ativo: boolean) {
    startTransition(async () => {
      const resultado = await alterarHorarioAtivo(horario.id, ativo);
      setOk(resultado.success);
      setMensagem(resultado.message ?? null);
      setConfirmar(false);
      if (resultado.success) router.refresh();
    });
  }

  return (
    <li className="flex flex-col gap-space-md rounded-xl bg-surface-container-low p-space-lg">
      <div className="flex flex-col justify-between gap-space-md sm:flex-row sm:items-start">
        <div>
          <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
            {nomeDia(horario.dia)} · {horaCurta(horario.inicio)}–
            {horaCurta(horario.fim)}
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            {horario.categoria} · {horario.vagas}{" "}
            {horario.vagas === 1 ? "vaga" : "vagas"} ·{" "}
            {horario.ativo ? "Ativo" : "Inativo"}
          </p>
        </div>
        <div className="flex flex-wrap gap-space-sm">
          <button
            type="button"
            onClick={() => setEditar((valor) => !valor)}
            className="h-12 rounded-lg bg-surface-container px-space-lg font-label-lg text-label-lg text-on-surface"
          >
            {editar ? "Fechar" : "Editar"}
          </button>
          {horario.ativo ? (
            <button
              type="button"
              onClick={() => setConfirmar(true)}
              className="h-12 rounded-lg bg-surface-container px-space-lg font-label-lg text-label-lg text-error"
            >
              Inativar
            </button>
          ) : (
            <button
              type="button"
              disabled={pending}
              onClick={() => mudar(true)}
              className="h-12 rounded-lg bg-secondary-fixed px-space-lg font-label-lg text-label-lg font-bold text-on-secondary-fixed disabled:opacity-70"
            >
              {pending ? "Ativando..." : "Ativar"}
            </button>
          )}
        </div>
      </div>

      {confirmar ? (
        <div className="flex flex-col gap-space-sm rounded-lg bg-surface-container p-space-md">
          <p className="font-body-md text-body-md text-on-surface">
            Agendamentos já marcados continuam até alguém cancelar.
          </p>
          <div className="flex gap-space-sm">
            <button
              type="button"
              disabled={pending}
              onClick={() => mudar(false)}
              className="h-12 rounded-lg bg-error px-space-lg font-label-lg text-label-lg font-bold text-on-error disabled:opacity-70"
            >
              {pending ? "Inativando..." : "Confirmar"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmar(false)}
              className="h-12 rounded-lg bg-surface-container-high px-space-lg font-label-lg text-label-lg text-on-surface"
            >
              Voltar
            </button>
          </div>
        </div>
      ) : null}

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

      {editar ? (
        <FormularioEdicao horario={horario} categorias={categorias} />
      ) : null}
    </li>
  );
}

export function GradeHorarios({
  horarios,
  categorias,
  ativos,
}: {
  horarios: HorarioPainel[];
  categorias: CategoriaHorario[];
  ativos: boolean;
}) {
  return (
    <div className="flex flex-col gap-space-lg">
      {ativos ? <FormularioNovo categorias={categorias} /> : null}
      {horarios.length === 0 ? (
        <p className="font-body-md text-body-md text-on-surface-variant">
          {ativos
            ? "Nenhum horário ativo. Crie o primeiro."
            : "Nenhum horário inativo."}
        </p>
      ) : (
        <ul className="flex flex-col gap-space-md">
          {horarios.map((horario) => (
            <CartaoHorario
              key={horario.id}
              horario={horario}
              categorias={categorias}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
