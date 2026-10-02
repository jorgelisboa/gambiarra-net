"use client";

import { useSyncExternalStore } from "react";
import type { AppData, Character, Combatant, UserRole } from "./types";
import { maxHp } from "./rpg";
import { normalizeCharacter, vitalsOf } from "./rules";
import { supabase } from "./supabase";

/**
 * Persistência.
 * - Com Supabase configurado: login com Google; o AppData fica na tabela `app_data` (uma linha por
 *   usuário) e um cache no localStorage deixa a tela instantânea ao recarregar.
 * - Sem Supabase (dev sem .env): login por username, tudo no localStorage.
 * O papel (mestre/jogador) é escolhido a cada login e lembrado neste navegador até sair.
 */

const USER_KEY = "gambiarra:user";
const ROLE_KEY = "gambiarra:role";
const dataKey = (user: string) => `gambiarra:data:${user}`;
const cloudKey = (uid: string) => `gambiarra:cloud:${uid}`;

export const emptyData = (): AppData => ({
  characters: [],
  sessionCharacterId: null,
  combat: { active: false, round: 1, activeId: null, combatants: [] },
});

export type AuthMode = "cloud" | "local";

interface Snapshot {
  ready: boolean;
  mode: AuthMode;
  /** Nome exibido (Google) ou username (modo local). */
  user: string | null;
  /** auth.users.id no modo cloud. */
  userId: string | null;
  avatarUrl: string | null;
  /** Papel salvo no perfil, pra vir pré-selecionado no login. */
  lastRole: UserRole | null;
  role: UserRole | null;
  data: AppData;
  /** Falha ao salvar na nuvem (o cache local segue valendo). */
  syncError: string | null;
}

const MODE: AuthMode = supabase ? "cloud" : "local";

const blankSnap = (ready: boolean): Snapshot => ({
  ready,
  mode: MODE,
  user: null,
  userId: null,
  avatarUrl: null,
  lastRole: null,
  role: null,
  data: emptyData(),
  syncError: null,
});

const SERVER = blankSnap(false);

const isRole = (r: unknown): r is UserRole => r === "mestre" || r === "jogador";

let snap: Snapshot | null = null;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

function set(next: Snapshot) {
  snap = next;
  emit();
}

const lsGet = (k: string) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const lsSet = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v);
  } catch {}
};
const lsDel = (k: string) => {
  try {
    localStorage.removeItem(k);
  } catch {}
};

function parseData(raw: unknown): AppData {
  const obj = typeof raw === "string" ? JSON.parse(raw) : raw;
  const data: AppData = { ...emptyData(), ...(obj as Partial<AppData>) };
  return { ...data, characters: data.characters.map(normalizeCharacter) };
}

function readLocal(key: string): AppData | null {
  const raw = lsGet(key);
  if (!raw) return null;
  try {
    return parseData(raw);
  } catch {
    return null;
  }
}

function getSnapshot(): Snapshot {
  if (!snap) {
    if (MODE === "local") {
      const user = lsGet(USER_KEY);
      const r = lsGet(ROLE_KEY);
      const role = isRole(r) ? r : null;
      // sessão antiga (sem papel salvo) volta pro login pra escolher
      snap = role && user
        ? { ...blankSnap(true), user, role, data: readLocal(dataKey(user)) ?? emptyData() }
        : blankSnap(true);
    } else {
      snap = blankSnap(false);
      startCloud();
    }
  }
  return snap;
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

/* ---------- modo cloud ---------- */

let cloudStarted = false;
let loadedFor: string | null = null;

function startCloud() {
  if (cloudStarted || !supabase) return;
  cloudStarted = true;
  supabase.auth.onAuthStateChange((_event, session) => {
    // não chamar o supabase dentro do callback (trava o lock de auth): agenda
    setTimeout(() => {
      if (!session) {
        loadedFor = null;
        set(blankSnap(true));
      } else if (loadedFor !== session.user.id) {
        loadedFor = session.user.id;
        void loadCloud(session.user.id, session.user.user_metadata ?? {});
      }
    }, 0);
  });
}

/** Fichas de logins locais antigos, pra não perder nada na primeira entrada com Google. */
function localCharacters(): Character[] {
  const out: Character[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k?.startsWith("gambiarra:data:")) continue;
      for (const c of readLocal(k)?.characters ?? []) {
        if (!out.some((x) => x.id === c.id)) out.push(c);
      }
    }
  } catch {}
  return out;
}

