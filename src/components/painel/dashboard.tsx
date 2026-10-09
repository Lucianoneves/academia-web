import Link from "next/link";
import { DataAtual } from "@/components/painel/data-atual";

const menu = [
  { label: "Dashboard", icon: "grid_view", href: "/painel", active: true },
  { label: "Total de Alunos", icon: "groups", href: "#alunos" },
  { label: "Alunos Ativos / Inativos", icon: "badge", href: "#ativos" },
  { label: "Pagamentos", icon: "receipt_long", href: "#pagamentos" },
  { label: "Próximas Aulas", icon: "event_available", href: "#aulas" },
  { label: "Avaliações Médicas", icon: "cardiology", href: "#avaliacoes" },
  { label: "Resumo Financeiro", icon: "query_stats", href: "#financeiro" },
];

const aulas = [
  {
    hora: "18:00",
    nome: "Hipertrofia & Força",
    detalhe: "Coach Rodrigo • Box 01",
    vagas: "18 / 20 vagas",
    tom: "aviso",
  },
  {
    hora: "19:00",
    nome: "Queima & HIIT Funcional",
    detalhe: "Coach Bia Lopes • Sala Cardio",
    vagas: "Lotado (25/25)",
    tom: "erro",
  },
  {
    hora: "20:00",
    nome: "Mobilidade & Yoga",
    detalhe: "Coach Camila • Studio Zen",
    vagas: "12 / 15 vagas",
    tom: "ok",
  },
] as const;

function vagaClass(tom: (typeof aulas)[number]["tom"]) {
  if (tom === "erro") return "bg-error-container/40 text-error";
  if (tom === "ok") return "bg-secondary-fixed/10 text-secondary-fixed";
  return "bg-tertiary-fixed/15 text-tertiary-fixed-dim";
}

