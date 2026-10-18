"use client";

import { useState } from "react";
import { gameName, t } from "@/i18n";
import {
  AIMED_PENALTY,
  AIM_TARGETS,
  AMMO_LABELS,
  AUTOFIRE_RANGES,
  RANGE_BANDS,
  SHELL_DAMAGE,
  SHELL_DV,
  attack,
  combatModsOf,
  effectiveStats,
  itemName,
  magazineOf,
  modeBlocked,
  reload,
  skillDef,
  skillLevel,
  weaponDamage,
  weaponInfo,
  type AimTarget,
  type FireMode,
  type LabeledRoll,
} from "@/lib/rpg";
import type { Character, GearItem } from "@/lib/types";
import { BookName } from "./BookName";
import { skillName, specsOf, weaponTypeLines } from "./gearText";
import { RollLine } from "./RoleAbility";

/**
 * Arma na ficha: ataque ligado à perícia e à stat, tiro mirado, 2 ataques, pente e recarga, autofire,
 * supressão, cartucho de escopeta e dano. As regras vêm de `attack.ts`; aqui só o desenho e os botões.
 * Os bônus do Solo (ataque preciso, recuperar falha, ponto fraco) já entram.
 */
export function WeaponCard({
  it,
  ch,
  onGear,
  onName,
  onRemove,
  locked,
}: {
  it: GearItem;
  ch: Character;
  onGear: (gear: GearItem[]) => void;
  onName: (name: string) => void;
  onRemove: () => void;
  /** Texto da etiqueta de arma que não sai do inventário (implante). Esconde o remover e o apelido; ataca e recarrega normal. */
  locked?: string;
}) {
  const [aim, setAim] = useState<AimTarget | "">("");
  const [range, setRange] = useState(2);
  const [shotRange, setShotRange] = useState("");
  const [ammoPick, setAmmoPick] = useState(0);
  const [last, setLast] = useState<{
    n: number;
    rolls: LabeledRoll[];
    blocked?: string;
  } | null>(null);

  const info = weaponInfo(ch, it.id);
  if (!info) return null;
  const { def, stats: w, mag, compatible: ammo, modes, rounds, singleDvs, autofireDvs } = info;
  const sd = skillDef(w.skill);
  const eff = effectiveStats(ch);
  const mods = combatModsOf(ch);
  const lvl = skillLevel(ch.skills, w.skill);
  const loaded = mag?.loaded ?? 0;
  const pick = ammo[Math.min(ammoPick, ammo.length - 1)];
  const aimed = t.common.signed(AIMED_PENALTY);
  const W = t.weapons;
  const kind = weaponTypeLines(def, it, info.category);
  const has = (m: FireMode) => modes.includes(m);
  const why = (m: FireMode) => modeBlocked(ch, it.id, m) ?? undefined;

  /** Ataca no modo, guarda o pente novo e mostra as rolagens. */
  function run(mode: FireMode) {
    const res = attack(ch, it.id, mode, {
      aim: aim || undefined,
      range: mode === "autofire" ? range : shotRange === "" ? undefined : Number(shotRange),
    });
    if (res.gear) onGear(res.gear);
    setLast({ n: (last?.n ?? 0) + 1, rolls: res.rolls, blocked: res.blocked });
  }

  function damage() {
    const roll = weaponDamage(ch, it.id, {
      aim: has("aimed") && aim ? aim : undefined,
    });
    setLast({ n: (last?.n ?? 0) + 1, rolls: [{ label: t.common.words.damage, roll }] });
  }

  const shell = has("shell");
  const main: FireMode = shell ? "shell" : aim && has("aimed") ? "aimed" : "single";

  return (
    <div className="box bg-raise flex min-w-0 flex-col gap-1 p-3">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-pixel text-lg leading-tight">{itemName(it)}</span>
            {locked && <span className="text-xs text-net">{locked}</span>}
          </div>
          {kind.name && <div className="text-xs text-dim">{kind.name}</div>}
          <BookName def={def} />
          {kind.category && <div className="text-xs text-dim">{kind.category}</div>}
        </div>
        {!locked && (
          <button className="btn btn-danger btn-bare !px-1.5 !py-0" aria-label={t.common.aria.remove(itemName(it))} onClick={onRemove}>
            x
          </button>
        )}
      </div>
      <div className="text-xs">{specsOf(def)}</div>
      {w.features.length > 0 && <div className="text-xs text-net">{w.features.join(" · ")}</div>}
      {sd && (
        <div className="text-xs">
          {t.common.words.attack}: <span className="text-dim">{gameName(sd)}</span> {lvl} +{" "}
          <span className="text-dim">{t.stats.short[sd.stat]}</span> {eff[sd.stat]}
          {mods.attack > 0 && (
            <>
              {" "}
              + <span className="text-net">{W.card.precise(mods.attack)}</span>
            </>
          )}{" "}
          = <span className="text-base font-bold text-red">{info.attackBase}</span>
          {lvl === 0 && (
            <span className="text-dim">
              {t.common.sep}
              {W.card.noSkill}
            </span>
          )}
        </div>
      )}
      {info.blocked && <div className="text-xs text-red">{info.blocked}.</div>}

      {mag && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span>
            {W.magazine.label} <span className={`font-bold ${loaded ? "text-fg" : "text-red"}`}>{loaded}</span>
            <span className="text-dim">/{mag.size}</span>
            {mag.ammo && loaded > 0 && (
              <span className="text-dim">
                {t.common.sep}
                {gameName(mag.ammo)}
              </span>
            )}
          </span>
          {ammo.length > 0 ? (
            <>
              <select
                className="field !w-auto min-w-0 max-w-full !py-0"
                aria-label={W.card.ammoToReload}
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
                title={W.magazine.note}
                disabled={!pick || loaded === mag.size}
                onClick={() => pick && onGear(reload(ch.gear, it.id, pick.id))}
              >
                {W.magazine.reload}
              </button>
            </>
          ) : (
            <span className="text-dim">
              {W.card.noAmmo(
                (magazineOf(it)?.types ?? []).map((a) => AMMO_LABELS[a]).join(` ${t.common.words.or} `),
              )}
            </span>
          )}
        </div>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
        {has(main) && (
          <button
            className="btn !px-2 !py-0 text-xs"
            disabled={!!why(main)}
            title={why(main) ?? (shell ? W.panel.shellInfo(SHELL_DV, SHELL_DAMAGE) : undefined)}
            onClick={() => run(main)}
          >
            {shell ? W.actions.shell.ranged : W.actions.single.ranged}
          </button>
        )}
        {has("aimed") && (
          <select
            className="field !w-auto !py-0 text-xs"
            aria-label={W.roll.labels.aimedRanged}
            title={W.card.aimedHint(aimed)}
            value={aim}
            onChange={(e) => setAim(e.target.value as AimTarget | "")}
          >
            <option value="">{W.aim.off}</option>
            {AIM_TARGETS.map((tg) => (
              <option key={tg.id} value={tg.id}>
                {W.aim.option(tg.label, aimed)}
              </option>
            ))}
          </select>
        )}
        {has("double") && (
          <button
            className="btn !px-2 !py-0 text-xs"
            disabled={!!why("double")}
            title={why("double") ?? W.card.doubleHint(rounds.double)}
            onClick={() => run("double")}
          >
            {W.actions.double.ranged}
          </button>
        )}
        {singleDvs && has("single") && (
          <select
            className="field !w-auto !py-0 text-xs"
            aria-label={W.card.shotRange}
            title={W.card.shotRangeHint}
            value={shotRange}
            onChange={(e) => setShotRange(e.target.value)}
          >
            <option value="">{W.ranges.none}</option>
            {singleDvs.map((dv, i) => (
              <option key={RANGE_BANDS[i]} value={i}>
                {W.ranges.option(RANGE_BANDS[i], dv)}
              </option>
            ))}
          </select>
        )}
        {w.damage && has("single") && (
          <button className="btn !px-2 !py-0 text-xs" onClick={damage}>
            {t.common.words.damage} {w.damage}
          </button>
        )}
      </div>

      {w.autofire && autofireDvs && has("autofire") && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            className="field !w-auto !py-0"
            aria-label={W.card.autofireRange}
            value={range}
            onChange={(e) => setRange(Number(e.target.value))}
          >
            {AUTOFIRE_RANGES.map((r, i) => (
              <option key={r} value={i}>
                {W.ranges.option(r, autofireDvs[i])}
              </option>
            ))}
          </select>
          <button
            className="btn !px-2 !py-0"
            disabled={!!why("autofire")}
            title={why("autofire") ?? W.card.autofireHint(rounds.autofire, skillName("autofire"), w.autofire.max)}
            onClick={() => run("autofire")}
          >
            {W.card.autofireButton(w.autofire.max)}
          </button>
          {has("suppressive") && (
            <button
              className="btn !px-2 !py-0"
              disabled={!!why("suppressive")}
              title={
                why("suppressive") ??
                W.card.suppressiveHint(rounds.suppressive, skillName("autofire"), skillName("concentration"))
              }
              onClick={() => run("suppressive")}
            >
              {W.actions.suppressive.ranged}
            </button>
          )}
          <span className="text-dim">
            {skillName("autofire")} {skillLevel(ch.skills, "autofire")} + {t.stats.part("REF", eff.REF)}
          </span>
        </div>
      )}

      {!locked && (
        <input
          className="field mt-1 !py-0.5 text-xs"
          placeholder={W.card.nickname}
          aria-label={W.card.nameOf(gameName(def))}
          value={it.name}
          onChange={(e) => onName(e.target.value)}
        />
      )}
      {last?.blocked && <p className="text-xs text-red">{last.blocked}</p>}
      {last?.rolls.map((l, i) => (
        <div key={`${last.n}-${i}`}>
          {last.rolls.length > 1 && <div className="label mt-2">{l.label}</div>}
          <RollLine r={l.roll} accent="var(--red)" />
        </div>
      ))}
    </div>
  );
}
