"use client";

import { useState } from "react";
import {
  deleteCharacter,
  setSessionCharacter,
  upsertCharacter,
  useApp,
} from "@/lib/store";
import { fitToRank, roleDef } from "@/lib/rpg";
import { STAT_LABELS, colorFor, maxHp, maxHumanity, newCharacter } from "@/lib/rules";
import {
  ROLES,
  STAT_KEYS,
  type Character,
  type CharacterNotes,
  type Role,
} from "@/lib/types";
import { Bar, Sprite } from "./Pixel";
import { RoleAbility } from "./RoleAbility";
import { RolePicker } from "./RolePicker";

const NOTE_FIELDS: { key: keyof CharacterNotes; label: string; area?: boolean }[] = [
  { key: "alias", label: "apelido / handle" },
  { key: "age", label: "idade" },
  { key: "goal", label: "objetivo", area: true },
  { key: "appearance", label: "aparência", area: true },
  { key: "personality", label: "personalidade", area: true },
  { key: "history", label: "história", area: true },
  { key: "extra", label: "anotações", area: true },
];

export function Characters() {
  const { data } = useApp();
  const { characters, sessionCharacterId } = data;
  const [selectedId, setSelectedId] = useState<string | null>(
    sessionCharacterId ?? characters[0]?.id ?? null,
  );
  const [picking, setPicking] = useState(false);
  const selected = characters.find((c) => c.id === selectedId) ?? null;

  function create(role: Role) {
    const ch = newCharacter(role);
    upsertCharacter(ch);
    setSelectedId(ch.id);
    setPicking(false);
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-[260px_1fr]">
      <aside className="space-y-2">
        <button className="btn btn-primary w-full" onClick={() => setPicking(true)}>
          novo personagem
        </button>
        {characters.length === 0 && (
          <p className="pt-4 text-dim">nenhum personagem ainda.</p>
        )}
        {characters.map((c) => (
          <button
            key={c.id}
            onClick={() => {
              setSelectedId(c.id);
              setPicking(false);
            }}
            className={`box flex w-full items-center gap-3 p-3 text-left ${
              c.id === selectedId ? "box-active" : "hover:border-dim"
            }`}
          >
            <Sprite seed={c.id} color={colorFor(c.id)} size={36} />
            <span className="min-w-0 flex-1">
              <span className="font-pixel block truncate text-base">{c.name}</span>
              <span className="block text-xs text-dim">
                {c.role.toLowerCase()} · rank {c.roleRank}
              </span>
            </span>
            {c.id === sessionCharacterId && (
              <span className="text-xs text-red">sessão</span>
            )}
          </button>
        ))}
      </aside>

      {picking ? (
        <RolePicker onPick={create} onCancel={() => setPicking(false)} />
      ) : selected ? (
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
        <div className="box p-10 text-center text-dim">
          selecione ou crie um personagem.
        </div>
      )}
    </div>
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
  const changeRole = (role: Role) =>
    save({ role, ability: fitToRank(roleDef(role).ability, ch.ability, ch.roleRank) });
  const hpMax = maxHp(ch.stats);
  const humMax = maxHumanity(ch.stats);

  return (
    <section className="box space-y-6 p-5">
      <div className="flex flex-wrap items-center gap-3">
        <input
          className="field font-pixel max-w-sm text-2xl"
          value={ch.name}
          onChange={(e) => save({ name: e.target.value })}
        />
        <select
          className="field !w-auto"
          value={ch.role}
          aria-label="role"
          onChange={(e) => changeRole(e.target.value as Role)}
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>{r.toLowerCase()}</option>
          ))}
        </select>
        <div className="ml-auto flex gap-2">
          <button
            className={`btn ${inSession ? "btn-primary" : ""}`}
            onClick={() => setSessionCharacter(inSession ? null : ch.id)}
          >
            {inSession ? "na sessão" : "usar na sessão"}
          </button>
          <button
            className="btn btn-danger"
            onClick={() => confirm(`Apagar ${ch.name}?`) && onDelete()}
          >
            apagar
          </button>
        </div>
        <p className="w-full text-dim">{roleDef(ch.role).summary}</p>
      </div>

      <div>
        <h3 className="label mb-2">stats</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {STAT_KEYS.map((k) => (
            <label key={k} className="box bg-raise p-2 text-center">
              <span className="block text-xs text-dim" title={STAT_LABELS[k]}>
                {k.toLowerCase()}
              </span>
              <NumberInput
                className="w-full bg-transparent text-center text-3xl font-bold text-red outline-none"
                value={ch.stats[k]}
                min={1}
                max={10}
                onChange={(v) => save({ stats: { ...ch.stats, [k]: v } })}
              />
            </label>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Meter
          label="hp"
          color="var(--red)"
          value={ch.hp}
          max={hpMax}
          onChange={(v) => save({ hp: v })}
        />
        <Meter
          label="humanidade"
          color="var(--net)"
          value={Math.min(ch.humanity, humMax)}
          max={humMax}
          onChange={(v) => save({ humanity: v })}
        />
      </div>

      <RoleAbility ch={ch} save={save} />

      <div className="grid gap-3 sm:grid-cols-2">
        {NOTE_FIELDS.map((f) => (
          <label
            key={f.key}
            className={f.area ? "sm:col-span-2" : ""}
          >
            <span className="label">{f.label}</span>
            {f.area ? (
              <textarea
                className="field mt-1 min-h-20 resize-y"
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
    <div className="box bg-raise p-3">
      <div className="flex items-center justify-between">
        <span className="label">{label}</span>
        <span className="text-lg font-bold">
          {value}/{max}
        </span>
      </div>
      <div className="my-2">
        <Bar value={value} max={max} color={color} />
      </div>
      <div className="flex gap-1">
        {[-5, -1, 1, 5].map((d) => (
          <button
            key={d}
            className="btn btn-bare flex-1 !px-0"
            onClick={() => set(value + d)}
          >
            {d > 0 ? `+${d}` : d}
          </button>
        ))}
      </div>
    </div>
  );
}
