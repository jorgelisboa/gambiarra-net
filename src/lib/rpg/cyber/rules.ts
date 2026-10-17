import { uid } from "../../id";
import type { Character, CyberwareItem, GearItem, Role, Stats } from "../../types";
import { currentEmp, maxHp } from "../derived";
import { d6 } from "../dice";
import { catalogItem } from "../gear";
import { skillDef, skillLevel } from "../skills";
import type { SkillBonus } from "../types";
import { cyberDef } from "./catalog";
import { kitRefs } from "./kits";
import type { CyberwareDef, HlDice, HostKind, InstallPlace } from "./types";

/**
 * Regras do cyberware: onde cada peça encaixa, instalar e remover, humanidade e o que muda na ficha.
 * Funções puras: recebem a ficha e devolvem outra.
 */

/* ---------- lugares no corpo ---------- */

/** Lugares fixos do corpo (o resto dos hosts são ids de peças que abrem slots). */
export const BODY_HOSTS = ["body", "fashion", "internal", "external", "meatArm", "meatLeg"] as const;
export type BodyHost = (typeof BODY_HOSTS)[number];

/** Slots dos grupos sem peça de base (fashionware, interno, externo). */
export const POOL_SLOTS = 7;
/** Sensor array: slots a mais na cyberaudio suite. */
export const SENSOR_ARRAY_SLOTS = 5;

/** Um lugar onde dá pra instalar. */
export interface HostSpot {
  /** "body", "fashion"... ou o id da peça que abre os slots. */
  id: string;
  kind: HostKind;
  /** "neural link", "cybereye 2", "braço de carne", "fashionware"... */
  label: string;
  /** Total de slots (Infinity no "body"). */
  slots: number;
  /** Slots ocupados. */
  used: number;
  /** As peças que estão aqui. */
  items: CyberwareItem[];
  /** A peça que abre os slots (ausente nos lugares fixos). */
  owner?: CyberwareItem;
}

/* ---------- ajudas internas ---------- */

const isBodyHost = (h: string) => (BODY_HOSTS as readonly string[]).includes(h);

/** Slots que a peça ocupa onde está (padrão 1; capas e mão padrão 0). */
const slotsOf = (item: CyberwareItem) => cyberDef(item.ref)?.slots ?? 1;

/** Nome do catálogo em minúsculas, pras mensagens. */
const catName = (ref: string) => cyberDef(ref)?.name.toLowerCase() ?? ref;

/** Nome pras mensagens e rótulos: o apelido, ou o do catálogo em minúsculas. */
const shownName = (item: CyberwareItem) => item.name.trim() || cyberDef(item.ref)?.name.toLowerCase() || "cyberware";

/** Quantas peças instaladas têm este id no catálogo. */
const countRef = (inst: CyberwareItem[], ref: string) => inst.filter((i) => i.ref === ref).length;

/** "neural link ou cyberaudio suite", ou "2 grafted muscle and bone lace". */
const needText = (refs: string[], count = 1) => `${count > 1 ? `${count} ` : ""}${refs.map(catName).join(" ou ")}`;

/** Peças em efeito: tudo com host, menos o que perdeu o host (peça de base removida). Chip guardado (host null) não conta. */
export function installedCyber(ch: Pick<Character, "cyberware">): CyberwareItem[] {
  const byId = new Map(ch.cyberware.map((i) => [i.id, i]));
  const memo = new Map<string, boolean>();
  // sobe a cadeia de hosts até um lugar do corpo; ciclo ou host que sumiu = fora
  const rooted = (item: CyberwareItem, seen: Set<string>): boolean => {
    if (item.host === null) return false;
    if (isBodyHost(item.host)) return true;
    const known = memo.get(item.id);
    if (known !== undefined) return known;
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    const host = byId.get(item.host);
    const ok = host ? rooted(host, seen) : false;
    memo.set(item.id, ok);
    return ok;
  };
  return ch.cyberware.filter((i) => rooted(i, new Set()));
}

/** Tipos de peça de base, na ordem em que os lugares aparecem. */
const PROVIDER_ORDER: HostKind[] = ["neural", "socket", "eye", "audio", "arm", "leg"];

