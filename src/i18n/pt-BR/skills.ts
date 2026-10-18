/** Perícias: aba de perícias, categorias e rolagem. */
export const skills = {
  /** Nome e resumo das 9 categorias do livro (lib/rpg/skills.ts guarda o id e o nome do livro). */
  categories: {
    awareness: { name: "atenção", summary: "perceber o ambiente e notar pistas." },
    body: { name: "corpo", summary: "tarefas físicas, força e resistência." },
    control: { name: "controle", summary: "pilotar veículos e montar animais." },
    education: { name: "educação", summary: "conhecimento de estudo formal." },
    fighting: { name: "luta", summary: "briga e combate com arma branca." },
    performance: { name: "performance", summary: "atuação, música e artes de palco." },
    ranged: { name: "armas à distância", summary: "armas de fogo, arco e afins." },
    social: { name: "social", summary: "se misturar, ter estilo e convencer os outros." },
    technique: { name: "técnica", summary: "ofícios aprendidos na prática." },
  },

  filter: { aria: "mostrar", trained: "treinadas", all: "todas" },
  search: "buscar perícia",
  template: (role: string) => `modelo ${role}`,
  confirmTemplate: (role: string) => `trocar as perícias pelo modelo streetrat do ${role}?`,
  /** Legenda: "negrito" sai em destaque, o resto em cinza. */
  legend: { bold: "negrito", rest: " = básica · x2 = custa o dobro · base = stat + nível" },
  woundAll: (n: number) => `ferimento: ${n} em todo teste`,

  roleBlock: {
    title: "do role",
    note: "só existem pela habilidade de role; o nível vem dela.",
  },
  levelLabel: "nível",
  empty: "nenhuma perícia ainda.",
  fillTemplate: (role: string) => `preencher com o streetrat do ${role}`,
  notFound: "nada encontrado.",

  row: {
    x2Title: "custa o dobro pra comprar",
    levelAria: (name: string) => `nível de ${name}`,
    down: (name: string) => `diminuir ${name}`,
    up: (name: string) => `aumentar ${name}`,
    specAria: (name: string, spec: string) => `${name}: ${spec}`,
    add: (name: string, spec: string) => `+ ${name} (${spec})`,
    bonusTitle: (source: string, value: number) => `${source} +${value}`,
    baseTitle: (statPart: string, level: number, extras: string[]) =>
      `base: ${[statPart, level, ...extras].join(" + ")}`,
  },

  /** Texto da rolagem: "pistola: REF 8 + perícia 6 + 1d10". */
  roll: {
    level: (n: number) => `perícia ${n}`,
    wound: (n: number) => `ferimento ${n}`,
    bonus: (source: string, value: number) => `${source} ${value}`,
    line: (name: string, parts: string[]) => `${name}: ${parts.join(" + ")} + 1d10`,
  },

  /** Bônus que só vale em parte dos testes: "+2 se envolver visão (campo)". */
  bonusHint: (value: number, when: string, source: string) => `+${value} se ${when} (${source})`,
} as const;
