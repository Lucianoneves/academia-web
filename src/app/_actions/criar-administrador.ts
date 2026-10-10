"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createSessionClient } from "@/lib/supabase/server";
import {
  administradorSchema,
  fieldErrors,
  type FormState,
} from "@/lib/validacao";

const MENSAGEM_FALHA = "Não foi possível criar a conta. Tente de novo.";

export async function criarAdministrador(
  _previous: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = administradorSchema.safeParse({
    nome: formData.get("nome"),
    email: formData.get("email"),
    senha: formData.get("senha"),
    confirmacao: formData.get("confirmacao"),
  });

  if (!parsed.success) {
    return { success: false, errors: fieldErrors(parsed.error) };
  }

  const admin = createAdminClient();
  const { data: claimed, error: claimError } =
    await admin.rpc("claim_first_admin");

  if (claimError) {
    return { success: false, message: MENSAGEM_FALHA };
  }

  if (claimed !== true) {
    const { data: exists } = await admin.rpc("admin_exists");
    if (exists === true) {
      redirect("/login?aviso=conta");
    }

    return {
      success: false,
      message:
        "O cadastro inicial está reservado. Espere alguns minutos e tente de novo.",
    };
  }

  const email = parsed.data.email.toLowerCase();
  let userId: string | undefined;

  try {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: parsed.data.senha,
      email_confirm: true,
    });

    if (error || !data.user) {
      const duplicate = (error?.message ?? "")
        .toLowerCase()
        .includes("already");
      if (duplicate) {
        await admin.rpc("release_first_admin_claim");
        return {
          success: false,
          errors: { email: ["Este e-mail já está em uso."] },
        };
      }
      throw error ?? new Error("criar usuário");
    }

    userId = data.user.id;

    const { error: insertError } = await admin.from("administrators").insert({
      id: userId,
      name: parsed.data.nome,
      email,
    });

    if (insertError) {
      throw insertError;
    }
  } catch {
    if (userId) {
      await admin.auth.admin.deleteUser(userId);
    }
    await admin.rpc("release_first_admin_claim");
    return { success: false, message: MENSAGEM_FALHA };
  }

  const supabase = await createSessionClient();
  const { error: signError } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.senha,
  });

  if (signError) {
    redirect("/login?aviso=entrar");
  }

  redirect("/painel");
}
