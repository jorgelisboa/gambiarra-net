export const d6 = () => Math.floor(Math.random() * 6) + 1;
export const d10 = () => Math.floor(Math.random() * 10) + 1;

/**
 * Teste do RED: base + 1d10. 10 natural rola mais um d10 e soma (crítico);
 * 1 natural rola mais um d10 e subtrai (falha crítica).
 */
export function check(base: number, opts: { ignoreFumble?: boolean } = {}) {
  const first = d10();
  if (first === 10) {
    const extra = d10();
    return { dice: [first, extra], total: base + first + extra, crit: "sucesso" as const };
  }
  if (first === 1 && opts.ignoreFumble) {
    return { dice: [first], total: base + first, crit: undefined, fumbleIgnored: true };
  }
  if (first === 1) {
    const extra = d10();
    return { dice: [first, extra], total: base + first - extra, crit: "falha" as const };
  }
  return { dice: [first], total: base + first, crit: undefined };
}

export interface Dv {
  label: string;
  dv: number;
}

/** No RED é preciso passar da DV: empatar é falhar. */
export const beats = (total: number, dv: number) => total > dv;

/** "passa: 1 fã (DV8) · não passa: multidão (DV12)" */
export function vsDvs(total: number, dvs: Dv[]) {
  const fmt = (l: Dv[]) => l.map((d) => `${d.label} (DV${d.dv})`).join(", ");
  const pass = dvs.filter((d) => beats(total, d.dv));
  const fail = dvs.filter((d) => !beats(total, d.dv));
  return [pass.length > 0 && `passa: ${fmt(pass)}`, fail.length > 0 && `não passa: ${fmt(fail)}`]
    .filter(Boolean)
    .join(" · ");
}

/** Bônus direto no HP quando o dano tem dois ou mais 6 (ferimento crítico). */
export const CRITICAL_INJURY_BONUS = 5;

/** Dano "Nd6": soma dos dados. Dois ou mais 6 = ferimento crítico. */
export function rollDamage(expr: string) {
  const n = Number(/^(\d+)d6$/.exec(expr)?.[1] ?? 0);
  const dice = Array.from({ length: n }, d6);
  return {
    dice,
    total: dice.reduce((a, b) => a + b, 0),
    critical: dice.filter((d) => d === 6).length >= 2,
  };
}
