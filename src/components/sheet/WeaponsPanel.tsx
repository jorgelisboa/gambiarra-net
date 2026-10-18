"use client";

import { useState } from "react";
import { BookName } from "@/components/BookName";
import { weaponTypeLines } from "@/components/gearText";
import { t } from "@/i18n";
import {
  AIMED_PENALTY,
  AIM_TARGETS,
  RANGE_BANDS,
  SHELL_DAMAGE,
  SHELL_DV,
  SLOT_LABELS,
  armorAt,
  armorPenalty,
  attack,
  catalogItem,
  evasionCheck,
  itemName,
  modeBlocked,
  weaponDamage,
  weaponInfo,
  type AimTarget,
  type FireMode,
  type WeaponInfo,
} from "@/lib/rpg";
import type { Character, GearItem } from "@/lib/types";
import type { PushRoll } from "./roll";
import type { SheetTabId } from "./SheetView";
import { LinkBtn, Section } from "./ui";
import { WeaponIcon } from "./WeaponIcon";
import { WeaponMagazine } from "./WeaponMagazine";

/** Armas do inventário (as implantadas também): modo de tiro, ataque, dano e pente, e a armadura vestida. */
export function WeaponsPanel({
  ch,
  save,
  onTab,
  push,
  className,
}: {
  ch: Character;
  save: (patch: Partial<Character>) => void;
  onTab: (tab: SheetTabId) => void;
  push: PushRoll;
  className?: string;
}) {
  const weapons = ch.gear.filter((g) => catalogItem(g.ref)?.kind === "weapon");

  return (
    <Section title={t.weapons.panel.title} className={className}>
      {weapons.length === 0 ? (
        <p className="text-dim">{t.weapons.panel.empty}</p>
      ) : (
        <ul className="space-y-2">
          {weapons.map((it) => (
            <WeaponRow key={it.id} itemId={it.id} ch={ch} save={save} push={push} />
          ))}
        </ul>
      )}
      <ArmorLine gear={ch.gear} />
      <div className="mt-1 flex justify-end">
        <LinkBtn className="!my-0" onClick={() => onTab("gear")}>
          {t.weapons.panel.gearLink}
        </LinkBtn>
      </div>
    </Section>
  );
}

/** Modos que rolam só o ataque: o dano é um segundo toque ("dano"). */
const SEPARATE_DAMAGE: FireMode[] = ["single", "double", "aimed"];

/** Faixa que a rajada abre marcada: 13–25 m (índice em RANGE_BANDS). */
const DEFAULT_AUTOFIRE_BAND = 2;

const dim = "mt-1.5 text-xs text-dim";

/** Distância: em 360px "sem distância · o mestre diz a DV" só cabe em 11px (select não quebra linha). */
const SELECT = "field mt-2 min-h-10 !px-1.5 text-[11px] @[20rem]:!px-2 @[20rem]:text-xs";

const segment = (on: boolean) =>
  `min-h-10 grow border-2 px-2 text-xs ${on ? "border-red bg-red text-black" : "border-line text-dim hover:text-fg"}`;