export function Dashboard() {
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
              {menu.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  aria-current={item.active ? "page" : undefined}
                  className={
                    item.active
                      ? "flex items-center gap-space-md rounded-lg bg-primary-fixed px-space-md py-space-sm font-label-lg text-label-lg text-on-primary-fixed shadow-[0_0_16px_rgba(195,244,0,0.2)]"
                      : "flex items-center gap-space-md rounded-lg px-space-md py-space-sm font-label-lg text-label-lg text-on-surface-variant transition-all hover:bg-surface-container-high hover:text-on-surface"
                  }
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </a>
              ))}
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
            <div className="flex cursor-pointer items-center gap-space-sm rounded-lg bg-surface-container px-space-md py-space-xs transition-colors hover:bg-surface-container-high hover:text-on-surface">
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
            <button
              type="button"
              className="flex h-9 items-center gap-space-xs rounded-lg bg-surface-container-high px-space-md font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-bright hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[18px] text-primary-fixed">
                person_add
              </span>
              <span className="hidden lg:inline">Novo Aluno</span>
            </button>
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
                <div className="hidden flex-col text-left xl:flex">
                  <span className="font-label-md text-label-md leading-tight font-semibold text-on-surface">
                    Carlos Eduardo
                  </span>
                  <span className="font-label-sm text-label-sm tracking-wider text-primary-fixed uppercase">
                    Administrador
                  </span>
                </div>
              </div>
              <Link
                href="/login"
                title="Sair do Sistema"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-error-container hover:text-on-error-container"
              >
                <span className="material-symbols-outlined text-[18px]">
                  logout
                </span>
              </Link>
            </div>
          </div>
        </header>

        <main className="min-h-screen w-full bg-background pt-16">
          <div className="flex w-full flex-col gap-space-lg p-space-lg">
            <div className="flex flex-col justify-between gap-space-md md:flex-row md:items-end">
              <div className="flex flex-col">
                <div className="flex items-center gap-space-xs font-label-sm text-label-sm tracking-widest text-on-surface-variant uppercase">
                  <span>Gestão Operacional</span>
                  <span>•</span>
                  <span className="text-primary-fixed">
                    Visão em Tempo Real
                  </span>
                </div>
                <div className="mt-space-xs flex items-center gap-space-sm">
                  <h1 className="font-headline-lg text-headline-lg tracking-tight text-on-surface">
                    Painel da Academia
                  </h1>
                  <span className="flex items-center gap-1.5 rounded-full bg-secondary-fixed/10 px-space-sm py-0.5 font-label-sm text-label-sm text-secondary-fixed">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-secondary-fixed" />
                    Turno Noite Ativo
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-space-sm">
                <div className="flex items-center gap-space-xs rounded-lg bg-surface-container px-space-md py-space-xs font-label-md text-label-md text-on-surface-variant">
                  <span className="material-symbols-outlined text-[18px]">
                    calendar_today
                  </span>
                  <DataAtual />
                </div>
                <button
                  type="button"
                  className="flex h-9 items-center gap-space-xs rounded-lg bg-surface-container-high px-space-md font-label-md text-label-md text-on-surface shadow-sm transition-all hover:bg-surface-bright active:scale-95"
                >
                  <span className="material-symbols-outlined text-[18px] text-primary-fixed">
                    refresh
                  </span>
                  <span>Sincronizar</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2 lg:grid-cols-4">
              <Metric
                label="Total de Alunos"
                icon="groups"
                iconClass="text-primary-fixed"
                value="420"
                detail="+12 este mês"
                detailClass="text-secondary-fixed"
                detailIcon="arrow_upward"
              />
              <Metric
                label="Alunos Ativos"
                icon="badge"
                iconClass="text-secondary-fixed"
                value="382"
                detail="91% da base ativa"
                detailClass="text-secondary-fixed"
              />
              <Metric
                label="Faturamento"
                icon="payments"
                iconClass="text-primary-fixed"
                value="R$ 54.200"
                detail="Meta: R$ 58.000"
                detailClass="font-medium text-on-surface-variant"
              />
              <Metric
                label="Pagamentos Pendentes"
                icon="warning"
                iconClass="text-error"
                value="19 alunos"
                valueClass="text-error"
                detail="R$ 4.830 em aberto"
                detailClass="text-error"
              />
            </div>

            <div className="grid grid-cols-1 gap-space-lg lg:grid-cols-2">
              <section className="flex flex-col justify-between rounded-xl bg-surface-container-low p-space-lg shadow-sm">
                <div className="flex items-center justify-between pb-space-md">
                  <div className="flex items-center gap-space-sm">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-container text-primary-fixed">
                      <span className="material-symbols-outlined text-[20px]">
                        schedule
                      </span>
                    </div>
                    <div>
                      <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                        Próximas Aulas
                      </h2>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        Grade selecionada de hoje
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="rounded-lg bg-surface-container px-space-md py-1 font-label-sm text-label-sm text-primary-fixed transition-colors hover:bg-surface-container-high"
                  >
                    Ver Grade
                  </button>
                </div>
                <div className="flex flex-col gap-space-sm">
                  {aulas.map((aula) => (
                    <div
                      key={aula.hora}
                      className="flex items-center justify-between rounded-lg bg-surface-container p-space-md"
                    >
                      <div className="flex items-center gap-space-md">
                        <span className="w-16 font-headline-sm text-headline-sm font-bold text-primary-fixed">
                          {aula.hora}
                        </span>
                        <div>
                          <span className="block font-label-lg text-label-lg font-bold text-on-surface">
                            {aula.nome}
                          </span>
                          <span className="font-body-sm text-body-sm text-on-surface-variant">
                            {aula.detalhe}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-space-sm py-0.5 font-label-sm text-label-sm font-bold uppercase ${vagaClass(aula.tom)}`}
                      >
                        {aula.vagas}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              <div className="flex flex-col gap-space-lg">
                <section className="flex flex-col rounded-xl bg-surface-container-low p-space-lg shadow-sm">
                  <div className="flex items-center justify-between pb-space-md">
                    <div className="flex items-center gap-space-sm">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-container text-tertiary-fixed-dim">
                        <span className="material-symbols-outlined text-[20px]">
                          medical_services
                        </span>
                      </div>
                      <div>
                        <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                          Avaliações Médicas
                        </h2>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">
                          Atenção prioritária
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="rounded-lg bg-surface-container px-space-md py-1 font-label-sm text-label-sm text-on-surface transition-colors hover:bg-surface-container-high"
                    >
                      Ver Todas (14)
                    </button>
                  </div>
                  <div className="flex flex-col gap-space-sm">
                    <div className="flex items-center justify-between rounded-lg bg-surface-container p-space-md">
                      <div className="flex items-center gap-space-md">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-container-high font-headline-sm font-bold text-on-surface">
                          JS
                        </div>
                        <div>
                          <span className="block font-label-lg text-label-lg font-bold text-on-surface">
                            Juliana Silva
                          </span>
                          <span className="font-body-sm text-body-sm font-medium text-error">
                            Bioimpedância • Vence amanhã
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="flex items-center gap-1 rounded-lg bg-surface-container-high px-space-sm py-1.5 font-label-sm text-label-sm text-on-surface transition-colors hover:bg-primary-fixed hover:text-on-primary-fixed"
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          notifications_active
                        </span>
                        <span>Notificar</span>
                      </button>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-surface-container p-space-md">
                      <div className="flex items-center gap-space-md">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-error-container/20 font-headline-sm font-bold text-error">
                          RC
                        </div>
                        <div>
                          <span className="block font-label-lg text-label-lg font-bold text-on-surface">
                            Rafael Costa
                          </span>
                          <span className="font-body-sm text-body-sm font-medium text-error">
                            Vencida há 1 dia (Bloqueado)
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="flex items-center gap-1 rounded-lg bg-error-container/30 px-space-sm py-1.5 font-label-sm text-label-sm text-error transition-colors hover:bg-error-container hover:text-on-error"
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          lock_open
                        </span>
                        <span>Liberar</span>
                      </button>
                    </div>
                  </div>
                </section>

                <section className="flex flex-col gap-space-md rounded-xl bg-surface-container-low p-space-lg shadow-sm">
                  <div>
                    <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                      Ações Rápidas
                    </h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Operações essenciais imediatas
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-space-sm sm:grid-cols-3">
                    <button
                      type="button"
                      className="flex h-12 items-center justify-center gap-2 rounded-lg bg-primary-fixed px-space-md font-label-lg text-label-lg font-bold text-on-primary-fixed shadow-sm transition-transform hover:bg-primary-fixed-dim active:scale-[0.98]"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        person_add
                      </span>
                      <span>Nova Matrícula</span>
                    </button>
                    <button
                      type="button"
                      className="flex h-12 items-center justify-center gap-2 rounded-lg bg-surface-container px-space-md font-label-lg text-label-lg text-on-surface transition-colors hover:bg-surface-container-high"
                    >
                      <span className="material-symbols-outlined text-[20px] text-secondary-fixed">
                        add_card
                      </span>
                      <span>Lançar Pagamento</span>
                    </button>
                    <button
                      type="button"
                      className="flex h-12 items-center justify-center gap-2 rounded-lg bg-surface-container px-space-md font-label-lg text-label-lg text-on-surface transition-colors hover:bg-surface-container-high"
                    >
                      <span className="material-symbols-outlined text-[20px] text-primary-fixed">
                        sensor_door
                      </span>
                      <span>Liberar Catraca</span>
                    </button>
                  </div>
                </section>
              </div>
            </div>

            <div className="flex flex-col items-center justify-between gap-space-md rounded-xl bg-surface-container-low p-space-md text-on-surface-variant shadow-sm md:flex-row">
              <div className="flex items-center gap-space-md">
                <div className="h-2.5 w-2.5 rounded-full bg-secondary-fixed" />
                <span className="font-body-sm text-body-sm">
                  Catracas operando em sincronia local • Último check-in há 2
                  minutos (Lucas R.)
                </span>
              </div>
              <div className="flex items-center gap-space-lg font-label-sm text-label-sm tracking-wider text-on-surface-variant uppercase">
                <span>Capacidade total: 600 alunos</span>
                <span>•</span>
                <span>Versão do Motor: APEX v2.4</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function Metric({
  label,
  icon,
  iconClass,
  value,
  valueClass = "text-on-surface",
  detail,
  detailClass,
  detailIcon,
}: {
  label: string;
  icon: string;
  iconClass: string;
  value: string;
  valueClass?: string;
  detail: string;
  detailClass: string;
  detailIcon?: string;
}) {
  return (
    <div className="flex flex-col justify-between rounded-xl bg-surface-container-low p-space-lg shadow-sm transition-colors hover:bg-surface-container">
      <div className="flex items-center justify-between">
        <span className="font-label-sm text-label-sm font-semibold tracking-wider text-on-surface-variant uppercase">
          {label}
        </span>
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg bg-surface-container ${iconClass}`}
        >
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
      </div>
      <div className="mt-space-md">
        <div
          className={`font-data-display text-data-display font-bold tracking-tight ${valueClass}`}
        >
          {value}
        </div>
        <div
          className={`mt-1 flex items-center gap-1 font-label-md text-label-md font-semibold ${detailClass}`}
        >
          {detailIcon ? (
            <span className="material-symbols-outlined text-[16px]">
              {detailIcon}
            </span>
          ) : null}
          <span>{detail}</span>
        </div>
      </div>
    </div>
  );
}
