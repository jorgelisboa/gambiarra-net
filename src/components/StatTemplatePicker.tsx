"use client";

import { useState } from "react";
import { t } from "@/i18n";
import {
  STAT_TEMPLATES,
  d10,
  deathSave,
  maxHp,
  maxHumanity,
  seriousThreshold,
  templateRow,
} from "@/lib/rpg";
import { STAT_KEYS, type Role } from "@/lib/types";

/** Tabela de stats do role (Streetrat): rola 1d10 ou escolhe a linha. */
export function StatTemplatePicker({
  role,
  face,
  onPick,
}: {
  role: Role;
  face: number | null;
  onPick: (face: number) => void;
}) {
  const [rolled, setRolled] = useState<{ n: number; face: number } | null>(null);
  const stats = face ? templateRow(role, face) : null;

  function roll() {
    const f = d10();
    setRolled({ n: (rolled?.n ?? 0) + 1, face: f });
    onPick(f);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <button className="btn btn-primary" onClick={roll}>
          {t.creation.statTemplate.roll}
        </button>
        {rolled && rolled.face === face && (
          <span key={rolled.n} className="animate-hop">
            {t.creation.statTemplate.rolled} <span className="font-bold text-red">{rolled.face}</span>
          </span>
        )}
        <span className="text-xs text-dim">{t.creation.statTemplate.tableOf(role.toLowerCase())}</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-center">
          <thead>
            <tr className="text-xs text-dim">
              <th className="py-1 font-normal">{t.creation.statTemplate.diceHead}</th>
              {STAT_KEYS.map((k) => (
                <th key={k} className="py-1 font-normal" title={t.stats.long[k]}>
                  {t.stats.short[k]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {STAT_TEMPLATES[role].map((row, i) => {
              const f = i + 1;
              const on = f === face;
              return (
                <tr
                  key={f}
                  onClick={() => onPick(f)}
                  className={`cursor-pointer border-t-2 border-line ${on ? "bg-red text-black" : "hover:bg-raise"}`}
                >
                  <td>
                    <button
                      className="w-full py-1 font-bold"
                      aria-pressed={on}
                      aria-label={t.creation.statTemplate.pickRow(f)}
                      onClick={(e) => {
                        e.stopPropagation();
                        onPick(f);
                      }}
                    >
                      {f}
                    </button>
                  </td>
                  {row.map((v, j) => (
                    <td key={STAT_KEYS[j]} className="py-1">
                      {v}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className={stats ? "" : "text-dim"}>
        {stats ? (
          <>
            <span className="text-dim">{t.creation.statTemplate.derived}</span> {t.creation.statTemplate.hp}{" "}
            <span className="font-bold text-red">{maxHp(stats)}</span> · {t.creation.statTemplate.seriousBelow}{" "}
            <span className="font-bold">{seriousThreshold(maxHp(stats))}</span> · {t.creation.statTemplate.deathSave}{" "}
            <span className="font-bold">{deathSave(stats)}</span> · {t.creation.statTemplate.humanity}{" "}
            <span className="font-bold text-net">{maxHumanity(stats)}</span>
          </>
        ) : (
          t.creation.statTemplate.prompt
        )}
      </p>
    </div>
  );
}
