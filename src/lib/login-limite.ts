import "server-only";

import { headers } from "next/headers";

const JANELA_MS = 15 * 60 * 1000;
const MAX_POR_EMAIL = 5;
const MAX_POR_IP = 15;

type Balde = {
  tentativas: number;
  ate: number;
};

const porEmail = new Map<string, Balde>();
const porIp = new Map<string, Balde>();

function podar(mapa: Map<string, Balde>, agora: number) {
  if (mapa.size < 200) return;
  for (const [chave, balde] of mapa) {
    if (agora >= balde.ate) mapa.delete(chave);
  }
}

function bloqueado(mapa: Map<string, Balde>, chave: string, max: number) {
  const agora = Date.now();
  podar(mapa, agora);
  const balde = mapa.get(chave);
  if (!balde || agora >= balde.ate) {
    mapa.delete(chave);
    return false;
  }
  return balde.tentativas >= max;
}

function registrar(mapa: Map<string, Balde>, chave: string) {
  const agora = Date.now();
  const atual = mapa.get(chave);
  if (!atual || agora >= atual.ate) {
    mapa.set(chave, { tentativas: 1, ate: agora + JANELA_MS });
    return;
  }
  atual.tentativas += 1;
}

export async function ipDoPedido() {
  const lista = await headers();
  const encaminhado = lista.get("x-forwarded-for");
  if (encaminhado) {
    const primeiro = encaminhado.split(",")[0]?.trim();
    if (primeiro) return primeiro;
  }
  return lista.get("x-real-ip")?.trim() || "desconhecido";
}

export function loginExcedeuTentativas(ip: string, email: string) {
  return (
    bloqueado(porIp, ip, MAX_POR_IP) ||
    bloqueado(porEmail, email, MAX_POR_EMAIL)
  );
}

export function loginRegistrarFalha(ip: string, email: string) {
  registrar(porIp, ip);
  registrar(porEmail, email);
}

export function loginLimparTentativas(ip: string, email: string) {
  porIp.delete(ip);
  porEmail.delete(email);
}
