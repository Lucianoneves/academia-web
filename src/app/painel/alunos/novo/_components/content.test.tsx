/**
 * @vitest-environment happy-dom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import type { PlanoEscolha } from "../../../../../lib/plano-escolha";

const { criarAluno } = vi.hoisted(() => ({
  criarAluno: vi.fn(),
}));

vi.mock("../_actions/criar-aluno", () => ({
  criarAluno,
}));

import { CadastroAluno } from "./content";

const plano: PlanoEscolha = {
  kind: "mensal",
  nome: "Mensal",
  precoCentavos: 15000,
  ativo: true,
};

const preenchido = {
  nome: "Ana Silva",
  nascimento: "2000-01-02",
  telefone: "11987654321",
  email: "ana@firma.com",
  peso: "78.4",
  altura: "1.60",
  plano: "mensal",
  restricoes: "joelho",
};

let raiz: Root | null = null;
let container: HTMLDivElement | null = null;

function valor(nome: string) {
  const campo = container?.querySelector(`[name="${nome}"]`);
  if (
    campo instanceof HTMLInputElement ||
    campo instanceof HTMLTextAreaElement ||
    campo instanceof HTMLSelectElement
  ) {
    return campo.value;
  }
  return null;
}

function definir(
  campo: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  texto: string
) {
  const prototipo =
    campo instanceof HTMLSelectElement
      ? HTMLSelectElement.prototype
      : campo instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(prototipo, "value")?.set?.call(campo, texto);
  campo.dispatchEvent(new Event("input", { bubbles: true }));
  campo.dispatchEvent(new Event("change", { bubbles: true }));
}

async function preencher(campos: Record<string, string>) {
  await act(async () => {
    for (const [nome, texto] of Object.entries(campos)) {
      const campo = container?.querySelector(`[name="${nome}"]`);
      if (
        campo instanceof HTMLInputElement ||
        campo instanceof HTMLTextAreaElement ||
        campo instanceof HTMLSelectElement
      ) {
        definir(campo, texto);
      }
    }
  });
}

async function mostrar(planos: PlanoEscolha[], planosErro: string | null) {
  container = document.createElement("div");
  document.body.appendChild(container);
  raiz = createRoot(container);
  await act(async () => {
    raiz?.render(<CadastroAluno planos={planos} planosErro={planosErro} />);
  });
}

async function enviar() {
  const formulario = container?.querySelector("form");
  await act(async () => {
    formulario?.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true })
    );
  });
}

beforeEach(() => {
  criarAluno.mockReset();
});

afterEach(() => {
  raiz?.unmount();
  container?.remove();
  raiz = null;
  container = null;
});

describe("formulário de cadastro", () => {
  it("esvazia os campos a cada sucesso com stamp novo", async () => {
    let stamp = 0;
    criarAluno.mockImplementation(async () => ({
      success: true,
      message: "Aluno cadastrado. Você pode incluir outro.",
      stamp: ++stamp,
    }));

    await mostrar([plano], null);
    await preencher(preenchido);
    await enviar();

    expect(criarAluno).toHaveBeenCalledTimes(1);
    expect(valor("nome")).toBe("");
    expect(valor("telefone")).toBe("");
    expect(valor("email")).toBe("");
    expect(valor("plano")).toBe("");

    await preencher({ ...preenchido, nome: "Bruno Lima" });
    expect(valor("nome")).toBe("Bruno Lima");
    await enviar();

    expect(criarAluno).toHaveBeenCalledTimes(2);
    expect(valor("nome")).toBe("");
    expect(valor("telefone")).toBe("");
  });

  it("não envia quando a lista de planos vem vazia", async () => {
    await mostrar([], null);
    await preencher({
      nome: preenchido.nome,
      nascimento: preenchido.nascimento,
      telefone: preenchido.telefone,
      peso: preenchido.peso,
      altura: preenchido.altura,
    });
    await enviar();

    expect(criarAluno).not.toHaveBeenCalled();
  });

  it("não envia quando a consulta de planos falha", async () => {
    await mostrar([plano], "Não foi possível carregar os planos.");
    await preencher({
      nome: preenchido.nome,
      nascimento: preenchido.nascimento,
      telefone: preenchido.telefone,
      peso: preenchido.peso,
      altura: preenchido.altura,
    });
    await enviar();

    expect(criarAluno).not.toHaveBeenCalled();
  });
});