/** Todos os lugares do corpo, com o que tem em cada um. Ver a spec pra ordem e os rótulos. */
export function hostsOf(ch: Pick<Character, "cyberware">): HostSpot[] {
  const inst = installedCyber(ch);
  const at = (id: string) => inst.filter((i) => i.host === id);
  const sum = (items: CyberwareItem[]) => items.reduce((n, i) => n + slotsOf(i), 0);

  // corpo: peça de base e borgware, sem slot
  const spots: HostSpot[] = [{ id: "body", kind: "body", label: "corpo", slots: Infinity, used: 0, items: at("body") }];

  // peças de base: um lugar por peça que abre slots
  const owners = inst.filter((i) => cyberDef(i.ref)?.provides);
  const sensor = inst.some((i) => i.ref === "sensorArray");
  const grips = inst.filter((i) => cyberDef(i.ref)?.alsoTakes === "neural").length;
  let firstNeural = true;
  for (const kind of PROVIDER_ORDER) {
    for (const owner of owners) {
      const p = cyberDef(owner.ref)!.provides!;
      if (p.kind !== kind) continue;
      const same = owners.filter((o) => o.ref === owner.ref);
      const custom = owner.name.trim();
      const label = custom || `${shownName(owner)}${same.length > 1 ? ` ${same.indexOf(owner) + 1}` : ""}`;
      const items = at(owner.id);
      // o subdermal grip ocupa um slot do neural link: conta no primeiro
      const extra = kind === "neural" && firstNeural ? grips : 0;
      if (kind === "neural") firstNeural = false;
      spots.push({
        id: owner.id,
        kind,
        label,
        slots: p.slots + (kind === "audio" && sensor ? SENSOR_ARRAY_SLOTS : 0),
        used: sum(items) + extra,
        items,
        owner,
      });
    }
  }

  // braço e perna de carne: um por membro que não virou cyberlimb, uma peça (com slot) em cada
  const meat: [HostKind, string, HostKind][] = [
    ["meatArm", "braço de carne", "arm"],
    ["meatLeg", "perna de carne", "leg"],
  ];
  for (const [kind, label, limb] of meat) {
    const cyberLimbs = owners.filter((o) => cyberDef(o.ref)?.provides?.kind === limb).length;
    const slots = 2 - Math.min(2, cyberLimbs);
    const items = at(kind);
    if (slots > 0 || items.length > 0) {
      spots.push({ id: kind, kind, label, slots, used: items.filter((i) => slotsOf(i) > 0).length, items });
    }
  }

  // grupos sem peça de base
  const pools: [HostKind, string][] = [
    ["fashion", "fashionware"],
    ["internal", "corpo · interno"],
    ["external", "corpo · externo"],
  ];
  for (const [kind, label] of pools) {
    const items = at(kind);
    spots.push({ id: kind, kind, label, slots: POOL_SLOTS, used: sum(items), items });
  }
  return spots;
}

/** Nome na ficha: o apelido, ou o do catálogo. */
export function cyberName(item: CyberwareItem): string {
  return item.name.trim() || cyberDef(item.ref)?.name || "cyberware";
}

/* ---------- preço e humanidade perdida ---------- */

/** Custo de só instalar uma peça que você já tem (cyberware achado, pág. 226). */
export const INSTALL_COST: Record<InstallPlace, number> = { mall: 100, clinic: 500, hospital: 1000 };

export const INSTALL_LABELS: Record<InstallPlace, string> = { mall: "shopping", clinic: "clínica", hospital: "hospital" };

/** Preço de compra (instalação incluída). Skill chip de perícia x2: 1.000eb. */
export function cyberPrice(def: CyberwareDef, opts: { skill?: string } = {}): number {
  if (def.id === "skillChip" && opts.skill && skillDef(opts.skill)?.x2) return 1000;
  return def.cost;
}

/** Acima de Premium (100eb) o livro só vende com Fixer ou num Night Market (pág. 385). */
export const needsFixer = (cost: number) => cost > 100;

/** "7 (2d6)", "2 (1d6/2)" ou "0". */
export function hlText(def: CyberwareDef): string {
  return def.hlDice === "0" ? "0" : `${def.hl} (${def.hlDice})`;
}

