import type { Metadata } from "next";
import { Dashboard } from "@/components/painel/dashboard";

export const metadata: Metadata = {
  title: "APEX.FIT — Painel da academia",
};

export default function PainelPage() {
  return <Dashboard />;
}
