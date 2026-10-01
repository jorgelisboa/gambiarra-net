import { uid } from "../../id";
import type { Lifepath, LifepathEntry } from "../../types";
import { rollOn, sides } from "../tables";
import { LIFEPATH } from "./sections";
import type { LifepathList, LifepathPick, Picks } from "./types";

export * from "./family";
export * from "./goals";
export * from "./motivations";
export * from "./origins";
export * from "./personal";
export * from "./relations";
export * from "./sections";
export type * from "./types";

export const emptyLifepath = (): Lifepath => ({ picks: {}, lists: {} });

export const optionsFor = (p: LifepathPick, picks: Picks) =>
  typeof p.table === "function" ? p.table(picks) : p.table;

export const diceLabel = (p: LifepathPick, picks: Picks) =>
  p.dice ?? `1d${sides(optionsFor(p, picks))}`;

/**
 * Troca uma escolha. Se outra dependia dela (idioma ← região) e o valor tinha vindo
 * da tabela antiga, limpa; texto escrito à mão fica.
 */
export function setPick(defs: LifepathPick[], picks: Picks, id: string, text: string): Picks {
  const next = { ...picks, [id]: text };
  for (const d of defs) {
    const cur = next[d.id];
    if (d.dependsOn !== id || !cur) continue;
    const fromOld = optionsFor(d, picks).some((e) => e.text === cur);
    const inNew = optionsFor(d, next).some((e) => e.text === cur);
    if (fromOld && !inNew) next[d.id] = "";
  }
  return next;
}

/** Rola um campo; devolve a face e o texto. */
export function rollPick(p: LifepathPick, picks: Picks) {
  const { face, entry } = rollOn(optionsFor(p, picks));
  return { face, text: entry.text };
}

/** Rola os campos em ordem, pra quem depende de outro rolar depois dele. */
export function rollPicks(defs: LifepathPick[], picks: Picks = {}): Picks {
  return defs.reduce((acc, d) => ({ ...acc, [d.id]: rollPick(d, acc).text }), picks);
}

export const emptyEntry = (): LifepathEntry => ({ id: uid(), picks: {}, note: "" });

export const rollEntry = (list: LifepathList): LifepathEntry => ({
  ...emptyEntry(),
  picks: rollPicks(list.fields),
});

/** Rola a quantidade (1d10 − 7) e cada item. */
export function rollList(list: LifepathList) {
  const count = list.count.roll();
  return { count, entries: Array.from({ length: count.total }, () => rollEntry(list)) };
}

/** Lifepath inteiro rolado. */
export function randomLifepath(): Lifepath {
  const lp = emptyLifepath();
  for (const s of LIFEPATH) {
    if (s.picks) lp.picks = rollPicks(s.picks, lp.picks);
    if (s.list) lp.lists[s.list.id] = rollList(s.list).entries;
  }
  return lp;
}

export const lifepathFilled = (lp: Lifepath) =>
  Object.values(lp.picks).some(Boolean) || Object.values(lp.lists).some((l) => l.length > 0);

/** Todos os campos simples, na ordem (pra dependências entre seções). */
export const LIFEPATH_PICKS = LIFEPATH.flatMap((s) => s.picks ?? []);
