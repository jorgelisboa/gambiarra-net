"use client";

import { useEffect, useRef } from "react";
import { endCombat, nextTurn, useApp } from "@/lib/store";
import { woundOf } from "@/lib/rpg";
import { vitalsOf } from "@/lib/rules";
import { Bar, Icon, Sprite } from "./Pixel";
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

      <div className="flex flex-1 flex-wrap items-end justify-center gap-x-4 gap-y-10 pb-6 pt-10 sm:gap-x-12 sm:gap-y-16 sm:pb-10 sm:pt-20">
        {combat.combatants.map((c) => {
          const v = vitalsOf(c, characters);
          const isActive = c.id === combat.activeId;
          const dead = v.hp <= 0;
          const wound = woundOf(v.hp, v.maxHp);
          return (
            <div
              key={c.id}
              className="flex w-28 flex-col items-center gap-3 sm:w-40"
              style={{ opacity: isActive ? 1 : 0.55 }}
            >
              <span style={{ color: v.color, visibility: isActive ? "visible" : "hidden" }}>
                <Icon name="down" size={24} />
              </span>
              <div className={`stage-sprite ${isActive ? "animate-jump" : ""}`}>
                <Sprite
                  seed={v.seed}
                  color={v.color}
                  size={isActive ? 144 : 96}
                  dim={dead}
                />
              </div>
              <div className="w-full text-center">
                <div
                  className="font-pixel truncate text-lg sm:text-xl"
                  style={{ color: isActive ? v.color : undefined }}
                >
                  {v.name}
                </div>
                <div className="text-xs text-dim">
                  init {c.initiative} · hp {v.hp}/{v.maxHp}
                  {wound.id !== "unhurt" && wound.id !== "light" && (
                    <span className="text-red"> · {wound.short}</span>
                  )}
                </div>
                <div className="mt-2">
                  <Bar value={v.hp} max={v.maxHp} color="var(--red)" cells={12} height={8} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

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
