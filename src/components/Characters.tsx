"use client";

import { useState } from "react";
import {
  deleteCharacter,
  setSessionCharacter,
  upsertCharacter,
  useApp,
} from "@/lib/store";
import {
  currentEmp,
  effectiveStats,
  deathSave,
  fitToRank,
  isCyberpsycho,
  maxHp,
  maxHumanity,
  roleDef,
  seriousThreshold,
  woundOf,
} from "@/lib/rpg";
import { STAT_LABELS, colorFor } from "@/lib/rules";
import {
  ROLES,
  STAT_KEYS,
  type Character,
  type CharacterNotes,
  type Role,
} from "@/lib/types";
import { CreationWizard } from "./CreationWizard";
import { LifepathEditor } from "./LifepathEditor";
import { Bar, Sprite } from "./Pixel";
import { RoleAbility } from "./RoleAbility";
import { GearSheet } from "./GearSheet";
import { SkillSheet } from "./SkillSheet";

const SHEET_TABS = [
  { id: "stats", label: "stats" },
  { id: "skills", label: "perícias" },
  { id: "gear", label: "equipamento" },
  { id: "ability", label: "habilidade" },
  { id: "lore", label: "lore" },
  { id: "notes", label: "notas" },
] as const;

type SheetTab = (typeof SHEET_TABS)[number]["id"];

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
  const [creating, setCreating] = useState(false);
  // fica aqui (e não no Editor) pra aba não voltar pro início ao trocar de personagem
  const [tab, setTab] = useState<SheetTab>("stats");
  const selected = characters.find((c) => c.id === selectedId) ?? null;

  function create(ch: Character) {
    upsertCharacter(ch);
    setSelectedId(ch.id);
    setCreating(false);
    setTab("stats");
  }

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 md:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="space-y-2">
        <button className="btn btn-primary w-full" onClick={() => setCreating(true)}>
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
              setCreating(false);
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

      {creating ? (
        <CreationWizard onDone={create} onCancel={() => setCreating(false)} />
      ) : selected ? (
        <Editor
          key={selected.id}
          ch={selected}
          inSession={selected.id === sessionCharacterId}
          tab={tab}
          onTab={setTab}
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
  tab,
  onTab,
  onDelete,
}: {
  ch: Character;
  inSession: boolean;
  tab: SheetTab;
  onTab: (t: SheetTab) => void;
  onDelete: () => void;
}) {
  const save = (patch: Partial<Character>) => upsertCharacter({ ...ch, ...patch });
  const changeRole = (role: Role) =>
    save({ role, ability: fitToRank(roleDef(role).ability, ch.ability, ch.roleRank) });
  const hpMax = maxHp(ch.stats);
  const humMax = maxHumanity(ch.stats);
  const wound = woundOf(ch.hp, hpMax);
  const emp = currentEmp(ch.stats, ch.humanity);
  const eff = effectiveStats(ch);

  return (
    <section className="box min-w-0 space-y-5 p-3 sm:p-5">
      <div className="flex flex-wrap items-center gap-3">
        <input
          className="field font-pixel min-w-0 flex-1 basis-48 text-xl sm:max-w-sm sm:text-2xl"
          aria-label="nome"
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
        <div className="ml-auto flex flex-wrap gap-2">
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

      <SheetTabs tab={tab} onTab={onTab} />

      <div
        role="tabpanel"
        id={`ficha-${tab}`}
        aria-labelledby={`ficha-tab-${tab}`}
        className="space-y-5"
      >
        {tab === "stats" && (
          <>
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
                  {k === "EMP" && emp < ch.stats.EMP && (
                    <span className="block text-xs text-net" title="EMP caiu com a humanidade">
                      em uso {emp}
                    </span>
                  )}
                  {k !== "EMP" && eff[k] < ch.stats[k] && (
                    <span className="block text-xs text-net" title="penalidade da armadura vestida">
                      com armadura {eff[k]}
                    </span>
                  )}
                </label>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Meter
                label="hp"
                color="var(--red)"
                value={ch.hp}
                max={hpMax}
                onChange={(v) => save({ hp: v })}
              >
                <p>
                  <span className={wound.id === "serious" || wound.id === "mortal" ? "text-red" : ""}>
                    {wound.label}
                  </span>
                  {wound.effect && <span className="text-dim"> · {wound.effect}</span>}
                </p>
                <p className="text-dim">
                  grave abaixo de {seriousThreshold(hpMax)} · death save {deathSave(ch.stats)}
                </p>
              </Meter>
              <Meter
                label="humanidade"
                color="var(--net)"
                value={Math.min(ch.humanity, humMax)}
                min={-humMax}
                max={humMax}
                onChange={(v) => save({ humanity: v })}
              >
                <p>
                  {isCyberpsycho(ch.humanity) ? (
                    <span className="text-red">ciberpsicose</span>
                  ) : (
                    <>
                      emp em uso <span className="font-bold">{emp}</span>
                      <span className="text-dim">/{ch.stats.EMP}</span>
                    </>
                  )}
                </p>
                <p className="text-dim">o EMP cai 1 a cada dezena de humanidade perdida.</p>
              </Meter>
            </div>
          </>
        )}

        {tab === "skills" && (
          <SkillSheet
            skills={ch.skills}
            onChange={(skills) => save({ skills })}
            stats={eff}
            role={ch.role}
            originLanguage={ch.lifepath.picks.language}
            penalty={wound.penalty}
            canRoll
          />
        )}

        {tab === "gear" && <GearSheet ch={ch} save={save} />}

        {tab === "ability" && <RoleAbility ch={ch} save={save} />}

        {tab === "lore" && (
          <LifepathEditor value={ch.lifepath} onChange={(lifepath) => save({ lifepath })} />
        )}

        {tab === "notes" && (
          <div className="grid gap-3 sm:grid-cols-2">
            {NOTE_FIELDS.map((f) => (
              <label key={f.key} className={f.area ? "sm:col-span-2" : ""}>
                <span className="label">{f.label}</span>
                {f.area ? (
                  <textarea
                    className="field mt-1 min-h-20 resize-y"
                    value={ch.notes[f.key]}
                    onChange={(e) => save({ notes: { ...ch.notes, [f.key]: e.target.value } })}
                  />
                ) : (
                  <input
                    className="field mt-1"
                    value={ch.notes[f.key]}
                    onChange={(e) => save({ notes: { ...ch.notes, [f.key]: e.target.value } })}
                  />
                )}
              </label>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/** Abas da ficha. Setas ←/→ trocam de aba (padrão de tablist). */
function SheetTabs({ tab, onTab }: { tab: SheetTab; onTab: (t: SheetTab) => void }) {
  function go(i: number) {
    const t = SHEET_TABS[(i + SHEET_TABS.length) % SHEET_TABS.length];
    onTab(t.id);
    document.getElementById(`ficha-tab-${t.id}`)?.focus();
  }
  return (
    <div role="tablist" aria-label="ficha" className="flex flex-wrap gap-x-1 border-b-2 border-line">
      {SHEET_TABS.map((t, i) => {
        const on = t.id === tab;
        return (
          <button
            key={t.id}
            role="tab"
            id={`ficha-tab-${t.id}`}
            aria-selected={on}
            aria-controls={`ficha-${t.id}`}
            tabIndex={on ? 0 : -1}
            onClick={() => onTab(t.id)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") go(i + 1);
              else if (e.key === "ArrowLeft") go(i - 1);
              else return;
              e.preventDefault();
            }}
            className={`-mb-[2px] shrink-0 border-b-2 px-2 py-1.5 sm:px-3 ${
              on ? "border-red text-red" : "border-transparent text-dim hover:text-fg"
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
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
  min = 0,
  max,
  onChange,
  children,
}: {
  label: string;
  color: string;
  value: number;
  /** Humanidade pode ficar negativa (ciberpsicose). */
  min?: number;
  max: number;
  onChange: (v: number) => void;
  children?: React.ReactNode;
}) {
  const set = (v: number) => onChange(Math.max(min, Math.min(max, v)));
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
      {children && <div className="mt-2 space-y-0.5 text-xs">{children}</div>}
    </div>
  );
}
