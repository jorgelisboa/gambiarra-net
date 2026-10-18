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

export const FIRE_MODE_LABELS: Record<FireMode, { ranged: string; melee: string }> = {
  single: { ranged: "tiro", melee: "golpe" },
  double: { ranged: "2 tiros", melee: "2 golpes" },
  aimed: { ranged: "mirado", melee: "mirado" },
  autofire: { ranged: "rajada", melee: "rajada" },
  suppressive: { ranged: "supressão", melee: "supressão" },
  shell: { ranged: "cartucho", melee: "cartucho" },
};

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

const DODGE_NOTE = "se o alvo tiver REF 8+, ele pode esquivar (DEX + Evasion + 1d10) no lugar da DV";
const FUMBLE_NOTE = "falha crítica ignorada (recuperar falha)";
const EXPLOSIVE_NOTE =
  "explosivo: área de 10×10m em volta do alvo, dano rolado uma vez pra todos; se errar, o mestre decide onde caiu. quem tem REF 8+ pode esquivar.";
const CRIT_NOTE = `ferimento crítico! +${CRITICAL_INJURY_BONUS} direto no HP`;

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
    blocked: stats.requiresBody && stats.requiresBody > eff.BODY ? `precisa de BODY ${stats.requiresBody}+ pra disparar` : undefined,
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
  if (info.blocked) return info.blocked;
  if (!info.modes.includes(mode)) {
    return mode === "shell" ? "carregue cartucho de escopeta pra esse modo" : "essa arma não tem esse modo";
  }
  if (!info.mag && !info.melee && info.stats.ammo && info.compatible.length === 0) return "sem flecha no bolso";
  if (info.mag && info.mag.loaded < info.rounds[mode]) {
    if (mode === "autofire" || mode === "suppressive") return `precisa de ${info.rounds[mode]} balas no pente`;
    return mode === "double" ? "precisa de 2 balas no pente" : "sem bala";
  }
  return null;
}

/** Motivo de não poder usar o modo agora (bala, BODY, modo que a arma não tem); null se pode. */
export function modeBlocked(ch: Character, itemId: string, mode: FireMode): string | null {
  const info = weaponInfo(ch, itemId);
  return info ? blockReason(info, mode) : "não é arma";
}

