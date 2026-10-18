"use client";

import { deathSaveOf, effectiveStats, hpMaxOf, initiativeBonus, seriousThreshold } from "@/lib/rpg";
import { STAT_KEYS, type Character } from "@/lib/types";
import type { SheetTabId } from "./SheetView";
import { LinkBtn, Section } from "./ui";

/** As 10 stats (efetivas, só leitura) e a linha de iniciativa, movimento e death save. */
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
      title="stats"
      className={className}
      aside={<LinkBtn onClick={() => onTab("stats")}>editar</LinkBtn>}
    >
      <ul className="grid grid-cols-5 gap-1">
        {STAT_KEYS.map((k) => (
          <li key={k} className="border-2 border-line bg-panel px-0.5 py-1 text-center">
            <span className="block text-[11px] leading-none text-dim">{k.toLowerCase()}</span>
            <span className="block text-xl font-bold leading-tight text-red">{eff[k]}</span>
            <span className="block h-3 text-[10px] leading-3 text-dim">
              {eff[k] !== ch.stats[k] ? `base ${ch.stats[k]}` : " "}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs leading-relaxed">
        <span className="text-dim">iniciativa:</span> ref {eff.REF}
        {bonus !== 0 && (bonus > 0 ? `+${bonus}` : bonus)} + 1d10
        <span className="text-dim"> · </span>
        <span className="text-dim">move</span> {eff.MOVE} <span className="text-dim">({eff.MOVE * 2}m por turno)</span>
        <span className="text-dim"> · </span>
        <span className="text-dim">death save</span> {deathSaveOf(ch)}
        <span className="text-dim"> · </span>
        <span className="text-dim">grave abaixo de</span> {seriousThreshold(hpMax)}
      </p>
    </Section>
  );
}
