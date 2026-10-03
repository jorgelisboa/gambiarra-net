import type { Wound } from "@/lib/rpg";

/** Cor de cada estado de ferimento: verde ileso, âmbar ferido, laranja grave, vermelho mortal. */
export const WOUND_COLORS: Record<Wound["id"], string> = {
  unhurt: "#7dff6b",
  light: "#ffb000",
  serious: "#ff7a1a",
  mortal: "var(--red)",
};

const W = 96;
const H = 24;
const BASE = 14;

/** Um batimento (onda P, QRS, onda T) em pixels: [x, deslocamento em y]. */
const BEAT: [number, number][] = [
  [0, 0], [2, -2], [4, 0], [6, 0], [7, 2], [9, -11], [11, 6], [12, 0], [15, 0], [17, -3], [20, 0],
];

/** Ritmo por estado: distância entre batimentos, amplitude e quanto o ritmo falha. */
const RHYTHM: Record<Wound["id"], { period: number; amp: number; jitter: number; beats: number; ms: number }> = {
  unhurt: { period: 32, amp: 1, jitter: 0, beats: 3, ms: 1200 },
  light: { period: 26, amp: 0.9, jitter: 2, beats: 3, ms: 1100 },
  serious: { period: 21, amp: 0.6, jitter: 5, beats: 4, ms: 1400 },
  mortal: { period: 34, amp: 0.3, jitter: 8, beats: 2, ms: 2000 },
};

function trace(id: Wound["id"]) {
  const r = RHYTHM[id];
  const pts: string[] = [`0,${BASE}`];
  for (let i = 0; i < r.beats; i++) {
    // falha determinística: o mesmo estado desenha sempre o mesmo traço
    const x0 = 4 + i * r.period + ((i * 7) % (r.jitter + 1));
    const amp = r.amp * (1 - ((i * 3) % (r.jitter + 1)) / 20);
    for (const [dx, dy] of BEAT) pts.push(`${x0 + dx},${BASE + Math.round(dy * amp)}`);
  }
  pts.push(`${W},${BASE}`);
  return pts.join(" ");
}

/**
 * Monitor cardíaco do palco de iniciativa. O traço é varrido uma vez quando `play` muda
 * (o `key` reinicia a animação no começo do turno); fora isso fica parado.
 */
export function HeartMonitor({
  wound,
  play,
  width = 160,
}: {
  wound: Wound["id"];
  /** Identidade do turno: muda → varre de novo. null → traço parado. */
  play: string | null;
  width?: number;
}) {
  return (
    <svg
      width={width}
      height={(width * H) / W}
      viewBox={`0 0 ${W} ${H}`}
      shapeRendering="crispEdges"
      className="ml-auto block h-auto max-w-full border-2 border-line bg-bg"
      aria-hidden
    >
      {/* grade do monitor */}
      {Array.from({ length: W / 12 - 1 }, (_, i) => (
        <rect key={i} x={(i + 1) * 12} y={0} width={0.5} height={H} fill="var(--line)" />
      ))}
      <polyline
        key={play ?? "idle"}
        points={trace(wound)}
        pathLength={1}
        fill="none"
        stroke={WOUND_COLORS[wound]}
        strokeWidth={1.5}
        strokeLinejoin="miter"
        className={play ? "ecg-sweep" : undefined}
        style={play ? { animationDuration: `${RHYTHM[wound].ms}ms` } : undefined}
      />
    </svg>
  );
}
