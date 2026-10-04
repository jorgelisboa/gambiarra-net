"use client";

import { useState } from "react";
import {
  SLOT_LABELS,
  STARTING_MONEY,
  STREETRAT_KITS,
  addGear,
  armorAt,
  armorPenalty,
  catalogItem,
  effectiveStats,
  fmtEb,
  itemName,
  kitItems,
  loadAll,
  type CatalogItem,
} from "@/lib/rpg";
import { uid } from "@/lib/id";
import type { ArmorSlot, Character, GearItem, Stats } from "@/lib/types";
import { specsOf } from "./gearText";
import { Shop } from "./Shop";
import { KitPicker } from "./StarterKit";
import { WeaponCard } from "./WeaponCard";

type Save = (patch: Partial<Character>) => void;

const GROUPS = [
  { id: "weapon", label: "armas" },
  { id: "armor", label: "armadura e escudo" },
  { id: "ammo", label: "munição" },
  { id: "gear", label: "equipamento" },
  { id: "fashion", label: "roupas" },
  { id: "custom", label: "outros" },
] as const;

function groupOf(it: GearItem): (typeof GROUPS)[number]["id"] {
  const d = catalogItem(it.ref);
  if (!d) return "custom";
  if (d.kind === "shield") return "armor";
  if (d.kind === "program" || d.kind === "cyberdeck") return "gear";
  return d.kind;
}

/** Aba "equipamento": dinheiro, loja, armas ligadas às perícias e armadura por local. */
export function GearSheet({ ch, save }: { ch: Character; save: Save }) {
  const [shop, setShop] = useState(false);
  const [kit, setKit] = useState(false);
  const [picks, setPicks] = useState<Record<string, number>>({});
  const [custom, setCustom] = useState("");

  const stats = effectiveStats(ch);
  const gear = ch.gear;
  const setGear = (g: GearItem[]) => save({ gear: g });
  const patch = (id: string, p: Partial<GearItem>) => setGear(gear.map((g) => (g.id === id ? { ...g, ...p } : g)));
  const remove = (id: string) => setGear(gear.filter((g) => g.id !== id));

  function buy(def: CatalogItem, slot?: ArmorSlot) {
    if (def.cost === null || def.cost > ch.money) return;
    save({ gear: addGear(gear, def.id, def.kind === "ammo" ? def.pack : 1, slot), money: ch.money - def.cost });
  }

  function receiveKit() {
    const items = kitItems(STREETRAT_KITS[ch.role], picks);
    save({
      gear: loadAll(items.reduce((g, k) => addGear(g, k.ref, k.qty, k.slot), gear)),
      money: ch.money === 0 ? STARTING_MONEY : ch.money,
    });
    setKit(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <label className="box bg-raise flex items-center gap-2 px-3 py-1">
          <span className="label">eurobucks</span>
          <input
            type="number"
            min={0}
            className="w-24 bg-transparent text-right text-xl font-bold text-red outline-none"
            value={ch.money}
            onChange={(e) => save({ money: Math.max(0, Number(e.target.value) || 0) })}
          />
          <span className="text-dim">eb</span>
        </label>
        <button className={`btn ${shop ? "btn-primary" : ""}`} onClick={() => setShop(!shop)}>
          {shop ? "fechar loja" : "loja"}
        </button>
        <button className="btn" onClick={() => setKit(!kit)}>
          kit streetrat
        </button>
      </div>

      {shop && <Shop money={ch.money} onBuy={buy} />}

      {kit && (
        <div className="space-y-3">
          <KitPicker role={ch.role} picks={picks} onPicks={setPicks} />
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-primary" onClick={receiveKit}>
              receber o kit{ch.money === 0 && ` e ${fmtEb(STARTING_MONEY)}`}
            </button>
            <button className="btn" onClick={() => setKit(false)}>
              cancelar
            </button>
          </div>
        </div>
      )}

      <ArmorStatus gear={gear} ch={ch} stats={stats} />

      {gear.length === 0 && !kit && (
        <div className="box space-y-3 p-6 text-center">
          <p className="text-dim">inventário vazio.</p>
          <button className="btn btn-primary" onClick={() => setKit(true)}>
            pegar o kit streetrat do {ch.role.toLowerCase()}
          </button>
        </div>
      )}

      {GROUPS.map((g) => {
        const list = gear.filter((it) => groupOf(it) === g.id);
        if (list.length === 0) return null;
        return (
          <section key={g.id}>
            <h3 className="label mb-2">{g.label}</h3>
            {g.id === "weapon" ? (
              <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                {list.map((it) => (
                  <WeaponCard
                    key={it.id}
                    it={it}
                    ch={ch}
                    onGear={setGear}
                    onName={(name) => patch(it.id, { name })}
                    onRemove={() => remove(it.id)}
                  />
                ))}
              </div>
            ) : (
              <ul className="box bg-raise divide-y-2 divide-line px-3">
                {list.map((it) =>
                  g.id === "armor" ? (
                    <ArmorRow key={it.id} it={it} onPatch={(p) => patch(it.id, p)} onRemove={() => remove(it.id)} />
                  ) : (
                    <StackRow key={it.id} it={it} onPatch={(p) => patch(it.id, p)} onRemove={() => remove(it.id)} />
                  ),
                )}
              </ul>
            )}
          </section>
        );
      })}

      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!custom.trim()) return;
          setGear([...gear, { id: uid(), ref: null, name: custom.trim(), qty: 1 }]);
          setCustom("");
        }}
      >
        <input
          className="field !w-auto min-w-40 flex-1"
          placeholder="outro item (escrito à mão)"
          aria-label="outro item"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
        />
        <button className="btn" disabled={!custom.trim()}>
          adicionar
        </button>
      </form>
    </div>
  );
}

