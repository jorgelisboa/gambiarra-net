"use client";

import { useState } from "react";
import {
  STAT_TEMPLATES,
  d10,
  deathSave,
  maxHp,
  maxHumanity,
  seriousThreshold,
  templateRow,
} from "@/lib/rpg";
import { STAT_LABELS } from "@/lib/rules";
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
          rolar 1d10
        </button>
        {rolled && rolled.face === face && (
          <span key={rolled.n} className="animate-hop">
            1d10 → <span className="font-bold text-red">{rolled.face}</span>
          </span>
        )}
        <span className="text-xs text-dim">tabela do {role.toLowerCase()}</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-center">
          <thead>
            <tr className="text-xs text-dim">
              <th className="py-1 font-normal">1d10</th>
              {STAT_KEYS.map((k) => (
                <th key={k} className="py-1 font-normal" title={STAT_LABELS[k]}>
                  {k.toLowerCase()}
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
                      aria-label={`escolher linha ${f}`}
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
            <span className="text-dim">derivados:</span> hp{" "}
            <span className="font-bold text-red">{maxHp(stats)}</span> · grave abaixo de{" "}
            <span className="font-bold">{seriousThreshold(maxHp(stats))}</span> · death save{" "}
            <span className="font-bold">{deathSave(stats)}</span> · humanidade{" "}
            <span className="font-bold text-net">{maxHumanity(stats)}</span>
          </>
        ) : (
          "role ou escolha uma linha pra continuar."
        )}
      </p>
    </div>
  );
}
