/** Lista de personagens, abas da ficha, opções e o painel do grupo. */
export const characters = {
  /** Nome de partida de um personagem novo (src/lib/rules.ts). */
  defaultName: "Novo Edgerunner",

  /** Coluna da esquerda (no celular, uma linha só com select e botão). */
  list: {
    selectAria: "personagem",
    newShort: "novo",
    new: "novo personagem",
    empty: "nenhum personagem ainda.",
    option: (name: string, role: string) => `${name} · ${role}`,
    roleRank: (role: string, rank: number) => `${role} · rank ${rank}`,
    session: "sessão",
    pickOrCreate: "selecione ou crie um personagem.",
  },

  /** Abas da ficha. */
  tabs: {
    aria: "ficha",
    sheet: "ficha",
    stats: "stats",
    skills: "perícias",
    gear: "equipamento",
    cyber: "cyberware",
    ability: "habilidade",
    net: "netrun",
    lore: "história",
    notes: "notas",
  },

  /** Campos da aba notas. */
  notes: {
    alias: "apelido / handle",
    age: "idade",
    goal: "objetivo",
    appearance: "aparência",
    personality: "personalidade",
    history: "história",
    extra: "anotações",
  },

  /** Cabeçalho da ficha e o que fica atrás de "opções". */
  editor: {
    nameAria: "nome",
    options: "opções",
    inSessionTag: "· na sessão",
    roleAria: "role",
    useInSession: "usar na sessão",
    inSession: "na sessão",
    delete: "apagar",
    confirmDelete: (name: string) => `apagar ${name}?`,
  },

  /** Aba stats: os 10 stats, HP e humanidade. */
  stats: {
    empDroppedTitle: "EMP caiu com a humanidade",
    inUse: (emp: number) => `em uso ${emp}`,
    armorTitle: "penalidade da armadura vestida",
    withArmor: (n: number) => `com armadura ${n}`,
    cyberTitle: "cyberware",
    withCyber: (n: number) => `com cyberware ${n}`,
    hp: "HP",
    humanity: "humanidade",
    seriousDeath: (serious: number, death: number) => `grave abaixo de ${serious} · teste de morte ${death}`,
    stabilize: (dv: string) => ` · estabilizar ${dv}`,
    deathPenalty: (n: number) => `penalidade de teste de morte +${n}`,
    resetPenalty: "zerar",
    empInUse: "EMP em uso",
    cyberCap: (cap: number) => `teto com o cyberware ${cap}`,
    empDrops: "o EMP cai 1 a cada dezena de humanidade perdida.",
  },

  /** Equipe do Exec (TeamPanel): contratar, HP, perícias e lealdade. */
  team: {
    title: "equipe",
    firstAtRank: "o 1º membro chega no rank 3.",
    overLimit: (n: number) => `acima do limite do rank: dispense ${n}.`,
    classAria: "classe",
    namePlaceholder: "nome (opcional)",
    memberNameAria: "nome do membro",
    hire: "contratar (1d6 nas stats)",
    job: (job: string) => `função: ${job}.`,
    legacyTitle: "anotações antigas da equipe:",
    deleteNoteAria: "apagar anotação",
    newHire: "novo contratado",
    realJob: (job: string) => `de verdade: ${job}`,
    dismiss: "dispensar",
    confirmDismiss: "dispensar esse membro?",
    cover: "fachada",
    row: "linha",
    rowTitle: "linha do 1d6 na tabela da classe",
    hp: "HP",
    hpDownAria: "−1 HP",
    hpUpAria: "+1 HP",
    deathSave: (body: number) => `teste de morte ${body}`,
    cyberware: "cyberware:",
    gear: "equipamento:",
    loyalty: "lealdade",
    loyaltyDownAria: "−1 lealdade",
    loyaltyUpAria: "+1 lealdade",
    loyaltyTest: "teste (1d6)",
    loyaltyPass: (d: number, loyalty: number) => `teste de lealdade: ${d} < ${loyalty}, cumpre a tarefa`,
    loyaltyFail: (d: number, loyalty: number) =>
      `teste de lealdade: ${d} não é menor que ${loyalty}: recusa, faz mal feito ou se vira contra você`,
    endSession: "fim da sessão",
    endSessionTitle: (cap: number) => `fim da sessão: lealdade volta pro máximo de ${cap}`,
    endSessionBelowZero: "terminou a sessão abaixo de 0: reclama no RH e é transferido ou se demite",
    endSessionResult: (loyalty: number) => `fim da sessão: lealdade ${loyalty}`,
    eventAria: "o que aconteceu",
    eventOption: (signed: string, label: string) => `${signed} · ${label}`,
    apply: "aplicar",
    betrayal: "lealdade 0 ou menos: tenta te trair pros teus inimigos.",
    noMoney: "sem grana",
    replace: (fee: string) => `substituto do RH (−${fee})`,
    confirmReplace: (fee: string) => `perdeu esse membro? o RH manda outro com lealdade 1 por ${fee}.`,
    /** Perícias da equipe que não são uma perícia comum do livro. */
    specialSkills: {
      interface: "interface",
      language: "idioma (streetslang)",
      localExpert: "especialista local (sua casa)",
    },
  },
} as const;
