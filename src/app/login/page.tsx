import type { Metadata } from "next";
import { LoginAdministrador } from "@/components/acesso/login-administrador";

export const metadata: Metadata = {
  title: "APEX.FIT — Login do administrador",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-surface px-gutter py-space-xl">
      <LoginAdministrador />
    </main>
  );
}
