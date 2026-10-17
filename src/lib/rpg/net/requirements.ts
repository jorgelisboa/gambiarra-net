import type { CyberwareItem, GearItem } from "../../types";
import { netrunCyber } from "../cyber";
import { itemName } from "../gear";
import { pluggedDeck } from "./cyberdeck";

export interface NetNeed {
  id: string;
  label: string;
  /**
   * true: tem; false: falta e bloqueia; null: falta, mas não bloqueia (óculos: sem eles entra do
   * jeito antigo). Os interface plugs sempre dizem true ou false, porque a ficha guarda o cyberware.
   */
  ok: boolean | null;
  note: string;
}

/** O que precisa pra fazer netrun (pág. 196). */
export function netrunNeeds(gear: GearItem[], cyberware: CyberwareItem[]): NetNeed[] {
  const deck = pluggedDeck(gear);
  const cyber = netrunCyber({ cyberware });
  const goggles = gear.some((g) => g.ref === "virtualityGoggles" && g.qty > 0);
  const plugsOk = cyber.neuralLink && cyber.plugs;
  const plugsMissing = !cyber.neuralLink
    ? cyber.plugs
      ? "falta neural link"
      : "falta neural link e interface plugs"
    : "falta interface plugs (no neural link)";
  return [
    {
      id: "deck",
      label: "cyberdeck conectado",
      ok: !!deck,
      note: deck ? itemName(deck) : "conecte um deck abaixo",
    },
    {
      id: "plugs",
      label: "neural link + interface plugs",
      ok: plugsOk,
      note: plugsOk ? "neural link e interface plugs instalados" : `${plugsMissing}: instale na aba cyberware`,
    },
    {
      id: "goggles",
      label: "óculos de virtualidade",
      ok: goggles || cyber.virtuality ? true : null,
      note: goggles
        ? "você vê o ICE por cima do mundo real e continua andando nele"
        : cyber.virtuality
          ? "virtuality nos cybereyes: o ICE aparece por cima do mundo real"
          : "sem óculos na ficha: precisa deles ou de cybereyes com virtuality, senão entra do jeito antigo e fica cego pro mundo real",
    },
  ];
}
