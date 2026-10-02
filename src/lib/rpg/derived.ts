import type { Stats } from "../types";

/** HP = 10 + 5 × (média de BODY e WILL, arredondada pra cima). Bate com a tabela do livro. */
export const maxHp = (s: Stats) => 10 + 5 * Math.ceil((s.BODY + s.WILL) / 2);

/** Limiar de Seriously Wounded: metade do HP total, arredondada pra cima. */
export const seriousThreshold = (hpMax: number) => Math.ceil(hpMax / 2);

export const deathSave = (s: Stats) => s.BODY;

/** Mortalmente ferido: −6 de MOVE, mínimo 1. */
export const MORTAL_MOVE_PENALTY = -6;

/** Humanidade máxima: 10 por ponto de EMP. */
export const maxHumanity = (s: Stats) => s.EMP * 10;

/**
 * EMP em uso: cai toda vez que a dezena da humanidade cai (44 → 4, 39 → 3) e nunca passa do
 * EMP da ficha. O EMP da ficha continua sendo a base da humanidade máxima. Testes de EMP usam este.
 */
export const currentEmp = (s: Stats, humanity: number) =>
  Math.max(0, Math.min(s.EMP, Math.floor(humanity / 10)));

/** Humanidade abaixo de zero: ciberpsicose. */
export const isCyberpsycho = (humanity: number) => humanity < 0;

export interface Wound {
  id: "unhurt" | "light" | "serious" | "mortal";
  label: string;
  /** Rótulo curto pra combate. */
  short: string;
  effect: string;
  /** Soma em todo teste (ações, perícias). */
  penalty: number;
  /** DV pra estabilizar (First Aid ou Paramedic). */
  stabilize: string;
}

const WOUNDS: Record<Wound["id"], Wound> = {
  unhurt: { id: "unhurt", label: "ileso", short: "", effect: "", penalty: 0, stabilize: "" },
  light: {
    id: "light",
    label: "levemente ferido",
    short: "ferido",
    effect: "sem penalidade",
    penalty: 0,
    stabilize: "DV10",
  },
  serious: {
    id: "serious",
    label: "gravemente ferido",
    short: "grave",
    effect: "−2 em todas as ações",
    penalty: -2,
    stabilize: "DV13",
  },
  mortal: {
    id: "mortal",
    label: "mortalmente ferido",
    short: "mortal",
    effect:
      "−4 em todas as ações, −6 de MOVE (mín. 1), death save no início de cada turno. dano de ataque causa ferimento crítico e +1 na penalidade de death save",
    penalty: -4,
    stabilize: "DV15: volta a 1 HP e fica inconsciente por 1 minuto",
  },
};

/**
 * Estado de ferimento pelo HP (vale pra PNJ também). Cada estado substitui o anterior.
 * Abaixo do limiar = grave; abaixo de 1 = mortal. Morto: falhou um death save.
 */
export function woundOf(hp: number, hpMax: number): Wound {
  if (hp < 1) return WOUNDS.mortal;
  if (hp < seriousThreshold(hpMax)) return WOUNDS.serious;
  if (hp < hpMax) return WOUNDS.light;
  return WOUNDS.unhurt;
}
