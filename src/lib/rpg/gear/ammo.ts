import { AMMO_LABELS } from "./weapons";
import type { AmmoDef, AmmoType } from "./types";

const BASIC: [AmmoType, string][] = [
  ["mPistol", "M Pistol"],
  ["hPistol", "H Pistol"],
  ["vhPistol", "VH Pistol"],
  ["slug", "Slug"],
  ["rifle", "Rifle"],
  ["shell", "Shotgun Shell"],
  ["arrow", "Arrow"],
];

const special = (id: string, ammo: AmmoType, name: string, namePt: string, desc: string): AmmoDef => ({
  id,
  kind: "ammo",
  ammo,
  name,
  namePt,
  desc,
  pack: 1,
  cost: null,
});

const thrown = "arremessada (athletics) ou disparada no lança-granadas. efeito na pág. 344.";

/**
 * Munição. A básica custa 10eb a cada 10 e não tem efeito especial; granadas, foguetes
 * e munição especial têm preço e regras no Night Market (pág. 344).
 */
export const AMMO: AmmoDef[] = [
  ...BASIC.map(([ammo, en]): AmmoDef => ({
    id: `ammo-${ammo}`,
    kind: "ammo",
    ammo,
    name: `Basic ${en} Ammunition`,
    namePt: `munição básica de ${AMMO_LABELS[ammo]}`,
    desc: "munição padrão, sem efeito especial.",
    pack: 10,
    cost: 10,
  })),
  special("ammo-shell-incendiary", "shell", "Incendiary Shotgun Shell Ammunition", "cartucho incendiário", "munição especial. efeito na pág. 344."),
  special("ammo-rifle-incendiary", "rifle", "Incendiary Rifle Ammunition", "munição incendiária de rifle", "munição especial. efeito na pág. 344."),
  special("grenade-flashbang", "grenade", "Flashbang Grenade", "granada de luz", thrown),
  special("grenade-teargas", "grenade", "Teargas Grenade", "granada de gás lacrimogêneo", thrown),
  special("grenade-smoke", "grenade", "Smoke Grenade", "granada de fumaça", thrown),
];
