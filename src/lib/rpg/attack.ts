import { t } from "../../i18n";
import type { Character, GearItem } from "../types";
import { combatModsOf, effectiveStats, woundPenaltyOf } from "./character";
import { CRITICAL_INJURY_BONUS, check, rollDamage } from "./dice";
import {
  AIMED_PENALTY,
  AIM_TARGETS,
  AUTOFIRE_DV,
  RANGE_BANDS,
  SHELL_DAMAGE,
  SHELL_DV,
  catalogItem,
  compatibleAmmo,
  fire,
  itemName,
  magazineOf,
  singleShotDvs,
  weaponCategory,
  weaponStats,
  type AimTarget,
  type AmmoDef,
  type WeaponCategory,
  type WeaponDef,
  type WeaponStats,
} from "./gear";
import { skillDef, skillLevel } from "./skills";
import type { RollResult } from "./types";

/**
 * Atacar com uma arma do inventário (págs. 169-175): os modos de tiro, quanta bala cada um gasta,
 * a rolagem e o dano. A ficha (aba ficha) e o cartão da arma (aba equipamento) chamam daqui.
 */

/**
 * - single: um ataque (tiro ou golpe), 1 bala.
 * - double: ROF 2, dois ataques na mesma ação, 2 balas (um de cada vez, rolados separados).
 * - aimed: tiro mirado, −8, ataque único que gasta a ação inteira (cabeça, mão ou perna).
 * - autofire: rajada, 10 balas, REF + Autofire contra a DV da tabela de autofire; o dano vem junto.
 * - suppressive: fogo de supressão, 10 balas, REF + Autofire + 1d10 vira a DV de quem está exposto.
 * - shell: cartucho de escopeta, contra DV13; 3d6 em todo alvo à frente a até 6m, rolado uma vez.
 */
export type FireMode = "single" | "double" | "aimed" | "autofire" | "suppressive" | "shell";

export const FIRE_MODE_LABELS: Record<FireMode, { ranged: string; melee: string }> = t.weapons.modes;

/** Balas que cada modo gasta (e o mínimo no pente). */
export const MODE_ROUNDS: Record<FireMode, number> = {
  single: 1,
  double: 2,
  aimed: 1,
  autofire: 10,
  suppressive: 10,
  shell: 1,
};

export interface WeaponInfo {
  item: GearItem;
  def: WeaponDef;
  stats: WeaponStats;
  category: WeaponCategory;
  melee: boolean;
  /** Dispara explosivo (lança-granadas, lança-foguetes): área de 10×10m. */
  explosive: boolean;
  /** Ataque do tiro ou golpe comum: stat + perícia + bônus do Solo (sem ferimento nem mira). */
  attackBase: number;
  /** Pente; ausente em arma branca e arco. */
  mag?: {
    size: number;
    loaded: number;
    /** Munição que está no pente agora (id e def); ausente com o pente vazio e sem tipo. */
    ammoRef?: string;
    ammo?: AmmoDef;
  };
  /** Pilhas do inventário que cabem no pente (ou as flechas do arco), pra escolher o que usar. */
  compatible: GearItem[];
  /** Modos que a arma tem (com a munição carregada). O primeiro é o padrão. */
  modes: FireMode[];
  /** Balas que cada modo gasta nesta arma (MODE_ROUNDS, salvo a Helix: 20 por rajada). */
  rounds: Record<FireMode, number>;
  /** DV do tiro único por faixa de RANGE_BANDS; null em arma branca. */
  singleDvs: (number | null)[] | null;
  /** DV da rajada por faixa (5 primeiras de RANGE_BANDS); ausente sem autofire. */
  autofireDvs?: number[];
  /** Motivo de não conseguir disparar nada (BODY baixo). */
  blocked?: string;
}

export interface AttackOptions {
  /** Tiro mirado: onde. */
  aim?: AimTarget;
  /** Índice em RANGE_BANDS: dá a DV do tiro único e da rajada. Sem ele, o mestre decide a DV. */
  range?: number;
  /** Arco: id da pilha de flecha (padrão: a básica). */
  arrow?: string;
}

/** Uma rolagem com rótulo curto ("ataque", "2º ataque", "dano da rajada"). */
export interface LabeledRoll {
  label: string;
  roll: RollResult;
}

export interface AttackResult {
  /** Uma ou mais rolagens, na ordem: ataques e, na rajada e no cartucho que acertam, o dano. */
  rolls: LabeledRoll[];
  /** Inventário depois de gastar a munição (ausente se não gastou). */
  gear?: GearItem[];
  /** Por que não deu pra atacar (sem rolagem nem gasto). */
  blocked?: string;
}

