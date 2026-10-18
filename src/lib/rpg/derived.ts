import { t } from "../../i18n";
import { d10 } from "./dice";
import type { Stats } from "../types";

/** HP = 10 + 5 × (média de BODY e WILL, arredondada pra cima). Bate com a tabela do livro. */
export const maxHp = (s: Stats) => 10 + 5 * Math.ceil((s.BODY + s.WILL) / 2);

/** Limiar de Seriously Wounded: metade do HP total, arredondada pra cima. */
export const seriousThreshold = (hpMax: number) => Math.ceil(hpMax / 2);

export const deathSave = (s: Stats) => s.BODY;

/**
 * Death save (pág. 222): 1d10 + a penalidade acumulada; vive se ficar abaixo do BODY.
 * 10 natural sempre falha. Cada death save rolado soma +1 na penalidade (quem chama guarda isso).
 */
export function rollDeathSave(body: number, penalty: number) {
  const die = d10();
  const total = die + penalty;
  return { die, total, ok: die !== 10 && total < body };
}

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

const W = t.sheet.wounds;

const WOUNDS: Record<Wound["id"], Wound> = {
  unhurt: { id: "unhurt", ...W.unhurt, penalty: 0 },
  light: { id: "light", ...W.light, penalty: 0 },
  serious: { id: "serious", ...W.serious, penalty: -2 },
  mortal: { id: "mortal", ...W.mortal, penalty: -4 },
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
