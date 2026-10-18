"use client";

import { t } from "@/i18n";
import type { WeaponCategory } from "@/lib/rpg";

/**
 * Pixel art da categoria da arma, em grade 16×8 como os ícones de `Pixel.tsx`.
 * "#" é a silhueta (cor do texto), "+" é o detalhe em vermelho, "." é vazio.
 * De lado, a ponta/boca sempre pra direita e o corpo assentado nas linhas de baixo.
 */
const ART: Record<WeaponCategory, readonly string[]> = {
  // faca de combate: cabo, guarda e lâmina com o fio em vermelho
  lightMelee: [
    "................",
    "................",
    "................",
    "......#.........",
    ".#############..",
    ".######++++###..",
    "......#.........",
    "................",
  ],
  // taco de beisebol: cabo fino que engrossa até a ponta
  mediumMelee: [
    "................",
    "................",
    "................",
    "............###.",
    "#.......#######.",
    "################",
    "#....##########.",
    "................",
  ],
  // espada: cabo trançado, guarda alta e lâmina com a ponta em vermelho
  heavyMelee: [
    "................",
    "................",
    "....#...........",
    "....#...........",
    "#.#.###########+",
    ".#.###########..",
    "....#...........",
    "....#...........",
  ],
  // motosserra: motor com cabo e a barra de dentes
  veryHeavyMelee: [
    "................",
    "................",
    "..#####.........",
    "..#...#.#.#.#.#.",
    "..#############+",
    "..#############+",
    "..######.#.#.#.#",
    "..######........",
  ],
  // punho com três lâminas
  claws: [
    "................",
    "..#####.........",
    ".##############+",
    ".#####..........",
    ".##############+",
    ".#####..........",
    ".##############+",
    "..####..........",
  ],
  // pistola média: ferrolho curto, guarda do gatilho e cabo inclinado
  mediumPistol: [
    "................",
    "................",
    "................",
    "....#########+..",
    "....#########...",
    "....###.#.#.....",
    "...###..##......",
    "...###..........",
  ],
  // pistola pesada: mesma família, maior
  heavyPistol: [
    "................",
    "................",
    "...###########+.",
    "...###########..",
    "...####.#.#.....",
    "...####..##.....",
    "..####..........",
    "..####..........",
  ],
  // pistola muito pesada: ferrolho longo, cão atrás e cabo largo
  veryHeavyPistol: [
    "................",
    ".#..............",
    ".##############+",
    ".##############.",
    ".#####.#.##.....",
    ".#####..##......",
    "#####...........",
    "#####...........",
  ],
  // submetralhadora: corpo curto, pente reto no meio e empunhadura atrás
  smg: [
    "................",
    "................",
    "................",
    "...##########...",
    "...###########++",
    "...####.###.....",
    "..###...##......",
    "..###...##......",
  ],
  // submetralhadora pesada: corpo longo, coronha curta e pente maior
  heavySmg: [
    "................",
    "................",
    "................",
    "##.############.",
    "###############+",
    "#..####.###.....",
    "...###..###.....",
    "........###.....",
  ],
  shotgun: [
    "................",
    "................",
    "..............#.",
    ".....##########+",
    "###############.",
    "####..#..####...",
    "###......####...",
    "##..............",
  ],
  assaultRifle: [
    "................",
    "................",
    ".....#.......#..",
    "###############+",
    "#############...",
    "###..##..##.....",
    "....##....##....",
    "....##.....##...",
  ],
  sniperRifle: [
    "................",
    "....#######+....",
    "....#######+....",
    ".....#....#.....",
    "################",
    "#########...##..",
    "####...#...#..#.",
    "###........#..#.",
  ],
  // besta: limbos no vão da frente, coronha e o virote com a ponta em vermelho
  bow: [
    "..............#.",
    ".............#..",
    "............##..",
    ".....##########+",
    "##############..",
    ".##########.##..",
    "....##.......#..",
    "....##........#.",
  ],
  grenadeLauncher: [
    "................",
    "................",
    "....#####.......",
    "###.#.#.#######.",
    "#####.#.#######+",
    "###.###########.",
    ".....##.........",
    ".....##.........",
  ],
  rocketLauncher: [
    "................",
    "#..........###..",
    "###############.",
    "###############+",
    "###############.",
    "#...##.....###..",
    "....##..........",
    "....##..........",
  ],
};

export function WeaponIcon({
  category,
  px = 4,
  className,
}: {
  category: WeaponCategory;
  px?: number;
  className?: string;
}) {
  const rows = ART[category];
  const body: React.ReactNode[] = [];
  const accent: React.ReactNode[] = [];
  rows.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (ch === "#") body.push(<rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} />);
      else if (ch === "+") accent.push(<rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} />);
    }),
  );
  return (
    <svg
      width={16 * px}
      height={8 * px}
      viewBox="0 0 16 8"
      shapeRendering="crispEdges"
      role="img"
      aria-label={t.weapons.categories[category]}
      className={className}
    >
      <g fill="currentColor">{body}</g>
      <g fill="var(--red)">{accent}</g>
    </svg>
  );
}
