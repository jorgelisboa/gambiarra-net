"use client";

import { useState } from "react";
import {
  deleteCharacter,
  setSessionCharacter,
  upsertCharacter,
  useApp,
} from "@/lib/store";
import {
  STAT_LABELS,
  colorFor,
  initials,
  isNetrunner,
  maxHp,
  maxHumanity,
  netActionsFor,
  newCharacter,
} from "@/lib/rules";
import { ROLES, STAT_KEYS, type Character, type CharacterNotes } from "@/lib/types";

const NOTE_FIELDS: { key: keyof CharacterNotes; label: string; area?: boolean }[] = [
  { key: "alias", label: "Apelido / Handle" },
  { key: "age", label: "Idade" },
  { key: "goal", label: "Objetivo", area: true },
  { key: "appearance", label: "Aparência", area: true },
  { key: "personality", label: "Personalidade", area: true },
  { key: "history", label: "História", area: true },
  { key: "extra", label: "Anotações", area: true },
];

export function Characters() {
  const { data } = useApp();
  const { characters, sessionCharacterId } = data;
  const [selectedId, setSelectedId] = useState<string | null>(
    sessionCharacterId ?? characters[0]?.id ?? null,
  );
  const selected = characters.find((c) => c.id === selectedId) ?? null;

  function create() {
    const ch = newCharacter();
    upsertCharacter(ch);
    setSelectedId(ch.id);
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-[260px_1fr]">
      <aside className="space-y-2">
        <button className="btn btn-primary w-full" onClick={create}>
          + Novo personagem
        </button>
        {characters.length === 0 && (
          <p className="pt-4 text-sm text-muted">Nenhum personagem ainda.</p>
        )}
        {characters.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedId(c.id)}
            className={`flex w-full items-center gap-3 border p-3 text-left ${
              c.id === selectedId
                ? "border-neon bg-ink-800"
                : "border-line bg-ink-900 hover:border-muted"
            }`}
          >
            <Avatar name={c.name} color={colorFor(c.id)} size={40} />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">{c.name}</span>
              <span className="block text-xs text-muted">{c.role}</span>
            </span>
            {c.id === sessionCharacterId && (
              <span className="text-xs uppercase text-neon">Sessão</span>
            )}
          </button>
        ))}
      </aside>

      {selected ? (
        <Editor
          key={selected.id}
          ch={selected}
          inSession={selected.id === sessionCharacterId}
          onDelete={() => {
            deleteCharacter(selected.id);
            setSelectedId(null);
          }}
        />
      ) : (
        <div className="border border-dashed border-line p-10 text-center text-muted">
          Selecione ou crie um personagem.
        </div>
      )}
    </div>
  );
}

export function Avatar({
  name,
  color,
  size,
}: {
  name: string;
  color: string;
  size: number;
}) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-black text-black"
      style={{
        width: size,
        height: size,
        background: color,
        fontSize: size * 0.4,
        boxShadow: `0 0 ${size / 3}px ${color}66`,
      }}
    >
      {initials(name)}
    </span>
  );
}

