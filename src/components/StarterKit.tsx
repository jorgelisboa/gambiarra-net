"use client";

import {
  STARTING_MONEY,
  STREETRAT_KITS,
  catalogItem,
  fmtEb,
  pickKitOption,
  type KitLine,
} from "@/lib/rpg";
import { uid } from "@/lib/id";
import type { ArmorSlot, Role } from "@/lib/types";
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
    ["armas e armadura", "w", kit.weapons],
    ["roupa e equipamento", "o", kit.outfit],
  ];
  return (
    <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-2">
      {sections.map(([title, prefix, lines]) => (
        <section key={prefix} className="box bg-raise min-w-0 p-3">
          <h3 className="label mb-2">
            {title} · {role.toLowerCase()}
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
                  </li>
                );
              }
              const at = picks[key] ?? 0;
              return (
                <li key={key}>
                  <div role="group" aria-label="escolha uma opção" className="flex flex-wrap gap-1">
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
      <p className="text-xs text-dim">onde aparecem opções, escolha uma só. armas e munição ligadas andam juntas.</p>
      <KitPicker role={role} picks={picks} onPicks={onPicks} />

      <section className="space-y-3">
        <h3 className="font-pixel text-xl">
          eurobucks <span className="font-mono text-red">{fmtEb(left)}</span>
          <span className="font-mono text-sm text-dim"> de {fmtEb(STARTING_MONEY)}</span>
        </h3>
        <p className="text-dim">gaste agora no night market ou guarde pra depois. não dá pra juntar dinheiro com outro jogador.</p>
        {bought.length > 0 && (
          <ul className="space-y-1">
            {bought.map((p) => (
              <li key={p.id} className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate">
                  {kitText([p])} <span className="text-xs text-dim">{fmtEb(p.cost)}</span>
                </span>
                <button className="btn !px-2 !py-0 text-xs" onClick={() => onBought(bought.filter((x) => x.id !== p.id))}>
                  devolver
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
