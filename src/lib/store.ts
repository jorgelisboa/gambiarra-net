"use client";

import { useSyncExternalStore } from "react";
import type { AppData, Character, Combatant } from "./types";
import { maxHp, normalizeCharacter, vitalsOf } from "./rules";

/**
 * Persistência local (localStorage), separada por username.
 * Quando entrar o Supabase, basta trocar load/save por chamadas à API.
 */

const USER_KEY = "gambiarra:user";
const dataKey = (user: string) => `gambiarra:data:${user}`;

export const emptyData = (): AppData => ({
  characters: [],
  sessionCharacterId: null,
  combat: { active: false, round: 1, activeId: null, combatants: [] },
});

interface Snapshot {
  ready: boolean;
  user: string | null;
  data: AppData;
}

const SERVER: Snapshot = { ready: false, user: null, data: emptyData() };

let snap: Snapshot | null = null;
const listeners = new Set<() => void>();

function readData(user: string): AppData {
  try {
    const raw = localStorage.getItem(dataKey(user));
    if (raw) {
      const data: AppData = { ...emptyData(), ...JSON.parse(raw) };
      return { ...data, characters: data.characters.map(normalizeCharacter) };
    }
  } catch {}
  return emptyData();
}

function getSnapshot(): Snapshot {
  if (!snap) {
    let user: string | null = null;
    try {
      user = localStorage.getItem(USER_KEY);
    } catch {}
    snap = { ready: true, user, data: user ? readData(user) : emptyData() };
  }
  return snap;
}

const emit = () => listeners.forEach((l) => l());

function set(next: Snapshot) {
  snap = next;
  emit();
}

export function useApp(): Snapshot {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    getSnapshot,
    () => SERVER,
  );
}

export function login(username: string) {
  const user = username.trim();
  if (!user) return;
  try {
    localStorage.setItem(USER_KEY, user);
  } catch {}
  set({ ready: true, user, data: readData(user) });
}

export function logout() {
  try {
    localStorage.removeItem(USER_KEY);
  } catch {}
  set({ ready: true, user: null, data: emptyData() });
}

export function mutate(fn: (d: AppData) => AppData) {
  const cur = getSnapshot();
  if (!cur.user) return;
  const data = fn(cur.data);
  try {
    localStorage.setItem(dataKey(cur.user), JSON.stringify(data));
  } catch {}
  set({ ...cur, data });
}

/* ---------- personagens ---------- */

export const upsertCharacter = (ch: Character) =>
  mutate((d) => {
    const exists = d.characters.some((c) => c.id === ch.id);
    return {
      ...d,
      characters: exists
        ? d.characters.map((c) => (c.id === ch.id ? ch : c))
        : [...d.characters, ch],
    };
  });

export const deleteCharacter = (id: string) =>
  mutate((d) => ({
    ...d,
    characters: d.characters.filter((c) => c.id !== id),
    sessionCharacterId: d.sessionCharacterId === id ? null : d.sessionCharacterId,
    combat: {
      ...d.combat,
      combatants: d.combat.combatants.filter((c) => c.characterId !== id),
    },
  }));

export const setSessionCharacter = (id: string | null) =>
  mutate((d) => ({ ...d, sessionCharacterId: id }));

/* ---------- combate ---------- */

const byInitiative = (a: Combatant, b: Combatant) => b.initiative - a.initiative;

export const addCombatant = (c: Combatant) =>
  mutate((d) => ({
    ...d,
    combat: {
      ...d.combat,
      combatants: [...d.combat.combatants, c].sort(byInitiative),
    },
  }));

export const patchCombatant = (id: string, patch: Partial<Combatant>) =>
  mutate((d) => {
    const combatants = d.combat.combatants
      .map((c) => (c.id === id ? { ...c, ...patch } : c))
      .sort(byInitiative);
    return { ...d, combat: { ...d.combat, combatants } };
  });

export const removeCombatant = (id: string) =>
  mutate((d) => {
    const combatants = d.combat.combatants.filter((c) => c.id !== id);
    const activeId =
      d.combat.activeId === id ? (combatants[0]?.id ?? null) : d.combat.activeId;
    return { ...d, combat: { ...d.combat, combatants, activeId } };
  });

/** Aplica dano/cura: na ficha se estiver ligado, senão no PNJ. */
export const setCombatantHp = (id: string, hp: number) =>
  mutate((d) => {
    const c = d.combat.combatants.find((x) => x.id === id);
    if (!c) return d;
    const v = vitalsOf(c, d.characters);
    const next = Math.max(0, Math.min(v.maxHp, hp));
    if (c.characterId) {
      return {
        ...d,
        characters: d.characters.map((ch) =>
          ch.id === c.characterId ? { ...ch, hp: Math.min(next, maxHp(ch.stats)) } : ch,
        ),
      };
    }
    return {
      ...d,
      combat: {
        ...d.combat,
        combatants: d.combat.combatants.map((x) =>
          x.id === id ? { ...x, hp: next } : x,
        ),
      },
    };
  });

const resetTurn = (c: Combatant): Combatant => ({
  ...c,
  actionUsed: false,
  moveUsed: false,
  netUsed: 0,
});

export const startCombat = () =>
  mutate((d) => {
    const combatants = d.combat.combatants.map(resetTurn).sort(byInitiative);
    return {
      ...d,
      combat: { active: true, round: 1, activeId: combatants[0]?.id ?? null, combatants },
    };
  });

export const endCombat = () =>
  mutate((d) => ({
    ...d,
    combat: {
      ...d.combat,
      active: false,
      round: 1,
      activeId: null,
      combatants: d.combat.combatants.map(resetTurn),
    },
  }));

export const nextTurn = () =>
  mutate((d) => {
    const list = d.combat.combatants;
    if (!d.combat.active || list.length === 0) return d;
    const i = list.findIndex((c) => c.id === d.combat.activeId);
    const ni = (i + 1) % list.length;
    const round = ni === 0 ? d.combat.round + 1 : d.combat.round;
    const nextId = list[ni].id;
    return {
      ...d,
      combat: {
        ...d.combat,
        round,
        activeId: nextId,
        combatants: list.map((c) => (c.id === nextId ? resetTurn(c) : c)),
      },
    };
  });
