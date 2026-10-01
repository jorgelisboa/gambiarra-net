import type { Character } from "../types";
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
