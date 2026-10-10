import { z } from "zod";
import { textoParaCentavos } from "@/lib/dinheiro";

export type FieldErrors = Record<string, string[] | undefined>;

export type FormState = {
  success: boolean;
  message?: string;
  errors?: FieldErrors;
  stamp?: number;
};

export function fieldErrors(error: z.ZodError): FieldErrors {
  const errors: FieldErrors = {};

  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key !== "string") continue;
    const current = errors[key] ?? [];
    current.push(issue.message);
    errors[key] = current;
  }

  return errors;
}

export function hojeSaoPaulo() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

const email = z
  .string()
  .trim()
  .min(1, "Informe o e-mail.")
  .email("Informe um e-mail válido.");

export const administradorSchema = z
  .object({
    nome: z
      .string()
      .trim()
      .min(2, "O nome precisa ter pelo menos 2 caracteres."),
    email,
    senha: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres."),
    confirmacao: z.string().min(1, "Confirme a senha."),
  })
  .refine((value) => value.senha === value.confirmacao, {
    path: ["confirmacao"],
    message: "A confirmação precisa ser igual à senha.",
  });

export const planosCadastro = [
  { value: "avulso", label: "Avulso" },
  { value: "mensal", label: "Mensal" },
  { value: "trimestral", label: "Trimestral" },
  { value: "semestral", label: "Semestral" },
  { value: "anual", label: "Anual" },
] as const;

const planoCadastro = z.enum(
  planosCadastro.map((plano) => plano.value),
  "Selecione o plano."
);

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Informe o e-mail.")
    .email("Informe um e-mail válido."),
  senha: z.string().min(1, "Informe a senha."),
});

export const alunoSchema = z.object({
  nome: z.string().trim().min(2, "O nome precisa ter pelo menos 2 caracteres."),
  nascimento: z
    .string()
    .trim()
    .min(1, "Informe a data de nascimento.")
    .refine((value) => value < hojeSaoPaulo(), {
      message: "A data de nascimento deve ser anterior a hoje.",
    }),
  telefone: z
    .string()
    .trim()
    .min(1, "Informe o telefone.")
    .refine((value) => !/[\p{L}]/u.test(value), {
      message: "O telefone não pode ter letras.",
    })
    .transform((value) => value.replace(/\D/g, ""))
    .refine((value) => /^[0-9]{10,11}$/.test(value), {
      message: "Informe o DDD e o número, com 10 ou 11 dígitos.",
    }),
  peso: z
    .string()
    .trim()
    .min(1, "Informe o peso.")
    .refine((value) => /^\d{1,3}([.,]\d)?$/.test(value), {
      message: "Informe o peso em kg, com no máximo uma casa decimal.",
    })
    .transform((value) => Number(value.replace(",", ".")))
    .refine((value) => value > 0, {
      message: "O peso precisa ser maior que zero.",
    }),
  altura: z
    .string()
    .trim()
    .min(1, "Informe a altura.")
    .refine((value) => /^\d{1,3}([.,]\d)?$/.test(value), {
      message: "Informe a altura em cm, com no máximo uma casa decimal.",
    })
    .transform((value) => Number(value.replace(",", ".")))
    .refine((value) => value > 0, {
      message: "A altura precisa ser maior que zero.",
    }),
  plano: planoCadastro,
  restricoes: z
    .string()
    .trim()
    .transform((value) => (value.length > 0 ? value : null)),
});

const alturaOpcional = z
  .string()
  .trim()
  .refine((value) => value === "" || /^\d{1,3}([.,]\d)?$/.test(value), {
    message: "Informe a altura em cm, com no máximo uma casa decimal.",
  })
  .transform((value) => (value === "" ? null : Number(value.replace(",", "."))))
  .refine((value) => value === null || value > 0, {
    message: "A altura precisa ser maior que zero.",
  });

const planoOpcional = z
  .string()
  .trim()
  .refine(
    (value) =>
      value === "" || planosCadastro.some((plano) => plano.value === value),
    { message: "Selecione um dos planos da academia." }
  )
  .transform((value) =>
    value === "" ? null : (value as (typeof planosCadastro)[number]["value"])
  );

export const alunoEdicaoSchema = alunoSchema
  .omit({ altura: true, plano: true })
  .extend({
    altura: alturaOpcional,
    plano: planoOpcional,
  });

function idCampo(mensagem: string) {
  return z
    .string()
    .trim()
    .min(1, mensagem)
    .regex(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      mensagem
    );
}

function centavos(mensagemVazio: string) {
  return z
    .string()
    .trim()
    .min(1, mensagemVazio)
    .refine((value) => textoParaCentavos(value) !== null, {
      message: "Informe o valor em reais, com no máximo duas casas.",
    })
    .transform((value) => textoParaCentavos(value) ?? 0);
}

export const precoPlanoSchema = z.object({
  preco: centavos("Informe o preço."),
});

export const lancamentoSchema = z.object({
  aluno: idCampo("Selecione o aluno."),
  plano: idCampo("Selecione o plano."),
  valor: centavos("Informe o valor.").refine((valor) => valor > 0, {
    message: "O valor precisa ser maior que zero.",
  }),
  data: z
    .string()
    .trim()
    .min(1, "Informe a data.")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data.")
    .refine((value) => value <= hojeSaoPaulo(), {
      message: "A data do pagamento não pode ser futura.",
    }),
});
