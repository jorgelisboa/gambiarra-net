import type { ArmorSlot } from "../../lib/types";

/** Combate: iniciativa, turno, dano, PNJ e as ações do turno. */
export const combat = {
  round: "rodada",
  initiative: "iniciativa",
  fullscreen: "tela cheia",
  nextTurn: "próximo turno",
  end: "encerrar",
  start: "iniciar combate",
  rollInitiative: "rolar iniciativa (1d10 + REF)",
  hp: "HP",
  sp: "SP",
  /** Estado de ferimento quando não há rótulo curto (HP cheio). */
  unhurt: "ileso",
  deathSave: "teste de morte",

  /** Caixa recolhível com as ações e regras do turno (conteúdo em src/lib/rpg/actions.ts). */
  reference: {
    summary: "ações e regras do turno",
    actionsTitle: "ações (1 de movimento + 1 ação por turno)",
    rulesTitle: "regras",
  },

  addCharacter: {
    title: "adicionar personagem",
    noCharacters: "crie personagens na aba personagens.",
    allIn: "todos já estão no combate.",
  },

  npc: {
    /** Etiqueta ao lado do nome de quem não tem ficha. */
    tag: "pnj",
    /** Nome de partida do combatente (sempre trocado antes de entrar). */
    defaultName: "PNJ",
    addTitle: "adicionar pnj",
    namePlaceholder: "nome",
    nameAria: "nome do pnj",
    net: "net",
  },

  nobody: "ninguém no combate ainda.",

  /** Linha de cada combatente na lista. */
  row: {
    initiativeOf: (name: string) => `iniciativa de ${name}`,
    loseHp: "tirar HP direto, sem armadura",
    heal: "curar",
    adjustValue: "valor de ajuste ou cura",
    woundTitle: (effect: string, stabilize: string) => `${effect} · estabilizar ${stabilize}`,
    walks: "anda",
    walksTitle: "ação de movimento: MOVE × 2 m/yd (ou MOVE quadrados na grade)",
    resetDeathSave: "zerar",
    remove: "remover do combate",
  },

  /** Painel de dano (aba de cada combatente). */
  hit: {
    diceAria: "dados de dano",
    rolledAria: "dados rolados",
    autofireDice: (times: string) => `rajada 2d6 × ${times}`,
    targets: {
      body: { label: "corpo" },
      head: { label: "cabeça · mirado ×2", title: "tiro mirado: o que passa da armadura da cabeça dobra" },
      hand: {
        label: "mão · mirado",
        title: "tiro mirado: se passar 1 ponto da armadura do corpo, larga um item da mão",
      },
      leg: {
        label: "perna · mirado",
        title: "tiro mirado: se passar 1 ponto da armadura do corpo, perna quebrada (ferimento crítico)",
      },
    },
    targetButton: (label: string, sp: number) => `${label} · SP${sp}`,
    bypassArmor: "ignora armadura",
    bypassArmorTitle: "veneno, fogo e afins passam direto",
    critical: "crítico +5",
    criticalTitle: "dois ou mais 6 no dano: ferimento crítico, +5 direto no HP",
    wasAttack: "foi ataque",
    wasAttackTitle: "mortalmente ferido levando dano de ataque: ferimento crítico e +1 na penalidade do teste de morte",
    armorLoses: (slot: ArmorSlot) => (slot === "head" ? "a armadura da cabeça perde 1 SP" : "a armadura do corpo perde 1 SP"),
    mortalHit: "mortal: crítico e +1 na penalidade do teste de morte",
    deflection: (n: number) => `desvio de dano −${n} pronto pro 1º dano da rodada`,
    apply: "aplicar",
    /** Efeito do tiro mirado (vem da regra em src/lib/rpg/damage.ts). */
    aim: {
      hand: "larga um item da mão (à escolha do atacante), que cai na frente dele",
      leg: "ferimento crítico: perna quebrada (se tiver perna inteira)",
    },
    /** Anotação que fica depois de aplicar o dano. */
    notes: {
      armor: (slot: string, from: number, to: number) => `SP ${slot} ${from}→${to}`,
      critical: "role na tabela de ferimento crítico",
      mortalHit: "+1 na penalidade do teste de morte",
      result: (name: string, notes: string) => `${name}: ${notes}`,
    },
    /** Conta do dano: "15 − SP11 = 4 · ×2 cabeça = 8 · +5 crítico → 13 no HP". */
    describe: {
      ignoresArmor: (damage: number) => `${damage} (ignora armadura)`,
      minusSp: (damage: number, sp: number, base: number) => `${damage} − SP${sp} = ${base}`,
      headDoubled: (through: number) => `×2 cabeça = ${through}`,
      critical: (bonus: number, mortal: boolean) => `+${bonus} ${mortal ? "crítico (mortal)" : "crítico"}`,
      deflected: (n: number) => `−${n} desvio de dano`,
      total: (parts: string, hpLoss: number) => `${parts} → ${hpLoss} no HP`,
    },
  },

  /** Modo tela cheia (iniciativa em carrossel). */
  stage: {
    order: "ordem de iniciativa",
    view: (name: string) => `ver ${name}`,
    navTitle: (initiative: number, name: string) => `${initiative} · ${name}`,
    keysHint: "espaço / →",
    nextTitle: "espaço / → passa o turno",
    exit: "sair (esc)",
    carousel: "combatentes na ordem de iniciativa",
    carouselRole: "carrossel",
    cardRole: "carta",
    cardLabel: (i: number, n: number, name: string) => `${i} de ${n}: ${name}`,
    turnBadge: "turno",
    previous: "cartas anteriores",
    next: "próximas cartas",
  },

  /** Ícones de ação do turno: ação e movimento (carne) e ações de net. */
  turnActions: {
    action: "ação",
    move: "movimento",
    net: (n: number) => `ação de net ${n}`,
    title: (label: string, used: boolean) => (used ? `${label} (usada)` : label),
  },
} as const;
