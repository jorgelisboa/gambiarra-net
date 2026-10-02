import {
  AMMO_LABELS,
  FASHION_PIECES,
  FASHION_STYLES,
  SLOT_LABELS,
  catalogItem,
  fmtEb,
  priceCategory,
  weaponStats,
  type CatalogItem,
  type KitItem,
} from "@/lib/rpg";

const hands = (n: number | null) => (n === null ? "mãos: varia" : n === 1 ? "1 mão" : `${n} mãos`);

/** Linha curta de números: "4d6 · rof 1 · pente 8 (pistola muito pesada) · 1 mão". */
export function specsOf(def: CatalogItem): string {
  switch (def.kind) {
    case "weapon": {
      const w = weaponStats(def);
      const ammo = w.ammo
        ? w.magazine
          ? `pente ${w.magazine} (${AMMO_LABELS[w.ammo]})`
          : AMMO_LABELS[w.ammo]
        : null;
      return [
        w.damage || "dano: ver livro",
        `rof ${w.rof}`,
        ammo,
        hands(w.hands),
        w.concealable ? "ocultável" : "não ocultável",
        w.requiresBody && `body ${w.requiresBody}+`,
      ]
        .filter(Boolean)
        .join(" · ");
    }
    case "armor":
      return `SP ${def.sp} · ${def.penalty ? `${def.penalty} ref/dex/move` : "sem penalidade"}`;
    case "shield":
      return `${def.hp} HP · ocupa um braço`;
    case "ammo":
      return `pra ${AMMO_LABELS[def.ammo]}`;
    default:
      return "";
  }
}

export function priceOf(def: CatalogItem): string {
  if (def.cost === null) return "preço no livro";
  const per = def.kind === "ammo" && def.pack > 1 ? ` a cada ${def.pack}` : "";
  return `${fmtEb(def.cost)}${per} · ${priceCategory(def.cost)}`;
}

const qty = (k: KitItem) => (k.qty > 1 ? ` x${k.qty}` : "");

/** Uma opção do kit em texto. Roupas do mesmo estilo viram "Generic Chic: jacket, top x4". */
export function kitText(items: KitItem[]): string {
  const defs = items.map((k) => catalogItem(k.ref));
  const style = defs[0]?.kind === "fashion" ? defs[0].style : null;
  if (style && defs.every((d) => d?.kind === "fashion" && d.style === style)) {
    const name = FASHION_STYLES.find((s) => s.id === style)?.name ?? style;
    const pieces = items.map((k, i) => {
      const d = defs[i];
      const piece = d?.kind === "fashion" ? FASHION_PIECES.find((p) => p.id === d.piece)?.name : k.ref;
      return `${piece?.toLowerCase()}${qty(k)}`;
    });
    return `${name}: ${pieces.join(", ")}`;
  }
  return items
    .map((k, i) => `${defs[i]?.name ?? k.ref}${k.slot ? ` (${SLOT_LABELS[k.slot]})` : ""}${qty(k)}`)
    .join(" + ");
}
