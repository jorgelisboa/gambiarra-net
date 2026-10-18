import { gameName, t } from "../../../i18n";
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
        ? { label: `${gameName(d)}: ${t.stats.part(d.stat, stat)} + ${lvl}`, value: stat + lvl }
        : { label: `${gameName(d)} ${lvl}`, value: lvl };
    });
