import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { FormState } from "@/lib/validacao";

const FALHA = "Não foi possível salvar o aluno. Tente de novo.";
const estado: FormState = { success: false };

const { getUser, maybeSingle, insert, tabelas, criarUsuario, revalidatePath } =
  vi.hoisted(() => ({
    getUser: vi.fn(),
    maybeSingle: vi.fn(),
    insert: vi.fn(),
    tabelas: [] as string[],
    criarUsuario: vi.fn(),
    revalidatePath: vi.fn(),
  }));

vi.mock("next/cache", () => ({
  revalidatePath,
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
    auth: {
      getUser,
      admin: { createUser: criarUsuario },
    },
    from(tabela: string) {
      tabelas.push(tabela);
      return {
        select() {
          return {
            eq() {
              return { maybeSingle };
            },
          };
        },
        insert,
      };
    },
  }),
  createAnonClient: () => ({}),
}));

import { criarAluno } from "./criar-aluno";

function formulario(campos: Record<string, string> = {}) {
  const dados = new FormData();
  const base: Record<string, string> = {
    nome: " Ana Silva ",
    nascimento: "2000-01-02",
    telefone: "11 98765-4321",
    peso: "78,4",
    altura: "1,60",
    plano: "mensal",
    restricoes: " joelho ",
    email: " Ana@Firma.com ",
    ...campos,
  };

  for (const [chave, valor] of Object.entries(base)) {
    dados.set(chave, valor);
  }

  return dados;
}

function gravar(campos: Record<string, string> = {}) {
  return criarAluno(estado, formulario(campos));
}

function administrador() {
  getUser.mockResolvedValue({ data: { user: { id: "adm-1" } } });
  maybeSingle.mockResolvedValue({ data: { id: "adm-1", name: "Ana" } });
}

