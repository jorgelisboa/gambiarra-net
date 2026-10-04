"use client";

import { useState } from "react";
import {
  CATALOG,
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
import { priceOf, specsOf } from "./gearText";

const TABS = [
  { id: "weapons", label: "armas", kinds: ["weapon"] },
  { id: "armor", label: "armadura", kinds: ["armor", "shield"] },
  { id: "ammo", label: "munição", kinds: ["ammo"] },
  { id: "gear", label: "equipamento", kinds: ["gear", "cyberdeck", "program"] },
  { id: "fashion", label: "roupas", kinds: ["fashion"] },
] as const;

type TabId = (typeof TABS)[number]["id"];

const WEAPON_GROUPS: { id: WeaponClass; label: string }[] = [
  { id: "melee", label: "armas brancas · dex + melee weapon" },
  { id: "ranged", label: "armas de longo alcance · ref + perícia da arma" },
  { id: "exotic", label: "exóticas · raras e caras" },
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
  const kinds: readonly string[] = TABS.find((t) => t.id === tab)!.kinds;
  const visible = (d: CatalogItem) =>
    (luxury || d.cost === null || !isLuxury(d.cost)) &&
    (!q || d.name.toLowerCase().includes(q) || d.namePt.includes(q) || d.desc.includes(q));
  const items = CATALOG.filter((d) => (q || kinds.includes(d.kind)) && visible(d));

  return (
    <div className="box space-y-3 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <div role="tablist" aria-label="loja" className="flex flex-wrap gap-x-1 border-b-2 border-line">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id && !q}
              onClick={() => {
                setTab(t.id);
                setQuery("");
              }}
              className={`-mb-[2px] border-b-2 px-2 py-1 ${
                tab === t.id && !q ? "border-red text-red" : "border-transparent text-dim hover:text-fg"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <input
          className="field !w-auto min-w-32 flex-1"
          placeholder="buscar na loja"
          aria-label="buscar na loja"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <span className="text-dim">
          na mão <span className="font-bold text-red">{fmtEb(money)}</span>
        </span>
      </div>

      {creation && (
        <label className="flex items-center gap-2 text-xs text-dim">
          <input type="checkbox" checked={luxury} onChange={(e) => setLuxury(e.target.checked)} />
          mostrar itens de luxo (o livro recomenda que o mestre não libere na criação)
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
          <p className="text-dim">nada encontrado.</p>
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
        const blocked = d.cost === null ? "sem preço nestas tabelas" : d.cost > money ? "sem grana" : null;
        return (
          <li key={d.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
            <div className="min-w-0 flex-1 basis-56">
              <div>
                <span className="font-bold">{d.name}</span>{" "}
                <span className="text-xs text-dim">{d.namePt}</span>
              </div>
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
                    {slot === "body" ? "corpo" : "cabeça"}
                  </button>
                ))
              ) : (
                <button
                  className="btn !px-2 !py-0 text-xs"
                  disabled={!!blocked}
                  title={blocked ?? undefined}
                  onClick={() => onBuy(d)}
                >
                  comprar
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
            <span className="font-bold">{s.name}</span> <span className="text-xs text-dim">{s.vibe}</span>
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
                  title={cost > money ? "sem grana" : `${p.name} · ${priceOf(def)}`}
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
