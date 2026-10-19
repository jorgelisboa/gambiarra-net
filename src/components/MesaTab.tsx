"use client";

import { useState } from "react";
import { t } from "@/i18n";
import {
  createMesa,
  dismissNotice,
  endMesa,
  joinMesa,
  kickMember,
  leaveMesa,
  seatCharacter,
  useMesa,
  useTableCharacters,
} from "@/lib/mesa";
import { useApp } from "@/lib/store";
import { hpMaxOf, woundOf } from "@/lib/rpg";
import { colorFor, vitalsOf } from "@/lib/rules";
import type { Character, Combatant, Mesa } from "@/lib/types";
import { InitiativeStage } from "./InitiativeStage";
import { Bar, Icon } from "./Pixel";
import { Portrait } from "./Portrait";
import { WOUND_COLORS } from "./TurnPulse";
import { NetMap } from "./net/NetMap";

const M = t.mesa;

/** Abre (ou traz de volta) a janela do telão, como na aba netrunner. */
const openScreen = () => window.open("/tela", "gambiarra-telao");

/** Aba mesa: o mestre cria e acompanha quem entrou; o jogador entra com o código e vê o que está no ar. */
export function MesaTab() {
  const { mode, role } = useApp();
  const { status, mesa, notice } = useMesa();

  if (mode !== "cloud") return <p className="box mx-auto max-w-xl p-4 text-dim">{M.needsCloud}</p>;
  if (status !== "ready") {
    return (
      <p className="p-8 text-center text-dim">
        <span className="cursor">{t.shell.connecting}</span>
      </p>
    );
  }
  return (
    <div className="mx-auto max-w-5xl space-y-4">
      {notice && (
        <p className="box flex items-start justify-between gap-3 border-red p-3 text-red" role="status">
          {notice}
          <button className="btn btn-bare !p-0 text-dim" aria-label={t.common.actions.close} onClick={dismissNotice}>
            x
          </button>
        </p>
      )}
      {role === "mestre" ? (
        mesa ? <GmMesa mesa={mesa} /> : <CreateForm />
      ) : mesa ? (
        <PlayerMesa mesa={mesa} />
      ) : (
        <JoinForm />
      )}
    </div>
  );
}

/* ---------- mestre ---------- */

function CreateForm() {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="box mx-auto max-w-xl space-y-3 p-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(await createMesa(name));
        setBusy(false);
      }}
    >
      <h2 className="font-pixel text-xl">{M.gm.createTitle}</h2>
      <p className="text-dim">{M.gm.createHint}</p>
      <input
        className="field"
        placeholder={M.gm.namePlaceholder}
        aria-label={M.gm.nameAria}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      {error && <p className="text-red">{error}</p>}
      <button className="btn btn-primary" disabled={busy}>
        {busy ? M.gm.creating : M.gm.create}
      </button>
    </form>
  );
}

