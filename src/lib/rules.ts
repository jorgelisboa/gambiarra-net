import { uid } from "./id";
import {
  STARTING_RANK,
  emptyAbility,
  emptyLifepath,
  initiativeBonus,
  maxHp,
  maxHumanity,
  netActionsOf,
} from "./rpg";
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

export function newCharacter(role: Role, stats: Stats = emptyStats()): Character {
  return {
    id: uid(),
    name: "Novo Edgerunner",
    role,
    stats,
    hp: maxHp(stats),
    humanity: maxHumanity(stats),
    roleRank: STARTING_RANK,
    ability: emptyAbility(),
    skills: [],
    lifepath: emptyLifepath(),
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

/** Completa fichas salvas antes do rank de role e do lifepath existirem (o rank era só a Interface do Netrunner). */
export function normalizeCharacter(saved: Character & { interfaceRank?: number }): Character {
  const { interfaceRank, ...ch } = saved;
  const legacyRank = ch.role === "Netrunner" ? interfaceRank : undefined;
  return {
    ...ch,
    roleRank: ch.roleRank ?? legacyRank ?? STARTING_RANK,
    ability: { ...emptyAbility(), ...ch.ability },
    skills: ch.skills ?? [],
    lifepath: { ...emptyLifepath(), ...ch.lifepath },
  };
}

export interface Vitals {
  name: string;
  hp: number;
  maxHp: number;
  netMax: number;
  ref: number;
  /** Somado à iniciativa (habilidade de role). */
  initBonus: number;
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
      netMax: netActionsOf(ch),
      ref: ch.stats.REF,
      initBonus: initiativeBonus(ch),
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
    initBonus: 0,
    color: colorFor(c.id),
    seed: c.id,
    linked: false,
  };
}

