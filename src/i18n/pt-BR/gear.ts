import type { ArmorSlot } from "../../lib/types";

/** Equipamento: inventário, loja, armadura, escudo e munição. */
export const gear = {
  /** Local da armadura. */
  slots: { head: "cabeça", body: "corpo" } satisfies Record<ArmorSlot, string>,

  /** Penalidade da armadura vale nestas três stats. */
  penaltyStats: "REF/DEX/MOVE",

  /** Categorias de preço do livro (Buying and Selling), da mais barata à mais cara. */
  priceCategories: ["barato", "cotidiano", "custoso", "premium", "caro", "muito caro", "luxo", "super luxo"],

  /** Grupos do inventário. */
  groups: {
    weapon: "armas",
    armor: "armadura e escudo",
    ammo: "munição",
    gear: "equipamento",
    fashion: "roupas",
    custom: "outros",
  },

  implant: {
    tag: "implante",
    hint: "vem de um implante: sai só removendo o cyberware, na aba cyberware",
  },

  /** Aba equipamento (GearSheet). */
  sheet: {
    money: "eurobucks",
    moneyUnit: "eb",
    shop: "loja",
    closeShop: "fechar loja",
    kit: "kit streetrat",
    /** `money` já vem formatado e só aparece quando o personagem está zerado. */
    receiveKit: (money?: string) => (money ? `receber o kit e ${money}` : "receber o kit"),
    empty: "inventário vazio.",
    takeKit: (role: string) => `pegar o kit streetrat do ${role}`,
    customPlaceholder: "outro item (escrito à mão)",
    customLabel: "outro item",
    itemName: "nome do item",
    quantityOf: (item: string) => `quantidade de ${item}`,
    minusOne: "menos um",
    plusOne: "mais um",
  },

  /** Armadura e escudo: cartões de SP/penalidade e a linha de cada peça. */
  armor: {
    spAt: (slot: string) => `SP ${slot}`,
    /** Unidade de cada peça: armadura em SP, escudo em HP. */
    units: { sp: "SP", hp: "HP" },
    shield: "escudo",
    shieldStowed: "guardado",
    slotLabel: "local",
    worn: "vestida",
    stowed: "guardada",
    shieldHeld: "em mãos",
    ablate: "ablação: −1 SP",
    ablateHint: "ablação: −1 SP quando um dano passa",
    shieldMinus: "−1 HP",
    plusOne: (unit: string) => `+1 ${unit}`,
    repair: "reparar",
  },

  /** Linha de armadura na ficha (WeaponsPanel). */
  armorLine: {
    label: "armadura:",
    none: "nenhuma vestida",
  },

  /** Números curtos de cada tipo de item (gearText.ts). */
  specs: {
    handsVary: "mãos: varia",
    oneHand: "1 mão",
    hands: (n: number) => `${n} mãos`,
    damageInBook: "dano: ver livro",
    rof: (n: number) => `ROF ${n}`,
    magazine: (size: number, ammo: string) => `pente ${size} (${ammo})`,
    concealable: "ocultável",
    notConcealable: "não ocultável",
    noPenalty: "sem penalidade",
    shield: (hp: number) => `${hp} HP · ocupa um braço`,
    ammoFor: (types: string) => `pra ${types}`,
    cyberdeck: (slots: number) => `${slots} slots (programas e hardware)`,
    priceInBook: "preço no livro",
    pricePer: (pack: number) => ` a cada ${pack}`,
  },

  /** Loja (Shop). */
  shop: {
    label: "loja",
    search: "buscar na loja",
    cash: "na mão",
    luxury: "mostrar itens de luxo (o livro recomenda que o mestre não libere na criação)",
    notFound: "nada encontrado.",
    noPrice: "sem preço nestas tabelas",
    noMoney: "sem grana",
    tabs: {
      weapons: "armas",
      armor: "armadura",
      ammo: "munição",
      gear: "equipamento",
      fashion: "roupas",
    },
    /** Título de cada grupo de arma; `skill` é o nome da perícia da arma. */
    weaponGroups: {
      melee: (skill: string) => `armas brancas · DEX + ${skill}`,
      ranged: "armas de longo alcance · REF + perícia da arma",
      exotic: "exóticas · raras e caras",
    },
  },
} as const;
