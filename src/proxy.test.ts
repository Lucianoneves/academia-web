import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { getUser, from } = vi.hoisted(() => ({
  getUser: vi.fn(),
  from: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: { getUser },
    from,
  }),
}));

import { proxy } from "./proxy";

function pedido(caminho: string) {
  return new NextRequest(new URL(caminho, "http://localhost:3000"));
}

beforeEach(() => {
  getUser.mockReset();
  from.mockReset();
});

describe("proxy do painel", () => {
  it("redireciona /painel e /painel/alunos quando não há sessão", async () => {
    getUser.mockResolvedValue({ data: { user: null } });

    for (const caminho of ["/painel", "/painel/alunos"]) {
      const resposta = await proxy(pedido(caminho));
      expect(resposta.status).toBe(307);
      expect(new URL(resposta.headers.get("location")!).pathname).toBe(
        "/login"
      );
    }

    expect(from).not.toHaveBeenCalled();
  });

  it("deixa passar usuário autenticado sem consultar administrators", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const resposta = await proxy(pedido("/painel/alunos"));

    expect(resposta.status).toBe(200);
    expect(resposta.headers.get("location")).toBeNull();
    expect(from).not.toHaveBeenCalled();
  });
});
