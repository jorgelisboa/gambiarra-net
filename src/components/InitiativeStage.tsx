"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { endCombat, nextTurn, useApp } from "@/lib/store";
import { woundOf } from "@/lib/rpg";
import { vitalsOf, type Vitals } from "@/lib/rules";
import type { Combatant } from "@/lib/types";
import { Bar, Icon } from "./Pixel";
import { TurnPulse, WOUND_COLORS } from "./TurnPulse";
import { Portrait, PortraitArt } from "./Portrait";
import { TurnActions } from "./TurnActions";

/** Deslize do carrossel em passos, no ritmo dos sprites. */
const GLIDE_STEPS = 6;
const GLIDE_MS = 450;

/** Carta visível: pelo menos 60% dela dentro da tela. */
function seenCards(el: HTMLElement) {
  const box = el.getBoundingClientRect();
  return [...el.children].map((card) => {
    const r = card.getBoundingClientRect();
    return Math.min(r.right, box.right) - Math.max(r.left, box.left) >= r.width * 0.6;
  });
}

/**
 * Leva o carrossel até a carta `i` ficar na primeira vaga, em passos. O snap sai durante o
 * caminho pra não puxar de volta a cada passo. Devolve como parar no meio.
 */
function glide(el: HTMLElement, i: number, instant: boolean): () => void {
  const card = el.children[i] as HTMLElement | undefined;
  const first = el.children[0] as HTMLElement | undefined;
  if (!card || !first) return () => {};
  const to = Math.max(0, Math.min(el.scrollWidth - el.clientWidth, card.offsetLeft - first.offsetLeft));
  const from = el.scrollLeft;
  if (Math.abs(to - from) < 1) return () => {};
  if (instant || matchMedia("(prefers-reduced-motion: reduce)").matches) {
    el.scrollLeft = to;
    return () => {};
  }
  el.style.scrollSnapType = "none";
  let step = 0;
  const id = setInterval(() => {
    step++;
    el.scrollLeft = from + ((to - from) * step) / GLIDE_STEPS;
    if (step === GLIDE_STEPS) stop();
  }, GLIDE_MS / GLIDE_STEPS);
  function stop() {
    clearInterval(id);
    el.style.scrollSnapType = "";
  }
  return stop;
}

interface View {
  seen: boolean[];
  start: boolean;
  end: boolean;
}

const sameView = (a: View, b: View) =>
  a.start === b.start && a.end === b.end && a.seen.join() === b.seen.join();

export function InitiativeStage({ onClose }: { onClose: () => void }) {
  const { data } = useApp();
  const { combat, characters } = data;
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLOListElement>(null);
  const stopGlide = useRef<() => void>(() => {});
  const placed = useRef(false);
  const activeRef = useRef(-1);
  const [view, setView] = useState<View>({ seen: [], start: true, end: true });

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

  const cards = combat.combatants.map((c) => ({ c, v: vitalsOf(c, characters) }));
  const n = cards.length;
  const activeIndex = cards.findIndex(({ c }) => c.id === combat.activeId);
  const firstSeen = Math.max(0, view.seen.indexOf(true));

  const go = useCallback((i: number, instant = false) => {
    const el = track.current;
    if (!el) return;
    stopGlide.current();
    stopGlide.current = glide(el, Math.max(0, i), instant);
  }, []);

  // começo de turno: o personagem do turno vai pra primeira vaga (ao abrir, sem deslizar)
  useLayoutEffect(() => {
    activeRef.current = activeIndex;
    if (activeIndex < 0) return;
    go(activeIndex, !placed.current);
    placed.current = true;
  }, [activeIndex, go]);

  // o que está na tela (setas e miniaturas) e a roda do mouse andando de carta em carta
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const next: View = {
          seen: seenCards(el),
          start: el.scrollLeft <= 1,
          end: el.scrollLeft >= el.scrollWidth - el.clientWidth - 1,
        };
        setView((prev) => (sameView(prev, next) ? prev : next));
      });
    };
    let acc = 0;
    let last = 0;
    const onWheel = (e: WheelEvent) => {
      // rolagem de lado (trackpad) o navegador já faz; só a vertical vira troca de carta
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX) || el.scrollWidth <= el.clientWidth) return;
      e.preventDefault();
      acc += e.deltaY * (e.deltaMode === 1 ? 16 : 1);
      if (Math.abs(acc) < 40 || e.timeStamp - last < 300) return;
      const first = Math.max(0, seenCards(el).indexOf(true));
      go(first + Math.sign(acc));
      acc = 0;
      last = e.timeStamp;
    };
    // tela mudou de tamanho: as cartas mudam de largura, então volta pro personagem do turno
    const ro = new ResizeObserver(() => {
      if (activeRef.current >= 0) go(activeRef.current, true);
      measure();
    });
    ro.observe(el);
    el.addEventListener("scroll", measure, { passive: true });
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", measure);
      el.removeEventListener("wheel", onWheel);
      cancelAnimationFrame(frame);
    };
  }, [go, n]);

  useEffect(() => () => stopGlide.current(), []);

  // cartas por tela: no desktop 4, e 4,3 quando tem mais (a quinta vaza na borda)
  const per = {
    "--per-base": n > 1 ? 1.15 : 1,
    "--per-sm": n > 2 ? 2.3 : 2,
    "--per-lg": n > 4 ? 4.3 : 4,
  } as CSSProperties;

  // no body: fora da página, nada de margem ou contêiner de quem chamou mexe no palco
  return createPortal(
    <div ref={root} className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-bg p-3 sm:p-4">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="font-pixel text-2xl sm:text-3xl">
          round <span className="font-mono font-bold text-red">{String(combat.round).padStart(2, "0")}</span>
        </span>
        <nav
          aria-label="ordem de iniciativa"
          className="order-last flex w-full gap-1.5 overflow-x-auto pb-1 [justify-content:safe_center] lg:order-none lg:w-auto lg:flex-1"
        >
          {cards.map(({ c, v }, i) => {
            const isActive = i === activeIndex;
            return (
              <button
                key={c.id}
                type="button"
                aria-label={`ver ${v.name}`}
                aria-current={isActive ? "step" : undefined}
                title={`${c.initiative} · ${v.name}`}
                onClick={() => go(i)}
                className={`relative shrink-0 border-2 p-px ${
                  isActive ? "border-red" : view.seen[i] ? "border-line" : "border-transparent opacity-50 hover:opacity-100"
                }`}
              >
                <Portrait photo={v.photo} seed={v.seed} color={v.color} size={32} dim={v.hp <= 0} />
                <span
                  className="absolute inset-x-0 -bottom-[5px] h-[3px]"
                  style={{ background: WOUND_COLORS[woundOf(v.hp, v.maxHp).id] }}
                />
              </button>
            );
          })}
        </nav>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <span className="hidden text-xs text-dim xl:inline">espaço / →</span>
          <button className="btn btn-primary" title="espaço / → passa o turno" onClick={nextTurn}>
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
      </header>

      <div className="relative -mx-3 mt-3 min-h-0 flex-1 sm:-mx-4">
        <ol
          ref={track}
          className="carousel"
          style={per}
          aria-label="combatentes na ordem de iniciativa"
          aria-roledescription="carrossel"
        >
          {cards.map(({ c, v }, i) => (
            <StageCard
              key={c.id}
              c={c}
              v={v}
              label={`${i + 1} de ${n}: ${v.name}`}
              active={i === activeIndex}
              // muda a cada começo de turno: a foto pisca e o traço corre, uma vez
              turn={i === activeIndex ? `${combat.round}-${c.id}` : null}
            />
          ))}
        </ol>
        {!view.start && <Arrow side="left" onClick={() => go(firstSeen - 1)} />}
        {!view.end && <Arrow side="right" onClick={() => go(firstSeen + 1)} />}
      </div>
    </div>,
    document.body,
  );
}

