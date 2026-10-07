import { uid } from "../../id";
import type { FloorKind, NetArchitecture, NetDifficulty, NetFloor } from "../../types";

/**
 * Arquitetura de net: o mestre monta andar por andar. Cada andar guarda
 * uma coisa só (senha, arquivo, nó de controle ou Black ICE) e pode abrir galhos pra baixo.
 * O netrunner desce a partir do andar 1; os dois primeiros andares são o lobby.
 */

/** Dificuldade da arquitetura: a DV padrão de senhas, arquivos e nós de controle. */
export const NET_DIFFICULTIES: { id: NetDifficulty; label: string; dv: number }[] = [
  { id: "basic", label: "básica", dv: 6 },
  { id: "standard", label: "padrão", dv: 8 },
  { id: "uncommon", label: "incomum", dv: 10 },
  { id: "advanced", label: "avançada", dv: 12 },
];

export const difficultyOf = (id: NetDifficulty) =>
  NET_DIFFICULTIES.find((d) => d.id === id) ?? NET_DIFFICULTIES[1];

export const LOBBY_FLOORS = 2;
/** Uma arquitetura tem de 3 a 18 andares (3d6). */
export const MAX_FLOORS = 18;

export const FLOOR_KINDS: {
  id: FloorKind;
  label: string;
  /** Nome curto em caixa alta, pro cabeçalho do nó no diagrama. */
  tag: string;
  /** Ação de interface que resolve o andar. */
  against: string;
}[] = [
  { id: "password", label: "senha", tag: "PASSWORD", against: "Backdoor contra a DV" },
  { id: "file", label: "arquivo", tag: "FILE", against: "Eye-Dee contra a DV" },
  { id: "control", label: "nó de controle", tag: "CONTROL", against: "Control contra a DV" },
  { id: "ice", label: "black ICE", tag: "BLACK ICE", against: "ataca quem chega no andar" },
];

export const floorKind = (id: FloorKind) => FLOOR_KINDS.find((k) => k.id === id) ?? FLOOR_KINDS[0];

/** Os Black ICE do livro. As fichas (PER, SPD, ATK, DEF, REZ e efeito) entram depois. */
export const BLACK_ICE = [
  "Asp",
  "Giant",
  "Hellhound",
  "Kraken",
  "Liche",
  "Raven",
  "Sabertooth",
  "Scorpion",
  "Skunk",
  "Wisp",
  "Dragon",
  "Killer",
] as const;

export const hasDv = (f: NetFloor) => f.kind !== "ice";

export function newArchitecture(name: string, difficulty: NetDifficulty): NetArchitecture {
  const arch: NetArchitecture = {
    id: uid(),
    name: name.trim() || "arquitetura",
    difficulty,
    floors: [],
    runnerAt: null,
    createdAt: Date.now(),
  };
  return addFloor(arch, null).arch;
}

const blankFloor = (parent: string | null, dv: number): NetFloor => ({
  id: uid(),
  parent,
  kind: "password",
  dv,
  ice: BLACK_ICE[0],
  label: "",
  note: "",
  revealed: false,
});

export const childrenOf = (arch: NetArchitecture, id: string | null) =>
  arch.floors.filter((f) => f.parent === id);

/** Andar 1 é a entrada; cada filho fica um andar abaixo do pai. */
export function depthOf(arch: NetArchitecture, id: string): number {
  const byId = new Map(arch.floors.map((f) => [f.id, f]));
  let depth = 0;
  for (let f = byId.get(id); f; f = f.parent ? byId.get(f.parent) : undefined) depth++;
  return depth;
}

/** O andar e tudo que está abaixo dele. */
function subtree(arch: NetArchitecture, id: string): Set<string> {
  const out = new Set([id]);
  for (const f of arch.floors) {
    // os filhos sempre vêm depois do pai na lista, então uma passada basta
    if (f.parent && out.has(f.parent)) out.add(f.id);
  }
  return out;
}

const ancestors = (arch: NetArchitecture, id: string) => {
  const byId = new Map(arch.floors.map((f) => [f.id, f]));
  const out = new Set<string>();
  for (let f = byId.get(id); f; f = f.parent ? byId.get(f.parent) : undefined) out.add(f.id);
  return out;
};

