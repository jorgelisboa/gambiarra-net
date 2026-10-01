"use client";

import { ROLE_DEFS, STARTING_RANK } from "@/lib/rpg";
import { ROLES, type Role } from "@/lib/types";

/** Primeiro passo da criação: escolher o role. */
export function RolePicker({
  onPick,
  onCancel,
}: {
  onPick: (role: Role) => void;
  onCancel?: () => void;
}) {
  return (
    <section className="box space-y-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-pixel text-2xl">escolha o role</h2>
          <p className="text-dim">
            a habilidade de role começa no rank {STARTING_RANK}. dá pra trocar depois na ficha.
          </p>
        </div>
        {onCancel && (
          <button className="btn" onClick={onCancel}>
            cancelar
          </button>
        )}
      </div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {ROLES.map((r) => {
          const def = ROLE_DEFS[r];
          const net = r === "Netrunner";
          return (
            <button
              key={r}
              onClick={() => onPick(r)}
              className="box group flex flex-col gap-2 p-4 text-left hover:border-dim"
            >
              <span
                className={`font-pixel text-xl ${net ? "group-hover:text-net" : "group-hover:text-red"}`}
              >
                {r.toLowerCase()}
              </span>
              <span className="text-xs text-dim">{def.summary}</span>
              <span
                className="label mt-auto pt-2"
                style={{ color: net ? "var(--net)" : "var(--red)" }}
              >
                {def.ability.name.toLowerCase()}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