/** Carta na altura da tela: a foto (ou o sprite) de fundo e o HUD como camada na base. */
function StageCard({
  c,
  v,
  label,
  active,
  turn,
}: {
  c: Combatant;
  v: Vitals;
  label: string;
  active: boolean;
  turn: string | null;
}) {
  const wound = woundOf(v.hp, v.maxHp);
  const color = WOUND_COLORS[wound.id];
  const frame = active ? "border-red" : "border-line";
  return (
    <li
      className={`stage-card ${active ? "stage-card-active" : ""}`}
      aria-roledescription="carta"
      aria-label={label}
      aria-current={active ? "step" : undefined}
    >
      <div className="stage-art">
        <PortraitArt photo={v.photo} seed={v.seed} color={v.color} dim={v.hp <= 0} />
        <TurnPulse wound={wound.id} play={turn} traceClass="top-[34%]" />
      </div>

      <div className="absolute inset-x-2 top-2 flex items-start justify-between gap-2">
        <span
          className={`border-2 ${frame} bg-bg/80 px-2 font-mono text-2xl font-bold leading-tight text-red`}
          title="iniciativa"
        >
          {c.initiative}
        </span>
        {active && <span className="bg-red px-2 py-0.5 text-xs font-bold uppercase text-black">turno</span>}
      </div>

      <div className="stage-hud">
        <div className={`space-y-2 border-2 ${frame} bg-bg/70 p-2 text-xs sm:p-3`}>
          <div
            className="font-pixel truncate text-xl leading-tight sm:text-2xl"
            style={{ color: active ? v.color : undefined }}
          >
            {v.name}
            {!v.linked && <span className="ml-2 font-mono text-xs text-dim">pnj</span>}
          </div>
          <div>
            <div className="mb-1 flex items-baseline justify-between">
              <span className="text-dim">HP</span>
              <span className="font-mono">
                {v.hp}/{v.maxHp}
              </span>
            </div>
            <Bar value={v.hp} max={v.maxHp} color={color} cells={14} height={10} />
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-dim">
              SP cabeça <span className="font-mono text-fg">{v.sp.head}</span> · corpo{" "}
              <span className="font-mono text-fg">{v.sp.body}</span>
            </span>
            <span className="uppercase" style={{ color }} title={wound.effect || undefined}>
              {wound.short || "ileso"}
            </span>
          </div>
          {v.deathSavePenalty > 0 && <div className="text-red">death save +{v.deathSavePenalty}</div>}
          {active && <TurnActions c={c} netMax={v.netMax} size={28} />}
        </div>
      </div>
    </li>
  );
}

function Arrow({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  const left = side === "left";
  return (
    <button
      type="button"
      aria-label={left ? "cartas anteriores" : "próximas cartas"}
      onClick={onClick}
      className={`absolute top-1/2 z-10 -translate-y-1/2 border-2 border-line bg-bg/90 p-2 hover:border-red hover:text-red ${
        left ? "left-1" : "right-1"
      }`}
    >
      <span className={`block ${left ? "rotate-90" : "-rotate-90"}`}>
        <Icon name="down" size={20} />
      </span>
    </button>
  );
}
