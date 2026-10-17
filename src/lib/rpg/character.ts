import type { Character, Stats } from "../types";
import { cyberInitiative, cyberSkillBonuses, cyberStats, ignoresSerious } from "./cyber";
import { MORTAL_MOVE_PENALTY, currentEmp, deathSave, maxHp, woundOf } from "./derived";
import { armorPenalty } from "./gear";
import { roleDef } from "./roles";
import type { CombatMods, RoleSkill, RollCtx, SkillBonus } from "./types";

export const rollCtx = (ch: Character): RollCtx => ({
  rank: ch.roleRank,
  stats: effectiveStats(ch),
  state: ch.ability,
  skills: ch.skills,
});

const abilityOf = (ch: Character) => roleDef(ch.role).ability;

/**
 * Bônus nas perícias: da habilidade de role (Tech: campo; Nomad: veículos; Solo: percepção) e do
 * cyberware. Os que têm `when` só valem em parte dos testes: a ficha mostra, mas não soma.
 */
export const skillBonusesOf = (ch: Character): SkillBonus[] => [
  ...(abilityOf(ch).skillBonus?.(ch.roleRank, ch.ability).filter((b) => b.value > 0) ?? []),
  ...cyberSkillBonuses(ch),
];

/** Perícias que só existem pelo role (Medtech). */
export const roleSkillsOf = (ch: Character): RoleSkill[] =>
  abilityOf(ch).roleSkills?.(ch.roleRank, ch.ability) ?? [];

/** O que a habilidade muda em combate (Solo). */
export const combatModsOf = (ch: Character): CombatMods => ({
  attack: 0,
  firstHitDamage: 0,
  ignoreFumble: false,
  deflection: 0,
  ...abilityOf(ch).combat?.(ch.roleRank, ch.ability),
});

/** Bônus na iniciativa: da habilidade (Solo: reação de iniciativa) e do cyberware (Kerenzikov, Sandevistan). */
export const initiativeBonus = (ch: Character) =>
  (roleDef(ch.role).ability.initiative?.(ch.roleRank, ch.ability) ?? 0) + cyberInitiative(ch);

/** Ações de net por turno (só Netrunner tem). */
export const netActionsOf = (ch: Character) =>
  roleDef(ch.role).ability.netActions?.(ch.roleRank) ?? 0;

/**
 * Stats que valem nos testes: BODY com o cyberware, EMP com a humanidade perdida, REF, DEX e MOVE
 * com a penalidade da armadura vestida (mínimo 0) e MOVE −6 (mínimo 1) se mortalmente ferido.
 */
export function effectiveStats(ch: Character): Stats {
  const base = cyberStats(ch);
  const p = armorPenalty(ch.gear);
  const less = (v: number) => Math.max(0, v + p);
  let move = less(base.MOVE);
  if (woundOf(ch.hp, hpMaxOf(ch)).id === "mortal") {
    move = Math.min(move, Math.max(1, move + MORTAL_MOVE_PENALTY));
  }
  return {
    ...base,
    EMP: currentEmp(ch.stats, ch.humanity),
    REF: less(base.REF),
    DEX: less(base.DEX),
    MOVE: move,
  };
}

/** HP máximo com o BODY do cyberware (grafted muscle, linear frames). Use sempre este na ficha. */
export const hpMaxOf = (ch: Character) => maxHp(cyberStats(ch));

/** Death save com o BODY do cyberware. */
export const deathSaveOf = (ch: Character) => deathSave(cyberStats(ch));

/** Penalidade de ferimento nos testes. Pain Editor ignora a de gravemente ferido. */
export function woundPenaltyOf(ch: Character): number {
  const w = woundOf(ch.hp, hpMaxOf(ch));
  return w.id === "serious" && ignoresSerious(ch) ? 0 : w.penalty;
}