function Editor({
  ch,
  inSession,
  onDelete,
}: {
  ch: Character;
  inSession: boolean;
  onDelete: () => void;
}) {
  const save = (patch: Partial<Character>) => upsertCharacter({ ...ch, ...patch });
  const hpMax = maxHp(ch.stats);
  const humMax = maxHumanity(ch.stats);

  return (
    <section className="space-y-5 border border-line bg-ink-900 p-5">
      <div className="flex flex-wrap items-center gap-3">
        <input
          className="field max-w-sm text-xl font-bold"
          value={ch.name}
          onChange={(e) => save({ name: e.target.value })}
        />
        <select
          className="field w-auto"
          value={ch.role}
          onChange={(e) => save({ role: e.target.value as Character["role"] })}
        >
          {ROLES.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
        <div className="ml-auto flex gap-2">
          <button
            className={`btn ${inSession ? "btn-primary" : ""}`}
            onClick={() => setSessionCharacter(inSession ? null : ch.id)}
          >
            {inSession ? "✓ Na sessão" : "Usar na sessão"}
          </button>
          <button
            className="btn btn-danger"
            onClick={() => confirm(`Apagar ${ch.name}?`) && onDelete()}
          >
            Apagar
          </button>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-xs uppercase tracking-widest text-muted">Stats</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {STAT_KEYS.map((k) => (
            <label key={k} className="border border-line bg-ink-800 p-2 text-center">
              <span className="block text-xs text-muted" title={STAT_LABELS[k]}>
                {k}
              </span>
              <NumberInput
                className="w-full bg-transparent text-center text-2xl font-black text-neon outline-none"
                value={ch.stats[k]}
                min={1}
                max={10}
                onChange={(v) => save({ stats: { ...ch.stats, [k]: v } })}
              />
            </label>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Meter
          label="HP"
          color="#ff2a6d"
          value={ch.hp}
          max={hpMax}
          onChange={(v) => save({ hp: v })}
        />
        <Meter
          label="Humanidade"
          color="#05d9e8"
          value={Math.min(ch.humanity, humMax)}
          max={humMax}
          onChange={(v) => save({ humanity: v })}
        />
        {isNetrunner(ch.role) && (
          <div className="border border-line bg-ink-800 p-3">
            <span className="text-xs uppercase tracking-widest text-muted">
              Interface
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <NumberInput
                className="w-14 bg-transparent text-2xl font-black text-ice outline-none"
                value={ch.interfaceRank}
                min={1}
                max={10}
                onChange={(v) => save({ interfaceRank: v })}
              />
              <span className="text-sm text-muted">
                = {netActionsFor(ch.interfaceRank)} ações de Net
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {NOTE_FIELDS.map((f) => (
          <label
            key={f.key}
            className={f.area ? "sm:col-span-2" : ""}
          >
            <span className="text-xs uppercase tracking-widest text-muted">
              {f.label}
            </span>
            {f.area ? (
              <textarea
                className="field mt-1 min-h-20"
                value={ch.notes[f.key]}
                onChange={(e) =>
                  save({ notes: { ...ch.notes, [f.key]: e.target.value } })
                }
              />
            ) : (
              <input
                className="field mt-1"
                value={ch.notes[f.key]}
                onChange={(e) =>
                  save({ notes: { ...ch.notes, [f.key]: e.target.value } })
                }
              />
            )}
          </label>
        ))}
      </div>
    </section>
  );
}

function NumberInput({
  value,
  onChange,
  min,
  max,
  className,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  className?: string;
}) {
  return (
    <input
      type="number"
      className={className}
      value={value}
      min={min}
      max={max}
      onChange={(e) => {
        const n = Number(e.target.value);
        if (!Number.isNaN(n)) onChange(Math.max(min, Math.min(max, n)));
      }}
    />
  );
}

function Meter({
  label,
  color,
  value,
  max,
  onChange,
}: {
  label: string;
  color: string;
  value: number;
  max: number;
  onChange: (v: number) => void;
}) {
  const set = (v: number) => onChange(Math.max(0, Math.min(max, v)));
  return (
    <div className="border border-line bg-ink-800 p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-widest text-muted">{label}</span>
        <span className="font-mono text-sm">
          {value}/{max}
        </span>
      </div>
      <div className="my-2 h-2 bg-ink-950">
        <div
          className="h-full transition-all"
          style={{ width: `${(value / max) * 100}%`, background: color }}
        />
      </div>
      <div className="flex gap-1">
        {[-5, -1, 1, 5].map((d) => (
          <button key={d} className="btn flex-1 !px-0" onClick={() => set(value + d)}>
            {d > 0 ? `+${d}` : d}
          </button>
        ))}
      </div>
    </div>
  );
}
