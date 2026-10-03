"use client";

import { useEffect, useRef } from "react";
import { endCombat, nextTurn, useApp } from "@/lib/store";
import { woundOf } from "@/lib/rpg";
import { vitalsOf } from "@/lib/rules";
import { Bar } from "./Pixel";
import { HeartMonitor, WOUND_COLORS } from "./HeartMonitor";
import { Portrait } from "./Portrait";
import { TurnActions } from "./TurnActions";

export function InitiativeStage({ onClose }: { onClose: () => void }) {
  const { data } = useApp();
  const { combat, characters } = data;
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    el?.requestFullscreen?.().catch(() => {});
    const onFs = () => {
      if (!document.fullscreenElement) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        nextTurn();
      } else if (e.key === "Escape" && !document.fullscreenElement) {
        onClose();
      }
    };
    document.addEventListener("fullscreenchange", onFs);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("fullscreenchange", onFs);
      window.removeEventListener("keydown", onKey);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, [onClose]);

  const active = combat.combatants.find((c) => c.id === combat.activeId);
  const av = active ? vitalsOf(active, characters) : null;

  return (
    <div ref={root} className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-bg p-4 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="font-pixel text-2xl sm:text-3xl">
          round <span className="font-mono font-bold text-red">{String(combat.round).padStart(2, "0")}</span>
        </span>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-primary" onClick={nextTurn}>
            próximo turno
          </button>
          <button
            className="btn btn-danger"
            onClick={() => {
              endCombat();
              onClose();
            }}
          >
            encerrar
          </button>
          <button className="btn" onClick={onClose}>
            sair (esc)
          </button>
        </div>
      </div>

      <ol className="flex flex-1 flex-col gap-2 py-6 sm:gap-3 sm:py-10">
        {combat.combatants.map((c) => {
          const v = vitalsOf(c, characters);
          const isActive = c.id === combat.activeId;
          const wound = woundOf(v.hp, v.maxHp);
          const color = WOUND_COLORS[wound.id];
          // muda a cada começo de turno: o monitor varre e o retrato pula uma vez
          const turn = isActive ? `${combat.round}-${c.id}` : null;
          return (
            <li
              key={c.id}
              className={`box flex flex-wrap items-center gap-x-4 gap-y-2 p-2 sm:flex-nowrap sm:gap-x-6 sm:p-3 ${isActive ? "box-active" : ""}`}
              style={{ opacity: isActive ? 1 : 0.55 }}
              aria-current={isActive ? "step" : undefined}
            >
              <span className="w-8 text-center font-mono text-xl font-bold text-red sm:text-2xl">
                {c.initiative}
              </span>
              <div key={turn ?? "idle"} className={turn ? "animate-hop" : undefined}>
                <Portrait photo={v.photo} seed={v.seed} color={v.color} size={isActive ? 64 : 48} dim={v.hp <= 0} />
              </div>
              <div className="min-w-0 flex-1 basis-32">
                <div
                  className="font-pixel truncate text-lg sm:text-2xl"
                  style={{ color: isActive ? v.color : undefined }}
                >
                  {v.name}
                  {!v.linked && <span className="ml-2 font-mono text-xs text-dim">pnj</span>}
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs">
                  <div className="w-28 sm:w-40">
                    <Bar value={v.hp} max={v.maxHp} color={color} cells={12} height={8} />
                  </div>
                  <span className="font-mono">
                    {v.hp}/{v.maxHp}
                  </span>
                </div>
              </div>
              <div className="flex basis-full items-center gap-x-4 sm:basis-auto sm:gap-x-6">
                <dl className="grid grid-cols-[auto_auto] gap-x-2 text-xs">
                  <dt className="text-dim">SP cabeça</dt>
                  <dd className="font-mono">{v.sp.head}</dd>
                  <dt className="text-dim">SP corpo</dt>
                  <dd className="font-mono">{v.sp.body}</dd>
                </dl>
                <span
                  className="text-xs uppercase sm:w-20"
                  style={{ color }}
                  title={wound.effect || undefined}
                >
                  {wound.short || "ileso"}
                </span>
                <div className="ml-auto min-w-0 flex-1 sm:flex-none">
                  <HeartMonitor wound={wound.id} play={turn} width={isActive ? 192 : 144} />
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {active && av && (
        <div className="flex flex-col items-center gap-3 border-t-2 border-line pt-4 sm:pt-6">
          <span className="text-dim">
            turno de <span style={{ color: av.color }}>{av.name}</span>
          </span>
          <TurnActions c={active} netMax={av.netMax} size={40} />
          <span className="hidden text-xs text-dim sm:inline">espaço / → passa o turno</span>
        </div>
      )}
    </div>
  );
}
