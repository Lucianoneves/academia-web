import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loginReiniciarContadores } from "@/lib/login-limite";
import type { FormState } from "@/lib/validacao";

const RECUSA = "Não foi possível entrar. Confira os dados e tente de novo.";
const MUITAS = "Muitas tentativas. Espere alguns minutos e tente de novo.";
const estado: FormState = { success: false };
const JANELA_MS = 15 * 60 * 1000;

const {
  signInWithPassword,
  getUser,
  signOut,
  maybeSingle,
  filtro,
  consultas,
  cabecalho,
} = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  getUser: vi.fn(),
  signOut: vi.fn(),
  maybeSingle: vi.fn(),
  filtro: vi.fn(),
  consultas: [] as string[],
  cabecalho: { encaminhado: "203.0.113.10" },
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
}));

vi.mock("next/headers", () => ({
  headers: async () =>
    new Headers(
      cabecalho.encaminhado ? { "x-forwarded-for": cabecalho.encaminhado } : {}
    ),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSessionClient: async () => ({
    auth: {
      signInWithPassword,
      getUser,
      signOut,
    },
    from(tabela: string) {
      consultas.push(tabela);
      return {
        select() {
          return {
            eq(coluna: string, valor: string) {
              filtro(coluna, valor);
              return { maybeSingle };
            },
          };
        },
      };
    },
  }),
}));

import { entrar } from "./entrar";

function formulario(email: string, senha: string) {
  const dados = new FormData();
  dados.set("email", email);
  dados.set("senha", senha);
  return dados;
}

function tentar(email: string, senha = "errada") {
  return entrar(estado, formulario(email, senha));
}

function senhaRecusada() {
  signInWithPassword.mockResolvedValue({
    error: { message: "Invalid login credentials" },
  });
}

function administradorValido(id = "adm-1") {
  signInWithPassword.mockResolvedValue({ error: null });
  getUser.mockResolvedValue({ data: { user: { id } } });
  maybeSingle.mockResolvedValue({ data: { id }, error: null });
}

