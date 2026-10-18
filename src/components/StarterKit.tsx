"use client";

import { t } from "@/i18n";
import {
  FASHION_PIECES,
  FASHION_STYLES,
  STARTING_MONEY,
  STREETRAT_KITS,
  catalogItem,
  fmtEb,
  pickKitOption,
  type KitItem,
  type KitLine,
} from "@/lib/rpg";
import { uid } from "@/lib/id";
import type { ArmorSlot, Role } from "@/lib/types";
import { BookName } from "./BookName";
import { kitText, specsOf } from "./gearText";
import { Shop } from "./Shop";

/** Compra feita na criação: dá pra devolver enquanto o personagem não existe. */
export interface Purchase {
  id: string;
  ref: string;
  qty: number;
  slot?: ArmorSlot;
  cost: number;
}

export const spentOn = (bought: Purchase[]) => bought.reduce((a, p) => a + p.cost, 0);

/** Uma opção do kit pro <BookName />: o nome do livro (en) de tudo que ela traz, contra o texto pt de `kitText`. */
function kitBook(items: KitItem[]) {
  const defs = items.map((k) => catalogItem(k.ref));
  const qty = (k: KitItem) => (k.qty > 1 ? ` x${k.qty}` : "");
  const style = defs[0]?.kind === "fashion" ? defs[0].style : null;
  let name: string;
  if (style && defs.every((d) => d?.kind === "fashion" && d.style === style)) {
    const pieces = items.map((k, i) => {
      const d = defs[i];
      const piece = d?.kind === "fashion" ? FASHION_PIECES.find((p) => p.id === d.piece)?.name : k.ref;
      return `${piece?.toLowerCase()}${qty(k)}`;
    });
    name = `${FASHION_STYLES.find((s) => s.id === style)?.name ?? style}: ${pieces.join(", ")}`;
  } else {
    name = items.map((k, i) => `${defs[i]?.name ?? k.ref}${qty(k)}`).join(" + ");
  }
  return { name, namePt: kitText(items) };
}

/** Kit Streetrat do role, com as escolhas "isto ou aquilo". */
export function KitPicker({
  role,
  picks,
  onPicks,
}: {
  role: Role;
  picks: Record<string, number>;
  onPicks: (p: Record<string, number>) => void;
}) {
  const kit = STREETRAT_KITS[role];
  const sections: [title: string, prefix: string, lines: KitLine[]][] = [
    [t.creation.kit.weaponsArmor, "w", kit.weapons],
    [t.creation.kit.outfit, "o", kit.outfit],
  ];
  return (
    <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-2">
      {sections.map(([title, prefix, lines]) => (
        <section key={prefix} className="box bg-raise min-w-0 p-3">
          <h3 className="label mb-2">
            {t.creation.kit.sectionTitle(title, role.toLowerCase())}
          </h3>
          <ul className="space-y-1.5">
            {lines.map((line, i) => {
              const key = `${prefix}${i}`;
              if (line.options.length === 1) {
                const first = catalogItem(line.options[0][0].ref);
                return (
                  <li key={key} title={first ? [specsOf(first), first.desc].filter(Boolean).join(" · ") : undefined}>
                    <span className="text-dim">· </span>
                    {kitText(line.options[0])}
                    <BookName def={kitBook(line.options[0])} />
                  </li>
                );
              }
              const at = picks[key] ?? 0;
              return (
                <li key={key}>
                  <div role="group" aria-label={t.creation.kit.pickGroupAria} className="flex flex-wrap gap-1">
                    {line.options.map((opt, j) => (
                      <button
                        key={j}
                        aria-pressed={at === j}
                        onClick={() => onPicks(pickKitOption(kit, picks, key, j))}
                        className={`border-2 px-2 py-0.5 text-left ${
                          at === j ? "border-red text-red" : "border-line text-dim hover:text-fg"
                        }`}
                      >
                        {kitText(opt)}
                        <BookName def={kitBook(opt)} />
                      </button>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

/** Passo "equipamento" da criação: kit do role + 500eb pra gastar ou guardar. */
export function StarterKit({
  role,
  picks,
  onPicks,
  bought,
  onBought,
}: {
  role: Role;
  picks: Record<string, number>;
  onPicks: (p: Record<string, number>) => void;
  bought: Purchase[];
  onBought: (b: Purchase[]) => void;
}) {
  const left = STARTING_MONEY - spentOn(bought);
  return (
    <div className="space-y-4">
      <p className="text-xs text-dim">{t.creation.kit.hint}</p>
      <KitPicker role={role} picks={picks} onPicks={onPicks} />

      <section className="space-y-3">
        <h3 className="font-pixel text-xl">
          {t.creation.kit.money} <span className="font-mono text-red">{fmtEb(left)}</span>
          <span className="font-mono text-sm text-dim"> {t.creation.kit.moneyOf} {fmtEb(STARTING_MONEY)}</span>
        </h3>
        <p className="text-dim">{t.creation.kit.moneyHint}</p>
        {bought.length > 0 && (
          <ul className="space-y-1">
            {bought.map((p) => (
              <li key={p.id} className="flex items-center gap-2">
                <span className="min-w-0 flex-1">
                  <span className="block truncate">
                    {kitText([p])} <span className="text-xs text-dim">{fmtEb(p.cost)}</span>
                  </span>
                  <BookName def={kitBook([p])} />
                </span>
                <button className="btn !px-2 !py-0 text-xs" onClick={() => onBought(bought.filter((x) => x.id !== p.id))}>
                  {t.creation.kit.giveBack}
                </button>
              </li>
            ))}
          </ul>
        )}
        <Shop
          money={left}
          creation
          onBuy={(def, slot) => {
            if (def.cost === null) return;
            const qty = def.kind === "ammo" ? def.pack : 1;
            onBought([...bought, { id: uid(), ref: def.id, qty, slot, cost: def.cost }]);
          }}
        />
      </section>
    </div>
  );
}
