import { t } from "../../../i18n";
import type { GearItem } from "../../types";
import type { WeaponDef } from "./types";

/**
 * Categoria da arma: decide o desenho na ficha e a linha da tabela de DV por distância.
 * Exóticas seguem a arma de base; armas implantadas (Wolvers, Rippers...) são garras.
 */
export type WeaponCategory =
  | "lightMelee"
  | "mediumMelee"
  | "heavyMelee"
  | "veryHeavyMelee"
  | "claws"
  | "mediumPistol"
  | "heavyPistol"
  | "veryHeavyPistol"
  | "smg"
  | "heavySmg"
  | "shotgun"
  | "assaultRifle"
  | "sniperRifle"
  | "bow"
  | "grenadeLauncher"
  | "rocketLauncher";

export const WEAPON_CATEGORY_LABELS: Record<WeaponCategory, string> = t.weapons.categories;

const BY_ID: Record<string, WeaponCategory> = {
  lightMelee: "lightMelee",
  mediumMelee: "mediumMelee",
  heavyMelee: "heavyMelee",
  veryHeavyMelee: "veryHeavyMelee",
  mediumPistol: "mediumPistol",
  heavyPistol: "heavyPistol",
  vhPistol: "veryHeavyPistol",
  smg: "smg",
  heavySmg: "heavySmg",
  shotgun: "shotgun",
  assaultRifle: "assaultRifle",
  sniperRifle: "sniperRifle",
  bow: "bow",
  grenadeLauncher: "grenadeLauncher",
  rocketLauncher: "rocketLauncher",
  battleglove: "claws",
};

/** Categoria pela arma do catálogo (e pelo item, que diz se é implante). */
export function weaponCategory(def: WeaponDef, item?: Pick<GearItem, "implant">): WeaponCategory {
  if (item?.implant && def.class === "melee") return "claws";
  const own = BY_ID[def.id] ?? (def.base ? BY_ID[def.base] : undefined);
  if (own) return own;
  return def.class === "melee" ? "mediumMelee" : "heavyPistol";
}

/** Faixas de distância das tabelas de DV (as 5 primeiras são as do autofire). */
export const RANGE_BANDS: string[] = [...t.weapons.ranges.bands];

/** DV do tiro único por distância (pág. 173). null: fora do alcance. */
const SINGLE_SHOT_DV: Record<"pistol" | "smg" | "shotgun" | "assaultRifle" | "sniperRifle" | "bow" | "grenadeLauncher" | "rocketLauncher", (number | null)[]> = {
  pistol: [13, 15, 20, 25, 30, 30, null, null],
  smg: [15, 13, 15, 20, 25, 25, 30, null],
  shotgun: [13, 15, 20, 25, 30, 35, null, null],
  assaultRifle: [17, 16, 15, 13, 15, 20, 25, 30],
  sniperRifle: [30, 25, 25, 20, 15, 16, 17, 20],
  bow: [15, 13, 15, 17, 20, 22, null, null],
  grenadeLauncher: [16, 15, 15, 17, 20, 22, 25, null],
  rocketLauncher: [17, 16, 15, 15, 20, 20, 25, 30],
};

/** Linha da tabela de DV do tiro único pra categoria; null pra arma branca (o alvo se defende com DEX + Evasion). */
export function singleShotDvs(category: WeaponCategory): (number | null)[] | null {
  switch (category) {
    case "mediumPistol":
    case "heavyPistol":
    case "veryHeavyPistol":
      return SINGLE_SHOT_DV.pistol;
    case "smg":
    case "heavySmg":
      return SINGLE_SHOT_DV.smg;
    case "shotgun":
      return SINGLE_SHOT_DV.shotgun;
    case "assaultRifle":
    case "sniperRifle":
    case "bow":
    case "grenadeLauncher":
    case "rocketLauncher":
      return SINGLE_SHOT_DV[category];
    default:
      return null;
  }
}

/** Cartucho de escopeta: um ataque contra DV13, 3d6 em todo alvo à frente a até 6m (pág. 174). */
export const SHELL_DV = 13;
export const SHELL_DAMAGE = "3d6";
