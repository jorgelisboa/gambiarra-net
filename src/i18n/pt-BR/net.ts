/** "1 andar", "3 andares". */
const floorsOf = (n: number) => (n === 1 ? "1 andar" : `${n} andares`);

/**
 * Net: a arquitetura (aba netrunner do mestre, telão), o cyberdeck e a aba netrun da ficha do Netrunner.
 * Os nomes das ações de interface vêm de t.roles.netrunner.abilities (quem monta o texto passa o nome).
 */
export const net = {
  /** "DV8". */
  dv: (n: number) => `DV${n}`,
  /** Nome de uma arquitetura nova quando o mestre não escreve um. */
  defaultName: "arquitetura",

  /** Tipos de andar. `tag` é o código em caixa alta do cabeçalho do nó ("F03 · CONTROL"): visual de terminal, fica como no design. */
  floorKinds: {
    password: { label: "senha", tag: "SENHA" },
    file: { label: "arquivo", tag: "ARQUIVO" },
    control: { label: "nó de controle", tag: "CONTROLE" },
    ice: { label: "black ICE", tag: "BLACK ICE" },
  },
  /** O que resolve o andar: uma ação de interface contra a DV, ou o ICE atacando. */
  against: {
    action: (name: string) => `${name} contra a DV`,
    ice: "ataca quem chega no andar",
  },

  /** Dificuldade da arquitetura (a DV padrão dos andares). */
  difficulties: { basic: "básica", standard: "padrão", uncommon: "incomum", advanced: "avançada" },

  /** O desenho da arquitetura (console do mestre e telão). */
  map: {
    /** Marca nos dois primeiros andares da régua. */
    lobby: "lobby",
    /** Etiqueta no andar onde o netrunner está. */
    runner: "◆ netrunner",
    /** Cabeçalho do nó: "F03 · CONTROL". */
    header: (depth: number, tag: string) => `F${String(depth).padStart(2, "0")} · ${tag}`,
    floorAria: (depth: number, kind: string, label: string) => `andar ${depth}: ${kind}${label ? `, ${label}` : ""}`,
  },

  /** Aba netrunner do mestre: lista e construtor de arquiteturas. */
  builder: {
    list: {
      heading: "arquiteturas",
      onAir: "no ar",
      summary: (floors: number, difficulty: string) => `${floorsOf(floors)} · ${difficulty}`,
    },
    empty: {
      title: "nenhuma arquitetura",
      help: "crie uma ao lado e monte andar por andar: senhas, arquivos, nós de controle e black ICE. o tronco desce do andar 1; um andar com mais de um filho abre um galho. o telão mostra só o que você revelar.",
      rule: "no livro, uma arquitetura tem de 3 a 18 andares (3d6), e os 2 primeiros são o lobby.",
    },
    create: {
      title: "nova arquitetura",
      namePlaceholder: "arasaka · torre 3",
    },
    nameAria: "nome da arquitetura",
    difficultyAria: "dificuldade",
    difficultyOption: (label: string, dv: number) => `${label} · DV${dv}`,
    editor: {
      counts: (floors: number, revealed: number) =>
        `${floorsOf(floors)} · ${revealed === 1 ? "1 revelado" : `${revealed} revelados`}`,
      showOnScreen: "mandar pro telão",
      hideFromScreen: "tirar do telão",
      showOnScreenTitle: "o telão mostra só os andares revelados",
      openScreen: "abrir telão",
      openScreenTitle: "abre /tela numa janela: arraste pra TV e aperte F11",
      revealAll: "revelar tudo",
      hideAll: "esconder tudo",
      runnerLeft: "netrunner saiu",
      deleteArchitecture: "apagar arquitetura",
      confirmDelete: (name: string) => `apagar a arquitetura "${name}"?`,
      firstFloor: "+ andar 1",
      pickFloor: "clique num andar pra editar.",
      legend:
        "tracejado = oculto da mesa. revelar um andar revela o caminho até ele; esconder leva junto o que está abaixo. pôr o netrunner num andar já revela.",
    },
    /** Painel de edição do andar selecionado. */
    floor: {
      title: "andar",
      revealed: "revelado",
      hidden: "oculto",
      contents: "o que tem",
      dv: "DV",
      dvAria: "DV do andar",
      iceOrDemon: "black ICE ou demon",
      blackIce: "black ICE",
      demon: "demon",
      screenName: "nome no telão",
      /** Exemplo no campo do nome, por tipo de andar. */
      screenNameHint: { password: "", file: "folha de pagamento", control: "câmeras do saguão", ice: "" },
      masterNote: "nota do mestre",
      masterNoteHint: "só você vê",
      hide: "esconder",
      reveal: "revelar",
      runnerHere: "netrunner aqui",
      addBranch: "+ galho",
      addBelow: "+ andar abaixo",
      branchTitle: "esse andar já tem filho: o novo abre um galho",
      /** `below`: quantos andares caem junto. */
      remove: (below: number) => `apagar${below > 0 ? ` (+${below})` : ""}`,
      confirmRemove: (depth: number, below: number) => `apagar o andar ${depth} e os ${below} abaixo dele?`,
    },
  },

  /** Trocar de deck custa uma ação no mundo real. */
  switchDeckCost: "1 ação de carne",

  /** O que precisa pra fazer netrun (pág. 196). */
  needs: {
    deck: { label: "cyberdeck conectado", missing: "conecte um deck abaixo" },
    plugs: {
      label: "link neural + plugues de interface",
      ok: "link neural e plugues de interface instalados",
      /** `what`: o que falta, ex. "falta link neural". */
      missing: (what: string) => `${what}: instale na aba cyberware`,
      noLinkNoPlugs: "falta link neural e plugues de interface",
      noLink: "falta link neural",
      noPlugs: "falta plugues de interface (no link neural)",
    },
    goggles: {
      label: "óculos de virtualidade",
      withGoggles: "você vê o ICE por cima do mundo real e continua andando nele",
      withCybereyes: "virtualidade nos olhos cibernéticos: o ICE aparece por cima do mundo real",
      without:
        "sem óculos na ficha: precisa deles ou de olhos cibernéticos com virtualidade, senão entra do jeito antigo e fica cego pro mundo real",
    },
  },

  /** Aba netrun da ficha do Netrunner. */
  sheet: {
    interface: "interface",
    netActionsPerTurn: "ações de net por turno",
    needsTitle: "pra fazer netrun",
    decksTitle: "cyberdecks",
    noDeck: "sem cyberdeck. compre um na aba equipamento.",
    oneDeckAtATime: (cost: string) =>
      `só dá pra estar ligado a um deck por vez. trocar de deck gasta ${cost} (no mundo real).`,
    looseSoftware: (names: string) => `programas sem deck: ${names}.`,
    actionsTitle: "ações de net · interface + 1d10",
    connected: "conectado",
    connect: "conectar",
    slots: "slots",
    uninstall: "tirar",
    install: "instalar:",
    deckFull: "deck cheio",
    deckTable: {
      title: "tipos de cyberdeck",
      note: "programas e hardware dividem os mesmos slots: o que separa um deck bom de um barato é quantos slots ele tem.",
      price: (eb: string, category: string) => `${eb} (${category})`,
      slots: (n: number) => `${n} slots`,
    },
  },
} as const;
