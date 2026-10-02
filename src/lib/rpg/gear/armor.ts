import type { ArmorDef, ShieldDef } from "./types";

const armor = (id: string, name: string, namePt: string, sp: number, penalty: number, cost: number, desc: string): ArmorDef => ({
  id,
  kind: "armor",
  name,
  namePt,
  sp,
  penalty,
  cost,
  desc,
});

/**
 * Armaduras: compradas uma por local (cabeça ou corpo). SP não soma: vale a maior do local.
 * A penalidade vale uma vez só, a pior entre as vestidas.
 */
export const ARMORS: ArmorDef[] = [
  armor("leathers", "Leathers", "couro", 4, 0, 20, "a preferida de nômades e punks de moto."),
  armor("kevlar", "Kevlar", "kevlar", 7, 0, 50, "vira roupa, colete, jaqueta, terno e até biquíni."),
  armor("lightArmorjack", "Light Armorjack", "armorjack leve", 11, 0, 100, "kevlar com malha plástica no tecido."),
  armor("bodyweightSuit", "Bodyweight Suit", "traje bodyweight", 11, 0, 1000, "macacão com armorgel. guarda o cyberdeck e liga nos interface plugs (pág. 350)."),
  armor("mediumArmorjack", "Medium Armorjack", "armorjack médio", 12, -2, 100, "armorjack com placas de plástico sólido e kevlar mais grosso."),
  armor("heavyArmorjack", "Heavy Armorjack", "armorjack pesado", 13, -2, 500, "o armorjack mais grosso: kevlar denso e camadas de plástico e malha."),
  armor("flak", "Flak", "flak", 15, -4, 500, "a versão século 21 do colete e da calça à prova de estilhaço."),
  armor("metalgear", "Metalgear", "metalgear", 18, -4, 5000, "para quase tudo, mas você vira alvo fácil."),
];

export const SHIELDS: ShieldDef[] = [
  {
    id: "bulletproofShield",
    kind: "shield",
    name: "Bulletproof Shield",
    namePt: "escudo à prova de balas",
    hp: 10,
    cost: 100,
    desc: "escudo transparente de policarbonato. 10 HP, que caem com o dano. ocupa um braço (pág. 183).",
  },
];
