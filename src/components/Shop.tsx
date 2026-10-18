"use client";

import { useState } from "react";
import { gameName, t } from "@/i18n";
import {
  CATALOG,
  SLOT_LABELS,
  FASHION_PIECES,
  FASHION_STYLES,
  catalogItem,
  fashionId,
  fmtEb,
  isLuxury,
  type CatalogItem,
  type WeaponClass,
} from "@/lib/rpg";
import type { ArmorSlot } from "@/lib/types";
import { BookName } from "./BookName";
import { priceOf, skillName, specsOf } from "./gearText";

const TABS = [
  { id: "weapons", label: t.gear.shop.tabs.weapons, kinds: ["weapon"] },
  { id: "armor", label: t.gear.shop.tabs.armor, kinds: ["armor", "shield"] },
  { id: "ammo", label: t.gear.shop.tabs.ammo, kinds: ["ammo"] },
  { id: "gear", label: t.gear.shop.tabs.gear, kinds: ["gear", "cyberdeck", "program"] },
  { id: "fashion", label: t.gear.shop.tabs.fashion, kinds: ["fashion"] },
] as const;

type TabId = (typeof TABS)[number]["id"];

const WEAPON_GROUPS: { id: WeaponClass; label: string }[] = [
  { id: "melee", label: t.gear.shop.weaponGroups.melee(skillName("meleeWeapon")) },
  { id: "ranged", label: t.gear.shop.weaponGroups.ranged },
  { id: "exotic", label: t.gear.shop.weaponGroups.exotic },
];

/** Night Market: o catálogo do livro com botão de comprar. */
export function Shop({
  money,
  onBuy,
  creation = false,
}: {
  money: number;
  onBuy: (def: CatalogItem, slot?: ArmorSlot) => void;
  /** Na criação o livro recomenda não liberar luxo pra cima. */
  creation?: boolean;
}) {
  const [tab, setTab] = useState<TabId>("weapons");
  const [query, setQuery] = useState("");
  const [luxury, setLuxury] = useState(!creation);

  const q = query.trim().toLowerCase();
  const kinds: readonly string[] = TABS.find((x) => x.id === tab)!.kinds;
  const visible = (d: CatalogItem) =>
    !(d.kind === "armor" && d.implant) && // skin weave e subdermal só vêm do cyberware, nunca da loja
    (luxury || d.cost === null || !isLuxury(d.cost)) &&
    (!q || d.name.toLowerCase().includes(q) || d.namePt.toLowerCase().includes(q) || d.desc.toLowerCase().includes(q));
  const items = CATALOG.filter((d) => (q || kinds.includes(d.kind)) && visible(d));

  return (
    <div className="box space-y-3 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <div role="tablist" aria-label={t.gear.shop.label} className="flex flex-wrap gap-x-1 border-b-2 border-line">
          {TABS.map((x) => (
            <button
              key={x.id}
              role="tab"
              aria-selected={tab === x.id && !q}
              onClick={() => {
                setTab(x.id);
                setQuery("");
              }}
              className={`-mb-[2px] border-b-2 px-2 py-1 ${
                tab === x.id && !q ? "border-red text-red" : "border-transparent text-dim hover:text-fg"
              }`}
            >
              {x.label}
            </button>
          ))}
        </div>
        <input
          className="field !w-auto min-w-32 flex-1"
          placeholder={t.gear.shop.search}
          aria-label={t.gear.shop.search}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <span className="text-dim">
          {t.gear.shop.cash} <span className="font-bold text-red">{fmtEb(money)}</span>
        </span>
      </div>

      {creation && (
        <label className="flex items-center gap-2 text-xs text-dim">
          <input type="checkbox" checked={luxury} onChange={(e) => setLuxury(e.target.checked)} />
          {t.gear.shop.luxury}
        </label>
      )}

      <div className="max-h-[32rem] space-y-4 overflow-y-auto pr-1">
        {tab === "fashion" && !q ? (
          <FashionTable money={money} luxury={luxury} onBuy={onBuy} />
        ) : tab === "weapons" && !q ? (
          WEAPON_GROUPS.map((g) => {
            const list = items.filter((d) => d.kind === "weapon" && d.class === g.id);
            return list.length === 0 ? null : (
              <div key={g.id}>
                <h4 className="label mb-1">{g.label}</h4>
                <ShopList items={list} money={money} onBuy={onBuy} />
              </div>
            );
          })
        ) : items.length === 0 ? (
          <p className="text-dim">{t.gear.shop.notFound}</p>
        ) : (
          <ShopList items={items} money={money} onBuy={onBuy} />
        )}
      </div>
    </div>
  );
}

function ShopList({
  items,
  money,
  onBuy,
}: {
  items: CatalogItem[];
  money: number;
  onBuy: (def: CatalogItem, slot?: ArmorSlot) => void;
}) {
  return (
    <ul className="divide-y-2 divide-line">
      {items.map((d) => {
        const specs = specsOf(d);
        const blocked = d.cost === null ? t.gear.shop.noPrice : d.cost > money ? t.gear.shop.noMoney : null;
        return (
          <li key={d.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
            <div className="min-w-0 flex-1 basis-56">
              <div className="font-bold">{gameName(d)}</div>
              <BookName def={d} />
              {specs && <div className="text-xs">{specs}</div>}
              {d.desc && <div className="text-xs text-dim">{d.desc}</div>}
            </div>
            <div className="ml-auto flex shrink-0 items-center gap-2">
              <span className="text-xs text-dim">{priceOf(d)}</span>
              {d.kind === "armor" ? (
                (["body", "head"] as const).map((slot) => (
                  <button
                    key={slot}
                    className="btn !px-2 !py-0 text-xs"
                    disabled={!!blocked}
                    title={blocked ?? undefined}
                    onClick={() => onBuy(d, slot)}
                  >
                    {SLOT_LABELS[slot]}
                  </button>
                ))
              ) : (
                <button
                  className="btn !px-2 !py-0 text-xs"
                  disabled={!!blocked}
                  title={blocked ?? undefined}
                  onClick={() => onBuy(d)}
                >
                  {t.common.actions.buy}
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** Roupas: estilo × peça, como a tabela Fashion do livro. */
function FashionTable({
  money,
  luxury,
  onBuy,
}: {
  money: number;
  luxury: boolean;
  onBuy: (def: CatalogItem) => void;
}) {
  return (
    <ul className="divide-y-2 divide-line">
      {FASHION_STYLES.map((s) => (
        <li key={s.id} className="py-2">
          <div>
            <span className="font-bold">{s.namePt}</span> <span className="text-xs text-dim">{s.vibe}</span>
            <BookName def={s} />
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            {FASHION_PIECES.map((p, i) => {
              const cost = s.prices[i];
              if (!luxury && isLuxury(cost)) return null;
              const def = catalogItem(fashionId(s.id, p.id))!;
              return (
                <button
                  key={p.id}
                  className="btn btn-bare !px-2 !py-0 text-xs"
                  disabled={cost > money}
                  title={cost > money ? t.gear.shop.noMoney : `${p.namePt}${t.common.sep}${priceOf(def)}`}
                  onClick={() => onBuy(def)}
                >
                  {p.namePt} <span className="text-dim">{fmtEb(cost)}</span>
                </button>
              );
            })}
          </div>
        </li>
      ))}
    </ul>
  );
}
