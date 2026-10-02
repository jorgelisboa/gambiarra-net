import type { AmmoType, WeaponDef, WeaponStats } from "./types";


export const AMMO_LABELS: Record<AmmoType, string> = {
  mPistol: "pistola média",
  hPistol: "pistola pesada",
  vhPistol: "pistola muito pesada",
  slug: "slug",
  rifle: "rifle",
  shell: "cartucho",
  arrow: "flecha",
  grenade: "granada",
  rocket: "foguete",
};

const melee = (
  id: string,
  name: string,
  namePt: string,
  examples: string,
  damage: string,
  rof: number,
  concealable: boolean,
  cost: number,
): WeaponDef => ({
  id,
  kind: "weapon",
  class: "melee",
  name,
  namePt,
  examples,
  desc: `ex.: ${examples}.`,
  skill: "meleeWeapon",
  damage,
  rof,
  hands: null,
  concealable,
  features: [],
  cost,
});

const ranged = (
  id: string,
  name: string,
  namePt: string,
  skill: string,
  damage: string,
  magazine: number | undefined,
  ammo: AmmoType,
  rof: number,
  hands: number,
  concealable: boolean,
  features: string[],
  cost: number,
  autofire?: WeaponStats["autofire"],
): WeaponDef => ({
  id,
  autofire,
  kind: "weapon",
  class: "ranged",
  name,
  namePt,
  desc: "",
  skill,
  damage,
  magazine,
  ammo,
  rof,
  hands,
  concealable,
  features,
  cost,
});

const exotic = (
  id: string,
  name: string,
  desc: string,
  cost: number,
  over: Partial<WeaponDef> = {},
): WeaponDef => ({ id, kind: "weapon", class: "exotic", name, namePt: name.toLowerCase(), desc, cost, ...over });

/** Armas brancas: ligadas à DEX pela perícia Melee Weapon. */
export const MELEE_WEAPONS: WeaponDef[] = [
  melee("lightMelee", "Light Melee Weapon", "arma branca leve", "faca de combate, tomahawk", "1d6", 2, true, 50),
  melee("mediumMelee", "Medium Melee Weapon", "arma branca média", "taco de beisebol, pé de cabra, facão", "2d6", 2, false, 50),
  melee("heavyMelee", "Heavy Melee Weapon", "arma branca pesada", "cano de chumbo, espada, taco com pregos", "3d6", 2, false, 100),
  melee("veryHeavyMelee", "Very Heavy Melee Weapon", "arma branca muito pesada", "motosserra, marreta, pá de helicóptero, naginata", "4d6", 1, false, 500),
];

const auto = (n: number) => [`autofire (${n})`, "fogo de supressão"];

/** Armas de longo alcance: ligadas à REF pela perícia da arma. */
export const RANGED_WEAPONS: WeaponDef[] = [
  ranged("mediumPistol", "Medium Pistol", "pistola média", "handgun", "2d6", 12, "mPistol", 2, 1, true, [], 50),
  ranged("heavyPistol", "Heavy Pistol", "pistola pesada", "handgun", "3d6", 8, "hPistol", 2, 1, true, [], 100),
  ranged("vhPistol", "Very Heavy Pistol", "pistola muito pesada", "handgun", "4d6", 8, "vhPistol", 1, 1, false, [], 100),
  ranged("smg", "SMG", "submetralhadora", "handgun", "2d6", 30, "mPistol", 1, 1, true, auto(3), 100, { max: 3, table: "smg" }),
  ranged("heavySmg", "Heavy SMG", "submetralhadora pesada", "handgun", "3d6", 40, "hPistol", 1, 1, false, auto(3), 100, { max: 3, table: "smg" }),
  ranged("shotgun", "Shotgun", "escopeta", "shoulderArms", "5d6", 4, "slug", 1, 2, false, ["cartucho de escopeta"], 500),
  ranged("assaultRifle", "Assault Rifle", "fuzil de assalto", "shoulderArms", "5d6", 25, "rifle", 1, 2, false, auto(4), 500, { max: 4, table: "rifle" }),
  ranged("sniperRifle", "Sniper Rifle", "rifle de precisão", "shoulderArms", "5d6", 4, "rifle", 1, 2, false, [], 500),
  ranged("bow", "Bows & Crossbows", "arco e besta", "archery", "4d6", undefined, "arrow", 1, 2, false, ["flechas"], 100),
  ranged("grenadeLauncher", "Grenade Launcher", "lança-granadas", "heavyWeapons", "6d6", 2, "grenade", 1, 2, false, ["explosivo"], 500),
  ranged("rocketLauncher", "Rocket Launcher", "lança-foguetes", "heavyWeapons", "8d6", 1, "rocket", 1, 2, false, ["explosivo"], 500),
];

const ignoresArmor = "ignora armadura abaixo de SP11";

/**
 * Exóticas: variações de uma arma comum. Qualidade média e sem acessórios nem munição
 * especial, salvo o que estiver escrito. Regras completas na pág. 347.
 */
