import { check, d6 } from "../dice";
import type { RoleDef, UseDef } from "../types";

export const netActionsFor = (rank: number) =>
  rank >= 10 ? 5 : rank >= 7 ? 4 : rank >= 4 ? 3 : 2;

const INTERFACE: [id: string, name: string, desc: string][] = [
  ["backdoor", "Backdoor", "passa por senhas e outras barreiras da arquitetura"],
  ["cloak", "Cloak", "esconde o que você fez na arquitetura antes de sair"],
  ["control", "Control", "controla o que está ligado à arquitetura"],
  ["eyedee", "Eye-Dee", "descobre o que é um dado encontrado e quanto ele vale"],
  ["pathfinder", "Pathfinder", "descobre o mapa da arquitetura"],
  ["scanner", "Scanner", "acha onde estão os sistemas numa área"],
  ["slide", "Slide", "escapa de um Black ICE que está te seguindo"],
  ["virus", "Virus", "deixa um vírus customizado no núcleo da arquitetura"],
  ["zap", "Zap", "ataque básico de netrunner, contra programas e contra outros netrunners"],
];

const uses: UseDef[] = INTERFACE.map(([id, name, desc]) => ({
  id,
  name,
  formula: "interface + 1d10",
  desc,
  cost: "1 ação de net",
  roll: ({ rank }) => {
    const r = check(rank);
    if (id !== "zap") return { ...r, text: "compare com a DV (ou a defesa) que o mestre der" };
    return { ...r, text: `se acertar: ${d6()} de dano (1d6)` };
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
