"use client";

import { useState } from "react";
import {
  addCombatant,
  endCombat,
  nextTurn,
  patchCombatant,
  removeCombatant,
  setCombatantHp,
  startCombat,
  useApp,
} from "@/lib/store";
import { d10, effectiveStats, initiativeBonus, woundOf } from "@/lib/rpg";
import { uid } from "@/lib/id";
import { vitalsOf } from "@/lib/rules";
import type { Combatant } from "@/lib/types";
import { InitiativeStage } from "./InitiativeStage";
import { Bar, Sprite } from "./Pixel";
import { TurnActions } from "./TurnActions";

const blank = (p: Partial<Combatant>): Combatant => ({
  id: uid(),
  characterId: null,
  name: "PNJ",
  ref: 5,
  initiative: 0,
  hp: 20,
  maxHp: 20,
  netMax: 0,
  actionUsed: false,
  moveUsed: false,
  netUsed: 0,
  ...p,
});

export function Combat() {
  const { data } = useApp();
  const { combat, characters, sessionCharacterId } = data;
  const [stage, setStage] = useState(false);
  const [npc, setNpc] = useState({ name: "", hp: 20, ref: 5, net: 0 });

  const inFight = new Set(combat.combatants.map((c) => c.characterId));
  const available = characters.filter((c) => !inFight.has(c.id));

  function addChar(id: string) {
    const ch = characters.find((c) => c.id === id);
    if (!ch) return;
    addCombatant(
      blank({
        characterId: ch.id,
        name: ch.name,
        initiative: d10() + effectiveStats(ch).REF + initiativeBonus(ch),
      }),
    );
  }

  function addNpc() {
    if (!npc.name.trim()) return;
    addCombatant(
      blank({
        name: npc.name.trim(),
        hp: npc.hp,
        maxHp: npc.hp,
        ref: npc.ref,
        netMax: npc.net,
        initiative: d10() + npc.ref,
      }),
    );
    setNpc({ ...npc, name: "" });
  }

  function rerollAll() {
    for (const c of combat.combatants) {
      const v = vitalsOf(c, characters);
      patchCombatant(c.id, { initiative: d10() + v.ref + v.initBonus });
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      {stage && <InitiativeStage onClose={() => setStage(false)} />}

      <div className="box flex flex-wrap items-center gap-2 p-3 sm:gap-3 sm:p-4">
        {combat.active ? (
          <>
            <span className="font-pixel mr-2 text-xl">
              round <span className="font-mono font-bold text-red">{String(combat.round).padStart(2, "0")}</span>
            </span>
            <button className="btn btn-primary" onClick={nextTurn}>
              próximo turno
            </button>
            <button className="btn" onClick={() => setStage(true)}>
              tela cheia
            </button>
            <button className="btn btn-danger" onClick={endCombat}>
              encerrar
            </button>
          </>
        ) : (
          <>
            <button
              className="btn btn-primary"
              disabled={combat.combatants.length === 0}
              onClick={() => {
                startCombat();
                setStage(true);
              }}
            >
              iniciar combate
            </button>
            <button
              className="btn"
              disabled={combat.combatants.length === 0}
              onClick={rerollAll}
            >
              rolar iniciativa (1d10 + ref)
            </button>
          </>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="box p-4">
          <h3 className="label mb-3">adicionar personagem</h3>
          {available.length === 0 ? (
            <p className="text-dim">
              {characters.length === 0
                ? "crie personagens na aba personagens."
                : "todos já estão no combate."}
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {available.map((c) => (
                <button key={c.id} className="btn" onClick={() => addChar(c.id)}>
                  {c.id === sessionCharacterId && "* "}
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <form
          className="box p-4"
          onSubmit={(e) => {
            e.preventDefault();
            addNpc();
          }}
        >
          <h3 className="label mb-3">adicionar pnj</h3>
          <div className="flex flex-wrap items-end gap-2">
            <input
              className="field min-w-32 flex-1"
              placeholder="nome"
              aria-label="nome do pnj"
              value={npc.name}
              onChange={(e) => setNpc({ ...npc, name: e.target.value })}
            />
            <Mini label="hp" value={npc.hp} onChange={(v) => setNpc({ ...npc, hp: v })} />
            <Mini label="ref" value={npc.ref} onChange={(v) => setNpc({ ...npc, ref: v })} />
            <Mini label="net" value={npc.net} onChange={(v) => setNpc({ ...npc, net: v })} />
            <button className="btn">adicionar</button>
          </div>
        </form>
      </div>

      <ul className="space-y-3">
        {combat.combatants.length === 0 && (
          <li className="box p-8 text-center text-dim">ninguém no combate ainda.</li>
        )}
        {combat.combatants.map((c) => (
          <CombatRow key={c.id} c={c} />
        ))}
      </ul>
    </div>
  );
}

function CombatRow({ c }: { c: Combatant }) {
  const { data } = useApp();
  const v = vitalsOf(c, data.characters);
  const wound = woundOf(v.hp, v.maxHp);
  const isActive = data.combat.active && data.combat.activeId === c.id;
  const [delta, setDelta] = useState(1);

  return (
    <li
      className={`box flex flex-wrap items-center gap-3 p-3 sm:gap-4 ${isActive ? "box-active" : ""}`}
    >
      <input
        type="number"
        title="iniciativa"
        aria-label={`iniciativa de ${v.name}`}
        className="field !w-16 text-center text-xl font-bold text-red"
        value={c.initiative}
        onChange={(e) =>
          patchCombatant(c.id, { initiative: Number(e.target.value) || 0 })
        }
      />
      <Sprite seed={v.seed} color={v.color} size={44} dim={v.hp <= 0} />
      <div className="min-w-0 flex-1 basis-40">
        <div className="font-pixel text-lg leading-tight">
          {v.name}
          {!v.linked && <span className="ml-2 text-xs text-dim">pnj</span>}
        </div>
        <div className="mt-2">
          <Bar value={v.hp} max={v.maxHp} color="var(--red)" />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <button
            className="btn btn-bare !px-2 !py-0"
            aria-label="causar dano"
            onClick={() => setCombatantHp(c.id, v.hp - delta)}
          >
            -
          </button>
          <span className="w-14 text-center">
            {v.hp}/{v.maxHp}
          </span>
          <button
            className="btn btn-bare !px-2 !py-0"
            aria-label="curar"
            onClick={() => setCombatantHp(c.id, v.hp + delta)}
          >
            +
          </button>
          <input
            type="number"
            min={1}
            aria-label="valor de dano ou cura"
            className="field !w-14 !py-0 text-center"
            value={delta}
            onChange={(e) => setDelta(Math.max(1, Number(e.target.value) || 1))}
          />
          {wound.short && (
            <span
              className={wound.id === "light" ? "text-dim" : "text-red"}
              title={wound.effect}
            >
              {wound.short}
            </span>
          )}
        </div>
      </div>
      <TurnActions c={c} netMax={v.netMax} size={20} />
      <button
        className="btn btn-danger btn-bare"
        title="remover do combate"
        aria-label="remover do combate"
        onClick={() => removeCombatant(c.id)}
      >
        x
      </button>
    </li>
  );
}

function Mini({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="text-xs text-dim">
      {label}
      <input
        type="number"
        min={0}
        className="field !w-16 text-center"
        value={value}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
      />
    </label>
  );
}
