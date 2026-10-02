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

/** Quem está logado: o mestre vê a mesa toda; o jogador só as próprias fichas. */
export type UserRole = "mestre" | "jogador";

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

/** Membro da equipe do Exec. Classe, stats e pacotes vêm de `src/lib/rpg/roles/team.ts`. */
export interface TeamMember {
  id: string;
  /** Classe na tabela do livro (guarda-costas, motorista...). */
  job: string;
  name: string;
  /** Emprego de fachada. */
  cover: string;
  /** Linha da tabela de stats (1–6). */
  row: number;
  hp: number;
  /** Sem teto durante a sessão; no fim dela, no máximo 10. */
  loyalty: number;
}

/** O que o jogador escolheu dentro da habilidade de role. Regras em `src/lib/rpg`. */
export interface AbilityState {
  /** Pontos distribuídos por opção (Solo, Tech, Medtech). Ids são únicos entre roles. */
  alloc: Record<string, number>;
  /** Listas com limite (motorpool do Nomad, fármacos do Medtech). */
  lists: Record<string, AbilityItem[]>;
  /** Equipe do Exec. */
  team: TeamMember[];
}

export interface LifepathEntry {
  id: string;
  picks: Record<string, string>;
  /** Nome ou detalhe livre (quem é o amigo, o inimigo...). */
  note: string;
}

/** Lore do personagem (lifepath do livro). As chaves vêm de `src/lib/rpg/lifepath`. */
export interface Lifepath {
  /** Escolha de cada tabela, pelo id da tabela. Texto livre vale. */
  picks: Record<string, string>;
  /** Amigos, inimigos, amores trágicos. */
  lists: Record<string, LifepathEntry[]>;
}

/** Uma perícia na ficha. As regras (stat, categoria) vêm de `src/lib/rpg/skills.ts`. */
export interface SkillEntry {
  /** Único na ficha. Perícia sem especialização usa o próprio id da perícia. */
  id: string;
  /** Id da perícia em SKILLS. */
  skill: string;
  /** Idioma, região, ciência, instrumento ou estilo. Vazio nas perícias sem especialização. */
  spec: string;
  level: number;
}

export type ArmorSlot = "head" | "body";

/** Um item no inventário. Regras (dano, SP, preço) vêm de `src/lib/rpg/gear`. */
export interface GearItem {
  id: string;
  /** Id no catálogo; null = item escrito à mão. */
  ref: string | null;
  /** Marca ou apelido; vazio usa o nome do catálogo. */
  name: string;
  qty: number;
  /** Armadura: onde está. */
  slot?: ArmorSlot;
  /** Armadura: SP atual (cai 1 a cada dano que passa). Escudo: HP atual. */
  current?: number;
  /** Armadura vestida / escudo em mãos. */
  equipped?: boolean;
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
  skills: SkillEntry[];
  gear: GearItem[];
  /** Eurobucks. */
  money: number;
  /** +1 a cada dano de ataque levado já mortalmente ferido. */
  deathSavePenalty: number;
  lifepath: Lifepath;
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
  /** Só PNJ: SP atual por local. */
  armor?: Record<ArmorSlot, number>;
  /** Só PNJ: +1 a cada dano de ataque levado já mortalmente ferido. */
  deathSavePenalty?: number;
  /** Round em que o desvio de dano do Solo já foi usado. */
  deflectedRound?: number;
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
