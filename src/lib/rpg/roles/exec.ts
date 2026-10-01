import type { RoleDef } from "../types";

export const teamSize = (rank: number) => (rank >= 9 ? 3 : rank >= 5 ? 2 : rank >= 3 ? 1 : 0);

export const exec: RoleDef = {
  role: "Exec",
  summary:
    "Executivo júnior subindo na Corp. Tem equipe, casa e roupa pagas pela empresa, e inimigos lá dentro.",
  ability: {
    name: "Teamwork",
    namePt: "trabalho em equipe",
    summary:
      "A Corp te dá equipe, moradia, roupa e plano de saúde conforme o rank. Cada membro tem um cargo visível e uma função oculta.",
    lists: [
      {
        id: "team",
        title: "equipe",
        max: teamSize,
        placeholder: "cargo visível / função oculta (ex.: motorista / netrunner)",
      },
    ],
    tables: [
      {
        title: "benefícios (acumulam)",
        cumulative: true,
        tiers: [
          { from: 1, to: 1, lines: ["roupa: terno Neo-Militarist completo"] },
          { from: 2, to: 2, lines: ["casa: conapt corporativo, sem aluguel"] },
          { from: 3, to: 3, lines: ["equipe: 1º membro"] },
          { from: 5, to: 5, lines: ["equipe: 2º membro"] },
          { from: 6, to: 6, lines: ["saúde: Trauma Team Silver"] },
          { from: 7, to: 7, lines: ["casa: Beaverville House, na zona executiva"] },
          { from: 8, to: 8, lines: ["saúde: Trauma Team Platinum"] },
          { from: 9, to: 9, lines: ["equipe: 3º membro (máximo)"] },
          { from: 10, to: 10, lines: ["casa: McMansion em Beaverville ou cobertura de luxo"] },
        ],
      },
    ],
    notes: [
      "lealdade: ao dar uma tarefa, o mestre rola 1d6 contra a lealdade do membro. falhou: recusa, faz mal feito ou te trai.",
      "lealdade 0 ou menos: o membro te trai ativamente.",
    ],
  },
};
