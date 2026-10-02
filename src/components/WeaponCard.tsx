"use client";

import { useState } from "react";
import {
  AIMED_PENALTY,
  AIM_TARGETS,
  AMMO_LABELS,
  AUTOFIRE_DV,
  AUTOFIRE_RANGES,
  AUTOFIRE_ROUNDS,
  CRITICAL_INJURY_BONUS,
  catalogItem,
  check,
  combatModsOf,
  compatibleAmmo,
  effectiveStats,
  fire,
  itemName,
  magazineOf,
  maxHp,
  reload,
  rollDamage,
  skillDef,
  skillLevel,
  weaponStats,
  woundOf,
  type AimTarget,
  type RollResult,
  type WeaponDef,
} from "@/lib/rpg";
import type { Character, GearItem } from "@/lib/types";
import { specsOf } from "./gearText";
import { RollLine } from "./RoleAbility";

/**
 * Arma na ficha: ataque ligado à perícia e à stat, tiro mirado, pente e recarga, autofire
 * e dano. Os bônus do Solo (ataque preciso, recuperar falha, ponto fraco) já entram.
 */
export function WeaponCard({
  it,
  ch,
  onGear,
  onName,
  onRemove,
}: {
  it: GearItem;
  ch: Character;
  onGear: (gear: GearItem[]) => void;
  onName: (name: string) => void;
  onRemove: () => void;
}) {
  const [aim, setAim] = useState<AimTarget | "">("");
  const [range, setRange] = useState(2);
  const [ammoPick, setAmmoPick] = useState(0);
  const [last, setLast] = useState<{ n: number; r: RollResult } | null>(null);

  const def = catalogItem(it.ref) as WeaponDef;
  const w = weaponStats(def);
  const sd = skillDef(w.skill);
  const stats = effectiveStats(ch);
  const mods = combatModsOf(ch);
  const wound = woundOf(ch.hp, maxHp(ch.stats)).penalty;
  const lvl = skillLevel(ch.skills, w.skill);
  const mag = magazineOf(it);
  const loaded = it.loaded ?? 0;
  const ammo = compatibleAmmo(ch.gear, it);
  const pick = ammo[Math.min(ammoPick, ammo.length - 1)];
  const tooWeak = w.requiresBody && ch.stats.BODY < w.requiresBody;
  const base = sd ? stats[sd.stat] + lvl + mods.attack : 0;
  const show = (r: RollResult) => setLast({ n: (last?.n ?? 0) + 1, r });
  const aimed = `−${Math.abs(AIMED_PENALTY)}`;

  const extras = (parts: string[]) => {
    if (mods.attack) parts.push(`ataque preciso ${mods.attack}`);
    if (wound) parts.push(`ferimento ${wound}`);
    return parts;
  };

  function attack() {
    if (!sd || (mag && loaded < 1)) return;
    const target = AIM_TARGETS.find((t) => t.id === aim);
    const res = check(base + wound + (target ? AIMED_PENALTY : 0), { ignoreFumble: mods.ignoreFumble });
    const parts = extras([`${sd.name} ${lvl}`, `${sd.stat.toLowerCase()} ${stats[sd.stat]}`]);
    if (target) parts.push(`mirado ${aimed}`);
    if (mag) onGear(fire(ch.gear, it.id, 1));
    const notes = [
      `ataque: ${parts.join(" + ")} + 1d10`,
      "fumbleIgnored" in res && "falha crítica ignorada (recuperar falha)",
      target && `mirando em ${target.label}: ${target.effect}`,
      mag && `pente ${loaded - 1}/${mag.size}`,
    ].filter(Boolean);
    show({ dice: res.dice, total: res.total, crit: res.crit, text: notes.join(" · ") });
  }

  function damage() {
    const res = rollDamage(w.damage);
    const weak = mods.firstHitDamage
      ? ` · se for o 1º acerto do round: +${mods.firstHitDamage} ponto fraco = ${res.total + mods.firstHitDamage}`
      : "";
    const crit = res.critical ? ` · ferimento crítico! +${CRITICAL_INJURY_BONUS} direto no HP` : "";
    show({ dice: res.dice, total: res.total, text: `dano ${w.damage}${weak}${crit}` });
  }

  function autofire() {
    const af = w.autofire;
    if (!af || loaded < AUTOFIRE_ROUNDS) return;
    const aLvl = skillLevel(ch.skills, "autofire");
    const dv = AUTOFIRE_DV[af.table][range];
    const res = check(stats.REF + aLvl + mods.attack + wound, { ignoreFumble: mods.ignoreFumble });
    onGear(fire(ch.gear, it.id, AUTOFIRE_ROUNDS));
    const head = `autofire a ${AUTOFIRE_RANGES[range]} (DV${dv}): ${extras([`Autofire ${aLvl}`, `ref ${stats.REF}`]).join(" + ")} + 1d10`;
    const left = `pente ${loaded - AUTOFIRE_ROUNDS}`;
    if (res.total <= dv) {
      show({ dice: res.dice, total: res.total, crit: res.crit, ok: false, text: `${head} · errou (precisava passar de ${dv}) · ${left}` });
      return;
    }
    const by = res.total - dv;
    const times = Math.min(by, af.max);
    const dmg = rollDamage(`2d6x${times}`);
    const crit = dmg.critical ? ` · dois 6: ferimento crítico! +${CRITICAL_INJURY_BONUS} direto no HP` : "";
    show({
      dice: res.dice,
      total: res.total,
      crit: res.crit,
      ok: true,
      text: `${head} · passou por ${by} → ×${times}${by > af.max ? " (máximo)" : ""} · dano 2d6 [${dmg.dice.join(" ")}] × ${times} = ${dmg.total}${crit} · alvo com REF 8+ pode tentar esquivar · ${left}`,
    });
  }

  return (
    <div className="box bg-raise flex min-w-0 flex-col gap-1 p-3">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="font-pixel text-lg leading-tight">{itemName(it)}</div>
          {it.name && <div className="text-xs text-dim">{def.name}</div>}
          <div className="text-xs text-dim">{def.namePt}</div>
        </div>
        <button className="btn btn-danger btn-bare !px-1.5 !py-0" aria-label={`remover ${itemName(it)}`} onClick={onRemove}>
          x
        </button>
      </div>
      <div className="text-xs">{specsOf(def)}</div>
      {w.features.length > 0 && <div className="text-xs text-net">{w.features.join(" · ")}</div>}
      {sd && (
        <div className="text-xs">
          ataque: <span className="text-dim">{sd.name.toLowerCase()}</span> {lvl} +{" "}
          <span className="text-dim">{sd.stat.toLowerCase()}</span> {stats[sd.stat]}
          {mods.attack > 0 && (
            <>
              {" "}+ <span className="text-net">preciso {mods.attack}</span>
            </>
          )}{" "}
          = <span className="text-base font-bold text-red">{base}</span>
          {lvl === 0 && <span className="text-dim"> · sem a perícia</span>}
        </div>
      )}
      {tooWeak && <div className="text-xs text-red">precisa de BODY {w.requiresBody}+ pra disparar.</div>}

      {mag && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span>
            pente <span className={`font-bold ${loaded ? "text-fg" : "text-red"}`}>{loaded}</span>
            <span className="text-dim">/{mag.size}</span>
            {it.loadedRef && loaded > 0 && (
              <span className="text-dim"> · {catalogItem(it.loadedRef)?.name}</span>
            )}
          </span>
          {ammo.length > 0 ? (
            <>
              <select
                className="field !w-auto min-w-0 max-w-full !py-0"
                aria-label="munição pra recarregar"
                value={Math.min(ammoPick, ammo.length - 1)}
                onChange={(e) => setAmmoPick(Number(e.target.value))}
              >
                {ammo.map((a, i) => (
                  <option key={a.id} value={i}>
                    {itemName(a)} ({a.qty})
                  </option>
                ))}
              </select>
              <button
                className="btn !px-2 !py-0"
                title="1 ação: troca o pente inteiro, com um tipo de munição só"
                disabled={!pick || loaded === mag.size}
                onClick={() => pick && onGear(reload(ch.gear, it.id, pick.id))}
              >
                recarregar
              </button>
            </>
          ) : (
            <span className="text-dim">
              sem munição de {mag.types.map((t) => AMMO_LABELS[t]).join(" ou ")} no inventário
            </span>
          )}
        </div>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
        <button
          className="btn !px-2 !py-0 text-xs"
          disabled={!!mag && loaded < 1}
          title={mag && loaded < 1 ? "pente vazio" : undefined}
          onClick={attack}
        >
          atacar
        </button>
        <select
          className="field !w-auto !py-0 text-xs"
          aria-label="tiro mirado"
          title={`tiro mirado: ${aimed}, ataque único, gasta a ação inteira`}
          value={aim}
          onChange={(e) => setAim(e.target.value as AimTarget | "")}
        >
          <option value="">sem mirar</option>
          {AIM_TARGETS.map((t) => (
            <option key={t.id} value={t.id}>
              mirar: {t.label} ({aimed})
            </option>
          ))}
        </select>
        {w.damage && (
          <button className="btn !px-2 !py-0 text-xs" onClick={damage}>
            dano {w.damage}
          </button>
        )}
      </div>

      {w.autofire && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            className="field !w-auto !py-0"
            aria-label="distância do autofire"
            value={range}
            onChange={(e) => setRange(Number(e.target.value))}
          >
            {AUTOFIRE_RANGES.map((r, i) => (
              <option key={r} value={i}>
                {r} · DV{AUTOFIRE_DV[w.autofire!.table][i]}
              </option>
            ))}
          </select>
          <button
            className="btn !px-2 !py-0"
            disabled={loaded < AUTOFIRE_ROUNDS}
            title={
              loaded < AUTOFIRE_ROUNDS
                ? `precisa de ${AUTOFIRE_ROUNDS} balas no pente`
                : `1 ação e ${AUTOFIRE_ROUNDS} balas · perícia Autofire · até ×${w.autofire.max}`
            }
            onClick={autofire}
          >
            autofire ×{w.autofire.max}
          </button>
          <span className="text-dim">
            Autofire {skillLevel(ch.skills, "autofire")} + ref {stats.REF}
          </span>
        </div>
      )}

      <input
        className="field mt-1 !py-0.5 text-xs"
        placeholder="marca / apelido"
        aria-label={`nome de ${def.name}`}
        value={it.name}
        onChange={(e) => onName(e.target.value)}
      />
      {last && <RollLine key={last.n} r={last.r} accent="var(--red)" />}
    </div>
  );
}
