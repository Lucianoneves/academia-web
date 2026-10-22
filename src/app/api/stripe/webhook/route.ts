import { revalidatePath } from "next/cache";
import type Stripe from "stripe";
import { diaSaoPauloUnix } from "@/lib/validacao";
import { reembolsoDaCobranca } from "@/lib/stripe-reembolso";
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

async function garantirEstorno(
  recebimentoId: string,
  reembolso: Stripe.Refund
) {
  const supabase = createAdminClient();
  const existente = await supabase
    .from("payments")
    .select("id")
    .eq("reverses_payment_id", recebimentoId)
    .maybeSingle();

  if (existente.error) throw new Error(existente.error.message);
  if (existente.data) return false;

  const origem = await supabase
    .from("payments")
    .select("id, student_id, plan_id, amount_cents, kind, method")
    .eq("id", recebimentoId)
    .maybeSingle();

  if (origem.error) throw new Error(origem.error.message);
  if (
    !origem.data ||
    origem.data.kind !== "recebimento" ||
    origem.data.method !== "cartao"
  ) {
    return false;
  }

  const { error } = await supabase.from("payments").insert({
    student_id: origem.data.student_id,
    plan_id: origem.data.plan_id,
    amount_cents: origem.data.amount_cents,
    paid_on: diaSaoPauloUnix(reembolso.created),
    method: "cartao",
    kind: "estorno",
    reverses_payment_id: origem.data.id,
    stripe_refund_id: reembolso.id,
  });

  if (error && error.code !== "23505") throw new Error(error.message);
  if (!error) atualizar(origem.data.student_id);
  return !error;
}

async function gravarRecebimento(
  sessao: Stripe.Checkout.Session,
  confirmadoEm: number,
  stripe: Stripe
) {
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

  const reembolso = await reembolsoDaCobranca(stripe, intent);
  const supabase = createAdminClient();
  const existente = await supabase
    .from("payments")
    .select("id")
    .eq("stripe_checkout_session_id", sessao.id)
    .maybeSingle();

  if (existente.error) throw new Error(existente.error.message);

  let recebimentoId = existente.data?.id ?? null;

  if (!recebimentoId) {
    const { data, error } = await supabase
      .from("payments")
      .insert({
        student_id: alunoId,
        plan_id: planoId,
        amount_cents: valor,
        paid_on: diaSaoPauloUnix(confirmadoEm),
        method: "cartao",
        kind: "recebimento",
        stripe_checkout_session_id: sessao.id,
        stripe_payment_intent_id: intent,
      })
      .select("id")
      .maybeSingle();

    if (error && error.code !== "23505") throw new Error(error.message);

    if (error?.code === "23505") {
      const deNovo = await supabase
        .from("payments")
        .select("id")
        .eq("stripe_checkout_session_id", sessao.id)
        .maybeSingle();
      if (deNovo.error) throw new Error(deNovo.error.message);
      if (!deNovo.data)
        throw new Error("Recebimento de cartão não encontrado.");
      recebimentoId = deNovo.data.id;
    } else if (!data) {
      throw new Error("Não foi possível gravar o recebimento.");
    } else {
      recebimentoId = data.id;
      atualizar(alunoId);
    }
  }

  if (reembolso) await garantirEstorno(recebimentoId, reembolso);
}

async function gravarEstorno(charge: Stripe.Charge, stripe: Stripe) {
  const intent = texto(charge.payment_intent);
  if (!intent) throw new Error("Reembolso incompleto.");

  const reembolso = await reembolsoDaCobranca(stripe, intent);
  if (!reembolso) throw new Error("Reembolso incompleto.");

  const supabase = createAdminClient();
  const origem = await supabase
    .from("payments")
    .select("id")
    .eq("stripe_payment_intent_id", intent)
    .eq("kind", "recebimento")
    .maybeSingle();

  if (origem.error) throw new Error(origem.error.message);
  if (!origem.data) return;

  await garantirEstorno(origem.data.id, reembolso);
}

async function confirmarPagamentoDoIntent(
  stripe: Stripe,
  intentId: string,
  confirmadoEm: number
) {
  const sessoes = await stripe.checkout.sessions.list({
    payment_intent: intentId,
    limit: 1,
  });
  const sessao = sessoes.data[0];
  if (!sessao) return;
  await gravarRecebimento(sessao, confirmadoEm, stripe);
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
      await gravarRecebimento(evento.data.object, evento.created, stripe);
    }

    if (evento.type === "payment_intent.succeeded") {
      await confirmarPagamentoDoIntent(
        stripe,
        evento.data.object.id,
        evento.created
      );
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
