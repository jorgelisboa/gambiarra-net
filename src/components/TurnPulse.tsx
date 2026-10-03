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
 * Começo do turno, por cima da foto: o personagem pisca na cor do estado e o traço do
 * batimento corre pela foto uma vez e some. `play` muda a cada turno (o `key` reinicia as
 * animações); null não desenha nada. O pai precisa ser posicionado.
 */
export function TurnPulse({
  wound,
  play,
  traceClass = "top-1/2 -translate-y-1/2",
}: {
  wound: Wound["id"];
  play: string | null;
  /** Onde o traço passa na altura da foto. */
  traceClass?: string;
}) {
  if (!play) return null;
  const color = WOUND_COLORS[wound];
  const points = trace(wound);
  const sweep = { animationDuration: `${RHYTHM[wound].ms}ms` };
  return (
    <div key={play} className="pointer-events-none absolute inset-0" aria-hidden>
      <div className="status-blink absolute inset-0" style={{ background: color }} />
      <svg
        viewBox={`0 0 ${W} ${H}`}
        shapeRendering="crispEdges"
        className={`ecg-trace absolute inset-x-0 h-auto w-full ${traceClass}`}
        // some depois que o traço termina de correr
        style={{ animationDuration: `${RHYTHM[wound].ms + 900}ms` }}
      >
        {/* contorno escuro pra ler em cima de qualquer foto */}
        <polyline points={points} pathLength={1} fill="none" stroke="var(--bg)" strokeWidth={2.6} style={sweep} />
        <polyline points={points} pathLength={1} fill="none" stroke={color} strokeWidth={1.2} style={sweep} />
      </svg>
    </div>
  );
}