/** Rola a perda de humanidade: "1d6/2" é metade de 1d6 arredondada pra cima; "0" dá 0. */
export function rollHl(dice: HlDice): number {
  switch (dice) {
    case "0":
      return 0;
    case "1d6/2":
      return Math.ceil(d6() / 2);
    case "1d6":
      return d6();
    case "2d6":
      return d6() + d6();
    case "4d6":
      return d6() + d6() + d6() + d6();
  }
}

/* ---------- pode instalar? ---------- */

export interface InstallCheck {
  ok: boolean;
  /** Motivo em pt-BR quando não pode. */
  reason?: string;
  /** Hosts válidos, na ordem de preferência. Peça em par: pelo menos 2. */
  hosts: string[];
}

/** Checa pré-requisitos, limites e slots livres. Ver a spec. */
export function canInstall(ch: Character, ref: string): InstallCheck {
  const fail = (reason: string): InstallCheck => ({ ok: false, reason, hosts: [] });
  const def = cyberDef(ref);
  if (!def) return fail("peça desconhecida");
  const inst = installedCyber(ch);

  // pré-requisito: peças instaladas de uma lista
  if (def.requires) {
    const need = def.requiresCount ?? 1;
    const have = inst.filter((i) => def.requires!.includes(i.ref)).length;
    if (have < need) return fail(`precisa de ${needText(def.requires, need)}`);
  }

  if (def.minBody !== undefined && cyberStats(ch).BODY < def.minBody) return fail(`precisa de BODY ${def.minBody}`);

  // uma por grupo (speedware, neural link, linear frame, borgware)
  if (def.unique) {
    const other = inst.find((i) => cyberDef(i.ref)?.unique === def.unique);
    if (other) return fail(def.unique === "speedware" ? "só um speedware por vez" : `já tem ${shownName(other)}`);
  }

  // limite de cópias; o mount libera mais
  if (def.max) {
    const limit = def.max.base + (def.max.plus && countRef(inst, def.max.plus.ref) > 0 ? def.max.plus.add : 0);
    if (countRef(inst, ref) >= limit) return fail(`no máximo ${limit}`);
  }

  const spots = hostsOf(ch);

  // também ocupa um slot de outro lugar (subdermal grip no neural link)
  if (def.alsoTakes && !spots.some((s) => s.kind === def.alsoTakes && s.slots - s.used >= 1)) {
    return fail("sem slot livre no neural link");
  }

  // onde cabe, na ordem de preferência
  const hosts: string[] = [];
  for (const kind of def.fits) {
    if (kind === "body") {
      hosts.push("body");
      continue;
    }
    for (const s of spots) {
      if (s.kind !== kind) continue;
      // mão e pé padrão (0 slots) só precisam de um braço ou perna de carne
      const meat = kind === "meatArm" || kind === "meatLeg";
      const fits = meat && slotsNeeded(def) === 0 ? s.slots > 0 : s.slots - s.used >= slotsNeeded(def);
      if (fits) hosts.push(s.id);
    }
  }

  if (def.paired) {
    if (hosts.length < 2) return fail(`vai em par: precisa de 2 ${def.fits[0] === "leg" ? "cyberlegs" : "cybereyes"} com slot livre`);
  } else if (hosts.length === 0) {
    return fail(noHostReason(def, spots));
  }
  return { ok: true, hosts };
}

const slotsNeeded = (def: CyberwareDef) => def.slots ?? 1;

/** Por que não achou lugar, pelo primeiro tipo de lugar da peça. */
function noHostReason(def: CyberwareDef, spots: HostSpot[]): string {
  const kind = def.fits[0];
  const has = (k: HostKind) => spots.some((s) => s.kind === k);
  switch (kind) {
    case "neural":
      return has("neural") ? "sem slot livre no neural link" : "precisa de neural link";
    case "socket":
      return "precisa de um chipware socket livre";
    case "eye":
      return has("eye") ? "sem slot livre nos cybereyes" : "precisa de cybereye";
    case "audio":
      return has("audio") ? "sem slot livre na cyberaudio suite" : "precisa de cyberaudio suite";
    case "arm":
      if (def.fits.includes("meatArm")) return "sem braço livre (cyberarm ou braço de carne)";
      return has("arm") ? "sem slot livre nos cyberarms" : "precisa de cyberarm";
    case "leg":
      if (def.fits.includes("meatLeg")) return "sem perna livre (cyberleg ou perna de carne)";
      return has("leg") ? "sem slot livre nos cyberlegs" : "precisa de cyberleg";
    case "meatArm":
      return "sem braço de carne livre";
    case "meatLeg":
      return "sem perna de carne livre";
    default: {
      const label = spots.find((s) => s.kind === kind)?.label ?? kind;
      return `os ${POOL_SLOTS} slots de ${label} estão cheios`;
    }
  }
}

