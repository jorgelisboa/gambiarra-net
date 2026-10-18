import type { CyberCategory, InstallPlace } from "../../lib/rpg/cyber/types";

/** Cyberware: corpo, humanidade, kit inicial e loja do ripperdoc. */
export const cyber = {
  /** Nome quando a peça não está no catálogo. */
  fallbackName: "cyberware",
  /** Aviso curto repetido na ficha e na loja. */
  noMoney: "sem grana",

  /** Grupos do catálogo (abas da loja). `en` é o nome do livro, mostrado na dica embaixo das abas. */
  categories: {
    fashionware: { label: "moda", en: "fashionware", base: "7 slots, sem peça de base" },
    neuralware: { label: "neural", en: "neuralware", base: "link neural: 5 slots" },
    chipware: { label: "chips", en: "chipware", base: "um chip por soquete de chip" },
    cyberoptics: { label: "olhos", en: "cyberoptics", base: "olho cibernético: 3 slots cada" },
    cyberaudio: { label: "ouvidos", en: "cyberaudio", base: "suíte de áudio cibernético: 3 slots" },
    internal: { label: "corpo · interno", en: "internal body", base: "7 slots, sem peça de base" },
    external: { label: "corpo · externo", en: "external body", base: "7 slots, sem peça de base" },
    cyberlimb: { label: "membros", en: "cyberlimbs", base: "braço cibernético: 4 slots · perna cibernética: 3 slots" },
    borgware: { label: "ciborgue", en: "borgware", base: "substitui boa parte do corpo" },
  } satisfies Record<CyberCategory, { label: string; en: string; base: string }>,

  /** Onde instala (preço de só instalar uma peça que você já tem). */
  installPlaces: { mall: "shopping", clinic: "clínica", hospital: "hospital" } satisfies Record<InstallPlace, string>,
  /** Chipware não tem cirurgia: só encaixa. */
  chipPlace: "chip",

  /** Lugares do corpo (cabeçalho de cada bloco na ficha). */
  hosts: {
    body: "corpo",
    meatArm: "braço de carne",
    meatLeg: "perna de carne",
    fashion: "moda",
    internal: "corpo · interno",
    external: "corpo · externo",
    /** Nome curto dos grupos sem peça de base, pra linha "livres". */
    poolShort: { fashion: "moda", internal: "interno", external: "externo" },
  },

  /** Por que não dá pra instalar a peça. */
  reasons: {
    unknown: "peça desconhecida",
    needs: (what: string) => `precisa de ${what}`,
    /** "2× músculo enxertado". */
    needsCount: (n: number, what: string) => `${n}× ${what}`,
    oneAccelerator: "só um acelerador neural por vez",
    alreadyHas: (name: string) => `já tem ${name}`,
    atMost: (n: number) => `no máximo ${n}`,
    noNeuralSlot: "sem slot livre no link neural",
    pairedLegs: "vai em par: precisa de 2 pernas cibernéticas com slot livre",
    pairedEyes: "vai em par: precisa de 2 olhos cibernéticos com slot livre",
    needNeural: "precisa de link neural",
    needSocket: "precisa de um soquete de chip livre",
    noEyeSlot: "sem slot livre nos olhos cibernéticos",
    needEye: "precisa de olho cibernético",
    noAudioSlot: "sem slot livre na suíte de áudio cibernético",
    needAudio: "precisa de suíte de áudio cibernético",
    noArm: "sem braço livre (braço cibernético ou braço de carne)",
    noArmSlot: "sem slot livre nos braços cibernéticos",
    needArm: "precisa de braço cibernético",
    noLeg: "sem perna livre (perna cibernética ou perna de carne)",
    noLegSlot: "sem slot livre nas pernas cibernéticas",
    needLeg: "precisa de perna cibernética",
    noMeatArm: "sem braço de carne livre",
    noMeatLeg: "sem perna de carne livre",
    poolFull: (slots: number, where: string) => `os ${slots} slots de ${where} estão cheios`,
  },

  /** Avisos da ficha (cyberIssues). */
  issues: {
    needsPairLegs: (name: string) => `${name} precisa do par (uma em cada perna)`,
    needsPairEyes: (name: string) => `${name} precisa do par (um em cada olho)`,
    twice: (name: string) => `${name} duas vezes`,
    meatArmsFull: "peça demais nos braços de carne: cada um leva uma",
    meatLegsFull: "peça demais nas pernas de carne: cada uma leva uma",
    slotsOver: (where: string, used: number, slots: number) => `${where} com ${used} de ${slots} slots`,
    lostHost: (name: string) => `${name} perdeu onde estava instalado`,
    requires: (name: string, what: string) => `${name} precisa de ${what}`,
  },

  /** Ciberpsicose pela EMP em uso (pág. 232). */
  psychosis: {
    extreme: {
      label: "ciberpsicose extrema",
      text: "o mestre assume o personagem e joga com os piores impulsos dele. volta pro jogador quando a humanidade ficar positiva.",
    },
    full: {
      label: "ciberpsicose",
      text: "mostra forte pelo menos 5 traços da lista de psicopatia de Hare. interprete de acordo.",
    },
    dissociation: {
      label: "dissociação",
      text: "transtorno dissociativo beirando a ciberpsicose: mostra forte pelo menos 3 traços da lista de Hare.",
    },
    edge: { label: "limite", text: "beirando o transtorno dissociativo. interprete de acordo." },
    stable: { label: "estável", text: "sem ciberpsicose nem dissociação." },
  },

  /** Traços de ciberpsicose na ficha: escolher da lista do livro, rolar ou escrever. */
  traits: {
    title: "traços",
    none: "nenhum traço ainda.",
    /** "2 de 3 que o livro pede" */
    count: (have: number, need: number) => `${have} de ${need} que o livro pede`,
    kinds: { dissociation: "dissociação", psychopathy: "psicopatia (Hare)" },
    kindAria: "tabela de traços",
    open: "pôr traço",
    close: "fechar",
    roll: (sides: number) => `rolar 1d${sides}`,
    rolled: (die: number, sides: number, name: string) => `rolou ${die} no 1d${sides}: ${name}`,
    allTaken: "a ficha já tem todos dessa tabela.",
    pickAria: "escolher da lista",
    pickPlaceholder: "escolher da lista…",
    put: "pôr",
    writeAria: "escrever um traço",
    writePlaceholder: "ou escreva um traço…",
    written: "escrito pelo mestre",
    removeAria: (name: string) => `tirar ${name}`,
    /** Linha curta na aba ficha. */
    sheetLine: (names: string) => `traços: ${names}`,
  },

  /** Perda de humanidade em texto curto. */
  hl: {
    short: (hl: number) => (hl > 0 ? `−${hl} hum.` : `${hl} hum.`),
  },

  /** Humanidade e terapia (pág. 230). */
  humanity: {
    label: "humanidade",
    cap: "teto",
    empInUse: "EMP em uso",
    lostInCyber: "perdida no cyberware:",
    therapy: "terapia",
    therapyStandard: "terapia padrão",
    therapyExtreme: "terapia extrema",
    therapyKind: "tipo de terapia",
    therapyWho: "quem faz a terapia",
    whoClinic: (price: string) => `clínica · ${price}`,
    whoMedtech: (materials: string, dv: number) => `medtech da mesa · materiais ${materials} · tecnologia médica DV${dv}`,
    whoFree: "sem custo",
    gained: "humanidade recuperada",
    apply: "aplicar",
    atCap: "já está no teto",
    note: "uma semana inteira. sem tirar cyberware, a humanidade não passa do teto.",
  },

  /** Kit inicial do role (CyberKitPicker). */
  kit: {
    title: (role: string) => `cyberware · ${role}`,
    chooseOne: "escolha uma opção",
    hlTotal: "perda de humanidade do kit",
    rest: (max: number, hl: number, rest: number, emp: number) => `humanidade ${max} − ${hl} = ${rest} · EMP em uso ${emp}`,
  },

  /** Aba "cyberware" da ficha. */
  sheet: {
    shop: "loja de cyberware",
    none: "sem cyberware ainda",
    installKit: (role: string) => `instalar o cyberware inicial (${role})`,
    kitNote: "o kit do livro usa a perda de humanidade fixa, como na criação.",
    warnings: "avisos do cyberware",
    free: (parts: string) => `livres: ${parts}`,
    freePart: (where: string, free: number, slots: number) => `${where} ${free}/${slots}`,
    stored: "chips guardados",
    note: "nota",
    noteOf: (name: string) => `nota de ${name}`,
    turnOn: "ligar",
    isOn: (bonus: number) => `ligado · +${bonus} iniciativa`,
    takeOut: "tirar do soquete",
    noSocket: "sem soquete livre",
    socketFor: (name: string) => `soquete para ${name}`,
    putIn: "pôr no soquete",
    /** `extra` é o número de peças que saem junto (0 = nenhuma). */
    confirmRemove: (name: string, extra: number) =>
      `remover ${name}? a humanidade perdida não volta (só com terapia).${
        extra > 0 ? ` leva junto ${extra} ${extra === 1 ? "peça instalada" : "peças instaladas"} nela.` : ""
      }`,
    /** Etiquetas dos efeitos de uma peça. */
    tags: {
      initiative: (n: number) => `+${n} iniciativa`,
      weapon: "arma no inventário",
      shield: "escudo no inventário",
      armor: "SP na cabeça e no corpo",
      serious: "ignora gravemente ferido",
      netrun: "netrun",
      skill: (value: number, skill: string, when?: string) => `+${value} ${skill}${when ? ` (${when})` : ""}`,
      chipSkill: (skill: string) => `perícia: ${skill}`,
    },
  },

  /** Loja do ripperdoc. */
  shop: {
    title: "ripperdoc",
    cash: "na mão",
    categories: "categorias de cyberware",
    search: "buscar cyberware",
    results: (n: number) => `${n} resultado(s) em todas as categorias`,
    categoryHint: (en: string, base: string) => `${en} · ${base}`,
    nothing: "nada encontrado.",
    /** "clínica · perda 7 (2d6) · 500eb cada · em par". */
    line: (place: string, loss: string, price: string, paired: boolean) =>
      `${place} · perda ${loss} · ${price}${paired ? " cada · em par" : ""}`,
    onlyFixer: "só com fixer",
    fixerHint: "acima de 100eb o livro só vende com fixer ou num mercado noturno (night market), pág. 385",
    cantInstall: "não dá pra instalar",
    install: "instalar",
    footnote: "preço com a instalação incluída. depois da criação, a perda de humanidade é rolada (o número entre parênteses).",
  },

  /** Painel de compra aberto embaixo da peça. */
  panel: {
    pieceIn: (i: number) => `peça ${i} em`,
    goesIn: "vai em",
    goesInList: "vai em:",
    whereOne: "onde instalar",
    wherePiece: (i: number) => `onde instalar a peça ${i}`,
    chipSkill: "perícia do chip",
    chooseSkill: "escolher perícia",
    required: "obrigatório",
    skillOption: (name: string, x2: boolean) => `${name}${x2 ? " · x2" : ""}`,
    chooseSkillTitle: "escolha a perícia do chip",
    meleeGroup: "arma branca do braço",
    weapon: "arma",
    gunAria: "arma de fogo do braço",
    noGun: "nenhuma, só o espaço no braço",
    fromGear: "do inventário",
    buyWith: "comprar junto",
    gunOption: (name: string, price: string) => `${name} · +${price}`,
    gunBought: (free: boolean, price: string) => `arma comprada junto: ${free ? "sem custo" : `+${price}`}`,
    payment: "pagamento",
    buy: (price: string) => `comprar · ${price}`,
    haveParts: (pair: boolean, fee: string) => `${pair ? "já tenho as peças" : "já tenho a peça"} · ${fee}`,
    haveChip: "já tenho o chip · grátis",
    free: "sem custo · o mestre deu",
    included: "instalação incluída",
    lossLabel: "humanidade perdida",
    noLoss: "sem perda de humanidade",
    lossAria: "perda de humanidade",
    lossAriaPiece: (i: number) => `perda de humanidade da peça ${i}`,
    reroll: "rolar de novo",
    rerollPiece: (i: number) => `rolar de novo a peça ${i}`,
    atCreation: (hl: number) => `na criação seria ${hl}`,
    psychosisWarn: "ciberpsicose: a humanidade vai ficar abaixo de zero.",
    failed: "não deu pra instalar: confira o lugar e tente de novo.",
    done: (name: string, total: number) => `instalado: ${name} · −${total} de humanidade`,
  },
} as const;