async function loadCloud(uid: string, meta: Record<string, unknown>) {
  const sb = supabase!;
  const cached = readLocal(cloudKey(uid));
  const r = lsGet(ROLE_KEY);
  const base: Snapshot = {
    ...blankSnap(false),
    user: (meta.full_name as string) ?? (meta.name as string) ?? "netrunner",
    userId: uid,
    avatarUrl: (meta.avatar_url as string) ?? null,
    role: isRole(r) ? r : null,
    data: cached ?? emptyData(),
  };
  // com cache, mostra na hora; a nuvem chega logo depois
  if (cached) set({ ...base, ready: true });

  const [profile, row] = await Promise.all([
    sb.from("profiles").select("display_name, avatar_url, role").eq("id", uid).maybeSingle(),
    sb.from("app_data").select("data").eq("user_id", uid).maybeSingle(),
  ]);
  if (loadedFor !== uid) return;

  let data = base.data;
  let syncError: string | null = profile.error?.message ?? row.error?.message ?? null;
  if (row.data) {
    data = parseData(row.data.data);
  } else if (!row.error) {
    data = { ...emptyData(), characters: localCharacters() };
    const { error } = await sb.from("app_data").insert({ user_id: uid, data });
    syncError = error?.message ?? syncError;
  }
  lsSet(cloudKey(uid), JSON.stringify(data));

  const p = profile.data;
  set({
    ...base,
    ready: true,
    user: p?.display_name || base.user,
    avatarUrl: p?.avatar_url ?? base.avatarUrl,
    lastRole: isRole(p?.role) ? p.role : null,
    data,
    syncError,
  });
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let pending: { uid: string; data: AppData } | null = null;

async function flush() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = null;
  const job = pending;
  pending = null;
  if (!job || !supabase) return;
  const { error } = await supabase
    .from("app_data")
    .upsert({ user_id: job.uid, data: job.data, updated_at: new Date().toISOString() });
  const cur = getSnapshot();
  if (cur.userId === job.uid && (cur.syncError ?? null) !== (error?.message ?? null)) {
    set({ ...cur, syncError: error?.message ?? null });
  }
}

function queueSave(uid: string, data: AppData) {
  pending = { uid, data };
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => void flush(), 400);
}

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", () => void flush());
}

/* ---------- login ---------- */

export async function loginWithGoogle() {
  await supabase?.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin },
  });
}

/** Modo local: username sem senha. */
export function login(username: string, role: UserRole) {
  const user = username.trim();
  if (!user || MODE !== "local") return;
  lsSet(USER_KEY, user);
  lsSet(ROLE_KEY, role);
  set({ ...blankSnap(true), user, role, data: readLocal(dataKey(user)) ?? emptyData() });
}

/** Modo cloud: escolhe o papel depois do Google. */
export function chooseRole(role: UserRole) {
  const cur = getSnapshot();
  if (!cur.userId) return;
  lsSet(ROLE_KEY, role);
  set({ ...cur, role, lastRole: role });
  void supabase
    ?.from("profiles")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", cur.userId);
}

export async function logout() {
  lsDel(USER_KEY);
  lsDel(ROLE_KEY);
  if (MODE === "cloud") {
    await flush();
    await supabase?.auth.signOut();
  }
  loadedFor = null;
  set(blankSnap(true));
}

export function mutate(fn: (d: AppData) => AppData) {
  const cur = getSnapshot();
  if (!cur.user) return;
  const data = fn(cur.data);
  if (cur.mode === "cloud" && cur.userId) {
    lsSet(cloudKey(cur.userId), JSON.stringify(data));
    queueSave(cur.userId, data);
  } else {
    lsSet(dataKey(cur.user), JSON.stringify(data));
  }
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
