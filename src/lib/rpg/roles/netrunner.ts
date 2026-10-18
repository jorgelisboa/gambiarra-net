import { t } from "../../../i18n";
import { check, d6 } from "../dice";
import type { RoleDef, UseDef } from "../types";

export const netActionsFor = (rank: number) =>
  rank >= 10 ? 5 : rank >= 7 ? 4 : rank >= 4 ? 3 : 2;

const N = t.roles.netrunner;

/** Ações de interface do livro, na ordem da tabela. */
const INTERFACE = ["backdoor", "cloak", "control", "eyedee", "pathfinder", "scanner", "slide", "virus", "zap"] as const;

const uses: UseDef[] = INTERFACE.map((id) => ({
  id,
  name: N.abilities[id].name,
  formula: N.formula,
  desc: N.abilities[id].desc,
  cost: N.cost,
  roll: ({ rank }) => {
    const r = check(rank);
    if (id !== "zap") return { ...r, text: N.vsDv };
    return { ...r, text: N.zapHit(d6()) };
  },
}));

export const netrunner: RoleDef = {
  role: "Netrunner",
  summary:
    "Hacker que pluga o cérebro na NET, no local, porque a NET antiga caiu. Abre sistemas, rouba dados e briga com ICE.",
  ability: {
    name: "Interface",
    namePt: "interface",
    summary:
      "Define quantas ações de net você tem por turno e é a base de todas as habilidades de netrun.",
    about: [
      "A interface deixa o netrunner fazer netrun, define quantas ações de net ele tem no turno e dá acesso às habilidades de interface (abaixo).",
      "As ações de interface ficam na aba netrun da ficha, junto com o cyberdeck. Arquiteturas, andares e ICE chegam com o resto do capítulo da net.",
    ],
    tables: [
      {
        title: "ações de net por turno",
        tiers: [
          { from: 1, to: 3, lines: ["ações de net: 2"] },
          { from: 4, to: 6, lines: ["ações de net: 3"] },
          { from: 7, to: 9, lines: ["ações de net: 4"] },
          { from: 10, to: 10, lines: ["ações de net: 5"] },
        ],
      },
    ],
    passives: (rank) => {
      const next = [4, 7, 10].find((r) => r > rank);
      return [
        `${netActionsFor(rank)} ações de net por turno`,
        ...(next ? [`rank ${next}: ${netActionsFor(next)} ações`] : []),
      ];
    },
    uses,
    netActions: netActionsFor,
  },
};
