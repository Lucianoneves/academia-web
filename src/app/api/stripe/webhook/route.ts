import { revalidatePath } from "next/cache";
import type Stripe from "stripe";
import { hojeSaoPaulo } from "@/lib/validacao";
import { clienteStripeTeste, segredoWebhookTeste } from "@/lib/stripe-teste";
import { createAdminClient } from "@/lib/supabase/admin";

function idValido(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    id
  );
}

function texto(valor: string | Stripe.PaymentIntent | null | undefined) {
  if (!valor) return null;
  return typeof valor === "string" ? valor : valor.id;
}

function atualizar(alunoId: string) {
  revalidatePath("/painel/pagamentos");
  revalidatePath("/painel/pagamentos/[alunoId]", "page");
  revalidatePath(`/painel/pagamentos/${alunoId}`);
  revalidatePath(`/painel/alunos/${alunoId}`);
  revalidatePath("/painel/alunos/[id]", "page");
}

async function gravarRecebimento(sessao: Stripe.Checkout.Session) {
  if (sessao.payment_status !== "paid") return;
  const alunoId = sessao.metadata?.student_id ?? "";
  const planoId = sessao.metadata?.plan_id ?? "";
  const intent = texto(sessao.payment_intent);
  const valor = sessao.amount_total;

  if (
    !idValido(alunoId) ||
    !idValido(planoId) ||
    !intent ||
    !valor ||
    valor <= 0
  ) {
    throw new Error("Sessão de cartão incompleta.");
  }

  const supabase = createAdminClient();
  const existente = await supabase
    .from("payments")
    .select("id")
    .eq("stripe_checkout_session_id", sessao.id)
    .maybeSingle();

  if (existente.error) throw new Error(existente.error.message);
  if (existente.data) return;

  const { error } = await supabase.from("payments").insert({
    student_id: alunoId,
    plan_id: planoId,
    amount_cents: valor,
    paid_on: hojeSaoPaulo(),
    method: "cartao",
    kind: "recebimento",
    stripe_checkout_session_id: sessao.id,
    stripe_payment_intent_id: intent,
  });

  if (error && error.code !== "23505") throw new Error(error.message);
  if (!error) atualizar(alunoId);
}

async function gravarEstorno(charge: Stripe.Charge, stripe: Stripe) {
  const intent = texto(charge.payment_intent);
  if (!intent) throw new Error("Reembolso incompleto.");

  let reembolso = charge.refunds?.data?.[0]?.id;
  if (!reembolso) {
    const lista = await stripe.refunds.list({
      payment_intent: intent,
      limit: 1,
    });
    reembolso = lista.data[0]?.id;
  }
  if (!reembolso) throw new Error("Reembolso incompleto.");

  const supabase = createAdminClient();
  const origem = await supabase
    .from("payments")
    .select("id, student_id, plan_id, amount_cents, kind, method")
    .eq("stripe_payment_intent_id", intent)
    .eq("kind", "recebimento")
    .maybeSingle();

  if (origem.error) throw new Error(origem.error.message);
  if (!origem.data || origem.data.method !== "cartao") return;

  const existente = await supabase
    .from("payments")
    .select("id")
    .eq("reverses_payment_id", origem.data.id)
    .maybeSingle();

  if (existente.error) throw new Error(existente.error.message);
  if (existente.data) return;

  const { error } = await supabase.from("payments").insert({
    student_id: origem.data.student_id,
    plan_id: origem.data.plan_id,
    amount_cents: origem.data.amount_cents,
    paid_on: hojeSaoPaulo(),
    method: "cartao",
    kind: "estorno",
    reverses_payment_id: origem.data.id,
    stripe_refund_id: reembolso,
  });

  if (error && error.code !== "23505") throw new Error(error.message);
  if (!error) atualizar(origem.data.student_id);
}

export async function POST(request: Request) {
  const stripe = clienteStripeTeste();
  const segredo = segredoWebhookTeste();
  const assinatura = request.headers.get("stripe-signature");

  if (!stripe || !segredo || !assinatura) {
    return new Response("Webhook de teste indisponível.", { status: 503 });
  }

  const corpo = await request.text();
  let evento: Stripe.Event;

  try {
    evento = stripe.webhooks.constructEvent(corpo, assinatura, segredo);
  } catch {
    return new Response("Assinatura inválida.", { status: 400 });
  }

  try {
    if (
      evento.type === "checkout.session.completed" ||
      evento.type === "checkout.session.async_payment_succeeded"
    ) {
      await gravarRecebimento(evento.data.object);
    }

    if (evento.type === "charge.refunded") {
      await gravarEstorno(evento.data.object, stripe);
    }
  } catch {
    return new Response("Não foi possível gravar o pagamento.", {
      status: 500,
    });
  }

  return new Response("ok");
}
