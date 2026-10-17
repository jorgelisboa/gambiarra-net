/**
 * Cyberware (livro, págs. 110-118 e 358-367). Os textos são resumos próprios em pt-BR.
 */

export type CyberCategory =
  | "fashionware"
  | "neuralware"
  | "chipware"
  | "cyberoptics"
  | "cyberaudio"
  | "internal"
  | "external"
  | "cyberlimb"
  | "borgware";

/** Onde se instala. Chipware não tem: é só encaixar no soquete. */
export type InstallPlace = "mall" | "clinic" | "hospital";

/** Perda de humanidade depois da criação: "1d6/2" é metade de 1d6, arredondada pra cima. */
export type HlDice = "0" | "1d6/2" | "1d6" | "2d6" | "4d6";

/**
 * Tipo de lugar onde uma peça encaixa.
 * - "body": peça de base e borgware; não ocupa slot, os limites são `unique` e `max`.
 * - "fashion", "internal", "external": 7 slots cada, sem peça de base.
 * - "neural", "eye", "audio", "arm", "leg", "socket": slots que uma peça de base abre (`provides`).
 * - "meatArm", "meatLeg": braço ou perna de carne, uma peça em cada.
 */
export type HostKind =
  | "body"
  | "fashion"
  | "internal"
  | "external"
  | "neural"
  | "socket"
  | "eye"
  | "audio"
  | "arm"
  | "leg"
  | "meatArm"
  | "meatLeg";

export interface CyberSkillEffect {
  /** Id da perícia (src/lib/rpg/skills.ts). */
  skill: string;
  value: number;
  /** Só vale em parte dos testes ("envolver visão"); não soma sozinho na rolagem. */
  when?: string;
}

/** O que a peça muda na ficha. O que não está aqui fica só no texto. */
export interface CyberEffects {
  /** Bônus em perícias. Duas cópias da mesma peça não somam. */
  skills?: CyberSkillEffect[];
  /** Somado na iniciativa, sempre (Kerenzikov). */
  initiative?: number;
  /** Somado na iniciativa só com a peça ligada (Sandevistan). */
  activeInitiative?: number;
  /** BODY: soma `add` ou sobe pra `set`, sem passar de `max`. Muda HP e death save. */
  body?: { add?: number; set?: number; max: number };
  /**
   * Arma que a peça põe no inventário (id no catálogo de armas). "popupMelee": o jogador escolhe
   * arma branca leve, média ou pesada. "popupRanged": o jogador escolhe uma arma de fogo de uma mão.
   */
  weapon?: string;
  /** Armadura implantada (id em IMPLANT_ARMORS): vira armadura vestida na cabeça e no corpo. */
  armor?: string;
  /** Põe um escudo à prova de balas no inventário (popup shield). */
  shield?: boolean;
  /** Ignora a penalidade de gravemente ferido (Pain Editor). */
  ignoreSerious?: boolean;
  /** Conta pro netrun: neural link, interface plugs, virtuality (em par). */
  netrun?: "neuralLink" | "plugs" | "virtuality";
}

export interface CyberwareDef {
  /** Chave salva na ficha: não renomeie. */
  id: string;
  /** Nome do livro (en). */
  name: string;
  /** Nome curto em pt-BR, pra busca e legenda. */
  namePt: string;
  category: CyberCategory;
  /** null: chipware (encaixa no soquete, sem cirurgia). */
  install: InstallPlace | null;
  /** Eurobucks, com a instalação incluída. Skill chip de perícia x2 custa o dobro (ver `cyberPrice`). */
  cost: number;
  /** Perda de humanidade fixa: vale na criação de personagem. */
  hl: number;
  /** Perda de humanidade rolada depois da criação. */
  hlDice: HlDice;
  /** Onde pode ir, em ordem de preferência. */
  fits: HostKind[];
  /** Slots que ocupa no lugar onde vai. Padrão 1; 0 = não ocupa (capas, mão e pé padrão). */
  slots?: number;
  /** Também ocupa um slot deste tipo (Subdermal Grip ocupa um slot do neural link). */
  alsoTakes?: HostKind;
  /** Peça de base: os slots que ela abre. */
  provides?: { kind: HostKind; slots: number };
  /** Precisa de uma destas peças instaladas (qualquer uma serve). */
  requires?: string[];
  /** Quantas das peças de `requires` precisa (Linear Frame β pede 2 Grafted Muscle). Padrão 1. */
  requiresCount?: number;
  /** BODY mínimo pra instalar (com o cyberware que já tem). */
  minBody?: number;
  /** Uma por personagem por grupo ("speedware", "neuralLink"...). */
  unique?: string;
  /** Quantas cabem no corpo; `plus` libera mais com outra peça (MultiOptic Mount: +5 cybereyes). */
  max?: { base: number; plus?: { ref: string; add: number } };
  /** Tem que ir em dois cybereyes ou cyberlegs diferentes: compra dupla, HL de cada uma. */
  paired?: boolean;
  /** Resumo em pt-BR, minúsculo, sem travessão. */
  summary: string;
  /** Página da listagem completa no livro. */
  page: number;
  effects?: CyberEffects;
}
