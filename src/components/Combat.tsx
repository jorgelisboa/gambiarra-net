"use client";

import { useState } from "react";
import {
  addCombatant,
  endCombat,
  nextTurn,
  patchCombatant,
  applyHit,
  removeCombatant,
  resetDeathSavePenalty,
  setCombatantHp,
  startCombat,
  useApp,
} from "@/lib/store";
import {
  COMBAT_ACTIONS,
  COMBAT_RULES,
  SLOT_LABELS,
  d10,
  describeHit,
  effectiveStats,
  initiativeBonus,
  resolveHit,
  rollDamage,
  woundOf,
  type Hit,
} from "@/lib/rpg";
import { uid } from "@/lib/id";
import { vitalsOf, type Vitals } from "@/lib/rules";
import type { ArmorSlot, Combatant } from "@/lib/types";
import { InitiativeStage } from "./InitiativeStage";
import { RefBlock } from "./RoleAbility";
import { Bar } from "./Pixel";
import { Portrait } from "./Portrait";
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
  tie: Math.random(),
  ...p,
});

export function Combat() {
  const { data } = useApp();
  const { combat, characters, sessionCharacterId } = data;
  const [stage, setStage] = useState(false);
  const [npc, setNpc] = useState({ name: "", hp: 20, ref: 5, sp: 0, net: 0 });

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
        armor: { head: npc.sp, body: npc.sp },
        initiative: d10() + npc.ref,
      }),
    );
    setNpc({ ...npc, name: "" });
  }

  function rerollAll() {
    for (const c of combat.combatants) {
      const v = vitalsOf(c, characters);
      patchCombatant(c.id, { initiative: d10() + v.ref + v.initBonus, tie: Math.random() });
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

      <details className="box p-3">
        <summary className="select-none">
          <span className="label">ações e regras do turno</span>
        </summary>
        <div className="mt-3 grid grid-cols-1 items-start gap-3 lg:grid-cols-2">
          <RefBlock table={{ title: "ações (1 de movimento + 1 ação por turno)", rows: COMBAT_ACTIONS.map(([n, en, d]) => [n, en, d]) }} />
          <RefBlock table={{ title: "regras", rows: COMBAT_RULES }} />
        </div>
      </details>

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
            <Mini label="sp" value={npc.sp} onChange={(v) => setNpc({ ...npc, sp: v })} />
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
  const v = vitalsOf(c, data.characters, data.combat.round);
  const wound = woundOf(v.hp, v.maxHp);
  const isActive = data.combat.active && data.combat.activeId === c.id;
  const [delta, setDelta] = useState(1);
  const [hitting, setHitting] = useState(false);
  const [last, setLast] = useState<string | null>(null);

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
      <Portrait photo={v.photo} seed={v.seed} color={v.color} size={44} dim={v.hp <= 0} />
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
            className={`btn !px-2 !py-0 ${hitting ? "btn-primary" : ""}`}
            aria-expanded={hitting}
            onClick={() => setHitting(!hitting)}
          >
            dano
          </button>
          <button
            className="btn btn-bare !px-2 !py-0"
            aria-label="tirar HP direto, sem armadura"
            title="tirar HP direto, sem armadura"
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
            title="curar"
            onClick={() => setCombatantHp(c.id, v.hp + delta)}
          >
            +
          </button>
          <input
            type="number"
            min={1}
            aria-label="valor de ajuste ou cura"
            className="field !w-14 !py-0 text-center"
            value={delta}
            onChange={(e) => setDelta(Math.max(1, Number(e.target.value) || 1))}
          />
          {wound.short && (
            <span
              className={wound.id === "light" ? "text-dim" : "text-red"}
              title={`${wound.effect} · estabilizar ${wound.stabilize}`}
            >
              {wound.short}
            </span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-dim">
          <span>
            SP cabeça <span className="text-fg">{v.sp.head}</span> · corpo{" "}
            <span className="text-fg">{v.sp.body}</span>
          </span>
          {v.move !== null && (
            <span title="ação de movimento: MOVE × 2 m/yd (ou MOVE quadrados no grid)">
              anda <span className="text-fg">{v.move * 2}m</span>
            </span>
          )}
          {v.deathSavePenalty > 0 && (
            <span className="text-red">
              death save +{v.deathSavePenalty}{" "}
              <button
                className="btn btn-bare !p-0 text-dim underline"
                onClick={() => resetDeathSavePenalty(c.id)}
              >
                zerar
              </button>
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
      {hitting && <HitPanel c={c} v={v} onApplied={setLast} />}
      {last && (
        <p className="basis-full text-xs" aria-live="polite">
          {last}
        </p>
      )}
    </li>
  );
}

const DAMAGE_DICE = ["1d6", "2d6", "3d6", "4d6", "5d6", "6d6", "8d6", "2d6x2", "2d6x3", "2d6x4"];

/** Onde o golpe pegou. Cabeça, mão e perna só com tiro mirado. */
const TARGETS: { id: string; label: string; location: ArmorSlot; aim?: "hand" | "leg"; title?: string }[] = [
  { id: "body", label: "corpo", location: "body" },
  { id: "head", label: "cabeça · mirado ×2", location: "head", title: "tiro mirado: o que passa da armadura da cabeça dobra" },
  { id: "hand", label: "mão · mirado", location: "body", aim: "hand", title: "tiro mirado: se passar 1 ponto da armadura do corpo, larga um item da mão" },
  { id: "leg", label: "perna · mirado", location: "body", aim: "leg", title: "tiro mirado: se passar 1 ponto da armadura do corpo, perna quebrada (ferimento crítico)" },
];

/** Golpe que acertou: dano, local e o que passa da armadura (regra em src/lib/rpg/damage.ts). */
function HitPanel({ c, v, onApplied }: { c: Combatant; v: Vitals; onApplied: (msg: string) => void }) {
  const [damage, setDamage] = useState(0);
  const [targetId, setTargetId] = useState("body");
  const target = TARGETS.find((t) => t.id === targetId)!;
  const location = target.location;
  const [bypassArmor, setBypassArmor] = useState(false);
  const [critical, setCritical] = useState(false);
  const [attack, setAttack] = useState(true);
  const [dice, setDice] = useState("3d6");
  const [rolled, setRolled] = useState<{ dice: number[]; times: number } | null>(null);

  const hit: Hit = { damage, location, aim: target.aim, bypassArmor, critical, attack };
  const r = resolveHit(hit, v);
  const mortal = v.hp < 1;

  function roll() {
    const res = rollDamage(dice);
    setDamage(res.total);
    setCritical(res.critical);
    setRolled({ dice: res.dice, times: res.times });
  }

  function apply() {
    if (r.hpLoss <= 0 && damage <= 0) return;
    applyHit(c.id, hit);
    const after = woundOf(Math.max(0, v.hp - r.hpLoss), v.maxHp);
    const notes = [
      describeHit(hit, r),
      r.ablate && `SP ${SLOT_LABELS[location]} ${r.sp}→${r.sp - 1}`,
      r.aimEffect,
      r.critical && "role na tabela de ferimento crítico",
      r.mortalHit && "+1 na penalidade de death save",
      after.label,
    ].filter(Boolean);
    onApplied(`${v.name}: ${notes.join(" · ")}`);
    setDamage(0);
    setCritical(false);
    setRolled(null);
  }

  const toggle = (on: boolean) =>
    `border-2 px-2 py-0.5 ${on ? "border-red text-red" : "border-line text-dim hover:text-fg"}`;

  return (
    <form
      className="basis-full space-y-2 border-t-2 border-line pt-3 text-xs"
      onSubmit={(e) => {
        e.preventDefault();
        apply();
      }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1">
          <span className="text-dim">dano</span>
          <input
            type="number"
            min={0}
            autoFocus
            className="field !w-16 !py-0 text-center text-base font-bold"
            value={damage}
            onChange={(e) => {
              setDamage(Math.max(0, Number(e.target.value) || 0));
              setRolled(null);
            }}
          />
        </label>
        <span className="text-dim">ou</span>
        <select
          className="field !w-auto !py-0"
          aria-label="dados de dano"
          value={dice}
          onChange={(e) => setDice(e.target.value)}
        >
          {DAMAGE_DICE.map((d) => (
            <option key={d} value={d}>
              {d.includes("x") ? `autofire 2d6 × ${d.split("x")[1]}` : d}
            </option>
          ))}
        </select>
        <button type="button" className="btn !px-2 !py-0" onClick={roll}>
          rolar
        </button>
        {rolled && (
          <span className="flex gap-1" aria-label="dados rolados">
            {rolled.dice.map((d, i) => (
              <span key={i} className={`animate-hop border-2 px-1 font-bold ${d === 6 ? "border-red text-red" : "border-line"}`}>
                {d}
              </span>
            ))}
            {rolled.times > 1 && <span className="font-bold">× {rolled.times}</span>}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1">
        {TARGETS.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={targetId === t.id}
            className={toggle(targetId === t.id)}
            title={t.title}
            onClick={() => setTargetId(t.id)}
          >
            {t.label} · SP{v.sp[t.location]}
          </button>
        ))}
        <button
          type="button"
          aria-pressed={bypassArmor}
          className={toggle(bypassArmor)}
          title="veneno, fogo e afins passam direto"
          onClick={() => setBypassArmor(!bypassArmor)}
        >
          ignora armadura
        </button>
        <button
          type="button"
          aria-pressed={critical}
          className={toggle(critical)}
          title="dois ou mais 6 no dano: ferimento crítico, +5 direto no HP"
          onClick={() => setCritical(!critical)}
        >
          crítico +5
        </button>
        {mortal && (
          <button
            type="button"
            aria-pressed={attack}
            className={toggle(attack)}
            title="mortalmente ferido levando dano de ataque: ferimento crítico e +1 na penalidade de death save"
            onClick={() => setAttack(!attack)}
          >
            foi ataque
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span>
          {describeHit(hit, r)}
          {r.ablate && <span className="text-dim"> · a armadura {location === "head" ? "da cabeça" : "do corpo"} perde 1 SP</span>}
          {r.mortalHit && <span className="text-red"> · mortal: crítico e +1 death save</span>}
          {r.aimEffect && <span className="text-red"> · {r.aimEffect}</span>}
          {v.deflection > 0 && !r.deflected && (
            <span className="text-net"> · desvio de dano −{v.deflection} pronto pro 1º dano do round</span>
          )}
        </span>
        <button className="btn btn-primary !py-0" disabled={damage <= 0 && !critical}>
          aplicar
        </button>
      </div>
    </form>
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
