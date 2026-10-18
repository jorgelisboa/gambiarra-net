import type { StatKey } from "../../lib/types";

/** Stats: a sigla fica a do livro; o nome por extenso é o nosso. */
export const stats = {
  short: {
    INT: "INT",
    REF: "REF",
    DEX: "DEX",
    TECH: "TECH",
    COOL: "COOL",
    WILL: "WILL",
    LUCK: "LUCK",
    MOVE: "MOVE",
    BODY: "BODY",
    EMP: "EMP",
  } satisfies Record<StatKey, string>,
  long: {
    INT: "inteligência",
    REF: "reflexos",
    DEX: "destreza",
    TECH: "técnica",
    COOL: "frieza",
    WILL: "vontade",
    LUCK: "sorte",
    MOVE: "movimento",
    BODY: "corpo",
    EMP: "empatia",
  } satisfies Record<StatKey, string>,
  /** Parte de uma conta: "REF 8". */
  part: (k: StatKey, v: number) => `${k} ${v}`,
} as const;
