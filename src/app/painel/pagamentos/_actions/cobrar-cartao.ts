"use server";

import { headers } from "next/headers";
import { requireAdmin } from "@/lib/auth";
import { avisoCartaoTeste, clienteStripeTeste } from "@/lib/stripe-teste";
import { createSessionClient } from "@/lib/supabase/server";
import { planosCadastro, type FormState } from "@/lib/validacao";

const FALHA = "Não foi possível abrir a cobrança. Tente de novo.";

function idValido(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    id
  );
}

async function origemPainel() {
  const cabecalhos = await headers();
  const host =
    cabecalhos.get("x-forwarded-host") ??
    cabecalhos.get("host") ??
    "localhost:3000";
  const proto = cabecalhos.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export async function iniciarCheckout(
  _previous: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();

  const stripe = clienteStripeTeste();
  if (!stripe) {
    return { success: false, message: avisoCartaoTeste() };
  }

  const alunoId = String(formData.get("aluno") ?? "");
  const planoId = String(formData.get("plano") ?? "");

  if (!idValido(alunoId)) {
    return { success: false, errors: { aluno: ["Selecione o aluno."] } };
  }

  if (!idValido(planoId)) {
    return { success: false, errors: { plano: ["Selecione o plano."] } };
  }

  const supabase = await createSessionClient();
  const [aluno, plano] = await Promise.all([
    supabase
      .from("students")
      .select("id, active, name")
      .eq("id", alunoId)
      .maybeSingle(),
    supabase
      .from("plans")
      .select("id, active, price_cents, kind")
      .eq("id", planoId)
      .maybeSingle(),
  ]);

  if (aluno.error || plano.error) {
    return { success: false, message: FALHA };
  }

  if (!aluno.data?.active) {
    return {
      success: false,
      errors: { aluno: ["Aluno inativo não recebe lançamento novo."] },
    };
  }

  const planoSalvo = plano.data;
  if (!planoSalvo || !planoSalvo.active || planoSalvo.price_cents <= 0) {
    return {
      success: false,
      errors: { plano: ["Esse plano não está à venda."] },
    };
  }

  const nome =
    planosCadastro.find((item) => item.value === planoSalvo.kind)?.label ??
    "Plano";
  const origem = await origemPainel();
  const volta = `${origem}/painel/pagamentos/${alunoId}`;

  const sessao = await stripe.checkout.sessions.create({
    mode: "payment",
    locale: "pt-BR",
    client_reference_id: alunoId,
    metadata: {
      student_id: alunoId,
      plan_id: planoId,
    },
    success_url: `${volta}?checkout=enviado`,
    cancel_url: `${volta}?checkout=cancelado`,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "brl",
          unit_amount: planoSalvo.price_cents,
          product_data: { name: nome },
        },
      },
    ],
  });

  if (!sessao.url) {
    return { success: false, message: FALHA };
  }

  return { success: true, redirect: sessao.url };
}
