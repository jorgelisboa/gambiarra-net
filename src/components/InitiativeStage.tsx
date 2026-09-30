"use client";

import { useEffect, useRef } from "react";
import { endCombat, nextTurn, useApp } from "@/lib/store";
import { vitalsOf } from "@/lib/rules";
import { Avatar } from "./Characters";
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
    <div
      ref={root}
      className="fixed inset-0 z-50 flex flex-col bg-ink-950 p-8"
      style={{
        backgroundImage:
          "radial-gradient(circle at 50% 0%, #1a1030 0%, transparent 60%)",
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-3xl font-black text-neon">
          Round <span className="text-white">{combat.round}</span>
        </span>
        <div className="flex gap-2">
          <button className="btn btn-primary" onClick={nextTurn}>
            Próximo turno →
          </button>
          <button
            className="btn btn-danger"
            onClick={() => {
              endCombat();
              onClose();
            }}
          >
            Encerrar
          </button>
          <button className="btn" onClick={onClose}>
            Sair (Esc)
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-wrap items-center justify-center gap-x-10 gap-y-14 py-10">
        {combat.combatants.map((c) => {
          const v = vitalsOf(c, characters);
          const isActive = c.id === combat.activeId;
          const dead = v.hp <= 0;
          return (
            <div
              key={c.id}
              className={`flex flex-col items-center gap-3 transition-all duration-300 ${
                isActive ? "scale-125" : "opacity-50"
              } ${dead ? "grayscale" : ""}`}
            >
              <div className={isActive ? "animate-jump" : ""}>
                <Avatar name={v.name} color={v.color} size={isActive ? 120 : 84} />
              </div>
              <div className="text-center">
                <div
                  className="text-lg font-bold"
                  style={{ color: isActive ? v.color : undefined }}
                >
                  {v.name}
                </div>
                <div className="font-mono text-xs text-muted">
                  INIT {c.initiative}
                </div>
                <div className="mt-1 h-1.5 w-28 bg-ink-800">
                  <div
                    className="h-full bg-hot"
                    style={{ width: `${(v.hp / v.maxHp) * 100}%` }}
                  />
                </div>
                <div className="font-mono text-xs">
                  {v.hp}/{v.maxHp}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {active && av && (
        <div className="flex flex-col items-center gap-3 border-t border-line pt-6">
          <span className="text-sm uppercase tracking-widest text-muted">
            Turno de <span style={{ color: av.color }}>{av.name}</span>
          </span>
          <TurnActions c={active} netMax={av.netMax} size={44} />
          <span className="text-xs text-muted">
            Espaço / → passa o turno
          </span>
        </div>
      )}
    </div>
  );
}
