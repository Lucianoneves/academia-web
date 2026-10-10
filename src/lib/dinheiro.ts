export function centavosParaCampo(centavos: number) {
  return (centavos / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatarReais(centavos: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(centavos / 100);
}

export function textoParaCentavos(valor: string) {
  const limpo = valor.trim().replace(/\s/g, "").replace(/^R\$/i, "");

  if (!limpo || limpo.startsWith("-")) return null;

  let normalizado = limpo;

  if (limpo.includes(",")) {
    normalizado = limpo.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(limpo)) {
    normalizado = limpo.replace(/\./g, "");
  }

  if (!/^\d+(\.\d{1,2})?$/.test(normalizado)) return null;

  const [inteiro, fracao = ""] = normalizado.split(".");

  return Number(inteiro) * 100 + Number(fracao.padEnd(2, "0"));
}
