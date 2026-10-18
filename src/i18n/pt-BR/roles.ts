/**
 * Habilidade de role: tela da habilidade, limites e usos.
 * Os resumos, os parágrafos "como funciona" e as tabelas de cada role são conteúdo e moram em
 * src/lib/rpg/roles; aqui ficam os botões de uso (nome, fórmula, bloqueio e texto da rolagem).
 */
export const roles = {
  /** Tela da habilidade (RoleAbility). O rank usa `common.words.rank`. */
  ability: {
    title: "habilidade de role",
    howItWorks: "como funciona",
    netNote: "as ações de interface ficam na aba netrun.",
    rankDown: "diminuir rank",
    rankUp: "aumentar rank",
  },

  /** Habilidades com pontos (Solo, Tech, Medtech). */
  alloc: {
    left: (n: number) => `· sobram ${n}`,
    allSpent: "· tudo distribuído",
    take: (step: number, name: string) => `tirar ${step} de ${name}`,
    put: (step: number, name: string) => `pôr ${step} em ${name}`,
    capTitle: (rank: number, cap: number) => `teto no rank ${rank}: ${cap}`,
  },

  /** Listas com limite pelo rank (Nomad, Exec, Medtech). */
  list: {
    nothingYet: "nada liberado ainda.",
    swapType: "trocar tipo",
    itemAria: (title: string, n: number) => `${title} ${n}`,
    over: (n: number) => `acima do limite: remova ${n}.`,
  },

  /** Botão de uso (UseCard) e resultado. */
  use: {
    modifierAria: "modificador",
    locked: (why: string) => `bloqueado: ${why}`,
    crit: "crítico!",
    fumble: "falha crítica",
  },

  /** Tabelas por rank. */
  tier: {
    onlyNow: "só o que vale agora",
    all: "ver tudo",
    next: (from: number) => `próximo degrau: ${from}`,
  },

  rockerboy: {
    groups: {
      one: "1 pessoa (DV8)",
      six: "grupo de até 6 (DV10)",
      crowd: "multidão (DV12)",
    },
    makeFans: {
      name: "conquistar fãs",
      formula: "impacto + 1d10",
      desc: "fora de combate. não vale em quem te detesta de verdade.",
      ok: "viraram teus fãs",
      fail: (dv: number) => `não colou (precisava passar de ${dv})`,
    },
    favor: {
      name: "pedir favor a fãs",
      formula: "impacto + 1d10",
      desc: "o favor tem que caber na tabela do teu rank; se não couber, falha direto.",
      ok: "os fãs fazem o possível pelo favor",
      fail: (dv: number) =>
        `falhou (precisava passar de ${dv}): não dá pra pedir o mesmo favor a esses fãs por 1 semana`,
    },
  },

  tech: {
    jury: {
      name: "gambiarra",
      formula: "TECH + perícia do conserto + campo + 1d10",
      desc: "como ação, contra a DV do conserto normal: o item fica perfeito por um tempo.",
      cost: "1 ação",
      locked: "sem pontos em campo",
      result: (minutes: number) => `compare com a DV do conserto · se passar, dura ${minutes} minutos`,
    },
    craft: {
      formula: (name: string) => `TECH + perícia do conserto + ${name} + 1d10`,
      locked: (name: string) => `sem pontos em ${name}`,
      upgrade: {
        name: "melhoria",
        desc: "materiais da mesma categoria de preço do item, gastos na instalação.",
      },
      fabrication: {
        name: "fabricação",
        desc: "materiais de uma categoria de preço abaixo do item.",
      },
      invention: {
        name: "invenção",
        desc: "o mestre define a categoria de preço (no mínimo caro).",
      },
    },
  },

  medtech: {
    synthesize: {
      name: "sintetizar fármaco",
      formula: "TECH + tecnologia médica + 1d10 vs DV13",
      desc: "200eb de material rendem, em 1 hora, doses iguais ao nível em tecnologia médica. falhou: perde o material.",
      locked: "sem pontos em farmacêutica",
      ok: (doses: number) => `doses prontas (até ${doses})`,
      fail: "não saiu: perdeu o material (precisava passar de 13)",
    },
  },

  media: {
    publish: {
      name: "publicar matéria",
      formula: "1d10 ≤ chance",
      desc: "sorte não vale aqui. não dá pra republicar o mesmo assunto sem novidade.",
      proofs: {
        none: "sem provas",
        one: "1 prova fácil de entender (+1)",
        many: "mais de 4 provas concretas (+2)",
        both: "as duas coisas (+3)",
      },
      ok: (die: number, chance: number) => `o público comprou (${die} ≤ ${chance})`,
      fail: (die: number, chance: number) => `não colou (${die} > ${chance})`,
    },
    rumor: {
      name: "rumor passivo",
      formula: "credibilidade + 1d10",
      desc: "o mestre rola em segredo pelo menos 2× por semana.",
      arrives: (label: string, dv: number) => `chega um rumor ${label} (DV${dv})`,
      nothing: "nada chegou",
    },
    rumorActive: {
      name: "caçar rumor",
      formula: "stat + perícia + 1d10",
      desc: "procurando ativamente. o mestre diz a DV pelo detalhe do rumor.",
    },
  },

  lawman: {
    call: {
      name: "chamar reforço",
      formula: "1d10 ≤ rank, depois 1d6 rodadas",
      desc: "se ninguém atender, tenta de novo no próximo turno.",
      cost: "1 ação",
      nobody: (die: number, rank: number) => `ninguém atendeu (${die} > ${rank}). tenta de novo no próximo turno`,
      answered: (die: number, rank: number, rounds: number, who: string) =>
        `atenderam (${die} ≤ ${rank}): em ${rounds} rodadas (1d6) chegam ${who}`,
      twoGroups: (who: string) => `dois grupos de ${who}`,
      bumped: (who: string) => `${who} (tirou 6: veio o reforço de cima)`,
    },
  },

  fixer: {
    haggle: {
      name: "pechinchar",
      formula: "COOL + comércio + operador + 1d10",
      desc: "contra COOL + comércio + 1d10 do outro lado (+ operador, se for fixer).",
      /** `coolPart` já vem formatado ("COOL 7"). */
      result: (coolPart: string, skill: string, level: number, rank: number, deal: string) =>
        `${coolPart} + ${skill} ${level} + operador ${rank} + 1d10. ganhou: ${deal}`,
    },
  },

  netrunner: {
    formula: "interface + 1d10",
    cost: "1 ação de net",
    vsDv: "compare com a DV (ou a defesa) que o mestre der",
    zapHit: (damage: number) => `se acertar: ${damage} de dano (1d6)`,
    /** Ações de interface (os nomes do livro: Backdoor, Cloak, Control, Eye-Dee, Pathfinder, Scanner, Slide, Virus, Zap). */
    abilities: {
      backdoor: { name: "porta dos fundos", desc: "passa por senhas e outras barreiras da arquitetura" },
      cloak: { name: "camuflagem", desc: "esconde o que você fez na arquitetura antes de sair" },
      control: { name: "controle", desc: "controla o que está ligado à arquitetura" },
      eyedee: { name: "identificar", desc: "descobre o que é um dado encontrado e quanto ele vale" },
      pathfinder: { name: "mapear", desc: "descobre o mapa da arquitetura" },
      scanner: { name: "varredura", desc: "acha onde estão os sistemas numa área" },
      slide: { name: "fuga", desc: "escapa de um black ICE que está te seguindo" },
      virus: { name: "vírus", desc: "deixa um vírus customizado no núcleo da arquitetura" },
      zap: { name: "choque", desc: "ataque básico de netrunner, contra programas e contra outros netrunners" },
    },
  },
} as const;
