/**
 * @vitest-environment happy-dom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import { act, ReactNode } from "react";

const { administradorExiste } = vi.hoisted(() => ({
  administradorExiste: vi.fn(),
}));

vi.mock("next/server", () => ({
  connection: async () => {},
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: unknown }) => {
    const { createElement } = require("react") as typeof import("react");
    return createElement("a", { href }, children as ReactNode);
  },
}));

vi.mock("@/components/progresso-navegacao", () => ({
  useBarraNaTroca: () => () => {},
}));

vi.mock("@/lib/auth", () => ({
  administradorExiste,
}));

import { LoginConteudo } from "./page";

let raiz: Root | null = null;
let container: HTMLDivElement | null = null;

async function mostrar() {
  const elemento = await LoginConteudo({
    searchParams: Promise.resolve({}),
  });
  container = document.createElement("div");
  document.body.appendChild(container);
  raiz = createRoot(container);
  await act(async () => {
    raiz?.render(elemento);
  });
}

beforeEach(() => {
  administradorExiste.mockReset();
  administradorExiste.mockResolvedValue(true);
});

afterEach(() => {
  raiz?.unmount();
  container?.remove();
  raiz = null;
  container = null;
});

describe("página de login", () => {
  it("mostra o formulário de entrada antes do painel", async () => {
    await mostrar();

    expect(container?.textContent).toContain("ENTRAR NO SISTEMA");
    expect(container?.textContent).toContain("Login do Administrador");
  });

  it("mostra o cadastro quando ainda não existe administrador", async () => {
    administradorExiste.mockResolvedValue(false);

    await mostrar();

    const link = container?.querySelector('a[href="/"]');
    expect(link?.textContent).toBe("Fazer Cadastro");
  });

  it("continua no login sem o link quando a consulta do cadastro falha", async () => {
    administradorExiste.mockRejectedValue(new Error("falha"));

    await mostrar();

    expect(container?.textContent).toContain("ENTRAR NO SISTEMA");
    expect(container?.textContent).not.toContain("Fazer Cadastro");
  });
});