function GmMesa({ mesa }: { mesa: Mesa }) {
  const characters = useTableCharacters();
  const { combat, net } = mesa.shared;
  return (
    <>
      <div className="box flex flex-wrap items-center gap-x-6 gap-y-3 p-4">
        <div>
          <span className="label">{M.code}</span>
          <div className="font-pixel text-5xl tracking-[0.2em] text-net">{mesa.code}</div>
        </div>
        <div className="min-w-0 flex-1 basis-60">
          <div className="font-pixel text-xl">{mesa.name}</div>
          <p className="text-xs text-dim">{M.gm.shareHint}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn" onClick={openScreen}>
            {M.gm.openScreen}
          </button>
          <button
            className="btn btn-danger"
            onClick={() => {
              if (confirm(M.gm.endConfirm)) void endMesa();
            }}
          >
            {M.gm.end}
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="box p-4">
          <h3 className="label mb-3">
            {M.gm.playersTitle} ({mesa.members.length})
          </h3>
          {mesa.members.length === 0 ? (
            <p className="text-dim">{M.gm.noPlayers}</p>
          ) : (
            <ul className="space-y-2">
              {mesa.members.map((m) => {
                const ch = characters.find((c) => c.id === m.characterId);
                return (
                  <li key={m.userId} className="flex items-center gap-3">
                    {ch ? <SeatVitals ch={ch} /> : <span className="flex-1 text-dim">{M.gm.noCharacter}</span>}
                    <span className="shrink-0 text-xs text-net">@{m.name}</span>
                    <button
                      className="btn btn-danger btn-bare"
                      title={M.gm.kick}
                      aria-label={M.gm.kickAria(m.name)}
                      onClick={() => void kickMember(m.userId)}
                    >
                      x
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="box space-y-2 p-4">
          <h3 className="label">{M.gm.onAirTitle}</h3>
          <p className={combat.active ? "text-red" : ""}>{M.gm.onAirCombat(combat.active, combat.combatants.length)}</p>
          <p className={net ? "text-net" : ""}>{M.gm.onAirNet(net?.name ?? null)}</p>
          <p className="text-xs text-dim">{M.gm.onAirHint}</p>
        </section>
      </div>
    </>
  );
}

function SeatVitals({ ch }: { ch: Character }) {
  const max = hpMaxOf(ch);
  const wound = woundOf(ch.hp, max);
  return (
    <span className="flex min-w-0 flex-1 items-center gap-2">
      <Portrait photo={ch.photo ?? null} seed={ch.id} color={colorFor(ch.id)} size={28} dim={ch.hp <= 0} />
      <span className="min-w-0 flex-1">
        <span className="block truncate">{ch.name}</span>
        <Bar value={ch.hp} max={max} color={WOUND_COLORS[wound.id]} />
      </span>
      <span className="shrink-0 font-mono text-xs">
        {ch.hp}/{max}
      </span>
    </span>
  );
}

/* ---------- jogador ---------- */

function JoinForm() {
  const { data } = useApp();
  const { characters, sessionCharacterId } = data;
  const [code, setCode] = useState("");
  const [charId, setCharId] = useState(sessionCharacterId ?? characters[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const picked = characters.some((c) => c.id === charId) ? charId : (characters[0]?.id ?? "");

  return (
    <form
      className="box mx-auto max-w-md space-y-3 p-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!picked || code.trim().length < 6) return;
        setBusy(true);
        setError(await joinMesa(code, picked));
        setBusy(false);
      }}
    >
      <h2 className="font-pixel text-xl">{M.player.joinTitle}</h2>
      <p className="text-dim">{M.player.joinHint}</p>
      <input
        className="field font-pixel text-center text-3xl uppercase tracking-[0.3em]"
        placeholder={M.player.codePlaceholder}
        aria-label={M.codeAria}
        autoCapitalize="characters"
        autoComplete="off"
        maxLength={6}
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
      />
      {characters.length === 0 ? (
        <p className="text-red">{M.player.noCharacters}</p>
      ) : (
        <label className="block">
          <span className="label">{M.player.characterLabel}</span>
          <select className="field mt-1" value={picked} onChange={(e) => setCharId(e.target.value)}>
            {characters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {c.role}
              </option>
            ))}
          </select>
        </label>
      )}
      {error && <p className="text-red">{error}</p>}
      <button className="btn btn-primary w-full" disabled={busy || !picked || code.length < 6}>
        {busy ? M.player.joining : M.player.join}
      </button>
    </form>
  );
}

function PlayerMesa({ mesa }: { mesa: Mesa }) {
  const { data, userId } = useApp();
  const characters = useTableCharacters();
  const [stage, setStage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const me = mesa.members.find((m) => m.userId === userId);
  const myChar = me?.characterId ?? null;
  const { combat, net } = mesa.shared;
  const active = combat.active ? combat.combatants.find((c) => c.id === combat.activeId) : undefined;
  const myTurn = !!active && !!myChar && active.characterId === myChar;
  const hasCombat = combat.combatants.length > 0;

  return (
    <>
      {stage && (
        <InitiativeStage onClose={() => setStage(false)} combat={combat} characters={characters} readOnly me={myChar} />
      )}

      <div className="box flex flex-wrap items-center gap-x-4 gap-y-2 p-3">
        <div className="min-w-0 flex-1">
          <div className="font-pixel truncate text-xl">{mesa.name}</div>
          <div className="text-xs text-dim">
            {M.code} <span className="text-net">{mesa.code}</span>
            {t.common.sep}
            {M.gmIs(mesa.gmName)}
          </div>
        </div>
        <button className="btn btn-danger" onClick={() => void leaveMesa()}>
          {M.player.leave}
        </button>
        <label className="basis-full text-xs">
          <span className="label">{M.player.seatLabel}</span>
          <select
            className="field mt-1"
            value={myChar ?? ""}
            onChange={async (e) => {
              if (e.target.value) setError(await seatCharacter(e.target.value));
            }}
          >
            {!myChar && <option value="">{M.gm.noCharacter}</option>}
            {data.characters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {c.role}
              </option>
            ))}
          </select>
        </label>
        {error && <p className="basis-full text-red">{error}</p>}
      </div>

      {myTurn && (
        <div className="animate-hop border-2 border-red bg-red p-3 text-center font-pixel text-3xl text-black" role="status">
          {M.player.yourTurn}
        </div>
      )}

      {hasCombat && (
        <section className="box p-3">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <h3 className="label">{M.player.combatTitle}</h3>
            {combat.active && (
              <span className="font-pixel">
                {t.combat.round} <span className="font-mono font-bold text-red">{String(combat.round).padStart(2, "0")}</span>
              </span>
            )}
            <button className="btn ml-auto" disabled={!combat.active} onClick={() => setStage(true)}>
              {M.player.fullscreen}
            </button>
          </div>
          {!combat.active && <p className="mb-2 text-dim">{M.player.waitingCombat}</p>}
          <ol className="space-y-2">
            {combat.combatants.map((c) => (
              <PlayerCombatRow
                key={c.id}
                c={c}
                characters={characters}
                round={combat.round}
                active={combat.active && c.id === combat.activeId}
                mine={!!myChar && c.characterId === myChar}
              />
            ))}
          </ol>
        </section>
      )}

      {net && (
        <section className="box p-3">
          <div className="mb-3 flex flex-wrap items-center gap-3 text-net">
            <Icon name="net" size={20} />
            <span className="font-pixel text-lg">{net.name}</span>
            <span className="text-xs text-dim">
              {"// "}
              {net.floors.length ? M.player.netFound(net.floors.length) : M.player.netNothing}
            </span>
          </div>
          {net.floors.length > 0 && (
            <div className="overflow-x-auto pb-2">
              <NetMap arch={net} mode="tv" />
            </div>
          )}
        </section>
      )}

      {!hasCombat && !net && <p className="box p-8 text-center text-dim">{M.player.nothingOnAir}</p>}
    </>
  );
}

/** Linha da iniciativa no celular. PNJ: só o estado do ferimento, sem HP. */
function PlayerCombatRow({
  c,
  characters,
  round,
  active,
  mine,
}: {
  c: Combatant;
  characters: Character[];
  round: number;
  active: boolean;
  mine: boolean;
}) {
  const v = vitalsOf(c, characters, round);
  const wound = woundOf(v.hp, v.maxHp);
  const color = WOUND_COLORS[wound.id];
  return (
    <li className={`flex items-center gap-3 border-2 p-2 ${active ? "border-red" : mine ? "border-net" : "border-line"}`}>
      <span className="w-8 text-center font-mono text-lg font-bold text-red">{c.initiative}</span>
      <Portrait photo={v.photo} seed={v.seed} color={v.color} size={32} dim={v.hp <= 0} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate">{v.name}</span>
          {!v.linked && <span className="text-xs text-dim">{t.combat.npc.tag}</span>}
          {mine && <span className="bg-net px-1 text-xs font-bold uppercase text-black">{M.player.you}</span>}
          {active && <span className="bg-red px-1 text-xs font-bold uppercase text-black">{t.combat.stage.turnBadge}</span>}
        </span>
        {v.linked && (
          <span className="mt-1 flex items-center gap-2">
            <span className="flex-1">
              <Bar value={v.hp} max={v.maxHp} color={color} />
            </span>
            <span className="font-mono text-xs">
              {v.hp}/{v.maxHp}
            </span>
          </span>
        )}
      </span>
      <span className="shrink-0 text-xs uppercase" style={{ color }}>
        {wound.short || t.combat.unhurt}
      </span>
    </li>
  );
}
