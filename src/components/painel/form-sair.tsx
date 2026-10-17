"use client";

import { sair } from "@/app/painel/_actions/sair";
import { useIniciarBarra } from "@/components/progresso-navegacao";

export function FormSair() {
  const iniciarBarra = useIniciarBarra();

  return (
    <form action={sair} onSubmit={iniciarBarra}>
      <button
        type="submit"
        title="Sair do Sistema"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-error-container hover:text-on-error-container"
      >
        <span className="material-symbols-outlined text-[18px]">logout</span>
      </button>
    </form>
  );
}
