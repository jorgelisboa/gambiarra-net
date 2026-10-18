"use client";

import { useState } from "react";
import { t } from "@/i18n";
import {
  LIFEPATH,
  LIFEPATH_PICKS,
  diceLabel,
  emptyEntry,
  faces,
  lifepathFilled,
  optionsFor,
  randomLifepath,
  rollEntry,
  rollList,
  rollPick,
  setPick,
  type LifepathList,
  type LifepathPick,
  type Picks,
} from "@/lib/rpg";
import type { Lifepath, LifepathEntry } from "@/lib/types";

/** Tabelas do lifepath: cada campo escolhe da lista, rola ou aceita texto livre. */
export function LifepathEditor({
  value,
  onChange,
}: {
  value: Lifepath;
  onChange: (lp: Lifepath) => void;
}) {
  // muda a key dos campos ao rolar tudo, pra zerar o "rolou N" e o modo de edição
  const [gen, setGen] = useState(0);

  function rollAll() {
    if (lifepathFilled(value) && !confirm(t.creation.lifepath.confirmRollAll)) {
      return;
    }
    onChange(randomLifepath());
    setGen(gen + 1);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-dim">{t.creation.lifepath.hint}</p>
        <button className="btn btn-primary" onClick={rollAll}>
          {t.creation.lifepath.rollAll}
        </button>
      </div>
      {LIFEPATH.map((sec) => (
        <section key={sec.id} className="box bg-raise space-y-3 p-3">
          <div>
            <h4 className="label">{sec.title}</h4>
            {sec.note && <p className="mt-1 text-xs text-dim">{sec.note}</p>}
          </div>
          {sec.picks && (
            <div className="grid gap-3 sm:grid-cols-2">
              {sec.picks.map((p) => (
                <PickField
                  key={`${p.id}-${gen}`}
                  def={p}
                  picks={value.picks}
                  onChange={(text) =>
                    onChange({ ...value, picks: setPick(LIFEPATH_PICKS, value.picks, p.id, text) })
                  }
                />
              ))}
            </div>
          )}
          {sec.list && (
            <ListField
              key={gen}
              def={sec.list}
              items={value.lists[sec.list.id] ?? []}
              onChange={(items) =>
                onChange({ ...value, lists: { ...value.lists, [sec.list!.id]: items } })
              }
            />
          )}
        </section>
      ))}
    </div>
  );
}

const CUSTOM = "custom";

function PickField({
  def,
  picks,
  onChange,
}: {
  def: LifepathPick;
  picks: Picks;
  onChange: (text: string) => void;
}) {
  const value = picks[def.id] ?? "";
  const options = optionsFor(def, picks);
  const labels = def.dice ? null : faces(options);
  const idx = options.findIndex((e) => e.text === value);
  const [editing, setEditing] = useState(false);
  const [rolled, setRolled] = useState<{ n: number; face: number } | null>(null);
  const custom = editing || (value !== "" && idx < 0);
  const wide = options.some((e) => e.text.length > 44);

  function roll() {
    const r = rollPick(def, picks);
    setEditing(false);
    setRolled({ n: (rolled?.n ?? 0) + 1, face: r.face });
    onChange(r.text);
  }

  return (
    <div className={`min-w-0 ${wide ? "sm:col-span-2" : ""}`}>
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-xs text-dim">{def.label}</span>
        <span className="flex items-center gap-2">
          {rolled && !def.dice && (
            <span key={rolled.n} className="animate-hop text-xs font-bold text-red">
              {rolled.face}
            </span>
          )}
          <button
            className="btn !px-1 !py-0 text-xs"
            aria-label={t.common.aria.roll(def.label)}
            disabled={options.length === 0}
            onClick={roll}
          >
            {diceLabel(def, picks)}
          </button>
        </span>
      </div>
      <select
        className="field"
        aria-label={def.label}
        value={custom ? CUSTOM : idx >= 0 ? String(idx) : ""}
        onChange={(e) => {
          const v = e.target.value;
          if (v === CUSTOM) return setEditing(true);
          setEditing(false);
          onChange(v === "" ? "" : options[Number(v)].text);
        }}
      >
        <option value="">{t.creation.lifepath.emptyOption}</option>
        {options.map((e, i) => (
          <option key={e.text} value={i}>
            {labels ? `${labels[i]}${t.common.sep}${e.text}` : e.text}
          </option>
        ))}
        <option value={CUSTOM}>{t.creation.lifepath.custom}</option>
      </select>
      {custom && (
        <input
          className="field mt-1"
          aria-label={t.creation.lifepath.freeTextAria(def.label)}
          placeholder={t.creation.lifepath.freeTextPlaceholder}
          autoFocus={editing}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {idx >= 0 && options[idx].hint && (
        <p className="mt-1 text-xs text-dim">{options[idx].hint}</p>
      )}
    </div>
  );
}

function ListField({
  def,
  items,
  onChange,
}: {
  def: LifepathList;
  items: LifepathEntry[];
  onChange: (items: LifepathEntry[]) => void;
}) {
  const [last, setLast] = useState<{ die: number; total: number } | null>(null);
  const patch = (id: string, p: Partial<LifepathEntry>) =>
    onChange(items.map((it) => (it.id === id ? { ...it, ...p } : it)));

  function rollCount() {
    const r = rollList(def);
    setLast({ die: r.count.dice[0], total: r.count.total });
    onChange(r.entries);
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <button className="btn text-xs" onClick={rollCount}>
          {t.creation.lifepath.rollCount(def.count.label)}
        </button>
        <button className="btn text-xs" onClick={() => onChange([...items, emptyEntry()])}>
          {t.common.actions.add}
        </button>
        {last && (
          <span className="text-xs text-dim">
            {t.creation.lifepath.countResult(last.die)} <span className="font-bold text-fg">{last.total}</span>
          </span>
        )}
      </div>
      {items.length === 0 && <p className="text-xs text-dim">{t.creation.lifepath.none(def.itemLabel)}</p>}
      <ul className="space-y-2">
        {items.map((it, i) => (
          <li key={it.id} className="space-y-2 border-2 border-line p-2">
            <div className="flex items-center gap-2">
              <span className="font-pixel shrink-0">
                {t.creation.lifepath.itemTitle(def.itemLabel, i + 1)}
              </span>
              <input
                className="field !py-1"
                aria-label={t.creation.lifepath.noteAria(def.itemLabel, i + 1, def.notePlaceholder)}
                placeholder={def.notePlaceholder}
                value={it.note}
                onChange={(e) => patch(it.id, { note: e.target.value })}
              />
              <button
                className="btn shrink-0 text-xs"
                onClick={() => patch(it.id, { picks: rollEntry(def).picks })}
              >
                {t.common.actions.roll}
              </button>
              <button
                className="btn btn-bare btn-danger shrink-0"
                aria-label={t.common.aria.remove(`${def.itemLabel} ${i + 1}`)}
                onClick={() => onChange(items.filter((x) => x.id !== it.id))}
              >
                x
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {def.fields.map((f) => (
                <PickField
                  key={f.id}
                  def={f}
                  picks={it.picks}
                  onChange={(text) => patch(it.id, { picks: setPick(def.fields, it.picks, f.id, text) })}
                />
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
