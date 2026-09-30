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
import { d10, uid, vitalsOf } from "@/lib/rules";
import type { Combatant } from "@/lib/types";
import { Avatar } from "./Characters";
import { InitiativeStage } from "./InitiativeStage";
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
      blank({ characterId: ch.id, name: ch.name, initiative: d10() + ch.stats.REF }),
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
      patchCombatant(c.id, { initiative: d10() + vitalsOf(c, characters).ref });
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      {stage && <InitiativeStage onClose={() => setStage(false)} />}

      <div className="flex flex-wrap items-center gap-2 border border-line bg-ink-900 p-4">
        {combat.active ? (
          <>
            <span className="mr-2 text-xl font-black text-neon">
              Round {combat.round}
            </span>
            <button className="btn btn-primary" onClick={nextTurn}>
              Próximo turno →
            </button>
            <button className="btn" onClick={() => setStage(true)}>
              ⛶ Tela cheia
            </button>
            <button className="btn btn-danger" onClick={endCombat}>
              Encerrar
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
              Iniciar combate
            </button>
            <button
              className="btn"
              disabled={combat.combatants.length === 0}
              onClick={rerollAll}
            >
              🎲 Rolar iniciativa (1d10 + REF)
            </button>
          </>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="border border-line bg-ink-900 p-4">
          <h3 className="mb-2 text-xs uppercase tracking-widest text-muted">
            Adicionar personagem
          </h3>
          {available.length === 0 ? (
            <p className="text-sm text-muted">
              {characters.length === 0
                ? "Crie personagens na aba Personagens."
                : "Todos já estão no combate."}
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {available.map((c) => (
                <button key={c.id} className="btn" onClick={() => addChar(c.id)}>
                  {c.id === sessionCharacterId && "★ "}
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <form
          className="border border-line bg-ink-900 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            addNpc();
          }}
        >
          <h3 className="mb-2 text-xs uppercase tracking-widest text-muted">
            Adicionar PNJ
          </h3>
          <div className="flex flex-wrap items-end gap-2">
            <input
              className="field min-w-32 flex-1"
              placeholder="Nome"
              value={npc.name}
              onChange={(e) => setNpc({ ...npc, name: e.target.value })}
            />
            <Mini label="HP" value={npc.hp} onChange={(v) => setNpc({ ...npc, hp: v })} />
            <Mini label="REF" value={npc.ref} onChange={(v) => setNpc({ ...npc, ref: v })} />
            <Mini label="Net" value={npc.net} onChange={(v) => setNpc({ ...npc, net: v })} />
            <button className="btn">Adicionar</button>
          </div>
        </form>
      </div>

      <ul className="space-y-2">
        {combat.combatants.length === 0 && (
          <li className="border border-dashed border-line p-8 text-center text-muted">
            Ninguém no combate ainda.
          </li>
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
  const isActive = data.combat.active && data.combat.activeId === c.id;
  const [delta, setDelta] = useState(1);

  return (
    <li
      className={`flex flex-wrap items-center gap-4 border p-3 ${
        isActive ? "border-neon bg-ink-800" : "border-line bg-ink-900"
      }`}
    >
      <input
        type="number"
        title="Iniciativa"
        className="field !w-16 text-center font-mono text-lg font-black text-neon"
        value={c.initiative}
        onChange={(e) =>
          patchCombatant(c.id, { initiative: Number(e.target.value) || 0 })
        }
      />
      <Avatar name={v.name} color={v.color} size={44} />
      <div className="min-w-32 flex-1">
        <div className="font-semibold">
          {v.name}
          {!v.linked && <span className="ml-2 text-xs text-muted">PNJ</span>}
        </div>
        <div className="mt-1 h-2 bg-ink-950">
          <div
            className="h-full bg-hot transition-all"
            style={{ width: `${(v.hp / v.maxHp) * 100}%` }}
          />
        </div>
        <div className="mt-1 flex items-center gap-1 font-mono text-xs">
          <button
            className="btn !px-2 !py-0"
            onClick={() => setCombatantHp(c.id, v.hp - delta)}
          >
            −
          </button>
          <span className="w-16 text-center">
            {v.hp}/{v.maxHp}
          </span>
          <button
            className="btn !px-2 !py-0"
            onClick={() => setCombatantHp(c.id, v.hp + delta)}
          >
            +
          </button>
          <input
            type="number"
            min={1}
            className="field ml-2 !w-14 !py-0 text-center"
            value={delta}
            onChange={(e) => setDelta(Math.max(1, Number(e.target.value) || 1))}
          />
        </div>
      </div>
      <TurnActions c={c} netMax={v.netMax} size={20} />
      <button
        className="btn btn-danger"
        title="Remover do combate"
        onClick={() => removeCombatant(c.id)}
      >
        ✕
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
    <label className="text-xs text-muted">
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
