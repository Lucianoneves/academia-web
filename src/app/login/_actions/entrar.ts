"use server";

import { redirect } from "next/navigation";
import { createSessionClient } from "@/lib/supabase/server";
import { fieldErrors, loginSchema, type FormState } from "@/lib/validacao";

const RECUSA = "Não foi possível entrar. Confira os dados e tente de novo.";

export async function entrar(
  _previous: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    senha: formData.get("senha"),
  });

  if (!parsed.success) {
    return { success: false, errors: fieldErrors(parsed.error) };
  }

  const supabase = await createSessionClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email.toLowerCase(),
    password: parsed.data.senha,
  });

  if (error) {
    return { success: false, message: RECUSA };
  }

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;

  if (!userId) {
    return { success: false, message: RECUSA };
  }

  const { data: administrador } = await supabase
    .from("administrators")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (!administrador) {
    await supabase.auth.signOut();
    return { success: false, message: RECUSA };
  }

  redirect("/painel");
}