const MELEE_CATEGORIES: WeaponCategory[] = ["lightMelee", "mediumMelee", "heavyMelee", "veryHeavyMelee", "claws"];

const R = t.weapons.roll;

const CRIT_NOTE = R.critical(CRITICAL_INJURY_BONUS);

/** Nome da perícia pra mostrar nas contas: o pt-BR. */
const skillName = (id: string) => skillDef(id)?.namePt ?? id;

/** A defesa de quem é atacado: "DEX + evasão + 1d10". */
export const evasionCheck = () => R.dodgeCheck(skillName("evasion"));

/** Resultado de check(): dados, total e crit (fumbleIgnored quando a falha foi ignorada). */
type Check = ReturnType<typeof check>;

/** Tudo que a ficha precisa pra desenhar a arma. null se o item não for arma. */
export function weaponInfo(ch: Character, itemId: string): WeaponInfo | null {
  const item = ch.gear.find((g) => g.id === itemId);
  const def = item && catalogItem(item.ref);
  if (!item || def?.kind !== "weapon") return null;

  const stats = weaponStats(def);
  const category = weaponCategory(def, item);
  const melee = MELEE_CATEGORIES.includes(category);
  const explosive = stats.features.includes("explosivo");
  const eff = effectiveStats(ch);
  const sd = skillDef(stats.skill);
  const attackBase = sd ? eff[sd.stat] + skillLevel(ch.skills, stats.skill) + combatModsOf(ch).attack : 0;

  const m = magazineOf(item);
  const loadedAmmo = m && catalogItem(item.loadedRef);
  const mag: WeaponInfo["mag"] = m && {
    size: m.size,
    loaded: item.loaded ?? 0,
    ammoRef: item.loadedRef,
    ammo: loadedAmmo?.kind === "ammo" ? loadedAmmo : undefined,
  };

  // escopeta com cartucho só atira cartucho; Helix só rajada; algumas exóticas não miram
  const double: FireMode[] = stats.rof >= 2 ? ["double"] : [];
  const aimed: FireMode[] = stats.noAimed ? [] : ["aimed"];
  const auto: FireMode[] = stats.autofire ? ["autofire", "suppressive"] : [];
  let modes: FireMode[];
  if (melee) modes = ["single", ...double, ...aimed];
  else if (mag?.ammo?.ammo === "shell") modes = ["shell"];
  else if (explosive) modes = ["single", ...double];
  else if (stats.autofire?.only) modes = ["autofire"];
  else modes = ["single", ...double, ...aimed, ...auto];
  const burst = stats.autofire?.rounds ?? MODE_ROUNDS.autofire;
  const rounds = { ...MODE_ROUNDS, autofire: burst, suppressive: burst };

  return {
    item,
    def,
    stats,
    category,
    melee,
    explosive,
    attackBase,
    mag,
    compatible: m ? compatibleAmmo(ch.gear, item) : arrowsFor(ch.gear, stats),
    modes,
    rounds,
    singleDvs: melee ? null : singleShotDvs(category),
    autofireDvs: stats.autofire ? AUTOFIRE_DV[stats.autofire.table] : undefined,
    blocked:
      stats.requiresBody && stats.requiresBody > eff.BODY
        ? t.weapons.blocked.needBody(t.stats.part("BODY", stats.requiresBody))
        : undefined,
  };
}

/** Arco e besta não têm pente: a flecha sai direto do bolso. */
function arrowsFor(gear: GearItem[], stats: WeaponStats): GearItem[] {
  if (!stats.ammo) return [];
  return gear.filter((g) => {
    const d = catalogItem(g.ref);
    return d?.kind === "ammo" && d.ammo === stats.ammo && g.qty > 0;
  });
}

const BASIC_ARROW = "ammo-arrow";

function blockReason(info: WeaponInfo, mode: FireMode): string | null {
  const why = t.weapons.blocked;
  if (info.blocked) return info.blocked;
  if (!info.modes.includes(mode)) return mode === "shell" ? why.needShell : why.noMode;
  if (!info.mag && !info.melee && info.stats.ammo && info.compatible.length === 0) return why.noArrow;
  if (info.mag && info.mag.loaded < info.rounds[mode]) {
    if (mode === "autofire" || mode === "suppressive" || mode === "double") return why.needRounds(info.rounds[mode]);
    return why.noRound;
  }
  return null;
}

