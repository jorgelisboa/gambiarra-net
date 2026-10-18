import { t } from "../../../i18n";
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
  const N = t.net.needs;
  const plugsMissing = !cyber.neuralLink
    ? cyber.plugs
      ? N.plugs.noLink
      : N.plugs.noLinkNoPlugs
    : N.plugs.noPlugs;
  return [
    {
      id: "deck",
      label: N.deck.label,
      ok: !!deck,
      note: deck ? itemName(deck) : N.deck.missing,
    },
    {
      id: "plugs",
      label: N.plugs.label,
      ok: plugsOk,
      note: plugsOk ? N.plugs.ok : N.plugs.missing(plugsMissing),
    },
    {
      id: "goggles",
      label: N.goggles.label,
      ok: goggles || cyber.virtuality ? true : null,
      note: goggles ? N.goggles.withGoggles : cyber.virtuality ? N.goggles.withCybereyes : N.goggles.without,
    },
  ];
}
