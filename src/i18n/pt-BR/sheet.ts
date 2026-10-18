/** Ficha de jogo (aba ficha): vitais, stats, perícias, habilidade, cyberware, bolso e rolagem. */
export const sheet = {
  /** Estados de ferimento (lib/rpg/derived.ts). `short` e `effect` vazios = ileso. */
  wounds: {
    unhurt: { label: "ileso", short: "", effect: "", stabilize: "" },
    light: { label: "levemente ferido", short: "ferido", effect: "sem penalidade", stabilize: "DV10" },
    serious: { label: "gravemente ferido", short: "grave", effect: "−2 em todas as ações", stabilize: "DV13" },
    mortal: {
      label: "mortalmente ferido",
      short: "mortal",
      effect:
        "−4 em todas as ações, −6 de MOVE (mín. 1), teste de morte no início de cada turno. dano de ataque causa ferimento crítico e +1 na penalidade do teste de morte",
      stabilize: "DV15: volta a 1 HP e fica inconsciente por 1 minuto",
    },
  },

  /** Teste de morte (death save do livro). `bodyPart` já vem formatado ("BODY 8"). */
  deathSave: {
    name: "teste de morte",
    penalty: (n: number) => `penalidade +${n}`,
    text: (die: number, penalty: number, total: number, bodyPart: string, natural10: boolean) =>
      `1d10 ${die} + penalidade ${penalty} = ${total} contra ${bodyPart}${natural10 ? " · 10 natural sempre falha" : ""}`,
    lives: "vive",
    dies: "morre: falhou o teste de morte",
  },

  /** Resultado contra DVs (vsDvs em lib/rpg/dice.ts). */
  vsDv: {
    entry: (label: string, dv: number) => `${label} (DV${dv})`,
    pass: (list: string) => `passa: ${list}`,
    fail: (list: string) => `não passa: ${list}`,
  },

  /** "3 peças". */
  pieces: (n: number) => `${n} ${n === 1 ? "peça" : "peças"}`,

  vitals: {
    label: "sinais vitais",
    hp: "HP",
    spHead: "SP cabeça",
    spBody: "SP corpo",
    humanity: "hum",
  },

  stats: {
    title: "stats",
    base: (n: number) => `base ${n}`,
    initiative: "iniciativa:",
    perTurn: (m: number) => `(${m}m por turno)`,
    seriousBelow: "grave abaixo de",
  },

  skills: {
    title: "perícias",
    showAria: "mostrar perícias",
    fromRole: "do role",
    woundNote: (n: number) => `ferimento: ${n} em todo teste, já na rolagem.`,
    empty: "nenhuma perícia treinada ainda. veja todas ou edite as perícias.",
    rollAria: (name: string, base: number) => `rolar ${name}, base ${base}`,
    levelShort: (n: number) => `nv ${n}`,
    edit: "editar perícias",
    /** Cola o aviso dos bônus condicionais no fim do texto da rolagem. */
    hintsNote: (hints: string) => ` · ${hints}: some na mão se valer`,
  },

  ability: {
    title: "habilidade",
    full: "habilidade completa",
    netLine: (rank: number, actions: number) => `interface ${rank} · ${actions} ações de net por turno`,
    netrun: "netrun",
    modAria: (name: string) => `modificador de ${name}`,
    locked: (why: string) => `bloqueado: ${why}`,
  },

  cyber: {
    title: "cyberware",
    view: "ver cyberware",
    open: "abrir cyberware",
    none: "sem cyberware",
    on: (boost: number) => `ligado, +${boost} iniciativa`,
    off: "ligar",
  },

  pocket: {
    title: "bolso",
    gear: "equipamento",
    ammo: "munição:",
    items: "itens:",
    programs: "programas:",
    fashion: "roupas:",
    empty: "bolso vazio.",
    qty: (name: string, n: number) => `${name} ×${n}`,
  },

  dock: {
    label: "rolagem",
    history: (n: number) => `histórico (${n})`,
    closeAria: "fechar rolagem",
    crit: "crítico!",
    fumble: "falha crítica",
  },
} as const;
