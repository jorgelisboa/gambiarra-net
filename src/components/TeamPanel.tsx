"use client";

import { useState } from "react";
import { gameName, t } from "@/i18n";
import {
  HIRING_FEE,
  LOYALTY_CAP,
  LOYALTY_GAIN,
  LOYALTY_LOSS,
  TEAM_CLASSES,
  TEAM_STATS,
  fmtEb,
  hire,
  loyaltySave,
  replaceMember,
  skillDef,
  teamClass,
  teamMaxHp,
  teamStats,
  woundOf,
  type TeamClass,
} from "@/lib/rpg";
import type { Character, Stats, TeamMember } from "@/lib/types";
import { BookName } from "./BookName";
import { Bar } from "./Pixel";

const EVENTS = [...LOYALTY_GAIN, ...LOYALTY_LOSS];

const SPECIAL_SKILLS: Record<string, string> = t.characters.team.specialSkills;

/** Equipe do Exec: contratar pela tabela da classe, HP, perícias e lealdade. */
export function TeamPanel({
  ch,
  save,
  max,
}: {
  ch: Character;
  save: (patch: Partial<Character>) => void;
  max: number;
}) {
  const team = ch.ability.team;
  const legacy = ch.ability.lists.team ?? [];
  const setTeam = (t: TeamMember[], money?: number) =>
    save({ ability: { ...ch.ability, team: t }, ...(money !== undefined && { money }) });
  const patch = (id: string, p: Partial<TeamMember>) => setTeam(team.map((m) => (m.id === id ? { ...m, ...p } : m)));
  const [job, setJob] = useState(TEAM_CLASSES[0].id);
  const [name, setName] = useState("");

  return (
    <div className="box bg-raise space-y-3 p-3">
      <div className="flex items-center justify-between gap-3">
        <span className="label">{t.characters.team.title}</span>
        <span className={team.length > max ? "font-bold text-red" : "text-dim"}>
          {team.length}/{max}
        </span>
      </div>
      {max === 0 && <p className="text-xs text-dim">{t.characters.team.firstAtRank}</p>}
      {team.length > max && (
        <p className="text-xs text-red">{t.characters.team.overLimit(team.length - max)}</p>
      )}

      {team.length < max && (
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const cls = teamClass(job)!;
            setTeam([...team, hire(cls, name.trim(), cls.covers[0])]);
            setName("");
          }}
        >
          <select
            className="field !w-auto min-w-0 max-w-full"
            aria-label={t.characters.team.classAria}
            value={job}
            onChange={(e) => setJob(e.target.value)}
          >
            {TEAM_CLASSES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.namePt}
              </option>
            ))}
          </select>
          <input
            className="field !w-auto min-w-32 flex-1"
            placeholder={t.characters.team.namePlaceholder}
            aria-label={t.characters.team.memberNameAria}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button className="btn btn-primary">{t.characters.team.hire}</button>
          <p className="w-full text-xs text-dim">{t.characters.team.job(teamClass(job)!.job)}</p>
        </form>
      )}

      {team.length > 0 && (
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
          {team.map((m) => (
            <MemberCard
              key={m.id}
              m={m}
              onPatch={(p) => patch(m.id, p)}
              onRemove={() => confirm(t.characters.team.confirmDismiss) && setTeam(team.filter((x) => x.id !== m.id))}
              canReplace={ch.money >= HIRING_FEE}
              onReplace={() =>
                setTeam(
                  team.map((x) => (x.id === m.id ? replaceMember(x) : x)),
                  ch.money - HIRING_FEE,
                )
              }
            />
          ))}
        </div>
      )}

      {legacy.length > 0 && (
        <div className="text-xs">
          <span className="text-dim">{t.characters.team.legacyTitle}</span>
          <ul className="mt-1 space-y-1">
            {legacy.map((it) => (
              <li key={it.id} className="flex items-center gap-2">
                <span className="min-w-0 flex-1">{it.text || `(${t.common.words.empty})`}</span>
                <button
                  className="btn btn-bare btn-danger !px-1.5 !py-0"
                  aria-label={t.characters.team.deleteNoteAria}
                  onClick={() =>
                    save({
                      ability: {
                        ...ch.ability,
                        lists: { ...ch.ability.lists, team: legacy.filter((x) => x.id !== it.id) },
                      },
                    })
                  }
                >
                  x
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function skillLine(cls: TeamClass, stats: Stats, level: number, ids: string[]) {
  return ids.map((id) => {
    const d = skillDef(id);
    const name = SPECIAL_SKILLS[id] ?? (d ? gameName(d) : id);
    return d ? `${name} ${stats[d.stat] + level}` : `${name} ${level}`;
  });
}

function MemberCard({
  m,
  onPatch,
  onRemove,
  canReplace,
  onReplace,
}: {
  m: TeamMember;
  onPatch: (p: Partial<TeamMember>) => void;
  onRemove: () => void;
  canReplace: boolean;
  onReplace: () => void;
}) {
  const cls = teamClass(m.job);
  const [event, setEvent] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  if (!cls) return null;
  const stats = teamStats(cls, m.row);
  const hpMax = teamMaxHp(cls, m.row);
  const wound = woundOf(m.hp, hpMax);
  const setHp = (hp: number) => onPatch({ hp: Math.max(0, Math.min(hpMax, hp)) });

  return (
    <div className="box min-w-0 space-y-2 p-3">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <input
            className="field font-pixel !py-0.5 text-lg"
            placeholder={t.characters.team.newHire}
            aria-label={t.characters.team.memberNameAria}
            value={m.name}
            onChange={(e) => onPatch({ name: e.target.value })}
          />
          <div className="mt-1 text-xs text-dim">
            {cls.namePt} · {t.characters.team.realJob(cls.job)}
          </div>
          <BookName def={cls} />
        </div>
        <button className="btn btn-bare btn-danger !px-1.5 !py-0" aria-label={t.characters.team.dismiss} onClick={onRemove}>
          x
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <label className="flex items-center gap-1">
          <span className="text-dim">{t.characters.team.cover}</span>
          <select className="field !w-auto !py-0" value={m.cover} onChange={(e) => onPatch({ cover: e.target.value })}>
            {[...new Set([...cls.covers, m.cover])].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1" title={t.characters.team.rowTitle}>
          <span className="text-dim">{t.characters.team.row}</span>
          <select
            className="field !w-auto !py-0"
            value={m.row}
            onChange={(e) => {
              const row = Number(e.target.value);
              onPatch({ row, hp: Math.min(m.hp, teamMaxHp(cls, row)) });
            }}
          >
            {[1, 2, 3, 4, 5, 6].map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap gap-x-3 text-xs">
        {TEAM_STATS.map((k) => (
          <span key={k}>
            <span className="text-dim" title={t.stats.long[k]}>{t.stats.short[k]}</span> <span className="font-bold">{stats[k]}</span>
          </span>
        ))}
      </div>

      <div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="label">{t.characters.team.hp}</span>
          <button className="btn btn-bare !px-1.5 !py-0" aria-label={t.characters.team.hpDownAria} onClick={() => setHp(m.hp - 1)}>
            -
          </button>
          <span className="font-bold">
            {m.hp}/{hpMax}
          </span>
          <button className="btn btn-bare !px-1.5 !py-0" aria-label={t.characters.team.hpUpAria} onClick={() => setHp(m.hp + 1)}>
            +
          </button>
          {wound.short && (
            <span className={wound.id === "light" ? "text-dim" : "text-red"} title={wound.effect}>
              {wound.short}
            </span>
          )}
          <span className="text-dim">{t.characters.team.deathSave(stats.BODY)}</span>
        </div>
        <div className="mt-1">
          <Bar value={m.hp} max={hpMax} color="var(--red)" cells={10} height={6} />
        </div>
      </div>

      <div className="space-y-0.5 text-xs">
        {cls.skills.map(([lvl, ids]) => (
          <p key={lvl}>
            <span className="font-bold text-red">+{lvl}</span> {skillLine(cls, stats, lvl, ids).join(" · ")}
          </p>
        ))}
        <p>
          <span className="text-dim">{t.characters.team.cyberware}</span> {cls.cyberware.join(", ")}
        </p>
        <p>
          <span className="text-dim">{t.characters.team.gear}</span> {cls.gear.join(", ")}
        </p>
      </div>

      <div className="space-y-2 border-t-2 border-line pt-2 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="label">{t.characters.team.loyalty}</span>
          <button className="btn btn-bare !px-1.5 !py-0" aria-label={t.characters.team.loyaltyDownAria} onClick={() => onPatch({ loyalty: m.loyalty - 1 })}>
            -
          </button>
          <span className={`text-xl font-bold ${m.loyalty <= 0 ? "text-red" : "text-net"}`}>{m.loyalty}</span>
          <button className="btn btn-bare !px-1.5 !py-0" aria-label={t.characters.team.loyaltyUpAria} onClick={() => onPatch({ loyalty: m.loyalty + 1 })}>
            +
          </button>
          <button
            className="btn !px-2 !py-0"
            onClick={() => {
              const r = loyaltySave(m.loyalty);
              setMsg(r.ok ? t.characters.team.loyaltyPass(r.d, m.loyalty) : t.characters.team.loyaltyFail(r.d, m.loyalty));
            }}
          >
            {t.characters.team.loyaltyTest}
          </button>
          <button
            className="btn !px-2 !py-0"
            title={t.characters.team.endSessionTitle(LOYALTY_CAP)}
            onClick={() => {
              onPatch({ loyalty: Math.min(LOYALTY_CAP, m.loyalty) });
              setMsg(
                m.loyalty < 0
                  ? t.characters.team.endSessionBelowZero
                  : t.characters.team.endSessionResult(Math.min(LOYALTY_CAP, m.loyalty)),
              );
            }}
          >
            {t.characters.team.endSession}
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="field !w-auto min-w-0 max-w-full !py-0"
            aria-label={t.characters.team.eventAria}
            value={event}
            onChange={(e) => setEvent(Number(e.target.value))}
          >
            {EVENTS.map(([label, v], i) => (
              <option key={label} value={i}>
                {t.characters.team.eventOption(t.common.signed(v), label)}
              </option>
            ))}
          </select>
          <button className="btn !px-2 !py-0" onClick={() => onPatch({ loyalty: m.loyalty + EVENTS[event][1] })}>
            {t.characters.team.apply}
          </button>
        </div>
        {m.loyalty <= 0 && <p className="text-red">{t.characters.team.betrayal}</p>}
        {msg && <p aria-live="polite">{msg}</p>}
        <button
          className="btn !px-2 !py-0"
          disabled={!canReplace}
          title={canReplace ? undefined : t.characters.team.noMoney}
          onClick={() => confirm(t.characters.team.confirmReplace(fmtEb(HIRING_FEE))) && onReplace()}
        >
          {t.characters.team.replace(fmtEb(HIRING_FEE))}
        </button>
      </div>
    </div>
  );
}
