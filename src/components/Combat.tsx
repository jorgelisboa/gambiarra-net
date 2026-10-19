"use client";

import { useState } from "react";
import { t } from "@/i18n";
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
import { seatedOwnerName, useMesa, useTableCharacters } from "@/lib/mesa";
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
import { TurnPulse, WOUND_COLORS } from "./TurnPulse";
import { InitiativeStage } from "./InitiativeStage";
import { BookName } from "./BookName";
import { RefBlock } from "./RoleAbility";
import { Bar } from "./Pixel";
import { Portrait } from "./Portrait";
import { TurnActions } from "./TurnActions";

const blank = (p: Partial<Combatant>): Combatant => ({
  id: uid(),
  characterId: null,
  name: t.combat.npc.defaultName,
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
  const { combat, sessionCharacterId } = data;
  // na mesa online, as fichas dos jogadores sentados entram junto com as do mestre
  const characters = useTableCharacters();
  const { mesa } = useMesa();
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
              {t.combat.round} <span className="font-mono font-bold text-red">{String(combat.round).padStart(2, "0")}</span>
            </span>
            <button className="btn btn-primary" onClick={nextTurn}>
              {t.combat.nextTurn}
            </button>
            <button className="btn" onClick={() => setStage(true)}>
              {t.combat.fullscreen}
            </button>
            <button className="btn btn-danger" onClick={endCombat}>
              {t.combat.end}
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
              {t.combat.start}
            </button>
            <button
              className="btn"
              disabled={combat.combatants.length === 0}
              onClick={rerollAll}
            >
              {t.combat.rollInitiative}
            </button>
          </>
        )}
      </div>

      <details className="box p-3">
        <summary className="select-none">
          <span className="label">{t.combat.reference.summary}</span>
        </summary>
        <div className="mt-3 grid grid-cols-1 items-start gap-3 lg:grid-cols-2">
          <ActionsRef />
          <RefBlock table={{ title: t.combat.reference.rulesTitle, rows: COMBAT_RULES }} />
        </div>
      </details>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="box p-4">
          <h3 className="label mb-3">{t.combat.addCharacter.title}</h3>
          {available.length === 0 ? (
            <p className="text-dim">
              {characters.length === 0 ? t.combat.addCharacter.noCharacters : t.combat.addCharacter.allIn}
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {available.map((c) => (
                <button key={c.id} className="btn" onClick={() => addChar(c.id)}>
                  {c.id === sessionCharacterId && "* "}
                  {c.name}
                  {seatedOwnerName(mesa, c.id) && (
                    <span className="ml-1 text-xs text-net">@{seatedOwnerName(mesa, c.id)}</span>
                  )}
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
          <h3 className="label mb-3">{t.combat.npc.addTitle}</h3>
          <div className="flex flex-wrap items-end gap-2">
            <input
              className="field min-w-32 flex-1"
              placeholder={t.combat.npc.namePlaceholder}
              aria-label={t.combat.npc.nameAria}
              value={npc.name}
              onChange={(e) => setNpc({ ...npc, name: e.target.value })}
            />
            <Mini label={t.combat.hp} value={npc.hp} onChange={(v) => setNpc({ ...npc, hp: v })} />
            <Mini label={t.stats.short.REF} value={npc.ref} onChange={(v) => setNpc({ ...npc, ref: v })} />
            <Mini label={t.combat.sp} value={npc.sp} onChange={(v) => setNpc({ ...npc, sp: v })} />
            <Mini label={t.combat.npc.net} value={npc.net} onChange={(v) => setNpc({ ...npc, net: v })} />
            <button className="btn">{t.common.actions.add}</button>
          </div>
        </form>
      </div>

      <ul className="space-y-3">
        {combat.combatants.length === 0 && (
          <li className="box p-8 text-center text-dim">{t.combat.nobody}</li>
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
  const characters = useTableCharacters();
  const v = vitalsOf(c, characters, data.combat.round);
  const wound = woundOf(v.hp, v.maxHp);
  const isActive = data.combat.active && data.combat.activeId === c.id;
  const woundColor = WOUND_COLORS[wound.id];
  // muda a cada começo de turno: o retrato pula, pisca na cor do estado e o traço corre, uma vez
  const turn = isActive ? `${data.combat.round}-${c.id}` : null;
  const [delta, setDelta] = useState(1);
  const [hitting, setHitting] = useState(false);
  const [last, setLast] = useState<string | null>(null);

  return (
    <li
      className={`box flex flex-wrap items-center gap-3 p-3 sm:gap-4 ${isActive ? "box-active" : ""}`}
    >
      <input
        type="number"
        title={t.combat.initiative}
        aria-label={t.combat.row.initiativeOf(v.name)}
        className="field !w-16 text-center text-xl font-bold text-red"
        value={c.initiative}
        onChange={(e) =>
          patchCombatant(c.id, { initiative: Number(e.target.value) || 0 })
        }
      />
      <div key={turn ?? "idle"} className={`relative isolate ${turn ? "animate-hop" : ""}`}>
        <Portrait photo={v.photo} seed={v.seed} color={v.color} size={44} dim={v.hp <= 0} />
        <TurnPulse wound={wound.id} play={turn} />
      </div>
      <div className="min-w-0 flex-1 basis-40">
        <div className="font-pixel text-lg leading-tight">
          {v.name}
          {!v.linked && <span className="ml-2 text-xs text-dim">{t.combat.npc.tag}</span>}
        </div>
        <div className="mt-2">
          <Bar value={v.hp} max={v.maxHp} color={woundColor} />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <button
            className={`btn !px-2 !py-0 ${hitting ? "btn-primary" : ""}`}
            aria-expanded={hitting}
            onClick={() => setHitting(!hitting)}
          >
            {t.common.words.damage}
          </button>
          <button
            className="btn btn-bare !px-2 !py-0"
            aria-label={t.combat.row.loseHp}
            title={t.combat.row.loseHp}
            onClick={() => setCombatantHp(c.id, v.hp - delta)}
          >
            -
          </button>
          <span className="w-14 text-center">
            {v.hp}/{v.maxHp}
          </span>
          <button
            className="btn btn-bare !px-2 !py-0"
            aria-label={t.combat.row.heal}
            title={t.combat.row.heal}
            onClick={() => setCombatantHp(c.id, v.hp + delta)}
          >
            +
          </button>
          <input
            type="number"
            min={1}
            aria-label={t.combat.row.adjustValue}
            className="field !w-14 !py-0 text-center"
            value={delta}
            onChange={(e) => setDelta(Math.max(1, Number(e.target.value) || 1))}
          />
          <span
            className="uppercase"
            style={{ color: woundColor }}
            title={wound.effect ? t.combat.row.woundTitle(wound.effect, wound.stabilize) : undefined}
          >
            {wound.short || t.combat.unhurt}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-dim">
          <span>
            {t.combat.sp} {SLOT_LABELS.head} <span className="text-fg">{v.sp.head}</span>
            {t.common.sep}
            {SLOT_LABELS.body} <span className="text-fg">{v.sp.body}</span>
          </span>
          {v.move !== null && (
            <span title={t.combat.row.walksTitle}>
              {t.combat.row.walks} <span className="text-fg">{v.move * 2}m</span>
            </span>
          )}
          {v.deathSavePenalty > 0 && (
            <span className="text-red">
              {t.combat.deathSave} +{v.deathSavePenalty}{" "}
              <button
                className="btn btn-bare !p-0 text-dim underline"
                onClick={() => resetDeathSavePenalty(c.id)}
              >
                {t.combat.row.resetDeathSave}
              </button>
            </span>
          )}
        </div>
      </div>
      <TurnActions c={c} netMax={v.netMax} size={20} />
      <button
        className="btn btn-danger btn-bare"
        title={t.combat.row.remove}
        aria-label={t.combat.row.remove}
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
  { id: "body", label: t.combat.hit.targets.body.label, location: "body" },
  { id: "head", location: "head", ...t.combat.hit.targets.head },
  { id: "hand", location: "body", aim: "hand", ...t.combat.hit.targets.hand },
  { id: "leg", location: "body", aim: "leg", ...t.combat.hit.targets.leg },
];

/** Golpe que acertou: dano, local e o que passa da armadura (regra em src/lib/rpg/damage.ts). */
function HitPanel({ c, v, onApplied }: { c: Combatant; v: Vitals; onApplied: (msg: string) => void }) {
  const [damage, setDamage] = useState(0);
  const [targetId, setTargetId] = useState("body");
  const target = TARGETS.find((x) => x.id === targetId)!;
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
      r.ablate && t.combat.hit.notes.armor(SLOT_LABELS[location], r.sp, r.sp - 1),
      r.aimEffect,
      r.critical && t.combat.hit.notes.critical,
      r.mortalHit && t.combat.hit.notes.mortalHit,
      after.label,
    ].filter(Boolean);
    onApplied(t.combat.hit.notes.result(v.name, notes.join(t.common.sep)));
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
          <span className="text-dim">{t.common.words.damage}</span>
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
        <span className="text-dim">{t.common.words.or}</span>
        <select
          className="field !w-auto !py-0"
          aria-label={t.combat.hit.diceAria}
          value={dice}
          onChange={(e) => setDice(e.target.value)}
        >
          {DAMAGE_DICE.map((d) => (
            <option key={d} value={d}>
              {d.includes("x") ? t.combat.hit.autofireDice(d.split("x")[1]) : d}
            </option>
          ))}
        </select>
        <button type="button" className="btn !px-2 !py-0" onClick={roll}>
          {t.common.actions.roll}
        </button>
        {rolled && (
          <span className="flex gap-1" aria-label={t.combat.hit.rolledAria}>
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
        {TARGETS.map((x) => (
          <button
            key={x.id}
            type="button"
            aria-pressed={targetId === x.id}
            className={toggle(targetId === x.id)}
            title={x.title}
            onClick={() => setTargetId(x.id)}
          >
            {t.combat.hit.targetButton(x.label, v.sp[x.location])}
          </button>
        ))}
        <button
          type="button"
          aria-pressed={bypassArmor}
          className={toggle(bypassArmor)}
          title={t.combat.hit.bypassArmorTitle}
          onClick={() => setBypassArmor(!bypassArmor)}
        >
          {t.combat.hit.bypassArmor}
        </button>
        <button
          type="button"
          aria-pressed={critical}
          className={toggle(critical)}
          title={t.combat.hit.criticalTitle}
          onClick={() => setCritical(!critical)}
        >
          {t.combat.hit.critical}
        </button>
        {mortal && (
          <button
            type="button"
            aria-pressed={attack}
            className={toggle(attack)}
            title={t.combat.hit.wasAttackTitle}
            onClick={() => setAttack(!attack)}
          >
            {t.combat.hit.wasAttack}
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span>
          {describeHit(hit, r)}
          {r.ablate && (
            <span className="text-dim">
              {t.common.sep}
              {t.combat.hit.armorLoses(location)}
            </span>
          )}
          {r.mortalHit && (
            <span className="text-red">
              {t.common.sep}
              {t.combat.hit.mortalHit}
            </span>
          )}
          {r.aimEffect && (
            <span className="text-red">
              {t.common.sep}
              {r.aimEffect}
            </span>
          )}
          {v.deflection > 0 && !r.deflected && (
            <span className="text-net">
              {t.common.sep}
              {t.combat.hit.deflection(v.deflection)}
            </span>
          )}
        </span>
        <button className="btn btn-primary !py-0" disabled={damage <= 0 && !critical}>
          {t.combat.hit.apply}
        </button>
      </div>
    </form>
  );
}

/** Ações do turno, como o RefBlock, mas com o nome da ação no livro pequeno embaixo (<BookName />). */
function ActionsRef() {
  return (
    <div className="box bg-raise min-w-0 p-3">
      <span className="label">{t.combat.reference.actionsTitle}</span>
      <ul className="mt-2 space-y-1.5">
        {COMBAT_ACTIONS.map(([name, en, desc]) => (
          <li key={name}>
            <span className="font-bold">{name}</span>
            <BookName def={{ name: en, namePt: name }} />
            {desc}
          </li>
        ))}
      </ul>
    </div>
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
