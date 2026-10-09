"use client";

import { useEffect, useState } from "react";

export function DataAtual() {
  const [label, setLabel] = useState("");

  useEffect(() => {
    const formatted = new Intl.DateTimeFormat("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "short",
      timeZone: "America/Sao_Paulo",
    }).format(new Date());

    setLabel(formatted.charAt(0).toUpperCase() + formatted.slice(1));
  }, []);

  return <span>{label}</span>;
}
