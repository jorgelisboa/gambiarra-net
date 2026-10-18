"use client";

import { gameName } from "@/i18n";
import { ROLE_DEFS } from "@/lib/rpg";
import { ROLES, type Role } from "@/lib/types";
import { BookName } from "./BookName";

/** Grade com os 10 roles: resumo e habilidade de cada um. */
export function RolePicker({
  selected,
  onPick,
}: {
  selected: Role | null;
  onPick: (role: Role) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {ROLES.map((r) => {
        const def = ROLE_DEFS[r];
        const net = r === "Netrunner";
        const on = r === selected;
        return (
          <button
            key={r}
            onClick={() => onPick(r)}
            aria-pressed={on}
            className={`box group flex flex-col gap-2 p-4 text-left ${on ? "box-active" : "hover:border-dim"}`}
          >
            <span
              className={`font-pixel text-xl ${on ? (net ? "text-net" : "text-red") : net ? "group-hover:text-net" : "group-hover:text-red"}`}
            >
              {r.toLowerCase()}
            </span>
            <span className="text-xs text-dim">{def.summary}</span>
            <span className="mt-auto pt-2">
              <span className="label block" style={{ color: net ? "var(--net)" : "var(--red)" }}>
                {gameName(def.ability)}
              </span>
              <BookName def={def.ability} />
            </span>
          </button>
        );
      })}
    </div>
  );
}
