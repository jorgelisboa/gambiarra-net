"use client";

import { useState } from "react";
import { gameName, t } from "@/i18n";
import {
  SKILLS,
  SKILL_CATEGORIES,
  check,
  effectiveStats,
  roleSkillsOf,
  skillBase,
  skillBonusesOf,
  woundPenaltyOf,
  type SkillBonus,
  type SkillDef,
} from "@/lib/rpg";
import type { Character, SkillEntry } from "@/lib/types";
import { BookName } from "../BookName";
import type { PushRoll } from "./roll";
import type { SheetTabId } from "./SheetView";
import { LinkBtn, Section } from "./ui";

/** Uma linha da lista, já resolvida: o que mostrar e o que fazer ao tocar. */
interface Row {
  key: string;
  label: string;
  /** Nomes da perícia (livro e pt-BR), pro nome do livro pequeno. */
  def: { name: string; namePt?: string };
  basic: boolean;
  level: number;
  /** Stat + nível + bônus sem condição. */
  base: number;
  /** Bônus condicionais (`when`): só texto, não somam. */
  hints: SkillBonus[];
  roll: () => void;
}

const hintText = (h: SkillBonus) => t.skills.bonusHint(h.value, h.when ?? "", h.source);

/**
 * Lista de perícias como a ficha de papel: por categoria, a base (stat + nível + bônus) à direita e
 * a linha toda é o botão de rolar. Por padrão só as que o personagem usa.
 */
export function SkillsPanel({
  ch,
  onTab,
  push,
  className,
}: {
  ch: Character;
  onTab: (tab: SheetTabId) => void;
  push: PushRoll;
  className?: string;
}) {
  const [all, setAll] = useState(false);
  const stats = effectiveStats(ch);
  const penalty = woundPenaltyOf(ch);
  const bonuses = skillBonusesOf(ch);
  const roleSkills = roleSkillsOf(ch);

  /** Rola `base` + 1d10 com o ferimento e manda pro dock. */
  function rollBase(label: string, base: number, parts: string[], hints: SkillBonus[]) {
    const res = check(base + penalty);
    if (penalty) parts.push(t.skills.roll.wound(penalty));
    let text = t.skills.roll.line(label, parts);
    if (hints.length > 0) text += t.sheet.skills.hintsNote(hints.map(hintText).join(", "));
    push(label, { dice: res.dice, total: res.total, crit: res.crit, text });
  }

  function rowFor(def: SkillDef, e: SkillEntry): Row {
    const plus = bonuses.filter((b) => b.skill === def.id && !b.when);
    const hints = bonuses.filter((b) => b.skill === def.id && b.when);
    const label = e.spec ? `${gameName(def)} (${e.spec})` : gameName(def);
    const base = skillBase(stats, e) + plus.reduce((a, b) => a + b.value, 0);
    return {
      key: e.id,
      label,
      def,
      basic: !!def.basic,
      level: e.level,
      base,
      hints,
      roll: () =>
        rollBase(
          label,
          base,
          [
            t.stats.part(def.stat, stats[def.stat]),
            t.skills.roll.level(e.level),
            ...plus.map((b) => t.skills.roll.bonus(b.source, b.value)),
          ],
          hints,
        ),
    };
  }

  /** As linhas de uma perícia: as entradas dela (uma por especialização) ou uma virtual no nível 0. */
  function rowsOf(def: SkillDef): Row[] {
    const own = ch.skills.filter((e) => e.skill === def.id);
    const virtual: SkillEntry = { id: def.id, skill: def.id, spec: "", level: 0 };
    let entries: SkillEntry[];
    if (all) entries = own.length > 0 ? own : [virtual];
    else {
      entries = own.filter((e) => e.level > 0);
      // perícia sem treino mas com bônus (skill chip) também aparece, senão o bônus ficaria invisível
      if (entries.length === 0 && bonuses.some((b) => b.skill === def.id)) entries = own.length > 0 ? own : [virtual];
    }
    return entries.map((e) => rowFor(def, e));
  }

  const groups = SKILL_CATEGORIES.map((cat) => ({
    cat,
    rows: SKILLS.filter((d) => d.category === cat.id).flatMap(rowsOf),
  })).filter((g) => g.rows.length > 0);

  const roleRows: Row[] = roleSkills.map((rs) => ({
    key: `role-${rs.id}`,
    label: gameName(rs),
    def: rs,
    basic: false,
    level: rs.level,
    base: stats[rs.stat] + rs.level,
    hints: [],
    roll: () =>
      rollBase(
        gameName(rs),
        stats[rs.stat] + rs.level,
        [t.stats.part(rs.stat, stats[rs.stat]), t.skills.roll.level(rs.level)],
        [],
      ),
  }));

  return (
    <Section
      title={t.sheet.skills.title}
      className={`@container ${className ?? ""}`}
      aside={
        <div role="group" aria-label={t.sheet.skills.showAria} className="-my-2 flex">
          {([false, true] as const).map((v) => (
            <button
              key={String(v)}
              type="button"
              aria-pressed={all === v}
              onClick={() => setAll(v)}
              className={`min-h-10 border-2 px-3 text-xs ${v ? "-ml-[2px]" : ""} ${
                all === v ? "border-red bg-red text-black" : "border-line text-dim hover:text-fg"
              }`}
            >
              {v ? t.skills.filter.all : t.skills.filter.trained}
            </button>
          ))}
        </div>
      }
    >
      {penalty < 0 && (
        <p className="mb-2 text-xs text-red">{t.sheet.skills.woundNote(penalty)}</p>
      )}

      {groups.length === 0 && roleRows.length === 0 ? (
        <p className="text-dim">{t.sheet.skills.empty}</p>
      ) : (
        <div className="@xl:columns-2 @xl:gap-x-4">
          {roleRows.length > 0 && <Group title={t.sheet.skills.fromRole} rows={roleRows} />}
          {groups.map(({ cat, rows }) => (
            <Group key={cat.id} title={cat.name} rows={rows} />
          ))}
        </div>
      )}

      <div className="mt-1 flex justify-end">
        <LinkBtn className="!my-0" onClick={() => onTab("skills")}>
          {t.sheet.skills.edit}
        </LinkBtn>
      </div>
    </Section>
  );
}

function Group({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <div className="mb-2 break-inside-avoid">
      <h4 className="border-b-2 border-line pb-0.5 text-xs font-bold text-dim">{title}</h4>
      <ul className="divide-y-2 divide-line">
        {rows.map((r) => (
          <li key={r.key}>
            <button
              type="button"
              onClick={r.roll}
              aria-label={t.sheet.skills.rollAria(r.label, r.base)}
              className="flex min-h-10 w-full items-center gap-2 px-1 py-1 text-left hover:bg-line active:bg-line"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate">
                  <span className={r.basic ? "font-bold" : ""}>{r.label}</span>
                </span>
                <BookName def={r.def} className="truncate max-sm:hidden" />
                {r.hints.map((h) => (
                  <span key={hintText(h)} className="block text-[11px] leading-tight text-dim">
                    {hintText(h)}
                  </span>
                ))}
              </span>
              <span className="shrink-0 text-xs text-dim">{t.sheet.skills.levelShort(r.level)}</span>
              <span className="w-9 shrink-0 text-right text-xl font-bold text-red">{r.base}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
