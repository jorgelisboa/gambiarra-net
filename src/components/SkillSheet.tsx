"use client";

import { useState } from "react";
import {
  MAX_SKILL_LEVEL,
  SKILLS,
  SKILL_CATEGORIES,
  check,
  newSpecEntry,
  setSkillLevel,
  skillBase,
  streetratSkills,
  type RollResult,
  type SkillDef,
} from "@/lib/rpg";
import type { Role, SkillEntry, Stats } from "@/lib/types";
import { RollLine } from "./RoleAbility";

type Filter = "trained" | "all";

/**
 * Perícias por categoria, cada uma ligada à sua stat: base = stat + nível.
 * Usada na ficha (com rolagem) e no passo de perícias da criação.
 */
export function SkillSheet({
  skills,
  onChange,
  stats,
  role,
  originLanguage,
  penalty = 0,
  canRoll = false,
}: {
  skills: SkillEntry[];
  onChange: (skills: SkillEntry[]) => void;
  /** Stats que valem no teste (EMP já com a humanidade). */
  stats: Stats;
  role: Role;
  /** Idioma da origem cultural, pro template. */
  originLanguage?: string;
  /** Ferimento: −2 grave, −4 mortal. */
  penalty?: number;
  canRoll?: boolean;
}) {
  const [filter, setFilter] = useState<Filter>(skills.length > 0 ? "trained" : "all");
  const [query, setQuery] = useState("");
  const [last, setLast] = useState<{ id: string; n: number; r: RollResult } | null>(null);

  const q = query.trim().toLowerCase();
  const matches = (def: SkillDef, e?: SkillEntry) =>
    !q ||
    def.name.toLowerCase().includes(q) ||
    def.namePt.includes(q) ||
    !!e?.spec.toLowerCase().includes(q);

  /** Linhas visíveis de uma perícia: as entradas dela, ou uma virtual no nível 0. */
  function rowsOf(def: SkillDef): SkillEntry[] {
    const own = skills.filter((e) => e.skill === def.id);
    const rows = def.spec || own.length > 0 ? own : [{ id: def.id, skill: def.id, spec: "", level: 0 }];
    if (q) return matches(def) ? rows : rows.filter((e) => matches(def, e));
    return filter === "all" ? rows : own.filter((e) => def.spec || e.level > 0);
  }

  const patch = (id: string, p: Partial<SkillEntry>) =>
    onChange(skills.map((e) => (e.id === id ? { ...e, ...p } : e)));

  function setLevel(def: SkillDef, e: SkillEntry, level: number) {
    if (!def.spec) return onChange(setSkillLevel(skills, def.id, level));
    patch(e.id, { level: Math.max(0, Math.min(MAX_SKILL_LEVEL, level)) });
  }

  function roll(def: SkillDef, e: SkillEntry) {
    const base = skillBase(stats, e);
    const res = check(base + penalty);
    const name = e.spec ? `${def.name} (${e.spec})` : def.name;
    const parts = [`${def.stat.toLowerCase()} ${stats[def.stat]}`, `perícia ${e.level}`];
    if (penalty) parts.push(`ferimento ${penalty}`);
    setLast({
      id: e.id,
      n: (last?.n ?? 0) + 1,
      r: { dice: res.dice, total: res.total, crit: res.crit, text: `${name}: ${parts.join(" + ")} + 1d10` },
    });
  }

  function applyTemplate() {
    const msg = `trocar as perícias pelo template streetrat do ${role.toLowerCase()}?`;
    if (skills.length > 0 && !confirm(msg)) return;
    onChange(streetratSkills(role, originLanguage));
    setFilter("trained");
  }

  const groups = SKILL_CATEGORIES.map((cat) => ({
    cat,
    defs: SKILLS.filter((d) => d.category === cat.id)
      .map((def) => ({ def, rows: rowsOf(def) }))
      .filter((g) => g.rows.length > 0 || (g.def.spec && (filter === "all" || !!q) && matches(g.def))),
  })).filter((g) => g.defs.length > 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label="mostrar" className="flex">
          {(["trained", "all"] as const).map((f) => (
            <button
              key={f}
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
              className={`border-2 px-3 py-1 ${
                filter === f ? "border-red bg-red text-black" : "border-line text-dim hover:text-fg"
              } ${f === "all" ? "-ml-[2px]" : ""}`}
            >
              {f === "trained" ? "treinadas" : "todas"}
            </button>
          ))}
        </div>
        <input
          className="field !w-auto min-w-32 flex-1"
          placeholder="buscar perícia"
          aria-label="buscar perícia"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="btn" onClick={applyTemplate}>
          template {role.toLowerCase()}
        </button>
      </div>

      <p className="text-xs text-dim">
        <span className="font-bold text-fg">negrito</span> = básica · x2 = custa o dobro · base = stat +
        nível
        {penalty < 0 && <span className="text-red"> · ferimento: {penalty} em todo teste</span>}
      </p>

      {skills.length === 0 && filter === "trained" && !q ? (
        <div className="box space-y-3 p-6 text-center">
          <p className="text-dim">nenhuma perícia ainda.</p>
          <button className="btn btn-primary" onClick={applyTemplate}>
            preencher com o streetrat do {role.toLowerCase()}
          </button>
        </div>
      ) : groups.length === 0 ? (
        <p className="text-dim">nada encontrado.</p>
      ) : (
        <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-2">
          {groups.map(({ cat, defs }) => (
            <section key={cat.id} className="box bg-raise min-w-0 p-3" aria-labelledby={`cat-${cat.id}`}>
              <header className="mb-1">
                <h3 id={`cat-${cat.id}`} className="font-pixel text-lg leading-tight">
                  {cat.name} <span className="font-mono text-xs text-dim">{cat.en}</span>
                </h3>
                <p className="text-xs text-dim">{cat.summary}</p>
              </header>
              <ul className="divide-y-2 divide-line">
                {defs.map(({ def, rows }) => (
                  <li key={def.id} className="py-1">
                    {rows.map((e) => (
                      <SkillRow
                        key={e.id}
                        def={def}
                        entry={e}
                        stat={stats[def.stat]}
                        canRoll={canRoll}
                        onLevel={(lvl) => setLevel(def, e, lvl)}
                        onSpec={def.spec ? (spec) => patch(e.id, { spec }) : undefined}
                        onRemove={def.spec ? () => onChange(skills.filter((x) => x.id !== e.id)) : undefined}
                        onRoll={() => roll(def, e)}
                        last={last?.id === e.id ? last : null}
                      />
                    ))}
                    {def.spec && (filter === "all" || rows.length > 0 || !!q) && (
                      <button
                        className="btn btn-bare !px-0 py-1 text-xs text-dim"
                        onClick={() => onChange([...skills, newSpecEntry(def.id)])}
                      >
                        + {def.name.toLowerCase()} ({def.spec})
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function SkillRow({
  def,
  entry,
  stat,
  canRoll,
  onLevel,
  onSpec,
  onRemove,
  onRoll,
  last,
}: {
  def: SkillDef;
  entry: SkillEntry;
  stat: number;
  canRoll: boolean;
  onLevel: (level: number) => void;
  onSpec?: (spec: string) => void;
  onRemove?: () => void;
  onRoll: () => void;
  last: { n: number; r: RollResult } | null;
}) {
  const label = entry.spec ? `${def.name} (${entry.spec})` : def.name;
  return (
    <div className="py-1">
      {/* no celular os controles descem pra uma segunda linha em vez de cortar o nome */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1" style={{ opacity: entry.level > 0 ? 1 : 0.6 }}>
        <div className="min-w-0 flex-1 basis-40">
          <div className="flex items-baseline gap-2">
            <span className={`truncate ${def.basic ? "font-bold" : ""}`} title={def.name}>
              {def.name}
            </span>
            {def.x2 && (
              <span className="shrink-0 text-xs text-dim" title="custa o dobro pra comprar">
                x2
              </span>
            )}
          </div>
          <div className="flex gap-1 text-xs text-dim">
            <span className="shrink-0" title="stat ligada">
              {def.stat.toLowerCase()} <span className="text-fg">{stat}</span> ·
            </span>
            <span className="truncate">{def.namePt}</span>
          </div>
          {onSpec && (
            <input
              className="field mt-1 !py-0.5 text-xs"
              placeholder={def.spec}
              aria-label={`${def.name}: ${def.spec}`}
              value={entry.spec}
              onChange={(e) => onSpec(e.target.value)}
            />
          )}
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="flex items-center" aria-label={`nível de ${label}`}>
            <button
              className="btn btn-bare !px-1.5 !py-0"
              aria-label={`diminuir ${label}`}
              disabled={entry.level <= 0}
              onClick={() => onLevel(entry.level - 1)}
            >
              -
            </button>
            <span className="w-6 text-center font-bold">{entry.level}</span>
            <button
              className="btn btn-bare !px-1.5 !py-0"
              aria-label={`aumentar ${label}`}
              disabled={entry.level >= MAX_SKILL_LEVEL}
              onClick={() => onLevel(entry.level + 1)}
            >
              +
            </button>
          </div>

          <span
            className="w-8 shrink-0 text-right text-xl font-bold text-red"
            title={`base: ${def.stat.toLowerCase()} ${stat} + ${entry.level}`}
          >
            {stat + entry.level}
          </span>

          {canRoll && (
            <button className="btn !px-2 !py-0 text-xs" aria-label={`rolar ${label}`} onClick={onRoll}>
              1d10
            </button>
          )}
          {onRemove && (
            <button
              className="btn btn-danger btn-bare !px-1.5 !py-0"
              title="remover"
              aria-label={`remover ${label}`}
              onClick={onRemove}
            >
              x
            </button>
          )}
        </div>
      </div>
      {last && <RollLine key={last.n} r={last.r} accent="var(--red)" />}
    </div>
  );
}
