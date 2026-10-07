import type { Metadata } from "next";
import { Telao } from "@/components/Telao";

export const metadata: Metadata = {
  title: "Gambiarra.net · telão",
};

/** O telão: a janela que vai pra TV. Só mostra o que o mestre mandou pro ar. */
export default function TelaPage() {
  return <Telao />;
}