export const EXOTIC_WEAPONS: WeaponDef[] = [
  exotic("airPistol", "Air Pistol", "pistola muito pesada que dispara bolas de tinta (e ácido!).", 100, { base: "vhPistol" }),
  exotic("battleglove", "Battleglove", "manopla pesada com três slots de opção de cyberarm/cyberlimb. regras na pág. 347.", 1000, {
    skill: "meleeWeapon",
    damage: "",
    rof: 2,
    hands: 1,
    concealable: false,
    features: ["3 slots de opção de cyberarm"],
  }),
  exotic("hurricane", "Constitution Arms Hurricane Assault Weapon", "escopeta com ROF 2. precisa de BODY 11+.", 5000, {
    base: "shotgun",
    rof: 2,
    requiresBody: 11,
  }),
  exotic("dartgun", "Dartgun", "pistola muito pesada que dispara flechas não básicas.", 100, { base: "vhPistol", ammo: "arrow" }),
  exotic("flamethrower", "Flamethrower", "escopeta que dispara cartuchos incendiários, com a perícia Heavy Weapons.", 500, {
    base: "shotgun",
    skill: "heavyWeapons",
    ammo: "shell",
    features: ["só cartucho incendiário"],
  }),
  exotic("kendachiMonoThree", "Kendachi Mono-Three", "arma branca muito pesada de duas mãos. ignora armadura abaixo de SP11.", 5000, {
    base: "veryHeavyMelee",
    hands: 2,
    features: [ignoresArmor],
  }),
  exotic("malorian3516", "Malorian Arms 3516", "pistola muito pesada de qualidade excelente, a do Johnny Silverhand. 5d6 de dano.", 10000, {
    base: "vhPistol",
    damage: "5d6",
    features: ["qualidade excelente"],
  }),
  exotic("microwaver", "Microwaver", "pistola muito pesada que desliga cyberware e eletrônicos.", 500, {
    base: "vhPistol",
    features: ["desliga cyberware e eletrônicos"],
  }),
  exotic("cowboyU56", 'Militech "Cowboy" U-56 Grenade Launcher', "lança-granadas com ROF 2. precisa de BODY 11+.", 5000, {
    base: "grenadeLauncher",
    rof: 2,
    requiresBody: 11,
  }),
  exotic("railgun", "Rhinemetall EMG-86 Railgun", "fuzil de assalto que ignora armadura abaixo de SP11, com Heavy Weapons. precisa de BODY 11+.", 5000, {
    base: "assaultRifle",
    skill: "heavyWeapons",
    requiresBody: 11,
    features: [ignoresArmor],
  }),
  exotic("shrieker", "Shrieker", "pistola muito pesada que causa o ferimento crítico ouvido danificado.", 500, {
    base: "vhPistol",
    features: ["causa ouvido danificado"],
  }),
  exotic("stunBaton", "Stun Baton", 'arma branca média "menos letal".', 100, { base: "mediumMelee", features: ["menos letal"] }),
  exotic("stunGun", "Stun Gun", 'pistola pesada "menos letal".', 100, { base: "heavyPistol", features: ["menos letal"] }),
  exotic("helix", "Tsunami Arms Helix", "fuzil de assalto que só dispara em autofire, com multiplicador maior. precisa de BODY 11+.", 5000, {
    base: "assaultRifle",
    requiresBody: 11,
    features: ["só autofire, multiplicador maior"],
  }),
];

const COMMON = new Map([...MELEE_WEAPONS, ...RANGED_WEAPONS].map((w) => [w.id, w]));

/** Números da arma; a exótica herda da arma de base e troca o que muda. */
export function weaponStats(w: WeaponDef): WeaponStats {
  const base = w.base ? COMMON.get(w.base) : undefined;
  return {
    skill: w.skill ?? base?.skill ?? "meleeWeapon",
    damage: w.damage ?? base?.damage ?? "",
    rof: w.rof ?? base?.rof ?? 1,
    magazine: w.magazine ?? base?.magazine,
    ammo: w.ammo ?? base?.ammo,
    hands: w.hands !== undefined ? w.hands : (base?.hands ?? null),
    concealable: w.concealable ?? base?.concealable ?? false,
    features: [...(base?.features ?? []), ...(w.features ?? [])],
    requiresBody: w.requiresBody ?? base?.requiresBody,
    autofire: w.autofire ?? base?.autofire,
  };
}

/** Munição que cabe no pente. A escopeta dispara slug e, no modo alternativo, cartucho. */
export function ammoTypesFor(w: WeaponStats): AmmoType[] {
  if (!w.ammo) return [];
  return w.features.includes("cartucho de escopeta") && w.ammo !== "shell" ? [w.ammo, "shell"] : [w.ammo];
}

/* ---------- autofire ---------- */

/** Faixas de distância da tabela de autofire. */
export const AUTOFIRE_RANGES = ["0–6 m", "7–12 m", "13–25 m", "26–50 m", "51–100 m"];

/** DV do autofire por faixa (tabela "Autofire DVs Based on Range"). */
export const AUTOFIRE_DV: Record<"smg" | "rifle", number[]> = {
  smg: [20, 17, 20, 25, 30],
  rifle: [22, 20, 17, 20, 25],
};

/** Balas que um autofire gasta (e o mínimo no pente pra usar). */
export const AUTOFIRE_ROUNDS = 10;

/** Tiro mirado: −8 no teste, ataque único, gasta a ação inteira. */
export const AIMED_PENALTY = -8;

export const AIM_TARGETS = [
  { id: "head", label: "cabeça", effect: "o dano que passa da armadura da cabeça dobra" },
  { id: "hand", label: "item na mão", effect: "se 1 ponto passar da armadura do corpo, o alvo larga um item da mão (à tua escolha), que cai na frente dele" },
  { id: "leg", label: "perna", effect: "se 1 ponto passar da armadura do corpo, o alvo também sofre o ferimento crítico perna quebrada (se tiver perna inteira)" },
] as const;

export type AimTarget = (typeof AIM_TARGETS)[number]["id"];
