import { pointsIn } from "../ability";
import type { RoleDef } from "../types";

export const solo: RoleDef = {
  role: "Solo",
  summary:
    "Guarda-costas, mercenário ou ex-soldado corporativo. Troca carne por cromo pra continuar sendo o melhor.",
  ability: {
    name: "Combat Awareness",
    namePt: "consciência de combate",
    summary: "Divide pontos iguais ao rank entre bônus de combate.",
    notes: [
      "redistribuir: fora de combate, no início do combate (antes da iniciativa) ou com 1 ação.",
      "a reação de iniciativa já entra na rolagem de iniciativa da aba combate.",
    ],
    alloc: {
      title: "pontos de combate",
      budget: (rank) => rank,
      options: [
        {
          id: "deflection",
          name: "desvio de dano",
          rule: "a cada 2 pts, −1 no primeiro dano que passar da armadura no round",
          step: 2,
          max: 10,
          effect: (p) => `−${p / 2} no 1º dano`,
        },
        {
          id: "fumble",
          name: "recuperar falha",
          rule: "4 pts: ignora falha crítica (1) ao atacar",
          step: 4,
          max: 4,
          effect: () => "ignora falha crítica",
        },
        {
          id: "initiative",
          name: "reação de iniciativa",
          rule: "+1 na iniciativa por ponto",
          effect: (p) => `+${p} iniciativa`,
        },
        {
          id: "precision",
          name: "ataque preciso",
          rule: "a cada 3 pts, +1 nos ataques",
          step: 3,
          max: 9,
          effect: (p) => `+${p / 3} ataque`,
        },
        {
          id: "weakness",
          name: "ponto fraco",
          rule: "+1 de dano (antes da armadura) no 1º acerto do round, por ponto",
          effect: (p) => `+${p} dano no 1º acerto`,
        },
        {
          id: "threat",
          name: "detectar ameaça",
          rule: "+1 em percepção por ponto",
          effect: (p) => `+${p} percepção`,
        },
      ],
    },
    initiative: (_rank, state) => pointsIn(state, "initiative"),
  },
};
