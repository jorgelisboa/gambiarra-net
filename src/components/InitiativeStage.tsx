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

  const activeIndex = combat.combatants.findIndex((c) => c.id === combat.activeId);
  const active = combat.combatants[activeIndex];
  const n = combat.combatants.length;
  const half = Math.floor((n - 1) / 2);
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

      {/* roleta: o personagem do turno no centro, os outros em volta na ordem de iniciativa */}
      <ol className="relative my-4 min-h-[440px] flex-1 overflow-hidden [--step:150px] sm:min-h-[520px] sm:[--step:250px]">
        {combat.combatants.map((c, i) => {
          const v = vitalsOf(c, characters);
          const isActive = c.id === combat.activeId;
          // dá a volta: os últimos da iniciativa ficam à esquerda do primeiro
          const raw = i - Math.max(0, activeIndex);
          const offset = mod(raw + half, n) - half;
          const wound = woundOf(v.hp, v.maxHp);
          const color = WOUND_COLORS[wound.id];
          // muda a cada começo de turno: o monitor varre e o retrato pula uma vez
          const turn = isActive ? `${combat.round}-${c.id}` : null;
          return (
            <li
              // quem dá a volta muda de key e reaparece do outro lado sem atravessar a roleta
              key={`${c.id}:${offset - raw}`}
              className="stage-card absolute left-1/2 top-1/2 flex w-40 flex-col items-center gap-2 sm:w-56"
              style={{
                transform: `translate(calc(-50% + ${offset} * var(--step)), -50%) scale(${isActive ? 1 : 0.72})`,
                opacity: Math.abs(offset) > 3 ? 0 : isActive ? 1 : 0.5,
                zIndex: 10 - Math.abs(offset),
              }}
              aria-current={isActive ? "step" : undefined}
            >
              <span className="font-mono text-xl font-bold text-red sm:text-2xl">{c.initiative}</span>
              <div
                key={turn ?? "idle"}
                className={`stage-photo w-32 sm:w-48 ${turn ? "animate-hop" : ""}`}
              >
                <Portrait photo={v.photo} seed={v.seed} color={v.color} size={192} dim={v.hp <= 0} />
              </div>
              <div
                className="font-pixel w-full truncate text-center text-lg sm:text-2xl"
                style={{ color: isActive ? v.color : undefined }}
              >
                {v.name}
              </div>
              <div className={`box w-full space-y-2 p-2 text-xs ${isActive ? "box-active" : ""}`}>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Bar value={v.hp} max={v.maxHp} color={color} cells={12} height={8} />
                  </div>
                  <span className="font-mono">
                    {v.hp}/{v.maxHp}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-dim">
                    SP <span className="font-mono text-fg">{v.sp.head}</span>
                    <span className="hidden sm:inline"> cabeça</span> ·{" "}
                    <span className="font-mono text-fg">{v.sp.body}</span>
                    <span className="hidden sm:inline"> corpo</span>
                  </span>
                  <span className="uppercase" style={{ color }} title={wound.effect || undefined}>
                    {wound.short || "ileso"}
                  </span>
                </div>
                <HeartMonitor wound={wound.id} play={turn} width={224} />
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

const mod = (a: number, n: number) => ((a % n) + n) % n;
