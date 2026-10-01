export const d6 = () => Math.floor(Math.random() * 6) + 1;
export const d10 = () => Math.floor(Math.random() * 10) + 1;

/**
 * Teste do RED: base + 1d10. 10 natural rola mais um d10 e soma (crítico);
 * 1 natural rola mais um d10 e subtrai (falha crítica).
 */
export function check(base: number) {
  const first = d10();
  if (first === 10) {
    const extra = d10();
    return { dice: [first, extra], total: base + first + extra, crit: "sucesso" as const };
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

/** Select de perícia 0–10 para usos que somam uma perícia que a ficha ainda não tem. */
export const skillMods = (skill: string) =>
  Array.from({ length: 11 }, (_, n) => ({ label: `${skill} ${n}`, value: n }));
