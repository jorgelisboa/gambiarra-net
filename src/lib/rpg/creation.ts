import { STARTING_RANK } from "./ability";

/** Passos de criação que já existem no app. */
export type CreationStepId = "name" | "role" | "lifepath";

export const CREATION_STEPS: Record<CreationStepId, { label: string; title: string; hint: string }> = {
  name: { label: "nome", title: "quem é você?", hint: "o nome e, se tiver, o handle que a rua te deu." },
  role: { label: "role", title: "role", hint: `a habilidade de role começa no rank ${STARTING_RANK}.` },
  lifepath: {
    label: "lore",
    title: "lifepath",
    hint: "de onde você veio e o que quer da vida. dá pra mudar tudo depois, na ficha.",
  },
};

export interface CreationMethod {
  id: string;
  name: string;
  summary: string;
  steps: CreationStepId[];
  /** Passos do livro que ainda não existem no app. */
  upcoming: string[];
}

/** Métodos de criação. O livro tem Streetrat, Edgerunner e Complete Package. */
export const CREATION_METHODS: CreationMethod[] = [
  {
    id: "streetrat",
    name: "streetrat / edgerunner",
    summary: "o caminho do livro, passo a passo.",
    steps: ["name", "role", "lifepath"],
    upcoming: ["stats", "stats derivados", "perícias", "armas e armadura", "equipamento", "cyberware"],
  },
];
