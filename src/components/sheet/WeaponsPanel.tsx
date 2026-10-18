"use client";

import {
  CRITICAL_INJURY_BONUS,
  armorAt,
  armorPenalty,
  catalogItem,
  check,
  combatModsOf,
  compatibleAmmo,
  effectiveStats,
  fire,
  itemName,
  magazineOf,
  reload,
  rollDamage,
  skillDef,
  skillLevel,
  weaponStats,
  woundPenaltyOf,
  type WeaponDef,
} from "@/lib/rpg";
import type { Character, GearItem, Stats } from "@/lib/types";
import type { PushRoll } from "./roll";
import type { SheetTabId } from "./SheetView";
import { LinkBtn, Section } from "./ui";

/** Armas do inventário (as implantadas também) com ataque e dano de um toque, e a armadura vestida. */
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
  const stats = effectiveStats(ch);

  return (
    <Section title="armas" className={className}>
      {weapons.length === 0 ? (
        <p className="text-dim">sem armas no inventário.</p>
      ) : (
        <ul className="space-y-1.5">
          {weapons.map((it) => (
            <WeaponRow key={it.id} it={it} ch={ch} stats={stats} save={save} push={push} />
          ))}
        </ul>
      )}
      <ArmorLine gear={ch.gear} />
      <div className="mt-1 flex justify-end">
        <LinkBtn className="!my-0" onClick={() => onTab("gear")}>
          mirar, autofire, munição e loja: aba equipamento
        </LinkBtn>
      </div>
    </Section>
  );
}

function WeaponRow({
  it,
  ch,
  stats,
  save,
  push,
}: {
  it: GearItem;
  ch: Character;
  stats: Stats;
  save: (patch: Partial<Character>) => void;
  push: PushRoll;
}) {
  const def = catalogItem(it.ref) as WeaponDef;
  const w = weaponStats(def);
  const sd = skillDef(w.skill);
  const mods = combatModsOf(ch);
  const wound = woundPenaltyOf(ch);
  const lvl = skillLevel(ch.skills, w.skill);
  const mag = magazineOf(it);
  const loaded = it.loaded ?? 0;
  const empty = !!mag && loaded < 1;
  const ammo = compatibleAmmo(ch.gear, it);
  const pick = ammo[0];
  const base = sd ? stats[sd.stat] + lvl + mods.attack : 0;
  const tooWeak = !!w.requiresBody && stats.BODY < w.requiresBody;
  const name = itemName(it);

  function attack() {
    if (!sd || empty) return;
    const res = check(base + wound, { ignoreFumble: mods.ignoreFumble });
    const parts = [`${sd.name} ${lvl}`, `${sd.stat.toLowerCase()} ${stats[sd.stat]}`];
    if (mods.attack) parts.push(`ataque preciso ${mods.attack}`);
    if (wound) parts.push(`ferimento ${wound}`);
    if (mag) save({ gear: fire(ch.gear, it.id, 1) });
    const notes = [
      `ataque: ${parts.join(" + ")} + 1d10`,
      "fumbleIgnored" in res && "falha crítica ignorada (recuperar falha)",
      mag && `pente ${loaded - 1}/${mag.size}`,
    ].filter(Boolean);
    push(`${name} · ataque`, { dice: res.dice, total: res.total, crit: res.crit, text: notes.join(" · ") });
  }

  function damage() {
    const res = rollDamage(w.damage);
    const weak = mods.firstHitDamage
      ? ` · se for o 1º acerto do round: +${mods.firstHitDamage} ponto fraco = ${res.total + mods.firstHitDamage}`
      : "";
    const crit = res.critical ? ` · ferimento crítico! +${CRITICAL_INJURY_BONUS} direto no HP` : "";
    push(`${name} · dano`, {
      dice: res.dice,
      total: res.total,
      crit: res.critical ? "sucesso" : undefined,
      text: `dano ${w.damage}${weak}${crit}`,
    });
  }

  function doReload() {
    if (pick) save({ gear: reload(ch.gear, it.id, pick.id) });
  }

  const btn = "btn btn-bare min-h-10 min-w-0 !px-1";

  return (
    <li className="border-2 border-line bg-panel p-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className={`min-w-0 truncate text-base ${/\d/.test(name) ? "font-bold" : "font-pixel"}`}>{name}</span>
        {it.implant && <span className="shrink-0 text-xs text-net">implante</span>}
      </div>
      <div className="mt-0.5 flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-xs">
        <span>
          <span className="text-dim">ataque</span> <span className="text-base font-bold text-red">{base}</span>
          {lvl === 0 && <span className="text-dim"> · sem a perícia</span>}
        </span>
        <span>{w.damage || <span className="text-dim">dano: ver livro</span>}</span>
        {mag && (
          <span>
            <span className="text-dim">pente</span>{" "}
            <span className={`font-bold ${empty ? "text-red" : ""}`}>{loaded}</span>
            <span className="text-dim">/{mag.size}</span>
          </span>
        )}
      </div>
      {tooWeak && <div className="mt-0.5 text-xs text-red">precisa de BODY {w.requiresBody}+ pra disparar.</div>}

      <div className={`mt-1.5 grid gap-1 ${mag ? "grid-cols-3" : "grid-cols-2"}`}>
        <button
          type="button"
          className={`${btn} ${empty ? "" : "btn-primary"}`}
          disabled={!sd || empty}
          aria-label={empty ? `sem bala: ${name}` : `atacar com ${name}`}
          onClick={attack}
        >
          {empty ? "sem bala" : "atacar"}
        </button>
        <button
          type="button"
          className={btn}
          disabled={!w.damage}
          aria-label={`dano de ${name}`}
          onClick={damage}
        >
          dano
        </button>
        {mag && (
          <button
            type="button"
            className={btn}
            disabled={!pick || loaded >= mag.size}
            aria-label={`recarregar ${name}`}
            onClick={doReload}
          >
            recarregar
          </button>
        )}
      </div>
      {empty && (
        <div className="mt-1 text-xs text-dim">
          {pick ? `recarrega com ${itemName(pick)} ×${pick.qty}` : "sem munição compatível no bolso"}
        </div>
      )}
    </li>
  );
}

/** Armadura vestida: nome, SP atual/máximo por local e a penalidade em ref/dex/move. */
function ArmorLine({ gear }: { gear: GearItem[] }) {
  const head = armorAt(gear, "head");
  const body = armorAt(gear, "body");
  const penalty = armorPenalty(gear);
  const shield = gear.find((g) => g.equipped && catalogItem(g.ref)?.kind === "shield");
  const places = [
    { label: "cabeça", a: head },
    { label: "corpo", a: body },
  ].filter((p) => p.a);

  return (
    <p className="mt-2 border-t-2 border-line pt-2 text-xs leading-relaxed">
      <span className="text-dim">armadura:</span>{" "}
      {places.length === 0 && <span className="text-dim">nenhuma vestida</span>}
      {places.map((p, i) => (
        <span key={p.label}>
          {i > 0 && <span className="text-dim"> · </span>}
          <span className="text-dim">{p.label}</span> {itemName(p.a!.item)}{" "}
          <span className="font-bold">{p.a!.sp}</span>
          <span className="text-dim">/{p.a!.max}</span>
        </span>
      ))}
      {penalty !== 0 && (
        <span>
          <span className="text-dim"> · penalidade </span>
          <span className="font-bold text-red">{penalty}</span> ref/dex/move
        </span>
      )}
      {shield && (
        <span>
          <span className="text-dim"> · escudo </span>
          <span className="font-bold">{shield.current ?? 0}</span> hp
        </span>
      )}
    </p>
  );
}
