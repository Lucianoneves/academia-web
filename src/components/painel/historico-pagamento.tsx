"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { estornarPagamento } from "@/app/painel/pagamentos/_actions/lancar-pagamento";
import type { PagamentoAluno } from "@/app/painel/pagamentos/tipos";

const pill: Record<PagamentoAluno["situacao"], string> = {
  em_dia: "bg-secondary-fixed/15 text-secondary-fixed",
  atrasado: "bg-error-container/40 text-error",
  sem_pagamento: "bg-surface-container-high text-on-surface-variant",
  credito_disponivel: "bg-primary-fixed/15 text-primary-fixed",
  credito_utilizado: "bg-tertiary-fixed/15 text-tertiary-fixed-dim",
};

export function HistoricoPagamento({
  alunoId,
  ativo,
  pagamento,
  tentarDeNovo,
}: {
  alunoId: string;
  ativo: boolean;
  pagamento: PagamentoAluno | null;
  tentarDeNovo: string;
}) {
  if (!pagamento) {
    return (
      <section className="rounded-xl bg-surface-container-low p-space-lg">
        <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
          Pagamento
        </h2>
        <p
          className="mt-space-sm font-body-md text-body-md text-error"
          role="alert"
        >
          Não foi possível carregar os pagamentos.
        </p>
        <Link
          href={tentarDeNovo}
          className="mt-space-sm inline-flex font-label-md text-label-md text-primary-fixed"
        >
          Tentar de novo
        </Link>
      </section>
    );
  }

  return (
    <section className="rounded-xl bg-surface-container-low p-space-lg">
      <div className="flex flex-wrap items-center gap-space-sm">
        <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
          Pagamento
        </h2>
        <span
          className={`rounded-full px-space-sm py-0.5 font-label-sm text-label-sm font-bold uppercase ${pill[pagamento.situacao]}`}
        >
          {pagamento.rotulo}
        </span>
      </div>
      {pagamento.planoAtivo ? (
        <p className="mt-space-xs font-body-sm text-body-sm text-on-surface-variant">
          Plano ativo: {pagamento.planoAtivo}
        </p>
      ) : null}

      {pagamento.linhas.length === 0 ? (
        <p className="mt-space-sm font-body-md text-body-md text-on-surface-variant">
          Ainda não há registros.
        </p>
      ) : (
        <ul className="mt-space-md flex flex-col gap-space-sm">
          {pagamento.linhas.map((linha) => (
            <li
              key={linha.id}
              className="rounded-lg bg-surface-container px-space-md py-space-sm"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-space-sm">
                <span className="font-label-lg text-label-lg font-bold text-on-surface">
                  {linha.plano}
                </span>
                <span className="font-body-md text-body-md text-on-surface">
                  {linha.valor}
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {linha.data} · {linha.forma}
              </p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {linha.efeito}
              </p>
              {linha.podeEstornar ? (
                <BotaoEstorno pagamentoId={linha.id} />
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {ativo ? (
        <Link
          href={`/painel/pagamentos?aluno=${alunoId}#lancar`}
          className="mt-space-md inline-flex h-12 items-center rounded-lg bg-primary-fixed px-space-lg font-label-lg text-label-lg font-bold text-on-primary-fixed"
        >
          Lançar pagamento
        </Link>
      ) : (
        <p className="mt-space-md font-body-sm text-body-sm text-on-surface-variant">
          Aluno inativo não recebe lançamento novo.
        </p>
      )}
    </section>
  );
}

function BotaoEstorno({ pagamentoId }: { pagamentoId: string }) {
  const router = useRouter();
  const [confirmar, setConfirmar] = useState(false);
  const [pending, startTransition] = useTransition();
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  function estornar() {
    startTransition(async () => {
      const resultado = await estornarPagamento(pagamentoId);
      setOk(resultado.success);
      setMensagem(resultado.message ?? null);
      if (resultado.success) {
        setConfirmar(false);
        router.refresh();
      }
    });
  }

  if (!confirmar) {
    return (
      <button
        type="button"
        onClick={() => setConfirmar(true)}
        className="mt-space-sm font-label-md text-label-md text-error"
      >
        Estornar
      </button>
    );
  }

  return (
    <div className="mt-space-sm flex flex-col gap-space-sm">
      <p className="font-body-sm text-body-sm text-on-surface-variant">
        A linha permanece no histórico e deixa de cobrir o aluno.
      </p>
      <div className="flex flex-wrap gap-space-sm">
        <button
          type="button"
          disabled={pending}
          onClick={estornar}
          className="h-10 rounded-lg bg-error-container px-space-md font-label-md text-label-md font-bold text-on-error-container disabled:opacity-70"
        >
          {pending ? "Estornando..." : "Confirmar estorno"}
        </button>
        <button
          type="button"
          onClick={() => setConfirmar(false)}
          className="h-10 rounded-lg bg-surface-container-high px-space-md font-label-md text-label-md text-on-surface"
        >
          Cancelar
        </button>
      </div>
      {mensagem && !ok ? (
        <p className="font-body-sm text-body-sm text-error" role="alert">
          {mensagem}
        </p>
      ) : null}
    </div>
  );
}
