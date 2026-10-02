import type { ArmorSlot, Role } from "../../types";
import { fashionId } from "./fashion";

export interface KitItem {
  ref: string;
  qty: number;
  slot?: ArmorSlot;
}

/** Uma linha da tabela do livro: um item fixo, ou "isto **ou** aquilo". */
export interface KitLine {
  options: KitItem[][];
  /** Linhas com a mesma chave andam juntas (arma e munição dela). */
  link?: string;
}

export interface RoleKit {
  weapons: KitLine[];
  outfit: KitLine[];
}

const it = (ref: string, qty = 1, slot?: ArmorSlot): KitItem => ({ ref, qty, slot });
const fixed = (...items: KitItem[]): KitLine => ({ options: [items] });
const or = (...options: KitItem[][]): KitLine => ({ options });
const linked = (link: string, line: KitLine): KitLine => ({ ...line, link });

/** Roupa de um estilo: wear("genericChic", ["jacket"], ["jewelry", 3]). */
const wear = (style: string, ...pieces: (string | [string, number])[]): KitLine =>
  fixed(...pieces.map((p) => (typeof p === "string" ? it(fashionId(style, p)) : it(fashionId(style, p[0]), p[1]))));

const ARMORJACK = [fixed(it("lightArmorjack", 1, "body")), fixed(it("lightArmorjack", 1, "head"))];

const pistolOr = () => or([it("heavyPistol")], [it("vhPistol")]);
const pistolAmmoOr = (qty: number) => or([it("ammo-hPistol", qty)], [it("ammo-vhPistol", qty)]);