/** Motivo de não poder usar o modo agora (bala, BODY, modo que a arma não tem); null se pode. */
export function modeBlocked(ch: Character, itemId: string, mode: FireMode): string | null {
  const info = weaponInfo(ch, itemId);
  return info ? blockReason(info, mode) : t.weapons.blocked.notWeapon;
}

/** Ataca no modo, gasta a munição e devolve as rolagens. Ver a spec. */
export function attack(ch: Character, itemId: string, mode: FireMode, opts: AttackOptions = {}): AttackResult {
  const info = weaponInfo(ch, itemId);
  if (!info) return { rolls: [], blocked: t.weapons.blocked.notWeapon };
  const blocked = blockReason(info, mode);
  if (blocked) return { rolls: [], blocked };

  const { stats, mag, melee } = info;
  const eff = effectiveStats(ch);
  const mods = combatModsOf(ch);
  const wound = woundPenaltyOf(ch);
  const ignoreFumble = mods.ignoreFumble;
  const range = opts.range;
  const sd = skillDef(stats.skill);

  // partes da conta, no texto: perícia + stat, bônus do Solo, ferimento
  const tail = [mods.attack ? R.precise(mods.attack) : "", wound ? R.wound(wound) : ""].filter(Boolean);
  const weaponParts = [...(sd ? [`${sd.namePt} ${skillLevel(ch.skills, sd.id)}`, t.stats.part(sd.stat, eff[sd.stat])] : []), ...tail];
  const autofireParts = [`${skillName("autofire")} ${skillLevel(ch.skills, "autofire")}`, t.stats.part("REF", eff.REF)];
  const formula = R.formula;
  const fumble = (res: Check) => "fumbleIgnored" in res && R.fumbleIgnored;
  const join = (notes: (string | false | undefined)[]) => notes.filter(Boolean).join(t.common.sep);

  // tiro, golpe e mirado: com distância e arma de fogo, a DV decide o acerto
  const versus = (total: number): { ok?: boolean; notes: string[] } => {
    if (melee) return { notes: [R.meleeDefense(evasionCheck())] };
    const dv = range === undefined ? undefined : info.singleDvs?.[range];
    if (dv === undefined || range === undefined) return { notes: [] };
    const band = RANGE_BANDS[range];
    if (dv === null) return { ok: false, notes: [R.outOfRange(band)] };
    const ok = total > dv;
    return {
      ok,
      notes: [R.versus(dv, band, ok), ...(info.explosive ? [] : [R.dodge(evasionCheck())])],
    };
  };

  const strike = (label: string, penalty: number, notes: string[] = []): LabeledRoll => {
    const res = check(info.attackBase + wound + penalty, { ignoreFumble });
    const v = versus(res.total);
    const text = join([formula(R.formulaNames.attack, weaponParts), fumble(res), ...notes, ...v.notes]);
    return {
      label,
      roll: {
        dice: res.dice,
        total: res.total,
        crit: res.crit,
        ...(v.ok === undefined ? {} : { ok: v.ok }),
        text,
      },
    };
  };

  let rolls: LabeledRoll[];
  switch (mode) {
    case "single":
      rolls = [strike(R.labels.attack, 0)];
      break;
    case "double":
      rolls = [strike(R.labels.nth(1), 0, [R.doubleNote]), strike(R.labels.nth(2), 0)];
      break;
    case "aimed": {
      const target = AIM_TARGETS.find((a) => a.id === (opts.aim ?? "head")) ?? AIM_TARGETS[0];
      const note = R.aimedNote(target.label, t.common.signed(AIMED_PENALTY), target.effect);
      rolls = [strike(melee ? R.labels.aimedMelee : R.labels.aimedRanged, AIMED_PENALTY, [note])];
      break;
    }
    case "autofire": {
      const af = stats.autofire;
      const dvs = info.autofireDvs;
      const band = range ?? 0;
      if (!af || !dvs) return { rolls: [], blocked: t.weapons.blocked.noMode };
      if (!Number.isInteger(band) || band < 0 || band > 4) return { rolls: [], blocked: t.weapons.blocked.autofireRange };
      const dv = dvs[band];
      const res = check(eff.REF + skillLevel(ch.skills, "autofire") + mods.attack + wound, { ignoreFumble });
      const head = [formula(R.formulaNames.autofire, [...autofireParts, ...tail]), fumble(res)];
      const dodge = R.canDodge;
      if (res.total <= dv) {
        const text = join([...head, R.autofireMiss(dv, RANGE_BANDS[band]), dodge]);
        rolls = [
          {
            label: R.labels.autofire,
            roll: {
              dice: res.dice,
              total: res.total,
              crit: res.crit,
              ok: false,
              text,
            },
          },
        ];
        break;
      }
      const by = res.total - dv;
      const times = Math.min(by, af.max);
      const dmg = rollDamage(`2d6x${times}`);
      const text = join([...head, R.autofireHit(dv, RANGE_BANDS[band], by), dodge]);
      rolls = [
        {
          label: R.labels.autofire,
          roll: {
            dice: res.dice,
            total: res.total,
            crit: res.crit,
            ok: true,
            text,
          },
        },
        {
          label: R.labels.autofireDamage,
          roll: {
            dice: dmg.dice,
            total: dmg.total,
            text: join([R.autofireDamage(times, by, af.max), dmg.critical && CRIT_NOTE]),
          },
        },
      ];
      break;
    }
    case "suppressive": {
      // não é ataque: sem bônus de ataque preciso
      const res = check(eff.REF + skillLevel(ch.skills, "autofire") + wound);
      const parts = [...autofireParts, ...(wound ? [R.wound(wound)] : [])];
      const text = join([formula(R.formulaNames.suppressive, parts), R.suppressive(skillName("concentration"), res.total)]);
      rolls = [
        {
          label: R.labels.suppressive,
          roll: { dice: res.dice, total: res.total, crit: res.crit, text },
        },
      ];
      break;
    }
    case "shell": {
      const res = check(info.attackBase + wound, { ignoreFumble });
      const ok = res.total > SHELL_DV;
      const text = join([formula(R.formulaNames.shell, weaponParts), fumble(res), R.shellVersus(SHELL_DV, ok)]);
      rolls = [
        {
          label: R.labels.shell,
          roll: { dice: res.dice, total: res.total, crit: res.crit, ok, text },
        },
      ];
      if (ok) {
        const dmg = rollDamage(SHELL_DAMAGE);
        rolls.push({
          label: R.labels.shellDamage,
          roll: {
            dice: dmg.dice,
            total: dmg.total,
            text: join([R.shellDamage(SHELL_DAMAGE), dmg.critical && CRIT_NOTE]),
          },
        });
      }
      break;
    }
  }

  // notas do fim do 1º ataque: área, granada especial, flecha e o que sobrou no pente
  const notes: string[] = [];
  if (info.explosive) {
    notes.push(R.explosive);
    if (mag?.ammoRef?.startsWith("grenade-") && mag.ammo) notes.push(R.grenade(mag.ammo.namePt));
  }
  const rounds = info.rounds[mode];
  let gear = mag ? fire(ch.gear, itemId, rounds) : undefined;
  // flecha: a básica volta depois; a especial sai da pilha
  if (!mag && !melee && info.compatible.length) {
    const stack =
      info.compatible.find((g) => g.id === opts.arrow) ?? info.compatible.find((g) => g.ref === BASIC_ARROW) ?? info.compatible[0];
    if (stack.ref === BASIC_ARROW) notes.push(R.basicArrow);
    else {
      notes.push(R.spentArrows(rounds, itemName(stack)));
      gear = ch.gear.map((g) => (g.id === stack.id ? { ...g, qty: Math.max(0, g.qty - rounds) } : g));
    }
  }
  if (mag) notes.push(R.magazine(Math.max(0, mag.loaded - rounds), mag.size));
  rolls[0].roll.text = join([rolls[0].roll.text, ...notes]);

  return gear ? { rolls, gear } : { rolls };
}

/** Dano do tiro ou golpe comum (e do mirado, com o efeito do alvo no texto). */
export function weaponDamage(ch: Character, itemId: string, opts: { aim?: AimTarget } = {}): RollResult {
  const info = weaponInfo(ch, itemId);
  if (!info) return { dice: [], total: 0, text: t.weapons.blocked.notWeapon };
  const damage = info.stats.damage;
  const mods = combatModsOf(ch);
  const res = rollDamage(damage);
  const target = AIM_TARGETS.find((a) => a.id === opts.aim);

  const D = t.weapons.damage;
  const notes = [
    damage ? D.value(damage) : D.noFixed,
    mods.firstHitDamage && D.weakPoint(mods.firstHitDamage, res.total + mods.firstHitDamage),
    res.critical && CRIT_NOTE,
    target && D.aimed(target.label, target.effect),
    info.explosive && D.area,
  ];
  return {
    dice: res.dice,
    total: res.total,
    text: notes.filter(Boolean).join(t.common.sep),
  };
}
