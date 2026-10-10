import { planosCadastro } from "@/lib/validacao";

export type PlanoPainel = {
  id: string;
  kind: (typeof planosCadastro)[number]["value"];
  nome: string;
  duracao: string;
  precoCentavos: number;
  ativo: boolean;
};
