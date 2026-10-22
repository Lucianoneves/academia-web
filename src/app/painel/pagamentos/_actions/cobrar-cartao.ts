"use server";

import { headers } from "next/headers";
import { requireAdmin } from "@/lib/auth";
import { garantirPrecoStripe } from "@/lib/stripe-preco";
import { avisoCartaoTeste, clienteStripeTeste } from "@/lib/stripe-teste";
import { createSessionClient } from "@/lib/supabase/server";
import { type FormState } from "@/lib/validacao";

const FALHA = "Não foi possível gerar o link. Tente de novo.";

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

function clienteSumiu(erro: unknown) {
  if (!erro || typeof erro !== "object") return false;
  const falha = erro as { code?: string; param?: string };
  return falha.code === "resource_missing" && falha.param === "customer";
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
      .select("id, active, name, email, phone, stripe_customer_id")
      .eq("id", alunoId)
      .maybeSingle(),
    supabase
      .from("plans")
      .select(
        "id, kind, active, price_cents, stripe_product_id, stripe_price_id"
      )
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

  let precoStripe = planoSalvo.stripe_price_id;

  if (!precoStripe) {
    try {
      const criado = await garantirPrecoStripe(stripe, {
        id: planoSalvo.id,
        kind: planoSalvo.kind,
        priceCents: planoSalvo.price_cents,
        productId: planoSalvo.stripe_product_id,
        priceId: null,
      });
      const gravado = await supabase
        .from("plans")
        .update({
          stripe_product_id: criado.productId,
          stripe_price_id: criado.priceId,
        })
        .eq("id", planoSalvo.id)
        .select("id");

      if (gravado.error || !gravado.data?.length) {
        return { success: false, message: FALHA };
      }

      precoStripe = criado.priceId;
    } catch {
      return { success: false, message: FALHA };
    }
  }

  const alunoSalvo = aluno.data;

  async function novoCliente(anterior: string | null) {
    let criado: string;
    try {
      const cliente = await stripe.customers.create({
        name: alunoSalvo.name,
        phone: `+55${alunoSalvo.phone.replace(/\D/g, "")}`,
        ...(alunoSalvo.email ? { email: alunoSalvo.email } : {}),
        metadata: { student_id: alunoId },
      });
      criado = cliente.id;
    } catch {
      return null;
    }

    const consulta = supabase
      .from("students")
      .update({ stripe_customer_id: criado })
      .eq("id", alunoId);
    const gravado = await (
      anterior
        ? consulta.eq("stripe_customer_id", anterior)
        : consulta.is("stripe_customer_id", null)
    )
      .select("stripe_customer_id")
      .maybeSingle();

    if (gravado.error) return null;
    if (gravado.data?.stripe_customer_id) {
      return gravado.data.stripe_customer_id;
    }

    const deNovo = await supabase
      .from("students")
      .select("stripe_customer_id")
      .eq("id", alunoId)
      .maybeSingle();
    return deNovo.data?.stripe_customer_id ?? null;
  }

  let clienteId = alunoSalvo.stripe_customer_id;

  if (!clienteId) {
    clienteId = await novoCliente(null);
    if (!clienteId) return { success: false, message: FALHA };
  }

  const origem = await origemPainel();

  const abrirSessao = (cliente: string) =>
    stripe.checkout.sessions.create({
      mode: "payment",
      locale: "pt-BR",
      customer: cliente,
      client_reference_id: alunoId,
      metadata: {
        student_id: alunoId,
        plan_id: planoId,
      },
      success_url: `${origem}/cobranca/recebida`,
      cancel_url: `${origem}/cobranca/cancelada`,
      line_items: [{ quantity: 1, price: precoStripe }],
    });

  let sessao: { url: string | null };
  try {
    sessao = await abrirSessao(clienteId);
  } catch (erro) {
    if (!clienteSumiu(erro)) return { success: false, message: FALHA };

    const refeito = await novoCliente(clienteId);
    if (!refeito) return { success: false, message: FALHA };

    try {
      sessao = await abrirSessao(refeito);
    } catch {
      return { success: false, message: FALHA };
    }
  }

  if (!sessao.url) {
    return { success: false, message: FALHA };
  }

  return {
    success: true,
    message: "Link gerado. Ele aceita pagamento por 24 horas.",
    link: sessao.url,
  };
}
