import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { formatarReais } from "@/lib/dinheiro";
import { formatarDataIso } from "@/lib/pagamento-situacao";
import {
  deslocarMes,
  hrefHistoricoDesdeResumo,
  hrefMes,
  mesSeguinteFechado,
  rotuloMes,
  type DiaMes,
  type TotaisMes,
} from "@/lib/resumo-financeiro";
import { CarregandoAcesso } from "@/components/acesso/carregando-acesso";
import { PainelShell } from "@/components/painel/painel-shell";
import { resumoDoMes } from "./_data-access/resumo";

export const metadata: Metadata = {
  title: "APEX.FIT — Resumo financeiro",
};

export default function FinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  return (
    <Suspense
      fallback={<CarregandoAcesso titulo="Abrindo o resumo financeiro" />}
    >
      <Financeiro searchParams={searchParams} />
    </Suspense>
  );
}

async function Financeiro({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const admin = await requireAdmin();
  const params = await searchParams;
  const resultado = await resumoDoMes(params.mes);
  const tentarDeNovo = params.mes
    ? `/painel/financeiro?mes=${encodeURIComponent(params.mes)}`
    : "/painel/financeiro";

  return (
    <PainelShell adminName={admin.name} area="financeiro">
      <div className="flex w-full flex-col gap-space-lg p-space-lg">
        <div>
          <div className="flex items-center gap-space-xs font-label-sm text-label-sm tracking-widest text-on-surface-variant uppercase">
            <span>Gestão Operacional</span>
            <span>•</span>
            <span className="text-primary-fixed">Resumo financeiro</span>
          </div>
          <h1 className="mt-space-xs font-headline-lg text-headline-lg tracking-tight text-on-surface">
            Resumo financeiro
          </h1>
          <p className="mt-space-xs max-w-2xl font-body-md text-body-md text-on-surface-variant">
            O que entrou e o que foi estornado no mês, pela data de cada
            lançamento.
          </p>
        </div>

        {!resultado.ok ? (
          <div className="rounded-xl bg-surface-container-low p-space-lg">
            <p className="font-body-md text-body-md text-error" role="alert">
              {resultado.erro}
            </p>
            <Link
              href={tentarDeNovo}
              className="mt-space-sm inline-flex font-label-md text-label-md text-primary-fixed"
            >
              Tentar de novo
            </Link>
          </div>
        ) : (
          <Conteudo
            hoje={resultado.hoje}
            mes={resultado.mes}
            totais={resultado.totais}
            dinheiro={resultado.dinheiro}
            cartao={resultado.cartao}
            dias={resultado.dias}
            lista={resultado.lista}
          />
        )}
      </div>
    </PainelShell>
  );
}

function Conteudo({
  hoje,
  mes,
  totais,
  dinheiro,
  cartao,
  dias,
  lista,
}: {
  hoje: string;
  mes: string;
  totais: TotaisMes;
  dinheiro: TotaisMes;
  cartao: TotaisMes;
  dias: DiaMes[];
  lista: {
    id: string;
    alunoId: string;
    aluno: string;
    plano: string;
    pagoEm: string;
    forma: "dinheiro" | "cartao";
    centavos: number;
    efeito: string;
  }[];
}) {
  const anterior = deslocarMes(mes, -1);
  const seguinte = deslocarMes(mes, 1);
  const seguinteFechado = mesSeguinteFechado(mes, hoje);

  return (
    <>
      <div className="flex items-center justify-between gap-space-md">
        <Link
          href={hrefMes(anterior, hoje)}
          aria-label="Mês anterior"
          className="inline-flex items-center gap-space-xs font-label-md text-label-md text-primary-fixed"
        >
          <span className="material-symbols-outlined text-[18px]">
            chevron_left
          </span>
          Mês anterior
        </Link>
        <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
          {rotuloMes(mes)}
        </h2>
        {seguinteFechado ? (
          <span
            aria-disabled="true"
            className="inline-flex items-center gap-space-xs font-label-md text-label-md text-on-surface-variant"
          >
            Mês seguinte
            <span className="material-symbols-outlined text-[18px]">
              chevron_right
            </span>
          </span>
        ) : (
          <Link
            href={hrefMes(seguinte, hoje)}
            aria-label="Mês seguinte"
            className="inline-flex items-center gap-space-xs font-label-md text-label-md text-primary-fixed"
          >
            Mês seguinte
            <span className="material-symbols-outlined text-[18px]">
              chevron_right
            </span>
          </Link>
        )}
      </div>

      <Totais titulo="Mês" totais={totais} />

      <div className="grid grid-cols-1 gap-space-md lg:grid-cols-2">
        <Totais titulo="Dinheiro" totais={dinheiro} />
        <Totais titulo="Cartão" totais={cartao} />
      </div>

      {dias.length > 0 ? (
        <section className="rounded-xl bg-surface-container-low p-space-lg">
          <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
            Por dia
          </h2>
          <p className="mt-space-sm flex gap-space-md font-label-sm text-label-sm text-on-surface-variant">
            <span className="inline-flex items-center gap-space-xs">
              <span className="h-2.5 w-2.5 rounded-sm bg-primary-fixed" />
              Entrou
            </span>
            <span className="inline-flex items-center gap-space-xs">
              <span className="h-2.5 w-2.5 rounded-sm bg-error" />
              Estornado
            </span>
          </p>
          <ul className="mt-space-md flex items-end gap-space-sm overflow-x-auto pb-space-xs">
            {dias.map((dia) => (
              <Dia key={dia.dia} dia={dia} topo={topoDasBarras(dias)} />
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-xl bg-surface-container-low p-space-lg">
        <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
          Lançamentos
        </h2>
        {lista.length === 0 ? (
          <p className="mt-space-sm font-body-md text-body-md text-on-surface-variant">
            Nenhum lançamento neste mês.
          </p>
        ) : (
          <ul className="mt-space-md flex flex-col gap-space-sm">
            {lista.map((linha) => (
              <li key={linha.id}>
                <Link
                  href={hrefHistoricoDesdeResumo(linha.alunoId, mes)}
                  className="grid gap-space-xs rounded-lg bg-surface-container p-space-md transition-colors hover:bg-surface-container-high sm:grid-cols-[6.5rem_1fr_auto]"
                >
                  <span className="font-label-md text-label-md text-primary-fixed">
                    {formatarDataIso(linha.pagoEm)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-label-lg text-label-lg font-bold text-on-surface">
                      {linha.aluno}
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      {linha.plano} ·{" "}
                      {linha.forma === "cartao" ? "Cartão" : "Dinheiro"}
                    </span>
                  </span>
                  <span className="sm:text-right">
                    <span className="block font-label-lg text-label-lg font-bold text-on-surface">
                      {formatarReais(linha.centavos)}
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      {linha.efeito}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function Totais({ titulo, totais }: { titulo: string; totais: TotaisMes }) {
  const itens = [
    { rotulo: "Entrou", valor: totais.entrou },
    { rotulo: "Estornado", valor: totais.estornado },
    { rotulo: "Líquido", valor: totais.liquido },
  ];

  return (
    <section className="rounded-xl bg-surface-container-low p-space-lg">
      <h2 className="font-label-sm text-label-sm font-semibold tracking-wider text-on-surface-variant uppercase">
        {titulo}
      </h2>
      <div className="mt-space-md grid grid-cols-1 gap-space-md sm:grid-cols-3">
        {itens.map((item) => (
          <div key={item.rotulo}>
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              {item.rotulo}
            </span>
            <span className="mt-1 block font-headline-sm text-headline-sm font-bold text-on-surface">
              {formatarReais(item.valor)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function topoDasBarras(dias: DiaMes[]) {
  return Math.max(...dias.flatMap((dia) => [dia.entrou, dia.estornado]), 1);
}

function Dia({ dia, topo }: { dia: DiaMes; topo: number }) {
  const [, , numero] = dia.dia.split("-");

  return (
    <li className="flex w-16 shrink-0 flex-col items-center gap-1">
      <div className="flex h-36 w-full items-end justify-center gap-1">
        <span
          className="w-4 rounded-t bg-primary-fixed"
          style={{ height: `${(dia.entrou / topo) * 100}%` }}
        />
        <span
          className="w-4 rounded-t bg-error"
          style={{ height: `${(dia.estornado / topo) * 100}%` }}
        />
      </div>
      <span className="font-label-sm text-label-sm text-on-surface">
        {numero}
      </span>
      <span className="text-center font-label-sm text-label-sm text-on-surface-variant">
        {formatarReais(dia.entrou)}
        <span className="block">{formatarReais(dia.estornado)}</span>
      </span>
    </li>
  );
}