/** Problemas na ficha atual (peça em par sem o par, braço de carne com peça demais...). Avisos em pt-BR. */
export function cyberIssues(ch: Character): string[] {
  const out: string[] = [];
  const inst = installedCyber(ch);
  const refs = [...new Set(inst.map((i) => i.ref))];

  // peça em par com número ímpar
  for (const ref of refs) {
    const def = cyberDef(ref);
    if (def?.paired && countRef(inst, ref) % 2 === 1) {
      out.push(`${catName(ref)} precisa do par (${def.fits[0] === "leg" ? "uma em cada perna" : "um em cada olho"})`);
    }
  }

  // duas peças do mesmo grupo único
  const groups = new Map<string, CyberwareItem[]>();
  for (const i of inst) {
    const u = cyberDef(i.ref)?.unique;
    if (u) groups.set(u, [...(groups.get(u) ?? []), i]);
  }
  for (const [group, items] of groups) {
    if (items.length > 1) out.push(group === "speedware" ? "só um speedware por vez" : `${catName(items[0].ref)} duas vezes`);
  }

  // lugar com slot a mais
  for (const s of hostsOf(ch)) {
    if (s.used <= s.slots) continue;
    if (s.kind === "meatArm") out.push("peça demais nos braços de carne: cada um leva uma");
    else if (s.kind === "meatLeg") out.push("peça demais nas pernas de carne: cada uma leva uma");
    else out.push(`${s.label} com ${s.used} de ${s.slots} slots`);
  }

  // host que não está instalado
  const live = new Set(inst.map((i) => i.id));
  for (const i of ch.cyberware) {
    if (i.host !== null && !live.has(i.id)) out.push(`${shownName(i)} perdeu onde estava instalado`);
  }

  // pré-requisito que sumiu
  for (const i of inst) {
    const def = cyberDef(i.ref);
    if (!def?.requires) continue;
    const need = def.requiresCount ?? 1;
    if (inst.filter((o) => def.requires!.includes(o.ref)).length < need) {
      out.push(`${shownName(i)} precisa de ${needText(def.requires, need)}`);
    }
  }
  return out;
}

/* ---------- instalar e remover ---------- */

export interface InstallOptions {
  /** Onde: um host (ou dois, pra peça em par). Padrão: os primeiros de `canInstall`. */
  hosts?: string[];
  /** Humanidade perdida de cada peça criada (uma por host). Padrão: a fixa do catálogo. */
  hl?: number[];
  /** Eurobucks descontados da ficha (a loja calcula). Padrão 0. */
  pay?: number;
  /** Skill chip: id da perícia. */
  skill?: string;
  /** Popup melee/ranged: a arma escolhida no catálogo, ou uma arma do inventário (gear id). */
  weapon?: { ref: string } | { gearId: string };
  name?: string;
}

/** Instala e devolve a ficha nova. Se `canInstall` disser que não pode, devolve a ficha igual. Ver a spec. */
export function installCyberware(ch: Character, ref: string, opts: InstallOptions = {}): Character {
  const check = canInstall(ch, ref);
  const def = cyberDef(ref);
  if (!check.ok || !def) return ch;

  // peça em par vai em dois lugares diferentes
  const n = def.paired ? 2 : 1;
  const asked = opts.hosts;
  const askedOk =
    asked !== undefined &&
    asked.length === n &&
    asked.every((h) => check.hosts.includes(h)) &&
    (!def.paired || new Set(asked).size === n);
  const hosts = askedOk ? asked : check.hosts.slice(0, n);
  if (hosts.length < n) return ch;

  const created: CyberwareItem[] = hosts.map((host, i) => ({
    id: uid(),
    ref,
    host,
    hl: opts.hl?.[i] ?? def.hl,
    name: opts.name ?? "",
    note: "",
    ...(def.id === "skillChip" && opts.skill ? { skill: opts.skill } : {}),
  }));

  const next: Character = {
    ...ch,
    cyberware: [...ch.cyberware, ...created],
    gear: implantGear(ch.gear, def, created[0], opts.weapon),
    humanity: ch.humanity - created.reduce((n2, c) => n2 + c.hl, 0),
    money: ch.money - (opts.pay ?? 0),
  };
  return growHp(ch, next);
}

