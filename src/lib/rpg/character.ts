import type { Character, Stats } from "../types";
import { MORTAL_MOVE_PENALTY, currentEmp, maxHp, woundOf } from "./derived";
import { armorPenalty } from "./gear";
import { roleDef } from "./roles";
import type { RollCtx } from "./types";

export const rollCtx = (ch: Character): RollCtx => ({
  rank: ch.roleRank,
  stats: ch.stats,
  state: ch.ability,
});

/** Bônus da habilidade na iniciativa (Solo: reação de iniciativa). */
export const initiativeBonus = (ch: Character) =>
  roleDef(ch.role).ability.initiative?.(ch.roleRank, ch.ability) ?? 0;

/** Ações de net por turno (só Netrunner tem). */
export const netActionsOf = (ch: Character) =>
  roleDef(ch.role).ability.netActions?.(ch.roleRank) ?? 0;

/**
 * Stats que valem nos testes: EMP com a humanidade perdida, REF, DEX e MOVE com a
 * penalidade da armadura vestida (mínimo 0) e MOVE −6 (mínimo 1) se mortalmente ferido.
 */
export function effectiveStats(ch: Character): Stats {
  const p = armorPenalty(ch.gear);
  const less = (v: number) => Math.max(0, v + p);
  let move = less(ch.stats.MOVE);
  if (woundOf(ch.hp, maxHp(ch.stats)).id === "mortal") {
    move = Math.min(move, Math.max(1, move + MORTAL_MOVE_PENALTY));
  }
  return {
    ...ch.stats,
    EMP: currentEmp(ch.stats, ch.humanity),
    REF: less(ch.stats.REF),
    DEX: less(ch.stats.DEX),
    MOVE: move,
  };
}