/** Tabelas Streetrat do livro: armas e armadura (pág. 98) e outfit (pág. 103). */
export const STREETRAT_KITS: Record<Role, RoleKit> = {
  Rockerboy: {
    weapons: [
      fixed(it("vhPistol")),
      fixed(it("ammo-vhPistol", 50)),
      or([it("heavyMelee")], [it("grenade-flashbang")]),
      fixed(it("grenade-teargas", 2)),
      ...ARMORJACK,
    ],
    outfit: [
      fixed(it("agent")),
      fixed(it("computer")),
      or([it("instrument")], [it("bugDetector")]),
      fixed(it("glowPaint", 5)),
      fixed(it("pocketAmp")),
      fixed(it("radioScanner")),
      fixed(it("videoCamera")),
      wear("genericChic", "jacket", ["jewelry", 3], ["top", 4]),
      wear("leisurewear", "jewelry", "mirrorshades", "footwear"),
      wear("urbanFlash", "bottoms", "top"),
    ],
  },
  Solo: {
    weapons: [
      fixed(it("assaultRifle")),
      fixed(it("vhPistol")),
      or([it("heavyMelee")], [it("bulletproofShield")]),
      fixed(it("ammo-vhPistol", 30)),
      fixed(it("ammo-rifle", 70)),
      ...ARMORJACK,
    ],
    outfit: [
      fixed(it("agent")),
      wear("leisurewear", ["footwear", 2], ["jacket", 3], "mirrorshades", ["bottoms", 2], ["top", 2]),
    ],
  },
  Netrunner: {
    weapons: [fixed(it("vhPistol")), fixed(it("ammo-vhPistol", 30)), ...ARMORJACK],
    outfit: [
      fixed(it("agent")),
      fixed(it("cyberdeck")),
      fixed(it("virtualityGoggles")),
      fixed(it("program-armor")),
      fixed(it("program-sword")),
      or([it("program-seeya")], [it("program-eraser")]),
      or([it("program-sword")], [it("program-vrizzbolt")]),
      or([it("program-worm")], [it("program-sword")]),
      wear("genericChic", ["top", 10]),
      wear("leisurewear", ["footwear", 2], "jewelry", ["bottoms", 2]),
      wear("urbanFlash", "jacket"),
    ],
  },
  Tech: {
    weapons: [
      linked("arma", or([it("shotgun")], [it("assaultRifle")])),
      linked("arma", or([it("ammo-shell", 100)], [it("ammo-rifle", 100)])),
      fixed(it("grenade-flashbang")),
      ...ARMORJACK,
    ],
    outfit: [
      fixed(it("agent")),
      fixed(it("antiSmogMask")),
      fixed(it("disposablePhone")),
      fixed(it("ductTape", 5)),
      fixed(it("flashlight")),
      fixed(it("roadFlare", 6)),
      fixed(it("techBag")),
      wear("genericChic", ["bottoms", 8], ["top", 10]),
      wear("leisurewear", ["footwear", 2]),
    ],
  },
  Medtech: {
    weapons: [
      linked("arma", or([it("shotgun")], [it("assaultRifle")])),
      linked("arma", or([it("ammo-shell", 100)], [it("ammo-rifle", 100)])),
      linked("arma", or([it("ammo-shell-incendiary", 10)], [it("ammo-rifle-incendiary", 10)])),
      fixed(it("grenade-smoke", 2)),
      ...ARMORJACK,
      fixed(it("bulletproofShield")),
    ],
    outfit: [
      fixed(it("agent")),
      fixed(it("airhypo")),
      fixed(it("handcuffs")),
      fixed(it("flashlight")),
      wear("genericChic", ["jacket", 3]),
      fixed(it("glowPaint")),
      fixed(it("medtechBag")),
      wear("leisurewear", "footwear", ["bottoms", 3], ["top", 5]),
    ],
  },
  Media: {
    weapons: [linked("pistola", pistolOr()), linked("pistola", pistolAmmoOr(50)), ...ARMORJACK],
    outfit: [
      fixed(it("agent")),
      fixed(it("audioRecorder")),
      fixed(it("binoculars")),
      or([it("disposablePhone", 2)], [it("grappleGun")]),
      fixed(it("flashlight")),
      fixed(it("computer")),
      fixed(it("radioScanner")),
      fixed(it("scrambler")),
      fixed(it("videoCamera")),
      wear("genericChic", "footwear", "bottoms", "top"),
      wear("leisurewear", "jacket"),
      wear("urbanFlash", "mirrorshades"),
    ],
  },
  Lawman: {
    weapons: [
      or([it("assaultRifle")], [it("shotgun")]),
      fixed(it("heavyPistol")),
      or([it("ammo-rifle", 100)], [it("ammo-shell", 100)], [it("ammo-slug", 100)]),
      fixed(it("ammo-hPistol", 30)),
      or([it("bulletproofShield")], [it("grenade-smoke", 2)]),
      ...ARMORJACK,
    ],
    outfit: [
      fixed(it("agent")),
      fixed(it("flashlight")),
      fixed(it("handcuffs", 2)),
      fixed(it("radioCommunicator")),
      fixed(it("roadFlare", 10)),
      wear("genericChic", "jacket", ["bottoms", 2], ["top", 3]),
      wear("leisurewear", ["footwear", 2], ["jacket", 2], ["bottoms", 2], "mirrorshades", ["top", 2]),
    ],
  },
  Exec: {
    weapons: [fixed(it("vhPistol")), fixed(it("ammo-vhPistol", 50)), ...ARMORJACK],
    outfit: [
      fixed(it("radioCommunicator", 4)),
      fixed(it("scrambler")),
      wear("businesswear", "footwear", "jacket", "bottoms", "mirrorshades", "top", ["jewelry", 2]),
    ],
  },
  Fixer: {
    weapons: [pistolOr(), pistolOr(), fixed(it("lightMelee")), pistolAmmoOr(100), ...ARMORJACK],
    outfit: [
      fixed(it("agent")),
      fixed(it("bugDetector")),
      fixed(it("computer")),
      fixed(it("disposablePhone", 2)),
      wear("genericChic", "contacts", "jewelry"),
      wear("leisurewear", "mirrorshades"),
      wear("urbanFlash", "footwear", "jacket", "bottoms", "top"),
    ],
  },
  Nomad: {
    weapons: [
      linked("pistola", pistolOr()),
      linked("pistola", pistolAmmoOr(100)),
      or([it("heavyMelee")], [it("heavyPistol")]),
      ...ARMORJACK,
    ],
    outfit: [
      fixed(it("agent")),
      fixed(it("antiSmogMask")),
      fixed(it("ductTape")),
      fixed(it("flashlight")),
      fixed(it("grappleGun")),
      fixed(it("inflatableBed")),
      fixed(it("medtechBag")),
      fixed(it("radioCommunicator", 2)),
      fixed(it("rope")),
      fixed(it("techtool")),
      fixed(it("tent")),
      wear("bohemian", "jewelry"),
      wear("nomadLeathers", ["top", 4], ["bottoms", 2], ["footwear", 2], "jacket", "hat"),
    ],
  },
};

/** Linhas do kit com a chave usada nas escolhas (w0, w1... o0, o1...). */
export const kitLines = (kit: RoleKit) => [
  ...kit.weapons.map((line, i) => ({ key: `w${i}`, line })),
  ...kit.outfit.map((line, i) => ({ key: `o${i}`, line })),
];

/** Escolhe a opção `i` de uma linha; linhas ligadas (arma e munição) vão junto. */
export function pickKitOption(kit: RoleKit, picks: Record<string, number>, key: string, i: number) {
  const lines = kitLines(kit);
  const link = lines.find((l) => l.key === key)?.line.link;
  const next = { ...picks, [key]: i };
  if (link) {
    for (const l of lines) if (l.line.link === link && i < l.line.options.length) next[l.key] = i;
  }
  return next;
}

/** O que o personagem recebe com as escolhas feitas (sem escolha = primeira opção). */
export const kitItems = (kit: RoleKit, picks: Record<string, number>): KitItem[] =>
  kitLines(kit).flatMap(({ key, line }) => line.options[picks[key] ?? 0] ?? line.options[0]);
