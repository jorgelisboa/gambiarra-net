/** "1 andar", "3 andares". */
const floorsOf = (n: number) => (n === 1 ? "1 andar" : `${n} andares`);

/**
 * Infraestrutura de segurança (aba infra do mestre): comprar a arquitetura, encher os andares, pendurar defesas
 * e ver o custo. Os nomes das defesas, os dados e os resumos delas ficam em src/lib/rpg/net/security.ts (catálogo).
 */
export const infra = {
  /** Nome de uma infraestrutura nova quando o mestre não escreve um. */
  defaultName: "infraestrutura",
  whereToBuy: "mercado noturno com eletrônicos pessoais, de Fixer rank 4+",

  /** O que ocupa um andar comprado. */
  kinds: {
    password: { label: "senha" },
    file: { label: "arquivo", hint: "o tesouro: dados que alguém quer" },
    control: { label: "nó de controle", hint: "liga uma defesa (ou outra coisa) do mundo real" },
    demon: { label: "demon", hint: "opera os nós de controle sozinho" },
  },

  /** `backdoor`: nome da ação de interface (t.roles.netrunner.abilities.backdoor.name). */
  passwordHint: (backdoor: string) => `trava a descida até alguém usar ${backdoor}`,

  defenseCategories: {
    active: {
      label: "ativa",
      rule: "robôs que perseguem até o perímetro; só funcionam com um demon (ou netrunner) segurando o nó",
    },
    emplaced: {
      label: "fixa",
      rule: "presa no lugar, dispara sozinha no gatilho com número de combate + 1d10; não precisa de demon e não esquiva",
    },
    environmental: {
      label: "ambiente",
      rule: "parte do piso, parede ou teto; mesmo controlada só liga e desliga, e sem demon alguém liga na mão",
    },
  },

  /** Modelos prontos (os andares ficam em security.ts). */
  templates: {
    loja: {
      label: "loja pequena",
      description: "4 andares num servidor portátil: câmera, livro-caixa e uma torreta no estoque",
    },
    boate: {
      label: "boate",
      description: "6 andares com um Imp cuidando das câmeras e de um drone no camarote",
    },
    corporativo: {
      label: "andar corporativo",
      description: "9 andares com um Efreet, grade laser no corredor do cofre e drone de patrulha",
    },
  },

  /** Ficha de um demon: "REZ 15 · interface 3 · 2 ações de net · número de combate 14". */
  demon: {
    stats: (rez: number, ifc: number, netActions: number, combatNumber: number) =>
      `REZ ${rez} · interface ${ifc} · ${netActions} ações de net · número de combate ${combatNumber}`,
    /** Nomes das ações de interface (t.roles.netrunner.abilities). */
    onlyUses: (zap: string, control: string) => `usa só ${zap} e ${control}.`,
  },

  /** Desarmar uma defesa: "eletrônica/segurança DV17, 5 min". */
  counter: (skill: string, dv: number, time: string) => `${skill} DV${dv}, ${time}`,

  /** Problemas que a conta aponta. */
  issues: {
    minFloors: (min: number) => `uma arquitetura tem no mínimo ${min} andares`,
    maxFloors: (max: number) => `uma arquitetura tem no máximo ${max} andares`,
    /** `hint`: onde cabem mais, quando existe. */
    controlNodes: (used: number, floors: number, max: number, hint?: string) =>
      `${used} nós de controle: com ${floors} andares cabem ${max}${hint ? ` (${hint})` : ""}`,
    controlNodesHint: {
      two: "de 7 a 12 andares cabem 3; de 13 pra cima, sem limite",
      three: "de 13 andares pra cima, sem limite",
    },
    demons: (used: number, floors: number, max: number, perDemon: number) =>
      `${used} demons: com ${floors} andares ${max === 1 ? "cabe 1" : `cabem ${max}`} (um a cada ${perDemon} andares)`,
    activeNeedsRunner: (defense: string) =>
      `${defense} é defesa ativa: sem demon, só funciona com um netrunner segurando o nó`,
    environmentalByHand: (defense: string) => `sem demon, alguém do lugar liga e desliga ${defense} na mão`,
    demonWithoutNode: "o demon não tem nó de controle pra operar",
  },

  /** Texto que vai pra arquitetura do construtor ao mandar a infraestrutura pra lá. */
  send: {
    demonLabel: (name: string) => `demon ${name}`,
    /** `counter`: de `t.infra.counter`. */
    defenseNote: (name: string, category: string, counter: string, data: string, summary: string) =>
      `${name} (defesa ${category}; desarmar: ${counter}) · ${data}. ${summary}`,
  },

  /** Lista e tela vazia. */
  list: {
    heading: "infraestrutura",
    summary: (floors: number, cost: string) => `${floorsOf(floors)} · ${cost}`,
    emptyTitle: "nenhuma infraestrutura",
    emptyHelp:
      "compre uma arquitetura, encha os andares com senha, arquivo, nó de controle e demon, e pendure as defesas do mundo real nos nós. os custos seguem as regras de segurança doméstica 2045 do livro (pág. 217); black ICE fica de fora.",
  },

  create: {
    title: "nova infraestrutura",
    namePlaceholder: "depósito da tlb",
    startFrom: "começar de",
    blank: "em branco · 3 andares",
  },

  editor: {
    nameAria: "nome da infraestrutura",
    locationHint: "onde fica no mundo real",
    /** Resumo da faixa de preço: "6 andares · 1.000eb/andar · portátil · até 2 nós de controle". */
    tier: (floors: number, perFloor: string, portable: boolean, maxControlNodes: number | null) =>
      `${floorsOf(floors)} · ${perFloor}/andar · ${portable ? "portátil" : "fixo"} · ${
        maxControlNodes === null ? "nós sem limite" : `até ${maxControlNodes} nós de controle`
      }`,
    outOfRange: (min: number, max: number) => `uma arquitetura tem de ${min} a ${max} andares`,
    addAtEnd: "+ andar no fim",
  },

  /** Cartão de um andar. */
  floor: {
    up: "subir andar",
    down: "descer andar",
    addBelow: "andar novo abaixo",
    remove: "apagar",
    demon: "demon",
    demonButton: (name: string, cost: string) => `${name} · ${cost}`,
    dv: "DV",
    dvButton: (dv: number, cost: string) => `DV${dv} · ${cost}`,
    defense: "defesa",
    defenseAria: "defesa do nó de controle",
    noDefense: "outra coisa · sem defesa, sem custo",
    defenseOption: (name: string, counterDv: number, cost: string) => `${name} · DV${counterDv} · ${cost}`,
    disarm: (counter: string) => `desarmar: ${counter}`,
    otherThing: "porta, chuveiro anti-incêndio, sirene, telão, ar-condicionado: escreva no nome o que o nó controla",
    screenName: "nome no telão",
    /** Exemplo no campo do nome, por tipo de andar. */
    screenNameHint: {
      password: "portaria",
      file: "folha de pagamento",
      control: "câmeras do saguão",
      demon: "segurança do prédio",
    },
    masterNote: "nota do mestre",
    masterNoteHint: "quem sabe a senha, o que tem no arquivo...",
  },

  /** Painel de custo. */
  summary: {
    title: "custo",
    rows: {
      architecture: "arquitetura",
      /** `perFloor`: preço por andar. */
      architectureTier: (floors: number, perFloor: string) => `arquitetura · ${floors} × ${perFloor}`,
      passwords: "senhas",
      files: "arquivos",
      controlNodes: "nós de controle",
      demons: "demons",
      defenses: "defesas",
    },
    noLimit: "sem limite",
    /** Erros e avisos dos andares, juntos: "1 erro e 2 avisos nos andares". */
    floorIssues: (errors: number, warnings: number) => {
      const parts = [
        errors > 0 ? `${errors} ${errors === 1 ? "erro" : "erros"}` : null,
        warnings > 0 ? `${warnings} ${warnings === 1 ? "aviso" : "avisos"}` : null,
      ].filter(Boolean);
      return `${parts.join(" e ")} ${errors + warnings === 1 ? "no andar" : "nos andares"}`;
    },
    whereToBuy: (where: string) => `onde comprar: ${where}`,
    update: "atualizar no construtor",
    send: "mandar pro construtor",
    fixErrors: "resolva os erros primeiro",
    sent: "pronto: está na aba netrunner",
    openBuilder: "abrir no construtor",
    linkedTo: (name: string) => `ligada a: ${name}`,
    open: "abrir",
    confirmReplace: (name: string) => `substituir os andares de "${name}"? o que estava revelado no telão zera.`,
    confirmDelete: (name: string) => `apagar a infraestrutura "${name}"? a arquitetura no construtor fica.`,
    delete: "apagar infraestrutura",
  },
} as const;
