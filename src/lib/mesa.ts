"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { AppData, Character, Combat, Mesa, MesaMember, MesaShared, NetArchitecture } from "./types";
import { visibleTo } from "./rpg";
import { t } from "../i18n";
import { normalizeCharacter } from "./rules";
import { stableJson } from "./stableJson";
import { appSnapshot, flushSaves, receiveCharacter, subscribeApp, useApp } from "./store";
import { supabase } from "./supabase";

/**
 * Mesa online (tabelas `mesas` e `mesa_members`, migrações `supabase/migrations/*_mesas*.sql`).
 * - O mestre cria a mesa e passa o código. O combate e a arquitetura no telão continuam morando no
 *   console dele (`store.ts`); daqui eles vão pro ar em `mesas.state` sempre que mudam.
 * - O jogador entra com o código e senta uma ficha. Ele lê o que está no ar e as fichas sentadas.
 * - O dano que o mestre dá numa ficha de jogador vai pro dono (`patchSeated`): no banco, só HP,
 *   armadura e death save mudam; o celular recebe pelo Realtime (`receiveCharacter`).
 * Só existe no modo cloud. Uma mesa por vez: a mais nova do mestre, ou a última em que o jogador entrou.
 */

export type MesaStatus = "off" | "loading" | "ready";

export interface MesaSnap {
  /** off: sem Supabase ou sem login; loading: procurando a mesa da conta. */
  status: MesaStatus;
  mesa: Mesa | null;
  /** Último aviso (falha ao salvar, mesa encerrada pelo mestre...). */
  notice: string | null;
}

const OFF: MesaSnap = { status: "off", mesa: null, notice: null };

let snap: MesaSnap = OFF;
const listeners = new Set<() => void>();

function setSnap(patch: Partial<MesaSnap>) {
  snap = { ...snap, ...patch };
  listeners.forEach((l) => l());
}

const setMesa = (mesa: Mesa | null) => setSnap({ status: "ready", mesa });

const emptyCombat = (): Combat => ({ active: false, round: 1, activeId: null, combatants: [] });

/* ---------- linhas do banco ---------- */

interface MesaRow {
  id: string;
  code: string;
  name: string;
  gm_id: string;
  gm_name: string | null;
  state: Partial<MesaShared> | null;
}

interface MemberRow {
  user_id: string;
  display_name: string | null;
  character_id: string | null;
}

const parseShared = (raw: Partial<MesaShared> | null): MesaShared => ({
  combat: { ...emptyCombat(), ...raw?.combat },
  net: raw?.net ?? null,
});

const toMember = (r: MemberRow): MesaMember => ({
  userId: r.user_id,
  name: r.display_name || t.mesa.unnamedPlayer,
  characterId: r.character_id,
});

/** O que vai pro ar: o combate e só o revelado da arquitetura, sem as notas do mestre. */
function sharedFrom(data: AppData): MesaShared {
  const shown = data.net.architectures.find((a) => a.id === data.net.shownId);
  let net: NetArchitecture | null = null;
  if (shown) {
    const seen = visibleTo(shown, true);
    net = { ...seen, floors: seen.floors.map((f) => ({ ...f, note: "" })) };
  }
  return { combat: data.combat, net };
}

/* ---------- carregar e acompanhar ---------- */

let started = false;
/** `${userId}:${papel}` da conta que a mesa acompanha agora. */
let boundTo: string | null = null;
let channel: RealtimeChannel | null = null;
/** O que o mestre já mandou pro ar (pra não reenviar o mesmo). */
let published = "";
let publishTimer: ReturnType<typeof setTimeout> | null = null;

function ensureStarted() {
  if (started || typeof window === "undefined") return;
  started = true;
  subscribeApp(onApp);
  onApp();
  // celular que dormiu perde eventos do Realtime: ao voltar, busca tudo de novo
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void refresh();
  });
}

function onApp() {
  const app = appSnapshot();
  const key = app.ready && app.mode === "cloud" && app.userId && app.role ? `${app.userId}:${app.role}` : null;
  if (key !== boundTo) {
    boundTo = key;
    void bind();
    return;
  }
  publish();
}

