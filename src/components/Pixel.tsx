/** Pixel art desenhada em grade: sprites gerados por seed e ícones de ação. */

function hash(seed: string) {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

function rng(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const W = 8;
const H = 8;

/** Sprite 8x8 simétrico, determinístico pelo seed. */
export function Sprite({
  seed,
  color,
  size,
  dim,
}: {
  seed: string;
  color: string;
  size: number;
  dim?: boolean;
}) {
  const rand = rng(hash(seed));
  const half = W / 2;
  const grid: boolean[][] = [];
  for (let y = 0; y < H; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < half; x++) {
      // centro mais denso, bordas mais vazias
      const bias = 0.35 + (x / half) * 0.4;
      row.push(rand() < bias);
    }
    grid.push([...row, ...[...row].reverse()]);
  }
  // "olhos": dois pixels vazios na linha 3, cabeça sempre fechada em cima
  grid[3][2] = false;
  grid[3][5] = false;
  grid[1][3] = grid[1][4] = true;

  const cells: React.ReactNode[] = [];
  grid.forEach((row, y) =>
    row.forEach((on, x) => {
      if (on) cells.push(<rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} />);
    }),
  );
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${W} ${H}`}
      shapeRendering="crispEdges"
      fill={color}
      opacity={dim ? 0.4 : 1}
      aria-hidden
    >
      {cells}
    </svg>
  );
}

const ICONS = {
  action: [
    "...##...",
    "...##...",
    "..#..#..",
    "###..###",
    "###..###",
    "..#..#..",
    "...##...",
    "...##...",
  ],
  move: [
    "........",
    "##..##..",
    ".##..##.",
    "..##..##",
    "..##..##",
    ".##..##.",
    "##..##..",
    "........",
  ],
  // servidor: três unidades de rack com LED e pés
  net: [
    "########",
    "#.....##",
    "########",
    "#.....##",
    "########",
    "#.....##",
    "########",
    ".#....#.",
  ],
  // andares da arquitetura de net
  lock: [
    "..####..",
    ".#....#.",
    ".#....#.",
    "########",
    "###..###",
    "###..###",
    "########",
    "########",
  ],
  file: [
    "#####...",
    "#...##..",
    "#...###.",
    "#.....#.",
    "#.###.#.",
    "#.....#.",
    "#.###.#.",
    "#######.",
  ],
  control: [
    "...##...",
    ".#.##.#.",
    "..####..",
    "###..###",
    "###..###",
    "..####..",
    ".#.##.#.",
    "...##...",
  ],
  ice: [
    ".######.",
    "########",
    "#..##..#",
    "#..##..#",
    "########",
    "###..###",
    ".######.",
    ".#.##.#.",
  ],
  down: [
    "########",
    ".######.",
    "..####..",
    "...##...",
    "........",
    "........",
    "........",
    "........",
  ],
} as const;

export type IconName = keyof typeof ICONS;

export function Icon({
  name,
  size,
  color = "currentColor",
}: {
  name: IconName;
  size: number;
  color?: string;
}) {
  const rows = ICONS[name];
  const cells: React.ReactNode[] = [];
  rows.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (ch === "#") cells.push(<rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} />);
    }),
  );
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 8 8"
      shapeRendering="crispEdges"
      fill={color}
      aria-hidden
    >
      {cells}
    </svg>
  );
}

/** Barra segmentada, em células de pixel. */
export function Bar({
  value,
  max,
  color,
  cells = 20,
  height = 10,
}: {
  value: number;
  max: number;
  color: string;
  cells?: number;
  height?: number;
}) {
  const filled = max > 0 ? Math.ceil((Math.max(0, value) / max) * cells) : 0;
  return (
    <div
      className="flex gap-[2px]"
      role="meter"
      aria-valuenow={value}
      aria-valuemax={max}
      style={{ height }}
    >
      {Array.from({ length: cells }, (_, i) => (
        <span
          key={i}
          className="flex-1"
          style={{ background: i < filled ? color : "var(--line)" }}
        />
      ))}
    </div>
  );
}
