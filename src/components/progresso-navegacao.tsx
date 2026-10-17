"use client";

import { ProgressProvider } from "@bprogress/next/app";
import { useProgress } from "@bprogress/react";
import { useEffect, useRef, type ReactNode } from "react";

const ATRASO_MS = 150;

export function ProgressoNavegacao({ children }: { children: ReactNode }) {
  return (
    <ProgressProvider
      height="2px"
      color="#c3f400"
      delay={ATRASO_MS}
      shallowRouting
      options={{ showSpinner: false }}
    >
      {children}
    </ProgressProvider>
  );
}

export function useIniciarBarra() {
  const { start } = useProgress();
  return () => start(0, ATRASO_MS);
}

export function useBarraNaTroca(pending: boolean, falhou: boolean) {
  const { stop } = useProgress();
  const iniciar = useIniciarBarra();
  const estavaPendente = useRef(false);

  useEffect(() => {
    if (estavaPendente.current && !pending && falhou) stop();
    estavaPendente.current = pending;
  }, [pending, falhou, stop]);

  return iniciar;
}