async function bind() {
  closeChannel();
  published = "";
  if (!boundTo || !supabase) {
    snap = OFF;
    listeners.forEach((l) => l());
    return;
  }
  setSnap({ status: "loading", mesa: null, notice: null });
  await load();
}

/** Acha a mesa desta conta (a do mestre, ou a última em que o jogador entrou) e abre. */
async function load() {
  const sb = supabase;
  const token = boundTo;
  const app = appSnapshot();
  if (!sb || !token || !app.userId) return;
  let row: MesaRow | null = null;
  if (app.role === "mestre") {
    const r = await sb
      .from("mesas")
      .select("id, code, name, gm_id, gm_name, state")
      .eq("gm_id", app.userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    row = r.data as MesaRow | null;
  } else {
    const m = await sb
      .from("mesa_members")
      .select("mesa_id")
      .eq("user_id", app.userId)
      .order("joined_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (m.data) {
      const r = await sb
        .from("mesas")
        .select("id, code, name, gm_id, gm_name, state")
        .eq("id", m.data.mesa_id)
        .maybeSingle();
      row = r.data as MesaRow | null;
    }
  }
  if (token !== boundTo) return;
  if (!row) return setMesa(null);
  await open(row);
}

async function open(row: MesaRow) {
  const token = boundTo;
  const uid = appSnapshot().userId;
  if (!uid) return;
  const isGm = row.gm_id === uid;
  const { members, characters } = await fetchTable(row.id, uid);
  if (token !== boundTo) return;
  const shared = parseShared(row.state);
  setMesa({
    id: row.id,
    code: row.code,
    name: row.name,
    gmId: row.gm_id,
    gmName: row.gm_name || t.mesa.unnamedGm,
    isGm,
    members,
    characters,
    shared,
  });
  if (isGm) {
    published = stableJson(shared);
    publish();
  }
  listen(row.id);
}

/** Jogadores da mesa e as fichas que eles sentaram (menos as desta conta). */
async function fetchTable(mesaId: string, uid: string) {
  const sb = supabase!;
  const r = await sb
    .from("mesa_members")
    .select("user_id, display_name, character_id")
    .eq("mesa_id", mesaId)
    .order("joined_at");
  const members = ((r.data ?? []) as MemberRow[]).map(toMember);
  const seats = members.filter((m) => m.characterId && m.userId !== uid);
  let characters: Character[] = [];
  if (seats.length) {
    const c = await sb
      .from("characters")
      .select("user_id, id, data")
      .in("id", seats.map((m) => m.characterId!));
    characters = ((c.data ?? []) as { user_id: string; id: string; data: Character }[])
      .filter((x) => seats.some((m) => m.userId === x.user_id && m.characterId === x.id))
      .map((x) => normalizeCharacter(x.data));
  }
  return { members, characters };
}

/** Busca de novo a mesa aberta (volta do celular dormindo, reconexão, alguém entrou ou saiu). */
async function refresh() {
  const m = snap.mesa;
  const sb = supabase;
  if (!sb || !boundTo) return;
  if (!m) {
    // o jogador pode ter entrado por outro aparelho
    if (snap.status === "ready") await load();
    return;
  }
  const r = await sb
    .from("mesas")
    .select("id, code, name, gm_id, gm_name, state")
    .eq("id", m.id)
    .maybeSingle();
  if (snap.mesa?.id !== m.id) return;
  if (!r.data) return gone(m);
  const row = r.data as MesaRow;
  const uid = appSnapshot().userId!;
  const { members, characters } = await fetchTable(m.id, uid);
  const cur = snap.mesa;
  if (cur?.id !== m.id) return;
  if (!cur.isGm && !members.some((x) => x.userId === uid)) return gone(cur);
  setMesa({
    ...cur,
    name: row.name,
    members,
    characters,
    shared: cur.isGm ? cur.shared : parseShared(row.state),
  });
}

/** A mesa acabou ou o jogador foi tirado dela. */
function gone(m: Mesa) {
  closeChannel();
  setSnap({ status: "ready", mesa: null, notice: m.isGm ? null : t.mesa.ended });
}

function listen(mesaId: string) {
  const sb = supabase;
  if (!sb || channel) return;
  let first = true;
  channel = sb
    .channel(`mesa:${mesaId}`)
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "mesas", filter: `id=eq.${mesaId}` }, (p) => {
      const m = snap.mesa;
      const row = p.new as MesaRow;
      if (!m || m.id !== row.id) return;
      // o mestre é a fonte do que está no ar; o eco dele não volta pra tela
      setMesa({ ...m, name: row.name, shared: m.isGm ? m.shared : parseShared(row.state) });
    })
    // DELETE não aceita filtro no Realtime: chega de qualquer mesa, com só a chave
    .on("postgres_changes", { event: "DELETE", schema: "public", table: "mesas" }, (p) => {
      const m = snap.mesa;
      if (m && (p.old as { id?: string }).id === m.id) gone(m);
    })
    .on("postgres_changes", { event: "*", schema: "public", table: "mesa_members", filter: `mesa_id=eq.${mesaId}` }, () => {
      void refresh();
    })
    .on("postgres_changes", { event: "DELETE", schema: "public", table: "mesa_members" }, () => {
      void refresh();
    })
    // o Realtime só manda as fichas que esta conta pode ler: as dela e as sentadas na mesa
    .on("postgres_changes", { event: "*", schema: "public", table: "characters" }, (p) => {
      if (p.eventType === "DELETE") return;
      const row = p.new as { user_id: string; id: string; data: Character };
      const uid = appSnapshot().userId;
      if (row.user_id === uid) return receiveCharacter(row.data);
      const m = snap.mesa;
      if (!m || !m.members.some((x) => x.userId === row.user_id && x.characterId === row.id)) return;
      const ch = normalizeCharacter(row.data);
      const has = m.characters.some((c) => c.id === ch.id);
      setMesa({
        ...m,
        characters: has ? m.characters.map((c) => (c.id === ch.id ? ch : c)) : [...m.characters, ch],
      });
    })
    .subscribe((status) => {
      // reconectou: o que aconteceu no meio não chegou, então busca tudo
      if (status === "SUBSCRIBED") {
        if (!first) void refresh();
        first = false;
      }
    });
}