beforeEach(() => {
  tabelas.length = 0;
  getUser.mockReset();
  maybeSingle.mockReset();
  insert.mockReset();
  criarUsuario.mockReset();
  revalidatePath.mockClear();
  administrador();
  insert.mockResolvedValue({ error: null });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("criarAluno", () => {
  it("não grava sem sessão", async () => {
    getUser.mockResolvedValue({ data: { user: null } });

    await expect(criarAluno(estado, new FormData())).rejects.toThrow(
      "NEXT_REDIRECT:/login"
    );
    expect(insert).not.toHaveBeenCalled();
    expect(tabelas).not.toContain("students");
  });

  it("não grava sessão que não é administrador", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-2" } } });
    maybeSingle.mockResolvedValue({ data: null });

    await expect(criarAluno(estado, new FormData())).rejects.toThrow(
      "NEXT_REDIRECT:/acesso/encerrar"
    );
    expect(insert).not.toHaveBeenCalled();
    expect(tabelas).not.toContain("students");
  });

  it("grava o aluno normalizado só depois do insert sem erro", async () => {
    const resultado = await gravar();
    const gravado = insert.mock.calls[0][0];

    expect(resultado.success).toBe(true);
    expect(gravado).toEqual({
      name: "Ana Silva",
      birth_date: "2000-01-02",
      phone: "11987654321",
      weight_kg: 78.4,
      height_cm: 160,
      chosen_plan: "mensal",
      medical_restrictions: "joelho",
      email: "ana@firma.com",
    });
    expect(gravado).not.toHaveProperty("id");
    expect(gravado).not.toHaveProperty("active");
    expect(gravado).not.toHaveProperty("stripe_customer_id");
    expect(revalidatePath.mock.calls.map(([caminho]) => caminho)).toEqual([
      "/painel",
      "/painel/alunos",
      "/painel/pagamentos",
    ]);
  });

  it("converte altura de metros para centímetros", async () => {
    await gravar({ altura: "1,60" });
    await gravar({ altura: "1.60" });
    await gravar({ altura: "1.15" });

    expect(insert.mock.calls.map((chamada) => chamada[0].height_cm)).toEqual([
      160, 160, 115,
    ]);
  });

  it("trata o telefone mascarado e o número puro como o mesmo cadastro", async () => {
    insert.mockResolvedValueOnce({ error: null });
    insert.mockResolvedValueOnce({
      error: {
        code: "23505",
        message:
          'duplicate key value violates unique constraint "students_phone_digits_uidx"',
      },
    });

    const primeiro = await gravar({ telefone: "11 98765-4321" });
    const segundo = await gravar({ telefone: "11987654321" });

    expect(primeiro.success).toBe(true);
    expect(insert.mock.calls.map((chamada) => chamada[0].phone)).toEqual([
      "11987654321",
      "11987654321",
    ]);
    expect(segundo).toEqual({
      success: false,
      errors: { telefone: ["Este telefone já está cadastrado."] },
    });
  });

  it("grava e-mail vazio como nulo e permite repetir", async () => {
    const vazio = await gravar({ email: "" });
    const espaco = await gravar({ email: "   " });

    expect(vazio.success).toBe(true);
    expect(espaco.success).toBe(true);
    expect(insert.mock.calls.map((chamada) => chamada[0].email)).toEqual([
      null,
      null,
    ]);
  });

  it("grava o e-mail em minúsculas e recusa a repetição no campo e-mail", async () => {
    insert.mockResolvedValueOnce({ error: null });
    insert.mockResolvedValueOnce({
      error: {
        code: "23505",
        message:
          'duplicate key value violates unique constraint "students_email_uidx"',
      },
    });

    const primeiro = await gravar({ email: "Ana@Firma.com" });
    const segundo = await gravar({ email: "ana@firma.com" });

    expect(primeiro.success).toBe(true);
    expect(insert.mock.calls[0][0].email).toBe("ana@firma.com");
    expect(segundo).toEqual({
      success: false,
      errors: { email: ["Este e-mail já está cadastrado."] },
    });
  });

  it("usa o dia de São Paulo, não o dia UTC, como corte do nascimento", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-22T02:30:00.000Z"));

    const hoje = await gravar({ nascimento: "2026-10-21" });
    const diaUtc = await gravar({ nascimento: "2026-10-22" });
    const ontem = await gravar({ nascimento: "2026-10-20" });

    expect(hoje.success).toBe(false);
    expect(hoje.errors?.nascimento?.[0]).toBe(
      "A data de nascimento deve ser anterior a hoje."
    );
    expect(diaUtc.success).toBe(false);
    expect(diaUtc.errors?.nascimento?.[0]).toBe(
      "A data de nascimento deve ser anterior a hoje."
    );
    expect(ontem.success).toBe(true);
    expect(insert).toHaveBeenCalledTimes(1);
    expect(insert.mock.calls[0][0].birth_date).toBe("2026-10-20");
  });

  it("grava o plano escolhido sem lançar pagamento, avaliação ou login", async () => {
    const resultado = await gravar({ plano: "mensal" });

    expect(resultado.success).toBe(true);
    expect(insert.mock.calls[0][0].chosen_plan).toBe("mensal");
    expect(tabelas).toEqual(["administrators", "students"]);
    expect(criarUsuario).not.toHaveBeenCalled();
  });

  it("devolve a falha genérica sem o texto do banco", async () => {
    insert.mockResolvedValue({
      error: {
        code: "XX000",
        message: 'relation "students" does not exist',
      },
    });

    const resultado = await gravar();

    expect(resultado).toEqual({ success: false, message: FALHA });
    expect(resultado.message).not.toContain("does not exist");
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("devolve a data de nascimento recusada pelo gatilho no campo", async () => {
    insert.mockResolvedValue({
      error: {
        code: "P0001",
        message: "data de nascimento deve ser anterior a hoje",
      },
    });

    const resultado = await gravar();

    expect(resultado).toEqual({
      success: false,
      errors: {
        nascimento: ["A data de nascimento deve ser anterior a hoje."],
      },
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("não grava nome, plano, e-mail ou nascimento inválidos", async () => {
    const nome = await gravar({ nome: "A" });
    const plano = await gravar({ plano: "vip" });
    const email = await gravar({ email: "sem-arroba" });
    const nascimento = await gravar({ nascimento: "" });

    expect(nome.errors?.nome?.[0]).toBe(
      "O nome precisa ter pelo menos 2 caracteres."
    );
    expect(plano.errors?.plano?.[0]).toBe("Selecione o plano.");
    expect(email.errors?.email?.[0]).toBe("Informe um e-mail válido.");
    expect(nascimento.errors?.nascimento?.[0]).toBe(
      "Informe a data de nascimento."
    );
    expect(insert).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("não grava telefone curto, com letra ou com mais de 13 caracteres", async () => {
    const curto = await gravar({ telefone: "1198765432" });
    const letra = await gravar({ telefone: "1198765432a" });
    const longo = await gravar({ telefone: "(11) 98765-4321" });

    expect(curto.errors?.telefone?.[0]).toBe(
      "Informe o DDD e o número, com 10 ou 11 dígitos no total."
    );
    expect(letra.errors?.telefone?.[0]).toBe("O telefone não pode ter letras.");
    expect(longo.errors?.telefone?.[0]).toBe(
      "O telefone pode ter no máximo 13 caracteres."
    );
    expect(insert).not.toHaveBeenCalled();
  });

  it("não grava peso ou altura que o banco arredondaria", async () => {
    const zero = await gravar({ peso: "0" });
    const zeroDecimal = await gravar({ peso: "0,0" });
    const duasCasas = await gravar({ peso: "78,45" });
    const mil = await gravar({ peso: "1000" });
    const alturaZero = await gravar({ altura: "0" });
    const alturaLonga = await gravar({ altura: "1.604" });

    expect(zero.errors?.peso?.[0]).toBe("O peso precisa ser maior que zero.");
    expect(zeroDecimal.errors?.peso?.[0]).toBe(
      "O peso precisa ser maior que zero."
    );
    expect(duasCasas.errors?.peso?.[0]).toBe(
      "Informe o peso em kg, com no máximo uma casa decimal."
    );
    expect(mil.errors?.peso?.[0]).toBe(
      "Informe o peso em kg, com no máximo uma casa decimal."
    );
    expect(alturaZero.errors?.altura?.[0]).toBe(
      "A altura precisa ser maior que zero."
    );
    expect(alturaLonga.errors?.altura?.[0]).toBe(
      "Informe a altura em metros, como 1.60."
    );
    expect(insert).not.toHaveBeenCalled();
  });

  it("grava o peso na borda de uma casa decimal", async () => {
    await gravar({ peso: "78,4" });
    await gravar({ peso: "999,9" });

    expect(insert.mock.calls.map((chamada) => chamada[0].weight_kg)).toEqual([
      78.4, 999.9,
    ]);
  });

  it("aumenta o stamp a cada cadastro consecutivo", async () => {
    const primeiro = await gravar();
    const segundo = await gravar({ nome: "Bruno Lima" });

    expect(primeiro.success).toBe(true);
    expect(segundo.success).toBe(true);
    expect(segundo.stamp).toBe((primeiro.stamp ?? 0) + 1);
  });
});
