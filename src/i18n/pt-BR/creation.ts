/** Criação de personagem: passos, role, lifepath, stats, kit inicial. */
export const creation = {
  /** Rótulo, título e dica de cada passo (lib/rpg/creation.ts monta CREATION_STEPS com isto). */
  steps: {
    method: { label: "método", title: "como criar", hint: "escolha o método de criação." },
    name: { label: "nome", title: "quem é você?", hint: "o nome e, se tiver, o apelido que a rua te deu." },
    role: { label: "role", title: "role", hint: (rank: number) => `a habilidade de role começa no rank ${rank}.` },
    lifepath: {
      label: "história",
      title: "história (lifepath)",
      hint: "de onde você veio e o que quer da vida. dá pra mudar tudo depois, na ficha.",
    },
    stats: {
      label: "stats",
      title: "stats",
      hint: "role 1d10 na tabela do teu role e leve a linha inteira. ou escolha uma linha.",
    },
    skills: {
      label: "perícias",
      title: "perícias",
      hint: "o streetrat já vem com as perícias do role e 4 níveis no idioma da sua origem. preencha o que pede especialização.",
    },
    gear: {
      label: "equipamento",
      title: "equipamento",
      hint: "o kit do role vem pronto: escolha onde o livro dá opção. e ainda sobram 500eb pra gastar agora ou guardar.",
    },
    cyberware: {
      label: "cyberware",
      title: "cyberware",
      hint: "o cyberware inicial do role, com a perda de humanidade fixa do livro. escolha onde tiver opção.",
    },
  },

  /** Métodos do livro (lib/rpg/creation.ts monta CREATION_METHODS com isto). Os nomes são os do livro. */
  methods: {
    streetrat: {
      name: "streetrat",
      summary: "o caminho rápido do livro: os stats saem de uma linha inteira da tabela do role.",
      upcoming: ["moradia e estilo de vida"],
    },
    edgerunner: {
      name: "edgerunner",
      summary: "1d10 pra cada stat na tabela do role, e perícias compradas com pontos.",
      upcoming: ["perícias por pontos", "armas e armadura", "equipamento", "cyberware"],
    },
    soon: "em breve",
    upcomingLine: (items: readonly string[]) => `depois: ${items.join(", ")}`,
  },

  /** Moldura do assistente (CreationWizard). Cancelar, voltar e próximo vêm de `common.actions`. */
  wizard: {
    stepsAria: "passos",
    nameLabel: "nome",
    handleLabel: "handle (opcional)",
    handlePlaceholder: "como te chamam na rua",
    create: "criar personagem",
    cyberNote:
      "depois da criação, a loja de cyberware fica na ficha, na aba cyberware (lá a perda de humanidade é rolada)",
  },

  /** Passo stats: tabela do role com 1d10. */
  statTemplate: {
    roll: "rolar 1d10",
    rolled: "1d10 →",
    tableOf: (role: string) => `tabela do ${role}`,
    diceHead: "1d10",
    pickRow: (n: number) => `escolher linha ${n}`,
    derived: "derivados:",
    hp: "HP",
    seriousBelow: "grave abaixo de",
    deathSave: "teste de morte",
    humanity: "humanidade",
    prompt: "role ou escolha uma linha pra continuar.",
  },

  /** Passo lifepath (e aba lore): tabelas, rolagem e texto livre. */
  lifepath: {
    confirmRollAll: "rolar tudo de novo? isso substitui a história atual.",
    hint: "cada tabela: role, escolha da lista ou escreva a sua.",
    rollAll: "rolar tudo",
    emptyOption: "-",
    custom: "outro (escrever)",
    freeTextAria: (label: string) => `${label} (texto livre)`,
    freeTextPlaceholder: "escreva o seu",
    rollCount: (label: string) => `rolar quantos (${label})`,
    countResult: (die: number) => `1d10 = ${die} →`,
    none: (item: string) => `nenhum ${item}.`,
    itemTitle: (item: string, n: number) => `${item} ${n}`,
    noteAria: (item: string, n: number, placeholder: string) => `${item} ${n}: ${placeholder}`,
  },

  /** Passo equipamento: kit do role e os 500eb. */
  kit: {
    weaponsArmor: "armas e armadura",
    outfit: "roupa e equipamento",
    sectionTitle: (title: string, role: string) => `${title} · ${role}`,
    pickGroupAria: "escolha uma opção",
    hint: "onde aparecem opções, escolha uma só. armas e munição ligadas andam juntas.",
    money: "eurobucks",
    moneyOf: "de",
    moneyHint: "gaste agora no night market ou guarde pra depois. não dá pra juntar dinheiro com outro jogador.",
    giveBack: "devolver",
  },
} as const;
