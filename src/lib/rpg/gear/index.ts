import { uid } from "../../id";
import type { ArmorSlot, GearItem } from "../../types";
import { AMMO } from "./ammo";
import { ARMORS, SHIELDS } from "./armor";
import { FASHION } from "./fashion";
import { ITEMS, PROGRAMS } from "./items";
import { kitItems, type RoleKit } from "./kits";
import { EXOTIC_WEAPONS, MELEE_WEAPONS, RANGED_WEAPONS } from "./weapons";
import type { ArmorDef, CatalogItem } from "./types";

export * from "./ammo";
export * from "./armor";
export * from "./fashion";
export * from "./items";
export * from "./kits";
export * from "./prices";
export type * from "./types";
export * from "./weapons";

/** Tudo que dá pra ter na ficha. */
export const CATALOG: CatalogItem[] = [
  ...MELEE_WEAPONS,
  ...RANGED_WEAPONS,
  ...EXOTIC_WEAPONS,
  ...ARMORS,
  ...SHIELDS,
  ...AMMO,
  ...ITEMS,
  ...PROGRAMS,
  ...FASHION,
];

const BY_ID = new Map(CATALOG.map((c) => [c.id, c]));

export const catalogItem = (id: string | null | undefined) => (id ? BY_ID.get(id) : undefined);

export const SLOT_LABELS: Record<ArmorSlot, string> = { head: "cabeça", body: "corpo" };

/** Armas, armaduras e escudos são unidades com estado próprio; o resto empilha. */
export const isUnique = (c: CatalogItem | undefined) =>
  c?.kind === "weapon" || c?.kind === "armor" || c?.kind === "shield";

export const itemName = (it: GearItem) => it.name || catalogItem(it.ref)?.name || "item";

/** Põe no inventário. Armadura nova só é vestida se o local estiver livre. */
export function addGear(gear: GearItem[], ref: string, qty = 1, slot?: ArmorSlot): GearItem[] {
  const def = catalogItem(ref);
  if (!def || qty <= 0) return gear;
  if (!isUnique(def)) {
    const i = gear.findIndex((g) => g.ref === ref && !g.name);
    if (i >= 0) return gear.map((g, j) => (j === i ? { ...g, qty: g.qty + qty } : g));
    return [...gear, { id: uid(), ref, name: "", qty }];
  }
  let out = gear;
  for (let n = 0; n < qty; n++) {
    const item: GearItem = { id: uid(), ref, name: "", qty: 1 };
    if (def.kind === "armor") {
      const at = slot ?? "body";
      item.slot = at;
      item.current = def.sp;
      item.equipped = !worn(out).some((g) => g.slot === at);
    }
    if (def.kind === "shield") {
      item.current = def.hp;
      item.equipped = false;
    }
    out = [...out, item];
  }
  return out;
}

/** Inventário inicial a partir do kit e das escolhas. */
export const gearFromKit = (kit: RoleKit, picks: Record<string, number>) =>
  kitItems(kit, picks).reduce<GearItem[]>((g, k) => addGear(g, k.ref, k.qty, k.slot), []);

/* ---------- armadura ---------- */

const armorDef = (g: GearItem) => {
  const d = catalogItem(g.ref);
  return d?.kind === "armor" ? (d as ArmorDef) : undefined;
};

/** Armaduras vestidas. */
const worn = (gear: GearItem[]) => gear.filter((g) => g.equipped && armorDef(g));

/** SP do local: a maior entre as vestidas (não soma). */
export function armorAt(gear: GearItem[], slot: ArmorSlot) {
  let best: { sp: number; max: number; item: GearItem } | null = null;
  for (const g of worn(gear)) {
    if (g.slot !== slot) continue;
    const sp = g.current ?? armorDef(g)!.sp;
    if (!best || sp > best.sp) best = { sp, max: armorDef(g)!.sp, item: g };
  }
  return best;
}

/** Penalidade em REF, DEX e MOVE: a pior entre as vestidas, uma vez só. */
export const armorPenalty = (gear: GearItem[]) =>
  Math.min(0, ...worn(gear).map((g) => armorDef(g)!.penalty));
