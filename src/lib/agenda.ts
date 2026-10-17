import { hojeSaoPaulo } from "@/lib/validacao";

const dias = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
] as const;

export const ordemDias = [1, 2, 3, 4, 5, 6, 0];

const mesesCurtos = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
] as const;

export function nomeDia(dia: number) {
  return dias[dia] ?? "Dia";
}

export function rotuloProximaData(weekday: number, hoje = hojeSaoPaulo()) {
  const distancia = (weekday - diaDaSemana(hoje) + 7) % 7;
  const [ano, mes, dia] = hoje.split("-").map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia + distancia));
  return `${data.getUTCDate()} ${mesesCurtos[data.getUTCMonth()]}`;
}

export function diaDaSemana(iso: string) {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay();
}

export function horaCompleta(valor: string) {
  const [hora = "00", minuto = "00", segundo = "00"] = valor.split(":");
  return `${hora.padStart(2, "0")}:${minuto.padStart(2, "0")}:${segundo.padStart(2, "0")}`;
}

export function horaCurta(valor: string) {
  return horaCompleta(valor).slice(0, 5);
}

export function agoraSaoPaulo() {
  const partes = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const ler = (tipo: Intl.DateTimeFormatPartTypes) =>
    partes.find((parte) => parte.type === tipo)?.value ?? "00";

  return `${ler("hour")}:${ler("minute")}:${ler("second")}`;
}

export function aulaJaComecou(
  data: string,
  inicio: string,
  hoje = hojeSaoPaulo(),
  agora = agoraSaoPaulo()
) {
  if (data < hoje) return true;
  if (data > hoje) return false;
  return horaCompleta(agora) >= horaCompleta(inicio);
}

export function rotuloCategoria(nome: string) {
  if (!nome) return "Categoria";
  return nome.charAt(0).toLocaleUpperCase("pt-BR") + nome.slice(1);
}

const falhasConhecidas = [
  "não é possível agendar em data passada",
  "não é possível agendar depois do início da aula",
  "horário inativo não aceita marcação nova",
  "este horário não ocorre nesse dia da semana",
  "aluno inativo não pode ser agendado",
  "aluno já está marcado neste horário nesta data",
  "não há vaga",
  "crédito avulso inválido",
  "crédito avulso já utilizado",
  "cancelamento somente antes do início da aula",
  "agendamento não encontrado",
  "a única alteração permitida é o cancelamento",
  "é preciso uma categoria ativa",
  "categoria não encontrada",
  "horário não encontrado",
  "aluno não encontrado",
];

export function mensagemDoBanco(texto: string) {
  const normalizado = texto.toLocaleLowerCase("pt-BR");
  const achou = falhasConhecidas.find((item) => normalizado.includes(item));
  if (!achou) return "Não foi possível salvar. Tente de novo.";
  return `${achou.charAt(0).toLocaleUpperCase("pt-BR")}${achou.slice(1)}.`;
}
