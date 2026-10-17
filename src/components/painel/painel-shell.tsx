import Link from "next/link";
import type { ReactNode } from "react";
import { FormSair } from "@/components/painel/form-sair";

export type AreaPainel =
  | "inicio"
  | "novo"
  | "lista"
  | "planos"
  | "pagamentos"
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
  { label: "Próximas Aulas", icon: "event_available", href: "/painel#aulas" },
  {
    label: "Avaliações Médicas",
    icon: "cardiology",
    href: "/painel/avaliacoes",
    area: "avaliacoes",
  },
  {
    label: "Resumo Financeiro",
    icon: "query_stats",
    href: "/painel#financeiro",
  },
];

export function PainelShell({
  adminName,
  area,
  children,
}: {
  adminName: string;
  area: AreaPainel;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background font-body-md text-body-md text-on-surface">
      <aside className="fixed top-0 left-0 z-50 flex h-full w-72 flex-col justify-between bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.4)]">
        <div className="flex flex-col">
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
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
              aria-label="Recolher menu"
            >
              <span className="material-symbols-outlined text-[20px]">
                keyboard_double_arrow_left
              </span>
            </button>
          </div>
          <div className="px-space-md pt-space-md">
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
        </div>
        <div className="flex flex-col gap-space-sm p-space-md">
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

      <div className="pl-72">
        <header className="fixed top-0 right-0 left-72 z-40 flex h-16 items-center justify-between bg-surface-container-lowest/80 px-space-lg shadow-[0_1px_8px_rgba(0,0,0,0.3)] backdrop-blur-xl">
          <div className="flex items-center gap-space-md">
            <div className="flex items-center gap-space-sm rounded-lg bg-surface-container px-space-md py-space-xs text-on-surface">
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
            <div className="relative">
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
              <div className="flex items-center gap-space-sm">
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