function closeChannel() {
  if (channel) void supabase?.removeChannel(channel);
  channel = null;
}

/* ---------- mestre: pôr no ar ---------- */

/** Manda pro ar o combate e a net do console, se mudaram desde o último envio. */
function publish() {
  const m = snap.mesa;
  if (!m?.isGm || !supabase) return;
  const shared = sharedFrom(appSnapshot().data);
  const key = stableJson(shared);
  if (key === published) return;
  published = key;
  setMesa({ ...m, shared });
  if (publishTimer) clearTimeout(publishTimer);
  const sb = supabase;
  publishTimer = setTimeout(() => {
    void sb
      .from("mesas")
      .update({ state: shared, updated_at: new Date().toISOString() })
      .eq("id", m.id)
      .then(({ error }) => {
        if (error) setSnap({ notice: t.mesa.errors.publish(error.message) });
      });
  }, 150);
}

/** Fichas sentadas na mesa do mestre (pro combate do console). Vazio pra jogador ou fora de mesa. */
export const seatedForGm = (): Character[] => (snap.mesa?.isGm ? snap.mesa.characters : []);

/** Chaves que o mestre muda na ficha de um jogador (as mesmas que o banco aceita). */
const GM_KEYS = ["hp", "gear", "deathSavePenalty"] as const;

/** O mestre mudou uma ficha sentada (dano, cura, armadura): manda só o que mudou pro dono. */
export function patchSeated(next: Character) {
  const m = snap.mesa;
  const sb = supabase;
  if (!m?.isGm || !sb) return;
  const prev = m.characters.find((c) => c.id === next.id);
  const owner = m.members.find((x) => x.characterId === next.id)?.userId;
  if (!prev || !owner) return;
  const patch: Record<string, unknown> = {};
  for (const k of GM_KEYS) if (stableJson(prev[k]) !== stableJson(next[k])) patch[k] = next[k];
  if (!Object.keys(patch).length) return;
  setMesa({ ...m, characters: m.characters.map((c) => (c.id === next.id ? next : c)) });
  void sb.rpc("mesa_patch_character", { owner, char_id: next.id, patch }).then(({ error }) => {
    if (error) setSnap({ notice: t.mesa.errors.patch(error.message) });
  });
}

/* ---------- ações ---------- */

