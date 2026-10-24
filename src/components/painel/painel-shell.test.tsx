/**
 * @vitest-environment happy-dom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import { act, type ReactNode } from "react";

const navegacao = vi.hoisted(() => ({
  caminho: "/painel",
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    onClick,
    ...resto
  }: {
    href: string;
    children: ReactNode;
    onClick?: () => void;
    className?: string;
    "aria-current"?: "page";
  }) => {
    const { createElement } = require("react") as typeof import("react");
    return createElement("a", { href, onClick, ...resto }, children);
  },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navegacao.caminho,
}));

vi.mock("@/components/painel/form-sair", () => ({
  FormSair: () => {
    const { createElement } = require("react") as typeof import("react");
    return createElement(
      "button",
      { type: "submit", title: "Sair do Sistema" },
      "Sair"
    );
  },
}));

import { PainelShell } from "./painel-shell";

let raiz: Root | null = null;
let container: HTMLDivElement | null = null;
let larga = false;
let aoMudarTela: (() => void) | null = null;

function classes(elemento: Element) {
  return elemento.className.split(/\s+/);
}

function instalarTela() {
  aoMudarTela = null;
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      get matches() {
        return larga;
      },
      media: query,
      onchange: null,
      addEventListener: (_tipo: string, fn: () => void) => {
        aoMudarTela = fn;
      },
      removeEventListener: () => {
        aoMudarTela = null;
      },
      addListener() {},
      removeListener() {},
      dispatchEvent() {
        return true;
      },
    }),
  });
}

function botao(nome: string) {
  return [...(container?.querySelectorAll("button") ?? [])].find(
    (item) => item.getAttribute("aria-label") === nome
  );
}

function gaveta() {
  const menu = container?.querySelector("aside");
  if (!(menu instanceof HTMLElement)) throw new Error("menu ausente");
  return menu;
}

async function desenhar() {
  await act(async () => {
    raiz?.render(
      <PainelShell adminName="Ana Souza" area="inicio">
        <p>Conteúdo</p>
      </PainelShell>
    );
  });
}

async function mostrar() {
  container = document.createElement("div");
  document.body.appendChild(container);
  raiz = createRoot(container);
  await desenhar();
}

async function clicar(elemento: Element | null | undefined) {
  await act(async () => {
    elemento?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

async function teclar(key: string, extra?: KeyboardEventInit) {
  await act(async () => {
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key, bubbles: true, ...extra })
    );
  });
}

beforeEach(() => {
  navegacao.caminho = "/painel";
  larga = false;
  instalarTela();
});

afterEach(() => {
  raiz?.unmount();
  container?.remove();
  raiz = null;
  container = null;
  document.body.style.overflow = "";
  document.documentElement.style.overflow = "";
});

describe("casco do painel no celular", () => {
  it("começa fechado e esconde unidade, sino e avatar", async () => {
    await mostrar();

    expect(classes(gaveta())).toContain("hidden");
    expect(classes(gaveta())).toContain("md:flex");
    expect(classes(gaveta())).toContain("max-w-[85%]");
    expect(botao("Abrir menu")?.className).toContain("md:hidden");
    expect(botao("Abrir menu")?.getAttribute("aria-expanded")).toBe("false");

    const unidade = [...(container?.querySelectorAll("span") ?? [])].find(
      (item) => item.textContent === "Unidade Principal"
    );
    expect(classes(unidade?.parentElement as Element)).toEqual(
      expect.arrayContaining(["hidden", "md:flex"])
    );
    expect(classes(botao("Notificações")?.parentElement as Element)).toEqual(
      expect.arrayContaining(["hidden", "md:block"])
    );
    expect(container?.querySelector("[title='Sair do Sistema']")).toBeTruthy();
    expect(container?.textContent).toContain("Conteúdo");
    expect(container?.querySelector("header")?.className).toContain("left-0");
    expect(
      container?.querySelector("main")?.parentElement?.className
    ).toContain("md:pl-72");
    expect(document.body.style.overflow).toBe("");
  });

  it("abre a gaveta com o nome sob o logo e trava o fundo", async () => {
    await mostrar();
    await clicar(botao("Abrir menu"));

    const menu = gaveta();
    expect(classes(menu)).toContain("flex");
    expect(classes(menu)).not.toContain("hidden");
    expect(menu.getAttribute("role")).toBe("dialog");
    expect(document.activeElement).toBe(botao("Recolher menu"));
    expect(document.body.style.overflow).toBe("hidden");

    const nome = [...menu.querySelectorAll("span")].find(
      (item) => item.textContent === "Ana Souza"
    );
    expect(nome?.parentElement?.className).toContain("md:hidden");
    expect(nome?.parentElement?.textContent).toContain("Administrador");
    expect(
      menu.querySelector("nav")?.parentElement?.contains(nome as Node)
    ).toBe(false);
    expect(menu.querySelector("nav")?.parentElement?.className).toContain(
      "overflow-y-auto"
    );

    const catracas = [...menu.querySelectorAll("span")].find(
      (item) => item.textContent === "Status Catracas"
    );
    expect(
      menu.querySelector("nav")?.parentElement?.contains(catracas as Node)
    ).toBe(false);

    const fundo = menu.previousElementSibling;
    expect(fundo?.getAttribute("aria-hidden")).toBe("true");
    expect(fundo?.className).toContain("bg-black/60");
    expect(
      container?.querySelector("main")?.parentElement?.hasAttribute("inert")
    ).toBe(true);
  });

  it("fecha ao tocar o item atual, outro item, o fundo, recolher ou Esc", async () => {
    await mostrar();

    await clicar(botao("Abrir menu"));
    await clicar(container?.querySelector('a[aria-current="page"]'));
    expect(classes(gaveta())).toContain("hidden");
    expect(document.activeElement).toBe(botao("Abrir menu"));

    await clicar(botao("Abrir menu"));
    await clicar(container?.querySelector('a[href="/painel/planos"]'));
    expect(classes(gaveta())).toContain("hidden");

    await clicar(botao("Abrir menu"));
    await clicar(gaveta().previousElementSibling);
    expect(classes(gaveta())).toContain("hidden");

    await clicar(botao("Abrir menu"));
    await clicar(botao("Recolher menu"));
    expect(classes(gaveta())).toContain("hidden");

    await clicar(botao("Abrir menu"));
    await teclar("Escape");
    expect(classes(gaveta())).toContain("hidden");
    expect(document.body.style.overflow).toBe("");
    expect(
      container?.querySelector("main")?.parentElement?.hasAttribute("inert")
    ).toBe(false);
  });

  it("mantém o recolher sem ação em tela larga e fecha ao cruzar md", async () => {
    await mostrar();
    await clicar(botao("Abrir menu"));

    larga = true;
    await clicar(botao("Recolher menu"));
    expect(gaveta().getAttribute("role")).toBe("dialog");

    await act(async () => {
      aoMudarTela?.();
    });

    expect(classes(gaveta())).toContain("hidden");
    expect(classes(gaveta())).toContain("md:flex");
    expect(gaveta().getAttribute("role")).toBeNull();
    expect(document.body.style.overflow).toBe("");
    expect(document.activeElement).not.toBe(botao("Abrir menu"));
  });

  it("prende o Tab na gaveta e fecha quando a rota muda", async () => {
    await mostrar();
    await clicar(botao("Abrir menu"));

    const links = [...gaveta().querySelectorAll("a")];
    await act(async () => {
      links.at(-1)?.focus();
    });
    await teclar("Tab");
    expect(document.activeElement).toBe(botao("Recolher menu"));

    await act(async () => {
      botao("Recolher menu")?.focus();
    });
    await teclar("Tab", { shiftKey: true });
    expect(document.activeElement).toBe(links.at(-1));

    navegacao.caminho = "/painel/agenda";
    await desenhar();
    expect(classes(gaveta())).toContain("hidden");
  });
});
