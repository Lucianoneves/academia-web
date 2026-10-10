import { planosCadastro } from "@/lib/validacao";

export type ResumoAlunos = {
  total: number;
  ativos: number;
  nesteMes: number;
};

export type AlunoLista = {
  id: string;
  nome: string;
  telefone: string;
  ativo: boolean;
};

export type AlunoFicha = {
  id: string;
  nome: string;
  nascimento: string;
  telefone: string;
  peso: number;
  altura: number | null;
  plano: (typeof planosCadastro)[number]["value"] | null;
  restricoes: string | null;
  ativo: boolean;
};

export function formatarTelefone(digitos: string) {
  if (digitos.length === 11) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
  }

  if (digitos.length === 10) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  }

  return digitos;
}
