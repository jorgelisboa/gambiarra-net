"use client";

import { useState } from "react";
import { t } from "@/i18n";
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
import { BookName } from "./BookName";
import { specsOf } from "./gearText";
import { Shop } from "./Shop";
import { KitPicker } from "./StarterKit";
import { WeaponCard } from "./WeaponCard";

type Save = (patch: Partial<Character>) => void;

const GROUPS = [
  { id: "weapon", label: t.gear.groups.weapon },
  { id: "armor", label: t.gear.groups.armor },
  { id: "ammo", label: t.gear.groups.ammo },
  { id: "gear", label: t.gear.groups.gear },
  { id: "fashion", label: t.gear.groups.fashion },
  { id: "custom", label: t.gear.groups.custom },
] as const;

function groupOf(it: GearItem): (typeof GROUPS)[number]["id"] {
  const d = catalogItem(it.ref);
  if (!d) return "custom";
  if (d.kind === "shield") return "armor";
  if (d.kind === "program" || d.kind === "cyberdeck") return "gear";
  return d.kind;
}

/** Etiqueta dos itens que vêm de um implante (armas, armadura, escudo). */
function ImplantTag() {
  return (
    <span className="text-xs text-net" title={t.gear.implant.hint}>
      {t.gear.implant.tag}
    </span>
  );
}

