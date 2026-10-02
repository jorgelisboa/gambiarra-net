"use client";

import { useSyncExternalStore } from "react";
import type { AppData, Character, Combatant, UserRole } from "./types";
import { ablateArmor, maxHp, resolveHit, type Hit } from "./rpg";
import { normalizeCharacter, vitalsOf } from "./rules";
import { supabase } from "./supabase";

/**
 * Persistência.
 * - Com Supabase configurado: login com email e senha; as fichas ficam na tabela `characters` (uma linha
 *   por personagem). Combate e personagem da sessão ficam só no cache do localStorage, que também
 *   deixa a tela instantânea ao recarregar.
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
  /** Nome do perfil ou username (modo local). */
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

/** Fichas de logins locais antigos, pra não perder nada na primeira entrada na conta. */
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

  const [profile, rows] = await Promise.all([
    sb.from("profiles").select("display_name, avatar_url, role").eq("id", uid).maybeSingle(),
    sb.from("characters").select("data").eq("user_id", uid).order("created_at"),
  ]);
  if (loadedFor !== uid) return;

  let characters = base.data.characters;
  let syncError: string | null = profile.error?.message ?? rows.error?.message ?? null;
  if (rows.data?.length) {
    characters = rows.data.map((r) => normalizeCharacter(r.data as Character));
  } else if (rows.data) {
    // primeira entrada: sobe as fichas que já existiam neste navegador
    characters = localCharacters();
    if (characters.length) {
      const { error } = await sb
        .from("characters")
        .upsert(characters.map((c) => toRow(uid, c)), { onConflict: "user_id,id" });
      syncError = error?.message ?? syncError;
    }
  }
  const ids = new Set(characters.map((c) => c.id));
  const data: AppData = {
    ...base.data,
    characters,
    sessionCharacterId:
      base.data.sessionCharacterId && ids.has(base.data.sessionCharacterId)
        ? base.data.sessionCharacterId
        : null,
  };
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

/* Só as fichas vão pra nuvem; combate e personagem da sessão ficam no cache local. */

const toRow = (uid: string, c: Character) => ({
  id: c.id,
  user_id: uid,
  name: c.name,
  role: c.role,
  data: c,
  updated_at: new Date().toISOString(),
});

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let pending: { uid: string; dirty: Map<string, Character>; deleted: Set<string> } | null = null;

async function flush() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = null;
  const job = pending;
  pending = null;
  if (!job || !supabase) return;
  const results = await Promise.all([
    job.dirty.size
      ? supabase
          .from("characters")
          .upsert([...job.dirty.values()].map((c) => toRow(job.uid, c)), { onConflict: "user_id,id" })
      : null,
    job.deleted.size
      ? supabase.from("characters").delete().eq("user_id", job.uid).in("id", [...job.deleted])
      : null,
  ]);
  const error = results.find((r) => r?.error)?.error?.message ?? null;
  const cur = getSnapshot();
  if (cur.userId === job.uid && cur.syncError !== error) set({ ...cur, syncError: error });
}

/** Marca o que mudou entre duas versões da lista de fichas e agenda o envio. */
function queueSave(uid: string, prev: Character[], next: Character[]) {
  if (prev === next) return;
  if (!pending || pending.uid !== uid) pending = { uid, dirty: new Map(), deleted: new Set() };
  const before = new Map(prev.map((c) => [c.id, c]));
  for (const c of next) {
    if (before.get(c.id) !== c) {
      pending.dirty.set(c.id, c);
      pending.deleted.delete(c.id);
    }
    before.delete(c.id);
  }
  for (const id of before.keys()) {
    pending.deleted.add(id);
    pending.dirty.delete(id);
  }
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => void flush(), 400);
}

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", () => void flush());
}

/* ---------- login ---------- */

const AUTH_ERRORS: Record<string, string> = {
  invalid_credentials: "email ou senha errados.",
  email_not_confirmed: "confirme o email antes de entrar (veja sua caixa de entrada).",
  user_already_exists: "esse email já tem conta. use entrar.",
  weak_password: "senha fraca: use pelo menos 6 caracteres.",
  email_address_invalid: "email inválido.",
  email_address_not_authorized: "o supabase não conseguiu enviar o email de confirmação pra esse endereço.",
  over_email_send_rate_limit: "muitos emails enviados. tente de novo em alguns minutos.",
  over_request_rate_limit: "muitas tentativas. espere um pouco.",
  signup_disabled: "cadastro desativado.",
};

const authError = (e: { code?: string; message: string }) =>
  AUTH_ERRORS[e.code ?? ""] ?? e.message;

/** `needsConfirm`: cadastro feito, mas a conta só entra pelo link do email. */
export type AuthResult = { error: string | null; needsConfirm?: boolean };