const MELEE_POPUPS = ["lightMelee", "mediumMelee", "heavyMelee"];

/** Itens que a peça põe no inventário (só pra primeira peça criada), todos com `implant`. */
function implantGear(gear: GearItem[], def: CyberwareDef, item: CyberwareItem, weapon: InstallOptions["weapon"]): GearItem[] {
  const fx = def.effects;
  if (!fx) return gear;
  const implant = item.id;
  let out = gear;

  if (fx.weapon === "popupMelee") {
    const picked = weapon && "ref" in weapon ? weapon.ref : "";
    const ref = MELEE_POPUPS.includes(picked) ? picked : "mediumMelee";
    out = [...out, { id: uid(), ref, name: def.name, qty: 1, implant }];
  } else if (fx.weapon === "popupRanged") {
    if (weapon && "gearId" in weapon) {
      // arma que já está no inventário passa a ser do implante (se ainda não é de outro)
      const g = out.find((x) => x.id === weapon.gearId);
      if (g && !g.implant && catalogItem(g.ref)?.kind === "weapon") {
        out = out.map((x) => (x.id === g.id ? { ...x, implant } : x));
      }
    } else if (weapon && "ref" in weapon && catalogItem(weapon.ref)?.kind === "weapon") {
      out = [...out, { id: uid(), ref: weapon.ref, name: "", qty: 1, implant }];
    }
  } else if (fx.weapon) {
    out = [...out, { id: uid(), ref: fx.weapon, name: def.name, qty: 1, implant }];
  }

  // armadura implantada: vestida na cabeça e no corpo
  if (fx.armor) {
    const a = catalogItem(fx.armor);
    if (a?.kind === "armor") {
      for (const slot of ["head", "body"] as const) {
        out = [...out, { id: uid(), ref: fx.armor, name: "", qty: 1, slot, current: a.sp, equipped: true, implant }];
      }
    }
  }

  // escudo dobrado no braço: no inventário, guardado
  if (fx.shield) {
    const s = catalogItem("bulletproofShield");
    out = [...out, { id: uid(), ref: "bulletproofShield", name: def.name, qty: 1, current: s?.kind === "shield" ? s.hp : 10, equipped: false, implant }];
  }
  return out;
}

/** Se o BODY do cyberware subiu o HP máximo, o HP atual sobe junto. */
function growHp(before: Character, after: Character): Character {
  const gain = maxHp(cyberStats(after)) - maxHp(cyberStats(before));
  return gain > 0 ? { ...after, hp: after.hp + gain } : after;
}

/** Remove a peça e o que está nela. A humanidade perdida não volta. Ver a spec. */
export function removeCyberware(ch: Character, id: string): Character {
  if (!ch.cyberware.some((i) => i.id === id)) return ch;

  // desce pelos hosts: o que está na peça sai junto, menos os chips (voltam pra mochila, host null)
  const gone = new Set([id]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const i of ch.cyberware) {
      if (gone.has(i.id) || i.host === null || !gone.has(i.host)) continue;
      if (cyberDef(i.ref)?.category === "chipware") continue;
      gone.add(i.id);
      grew = true;
    }
  }
  const refOf = new Map(ch.cyberware.map((i) => [i.id, i.ref]));

  const cyberware = ch.cyberware
    .filter((i) => !gone.has(i.id))
    .map((i) => (i.host !== null && gone.has(i.host) ? { ...i, host: null } : i));

  // itens do implante somem junto; a arma de fogo do popup ranged volta pro inventário
  const gear = ch.gear.flatMap((g) => {
    if (!g.implant || !gone.has(g.implant)) return [g];
    if (refOf.get(g.implant) !== "popupRanged") return [];
    const back = { ...g };
    delete back.implant;
    return [back];
  });

  const next: Character = { ...ch, cyberware, gear };
  return { ...next, hp: Math.min(next.hp, maxHp(cyberStats(next))) };
}