/** SP por local e a penalidade que vale nas stats. */
function ArmorStatus({ gear, ch, stats }: { gear: GearItem[]; ch: Character; stats: Stats }) {
  const p = armorPenalty(gear);
  const shield = gear.find((g) => g.equipped && catalogItem(g.ref)?.kind === "shield");
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {(["head", "body"] as const).map((slot) => {
        const a = armorAt(gear, slot);
        return (
          <div key={slot} className="box bg-raise p-2 text-center">
            <span className="block text-xs text-dim">SP {SLOT_LABELS[slot]}</span>
            <span className="text-2xl font-bold text-red">{a ? a.sp : 0}</span>
            {a && <span className="text-dim">/{a.max}</span>}
          </div>
        );
      })}
      <div className="box bg-raise p-2 text-center">
        <span className="block text-xs text-dim">penalidade</span>
        {p ? (
          <span className="text-xs">
            <span className="text-xl font-bold text-red">{p}</span> ref/dex/move
            <span className="block text-dim">
              ref {stats.REF} · dex {stats.DEX} · move {stats.MOVE}
            </span>
          </span>
        ) : (
          <span className="text-xl font-bold">0</span>
        )}
      </div>
      <div className="box bg-raise p-2 text-center">
        <span className="block text-xs text-dim">escudo</span>
        {shield ? (
          <>
            <span className="text-2xl font-bold text-red">{shield.current ?? 0}</span>
            <span className="text-dim"> HP</span>
          </>
        ) : (
          <span className="text-dim">{ch.gear.some((g) => catalogItem(g.ref)?.kind === "shield") ? "guardado" : "—"}</span>
        )}
      </div>
    </div>
  );
}

