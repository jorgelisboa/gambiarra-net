"use client";

import { LOBBY_FLOORS, floorKind, floorTitle, hasDv, layoutFloors } from "@/lib/rpg";
import type { NetArchitecture, NetFloor } from "@/lib/types";
import { Icon, type IconName } from "../Pixel";

const KIND_ICON: Record<NetFloor["kind"], IconName> = {
  password: "lock",
  file: "file",
  control: "control",
  ice: "ice",
};

/** Medidas do desenho: o console é compacto, o telão se lê de longe. */
const SIZES = {
  gm: { w: 196, h: 76, gx: 36, gy: 40, top: 18, ruler: 64, icon: 20, title: "text-sm", tag: "text-[11px]" },
  tv: { w: 260, h: 104, gx: 48, gy: 56, top: 26, ruler: 88, icon: 32, title: "text-xl", tag: "text-sm" },
} as const;

/**
 * A arquitetura desenhada como um diagrama de infraestrutura num terminal: cada andar é um nó,
 * o tronco desce na primeira coluna e os galhos abrem à direita. A régua da esquerda conta os andares.
 * No modo `tv` a arquitetura já chega filtrada (só o revelado) e nada é clicável.
 */
export function NetMap({
  arch,
  mode,
  selectedId,
  onSelect,
}: {
  arch: NetArchitecture;
  mode: "gm" | "tv";
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}) {
  const S = SIZES[mode];
  const { spots, cols, depth } = layoutFloors(arch);
  const at = new Map(spots.map((s) => [s.floor.id, s]));
  const x = (col: number) => S.ruler + col * (S.w + S.gx);
  // folga em cima pra etiqueta do netrunner no andar 1
  const y = (d: number) => S.top + (d - 1) * (S.h + S.gy);
  const width = x(Math.max(cols, 1)) - S.gx;
  const height = y(Math.max(depth, 1)) + S.h;

  // o caminho do netrunner até onde ele está, aceso no desenho
  const trail = new Set<string>();
  for (let s = arch.runnerAt ? at.get(arch.runnerAt) : undefined; s; s = s.floor.parent ? at.get(s.floor.parent) : undefined) {
    trail.add(s.floor.id);
  }

  return (
    <div className="relative" style={{ width, height }}>
      {/* régua: um andar por linha, e o lobby marcado */}
      {Array.from({ length: depth }, (_, i) => (
        <div
          key={i}
          className="absolute left-0 flex flex-col justify-center font-mono text-dim"
          style={{ top: y(i + 1), height: S.h, width: S.ruler - 12 }}
        >
          <span className={mode === "tv" ? "text-lg" : "text-xs"}>
            F<span className="text-fg">{String(i + 1).padStart(2, "0")}</span>
          </span>
          {i < LOBBY_FLOORS && <span className="text-[10px] uppercase tracking-wider">lobby</span>}
        </div>
      ))}

      <svg className="absolute inset-0 overflow-visible" width={width} height={height} shapeRendering="crispEdges" aria-hidden>
        {spots.map(({ floor, depth: d, col }) => {
          const p = floor.parent ? at.get(floor.parent) : undefined;
          if (!p) return null;
          const px = x(p.col) + S.w / 2;
          const cx = x(col) + S.w / 2;
          const top = y(p.depth) + S.h;
          const mid = top + S.gy / 2;
          const lit = trail.has(floor.id);
          const hidden = mode === "gm" && !floor.revealed;
          return (
            <polyline
              key={floor.id}
              points={`${px},${top} ${px},${mid} ${cx},${mid} ${cx},${y(d)}`}
              fill="none"
              stroke={lit ? "var(--net)" : "var(--line)"}
              strokeWidth={2}
              strokeDasharray={hidden ? "4 4" : undefined}
              className={lit ? "net-flow" : undefined}
            />
          );
        })}
      </svg>

      {spots.map(({ floor, depth: d, col }) => (
        <FloorNode
          key={floor.id}
          floor={floor}
          depth={d}
          mode={mode}
          style={{ left: x(col), top: y(d), width: S.w, height: S.h }}
          selected={selectedId === floor.id}
          runner={arch.runnerAt === floor.id}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

function FloorNode({
  floor,
  depth,
  mode,
  style,
  selected,
  runner,
  onSelect,
}: {
  floor: NetFloor;
  depth: number;
  mode: "gm" | "tv";
  style: React.CSSProperties;
  selected: boolean;
  runner: boolean;
  onSelect?: (id: string) => void;
}) {
  const S = SIZES[mode];
  const kind = floorKind(floor.kind);
  const ice = floor.kind === "ice";
  const hidden = mode === "gm" && !floor.revealed;
  const border = selected ? "border-red" : runner ? "border-net" : ice ? "border-red/60" : "border-line";
  const Tag = onSelect ? "button" : "div";
  return (
    <Tag
      type={onSelect ? "button" : undefined}
      onClick={onSelect ? () => onSelect(floor.id) : undefined}
      aria-pressed={onSelect ? selected : undefined}
      aria-label={`andar ${depth}: ${kind.label}${floor.label ? `, ${floor.label}` : ""}`}
      className={`absolute flex flex-col border-2 bg-panel text-left ${border} ${hidden ? "border-dashed" : ""} ${
        onSelect ? "hover:border-fg" : ""
      }`}
      style={style}
    >
      <span
        className={`flex items-center justify-between gap-2 border-b-2 px-2 font-mono uppercase ${S.tag} ${
          hidden ? "border-dashed" : ""
        } ${ice ? "border-red/40 text-red" : "border-line text-net"}`}
      >
        <span className="truncate">
          F{String(depth).padStart(2, "0")} · {kind.tag}
        </span>
        {mode === "gm" && hasDv(floor) && <span className="shrink-0 text-fg">DV{floor.dv}</span>}
        {hidden && <span className="shrink-0 normal-case text-dim">oculto</span>}
      </span>
      <span className={`flex min-h-0 flex-1 items-center gap-2 px-2 ${hidden ? "opacity-50" : ""}`}>
        <span className={ice ? "text-red" : "text-net"}>
          <Icon name={KIND_ICON[floor.kind]} size={S.icon} />
        </span>
        <span className={`font-pixel min-w-0 leading-tight ${S.title} line-clamp-2`}>{floorTitle(floor)}</span>
      </span>
      {runner && (
        <span
          className={`absolute -top-[2px] right-2 -translate-y-full bg-net px-1.5 font-mono font-bold uppercase text-black ${
            mode === "tv" ? "text-sm" : "text-[10px]"
          }`}
        >
          ◆ netrunner
        </span>
      )}
    </Tag>
  );
}