/** Aba "equipamento": dinheiro, loja, armas ligadas às perícias e armadura por local. */
export function GearSheet({ ch, save }: { ch: Character; save: Save }) {
  const [shop, setShop] = useState(false);
  const [kit, setKit] = useState(false);
  const [picks, setPicks] = useState<Record<string, number>>({});
  const [custom, setCustom] = useState("");

  const S = t.gear.sheet;
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
          <span className="label">{S.money}</span>
          <input
            type="number"
            min={0}
            className="w-24 bg-transparent text-right text-xl font-bold text-red outline-none"
            value={ch.money}
            onChange={(e) => save({ money: Math.max(0, Number(e.target.value) || 0) })}
          />
          <span className="text-dim">{S.moneyUnit}</span>
        </label>
        <button className={`btn ${shop ? "btn-primary" : ""}`} onClick={() => setShop(!shop)}>
          {shop ? S.closeShop : S.shop}
        </button>
        <button className="btn" onClick={() => setKit(!kit)}>
          {S.kit}
        </button>
      </div>

      {shop && <Shop money={ch.money} onBuy={buy} />}

      {kit && (
        <div className="space-y-3">
          <KitPicker role={ch.role} picks={picks} onPicks={setPicks} />
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-primary" onClick={receiveKit}>
              {S.receiveKit(ch.money === 0 ? fmtEb(STARTING_MONEY) : undefined)}
            </button>
            <button className="btn" onClick={() => setKit(false)}>
              {t.common.actions.cancel}
            </button>
          </div>
        </div>
      )}

      <ArmorStatus gear={gear} ch={ch} stats={stats} />

      {gear.length === 0 && !kit && (
        <div className="box space-y-3 p-6 text-center">
          <p className="text-dim">{S.empty}</p>
          <button className="btn btn-primary" onClick={() => setKit(true)}>
            {S.takeKit(ch.role.toLowerCase())}
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
                    locked={it.implant ? t.gear.implant.tag : undefined}
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
          placeholder={S.customPlaceholder}
          aria-label={S.customLabel}
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
        />
        <button className="btn" disabled={!custom.trim()}>
          {t.common.actions.add}
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
            <span className="block text-xs text-dim">{t.gear.armor.spAt(SLOT_LABELS[slot])}</span>
            <span className="text-2xl font-bold text-red">{a ? a.sp : 0}</span>
            {a && <span className="text-dim">/{a.max}</span>}
          </div>
        );
      })}
      <div className="box bg-raise p-2 text-center">
        <span className="block text-xs text-dim">{t.common.words.penalty}</span>
        {p ? (
          <span className="text-xs">
            <span className="text-xl font-bold text-red">{p}</span> {t.gear.penaltyStats}
            <span className="block text-dim">
              {(["REF", "DEX", "MOVE"] as const).map((k) => t.stats.part(k, stats[k])).join(t.common.sep)}
            </span>
          </span>
        ) : (
          <span className="text-xl font-bold">0</span>
        )}
      </div>
      <div className="box bg-raise p-2 text-center">
        <span className="block text-xs text-dim">{t.gear.armor.shield}</span>
        {shield ? (
          <>
            <span className="text-2xl font-bold text-red">{shield.current ?? 0}</span>
            <span className="text-dim"> {t.gear.armor.units.hp}</span>
          </>
        ) : (
          <span className="text-dim">
            {ch.gear.some((g) => catalogItem(g.ref)?.kind === "shield") ? t.gear.armor.shieldStowed : t.common.words.none}
          </span>
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
  const A = t.gear.armor;
  const unit = def.kind === "armor" ? A.units.sp : A.units.hp;
  // armadura implantada fica sempre vestida e no mesmo local; escudo implantado levanta e abaixa, mas não sai
  const fixedArmor = !!it.implant && def.kind === "armor";
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
      <div className="min-w-0 flex-1 basis-40">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-bold">{itemName(it)}</span>
          {it.implant && <ImplantTag />}
        </div>
        <BookName def={def} />
        <div className="text-xs text-dim">{specsOf(def)}</div>
      </div>
      <div className="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-2">
        {def.kind === "armor" &&
          (fixedArmor ? (
            <span className="text-xs text-dim">{SLOT_LABELS[it.slot ?? "body"]}</span>
          ) : (
            <select
              className="field !w-auto !py-0.5 text-xs"
              aria-label={A.slotLabel}
              value={it.slot ?? "body"}
              onChange={(e) => onPatch({ slot: e.target.value as ArmorSlot })}
            >
              <option value="body">{SLOT_LABELS.body}</option>
              <option value="head">{SLOT_LABELS.head}</option>
            </select>
          ))}
        {fixedArmor ? (
          <button
            disabled
            aria-pressed
            title={t.gear.implant.hint}
            className="border-2 border-red px-2 py-0.5 text-xs text-red"
          >
            {A.worn}
          </button>
        ) : (
          <button
            aria-pressed={!!it.equipped}
            onClick={() => onPatch({ equipped: !it.equipped })}
            className={`border-2 px-2 py-0.5 text-xs ${it.equipped ? "border-red text-red" : "border-line text-dim hover:text-fg"}`}
          >
            {def.kind === "armor" ? (it.equipped ? A.worn : A.stowed) : it.equipped ? A.shieldHeld : A.shieldStowed}
          </button>
        )}
        <span className="flex items-center">
          <button
            className="btn btn-bare !px-1.5 !py-0"
            aria-label={def.kind === "armor" ? A.ablate : A.shieldMinus}
            title={def.kind === "armor" ? A.ablateHint : A.shieldMinus}
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
            aria-label={A.plusOne(unit)}
            disabled={cur >= max}
            onClick={() => onPatch({ current: cur + 1 })}
          >
            +
          </button>
        </span>
        <button className="btn !px-2 !py-0 text-xs" disabled={cur >= max} onClick={() => onPatch({ current: max })}>
          {A.repair}
        </button>
        {!it.implant && (
          <button className="btn btn-danger btn-bare !px-1.5 !py-0" aria-label={t.common.aria.remove(itemName(it))} onClick={onRemove}>
            x
          </button>
        )}
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
  const sub = def ? [specsOf(def), def.desc].filter(Boolean).join(t.common.sep) : null;
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
      <div className="min-w-0 flex-1 basis-40">
        {def || it.implant ? (
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-bold">{itemName(it)}</span>
            {it.implant && <ImplantTag />}
          </div>
        ) : (
          <input
            className="field !py-0.5"
            aria-label={t.gear.sheet.itemName}
            value={it.name}
            onChange={(e) => onPatch({ name: e.target.value })}
          />
        )}
        {def && <BookName def={def} />}
        {sub && <div className="text-xs text-dim">{sub}</div>}
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-2">
        {it.implant ? (
          <span className="w-10 text-center font-bold" aria-label={t.gear.sheet.quantityOf(itemName(it))}>
            {it.qty}
          </span>
        ) : (
          <>
            <span className="flex items-center" aria-label={t.gear.sheet.quantityOf(itemName(it))}>
              <button
                className="btn btn-bare !px-1.5 !py-0"
                aria-label={t.gear.sheet.minusOne}
                disabled={it.qty <= 0}
                onClick={() => onPatch({ qty: it.qty - 1 })}
              >
                -
              </button>
              <span className="w-10 text-center font-bold">{it.qty}</span>
              <button className="btn btn-bare !px-1.5 !py-0" aria-label={t.gear.sheet.plusOne} onClick={() => onPatch({ qty: it.qty + 1 })}>
                +
              </button>
            </span>
            <button className="btn btn-danger btn-bare !px-1.5 !py-0" aria-label={t.common.aria.remove(itemName(it))} onClick={onRemove}>
              x
            </button>
          </>
        )}
      </div>
    </li>
  );
}
