/** Palavras e ações que aparecem em vários setores. */
export const common = {
  actions: {
    save: "salvar",
    cancel: "cancelar",
    close: "fechar",
    remove: "remover",
    edit: "editar",
    create: "criar",
    next: "próximo",
    back: "voltar",
    confirm: "confirmar",
    roll: "rolar",
    buy: "comprar",
    add: "adicionar",
    clear: "limpar",
  },
  words: {
    yes: "sim",
    no: "não",
    or: "ou",
    none: "nenhum",
    empty: "vazio",
    loading: "carregando…",
    attack: "ataque",
    damage: "dano",
    total: "total",
    level: "nível",
    rank: "rank",
    penalty: "penalidade",
  },
  /** Separador de partes numa linha ("ataque 14 · dano 3d6"). */
  sep: " · ",
  /** Eurobucks. */
  eb: (n: number) => `${n.toLocaleString("pt-BR")}eb`,
  /** "+3" / "−2" (sinal de menos de verdade). */
  signed: (n: number) => (n < 0 ? `−${Math.abs(n)}` : `+${n}`),
  /** Rótulo de acessibilidade: "remover {coisa}", "rolar {coisa}". */
  aria: {
    remove: (what: string) => `remover ${what}`,
    roll: (what: string) => `rolar ${what}`,
    edit: (what: string) => `editar ${what}`,
  },
} as const;
