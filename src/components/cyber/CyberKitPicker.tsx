"use client";

import { BookName } from "../BookName";
import { gameName, t } from "@/i18n";
import { STREETRAT_CYBERWARE, cyberDef, kitRefs } from "@/lib/rpg";
import type { Role } from "@/lib/types";

/** Perda de humanidade em texto curto: "−7 hum." (0 fica "0 hum."). */
export const hlLabel = (hl: number) => t.cyber.hl.short(hl);

function Piece({ id }: { id: string }) {
  const def = cyberDef(id);
  if (!def) return <>{id}</>;
  return (
    <>
      {gameName(def)} <span className="font-mono text-xs text-dim">{hlLabel(def.hl)}</span>
      <BookName def={def} />
    </>
  );
}

/**
 * Cyberware inicial do role (pág. 118), com as escolhas "isto ou aquilo". Usado na criação e na
 * ficha. A perda de humanidade mostrada é a fixa do livro. Com `emp`, mostra o que sobra.
 */
export function CyberKitPicker({
  role,
  picks,
  onPicks,
  emp,
}: {
  role: Role;
  picks: Record<string, number>;
  onPicks: (p: Record<string, number>) => void;
  emp?: number;
}) {
  const lines = STREETRAT_CYBERWARE[role];
  const hl = kitRefs(role, picks).reduce((a, ref) => a + (cyberDef(ref)?.hl ?? 0), 0);
  const rest = emp === undefined ? 0 : emp * 10 - hl;

  return (
    <section className="box bg-raise min-w-0 p-3">
      <h3 className="label mb-2">{t.cyber.kit.title(role.toLowerCase())}</h3>
      <ul className="space-y-1.5">
        {lines.map((line, i) => {
          const key = `c${i}`;
          if (line.options.length === 1) {
            return (
              <li key={key} title={cyberDef(line.options[0])?.summary}>
                <span className="text-dim">· </span>
                <Piece id={line.options[0]} />
              </li>
            );
          }
          const at = Math.min(picks[key] ?? 0, line.options.length - 1);
          return (
            <li key={key}>
              <div role="group" aria-label={t.cyber.kit.chooseOne} className="flex flex-wrap gap-1">
                {line.options.map((ref, j) => (
                  <button
                    key={ref}
                    type="button"
                    aria-pressed={at === j}
                    title={cyberDef(ref)?.summary}
                    onClick={() => onPicks({ ...picks, [key]: j })}
                    className={`min-w-0 border-2 px-2 py-0.5 text-left ${
                      at === j ? "border-red text-red" : "border-line text-dim hover:text-fg"
                    }`}
                  >
                    <Piece id={ref} />
                  </button>
                ))}
              </div>
            </li>
          );
        })}
      </ul>
      <div className="mt-3 space-y-0.5 border-t-2 border-line pt-2 text-xs">
        <p>
          {t.cyber.kit.hlTotal} <span className="font-mono font-bold text-net">{hl}</span>
        </p>
        {emp !== undefined && (
          <p className="font-mono text-dim">
            {t.cyber.kit.rest(emp * 10, hl, rest, Math.max(0, Math.min(emp, Math.floor(rest / 10))))}
          </p>
        )}
      </div>
    </section>
  );
}
