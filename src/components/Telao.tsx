"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useApp } from "@/lib/store";
import { visibleTo } from "@/lib/rpg";
import type { NetArchitecture } from "@/lib/types";
import { Icon } from "./Pixel";
import { NetMap } from "./net/NetMap";

/**
 * O telão (`/tela`), aberto numa segunda janela do mesmo navegador do console e levado pra TV.
 * Não tem segredo nem controle: acompanha o console pelo localStorage e mostra a arquitetura
 * que o mestre mandou pro ar, só com os andares revelados.
 */
export function Telao() {
  const { ready, user, data } = useApp();
  const shown = data.net.architectures.find((a) => a.id === data.net.shownId);

  return (
    <main className="scanlines net-grid relative flex min-h-screen flex-1 flex-col p-6">
      <FullscreenButton />
      {!ready ? (
        <Idle title="conectando" />
      ) : !user ? (
        <Idle title="sem sinal" text="entre como mestre no console, neste mesmo navegador, e abra o telão por lá." />
      ) : shown ? (
        <NetScreen arch={visibleTo(shown, true)} />
      ) : (
        <Idle title="sem sinal" text="nada no ar. no console, aba netrunner: mandar pro telão." />
      )}
    </main>
  );
}

function Idle({ title, text }: { title: string; text?: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <span className="font-pixel text-3xl">
        gambiarra<span className="text-net">.net</span>
      </span>
      <span className="font-pixel cursor text-5xl text-dim">{title}</span>
      {text && <p className="max-w-md text-dim">{text}</p>}
    </div>
  );
}

/** Só o necessário pra pôr em tela cheia (pede um clique); some depois. */
function FullscreenButton() {
  const [full, setFull] = useState(true);
  useEffect(() => {
    const sync = () => setFull(!!document.fullscreenElement);
    sync();
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);
  if (full) return null;
  return (
    <button
      className="btn absolute right-3 top-3 z-10 opacity-40 hover:opacity-100"
      onClick={() => document.documentElement.requestFullscreen?.().catch(() => {})}
    >
      tela cheia
    </button>
  );
}

const MIN_SCALE = 0.4;
const MAX_SCALE = 1.6;

function NetScreen({ arch }: { arch: NetArchitecture }) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const found = arch.floors.length;
  const empty = found === 0;

  // o desenho cresce ou encolhe pra caber na TV inteiro
  useLayoutEffect(() => {
    const outer = box.current;
    const inner = map.current;
    if (!outer || !inner) return;
    const fit = () => {
      const w = inner.offsetWidth;
      const h = inner.offsetHeight;
      if (!w || !h) return;
      const s = Math.min(outer.clientWidth / w, outer.clientHeight / h);
      setScale(Math.max(MIN_SCALE, Math.min(MAX_SCALE, s)));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(outer);
    ro.observe(inner);
    return () => ro.disconnect();
  }, [empty]);

  return (
    <>
      <header className="flex flex-wrap items-end gap-x-6 gap-y-1 pr-28">
        <span className="flex items-center gap-3 text-net">
          <Icon name="net" size={36} />
          <span className="font-pixel text-4xl">{arch.name}</span>
        </span>
        <span className="font-mono text-lg text-dim">
          {"// "}
          {found ? `${found} ${found === 1 ? "andar descoberto" : "andares descobertos"}` : "nada descoberto ainda"}
        </span>
      </header>
      <div ref={box} className="relative mt-6 min-h-0 flex-1 overflow-hidden">
        {!empty ? (
          <div
            className="absolute left-1/2 top-0 origin-top"
            style={{ transform: `translateX(-50%) scale(${scale})` }}
          >
            <div ref={map}>
              <NetMap arch={arch} mode="tv" />
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="font-pixel cursor text-4xl text-dim">conectando à arquitetura</span>
          </div>
        )}
      </div>
    </>
  );
}
