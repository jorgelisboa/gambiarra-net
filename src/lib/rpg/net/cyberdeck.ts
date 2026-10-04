import { uid } from "../../id";
import type { GearItem } from "../../types";
import { catalogItem } from "../gear";
import type { CyberdeckDef } from "./types";

/** Trocar de deck é uma ação de carne (no mundo real), e só dá pra estar ligado a um por vez. */
export const SWITCH_DECK_COST = "1 ação de carne";

export function deckDef(g: GearItem): CyberdeckDef | undefined {
  const d = catalogItem(g.ref);
  return d?.kind === "cyberdeck" ? d : undefined;
}

export const decksOf = (gear: GearItem[]) => gear.filter((g) => deckDef(g));

/** O que ocupa slot no deck: programas (e o hardware, quando entrar). */
export const fitsInDeck = (g: GearItem) => catalogItem(g.ref)?.kind === "program";

export const installedIn = (gear: GearItem[], deckId: string) => gear.filter((g) => g.deck === deckId);

/** Programas fora de qualquer deck (ou num deck que saiu do inventário). */
export function looseSoftware(gear: GearItem[]) {
  const decks = new Set(decksOf(gear).map((d) => d.id));
  return gear.filter((g) => fitsInDeck(g) && !(g.deck && decks.has(g.deck)));
}

export function freeSlots(gear: GearItem[], deck: GearItem) {
  const def = deckDef(deck);
  return def ? def.slots - installedIn(gear, deck.id).length : 0;
}

/** O deck em que o netrunner está ligado agora. */
export const pluggedDeck = (gear: GearItem[]) => decksOf(gear).find((g) => g.equipped);

/** Liga num deck e solta os outros. null desliga. */
export const plugIn = (gear: GearItem[], deckId: string | null): GearItem[] =>
  gear.map((g) => (deckDef(g) ? { ...g, equipped: g.id === deckId } : g));

/** Instala num slot livre. Uma pilha antiga (qty > 1) instala uma cópia e o resto fica de fora. */
export function install(gear: GearItem[], itemId: string, deckId: string): GearItem[] {
  const item = gear.find((g) => g.id === itemId);
  const deck = gear.find((g) => g.id === deckId);
  if (!item || !deck || !fitsInDeck(item) || freeSlots(gear, deck) <= 0) return gear;
  if (item.qty <= 1) return gear.map((g) => (g.id === itemId ? { ...g, deck: deckId } : g));
  return [
    ...gear.map((g) => (g.id === itemId ? { ...g, qty: g.qty - 1 } : g)),
    { id: uid(), ref: item.ref, name: item.name, qty: 1, deck: deckId },
  ];
}

export const uninstall = (gear: GearItem[], itemId: string): GearItem[] =>
  gear.map((g) => (g.id === itemId ? { ...g, deck: undefined } : g));
