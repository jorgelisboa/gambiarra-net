import { check, d6 } from "../dice";
import type { RoleDef, UseDef } from "../types";

export const netActionsFor = (rank: number) =>
  rank >= 10 ? 5 : rank >= 7 ? 4 : rank >= 4 ? 3 : 2;

const INTERFACE: [id: string, name: string, desc: string][] = [
  ["backdoor", "Backdoor", "quebra senhas e portas da arquitetura"],
  ["cloak", "Cloak", "apaga teus rastros antes de sair"],
  ["control", "Control", "controla o que está ligado à arquitetura: câmeras, torretas, portas"],
  ["eyedee", "Eye-Dee", "identifica um dado achado e quanto ele vale"],
  ["pathfinder", "Pathfinder", "revela o mapa da arquitetura"],
  ["scanner", "Scanner", "acha pontos de acesso na área"],
  ["slide", "Slide", "foge de um Black ICE que está te seguindo"],
  ["virus", "Virus", "planta um vírus no fundo da arquitetura"],
  ["zap", "Zap", "ataque básico contra programas e netrunners"],
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
