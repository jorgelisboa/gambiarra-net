/** Moldura do app: cabeçalho, navegação entre abas, foto, sprites e avisos gerais. */
export const shell = {
  meta: {
    title: "Gambiarra.net",
    description: "VTT não oficial pra Cyberpunk RED: fichas, iniciativa e netrunning.",
  },
  connecting: "conectando",
  nav: {
    aria: "seções",
    tabs: { net: "netrunner", infra: "infra", combat: "combate", chars: "personagens" },
  },
  logout: "sair",
  /** Selo no cabeçalho quando a nuvem não sincroniza; o tooltip diz o motivo. */
  offline: "sem conexão",
  syncFailed: (detail: string) => `não sincronizou: ${detail}`,
  /** Foto do personagem (PhotoPicker e src/lib/photo.ts). */
  photo: {
    dropHint: "clique ou solte uma imagem aqui",
    sending: "enviando",
    change: "trocar",
    add: "pôr foto",
    remove: "tirar",
    tooBig: (maxMb: number) => `imagem grande demais (máx. ${maxMb} MB).`,
    unreadable: "não deu pra ler essa imagem. use png, jpg ou webp.",
    uploadFailed: (detail: string) => `a foto não subiu: ${detail}`,
  },
} as const;
