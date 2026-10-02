import { STARTING_RANK } from "./ability";

/** Passos de criação que já existem no app. */
export type CreationStepId = "name" | "role" | "lifepath" | "stats" | "skills" | "gear";

export const CREATION_STEPS: Record<CreationStepId, { label: string; title: string; hint: string }> = {
  name: { label: "nome", title: "quem é você?", hint: "o nome e, se tiver, o handle que a rua te deu." },
  role: { label: "role", title: "role", hint: `a habilidade de role começa no rank ${STARTING_RANK}.` },
  lifepath: {
    label: "lore",
    title: "lifepath",
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
};

export interface CreationMethod {
  id: string;
  name: string;
  summary: string;
  steps: CreationStepId[];
  /** Passos do livro que ainda não existem no app. */
  upcoming: string[];
  /** Aparece na lista, mas ainda não dá pra escolher. */
  soon?: boolean;
}

/** Métodos de criação. O livro tem Streetrat, Edgerunner e Complete Package. */
export const CREATION_METHODS: CreationMethod[] = [
  {
    id: "streetrat",
    name: "streetrat",
    summary: "o caminho rápido do livro: os stats saem de uma linha inteira da tabela do role.",
    steps: ["name", "role", "lifepath", "stats", "skills", "gear"],
    upcoming: ["moradia e estilo de vida", "cyberware"],
  },
  {
    id: "edgerunner",
    name: "edgerunner",
    summary: "1d10 pra cada stat na tabela do role, e perícias compradas com pontos.",
    steps: ["name", "role", "lifepath", "stats"],
    upcoming: ["perícias por pontos", "armas e armadura", "equipamento", "cyberware"],
    soon: true,
  },
];