function WeaponRow({
  itemId,
  ch,
  save,
  push,
}: {
  itemId: string;
  ch: Character;
  save: (patch: Partial<Character>) => void;
  push: PushRoll;
}) {
  // escolha do jogador; vale só enquanto a munição do pente for a mesma (trocar pra cartucho muda os modos)
  const [sel, setSel] = useState<{ mode: FireMode; ammo?: string } | null>(null);
  const [aim, setAim] = useState<AimTarget>(AIM_TARGETS[0].id);
  const [shotBand, setShotBand] = useState("");
  const [autoBand, setAutoBand] = useState(DEFAULT_AUTOFIRE_BAND);

  const info = weaponInfo(ch, itemId);
  if (!info) return null;

  const { item, stats, mag } = info;
  const P = t.weapons.panel;
  const name = itemName(item);
  const kind = info.melee ? "melee" : "ranged";
  const mode: FireMode =
    sel && sel.ammo === mag?.ammoRef && info.modes.includes(sel.mode) ? sel.mode : info.modes[0];
  const blocked = modeBlocked(ch, item.id, mode);
  const aimTarget = AIM_TARGETS.find((a) => a.id === aim) ?? AIM_TARGETS[0];
  const label = t.weapons.actions[mode][kind];
  const typeLines = weaponTypeLines(info.def, item, info.category);

  function rangeFor(m: FireMode): number | undefined {
    if (m === "autofire") return autoBand;
    if ((m === "single" || m === "double" || m === "aimed") && shotBand !== "") return Number(shotBand);
    return undefined;
  }

  function run() {
    const r = attack(ch, item.id, mode, { aim: mode === "aimed" ? aim : undefined, range: rangeFor(mode) });
    if (r.gear) save({ gear: r.gear });
    for (const { label: what, roll } of r.rolls) {
      push(`${name}${t.common.sep}${what}`, roll, roll.ok === undefined ? undefined : roll.ok ? t.weapons.roll.hit : t.weapons.roll.miss);
    }
  }

  function rollDamage() {
    push(`${name}${t.common.sep}${t.common.words.damage}`, weaponDamage(ch, item.id, { aim: mode === "aimed" ? aim : undefined }));
  }

  return (
    <li className="border-2 border-line bg-panel p-2">
      <div className="flex items-start gap-2">
        <div className="shrink-0 border-2 border-line bg-bg p-1 text-fg">
          <WeaponIcon category={info.category} px={4} className="block" />
        </div>
        <div className="min-w-0 flex-1">
          <div className={`break-words text-base leading-tight font-bold ${/\d/.test(name) ? "" : "font-pixel"}`}>
            {name}
          </div>
          {typeLines.name && <div className="mt-0.5 text-xs text-dim">{typeLines.name}</div>}
          <BookName def={info.def} className="mt-0.5" />
          {typeLines.category && <div className="mt-0.5 text-xs text-dim">{typeLines.category}</div>}
          {item.implant && <div className="text-xs text-net">{P.implant}</div>}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
        <span>
          <span className="text-dim">{t.common.words.attack}</span>{" "}
          <span className="text-base font-bold text-red">{info.attackBase}</span>
        </span>
        <span>
          <span className="text-dim">{t.common.words.damage}</span>{" "}
          {stats.damage ? <span className="text-base font-bold">{stats.damage}</span> : <span className="text-dim">{P.seeBook}</span>}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="text-dim">{P.rof}</span>
          <Pips n={stats.rof} />
        </span>
        {info.explosive && <span className="text-dim">{P.explosive}</span>}
      </div>

      {info.modes.length > 1 && (
        <div role="group" aria-label={P.modeGroup(name)} className="mt-2 flex flex-wrap gap-1">
          {info.modes.map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={m === mode}
              className={segment(m === mode)}
              onClick={() => setSel({ mode: m, ammo: mag?.ammoRef })}
            >
              {t.weapons.modes[m][kind]}
            </button>
          ))}
        </div>
      )}

      {SEPARATE_DAMAGE.includes(mode) && info.singleDvs && (
        <select
          className={SELECT}
          aria-label={P.shotRange(name)}
          value={shotBand}
          onChange={(e) => setShotBand(e.target.value)}
        >
          <option value="">{t.weapons.ranges.none}</option>
          {RANGE_BANDS.map((band, i) => {
            const dv = info.singleDvs![i];
            return (
              <option key={band} value={String(i)} disabled={dv === null}>
                {t.weapons.ranges.option(band, dv)}
              </option>
            );
          })}
        </select>
      )}

      {mode === "autofire" && info.autofireDvs && (
        <>
          <select
            className={SELECT}
            aria-label={P.autofireRange(name)}
            value={autoBand}
            onChange={(e) => setAutoBand(Number(e.target.value))}
          >
            {info.autofireDvs.map((dv, i) => (
              <option key={RANGE_BANDS[i]} value={i}>
                {t.weapons.ranges.option(RANGE_BANDS[i], dv)}
              </option>
            ))}
          </select>
          <p className={dim}>
            {P.autofireInfo(info.rounds.autofire, stats.autofire?.max ?? 0)}
          </p>
        </>
      )}

      {mode === "suppressive" && (
        <p className={dim}>{P.suppressiveInfo(info.rounds.suppressive)}</p>
      )}

      {mode === "aimed" && (
        <>
          <div role="group" aria-label={P.aimGroup(name)} className="mt-1.5 flex flex-wrap gap-1">
            {AIM_TARGETS.map((tg) => (
              <button
                key={tg.id}
                type="button"
                aria-pressed={tg.id === aim}
                className={segment(tg.id === aim)}
                onClick={() => setAim(tg.id)}
              >
                {tg.label}
              </button>
            ))}
          </div>
          <p className={dim}>
            <span className="text-red">{t.common.signed(AIMED_PENALTY)}</span>, {P.aimedSpends}
          </p>
          <p className="mt-0.5 text-xs text-dim">{aimTarget.effect}</p>
        </>
      )}

      {mode === "double" && <p className={dim}>{t.weapons.roll.doubleNote}</p>}

      {mode === "shell" && (
        <p className={dim}>{P.shellInfo(SHELL_DV, SHELL_DAMAGE)}</p>
      )}

      {info.melee && SEPARATE_DAMAGE.includes(mode) && <p className={dim}>{t.weapons.roll.meleeDefense(evasionCheck())}</p>}

      <div className="mt-2 flex gap-1">
        <button
          type="button"
          className="btn btn-primary min-h-11 min-w-0 flex-1 !px-2"
          disabled={!!blocked}
          aria-label={P.actionWith(label, name)}
          onClick={run}
        >
          {label}
        </button>
        {SEPARATE_DAMAGE.includes(mode) && (
          <button
            type="button"
            className="btn min-h-11 min-w-0 shrink-0 !px-3"
            disabled={!stats.damage}
            aria-label={P.damageOf(name)}
            onClick={rollDamage}
          >
            {t.common.words.damage}
          </button>
        )}
      </div>
      {blocked && <p className="mt-1 text-xs text-red">{blocked}</p>}

      {mag ? (
        <WeaponMagazine ch={ch} info={info} mag={mag} spend={info.rounds[mode]} save={save} />
      ) : (
        !info.melee && <Arrows info={info} />
      )}
    </li>
  );
}