/** Andar novo abaixo de `parent` (null: o andar 1, se ainda não tem). Se o pai já tem filho, vira um galho. */
export function addFloor(arch: NetArchitecture, parent: string | null): { arch: NetArchitecture; id: string | null } {
  if (parent === null && arch.floors.length) return { arch, id: null };
  if (parent !== null && !arch.floors.some((f) => f.id === parent)) return { arch, id: null };
  if (parent !== null && depthOf(arch, parent) >= MAX_FLOORS) return { arch, id: null };
  const floor = blankFloor(parent, difficultyOf(arch.difficulty).dv);
  // logo depois do último descendente do pai: a ordem da lista é a ordem do desenho
  const under = parent ? subtree(arch, parent) : new Set<string>();
  let at = arch.floors.length;
  for (let i = arch.floors.length - 1; i >= 0; i--) {
    if (under.has(arch.floors[i].id)) {
      at = i + 1;
      break;
    }
  }
  const floors = [...arch.floors.slice(0, at), floor, ...arch.floors.slice(at)];
  return { arch: { ...arch, floors }, id: floor.id };
}

/** Tira o andar e tudo abaixo dele. O netrunner que estava ali volta pro andar de cima. */
export function removeFloor(arch: NetArchitecture, id: string): NetArchitecture {
  const gone = subtree(arch, id);
  const parent = arch.floors.find((f) => f.id === id)?.parent ?? null;
  return {
    ...arch,
    floors: arch.floors.filter((f) => !gone.has(f.id)),
    runnerAt: arch.runnerAt && gone.has(arch.runnerAt) ? parent : arch.runnerAt,
  };
}

export const patchFloor = (arch: NetArchitecture, id: string, patch: Partial<NetFloor>): NetArchitecture => ({
  ...arch,
  floors: arch.floors.map((f) => (f.id === id ? { ...f, ...patch } : f)),
});

/**
 * Revelar mostra o andar e o caminho até ele (ninguém chega num andar sem passar pelos de cima).
 * Esconder apaga o andar e tudo abaixo.
 */
export function setRevealed(arch: NetArchitecture, id: string, revealed: boolean): NetArchitecture {
  const touched = revealed ? ancestors(arch, id) : subtree(arch, id);
  return {
    ...arch,
    floors: arch.floors.map((f) => (touched.has(f.id) ? { ...f, revealed } : f)),
  };
}

export const revealAll = (arch: NetArchitecture, revealed: boolean): NetArchitecture => ({
  ...arch,
  floors: arch.floors.map((f) => ({ ...f, revealed })),
  runnerAt: revealed ? arch.runnerAt : null,
});

/** Põe o netrunner num andar (e revela o caminho). null: ele saiu da arquitetura. */
export function moveRunner(arch: NetArchitecture, id: string | null): NetArchitecture {
  if (id === null) return { ...arch, runnerAt: null };
  return { ...setRevealed(arch, id, true), runnerAt: id };
}

/** O que a mesa vê: só os andares revelados (sempre com o caminho até eles). */
export const visibleTo = (arch: NetArchitecture, player: boolean): NetArchitecture =>
  player
    ? {
        ...arch,
        floors: arch.floors.filter((f) => f.revealed),
        runnerAt: arch.floors.some((f) => f.id === arch.runnerAt && f.revealed) ? arch.runnerAt : null,
      }
    : arch;

export interface FloorSpot {
  floor: NetFloor;
  /** Andar (1 = entrada). */
  depth: number;
  /** Coluna no desenho: o tronco fica na 0 e cada galho abre uma coluna à direita. */
  col: number;
}

/**
 * Posição de cada andar no desenho, como um `git log --graph` de cabeça pra baixo:
 * o primeiro filho continua na coluna do pai e os outros abrem colunas à direita.
 */
export function layoutFloors(arch: NetArchitecture): { spots: FloorSpot[]; cols: number; depth: number } {
  const spots: FloorSpot[] = [];
  let next = 0;
  const place = (f: NetFloor, depth: number, col: number) => {
    spots.push({ floor: f, depth, col });
    next = Math.max(next, col + 1);
    childrenOf(arch, f.id).forEach((c, i) => place(c, depth + 1, i === 0 ? col : next));
  };
  for (const root of childrenOf(arch, null)) place(root, 1, next);
  return {
    spots,
    cols: next,
    depth: spots.reduce((m, s) => Math.max(m, s.depth), 0),
  };
}

/** Nome do andar no desenho: o rótulo do mestre ou o que tem nele. */
export const floorTitle = (f: NetFloor) =>
  f.label.trim() || (f.kind === "ice" ? f.ice : floorKind(f.kind).label);
