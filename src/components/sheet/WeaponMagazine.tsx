"use client";

import { useState } from "react";
import { catalogItem, itemName, reload, type AmmoDef, type WeaponInfo } from "@/lib/rpg";
import type { GearItem } from "@/lib/types";
import type { Character } from "@/lib/types";

type Mag = NonNullable<WeaponInfo["mag"]>;

/** Munição básica: id `ammo-{tipo}` e preço de tabela. Qualquer outra (incendiária, especial) vira vermelha. */
const isBasic = (a?: AmmoDef) => !a || (a.cost !== null && a.id === `ammo-${a.ammo}`);

/** Nome da munição em pt (a pilha do bolso raramente tem apelido). */
const ammoName = (g: GearItem) => g.name || catalogItem(g.ref)?.namePt || itemName(g);

/**
 * Uma bala em pixel art: ponta de 2 pixels de altura mais escura, um sulco entre projétil e estojo
 * e o corpo. Cheia = pente carregado; vazia = só o contorno; `spend` = vai sair no modo escolhido
 * (contorno vermelho fixo e o miolo pisca em passos, menos com movimento reduzido).
 */
function Round({ w, scale, filled, spend, special }: { w: 5 | 6; scale: number; filled: boolean; spend: boolean; special: boolean }) {
  const tipW = w % 2 ? 1 : 2;
  const tipX = (w - tipW) / 2;
  const outline = `M${tipX + 0.5} .5H${tipX + tipW - 0.5}V2.5H${w - 0.5}V11.5H.5V2.5H${tipX + 0.5}Z`;
  return (
    <svg
      viewBox={`0 0 ${w} 12`}
      width={w * scale}
      height={12 * scale}
      shapeRendering="crispEdges"
      aria-hidden
      className={`block shrink-0 ${filled ? (special ? "text-red" : "text-fg") : "text-dim"}`}
    >
      {filled ? (
        <>
          <g className={spend ? "motion-safe:animate-[blink_1.2s_steps(1,end)_infinite]" : undefined}>
            <rect x={tipX} y={0} width={tipW} height={2} fill="currentColor" opacity={0.55} />
            <rect x={0} y={2} width={w} height={10} fill="currentColor" />
            <rect x={0} y={4} width={w} height={1} fill="var(--bg)" opacity={0.45} />
          </g>
          {spend && <path d={outline} fill="none" stroke="var(--red)" strokeWidth={1} />}
        </>
      ) : (
        <path d={outline} fill="none" stroke="currentColor" strokeWidth={1} opacity={0.55} />
      )}
    </svg>
  );
}

/**
 * O pente da arma, embaixo dos botões: uma bala por tiro do pente (as que o modo escolhido vai gastar
 * ficam marcadas), a contagem grande, a munição carregada e a troca por outra do bolso.
 */
export function WeaponMagazine({
  ch,
  info,
  mag,
  spend,
  save,
}: {
  ch: Character;
  info: WeaponInfo;
  mag: Mag;
  /** Balas que o modo escolhido gasta. */
  spend: number;
  save: (patch: Partial<Character>) => void;
}) {
  const [pickId, setPickId] = useState<string | null>(null);

  const { compatible } = info;
  const picked =
    compatible.find((g) => g.id === pickId) ??
    compatible.find((g) => g.ref === mag.ammoRef) ??
    compatible[0];
  const same = !!picked && picked.ref === mag.ammoRef;
  const full = mag.loaded >= mag.size;
  const swap = !!picked && !same && mag.loaded > 0;
  const special = !isBasic(mag.ammo);
  const marked = Math.min(spend, mag.loaded);
  // pente pequeno ganha bala grande; 40 balas (heavy SMG) cabem em 264px (ficha a 360px) com 5px e vão de 1px
  const big = mag.size > 30;
  const w = big ? 5 : 6;
  const scale = mag.size <= 12 ? 2 : mag.size <= 25 ? 1.5 : 1;

  return (
    <div className="mt-2 border-t-2 border-line pt-2">
      <div
        role="img"
        aria-label={`pente: ${mag.loaded} de ${mag.size} balas`}
        className={`flex flex-wrap ${big ? "gap-px" : "gap-0.5"}`}
      >
        {Array.from({ length: mag.size }, (_, i) => (
          <Round
            key={i}
            w={w}
            scale={scale}
            filled={i < mag.loaded}
            spend={i < mag.loaded && i >= mag.loaded - marked}
            special={special}
          />
        ))}
      </div>

      <div className="mt-1.5 flex items-baseline justify-between gap-2">
        <span className="font-mono text-2xl font-bold leading-none">
          <span className={mag.loaded < 1 ? "text-red" : undefined}>{mag.loaded}</span>
          <span className="text-dim">/{mag.size}</span>
        </span>
        {marked > 0 && <span className="text-right text-xs text-red">este modo gasta {spend}</span>}
      </div>
      <div className={`mt-0.5 text-xs ${special ? "text-red" : "text-dim"}`}>{mag.ammo?.namePt ?? "vazio"}</div>

      <div className="mt-2 grid gap-1">
        {picked ? (
          <select
            className="field min-h-10 min-w-0 !px-2 text-xs"
            aria-label={`munição do pente de ${itemName(info.item)}`}
            value={picked.id}
            onChange={(e) => setPickId(e.target.value)}
          >
            {compatible.map((g) => (
              <option key={g.id} value={g.id}>
                {ammoName(g)} ×{g.qty}
              </option>
            ))}
          </select>
        ) : (
          <span className="flex min-h-10 items-center border-2 border-line px-2 text-xs text-dim">
            sem munição no bolso
          </span>
        )}
        <button
          type="button"
          className="btn btn-bare min-h-10 !px-3"
          disabled={!picked || (same && full)}
          aria-label={`${swap ? "trocar munição" : "recarregar"} de ${itemName(info.item)}`}
          onClick={() => picked && save({ gear: reload(ch.gear, info.item.id, picked.id) })}
        >
          {swap ? "trocar munição" : "recarregar"}
        </button>
      </div>
      <p className="mt-1 text-xs text-dim">1 ação · não mistura munição no pente; o que sobra volta pro bolso</p>
    </div>
  );
}
