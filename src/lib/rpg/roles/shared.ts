import { skillDef, skillLevel } from "../skills";
import type { Mod, RollCtx } from "../types";

/** Opções de select com as perícias da ficha: o valor é o nível (ou stat + nível). */
export const sheetSkills =
  (ids: string[], withStat = false) =>
  (ctx: RollCtx): Mod[] =>
    ids.map((id) => {
      const d = skillDef(id)!;
      const lvl = skillLevel(ctx.skills, id);
      const stat = ctx.stats[d.stat];
      return withStat
        ? { label: `${d.name}: ${d.stat.toLowerCase()} ${stat} + ${lvl}`, value: stat + lvl }
        : { label: `${d.name} ${lvl}`, value: lvl };
    });