function ArmorRow({
  it,
  onPatch,
  onRemove,
}: {
  it: GearItem;
  onPatch: (p: Partial<GearItem>) => void;
  onRemove: () => void;
}) {
  const def = catalogItem(it.ref);
  if (!def || (def.kind !== "armor" && def.kind !== "shield")) return null;
  const max = def.kind === "armor" ? def.sp : def.hp;
  const cur = it.current ?? max;
  const unit = def.kind === "armor" ? "SP" : "HP";
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
      <div className="min-w-0 flex-1 basis-40">
        <div>
          <span className="font-bold">{itemName(it)}</span> <span className="text-xs text-dim">{def.namePt}</span>
        </div>
        <div className="text-xs text-dim">{specsOf(def)}</div>
      </div>
      <div className="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-2">
        {def.kind === "armor" && (
          <select
            className="field !w-auto !py-0.5 text-xs"
            aria-label="local"
            value={it.slot ?? "body"}
            onChange={(e) => onPatch({ slot: e.target.value as ArmorSlot })}
          >
            <option value="body">corpo</option>
            <option value="head">cabeça</option>
          </select>
        )}
        <button
          aria-pressed={!!it.equipped}
          onClick={() => onPatch({ equipped: !it.equipped })}
          className={`border-2 px-2 py-0.5 text-xs ${it.equipped ? "border-red text-red" : "border-line text-dim hover:text-fg"}`}
        >
          {def.kind === "armor" ? (it.equipped ? "vestida" : "guardada") : it.equipped ? "em mãos" : "guardado"}
        </button>
        <span className="flex items-center">
          <button
            className="btn btn-bare !px-1.5 !py-0"
            aria-label={def.kind === "armor" ? "ablação: −1 SP" : "−1 HP"}
            title={def.kind === "armor" ? "ablação: −1 SP quando um dano passa" : "−1 HP"}
            disabled={cur <= 0}
            onClick={() => onPatch({ current: cur - 1 })}
          >
            -
          </button>
          <span className="min-w-16 whitespace-nowrap text-center">
            <span className="font-bold text-red">{cur}</span>
            <span className="text-dim">/{max}</span> <span className="text-xs text-dim">{unit}</span>
          </span>
          <button
            className="btn btn-bare !px-1.5 !py-0"
            aria-label={`+1 ${unit}`}
            disabled={cur >= max}
            onClick={() => onPatch({ current: cur + 1 })}
          >
            +
          </button>
        </span>
        <button className="btn !px-2 !py-0 text-xs" disabled={cur >= max} onClick={() => onPatch({ current: max })}>
          reparar
        </button>
        <button className="btn btn-danger btn-bare !px-1.5 !py-0" aria-label={`remover ${itemName(it)}`} onClick={onRemove}>
          x
        </button>
      </div>
    </li>
  );
}

function StackRow({
  it,
  onPatch,
  onRemove,
}: {
  it: GearItem;
  onPatch: (p: Partial<GearItem>) => void;
  onRemove: () => void;
}) {
  const def = catalogItem(it.ref);
  const sub = def ? [def.namePt, specsOf(def), def.desc].filter(Boolean).join(" · ") : null;
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
      <div className="min-w-0 flex-1 basis-40">
        {def ? (
          <div className="font-bold">{itemName(it)}</div>
        ) : (
          <input
            className="field !py-0.5"
            aria-label="nome do item"
            value={it.name}
            onChange={(e) => onPatch({ name: e.target.value })}
          />
        )}
        {sub && <div className="text-xs text-dim">{sub}</div>}
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-2">
        <span className="flex items-center" aria-label={`quantidade de ${itemName(it)}`}>
          <button
            className="btn btn-bare !px-1.5 !py-0"
            aria-label="menos um"
            disabled={it.qty <= 0}
            onClick={() => onPatch({ qty: it.qty - 1 })}
          >
            -
          </button>
          <span className="w-10 text-center font-bold">{it.qty}</span>
          <button className="btn btn-bare !px-1.5 !py-0" aria-label="mais um" onClick={() => onPatch({ qty: it.qty + 1 })}>
            +
          </button>
        </span>
        <button className="btn btn-danger btn-bare !px-1.5 !py-0" aria-label={`remover ${itemName(it)}`} onClick={onRemove}>
          x
        </button>
      </div>
    </li>
  );
}
