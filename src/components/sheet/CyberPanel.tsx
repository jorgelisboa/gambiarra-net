"use client";

import { t } from "@/i18n";
import { cyberDef, cyberName, cyberpsychosis, installedCyber, setCyberActive } from "@/lib/rpg";
import type { Character } from "@/lib/types";
import { psychosisTone } from "../cyber/CyberSheet";
import type { SheetTabId } from "./SheetView";
import { LinkBtn, Section } from "./ui";

/** Peças de cyberware em efeito, com o nível de ciberpsicose (escondido quando está estável). */
export function CyberPanel({
  ch,
  save,
  onTab,
  className,
}: {
  ch: Character;
  save: (patch: Partial<Character>) => void;
  onTab: (tab: SheetTabId) => void;
  className?: string;
}) {
  const pieces = installedCyber(ch);
  const psy = cyberpsychosis(ch);

  return (
    <Section
      title={t.sheet.cyber.title}
      className={className}
      aside={
        <LinkBtn onClick={() => onTab("cyber")}>{pieces.length > 0 ? t.sheet.cyber.view : t.sheet.cyber.open}</LinkBtn>
      }
    >
      {pieces.length === 0 ? (
        <p className="text-dim">{t.sheet.cyber.none}</p>
      ) : (
        <>
          <ul className="flex flex-wrap gap-1">
            {pieces.map((p) => {
              // peça que liga e desliga (Sandevistan): vira botão, porque é usada no meio do combate
              const boost = cyberDef(p.ref)?.effects?.activeInitiative;
              return boost ? (
                <li key={p.id} className="max-w-full">
                  <button
                    type="button"
                    aria-pressed={!!p.active}
                    onClick={() => save(setCyberActive(ch, p.id, !p.active))}
                    className={`min-h-10 max-w-full truncate border-2 px-2 text-xs ${
                      p.active ? "border-red bg-red text-black" : "border-line bg-panel hover:border-fg"
                    }`}
                  >
                    {cyberName(p)}
                    {t.common.sep}
                    {p.active ? t.sheet.cyber.on(boost) : t.sheet.cyber.off}
                  </button>
                </li>
              ) : (
                <li key={p.id} className="max-w-full truncate border-2 border-line bg-panel px-1.5 py-0.5 text-xs">
                  {cyberName(p)}
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-xs">
            {t.sheet.pieces(pieces.length)}
            {psy.level > 0 && (
              <>
                <span className="text-dim">{t.common.sep}</span>
                <span className={psychosisTone(psy.level)}>{psy.label}</span>
              </>
            )}
          </p>
        </>
      )}
    </Section>
  );
}
