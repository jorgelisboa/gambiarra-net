import type { GearItem } from "../../types";
import { itemName } from "../gear";
import { pluggedDeck } from "./cyberdeck";

export interface NetNeed {
  id: string;
  label: string;
  /** null: a ficha ainda não sabe dizer (cyberware não entrou). */
  ok: boolean | null;
  note: string;
}

/** O que precisa pra fazer netrun (pág. 196). */
export function netrunNeeds(gear: GearItem[]): NetNeed[] {
  const deck = pluggedDeck(gear);
  const goggles = gear.some((g) => g.ref === "virtualityGoggles" && g.qty > 0);
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
      ok: null,
      note: "cyberware: o deck liga nos interface plugs, que pedem um neural link (pág. 359). a ficha ainda não guarda cyberware",
    },
    {
      id: "goggles",
      label: "óculos de virtualidade",
      ok: goggles ? true : null,
      note: goggles
        ? "você vê o ICE por cima do mundo real e continua andando nele"
        : "sem óculos na ficha: precisa deles ou de cybereyes com virtuality, senão entra do jeito antigo e fica cego pro mundo real",
    },
  ];
}
