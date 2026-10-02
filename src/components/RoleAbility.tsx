"use client";

import { useState } from "react";
import {
  MAX_RANK,
  allocate,
  canAddItem,
  canLower,
  canRaise,
  fitToRank,
  listItems,
  optionCap,
  pointsIn,
  rankRange,
  roleDef,
  rollCtx,
  spent,
  tierActive,
  type AllocDef,
  type ListDef,
  type RollResult,
  type TierTable,
  type UseDef,
} from "@/lib/rpg";
import { uid } from "@/lib/id";
import type { AbilityItem, AbilityState, Character } from "@/lib/types";
import { Bar } from "./Pixel";

/** Habilidade de role na ficha: rank, limites, botões de uso e tabelas por rank. */
export function RoleAbility({
  ch,
  save,
}: {
  ch: Character;
  save: (patch: Partial<Character>) => void;
}) {
  const ab = roleDef(ch.role).ability;
  const rank = ch.roleRank;
  const accent = ch.role === "Netrunner" ? "var(--net)" : "var(--red)";
  const passives = ab.passives?.(rank, ch.ability) ?? [];
  const setState = (ability: AbilityState) => save({ ability });
  const setRank = (r: number) => {
    const next = Math.max(1, Math.min(MAX_RANK, r));
    save({ roleRank: next, ability: fitToRank(ab, ch.ability, next) });
  };

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 max-w-xl">
          <h3 className="label">habilidade de role</h3>
          <div className="font-pixel text-2xl leading-tight" style={{ color: accent }}>
            {ab.name}
          </div>
          <p className="text-dim">
            <span className="text-fg">{ab.namePt}</span> · {ab.summary}
          </p>
        </div>
        <RankControl rank={rank} color={accent} onChange={setRank} />
      </div>

      {passives.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {passives.map((p) => (
            <li key={p} className="border-2 px-2 py-0.5" style={{ borderColor: accent }}>
              {p}
            </li>
          ))}
        </ul>
      )}

      {ab.alloc && (
        <AllocBlock
          def={ab.alloc}
          state={ch.ability}
          rank={rank}
          accent={accent}
          onChange={setState}
        />
      )}

      {ab.lists?.map((l) => (
        <ListBlock key={l.id} def={l} state={ch.ability} rank={rank} onChange={setState} />
      ))}

      {ab.uses && (
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {ab.uses.map((u) => (
            <UseCard key={u.id} use={u} ch={ch} accent={accent} />
          ))}
        </div>
      )}

      {ab.tables?.map((t) => (
        <TierBlock key={t.title} table={t} rank={rank} accent={accent} />
      ))}

      {ab.notes && (
        <ul className="space-y-1 text-xs text-dim">
          {ab.notes.map((n) => (
            <li key={n}>* {n}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

function RankControl({
  rank,
  color,
  onChange,
}: {
  rank: number;
  color: string;
  onChange: (r: number) => void;
}) {
  return (
    <div className="box bg-raise p-3">
      <div className="flex items-center justify-between gap-4">
        <span className="label">rank</span>
        <div className="flex items-center gap-1">
          <button
            className="btn btn-bare !px-2"
            aria-label="diminuir rank"
            disabled={rank <= 1}
            onClick={() => onChange(rank - 1)}
          >
            -
          </button>
          <span className="w-9 text-center text-3xl font-bold" style={{ color }}>
            {rank}
          </span>
          <button
            className="btn btn-bare !px-2"
            aria-label="aumentar rank"
            disabled={rank >= MAX_RANK}
            onClick={() => onChange(rank + 1)}
          >
            +
          </button>
        </div>
      </div>
      <div className="mt-2 w-44">
        <Bar value={rank} max={MAX_RANK} cells={MAX_RANK} color={color} />
      </div>
    </div>
  );
}

function AllocBlock({
  def,
  state,
  rank,
  accent,
  onChange,
}: {
  def: AllocDef;
  state: AbilityState;
  rank: number;
  accent: string;
  onChange: (s: AbilityState) => void;
}) {
  const budget = def.budget(rank);
  const used = spent(def, state);
  return (
    <div className="box bg-raise p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="label">{def.title}</span>
        <span>
          <span className="font-bold" style={{ color: used === budget ? accent : undefined }}>
            {used}/{budget}
          </span>{" "}
          <span className="text-dim">
            {used < budget ? `· sobram ${budget - used}` : "· tudo distribuído"}
          </span>
        </span>
      </div>
      <Bar value={used} max={budget} cells={budget} color={accent} />
      <ul className="mt-2 divide-y-2 divide-line">
        {def.options.map((o) => {
          const p = pointsIn(state, o.id);
          const step = o.step ?? 1;
          const cap = Math.floor(optionCap(def, o, rank) / step) * step;
          return (
            <li key={o.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2">
              <div className="min-w-48 flex-1">
                <div>
                  {o.name}
                  {p > 0 && <span style={{ color: accent }}> · {o.effect(p)}</span>}
                </div>
                <div className="text-xs text-dim">{o.rule}</div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  className="btn btn-bare !px-2"
                  aria-label={`tirar ${step} de ${o.name}`}
                  disabled={!canLower(o, state)}
                  onClick={() => onChange(allocate(def, state, o.id, -1, rank))}
                >
                  -
                </button>
                <span className="w-14 text-center" title={`teto no rank ${rank}: ${cap}`}>
                  <span className="font-bold">{p}</span>
                  <span className="text-dim">/{cap}</span>
                </span>
                <button
                  className="btn btn-bare !px-2"
                  aria-label={`pôr ${step} em ${o.name}`}
                  disabled={!canRaise(def, o, state, rank)}
                  onClick={() => onChange(allocate(def, state, o.id, 1, rank))}
                >
                  +
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ListBlock({
  def,
  state,
  rank,
  onChange,
}: {
  def: ListDef;
  state: AbilityState;
  rank: number;
  onChange: (s: AbilityState) => void;
}) {
  const items = listItems(state, def.id);
  const max = def.max(rank);
  const setItems = (next: AbilityItem[]) =>
    onChange({ ...state, lists: { ...state.lists, [def.id]: next } });
  const patch = (id: string, p: Partial<AbilityItem>) =>
    setItems(items.map((it) => (it.id === id ? { ...it, ...p } : it)));
  const nextTag = (tag: string | undefined, tags: string[]) =>
    tags[(tags.indexOf(tag ?? tags[0]) + 1) % tags.length];

  return (
    <div className="box bg-raise p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="label">{def.title}</span>
        <span className={items.length > max ? "font-bold text-red" : "text-dim"}>
          {items.length}/{max}
        </span>
      </div>
      {max === 0 && items.length === 0 && (
        <p className="text-xs text-dim">nada liberado no rank {rank}.</p>
      )}
      <ul className="space-y-2">
        {items.map((it, i) => (
          <li key={it.id} className="flex items-center gap-2">
            {def.tags && (
              <button
                className="btn btn-bare w-24 shrink-0 !px-1 text-xs"
                title="trocar tipo"
                onClick={() => patch(it.id, { tag: nextTag(it.tag, def.tags!) })}
              >
                {it.tag ?? def.tags[0]}
              </button>
            )}
            <input
              className={`field ${i >= max ? "!border-red" : ""}`}
              value={it.text}
              placeholder={def.placeholder}
              aria-label={`${def.title} ${i + 1}`}
              onChange={(e) => patch(it.id, { text: e.target.value })}
            />
            <button
              className="btn btn-bare btn-danger"
              aria-label="remover"
              onClick={() => setItems(items.filter((x) => x.id !== it.id))}
            >
              x
            </button>
          </li>
        ))}
      </ul>
      {items.length > max && (
        <p className="mt-2 text-xs text-red">
          acima do limite do rank {rank}: remova {items.length - max}.
        </p>
      )}
      <button
        className="btn mt-2"
        disabled={!canAddItem(def, state, rank)}
        onClick={() => setItems([...items, { id: uid(), text: "", tag: def.tags?.[0] }])}
      >
        adicionar
      </button>
    </div>
  );
}

function UseCard({ use, ch, accent }: { use: UseDef; ch: Character; accent: string }) {
  const ctx = rollCtx(ch);
  const lock = use.locked?.(ctx) ?? null;
  const [mod, setMod] = useState(use.mods?.[0]?.value ?? 0);
  const [last, setLast] = useState<{ n: number; r: RollResult } | null>(null);

  return (
    <div className="box bg-raise flex flex-col gap-1 p-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-pixel text-lg" style={{ color: lock ? "var(--dim)" : accent }}>
          {use.name}
        </span>
        {use.cost && <span className="shrink-0 text-xs text-dim">{use.cost}</span>}
      </div>
      <div className="text-xs">{use.formula}</div>
      {use.desc && <p className="text-xs text-dim">{use.desc}</p>}
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
        {use.mods && (
          <select
            className="field !w-auto !py-1 text-xs"
            aria-label="modificador"
            value={mod}
            onChange={(e) => setMod(Number(e.target.value))}
          >
            {use.mods.map((m) => (
              <option key={m.label} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        )}
        <button
          className="btn"
          disabled={lock !== null}
          onClick={() => setLast({ n: (last?.n ?? 0) + 1, r: use.roll(ctx, mod) })}
        >
          rolar
        </button>
      </div>
      {lock && <p className="text-xs text-dim">bloqueado: {lock}</p>}
      {last && !lock && <RollLine key={last.n} r={last.r} accent={accent} />}
    </div>
  );
}

export function RollLine({ r, accent }: { r: RollResult; accent: string }) {
  const color = r.ok === false ? "var(--dim)" : accent;
  const showTotal = r.dice.length > 1 || r.total !== r.dice[0];
  return (
    <div className="mt-2 space-y-1 border-t-2 border-line pt-2" aria-live="polite">
      <div className="flex flex-wrap items-center gap-1">
        {r.dice.map((d, i) => (
          <span key={i} className="animate-hop border-2 border-line px-1.5 font-bold">
            {d}
          </span>
        ))}
        {showTotal && (
          <span className="ml-1 text-xl font-bold" style={{ color }}>
            = {r.total}
          </span>
        )}
        {r.crit && (
          <span
            className="ml-1 text-xs"
            style={{ color: r.crit === "sucesso" ? accent : "var(--dim)" }}
          >
            {r.crit === "sucesso" ? "crítico!" : "falha crítica"}
          </span>
        )}
      </div>
      <p className="text-xs" style={{ color: r.ok === undefined ? undefined : color }}>
        {r.text}
      </p>
    </div>
  );
}

function TierBlock({
  table,
  rank,
  accent,
}: {
  table: TierTable;
  rank: number;
  accent: string;
}) {
  const [all, setAll] = useState(false);
  const shown = all ? table.tiers : table.tiers.filter((t) => tierActive(table, t, rank));
  const next = table.tiers.find((t) => t.from > rank);
  return (
    <div className="box bg-raise p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="label">{table.title}</span>
        <button className="btn !py-0 text-xs" onClick={() => setAll(!all)}>
          {all ? "só o meu rank" : "todos os ranks"}
        </button>
      </div>
      <ul className="space-y-2">
        {shown.map((t) => {
          const on = tierActive(table, t, rank);
          return (
            <li key={t.from} className="flex gap-3" style={{ opacity: on ? 1 : 0.45 }}>
              <span className="w-10 shrink-0 font-bold" style={{ color: on ? accent : undefined }}>
                {rankRange(t)}
              </span>
              <div className="min-w-0 space-y-0.5">
                {t.lines.map((l) => (
                  <TierLine key={l} text={l} />
                ))}
              </div>
            </li>
          );
        })}
      </ul>
      {!all && next && <p className="mt-2 text-xs text-dim">próximo degrau: rank {next.from}</p>}
    </div>
  );
}

function TierLine({ text }: { text: string }) {
  const i = text.indexOf(": ");
  if (i < 0) return <div>{text}</div>;
  return (
    <div>
      <span className="text-dim">{text.slice(0, i)}:</span> {text.slice(i + 2)}
    </div>
  );
}