/** Ataca no modo, gasta a munição e devolve as rolagens. Ver a spec. */
export function attack(ch: Character, itemId: string, mode: FireMode, opts: AttackOptions = {}): AttackResult {
  const info = weaponInfo(ch, itemId);
  if (!info) return { rolls: [], blocked: "não é arma" };
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
  const tail = [mods.attack ? `ataque preciso ${mods.attack}` : "", wound ? `ferimento ${wound}` : ""].filter(Boolean);
  const weaponParts = [...(sd ? [`${sd.name} ${skillLevel(ch.skills, sd.id)}`, `${sd.stat.toLowerCase()} ${eff[sd.stat]}`] : []), ...tail];
  const autofireParts = [`Autofire ${skillLevel(ch.skills, "autofire")}`, `ref ${eff.REF}`];
  const formula = (name: string, parts: string[]) => `${name}: ${parts.join(" + ")} + 1d10`;
  const fumble = (res: Check) => "fumbleIgnored" in res && FUMBLE_NOTE;
  const join = (notes: (string | false | undefined)[]) => notes.filter(Boolean).join(" · ");

  // tiro, golpe e mirado: com distância e arma de fogo, a DV decide o acerto
  const versus = (total: number): { ok?: boolean; notes: string[] } => {
    if (melee) return { notes: ["o alvo se defende com DEX + Evasion + 1d10"] };
    const dv = range === undefined ? undefined : info.singleDvs?.[range];
    if (dv === undefined || range === undefined) return { notes: [] };
    const band = RANGE_BANDS[range];
    if (dv === null) return { ok: false, notes: [`fora do alcance (${band})`] };
    const ok = total > dv;
    return {
      ok,
      notes: [`contra DV${dv} (${band}): ${ok ? "acertou" : "errou"}`, ...(info.explosive ? [] : [DODGE_NOTE])],
    };
  };

  const strike = (label: string, penalty: number, notes: string[] = []): LabeledRoll => {
    const res = check(info.attackBase + wound + penalty, { ignoreFumble });
    const v = versus(res.total);
    const text = join([formula("ataque", weaponParts), fumble(res), ...notes, ...v.notes]);
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
      rolls = [strike("ataque", 0)];
      break;
    case "double":
      rolls = [strike("1º ataque", 0, ["rof 2: dá pra dividir os dois ataques no movimento"]), strike("2º ataque", 0)];
      break;
    case "aimed": {
      const target = AIM_TARGETS.find((t) => t.id === (opts.aim ?? "head")) ?? AIM_TARGETS[0];
      const note = `mirado (${target.label}) −${Math.abs(AIMED_PENALTY)}: ${target.effect}`;
      rolls = [strike(melee ? "golpe mirado" : "tiro mirado", AIMED_PENALTY, [note])];
      break;
    }
    case "autofire": {
      const af = stats.autofire;
      const dvs = info.autofireDvs;
      const band = range ?? 0;
      if (!af || !dvs) return { rolls: [], blocked: "essa arma não tem esse modo" };
      if (!Number.isInteger(band) || band < 0 || band > 4) return { rolls: [], blocked: "rajada só até 100m" };
      const dv = dvs[band];
      const res = check(eff.REF + skillLevel(ch.skills, "autofire") + mods.attack + wound, { ignoreFumble });
      const head = [formula("rajada", [...autofireParts, ...tail]), fumble(res)];
      const dodge = "quem tem REF 8+ pode tentar esquivar";
      if (res.total <= dv) {
        const text = join([...head, `errou: precisava passar de ${dv} (${RANGE_BANDS[band]})`, dodge]);
        rolls = [
          {
            label: "rajada",
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
      const text = join([...head, `contra DV${dv} (${RANGE_BANDS[band]}): acertou por ${by}`, dodge]);
      rolls = [
        {
          label: "rajada",
          roll: {
            dice: res.dice,
            total: res.total,
            crit: res.crit,
            ok: true,
            text,
          },
        },
        {
          label: "dano da rajada",
          roll: {
            dice: dmg.dice,
            total: dmg.total,
            text: `2d6 × ${times} (passou por ${by}, máximo ×${af.max})${dmg.critical ? ` · ${CRIT_NOTE}` : ""}`,
          },
        },
      ];
      break;
    }
    case "suppressive": {
      // não é ataque: sem bônus de ataque preciso
      const res = check(eff.REF + skillLevel(ch.skills, "autofire") + wound);
      const parts = [...autofireParts, ...(wound ? [`ferimento ${wound}`] : [])];
      const text = join([
        formula("supressão", parts),
        `todo mundo a pé a até 25m, fora de cobertura e na tua linha de visão rola WILL + Concentration + 1d10 contra ${res.total}. quem não passar gasta o próximo movimento pra se proteger (e corre, se precisar).`,
      ]);
      rolls = [
        {
          label: "fogo de supressão",
          roll: { dice: res.dice, total: res.total, crit: res.crit, text },
        },
      ];
      break;
    }
    case "shell": {
      const res = check(info.attackBase + wound, { ignoreFumble });
      const ok = res.total > SHELL_DV;
      const text = join([formula("cartucho", weaponParts), fumble(res), `contra DV${SHELL_DV}: ${ok ? "acertou" : "errou"}`]);
      rolls = [
        {
          label: "cartucho",
          roll: { dice: res.dice, total: res.total, crit: res.crit, ok, text },
        },
      ];
      if (ok) {
        const dmg = rollDamage(SHELL_DAMAGE);
        rolls.push({
          label: "dano do cartucho",
          roll: {
            dice: dmg.dice,
            total: dmg.total,
            text: `${SHELL_DAMAGE} em todo alvo à frente a até 6m que você vê, rolado uma vez. a armadura reduz. quem tem REF 8+ pode esquivar.${dmg.critical ? ` · ${CRIT_NOTE}` : ""}`,
          },
        });
      }
      break;
    }
  }

  // notas do fim do 1º ataque: área, granada especial, flecha e o que sobrou no pente
  const notes: string[] = [];
  if (info.explosive) {
    notes.push(EXPLOSIVE_NOTE);
    if (mag?.ammoRef?.startsWith("grenade-") && mag.ammo) notes.push(`granada: ${mag.ammo.namePt} (efeito na pág. 344)`);
  }
  const rounds = info.rounds[mode];
  let gear = mag ? fire(ch.gear, itemId, rounds) : undefined;
  // flecha: a básica volta depois; a especial sai da pilha
  if (!mag && !melee && info.compatible.length) {
    const stack =
      info.compatible.find((g) => g.id === opts.arrow) ?? info.compatible.find((g) => g.ref === BASIC_ARROW) ?? info.compatible[0];
    if (stack.ref === BASIC_ARROW) notes.push("flecha básica dá pra recolher depois");
    else {
      notes.push(`gastou ${rounds} ${itemName(stack)}`);
      gear = ch.gear.map((g) => (g.id === stack.id ? { ...g, qty: Math.max(0, g.qty - rounds) } : g));
    }
  }
  if (mag) notes.push(`pente ${Math.max(0, mag.loaded - rounds)}/${mag.size}`);
  rolls[0].roll.text = join([rolls[0].roll.text, ...notes]);

  return gear ? { rolls, gear } : { rolls };
}

/** Dano do tiro ou golpe comum (e do mirado, com o efeito do alvo no texto). */
export function weaponDamage(ch: Character, itemId: string, opts: { aim?: AimTarget } = {}): RollResult {
  const info = weaponInfo(ch, itemId);
  if (!info) return { dice: [], total: 0, text: "não é arma" };
  const damage = info.stats.damage;
  const mods = combatModsOf(ch);
  const res = rollDamage(damage);
  const target = AIM_TARGETS.find((t) => t.id === opts.aim);

  const notes = [
    damage ? `dano ${damage}` : "sem dano fixo: veja a regra da arma",
    mods.firstHitDamage && `se for o 1º acerto do round: +${mods.firstHitDamage} ponto fraco = ${res.total + mods.firstHitDamage}`,
    res.critical && CRIT_NOTE,
    target?.id === "head" && "mirado na cabeça: o que passar da armadura da cabeça dobra",
    target && target.id !== "head" && `mirado (${target.label}): ${target.effect}`,
    info.explosive && "rolado uma vez pra todos na área",
  ];
  return {
    dice: res.dice,
    total: res.total,
    text: notes.filter(Boolean).join(" · "),
  };
}
