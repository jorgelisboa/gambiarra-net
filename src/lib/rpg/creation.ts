import { t } from "../../i18n";
import { STARTING_RANK } from "./ability";

/** Passos de criação que já existem no app. */
export type CreationStepId = "name" | "role" | "lifepath" | "stats" | "skills" | "gear" | "cyberware";

const STEPS = t.creation.steps;

export const CREATION_STEPS: Record<CreationStepId, { label: string; title: string; hint: string }> = {
  name: STEPS.name,
  role: { ...STEPS.role, hint: STEPS.role.hint(STARTING_RANK) },
  lifepath: STEPS.lifepath,
  stats: STEPS.stats,
  skills: STEPS.skills,
  gear: STEPS.gear,
  cyberware: STEPS.cyberware,
};

export interface CreationMethod {
  id: string;
  name: string;
  summary: string;
  steps: CreationStepId[];
  /** Passos do livro que ainda não existem no app. */
  upcoming: readonly string[];
  /** Aparece na lista, mas ainda não dá pra escolher. */
  soon?: boolean;
}

const METHODS = t.creation.methods;

/** Métodos de criação. O livro tem Streetrat, Edgerunner e Complete Package. */
export const CREATION_METHODS: CreationMethod[] = [
  {
    id: "streetrat",
    name: METHODS.streetrat.name,
    summary: METHODS.streetrat.summary,
    steps: ["name", "role", "lifepath", "stats", "skills", "gear", "cyberware"],
    upcoming: METHODS.streetrat.upcoming,
  },
  {
    id: "edgerunner",
    name: METHODS.edgerunner.name,
    summary: METHODS.edgerunner.summary,
    steps: ["name", "role", "lifepath", "stats"],
    upcoming: METHODS.edgerunner.upcoming,
    soon: true,
  },
];
