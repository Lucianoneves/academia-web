import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUser, maybeSingle } = vi.hoisted(() => ({
  getUser: vi.fn(),
  maybeSingle: vi.fn(),
}));

vi.mock("next/server", () => ({
  connection: async () => {},
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createSessionClient: async () => ({
    auth: { getUser },
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle }),
      }),
    }),
  }),
  createAnonClient: () => ({}),
}));

import { requireAdmin } from "./auth";

beforeEach(() => {
  getUser.mockReset();
  maybeSingle.mockReset();
});

describe("requireAdmin", () => {
  it("envia quem não tem sessão para o login", async () => {
    getUser.mockResolvedValue({ data: { user: null } });

    await expect(requireAdmin()).rejects.toThrow("NEXT_REDIRECT:/login");
    expect(maybeSingle).not.toHaveBeenCalled();
  });

  it("encerra a sessão quando não há linha de administrador", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-2" } } });
    maybeSingle.mockResolvedValue({ data: null, error: null });

    await expect(requireAdmin()).rejects.toThrow(
      "NEXT_REDIRECT:/acesso/encerrar"
    );
  });

  it("encerra a sessão quando a consulta de administrador falha", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "adm-1" } } });
    maybeSingle.mockResolvedValue({
      data: null,
      error: { message: "falha de leitura" },
    });

    await expect(requireAdmin()).rejects.toThrow(
      "NEXT_REDIRECT:/acesso/encerrar"
    );
  });

  it("devolve o administrador confirmado", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "adm-1" } } });
    maybeSingle.mockResolvedValue({
      data: { id: "adm-1", name: "Ana" },
      error: null,
    });

    await expect(requireAdmin()).resolves.toEqual({
      id: "adm-1",
      name: "Ana",
    });
  });
});
