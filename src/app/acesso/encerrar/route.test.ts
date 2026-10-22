import { beforeEach, describe, expect, it, vi } from "vitest";

const { signOut } = vi.hoisted(() => ({
  signOut: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSessionClient: async () => ({
    auth: { signOut },
  }),
}));

import { GET } from "./route";

beforeEach(() => {
  signOut.mockReset();
  signOut.mockResolvedValue(undefined);
});

describe("encerrar sessão", () => {
  it("sai e volta ao login", async () => {
    const resposta = await GET(
      new Request("http://localhost:3000/acesso/encerrar")
    );

    expect(signOut).toHaveBeenCalledOnce();
    expect(resposta.status).toBe(307);
    expect(new URL(resposta.headers.get("location")!).pathname).toBe("/login");
  });
});
