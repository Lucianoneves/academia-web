import { afterEach, describe, expect, it, vi } from "vitest";
import { authCookieOptions } from "./env";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("authCookieOptions", () => {
  it("protege o cookie fora de development", () => {
    vi.stubEnv("NODE_ENV", "production");

    expect(authCookieOptions()).toEqual({
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
    });
  });

  it("deixa secure desligado em development", () => {
    vi.stubEnv("NODE_ENV", "development");

    expect(authCookieOptions()).toEqual({
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
    });
  });
});
