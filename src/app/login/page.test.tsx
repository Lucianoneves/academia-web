/**
 * @vitest-environment happy-dom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import { act, ReactNode } from "react";

const { administradorExiste, administradorDaEntrada } = vi.hoisted(() => ({
  administradorExiste: vi.fn(),
  administradorDaEntrada: vi.fn(),
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
  administradorDaEntrada,
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
  administradorDaEntrada.mockReset();
  administradorDaEntrada.mockResolvedValue({
    nome: "Ana Souza",
    email: "ana@academia.com",
  });
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
    expect(container?.textContent).toContain("Ana Souza");
    expect(container?.textContent).toContain("ana@academia.com");
    expect(container?.textContent).toContain("AS");
    expect(container?.textContent).not.toContain("Carlos Eduardo");
  });

  it("mostra o cadastro quando ainda não existe administrador", async () => {
    administradorExiste.mockResolvedValue(false);

    await mostrar();

    const link = container?.querySelector('a[href="/"]');
    expect(link?.textContent).toBe("Fazer Cadastro");
    expect(administradorDaEntrada).not.toHaveBeenCalled();
    expect(container?.textContent).not.toContain("Ana Souza");
  });

  it("continua no login sem o link quando a consulta do cadastro falha", async () => {
    administradorExiste.mockRejectedValue(new Error("falha"));

    await mostrar();

    expect(container?.textContent).toContain("ENTRAR NO SISTEMA");
    expect(container?.textContent).not.toContain("Fazer Cadastro");
  });
});
