import type { AbilityItem, AbilityState } from "../types";
import type { AbilityDef, AllocDef, AllocOption, ListDef, Tier, TierTable } from "./types";

/** Todo personagem inicial do RED começa com a habilidade de role no rank 4. */
export const STARTING_RANK = 4;
export const MAX_RANK = 10;

export const emptyAbility = (): AbilityState => ({ alloc: {}, lists: {}, team: [] });

/* ---------- pontos (Solo, Tech, Medtech) ---------- */

export const pointsIn = (state: AbilityState, id: string) => state.alloc[id] ?? 0;

export const spent = (def: AllocDef, state: AbilityState) =>
  def.options.reduce((sum, o) => sum + pointsIn(state, o.id), 0);

/** Teto da opção no rank atual: o menor entre o teto fixo, o do rank e o orçamento. */
export const optionCap = (def: AllocDef, o: AllocOption, rank: number) =>
  Math.min(o.max ?? Infinity, def.capByRank?.(rank) ?? Infinity, def.budget(rank));

export function canRaise(def: AllocDef, o: AllocOption, state: AbilityState, rank: number) {
  const step = o.step ?? 1;
  return (
    pointsIn(state, o.id) + step <= optionCap(def, o, rank) &&
    spent(def, state) + step <= def.budget(rank)
  );
}

export const canLower = (o: AllocOption, state: AbilityState) => pointsIn(state, o.id) > 0;

/** Sobe ou desce um degrau, se couber. */
export function allocate(
  def: AllocDef,
  state: AbilityState,
  id: string,
  dir: 1 | -1,
  rank: number,
): AbilityState {
  const o = def.options.find((x) => x.id === id);
  if (!o) return state;
  if (dir > 0 ? !canRaise(def, o, state, rank) : !canLower(o, state)) return state;
  const next = pointsIn(state, id) + dir * (o.step ?? 1);
  return { ...state, alloc: { ...state.alloc, [id]: next } };
}

/** Corta pontos que não cabem mais (rank caiu): primeiro tetos, depois o orçamento, de baixo pra cima. */
export function fitAlloc(def: AllocDef, state: AbilityState, rank: number): AbilityState {
  const alloc = { ...state.alloc };
  for (const o of def.options) {
    const step = o.step ?? 1;
    const cap = Math.floor(optionCap(def, o, rank) / step) * step;
    alloc[o.id] = Math.min(alloc[o.id] ?? 0, cap);
  }
  let over = def.options.reduce((sum, o) => sum + alloc[o.id], 0) - def.budget(rank);
  for (const o of [...def.options].reverse()) {
    const step = o.step ?? 1;
    while (over > 0 && alloc[o.id] > 0) {
      alloc[o.id] -= step;
      over -= step;
    }
  }
  return { ...state, alloc };
}

export const fitToRank = (ab: AbilityDef, state: AbilityState, rank: number) =>
  ab.alloc ? fitAlloc(ab.alloc, state, rank) : state;

/* ---------- listas (Nomad, Exec) ---------- */

export const listItems = (state: AbilityState, id: string): AbilityItem[] =>
  state.lists[id] ?? [];

export const canAddItem = (def: ListDef, state: AbilityState, rank: number) =>
  listItems(state, def.id).length < def.max(rank, state);

/* ---------- tabelas por rank ---------- */

/** `level` é o rank, ou o que a tabela usar no lugar (pontos de uma especialidade). */
export const tierActive = (table: TierTable, t: Tier, level: number) =>
  table.cumulative ? level >= t.from : level >= t.from && level <= t.to;

export const rankRange = (t: Tier) => (t.from === t.to ? `${t.from}` : `${t.from}–${t.to}`);
