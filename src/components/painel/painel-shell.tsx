"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { FormSair } from "@/components/painel/form-sair";

export type AreaPainel =
  | "inicio"
  | "novo"
  | "lista"
  | "planos"
  | "pagamentos"
  | "financeiro"
  | "horarios"
  | "agenda"
  | "avaliacoes";

type ItemMenu = {
  label: string;
  icon: string;
  href: string;
  area?: AreaPainel;
};

const menu: ItemMenu[] = [
  { label: "Dashboard", icon: "grid_view", href: "/painel", area: "inicio" },
  {
    label: "Novo Aluno",
    icon: "person_add",
    href: "/painel/alunos/novo",
    area: "novo",
  },
  {
    label: "Alunos Ativos / Inativos",
    icon: "badge",
    href: "/painel/alunos",
    area: "lista",
  },
  {
    label: "Planos",
    icon: "card_membership",
    href: "/painel/planos",
    area: "planos",
  },
  {
    label: "Pagamentos",
    icon: "receipt_long",
    href: "/painel/pagamentos",
    area: "pagamentos",
  },
  {
    label: "Horários",
    icon: "calendar_month",
    href: "/painel/horarios",
    area: "horarios",
  },
  {
    label: "Agenda",
    icon: "event",
    href: "/painel/agenda",
    area: "agenda",
  },
  {
    label: "Avaliações Médicas",
    icon: "cardiology",
    href: "/painel/avaliacoes",
    area: "avaliacoes",
  },
  {
    label: "Resumo Financeiro",
    icon: "query_stats",
    href: "/painel/financeiro",
    area: "financeiro",
  },
];

const consultaLarga = "(min-width: 768px)";

function telaLarga() {
  return window.matchMedia(consultaLarga).matches;
}

function elementosFocaveis(raiz: HTMLElement) {
  return [
    ...raiz.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ),
  ];
}