/** ROF em quadradinhos, um por ataque da ação. */
function Pips({ n }: { n: number }) {
  return (
    <span role="img" aria-label={t.weapons.panel.rofAria(n)} className="inline-flex gap-0.5">
      {Array.from({ length: n }, (_, i) => (
        <span key={i} className="block size-2 bg-fg" />
      ))}
    </span>
  );
}

/** Arco: sem pente, as flechas saem direto do bolso. */
function Arrows({ info }: { info: WeaponInfo }) {
  const qty = info.compatible.reduce((n, g) => n + g.qty, 0);
  return (
    <p className="mt-2 border-t-2 border-line pt-2 text-xs">
      <span className="text-dim">{t.weapons.panel.arrows}</span>{" "}
      <span className={`text-base font-bold ${qty ? "" : "text-red"}`}>{qty}</span>
      <span className="text-dim">
        {t.common.sep}
        {t.weapons.roll.basicArrow}
      </span>
    </p>
  );
}

/** Armadura vestida: nome, SP atual/máximo por local e a penalidade em REF/DEX/MOVE. */
function ArmorLine({ gear }: { gear: GearItem[] }) {
  const head = armorAt(gear, "head");
  const body = armorAt(gear, "body");
  const penalty = armorPenalty(gear);
  const shield = gear.find((g) => g.equipped && catalogItem(g.ref)?.kind === "shield");
  const places = [
    { label: SLOT_LABELS.head, a: head },
    { label: SLOT_LABELS.body, a: body },
  ].filter((p) => p.a);

  return (
    <p className="mt-2 border-t-2 border-line pt-2 text-xs leading-relaxed">
      <span className="text-dim">{t.gear.armorLine.label}</span>{" "}
      {places.length === 0 && <span className="text-dim">{t.gear.armorLine.none}</span>}
      {places.map((p, i) => (
        <span key={p.label}>
          {i > 0 && <span className="text-dim">{t.common.sep}</span>}
          <span className="text-dim">{p.label}</span> {itemName(p.a!.item)}{" "}
          <span className="font-bold">{p.a!.sp}</span>
          <span className="text-dim">/{p.a!.max}</span>
        </span>
      ))}
      {penalty !== 0 && (
        <span>
          <span className="text-dim">{t.common.sep}{t.common.words.penalty} </span>
          <span className="font-bold text-red">{penalty}</span> {t.gear.penaltyStats}
        </span>
      )}
      {shield && (
        <span>
          <span className="text-dim">{t.common.sep}{t.gear.armor.shield} </span>
          <span className="font-bold">{shield.current ?? 0}</span> {t.gear.armor.units.hp}
        </span>
      )}
    </p>
  );
}
