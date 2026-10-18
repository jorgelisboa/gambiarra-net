"use client";

import { gameName, t } from "@/i18n";
import {
  CYBERDECKS,
  SWITCH_DECK_COST,
  catalogItem,
  deckDef,
  decksOf,
  fmtEb,
  freeSlots,
  install,
  installedIn,
  itemName,
  looseSoftware,
  netActionsOf,
  netrunNeeds,
  plugIn,
  priceCategory,
  roleDef,
  uninstall,
  type NetNeed,
  type RefTable,
} from "@/lib/rpg";
import type { Character, GearItem } from "@/lib/types";
import { BookName } from "../BookName";
import { Bar } from "../Pixel";
import { RefBlock, UseCard } from "../RoleAbility";

type Save = (patch: Partial<Character>) => void;

const S = t.net.sheet;

const DECK_TABLE: RefTable = {
  title: S.deckTable.title,
  rows: CYBERDECKS.map((d) => [gameName(d), S.deckTable.price(fmtEb(d.cost!), priceCategory(d.cost!)), S.deckTable.slots(d.slots)]),
  note: S.deckTable.note,
};

/** Aba "netrun" da ficha do Netrunner: interface, o que precisa pra entrar, cyberdecks e ações de net. */
export function NetSheet({ ch, save }: { ch: Character; save: Save }) {
  const gear = ch.gear;
  const setGear = (g: GearItem[]) => save({ gear: g });
  const decks = decksOf(gear);
  const loose = looseSoftware(gear);
  const uses = roleDef("Netrunner").ability.uses ?? [];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2">
        <div className="box bg-raise p-2 text-center">
          <span className="block text-xs text-dim">{S.interface}</span>
          <span className="text-2xl font-bold text-net">{ch.roleRank}</span>
        </div>
        <div className="box bg-raise p-2 text-center">
          <span className="block text-xs text-dim">{S.netActionsPerTurn}</span>
          <span className="text-2xl font-bold text-net">{netActionsOf(ch)}</span>
        </div>
      </div>

      <section>
        <h3 className="label mb-2">{S.needsTitle}</h3>
        <ul className="space-y-1.5">
          {netrunNeeds(gear, ch.cyberware).map((n) => (
            <Need key={n.id} need={n} />
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h3 className="label">{S.decksTitle}</h3>
        {decks.length === 0 && <p className="text-dim">{S.noDeck}</p>}
        {decks.map((d) => (
          <DeckCard key={d.id} deck={d} gear={gear} loose={loose} onChange={setGear} />
        ))}
        {decks.length > 0 && (
          <p className="text-xs text-dim">{S.oneDeckAtATime(SWITCH_DECK_COST)}</p>
        )}
        {loose.length > 0 && decks.length === 0 && (
          <p className="text-xs text-dim">{S.looseSoftware(loose.map(itemName).join(", "))}</p>
        )}
      </section>

      <section className="space-y-2">
        <h3 className="label">{S.actionsTitle}</h3>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {uses.map((u) => (
            <UseCard key={u.id} use={u} ch={ch} accent="var(--net)" />
          ))}
        </div>
      </section>

      <RefBlock table={DECK_TABLE} />
    </div>
  );
}

const MARK: Record<string, { text: string; className: string }> = {
  true: { text: "[x]", className: "text-net" },
  false: { text: "[ ]", className: "text-red" },
  null: { text: "[?]", className: "text-dim" },
};

function Need({ need }: { need: NetNeed }) {
  const m = MARK[String(need.ok)];
  return (
    <li className="flex gap-2">
      <span className={`shrink-0 font-mono ${m.className}`}>{m.text}</span>
      <span className="min-w-0">
        {need.label}
        <span className="block text-xs text-dim">{need.note}</span>
      </span>
    </li>
  );
}

/** Um deck: conectar, slots ocupados e o que está instalado. Programa solto entra com um toque. */
function DeckCard({
  deck,
  gear,
  loose,
  onChange,
}: {
  deck: GearItem;
  gear: GearItem[];
  loose: GearItem[];
  onChange: (g: GearItem[]) => void;
}) {
  const def = deckDef(deck)!;
  const on = !!deck.equipped;
  const inside = installedIn(gear, deck.id);
  const free = freeSlots(gear, deck);

  return (
    <div className={`box space-y-3 p-3 ${on ? "!border-net" : ""}`}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-0 flex-1">
          <span className="font-pixel block truncate text-lg" style={{ color: on ? "var(--net)" : undefined }}>
            {itemName(deck)}
          </span>
          <BookName def={def} />
        </div>
        <button
          className={`btn ${on ? "!border-net !text-net" : ""}`}
          aria-pressed={on}
          onClick={() => onChange(plugIn(gear, on ? null : deck.id))}
        >
          {on ? S.connected : S.connect}
        </button>
      </div>

      <div>
        <div className="mb-1 flex justify-between text-xs">
          <span className="text-dim">{S.slots}</span>
          <span className="font-mono">
            {inside.length}/{def.slots}
          </span>
        </div>
        <Bar value={inside.length} max={def.slots} color="var(--net)" cells={def.slots} height={10} />
      </div>

      {inside.length > 0 && (
        <ul className="space-y-1">
          {inside.map((p) => {
            const pdef = catalogItem(p.ref);
            return (
              <li key={p.id} className="flex items-center justify-between gap-2">
                <span className="min-w-0">
                  <span className="block truncate">{itemName(p)}</span>
                  {pdef && <BookName def={pdef} />}
                </span>
                <button className="btn btn-bare !px-2 !py-0 text-xs text-dim" onClick={() => onChange(uninstall(gear, p.id))}>
                  {S.uninstall}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {loose.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-dim">{free > 0 ? S.install : S.deckFull}</span>
          {free > 0 &&
            loose.map((p) => (
              <button key={p.id} className="btn !px-2 !py-0" onClick={() => onChange(install(gear, p.id, deck.id))}>
                + {itemName(p)}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
