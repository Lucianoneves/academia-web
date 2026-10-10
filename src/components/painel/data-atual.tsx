export function formatarDataAtual() {
  const formatted = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date());

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function DataAtual({ label }: { label: string }) {
  return <span>{label}</span>;
}
