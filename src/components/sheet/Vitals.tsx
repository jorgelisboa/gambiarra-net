"use client";

import { armorAt, currentEmp, deathSaveOf, hpMaxOf, rollDeathSave, woundOf } from "@/lib/rpg";
import type { Character } from "@/lib/types";
import { Bar } from "../Pixel";
import { WOUND_COLORS } from "../TurnPulse";
import type { PushRoll } from "./roll";

const STEPS = [-5, -1, 1, 5] as const;

/** Barra de sinais vitais: fica colada no topo enquanto a ficha rola. HP, ferimento, SP e death save. */
export function Vitals({
  ch,
  save,
  push,
}: {
  ch: Character;
  save: (patch: Partial<Character>) => void;
  push: PushRoll;
}) {
  const hpMax = hpMaxOf(ch);
  const wound = woundOf(ch.hp, hpMax);
  const color = WOUND_COLORS[wound.id];
  const mortal = wound.id === "mortal";
  const emp = currentEmp(ch.stats, ch.humanity);
  const spHead = armorAt(ch.gear, "head")?.sp ?? 0;
  const spBody = armorAt(ch.gear, "body")?.sp ?? 0;

  const setHp = (v: number) => save({ hp: Math.max(0, Math.min(hpMax, v)) });

  function deathSave() {
    const body = deathSaveOf(ch);
    const penalty = ch.deathSavePenalty;
    const res = rollDeathSave(body, penalty);
    save({ deathSavePenalty: penalty + 1 });
    push(
      "death save",
      {
        dice: [res.die],
        total: res.total,
        ok: res.ok,
        text: `1d10 ${res.die} + penalidade ${penalty} = ${res.total} contra BODY ${body}${res.die === 10 ? " · 10 natural sempre falha" : ""}`,
      },
      res.ok ? "vive" : "morre: falhou o death save",
    );
  }

  return (
    <div
      role="group"
      aria-label="sinais vitais"
      className="box sticky top-0 z-10 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-x-2 gap-y-0.5 bg-panel px-2.5 py-1 @3xl:grid-cols-[auto_minmax(0,1fr)_auto] @3xl:items-center @3xl:gap-x-4"
    >
      <div className="min-w-0">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[11px] text-dim">hp</span>
          <span className="text-[26px] font-bold leading-none">
            {ch.hp}
            <span className="text-base text-dim">/{hpMax}</span>
          </span>
        </div>
        <div className="mt-0.5 truncate text-xs leading-tight" style={{ color }}>
          {wound.label}
        </div>
      </div>

      <div className="shrink-0 @3xl:col-start-3 @3xl:row-start-1">
        <div className="flex justify-end gap-3">
          <Sp label="sp cabeça" value={spHead} />
          <Sp label="sp corpo" value={spBody} />
        </div>
        <div className="text-right text-[11px] leading-tight text-dim">
          hum {ch.humanity} · emp {emp}
        </div>
      </div>

      <div className="col-span-2 min-w-0 space-y-0.5 @3xl:col-span-1 @3xl:col-start-2 @3xl:row-start-1">
        <Bar value={ch.hp} max={hpMax} color={color} cells={20} height={6} />
        <div className="flex gap-1">
          {STEPS.map((d) => (
            <button
              key={d}
              type="button"
              className={`btn btn-bare min-h-10 !px-0 !text-base font-bold ${mortal ? "w-11 shrink-0" : "flex-1"}`}
              disabled={d < 0 ? ch.hp <= 0 : ch.hp >= hpMax}
              onClick={() => setHp(ch.hp + d)}
            >
              {d > 0 ? `+${d}` : `−${-d}`}
            </button>
          ))}
          {mortal && (
            <button
              type="button"
              className="btn btn-bare btn-primary min-h-10 min-w-0 flex-1 !px-1 leading-tight"
              onClick={deathSave}
            >
              death save
              <span className="block text-[11px] text-dim">penalidade +{ch.deathSavePenalty}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Sp({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center leading-none">
      <div className="text-[10px] text-dim">{label}</div>
      <div className="mt-0.5 text-xl font-bold leading-none">{value}</div>
    </div>
  );
}
