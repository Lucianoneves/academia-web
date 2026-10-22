import { beforeEach, describe, expect, it, vi } from "vitest";

const { signOut } = vi.hoisted(() => ({
  signOut: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createSessionClient: async () => ({
    auth: { signOut },
  }),
}));

import { sair } from "./sair";

beforeEach(() => {
  signOut.mockReset();
  signOut.mockResolvedValue(undefined);
});

describe("sair", () => {
  it("encerra a sessão e volta ao login", async () => {
    await expect(sair()).rejects.toThrow("NEXT_REDIRECT:/login");
    expect(signOut).toHaveBeenCalledOnce();
  });
});