// o builder do supabase-js só envia a requisição no then/await
const saveRole = (uid: string, role: UserRole) =>
  void supabase
    ?.from("profiles")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", uid)
    .then(() => undefined);

// O papel vai pro localStorage antes de entrar: quando a sessão chega, loadCloud já abre o app.

export async function signIn(email: string, password: string, role: UserRole): Promise<AuthResult> {
  if (!supabase) return { error: "supabase não configurado." };
  lsSet(ROLE_KEY, role);
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) {
    lsDel(ROLE_KEY);
    return { error: authError(error) };
  }
  saveRole(data.user.id, role);
  return { error: null };
}

export async function signUp(
  name: string,
  email: string,
  password: string,
  role: UserRole,
): Promise<AuthResult> {
  if (!supabase) return { error: "supabase não configurado." };
  lsSet(ROLE_KEY, role);
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { data: { full_name: name.trim() }, emailRedirectTo: window.location.origin },
  });
  if (error) {
    lsDel(ROLE_KEY);
    return { error: authError(error) };
  }
  // com "confirm email" ligado no supabase não vem sessão: a conta entra pelo link
  if (!data.session) return { error: null, needsConfirm: true };
  if (data.user) saveRole(data.user.id, role);
  return { error: null };
}

/** Modo local: username sem senha. */
export function login(username: string, role: UserRole) {
  const user = username.trim();
  if (!user || MODE !== "local") return;
  lsSet(USER_KEY, user);
  lsSet(ROLE_KEY, role);
  set({ ...blankSnap(true), user, role, data: readLocal(dataKey(user)) ?? emptyData() });
}

/** Modo cloud com sessão já aberta (ex.: voltou do link de confirmação): escolhe o papel. */
export function chooseRole(role: UserRole) {
  const cur = getSnapshot();
  if (!cur.userId) return;
  lsSet(ROLE_KEY, role);
  set({ ...cur, role, lastRole: role });
  saveRole(cur.userId, role);
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
    queueSave(cur.userId, cur.data.characters, data.characters);
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

/**
 * Golpe que acertou: tira o SP do local, desconta o resto do HP e faz a ablação da armadura.
 * Na ficha (personagem ligado) ou no PNJ.
 */
export const applyHit = (id: string, hit: Hit) =>
  mutate((d) => {
    const c = d.combat.combatants.find((x) => x.id === id);
    if (!c) return d;
    const v = vitalsOf(c, d.characters, d.combat.round);
    const r = resolveHit(hit, v);
    const penalty = r.mortalHit ? 1 : 0;
    if (c.characterId) {
      return {
        ...d,
        combat: r.deflected
          ? {
              ...d.combat,
              combatants: d.combat.combatants.map((x) => (x.id === id ? { ...x, deflectedRound: d.combat.round } : x)),
            }
          : d.combat,
        characters: d.characters.map((ch) =>
          ch.id === c.characterId
            ? {
                ...ch,
                hp: Math.max(0, ch.hp - r.hpLoss),
                gear: r.ablate ? ablateArmor(ch.gear, hit.location) : ch.gear,
                deathSavePenalty: ch.deathSavePenalty + penalty,
              }
            : ch,
        ),
      };
    }
    return {
      ...d,
      combat: {
        ...d.combat,
        combatants: d.combat.combatants.map((x) =>
          x.id === id
            ? {
                ...x,
                hp: Math.max(0, x.hp - r.hpLoss),
                armor: r.ablate ? { ...v.sp, [hit.location]: Math.max(0, v.sp[hit.location] - 1) } : x.armor,
                deathSavePenalty: (x.deathSavePenalty ?? 0) + penalty,
              }
            : x,
        ),
      },
    };
  });

/** Zera a penalidade de death save (ficha ou PNJ). */
export const resetDeathSavePenalty = (id: string) =>
  mutate((d) => {
    const c = d.combat.combatants.find((x) => x.id === id);
    if (!c) return d;
    if (c.characterId) {
      return {
        ...d,
        characters: d.characters.map((ch) => (ch.id === c.characterId ? { ...ch, deathSavePenalty: 0 } : ch)),
      };
    }
    return {
      ...d,
      combat: {
        ...d.combat,
        combatants: d.combat.combatants.map((x) => (x.id === id ? { ...x, deathSavePenalty: 0 } : x)),
      },
    };
  });

const resetTurn = (c: Combatant): Combatant => ({
  ...c,
  actionUsed: false,
  moveUsed: false,
  netUsed: 0,
});

/** Combate novo (ou encerrado): turno zerado e o desvio de dano do Solo volta a valer. */
const resetCombatant = (c: Combatant): Combatant => ({ ...resetTurn(c), deflectedRound: undefined });

export const startCombat = () =>
  mutate((d) => {
    const combatants = d.combat.combatants.map(resetCombatant).sort(byInitiative);
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
      combatants: d.combat.combatants.map(resetCombatant),
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
