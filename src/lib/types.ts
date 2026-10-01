export const STAT_KEYS = [
  "INT",
  "REF",
  "DEX",
  "TECH",
  "COOL",
  "WILL",
  "LUCK",
  "MOVE",
  "BODY",
  "EMP",
] as const;

export type StatKey = (typeof STAT_KEYS)[number];
export type Stats = Record<StatKey, number>;

export const ROLES = [
  "Rockerboy",
  "Solo",
  "Netrunner",
  "Tech",
  "Medtech",
  "Media",
  "Lawman",
  "Exec",
  "Fixer",
  "Nomad",
] as const;

export type Role = (typeof ROLES)[number];

export interface CharacterNotes {
  alias: string;
  age: string;
  goal: string;
  appearance: string;
  personality: string;
  history: string;
  extra: string;
}

export interface AbilityItem {
  id: string;
  text: string;
  tag?: string;
}

/** O que o jogador escolheu dentro da habilidade de role. Regras em `src/lib/rpg`. */
export interface AbilityState {
  /** Pontos distribuídos por opção (Solo, Tech, Medtech). Ids são únicos entre roles. */
  alloc: Record<string, number>;
  /** Listas com limite por rank (motorpool do Nomad, equipe do Exec). */
  lists: Record<string, AbilityItem[]>;
}

export interface Character {
  id: string;
  name: string;
  role: Role;
  stats: Stats;
  hp: number;
  humanity: number;
  /** Rank da habilidade de role, 1–10 (Interface do Netrunner, Moto do Nomad...). */
  roleRank: number;
  ability: AbilityState;
  notes: CharacterNotes;
  createdAt: number;
}

export interface Combatant {
  id: string;
  /** Se definido, HP e stats vêm da ficha. Senão é um PNJ. */
  characterId: string | null;
  name: string;
  ref: number;
  initiative: number;
  /** Só PNJ. */
  hp: number;
  maxHp: number;
  netMax: number;
  actionUsed: boolean;
  moveUsed: boolean;
  netUsed: number;
}

export interface Combat {
  active: boolean;
  round: number;
  activeId: string | null;
  combatants: Combatant[];
}

export interface AppData {
  characters: Character[];
  sessionCharacterId: string | null;
  combat: Combat;
}