/** Põe um chip num soquete (id) ou guarda (null). Não perde humanidade de novo. */
export function moveChip(ch: Character, chipId: string, socketId: string | null): Character {
  const chip = ch.cyberware.find((i) => i.id === chipId);
  if (!chip || cyberDef(chip.ref)?.category !== "chipware") return ch;
  if (chip.host === socketId) return ch;
  if (socketId !== null) {
    const socket = installedCyber(ch).find((i) => i.id === socketId);
    if (!socket || cyberDef(socket.ref)?.provides?.kind !== "socket") return ch;
    if (ch.cyberware.some((i) => i.id !== chipId && i.host === socketId)) return ch;
  }
  return { ...ch, cyberware: ch.cyberware.map((i) => (i.id === chipId ? { ...i, host: socketId } : i)) };
}

function patchItem(ch: Character, id: string, patch: Partial<CyberwareItem>): Character {
  if (!ch.cyberware.some((i) => i.id === id)) return ch;
  return { ...ch, cyberware: ch.cyberware.map((i) => (i.id === id ? { ...i, ...patch } : i)) };
}

/** Liga ou desliga (Sandevistan). */
export function setCyberActive(ch: Character, id: string, active: boolean): Character {
  return patchItem(ch, id, { active });
}

/** Muda nome e nota. */
export function patchCyber(ch: Character, id: string, patch: Partial<Pick<CyberwareItem, "name" | "note">>): Character {
  const only: Partial<CyberwareItem> = {};
  if (patch.name !== undefined) only.name = patch.name;
  if (patch.note !== undefined) only.note = patch.note;
  return patchItem(ch, id, only);
}

/** Cyberware inicial do role (com as escolhas), com a perda de humanidade fixa da criação. */
export function installKit(ch: Character, role: Role, picks: Record<string, number>): Character {
  let out = ch;
  for (const ref of kitRefs(role, picks)) {
    const def = cyberDef(ref);
    out = installCyberware(out, ref, def ? { hl: [def.hl] } : {});
  }
  return out;
}

/* ---------- humanidade ---------- */

/** Teto da humanidade com o cyberware: EMP × 10, −2 por peça com perda de humanidade, −4 por borgware. Terapia não passa disso. */
export function humanityCap(ch: Character): number {
  const lost = installedCyber(ch).reduce((n, i) => {
    const def = cyberDef(i.ref);
    return n + (def && def.hl > 0 ? (def.category === "borgware" ? 4 : 2) : 0);
  }, 0);
  return Math.max(0, ch.stats.EMP * 10 - lost);
}

export interface Cyberpsychosis {
  /** 0 nada, 1 limite, 2 dissociação, 3 ciberpsicose, 4 extrema (o mestre assume o personagem). */
  level: 0 | 1 | 2 | 3 | 4;
  label: string;
  text: string;
}

/** Pela EMP em uso e pela humanidade (pág. 232). */
export function cyberpsychosis(ch: Character): Cyberpsychosis {
  const emp = currentEmp(ch.stats, ch.humanity);
  if (ch.humanity < 0) {
    return {
      level: 4,
      label: "ciberpsicose extrema",
      text: "o mestre assume o personagem e joga com os piores impulsos dele. volta pro jogador quando a humanidade ficar positiva.",
    };
  }
  if (emp <= 0) {
    return { level: 3, label: "ciberpsicose", text: "mostra forte pelo menos 5 traços da lista de psicopatia de Hare. interprete de acordo." };
  }
  if (emp === 1) {
    return {
      level: 2,
      label: "dissociação",
      text: "transtorno dissociativo beirando a ciberpsicose: mostra forte pelo menos 3 traços da lista de Hare.",
    };
  }
  if (emp === 2) return { level: 1, label: "limite", text: "beirando o transtorno dissociativo. interprete de acordo." };
  return { level: 0, label: "estável", text: "sem ciberpsicose nem dissociação." };
}

export interface TherapyDef {
  id: "standard" | "extreme";
  name: string;
  dice: "2d6" | "4d6";
  /** Preço numa clínica. */
  cost: number;
  /** Materiais, se um Medtech da mesa faz (Medical Tech). */
  materials: number;
  /** Medical Tech do Medtech. */
  dv: number;
}

