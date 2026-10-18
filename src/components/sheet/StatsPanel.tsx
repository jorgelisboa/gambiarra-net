"use client";

import { t } from "@/i18n";
import { deathSaveOf, effectiveStats, hpMaxOf, initiativeBonus, seriousThreshold } from "@/lib/rpg";
import { STAT_KEYS, type Character } from "@/lib/types";
import type { SheetTabId } from "./SheetView";
import { LinkBtn, Section } from "./ui";

/** As 10 stats (efetivas, só leitura) e a linha de iniciativa, movimento e teste de morte. */
export function StatsPanel({
  ch,
  onTab,
  className,
}: {
  ch: Character;
  onTab: (tab: SheetTabId) => void;
  className?: string;
}) {
  const eff = effectiveStats(ch);
  const hpMax = hpMaxOf(ch);
  const bonus = initiativeBonus(ch);

  return (
    <Section
      title={t.sheet.stats.title}
      className={className}
      aside={<LinkBtn onClick={() => onTab("stats")}>{t.common.actions.edit}</LinkBtn>}
    >
      <ul className="grid grid-cols-5 gap-1">
        {STAT_KEYS.map((k) => (
          <li key={k} title={t.stats.long[k]} className="border-2 border-line bg-panel px-0.5 py-1 text-center">
            <span className="block text-[11px] leading-none text-dim">{t.stats.short[k]}</span>
            <span className="block text-xl font-bold leading-tight text-red">{eff[k]}</span>
            <span className="block h-3 text-[10px] leading-3 text-dim">
              {eff[k] !== ch.stats[k] ? t.sheet.stats.base(ch.stats[k]) : " "}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs leading-relaxed">
        <span className="text-dim">{t.sheet.stats.initiative}</span> {t.stats.part("REF", eff.REF)}
        {bonus !== 0 && t.common.signed(bonus)} + 1d10
        <span className="text-dim">{t.common.sep}</span>
        {t.stats.part("MOVE", eff.MOVE)} <span className="text-dim">{t.sheet.stats.perTurn(eff.MOVE * 2)}</span>
        <span className="text-dim">{t.common.sep}</span>
        <span className="text-dim">{t.sheet.deathSave.name}</span> {deathSaveOf(ch)}
        <span className="text-dim">{t.common.sep}</span>
        <span className="text-dim">{t.sheet.stats.seriousBelow}</span> {seriousThreshold(hpMax)}
      </p>
    </Section>
  );
}
