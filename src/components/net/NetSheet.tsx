"use client";

import {
  CYBERDECKS,
  SWITCH_DECK_COST,
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
import { Bar } from "../Pixel";
import { RefBlock, UseCard } from "../RoleAbility";

type Save = (patch: Partial<Character>) => void;

const DECK_TABLE: RefTable = {
  title: "tipos de cyberdeck",
  rows: CYBERDECKS.map((d) => [d.namePt, `${fmtEb(d.cost!)} (${priceCategory(d.cost!)})`, `${d.slots} slots`]),
  note: "programas e hardware dividem os mesmos slots: o que separa um deck bom de um barato é quantos slots ele tem.",
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
          <span className="block text-xs text-dim">interface</span>
          <span className="text-2xl font-bold text-net">{ch.roleRank}</span>
        </div>
        <div className="box bg-raise p-2 text-center">
          <span className="block text-xs text-dim">ações de net por turno</span>
          <span className="text-2xl font-bold text-net">{netActionsOf(ch)}</span>
        </div>
      </div>

      <section>
        <h3 className="label mb-2">pra fazer netrun</h3>
        <ul className="space-y-1.5">
          {netrunNeeds(gear).map((n) => (
            <Need key={n.id} need={n} />
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h3 className="label">cyberdecks</h3>
        {decks.length === 0 && (
          <p className="text-dim">sem cyberdeck. compre um na aba equipamento.</p>
        )}
        {decks.map((d) => (
          <DeckCard key={d.id} deck={d} gear={gear} loose={loose} onChange={setGear} />
        ))}
        {decks.length > 0 && (
          <p className="text-xs text-dim">
            só dá pra estar ligado a um deck por vez. trocar de deck gasta {SWITCH_DECK_COST} (no mundo real).
          </p>
        )}
        {loose.length > 0 && decks.length === 0 && (
          <p className="text-xs text-dim">
            programas sem deck: {loose.map(itemName).join(", ")}.
          </p>
        )}
      </section>

      <section className="space-y-2">
        <h3 className="label">ações de net · interface + 1d10</h3>
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
        <span className="font-pixel min-w-0 flex-1 truncate text-lg" style={{ color: on ? "var(--net)" : undefined }}>
          {itemName(deck)}
        </span>
        <button
          className={`btn ${on ? "!border-net !text-net" : ""}`}
          aria-pressed={on}
          onClick={() => onChange(plugIn(gear, on ? null : deck.id))}
        >
          {on ? "conectado" : "conectar"}
        </button>
      </div>

      <div>
        <div className="mb-1 flex justify-between text-xs">
          <span className="text-dim">slots</span>
          <span className="font-mono">
            {inside.length}/{def.slots}
          </span>
        </div>
        <Bar value={inside.length} max={def.slots} color="var(--net)" cells={def.slots} height={10} />
      </div>

      {inside.length > 0 && (
        <ul className="space-y-1">
          {inside.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-2">
              <span className="min-w-0 truncate">{itemName(p)}</span>
              <button className="btn btn-bare !px-2 !py-0 text-xs text-dim" onClick={() => onChange(uninstall(gear, p.id))}>
                tirar
              </button>
            </li>
          ))}
        </ul>
      )}

      {loose.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-dim">{free > 0 ? "instalar:" : "deck cheio"}</span>
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