beforeEach(() => {
  loginReiniciarContadores();
  consultas.length = 0;
  cabecalho.encaminhado = "203.0.113.10";
  signInWithPassword.mockReset();
  getUser.mockReset();
  signOut.mockReset();
  maybeSingle.mockReset();
  filtro.mockReset();
  signOut.mockResolvedValue(undefined);
  senhaRecusada();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("entrar", () => {
  it("redireciona ao painel só depois de confirmar o administrador", async () => {
    const passos: string[] = [];
    signInWithPassword.mockImplementation(async () => {
      passos.push("signIn");
      return { error: null };
    });
    getUser.mockImplementation(async () => {
      passos.push("getUser");
      return { data: { user: { id: "adm-1" } } };
    });
    maybeSingle.mockImplementation(async () => {
      passos.push("administrators");
      return { data: { id: "adm-1" }, error: null };
    });

    await expect(tentar(" Ana@Firma.com ", "certa")).rejects.toThrow(
      "NEXT_REDIRECT:/painel"
    );

    expect(passos).toEqual(["signIn", "getUser", "administrators"]);
    expect(signInWithPassword).toHaveBeenCalledWith({
      email: "ana@firma.com",
      password: "certa",
    });
    expect(filtro).toHaveBeenCalledWith("id", "adm-1");
    expect(consultas).toEqual(["administrators"]);
    expect(signOut).not.toHaveBeenCalled();
  });

  it("zera o balde do e-mail depois da entrada válida", async () => {
    senhaRecusada();
    for (let vez = 0; vez < 4; vez += 1) {
      expect((await tentar("ana@firma.com")).message).toBe(RECUSA);
    }

    administradorValido();
    await expect(tentar("ana@firma.com", "certa")).rejects.toThrow(
      "NEXT_REDIRECT:/painel"
    );

    senhaRecusada();
    signInWithPassword.mockClear();
    for (let vez = 0; vez < 5; vez += 1) {
      expect((await tentar("ana@firma.com")).message).toBe(RECUSA);
    }
    expect(signInWithPassword).toHaveBeenCalledTimes(5);

    signInWithPassword.mockClear();
    expect((await tentar("ana@firma.com", "certa")).message).toBe(MUITAS);
    expect(signInWithPassword).not.toHaveBeenCalled();
  });

  it("zera o balde do IP depois da entrada válida", async () => {
    for (let vez = 0; vez < 14; vez += 1) {
      expect((await tentar(`antes-${vez}@firma.com`)).message).toBe(RECUSA);
    }

    administradorValido();
    await expect(tentar("ana@firma.com", "certa")).rejects.toThrow(
      "NEXT_REDIRECT:/painel"
    );

    senhaRecusada();
    signInWithPassword.mockClear();
    for (let vez = 0; vez < 15; vez += 1) {
      expect((await tentar(`depois-${vez}@firma.com`)).message).toBe(RECUSA);
    }
    expect(signInWithPassword).toHaveBeenCalledTimes(15);
  });

  it("recusa senha errada sem abrir sessão", async () => {
    const resultado = await tentar("ana@firma.com", "errada");

    expect(resultado).toEqual({ success: false, message: RECUSA });
    expect(signOut).not.toHaveBeenCalled();
    expect(consultas).toEqual([]);
  });

  it("encerra a sessão de quem autentica e não é administrador", async () => {
    signInWithPassword.mockResolvedValue({ error: null });
    getUser.mockResolvedValue({ data: { user: { id: "user-2" } } });
    maybeSingle.mockResolvedValue({ data: null, error: null });

    const resultado = await tentar("visitante@firma.com", "certa");

    expect(resultado).toEqual({ success: false, message: RECUSA });
    expect(signOut).toHaveBeenCalledOnce();
    expect(filtro).toHaveBeenCalledWith("id", "user-2");
  });

  it("encerra a sessão quando o provedor não devolve o usuário", async () => {
    signInWithPassword.mockResolvedValue({ error: null });
    getUser.mockResolvedValue({ data: { user: null } });

    const resultado = await tentar("ana@firma.com", "certa");

    expect(resultado).toEqual({ success: false, message: RECUSA });
    expect(signOut).toHaveBeenCalledOnce();
    expect(consultas).toEqual([]);
  });

  it("encerra a sessão quando a consulta de administrador falha", async () => {
    signInWithPassword.mockResolvedValue({ error: null });
    getUser.mockResolvedValue({ data: { user: { id: "adm-1" } } });
    maybeSingle.mockResolvedValue({
      data: null,
      error: { message: "falha de leitura" },
    });

    const resultado = await tentar("ana@firma.com", "certa");

    expect(resultado).toEqual({ success: false, message: RECUSA });
    expect(signOut).toHaveBeenCalledOnce();
  });

  it("usa a mesma recusa para senha, permissão e usuário ausente", async () => {
    const senhaErrada = await tentar("ana@firma.com");

    signInWithPassword.mockResolvedValue({ error: null });
    getUser.mockResolvedValue({ data: { user: { id: "user-2" } } });
    maybeSingle.mockResolvedValue({ data: null, error: null });
    const semLinha = await tentar("visitante@firma.com", "certa");

    getUser.mockResolvedValue({ data: { user: null } });
    const semUsuario = await tentar("ana@firma.com", "certa");

    expect([senhaErrada.message, semLinha.message, semUsuario.message]).toEqual(
      [RECUSA, RECUSA, RECUSA]
    );
  });

  it("bloqueia a sexta falha do mesmo e-mail sem consultar o provedor", async () => {
    for (let vez = 0; vez < 5; vez += 1) {
      expect((await tentar("ana@firma.com")).message).toBe(RECUSA);
    }
    expect(signInWithPassword).toHaveBeenCalledTimes(5);

    administradorValido();
    signInWithPassword.mockClear();
    expect((await tentar("ana@firma.com", "certa")).message).toBe(MUITAS);
    expect((await tentar("ana@firma.com", "certa")).message).toBe(MUITAS);
    expect(signInWithPassword).not.toHaveBeenCalled();
  });

  it("bloqueia o IP na décima sexta falha e deixa outro e-mail passar antes disso", async () => {
    for (let vez = 0; vez < 5; vez += 1) {
      expect((await tentar("ana@firma.com")).message).toBe(RECUSA);
    }

    signInWithPassword.mockClear();
    expect((await tentar("ana@firma.com")).message).toBe(MUITAS);
    expect(signInWithPassword).not.toHaveBeenCalled();

    senhaRecusada();
    expect((await tentar("outro@firma.com")).message).toBe(RECUSA);
    expect(signInWithPassword).toHaveBeenCalledOnce();

    for (let vez = 0; vez < 9; vez += 1) {
      expect((await tentar(`ip-${vez}@firma.com`)).message).toBe(RECUSA);
    }

    administradorValido();
    signInWithPassword.mockClear();
    expect((await tentar("novo@firma.com", "certa")).message).toBe(MUITAS);
    expect(signInWithPassword).not.toHaveBeenCalled();
  });

  it("reabre a janela 15 minutos depois da primeira falha", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const inicio = new Date("2026-10-21T15:00:00.000Z");
    vi.setSystemTime(inicio);

    for (let vez = 0; vez < 5; vez += 1) {
      expect((await tentar("ana@firma.com")).message).toBe(RECUSA);
    }

    vi.setSystemTime(inicio.getTime() + JANELA_MS - 1);
    signInWithPassword.mockClear();
    administradorValido();
    expect((await tentar("ana@firma.com", "certa")).message).toBe(MUITAS);
    expect(signInWithPassword).not.toHaveBeenCalled();

    vi.setSystemTime(inicio.getTime() + JANELA_MS);
    senhaRecusada();
    for (let vez = 0; vez < 5; vez += 1) {
      expect((await tentar("ana@firma.com")).message).toBe(RECUSA);
    }
    expect(signInWithPassword).toHaveBeenCalledTimes(5);

    signInWithPassword.mockClear();
    expect((await tentar("ana@firma.com", "certa")).message).toBe(MUITAS);
    expect(signInWithPassword).not.toHaveBeenCalled();
  });

  it("normaliza o e-mail e preserva a senha", async () => {
    await tentar(" Admin@Firma.com ", " senha ");

    expect(signInWithPassword).toHaveBeenCalledWith({
      email: "admin@firma.com",
      password: " senha ",
    });

    for (let vez = 0; vez < 4; vez += 1) {
      expect((await tentar("admin@firma.com")).message).toBe(RECUSA);
    }

    administradorValido();
    signInWithPassword.mockClear();
    expect((await tentar(" admin@firma.com ", "certa")).message).toBe(MUITAS);
    expect(signInWithPassword).not.toHaveBeenCalled();
  });

  it("não conta formulário inválido como tentativa", async () => {
    const semEmail = await tentar("", "segredo");
    const emailInvalido = await tentar("sem-arroba", "segredo");
    const semSenha = await tentar("ana@firma.com", "");

    expect(semEmail.errors?.email?.[0]).toBe("Informe o e-mail.");
    expect(emailInvalido.errors?.email?.[0]).toBe("Informe um e-mail válido.");
    expect(semSenha.errors?.senha?.[0]).toBe("Informe a senha.");
    expect(signInWithPassword).not.toHaveBeenCalled();

    for (let vez = 0; vez < 10; vez += 1) {
      await tentar("sem-arroba", "segredo");
    }

    const falha = await tentar("ana@firma.com", "errada");
    expect(falha.message).toBe(RECUSA);
    expect(signInWithPassword).toHaveBeenCalledOnce();
  });
});
