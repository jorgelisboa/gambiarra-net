import { t } from "../../i18n";
import type { ArmorSlot, GearItem } from "../types";
import { CRITICAL_INJURY_BONUS } from "./dice";
import { catalogItem } from "./gear";

/** Um golpe que acertou, do jeito que o mestre anota. */
export interface Hit {
  /** Dano rolado pelo atacante. */
  damage: number;
  /** Corpo, a não ser que o atacante tenha mirado na cabeça (tiro mirado). */
  location: ArmorSlot;
  /** Veneno, fogo e afins passam direto pela armadura. */
  bypassArmor: boolean;
  /** Dois ou mais 6 nos dados de dano. */
  critical: boolean;
  /** Veio de ataque corpo a corpo ou à distância (importa pro mortalmente ferido). */
  attack: boolean;
  /** Tiro mirado na mão ou na perna (bate na armadura do corpo). */
  aim?: "hand" | "leg";
}

export interface HitResult {
  /** SP que segurou o golpe. */
  sp: number;
  /** O que passou da armadura (já dobrado na cabeça). */
  through: number;
  /** Tiro mirado na cabeça: o que passa da armadura dobra. */
  doubled: boolean;
  critical: boolean;
  /** Ferimento crítico por levar dano de ataque já mortalmente ferido. */
  mortalHit: boolean;
  /** Efeito do tiro mirado na mão ou na perna, se passou dano da armadura. */
  aimEffect?: string;
  bonus: number;
  /** Tirado pelo desvio de dano do Solo (1º dano do round). */
  deflected: number;
  /** Total que sai do HP. */
  hpLoss: number;
  /** A armadura do local perde 1 de SP. */
  ablate: boolean;
}

/**
 * Levar dano (regra do livro):
 * 1. o atacante rola o dano;
 * 2. tira o SP do local (corpo, ou cabeça num tiro mirado) e o resto sai do HP;
 * 3. se levou qualquer dano, a armadura do local perde 1 de SP até ser consertada.
 * Ferimento crítico soma +5 direto no HP. Mortalmente ferido que leva dano de ataque
 * sofre ferimento crítico e ganha +1 na penalidade de death save. O desvio de dano do
 * Solo tira do 1º dano que ele leva no round. Tiro mirado: cabeça dobra o que passa;
 * mão faz largar um item e perna quebra a perna (ferimento crítico), se passar 1 ponto.
 */
export function resolveHit(
  hit: Hit,
  target: { hp: number; sp: Record<ArmorSlot, number>; deflection?: number },
): HitResult {
  const location = hit.aim ? "body" : hit.location;
  const sp = hit.bypassArmor ? 0 : Math.max(0, target.sp[location]);
  const doubled = location === "head";
  const through = Math.max(0, hit.damage - sp) * (doubled ? 2 : 1);
  const mortalHit = target.hp < 1 && hit.attack && through > 0;
  const brokenLeg = hit.aim === "leg" && through > 0;
  const aimEffect =
    through > 0 && hit.aim === "hand" ? t.combat.hit.aim.hand : brokenLeg ? t.combat.hit.aim.leg : undefined;
  const critical = hit.critical || mortalHit || brokenLeg;
  const bonus = critical ? CRITICAL_INJURY_BONUS : 0;
  const taken = through + bonus;
  const deflected = taken > 0 ? Math.min(target.deflection ?? 0, taken) : 0;
  const hpLoss = taken - deflected;
  return { sp, through, doubled, critical, mortalHit, aimEffect, bonus, deflected, hpLoss, ablate: sp > 0 && hpLoss > 0 };
}

/** Ablação: toda armadura vestida no local perde 1 de SP (mínimo 0). */
export const ablateArmor = (gear: GearItem[], slot: ArmorSlot): GearItem[] =>
  gear.map((g) => {
    const def = catalogItem(g.ref);
    if (!g.equipped || g.slot !== slot || def?.kind !== "armor") return g;
    return { ...g, current: Math.max(0, (g.current ?? def.sp) - 1) };
  });

/** "15 − SP11 = 4 · ×2 cabeça = 8 · +5 crítico → 13 no HP". */
export function describeHit(hit: Hit, r: HitResult): string {
  const d = t.combat.hit.describe;
  const base = Math.max(0, hit.damage - r.sp);
  const parts = [hit.bypassArmor ? d.ignoresArmor(hit.damage) : d.minusSp(hit.damage, r.sp, base)];
  if (r.doubled && base > 0) parts.push(d.headDoubled(r.through));
  if (r.critical) parts.push(d.critical(r.bonus, r.mortalHit));
  if (r.deflected) parts.push(d.deflected(r.deflected));
  return d.total(parts.join(t.common.sep), r.hpLoss);
}
