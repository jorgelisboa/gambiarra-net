import type { Metadata } from "next";
import { Telao } from "@/components/Telao";
import { t } from "@/i18n";

export const metadata: Metadata = {
  title: t.telao.meta.title,
};

/** O telão: a janela que vai pra TV. Só mostra o que o mestre mandou pro ar. */
export default function TelaPage() {
  return <Telao />;
}