/** Terapia de perda de humanidade (pág. 230): uma semana inteira. */
export const THERAPIES: TherapyDef[] = [
  { id: "standard", name: "terapia padrão", dice: "2d6", cost: 500, materials: 100, dv: 15 },
  { id: "extreme", name: "terapia extrema", dice: "4d6", cost: 1000, materials: 500, dv: 17 },
];

/** Recupera humanidade até o teto e desconta o que pagou. */
export function applyTherapy(ch: Character, gain: number, pay = 0): Character {
  const cap = humanityCap(ch);
  const humanity = ch.humanity >= cap ? ch.humanity : Math.min(cap, ch.humanity + gain);
  return { ...ch, humanity, money: ch.money - pay };
}

/* ---------- o que muda na ficha ---------- */

/** Stats com o BODY do cyberware (grafted muscle, linear frames). Base do HP, do death save e dos testes. */
export function cyberStats(ch: Character): Stats {
  let BODY = ch.stats.BODY;
  const seen = new Set<string>();
  for (const i of installedCyber(ch)) {
    if (seen.has(i.ref)) continue;
    seen.add(i.ref);
    const b = cyberDef(i.ref)?.effects?.body;
    if (!b) continue;
    // `add` sobe do BODY da ficha até o teto; `set` só vale se for maior que o atual
    if (b.add !== undefined) BODY = Math.max(BODY, Math.min(b.max, ch.stats.BODY + b.add));
    if (b.set !== undefined) BODY = Math.max(BODY, b.set);
  }
  return { ...ch.stats, BODY };
}

/** Bônus de iniciativa: Kerenzikov sempre, Sandevistan ligado. */
export function cyberInitiative(ch: Character): number {
  const inst = installedCyber(ch);
  let total = 0;
  for (const ref of new Set(inst.map((i) => i.ref))) {
    const fx = cyberDef(ref)?.effects;
    if (!fx) continue;
    total += fx.initiative ?? 0;
    if (fx.activeInitiative && inst.some((i) => i.ref === ref && i.active)) total += fx.activeInitiative;
  }
  return total;
}

/** Bônus em perícias do cyberware (os com `when` só aparecem, não somam sozinhos). Ver a spec. */
export function cyberSkillBonuses(ch: Character): SkillBonus[] {
  const inst = installedCyber(ch);
  const out: SkillBonus[] = [];

  // cópias da mesma peça não somam; peça em par só vale com o par
  for (const ref of new Set(inst.map((i) => i.ref))) {
    const def = cyberDef(ref);
    if (!def?.effects?.skills) continue;
    if (def.paired && countRef(inst, ref) < 2) continue;
    for (const e of def.effects.skills) {
      out.push({ skill: e.skill, value: e.value, source: def.name.toLowerCase(), ...(e.when ? { when: e.when } : {}) });
    }
  }

  if (countRef(inst, "chemskin") > 0 && countRef(inst, "techhair") > 0) {
    out.push({ skill: "personalGrooming", value: 2, source: "chemskin + techhair" });
  }
  if (countRef(inst, "lightTattoo") >= 3) out.push({ skill: "wardrobeStyle", value: 2, source: "light tattoo ×3" });

  // skill chip: a perícia conta como 3 se a da ficha for menor
  const chipped = new Set<string>();
  for (const i of inst) {
    if (i.ref !== "skillChip" || !i.skill || chipped.has(i.skill)) continue;
    chipped.add(i.skill);
    const level = skillLevel(ch.skills, i.skill);
    if (level < 3) out.push({ skill: i.skill, value: 3 - level, source: "skill chip" });
  }
  return out;
}

/** Pain Editor num soquete. */
export function ignoresSerious(ch: Character): boolean {
  return installedCyber(ch).some((i) => cyberDef(i.ref)?.effects?.ignoreSerious);
}

/** O que o cyberware resolve pro netrun. */
export function netrunCyber(ch: Pick<Character, "cyberware">): { neuralLink: boolean; plugs: boolean; virtuality: boolean } {
  const inst = installedCyber(ch);
  const count = (k: "neuralLink" | "plugs" | "virtuality") => inst.filter((i) => cyberDef(i.ref)?.effects?.netrun === k).length;
  return { neuralLink: count("neuralLink") > 0, plugs: count("plugs") > 0, virtuality: count("virtuality") >= 2 };
}