export function PainelShell({
  adminName,
  area,
  children,
}: {
  adminName: string;
  area: AreaPainel;
  children: ReactNode;
}) {
  const [aberto, setAberto] = useState(false);
  const idMenu = useId();
  const caminho = usePathname();
  const caminhoAnterior = useRef(caminho);
  const botaoMenu = useRef<HTMLButtonElement>(null);
  const botaoRecolher = useRef<HTMLButtonElement>(null);
  const gaveta = useRef<HTMLElement>(null);
  const estavaAberta = useRef(false);

  function fechar() {
    setAberto(false);
  }

  function recolher() {
    if (!telaLarga()) fechar();
  }

  function escolherItem() {
    fechar();
  }

  useEffect(() => {
    if (caminhoAnterior.current === caminho) return;
    caminhoAnterior.current = caminho;
    setAberto(false);
  }, [caminho]);

  useEffect(() => {
    const consulta = window.matchMedia(consultaLarga);
    function aoMudar() {
      if (consulta.matches) setAberto(false);
    }
    consulta.addEventListener("change", aoMudar);
    return () => consulta.removeEventListener("change", aoMudar);
  }, []);

  useEffect(() => {
    if (!aberto) return;
    const html = document.documentElement;
    const overflowHtml = html.style.overflow;
    const overflowBody = document.body.style.overflow;
    html.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      html.style.overflow = overflowHtml;
      document.body.style.overflow = overflowBody;
    };
  }, [aberto]);

  useEffect(() => {
    if (aberto) {
      estavaAberta.current = true;
      botaoRecolher.current?.focus();
      return;
    }
    if (!estavaAberta.current) return;
    estavaAberta.current = false;
    if (!telaLarga()) botaoMenu.current?.focus();
  }, [aberto]);

  useEffect(() => {
    if (!aberto) return;

    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === "Escape") {
        evento.preventDefault();
        setAberto(false);
        return;
      }
      if (evento.key !== "Tab" || !gaveta.current) return;
      const focaveis = elementosFocaveis(gaveta.current);
      if (focaveis.length === 0) {
        evento.preventDefault();
        gaveta.current.focus();
        return;
      }
      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];
      const ativo = document.activeElement;
      const fora = !gaveta.current.contains(ativo);
      if (evento.shiftKey) {
        if (ativo === primeiro || fora) {
          evento.preventDefault();
          ultimo.focus();
        }
        return;
      }
      if (ativo === ultimo || fora) {
        evento.preventDefault();
        primeiro.focus();
      }
    }

    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [aberto]);

  return (
    <div className="min-h-screen bg-background font-body-md text-body-md text-on-surface">
      {aberto ? (
        <div
          className="fixed inset-0 z-50 bg-black/60 md:hidden"
          onClick={fechar}
          aria-hidden="true"
        />
      ) : null}
      <aside
        id={idMenu}
        ref={gaveta}
        role={aberto ? "dialog" : undefined}
        aria-modal={aberto || undefined}
        aria-label="Menu"
        tabIndex={aberto ? -1 : undefined}
        className={`fixed top-0 left-0 z-60 h-full w-72 max-w-[85%] flex-col bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.4)] md:max-w-none ${aberto ? "flex" : "hidden md:flex"}`}
      >
        <div className="shrink-0">
          <div className="flex h-16 items-center justify-between px-space-lg">
            <div className="flex items-center gap-space-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-fixed shadow-[0_0_16px_rgba(195,244,0,0.25)]">
                <span className="material-symbols-outlined text-[22px] font-bold text-on-primary-fixed">
                  bolt
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-headline-sm text-headline-sm font-bold tracking-wider text-on-surface uppercase">
                  FITADMIN
                </span>
                <span className="font-label-sm text-label-sm font-bold tracking-widest text-primary-fixed uppercase">
                  APEX.FIT ENGINE
                </span>
              </div>
            </div>
            <button
              ref={botaoRecolher}
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
              aria-label="Recolher menu"
              onClick={recolher}
            >
              <span className="material-symbols-outlined text-[20px]">
                keyboard_double_arrow_left
              </span>
            </button>
          </div>
          <div className="px-space-lg pb-space-sm md:hidden">
            <span className="block truncate font-label-md text-label-md leading-tight font-semibold text-on-surface">
              {adminName}
            </span>
            <span className="font-label-sm text-label-sm tracking-wider text-primary-fixed uppercase">
              Administrador
            </span>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-space-md pt-space-md">
          <div className="px-space-sm pb-space-xs font-label-sm text-label-sm tracking-wider text-on-surface-variant uppercase">
            Gestão Operacional
          </div>
          <nav className="flex flex-col gap-space-xs">
            {menu.map((item) => {
              const ativo = item.area === area;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  aria-current={ativo ? "page" : undefined}
                  onClick={escolherItem}
                  className={
                    ativo
                      ? "flex items-center gap-space-md rounded-lg bg-primary-fixed px-space-md py-space-sm font-label-lg text-label-lg text-on-primary-fixed shadow-[0_0_16px_rgba(195,244,0,0.2)]"
                      : "flex items-center gap-space-md rounded-lg px-space-md py-space-sm font-label-lg text-label-lg text-on-surface-variant transition-all hover:bg-surface-container-high hover:text-on-surface"
                  }
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex shrink-0 flex-col gap-space-sm p-space-md">
          <div className="flex items-center justify-between rounded-xl bg-surface-container-low p-space-md">
            <div className="flex items-center gap-space-sm">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-secondary-fixed" />
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                  Status Catracas
                </span>
                <span className="font-label-md text-label-md text-on-surface">
                  Online (4/4)
                </span>
              </div>
            </div>
            <span className="material-symbols-outlined text-[18px] text-secondary-fixed">
              wifi_tethering
            </span>
          </div>
        </div>
      </aside>

      <div className="md:pl-72" inert={aberto}>
        <header className="fixed top-0 right-0 left-0 z-40 flex h-16 items-center justify-between bg-surface-container-lowest/80 px-space-lg shadow-[0_1px_8px_rgba(0,0,0,0.3)] backdrop-blur-xl md:left-72">
          <div className="flex items-center gap-space-md">
            <button
              ref={botaoMenu}
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-container text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface md:hidden"
              aria-label="Abrir menu"
              aria-expanded={aberto}
              aria-controls={idMenu}
              onClick={() => setAberto(true)}
            >
              <span className="material-symbols-outlined text-[20px]">
                menu
              </span>
            </button>
            <div className="hidden items-center gap-space-sm rounded-lg bg-surface-container px-space-md py-space-xs text-on-surface md:flex">
              <span className="material-symbols-outlined text-[18px] text-primary-fixed">
                storefront
              </span>
              <span className="font-label-md text-label-md font-semibold text-on-surface">
                Unidade Principal
              </span>
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                expand_more
              </span>
            </div>
          </div>
          <div className="flex items-center gap-space-md">
            <div className="relative hidden md:block">
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-container text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
                aria-label="Notificações"
              >
                <span className="material-symbols-outlined text-[20px]">
                  notifications
                </span>
              </button>
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary-fixed font-label-sm text-label-sm font-bold text-on-primary-fixed">
                3
              </span>
            </div>
            <div className="flex items-center gap-space-md pl-space-sm">
              <div className="hidden items-center gap-space-sm md:flex">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                  <span className="material-symbols-outlined text-[18px] text-on-primary">
                    person
                  </span>
                </div>
                <div className="hidden max-w-40 flex-col text-left xl:flex">
                  <span className="truncate font-label-md text-label-md leading-tight font-semibold text-on-surface">
                    {adminName}
                  </span>
                  <span className="font-label-sm text-label-sm tracking-wider text-primary-fixed uppercase">
                    Administrador
                  </span>
                </div>
              </div>
              <FormSair />
            </div>
          </div>
        </header>

        <main className="min-h-screen w-full bg-background pt-16">
          {children}
        </main>
      </div>
    </div>
  );
}
