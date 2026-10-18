import { gameName, t } from "@/i18n";
import {
  AMMO_LABELS,
  FASHION_PIECES,
  FASHION_STYLES,
  SLOT_LABELS,
  WEAPON_CATEGORY_LABELS,
  catalogItem,
  fmtEb,
  itemName,
  priceCategory,
  skillDef,
  weaponStats,
  type CatalogItem,
  type KitItem,
  type WeaponCategory,
  type WeaponDef,
} from "@/lib/rpg";
import type { GearItem } from "@/lib/types";

const G = t.gear.specs;

/** Nome da perícia em pt-BR, pra texto corrido (títulos, contas, grupos). */
export const skillName = (id: string) => {
  const d = skillDef(id);
  return d ? gameName(d) : id;
};

const hands = (n: number | null) => (n === null ? G.handsVary : n === 1 ? G.oneHand : G.hands(n));

/** Linha curta de números: "4d6 · ROF 1 · pente 8 (pistola muito pesada) · 1 mão". */
export function specsOf(def: CatalogItem): string {
  switch (def.kind) {
    case "weapon": {
      const w = weaponStats(def);
      const ammo = w.ammo ? (w.magazine ? G.magazine(w.magazine, AMMO_LABELS[w.ammo]) : AMMO_LABELS[w.ammo]) : null;
      return [
        w.damage || G.damageInBook,
        G.rof(w.rof),
        ammo,
        hands(w.hands),
        w.concealable ? G.concealable : G.notConcealable,
        w.requiresBody && `${t.stats.part("BODY", w.requiresBody)}+`,
      ]
        .filter(Boolean)
        .join(t.common.sep);
    }
    case "armor":
      return [`${t.gear.armor.units.sp} ${def.sp}`, def.penalty ? `${def.penalty} ${t.gear.penaltyStats}` : G.noPenalty].join(t.common.sep);
    case "shield":
      return G.shield(def.hp);
    case "ammo":
      return G.ammoFor(AMMO_LABELS[def.ammo]);
    case "cyberdeck":
      return G.cyberdeck(def.slots);
    default:
      return "";
  }
}

/**
 * Linhas de tipo embaixo do nome da arma, só quando dizem algo que o título não diz:
 * `name` é o nome da arma quando o jogador deu apelido; `category` é a categoria quando o nome não a mostra
 * (exótica, garras implantadas). Vazias quando seria repetir o título.
 */
export function weaponTypeLines(def: WeaponDef, item: GearItem, category: WeaponCategory) {
  const title = itemName(item).toLowerCase();
  const own = gameName(def);
  const label = WEAPON_CATEGORY_LABELS[category];
  const known = [title, own.toLowerCase()];
  return {
    name: title === own.toLowerCase() ? "" : own,
    category: known.includes(label.toLowerCase()) ? "" : label,
  };
}

export function priceOf(def: CatalogItem): string {
  if (def.cost === null) return G.priceInBook;
  const per = def.kind === "ammo" && def.pack > 1 ? G.pricePer(def.pack) : "";
  return `${fmtEb(def.cost)}${per}${t.common.sep}${priceCategory(def.cost)}`;
}

const qty = (k: KitItem) => (k.qty > 1 ? ` x${k.qty}` : "");

/** Uma opção do kit em texto. Roupas do mesmo estilo viram "chique genérico: jaqueta, blusa x4". */
export function kitText(items: KitItem[]): string {
  const defs = items.map((k) => catalogItem(k.ref));
  const style = defs[0]?.kind === "fashion" ? defs[0].style : null;
  if (style && defs.every((d) => d?.kind === "fashion" && d.style === style)) {
    const name = FASHION_STYLES.find((s) => s.id === style)?.namePt ?? style;
    const pieces = items.map((k, i) => {
      const d = defs[i];
      const piece = d?.kind === "fashion" ? FASHION_PIECES.find((p) => p.id === d.piece)?.namePt : k.ref;
      return `${piece}${qty(k)}`;
    });
    return `${name}: ${pieces.join(", ")}`;
  }
  return items
    .map((k, i) => {
      const d = defs[i];
      return `${d ? gameName(d) : k.ref}${k.slot ? ` (${SLOT_LABELS[k.slot]})` : ""}${qty(k)}`;
    })
    .join(" + ");
}
