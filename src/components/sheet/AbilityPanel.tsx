"use client";

import { useState } from "react";
import { t } from "@/i18n";
import { netActionsOf, roleDef, rollCtx, type UseDef } from "@/lib/rpg";
import type { Character } from "@/lib/types";
import type { PushRoll } from "./roll";
import type { SheetTabId } from "./SheetView";
import { LinkBtn, Section } from "./ui";

/** Habilidade de role: nome, rank e um botão por uso que rola. O Netrunner troca os botões pela aba netrun. */
export function AbilityPanel({
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
  const ab = roleDef(ch.role).ability;
  const netrunner = ch.role === "Netrunner";
  const uses = netrunner ? [] : (ab.uses ?? []);
  // o Netrunner já mostra as ações de net na própria linha, abaixo
  const passives = netrunner ? [] : (ab.passives?.(ch.roleRank, ch.ability) ?? []);

  return (
    <Section
      title={t.sheet.ability.title}
      className={className}
      aside={<LinkBtn onClick={() => onTab("ability")}>{t.sheet.ability.full}</LinkBtn>}
    >
      <p className={netrunner ? "text-net" : "text-red"}>
        <span className="font-pixel text-base">{ab.namePt}</span>
        <span className="text-fg">
          {t.common.sep}
          {t.common.words.rank} {ch.roleRank}
        </span>
      </p>
      <p className="line-clamp-2 text-xs text-dim">{ab.summary}</p>
      {passives.length > 0 && <p className="mt-1 text-xs">{passives.join(" · ")}</p>}

      {netrunner && (
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="min-w-0 text-xs text-net">
            {t.sheet.ability.netLine(ch.roleRank, netActionsOf(ch))}
          </p>
          <button type="button" className="btn btn-bare min-h-10 shrink-0 !px-3 text-net" onClick={() => onTab("net")}>
            {t.sheet.ability.netrun}
          </button>
        </div>
      )}

      {uses.length > 0 && (
        <div className={`mt-2 grid gap-1.5 ${uses.some((u) => u.mods) ? "" : "@sm:grid-cols-2"}`}>
          {uses.map((u) => (
            <UseButton key={u.id} use={u} ch={ch} push={push} />
          ))}
        </div>
      )}
    </Section>
  );
}

/** Um uso da habilidade: select de modificador (se tiver) e o botão que rola. */
function UseButton({ use, ch, push }: { use: UseDef; ch: Character; push: PushRoll }) {
  const ctx = rollCtx(ch);
  const lock = use.locked?.(ctx) ?? null;
  const mods = typeof use.mods === "function" ? use.mods(ctx) : use.mods;
  const [pick, setPick] = useState(0);
  const hasMods = !!mods && mods.length > 0;
  const idx = hasMods ? Math.min(pick, mods.length - 1) : 0;
  const mod = hasMods ? mods[idx].value : 0;

  return (
    <div className="min-w-0">
      <div className="flex gap-1">
        {hasMods && (
          <select
            className="field min-h-10 w-[52%] min-w-0 shrink-0 !py-1 text-xs"
            aria-label={t.sheet.ability.modAria(use.name)}
            value={idx}
            onChange={(e) => setPick(Number(e.target.value))}
          >
            {mods.map((m, i) => (
              <option key={m.label} value={i}>
                {m.label}
              </option>
            ))}
          </select>
        )}
        <button
          type="button"
          className="btn btn-bare min-h-10 min-w-0 flex-1 !px-2 leading-tight"
          disabled={lock !== null}
          onClick={() => push(use.name, use.roll(ctx, mod))}
        >
          {use.name}
        </button>
      </div>
      {lock && <p className="mt-0.5 text-[11px] text-dim">{t.sheet.ability.locked(lock)}</p>}
    </div>
  );
}
