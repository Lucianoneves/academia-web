import { z } from "zod";
import { textoParaCentavos } from "@/lib/dinheiro";

export type FieldErrors = Record<string, string[] | undefined>;

export type FormState = {
  success: boolean;
  message?: string;
  errors?: FieldErrors;
  stamp?: number;
  redirect?: string;
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
  { value: "avulso", label: "Avulso", duracao: "1 aula" },
  {
    value: "mensal",
    label: "Mensal",
    duracao: "1 mês, até a véspera do mesmo dia",
  },
  {
    value: "trimestral",
    label: "Trimestral",
    duracao: "3 meses, até a véspera do mesmo dia",
  },
  {
    value: "semestral",
    label: "Semestral",
    duracao: "6 meses, até a véspera do mesmo dia",
  },
  {
    value: "anual",
    label: "Anual",
    duracao: "1 ano, até a véspera do mesmo dia",
  },
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

const alturaEmMetros = /^\d([.,]\d{1,2})?$/;
const mensagemAltura = "Informe a altura em metros, como 1.60.";

function metrosParaCentimetros(value: string) {
  return Math.round(Number(value.replace(",", ".")) * 100);
}

export function formatarAltura(centimetros: number) {
  return (centimetros / 100).toFixed(2);
}

const alturaObrigatoria = z
  .string()
  .trim()
  .min(1, "Informe a altura.")
  .refine((value) => alturaEmMetros.test(value), { message: mensagemAltura })
  .transform(metrosParaCentimetros)
  .refine((value) => value > 0, {
    message: "A altura precisa ser maior que zero.",
  });

const alturaOpcional = z
  .string()
  .trim()
  .refine((value) => value === "" || alturaEmMetros.test(value), {
    message: mensagemAltura,
  })
  .transform((value) => (value === "" ? null : metrosParaCentimetros(value)))
  .refine((value) => value === null || value > 0, {
    message: "A altura precisa ser maior que zero.",
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
    .max(13, "O telefone pode ter no máximo 13 caracteres.")
    .refine((value) => !/[\p{L}]/u.test(value), {
      message: "O telefone não pode ter letras.",
    })
    .transform((value) => value.replace(/\D/g, ""))
    .refine((value) => /^[0-9]{11}$/.test(value), {
      message: "Informe o DDD e o número, com 10 ou 11 dígitos no total.",
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
  altura: alturaObrigatoria,
  plano: planoCadastro,
  restricoes: z
    .string()
    .trim()
    .transform((value) => (value.length > 0 ? value : null)),
  email: z
    .string()
    .trim()
    .max(254, "Informe um e-mail válido.")
    .transform((value) => value.toLowerCase())
    .refine(
      (value) => value === "" || z.string().email().safeParse(value).success,
      {
        message: "Informe um e-mail válido.",
      }
    )
    .transform((value) => (value.length > 0 ? value : null)),
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

const horaCampo = (mensagem: string) =>
  z
    .string()
    .trim()
    .regex(/^\d{2}:\d{2}$/, mensagem);

export const horarioSchema = z
  .object({
    dia: z
      .string()
      .trim()
      .regex(/^[0-6]$/, "Selecione o dia.")
      .transform(Number),
    inicio: horaCampo("Informe o início."),
    fim: horaCampo("Informe o fim."),
    categoria: idCampo("Selecione a categoria."),
    vagas: z
      .string()
      .trim()
      .regex(/^\d+$/, "Informe as vagas em número inteiro.")
      .transform(Number)
      .refine((valor) => valor >= 1, "Informe pelo menos 1 vaga."),
  })
  .refine((valor) => valor.fim > valor.inicio, {
    path: ["fim"],
    message: "O fim precisa ser depois do início.",
  });

export const marcacaoSchema = z.object({
  aluno: idCampo("Selecione o aluno."),
  horario: idCampo("Selecione o horário."),
  data: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data.")
    .refine((valor) => valor >= hojeSaoPaulo(), {
      message: "Não é possível agendar em data passada.",
    }),
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

export const avaliacaoSchema = z.object({
  data: z
    .string()
    .trim()
    .min(1, "Informe a data.")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data.")
    .refine((value) => value <= hojeSaoPaulo(), {
      message: "A data da avaliação não pode ser futura.",
    }),
  observacoes: z
    .string()
    .trim()
    .transform((value) => (value.length > 0 ? value : null)),
});

export const marcacaoAvaliacaoSchema = z.object({
  dia: z
    .string()
    .trim()
    .min(1, "Informe o dia.")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe o dia.")
    .refine((value) => value >= hojeSaoPaulo(), {
      message: "O dia da marcação não pode ser no passado.",
    }),
  hora: z
    .string()
    .trim()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Informe a hora."),
});
