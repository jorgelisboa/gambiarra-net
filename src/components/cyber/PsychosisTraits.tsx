"use client";

import { useState } from "react";
import { t } from "@/i18n";
import {
  addTrait,
  cyberpsychosis,
  hareCount,
  removeTrait,
  rollTrait,
  traitDef,
  traitKindFor,
  traitName,
  traitsNeeded,
  traitsOfKind,
  type TraitKind,
} from "@/lib/rpg";
import type { Character } from "@/lib/types";
import { BookName } from "../BookName";

const KINDS: TraitKind[] = ["dissociation", "psychopathy"];

const segment = (on: boolean) =>
  `min-h-10 border-2 px-2 text-xs ${on ? "border-red bg-red text-black" : "border-line text-dim hover:text-fg"}`;

/**
 * Traços de ciberpsicose da ficha: a lista, quantos o livro pede no nível atual e, aberto,
 * rolar na tabela, escolher da lista ou escrever um traço próprio.
 */
export function PsychosisTraits({ ch, save }: { ch: Character; save: (next: Character) => void }) {
  const T = t.cyber.traits;
  const psy = cyberpsychosis(ch);
  const need = traitsNeeded(psy);
  const have = hareCount(ch);

  const [open, setOpen] = useState(false);
  // null: segue a tabela do nível (dissociação no limite, Hare a partir da dissociação)
  const [chosen, setChosen] = useState<TraitKind | null>(null);
  const [pick, setPick] = useState("");
  const [text, setText] = useState("");
  const [last, setLast] = useState<string | null>(null);

  const kind = chosen ?? traitKindFor(psy);
  const table = traitsOfKind(kind);
  const free = table.filter((d) => !ch.psychosis.some((x) => x.ref === d.id));

  const roll = () => {
    const r = rollTrait(ch, kind);
    if (!r) return;
    save(r.ch);
    setLast(T.rolled(r.die, r.sides, r.def.namePt));
  };
  const put = () => {
    if (!pick) return;
    save(addTrait(ch, { ref: pick }));
    setPick("");
    setLast(null);
  };
  const write = () => {
    if (!text.trim()) return;
    save(addTrait(ch, { text }));
    setText("");
    setLast(null);
  };

  return (
    <div className="space-y-2 border-t-2 border-line pt-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h3 className="label">{T.title}</h3>
        {need > 0 && <span className={`text-xs ${have < need ? "text-red" : "text-dim"}`}>{T.count(have, need)}</span>}
        <button className="btn ml-auto" aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? T.close : T.open}
        </button>
      </div>

      {ch.psychosis.length === 0 ? (
        <p className="text-xs text-dim">{T.none}</p>
      ) : (
        <ul className="space-y-1">
          {ch.psychosis.map((tr) => {
            const def = traitDef(tr.ref);
            const name = traitName(tr);
            return (
              <li key={tr.id} className="flex items-start gap-2 border-2 border-line bg-panel px-2 py-1">
                <div className="min-w-0 flex-1 text-sm">
                  <span className="font-bold">{name}</span>
                  {def ? <BookName def={def} /> : <span className="block text-xs text-dim">{T.written}</span>}
                  {def && <span className="block text-xs text-dim">{def.hint}</span>}
                </div>
                <button
                  className="btn btn-danger btn-bare !px-1.5 !py-0"
                  aria-label={T.removeAria(name)}
                  onClick={() => save(removeTrait(ch, tr.id))}
                >
                  x
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {open && (
        <div className="space-y-2">
          <div role="group" aria-label={T.kindAria} className="flex flex-wrap gap-1">
            {KINDS.map((id) => (
              <button
                key={id}
                type="button"
                aria-pressed={kind === id}
                className={segment(kind === id)}
                onClick={() => {
                  setChosen(id);
                  setPick("");
                  setLast(null);
                }}
              >
                {T.kinds[id]}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button className="btn btn-primary min-h-10" disabled={free.length === 0} onClick={roll}>
              {T.roll(table.length)}
            </button>
            {last && <span className="text-xs text-red">{last}</span>}
            {free.length === 0 && <span className="text-xs text-dim">{T.allTaken}</span>}
          </div>

          {free.length > 0 && (
            <div className="flex gap-2">
              <select
                className="field min-h-10 min-w-0 flex-1 text-xs"
                aria-label={T.pickAria}
                value={pick}
                onChange={(e) => setPick(e.target.value)}
              >
                <option value="">{T.pickPlaceholder}</option>
                {free.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.namePt}
                  </option>
                ))}
              </select>
              <button className="btn min-h-10 shrink-0" disabled={!pick} onClick={put}>
                {T.put}
              </button>
            </div>
          )}

          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              write();
            }}
          >
            <input
              className="field min-h-10 min-w-0 flex-1 text-xs"
              aria-label={T.writeAria}
              placeholder={T.writePlaceholder}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <button type="submit" className="btn min-h-10 shrink-0" disabled={!text.trim()}>
              {T.put}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
