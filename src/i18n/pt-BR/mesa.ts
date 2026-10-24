/** Mesa online: o mestre cria e passa o código, o jogador entra com uma ficha e vê o que está no ar. */
export const mesa = {
  unnamedGm: "mestre",
  unnamedPlayer: "jogador",
  /** Fora do modo cloud (dev sem .env). */
  needsCloud: "a mesa online precisa do supabase configurado (.env). sem ele, tudo fica neste navegador.",
  /** Jogador: o mestre encerrou a mesa ou tirou ele dela. */
  ended: "a mesa foi encerrada pelo mestre (ou você saiu dela).",
  code: "código",
  codeAria: "código da mesa",
  /** "mestre: fulano". */
  gmIs: (name: string) => `mestre: ${name}`,

  gm: {
    createTitle: "criar mesa online",
    createHint: "os jogadores entram pelo celular com o código que aparece aqui e no telão. o combate e a arquitetura que você mandar pro telão vão pro celular deles também.",
    namePlaceholder: "nome da mesa (ex.: night city, sessão 3)",
    nameAria: "nome da mesa",
    create: "criar mesa",
    creating: "criando",
    shareHint: "passe o código pros jogadores: eles abrem o app, entram como jogador, aba mesa.",
    openScreen: "abrir telão",
    end: "encerrar mesa",
    endConfirm: "encerrar a mesa? os jogadores saem dela (as fichas ficam com eles).",
    playersTitle: "jogadores",
    noPlayers: "ninguém entrou ainda.",
    noCharacter: "ainda sem ficha",
    /** Botão na linha do jogador: abre a ficha dele embaixo. */
    sheet: "ficha",
    sheetAria: (name: string) => `ver a ficha de ${name}`,
    kick: "tirar da mesa",
    kickAria: (name: string) => `tirar ${name} da mesa`,
    onAirTitle: "no ar pra mesa",
    onAirCombat: (active: boolean, n: number) =>
      active ? `combate rolando · ${n} na iniciativa` : n ? `combate montado, não iniciado · ${n}` : "sem combate",
    onAirNet: (name: string | null) => (name ? `net: ${name}` : "net: nada no telão"),
    onAirHint: "monte o combate na aba combate (as fichas dos jogadores aparecem lá) e a net nas abas netrunner e infra.",
  },

  player: {
    joinTitle: "entrar numa mesa",
    joinHint: "peça o código pro mestre.",
    codePlaceholder: "ABC123",
    characterLabel: "ficha que você leva",
    noCharacters: "crie uma ficha na aba personagens antes de entrar.",
    join: "entrar",
    joining: "entrando",
    leave: "sair da mesa",
    seatLabel: "sua ficha na mesa",
    yourTurn: "é a tua vez",
    /** Selo na carta/linha do personagem do jogador. */
    you: "você",
    waitingCombat: "combate montado. esperando o mestre começar.",
    nothingOnAir: "nada no ar ainda. quando o mestre começar um combate ou mandar uma net pro telão, aparece aqui.",
    combatTitle: "combate",
    fullscreen: "tela de combate",
    netTitle: "net",
    netFound: (n: number) => (n === 1 ? "1 andar descoberto" : `${n} andares descobertos`),
    netNothing: "nada descoberto ainda",
    /** Estado do PNJ sem número de HP. */
    npcState: "estado",
  },

  errors: {
    offline: "sem conexão com a nuvem.",
    notFound: "não achei mesa com esse código.",
    characterNotSaved: "essa ficha ainda não subiu pra nuvem. espere um pouco e tente de novo.",
    other: (detail: string) => `não deu: ${detail}`,
    publish: (detail: string) => `não foi pro ar: ${detail}`,
    patch: (detail: string) => `o dano não chegou na ficha do jogador: ${detail}`,
  },
} as const;
