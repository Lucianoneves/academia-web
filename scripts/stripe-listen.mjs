import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const texto = readFileSync(new URL("../.env", import.meta.url), "utf8");

function valor(nome) {
  const linha = texto
    .split(/\r?\n/)
    .find((item) => item.trim().startsWith(`${nome}=`));
  if (!linha) return "";
  return linha.slice(linha.indexOf("=") + 1).trim();
}

const chave = valor("STRIPE_SECRET_KEY");

if (!chave.startsWith("sk_test_")) {
  console.error("Coloque uma STRIPE_SECRET_KEY de teste no .env.");
  process.exit(1);
}

const eventos = [
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
  "payment_intent.succeeded",
  "payment_intent.payment_failed",
  "payment_intent.canceled",
  "charge.succeeded",
  "charge.failed",
  "charge.refunded",
  "charge.refund.updated",
].join(",");

const shim = join(
  process.env.APPDATA ?? "",
  "npm/node_modules/@stripe/cli/bin/shim.js"
);
const comando = existsSync(shim) ? process.execPath : "stripe";
const prefixo = existsSync(shim) ? [shim] : [];

const filho = spawn(
  comando,
  [
    ...prefixo,
    "listen",
    "--forward-to",
    "localhost:3000/api/stripe/webhook",
    "--events",
    eventos,
  ],
  {
    stdio: "inherit",
    env: { ...process.env, STRIPE_API_KEY: chave },
  }
);

filho.on("exit", (codigo) => {
  process.exit(codigo ?? 0);
});