const RPC_ERRORS: Record<string, string> = {
  "mesa not found": t.mesa.errors.notFound,
  "character not found": t.mesa.errors.characterNotSaved,
};

const rpcError = (e: { message: string }) => RPC_ERRORS[e.message] ?? t.mesa.errors.other(e.message);

/** Mestre: cria a mesa (e encerra uma antiga que tenha ficado aberta). */
export async function createMesa(name: string): Promise<string | null> {
  const sb = supabase;
  const app = appSnapshot();
  if (!sb || !app.userId) return t.mesa.errors.offline;
  await sb.from("mesas").delete().eq("gm_id", app.userId);
  const { data, error } = await sb.rpc("create_mesa", { mesa_name: name.trim(), gm_display_name: app.user });
  if (error) return rpcError(error);
  closeChannel();
  setSnap({ notice: null });
  await open(data as MesaRow);
  return null;
}

/** Mestre: encerra a mesa. Os jogadores saem dela; as fichas ficam com eles. */
export async function endMesa() {
  const m = snap.mesa;
  if (!m?.isGm || !supabase) return;
  closeChannel();
  setMesa(null);
  await supabase.from("mesas").delete().eq("id", m.id);
}

/** Mestre: tira um jogador da mesa. */
export async function kickMember(userId: string) {
  const m = snap.mesa;
  if (!m?.isGm || !supabase) return;
  setMesa({ ...m, members: m.members.filter((x) => x.userId !== userId) });
  await supabase.from("mesa_members").delete().eq("mesa_id", m.id).eq("user_id", userId);
  await refresh();
}

/** Jogador: entra na mesa pelo código, com a ficha escolhida. */
export async function joinMesa(code: string, characterId: string): Promise<string | null> {
  const sb = supabase;
  const app = appSnapshot();
  if (!sb || !app.userId) return t.mesa.errors.offline;
  // a ficha precisa estar no banco pro mestre ler
  await flushSaves();
  const { data, error } = await sb.rpc("join_mesa", { mesa_code: code, char_id: characterId, player_name: app.user });
  if (error) return rpcError(error);
  // um jogador fica numa mesa só: sai das outras
  await sb.from("mesa_members").delete().eq("user_id", app.userId).neq("mesa_id", data as string);
  closeChannel();
  setSnap({ notice: null });
  await load();
  return null;
}

/** Jogador: troca a ficha sentada na mesa. */
export async function seatCharacter(characterId: string): Promise<string | null> {
  const m = snap.mesa;
  const app = appSnapshot();
  if (!m || !supabase || !app.userId) return t.mesa.errors.offline;
  await flushSaves();
  const { error } = await supabase.rpc("join_mesa", { mesa_code: m.code, char_id: characterId, player_name: app.user });
  if (error) return rpcError(error);
  await refresh();
  return null;
}

/** Jogador: sai da mesa. */
export async function leaveMesa() {
  const m = snap.mesa;
  const uid = appSnapshot().userId;
  if (!m || !supabase || !uid) return;
  closeChannel();
  setSnap({ status: "ready", mesa: null, notice: null });
  await supabase.from("mesa_members").delete().eq("mesa_id", m.id).eq("user_id", uid);
}

export const dismissNotice = () => setSnap({ notice: null });

/* ---------- hooks ---------- */

function subscribe(cb: () => void) {
  ensureStarted();
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function useMesa(): MesaSnap {
  return useSyncExternalStore(subscribe, () => snap, () => OFF);
}

/** As fichas que a mesa enxerga daqui: as desta conta e as sentadas pelos outros. */
export function useTableCharacters(): Character[] {
  const { data } = useApp();
  const { mesa } = useMesa();
  const seated = mesa?.characters;
  return useMemo(() => {
    if (!seated?.length) return data.characters;
    const own = new Set(data.characters.map((c) => c.id));
    return [...data.characters, ...seated.filter((c) => !own.has(c.id))];
  }, [data.characters, seated]);
}

/** Dono de cada ficha sentada (pra mostrar "de fulano" no combate do mestre). */
export function seatedOwnerName(mesa: Mesa | null, characterId: string | null): string | null {
  if (!mesa || !characterId) return null;
  return mesa.members.find((m) => m.characterId === characterId)?.name ?? null;
}
