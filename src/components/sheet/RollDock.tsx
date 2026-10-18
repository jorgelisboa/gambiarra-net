"use client";

import { useState } from "react";
import type { SheetRoll } from "./roll";

/**
 * Última rolagem, colada no rodapé (zona do polegar). No celular ocupa a largura toda; em tela
 * grande vira um cartão no canto. Guarda as 5 últimas: as anteriores abrem em "histórico".
 */
export function RollDock({
  rolls,
  onClose,
  innerRef,
}: {
  /** Da mais nova pra mais velha; nunca vazio. */
  rolls: SheetRoll[];
  onClose: () => void;
  innerRef: (el: HTMLDivElement | null) => void;
}) {
  const [history, setHistory] = useState(false);
  const [last, ...prev] = rolls;
  const dim = last.r.ok === false;

  return (
    <div
      ref={innerRef}
      role="region"
      aria-label="rolagem"
      className="fixed inset-x-0 bottom-0 z-20 max-h-[60vh] overflow-y-auto border-t-2 border-red bg-panel px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 lg:inset-x-auto lg:bottom-4 lg:right-4 lg:w-[28rem] lg:max-w-md lg:border-2"
    >
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate text-xs text-dim">{last.label}</span>
        {prev.length > 0 && (
          <button
            type="button"
            aria-expanded={history}
            onClick={() => setHistory((h) => !h)}
            className={`glitch-hover min-h-10 shrink-0 px-2 text-xs underline underline-offset-4 ${history ? "text-red" : "text-dim"}`}
          >
            histórico ({prev.length})
          </button>
        )}
        <button
          type="button"
          aria-label="fechar rolagem"
          onClick={onClose}
          className="glitch-hover -mr-2 inline-flex size-10 shrink-0 items-center justify-center text-lg text-dim hover:text-fg"
        >
          x
        </button>
      </div>

      <div aria-live="polite">
        <div key={last.n}>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {last.r.dice.map((d, i) => (
              <span
                key={i}
                className="animate-hop min-w-9 border-2 border-line px-1.5 text-center text-xl font-bold leading-8"
              >
                {d}
              </span>
            ))}
            <span className={`text-3xl font-bold leading-none ${dim ? "text-dim" : "text-red"}`}>= {last.r.total}</span>
            {last.r.crit && (
              <span className={`text-xs ${last.r.crit === "sucesso" ? "text-red" : "text-dim"}`}>
                {last.r.crit === "sucesso" ? "crítico!" : "falha crítica"}
              </span>
            )}
            {last.headline && (
              <span className={`text-sm font-bold ${dim ? "text-red" : "text-fg"}`}>{last.headline}</span>
            )}
          </div>
          <p className="mt-1 max-h-24 overflow-y-auto text-xs leading-snug">{last.r.text}</p>
        </div>
      </div>

      {history && prev.length > 0 && (
        <ul className="mt-2 border-t-2 border-line">
          {prev.map((p) => (
            <li key={p.n} className="flex items-baseline gap-2 border-b border-line py-1 text-xs">
              <span className={`w-9 shrink-0 text-right font-bold ${p.r.ok === false ? "text-dim" : ""}`}>{p.r.total}</span>
              <span className="min-w-0 truncate">
                {p.label}
                <span className="text-dim"> · {p.headline ?? p.r.text}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
