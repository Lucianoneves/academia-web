import "server-only";

import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createAnonClient, createSessionClient } from "@/lib/supabase/server";

export type AdministradorAtual = {
  id: string;
  name: string;
};

export async function administradorExiste() {
  const supabase = createAnonClient();
  const { data, error } = await supabase.rpc("admin_exists");

  if (error) {
    throw new Error("Não foi possível consultar o cadastro de administrador.");
  }

  return data === true;
}

export async function getCurrentAdmin(): Promise<AdministradorAtual | null> {
  await connection();
  const supabase = await createSessionClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return null;
  }

  const { data, error } = await supabase
    .from("administrators")
    .select("id, name")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return { id: data.id, name: data.name };
}

export async function requireAdmin() {
  await connection();
  const supabase = await createSessionClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login");
  }

  const { data } = await supabase
    .from("administrators")
    .select("id, name")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (!data) {
    redirect("/acesso/encerrar");
  }

  return { id: data.id, name: data.name };
}
