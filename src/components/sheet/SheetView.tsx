"use client";

import { useCallback, useEffect, useState } from "react";
import type { Character } from "@/lib/types";
import { AbilityPanel } from "./AbilityPanel";
import { CyberPanel } from "./CyberPanel";
import { PocketPanel } from "./PocketPanel";
import { RollDock } from "./RollDock";
import type { PushRoll, SheetRoll } from "./roll";
import { SkillsPanel } from "./SkillsPanel";
import { StatsPanel } from "./StatsPanel";
import { Vitals } from "./Vitals";
import { WeaponsPanel } from "./WeaponsPanel";

/** Abas da ficha que a página da ficha pode abrir ("editar"). */
export type SheetTabId = "stats" | "skills" | "gear" | "cyber" | "ability" | "net" | "lore" | "notes";

/** Quantas rolagens o dock guarda. */
const KEEP = 5;

/**
 * A ficha de jogo: tudo que se usa na mesa numa página só, como a ficha de papel.
 * Só lê e rola; HP, armas e munição se mexem aqui, o resto se edita nas abas (links "editar").
 *
 * O layout responde à largura da própria página (container query), não da janela: no PC a ficha
 * divide o espaço com a lista de personagens, então a janela larga não quer dizer página larga.
 */
export function SheetView({
  ch,
  save,
  onTab,
}: {
  ch: Character;
  save: (patch: Partial<Character>) => void;
  onTab: (tab: SheetTabId) => void;
}) {
  const [rolls, setRolls] = useState<SheetRoll[]>([]);
  const [closed, setClosed] = useState(false);
  const [dockEl, setDockEl] = useState<HTMLElement | null>(null);
  const [dockH, setDockH] = useState(0);

  const push: PushRoll = useCallback(
    (label, r, headline) => {
      setRolls((prev) => [{ n: (prev[0]?.n ?? 0) + 1, chId: ch.id, label, r, headline }, ...prev].slice(0, KEEP));
      setClosed(false);
    },
    [ch.id],
  );

  // o dock cobre o rodapé: a página ganha o mesmo espaço embaixo pra última seção não ficar escondida
  useEffect(() => {
    if (!dockEl) return;
    const ro = new ResizeObserver(() => setDockH(dockEl.offsetHeight));
    ro.observe(dockEl);
    return () => ro.disconnect();
  }, [dockEl]);

  const mine = rolls.filter((r) => r.chId === ch.id);
  const showDock = mine.length > 0 && !closed;

  return (
    <>
      <div className="@container space-y-2" style={{ paddingBottom: showDock && dockEl ? dockH + 16 : 0 }}>
        <Vitals ch={ch} save={save} push={push} />

        {/* estreito: uma coluna na ordem do papel. largo: stats, armas e o resto à esquerda, perícias à direita */}
        <div className="grid gap-2 @3xl:grid-cols-2 @3xl:items-start @3xl:[grid-template-rows:repeat(5,auto)_1fr]">
          <StatsPanel ch={ch} onTab={onTab} className="@3xl:col-start-1" />
          <WeaponsPanel ch={ch} save={save} onTab={onTab} push={push} className="@3xl:col-start-1" />
          <SkillsPanel ch={ch} onTab={onTab} push={push} className="@3xl:col-start-2 @3xl:row-span-full" />
          <AbilityPanel ch={ch} onTab={onTab} push={push} className="@3xl:col-start-1" />
          <CyberPanel ch={ch} save={save} onTab={onTab} className="@3xl:col-start-1" />
          <PocketPanel ch={ch} onTab={onTab} className="@3xl:col-start-1" />
        </div>
      </div>

      {showDock && <RollDock rolls={mine} onClose={() => setClosed(true)} innerRef={setDockEl} />}
    </>
  );
}
