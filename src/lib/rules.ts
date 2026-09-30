import type { Character, Combatant, Role, Stats } from "./types";

export const STAT_LABELS: Record<keyof Stats, string> = {
  INT: "Inteligência",
  REF: "Reflexos",
  DEX: "Destreza",
  TECH: "Técnica",
  COOL: "Frieza",
  WILL: "Vontade",
  LUCK: "Sorte",
  MOVE: "Movimento",
  BODY: "Corpo",
  EMP: "Empatia",
};

export const emptyStats = (): Stats => ({
  INT: 5,
  REF: 5,
  DEX: 5,
  TECH: 5,
  COOL: 5,
  WILL: 5,
  LUCK: 5,
  MOVE: 5,
  BODY: 5,
  EMP: 5,
});

export const maxHp = (s: Stats) => 10 + 5 * Math.ceil((s.BODY + s.WILL) / 2);
export const maxHumanity = (s: Stats) => s.EMP * 10;

/** Ações de Net por nível de Interface. Conferir com o livro. */
export const netActionsFor = (rank: number) =>
  rank >= 10 ? 5 : rank >= 7 ? 4 : rank >= 4 ? 3 : 2;

export const isNetrunner = (role: Role) => role === "Netrunner";

export const d10 = () => Math.floor(Math.random() * 10) + 1;

export const uid = () =>
  globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);

export function newCharacter(): Character {
  const stats = emptyStats();
  return {
    id: uid(),
    name: "Novo Edgerunner",
    role: "Solo",
    stats,
    hp: maxHp(stats),
    humanity: maxHumanity(stats),
    interfaceRank: 1,
    notes: {
      alias: "",
      age: "",
      goal: "",
      appearance: "",
      personality: "",
      history: "",
      extra: "",
    },
    createdAt: Date.now(),
  };
}

export interface Vitals {
  name: string;
  hp: number;
  maxHp: number;
  netMax: number;
  ref: number;
  color: string;
  seed: string;
  linked: boolean;
}

const PALETTE = ["#ff3b30", "#3df0d8", "#ffb000", "#7dff6b", "#b388ff", "#e8e8e0"];

export const colorFor = (seed: string) => {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
};

export function vitalsOf(c: Combatant, characters: Character[]): Vitals {
  const ch = c.characterId ? characters.find((x) => x.id === c.characterId) : null;
  if (ch) {
    return {
      name: ch.name,
      hp: ch.hp,
      maxHp: maxHp(ch.stats),
      netMax: isNetrunner(ch.role) ? netActionsFor(ch.interfaceRank) : 0,
      ref: ch.stats.REF,
      color: colorFor(ch.id),
      seed: ch.id,
      linked: true,
    };
  }
  return {
    name: c.name,
    hp: c.hp,
    maxHp: c.maxHp,
    netMax: c.netMax,
    ref: c.ref,
    color: colorFor(c.id),
    seed: c.id,
    linked: false,
  };
}

